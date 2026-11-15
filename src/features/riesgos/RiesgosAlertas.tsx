import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import type { AnalisisDisponible, ReglaRiesgo } from '../../types/ambiental';
import { evaluarReglasRiesgo } from './services/evaluarReglas';
import ListaRiesgos from './components/ListaRiesgos';
import EditorReglasRiesgo from './components/EditorReglasRiesgo';
import '../analisis-ambiental/analisis-pantallas.css';

export default function RiesgosAlertas({
  disponible,
  reglas,
  onAgregarRegla,
  onEliminarRegla,
}: {
  disponible: AnalisisDisponible | null;
  reglas: ReglaRiesgo[];
  onAgregarRegla: (regla: ReglaRiesgo) => void;
  onEliminarRegla: (id: string) => void;
}) {
  const series = disponible?.analisis.series ?? [];
  const resultados = evaluarReglasRiesgo(reglas, series);

  return (
    <div className="pagina ambiental-pagina">
      <h1>Riesgos y alertas</h1>
      <p className="introduccion">
        Configura indicadores para vigilar los datos
        ambientales de tu finca. La severidad y los
        umbrales dependen de tus reglas.
      </p>

      {!disponible && (
        <Card className="riesgos-sin-datos">
          <h2>Primero consulta datos ambientales</h2>
          <p>
            La evaluación necesita series de NASA POWER
            u Open-Meteo para la ubicación y el periodo
            que quieras revisar.
          </p>
          <Link className="enlace-boton" to="/analisis-climatico">
            Ir al análisis climático
          </Link>
        </Card>
      )}

      {disponible && (
        <div className="ambiental-estado" role="status">
          <strong>{series.length} series disponibles</strong>
          <span>
            {disponible.analisis.periodo?.inicio ??
              disponible.analisis.series[0]?.periodo.inicio}
            {' — '}
            {disponible.analisis.periodo?.fin ??
              disponible.analisis.series[0]?.periodo.fin}
          </span>
          <span>
            Fuente: {disponible.fuente === 'cache-local'
              ? 'copia local'
              : disponible.fuente === 'backend'
                ? 'backend'
                : 'proveedores'}
          </span>
        </div>
      )}

      <div className="riesgos-layout">
        <EditorReglasRiesgo
          series={series}
          reglas={reglas}
          onAgregar={onAgregarRegla}
          onEliminar={onEliminarRegla}
        />
        <ListaRiesgos riesgos={resultados} />
      </div>

      <nav
        aria-label="Continuar recorrido agrícola"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '32px',
          marginBottom: '24px',
        }}
      >
        <Link
          to="/datos-historicos"
          className="enlace-boton"
        >
          Continuar a Datos históricos →
        </Link>
      </nav>
    </div>
  );
}
