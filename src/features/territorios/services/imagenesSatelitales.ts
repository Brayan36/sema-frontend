import type { CapaSatelital, FiltrosImagenes, TeselasSatelitales } from '../../../types/capas';
import type { Ubicacion } from '../../../types/finca';

const ORIGEN = 'https://planetarycomputer.microsoft.com';
const COLECCION = 'sentinel-2-l2a';
const esObjeto = (dato: unknown): dato is Record<string, unknown> => typeof dato === 'object' && dato !== null;

/** Consultas públicas; no recibe contraseñas ni claves de servicio. */
async function leerJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const controlador = new AbortController();
  const cancelar = () => controlador.abort();
  signal?.addEventListener('abort', cancelar, { once: true });
  if (signal?.aborted) controlador.abort();
  let tiempoAgotado = false;
  const reloj = setTimeout(() => { tiempoAgotado = true; controlador.abort(); }, 25000);
  try {
    const respuesta = await fetch(url, { signal: controlador.signal, credentials: 'omit' });
    if (!respuesta.ok) {
      if (respuesta.status === 429) throw new Error('El proveedor alcanzó su límite de solicitudes. Espera un momento y vuelve a intentarlo.');
      throw new Error(`Planetary Computer no pudo completar la consulta (HTTP ${respuesta.status}).`);
    }
    return await respuesta.json();
  } catch (error) {
    if (tiempoAgotado) throw new Error('La consulta tardó demasiado. Vuelve a intentarlo.', { cause: error });
    if (error instanceof TypeError) throw new Error('No se pudo conectar con Planetary Computer. Revisa tu conexión y vuelve a intentarlo.', { cause: error });
    if (error instanceof SyntaxError) throw new Error('El proveedor devolvió una respuesta que no se pudo interpretar.', { cause: error });
    throw error;
  } finally {
    clearTimeout(reloj);
    signal?.removeEventListener('abort', cancelar);
  }
}

function esFecha(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

export function crearFiltrosIniciales(): FiltrosImagenes {
  const fin = new Date();
  const inicio = new Date(fin);
  inicio.setUTCDate(inicio.getUTCDate() - 90);
  return { inicio: inicio.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10), nubosidadMaxima: 40 };
}

/** Busca hasta seis escenas recientes que intersecten el punto, no solo su vecindario. */
export async function buscarImagenes(ubicacion: Ubicacion, filtros: FiltrosImagenes, signal?: AbortSignal): Promise<CapaSatelital[]> {
  if (!Number.isFinite(ubicacion.latitud) || Math.abs(ubicacion.latitud) > 90 || !Number.isFinite(ubicacion.longitud) || Math.abs(ubicacion.longitud) > 180) {
    throw new Error('Selecciona coordenadas válidas antes de buscar imágenes.');
  }
  if (!esFecha(filtros.inicio) || !esFecha(filtros.fin) || filtros.inicio > filtros.fin || filtros.fin > new Date().toISOString().slice(0, 10)) {
    throw new Error('Revisa las fechas: el inicio debe ser anterior o igual al final y no se admiten fechas futuras.');
  }
  if (!Number.isFinite(filtros.nubosidadMaxima) || filtros.nubosidadMaxima < 0 || filtros.nubosidadMaxima > 100) {
    throw new Error('La nubosidad máxima debe estar entre 0 y 100 %.');
  }
  const url = new URL('/api/stac/v1/search', ORIGEN);
  url.search = new URLSearchParams({
    collections: COLECCION,
    intersects: JSON.stringify({ type: 'Point', coordinates: [ubicacion.longitud, ubicacion.latitud] }),
    datetime: `${filtros.inicio}T00:00:00Z/${filtros.fin}T23:59:59Z`,
    query: JSON.stringify({ 'eo:cloud_cover': { lte: filtros.nubosidadMaxima } }),
    sortby: '-datetime',
    limit: '6',
  }).toString();
  const datos = await leerJson(url, signal);
  if (!esObjeto(datos) || !Array.isArray(datos.features)) throw new Error('La búsqueda devolvió un formato no reconocido.');
  const capas: CapaSatelital[] = [];
  for (const escena of datos.features.slice(0, 6)) {
    if (!esObjeto(escena) || typeof escena.id !== 'string' || escena.collection !== COLECCION || !esObjeto(escena.properties) || !esObjeto(escena.assets) || !esObjeto(escena.assets.visual)) continue;
    const fecha = escena.properties.datetime;
    if (typeof fecha !== 'string' || !Number.isFinite(Date.parse(fecha))) continue;
    const nube = escena.properties['eo:cloud_cover'];
    capas.push({
      id: escena.id, nombre: 'Sentinel-2 · color natural', proveedor: 'planetary-computer', coleccion: COLECCION, fecha,
      nubosidad: typeof nube === 'number' && Number.isFinite(nube) && nube >= 0 && nube <= 100 ? nube : null,
    });
  }
  if (datos.features.length > 0 && capas.length === 0) throw new Error('Las escenas recibidas no incluyen una imagen en color natural compatible.');
  return capas;
}

export async function obtenerTeselas(escena: CapaSatelital, signal?: AbortSignal): Promise<TeselasSatelitales> {
  if (escena.coleccion !== COLECCION || !escena.id) throw new Error('La escena seleccionada no es compatible.');
  const url = new URL('/api/data/v1/item/WebMercatorQuad/tilejson.json', ORIGEN);
  url.search = new URLSearchParams({ collection: COLECCION, item: escena.id, assets: 'visual', minzoom: '0', maxzoom: '18' }).toString();
  const datos = await leerJson(url, signal);
  if (!esObjeto(datos) || !Array.isArray(datos.tiles) || typeof datos.tiles[0] !== 'string' || !Array.isArray(datos.bounds)) {
    throw new Error('El proveedor no devolvió una capa de mapa compatible.');
  }
  const limites = datos.bounds;
  if (limites.length !== 4 || !limites.every((valor) => typeof valor === 'number' && Number.isFinite(valor)) || limites[0] < -180 || limites[2] > 180 || limites[1] < -90 || limites[3] > 90 || limites[0] >= limites[2] || limites[1] >= limites[3]) {
    throw new Error('La imagen devolvió límites geográficos inválidos.');
  }
  const direccionTeselas = datos.tiles[0];
  const direccion = new URL(direccionTeselas);
  if (direccion.origin !== ORIGEN || !direccion.pathname.startsWith('/api/data/v1/item/tiles/') || !['{z}', '{x}', '{y}'].every((campo) => direccionTeselas.includes(campo))) {
    throw new Error('La dirección de la imagen no pertenece al servicio esperado.');
  }
  return { escenaId: escena.id, url: direccionTeselas, minZoom: 0, maxZoom: 18, limites: [limites[0], limites[1], limites[2], limites[3]] };
}

export const documentacionSatelital = {
  catalogo: 'https://planetarycomputer.microsoft.com/api/stac/v1',
  sentinel2: 'https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a',
};
