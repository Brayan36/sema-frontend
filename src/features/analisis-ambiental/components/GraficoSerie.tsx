import type { PuntoSerieAmbiental, SerieAmbiental, VariableAmbiental } from '../../../types/ambiental';
import Card from '../../../components/ui/Card';
import '../analisis-visual.css';

const colores: Record<VariableAmbiental, string> = {
  temperatura: '#d26a35',
  precipitacion: '#277da1',
  'radiacion-solar': '#c89016',
  'humedad-relativa': '#3c8763',
  'humedad-suelo': '#7757a6',
  'temperatura-suelo': '#a94f37',
  'velocidad-viento': '#477c9b',
  evapotranspiracion: '#508066',
};

const nombres: Record<VariableAmbiental, string> = {
  temperatura: 'Temperatura',
  precipitacion: 'Precipitación',
  'radiacion-solar': 'Radiación solar',
  'humedad-relativa': 'Humedad relativa',
  'humedad-suelo': 'Humedad del suelo',
  'temperatura-suelo': 'Temperatura del suelo',
  'velocidad-viento': 'Velocidad del viento',
  evapotranspiracion: 'Evapotranspiración',
};

const ANCHO = 720;
const ALTO = 300;
const MARGEN = { arriba: 18, derecha: 20, abajo: 48, izquierda: 70 };
const MAXIMO_PUNTOS_DIBUJADOS = 320;

type PuntoMuestreado = { indiceOriginal: number; punto: PuntoSerieAmbiental };

function reducirPuntos(puntos: PuntoSerieAmbiental[]): PuntoMuestreado[] {
  if (puntos.length <= MAXIMO_PUNTOS_DIBUJADOS) {
    return puntos.map((punto, indiceOriginal) => ({ punto, indiceOriginal }));
  }

  const tamanoBloque = Math.ceil(puntos.length / MAXIMO_PUNTOS_DIBUJADOS);
  const reducidos: { indice: number; punto: PuntoSerieAmbiental }[] = [];
  for (let inicio = 0; inicio < puntos.length; inicio += tamanoBloque) {
    const bloque = puntos.slice(inicio, inicio + tamanoBloque);
    const validos = bloque
      .map((punto, indice) => ({ punto, indice: inicio + indice }))
      .filter((item): item is { punto: PuntoSerieAmbiental & { valor: number }; indice: number } =>
        item.punto.valor !== null && Number.isFinite(item.punto.valor));
    if (validos.length) {
      reducidos.push(validos.reduce((menor, actual) => actual.punto.valor < menor.punto.valor ? actual : menor));
      reducidos.push(validos.reduce((mayor, actual) => actual.punto.valor > mayor.punto.valor ? actual : mayor));
    }
    const nulo = bloque.findIndex((punto) => punto.valor === null);
    if (nulo >= 0) reducidos.push({ indice: inicio + nulo, punto: bloque[nulo] });
  }

  const indicesIncluidos = new Set<number>();
  return reducidos
    .sort((a, b) => a.indice - b.indice)
    .filter(({ indice }) => {
      if (indicesIncluidos.has(indice)) return false;
      indicesIncluidos.add(indice);
      return true;
    })
    .map(({ punto, indice }) => ({ punto, indiceOriginal: indice }));
}

function fechaGrafico(fecha: string, frecuencia: SerieAmbiental['frecuencia']): Date {
  return frecuencia === 'horaria' && !/(Z|[+-]\d{2}:?\d{2})$/.test(fecha)
    ? new Date(`${fecha}Z`)
    : frecuencia === 'diaria' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
      ? new Date(`${fecha}T00:00:00Z`)
      : new Date(fecha);
}

