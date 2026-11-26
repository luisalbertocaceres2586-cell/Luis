// Calidad automática (engine/core/calidad.js): el cerebro puro, con cuadros simulados.
const assert = require('assert');
const { core } = require('../engine/core/calidad.js');

// avanza "seg" segundos con cuadros de dtFn(i) ms; devuelve los cambios con su instante (s)
function correr(c, seg, dtFn, t0) {
  let t = t0 || 0, i = 0; const cambios = [];
  const fin = t + seg * 1000;
  while (t < fin) { const dt = dtFn(i++); t += dt; const r = c.muestra(dt, t); if (r) cambios.push({ ...r, s: +(t / 1000).toFixed(1) }); }
  return { cambios, t };
}

// 1) 60 FPS estables: nunca baja
{ const c = core.crear(); const r = correr(c, 60, () => 16.7); assert.strictEqual(r.cambios.length, 0); assert.strictEqual(c.nivel(), 'alta'); }

// 2) 30 FPS: baja a media y luego a baja, en pocos segundos
{ const c = core.crear(); const r = correr(c, 15, () => 33.3);
  assert.deepStrictEqual(r.cambios.map(x => x.a), ['media', 'baja'], 'debe bajar dos escalones');
  assert(r.cambios[0].s <= 5, 'el primer escalón baja en ≤ 5 s (fue ' + r.cambios[0].s + ')');
  assert(r.cambios[1].s - r.cambios[0].s >= 3.5, 'espera ≥ 3,5 s entre escalones para ver el efecto');
  assert.strictEqual(c.nivel(), 'baja'); }

// 3) tirones sueltos (un cuadro de 120 ms por segundo) NO bajan la calidad
{ const c = core.crear(); const r = correr(c, 60, i => (i % 60 === 0 ? 120 : 16.7)); assert.strictEqual(r.cambios.length, 0, 'un tirón aislado no cuenta'); }

// 4) recuperación lenta: tras 25 s buenos sube un escalón (no antes)
{ const c = core.crear({ inicial: 'baja' }); const r = correr(c, 60, () => 16.7);
  assert.deepStrictEqual(r.cambios.map(x => x.a), ['media', 'alta']);
  assert(r.cambios[0].s >= 25 && r.cambios[0].s < 30, 'sube a los ~25 s (fue ' + r.cambios[0].s + ')'); }

// 5) anti-parpadeo: si sube y vuelve a bajar en < 60 s, la siguiente subida espera el doble
{ const c = core.crear({ inicial: 'media' });
  let r = correr(c, 30, () => 16.7); assert.strictEqual(r.cambios[0].a, 'alta');
  r = correr(c, 4, () => 33.3, r.t); assert.deepStrictEqual(r.cambios.map(x => x.a), ['media'], 'vuelve a bajar (un solo escalón)');
  const t1 = r.t; r = correr(c, 40, () => 16.7, t1);
  assert.strictEqual(r.cambios.length, 0, 'tras el vaivén NO sube en 40 s (espera ≥ 50 s)');
  r = correr(c, 30, () => 16.7, r.t); assert.strictEqual(r.cambios[0] && r.cambios[0].a, 'alta', 'pero sí sube después'); }

// 6) frecuencia de pantalla
{ const hz = (f) => { const c = core.crear(); correr(c, 3, f); return c.hz(); };
  assert.strictEqual(hz(() => 8.33), 120); assert.strictEqual(hz(() => 11.1), 90);
  assert.strictEqual(hz(() => 16.7), 60);
  assert.strictEqual(hz(i => 14.6 + (i % 4) * 1.6), 60, 'jitter típico de 60 Hz no se confunde con 75 Hz');
  assert.strictEqual(hz(i => (i % 5 === 0 ? 30 : 8.33)), 120, 'un 120 Hz con cuadros lentos sueltos sigue siendo 120'); }

// 7) pausa / pestaña oculta (dt enorme) no cuenta; "fijo" no cambia nunca
{ const c = core.crear(); let t = 0; for (let i = 0; i < 400; i++) { t += 5000; assert.strictEqual(c.muestra(5000, t), null); } assert.strictEqual(c.nivel(), 'alta'); }
{ const c = core.crear(); c.forzar('media'); const r = correr(c, 40, () => 50); assert.strictEqual(r.cambios.length, 0); assert.strictEqual(c.nivel(), 'media');
  c.forzar('auto'); assert.strictEqual(correr(c, 15, () => 50, r.t).cambios.length > 0, true, 'en auto vuelve a reaccionar'); }

// 8) tablas de efectos coherentes
assert(core.FX.alta === 1 && core.FX.media < 1 && core.FX.baja < core.FX.media);
assert(core.SOMBRA.alta === 1 && core.SOMBRA.baja === 0);
console.log('calidad OK');
