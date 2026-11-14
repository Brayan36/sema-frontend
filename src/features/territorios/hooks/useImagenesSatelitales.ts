import { useEffect, useRef, useState } from 'react';
import type { CapaSatelital, FiltrosImagenes, TeselasSatelitales } from '../../../types/capas';
import type { Ubicacion } from '../../../types/finca';
import { buscarImagenes, obtenerTeselas } from '../services/imagenesSatelitales';

type Estado = {
  capas: CapaSatelital[];
  seleccionada: CapaSatelital | null;
  teselas: TeselasSatelitales | null;
  cargando: 'busqueda' | 'imagen' | null;
  consultado: boolean;
  error: string;
};
const inicial: Estado = { capas: [], seleccionada: null, teselas: null, cargando: null, consultado: false, error: '' };

export function useImagenesSatelitales() {
  const [estado, setEstado] = useState<Estado>(inicial);
  const solicitud = useRef<AbortController | null>(null);
  useEffect(() => () => solicitud.current?.abort(), []);

  function reiniciar() {
    solicitud.current?.abort();
    setEstado(inicial);
  }

  async function buscar(ubicacion: Ubicacion, filtros: FiltrosImagenes) {
    solicitud.current?.abort();
    const controlador = new AbortController();
    solicitud.current = controlador;
    setEstado({ ...inicial, cargando: 'busqueda' });
    try {
      const capas = await buscarImagenes(ubicacion, filtros, controlador.signal);
      if (!controlador.signal.aborted) setEstado({ ...inicial, capas, consultado: true });
    } catch (error) {
      if (!controlador.signal.aborted) setEstado({ ...inicial, error: error instanceof Error ? error.message : 'No se pudo completar la búsqueda.' });
    }
  }

  async function seleccionar(id: string) {
    solicitud.current?.abort();
    const escena = estado.capas.find((capa) => capa.id === id) ?? null;
    if (!escena) {
      setEstado((previo) => ({ ...previo, seleccionada: null, teselas: null, cargando: null, error: '' }));
      return;
    }
    const controlador = new AbortController();
    solicitud.current = controlador;
    setEstado((previo) => ({ ...previo, seleccionada: escena, teselas: null, cargando: 'imagen', error: '' }));
    try {
      const teselas = await obtenerTeselas(escena, controlador.signal);
      if (!controlador.signal.aborted) setEstado((previo) => ({ ...previo, teselas, cargando: null }));
    } catch (error) {
      if (!controlador.signal.aborted) setEstado((previo) => ({ ...previo, seleccionada: null, teselas: null, cargando: null, error: error instanceof Error ? error.message : 'No se pudo preparar la imagen.' }));
    }
  }

  return { ...estado, buscar, seleccionar, reiniciar };
}
