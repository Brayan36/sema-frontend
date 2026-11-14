import { useState } from 'react';
import { medirTerreno } from './services/terrenos';
import { centroid } from '@turf/centroid';
import type { Feature, Polygon } from 'geojson';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loading from '../../components/ui/Loading';
import type { BorradorFinca } from '../../types/finca';
import type { FiltrosImagenes } from '../../types/capas';
import MapaTerreno from './components/MapaTerreno';
import SelectorCapas from './components/SelectorCapas';
import { crearFiltrosIniciales } from './services/imagenesSatelitales';
import { useImagenesSatelitales } from './hooks/useImagenesSatelitales';
import './territorios.css';

export default function MapaSatelital({ borrador, onActualizar }: { borrador: BorradorFinca | null; onActualizar: (datos: BorradorFinca) => void }) {
  const [filtros, setFiltros] = useState(crearFiltrosIniciales);
  const imagenes = useImagenesSatelitales();
  const centro = borrador?.contorno ? centroid(borrador.contorno).geometry.coordinates : null;
  const ubicacionConsulta = centro ? { latitud: centro[1], longitud: centro[0] } : borrador?.ubicacion;
  function actualizarTerreno(contorno: Feature<Polygon> | null) {
    if (!borrador) return;
    imagenes.reiniciar();
    const punto = contorno ? centroid(contorno).geometry.coordinates : borrador.limiteAdministrativo ? centroid(borrador.limiteAdministrativo).geometry.coordinates : null;
    const medida = contorno ? medirTerreno(contorno) : null;
    onActualizar({ ...borrador, contorno, areaHectareas: medida?.areaHectareas ?? null, ubicacion: medida?.ubicacion ?? (punto ? { latitud: punto[1], longitud: punto[0] } : borrador.ubicacion) });
  }
  function actualizarFiltro(cambio: Partial<FiltrosImagenes>) {
    imagenes.reiniciar();
    setFiltros((previos) => ({ ...previos, ...cambio }));
  }
  return (
    <div className="pagina territorios">
      <p className="sobre-titulo">03 / TERRITORIOS</p>
      <h1>Mapa satelital</h1>
      <p className="introduccion">Explora imágenes de Sentinel-2 alrededor del punto de referencia de tu terreno.</p>
      {!borrador && <p className="aviso">Todavía no seleccionaste un terreno. <Link to="/mi-finca">Completar Mi finca</Link></p>}
      {borrador && Math.abs(borrador.ubicacion.latitud) > 85 && <p className="aviso">La proyección de este mapa no representa los polos. La vista se limita a ±85° y puede no haber imágenes disponibles.</p>}
      <div className="distribucion-mapa">
        <Card className="tarjeta-mapa" aria-label="Visualización del terreno">
          <MapaTerreno ubicacion={borrador?.ubicacion ?? null} capa={imagenes.teselas} limite={borrador?.limiteAdministrativo} contorno={borrador?.contorno} onTerreno={borrador ? actualizarTerreno : undefined} />
          <p className="texto-secundario nota-imagen">Acércate a tu finca y pulsa Dibujar terreno. Añade sus vértices y cierra en el primero. Usa Editar o Eliminar y pulsa Guardar para confirmar los cambios. El límite administrativo azul no delimita tu propiedad.</p>
          {borrador?.contorno ? <div className="aviso" role="status"><strong>Área aproximada: {borrador.areaHectareas?.toLocaleString('es', { maximumFractionDigits: 2 })} hectáreas</strong><p>Punto de referencia calculado: latitud {ubicacionConsulta?.latitud.toFixed(6)} | longitud {ubicacionConsulta?.longitud.toFixed(6)}</p><p>{borrador.contorno.geometry.coordinates[0].length - 1} vértices. El centro calculado puede quedar fuera de terrenos cóncavos; no es un levantamiento catastral.</p><details><summary>Ver coordenadas del contorno (longitud, latitud)</summary><pre className="coordenadas-poligono">{JSON.stringify(borrador.contorno.geometry.coordinates, null, 2)}</pre></details></div> : <p className="aviso">Dibuja el contorno para obtener las coordenadas y el área de la finca.</p>}
          <p className="texto-secundario nota-imagen">Las imágenes tienen fecha de captura y no son una vista en tiempo real. Los cambios se conservan al navegar; todavía se pierden al recargar.</p>
        </Card>
        <Card aria-label="Información y capas">
          <h2>{borrador?.nombre ?? 'Tu terreno'}</h2>
          {borrador && <dl className="datos-terreno">
            <div><dt>País</dt><dd>{borrador.pais || 'Sin indicar'}</dd></div>
            <div><dt>Región</dt><dd>{borrador.region || 'Sin indicar'}</dd></div>
            <div><dt>Municipio / división local</dt><dd>{borrador.municipio || 'Sin indicar'}</dd></div>
            <div><dt>Latitud de referencia</dt><dd>{ubicacionConsulta?.latitud.toFixed(6)}</dd></div>
            <div><dt>Longitud de referencia</dt><dd>{ubicacionConsulta?.longitud.toFixed(6)}</dd></div>
          </dl>}
          <form className="filtros-imagenes" onSubmit={(evento) => { evento.preventDefault(); if (ubicacionConsulta) void imagenes.buscar(ubicacionConsulta, filtros); }}>
            <h3>Buscar imágenes</h3>
            <div className="campo">
              <label htmlFor="imagen-inicio">Desde</label>
              <input id="imagen-inicio" type="date" value={filtros.inicio} max={filtros.fin} onChange={(e) => actualizarFiltro({ inicio: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="imagen-fin">Hasta</label>
              <input id="imagen-fin" type="date" value={filtros.fin} min={filtros.inicio} max={new Date().toISOString().slice(0, 10)} onChange={(e) => actualizarFiltro({ fin: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="imagen-nubes">Nubosidad máxima de escena (%)</label>
              <input id="imagen-nubes" type="number" min="0" max="100" step="1" value={Number.isNaN(filtros.nubosidadMaxima) ? '' : filtros.nubosidadMaxima} onChange={(e) => actualizarFiltro({ nubosidadMaxima: e.target.valueAsNumber })} required />
            </div>
            <Button type="submit" disabled={!borrador || imagenes.cargando !== null}>{imagenes.cargando === 'busqueda' ? 'Buscando…' : 'Buscar imágenes'}</Button>
          </form>
          {imagenes.cargando === 'busqueda' && <Loading mensaje="Consultando el catálogo de Planetary Computer…" />}
          {imagenes.cargando === 'imagen' && <Loading mensaje="Preparando la capa de la escena seleccionada…" />}
          {imagenes.error && <p className="mensaje-error" role="alert">{imagenes.error}</p>}
          {imagenes.consultado && !imagenes.capas.length && <p className="aviso" role="status">No encontramos imágenes compatibles para estas fechas y nubosidad. Prueba ampliar el periodo o permitir más nubes.</p>}
          {imagenes.capas.length > 0 && <p className="texto-secundario" role="status">{imagenes.capas.length} escenas recientes encontradas. Se muestran como máximo seis.</p>}
          <SelectorCapas capas={imagenes.capas} seleccionada={imagenes.seleccionada?.id ?? ''} deshabilitado={imagenes.cargando === 'busqueda'} onSeleccionar={(id) => { void imagenes.seleccionar(id); }} />
          {imagenes.seleccionada && <div className="ficha-escena">
            <h3>Imagen seleccionada</h3>
            <p>{imagenes.seleccionada.nombre}</p>
            <p>Captura: <time dateTime={imagenes.seleccionada.fecha}>{new Date(imagenes.seleccionada.fecha).toLocaleString('es', { timeZone: 'UTC' })} UTC</time></p>
            <p className="texto-secundario">ESA/Copernicus · Distribuida por Microsoft Planetary Computer.</p>
          </div>}
          <Link className="enlace-boton secundario" to="/mi-finca">{borrador ? 'Editar ubicación' : 'Seleccionar ubicación'}</Link>
        </Card>
      </div>
    </div>
  );
}
