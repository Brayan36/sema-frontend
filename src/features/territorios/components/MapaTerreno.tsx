import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import type { Feature, Polygon } from 'geojson';
import { centroid } from '@turf/centroid';
import { medirTerreno } from '../services/terrenos';
import type { Limite } from '../services/limites';
import { traducirDibujo } from '../services/idiomaDibujo';
import type { Ubicacion } from '../../../types/finca';
import type { TeselasSatelitales } from '../../../types/capas';

type Props = { ubicacion: Ubicacion | null; capa: TeselasSatelitales | null; limite?: Limite; contorno?: Feature<Polygon> | null; onTerreno?: (terreno: Feature<Polygon> | null) => void };
type EstadoMapa = { clave: string; mensaje: string; error: boolean };

export default function MapaTerreno({ ubicacion, capa, limite, contorno, onTerreno }: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const [estado, setEstado] = useState<EstadoMapa | null>(null);
  const latitud = ubicacion?.latitud;
  const longitud = ubicacion?.longitud;
  const clave = capa?.url ?? 'base';
  const dibujoActual = useRef({ contorno, onTerreno });
  useEffect(() => { dibujoActual.current = { contorno, onTerreno }; }, [contorno, onTerreno]);
  const editable = Boolean(onTerreno);

  useEffect(() => {
    if (!contenedor.current) return;
    let activo = true;
    let fallo = false;
    const tieneUbicacion = latitud !== undefined && longitud !== undefined;
    const centro: L.LatLngTuple = tieneUbicacion ? [Math.max(-85, Math.min(85, latitud)), longitud] : [0, 0];
    const mapa = L.map(contenedor.current, { maxZoom: 18, worldCopyJump: true, zoomControl: false }).setView(centro, tieneUbicacion ? 12 : 2);
    L.control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(mapa);
    const base = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    });
    const imagen = capa ? L.tileLayer(capa.url, {
      minZoom: capa.minZoom,
      maxZoom: capa.maxZoom,
      bounds: [[capa.limites[1], capa.limites[0]], [capa.limites[3], capa.limites[2]]],
      attribution: 'Sentinel-2 © ESA/Copernicus · <a href="https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a">Microsoft Planetary Computer</a>',
    }) : null;
    const observada = imagen ?? base;
    observada.on('loading', () => {
      fallo = false;
      if (activo) setEstado({ clave, mensaje: imagen ? 'Cargando imagen satelital…' : 'Cargando mapa base…', error: false });
    });
    observada.on('tileerror', () => {
      fallo = true;
      if (activo) setEstado({ clave, mensaje: imagen ? 'No se pudo cargar parte de la imagen. Puedes cambiar de escena o volver al mapa base.' : 'No se pudo cargar parte del mapa base. Revisa tu conexión.', error: true });
    });
    observada.on('load', () => {
      if (activo && !fallo) setEstado({ clave, mensaje: imagen ? 'Imagen satelital cargada. Puede haber zonas sin datos o cubiertas por nubes.' : 'Mapa base cargado. Selecciona una imagen para ver la capa satelital.', error: false });
    });
    base.addTo(mapa);
    imagen?.addTo(mapa);
    const referencia = tieneUbicacion ? L.circleMarker([latitud, longitud], { radius: 6, color: '#102c46', fillColor: '#ffffff', fillOpacity: 1, weight: 3 }).bindTooltip('Punto de referencia para consultas').addTo(mapa) : null;
    const moverReferencia = (geo: Feature<Polygon> | null) => {
      if (!referencia) return;
      if (geo) { const [lon, lat] = centroid(geo).geometry.coordinates; referencia.setLatLng([lat, lon]); }
      else if (tieneUbicacion) referencia.setLatLng([latitud, longitud]);
    };
    if (limite) {
      const limites = L.geoJSON(limite, { style: { color: '#255d8a', weight: 2, fillOpacity: 0.03 }, interactive: false }).addTo(mapa);
      if (limites.getBounds().isValid()) mapa.fitBounds(limites.getBounds(), { padding: [20, 20], maxZoom: 12 });
      mapa.attributionControl.addAttribution('<a href="https://www.geoboundaries.org/">geoBoundaries</a> CC BY 4.0');
    }
    const terrenos = new L.FeatureGroup().addTo(mapa);
    if (dibujoActual.current.contorno) {
      moverReferencia(dibujoActual.current.contorno);
      L.geoJSON(dibujoActual.current.contorno, { style: { color: '#2f7d4a', weight: 3, fillOpacity: 0.25 } }).eachLayer((layer) => terrenos.addLayer(layer));
      if (terrenos.getBounds().isValid()) mapa.fitBounds(terrenos.getBounds(), { padding: [30, 30], maxZoom: 17 });
    }
    if (editable) {
      traducirDibujo();
      const opcionesEdicion = { featureGroup: terrenos, poly: { allowIntersection: false } };
      mapa.addControl(new L.Control.Draw({
        draw: { polygon: { allowIntersection: false, shapeOptions: { color: '#2f7d4a', weight: 3, fillOpacity: 0.25 } }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
        edit: opcionesEdicion,
      }));
      const publicar = () => {
        const layer = terrenos.getLayers()[0];
        const geo = layer instanceof L.Polygon ? layer.toGeoJSON() : null;
        const poligono: Feature<Polygon> | null = geo?.geometry.type === 'Polygon' ? { type: 'Feature', properties: geo.properties, geometry: geo.geometry } : null;
        if (poligono) {
          try { medirTerreno(poligono); }
          catch (error) {
            terrenos.clearLayers();
            if (dibujoActual.current.contorno) L.geoJSON(dibujoActual.current.contorno).eachLayer((previo) => terrenos.addLayer(previo));
            setEstado({ clave, mensaje: error instanceof Error ? error.message : 'El contorno no es válido.', error: true });
            return;
          }
        }
        moverReferencia(poligono);
        dibujoActual.current.onTerreno?.(poligono);
      };
      mapa.on(L.Draw.Event.CREATED, (evento) => {
        const dibujo = evento as L.DrawEvents.Created;
        if (!(dibujo.layer instanceof L.Polygon)) return;
        const geo = dibujo.layer.toGeoJSON();
        if (geo.geometry.type !== 'Polygon') return;
        try { medirTerreno({ type: 'Feature', properties: geo.properties, geometry: geo.geometry }); }
        catch (error) {
          setEstado({ clave, mensaje: error instanceof Error ? error.message : 'El contorno no es válido.', error: true });
          return;
        }
        terrenos.clearLayers(); terrenos.addLayer(dibujo.layer); publicar();
      });
      mapa.on(L.Draw.Event.EDITED, publicar);
      mapa.on(L.Draw.Event.DELETED, publicar);
    }
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(contenedor.current);
    return () => { activo = false; observador.disconnect(); mapa.remove(); };
  }, [latitud, longitud, capa, clave, limite, editable]);

  const visible = estado?.clave === clave ? estado : null;
  return (
    <div className="visor-terreno">
      <div ref={contenedor} className="mapa-interactivo" role="region" aria-label="Mapa interactivo del terreno" />
      <p className={visible?.error ? 'mensaje-error estado-mapa' : 'texto-secundario estado-mapa'} role="status">{visible?.mensaje ?? 'Preparando mapa…'}</p>
    </div>
  );
}
