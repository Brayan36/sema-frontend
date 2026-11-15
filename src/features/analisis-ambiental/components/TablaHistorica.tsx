import { useState } from 'react';
import type { ProveedorAmbiental, SerieAmbientalFusionada } from '../../../types/ambiental';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import '../analisis-visual.css';

const FUENTES: ProveedorAmbiental[] = ['nasa-power', 'open-meteo'];
const NOMBRES: Record<ProveedorAmbiental, string> = { 'nasa-power': 'NASA POWER', 'open-meteo': 'Open-Meteo' };
const POR_PAGINA = 20;

function formatoFecha(fecha: string, frecuencia: SerieAmbientalFusionada['frecuencia']): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00Z` : fecha);
  return Number.isNaN(date.valueOf())
    ? fecha
    : new Intl.DateTimeFormat('es', {
      day: 'numeric', month: 'short', year: 'numeric',
      ...(frecuencia === 'horaria' ? { hour: '2-digit', minute: '2-digit' } : {}),
      timeZone: 'UTC',
    }).format(date);
}

export default function TablaHistorica({ series }: { series: SerieAmbientalFusionada[] }) {
  const [serieElegida, setSerieElegida] = useState('0');
  const [pagina, setPagina] = useState(0);
  const indiceSerie = Math.min(Math.max(Number(serieElegida) || 0, 0), Math.max(series.length - 1, 0));
  const serie = series[indiceSerie];
  const puntos = [...(serie?.puntos ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalPaginas = Math.max(1, Math.ceil(puntos.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const filas = puntos.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  if (!serie) {
    return <Card className="visual-tarjeta"><h2>Datos históricos</h2><p className="visual-vacio">No hay observaciones históricas disponibles.</p></Card>;
  }

  return (
    <Card className="visual-tarjeta tabla-historica-tarjeta">
      <div className="visual-encabezado">
        <div><h2>Datos históricos</h2><p className="visual-nota">Observaciones {serie.frecuencia === 'horaria' ? 'por hora' : serie.frecuencia === 'mensual' ? 'mensuales' : 'diarias'}, ordenadas de la más reciente a la más antigua.</p></div>
        <label className="selector-historico">Variable
          <select value={String(indiceSerie)} onChange={(evento) => { setSerieElegida(evento.target.value); setPagina(0); }}>
            {series.map((opcion, indice) => (
              <option key={`${opcion.variable}-${opcion.unidad}-${opcion.frecuencia}-${indice}`} value={indice}>
                {opcion.variable.replaceAll('-', ' ')} · {opcion.unidad} · {opcion.frecuencia}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="tabla-periodo">{serie.periodo.inicio} — {serie.periodo.fin} · Unidad: {serie.unidad}</p>
      <div className="tabla-historica-scroll" role="region" aria-label={`Datos históricos de ${serie.variable.replaceAll('-', ' ')}`} tabIndex={0}>
        <table className="tabla-historica">
          <thead><tr>
            <th scope="col">Fecha</th>
            {FUENTES.map((fuente) => <th scope="col" key={fuente}>{NOMBRES[fuente]}</th>)}
          </tr></thead>
          <tbody>
            {filas.map((punto) => (
              <tr key={punto.fecha}>
                  <th scope="row"><time dateTime={punto.fecha}>{formatoFecha(punto.fecha, serie.frecuencia)}</time></th>
                {FUENTES.map((fuente) => {
                  const existeFuente = serie.procedenciaPorProveedor[fuente] !== undefined;
                  const valor = punto.valores[fuente];
                  return <td key={fuente}>{!existeFuente ? '—' : valor === null || valor === undefined ? 'Sin dato' : `${valor.toLocaleString('es', { maximumFractionDigits: 2 })} ${serie.unidad}`}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tabla-paginacion">
        <span>{puntos.length.toLocaleString('es')} observaciones · página {paginaActual + 1} de {totalPaginas}</span>
        <div>
          <Button type="button" className="boton-terciario" disabled={paginaActual === 0} onClick={() => setPagina(paginaActual - 1)}>Más recientes</Button>
          <Button type="button" className="boton-terciario" disabled={paginaActual >= totalPaginas - 1} onClick={() => setPagina(paginaActual + 1)}>Más antiguos</Button>
        </div>
      </div>
    </Card>
  );
}
