import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import MarcaSema from './components/MarcaSema';
import Icono from './components/Icono';
import type { SesionAcceso } from './types';
import useTituloAcceso from './useTituloAcceso';
import './bienvenida.css';
import './acceso.css';

type Props = { sesion: SesionAcceso; onSalir: () => void };
export default function Bienvenida({ sesion, onSalir }: Props) {
  useTituloAcceso('Bienvenido');
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [avisosAbiertos, setAvisosAbiertos] = useState(false);
  const navegar = useNavigate();
  return <div className="bv-pagina">
    <aside className="bv-lateral">
      <Link to="/bienvenido" className="bv-logo" aria-label="SEMA, bienvenida"><MarcaSema pequena /></Link>
      <p className="bv-menu-titulo">TU ESPACIO DE TRABAJO</p>
      <nav aria-label="Navegación de SEMA" className="bv-navegacion">
        <NavLink to="/bienvenido"><Icono nombre="inicio" />Inicio</NavLink>
        <NavLink to="/mi-finca"><Icono nombre="usuario" />Mi finca</NavLink>
        <NavLink to="/mapa"><Icono nombre="mapa" />Mapa</NavLink>
        <span className="bv-grupo-futuro">PRÓXIMAMENTE</span>
        <span className="bv-nav-pendiente"><Icono nombre="analisis" />Análisis</span>
        <span className="bv-nav-pendiente"><Icono nombre="rotacion" />Rotación</span>
        <span className="bv-nav-pendiente"><Icono nombre="alertas" />Alertas</span>
        <span className="bv-nav-pendiente"><Icono nombre="informes" />Reportes</span>
      </nav>
      <div className="bv-lateral-pie"><span className="bv-punto" /><span>Una mirada global.<br /><strong>Un impacto local.</strong></span></div>
    </aside>
    <div className="bv-cuerpo">
      <header className="bv-cabecera"><div><span className="bv-miga">Plataforma SEMA</span><span className="bv-separador">/</span><strong>Inicio</strong></div><div className="bv-acciones">
        <div className="bv-menu-contenedor"><button type="button" className="bv-boton-icono" aria-label="Notificaciones" aria-expanded={avisosAbiertos} aria-controls="bv-notificaciones" onClick={() => { setAvisosAbiertos(!avisosAbiertos); setPerfilAbierto(false); }}><Icono nombre="campana" /></button>{avisosAbiertos && <div className="bv-desplegable" id="bv-notificaciones"><strong>Notificaciones</strong><p>Las notificaciones estarán disponibles al integrar los módulos del equipo.</p></div>}</div>
        <span className="bv-barra" />
        <div className="bv-menu-contenedor"><button type="button" className="bv-perfil" aria-label="Abrir opciones de la sesión" aria-expanded={perfilAbierto} aria-controls="bv-perfil" onClick={() => { setPerfilAbierto(!perfilAbierto); setAvisosAbiertos(false); }}><span className="bv-avatar">{sesion.usuario.nombre[0]?.toUpperCase() ?? 'S'}</span><span className="bv-perfil-texto">{sesion.usuario.nombre}<small>{sesion.origen === 'demostracion' ? 'Vista previa' : 'Mi cuenta'}</small></span></button>{perfilAbierto && <div className="bv-desplegable" id="bv-perfil"><strong>{sesion.usuario.nombre}</strong>{sesion.usuario.correo && <p>{sesion.usuario.correo}</p>}<button type="button" onClick={() => { onSalir(); navegar('/login', { replace: true }); }}><Icono nombre="salir" />{sesion.origen === 'demostracion' ? 'Salir de la demostración' : 'Cerrar sesión'}</button></div>}</div>
      </div></header>
      <main className="bv-principal" id="bienvenida-principal">
        {sesion.origen === 'demostracion' && <div className="bv-demo"><span>VISTA PREVIA</span><p>Estás explorando SEMA sin iniciar una sesión real. Los roles y permisos se conectarán con el servicio de usuarios.</p><button type="button" onClick={() => { onSalir(); navegar('/login', { replace: true }); }}>Salir</button></div>}
        <section className="bv-hero" aria-labelledby="bv-titulo"><div className="bv-hero-contenido"><span className="bv-antetitulo"><span /> DEL ESPACIO A TU TIERRA</span><h1 id="bv-titulo">Bienvenido a SEMA <span className="bv-saludo" aria-label="hola">👋</span></h1><p>Monitorea, analiza y planifica tu producción<br className="bv-salto" /> con una nueva perspectiva de nuestro planeta.</p><Link to="/mi-finca" className="bv-boton-hero">Conocer mi territorio <Icono nombre="flecha" /></Link></div><div className="bv-hero-etiqueta"><span /> OBSERVACIÓN TERRESTRE</div></section>
        <section className="bv-accesos" aria-label="Herramientas de SEMA">
          <Link to="/mapa" className="bv-tarjeta bv-tarjeta-enlace"><span className="bv-icono-herramienta bv-azul"><Icono nombre="mapa" /></span><h2>Analizar mi zona</h2><p>Ubica y explora tu terreno.</p><span className="bv-tarjeta-pie">Explorar mapa <Icono nombre="flecha" /></span></Link>
          <article className="bv-tarjeta"><span className="bv-icono-herramienta bv-verde"><Icono nombre="rotacion" /></span><h2>Rotación de cultivos</h2><p>Compara alternativas para tu tierra.</p><span className="bv-pendiente">Próximamente</span></article>
          <article className="bv-tarjeta"><span className="bv-icono-herramienta bv-rojo"><Icono nombre="alertas" /></span><h2>Riesgos y alertas</h2><p>Comprende los retos de tu cultivo.</p><span className="bv-pendiente">Próximamente</span></article>
          <article className="bv-tarjeta"><span className="bv-icono-herramienta bv-azul"><Icono nombre="informes" /></span><h2>Reportes</h2><p>Tus resultados en un solo lugar.</p><span className="bv-pendiente">Próximamente</span></article>
        </section>
        <section className="bv-primer-paso"><div><span className="bv-antetitulo">COMIENZA POR LO QUE CONOCES</span><h2>Todo empieza en tu finca.</h2><p>Selecciona tu ubicación, dibuja tu terreno y explora las imágenes disponibles para tu zona.</p><Link to="/mi-finca" className="bv-enlace-paso">Ubicar mi finca <Icono nombre="flecha" /></Link></div><div className="bv-pasos"><span><b>01</b>Selecciona tu ubicación</span><span><b>02</b>Dibuja el contorno</span><span><b>03</b>Explora tu territorio</span></div></section>
        <footer className="bv-pie"><span>SEMA · Sistema Espacial de Monitoreo Agrícola</span><span>Una agricultura con más perspectiva.</span></footer>
      </main>
    </div>
  </div>;
}
