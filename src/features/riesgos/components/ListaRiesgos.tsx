import type { ResultadoRiesgo, SeveridadRiesgo } from '../../../types/ambiental';
import Card from '../../../components/ui/Card';
import { Link } from 'react-router-dom';
import '../../analisis-ambiental/analisis-visual.css';

const etiquetasEstado: Record<ResultadoRiesgo['estado'], string> = {
  activo: 'Indicador activo',
  'sin-riesgo': 'Sin condición de riesgo',
  'sin-datos': 'Sin datos',
  'datos-insuficientes': 'Datos insuficientes',
  'regla-invalida': 'Regla no válida',
};

const etiquetasSeveridad: Record<SeveridadRiesgo, string> = {
  informativo: 'Informativo',
  bajo: 'Bajo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
};

const ordenSeveridad: SeveridadRiesgo[] = ['critico', 'alto', 'moderado', 'bajo', 'informativo'];

function valorConUnidad(riesgo: ResultadoRiesgo): string {
  return riesgo.valorEvaluado === null
    ? '—'
    : `${riesgo.valorEvaluado.toLocaleString('es', { maximumFractionDigits: 2 })} ${riesgo.unidad}`;
}

export default function ListaRiesgos({ riesgos, hrefConfigurar }: { riesgos: ResultadoRiesgo[]; hrefConfigurar?: string }) {
  const ordenados = [...riesgos].sort((a, b) => {
    if (a.estado === 'activo' && b.estado !== 'activo') return -1;
    if (b.estado === 'activo' && a.estado !== 'activo') return 1;
    return ordenSeveridad.indexOf(a.severidad) - ordenSeveridad.indexOf(b.severidad);
  });

  return (
    <Card className="visual-tarjeta riesgos-tarjeta" aria-label="Indicadores de riesgo">
      <div className="visual-encabezado">
        <h2>Indicadores y riesgos</h2>
        <span>{riesgos.filter(({ estado }) => estado === 'activo').length} activos</span>
      </div>
      {ordenados.length === 0 ? (
        <div className="visual-vacio">
          <p>Aún no hay reglas configuradas; no se puede determinar si existe una condición de riesgo.</p>
          {hrefConfigurar && <Link className="enlace-boton secundario" to={hrefConfigurar}>Configurar indicadores</Link>}
        </div>
      ) : (
        <ul className="riesgos-lista">
          {ordenados.map((riesgo) => (
            <li className={`riesgo-item riesgo-${riesgo.estado}`} key={riesgo.reglaId}>
              <div className="riesgo-cabecera">
                <div>
                  <h3>{riesgo.nombre}</h3>
                  <p>{etiquetasEstado[riesgo.estado]} · Severidad {etiquetasSeveridad[riesgo.severidad]}</p>
                </div>
                <strong>{valorConUnidad(riesgo)}</strong>
              </div>
              <p className="riesgo-explicacion">{riesgo.explicacion}</p>
              <small>{riesgo.proveedor === 'nasa-power' ? 'NASA POWER' : 'Open-Meteo'} · {riesgo.puntosEvaluados} observaciones evaluadas</small>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
