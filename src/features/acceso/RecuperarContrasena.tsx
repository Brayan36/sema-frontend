import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MarcoAcceso from './components/MarcoAcceso';
import CampoAcceso from './components/CampoAcceso';
import Icono from './components/Icono';
import { validarCorreo } from './validaciones';
import useTituloAcceso from './useTituloAcceso';

export default function RecuperarContrasena() {
  useTituloAcceso('Recupera tu acceso');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState<string>();
  const [listo, setListo] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  return <MarcoAcceso>
    <div className="ac-insignia"><Icono nombre="candado" /></div>
    <div className="ac-titulo"><p className="ac-antetitulo">VOLVAMOS A CONECTAR</p><h1>Recupera tu acceso</h1><p>Ingresa el correo asociado a tu cuenta para solicitar instrucciones de recuperación.</p></div>
    <form ref={formulario} className="ac-formulario" noValidate onSubmit={(e) => {
      e.preventDefault(); const nuevo = validarCorreo(correo); setError(nuevo); setListo(false);
      if (nuevo) { formulario.current?.querySelector('input')?.focus(); return; }
      setListo(true);
    }}>
      <CampoAcceso id="recuperacion-correo" etiqueta="Correo electrónico" icono="correo" type="email" autoComplete="email" maxLength={254} placeholder="tu@correo.com" value={correo} onChange={(e) => { setCorreo(e.target.value); setError(undefined); setListo(false); }} error={error} required />
      {listo && <p className="ac-mensaje" role="status">El correo tiene un formato válido. Todavía no se envió ningún mensaje: la recuperación se habilitará próximamente.</p>}
      <button className="ac-primario" type="submit">Solicitar recuperación <Icono nombre="flecha" /></button>
    </form>
    <p className="ac-alternativa"><Link to="/login">← Volver a iniciar sesión</Link></p>
    <div className="ac-nota-recuperacion"><Icono nombre="correo" /><p>Cuando el servicio esté habilitado, recibirás las instrucciones por correo si existe una cuenta asociada.</p></div>
  </MarcoAcceso>;
}
