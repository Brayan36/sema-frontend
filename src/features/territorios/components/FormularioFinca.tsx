import { useEffect, useRef, useState } from 'react';
import { centroid } from '@turf/centroid';
import Button from '../../../components/ui/Button';
import type { BorradorFinca } from '../../../types/finca';
import { validarCoordenadas } from '../services/ubicaciones';
import { cargarPaises, cargarLimites, nombreLimite, cargarDivisionesLocales, type Pais, type Limite, type DivisionLocal } from '../services/limites';
import BuscadorUbicacion from './BuscadorUbicacion';
import MapaTerreno from './MapaTerreno';

type Props = { borrador: BorradorFinca | null; onSeleccionar: (datos: BorradorFinca) => void };

export default function FormularioFinca({ borrador, onSeleccionar }: Props) {
  const [nombre, setNombre] = useState(borrador?.nombre ?? '');
  const [modo, setModo] = useState<'territorio' | 'coordenadas'>('territorio');
  const [paises, setPaises] = useState<Pais[]>([]);
  const [iso, setIso] = useState('');
  const [regiones, setRegiones] = useState<Limite[]>([]);
  const [regionId, setRegionId] = useState('');
  const [paisLimite, setPaisLimite] = useState<Limite>();
  const [municipios, setMunicipios] = useState<DivisionLocal[]>([]);
  const [municipioId, setMunicipioId] = useState('');
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [avisoMunicipios, setAvisoMunicipios] = useState('');
  const peticionMunicipios = useRef<AbortController | null>(null);
  const [latitud, setLatitud] = useState(borrador ? String(borrador.ubicacion.latitud) : '');
  const [longitud, setLongitud] = useState(borrador ? String(borrador.ubicacion.longitud) : '');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  const [intento, setIntento] = useState(0);
  const peticion = useRef<AbortController | null>(null);

  useEffect(() => {
    const control = new AbortController();
    cargarPaises(control.signal).then(setPaises).catch(() => {
      if (!control.signal.aborted) setError('No se pudo cargar el catálogo. Reintenta o utiliza coordenadas.');
    });
    return () => { control.abort(); peticion.current?.abort(); peticionMunicipios.current?.abort(); };
  }, [intento]);

  async function seleccionarPais(valor: string) {
    peticion.current?.abort();
    peticionMunicipios.current?.abort();
    setMunicipios([]); setMunicipioId(''); setAvisoMunicipios(''); setCargandoMunicipios(false);
    const control = new AbortController();
    peticion.current = control;
    setIso(valor); setRegionId(''); setRegiones([]); setPaisLimite(undefined); setError(''); setAviso('');
    if (!valor) { setCargando(false); return; }
    setCargando(true);
    const [pais, divisiones] = await Promise.allSettled([cargarLimites(valor, 'ADM0', control.signal), cargarLimites(valor, 'ADM1', control.signal)]);
    if (control.signal.aborted) return;
    if (pais.status === 'fulfilled' && pais.value[0]) setPaisLimite(pais.value[0]);
    else setError('No se pudo ubicar este país. Reintenta seleccionarlo o usa coordenadas.');
    if (divisiones.status === 'fulfilled') setRegiones(divisiones.value.sort((a,b) => nombreLimite(a).localeCompare(nombreLimite(b), 'es')));
    else setAviso('Las regiones no están disponibles. Reintenta seleccionando el país o continúa con su vista general y acércate en el mapa.');
    setCargando(false);
  }

  async function seleccionarRegion(valor: string) {
    peticionMunicipios.current?.abort();
    const control = new AbortController();
    peticionMunicipios.current = control;
    setRegionId(valor); setMunicipioId(''); setMunicipios([]); setAvisoMunicipios(''); setCargandoMunicipios(false);
    const seleccion = regiones.find((r) => String(r.properties?.shapeID) === valor);
    if (!seleccion) return;
    setCargandoMunicipios(true);
    try {
      const opciones = await cargarDivisionesLocales(iso, seleccion, control.signal);
      if (control.signal.aborted) return;
      setMunicipios(opciones);
      if (!opciones.length) setAvisoMunicipios('No hay divisiones locales disponibles para esta región. Puedes continuar y acercarte manualmente en el mapa.');
    } catch {
      if (!control.signal.aborted) setAvisoMunicipios('No se pudieron cargar las divisiones locales. Reintenta o continúa con el mapa de la región.');
    } finally {
      if (!control.signal.aborted) setCargandoMunicipios(false);
    }
  }

  const regionLimite = regiones.find((r) => String(r.properties?.shapeID) === regionId);
  const municipio = municipios.find((m) => m.id === municipioId);
  const limite = municipio?.limite ?? regionLimite ?? paisLimite;
  const limiteVista = municipio ? municipio.limite : limite;
  return (
    <form className="formulario-finca" onSubmit={(evento) => {
      evento.preventDefault();
      if (!nombre.trim()) { setError('Escribe el nombre del terreno.'); return; }
      if (modo === 'territorio') {
        if (!iso || !limite || cargando) { setError('Selecciona un país y espera a que cargue su ubicación.'); return; }
        const [lon, lat] = centroid(limite).geometry.coordinates;
        onSeleccionar({ nombre: nombre.trim(), pais: paises.find((p) => p.iso === iso)?.nombre, paisISO: iso, region: regionLimite ? nombreLimite(regionLimite) : undefined, regionId, municipio: municipio?.nombre, municipioId, limiteAdministrativo: limiteVista, ubicacion: municipio?.ubicacion ?? { latitud: lat, longitud: lon }, contorno: null, areaHectareas: null });
      } else {
        const resultado = validarCoordenadas(latitud, longitud);
        if (!resultado.ok) { setError(resultado.mensaje); return; }
        onSeleccionar({ nombre: nombre.trim(), ubicacion: resultado.ubicacion, contorno: null, areaHectareas: null });
      }
    }}>
      <div className="campo"><label htmlFor="finca-nombre">Nombre del terreno</label><input id="finca-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} required /></div>
      {borrador && <p className="aviso">Ubicación actual: {borrador.pais ?? 'Coordenadas'} {borrador.region}. Para cambiarla, selecciona nuevamente. Continuar inicia un contorno nuevo.</p>}
      <div className="campo"><label htmlFor="modo-ubicacion">Cómo ubicar tu finca</label><select id="modo-ubicacion" value={modo} onChange={(e) => { setModo(e.target.value as typeof modo); setError(''); }}><option value="territorio">Elegir país y región</option><option value="coordenadas">Ingresar coordenadas</option></select></div>
      {modo === 'territorio' ? <>
        <div className="campo"><label htmlFor="finca-pais">País</label><select id="finca-pais" value={iso} onChange={(e) => { void seleccionarPais(e.target.value); }} required><option value="">{paises.length ? 'Selecciona un país' : 'Cargando países…'}</option>{paises.map((p) => <option key={p.iso} value={p.iso}>{p.nombre}</option>)}</select></div>
        <div className="campo"><label htmlFor="finca-region">Región / departamento / estado</label><select id="finca-region" value={regionId} onChange={(e) => { void seleccionarRegion(e.target.value); }} disabled={!regiones.length || cargando} required={regiones.length > 0}><option value="">{cargando ? 'Cargando límites…' : 'Selecciona una región'}</option>{regiones.map((r) => <option key={String(r.properties?.shapeID)} value={String(r.properties?.shapeID)}>{nombreLimite(r)}</option>)}</select></div>
        <div className="campo"><label htmlFor="finca-municipio">{iso === 'COL' ? 'Municipio' : 'Municipio / división local'} <span>(opcional)</span></label><select id="finca-municipio" value={municipioId} onChange={(e) => setMunicipioId(e.target.value)} disabled={!regionId || cargandoMunicipios || !municipios.length} aria-describedby="ayuda-municipios"><option value="">{cargandoMunicipios ? 'Cargando ubicaciones…' : regionId ? 'Selecciona una ubicación o usa la región' : 'Primero selecciona una región'}</option>{municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select><p id="ayuda-municipios" className="texto-secundario">{iso === 'COL' ? 'Municipios de DIVIPOLA. El punto de referencia permite acercar el mapa; después dibuja tu terreno.' : 'Según el país, este nivel puede corresponder a provincias u otras divisiones, y no a municipios. La agrupación por región es aproximada; revisa la ubicación en el mapa.'}</p></div>
        {cargandoMunicipios && <p className="texto-secundario" role="status">Descargando las divisiones locales del país. La primera carga puede tardar unos segundos.</p>}
        {avisoMunicipios && <div className="aviso" role="status"><p>{avisoMunicipios}</p><button type="button" onClick={() => { void seleccionarRegion(regionId); }}>Reintentar ubicaciones</button></div>}
        {aviso && <p className="aviso" role="status">{aviso}</p>}
        {limite && <MapaTerreno ubicacion={municipio?.ubicacion ?? null} capa={null} limite={limiteVista} />}
        <p className="texto-secundario">El mapa se acerca al país, región y municipio elegido. En el siguiente paso dibujarás tu finca. Los nombres se muestran como los publica geoBoundaries.</p>
        <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">Límites: geoBoundaries (CC BY 4.0)</a>
        {iso === 'COL' && <a href="https://www.datos.gov.co/resource/gdxc-w37w.json" target="_blank" rel="noreferrer">Municipios y coordenadas: DIVIPOLA, DANE / Datos Abiertos Colombia</a>}
      </> : <BuscadorUbicacion latitud={latitud} longitud={longitud} onLatitudChange={setLatitud} onLongitudChange={setLongitud} />}
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      {!paises.length && <button type="button" onClick={() => { setError(''); setIntento((i) => i + 1); }}>Reintentar países</button>}
      <Button type="submit" disabled={modo === 'territorio' && (cargando || !limite)}>Continuar y dibujar terreno →</Button>
      <p className="texto-secundario">Selección temporal: se conserva al navegar y se pierde al recargar.</p>
    </form>
  );
}
