import type {
  ResultadoRiesgo,
  ReglaRiesgo,
  SerieAmbiental,
} from '../../../types/ambiental';

function esReglaValida(regla: ReglaRiesgo): boolean {
  if (!regla.id || !regla.nombre || !Number.isInteger(regla.cantidadPuntos) || regla.cantidadPuntos < 1) return false;
  if (!Number.isFinite(regla.umbral)) return false;
  if (regla.condicion === 'fuera-de-rango') {
    return typeof regla.umbralSuperior === 'number'
      && Number.isFinite(regla.umbralSuperior)
      && regla.umbral <= regla.umbralSuperior;
  }
  return true;
}

function medir(valores: number[], medida: ReglaRiesgo['medida']): number {
  if (medida === 'ultimo') return valores[valores.length - 1];
  if (medida === 'minimo') return valores.reduce((menor, valor) => Math.min(menor, valor));
  if (medida === 'maximo') return valores.reduce((mayor, valor) => Math.max(mayor, valor));
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function cumpleCondicion(valor: number, regla: ReglaRiesgo): boolean {
  if (regla.condicion === 'menor-que') return valor < regla.umbral;
  if (regla.condicion === 'mayor-que') return valor > regla.umbral;
  return valor < regla.umbral || valor > (regla.umbralSuperior as number);
}

function resultadoBase(regla: ReglaRiesgo, estado: ResultadoRiesgo['estado']): ResultadoRiesgo {
  return {
    reglaId: regla.id,
    nombre: regla.nombre,
    proveedor: regla.proveedor,
    estado,
    severidad: regla.severidad,
    valorEvaluado: null,
    unidad: regla.unidad,
    puntosEvaluados: 0,
    explicacion: regla.explicacion,
  };
}

/** Evalúa reglas explícitas; no inventa umbrales agronómicos por defecto. */
export function evaluarReglaRiesgo(regla: ReglaRiesgo, series: SerieAmbiental[]): ResultadoRiesgo {
  if (!esReglaValida(regla)) return resultadoBase(regla, 'regla-invalida');

  const serie = series.find((item) => item.variable === regla.variable
    && item.unidad === regla.unidad
    && item.frecuencia === regla.frecuencia
    && item.procedencia.proveedor === regla.proveedor);
  if (!serie) return resultadoBase(regla, 'sin-datos');

  const puntos = serie.puntos
    .filter((punto) => punto.valor !== null && Number.isFinite(punto.valor))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (puntos.length === 0) return resultadoBase(regla, 'sin-datos');

  const ventana = puntos.slice(-regla.cantidadPuntos);
  if (ventana.length < regla.cantidadPuntos) return resultadoBase(regla, 'datos-insuficientes');
  const valor = medir(ventana.map((punto) => punto.valor as number), regla.medida);
  return {
    reglaId: regla.id,
    nombre: regla.nombre,
    proveedor: regla.proveedor,
    estado: cumpleCondicion(valor, regla) ? 'activo' : 'sin-riesgo',
    severidad: regla.severidad,
    valorEvaluado: valor,
    unidad: regla.unidad,
    puntosEvaluados: ventana.length,
    explicacion: regla.explicacion,
  };
}

export function evaluarReglasRiesgo(reglas: ReglaRiesgo[], series: SerieAmbiental[]): ResultadoRiesgo[] {
  return reglas.map((regla) => evaluarReglaRiesgo(regla, series));
}
