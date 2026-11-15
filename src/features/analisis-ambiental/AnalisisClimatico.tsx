import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type { AnalisisDisponible, ReglaRiesgo, SerieAmbiental } from '../../types/ambiental';
import type { BorradorFinca } from '../../types/finca';
import { fusionarSeriesAmbientales } from './services/fusionarSeries';
import { calcularTendenciaHistorica } from './services/tendencias';
import { evaluarReglasRiesgo } from '../riesgos/services/evaluarReglas';
import ListaRiesgos from '../riesgos/components/ListaRiesgos';
import GraficoComparativo from './components/GraficoComparativo';
import GraficoTendencia from './components/GraficoTendencia';
import TarjetaEstadisticas from './components/TarjetaEstadisticas';
import './analisis-pantallas.css';

const hoy = new Date().toISOString().slice(0, 10);
const haceCincoAnos = new Date();
haceCincoAnos.setUTCFullYear(haceCincoAnos.getUTCFullYear() - 5);
const inicioPredeterminado = haceCincoAnos.toISOString().slice(0, 10);

const nombresVariable: Record<SerieAmbiental['variable'], string> = {
  temperatura: 'Temperatura del aire',
  precipitacion: 'Precipitación',
  'radiacion-solar': 'Radiación solar',
  'humedad-relativa': 'Humedad relativa',
  'humedad-suelo': 'Humedad del suelo (0–7 cm)',
  'temperatura-suelo': 'Temperatura del suelo',
  'velocidad-viento': 'Velocidad del viento',
  evapotranspiracion: 'Evapotranspiración',
};
const SERIES_VACIAS: SerieAmbiental[] = [];

function etiquetaFuente(fuente: AnalisisDisponible['fuente']): string {
  if (fuente === 'backend') return 'Copia recuperada del backend';
  if (fuente === 'cache-local') return 'Copia temporal de este dispositivo';
  return 'Consulta reciente a NASA POWER y Open-Meteo';
}

