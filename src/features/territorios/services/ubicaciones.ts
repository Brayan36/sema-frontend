import type { Ubicacion } from '../../../types/finca';

type ResultadoUbicacion =
  | { ok: true; ubicacion: Ubicacion }
  | { ok: false; mensaje: string };

/** Primera entrada global: coordenadas. La búsqueda por nombre se conectará después. */
export function validarCoordenadas(latitudTexto: string, longitudTexto: string): ResultadoUbicacion {
  if (!latitudTexto.trim() || !longitudTexto.trim()) {
    return { ok: false, mensaje: 'Escribe la latitud y la longitud.' };
  }
  const latitud = Number(latitudTexto.trim().replace(',', '.'));
  const longitud = Number(longitudTexto.trim().replace(',', '.'));
  if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90) {
    return { ok: false, mensaje: 'La latitud debe ser un número entre −90 y 90.' };
  }
  if (!Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
    return { ok: false, mensaje: 'La longitud debe ser un número entre −180 y 180.' };
  }
  return { ok: true, ubicacion: { latitud, longitud } };
}
