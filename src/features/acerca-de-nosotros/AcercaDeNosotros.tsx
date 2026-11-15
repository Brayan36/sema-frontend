import "./AcercaDeNosotros.css";

const integrantes = [
  { nombre: "María Isabel", cargo: "Coordinación e integración del proyecto" },
  { nombre: "Sebastián Andrés Martínez Verona", cargo: "Desarrollo del proyecto" },
  { nombre: "Anderson", cargo: "Mapas e información territorial" },
  { nombre: "Víctor Oliveros", cargo: "Información climática" },
  { nombre: "Brayan Smith Montealegre", cargo: "Desarrollo y colaboración técnica" },
];

const herramientas = [
  { nombre: "React", url: "https://react.dev/" },
  { nombre: "TypeScript", url: "https://www.typescriptlang.org/" },
  { nombre: "JavaScript", url: "https://developer.mozilla.org/es/docs/Web/JavaScript" },
  { nombre: "HTML", url: "https://developer.mozilla.org/es/docs/Web/HTML" },
  { nombre: "CSS", url: "https://developer.mozilla.org/es/docs/Web/CSS" },
  { nombre: "Vite", url: "https://vite.dev/" },
  { nombre: "React Router", url: "https://reactrouter.com/" },
  { nombre: "Git", url: "https://git-scm.com/" },
  { nombre: "GitHub", url: "https://github.com/" },
];

const inteligenciaArtificial = [
  { nombre: "ChatGPT", url: "https://chatgpt.com/" },
  { nombre: "OpenAI Codex Cloud", url: "https://openai.com/codex/" },
  { nombre: "Claude - Anthropic", url: "https://claude.ai/" },
];

const fuentes = [
  {
    categoria: "NASA y observación terrestre",
    recursos: [
      { nombre: "NASA Earthdata", url: "https://www.earthdata.nasa.gov/" },
      { nombre: "NASA POWER", url: "https://power.larc.nasa.gov/" },
      { nombre: "NASA GIBS", url: "https://www.earthdata.nasa.gov/data/tools/gibs" },
      { nombre: "NASA SMAP", url: "https://smap.jpl.nasa.gov/" },
      { nombre: "NASA GPM", url: "https://gpm.nasa.gov/" },
      { nombre: "HLS", url: "https://hls.gsfc.nasa.gov/" },
      { nombre: "ECOSTRESS", url: "https://ecostress.jpl.nasa.gov/" },
    ],
  },
  {
    categoria: "Cartografía e información territorial",
    recursos: [
      { nombre: "geoBoundaries", url: "https://www.geoboundaries.org/" },
      { nombre: "Natural Earth", url: "https://www.naturalearthdata.com/" },
      { nombre: "OpenStreetMap", url: "https://www.openstreetmap.org/" },
      { nombre: "Nominatim", url: "https://nominatim.org/" },
      { nombre: "MapLibre", url: "https://maplibre.org/" },
      { nombre: "Microsoft Planetary Computer", url: "https://planetarycomputer.microsoft.com/" },
      { nombre: "DANE - DIVIPOLA", url: "https://www.dane.gov.co/" },
    ],
  },
  {
    categoria: "Clima y datos complementarios",
    recursos: [
      { nombre: "Open-Meteo", url: "https://open-meteo.com/" },
      { nombre: "IDEAM", url: "https://www.ideam.gov.co/" },
      { nombre: "Datos Abiertos Colombia", url: "https://www.datos.gov.co/" },
    ],
  },
];

