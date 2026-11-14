export type UsuarioSesion = {
  id: string;
  nombre: string;
  correo: string;
  roles: string[];
  permisos: string[];
};

/** La API definirá cómo entregar y renovar el JWT. La demostración no emite tokens. */
export type SesionAcceso = { origen: 'demostracion' | 'api'; usuario: UsuarioSesion };
export type DatosRegistro = { nombre: string; correo: string; contrasena: string; confirmacion: string };
export type ErroresAcceso = Partial<Record<keyof DatosRegistro, string>>;
