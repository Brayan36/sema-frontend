import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarHistoricoOpenMeteo } from '../src/features/analisis-ambiental/services/openMeteo.ts';
import { consultarHistoricoAmbiental } from '../src/features/analisis-ambiental/services/consultarHistorico.ts';
import { cargarAnalisisHistorico, sincronizarAnalisisPendientes } from '../src/features/analisis-ambiental/services/cargarAnalisis.ts';
import { obtenerFuenteDatos } from '../src/services/api.ts';

const consulta = { ubicacion: { latitud: 4.61, longitud: -74.08 }, inicio: '2024-01-01', fin: '2024-01-03' };
const variables = ['temperatura', 'precipitacion', 'radiacion-solar', 'humedad-relativa', 'velocidad-viento', 'evapotranspiracion', 'temperatura-suelo', 'humedad-suelo'];
function respuestaMeteo(url) {
  const block = (param, time) => ({ time, ...Object.fromEntries(url.searchParams.get(param).split(',').map(key => [key, time.map(() => 12)])) });
  return Response.json({ daily: block('daily', ['2024-01-01', '2024-01-02', '2024-01-03']), hourly: block('hourly', ['2024-01-01T00:00', '2024-01-01T01:00']) });
}

test('Open-Meteo pide ERA5 y conserva las ocho variables y sus unidades', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    assert.equal(url.searchParams.get('models'), 'era5');
    assert.equal(url.searchParams.get('wind_speed_unit'), 'kmh');
    return respuestaMeteo(url);
  });
  const result = await consultarHistoricoOpenMeteo(consulta);
  assert.deepEqual(result.series.map(s => s.variable), variables);
  assert.ok(result.series.every(s => s.estadisticas.cantidad > 0 && s.procedencia.modelo === 'ERA5'));
  assert.equal(result.series.find(s => s.variable === 'velocidad-viento').unidad, 'km/h');
  assert.equal(result.series.find(s => s.variable === 'temperatura-suelo').puntos[0].fecha, '2024-01-01T00:00Z');
});

test('si NASA falla se conservan las ocho variables de Open-Meteo y el error real', async t => {
  t.mock.method(globalThis, 'fetch', async input => new URL(input).hostname.includes('nasa.gov')
    ? Response.json({ error: 'unavailable' }, { status: 503 }) : respuestaMeteo(new URL(input)));
  const result = await consultarHistoricoAmbiental(consulta);
  assert.equal(result.series.length, 8);
  assert.match(result.errores[0].mensaje, /503/);
});

test('los valores ausentes se conservan como null y nunca se inventan ceros', async t => {
  t.mock.method(globalThis, 'fetch', async input => {
    const data = await respuestaMeteo(new URL(input)).json();
    data.daily.precipitation_sum = [null, 0, 2];
    return Response.json(data);
  });
  const result = await consultarHistoricoOpenMeteo(consulta);
  assert.deepEqual(result.series.find(s => s.variable === 'precipitacion').puntos.map(p => p.valor), [null, 0, 2]);
});

test('sin sincronización no consulta ni envía al endpoint ambiental inexistente', async t => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  delete process.env.VITE_DATA_SOURCE;
  process.env.VITE_SYNC_ANALYSIS = 'false';
  process.env.VITE_API_URL = 'https://backend.example.test';
  assert.equal(obtenerFuenteDatos(), 'proveedores');
  t.mock.method(globalThis, 'fetch', async input => {
    const url = new URL(input);
    assert.notEqual(url.hostname, 'backend.example.test');
    return url.hostname.includes('nasa.gov') ? Response.json({}, { status: 503 }) : respuestaMeteo(url);
  });
  const result = await cargarAnalisisHistorico(consulta);
  assert.equal(result.analisis.series.length, 8);
  assert.ok(!result.avisos.some(a => /sincronizar|404|Backend sin configurar/.test(a)));
  assert.equal(await sincronizarAnalisisPendientes(), 0);
});

test('API real: las ocho variables tienen datos para Bogotá', { skip: process.env.LIVE_APIS !== 'true' }, async () => {
  const result = await consultarHistoricoAmbiental(consulta);
  assert.equal(result.errores.length, 0, JSON.stringify(result.errores));
  assert.equal(result.series.length, 12);
  assert.deepEqual(new Set(result.series.map(s => s.variable)), new Set(variables));
  assert.ok(result.series.every(s => s.estadisticas.cantidad > 0));
});