function Enlaces({
  recursos,
}: {
  recursos: { nombre: string; url: string }[];
}) {
  return (
    <div className="acerca-enlaces">
      {recursos.map((recurso) => (
        <a
          key={recurso.nombre}
          href={recurso.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {recurso.nombre} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}

export default function AcercaDeNosotros() {
  return (
    <main className="acerca-pagina">
      <section className="acerca-hero">
        <div className="acerca-contenedor">
          <span className="acerca-etiqueta">CONOCE NUESTRO PROYECTO</span>
          <h1>Acerca de nosotros</h1>
          <p>
            Somos el equipo detrás de SEMA, Sistema Espacial de
            Monitoreo Agrícola. Unimos tecnología, información
            científica y compromiso con el campo para explorar
            decisiones agrícolas más informadas.
          </p>
        </div>
      </section>

      <div className="acerca-contenedor acerca-contenido">
        <section className="acerca-seccion">
          <span className="acerca-numero">01 / NUESTRA HISTORIA</span>
          <h2>¿Por qué nació SEMA?</h2>
          <p>
            Elegimos trabajar en un desafío que conecta la ciencia
            espacial con las necesidades de los agricultores.
            Sabemos que las decisiones sobre qué cultivar, cómo
            utilizar el agua y cómo cuidar el suelo pueden ser
            complejas cuando las condiciones ambientales cambian.
          </p>
          <p>
            Por eso estamos desarrollando una herramienta que
            facilite el acceso a información agrícola, territorial
            y climática, y ayude a explorar alternativas de
            rotación de cultivos con fundamentos verificables.
          </p>
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">02 / EL DESAFÍO</span>
          <h2>Participamos en NASA Space Apps Challenge 2026</h2>
          <div className="acerca-destacado">
            <h3>Field Shift: Adapting Farms with NASA Data</h3>
            <p>
              Nuestro proyecto responde al desafío de explorar
              cómo los datos de observación de la Tierra pueden
              apoyar la adaptación agrícola y las estrategias
              de rotación de cultivos.
            </p>
            <a
              href="https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar el desafío de NASA ↗
            </a>
          </div>
          <p>
            SEMA es una iniciativa desarrollada por nuestro
            equipo participante. Su contenido y funcionamiento
            son responsabilidad de sus desarrolladores.
          </p>
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">03 / PROPÓSITO</span>
          <h2>Lo que queremos lograr</h2>
          <div className="acerca-grid">
            <article className="acerca-tarjeta">
              <h3>Nuestra misión</h3>
              <p>
                Facilitar el acceso a información científica y
                agrícola para apoyar decisiones sobre el uso
                responsable del suelo, el agua y los cultivos.
              </p>
            </article>
            <article className="acerca-tarjeta">
              <h3>Nuestra visión</h3>
              <p>
                Desarrollar una herramienta accesible, clara y
                adaptable que pueda evolucionar para apoyar a
                comunidades agrícolas de diferentes regiones.
              </p>
            </article>
          </div>
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">04 / NUESTRA SOLUCIÓN</span>
          <h2>¿Cómo estamos construyendo SEMA?</h2>
          <div className="acerca-grid">
            {[
              ["Conocer el terreno", "Registrar información de la finca, ubicación, suelo y cultivos."],
              ["Comprender el entorno", "Consultar información climática y geográfica de fuentes identificables."],
              ["Explorar rotaciones", "Preparar la comparación de alternativas de cultivo con criterios agrícolas."],
              ["Facilitar el acceso", "Avanzar hacia el uso de información descargada sin conexión y su posterior sincronización."],
            ].map(([titulo, descripcion]) => (
              <article className="acerca-tarjeta" key={titulo}>
                <h3>{titulo}</h3>
                <p>{descripcion}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">05 / NUESTRO EQUIPO</span>
          <h2>Las personas detrás del proyecto</h2>
          <p>
            SEMA es el resultado de la colaboración entre
            integrantes que aportan conocimientos, investigación
            y desarrollo tecnológico.
          </p>
          <div className="acerca-equipo">
            {integrantes.map((persona) => (
              <article className="acerca-persona" key={persona.nombre}>
                <div className="acerca-avatar" aria-hidden="true">
                  {persona.nombre.charAt(0)}
                </div>
                <div>
                  <h3>{persona.nombre}</h3>
                  <p>{persona.cargo}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">06 / TECNOLOGÍA</span>
          <h2>Herramientas de desarrollo</h2>
          <p>
            Nuestra aplicación utiliza tecnologías de desarrollo
            web para construir una experiencia modular y adaptable
            a diferentes dispositivos.
          </p>
          <Enlaces recursos={herramientas} />
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">07 / TRANSPARENCIA</span>
          <h2>Inteligencia artificial como apoyo</h2>
          <p>
            Durante el desarrollo de SEMA utilizamos herramientas
            de inteligencia artificial como apoyo al trabajo del
            equipo. Reconocemos públicamente estas herramientas
            y mantenemos la responsabilidad humana sobre la
            revisión, las decisiones técnicas y los resultados.
          </p>
          <Enlaces recursos={inteligenciaArtificial} />
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">08 / FUENTES Y RECONOCIMIENTOS</span>
          <h2>Datos abiertos y recursos científicos</h2>
          <p>
            Consultamos y documentamos recursos de observación
            terrestre, clima y cartografía. Esta relación reúne
            fuentes utilizadas o consideradas durante el
            desarrollo. La identificación de los conjuntos de
            datos integrados y sus versiones se completará
            mediante la revisión técnica de cada módulo.
          </p>
          {fuentes.map((grupo) => (
            <div className="acerca-fuentes" key={grupo.categoria}>
              <h3>{grupo.categoria}</h3>
              <Enlaces recursos={grupo.recursos} />
            </div>
          ))}
        </section>

        <section className="acerca-seccion">
          <span className="acerca-numero">09 / RESPONSABILIDAD</span>
          <h2>Información clara y verificable</h2>
          <p>
            Buscamos que cada análisis pueda relacionarse con
            sus fuentes y datos disponibles. Los resultados
            deben interpretarse considerando su fecha,
            cobertura, calidad e incertidumbre.
          </p>
          <p>
            SEMA es una herramienta en desarrollo y no sustituye
            la evaluación de un profesional en agronomía ni las
            verificaciones realizadas directamente en el terreno.
          </p>
        </section>

        <section className="acerca-seccion acerca-contacto">
          <span className="acerca-numero">10 / CONTACTO</span>
          <h2>Hablemos sobre SEMA</h2>
          <p>
            Estamos abiertos a preguntas, colaboración,
            investigación y propuestas relacionadas con
            nuestro proyecto.
          </p>
          <div className="acerca-contactos">
            {integrantes.map((persona) => (
              <div className="acerca-contacto-item" key={persona.nombre}>
                <strong>{persona.nombre}</strong>
                <span>Correo de contacto pendiente de publicación</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}