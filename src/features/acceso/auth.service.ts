import { ApiError, apiClient, ClienteHttp, esObjeto } from '../../services/httpClient.ts';
import type { UsuarioSesion } from './types';

export function leerUsuario(valor: unknown): UsuarioSesion {
  if (!esObjeto(valor) || !Number.isInteger(valor.id) || Number(valor.id) <= 0 || typeof valor.nombre !== 'string' || typeof valor.correo !== 'string' || valor.is_active !== true) {
    throw new ApiError('El backend no devolvió un usuario activo con el formato esperado.', { codigo: 'CONTRATO_USUARIO' });
  }
  return { id: String(valor.id), nombre: valor.nombre, correo: valor.correo, roles: [], permisos: [] };
}

export function expiracionJwt(token: string): number | null {
  // Solo programa la salida visual: no prueba autenticidad ni concede permisos.
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const texto = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const datos: unknown = JSON.parse(texto);
    return esObjeto(datos) && typeof datos.exp === 'number' && Number.isFinite(datos.exp) ? datos.exp * 1000 : null;
  } catch { return null; }
}

export async function consultarUsuario(token: string, signal?: AbortSignal, cliente: ClienteHttp = apiClient): Promise<UsuarioSesion> {
  // Login requiere solo el perfil; no consulta catálogos ni asignaciones.
  return leerUsuario(await cliente.solicitar('/auth/me', { token, signal }));
}

export async function autenticar(correo: string, contrasena: string, signal?: AbortSignal, cliente: ClienteHttp = apiClient) {
  const respuesta = await cliente.solicitar('/auth/login', {
    method: 'POST', autenticada: false, signal,
    body: new URLSearchParams({ username: correo.trim(), password: contrasena }),
  });
  if (!esObjeto(respuesta) || typeof respuesta.access_token !== 'string' || !respuesta.access_token || (respuesta.token_type !== undefined && String(respuesta.token_type).toLowerCase() !== 'bearer')) {
    throw new ApiError('El backend no devolvió un token bearer válido.', { codigo: 'CONTRATO_TOKEN' });
  }
  const token = respuesta.access_token;
  const usuario = await consultarUsuario(token, signal, cliente);
  return { token, usuario, expiraEn: expiracionJwt(token) };
}
