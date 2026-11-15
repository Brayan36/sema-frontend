import { NavLink } from 'react-router-dom';

const enlaces = [
  { ruta: '/', texto: 'Inicio', icono: '⌂' },
  { ruta: '/mi-finca', texto: 'Mi finca', icono: '🌱' },
  { ruta: '/mapa', texto: 'Mapa satelital', icono: '🗺️' },
  { ruta: '/analisis-climatico', texto: 'Análisis climático', icono: '☀️' },
  { ruta: '/riesgos-alertas', texto: 'Riesgos y alertas', icono: '⚠️' },
  { ruta: '/datos-historicos', texto: 'Datos históricos', icono: '📊' },
  { ruta: '/rotacion-cultivos', texto: 'Rotación de cultivos', icono: '🔄' },
  { ruta: '/acerca-de-nosotros', texto: 'Acerca de nosotros', icono: 'ⓘ' },
];

export default function Sidebar() {
  return (
    <aside className="barra-lateral">
      <nav aria-label="Navegación principal de SEMA">
        {enlaces.map(({ ruta, texto, icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === '/'}
            className={({ isActive }) =>
              isActive ? 'enlace-nav activo' : 'enlace-nav'
            }
          >
            <span aria-hidden="true">{icono}</span>
            {texto}
          </NavLink>
        ))}
      </nav>

      <p className="nota-lateral">
        Explora tu finca, consulta información ambiental
        y evalúa opciones de rotación de cultivos.
      </p>
    </aside>
  );
}