import { NavLink } from 'react-router-dom';

const enlaces = [
  { ruta: '/mi-finca', texto: 'Mi finca', numero: '02' },
  { ruta: '/mapa', texto: 'Mapa satelital', numero: '03' },
];

export default function Sidebar() {
  return (
    <aside className="barra-lateral">
      <nav aria-label="Navegación de territorios">
        {enlaces.map(({ ruta, texto, numero }) => (
          <NavLink key={ruta} to={ruta} className={({ isActive }) => isActive ? 'enlace-nav activo' : 'enlace-nav'}>
            <span aria-hidden="true">{numero}</span>{texto}
          </NavLink>
        ))}
      </nav>
      <p className="nota-lateral">Selecciona la ubicación en Mi finca y continúa al mapa para dibujar el terreno.</p>
    </aside>
  );
}
