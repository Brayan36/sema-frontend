import type { PuntoAmbientalFusionado, ProveedorAmbiental, SerieAmbientalFusionada } from '../../../types/ambiental';
import Card from '../../../components/ui/Card';
import '../analisis-visual.css';

const FUENTES: ProveedorAmbiental[] = ['nasa-power', 'open-meteo'];
const COLORES: Record<ProveedorAmbiental, string> = { 'nasa-power': '#375a8c', 'open-meteo': '#267247' };
const NOMBRES: Record<ProveedorAmbiental, string> = { 'nasa-power': 'NASA POWER', 'open-meteo': 'Open-Meteo' };
const ANCHO = 720;
const ALTO = 300;
const MARGEN = { arriba: 22, derecha: 20, abajo: 48, izquierda: 76 };
const MAX_MUESTRAS = 360;

type IntervaloVisual = 'horario' | 'diario' | 'mensual';
type VentanaGrafico = 'todo' | 'un-anio' | 'tres-anios';
type PuntoGrafico = PuntoAmbientalFusionado;
type SerieGrafica = { puntos: PuntoGrafico[]; intervalo: IntervaloVisual; unidad: string; descripcion: string };

function agruparPuntos(serie: SerieAmbientalFusionada, fuentes: ProveedorAmbiental[]): SerieGrafica {
  const inicio = new Date(`${serie.periodo.inicio}T00:00:00Z`);
  const fin = new Date(`${serie.periodo.fin}T00:00:00Z`);
  const dias = (fin.valueOf() - inicio.valueOf()) / 86_400_000;
  const mensual = serie.frecuencia === 'diaria' && dias > 90;
  const diario = serie.frecuencia === 'horaria' && dias > 3;

  if (!mensual && !diario) {
    const descripcion = serie.frecuencia === 'mensual'
      ? serie.variable === 'precipitacion' ? 'Acumulados mensuales' : 'Promedios mensuales'
      : serie.frecuencia === 'diaria'
        ? serie.variable === 'precipitacion' ? 'Precipitación diaria' : 'Valores diarios'
        : 'Observaciones horarias';
    return { puntos: serie.puntos, intervalo: serie.frecuencia, unidad: serie.unidad, descripcion };
  }

  const periodo: IntervaloVisual = mensual ? 'mensual' : 'diario';
  const grupos = new Map<string, {
    sumas: Partial<Record<ProveedorAmbiental, number>>;
    cantidades: Partial<Record<ProveedorAmbiental, number>>;
    presentes: Set<ProveedorAmbiental>;
  }>();

  for (const punto of serie.puntos) {
    const fechaGrupo = mensual ? punto.fecha.slice(0, 7) : punto.fecha.slice(0, 10);
    const grupo = grupos.get(fechaGrupo) ?? { sumas: {}, cantidades: {}, presentes: new Set<ProveedorAmbiental>() };
    for (const fuente of fuentes) {
      const valor = punto.valores[fuente];
      if (valor === undefined) continue;
      grupo.presentes.add(fuente);
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        grupo.sumas[fuente] = (grupo.sumas[fuente] ?? 0) + valor;
        grupo.cantidades[fuente] = (grupo.cantidades[fuente] ?? 0) + 1;
      }
    }
    grupos.set(fechaGrupo, grupo);
  }

  const puntos = [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([fecha, grupo]) => {
    if (mensual) {
      const [anio, mes] = fecha.split('-').map(Number);
      const primerDia = `${fecha}-01`;
      const ultimoDia = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
      if (serie.periodo.inicio > primerDia || serie.periodo.fin < ultimoDia) return [];
    }

    const valores: Partial<Record<ProveedorAmbiental, number | null>> = {};
    for (const fuente of grupo.presentes) {
      const cantidad = grupo.cantidades[fuente] ?? 0;
      const esperado = mensual
        ? new Date(Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)), 0)).getUTCDate()
        : 24;
      const cobertura = cantidad / esperado;
      valores[fuente] = cantidad === 0
        ? null
        : cobertura < 0.98
          ? null
        : serie.variable === 'precipitacion'
          ? grupo.sumas[fuente] as number
          : (grupo.sumas[fuente] as number) / cantidad;
    }
    return [{ fecha: mensual ? `${fecha}-01` : fecha, valores }];
  });

  if (puntos.length === 0) {
    const descripcion = serie.frecuencia === 'diaria'
      ? serie.variable === 'precipitacion' ? 'Precipitación diaria' : 'Valores diarios'
      : 'Observaciones horarias';
    return { puntos: serie.puntos, intervalo: serie.frecuencia, unidad: serie.unidad, descripcion };
  }

  const unidad = mensual && serie.variable === 'precipitacion' ? 'mm/mes' : serie.unidad;
  const descripcion = mensual
    ? serie.variable === 'precipitacion' ? 'Precipitación acumulada por mes' : 'Promedio mensual'
    : serie.variable === 'precipitacion' ? 'Precipitación acumulada por día' : 'Promedio diario';
  return { puntos, intervalo: periodo, unidad, descripcion };
}

