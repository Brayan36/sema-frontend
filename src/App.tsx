import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';

import Inicio from './features/inicio/Inicio';
import RotacionCultivos from './features/rotacion-cultivos/RotacionCultivos';
import { adaptarClimaAgricola } from './features/rotacion-cultivos/adaptadorClimatico';
import AcercaDeNosotros from './features/acerca-de-nosotros/AcercaDeNosotros';

import RegistroUsuario from './features/acceso/RegistroUsuario';
import InicioSesion from './features/acceso/InicioSesion';
import RecuperarContrasena from './features/acceso/RecuperarContrasena';
import Bienvenida from './features/acceso/Bienvenida';
import { demostracionHabilitada, useAutenticacion } from './features/acceso/useAutenticacion';

import { useAnalisisAmbiental } from './features/analisis-ambiental/hooks/useAnalisisAmbiental';

import {
  guardarReglasLocales,
  leerReglasLocales,
} from './features/riesgos/services/reglasLocal';

import type { BorradorFinca } from './types/finca';
import type { ReglaRiesgo } from './types/ambiental';

const AnalisisClimatico = lazy(
  () => import('./features/analisis-ambiental/AnalisisClimatico')
);

const DatosHistoricos = lazy(
  () => import('./features/analisis-ambiental/DatosHistoricos')
);

const RiesgosAlertas = lazy(
  () => import('./features/riesgos/RiesgosAlertas')
);

const MiFinca = lazy(
  () => import('./features/territorios/MiFinca')
);

const MapaSatelital = lazy(
  () => import('./features/territorios/MapaSatelital')
);

const CLAVE_FINCA_LOCAL = 'sema-finca-ambiental-v1';

function leerFincaLocal(): BorradorFinca | null {
  try {
    const contenido = localStorage.getItem(CLAVE_FINCA_LOCAL);

    if (!contenido) return null;

    const valor: unknown = JSON.parse(contenido);

    if (
      typeof valor !== 'object' ||
      valor === null ||
      !('nombre' in valor) ||
      !('ubicacion' in valor)
    ) {
      return null;
    }

    const nombre = valor.nombre;
    const ubicacion = valor.ubicacion;

    if (
      typeof nombre !== 'string' ||
      typeof ubicacion !== 'object' ||
      ubicacion === null ||
      !('latitud' in ubicacion) ||
      !('longitud' in ubicacion) ||
      typeof ubicacion.latitud !== 'number' ||
      typeof ubicacion.longitud !== 'number' ||
      !Number.isFinite(ubicacion.latitud) ||
      !Number.isFinite(ubicacion.longitud) ||
      ubicacion.latitud < -90 ||
      ubicacion.latitud > 90 ||
      ubicacion.longitud < -180 ||
      ubicacion.longitud > 180
    ) {
      return null;
    }

    return {
      nombre,
      ubicacion: {
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
      },
      ...(
        'pais' in valor && typeof valor.pais === 'string'
          ? { pais: valor.pais }
          : {}
      ),
      ...(
        'region' in valor && typeof valor.region === 'string'
          ? { region: valor.region }
          : {}
      ),
      ...(
        'municipio' in valor && typeof valor.municipio === 'string'
          ? { municipio: valor.municipio }
          : {}
      ),
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [borrador, setBorrador] = useState<BorradorFinca | null>(
    leerFincaLocal
  );

  const limpiarDatosSesion = useCallback(() => setBorrador(null), []);
  const autenticacion = useAutenticacion(limpiarDatosSesion);
  const { sesion } = autenticacion;

  const [reglasRiesgo, setReglasRiesgo] = useState<ReglaRiesgo[]>(
    leerReglasLocales
  );

  const {
    disponible,
    cargando,
    error,
    consultar,
  } = useAnalisisAmbiental(borrador, sesion !== null);

  const climaAgricola = adaptarClimaAgricola(disponible);

  function salir() {
    autenticacion.salir();
  }

  useEffect(() => {
    try {
      if (!borrador) {
        localStorage.removeItem(CLAVE_FINCA_LOCAL);
        return;
      }

      localStorage.setItem(
        CLAVE_FINCA_LOCAL,
        JSON.stringify({
          nombre: borrador.nombre,
          pais: borrador.pais,
          region: borrador.region,
          municipio: borrador.municipio,
          ubicacion: borrador.ubicacion,
        })
      );
    } catch {
      // Mantener la selección en memoria si localStorage falla.
    }
  }, [borrador]);

  useEffect(() => {
    guardarReglasLocales(reglasRiesgo);
  }, [reglasRiesgo]);

  function agregarRegla(regla: ReglaRiesgo) {
    setReglasRiesgo((anteriores) => [
      ...anteriores.filter((item) => item.id !== regla.id),
      regla,
    ]);
  }

  function eliminarRegla(id: string) {
    setReglasRiesgo((anteriores) =>
      anteriores.filter((regla) => regla.id !== id)
    );
  }

  if (autenticacion.comprobando) {
    return <div className="pagina" role="status">Validando tu sesión con el servidor…</div>;
  }

  if (autenticacion.errorRestauracion) {
    return (
      <div className="pagina">
        <h1>No pudimos validar tu sesión</h1>
        <p role="alert">{autenticacion.errorRestauracion}</p>
        <button className="boton" onClick={autenticacion.reintentar}>Reintentar</button>
        {' '}
        <button onClick={salir}>Volver al acceso</button>
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Cargando módulo...</p>}>
      <Routes>
        {/* Página de inicio */}
        <Route path="/" element={<Inicio />} />

        {/* Acceso de usuarios */}
        <Route
          path="/registro"
          element={sesion ? <Navigate to="/bienvenido" replace /> : <RegistroUsuario />}
        />

        <Route
          path="/login"
          element={
            sesion ? (
              <Navigate to="/bienvenido" replace />
            ) : (
              <InicioSesion
                aviso={autenticacion.mensaje}
                onIniciar={async (correo, clave) => {
                  setBorrador(null);
                  await autenticacion.iniciarSesion(correo, clave);
                }}
                onExplorar={demostracionHabilitada ? () => {
                  setBorrador(null);
                  autenticacion.explorar();
                } : undefined}
              />
            )
          }
        />

        <Route
          path="/recuperar-contrasena"
          element={sesion ? <Navigate to="/bienvenido" replace /> : <RecuperarContrasena />}
        />

        <Route
          path="/bienvenido"
          element={
            sesion ? (
              <Bienvenida
                sesion={sesion}
                onSalir={salir}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Plataforma agrícola */}
        <Route
          element={sesion ? (
            <MainLayout
              onSalir={salir}
              demostracion={sesion.origen === 'demostracion'}
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        >
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
              <DatosHistoricos
                disponible={disponible}
              />
            }
          />

          <Route
            path="rotacion-cultivos"
            element={
              <RotacionCultivos
                finca={borrador}
                clima={climaAgricola}
              />
            }
          />

        </Route>

        <Route
          path="/acerca-de-nosotros"
          element={<AcercaDeNosotros />}
        />

        {/* Rutas desconocidas */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
}
