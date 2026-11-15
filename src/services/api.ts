/** Solo configuración pública. Los secretos se mantienen en el backend. */
export type FuenteDatos = 'recursos' | 'backend' | 'proveedores';

/**
 * `recursos` carga fixtures JSON locales, `backend` usa la API configurada y
 * `proveedores` conserva las consultas directas a NASA POWER/Open-Meteo.
 */
export function obtenerFuenteDatos(): FuenteDatos {
  const valor = import.meta.env.VITE_DATA_SOURCE?.trim().toLowerCase();
  if (valor === 'recursos' || valor === 'backend' || valor === 'proveedores') return valor;
  return import.meta.env.DEV ? 'recursos' : 'backend';
}

export function obtenerBaseApi(): URL | null {
  const valor = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!valor) return null;
  const url = new URL(valor);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('La dirección del backend debe utilizar HTTP o HTTPS.');
  }
  return url;
}
