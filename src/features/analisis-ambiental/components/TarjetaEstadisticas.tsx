import type { ProveedorAmbiental, SerieAmbientalFusionada } from '../../../types/ambiental';
import Card from '../../../components/ui/Card';
import '../analisis-visual.css';

const FUENTES: ProveedorAmbiental[] = ['nasa-power', 'open-meteo'];
const NOMBRES: Record<ProveedorAmbiental, string> = { 'nasa-power': 'NASA POWER', 'open-meteo': 'Open-Meteo' };

function fechaCorta(fecha: string | null): string {
  if (!fecha) return 'Sin dato';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00Z` : fecha);
  if (Number.isNaN(date.valueOf())) return fecha;
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function formato(valor: number | null, unidad: string): string {
  return valor === null ? '—' : `${valor.toLocaleString('es', { maximumFractionDigits: 2 })} ${unidad}`;
}

export default function TarjetaEstadisticas({ serie, titulo }: { serie: SerieAmbientalFusionada; titulo: string }) {
  const fuentes = FUENTES.filter((fuente) => serie.estadisticasPorProveedor[fuente] !== undefined);
  return (
    <Card className="visual-tarjeta estadisticas-tarjeta">
      <div className="visual-encabezado"><h3>{titulo}</h3><span>Periodo completo</span></div>
      {fuentes.length === 0 ? <p className="visual-vacio">Sin estadísticas disponibles.</p> : (
        <div className="estadisticas-fuentes">
          {fuentes.map((fuente) => {
            const estadisticas = serie.estadisticasPorProveedor[fuente];
            if (!estadisticas) return null;
            return (
              <section className="estadisticas-fuente" key={fuente}>
                <h4>{NOMBRES[fuente]}{serie.procedenciaPorProveedor[fuente]?.modelo ? ` · ${serie.procedenciaPorProveedor[fuente]?.modelo}` : ''}</h4>
                <dl className="estadisticas-lista">
                  <div className="estadistica-item"><dt>Mínimo</dt><dd>{formato(estadisticas.minimo, serie.unidad)}</dd>{estadisticas.fechaMinimo && <small>{fechaCorta(estadisticas.fechaMinimo)}</small>}</div>
                  <div className="estadistica-item"><dt>Promedio</dt><dd>{formato(estadisticas.promedio, serie.unidad)}</dd></div>
                  <div className="estadistica-item"><dt>Máximo</dt><dd>{formato(estadisticas.maximo, serie.unidad)}</dd>{estadisticas.fechaMaximo && <small>{fechaCorta(estadisticas.fechaMaximo)}</small>}</div>
                </dl>
                <p className="estadisticas-observaciones">{estadisticas.cantidad.toLocaleString('es')} observaciones válidas</p>
              </section>
            );
          })}
        </div>
      )}
      <p className="visual-nota">Estadísticas sobre observaciones originales válidas ({serie.frecuencia}). Se calculan por separado; no se promedian las fuentes.</p>
      <p className="visual-nota">Periodo: {serie.periodo.inicio} — {serie.periodo.fin}</p>
    </Card>
  );
}
