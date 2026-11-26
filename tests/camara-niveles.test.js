// Pruebas de la cámara de los Niveles 2 y 3.  Ejecutar:  node tests/camara-niveles.test.js
const assert = require('assert');
let reloj = 0; Object.defineProperty(globalThis, 'performance', { value: { now: () => (reloj += 1000 / 60) }, configurable: true });
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
function fakeCtx() { const calls = []; const base = { createRadialGradient: () => ({ addColorStop() {} }) }; return new Proxy(base, { get: (t, k) => (k === 'calls' ? calls : (k in t ? t[k] : (...a) => { calls.push(String(k)); })), set: () => true }); }
const cargar = () => { delete require.cache[require.resolve('../engine/core/camara-niveles.js')]; return require('../engine/core/camara-niveles.js'); };
const frames = (fn, k) => { for (let i = 0; i < k; i++) fn(); };

const s2 = () => ({ est: 'play', pausa: false, aci: 0, err: 0, vidas: 3, racha: 0, lane: 1, ly: 1, z: 0, boost: 0, escudo: false, jefe: null, caido: 0, vuelo: false, t: 0 });
const s3 = () => ({ corriendo: true, pausa: false, fin: false, aciertos: 0, errores: 0, vidas: 3, racha: 0, mult: 1, dash: 0, escudo: 0, iman: 0, jh: 0, base: 0, px: 1, jefeFlash: 0, jefeVis: false, slide: 0, vuelo: 0, plaza: false, cae: 0, celeb: null, t: 0 });
console.log('Cámara Niveles 2 y 3');

ok('Nivel 2: sin partida no hace nada ni falla', () => {
  globalThis.Nivel2 = { _estado: () => null }; const { n2 } = cargar(), cx = fakeCtx(); n2.antes(cx); n2.encima(cx); assert.strictEqual(cx.calls.length, 0); assert.strictEqual(n2.escala(), 1);
});
ok('Nivel 2: transforma con zoom ≥ base y encima dibuja', () => {
  const S = s2(); globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar(), cx = fakeCtx(); n2.antes(cx);
  assert(cx.calls.includes('scale') && n2._estado().Z >= 1.04); const c2 = fakeCtx(); n2.encima(c2); assert(c2.calls.includes('fillRect'));
});
ok('Nivel 2: acierto da zoom y luz dorada; racha ≥3 añade otra luz', () => {
  const S = s2(); globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar(); n2.antes(fakeCtx());
  S.aci = 1; S.racha = 3; n2.antes(fakeCtx()); const E = n2._estado(); assert(E.zp > .05 && E.luces.length >= 2);
});
ok('Nivel 2: perder una vida = hit-stop + bordes rojos; luego se recupera', () => {
  const S = s2(); globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar(); n2.antes(fakeCtx());
  S.vidas = 2; n2.antes(fakeCtx()); assert(n2.escala() < .2 && n2._estado().hurt > .9); n2._estado().stop = 0; assert.strictEqual(n2.escala(), 1);
});
ok('Nivel 2: cambio de carril inclina la cámara con tope', () => {
  const S = s2(); globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar(); n2.antes(fakeCtx());
  S.lane = 2; n2.antes(fakeCtx()); assert(n2._estado().rp > 0); for (let i = 0; i < 30; i++) { S.lane = i % 3; n2.antes(fakeCtx()); } assert(Math.abs(n2._estado().rp) <= .03 + 1e-9);
});
ok('Nivel 2: jefe → barras de cine; boost → líneas de velocidad', () => {
  const S = s2(); S.jefe = { golpe: 0, hp: 3 }; S.boost = 1; globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar();
  frames(() => n2.antes(fakeCtx()), 40); const E = n2._estado(); assert(E.bars > .8 && E.speed > .5);
  const cx = fakeCtx(); n2.encima(cx); assert(cx.calls.includes('stroke') && cx.calls.filter(c => c === 'fillRect').length >= 3);
});
ok('Nivel 2: ganar acerca la cámara (final); pausa congela la lectura', () => {
  const S = s2(); S.est = 'gano'; globalThis.Nivel2 = { _estado: () => S }; const { n2 } = cargar(); frames(() => n2.antes(fakeCtx()), 120);
  assert(n2._estado().fin > .8); const S2 = s2(); S2.pausa = true; S2.aci = 0; globalThis.Nivel2 = { _estado: () => S2 }; const m = cargar().n2; m.antes(fakeCtx()); S2.aci = 5; m.antes(fakeCtx()); assert(m._estado().zp === 0);
});
ok('Nivel 3: recibe el estado por parámetro; acierto y daño reaccionan', () => {
  const S = s3(), { n3 } = cargar(); n3.antes(fakeCtx(), S); S.aciertos = 1; S.racha = 2; n3.antes(fakeCtx(), S); assert(n3._estado().zp > .04);
  S.vidas = 2; n3.antes(fakeCtx(), S); assert(n3.escala() < .2 && n3._estado().luces.length >= 2);
});
ok('Nivel 3: dash → velocidad máxima y líneas; jefe → barras; final → acerca', () => {
  const S = s3(), { n3 } = cargar(); n3.antes(fakeCtx(), S); S.dash = 3; S.jefeVis = true; frames(() => n3.antes(fakeCtx(), S), 40);
  assert(n3._estado().speed > .6 && n3._estado().bars > .8); const cx = fakeCtx(); n3.encima(cx, S); assert(cx.calls.includes('stroke'));
  S.fin = true; S.celeb = 1; frames(() => n3.antes(fakeCtx(), S), 120); assert(n3._estado().fin > .8);
});
ok('Nivel 3: salto y aterrizaje generan golpes pequeños', () => {
  const S = s3(), { n3 } = cargar(); n3.antes(fakeCtx(), S); S.jh = 60; n3.antes(fakeCtx(), S); const z1 = n3._estado().zp; assert(z1 > 0);
  S.jh = 0; n3.antes(fakeCtx(), S); assert(n3._estado().zp > z1 * .9);
});
ok('Nivel 3: tope de zoom/giro y apagado seguro', () => {
  const S = s3(), { n3 } = cargar(); for (let i = 0; i < 50; i++) { n3.golpe(.2, .1, 0); n3.antes(fakeCtx(), S); } assert(n3._estado().Z <= 1.22 + 1e-9 && Math.abs(n3._estado().rp) <= .03 + 1e-9);
  n3._apagar(); const cx = fakeCtx(); n3.antes(cx, S); n3.encima(cx, S); assert.strictEqual(cx.calls.length, 0);
});
ok('un error dentro del adaptador apaga la cámara sin romper el juego', () => {
  const { motor } = cargar(); const m = motor({ W: 100, H: 100, estado: () => ({}), pausado: () => false, leer() { throw new Error('boom'); } }); const w = console.warn; console.warn = () => { };
  m.antes(fakeCtx()); console.warn = w; assert.strictEqual(m._estado().off, true); const cx = fakeCtx(); m.antes(cx); assert.strictEqual(cx.calls.length, 0);
});
console.log(n + ' pruebas OK');
