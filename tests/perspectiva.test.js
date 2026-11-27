// Pruebas de la perspectiva pseudo-3D del Nivel 1. Ejecutar:  node tests/perspectiva.test.js
const assert = require('assert');
let reloj = 0; Object.defineProperty(globalThis, 'performance', { value: { now: () => (reloj += 1000 / 60) }, configurable: true });
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

function fakeCtx(canvas) {
  const calls = []; const base = { canvas, createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
  return new Proxy(base, { get: (t, k) => (k === 'calls' ? calls : (k in t ? t[k] : (...a) => { calls.push(String(k)); })), set: () => true });
}
function fakeCanvas(w, h) { const c = { width: w, height: h }; const x = fakeCtx(c); c.getContext = () => x; return c; }
globalThis.document = { createElement: () => fakeCanvas(10, 10) };
function mundo(extra) {
  const S = Object.assign({
    h: { x: 600, y: 560, vx: 0, vy: 0, dir: 1, suelo: true, pisando: false }, cam: 200, enemigos: [], hab: { dash: { t: 0 } }, apunta: null, pausa: false, fin: false
  }, extra || {});
  globalThis.N1core = { S: () => S, G: 560 };
  return S;
}
const mod = () => { delete require.cache[require.resolve('../engine/nivel1/perspectiva.js')]; return require('../engine/nivel1/perspectiva.js'); };
const frame = (P, S, n) => { const c = fakeCanvas(1280, 720), cx = c.getContext('2d'); for (let i = 0; i < (n || 1); i++) { P.suelo(cx); P.encima(cx); } return cx; };

console.log('Perspectiva N1persp');
ok('sin partida activa no hace nada ni falla', () => {
  globalThis.N1core = { S: () => null }; const P = mod(), cx = fakeCanvas(1280, 720).getContext('2d');
  P.suelo(cx); P.encima(cx); assert.strictEqual(cx.calls.length, 0);
});
ok('quieto: no dibuja el giro (coste cero)', () => {
  const S = mundo(); const P = mod(); const cx = frame(P, S, 30);
  assert(!cx.calls.includes('drawImage'));
});
ok('corriendo a la derecha: el giro es positivo y se dibuja por franjas', () => {
  const S = mundo({ h: { x: 600, y: 560, vx: 380, vy: 0, dir: 1, suelo: true } }); const P = mod(); const cx = frame(P, S, 60);
  assert(P._estado().yaw > 0.0025); assert(cx.calls.filter(c => c === 'drawImage').length >= 64);
});
ok('corriendo a la izquierda: el giro es negativo', () => {
  const S = mundo({ h: { x: 600, y: 560, vx: -380, vy: 0, dir: -1, suelo: true } }); const P = mod(); frame(P, S, 60);
  assert(P._estado().yaw < -0.0025);
});
ok('inv() deshace el giro y es identidad sin giro', () => {
  const S = mundo(); const P = mod(); frame(P, S, 2);
  const a = P.inv(300, 400); assert.strictEqual(a.x, 300); assert.strictEqual(a.y, 400);
  S.h.vx = 500; frame(P, S, 80); const b = P.inv(100, 100); assert(b.y > 100, 'el lado cercano está ampliado, el punto original queda más abajo');
});
ok('el dash crea una onda en el suelo y desenfoque radial', () => {
  const S = mundo(); const P = mod(); frame(P, S, 2); S.hab.dash.t = .2; const cx = frame(P, S, 1);
  assert.strictEqual(P._estado().ondas.length, 1); assert(P._estado().dashV > .9); assert(cx.calls.includes('ellipse') || cx.calls.includes('arc'));
});
ok('aterrizaje fuerte y enemigo derrotado generan ondas', () => {
  const en = { x: 900, y: 560, vivo: true, kind: 'ninja' }; const S = mundo({ enemigos: [en] }); const P = mod(); frame(P, S, 2);
  S.h.suelo = false; S.h.vy = 800; frame(P, S, 1); S.h.suelo = true; frame(P, S, 1); assert.strictEqual(P._estado().ondas.length, 1);
  en.vivo = false; S.enemigos = []; frame(P, S, 1); assert.strictEqual(P._estado().ondas.length, 2);
});
ok('las ondas caducan solas', () => {
  const S = mundo(); const P = mod(); frame(P, S, 1); P.onda(600, 560, [255, 255, 255], 1); frame(P, S, 60); assert.strictEqual(P._estado().ondas.length, 0);
});
ok('al apuntar se aplica el enfoque (máscara con gradiente)', () => {
  const S = mundo({ apunta: { lst: [{ x: 800, y: 500 }], sel: 0 } }); const P = mod(); const cx = frame(P, S, 40);
  assert(P._estado().aim > .5);
});
ok('en móvil solo quedan las ondas del suelo', () => {
  const S = mundo({ movil: true, h: { x: 600, y: 560, vx: 380, vy: 0, dir: 1, suelo: true } }); const P = mod(); const cx = frame(P, S, 60);
  assert(!cx.calls.includes('drawImage'));
});
ok('_apagar() detiene todo', () => {
  const S = mundo({ h: { x: 600, y: 560, vx: 380, vy: 0, dir: 1, suelo: true } }); const P = mod(); P._apagar(); const cx = frame(P, S, 30);
  assert.strictEqual(cx.calls.length, 0); assert.deepStrictEqual(P.inv(5, 6), { x: 5, y: 6 });
});
console.log('\n' + n + ' pruebas OK');
