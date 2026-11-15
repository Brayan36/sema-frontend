import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MarcoAcceso from './components/MarcoAcceso';
import CampoAcceso from './components/CampoAcceso';
import Icono from './components/Icono';
import { validarInicio } from './validaciones';
import type { ErroresAcceso, SesionAcceso } from './types';
import useTituloAcceso from './useTituloAcceso';

export default function InicioSesion({ onIniciar }: { onIniciar: (sesion: SesionAcceso) => void }) {
  useTituloAcceso('Inicia sesión');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<ErroresAcceso>({});
  const [mensaje, setMensaje] = useState('');
  const formulario = useRef<HTMLFormElement>(null);
  const navegar = useNavigate();
  function explorar() {
    onIniciar({ origen: 'demostracion', usuario: { id: 'vista-previa', nombre: 'Explorador', correo: '', roles: [], permisos: [] } });
    setContrasena('');
    navegar('/bienvenido', { replace: true });
  }
  return <MarcoAcceso>
    <div className="ac-titulo"><p className="ac-antetitulo">TU TIERRA, DESDE OTRA PERSPECTIVA</p><h1>Inicia sesión</h1><p>Bienvenido de nuevo. Tu próxima decisión<br className="ac-salto" /> empieza con una mejor perspectiva.</p></div>
    <form ref={formulario} className="ac-formulario" noValidate onSubmit={(e) => {
      e.preventDefault();
      const nuevos = validarInicio(correo, contrasena); setErrores(nuevos); setMensaje('');
      if (Object.keys(nuevos).length) { requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()); return; }
      setContrasena('');
      setMensaje('El acceso a tu cuenta aún no está habilitado. Puedes explorar la demostración sin ingresar credenciales.');
    }}>
      <CampoAcceso id="login-correo" etiqueta="Correo electrónico" icono="correo" type="email" autoComplete="username" placeholder="tu@correo.com" maxLength={254} value={correo} onChange={(e) => { setCorreo(e.target.value); setErrores((prev) => ({ ...prev, correo: undefined })); setMensaje(''); }} error={errores.correo} required />
      <CampoAcceso id="login-clave" etiqueta="Contraseña" icono="candado" type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" maxLength={128} value={contrasena} onChange={(e) => { setContrasena(e.target.value); setErrores((prev) => ({ ...prev, contrasena: undefined })); setMensaje(''); }} error={errores.contrasena} required />
      <div className="ac-enlaces-formulario"><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></div>
      {mensaje && <p className="ac-mensaje" role="status">{mensaje}</p>}
      <button className="ac-primario" type="submit">Entrar <Icono nombre="flecha" /></button>
    </form>
    <p className="ac-alternativa">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    <div className="ac-demo"><span>¿Quieres conocer SEMA?</span><button className="ac-boton-demo" type="button" onClick={explorar}>Explorar demostración <Icono nombre="flecha" /></button><p>Sin cuenta ni contraseñas. El acceso real se habilitará próximamente.</p></div>
  </MarcoAcceso>;
}
