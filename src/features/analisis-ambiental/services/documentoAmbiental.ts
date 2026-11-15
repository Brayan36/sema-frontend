import type {
  AnalisisAmbiental,
  FrecuenciaAmbiental,
  ProcedenciaAmbiental,
  ProveedorAmbiental,
  SerieAmbiental,
  TipoDatoAmbiental,
  UnidadAmbiental,
  VariableAmbiental,
} from '../../../types/ambiental';
import type { Ubicacion } from '../../../types/finca';
import { calcularEstadisticas } from './estadisticas';

type ObservacionDocumento = { date: string; value: number | null };
type SerieDocumento = {
  variable: VariableAmbiental;
  frequency: FrecuenciaAmbiental;
  unit: UnidadAmbiental;
  type: TipoDatoAmbiental;
  temporalReference: SerieAmbiental['referenciaTemporal'];
  period: { start: string; end: string };
  provenance: {
    provider: ProveedorAmbiental;
    model: string | null;
    dataset: string;
    attribution: string | null;
    spatialResolution: string | null;
  };
  observations: ObservacionDocumento[];
};

export type DocumentoAnalisisAmbiental = {
  schemaVersion: 1;
  analysisId: string | null;
  farmId: string | null;
  location: Ubicacion;
  period: { start: string; end: string };
  fetchedAt: string;
  createdAt: string;
  expiresAt: string | null;
  rawResponses: Partial<Record<ProveedorAmbiental, {
    requestedUrl: string;
    httpStatus: number;
    contentType: string | null;
    receivedAt: string;
    body: unknown;
  }>>;
  providerErrors: { provider: ProveedorAmbiental; message: string }[];
  series: SerieDocumento[];
};

const proveedores: ProveedorAmbiental[] = ['nasa-power', 'open-meteo'];
const variables: VariableAmbiental[] = [
  'temperatura', 'precipitacion', 'radiacion-solar', 'humedad-relativa',
  'humedad-suelo', 'temperatura-suelo', 'velocidad-viento', 'evapotranspiracion',
];
const unidades: UnidadAmbiental[] = ['°C', 'mm', 'MJ/m²/día', 'W/m²', '%', 'm³/m³', 'km/h', 'mm/día'];
const frecuencias: FrecuenciaAmbiental[] = ['horaria', 'diaria', 'mensual'];
const tipos: TipoDatoAmbiental[] = ['historico', 'pronostico', 'climatologia'];
const referencias: SerieAmbiental['referenciaTemporal'][] = ['UTC', 'LST', 'local'];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esProveedor(valor: unknown): valor is ProveedorAmbiental {
  return proveedores.includes(valor as ProveedorAmbiental);
}

export function crearDocumentoAnalisis(analisis: AnalisisAmbiental): DocumentoAnalisisAmbiental {
  const periodo = analisis.periodo ?? analisis.series[0]?.periodo ?? { inicio: '', fin: '' };
  const rawResponses: DocumentoAnalisisAmbiental['rawResponses'] = {};
  for (const proveedor of proveedores) {
    const respuesta = analisis.respuestasCrudas?.[proveedor];
    if (respuesta) rawResponses[proveedor] = {
      requestedUrl: respuesta.url,
      httpStatus: respuesta.estadoHttp,
      contentType: respuesta.tipoContenido,
      receivedAt: respuesta.recibidaEn,
      body: respuesta.cuerpo,
    };
  }

  return {
    schemaVersion: 1,
    analysisId: analisis.analysisId ?? null,
    farmId: analisis.fincaId ?? null,
    location: analisis.ubicacion,
    period: { start: periodo.inicio, end: periodo.fin },
    fetchedAt: analisis.obtenidoEn,
    createdAt: analisis.creadoEn ?? analisis.obtenidoEn,
    expiresAt: analisis.expiraEn ?? null,
    rawResponses,
    providerErrors: (analisis.erroresProveedores ?? []).map(({ proveedor, mensaje }) => ({ provider: proveedor, message: mensaje })),
    series: analisis.series.map((serie) => ({
      variable: serie.variable,
      frequency: serie.frecuencia,
      unit: serie.unidad,
      type: serie.tipoDato,
      temporalReference: serie.referenciaTemporal,
      period: { start: serie.periodo.inicio, end: serie.periodo.fin },
      provenance: {
        provider: serie.procedencia.proveedor,
        model: serie.procedencia.modelo ?? null,
        dataset: serie.procedencia.conjuntoDatos,
        attribution: serie.procedencia.atribucion ?? null,
        spatialResolution: serie.procedencia.resolucionEspacial ?? null,
      },
      observations: serie.puntos.map(({ fecha, valor }) => ({ date: fecha, value: valor })),
    })),
  };
}