function numero(valor: number): string {
  return valor.toLocaleString('es', { maximumFractionDigits: 2 });
}

function fechaTexto(fecha: string, intervalo: IntervaloVisual, periodoDias: number): string {
  const fechaUtc = new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T00:00:00Z` : fecha);
  if (Number.isNaN(fechaUtc.valueOf())) return fecha;
  const opciones: Intl.DateTimeFormatOptions = intervalo === 'mensual' || periodoDias > 500
    ? { month: 'short', year: '2-digit', timeZone: 'UTC' }
    : intervalo === 'horario'
      ? { day: '2-digit', month: 'short', hour: '2-digit', timeZone: 'UTC' }
      : { day: '2-digit', month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat('es', opciones).format(fechaUtc);
}

function seleccionarIndices(puntos: PuntoGrafico[], fuentes: ProveedorAmbiental[]): number[] {
  if (puntos.length <= MAX_MUESTRAS) return puntos.map((_, indice) => indice);
  const tamanoGrupo = Math.ceil(puntos.length / MAX_MUESTRAS);
  const seleccionados = new Set<number>([0, puntos.length - 1]);
  for (let inicio = 0; inicio < puntos.length; inicio += tamanoGrupo) {
    const fin = Math.min(inicio + tamanoGrupo, puntos.length);
    for (const fuente of fuentes) {
      let indiceMinimo = -1;
      let indiceMaximo = -1;
      for (let indice = inicio; indice < fin; indice += 1) {
        const valor = puntos[indice].valores[fuente];
        if (typeof valor !== 'number' || !Number.isFinite(valor)) continue;
        if (indiceMinimo < 0 || valor < (puntos[indiceMinimo].valores[fuente] as number)) indiceMinimo = indice;
        if (indiceMaximo < 0 || valor > (puntos[indiceMaximo].valores[fuente] as number)) indiceMaximo = indice;
      }
      if (indiceMinimo >= 0) seleccionados.add(indiceMinimo);
      if (indiceMaximo >= 0) seleccionados.add(indiceMaximo);
      const indiceNulo = puntos.slice(inicio, fin).findIndex((punto) => punto.valores[fuente] === null);
      if (indiceNulo >= 0) seleccionados.add(inicio + indiceNulo);
    }
  }
  return [...seleccionados].sort((a, b) => a - b);
}

export default function GraficoComparativo({ serie, titulo }: { serie: SerieAmbientalFusionada; titulo: string }) {
  const [fuentesOcultas, setFuentesOcultas] = useState<ProveedorAmbiental[]>([]);
  const [ventana, setVentana] = useState<VentanaGrafico>('todo');
  const [fechaActiva, setFechaActiva] = useState<string | null>(null);
  const fuentes = FUENTES.filter((fuente) => serie.procedenciaPorProveedor[fuente] !== undefined);
  const fuentesVisibles = fuentes.filter((fuente) => !fuentesOcultas.includes(fuente));
  const visual = agruparPuntos(serie, fuentes);
  const periodoDias = (new Date(`${serie.periodo.fin}T00:00:00Z`).valueOf() - new Date(`${serie.periodo.inicio}T00:00:00Z`).valueOf()) / 86_400_000;
  const limite = useMemo(() => {
    if (ventana === 'todo') return null;
    const fecha = new Date(`${serie.periodo.fin}T00:00:00Z`);
    fecha.setUTCFullYear(fecha.getUTCFullYear() - (ventana === 'un-anio' ? 1 : 3));
    return fecha.toISOString().slice(0, 10);
  }, [ventana, serie.periodo.fin]);
  const puntosFiltrados = visual.puntos.filter((punto) => !limite || punto.fecha.slice(0, 10) >= limite);
  const indices = seleccionarIndices(puntosFiltrados, fuentesVisibles);
  const puntos = indices.map((indice) => ({ indice, punto: puntosFiltrados[indice] }));
  const valores = puntos.flatMap(({ punto }) => fuentes.flatMap((fuente) => {
    if (!fuentesVisibles.includes(fuente)) return [];
    const valor = punto.valores[fuente];
    return typeof valor === 'number' && Number.isFinite(valor) ? [valor] : [];
  }));

  if (!fuentes.length || !valores.length) {
    return <Card className="visual-tarjeta"><h3>{titulo}</h3><p className="visual-vacio">No hay observaciones válidas para graficar.</p></Card>;
  }

  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
  const precipitacion = serie.variable === 'precipitacion';
  const minDato = Math.min(...valores);
  const maxDato = Math.max(...valores);
  const rango = maxDato - minDato || Math.max(Math.abs(maxDato) * 0.1, 1);
  const minY = precipitacion ? Math.min(0, minDato) : minDato - rango * 0.08;
  const maxY = maxDato + rango * 0.08;
  const y = (valor: number) => MARGEN.arriba + (maxY - valor) / (maxY - minY) * altoUtil;
  const x = (indice: number) => MARGEN.izquierda
    + (puntosFiltrados.length <= 1 ? anchoUtil / 2 : indice / (puntosFiltrados.length - 1) * anchoUtil);
  const ticksY = Array.from({ length: 5 }, (_, indice) => maxY - indice / 4 * (maxY - minY));
  const anchoBarra = Math.max(1, Math.min(8, anchoUtil / puntosFiltrados.length * 0.72 / fuentesVisibles.length));
  const cantidadEtiquetas = Math.min(5, puntosFiltrados.length);
  const objetivosEje = Array.from({ length: cantidadEtiquetas }, (_, indice) =>
    Math.round(indice * (puntosFiltrados.length - 1) / (cantidadEtiquetas - 1 || 1)));
  const puntoActivo = fechaActiva ? puntosFiltrados.find(({ fecha }) => fecha === fechaActiva) : null;

  const cambiarFuente = (fuente: ProveedorAmbiental) => {
    if (!fuentesOcultas.includes(fuente)) {
      if (fuentesVisibles.length <= 1) return;
      setFuentesOcultas([...fuentesOcultas, fuente]);
    } else setFuentesOcultas(fuentesOcultas.filter((actual) => actual !== fuente));
  };

  return (
    <Card className="visual-tarjeta grafico-comparativo-tarjeta">
      <div className="visual-encabezado">
        <div><h3>{titulo}</h3><p className="grafico-descripcion">{visual.descripcion}</p></div>
        <span>{visual.unidad}</span>
      </div>
      <div className="grafico-leyenda" aria-label="Fuentes de datos. Activa o desactiva cada fuente">
        {fuentes.map((fuente) => {
          const procedencia = serie.procedenciaPorProveedor[fuente];
          const detalle = procedencia?.modelo ?? procedencia?.conjuntoDatos;
          return <button type="button" key={fuente} className={`grafico-fuente-boton${fuentesVisibles.includes(fuente) ? ' activo' : ''}`}
            aria-pressed={fuentesVisibles.includes(fuente)} onClick={() => cambiarFuente(fuente)}>
            <i style={{ backgroundColor: COLORES[fuente] }} />{NOMBRES[fuente]}{detalle ? ` · ${detalle}` : ''}
          </button>;
        })}
      </div>
      {periodoDias > 400 && <div className="grafico-controles" role="group" aria-label="Periodo visible">
        {(['todo', 'tres-anios', 'un-anio'] as VentanaGrafico[]).map((opcion) => <button type="button" key={opcion}
          className={`grafico-control${ventana === opcion ? ' activo' : ''}`} aria-pressed={ventana === opcion}
          onClick={() => setVentana(opcion)}>{opcion === 'todo' ? 'Todo el periodo' : opcion === 'tres-anios' ? 'Últimos 3 años' : 'Último año'}</button>)}
      </div>}
      <figure className="grafico-figura">
        <svg className="grafico-svg" viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group"
          aria-label={`${titulo}, ${visual.descripcion}, comparación de ${fuentes.map((fuente) => NOMBRES[fuente]).join(' y ')}, ${serie.periodo.inicio} a ${serie.periodo.fin}`}>
          <title>{titulo}: {visual.descripcion}</title>
          {ticksY.map((valor) => (
            <g key={valor}>
              <line className="grafico-cuadricula" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(valor)} y2={y(valor)} />
              <text className="grafico-etiqueta-y" x={MARGEN.izquierda - 10} y={y(valor) + 4} textAnchor="end">{numero(valor)}</text>
            </g>
          ))}
          {precipitacion ? puntos.map(({ indice, punto }) => (
            <g key={punto.fecha}>
              {fuentesVisibles.map((fuente, indiceFuente) => {
                const valor = punto.valores[fuente];
                if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
                const centro = x(indice) + (indiceFuente - (fuentesVisibles.length - 1) / 2) * anchoBarra;
                return <rect key={fuente} x={centro - anchoBarra / 2} y={y(valor)} width={anchoBarra}
                  height={Math.max(1, y(minY) - y(valor))} fill={COLORES[fuente]} rx="1" role="button" tabIndex={0}
                  aria-label={`${NOMBRES[fuente]}, ${punto.fecha}: ${numero(valor)} ${visual.unidad}`}
                  onPointerEnter={() => setFechaActiva(punto.fecha)} onFocus={() => setFechaActiva(punto.fecha)}>
                  <title>{NOMBRES[fuente]}: {punto.fecha}, {numero(valor)} {visual.unidad}</title>
                </rect>;
              })}
            </g>
          )) : fuentesVisibles.map((fuente) => {
            let segmento = '';
            let segmentoAbierto = false;
            const marcas: { indice: number; valor: number; fecha: string }[] = [];
            for (const { indice, punto } of puntos) {
              const valor = punto.valores[fuente];
              if (typeof valor !== 'number' || !Number.isFinite(valor)) {
                segmentoAbierto = false;
                continue;
              }
              segmento = `${segmento}${segmentoAbierto ? ' L' : ' M'} ${x(indice).toFixed(1)} ${y(valor).toFixed(1)}`;
              segmentoAbierto = true;
              marcas.push({ indice, valor, fecha: punto.fecha });
            }
            return <g key={fuente}>
              <path d={segmento} className="grafico-linea" stroke={COLORES[fuente]} />
              {marcas.map(({ indice, valor, fecha }) => (
                <circle key={fecha} cx={x(indice)} cy={y(valor)} r="4" fill={COLORES[fuente]} role="button" tabIndex={0}
                  aria-label={`${NOMBRES[fuente]}, ${fecha}: ${numero(valor)} ${visual.unidad}`}
                  onPointerEnter={() => setFechaActiva(fecha)} onFocus={() => setFechaActiva(fecha)}>
                  <title>{NOMBRES[fuente]}: {fecha}, {numero(valor)} {visual.unidad}</title>
                </circle>
              ))}
            </g>;
          })}
          {objetivosEje.map((indice) => (
              <text key={puntosFiltrados[indice].fecha} className="grafico-etiqueta-x" x={x(indice)} y={ALTO - 16} textAnchor="middle">
              {fechaTexto(puntosFiltrados[indice].fecha, visual.intervalo, periodoDias)}
            </text>
          ))}
        </svg>
        <figcaption className="grafico-fuente"><span>Periodo consultado: {serie.periodo.inicio} — {serie.periodo.fin}</span><span>Escala común · observaciones originales en Datos históricos</span></figcaption>
      </figure>
      {puntoActivo && <div className="grafico-detalle" aria-live="polite"><strong>{fechaTexto(puntoActivo.fecha, visual.intervalo, periodoDias)}</strong>
        {fuentesVisibles.map((fuente) => { const valor = puntoActivo.valores[fuente]; return <span key={fuente}><i style={{ backgroundColor: COLORES[fuente] }} />{NOMBRES[fuente]}: {typeof valor === 'number' ? `${numero(valor)} ${visual.unidad}` : valor === null ? 'Dato ausente' : 'Sin observación'}</span>; })}
      </div>}
    </Card>
  );
}
import { useMemo, useState } from 'react';
