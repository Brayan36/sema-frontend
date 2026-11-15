import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import type {
  AnalisisDisponible,
  SerieAmbiental,
} from '../../types/ambiental';
import { fusionarSeriesAmbientales } from './services/fusionarSeries';
import TablaHistorica from './components/TablaHistorica';
import { descargarDocumentoAnalisis } from './services/documentoAmbiental';
import './analisis-pantallas.css';

const SERIES_VACIAS: SerieAmbiental[] = [];

export default function DatosHistoricos({
  disponible,
}: {
  disponible: AnalisisDisponible | null;
}) {
  const series =
    disponible?.analisis.series ?? SERIES_VACIAS;

  const fusion = useMemo(
    () => fusionarSeriesAmbientales(series),
    [series]
  );

  return (
    <div className="pagina ambiental-pagina">

      <h1>Datos históricos</h1>

      <p className="introduccion">
        Consulta las observaciones históricas por
        variable, fecha y fuente de datos.
      </p>

      {!disponible ? (
        <Card className="historico-sin-datos">
          <h2>Primero consulta un periodo</h2>

          <p>
            Después de consultar NASA POWER y
            Open-Meteo, aquí podrás revisar los
            valores históricos en una tabla.
          </p>

          <Link
            className="enlace-boton"
            to="/analisis-climatico"
          >
            Ir al análisis climático
          </Link>
        </Card>
      ) : (
        <>
          <div
            className="ambiental-estado"
            role="status"
          >
            <strong>
              {series.length} series históricas
            </strong>

            <span>
              Periodo:{' '}
              {disponible.analisis.periodo?.inicio ??
                series[0]?.periodo.inicio}
              {' — '}
              {disponible.analisis.periodo?.fin ??
                series[0]?.periodo.fin}
            </span>

            <span>
              Consulta:{' '}
              {new Date(
                disponible.analisis.obtenidoEn
              ).toLocaleString('es')}
            </span>

            <span>
              Fuente:{' '}
              {disponible.fuente === 'cache-local'
                ? 'copia local'
                : disponible.fuente === 'backend'
                  ? 'backend'
                  : 'proveedores'}
            </span>

            {disponible.cacheVencida && (
              <span>Copia local vencida</span>
            )}
          </div>

          <div className="historico-acciones">
            <Button
              type="button"
              className="boton-terciario"
              onClick={() =>
                descargarDocumentoAnalisis(
                  disponible.analisis
                )
              }
            >
              Descargar JSON del análisis y
              respuestas originales
            </Button>
          </div>

          {[
            ...disponible.avisos,
            ...fusion.avisos,
          ].length > 0 && (
            <ul
              className="ambiental-avisos"
              aria-label="Avisos de datos históricos"
            >
              {[
                ...disponible.avisos,
                ...fusion.avisos,
              ].map((aviso, indice) => (
                <li key={`${indice}-${aviso}`}>
                  {aviso}
                </li>
              ))}
            </ul>
          )}

          {fusion.series.length > 0 ? (
            <TablaHistorica
              series={fusion.series}
            />
          ) : (
            <p className="aviso">
              No hay observaciones históricas
              disponibles para esta consulta.
            </p>
          )}
        </>
      )}

      {/* NAVEGACIÓN A ROTACIÓN DE CULTIVOS */}

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
          to="/rotacion-cultivos"
          className="enlace-boton"
        >
          Continuar a Rotación de cultivos →
        </Link>
      </nav>

    </div>
  );
}
