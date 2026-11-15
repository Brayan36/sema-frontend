import { NavLink } from 'react-router-dom';

const enlaces = [
  { ruta: '/mi-finca', texto: 'Mi finca', numero: '02' },
  { ruta: '/mapa', texto: 'Mapa satelital', numero: '03' },
  { ruta: '/analisis-climatico', texto: 'Análisis climático y suelo', numero: '04' },
  { ruta: '/riesgos-alertas', texto: 'Riesgos y alertas', numero: '05' },
  { ruta: '/datos-historicos', texto: 'Datos históricos', numero: '06' },
];

export default function Sidebar() {
  return (
    <aside className="barra-lateral">
      <nav aria-label="Navegación principal">
        {enlaces.map(({ ruta, texto, numero }) => (
          <NavLink key={ruta} to={ruta} className={({ isActive }) => isActive ? 'enlace-nav activo' : 'enlace-nav'}>
            <span aria-hidden="true">{numero}</span>{texto}
          </NavLink>
        ))}
      </nav>
      <p className="nota-lateral">Define tu finca y su contorno para consultar el análisis ambiental y configurar indicadores.</p>
    </aside>
  );
}
