import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AnalisisClimatico from './features/analisis-ambiental/AnalisisClimatico';
import DatosHistoricos from './features/analisis-ambiental/DatosHistoricos';
import { useAnalisisAmbiental } from './features/analisis-ambiental/hooks/useAnalisisAmbiental';
import RiesgosAlertas from './features/riesgos/RiesgosAlertas';
import { leerReglasLocales, guardarReglasLocales } from './features/riesgos/services/reglasLocal';
import MiFinca from './features/territorios/MiFinca';
import MapaSatelital from './features/territorios/MapaSatelital';
import type { ReglaRiesgo } from './types/ambiental';
import type { BorradorFinca } from './types/finca';

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
  const [reglasRiesgo, setReglasRiesgo] = useState<ReglaRiesgo[]>(leerReglasLocales);
  const analisisAmbiental = useAnalisisAmbiental(borrador);

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
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/mi-finca" replace />} />
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
        <Route path="*" element={<Navigate to="/mi-finca" replace />} />
      </Route>
    </Routes>
  );
}
