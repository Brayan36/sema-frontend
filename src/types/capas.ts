export type CapaSatelital = {
  id: string;
  nombre: string;
  proveedor: 'planetary-computer';
  coleccion: string;
  fecha: string;
  nubosidad: number | null;
};

export type FiltrosImagenes = {
  inicio: string;
  fin: string;
  nubosidadMaxima: number;
};

export type TeselasSatelitales = {
  escenaId: string;
  url: string;
  minZoom: number;
  maxZoom: number;
  limites: [oeste: number, sur: number, este: number, norte: number];
};
