import type { Ubicacion } from './finca';

/** Fuentes externas admitidas por la capa de análisis ambiental. */
export type ProveedorAmbiental = 'nasa-power' | 'open-meteo';

/** Variables compartidas por clima, suelo, tendencias y riesgos. */
export type VariableAmbiental =
  | 'temperatura'
  | 'precipitacion'
  | 'radiacion-solar'
  | 'humedad-relativa'
  | 'humedad-suelo'
  | 'temperatura-suelo'
  | 'velocidad-viento'
  | 'evapotranspiracion';

/** Valores explícitos para evitar mezclar unidades al normalizar proveedores. */
export type UnidadAmbiental =
  | '°C'
  | 'mm'
  | 'MJ/m²/día'
  | 'W/m²'
  | '%'
  | 'm³/m³'
  | 'km/h'
  | 'mm/día';

export type TipoDatoAmbiental = 'historico' | 'pronostico' | 'climatologia';
export type FrecuenciaAmbiental = 'horaria' | 'diaria' | 'mensual';
export type ReferenciaTemporalAmbiental = 'UTC' | 'LST' | 'local';

export type PuntoSerieAmbiental = {
  /** ISO 8601; debe incluir zona horaria cuando la frecuencia sea horaria. */
  fecha: string;
  /** Null representa un valor ausente del proveedor, nunca cero. */
  valor: number | null;
};

export type EstadisticasSerieAmbiental = {
  minimo: number | null;
  fechaMinimo: string | null;
  maximo: number | null;
  fechaMaximo: string | null;
  promedio: number | null;
  cantidad: number;
};

export type ProcedenciaAmbiental = {
  proveedor: ProveedorAmbiental;
  conjuntoDatos: string;
  modelo?: string;
  resolucionEspacial?: string;
  atribucion?: string;
};

export type SerieAmbiental = {
  variable: VariableAmbiental;
  unidad: UnidadAmbiental;
  frecuencia: FrecuenciaAmbiental;
  tipoDato: TipoDatoAmbiental;
  referenciaTemporal: ReferenciaTemporalAmbiental;
  periodo: { inicio: string; fin: string };
  puntos: PuntoSerieAmbiental[];
  estadisticas: EstadisticasSerieAmbiental;
  procedencia: ProcedenciaAmbiental;
};

/** Una serie comparativa conserva el dato de cada proveedor sin promediarlos. */
export type PuntoAmbientalFusionado = {
  fecha: string;
  valores: Partial<Record<ProveedorAmbiental, number | null>>;
};

export type SerieAmbientalFusionada = Omit<SerieAmbiental, 'puntos' | 'estadisticas' | 'procedencia'> & {
  puntos: PuntoAmbientalFusionado[];
  estadisticasPorProveedor: Partial<Record<ProveedorAmbiental, EstadisticasSerieAmbiental>>;
  procedenciaPorProveedor: Partial<Record<ProveedorAmbiental, ProcedenciaAmbiental>>;
};

export type ResultadoFusionAmbiental = {
  series: SerieAmbientalFusionada[];
  avisos: string[];
};

/** Respuesta normalizada que puede viajar entre frontend, caché local y backend. */
export type AnalisisAmbiental = {
  schemaVersion?: 1;
  analysisId?: string | null;
  fincaId?: string;
  ubicacion: Ubicacion;
  periodo?: { inicio: string; fin: string };
  obtenidoEn: string;
  creadoEn?: string;
  expiraEn?: string | null;
  respuestasCrudas?: Partial<Record<ProveedorAmbiental, RespuestaCrudaProveedorAmbiental>>;
  erroresProveedores?: ErrorProveedorAmbiental[];
  series: SerieAmbiental[];
};

/** Respuesta JSON original del proveedor, conservada junto a la serie normalizada. */
export type RespuestaCrudaProveedorAmbiental = {
  url: string;
  estadoHttp: number;
  tipoContenido: string | null;
  recibidaEn: string;
  cuerpo: unknown;
};

export type ResultadoProveedorAmbiental = {
  series: SerieAmbiental[];
  respuestaCruda: RespuestaCrudaProveedorAmbiental;
  error?: string;
};

export type ConsultaHistoricaAmbiental = {
  ubicacion: Ubicacion;
  inicio: string;
  fin: string;
};

export type ErrorProveedorAmbiental = {
  proveedor: ProveedorAmbiental;
  mensaje: string;
};

export type ResultadoConsultaAmbiental = {
  series: SerieAmbiental[];
  respuestasCrudas: Partial<Record<ProveedorAmbiental, RespuestaCrudaProveedorAmbiental>>;
  errores: ErrorProveedorAmbiental[];
};

export type FuenteAnalisisDisponible = 'proveedores' | 'backend' | 'recursos' | 'cache-local';

export type AnalisisDisponible = {
  analisis: AnalisisAmbiental;
  fuente: FuenteAnalisisDisponible;
  cacheVencida: boolean;
  avisos: string[];
};

export type PuntoAnualAmbiental = {
  anio: number;
  valor: number;
  observaciones: number;
  esperadas: number;
  cobertura: number;
};

export type DireccionTendencia = 'ascendente' | 'descendente' | 'sin-tendencia' | 'datos-insuficientes';

export type TendenciaHistorica = {
  variable: VariableAmbiental;
  unidad: UnidadAmbiental;
  unidadValorAnual: string;
  unidadTendencia: string;
  direccion: DireccionTendencia;
  pendientePorAnio: number | null;
  cambioTendencialPeriodo: number | null;
  rCuadrado: number | null;
  puntosAnuales: PuntoAnualAmbiental[];
  aniosExcluidos: number[];
};

export type CondicionReglaRiesgo = 'menor-que' | 'mayor-que' | 'fuera-de-rango';
export type MedidaReglaRiesgo = 'ultimo' | 'promedio' | 'minimo' | 'maximo';
export type SeveridadRiesgo = 'informativo' | 'bajo' | 'moderado' | 'alto' | 'critico';
export type EstadoRiesgo = 'activo' | 'sin-riesgo' | 'sin-datos' | 'datos-insuficientes' | 'regla-invalida';

export type ReglaRiesgo = {
  id: string;
  nombre: string;
  variable: VariableAmbiental;
  unidad: UnidadAmbiental;
  frecuencia: FrecuenciaAmbiental;
  proveedor: ProveedorAmbiental;
  condicion: CondicionReglaRiesgo;
  medida: MedidaReglaRiesgo;
  cantidadPuntos: number;
  umbral: number;
  umbralSuperior?: number;
  severidad: SeveridadRiesgo;
  explicacion: string;
};

export type ResultadoRiesgo = {
  reglaId: string;
  nombre: string;
  proveedor: ProveedorAmbiental;
  estado: EstadoRiesgo;
  severidad: SeveridadRiesgo;
  valorEvaluado: number | null;
  unidad: UnidadAmbiental;
  puntosEvaluados: number;
  explicacion: string;
};
