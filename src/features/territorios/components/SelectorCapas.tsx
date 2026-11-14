import type { CapaSatelital } from '../../../types/capas';

type Props = { capas: CapaSatelital[]; seleccionada: string; deshabilitado?: boolean; onSeleccionar: (id: string) => void };

export default function SelectorCapas({ capas, seleccionada, deshabilitado = false, onSeleccionar }: Props) {
  return (
    <div className="campo">
      <label htmlFor="capa-satelital">Imagen para visualizar</label>
      <select id="capa-satelital" disabled={deshabilitado || capas.length === 0} aria-describedby="estado-capas" value={seleccionada} onChange={(e) => onSeleccionar(e.target.value)}>
        <option value="">Solo mapa base</option>
        {capas.map((capa, indice) => <option key={capa.id} value={capa.id}>Escena {indice + 1} · {new Date(capa.fecha).toLocaleDateString('es', { timeZone: 'UTC' })} · {capa.nubosidad === null ? 'Nubes sin dato' : `Nubes ${capa.nubosidad.toFixed(1)} %`}</option>)}
      </select>
      <p id="estado-capas" className="texto-secundario">La nubosidad corresponde a toda la escena, no a una medición de tu terreno.</p>
    </div>
  );
}
