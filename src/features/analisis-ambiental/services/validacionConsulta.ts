import type { ConsultaHistoricaAmbiental } from '../../../types/ambiental';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validarConsultaHistorica(consulta: ConsultaHistoricaAmbiental): void {
  const { latitud, longitud } = consulta.ubicacion;

  if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90) {
    throw new Error('La latitud debe estar entre -90 y 90 grados.');
  }
  if (!Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
    throw new Error('La longitud debe estar entre -180 y 180 grados.');
  }
  if (!FECHA_ISO.test(consulta.inicio) || !FECHA_ISO.test(consulta.fin)) {
    throw new Error('Las fechas deben usar el formato AAAA-MM-DD.');
  }

  const inicio = new Date(`${consulta.inicio}T00:00:00Z`);
  const fin = new Date(`${consulta.fin}T00:00:00Z`);
  if (Number.isNaN(inicio.valueOf()) || inicio.toISOString().slice(0, 10) !== consulta.inicio
    || Number.isNaN(fin.valueOf()) || fin.toISOString().slice(0, 10) !== consulta.fin) {
    throw new Error('El periodo contiene una fecha no válida.');
  }
  if (inicio > fin) {
    throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
  }
}
