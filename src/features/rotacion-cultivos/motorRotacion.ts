import type { BorradorFinca } from "../../types/finca";

export type DatosAgricolas = {
  finca: BorradorFinca | null;
  cultivoActual: string;
  cultivosAnteriores: string[];
  tipoSuelo: string;
  drenaje: string;
  disponibilidadAgua: string;
  temperaturaC: number | null;
  precipitacionMm: number | null;
  radiacionSolar: number | null;
};

export type ResultadoEvaluacion = {
  estado: "pendiente" | "listo_para_analizar";
  datosFaltantes: string[];
  mensaje: string;
};

export function evaluarDatosAgricolas(
  datos: DatosAgricolas
): ResultadoEvaluacion {
  const faltantes: string[] = [];

  if (
    !datos.finca ||
    !Number.isFinite(datos.finca.ubicacion.latitud) ||
    !Number.isFinite(datos.finca.ubicacion.longitud)
  ) {
    faltantes.push("Ubicación del terreno");
  }

  if (!datos.cultivoActual.trim()) {
    faltantes.push("Cultivo actual");
  }

  if (datos.cultivosAnteriores.length === 0) {
    faltantes.push("Historial de cultivos");
  }

  if (!datos.tipoSuelo || datos.tipoSuelo === "Desconocido") {
    faltantes.push("Características del suelo");
  }

  if (!datos.drenaje || datos.drenaje === "Desconocido") {
    faltantes.push("Drenaje del terreno");
  }

  if (
    !datos.disponibilidadAgua ||
    datos.disponibilidadAgua === "Desconocida"
  ) {
    faltantes.push("Disponibilidad de agua");
  }

  if (
    datos.temperaturaC === null ||
    !Number.isFinite(datos.temperaturaC)
  ) {
    faltantes.push("Temperatura");
  }

  if (
    datos.precipitacionMm === null ||
    !Number.isFinite(datos.precipitacionMm)
  ) {
    faltantes.push("Precipitaciones");
  }

  if (
    datos.radiacionSolar === null ||
    !Number.isFinite(datos.radiacionSolar)
  ) {
    faltantes.push("Radiación solar");
  }

  return {
    estado:
      faltantes.length === 0
        ? "listo_para_analizar"
        : "pendiente",

    datosFaltantes: faltantes,

    mensaje:
      faltantes.length === 0
        ? "Los datos básicos están disponibles. Falta ejecutar y validar el análisis agronómico."
        : "Se necesita información adicional para preparar el análisis agrícola.",
  };
}