import type { EstadisticasSerieAmbiental, PuntoSerieAmbiental } from '../../../types/ambiental';

/** Calcula estadísticas usando solo valores numéricos finitos. */
export function calcularEstadisticas(puntos: PuntoSerieAmbiental[]): EstadisticasSerieAmbiental {
  const validos = puntos.filter(
    (punto): punto is PuntoSerieAmbiental & { valor: number } =>
      typeof punto.valor === 'number' && Number.isFinite(punto.valor),
  );

  if (validos.length === 0) {
    return {
      minimo: null,
      fechaMinimo: null,
      maximo: null,
      fechaMaximo: null,
      promedio: null,
      cantidad: 0,
    };
  }

  const minimo = validos.reduce((menor, actual) => actual.valor < menor.valor ? actual : menor);
  const maximo = validos.reduce((mayor, actual) => actual.valor > mayor.valor ? actual : mayor);
  const suma = validos.reduce((total, punto) => total + punto.valor, 0);

  return {
    minimo: minimo.valor,
    fechaMinimo: minimo.fecha,
    maximo: maximo.valor,
    fechaMaximo: maximo.fecha,
    promedio: suma / validos.length,
    cantidad: validos.length,
  };
}
