import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import type { BorradorFinca } from "../../types/finca";
import { evaluarDatosAgricolas } from "./motorRotacion";
import type { ResultadoEvaluacion } from "./motorRotacion";
import "./RotacionCultivos.css";

type DatosClimaticos = {
  temperaturaMediaC?: number | null;
  precipitacionMm?: number | null;
  radiacionSolar?: number | null;
  unidadRadiacion?: string;
  periodo?: string;
  fuente?: string;
};

type Props = {
  finca?: BorradorFinca | null;
  clima?: DatosClimaticos | null;
};

type PerfilAgricola = {
  cultivoActual: string;
  historial: string;
  tipoSuelo: string;
  drenaje: string;
  agua: string;
  riego: string;
  problemas: string;
  objetivo: string;
  observaciones: string;
};

const perfilInicial: PerfilAgricola = {
  cultivoActual: "",
  historial: "",
  tipoSuelo: "",
  drenaje: "",
  agua: "",
  riego: "",
  problemas: "",
  objetivo: "",
  observaciones: "",
};

const estiloFormulario: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "18px",
  marginTop: "20px",
};

const estiloCampo: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontWeight: 600,
  color: "#294c38",
};

const estiloEntrada: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #bfd5c6",
  backgroundColor: "#ffffff",
  color: "#243746",
  font: "inherit",
};

const estiloSeccion: CSSProperties = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "18px",
  border: "1px solid #dbe9e0",
  marginTop: "24px",
};

