import type {
  ProveedorAmbiental,
  ResultadoFusionAmbiental,
  SerieAmbiental,
  SerieAmbientalFusionada,
} from '../../../types/ambiental';
import { calcularEstadisticas } from './estadisticas';

type SerieBase = Pick<SerieAmbiental, 'variable' | 'unidad' | 'frecuencia' | 'tipoDato' | 'referenciaTemporal' | 'periodo'>;

type GrupoInterno = {
  base: SerieBase;
  proveedores: Set<ProveedorAmbiental>;
  puntos: Map<string, Partial<Record<ProveedorAmbiental, number | null>>>;
  estadisticasPorProveedor: SerieAmbientalFusionada['estadisticasPorProveedor'];
  procedenciaPorProveedor: SerieAmbientalFusionada['procedenciaPorProveedor'];
};

function claveBase(serie: SerieBase): string {
  return JSON.stringify([
    serie.variable,
    serie.unidad,
    serie.frecuencia,
    serie.tipoDato,
    serie.referenciaTemporal,
    serie.periodo.inicio,
    serie.periodo.fin,
  ]);
}

function crearGrupo(serie: SerieAmbiental): GrupoInterno {
  return {
    base: {
      variable: serie.variable,
      unidad: serie.unidad,
      frecuencia: serie.frecuencia,
      tipoDato: serie.tipoDato,
      referenciaTemporal: serie.referenciaTemporal,
      periodo: serie.periodo,
    },
    proveedores: new Set(),
    puntos: new Map(),
    estadisticasPorProveedor: {},
    procedenciaPorProveedor: {},
  };
}

function seriesCompatibles(a: SerieAmbiental, b: SerieAmbiental): boolean {
  return claveBase(a) === claveBase(b);
}

function normalizarUnidadDiaria(serie: SerieAmbiental): SerieAmbiental {
  if (serie.variable !== 'precipitacion' || serie.frecuencia !== 'diaria' || serie.unidad !== 'mm') return serie;
  return {
    ...serie,
    unidad: 'mm/día',
    estadisticas: calcularEstadisticas(serie.puntos),
  };
}

/** Alinea fuentes por fecha cuando coinciden variable, unidad, frecuencia y periodo. */
export function fusionarSeriesAmbientales(series: SerieAmbiental[]): ResultadoFusionAmbiental {
  const gruposPorBase = new Map<string, GrupoInterno[]>();
  const avisos: string[] = [];

  for (let indice = 0; indice < series.length; indice += 1) {
    const serie = normalizarUnidadDiaria(series[indice]);
    const proveedor = serie.procedencia.proveedor;
    const clave = claveBase(serie);
    const grupos = gruposPorBase.get(clave) ?? [];
    let grupo = grupos.find((candidato) => !candidato.proveedores.has(proveedor));

    if (!grupo) {
      grupo = crearGrupo(serie);
      if (grupos.length > 0) {
        avisos.push(`Hay series repetidas de ${proveedor} para ${serie.variable}; se conservaron separadas.`);
      }
      grupos.push(grupo);
      gruposPorBase.set(clave, grupos);
    }

    grupo.proveedores.add(proveedor);
    grupo.estadisticasPorProveedor[proveedor] = calcularEstadisticas(serie.puntos);
    grupo.procedenciaPorProveedor[proveedor] = serie.procedencia;
    for (const punto of serie.puntos) {
      const fila = grupo.puntos.get(punto.fecha) ?? {};
      fila[proveedor] = punto.valor;
      grupo.puntos.set(punto.fecha, fila);
    }

    for (let anterior = 0; anterior < indice; anterior += 1) {
      const otra = normalizarUnidadDiaria(series[anterior]);
      if (otra.variable === serie.variable && otra.procedencia.proveedor !== proveedor && !seriesCompatibles(serie, otra)) {
        const aviso = `No se alinearon las series de ${serie.variable}: unidades, frecuencia, referencia temporal o periodo diferentes.`;
        if (!avisos.includes(aviso)) avisos.push(aviso);
      }
    }
  }

  const resultado: SerieAmbientalFusionada[] = [];
  for (const grupos of gruposPorBase.values()) {
    for (const grupo of grupos) {
      resultado.push({
        ...grupo.base,
        puntos: [...grupo.puntos.entries()]
          .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
          .map(([fecha, valores]) => ({ fecha, valores })),
        estadisticasPorProveedor: grupo.estadisticasPorProveedor,
        procedenciaPorProveedor: grupo.procedenciaPorProveedor,
      });
    }
  }

  return { series: resultado, avisos };
}
