export const CLAVE_TOKEN = 'sema-auth-token-v1';
type Almacenamiento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Solo sessionStorage opcional. No persiste perfil, contraseña ni roles. */
export function crearAlmacenToken(modo: 'memory' | 'session', obtenerStorage: () => Almacenamiento | null) {
  return {
    leer(): string | null {
      try {
        const storage = obtenerStorage();
        if (modo === 'session') return storage?.getItem(CLAVE_TOKEN) ?? null;
        storage?.removeItem(CLAVE_TOKEN);
      } catch { /* El almacenamiento no es requisito para usar memoria. */ }
      return null;
    },
    guardar(token: string | null) {
      try {
        const storage = obtenerStorage();
        if (token && modo === 'session') storage?.setItem(CLAVE_TOKEN, token);
        else storage?.removeItem(CLAVE_TOKEN);
      } catch { /* Se mantiene la sesión en memoria si falla sessionStorage. */ }
    },
  };
}