function leerSerie(valor: unknown): SerieAmbiental | null {
  if (!esObjeto(valor) || !esObjeto(valor.period) || !esObjeto(valor.provenance)
    || !Array.isArray(valor.observations)) return null;
  const { provenance } = valor;
  if (!variables.includes(valor.variable as VariableAmbiental)
    || !frecuencias.includes(valor.frequency as FrecuenciaAmbiental)
    || !unidades.includes(valor.unit as UnidadAmbiental)
    || !tipos.includes(valor.type as TipoDatoAmbiental)
    || !referencias.includes(valor.temporalReference as SerieAmbiental['referenciaTemporal'])
    || !esProveedor(provenance.provider)
    || typeof provenance.dataset !== 'string'
    || typeof valor.period.start !== 'string'
    || typeof valor.period.end !== 'string') return null;

  const puntos = valor.observations.map((observacion): SerieAmbiental['puntos'][number] | null => {
    if (!esObjeto(observacion) || typeof observacion.date !== 'string'
      || !(observacion.value === null || (typeof observacion.value === 'number' && Number.isFinite(observacion.value)))) return null;
    return { fecha: observacion.date, valor: observacion.value };
  });
  if (puntos.some((punto) => punto === null)) return null;
  const procedencia: ProcedenciaAmbiental = {
    proveedor: provenance.provider,
    conjuntoDatos: provenance.dataset,
    ...(typeof provenance.model === 'string' ? { modelo: provenance.model } : {}),
    ...(typeof provenance.spatialResolution === 'string' ? { resolucionEspacial: provenance.spatialResolution } : {}),
    ...(typeof provenance.attribution === 'string' ? { atribucion: provenance.attribution } : {}),
  };
  const observaciones = puntos as SerieAmbiental['puntos'];
  return {
    variable: valor.variable as VariableAmbiental,
    unidad: valor.unit as UnidadAmbiental,
    frecuencia: valor.frequency as FrecuenciaAmbiental,
    tipoDato: valor.type as TipoDatoAmbiental,
    referenciaTemporal: valor.temporalReference as SerieAmbiental['referenciaTemporal'],
    periodo: { inicio: valor.period.start, fin: valor.period.end },
    puntos: observaciones,
    estadisticas: calcularEstadisticas(observaciones),
    procedencia,
  };
}

function leerRespuestasCrudas(valor: unknown): AnalisisAmbiental['respuestasCrudas'] | null {
  if (!esObjeto(valor)) return null;
  const respuestas: AnalisisAmbiental['respuestasCrudas'] = {};
  for (const proveedor of proveedores) {
    const item = valor[proveedor];
    if (item === undefined) continue;
    if (!esObjeto(item) || typeof item.requestedUrl !== 'string'
      || typeof item.httpStatus !== 'number' || typeof item.receivedAt !== 'string'
      || !(item.contentType === null || typeof item.contentType === 'string')
      || !('body' in item)) return null;
    respuestas[proveedor] = {
      url: item.requestedUrl,
      estadoHttp: item.httpStatus,
      tipoContenido: item.contentType,
      recibidaEn: item.receivedAt,
      cuerpo: item.body,
    };
  }
  return respuestas;
}

/** Convierte y valida el documento del backend a los tipos internos del frontend. */
export function leerDocumentoAnalisis(valor: unknown): AnalisisAmbiental | null {
  if (!esObjeto(valor) || valor.schemaVersion !== 1 || !esObjeto(valor.location)
    || !esObjeto(valor.period) || !Array.isArray(valor.series)
    || !Array.isArray(valor.providerErrors)
    || typeof valor.location.latitude !== 'number' || !Number.isFinite(valor.location.latitude)
    || typeof valor.location.longitude !== 'number' || !Number.isFinite(valor.location.longitude)
    || typeof valor.period.start !== 'string' || typeof valor.period.end !== 'string'
    || typeof valor.fetchedAt !== 'string' || typeof valor.createdAt !== 'string'
    || !(valor.expiresAt === null || typeof valor.expiresAt === 'string')) return null;
  const series = valor.series.map(leerSerie);
  if (series.some((serie) => serie === null)) return null;
  const respuestasCrudas = leerRespuestasCrudas(valor.rawResponses);
  if (!respuestasCrudas) return null;
  const erroresProveedores = valor.providerErrors.map((error) => {
    if (!esObjeto(error) || !esProveedor(error.provider) || typeof error.message !== 'string') return null;
    return { proveedor: error.provider, mensaje: error.message };
  });
  if (erroresProveedores.some((error) => error === null)) return null;
  return {
    schemaVersion: 1,
    analysisId: typeof valor.analysisId === 'string' ? valor.analysisId : null,
    ...(typeof valor.farmId === 'string' ? { fincaId: valor.farmId } : {}),
    ubicacion: { latitud: valor.location.latitude, longitud: valor.location.longitude },
    periodo: { inicio: valor.period.start, fin: valor.period.end },
    obtenidoEn: valor.fetchedAt,
    creadoEn: valor.createdAt,
    expiraEn: valor.expiresAt,
    respuestasCrudas,
    erroresProveedores: erroresProveedores as NonNullable<AnalisisAmbiental['erroresProveedores']>,
    series: series as SerieAmbiental[],
  };
}

export function descargarDocumentoAnalisis(analisis: AnalisisAmbiental): void {
  const documento = crearDocumentoAnalisis(analisis);
  const contenido = new Blob([JSON.stringify(documento, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `analisis-ambiental-${documento.period.start}-${documento.period.end}.json`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
