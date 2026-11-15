import type { AnalisisAmbiental, ConsultaHistoricaAmbiental } from '../../../types/ambiental';

const NOMBRE_BD = 'sema-cache-ambiental';
const VERSION_BD = 1;
const ALMACEN = 'analisis';
export const VIGENCIA_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

export type RegistroCacheAmbiental = {
  clave: string;
  analisis: AnalisisAmbiental;
  guardadoEn: string;
  venceEn: string;
  sincronizacionBackendPendiente: boolean;
};

export type AnalisisEnCache = {
  analisis: AnalisisAmbiental;
  guardadoEn: string;
  vencido: boolean;
};

function abrirBase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Este navegador no ofrece almacenamiento IndexedDB.'));
  }

  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);
    solicitud.onupgradeneeded = () => {
      const base = solicitud.result;
      if (!base.objectStoreNames.contains(ALMACEN)) {
        base.createObjectStore(ALMACEN, { keyPath: 'clave' });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error ?? new Error('No se pudo abrir la caché local.'));
    solicitud.onblocked = () => reject(new Error('La actualización de la caché local está bloqueada por otra pestaña.'));
  });
}

function finalizarTransaccion(transaccion: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaccion.oncomplete = () => resolve();
    transaccion.onerror = () => reject(transaccion.error ?? new Error('Falló una operación de caché local.'));
    transaccion.onabort = () => reject(transaccion.error ?? new Error('Se canceló una operación de caché local.'));
  });
}

export function crearClaveCache(
  consulta: ConsultaHistoricaAmbiental,
  fincaId?: string,
): string {
  const latitud = String(consulta.ubicacion.latitud);
  const longitud = String(consulta.ubicacion.longitud);
  return [fincaId ?? 'sin-id', latitud, longitud, consulta.inicio, consulta.fin].join('|');
}

export async function guardarAnalisisLocal(
  consulta: ConsultaHistoricaAmbiental,
  analisis: AnalisisAmbiental,
  sincronizacionBackendPendiente: boolean,
  fincaId?: string,
): Promise<void> {
  const guardadoEn = new Date().toISOString();
  const registro: RegistroCacheAmbiental = {
    clave: crearClaveCache(consulta, fincaId),
    analisis,
    guardadoEn,
    venceEn: new Date(Date.now() + VIGENCIA_CACHE_MS).toISOString(),
    sincronizacionBackendPendiente,
  };

  const base = await abrirBase();
  try {
    const transaccion = base.transaction(ALMACEN, 'readwrite');
    transaccion.objectStore(ALMACEN).put(registro);
    await finalizarTransaccion(transaccion);
  } finally {
    base.close();
  }
}

export async function obtenerAnalisisLocal(
  consulta: ConsultaHistoricaAmbiental,
  fincaId?: string,
): Promise<AnalisisEnCache | null> {
  const base = await abrirBase();
  try {
    const transaccion = base.transaction(ALMACEN, 'readonly');
    const solicitud = transaccion.objectStore(ALMACEN).get(crearClaveCache(consulta, fincaId));
    const [registro] = await Promise.all([
      new Promise<RegistroCacheAmbiental | undefined>((resolve, reject) => {
        solicitud.onsuccess = () => resolve(solicitud.result as RegistroCacheAmbiental | undefined);
        solicitud.onerror = () => reject(solicitud.error ?? new Error('No se pudo leer la caché local.'));
      }),
      finalizarTransaccion(transaccion),
    ]);

    if (!registro) return null;
    return {
      analisis: registro.analisis,
      guardadoEn: registro.guardadoEn,
      vencido: Date.now() > Date.parse(registro.venceEn),
    };
  } finally {
    base.close();
  }
}

/** Restaura la consulta más reciente de esta ubicación para abrirla sin conexión. */
export async function obtenerUltimoAnalisisLocal(
  ubicacion: ConsultaHistoricaAmbiental['ubicacion'],
): Promise<AnalisisEnCache | null> {
  const base = await abrirBase();
  try {
    const transaccion = base.transaction(ALMACEN, 'readonly');
    const solicitud = transaccion.objectStore(ALMACEN).getAll();
    const [registros] = await Promise.all([
      new Promise<RegistroCacheAmbiental[]>((resolve, reject) => {
        solicitud.onsuccess = () => resolve(solicitud.result as RegistroCacheAmbiental[]);
        solicitud.onerror = () => reject(solicitud.error ?? new Error('No se pudo leer la caché local.'));
      }),
      finalizarTransaccion(transaccion),
    ]);
    const registro = registros
      .filter(({ analisis }) => analisis.ubicacion.latitud === ubicacion.latitud
        && analisis.ubicacion.longitud === ubicacion.longitud)
      .sort((a, b) => Date.parse(b.guardadoEn) - Date.parse(a.guardadoEn))[0];
    if (!registro) return null;
    return {
      analisis: registro.analisis,
      guardadoEn: registro.guardadoEn,
      vencido: Date.now() > Date.parse(registro.venceEn),
    };
  } finally {
    base.close();
  }
}

export async function listarPendientesDeSincronizacion(): Promise<RegistroCacheAmbiental[]> {
  const base = await abrirBase();
  try {
    const transaccion = base.transaction(ALMACEN, 'readonly');
    const solicitud = transaccion.objectStore(ALMACEN).getAll();
    const [registros] = await Promise.all([
      new Promise<RegistroCacheAmbiental[]>((resolve, reject) => {
        solicitud.onsuccess = () => resolve((solicitud.result as RegistroCacheAmbiental[])
          .filter((registro) => registro.sincronizacionBackendPendiente));
        solicitud.onerror = () => reject(solicitud.error ?? new Error('No se pudo leer la cola de sincronización.'));
      }),
      finalizarTransaccion(transaccion),
    ]);
    return registros;
  } finally {
    base.close();
  }
}

export async function marcarAnalisisSincronizado(clave: string, analisis?: AnalisisAmbiental): Promise<void> {
  const base = await abrirBase();
  try {
    const transaccion = base.transaction(ALMACEN, 'readwrite');
    const almacen = transaccion.objectStore(ALMACEN);
    const solicitud = almacen.get(clave);
    solicitud.onsuccess = () => {
      const registro = solicitud.result as RegistroCacheAmbiental | undefined;
      if (registro) {
        registro.sincronizacionBackendPendiente = false;
        if (analisis) registro.analisis = analisis;
        almacen.put(registro);
      }
    };
    await finalizarTransaccion(transaccion);
  } finally {
    base.close();
  }
}
