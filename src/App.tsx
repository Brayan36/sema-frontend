import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import InicioSesion from './features/acceso/InicioSesion';
import RegistroUsuario from './features/acceso/RegistroUsuario';
import RecuperarContrasena from './features/acceso/RecuperarContrasena';
import Bienvenida from './features/acceso/Bienvenida';
import type { SesionAcceso } from './features/acceso/types';
import type { BorradorFinca } from './types/finca';

const MiFinca = lazy(() => import('./features/territorios/MiFinca'));
const MapaSatelital = lazy(() => import('./features/territorios/MapaSatelital'));

export default function App() {
  const [borrador, setBorrador] = useState<BorradorFinca | null>(null);
  const [sesion, setSesion] = useState<SesionAcceso | null>(null);
  function salir() { setSesion(null); setBorrador(null); }

  return (
    <Suspense fallback={<div className="pagina" role="status">Preparando tu espacio de trabajo…</div>}>
    <Routes>
      <Route index element={<Navigate to={sesion ? '/bienvenido' : '/login'} replace />} />
      <Route path="login" element={sesion ? <Navigate to="/bienvenido" replace /> : <InicioSesion onIniciar={setSesion} />} />
      <Route path="registro" element={sesion ? <Navigate to="/bienvenido" replace /> : <RegistroUsuario />} />
      <Route path="recuperar-contrasena" element={sesion ? <Navigate to="/bienvenido" replace /> : <RecuperarContrasena />} />
      <Route path="bienvenido" element={sesion ? <Bienvenida sesion={sesion} onSalir={salir} /> : <Navigate to="/login" replace />} />
      <Route element={sesion ? <MainLayout onSalir={salir} demostracion={sesion.origen === 'demostracion'} /> : <Navigate to="/login" replace />}>
        <Route path="mi-finca" element={<MiFinca borrador={borrador} onSeleccionar={setBorrador} />} />
        <Route path="mapa" element={<MapaSatelital borrador={borrador} onActualizar={setBorrador} />} />
      </Route>
      <Route path="*" element={<Navigate to={sesion ? '/bienvenido' : '/login'} replace />} />
    </Routes>
    </Suspense>
  );
}
