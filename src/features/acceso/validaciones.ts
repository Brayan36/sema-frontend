import type { DatosRegistro, ErroresAcceso } from './types';

export function validarCorreo(correo: string): string | undefined {
  if (!correo.trim()) return 'Escribe tu correo electrónico.';
  if (correo.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
}

export function validarInicio(correo: string, contrasena: string): ErroresAcceso {
  const errores: ErroresAcceso = {};
  const errorCorreo = validarCorreo(correo);
  if (errorCorreo) errores.correo = errorCorreo;
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.';
  return errores;
}

export function validarRegistro(datos: DatosRegistro): ErroresAcceso {
  const errores = validarInicio(datos.correo, datos.contrasena);
  if (!datos.nombre.trim()) errores.nombre = 'Escribe tu nombre.';
  else if (datos.nombre.trim().length > 100) errores.nombre = 'Usa como máximo 100 caracteres.';
  if (datos.contrasena && datos.contrasena.length < 8) errores.contrasena = 'Usa al menos 8 caracteres.';
  if (datos.contrasena.length > 128) errores.contrasena = 'Usa como máximo 128 caracteres.';
  if (!datos.confirmacion) errores.confirmacion = 'Repite tu contraseña.';
  else if (datos.confirmacion !== datos.contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}
