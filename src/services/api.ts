/** Solo configuración pública. Los secretos se mantienen en el backend. */
export function obtenerBaseApi(): URL | null {
  const valor = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!valor) return null;
  const url = new URL(valor);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('La dirección del backend debe utilizar HTTP o HTTPS.');
  }
  return url;
}
