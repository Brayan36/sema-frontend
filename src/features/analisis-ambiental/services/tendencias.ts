import type {
  PuntoAnualAmbiental,
  SerieAmbiental,
  TendenciaHistorica,
} from '../../../types/ambiental';

const COBERTURA_MINIMA_PREDETERMINADA = 0.98;

function diasEnAnio(anio: number): number {
  return new Date(Date.UTC(anio + 1, 0, 1)).valueOf() - new Date(Date.UTC(anio, 0, 1)).valueOf();
}

function esAnioCompletoEnPeriodo(anio: number, inicio: string, fin: string): boolean {
  const inicioAnio = `${anio}-01-01`;
  const finAnio = `${anio}-12-31`;
  return inicio <= inicioAnio && fin >= finAnio;
}

function calcularEsperadas(anio: number, frecuencia: SerieAmbiental['frecuencia']): number {
  const dias = diasEnAnio(anio) / 86_400_000;
  if (frecuencia === 'diaria') return dias;
  if (frecuencia === 'horaria') return dias * 24;
  return 12;
}

function extraerAnio(fecha: string): number | null {
  const coincidencia = /^(\d{4})/.exec(fecha);
  return coincidencia ? Number(coincidencia[1]) : null;
}

function calcularRegresion(puntos: PuntoAnualAmbiental[]): { pendiente: number; rCuadrado: number | null; cambio: number } | null {
  if (puntos.length < 3) return null;
  const promedioX = puntos.reduce((suma, punto) => suma + punto.anio, 0) / puntos.length;
  const promedioY = puntos.reduce((suma, punto) => suma + punto.valor, 0) / puntos.length;
  const sumaXX = puntos.reduce((suma, punto) => suma + (punto.anio - promedioX) ** 2, 0);
  if (sumaXX === 0) return null;

  const sumaXY = puntos.reduce((suma, punto) => suma + (punto.anio - promedioX) * (punto.valor - promedioY), 0);
  const pendiente = sumaXY / sumaXX;
  const intercepto = promedioY - pendiente * promedioX;
  const sumaTotal = puntos.reduce((suma, punto) => suma + (punto.valor - promedioY) ** 2, 0);
  const sumaError = puntos.reduce((suma, punto) => suma + (punto.valor - (pendiente * punto.anio + intercepto)) ** 2, 0);
  const rCuadrado = sumaTotal === 0 ? null : Math.max(0, Math.min(1, 1 - sumaError / sumaTotal));
  const cambio = pendiente * (puntos[puntos.length - 1].anio - puntos[0].anio);
  return { pendiente, rCuadrado, cambio };
}

/** Resume años calendario completos y estima una pendiente lineal; no extrapola un pronóstico. */
export function calcularTendenciaHistorica(
  serie: SerieAmbiental,
  coberturaMinima = COBERTURA_MINIMA_PREDETERMINADA,
): TendenciaHistorica {
  const grupos = new Map<number, number[]>();
  for (const punto of serie.puntos) {
    const anio = extraerAnio(punto.fecha);
    if (anio === null || punto.valor === null || !Number.isFinite(punto.valor)) continue;
    const valores = grupos.get(anio) ?? [];
    valores.push(punto.valor);
    grupos.set(anio, valores);
  }

  const puntosAnuales: PuntoAnualAmbiental[] = [];
  const aniosExcluidos: number[] = [];
  for (const [anio, valores] of [...grupos.entries()].sort(([a], [b]) => a - b)) {
    const esperadas = calcularEsperadas(anio, serie.frecuencia);
    const cobertura = esperadas > 0 ? Math.min(valores.length / esperadas, 1) : 0;
    const periodoCompleto = esAnioCompletoEnPeriodo(anio, serie.periodo.inicio, serie.periodo.fin);
    if (!periodoCompleto || cobertura < coberturaMinima) {
      aniosExcluidos.push(anio);
      continue;
    }

    const total = valores.reduce((suma, valor) => suma + valor, 0);
    puntosAnuales.push({
      anio,
      valor: serie.variable === 'precipitacion' ? total : total / valores.length,
      observaciones: valores.length,
      esperadas,
      cobertura,
    });
  }

  const regresion = calcularRegresion(puntosAnuales);
  const direccion = !regresion
    ? 'datos-insuficientes'
    : regresion.pendiente > 0
      ? 'ascendente'
      : regresion.pendiente < 0
        ? 'descendente'
        : 'sin-tendencia';
  const unidadTendencia = serie.variable === 'precipitacion'
    ? 'mm/año²'
    : `${serie.unidad}/año`;
  const unidadValorAnual = serie.variable === 'precipitacion' ? 'mm/año' : serie.unidad;

  return {
    variable: serie.variable,
    unidad: serie.unidad,
    unidadValorAnual,
    unidadTendencia,
    direccion,
    pendientePorAnio: regresion?.pendiente ?? null,
    cambioTendencialPeriodo: regresion?.cambio ?? null,
    rCuadrado: regresion?.rCuadrado ?? null,
    puntosAnuales,
    aniosExcluidos,
  };
}
