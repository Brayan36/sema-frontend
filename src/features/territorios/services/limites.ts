import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { pointOnFeature } from '@turf/point-on-feature';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';

export type Limite = Feature<Polygon | MultiPolygon>;
export type Pais = { iso: string; nombre: string };
export type DivisionLocal = { id: string; nombre: string; ubicacion: { latitud: number; longitud: number }; limite?: Limite };
const origen = 'https://www.geoboundaries.org/api/current/gbOpen';
const cacheLimites = new Map<string, Limite[]>();
const puntosLocales = new WeakMap<Limite, ReturnType<typeof pointOnFeature>>();
type MunicipioDane = { departamento: string; codigoDepartamento: string; id: string; nombre: string; latitud: number; longitud: number };
let cacheDane: MunicipioDane[] | null = null;

async function leer(url: string, signal: AbortSignal, alternativa?: string): Promise<unknown> {
  const respuesta = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]) });
  if (respuesta.status === 404 && alternativa) return leer(alternativa, signal);
  if (!respuesta.ok) throw new Error('No se pudieron descargar los límites geográficos. Intenta nuevamente.');
  return respuesta.json();
}

/** Evita github.com/raw: su redirección no permite solicitudes CORS del navegador.
 * media sirve los archivos LFS; raw cubre archivos normales si media devuelve 404.
 */
export function rutasDescarga(direccion: string): { principal: string; alternativa: string } {
  const url = new URL(direccion);
  let ruta = '';
  if (url.hostname === 'github.com') ruta = url.pathname.replace(/^\/wmgeolab\/geoBoundaries\/raw\//, '');
  else if (url.hostname === 'raw.githubusercontent.com') ruta = url.pathname.replace(/^\/wmgeolab\/geoBoundaries\//, '');
  else if (url.hostname === 'media.githubusercontent.com') ruta = url.pathname.replace(/^\/media\/wmgeolab\/geoBoundaries\//, '');
  if (url.protocol !== 'https:' || !/^[\w.-]+\/releaseData\/gbOpen\/[A-Z]{3}\/ADM[012]\/geoBoundaries-[A-Z]{3}-ADM[012](?:_simplified)?\.geojson$/.test(ruta)) {
    throw new Error('Origen de límites no reconocido.');
  }
  return { principal: `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${ruta}`, alternativa: `https://raw.githubusercontent.com/wmgeolab/geoBoundaries/${ruta}` };
}

export async function cargarPaises(signal: AbortSignal): Promise<Pais[]> {
  const datos = await leer(`${origen}/ALL/ADM0/`, signal);
  if (!Array.isArray(datos)) throw new Error('El catálogo de países no está disponible.');
  return datos.flatMap((dato) => {
    if (typeof dato.boundaryISO !== 'string' || !/^[A-Z]{3}$/.test(dato.boundaryISO) || typeof dato.boundaryName !== 'string') return [];
    // El proveedor identifica los países con ISO3; conserva su nombre publicado.
    return [{ iso: dato.boundaryISO as string, nombre: dato.boundaryName as string }];
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function cargarLimites(iso: string, nivel: 'ADM0' | 'ADM1' | 'ADM2', signal: AbortSignal): Promise<Limite[]> {
  if (!/^[A-Z]{3}$/.test(iso)) throw new Error('Selecciona un país válido.');
  signal.throwIfAborted();
  const clave = `${iso}/${nivel}`;
  const guardado = cacheLimites.get(clave);
  if (guardado) return guardado;
  const datos = await leer(`${origen}/${iso}/${nivel}/`, signal);
  if (!datos || typeof datos !== 'object' || !('simplifiedGeometryGeoJSON' in datos) || typeof datos.simplifiedGeometryGeoJSON !== 'string') {
    throw new Error('No hay límites disponibles para este país o nivel. Puedes usar coordenadas.');
  }
  const rutas = rutasDescarga(datos.simplifiedGeometryGeoJSON);
  const contenido = await leer(rutas.principal, signal, rutas.alternativa) as FeatureCollection;
  if (contenido?.type !== 'FeatureCollection' || !Array.isArray(contenido.features)) throw new Error('El archivo de límites no es válido.');
  const limites = contenido.features.filter((f): f is Limite => f.type === 'Feature' && (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'));
  cacheLimites.set(clave, limites);
  return limites;
}

/** ADM2 no publica un identificador del padre: agrupación espacial aproximada. */
export function filtrarDivisionesLocales(divisiones: Limite[], region: Limite): Limite[] {
  return divisiones.filter((division) => {
    let punto = puntosLocales.get(division);
    if (!punto) { punto = pointOnFeature(division); puntosLocales.set(division, punto); }
    return booleanPointInPolygon(punto, region);
  }).sort((a, b) => nombreLimite(a).localeCompare(nombreLimite(b), 'es'));
}

function normalizarNombre(nombre: string) {
  return nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function cargarDivisionesLocales(iso: string, region: Limite, signal: AbortSignal): Promise<DivisionLocal[]> {
  signal.throwIfAborted();
  if (iso === 'COL') {
    if (!cacheDane) {
      const datos = await leer('https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=2000', signal);
      if (!Array.isArray(datos)) throw new Error('No se pudo leer el catálogo DIVIPOLA.');
      cacheDane = datos.flatMap((dato) => {
        if (!dato || typeof dato.dpto !== 'string' || typeof dato.cod_dpto !== 'string' || typeof dato.cod_mpio !== 'string' || typeof dato.nom_mpio !== 'string') return [];
        const latitud = Number(String(dato.latitud).replace(',', '.'));
        const longitud = Number(String(dato.longitud).replace(',', '.'));
        if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return [];
        return [{ departamento: dato.dpto, codigoDepartamento: dato.cod_dpto, id: dato.cod_mpio, nombre: dato.nom_mpio, latitud, longitud }];
      });
    }
    const nombreRegion = normalizarNombre(nombreLimite(region));
    // Bogotá es distrito capital y ambos catálogos utilizan variantes de su nombre.
    const departamento = cacheDane.find((m) => normalizarNombre(m.departamento) === nombreRegion || (nombreRegion.startsWith('BOGOTA') && m.codigoDepartamento === '11') || (nombreRegion.includes('SANANDRES') && m.codigoDepartamento === '88'));
    if (!departamento) return [];
    return cacheDane.filter((m) => m.codigoDepartamento === departamento.codigoDepartamento)
      .map((m) => ({ id: m.id, nombre: m.nombre, ubicacion: { latitud: m.latitud, longitud: m.longitud } }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }
  const divisiones = filtrarDivisionesLocales(await cargarLimites(iso, 'ADM2', signal), region);
  return divisiones.map((limite) => {
    const [longitud, latitud] = pointOnFeature(limite).geometry.coordinates;
    return { id: String(limite.properties?.shapeID), nombre: nombreLimite(limite), ubicacion: { latitud, longitud }, limite };
  });
}

export function nombreLimite(limite: Limite): string {
  return String(limite.properties?.shapeName ?? 'Región sin nombre');
}
