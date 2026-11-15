import type {
  AnalisisDisponible,
  SerieAmbiental,
} from "../../types/ambiental";

export type DatosClimaticosAgricolas = {
  temperaturaMediaC: number | null;
  precipitacionMm: number | null;
  radiacionSolar: number | null;
  unidadRadiacion: string;
  periodo: string;
  fuente: string;
};

function seleccionarSerie(
  series: SerieAmbiental[],
  variable: SerieAmbiental["variable"],
  unidad: SerieAmbiental["unidad"]
): SerieAmbiental | undefined {
  return series.find(
    (serie) =>
      serie.variable === variable &&
      serie.unidad === unidad &&
      serie.frecuencia === "diaria" &&
      serie.tipoDato === "historico" &&
      serie.puntos.some(
        (punto) =>
          punto.valor !== null &&
          Number.isFinite(punto.valor)
      )
  );
}

function valoresValidos(
  serie: SerieAmbiental | undefined
): number[] {
  if (!serie) return [];

  return serie.puntos
    .map((punto) => punto.valor)
    .filter(
      (valor): valor is number =>
        valor !== null && Number.isFinite(valor)
    );
}

function promedioValido(
  serie: SerieAmbiental | undefined
): number | null {
  const valores = valoresValidos(serie);

  if (valores.length === 0) return null;

  return (
    valores.reduce(
      (total, valor) => total + valor,
      0
    ) / valores.length
  );
}

function acumuladoValido(
  serie: SerieAmbiental | undefined
): number | null {
  const valores = valoresValidos(serie);

  if (valores.length === 0) return null;

  return valores.reduce(
    (total, valor) => total + valor,
    0
  );
}

export function adaptarClimaAgricola(
  disponible: AnalisisDisponible | null
): DatosClimaticosAgricolas | null {
  if (!disponible) return null;

  const series = disponible.analisis.series;

  const temperatura = seleccionarSerie(
    series,
    "temperatura",
    "°C"
  );

  // NASA POWER entrega precipitación diaria
  // en mm/día. Al sumar los valores diarios
  // obtenemos los milímetros acumulados
  // durante los días con observaciones válidas.
  const precipitacion = seleccionarSerie(
    series,
    "precipitacion",
    "mm/día"
  );

  const radiacion = seleccionarSerie(
    series,
    "radiacion-solar",
    "MJ/m²/día"
  );

  const seleccionadas = [
    temperatura,
    precipitacion,
    radiacion,
  ].filter(
    (serie): serie is SerieAmbiental =>
      serie !== undefined
  );

  if (seleccionadas.length === 0) {
    return null;
  }

  const fuentes = [
    ...new Set(
      seleccionadas.map(
        (serie) => serie.procedencia.proveedor
      )
    ),
  ];

  const periodos = [
    ...new Set(
      seleccionadas.map(
        (serie) =>
          `${serie.periodo.inicio} a ${serie.periodo.fin}`
      )
    ),
  ];

  return {
    temperaturaMediaC: promedioValido(temperatura),
    precipitacionMm: acumuladoValido(precipitacion),
    radiacionSolar: promedioValido(radiacion),
    unidadRadiacion: radiacion?.unidad ?? "",
    periodo: periodos.join("; "),
    fuente: fuentes.join(", "),
  };
}