import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, ApiError } from '../../services/httpClient';
import { autenticar, consultarUsuario, expiracionJwt } from './auth.service';
import type { SesionAcceso } from './types';
import { crearAlmacenToken } from './tokenStorage';

const almacenToken = crearAlmacenToken(import.meta.env.VITE_AUTH_STORAGE === 'session' ? 'session' : 'memory', () => typeof sessionStorage === 'undefined' ? null : sessionStorage);
export const demostracionHabilitada = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO === 'true';

const guardarToken = almacenToken.guardar;
const leerToken = almacenToken.leer;

type Estado = { sesion: SesionAcceso | null; comprobando: boolean; errorRestauracion: string; mensaje: string; expiraEn: number | null };
const inicial: Estado = { sesion: null, comprobando: true, errorRestauracion: '', mensaje: '', expiraEn: null };

export function useAutenticacion(onCerrar: () => void) {
  const [estado, setEstado] = useState<Estado>(inicial);
  const [reintento, setReintento] = useState(0);
  const peticion = useRef<AbortController | null>(null);
  const generacion = useRef(0);

  const cerrar = useCallback((mensaje = '') => {
    generacion.current += 1; peticion.current?.abort(); apiClient.establecerToken(null); guardarToken(null);
    setEstado({ ...inicial, comprobando: false, mensaje }); onCerrar();
  }, [onCerrar]);

  useEffect(() => apiClient.alInvalidarSesion(() => cerrar('Tu sesión dejó de ser válida o expiró. Inicia sesión nuevamente.')), [cerrar]);

  useEffect(() => {
    const control = new AbortController(); peticion.current = control;
    const actual = ++generacion.current;
    async function restaurar() {
      const token = leerToken();
      if (!token) { if (!control.signal.aborted) setEstado({ ...inicial, comprobando: false }); return; }
      try {
        const usuario = await consultarUsuario(token, control.signal);
        if (control.signal.aborted || actual !== generacion.current) return;
        apiClient.establecerToken(token);
        setEstado({ ...inicial, comprobando: false, sesion: { origen: 'api', usuario }, expiraEn: expiracionJwt(token) });
      } catch (error) {
        if (control.signal.aborted || actual !== generacion.current) return;
        if (error instanceof ApiError && error.status === 401) cerrar('Tu sesión expiró. Inicia sesión nuevamente.');
        else setEstado({ ...inicial, comprobando: false, errorRestauracion: error instanceof Error ? error.message : 'No se pudo validar tu sesión.' });
      }
    }
    void restaurar();
    return () => { control.abort(); peticion.current?.abort(); generacion.current += 1; };
  }, [cerrar, reintento]);

  useEffect(() => {
    if (!estado.sesion || estado.expiraEn === null) return;
    const duracion = Math.max(0, Math.min(estado.expiraEn - Date.now(), 2147483647));
    const temporizador = setTimeout(() => cerrar('Tu sesión expiró. Inicia sesión nuevamente.'), duracion);
    return () => clearTimeout(temporizador);
  }, [estado.sesion, estado.expiraEn, cerrar]);

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    peticion.current?.abort(); const control = new AbortController(); peticion.current = control;
    const actual = ++generacion.current;
    const acceso = await autenticar(correo, contrasena, control.signal);
    if (control.signal.aborted || actual !== generacion.current) throw new DOMException('Solicitud cancelada', 'AbortError');
    if (acceso.expiraEn !== null && acceso.expiraEn <= Date.now()) throw new ApiError('El servidor devolvió una sesión expirada.', { status: 401 });
    apiClient.establecerToken(acceso.token); guardarToken(acceso.token);
    setEstado({ ...inicial, comprobando: false, sesion: { origen: 'api', usuario: acceso.usuario }, expiraEn: acceso.expiraEn });
  }, []);

  const explorar = useCallback(() => {
    if (!demostracionHabilitada) return;
    apiClient.establecerToken(null); guardarToken(null);
    setEstado({ ...inicial, comprobando: false, sesion: { origen: 'demostracion', usuario: { id: 'vista-previa', nombre: 'Explorador', correo: '', roles: [], permisos: [] } } });
  }, []);

  return { ...estado, iniciarSesion, explorar, salir: () => cerrar(), reintentar: () => { setEstado(inicial); setReintento((n) => n + 1); } };
}
