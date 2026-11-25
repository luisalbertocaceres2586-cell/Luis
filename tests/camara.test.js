// Pruebas de la cámara dinámica del Nivel 1. Ejecutar:  node tests/camara.test.js
const assert = require('assert');
// reloj falso: cada llamada a antes() avanza 1/60 s, como un fotograma real
let reloj = 0; Object.defineProperty(globalThis, 'performance', { value: { now: () => (reloj += 1000 / 60) }, configurable: true });
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

// canvas falso: registra las llamadas y acepta cualquier método
function fakeCtx() {
  const calls = []; const base = { createRadialGradient: () => ({ addColorStop() {} }) };
  return new Proxy(base, { get: (t, k) => (k === 'calls' ? calls : (k in t ? t[k] : (...a) => { calls.push(String(k)); })), set: () => true });
}
function mundo() {
  const S = {
    h: { x: 600, y: 560, vx: 0, vy: 0, dir: 1, suelo: true, atk: 0, kunaiT: 0, vida: 3, muerto: 0 },
    cam: 200, shake: 0, pergaminos: 0, enemigos: [], shur: [], hab: { dash: { t: 0 } }, apunta: null, mezcla: 0, t: 0, pausa: false
  };
  global.window = undefined; // el módulo usa globalThis cuando no hay window
  globalThis.N1core = { S: () => S, jefeActivo: false };
  return S;
}
const cam = () => { delete require.cache[require.resolve('../engine/nivel1/camara.js')]; return require('../engine/nivel1/camara.js'); };

console.log('Cámara N1cam');
ok('sin partida activa no hace nada ni falla', () => {
  globalThis.N1core = { S: () => null }; const C = cam(), cx = fakeCtx();
  C.antes(cx); C.luces(cx); C.encima(cx); assert.strictEqual(C.escala(), 1); assert.strictEqual(cx.calls.length, 0);
});
ok('aplica transformación de zoom ≥ zoom base', () => {
  mundo(); const C = cam(), cx = fakeCtx(); C.antes(cx);
  assert(cx.calls.includes('scale') && cx.calls.includes('translate'));
  assert(C._estado().z >= 1.04);
});
ok('el dash dispara zoom, luz y líneas de velocidad', () => {
  const S = mundo(), C = cam(), cx = fakeCtx(); C.antes(cx); const z0 = C._estado().zPunch;
  S.hab.dash.t = .16; C.antes(fakeCtx());
  assert(C._estado().zPunch > z0 + .03, 'zoom punch'); assert(C._estado().luces.length >= 1, 'luz'); assert(C._estado().dashV > .5);
  const c2 = fakeCtx(); C.encima(c2); assert(c2.calls.includes('stroke'), 'líneas de velocidad');
});
ok('recibir daño activa hit-stop (el tiempo se ralentiza) y se recupera', () => {
  const S = mundo(), C = cam(); C.antes(fakeCtx()); S.shake = .25; C.antes(fakeCtx());
  assert(C.escala() < .2, 'hit-stop'); C._estado().stop = 0; assert.strictEqual(C.escala(), 1);
});
ok('derrotar a un enemigo crea estallido de luz y hit-stop', () => {
  const S = mundo(), C = cam(), e = { x: 900, y: 560, vivo: true }; S.enemigos.push(e); C.antes(fakeCtx());
  e.vivo = false; C.antes(fakeCtx()); assert(C._estado().luces.length >= 2); assert(C.escala() < .2);
});
ok('apuntar acerca la cámara al blanco', () => {
  const S = mundo(), C = cam(); S.apunta = { sel: 0, lst: [{ x: 1000, y: 400 }] };
  for (let i = 0; i < 30; i++) C.antes(fakeCtx());
  const E = C._estado(); assert(E.aim > .5 && E.z > 1.08 && E.aimX > 700);
  const cx = fakeCtx(); C.encima(cx); assert(cx.calls.includes('fillRect'), 'foco oscuro');
});
ok('el zoom nunca pasa de los límites y el giro es mínimo', () => {
  const S = mundo(), C = cam(); S.h.vx = 5000;
  for (let i = 0; i < 40; i++) { C.golpe(.1, .05, 0); C.antes(fakeCtx()); }
  const E = C._estado(); assert(E.zPunch <= .16 + 1e-9); assert(Math.abs(E.rollPunch) <= .03 + 1e-9);
});
ok('_apagar desactiva todos los ganchos', () => {
  mundo(); const C = cam(); C._apagar(); const cx = fakeCtx(); C.antes(cx); C.luces(cx); C.encima(cx); assert.strictEqual(cx.calls.length, 0);
});
console.log(n + ' pruebas OK');