export default function AnalisisClimatico({
  borrador,
  disponible,
  reglasRiesgo,
  cargando,
  error,
  onConsultar,
}: {
  borrador: BorradorFinca | null;
  disponible: AnalisisDisponible | null;
  reglasRiesgo: ReglaRiesgo[];
  cargando: boolean;
  error: string | null;
  onConsultar: (periodo: { inicio: string; fin: string }) => Promise<void>;
}) {
  const [periodoManual, setPeriodoManual] = useState<{ inicio: string; fin: string } | null>(null);
  const series = disponible?.analisis.series ?? SERIES_VACIAS;
  const fusion = useMemo(() => fusionarSeriesAmbientales(series), [series]);
  const riesgos = useMemo(() => evaluarReglasRiesgo(reglasRiesgo, series), [reglasRiesgo, series]);
  const seriesDiarias = series.filter((serie) => serie.frecuencia === 'diaria');
  const tendencias = seriesDiarias.map((serie) => ({
    serie,
    tendencia: calcularTendenciaHistorica(serie),
  }));
  const inicio = periodoManual?.inicio ?? disponible?.analisis.periodo?.inicio ?? disponible?.analisis.series[0]?.periodo.inicio ?? inicioPredeterminado;
  const fin = periodoManual?.fin ?? disponible?.analisis.periodo?.fin ?? disponible?.analisis.series[0]?.periodo.fin ?? hoy;

  return (
    <div className="pagina ambiental-pagina">
      <p className="sobre-titulo">04 / ANÁLISIS AMBIENTAL</p>
      <h1>Análisis climático y del suelo</h1>
      <p className="introduccion">Consulta tendencias históricas de clima y humedad del suelo para la ubicación de tu finca.</p>

      {!borrador ? (
        <p className="aviso">Primero registra una finca para consultar sus datos ambientales. <Link to="/mi-finca">Ir a Mi finca</Link></p>
      ) : (
        <Card className="ambiental-filtros">
          <div className="ambiental-contexto">
            <div><span>Finca</span><strong>{borrador.nombre}</strong></div>
            <div><span>Ubicación de consulta</span><strong>{borrador.ubicacion.latitud.toFixed(4)}, {borrador.ubicacion.longitud.toFixed(4)}</strong></div>
          </div>
          <form className="ambiental-formulario" onSubmit={(evento) => {
            evento.preventDefault();
            void onConsultar({ inicio, fin });
          }}>
            <div className="campo">
              <label htmlFor="ambiental-inicio">Desde</label>
              <input id="ambiental-inicio" type="date" value={inicio} max={fin}
                onChange={(evento) => setPeriodoManual((actual) => ({ inicio: evento.target.value, fin: actual?.fin ?? fin }))} required />
            </div>
            <div className="campo">
              <label htmlFor="ambiental-fin">Hasta</label>
              <input id="ambiental-fin" type="date" value={fin} min={inicio} max={hoy}
                onChange={(evento) => setPeriodoManual((actual) => ({ inicio: actual?.inicio ?? inicio, fin: evento.target.value }))} required />
            </div>
            <Button type="submit" disabled={cargando}>{cargando ? 'Consultando fuentes…' : 'Consultar análisis'}</Button>
          </form>
          {error && <p className="mensaje-error" role="alert">{error}</p>}
          {cargando && <p className="mensaje-estado" role="status">Consultando NASA POWER y Open-Meteo. Puede tardar unos segundos.</p>}
        </Card>
      )}

      {disponible && (
        <>
          <div className="ambiental-estado" role="status">
            <strong>{etiquetaFuente(disponible.fuente)}</strong>
            {disponible.cacheVencida && <span>La copia local superó su vigencia de siete días.</span>}
            <span>Datos consultados: {new Date(disponible.analisis.obtenidoEn).toLocaleString('es')}</span>
          </div>
          {(disponible.avisos.length > 0 || fusion.avisos.length > 0) && (
            <ul className="ambiental-avisos" aria-label="Avisos de consulta">
              {[...disponible.avisos, ...fusion.avisos].map((aviso, indice) => <li key={`${indice}-${aviso}`}>{aviso}</li>)}
            </ul>
          )}
          {cargando && <p className="mensaje-estado" role="status">Los riesgos visibles corresponden a la consulta anterior mientras se actualizan los datos.</p>}
          <section className="analisis-riesgos-automaticos" aria-label="Riesgos evaluados para esta consulta" aria-live="polite">
            <ListaRiesgos riesgos={riesgos} hrefConfigurar="/riesgos-alertas" />
          </section>
          {fusion.series.length > 0 ? (
            <>
              <div className="ambiental-grid">
                {fusion.series.map((serie, indice) => (
                  <div className="ambiental-serie" key={`${serie.variable}-${serie.frecuencia}-${indice}`}>
                    <GraficoComparativo serie={serie} titulo={nombresVariable[serie.variable]} />
                    <TarjetaEstadisticas serie={serie} titulo={nombresVariable[serie.variable]} />
                  </div>
                ))}
              </div>
              {tendencias.length > 0 && (
                <section className="ambiental-tendencias" aria-labelledby="titulo-tendencias">
                  <p className="sobre-titulo">TENDENCIAS HISTÓRICAS</p>
                  <h2 id="titulo-tendencias">Resumen anual</h2>
                  <div className="ambiental-grid tendencias-grid">
                    {tendencias.map(({ serie, tendencia }) => (
                      <GraficoTendencia key={`${serie.variable}-${serie.procedencia.proveedor}`} tendencia={tendencia}
                        titulo={`${nombresVariable[serie.variable]} · ${serie.procedencia.proveedor === 'nasa-power' ? 'NASA POWER' : 'Open-Meteo'}`} />
                    ))}
                  </div>
                </section>
              )}
              <p className="ambiental-atribucion">
                NASA POWER y Open-Meteo se muestran en comparación; no son mediciones directas dentro de la parcela. La humedad del suelo proviene de una estimación de modelo de Open-Meteo para 0–7 cm. Atribución: Open-Meteo / ERA5-Land (CC BY 4.0).
              </p>
            </>
          ) : (
            <p className="aviso">No hay series disponibles para comparar. Revisa los avisos o consulta de nuevo.</p>
          )}
        </>
      )}
    </div>
  );
}
