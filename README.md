# SEMA — Módulo de territorios

Entrega de Anderson: pantalla 02 Mi finca (formulario) y pantalla 03 Mapa satelital, con React, TypeScript y Vite. Al abrir la aplicación se muestra el formulario; desde él se continúa al mapa.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+ (incluido Node 24).

```powershell
npm.cmd ci
npm.cmd run dev
```

En otros sistemas se puede utilizar `npm` en lugar de `npm.cmd`. Abrir la dirección Local que muestre Vite.

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

## Primera capa implementada

- Navegación con React Router: `/mi-finca` y `/mapa`. La raíz `/` y las direcciones desconocidas redirigen al formulario. Inicio y Acerca no forman parte de esta entrega.
- Layout compartido y componentes Button, Card y Loading.
- Formulario de nombre y selección de país y región dependiente desde geoBoundaries gbOpen. Vista previa ajustada al límite elegido. Alternativa por coordenadas manuales.
- Selector opcional de municipio/división local dependiente de la región. Colombia utiliza los códigos y coordenadas de DIVIPOLA (DANE / Datos Abiertos); los demás países utilizan ADM2 de geoBoundaries cuando está disponible. Seleccionar una opción acerca la vista previa y el mapa del terreno. Cambiar país o región limpia la selección anterior y cancela la descarga pendiente.
- Validación de latitud [-90, 90] y longitud [-180, 180], admitiendo punto o coma decimal.
- Selección temporal compartida entre Mi finca y Mapa mediante estado de React. Al regresar al formulario se mantiene el borrador; al recargar se pierde.
- Tipos propuestos para validar con backend: ubicación, borrador, finca y capa satelital.
- Estilos base accesibles y adaptables, provisionales hasta recibir el diseño del equipo.
- Mapa interactivo Leaflet con cartografía base de OpenStreetMap y un marcador del punto de referencia.
- Conexión pública a Planetary Computer: búsqueda STAC de hasta seis escenas Sentinel-2 L2A que intersecten el punto, filtradas por fechas y nubosidad máxima.
- Selección de escena y visualización de su recurso de color natural mediante TileJSON y la API de teselas del proveedor. Fecha de captura y atribución visibles.
- Estados de carga, resultados vacíos, errores, tiempo máximo de solicitud y cancelación al cambiar de búsqueda, escena o pantalla.

## Pendiente, no simulado

Todavía no hay búsqueda libre de ciudades por nombre, registro persistente, conexión con backend ni recomendaciones agrícolas. Los selectores utilizan los nombres y la cobertura publicados por geoBoundaries; ADM1 puede faltar en ciertos países.

Google Cloud es una oferta de plataforma: aún debe elegirse un producto concreto. Meteomatics corresponde a datos meteorológicos y requiere coordinar el acceso con backend; no se solicitan ni almacenan sus credenciales en React. Planetary Computer ya utiliza su catálogo STAC y servicio público de teselas, sin claves privadas del usuario. El mapa base se mantiene disponible si la búsqueda falla o no devuelve escenas.

## Consultar imágenes

1. Abrir `/mi-finca`, dar un nombre, elegir un país y su región y, si se desea, un municipio/división local. La vista previa se ajusta a cada elección. También se pueden ingresar coordenadas válidas como alternativa.
2. Continuar a `/mapa`, acercarse al terreno y dibujar un polígono. Editar y eliminar requieren confirmar con Guardar. Un nuevo dibujo reemplaza el anterior. Se calculan su área aproximada en hectáreas y su centro de referencia, y se conserva el contorno GeoJSON en el estado compartido.
3. Revisar el periodo y la nubosidad máxima y pulsar **Buscar imágenes**.
4. Elegir una de las escenas encontradas. **Solo mapa base** permite retirar la imagen.

Las fechas se consultan en UTC. La nubosidad es un porcentaje de la escena completa y no permite concluir cómo está una finca concreta. Sentinel-2 pertenece a ESA/Copernicus, con distribución mediante Microsoft; las imágenes no se presentan como imágenes NASA ni como datos en tiempo real. Las zonas fuera de la escena permanecen como mapa base. Web Mercator limita la vista a latitudes aproximadas de ±85°. No inferir datos agronómicos de una imagen sin un análisis validado.

Las consultas ocurren al pulsar Buscar, no en cada render. Tienen un límite de 25 segundos, seis resultados y cancelación; los errores HTTP 429 se muestran sin reintentos automáticos. Mover o acercar el mapa solicita teselas al proveedor. La disponibilidad, cobertura y límites pertenecen a cada servicio y pueden cambiar.

Documentación de integración:
- https://planetarycomputer.microsoft.com/api/stac/v1
- https://planetarycomputer.microsoft.com/api/data/v1/docs
- https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a
- https://operations.osmfoundation.org/policies/tiles/

## Organización

```text
src/
  components/layout/        Header, Sidebar y MainLayout
  components/ui/            Button, Card y Loading
  features/territorios/
    components/            FormularioFinca, BuscadorUbicacion, MapaTerreno, SelectorCapas
    services/              Validación de coordenadas y llamadas a Planetary Computer
    hooks/                 Estado y cancelación de búsquedas e imágenes
    MiFinca.tsx
    MapaSatelital.tsx
    territorios.css
  services/api.ts          Configuración pública del backend
  types/                   Contratos de finca y capas
  styles/                  Variables y estilos compartidos
```

