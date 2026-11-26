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
ok('al empezar el nivel hay dolly-in: zoom alto que se asienta', () => {
  mundo(); const C = cam(); C.antes(fakeCtx()); const z0 = C._estado().z, i0 = C._estado().intro;
  for (let i = 0; i < 150; i++) C.antes(fakeCtx());
  const E = C._estado(); assert(i0 > .9 && E.intro === 0 && E.z < 1.07, 'intro termina y el zoom se asienta');
});
ok('el golpe recibido empuja la cámara pero con tope seguro (±8 px)', () => {
  const S = mundo(), C = cam(); C.antes(fakeCtx());
  for (let i = 0; i < 5; i++) { S.shake = 0; C.antes(fakeCtx()); S.shake = .3; C.antes(fakeCtx()); }
  assert(Math.abs(C._estado().kx) <= 8 + 1e-9 && C._estado().kx !== 0);
});
ok('la cámara acompaña al kunai en vuelo y lo suelta al desaparecer', () => {
  const S = mundo(), C = cam(); C.antes(fakeCtx());
  S.h.kunaiT = .2; const k = { x: 900, y: 500, kunai: true }; S.shur.push(k); C.antes(fakeCtx());
  for (let i = 0; i < 20; i++) C.antes(fakeCtx());
  assert(C._estado().pf > .5, 'sigue'); S.shur.length = 0;
  for (let i = 0; i < 40; i++) C.antes(fakeCtx());
  assert(C._estado().pf < .1 && C._estado().seguir === null, 'suelta');
});
ok('los destellos anamórficos se dibujan y no fallan en modo lite', () => {
  const S = mundo(), C = cam(); C.antes(fakeCtx()); S.hab.dash.t = .16; C.antes(fakeCtx());
  const cx = fakeCtx(); C.luces(cx); assert(cx.calls.filter(c => c === 'scale').length >= 1);
  C._estado().lite = true; const c2 = fakeCtx(); C.luces(c2); assert(c2.calls.filter(c => c === 'scale').length === 0);
});
ok('al apuntar aparecen barras de cine y tono frío', () => {
  const S = mundo(), C = cam(); S.apunta = { sel: 0, lst: [{ x: 900, y: 400 }] };
  for (let i = 0; i < 30; i++) C.antes(fakeCtx());
  const cx = fakeCtx(); C.encima(cx); assert(cx.calls.filter(c => c === 'fillRect').length >= 4);
});
ok('_apagar desactiva todos los ganchos', () => {
  mundo(); const C = cam(); C._apagar(); const cx = fakeCtx(); C.antes(cx); C.luces(cx); C.encima(cx); assert.strictEqual(cx.calls.length, 0);
});

