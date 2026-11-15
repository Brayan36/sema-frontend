import { useState } from 'react';
import type { TendenciaHistorica } from '../../../types/ambiental';
import Card from '../../../components/ui/Card';
import '../analisis-visual.css';

const ANCHO = 720;
const ALTO = 260;
const MARGEN = { arriba: 20, derecha: 24, abajo: 42, izquierda: 72 };

function numero(valor: number): string {
  return valor.toLocaleString('es', { maximumFractionDigits: 2 });
}

export default function GraficoTendencia({ tendencia, titulo }: { tendencia: TendenciaHistorica; titulo: string }) {
  const [anioActivo, setAnioActivo] = useState<number | null>(null);
  const puntos = tendencia.puntosAnuales;
  if (puntos.length === 0) {
    return <Card className="visual-tarjeta"><h3>{titulo}</h3><p className="visual-vacio">No hay años completos con cobertura suficiente para calcular la tendencia.</p></Card>;
  }

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const minimo = Math.min(...puntos.map(({ valor }) => valor));
  const maximo = Math.max(...puntos.map(({ valor }) => valor));
  const amplitud = maximo - minimo || Math.max(Math.abs(maximo) * 0.1, 1);
  const minY = minimo - amplitud * 0.1;
  const maxY = maximo + amplitud * 0.1;
  const minAnio = puntos[0].anio;
  const maxAnio = puntos[puntos.length - 1].anio;
  const x = (anio: number) => MARGEN.izquierda
    + (maxAnio === minAnio ? anchoUtil / 2 : (anio - minAnio) / (maxAnio - minAnio) * anchoUtil);
  const y = (valor: number) => MARGEN.arriba + (maxY - valor) / (maxY - minY) * altoUtil;
  const linea = puntos.map((punto, indice) => `${indice ? 'L' : 'M'} ${x(punto.anio)} ${y(punto.valor)}`).join(' ');
  const mediaAnio = puntos.reduce((total, punto) => total + punto.anio, 0) / puntos.length;
  const mediaValor = puntos.reduce((total, punto) => total + punto.valor, 0) / puntos.length;
  const intercepto = tendencia.pendientePorAnio === null
    ? null
    : mediaValor - tendencia.pendientePorAnio * mediaAnio;
  const valoresEje = Array.from({ length: 5 }, (_, indice) => maxY - indice / 4 * (maxY - minY));
  const aniosEje = puntos.length <= 5
    ? puntos.map(({ anio }) => anio)
    : Array.from({ length: 5 }, (_, indice) => Math.round(minAnio + indice / 4 * (maxAnio - minAnio)));
  const direccion = {
    ascendente: 'Tendencia ascendente',
    descendente: 'Tendencia descendente',
    'sin-tendencia': 'Sin cambio lineal detectado',
    'datos-insuficientes': 'Datos insuficientes para estimar tendencia',
  }[tendencia.direccion];
  const puntoActivo = puntos.find((punto) => punto.anio === anioActivo);

  return (
    <Card className="visual-tarjeta">
      <div className="visual-encabezado"><h3>{titulo}</h3><span>{tendencia.unidadValorAnual} · {direccion}</span></div>
      <svg className="grafico-svg grafico-tendencia" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group"
        aria-label={`${titulo}: ${direccion}, ${puntos.length} años incluidos`}>
        <title>{titulo}: evolución anual y línea de tendencia</title>
        {valoresEje.map((valor) => (
          <g key={valor}>
            <line className="grafico-cuadricula" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(valor)} y2={y(valor)} />
            <text className="grafico-etiqueta-y" x={MARGEN.izquierda - 10} y={y(valor) + 4} textAnchor="end">{numero(valor)}</text>
          </g>
        ))}
        <path d={linea} className="grafico-linea" stroke="#267247" />
        {intercepto !== null && tendencia.pendientePorAnio !== null && (
          <line className="grafico-linea-tendencia" x1={x(minAnio)} y1={y(tendencia.pendientePorAnio * minAnio + intercepto)}
            x2={x(maxAnio)} y2={y(tendencia.pendientePorAnio * maxAnio + intercepto)} />
        )}
        {puntos.map((punto) => (
          <circle key={punto.anio} cx={x(punto.anio)} cy={y(punto.valor)} r="5" fill="#267247" role="button" tabIndex={0}
            aria-label={`${punto.anio}: ${numero(punto.valor)} ${tendencia.unidadValorAnual}; ${Math.round(punto.cobertura * 100)}% de cobertura`}
            onPointerEnter={() => setAnioActivo(punto.anio)} onFocus={() => setAnioActivo(punto.anio)}>
            <title>{punto.anio}: {numero(punto.valor)} {tendencia.unidadValorAnual} ({Math.round(punto.cobertura * 100)}% cobertura)</title>
          </circle>
        ))}
        {aniosEje.map((anio) => (
          <text key={anio} className="grafico-etiqueta-x" x={x(anio)} y={ALTO - 14} textAnchor="middle">{anio}</text>
        ))}
      </svg>
      {puntoActivo && <div className="grafico-detalle tendencia-detalle" aria-live="polite">
        <strong>{puntoActivo.anio}</strong>
        <span>{numero(puntoActivo.valor)} {tendencia.unidadValorAnual}</span>
        <span>{Math.round(puntoActivo.cobertura * 100)}% de cobertura · {puntoActivo.observaciones} observaciones</span>
      </div>}
      <p className="tendencia-resumen">
        {tendencia.pendientePorAnio === null
          ? 'La serie necesita al menos tres años válidos para calcular la pendiente.'
          : `Cambio tendencial: ${numero(tendencia.pendientePorAnio)} ${tendencia.unidadTendencia}. No es un pronóstico.`}
      </p>
      {tendencia.aniosExcluidos.length > 0 && <p className="visual-nota">Años excluidos por periodo incompleto o cobertura insuficiente: {tendencia.aniosExcluidos.join(', ')}.</p>}
    </Card>
  );
}
