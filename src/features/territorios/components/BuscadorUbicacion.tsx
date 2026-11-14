type Props = {
  latitud: string;
  longitud: string;
  onLatitudChange: (valor: string) => void;
  onLongitudChange: (valor: string) => void;
};

export default function BuscadorUbicacion({ latitud, longitud, onLatitudChange, onLongitudChange }: Props) {
  return (
    <fieldset className="ubicacion-campos">
      <legend>Ubicación por coordenadas</legend>
      <p id="ayuda-coordenadas" className="texto-secundario">Usa grados decimales. Puedes escribir punto o coma decimal.</p>
      <div className="campos-dobles">
        <div className="campo">
          <label htmlFor="finca-latitud">Latitud</label>
          <input id="finca-latitud" name="latitud" type="text" inputMode="decimal" value={latitud} onChange={(e) => onLatitudChange(e.target.value)} aria-describedby="ayuda-coordenadas" placeholder="Ej.: 6.2466" required />
        </div>
        <div className="campo">
          <label htmlFor="finca-longitud">Longitud</label>
          <input id="finca-longitud" name="longitud" type="text" inputMode="decimal" value={longitud} onChange={(e) => onLongitudChange(e.target.value)} aria-describedby="ayuda-coordenadas" placeholder="Ej.: -75.5818" required />
        </div>
      </div>
    </fieldset>
  );
}
