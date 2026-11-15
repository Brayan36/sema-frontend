import test from 'node:test';
import assert from 'node:assert/strict';
import { ClienteHttp, ApiError } from '../src/services/httpClient.ts';
import { autenticar, consultarUsuario, leerUsuario, expiracionJwt } from '../src/features/acceso/auth.service.ts';
import { crearAlmacenToken } from '../src/features/acceso/tokenStorage.ts';

const perfil = { id: 7, nombre: 'Prueba', correo: 'prueba@example.test', is_active: true };
const json = (datos, status = 200) => Response.json(datos, { status });
const crearCliente = fetch => new ClienteHttp({ base: () => new URL('http://127.0.0.1:8000'), fetch });

test('login usa formulario y exclusivamente /auth/login y /auth/me', async () => {
  const rutas = [];
  const cliente = crearCliente(async (url, opciones) => {
    rutas.push(url.pathname);
    if (url.pathname === '/auth/login') {
      assert.equal(opciones.method, 'POST');
      assert.equal(opciones.headers.get('Content-Type'), 'application/x-www-form-urlencoded');
      assert.equal(opciones.headers.get('Authorization'), null);
      assert.equal(new URLSearchParams(opciones.body).get('username'), 'a+b@example.test');
      assert.equal(new URLSearchParams(opciones.body).get('password'), 'clave+con&simbolos=');
      return json({ access_token: 'token-prueba', token_type: 'bearer' });
    }
    assert.equal(url.pathname, '/auth/me');
    assert.equal(opciones.headers.get('Authorization'), 'Bearer token-prueba');
    return json(perfil);
  });
  cliente.establecerToken('anterior');
  const acceso = await autenticar(' a+b@example.test ', 'clave+con&simbolos=', undefined, cliente);
  assert.equal(acceso.usuario.id, '7');
  assert.deepEqual(acceso.usuario.roles, []);
  assert.deepEqual(acceso.usuario.permisos, []);
  assert.deepEqual(rutas, ['/auth/login', '/auth/me']);
});

test('credenciales incorrectas no generan una sesión ni invalidan otro token', async () => {
  let cierres = 0;
  const cliente = crearCliente(async () => json({ error: { code: 'UNAUTHORIZED', message: 'Credenciales inválidas' } }, 401));
  cliente.establecerToken('anterior'); cliente.alInvalidarSesion(() => cierres++);
  await assert.rejects(autenticar('prueba@example.test', 'incorrecta', undefined, cliente), e => e.status === 401);
  assert.equal(cierres, 0);
});

test('perfil válido obligatorio; un token por sí solo no permite completar el acceso', async () => {
  assert.equal(leerUsuario(perfil).correo, perfil.correo);
  for (const dato of [{ ...perfil, is_active: false }, { ...perfil, id: 'incorrecto' }, {}]) assert.throws(() => leerUsuario(dato), ApiError);
  const cliente = crearCliente(async () => json({}, 401));
  await assert.rejects(consultarUsuario('invalido', undefined, cliente), e => e.status === 401);
});

test('401 protegido invalida el token; 403 conserva la sesión', async () => {
  let status = 403, cierres = 0;
  const cliente = crearCliente(async (_url, opciones) => {
    assert.equal(opciones.headers.get('Authorization'), 'Bearer vigente');
    return json({}, status);
  });
  cliente.establecerToken('vigente'); cliente.alInvalidarSesion(() => cierres++);
  await assert.rejects(cliente.solicitar('/auth/me'), e => e.status === 403);
  assert.equal(cierres, 0);
  status = 401;
  await assert.rejects(cliente.solicitar('/auth/me'), e => e.status === 401);
  assert.equal(cierres, 1);
  await assert.rejects(cliente.solicitar('/auth/me'), e => e.codigo === 'SIN_SESION');
});

test('un 401 tardío de un token anterior no invalida el nuevo', async () => {
  let responder, cierres = 0;
  const cliente = crearCliente(() => new Promise(resolve => { responder = resolve; }));
  cliente.alInvalidarSesion(() => cierres++); cliente.establecerToken('anterior');
  const pendiente = cliente.solicitar('/auth/me');
  cliente.establecerToken('nuevo'); responder(json({}, 401));
  await assert.rejects(pendiente, e => e.status === 401); assert.equal(cierres, 0);
});

test('errores de validación del login y de red se muestran sin filtrar detalles internos', async () => {
  const validacion = crearCliente(async () => json({ error: { code: 'VALIDATION_ERROR', details: [{ field: 'body.username', message: 'Requerido' }] } }, 422));
  await assert.rejects(validacion.solicitar('/auth/login', { autenticada: false }), e => e.campos.username === 'Requerido');
  const servidor = crearCliente(async () => json({ error: { message: 'traza privada', error_id: 'referencia' } }, 500));
  await assert.rejects(servidor.solicitar('/auth/login', { autenticada: false }), e => e.errorId === 'referencia' && !e.message.includes('traza privada'));
  const red = crearCliente(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(red.solicitar('/auth/login', { autenticada: false }), e => e.codigo === 'RED');
});

test('no envía tokens a otros orígenes; cancelar no cierra sesión', async () => {
  let llamadas = 0, cierres = 0;
  const cliente = crearCliente(async (_url, opciones) => {
    llamadas++; if (opciones.signal.aborted) throw new DOMException('Cancelado', 'AbortError');
    return json({});
  });
  cliente.establecerToken('privado'); cliente.alInvalidarSesion(() => cierres++);
  for (const ruta of ['https://otro.example/auth/me', '//otro.example/auth/me', '/../auth/me']) await assert.rejects(cliente.solicitar(ruta));
  assert.equal(llamadas, 0);
  const control = new AbortController(); control.abort();
  await assert.rejects(cliente.solicitar('/auth/me', { signal: control.signal }), e => e.name === 'AbortError');
  assert.equal(cierres, 0);
});

test('persistencia opcional por pestaña y limpieza al cerrar sesión', () => {
  const valores = new Map();
  const storage = { getItem: k => valores.get(k) ?? null, setItem: (k, v) => valores.set(k, v), removeItem: k => valores.delete(k) };
  const memoria = crearAlmacenToken('memory', () => storage);
  memoria.guardar('token'); assert.equal(valores.size, 0);
  const pestaña = crearAlmacenToken('session', () => storage);
  pestaña.guardar('token'); assert.equal(pestaña.leer(), 'token');
  pestaña.guardar(null); assert.equal(pestaña.leer(), null);
  const bloqueado = crearAlmacenToken('session', () => { throw new Error('Bloqueado'); });
  assert.doesNotThrow(() => bloqueado.guardar('token')); assert.equal(bloqueado.leer(), null);
});

test('exp solo programa la salida visual y no concede roles', () => {
  const token = 'cabecera.' + Buffer.from(JSON.stringify({ exp: 2000000000 })).toString('base64url') + '.firma';
  assert.equal(expiracionJwt(token), 2000000000000);
  assert.equal(expiracionJwt('invalido'), null);
});
