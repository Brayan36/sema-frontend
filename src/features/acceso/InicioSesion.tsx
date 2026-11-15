import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarcoAcceso from './components/MarcoAcceso';
import CampoAcceso from './components/CampoAcceso';
import Icono from './components/Icono';
import { validarInicio } from './validaciones';
import type { ErroresAcceso } from './types';
import { ApiError } from '../../services/httpClient';
import useTituloAcceso from './useTituloAcceso';

type Props = { onIniciar: (correo: string, contrasena: string) => Promise<void>; onExplorar?: () => void; aviso?: string };
export default function InicioSesion({ onIniciar, onExplorar, aviso }: Props) {
  useTituloAcceso('Inicia sesión');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<ErroresAcceso>({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const enCurso = useRef(false);
  const formulario = useRef<HTMLFormElement>(null);
  const navegar = useNavigate();
  function explorar() {
    onExplorar?.();
    setContrasena('');
    navegar('/bienvenido', { replace: true });
  }
  return <MarcoAcceso>
    <div className="ac-titulo"><p className="ac-antetitulo">TU TIERRA, DESDE OTRA PERSPECTIVA</p><h1>Inicia sesión</h1><p>Bienvenido de nuevo. Tu próxima decisión<br className="ac-salto" /> empieza con una mejor perspectiva.</p></div>
    {aviso && <p className="ac-mensaje" role="status">{aviso}</p>}
    <form ref={formulario} className="ac-formulario" noValidate aria-busy={enviando} onSubmit={async (e) => {
      e.preventDefault();
      if (enCurso.current) return;
      const nuevos = validarInicio(correo, contrasena); setErrores(nuevos); setMensaje('');
      if (Object.keys(nuevos).length) { requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()); return; }
      enCurso.current = true; setEnviando(true);
      try { await onIniciar(correo.trim(), contrasena); navegar('/bienvenido', { replace: true }); }
      catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof ApiError) {
          setErrores({ correo: error.campos.username ?? error.campos.correo, contrasena: error.campos.password });
          setMensaje(error.status === 401 ? 'El correo o la contraseña no permiten iniciar sesión. Revisa tus datos.' : error.message + (error.errorId ? ` Referencia: ${error.errorId}` : ''));
        } else setMensaje('No se pudo iniciar sesión. Intenta nuevamente.');
      } finally { setContrasena(''); setEnviando(false); enCurso.current = false; }
    }}>
      <CampoAcceso id="login-correo" etiqueta="Correo electrónico" icono="correo" type="email" autoComplete="username" placeholder="tu@correo.com" maxLength={254} value={correo} onChange={(e) => { setCorreo(e.target.value); setErrores((prev) => ({ ...prev, correo: undefined })); setMensaje(''); }} error={errores.correo} required />
      <CampoAcceso id="login-clave" etiqueta="Contraseña" icono="candado" type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" maxLength={128} value={contrasena} onChange={(e) => { setContrasena(e.target.value); setErrores((prev) => ({ ...prev, contrasena: undefined })); setMensaje(''); }} error={errores.contrasena} required />
      <div className="ac-enlaces-formulario"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></div>
      {mensaje && <p className="ac-mensaje" role="status">{mensaje}</p>}
      <button className="ac-primario" type="submit" disabled={enviando}>{enviando ? 'Validando acceso…' : 'Entrar'} <Icono nombre="flecha" /></button>
    </form>
    <p className="ac-alternativa">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    {onExplorar && <div className="ac-demo"><span>¿Quieres conocer SEMA?</span><button className="ac-boton-demo" type="button" onClick={explorar} disabled={enviando}>Explorar demostración <Icono nombre="flecha" /></button><p>Vista previa local, sin cuenta ni permisos del backend.</p></div>}
  </MarcoAcceso>;
}
