import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import InicioSesion from './features/acceso/InicioSesion';
import RegistroUsuario from './features/acceso/RegistroUsuario';
import RecuperarContrasena from './features/acceso/RecuperarContrasena';
import Bienvenida from './features/acceso/Bienvenida';
import type { SesionAcceso } from './features/acceso/types';
import { useAnalisisAmbiental } from './features/analisis-ambiental/hooks/useAnalisisAmbiental';
import { leerReglasLocales, guardarReglasLocales } from './features/riesgos/services/reglasLocal';
import type { ReglaRiesgo } from './types/ambiental';
import type { BorradorFinca } from './types/finca';

const AnalisisClimatico = lazy(() => import('./features/analisis-ambiental/AnalisisClimatico'));
const DatosHistoricos = lazy(() => import('./features/analisis-ambiental/DatosHistoricos'));
const RiesgosAlertas = lazy(() => import('./features/riesgos/RiesgosAlertas'));
const MiFinca = lazy(() => import('./features/territorios/MiFinca'));
const MapaSatelital = lazy(() => import('./features/territorios/MapaSatelital'));

const CLAVE_FINCA_LOCAL = 'sema-finca-ambiental-v1';

function leerFincaLocal(): BorradorFinca | null {
  try {
    const contenido = localStorage.getItem(CLAVE_FINCA_LOCAL);
    if (!contenido) return null;
    const valor: unknown = JSON.parse(contenido);
    if (typeof valor !== 'object' || valor === null || !('nombre' in valor) || !('ubicacion' in valor)) return null;
    const nombre = valor.nombre;
    const ubicacion = valor.ubicacion;
    if (typeof nombre !== 'string' || typeof ubicacion !== 'object' || ubicacion === null
      || !('latitud' in ubicacion) || !('longitud' in ubicacion)
      || typeof ubicacion.latitud !== 'number' || typeof ubicacion.longitud !== 'number'
      || !Number.isFinite(ubicacion.latitud) || !Number.isFinite(ubicacion.longitud)
      || ubicacion.latitud < -90 || ubicacion.latitud > 90
      || ubicacion.longitud < -180 || ubicacion.longitud > 180) return null;

    return {
      nombre,
      ubicacion: { latitud: ubicacion.latitud, longitud: ubicacion.longitud },
      ...('pais' in valor && typeof valor.pais === 'string' ? { pais: valor.pais } : {}),
      ...('region' in valor && typeof valor.region === 'string' ? { region: valor.region } : {}),
      ...('municipio' in valor && typeof valor.municipio === 'string' ? { municipio: valor.municipio } : {}),
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [borrador, setBorrador] = useState<BorradorFinca | null>(leerFincaLocal);
  const [sesion, setSesion] = useState<SesionAcceso | null>(null);
  const [reglasRiesgo, setReglasRiesgo] = useState<ReglaRiesgo[]>(leerReglasLocales);
  const analisisAmbiental = useAnalisisAmbiental(borrador, sesion !== null);

  function salir() {
    setSesion(null);
    setBorrador(null);
  }

  useEffect(() => {
    try {
      if (!borrador) {
        localStorage.removeItem(CLAVE_FINCA_LOCAL);
        return;
      }
      localStorage.setItem(CLAVE_FINCA_LOCAL, JSON.stringify({
        nombre: borrador.nombre,
        pais: borrador.pais,
        region: borrador.region,
        municipio: borrador.municipio,
        ubicacion: borrador.ubicacion,
      }));
    } catch {
      // La selección en memoria sigue disponible si el navegador bloquea localStorage.
    }
  }, [borrador]);

  useEffect(() => guardarReglasLocales(reglasRiesgo), [reglasRiesgo]);

  return (
    <Suspense fallback={<div className="pagina" role="status">Preparando tu espacio de trabajo…</div>}>
      <Routes>
        <Route index element={<Navigate to={sesion ? '/bienvenido' : '/login'} replace />} />
        <Route path="login" element={sesion ? <Navigate to="/bienvenido" replace /> : <InicioSesion onIniciar={setSesion} />} />
        <Route path="registro" element={sesion ? <Navigate to="/bienvenido" replace /> : <RegistroUsuario />} />
        <Route path="recuperar-contrasena" element={sesion ? <Navigate to="/bienvenido" replace /> : <RecuperarContrasena />} />
        <Route path="bienvenido" element={sesion ? <Bienvenida sesion={sesion} onSalir={salir} /> : <Navigate to="/login" replace />} />
        <Route element={sesion
          ? <MainLayout onSalir={salir} demostracion={sesion.origen === 'demostracion'} />
          : <Navigate to="/login" replace />}>
          <Route path="mi-finca" element={<MiFinca borrador={borrador} onSeleccionar={setBorrador} />} />
          <Route path="mapa" element={<MapaSatelital borrador={borrador} onActualizar={setBorrador} />} />
          <Route path="analisis-climatico" element={
            <AnalisisClimatico borrador={borrador} disponible={analisisAmbiental.disponible}
              reglasRiesgo={reglasRiesgo}
              cargando={analisisAmbiental.cargando} error={analisisAmbiental.error}
              onConsultar={analisisAmbiental.consultar} />
          } />
          <Route path="riesgos-alertas" element={
            <RiesgosAlertas disponible={analisisAmbiental.disponible} reglas={reglasRiesgo}
              onAgregarRegla={(regla) => setReglasRiesgo((actuales) => [...actuales, regla])}
              onEliminarRegla={(id) => setReglasRiesgo((actuales) => actuales.filter((regla) => regla.id !== id))} />
          } />
          <Route path="datos-historicos" element={<DatosHistoricos disponible={analisisAmbiental.disponible} />} />
        </Route>
        <Route path="*" element={<Navigate to={sesion ? '/bienvenido' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}