function etiquetaFecha(fecha: string, frecuencia: SerieAmbiental['frecuencia'], rangoDias: number): string {
  const date = fechaGrafico(fecha, frecuencia);
  if (Number.isNaN(date.valueOf())) return fecha;
  const opciones: Intl.DateTimeFormatOptions = rangoDias > 500
    ? { month: 'short', year: '2-digit', timeZone: 'UTC' }
    : { day: '2-digit', month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat('es', opciones).format(date);
}

function formatoNumero(valor: number): string {
  return valor.toLocaleString('es', { maximumFractionDigits: 2 });
}

export default function GraficoSerie({ serie, titulo }: { serie: SerieAmbiental; titulo?: string }) {
  const datos = reducirPuntos(serie.puntos);
  const validos = datos.filter((dato): dato is PuntoMuestreado & { punto: PuntoSerieAmbiental & { valor: number } } =>
    typeof dato.punto.valor === 'number' && Number.isFinite(dato.punto.valor));
  const tituloGrafico = titulo ?? nombres[serie.variable];
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const maximoFecha = serie.puntos.length ? fechaGrafico(serie.puntos[serie.puntos.length - 1].fecha, serie.frecuencia) : null;
  const minimoFecha = serie.puntos.length ? fechaGrafico(serie.puntos[0].fecha, serie.frecuencia) : null;
  const rangoDias = minimoFecha && maximoFecha
    ? Math.abs(maximoFecha.valueOf() - minimoFecha.valueOf()) / 86_400_000
    : 0;
  const precipitacion = serie.variable === 'precipitacion';

  if (validos.length === 0) {
    return (
      <Card className="visual-tarjeta">
        <h3>{tituloGrafico}</h3>
        <p className="visual-vacio">No hay observaciones válidas para graficar.</p>
      </Card>
    );
  }

  const valores = validos.map(({ punto }) => punto.valor);
  const valorMinimo = precipitacion ? Math.min(0, ...valores) : Math.min(...valores);
  const valorMaximo = Math.max(...valores);
  const amplitud = valorMaximo - valorMinimo || Math.max(Math.abs(valorMaximo) * 0.1, 1);
  const dominioMinimo = precipitacion ? Math.min(0, valorMinimo) : valorMinimo - amplitud * 0.08;
  const dominioMaximo = valorMaximo + amplitud * 0.08;
  const y = (valor: number) => MARGEN.arriba + (dominioMaximo - valor) / (dominioMaximo - dominioMinimo) * altoUtil;
  const x = (indiceOriginal: number) => MARGEN.izquierda
    + (serie.puntos.length <= 1 ? anchoUtil / 2 : indiceOriginal / (serie.puntos.length - 1) * anchoUtil);
  const ticksY = Array.from({ length: 5 }, (_, indice) => dominioMaximo - indice / 4 * (dominioMaximo - dominioMinimo));
  const color = colores[serie.variable];
  const partesLinea: string[] = [];
  let segmentoAbierto = false;
  datos.forEach(({ punto, indiceOriginal }) => {
    if (punto.valor === null || !Number.isFinite(punto.valor)) {
      segmentoAbierto = false;
      return;
    }
    partesLinea.push(`${segmentoAbierto ? 'L' : 'M'} ${x(indiceOriginal).toFixed(1)} ${y(punto.valor).toFixed(1)}`);
    segmentoAbierto = true;
  });
  const anchoBarra = Math.max(1, Math.min(8, anchoUtil / serie.puntos.length * 0.72));
  const indiceEtiquetas = Array.from({ length: Math.min(5, serie.puntos.length) }, (_, indice) => {
    const objetivo = Math.round(indice * (serie.puntos.length - 1) / (Math.min(5, serie.puntos.length) - 1 || 1));
    return datos.reduce((cercano, actual) =>
      Math.abs(actual.indiceOriginal - objetivo) < Math.abs(cercano.indiceOriginal - objetivo) ? actual : cercano,
    datos[0]);
  });

  return (
    <Card className="visual-tarjeta">
      <div className="visual-encabezado">
        <h3>{tituloGrafico}</h3>
        <span>{serie.unidad} · {serie.frecuencia}</span>
      </div>
      <figure className="grafico-figura">
        <svg className="grafico-svg" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img"
          aria-label={`${tituloGrafico}, ${serie.procedencia.proveedor}, del ${serie.periodo.inicio} al ${serie.periodo.fin}`}>
          <title>{tituloGrafico}: {serie.procedencia.proveedor}, {serie.periodo.inicio} — {serie.periodo.fin}</title>
          {ticksY.map((valor) => (
            <g key={valor}>
              <line className="grafico-cuadricula" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(valor)} y2={y(valor)} />
              <text className="grafico-etiqueta-y" x={MARGEN.izquierda - 10} y={y(valor) + 4} textAnchor="end">{formatoNumero(valor)}</text>
            </g>
          ))}
          {precipitacion ? datos.map(({ punto, indiceOriginal }) =>
            punto.valor === null || !Number.isFinite(punto.valor) ? null : (
            <g key={`${punto.fecha}-${indiceOriginal}`}>
              <rect x={x(indiceOriginal) - anchoBarra / 2} y={y(punto.valor)} width={anchoBarra}
                height={Math.max(1, y(dominioMinimo) - y(punto.valor))} fill={color} rx="1">
                <title>{punto.fecha}: {formatoNumero(punto.valor)} {serie.unidad}</title>
              </rect>
            </g>
          )) : (
            <>
              <path d={partesLinea.join(' ')} className="grafico-linea" stroke={color} />
              {datos.map(({ punto, indiceOriginal }) =>
                punto.valor === null || !Number.isFinite(punto.valor) ? null : (
                <circle key={`${punto.fecha}-${indiceOriginal}`} cx={x(indiceOriginal)} cy={y(punto.valor)} r="2.7" fill={color}>
                  <title>{punto.fecha}: {formatoNumero(punto.valor)} {serie.unidad}</title>
                </circle>
              ))}
            </>
          )}
          {indiceEtiquetas.map(({ punto, indiceOriginal }) => (
            <text key={`${punto.fecha}-${indiceOriginal}`} className="grafico-etiqueta-x"
              x={x(indiceOriginal)} y={ALTO - 16} textAnchor="middle">
              {etiquetaFecha(punto.fecha, serie.frecuencia, rangoDias)}
            </text>
          ))}
        </svg>
        <figcaption className="grafico-fuente">
          <span>{serie.procedencia.proveedor === 'nasa-power' ? 'NASA POWER' : 'Open-Meteo'} · {serie.procedencia.conjuntoDatos}</span>
          <span>{serie.periodo.inicio} — {serie.periodo.fin}</span>
        </figcaption>
      </figure>
    </Card>
  );
}