export default function RotacionCultivos({
  finca = null,
  clima = null,
}: Props) {
  const [perfil, setPerfil] =
    useState<PerfilAgricola>(perfilInicial);

  const [consultado, setConsultado] = useState(false);

  // Referencia a la evaluación inicial del terreno.
  const resultadoRef = useRef<HTMLElement | null>(null);

  // Desplazamiento automático al mostrar los resultados.
  useEffect(() => {
    if (!consultado) return;

    const movimientoReducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    resultadoRef.current?.scrollIntoView({
      behavior: movimientoReducido ? "auto" : "smooth",
      block: "start",
    });
  }, [consultado]);

  function actualizar(
    nombre: keyof PerfilAgricola,
    valor: string
  ) {
    setPerfil((anterior) => ({
      ...anterior,
      [nombre]: valor,
    }));

    setConsultado(false);
  }

  function revisarInformacion() {
    // Si los resultados ya están visibles, permite
    // volver a ellos sin tener que bajar manualmente.
    if (consultado) {
      resultadoRef.current?.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      return;
    }

    setConsultado(true);
  }

  const historial = perfil.historial
    .split(",")
    .map((cultivo) => cultivo.trim())
    .filter(Boolean);

  /*
   * Conectamos el formulario con motorRotacion.ts.
   * Los valores no disponibles se envían como null.
   * No se generan datos ficticios.
   */

  const resultado: ResultadoEvaluacion =
    evaluarDatosAgricolas({
      finca: finca ?? null,
      cultivoActual: perfil.cultivoActual,
      cultivosAnteriores: historial,
      tipoSuelo: perfil.tipoSuelo,
      drenaje: perfil.drenaje,
      disponibilidadAgua: perfil.agua,
      temperaturaC:
        clima?.temperaturaMediaC ?? null,
      precipitacionMm:
        clima?.precipitacionMm ?? null,
      radiacionSolar:
        clima?.radiacionSolar ?? null,
    });

  const ubicacionValida =
    finca !== null &&
    Number.isFinite(finca.ubicacion?.latitud) &&
    Number.isFinite(finca.ubicacion?.longitud);

  const faltantes = resultado.datosFaltantes;

  return (
    <main className="rotacion-pagina">
      <div className="rotacion-contenedor">


        {/* PRESENTACIÓN */}

        <section className="rotacion-introduccion">
          <span className="rotacion-categoria">
            Agricultura sostenible
          </span>

          <h1>Rotación inteligente de cultivos</h1>

          <p>
            Conoce mejor tu terreno y registra tu
            experiencia agrícola. SEMA combinará
            esta información con datos climáticos
            verificables para evaluar alternativas
            de rotación, conservación del suelo
            y manejo del agua.
          </p>
        </section>

        <section className="rotacion-aviso">
          <span aria-hidden="true">🛰️</span>

          <div>
            <strong>
              Preparación del análisis agrícola
            </strong>

            <p>
              Nuestro sistema ya puede comprobar
              los datos disponibles y detectar
              información faltante. El motor de
              recomendaciones agrícolas todavía
              está en desarrollo.
            </p>
          </div>
        </section>

        {/* DATOS TERRITORIALES DE ANDERSON */}

        <section style={estiloSeccion}>
          <h2>1. Información de tu terreno</h2>

          {finca ? (
            <div style={estiloFormulario}>
              <div>
                <strong>Nombre</strong>
                <p>
                  {finca.nombre || "No registrado"}
                </p>
              </div>

              <div>
                <strong>País</strong>
                <p>
                  {finca.pais || "No disponible"}
                </p>
              </div>

              <div>
                <strong>Región</strong>
                <p>
                  {finca.region || "No disponible"}
                </p>
              </div>

              <div>
                <strong>Municipio</strong>
                <p>
                  {finca.municipio || "No disponible"}
                </p>
              </div>

              <div>
                <strong>Latitud</strong>
                <p>
                  {ubicacionValida
                    ? finca.ubicacion.latitud
                    : "No disponible"}
                </p>
              </div>

              <div>
                <strong>Longitud</strong>
                <p>
                  {ubicacionValida
                    ? finca.ubicacion.longitud
                    : "No disponible"}
                </p>
              </div>

              <div>
                <strong>Superficie</strong>
                <p>
                  {finca.areaHectareas != null
                    ? `${finca.areaHectareas} hectáreas`
                    : "No registrada"}
                </p>
              </div>
            </div>
          ) : (
            <p>
              Aún no se ha recibido una finca.
              Primero selecciona tu terreno en
              el módulo de territorios.
            </p>
          )}

          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "#607482",
            }}
          >
            La ubicación proviene del módulo
            territorial. Las coordenadas
            geográficas no representan por sí
            solas un análisis del suelo.
          </p>
        </section>

        {/* DATOS CLIMÁTICOS DE VÍCTOR */}

        <section style={estiloSeccion}>
          <h2>2. Condiciones climáticas</h2>

          {clima ? (
            <div style={estiloFormulario}>
              <div>
                <strong>Temperatura media</strong>
                <p>
                  {clima.temperaturaMediaC != null
                    ? `${clima.temperaturaMediaC} °C`
                    : "No disponible"}
                </p>
              </div>

              <div>
                <strong>Precipitaciones</strong>
                <p>
                  {clima.precipitacionMm != null
                    ? `${clima.precipitacionMm} mm`
                    : "No disponible"}
                </p>
              </div>

              <div>
                <strong>Radiación solar</strong>
                <p>
                  {clima.radiacionSolar != null
                    ? `${clima.radiacionSolar} ${
                        clima.unidadRadiacion ||
                        "(unidad pendiente)"
                      }`
                    : "No disponible"}
                </p>
              </div>

              <div>
                <strong>Periodo</strong>
                <p>
                  {clima.periodo ||
                    "No especificado"}
                </p>
              </div>

              <div>
                <strong>Fuente</strong>
                <p>
                  {clima.fuente ||
                    "No especificada"}
                </p>
              </div>
            </div>
          ) : (
            <p>
              Esperando conexión con los datos
              de NASA POWER y Open-Meteo del
              módulo climático de Víctor.
            </p>
          )}

          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "#607482",
            }}
          >
            La evaluación posterior deberá verificar
            las unidades, el periodo de los datos
            y la procedencia de cada variable.
          </p>
        </section>

        {/* INFORMACIÓN AGRÍCOLA */}

        <section style={estiloSeccion}>
          <h2>3. Cuéntanos sobre tus cultivos</h2>

          <p>
            Estos datos complementan la información
            territorial y climática para preparar
            una evaluación agrícola.
          </p>

          <div style={estiloFormulario}>

            <label style={estiloCampo}>
              ¿Qué cultivas actualmente?

              <input
                style={estiloEntrada}
                type="text"
                value={perfil.cultivoActual}
                placeholder="Ejemplo: papa"
                onChange={(e) =>
                  actualizar(
                    "cultivoActual",
                    e.target.value
                  )
                }
              />
            </label>

            <label style={estiloCampo}>
              ¿Qué sembraste anteriormente?

              <input
                style={estiloEntrada}
                type="text"
                value={perfil.historial}
                placeholder="Ejemplo: tomate, maíz, frijol"
                onChange={(e) =>
                  actualizar(
                    "historial",
                    e.target.value
                  )
                }
              />
            </label>

            <label style={estiloCampo}>
              Tipo de suelo conocido

              <select
                style={estiloEntrada}
                value={perfil.tipoSuelo}
                onChange={(e) =>
                  actualizar(
                    "tipoSuelo",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Arenoso">
                  Arenoso
                </option>

                <option value="Arcilloso">
                  Arcilloso
                </option>

                <option value="Franco">
                  Franco
                </option>

                <option value="Limoso">
                  Limoso
                </option>

                <option value="Otro">
                  Otro
                </option>

                <option value="Desconocido">
                  No lo sé
                </option>
              </select>
            </label>

            <label style={estiloCampo}>
              ¿Cómo es el drenaje del terreno?

              <select
                style={estiloEntrada}
                value={perfil.drenaje}
                onChange={(e) =>
                  actualizar(
                    "drenaje",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Bueno">
                  El agua drena fácilmente
                </option>

                <option value="Lento">
                  El agua tarda en drenar
                </option>

                <option value="Encharcamiento">
                  Se forman encharcamientos
                </option>

                <option value="Desconocido">
                  No lo sé
                </option>
              </select>
            </label>

            <label style={estiloCampo}>
              Disponibilidad de agua

              <select
                style={estiloEntrada}
                value={perfil.agua}
                onChange={(e) =>
                  actualizar(
                    "agua",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Alta">
                  Alta
                </option>

                <option value="Media">
                  Media
                </option>

                <option value="Baja">
                  Baja
                </option>

                <option value="Desconocida">
                  No lo sé
                </option>
              </select>
            </label>

            <label style={estiloCampo}>
              Sistema de riego

              <select
                style={estiloEntrada}
                value={perfil.riego}
                onChange={(e) =>
                  actualizar(
                    "riego",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Lluvia">
                  Solo agua de lluvia
                </option>

                <option value="Goteo">
                  Riego por goteo
                </option>

                <option value="Aspersion">
                  Riego por aspersión
                </option>

                <option value="Otro">
                  Otro sistema
                </option>
              </select>
            </label>

            <label style={estiloCampo}>
              Problemas observados

              <input
                style={estiloEntrada}
                type="text"
                value={perfil.problemas}
                placeholder="Plagas, enfermedades, erosión..."
                onChange={(e) =>
                  actualizar(
                    "problemas",
                    e.target.value
                  )
                }
              />
            </label>

            <label style={estiloCampo}>
              ¿Qué deseas mejorar?

              <select
                style={estiloEntrada}
                value={perfil.objetivo}
                onChange={(e) =>
                  actualizar(
                    "objetivo",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar
                </option>

                <option value="Conservar agua">
                  Ahorrar agua
                </option>

                <option value="Mejorar suelo">
                  Mejorar el suelo
                </option>

                <option value="Reducir riesgos">
                  Reducir riesgos agrícolas
                </option>

                <option value="Diversificar">
                  Diversificar cultivos
                </option>

                <option value="Planificar">
                  Planificar próximas siembras
                </option>
              </select>
            </label>
          </div>

          <label
            style={{
              ...estiloCampo,
              marginTop: 20,
            }}
          >
            Información adicional de tu finca

            <textarea
              style={{
                ...estiloEntrada,
                minHeight: 110,
                resize: "vertical",
              }}
              value={perfil.observaciones}
              placeholder={
                "Cuéntanos lo que consideres importante..."
              }
              onChange={(e) =>
                actualizar(
                  "observaciones",
                  e.target.value
                )
              }
            />
          </label>

          <button
            type="button"
            className="rotacion-boton"
            style={{
              maxWidth: 300,
              marginTop: 24,
            }}
            onClick={revisarInformacion}
          >
            Revisar información disponible
          </button>
        </section>

        {/* RESULTADO DEL MOTOR DE EVALUACIÓN */}

        {consultado && (
          <section
            ref={resultadoRef}
            className="rotacion-detalle rotacion-entrada"
            aria-live="polite"
          >
            <div className="rotacion-detalle-encabezado">
              <span aria-hidden="true">🌱</span>

              <div>
                <h2>
                  Evaluación inicial del terreno
                </h2>

                <p>
                  Comprobación realizada mediante
                  el motor de datos agrícolas de SEMA.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3>Estado de la información</h3>

              <p>
                <strong>
                  {resultado.estado ===
                  "listo_para_analizar"
                    ? "Datos básicos disponibles"
                    : "Información pendiente"}
                </strong>
              </p>

              <p>{resultado.mensaje}</p>
            </div>

            <div style={estiloFormulario}>
              <div>
                <strong>Finca</strong>

                <p>
                  {finca?.nombre ||
                    "No registrada"}
                </p>
              </div>

              <div>
                <strong>Cultivo actual</strong>

                <p>
                  {perfil.cultivoActual.trim() ||
                    "No registrado"}
                </p>
              </div>

              <div>
                <strong>Historial agrícola</strong>

                <p>
                  {historial.length > 0
                    ? historial.join(", ")
                    : "No registrado"}
                </p>
              </div>

              <div>
                <strong>Tipo de suelo</strong>

                <p>
                  {perfil.tipoSuelo ||
                    "No registrado"}
                </p>
              </div>

              <div>
                <strong>Drenaje</strong>

                <p>
                  {perfil.drenaje ||
                    "No registrado"}
                </p>
              </div>

              <div>
                <strong>Disponibilidad de agua</strong>

                <p>
                  {perfil.agua ||
                    "No registrada"}
                </p>
              </div>

              <div>
                <strong>Sistema de riego</strong>

                <p>
                  {perfil.riego ||
                    "No especificado"}
                </p>
              </div>

              <div>
                <strong>Objetivo agrícola</strong>

                <p>
                  {perfil.objetivo ||
                    "No registrado"}
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <h3>
                Información que falta verificar
              </h3>

              {faltantes.length > 0 ? (
                <ul className="rotacion-lista">
                  {faltantes.map((dato) => (
                    <li key={dato}>
                      {dato}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Los campos básicos están
                  disponibles. Ahora será necesario
                  verificar su calidad, fechas,
                  unidades y fuentes antes de
                  ejecutar el análisis agronómico.
                </p>
              )}
            </div>

            <p className="rotacion-advertencia">
              Esta evaluación comprueba la presencia
              de datos básicos. No determina todavía
              la aptitud de los cultivos, las
              necesidades de riego ni la reducción
              de riesgos de plagas o enfermedades.

              Las futuras recomendaciones deberán
              utilizar fuentes científicas
              verificables y criterios agronómicos
              validados.
            </p>
          </section>
        )}

      </div>
    </main>
  );
}