// ---------- cámara vertical, adelanto, zoom de velocidad y conversión de puntero ----------
const sano = () => { globalThis.N1prof = { _estado: () => ({ dead: false }) }; };   // la cámara vertical solo funciona si profundidad.js está sano
const frames = (C, n) => { for (let i = 0; i < n; i++) C.antes(fakeCtx()); };
ok('cámara vertical: en el suelo no se desplaza; al saltar alto sube; en un foso baja; siempre dentro de los límites', () => {
  sano(); const S = mundo(), C = cam(); frames(C, 60); assert(Math.abs(C.camY()) < 1, 'en el suelo ≈ 0');
  S.h.y = 560 - 300; frames(C, 120); assert(C.camY() > 80 && C.camY() <= 120 + 1e-6, 'alto → sube: ' + C.camY());
  S.h.y = 560 + 90; frames(C, 120); assert(C.camY() < -20 && C.camY() >= -45 - 1e-6, 'foso → baja: ' + C.camY());
  S.h.y = 560 - 5000; frames(C, 200); assert(C.camY() <= 120 + 1e-6, 'tope superior');
});
ok('cámara vertical: se mueve con suavidad (sin saltos bruscos entre cuadros)', () => {
  sano(); const S = mundo(), C = cam(); frames(C, 30); S.h.y = 560 - 300; let ant = C.camY(), maxPaso = 0;
  for (let i = 0; i < 90; i++) { C.antes(fakeCtx()); maxPaso = Math.max(maxPaso, Math.abs(C.camY() - ant)); ant = C.camY(); }
  assert(maxPaso < 8, 'paso máximo por cuadro ' + maxPaso.toFixed(2));
});
ok('cámara vertical: se apaga sola si profundidad.js falta o está caído (sus capas no tendrían margen)', () => {
  const S = mundo(); delete globalThis.N1prof; let C = cam(); S.h.y = 560 - 300; frames(C, 120); assert.strictEqual(C.camY(), 0, 'sin N1prof');
  globalThis.N1prof = { _estado: () => ({ dead: true }) }; C = cam(); frames(C, 120); assert.strictEqual(C.camY(), 0, 'N1prof caído');
  sano(); C = cam(); frames(C, 120); assert(C.camY() > 50, 'con N1prof sano sí sube');
  C._apagar(); assert.strictEqual(C.camY(), 0, 'cámara apagada → 0');
});
ok('adelanto: mira hacia donde corres, con giros suaves y límites', () => {
  const S = mundo(), C = cam(); S.h.vx = 340; S.h.dir = 1; let a = 0; for (let i = 0; i < 90; i++) a = C.adelanto(S.h, 1 / 60);
  assert(a > 100 && a <= 135, 'corriendo a la derecha: ' + a);
  S.h.vx = -340; S.h.dir = -1; let prev = a, maxPaso = 0; for (let i = 0; i < 90; i++) { a = C.adelanto(S.h, 1 / 60); maxPaso = Math.max(maxPaso, Math.abs(a - prev)); prev = a; }
  assert(a < -100 && a >= -135, 'corriendo a la izquierda: ' + a); assert(maxPaso < 16, 'giro suave (un giro completo son 262 px repartidos en ~1 s), paso máx ' + maxPaso.toFixed(2));
  S.h.vx = 0; S.h.dir = 1; for (let i = 0; i < 200; i++) a = C.adelanto(S.h, 1 / 60); assert(Math.abs(a - 40) < 1, 'parado → 40 px hacia donde mira: ' + a);
  S.h.vx = 5000; for (let i = 0; i < 200; i++) a = C.adelanto(S.h, 1 / 60); assert(a <= 135 + 1e-9, 'tope aunque vaya a velocidad absurda');
  C._apagar(); assert.strictEqual(C.adelanto({ vx: 300, dir: -1 }, 1 / 60), -70, 'apagada → adelanto fijo de siempre');
});
ok('zoom de velocidad: se abre al correr, se cierra al parar y en el dash; nunca baja del mínimo', () => {
  sano(); const S = mundo(), C = cam(); frames(C, 120); const reposo = C._estado().z;
  S.h.vx = 340; frames(C, 120); const corriendo = C._estado().z; assert(corriendo < reposo - .015, 'correr abre el plano: ' + reposo.toFixed(3) + ' → ' + corriendo.toFixed(3));
  S.h.vx = 0; frames(C, 120); assert(Math.abs(C._estado().z - reposo) < .004, 'al parar vuelve al reposo');
  S.h.vx = 340; S.hab.dash.t = .2; frames(C, 20); assert(C._estado().z > corriendo, 'el dash acerca');
  S.hab.dash.t = 0; S.h.vx = 340; S.h.vy = 900; frames(C, 200); assert(C._estado().z >= 1.045 - 1e-9, 'mínimo ' + C._estado().z);
});
ok('mundo(): invierte exactamente la transformación de la cámara (zoom, inclinación y desplazamiento vertical)', () => {
  sano(); const S = mundo(), C = cam(); S.h.y = 560 - 250; S.h.vx = 300; frames(C, 90); C.golpe(.05, .01, 0); C.antes(fakeCtx());
  const T = C._estado().tf; assert(T && T.Z >= 1.04);
  const adelante = (wx, wy) => { let x = wx - T.fx + (T.dx || 0), y = wy - T.fy + T.dy; x *= T.Z; y *= T.Z; const c = Math.cos(T.R), s = Math.sin(T.R); return { x: T.fx + x * c - y * s, y: T.fy + x * s + y * c }; };
  [[100, 100], [640, 360], [1200, 700], [20, 560]].forEach(([wx, wy]) => { const p = adelante(wx, wy), w = C.mundo(p.x, p.y); assert(Math.abs(w.x - wx) < 1e-6 && Math.abs(w.y - wy) < 1e-6, 'ida y vuelta ' + wx + ',' + wy); });
  C._apagar(); const id = C.mundo(300, 200); assert.strictEqual(id.x, 300); assert.strictEqual(id.y, 200);
});
console.log(n + ' pruebas OK');
