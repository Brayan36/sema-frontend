import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ onSalir, demostracion }: { onSalir: () => void; demostracion: boolean }) {
  return (
    <>
      <a className="saltar-contenido" href="#contenido-principal">Saltar al contenido</a>
      <Header onSalir={onSalir} demostracion={demostracion} />
      <div className="estructura-sema">
        <Sidebar />
        <main id="contenido-principal" className="contenido-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
