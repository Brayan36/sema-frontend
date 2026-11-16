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

const API = 'https://archive-api.open-meteo.com/v1/archive';
const TIMEOUT_MS = 30_000;

const variablesDiarias = [
  { clave: 'temperature_2m_mean', variable: 'temperatura', unidad: '°C' },
  { clave: 'precipitation_sum', variable: 'precipitacion', unidad: 'mm/día' },
  { clave: 'shortwave_radiation_sum', variable: 'radiacion-solar', unidad: 'MJ/m²/día' },
  { clave: 'relative_humidity_2m_mean', variable: 'humedad-relativa', unidad: '%' },
  { clave: 'wind_speed_10m_mean', variable: 'velocidad-viento', unidad: 'km/h' },
  { clave: 'et0_fao_evapotranspiration', variable: 'evapotranspiracion', unidad: 'mm/día' },
] as const satisfies ReadonlyArray<{
  clave: string;
  variable: VariableAmbiental;
  unidad: UnidadAmbiental;
}>;

type Objeto = Record<string, unknown>;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function obtenerPuntos(fechas: unknown, valores: unknown, frecuencia: 'diaria' | 'horaria'): PuntoSerieAmbiental[] {
  if (!Array.isArray(fechas) || !Array.isArray(valores)) return [];

  return fechas.flatMap((fechaBruta, indice) => {
    if (typeof fechaBruta !== 'string') return [];
    const fecha = frecuencia === 'horaria' && !/(Z|[+-]\d{2}:?\d{2})$/.test(fechaBruta)
      ? `${fechaBruta}Z`
      : fechaBruta;
    const fechaValida = frecuencia === 'diaria'
      ? /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      : !Number.isNaN(Date.parse(fecha));
    if (!fechaValida) return [];

    const valorBruto = valores[indice];
    const valor = typeof valorBruto === 'number' && Number.isFinite(valorBruto) ? valorBruto : null;
    return [{ fecha, valor }];
  });
}

function crearSerie(
  variable: VariableAmbiental,
  unidad: UnidadAmbiental,
  conjuntoDatos: string,
  frecuencia: 'diaria' | 'horaria',
  fechas: unknown,
  valores: unknown,
  consulta: ConsultaHistoricaAmbiental,
): SerieAmbiental {
  const puntos = obtenerPuntos(fechas, valores, frecuencia);
  return {
    variable,
    unidad,
    frecuencia,
    tipoDato: 'historico',
    referenciaTemporal: 'UTC',
    periodo: { inicio: consulta.inicio, fin: consulta.fin },
    puntos,
    estadisticas: calcularEstadisticas(puntos),
    procedencia: {
      proveedor: 'open-meteo',
      conjuntoDatos,
      modelo: 'ERA5',
      resolucionEspacial: '0.25° (aprox. 25 km)',
      atribucion: 'Open-Meteo / ERA5 (CC BY 4.0)',
    },
  };
}

export async function consultarHistoricoOpenMeteo(
  consulta: ConsultaHistoricaAmbiental,
  signal?: AbortSignal,
): Promise<ResultadoProveedorAmbiental> {
  validarConsultaHistorica(consulta);

  const url = new URL(API);
  url.search = new URLSearchParams({
    latitude: String(consulta.ubicacion.latitud),
    longitude: String(consulta.ubicacion.longitud),
    start_date: consulta.inicio,
    end_date: consulta.fin,
    daily: variablesDiarias.map(({ clave }) => clave).join(','),
    hourly: 'soil_moisture_0_to_7cm,soil_temperature_0_to_7cm',
    // ERA5-Land responde 200 con precipitación/radiación nulas en esta consulta.
    // ERA5 permite consultar juntas las ocho variables sin inventar valores.
    models: 'era5',
    wind_speed_unit: 'kmh',
    timezone: 'UTC',
    timeformat: 'iso8601',
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
    return { series: [], respuestaCruda, error: `Open-Meteo respondió HTTP ${respuesta.status}.` };
  }
  if (!jsonValido) {
    return { series: [], respuestaCruda, error: 'Open-Meteo no devolvió un JSON válido.' };
  }
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.daily) || !esObjeto(cuerpo.hourly)) {
    return { series: [], respuestaCruda, error: 'La respuesta histórica de Open-Meteo no tiene el formato esperado.' };
  }

  const daily = cuerpo.daily;
  const hourly = cuerpo.hourly;
  const fechasDiarias = daily.time;
  const fechasHorarias = hourly.time;

  const series = variablesDiarias.map(({ clave, variable, unidad }) =>
    crearSerie(variable, unidad, clave, 'diaria', fechasDiarias, daily[clave], consulta),
  );
  series.push(crearSerie(
    'temperatura-suelo',
    '°C',
    'soil_temperature_0_to_7cm',
    'horaria',
    fechasHorarias,
    hourly.soil_temperature_0_to_7cm,
    consulta,
  ));
  series.push(crearSerie(
    'humedad-suelo',
    'm³/m³',
    'soil_moisture_0_to_7cm',
    'horaria',
    fechasHorarias,
    hourly.soil_moisture_0_to_7cm,
    consulta,
  ));

  return {
    series,
    respuestaCruda,
  };
}
