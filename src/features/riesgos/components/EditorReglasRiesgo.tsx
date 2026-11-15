import { useState, type FormEvent } from 'react';
import Button from '../../../components/ui/Button';
import type { CondicionReglaRiesgo, MedidaReglaRiesgo, ReglaRiesgo, SerieAmbiental, SeveridadRiesgo } from '../../../types/ambiental';
import '../../analisis-ambiental/analisis-visual.css';

const etiquetasMedida: Record<MedidaReglaRiesgo, string> = {
  ultimo: 'Último dato',
  promedio: 'Promedio de la ventana',
  minimo: 'Mínimo de la ventana',
  maximo: 'Máximo de la ventana',
};

function idRegla(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `regla-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function EditorReglasRiesgo({
  series,
  reglas,
  onAgregar,
  onEliminar,
}: {
  series: SerieAmbiental[];
  reglas: ReglaRiesgo[];
  onAgregar: (regla: ReglaRiesgo) => void;
  onEliminar: (id: string) => void;
}) {
  const [indiceSerie, setIndiceSerie] = useState('0');
  const [nombre, setNombre] = useState('');
  const [condicion, setCondicion] = useState<CondicionReglaRiesgo>('menor-que');
  const [medida, setMedida] = useState<MedidaReglaRiesgo>('ultimo');
  const [cantidadPuntos, setCantidadPuntos] = useState('1');
  const [umbral, setUmbral] = useState('');
  const [umbralSuperior, setUmbralSuperior] = useState('');
  const [severidad, setSeveridad] = useState<SeveridadRiesgo>('moderado');
  const indiceSeleccionado = Math.min(Math.max(Number(indiceSerie) || 0, 0), Math.max(series.length - 1, 0));
  const serie = series[indiceSeleccionado];

  function agregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!serie) return;

    const limite = Number(umbral);
    const limiteSuperior = Number(umbralSuperior);
    const cantidad = Number(cantidadPuntos);
    if (!Number.isFinite(limite) || !Number.isInteger(cantidad) || cantidad < 1) return;
    if (condicion === 'fuera-de-rango' && (!Number.isFinite(limiteSuperior) || limiteSuperior < limite)) return;

    const descripcionCondicion = condicion === 'menor-que'
      ? `menor que ${limite}`
      : condicion === 'mayor-que'
        ? `mayor que ${limite}`
        : `fuera del rango ${limite} a ${limiteSuperior}`;
    const regla: ReglaRiesgo = {
      id: idRegla(),
      nombre: nombre.trim() || `Alerta de ${serie.variable.replaceAll('-', ' ')}`,
      variable: serie.variable,
      unidad: serie.unidad,
      frecuencia: serie.frecuencia,
      proveedor: serie.procedencia.proveedor,
      condicion,
      medida,
      cantidadPuntos: cantidad,
      umbral: limite,
      ...(condicion === 'fuera-de-rango' ? { umbralSuperior: limiteSuperior } : {}),
      severidad,
      explicacion: `Regla configurada por el usuario: ${etiquetasMedida[medida].toLowerCase()} de los últimos ${cantidad} datos válidos ${descripcionCondicion} ${serie.unidad}.`,
    };
    onAgregar(regla);
    setNombre('');
  }

  return (
    <section className="editor-riesgos" aria-labelledby="titulo-configurar-riesgos">
      <div className="visual-encabezado">
        <h2 id="titulo-configurar-riesgos">Configurar indicadores</h2>
        <span>Las reglas usan tus umbrales</span>
      </div>
      {series.length === 0 ? (
        <p className="visual-vacio">Consulta primero datos en la pantalla 04 para definir reglas.</p>
      ) : (
        <form className="regla-formulario" onSubmit={agregar}>
          <div className="campo">
            <label htmlFor="regla-nombre">Nombre del indicador</label>
            <input id="regla-nombre" value={nombre} onChange={(evento) => setNombre(evento.target.value)} maxLength={70} placeholder="Ej.: Lluvia por debajo del límite" />
          </div>
          <div className="campo">
            <label htmlFor="regla-serie">Serie de datos</label>
            <select id="regla-serie" value={String(indiceSeleccionado)} onChange={(evento) => setIndiceSerie(evento.target.value)} required>
              {series.map((opcion, indice) => (
                <option key={`${opcion.procedencia.proveedor}-${opcion.variable}-${opcion.frecuencia}-${indice}`} value={indice}>
                  {(opcion.procedencia.proveedor === 'nasa-power' ? 'NASA POWER' : 'Open-Meteo')}
                  {' · '}{opcion.variable.replaceAll('-', ' ')} · {opcion.unidad} · {opcion.frecuencia}
                </option>
              ))}
            </select>
          </div>
          <div className="regla-campos-dobles">
            <div className="campo">
              <label htmlFor="regla-condicion">Condición</label>
              <select id="regla-condicion" value={condicion} onChange={(evento) => setCondicion(evento.target.value as CondicionReglaRiesgo)}>
                <option value="menor-que">Menor que</option>
                <option value="mayor-que">Mayor que</option>
                <option value="fuera-de-rango">Fuera de rango</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="regla-medida">Medida</label>
              <select id="regla-medida" value={medida} onChange={(evento) => setMedida(evento.target.value as MedidaReglaRiesgo)}>
                {Object.entries(etiquetasMedida).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="regla-ventana">Cantidad de datos</label>
              <input id="regla-ventana" type="number" min="1" max="10000" step="1" value={cantidadPuntos} onChange={(evento) => setCantidadPuntos(evento.target.value)} required />
            </div>
            <div className="campo">
              <label htmlFor="regla-umbral">{condicion === 'fuera-de-rango' ? 'Límite inferior' : 'Umbral'}{serie ? ` (${serie.unidad})` : ''}</label>
              <input id="regla-umbral" type="number" step="any" value={umbral} onChange={(evento) => setUmbral(evento.target.value)} required />
            </div>
            {condicion === 'fuera-de-rango' && (
              <div className="campo">
                <label htmlFor="regla-umbral-superior">Límite superior{serie ? ` (${serie.unidad})` : ''}</label>
                <input id="regla-umbral-superior" type="number" step="any" min={umbral || undefined} value={umbralSuperior} onChange={(evento) => setUmbralSuperior(evento.target.value)} required />
              </div>
            )}
            <div className="campo">
              <label htmlFor="regla-severidad">Severidad</label>
              <select id="regla-severidad" value={severidad} onChange={(evento) => setSeveridad(evento.target.value as SeveridadRiesgo)}>
                <option value="informativo">Informativo</option>
                <option value="bajo">Bajo</option>
                <option value="moderado">Moderado</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
          </div>
          <p className="texto-secundario">Se evalúan los datos más recientes disponibles de esa serie y periodo. Estas reglas son criterios configurados por ti, no alertas oficiales de los proveedores.</p>
          <Button type="submit">Agregar regla</Button>
        </form>
      )}

      {reglas.length > 0 && (
        <ul className="reglas-configuradas" aria-label="Reglas configuradas">
          {reglas.map((regla) => (
            <li key={regla.id}>
              <span><strong>{regla.nombre}</strong><small>{regla.proveedor === 'nasa-power' ? 'NASA POWER' : 'Open-Meteo'} · {regla.variable.replaceAll('-', ' ')} · {regla.severidad}</small></span>
              <Button type="button" className="boton-terciario" aria-label={`Eliminar regla ${regla.nombre}`} onClick={() => onEliminar(regla.id)}>Eliminar</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
