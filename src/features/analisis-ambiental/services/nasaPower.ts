import type {
  ConsultaHistoricaAmbiental,
  PuntoSerieAmbiental,
  ResultadoProveedorAmbiental,
  SerieAmbiental,
  UnidadAmbiental,
  VariableAmbiental,
} from '../../../types/ambiental';
import { calcularEstadisticas } from './estadisticas';
import { validarConsultaHistorica } from './validacionConsulta';

const API = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const TIMEOUT_MS = 30_000;

const parametros = [
  { codigo: 'T2M', variable: 'temperatura', unidad: '°C' },
  { codigo: 'PRECTOTCORR', variable: 'precipitacion', unidad: 'mm/día' },
  { codigo: 'ALLSKY_SFC_SW_DWN', variable: 'radiacion-solar', unidad: 'MJ/m²/día' },
  { codigo: 'RH2M', variable: 'humedad-relativa', unidad: '%' },
] as const satisfies ReadonlyArray<{
  codigo: string;
  variable: VariableAmbiental;
  unidad: UnidadAmbiental;
}>;

type Objeto = Record<string, unknown>;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function convertirFecha(fecha: string): string | null {
  if (!/^\d{8}$/.test(fecha)) return null;
  const resultado = `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`;
  const fechaUtc = new Date(`${resultado}T00:00:00Z`);
  return Number.isNaN(fechaUtc.valueOf()) || fechaUtc.toISOString().slice(0, 10) !== resultado
    ? null
    : resultado;
}

function convertirPuntos(datos: unknown): PuntoSerieAmbiental[] {
  if (!esObjeto(datos)) return [];

  return Object.entries(datos).flatMap(([fechaBruta, valorBruto]) => {
    const fecha = convertirFecha(fechaBruta);
    if (!fecha) return [];
    const valor = typeof valorBruto === 'number' && Number.isFinite(valorBruto) && valorBruto !== -999
      ? valorBruto
      : null;
    return [{ fecha, valor }];
  }).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function crearSerie(
  codigo: string,
  datos: unknown,
  consulta: ConsultaHistoricaAmbiental,
): SerieAmbiental {
  const parametro = parametros.find((item) => item.codigo === codigo);
  if (!parametro) throw new Error(`Parámetro NASA POWER no reconocido: ${codigo}.`);

  const puntos = convertirPuntos(datos);
  return {
    variable: parametro.variable,
    unidad: parametro.unidad,
    frecuencia: 'diaria',
    tipoDato: 'historico',
    referenciaTemporal: 'UTC',
    periodo: { inicio: consulta.inicio, fin: consulta.fin },
    puntos,
    estadisticas: calcularEstadisticas(puntos),
    procedencia: {
      proveedor: 'nasa-power',
      conjuntoDatos: codigo,
      atribucion: 'NASA POWER',
    },
  };
}

export async function consultarHistoricoNasaPower(
  consulta: ConsultaHistoricaAmbiental,
  signal?: AbortSignal,
): Promise<ResultadoProveedorAmbiental> {
  validarConsultaHistorica(consulta);

  const url = new URL(API);
  url.search = new URLSearchParams({
    parameters: parametros.map(({ codigo }) => codigo).join(','),
    community: 'AG',
    longitude: String(consulta.ubicacion.longitud),
    latitude: String(consulta.ubicacion.latitud),
    start: consulta.inicio.replaceAll('-', ''),
    end: consulta.fin.replaceAll('-', ''),
    format: 'JSON',
    'time-standard': 'UTC',
  }).toString();

  const respuesta = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
    credentials: 'omit',
  });
  const textoCuerpo = await respuesta.text();
  let cuerpo: unknown = textoCuerpo;
  let jsonValido = false;
  try {
    cuerpo = JSON.parse(textoCuerpo);
    jsonValido = true;
  } catch {
    // Se conserva el texto exacto si el proveedor no devuelve JSON válido.
  }
  const respuestaCruda = {
    url: url.toString(),
    estadoHttp: respuesta.status,
    tipoContenido: respuesta.headers.get('content-type'),
    recibidaEn: new Date().toISOString(),
    cuerpo,
  };
  if (!respuesta.ok) {
    return { series: [], respuestaCruda, error: `NASA POWER respondió HTTP ${respuesta.status}.` };
  }
  if (!jsonValido) {
    return { series: [], respuestaCruda, error: 'NASA POWER no devolvió un JSON válido.' };
  }
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.properties) || !esObjeto(cuerpo.properties.parameter)) {
    return { series: [], respuestaCruda, error: 'La respuesta de NASA POWER no tiene el formato esperado.' };
  }

  return {
    series: parametros.map(({ codigo }) => crearSerie(codigo, cuerpo.properties.parameter[codigo], consulta)),
    respuestaCruda,
  };
}
