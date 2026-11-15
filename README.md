# SEMA — Acceso, territorios y análisis ambiental

Aplicación React, TypeScript y Vite con acceso, bienvenida y las pantallas 02 Mi finca, 03 Mapa satelital, 04 Análisis climático y del suelo, 05 Riesgos y alertas, y 06 Datos históricos. Al abrir la aplicación se muestra el acceso; se puede entrar por **Explorar demostración**.

La arquitectura, flujos, contrato JSON, caché offline y pendientes de integración se describen en [Documentación general](docs/documentacion-general.md).

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

- Navegación con React Router: `/login`, `/registro`, `/recuperar-contrasena`, `/bienvenido`, `/mi-finca`, `/mapa`, `/analisis-climatico`, `/riesgos-alertas` y `/datos-historicos`. La raíz lleva al acceso o a la bienvenida según el estado de sesión.
- Formularios de acceso, registro y recuperación con validación. La API JWT aún no está conectada: no se crean cuentas ni se envían correos de recuperación. La demostración es explícita, vive en memoria y no representa autenticación real. Detalles en [Integración de acceso](src/features/acceso/INTEGRACION.md).
- Bienvenida y pantallas de finca, mapa y análisis dentro de rutas protegidas por el estado de sesión de React. La protección del frontend no sustituye autorización en el backend.
- Layout compartido y componentes Button, Card y Loading.
- Formulario de nombre y selección de país y región dependiente desde geoBoundaries gbOpen. Vista previa ajustada al límite elegido. Alternativa por coordenadas manuales.
- Selector opcional de municipio/división local dependiente de la región. Colombia utiliza los códigos y coordenadas de DIVIPOLA (DANE / Datos Abiertos); los demás países utilizan ADM2 de geoBoundaries cuando está disponible. Seleccionar una opción acerca la vista previa y el mapa del terreno. Cambiar país o región limpia la selección anterior y cancela la descarga pendiente.
- Validación de latitud [-90, 90] y longitud [-180, 180], admitiendo punto o coma decimal.
- Selección compartida entre Mi finca, Mapa y análisis mediante estado de React. El nombre y ubicación de referencia se guardan localmente para permitir consultar la caché ambiental tras recargar; el contorno administrativo y el polígono dibujado siguen siendo temporales.
- Tipos propuestos para validar con backend: ubicación, borrador, finca y capa satelital.
- Estilos base accesibles y adaptables, provisionales hasta recibir el diseño del equipo.
- Mapa interactivo Leaflet con cartografía base de OpenStreetMap y un marcador del punto de referencia.
- Conexión pública a Planetary Computer: búsqueda STAC de hasta seis escenas Sentinel-2 L2A que intersecten el punto, filtradas por fechas y nubosidad máxima.
- Selección de escena y visualización de su recurso de color natural mediante TileJSON y la API de teselas del proveedor. Fecha de captura y atribución visibles.
- Estados de carga, resultados vacíos, errores, tiempo máximo de solicitud y cancelación al cambiar de búsqueda, escena o pantalla.

## Pendiente, no simulado

Todavía no hay búsqueda libre de ciudades por nombre, registro de fincas ni backend implementado en este repositorio. El frontend ambiental espera un backend en `VITE_API_BASE_URL` con las rutas descritas abajo. Los selectores territoriales utilizan los nombres y la cobertura publicados por geoBoundaries; ADM1 puede faltar en ciertos países.

El análisis histórico consulta directamente las APIs públicas de NASA POWER y Open-Meteo. El frontend no incluye credenciales privadas. Open-Meteo requiere atribución y su API gratuita es solo para uso no comercial. Planetary Computer utiliza su catálogo STAC y servicio público de teselas; el mapa base se mantiene disponible si la búsqueda falla o no devuelve escenas.

## Análisis ambiental y uso sin conexión

