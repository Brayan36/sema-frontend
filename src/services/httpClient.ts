import { obtenerBaseApi } from './api.ts';

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly campos: Record<string, string>;
  readonly errorId?: string;
  constructor(mensaje: string, opciones: { status?: number; codigo?: string; campos?: Record<string, string>; errorId?: string; cause?: unknown } = {}) {
    super(mensaje, { cause: opciones.cause });
    this.name = 'ApiError'; this.status = opciones.status ?? 0; this.codigo = opciones.codigo ?? 'API_ERROR';
    this.campos = opciones.campos ?? {}; this.errorId = opciones.errorId;
  }
}

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function errorRespuesta(status: number, datos: unknown, errorIdCabecera: string | null): ApiError {
  const raiz = esObjeto(datos) ? datos : {};
  const detalle = esObjeto(raiz.error) ? raiz.error : raiz;
  const campos: Record<string, string> = {};
  const validaciones = Array.isArray(raiz.detail) ? raiz.detail : Array.isArray(detalle.details) ? detalle.details : [];
  for (const item of validaciones) {
    if (esObjeto(item) && Array.isArray(item.loc) && typeof item.msg === 'string') {
      const campo = item.loc[item.loc.length - 1];
      if (typeof campo === 'string') campos[campo] = item.msg;
    }
    else if (esObjeto(item) && typeof item.field === 'string' && typeof item.message === 'string') {
      const campo = item.field.split('.').at(-1);
      if (campo) campos[campo] = item.message;
    }
  }
  const mensajes: Record<number, string> = { 401: 'La sesión no es válida. Inicia sesión nuevamente.', 403: 'No tienes permiso para realizar esta acción.', 404: 'No se encontró el recurso solicitado.', 409: 'Los datos entran en conflicto con un registro existente.', 422: 'Revisa los datos del formulario.', 429: 'Se alcanzó el límite de solicitudes. Espera e intenta nuevamente.' };
  const mensaje = status >= 500 ? 'El servidor no pudo completar la solicitud.' : typeof detalle.message === 'string' ? detalle.message : typeof raiz.detail === 'string' ? raiz.detail : mensajes[status] ?? `La solicitud falló (HTTP ${status}).`;
  const id = detalle.error_id ?? raiz.error_id ?? errorIdCabecera;
  return new ApiError(mensaje, { status, codigo: typeof detalle.code === 'string' ? detalle.code : `HTTP_${status}`, campos, errorId: typeof id === 'string' ? id : undefined });
}

type OpcionesPeticion = {
  method?: 'GET' | 'POST';
  body?: URLSearchParams;
  signal?: AbortSignal;
  autenticada?: boolean;
  token?: string;
  timeoutMs?: number;
};

export class ClienteHttp {
  private token: string | null = null;
  private observadores = new Set<() => void>();
  private base: () => URL | null;
  private enviar: typeof fetch;
  constructor(opciones: { base?: () => URL | null; fetch?: typeof fetch } = {}) {
    this.base = opciones.base ?? obtenerBaseApi;
    this.enviar = opciones.fetch ?? ((...args) => fetch(...args));
  }
  establecerToken(token: string | null) { this.token = token; }
  alInvalidarSesion(observador: () => void) { this.observadores.add(observador); return () => { this.observadores.delete(observador); }; }

  async solicitar(ruta: string, opciones: OpcionesPeticion = {}): Promise<unknown> {
    const base = this.base();
    if (!base) throw new ApiError('Configura VITE_API_URL con la dirección del backend.', { codigo: 'CONFIGURACION' });
    if (!ruta.startsWith('/') || ruta.startsWith('//') || ruta.split(/[?#]/)[0].split('/').includes('..')) throw new ApiError('La ruta del backend no es válida.');
    const url = new URL(ruta.slice(1), base.href.replace(/\/?$/, '/'));
    if (url.origin !== base.origin) throw new ApiError('La solicitud debe dirigirse al backend configurado.');
    const autenticada = opciones.autenticada !== false;
    const token = opciones.token ?? this.token;
    if (autenticada && !token) throw new ApiError('Inicia sesión para continuar.', { status: 401, codigo: 'SIN_SESION' });
    const headers = new Headers({ Accept: 'application/json' });
    if (autenticada) headers.set('Authorization', `Bearer ${token}`);
    let body: BodyInit | undefined;
    if (opciones.body) { headers.set('Content-Type', 'application/x-www-form-urlencoded'); body = opciones.body; }
    const signal = opciones.signal ? AbortSignal.any([opciones.signal, AbortSignal.timeout(opciones.timeoutMs ?? 25000)]) : AbortSignal.timeout(opciones.timeoutMs ?? 25000);
    let respuesta: Response;
    try { respuesta = await this.enviar(url, { method: opciones.method ?? 'GET', headers, body, signal, credentials: 'omit', cache: 'no-store', redirect: 'error' }); }
    catch (cause) {
      if (opciones.signal?.aborted) throw cause;
      throw new ApiError(signal.aborted ? 'El servidor tardó demasiado en responder.' : 'No se pudo conectar con el backend. Revisa que esté encendido y que permita el origen del frontend mediante CORS.', { codigo: signal.aborted ? 'TIMEOUT' : 'RED', cause });
    }
    // Una respuesta tardía de un token anterior no debe cerrar una sesión nueva.
    if (respuesta.status === 401 && autenticada && token === this.token) {
      this.token = null;
      for (const observar of this.observadores) observar();
    }
    const texto = await respuesta.text();
    let datos: unknown;
    try { datos = texto.trim() ? JSON.parse(texto) : undefined; }
    catch (cause) { if (respuesta.ok) throw new ApiError('El backend devolvió una respuesta JSON no válida.', { codigo: 'CONTRATO', cause }); }
    if (!respuesta.ok) throw errorRespuesta(respuesta.status, datos, respuesta.headers.get('x-error-id'));
    return datos;
  }
}

export const apiClient = new ClienteHttp();
