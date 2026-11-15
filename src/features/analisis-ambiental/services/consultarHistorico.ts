import type {
  ConsultaHistoricaAmbiental,
  ErrorProveedorAmbiental,
  ProveedorAmbiental,
  RespuestaCrudaProveedorAmbiental,
  ResultadoConsultaAmbiental,
  SerieAmbiental,
} from '../../../types/ambiental';
import { consultarHistoricoNasaPower } from './nasaPower';
import { consultarHistoricoOpenMeteo } from './openMeteo';

/** Consulta ambos proveedores y conserva cualquier fuente que haya respondido. */
export async function consultarHistoricoAmbiental(
  consulta: ConsultaHistoricaAmbiental,
  signal?: AbortSignal,
): Promise<ResultadoConsultaAmbiental> {
  const resultados = await Promise.allSettled([
    consultarHistoricoNasaPower(consulta, signal),
    consultarHistoricoOpenMeteo(consulta, signal),
  ]);

  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : new DOMException('Consulta cancelada.', 'AbortError');
  }

  const series: SerieAmbiental[] = [];
  const respuestasCrudas: Partial<Record<ProveedorAmbiental, RespuestaCrudaProveedorAmbiental>> = {};
  const errores: ErrorProveedorAmbiental[] = [];

  resultados.forEach((resultado, indice) => {
    const proveedor = indice === 0 ? 'nasa-power' : 'open-meteo';
    if (resultado.status === 'fulfilled') {
      series.push(...resultado.value.series);
      respuestasCrudas[proveedor] = resultado.value.respuestaCruda;
      if (resultado.value.error) errores.push({ proveedor, mensaje: resultado.value.error });
      return;
    }

    errores.push({
      proveedor,
      mensaje: resultado.reason instanceof Error ? resultado.reason.message : 'No se pudo consultar esta fuente.',
    });
  });

  return { series, respuestasCrudas, errores };
}