- NASA POWER aporta series diarias de temperatura, precipitación, radiación solar y humedad relativa. Open-Meteo aporta esas variables y humedad del suelo estimada a 0–7 cm.
- Las respuestas se normalizan con fuente, unidad, frecuencia, periodo y hora de consulta. Las estadísticas incluyen mínimo, máximo, promedio y cantidad de observaciones válidas.
- Cada consulta conserva además el JSON original de cada proveedor disponible, junto con URL, estado HTTP, tipo de contenido y hora de recepción. El documento versionado se guarda en IndexedDB y se manda a `POST /api/analisis-ambiental`; la pantalla 06 permite descargarlo como archivo `.json`.
- Las gráficas comparativas permiten filtrar por proveedor y, en periodos largos, acercarse al último año o a los últimos tres años. El cursor y el teclado muestran el detalle de cada fecha y de cada punto anual.
- La pantalla 06 reúne las observaciones históricas en una tabla paginada, separada de la vista de gráficos.
- Las tendencias se calculan sobre años calendario completos, con al menos 98 % de cobertura y un mínimo de tres años. Son descriptivas, no pronósticos.
- La pantalla de riesgos permite definir umbrales, ventana de datos y severidad. No hay umbrales agronómicos predeterminados; las reglas configuradas se guardan localmente en este navegador.
- Los análisis temporales se guardan en IndexedDB durante siete días y se envían al backend cuando está configurado. Sin conexión, la aplicación restaura la última consulta guardada para la ubicación actual, y permite recuperar periodos concretos que estén en caché. El service worker mantiene el shell de la aplicación y los recursos ya visitados para poder abrirla sin red.
- Contrato esperado: `POST /api/analisis-ambiental` recibe el documento versionado con consulta, series normalizadas, observaciones originales, procedencia y `rawResponses`; se recomienda responder con el documento persistido, incluyendo el `analysisId` generado por backend. `GET /api/analisis-ambiental?latitud=…&longitud=…&inicio=…&fin=…` devuelve ese documento o HTTP 404/204 si no existe. Estas rutas aún deben implementarse en el backend.
- Ejemplo de payload para el equipo backend: [`docs/contrato-analisis-ambiental.example.json`](docs/contrato-analisis-ambiental.example.json).

## Consultar imágenes

1. Abrir `/login`, pulsar **Explorar demostración** y desde la bienvenida ir a `/mi-finca`. Dar un nombre, elegir un país y su región y, si se desea, un municipio/división local. La vista previa se ajusta a cada elección. También se pueden ingresar coordenadas válidas como alternativa.
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
  features/acceso/          Login, registro, recuperación, bienvenida y sus estilos
  features/analisis-ambiental/
    components/            Gráficos de series/tendencias y estadísticas
    hooks/                 Estado de consulta y reintento de sincronización
    services/               NASA POWER, Open-Meteo, tendencias, caché y backend
    AnalisisClimatico.tsx   Pantalla 04
    DatosHistoricos.tsx     Pantalla 06
  features/riesgos/
    components/            Lista de indicadores y editor de reglas
    services/               Evaluación y persistencia local de reglas
    RiesgosAlertas.tsx      Pantalla 05
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

El análisis ambiental y los riesgos son módulos independientes que comparten contratos de datos; así las pantallas pueden reutilizar series, estadísticas y procedencia sin duplicar llamadas ni lógica de cálculo.

## Datos e integración

`BorradorFinca` incluye nombre, país/ISO3 y región cuando se eligen del catálogo, límite administrativo, ubicación de referencia, contorno GeoJSON Polygon y área aproximada. Al dibujar se actualiza `ubicacion` al centro calculado del contorno y las búsquedas satelitales utilizan ese punto. Un centro geométrico puede quedar fuera de un polígono cóncavo. `Finca` propone añadir un identificador asignado por backend. Un contorno o área `null` significa que aún no se ha definido, no un terreno de área cero.

