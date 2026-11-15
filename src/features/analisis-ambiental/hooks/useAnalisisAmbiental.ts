import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalisisDisponible, ConsultaHistoricaAmbiental } from '../../../types/ambiental';
import type { BorradorFinca } from '../../../types/finca';
import { cargarAnalisisHistorico, sincronizarAnalisisPendientes } from '../services/cargarAnalisis';
import { obtenerUltimoAnalisisLocal } from '../services/cacheLocal';

export function useAnalisisAmbiental(borrador: BorradorFinca | null) {
  const [estado, setEstado] = useState<{
    claveUbicacion: string;
    disponible: AnalisisDisponible | null;
    cargando: boolean;
    error: string | null;
  } | null>(null);
  const controladorActual = useRef<AbortController | null>(null);

  const latitud = borrador?.ubicacion.latitud;
  const longitud = borrador?.ubicacion.longitud;
  const claveUbicacion = latitud === undefined || longitud === undefined
    ? 'sin-ubicacion'
    : `${latitud}|${longitud}`;

  useEffect(() => {
    controladorActual.current?.abort();
    controladorActual.current = null;
  }, [claveUbicacion]);

  useEffect(() => {
    let vigente = true;
    const restaurarAnalisisLocal = async () => {
      if (navigator.onLine || controladorActual.current
        || latitud === undefined || longitud === undefined) return;
      setEstado((anterior) => ({
        claveUbicacion,
        disponible: anterior?.claveUbicacion === claveUbicacion ? anterior.disponible : null,
        cargando: true,
        error: null,
      }));
      try {
        const copia = await obtenerUltimoAnalisisLocal({ latitud, longitud });
        if (!vigente) return;
        setEstado({
          claveUbicacion,
          disponible: copia ? {
            analisis: copia.analisis,
            fuente: 'cache-local',
            cacheVencida: copia.vencido,
            avisos: [copia.vencido
              ? 'Se restauró la última copia de este dispositivo; superó su vigencia de siete días.'
              : 'Se restauró la última consulta guardada en este dispositivo.'],
          } : null,
          cargando: false,
          error: copia ? null : 'Sin conexión y sin análisis guardado para esta ubicación en este dispositivo.',
        });
      } catch (causa) {
        if (!vigente) return;
        setEstado({
          claveUbicacion,
          disponible: null,
          cargando: false,
          error: causa instanceof Error ? causa.message : 'No se pudo recuperar la copia local.',
        });
      }
    };
    function reintentarEnviosPendientes() {
      void sincronizarAnalisisPendientes().catch(() => undefined);
    }
    if (navigator.onLine) reintentarEnviosPendientes();
    else void restaurarAnalisisLocal();
    window.addEventListener('online', reintentarEnviosPendientes);
    window.addEventListener('offline', restaurarAnalisisLocal);
    return () => {
      vigente = false;
      window.removeEventListener('online', reintentarEnviosPendientes);
      window.removeEventListener('offline', restaurarAnalisisLocal);
    };
  }, [claveUbicacion, latitud, longitud]);

  useEffect(() => () => controladorActual.current?.abort(), []);

  const consultar = useCallback(async (periodo: Omit<ConsultaHistoricaAmbiental, 'ubicacion'>) => {
    if (!borrador) {
      setEstado({ claveUbicacion, disponible: null, cargando: false, error: 'Primero selecciona la ubicación de la finca.' });
      return;
    }

    controladorActual.current?.abort();
    const controlador = new AbortController();
    controladorActual.current = controlador;
    setEstado((anterior) => ({
      claveUbicacion,
      disponible: anterior?.claveUbicacion === claveUbicacion ? anterior.disponible : null,
      cargando: true,
      error: null,
    }));
    try {
      const resultado = await cargarAnalisisHistorico(
        { ...periodo, ubicacion: borrador.ubicacion },
        { signal: controlador.signal },
      );
      if (!controlador.signal.aborted) {
        setEstado({ claveUbicacion, disponible: resultado, cargando: false, error: null });
      }
    } catch (causa) {
      if (!controlador.signal.aborted) {
        setEstado((anterior) => ({
          claveUbicacion,
          disponible: anterior?.claveUbicacion === claveUbicacion ? anterior.disponible : null,
          cargando: false,
          error: causa instanceof Error ? causa.message : 'No se pudo cargar el análisis ambiental.',
        }));
      }
    } finally {
      if (controladorActual.current === controlador) {
        controladorActual.current = null;
        setEstado((anterior) => anterior?.claveUbicacion === claveUbicacion
          ? { ...anterior, cargando: false }
          : anterior);
      }
    }
  }, [borrador, claveUbicacion]);

  const estadoActual = estado?.claveUbicacion === claveUbicacion
    ? estado
    : { disponible: null, cargando: false, error: null };
  return { ...estadoActual, consultar };
}
