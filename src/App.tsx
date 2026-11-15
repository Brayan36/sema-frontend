import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import MiFinca from './features/territorios/MiFinca';
import MapaSatelital from './features/territorios/MapaSatelital';

import Inicio from './features/inicio/Inicio';
import RotacionCultivos from './features/rotacion-cultivos/RotacionCultivos';
import { adaptarClimaAgricola } from './features/rotacion-cultivos/adaptadorClimatico';
import AcercaDeNosotros from './features/acerca-de-nosotros/AcercaDeNosotros';

import AnalisisClimatico from './features/analisis-ambiental/AnalisisClimatico';
import DatosHistoricos from './features/analisis-ambiental/DatosHistoricos';
import RiesgosAlertas from './features/riesgos/RiesgosAlertas';

import RegistroUsuario from './features/acceso/RegistroUsuario';
import InicioSesion from './features/acceso/InicioSesion';
import RecuperarContrasena from './features/acceso/RecuperarContrasena';
import Bienvenida from './features/acceso/Bienvenida';

import { useAnalisisAmbiental } from './features/analisis-ambiental/hooks/useAnalisisAmbiental';

import {
  guardarReglasLocales,
  leerReglasLocales,
} from './features/riesgos/services/reglasLocal';

import type { BorradorFinca } from './types/finca';
import type { ReglaRiesgo } from './types/ambiental';
import type { SesionAcceso } from './features/acceso/types';

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

  const [sesion, setSesion] = useState<SesionAcceso | null>(null);

  const [reglasRiesgo, setReglasRiesgo] = useState<ReglaRiesgo[]>(
    () => leerReglasLocales()
  );

  const {
    disponible,
    cargando,
    error,
    consultar,
  } = useAnalisisAmbiental(borrador);

  // Conectar los datos climáticos con el módulo agrícola.
  const climaAgricola = adaptarClimaAgricola(disponible);

  function agregarRegla(regla: ReglaRiesgo) {
    setReglasRiesgo((anteriores) => {
      const actualizadas = [
        ...anteriores.filter((item) => item.id !== regla.id),
        regla,
      ];

      guardarReglasLocales(actualizadas);
      return actualizadas;
    });
  }

  function eliminarRegla(id: string) {
    setReglasRiesgo((anteriores) => {
      const actualizadas = anteriores.filter(
        (regla) => regla.id !== id
      );

      guardarReglasLocales(actualizadas);
      return actualizadas;
    });
  }

  return (
    <Routes>
      {/* Portada original a pantalla completa */}
      <Route path="/" element={<Inicio />} />

      {/* Acceso y registro de Anderson */}
      <Route
        path="/registro"
        element={<RegistroUsuario />}
      />

      <Route
        path="/login"
        element={<InicioSesion onIniciar={setSesion} />}
      />

      <Route
        path="/recuperar-contrasena"
        element={<RecuperarContrasena />}
      />

      {/* Bienvenida de demostración */}
      <Route
        path="/bienvenido"
        element={
          sesion ? (
            <Bienvenida
              sesion={sesion}
              onSalir={() => setSesion(null)}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Plataforma agrícola */}
      <Route element={<MainLayout />}>
        <Route
          path="mi-finca"
          element={
            <MiFinca
              borrador={borrador}
              onSeleccionar={setBorrador}
            />
          }
        />

        <Route
          path="mapa"
          element={
            <MapaSatelital
              borrador={borrador}
              onActualizar={setBorrador}
            />
          }
        />

        <Route
          path="analisis-climatico"
          element={
            <AnalisisClimatico
              borrador={borrador}
              disponible={disponible}
              reglasRiesgo={reglasRiesgo}
              cargando={cargando}
              error={error}
              onConsultar={consultar}
            />
          }
        />

        <Route
          path="riesgos-alertas"
          element={
            <RiesgosAlertas
              disponible={disponible}
              reglas={reglasRiesgo}
              onAgregarRegla={agregarRegla}
              onEliminarRegla={eliminarRegla}
            />
          }
        />

        <Route
          path="datos-historicos"
          element={
            <DatosHistoricos disponible={disponible} />
          }
        />

        {/* Rotación conectada con finca y clima */}
        <Route
          path="rotacion-cultivos"
          element={
            <RotacionCultivos
              finca={borrador}
              clima={climaAgricola}
            />
          }
        />

        <Route
          path="acerca-de-nosotros"
          element={<AcercaDeNosotros />}
        />
      </Route>

      {/* Direcciones desconocidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}