GeoJSON utiliza `[longitud, latitud]`. No confundir el punto de referencia con el perímetro ni con la extensión espacial de un píxel satelital. Los límites administrativos son orientación, no parcelas ni validación catastral. Su fuente es [geoBoundaries gbOpen, CC BY 4.0](https://www.geoboundaries.org/api.html). No se verifica que el terreno dibujado esté dentro de la región elegida. El dibujo admite un polígono simple y no contempla cruces del antimeridiano ni zonas polares. El área calculada con Turf es una aproximación, no una medición topográfica. Cambiar la ubicación desde el formulario inicia un contorno nuevo; navegar entre pantallas conserva el existente. Modificar el dibujo limpia la selección satelital para consultar de nuevo con su nueva referencia.

En Colombia, [DIVIPOLA](https://www.datos.gov.co/resource/gdxc-w37w.json) relaciona municipios con el código del departamento; se conservan nombre y código en `municipio`/`municipioId`. Sus coordenadas ubican una referencia municipal, no el perímetro de una finca. Para otros países, ADM2 puede representar provincias u otras divisiones; se agrupan aproximadamente por un punto de su geometría dentro de ADM1, dado que el archivo no proporciona el código del padre. Fuentes de fechas distintas pueden producir omisiones en esa agrupación; revisar la ubicación en el mapa. Las descargas se reutilizan en memoria durante la sesión y hay alternativa de continuar desde la región si fallan.

## Configuración y secretos

Copiar `.env.example` a `.env.local` para configurar el origen de datos y, al integrar el servidor, `VITE_API_BASE_URL`. `VITE_DATA_SOURCE` acepta `recursos`, `backend` o `proveedores`: el primero sirve el fixture JSON local, el segundo consulta `GET /api/analisis-ambiental`, y el tercero mantiene consultas directas a NASA POWER y Open-Meteo y sincroniza al backend si está configurado. En desarrollo se usa `recursos` por defecto; en producción, `backend`. Cambiar esta variable requiere reiniciar Vite o reconstruir la aplicación. Las pantallas consumen el mismo contrato TypeScript independientemente del origen. El recurso de ejemplo está en `public/recursos/analisis-ambiental.json`. Todo valor `VITE_*` es público en la aplicación compilada. Contraseñas, claves privadas y tokens de servicio pertenecen al backend. No se incluyen credenciales ni se habilita facturación.

## Trabajo en equipo

La rama integra el flujo de acceso y bienvenida con territorios, análisis climático, riesgos y datos históricos. La demostración de acceso no equivale a autenticación real; la integración JWT depende del backend.

El alojamiento de producción debe redirigir las rutas de la SPA a `index.html` para que funcionen las rutas internas. El service worker requiere HTTPS o localhost.

## Comprobaciones de esta base (14 de noviembre de 2026)

- `npm.cmd run build`: correcto, con TypeScript estricto.
- `npm.cmd run lint`: correcto.
- Acceso: 18 comprobaciones de campos obligatorios, correo, límites de registro y confirmación de contraseña. La demostración no emite JWT, no concede roles y no representa un inicio de sesión real.
- Municipios: comprobados códigos y coordenadas de Medellín y Tunja, 125 municipios de Antioquia, 123 de Boyacá y presencia de opciones en las 33 divisiones colombianas. La prueba de agrupación geométrica detectó una omisión en Antioquia; por eso Colombia utiliza la relación departamental de DIVIPOLA.
- Selección territorial: descarga directa desde media.githubusercontent.com para archivos LFS y alternativa raw.githubusercontent.com para archivos normales. Se evita github.com/raw porque su redirección no permite CORS desde el navegador. 21 comprobaciones de catálogo, errores HTTP, geometría, área, centro y normalización/fallback de URLs. El flujo de dibujo y edición requiere revisión visual en el navegador.
- Nueve comprobaciones directas de coordenadas: vacío, texto inválido, infinito, límites, cero y coma decimal.
- Integración satelital: 19 comprobaciones con respuestas controladas sobre validación de filtros, orden de coordenadas, respuestas malformadas, ausencia de resultados, URLs de teselas, errores HTTP, red y cancelación.
- Consulta real de escenas Sentinel-2, TileJSON con acceso CORS y descarga HTTP 200 de una tesela PNG del proveedor. Las pruebas no agregan imágenes ni respuestas simuladas a la aplicación.
- Las pantallas de territorios fueron servidas por Vite. La comprobación visual automatizada no estuvo disponible en esta sesión; revisar la entrada al formulario y la continuación al mapa desde el navegador antes de integrar.
- `npm.cmd audit --omit=dev`: sin vulnerabilidades informadas en producción al instalar.
- La auditoría completa informa siete alertas moderadas en la cadena de herramientas de desarrollo (`typescript-eslint` y `minimatch`). Revisar su compatibilidad con el equipo antes de cambiar versiones; no se aplicó `audit fix --force`.

La licencia original del repositorio se conserva en `LICENSE`.
