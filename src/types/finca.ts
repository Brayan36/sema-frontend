import type { Feature, Polygon } from 'geojson';

/** Referencia en grados decimales WGS84. GeoJSON ordena longitud, latitud. */
export type Ubicacion = { latitud: number; longitud: number };

export type BorradorFinca = {
  nombre: string;
  pais?: string;
  region?: string;
  ubicacion: Ubicacion;
  paisISO?: string;
  regionId?: string;
  municipio?: string;
  municipioId?: string;
  limiteAdministrativo?: Feature<Polygon | import('geojson').MultiPolygon>;
  contorno?: Feature<Polygon> | null;
  areaHectareas?: number | null;
};

/** Contrato propuesto para validar con backend; no implica un registro existente. */
export type Finca = BorradorFinca & {
  id: string;
  contorno: Feature<Polygon> | null;
  areaHectareas: number | null;
};
