import type { AnalisisAmbiental, ConsultaHistoricaAmbiental } from '../../../types/ambiental';
import { obtenerBaseApi, obtenerFuenteDatos } from '../../../services/api';
import { crearDocumentoAnalisis, leerDocumentoAnalisis } from './documentoAmbiental';

const RUTA_ANALISIS = '/api/analisis-ambiental';
const TIMEOUT_MS = 12_000;
const RECURSO_ANALISIS = '/recursos/analisis-ambiental.json';

/** Lee el mismo contrato JSON que puede devolver GET /api/analisis-ambiental. */
export async function cargarAnalisisDeRecurso(
  consulta: ConsultaHistoricaAmbiental,
  signal?: AbortSignal,
): Promise<AnalisisAmbiental> {
  const respuesta = await fetch(RECURSO_ANALISIS, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!respuesta.ok) throw new Error(`No se pudo cargar el recurso de análisis (HTTP ${respuesta.status}).`);
  const analisis = leerDocumentoAnalisis(await respuesta.json());
  if (!analisis) throw new Error('El recurso de análisis ambiental no cumple el contrato JSON esperado.');
  const inicio = new Date(`${consulta.inicio}T00:00:00.000Z`);
  const fin = new Date(`${consulta.fin}T00:00:00.000Z`);
  return {
    ...analisis,
    ubicacion: consulta.ubicacion,
    periodo: { inicio: consulta.inicio, fin: consulta.fin },
    series: analisis.series.map((serie) => ({
      ...serie,
      periodo: { inicio: consulta.inicio, fin: consulta.fin },
      puntos: serie.puntos.flatMap(({ valor }, indice) => {
        const fechaConsulta = new Date(inicio);
        fechaConsulta.setUTCDate(fechaConsulta.getUTCDate() + indice);
        if (fechaConsulta > fin) return [];
        return [{ fecha: fechaConsulta.toISOString().slice(0, 10), valor }];
      }),
    })),
  };
}

function crearUrl(consulta: ConsultaHistoricaAmbiental, fincaId?: string): URL | null {
  const base = obtenerBaseApi();
  if (!base) return null;

  const url = new URL(RUTA_ANALISIS, base);
  url.search = new URLSearchParams({
    latitud: String(consulta.ubicacion.latitud),
    longitud: String(consulta.ubicacion.longitud),
    inicio: consulta.inicio,
    fin: consulta.fin,
    ...(fincaId ? { fincaId } : {}),
  }).toString();
  return url;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esAnalisisAmbiental(valor: unknown): valor is AnalisisAmbiental {
  return esObjeto(valor)
    && esObjeto(valor.ubicacion)
    && typeof valor.ubicacion.latitud === 'number'
    && typeof valor.ubicacion.longitud === 'number'
    && typeof valor.obtenidoEn === 'string'
    && Array.isArray(valor.series);
}

export async function guardarAnalisisEnBackend(
  analisis: AnalisisAmbiental,
): Promise<{ enviado: boolean; analisis?: AnalisisAmbiental }> {
  if (obtenerFuenteDatos() === 'recursos') {
    return { enviado: true, analisis: { ...analisis, analysisId: 'demo-analysis' } };
  }
  const base = obtenerBaseApi();
  if (!base) return { enviado: false };

  const url = new URL(RUTA_ANALISIS, base);
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(crearDocumentoAnalisis(analisis)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!respuesta.ok) throw new Error(`El backend respondió HTTP ${respuesta.status} al guardar el análisis.`);
  if (respuesta.status === 204) return { enviado: true };
  const texto = await respuesta.text();
  if (!texto.trim()) return { enviado: true };
  const tipoContenido = respuesta.headers.get('content-type') ?? '';
  if (!tipoContenido.includes('json')) return { enviado: true };
  let contenido: unknown;
  try {
    contenido = JSON.parse(texto);
  } catch {
    throw new Error('El backend guardó el análisis, pero respondió un JSON inválido.');
  }
  const documento = leerDocumentoAnalisis(contenido);
  if (documento) return { enviado: true, analisis: documento };
  if (esAnalisisAmbiental(contenido)) return { enviado: true, analisis: contenido };
  if (esObjeto(contenido) && typeof contenido.analysisId === 'string') {
    return { enviado: true, analisis: { ...analisis, analysisId: contenido.analysisId } };
  }
  throw new Error('El backend guardó el análisis, pero respondió un documento JSON inválido.');
}

export async function recuperarAnalisisDelBackend(
  consulta: ConsultaHistoricaAmbiental,
  fincaId?: string,
): Promise<AnalisisAmbiental | null> {
  if (obtenerFuenteDatos() === 'recursos') return cargarAnalisisDeRecurso(consulta);
  const url = crearUrl(consulta, fincaId);
  if (!url) return null;

  const respuesta = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (respuesta.status === 404 || respuesta.status === 204) return null;
  if (!respuesta.ok) throw new Error(`El backend respondió HTTP ${respuesta.status} al recuperar el análisis.`);
  const contenido: unknown = await respuesta.json();
  const documento = leerDocumentoAnalisis(contenido);
  if (documento) return documento;
  if (esAnalisisAmbiental(contenido)) return contenido;
  throw new Error('El backend devolvió un análisis ambiental con formato inválido.');
}
