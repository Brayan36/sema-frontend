import type { Feature, Polygon } from 'geojson';
import { area } from '@turf/area';
import { centroid } from '@turf/centroid';

/** Medida orientativa sobre WGS84; no sustituye un levantamiento topográfico. */
export function medirTerreno(terreno: Feature<Polygon>) {
  const puntos = terreno.geometry.coordinates[0];
  if (!puntos || puntos.length < 4 || puntos.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 85)) throw new Error('Dibuja al menos tres vértices válidos, entre ±85° de latitud.');
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) throw new Error('Cierra el terreno en el primer vértice.');
  if (Math.max(...puntos.map((p) => p[0])) - Math.min(...puntos.map((p) => p[0])) > 180) throw new Error('Este dibujo no admite terrenos que crucen el meridiano 180°.');
  const areaHectareas = area(terreno) / 10000;
  if (!Number.isFinite(areaHectareas) || areaHectareas <= 0) throw new Error('El terreno debe tener un área mayor que cero.');
  const [longitud, latitud] = centroid(terreno).geometry.coordinates;
  return { areaHectareas, ubicacion: { latitud, longitud } };
}