Las demás pantallas se integrarán con sus responsables. Esta entrega contiene únicamente las dos pantallas de territorios y los componentes, servicios, estilos y configuración necesarios para ejecutarlas.

## Datos e integración

`BorradorFinca` incluye nombre, país/ISO3 y región cuando se eligen del catálogo, límite administrativo, ubicación de referencia, contorno GeoJSON Polygon y área aproximada. Al dibujar se actualiza `ubicacion` al centro calculado del contorno y las búsquedas satelitales utilizan ese punto. Un centro geométrico puede quedar fuera de un polígono cóncavo. `Finca` propone añadir un identificador asignado por backend. Un contorno o área `null` significa que aún no se ha definido, no un terreno de área cero.

GeoJSON utiliza `[longitud, latitud]`. No confundir el punto de referencia con el perímetro ni con la extensión espacial de un píxel satelital. Los límites administrativos son orientación, no parcelas ni validación catastral. Su fuente es [geoBoundaries gbOpen, CC BY 4.0](https://www.geoboundaries.org/api.html). No se verifica que el terreno dibujado esté dentro de la región elegida. El dibujo admite un polígono simple y no contempla cruces del antimeridiano ni zonas polares. El área calculada con Turf es una aproximación, no una medición topográfica. Cambiar la ubicación desde el formulario inicia un contorno nuevo; navegar entre pantallas conserva el existente. Modificar el dibujo limpia la selección satelital para consultar de nuevo con su nueva referencia.

En Colombia, [DIVIPOLA](https://www.datos.gov.co/resource/gdxc-w37w.json) relaciona municipios con el código del departamento; se conservan nombre y código en `municipio`/`municipioId`. Sus coordenadas ubican una referencia municipal, no el perímetro de una finca. Para otros países, ADM2 puede representar provincias u otras divisiones; se agrupan aproximadamente por un punto de su geometría dentro de ADM1, dado que el archivo no proporciona el código del padre. Fuentes de fechas distintas pueden producir omisiones en esa agrupación; revisar la ubicación en el mapa. Las descargas se reutilizan en memoria durante la sesión y hay alternativa de continuar desde la región si fallan.

## Configuración y secretos

Copiar `.env.example` a `.env.local` solo si se necesita indicar `VITE_API_BASE_URL`. Todo valor `VITE_*` es público en la aplicación compilada. Contraseñas, claves privadas y tokens de servicio pertenecen al backend. No se incluyen credenciales ni se habilita facturación.

## Trabajo en equipo

Rama de implementación: `feature/territorios-mapa`, basada en `develop`. La navegación provisional incluye únicamente Mi finca y Mapa satelital. Al integrar con el equipo, coordinar `App.tsx`, layout y estilos compartidos para incorporar estas dos pantallas en la navegación general. Esta preparación local no implica que se haya abierto o integrado un Pull Request.

El alojamiento de producción debe redirigir las rutas de la SPA a `index.html` para que funcionen las recargas de `/mi-finca` y `/mapa`.

## Comprobaciones de esta base (14 de noviembre de 2026)

- `npm.cmd run build`: correcto, con TypeScript estricto.
- `npm.cmd run lint`: correcto.
- Municipios: comprobados códigos y coordenadas de Medellín y Tunja, 125 municipios de Antioquia, 123 de Boyacá y presencia de opciones en las 33 divisiones colombianas. La prueba de agrupación geométrica detectó una omisión en Antioquia; por eso Colombia utiliza la relación departamental de DIVIPOLA.
- Selección territorial: descarga directa desde media.githubusercontent.com para archivos LFS y alternativa raw.githubusercontent.com para archivos normales. Se evita github.com/raw porque su redirección no permite CORS desde el navegador. 21 comprobaciones de catálogo, errores HTTP, geometría, área, centro y normalización/fallback de URLs. El flujo de dibujo y edición requiere revisión visual en el navegador.
- Nueve comprobaciones directas de coordenadas: vacío, texto inválido, infinito, límites, cero y coma decimal.
- Integración satelital: 19 comprobaciones con respuestas controladas sobre validación de filtros, orden de coordenadas, respuestas malformadas, ausencia de resultados, URLs de teselas, errores HTTP, red y cancelación.
- Consulta real de escenas Sentinel-2, TileJSON con acceso CORS y descarga HTTP 200 de una tesela PNG del proveedor. Las pruebas no agregan imágenes ni respuestas simuladas a la aplicación.
- Las pantallas de territorios fueron servidas por Vite. La comprobación visual automatizada no estuvo disponible en esta sesión; revisar la entrada al formulario y la continuación al mapa desde el navegador antes de integrar.
- `npm.cmd audit --omit=dev`: sin vulnerabilidades informadas en producción al instalar.
- La auditoría completa informa siete alertas moderadas en la cadena de herramientas de desarrollo (`typescript-eslint` y `minimatch`). Revisar su compatibilidad con el equipo antes de cambiar versiones; no se aplicó `audit fix --force`.

La licencia original del repositorio se conserva en `LICENSE`.
