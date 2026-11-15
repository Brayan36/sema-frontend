import type { ReglaRiesgo } from '../../../types/ambiental';

const CLAVE_REGLAS = 'sema-reglas-riesgo-v1';
const variables = ['temperatura', 'precipitacion', 'radiacion-solar', 'humedad-relativa', 'humedad-suelo', 'temperatura-suelo', 'velocidad-viento', 'evapotranspiracion'];
const unidades = ['°C', 'mm', 'MJ/m²/día', 'W/m²', '%', 'm³/m³', 'km/h', 'mm/día'];
const frecuencias = ['horaria', 'diaria', 'mensual'];
const proveedores = ['nasa-power', 'open-meteo'];
const condiciones = ['menor-que', 'mayor-que', 'fuera-de-rango'];
const medidas = ['ultimo', 'promedio', 'minimo', 'maximo'];
const severidades = ['informativo', 'bajo', 'moderado', 'alto', 'critico'];

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esRegla(valor: unknown): valor is ReglaRiesgo {
  if (!esObjeto(valor)) return false;
  if (typeof valor.id !== 'string' || typeof valor.nombre !== 'string' || typeof valor.explicacion !== 'string') return false;
  if (!variables.includes(String(valor.variable)) || !unidades.includes(String(valor.unidad))) return false;
  if (!frecuencias.includes(String(valor.frecuencia)) || !proveedores.includes(String(valor.proveedor))) return false;
  if (!condiciones.includes(String(valor.condicion)) || !medidas.includes(String(valor.medida))) return false;
  if (!severidades.includes(String(valor.severidad)) || !Number.isInteger(valor.cantidadPuntos) || Number(valor.cantidadPuntos) < 1) return false;
  if (typeof valor.umbral !== 'number' || !Number.isFinite(valor.umbral)) return false;
  return valor.condicion !== 'fuera-de-rango'
    || (typeof valor.umbralSuperior === 'number' && Number.isFinite(valor.umbralSuperior) && valor.umbralSuperior >= valor.umbral);
}

export function leerReglasLocales(): ReglaRiesgo[] {
  try {
    const contenido = localStorage.getItem(CLAVE_REGLAS);
    if (!contenido) return [];
    const valor: unknown = JSON.parse(contenido);
    return Array.isArray(valor) ? valor.filter(esRegla) : [];
  } catch {
    return [];
  }
}

export function guardarReglasLocales(reglas: ReglaRiesgo[]): void {
  try {
    localStorage.setItem(CLAVE_REGLAS, JSON.stringify(reglas));
  } catch {
    // Las reglas continúan en memoria si el almacenamiento local está lleno o bloqueado.
  }
}
