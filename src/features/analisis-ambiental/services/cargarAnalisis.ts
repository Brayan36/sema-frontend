import type {
  AnalisisAmbiental,
  AnalisisDisponible,
  ConsultaHistoricaAmbiental,
} from '../../../types/ambiental';
import { consultarHistoricoAmbiental } from './consultarHistorico';
import {
  guardarAnalisisLocal,
  listarPendientesDeSincronizacion,
  marcarAnalisisSincronizado,
  obtenerAnalisisLocal,
} from './cacheLocal';
import { cargarAnalisisDeRecurso, guardarAnalisisEnBackend, recuperarAnalisisDelBackend } from './backendAmbiental';
import { obtenerFuenteDatos } from '../../../services/api';

function crearAnalisis(
  consulta: ConsultaHistoricaAmbiental,
  series: AnalisisAmbiental['series'],
  fincaId?: string,
): AnalisisAmbiental {
  const obtenidoEn = new Date().toISOString();
  return {
    schemaVersion: 1,
    analysisId: null,
    ...(fincaId ? { fincaId } : {}),
    ubicacion: consulta.ubicacion,
    periodo: { inicio: consulta.inicio, fin: consulta.fin },
    obtenidoEn,
    creadoEn: obtenidoEn,
    expiraEn: null,
    respuestasCrudas: {},
    erroresProveedores: [],
    series,
  };
}

function estaSinConexion(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export async function cargarAnalisisHistorico(
  consulta: ConsultaHistoricaAmbiental,
  opciones: { fincaId?: string; signal?: AbortSignal } = {},
): Promise<AnalisisDisponible> {
  const { fincaId, signal } = opciones;

  if (obtenerFuenteDatos() === 'recursos') {
    const analisis = await cargarAnalisisDeRecurso(consulta, signal);
    return { analisis, fuente: 'recursos', cacheVencida: false, avisos: ['Datos de demostración cargados desde un recurso JSON local.'] };
  }

  if (obtenerFuenteDatos() === 'backend') {
    const analisis = await recuperarAnalisisDelBackend(consulta, fincaId);
    if (analisis) return { analisis, fuente: 'backend', cacheVencida: false, avisos: [] };
    const local = await obtenerAnalisisLocal(consulta, fincaId);
    if (local) return {
      analisis: local.analisis,
      fuente: 'cache-local',
      cacheVencida: local.vencido,
      avisos: ['El backend no tiene un análisis para esta consulta; se muestra la copia local.'],
    };
    throw new Error('El backend no tiene un análisis para esta ubicación y periodo.');
  }

  if (estaSinConexion()) {
    const local = await obtenerAnalisisLocal(consulta, fincaId);
    if (!local) throw new Error('No hay conexión y no existe una copia local para este periodo y ubicación.');
    return {
      analisis: local.analisis,
      fuente: 'cache-local',
      cacheVencida: local.vencido,
      avisos: [local.vencido ? 'La copia local superó su vigencia de siete días.' : 'Se muestran datos guardados en este dispositivo.'],
    };
  }

  const resultado = await consultarHistoricoAmbiental(consulta, signal);
  const avisos = resultado.errores.map(({ proveedor, mensaje }) => `${proveedor}: ${mensaje}`);

  if (resultado.series.length > 0 || Object.keys(resultado.respuestasCrudas).length > 0) {
    let analisis = crearAnalisis(consulta, resultado.series, fincaId);
    analisis.respuestasCrudas = resultado.respuestasCrudas;
    analisis.erroresProveedores = resultado.errores;
    let sincronizacionPendiente = true;
    try {
      await guardarAnalisisLocal(consulta, analisis, true, fincaId);
    } catch (error) {
      avisos.push(error instanceof Error ? `No se pudo guardar copia local: ${error.message}` : 'No se pudo guardar copia local.');
    }

    try {
      const respuestaBackend = await guardarAnalisisEnBackend(analisis);
      sincronizacionPendiente = !respuestaBackend.enviado;
      if (respuestaBackend.enviado) {
        if (respuestaBackend.analisis) analisis = respuestaBackend.analisis;
        try {
          await guardarAnalisisLocal(consulta, analisis, false, fincaId);
        } catch (error) {
          avisos.push(error instanceof Error
            ? `El backend guardó el análisis, pero no se pudo actualizar el estado de sincronización local: ${error.message}`
            : 'El backend guardó el análisis, pero no se pudo actualizar el estado de sincronización local.');
        }
      } else {
        avisos.push('Backend sin configurar; el análisis quedó pendiente de sincronización.');
      }
    } catch (error) {
      avisos.push(error instanceof Error ? `No se pudo sincronizar con el backend: ${error.message}` : 'No se pudo sincronizar con el backend.');
    }

    if (sincronizacionPendiente) {
      try {
        await guardarAnalisisLocal(consulta, analisis, true, fincaId);
      } catch {
        // El aviso de almacenamiento local ya se agregó arriba si falló.
      }
    }

    return {
      analisis,
      fuente: 'proveedores',
      cacheVencida: false,
      avisos,
    };
  }

  try {
    const analisisBackend = await recuperarAnalisisDelBackend(consulta, fincaId);
    if (analisisBackend) {
      try {
        await guardarAnalisisLocal(consulta, analisisBackend, false, fincaId);
      } catch (error) {
        avisos.push(error instanceof Error ? `No se pudo guardar copia local: ${error.message}` : 'No se pudo guardar copia local.');
      }
      return { analisis: analisisBackend, fuente: 'backend', cacheVencida: false, avisos };
    }
  } catch (error) {
    avisos.push(error instanceof Error ? `No se pudo recuperar del backend: ${error.message}` : 'No se pudo recuperar del backend.');
  }

  const local = await obtenerAnalisisLocal(consulta, fincaId);
  if (local) {
    avisos.push('Se muestran datos guardados en este dispositivo porque las fuentes no devolvieron datos.');
    return { analisis: local.analisis, fuente: 'cache-local', cacheVencida: local.vencido, avisos };
  }

  throw new Error(avisos.length ? avisos.join(' ') : 'No hay datos disponibles para la ubicación y el periodo solicitados.');
}

/** Reintenta envíos que quedaron en la cola local mientras no había backend disponible. */
export async function sincronizarAnalisisPendientes(): Promise<number> {
  if (estaSinConexion()) return 0;
  const pendientes = await listarPendientesDeSincronizacion();
  let sincronizados = 0;

  for (const registro of pendientes) {
    try {
      const respuestaBackend = await guardarAnalisisEnBackend(registro.analisis);
      if (respuestaBackend.enviado) {
        await marcarAnalisisSincronizado(registro.clave, respuestaBackend.analisis);
        sincronizados += 1;
      }
    } catch {
      // Se mantiene pendiente para el siguiente intento.
    }
  }

  return sincronizados;
}
