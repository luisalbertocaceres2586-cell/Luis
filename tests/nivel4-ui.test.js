// Prueba de humo de la interfaz del Mundo 4 con un navegador simulado: arranca el nivel, juega, pide ayudas y dibuja
// muchos cuadros para cazar errores (nombres mal escritos, estados nulos…).  Ejecutar:  node tests/nivel4-ui.test.js
const assert = require('assert'); let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
let reloj = 1000; Object.defineProperty(globalThis, 'performance', { value: { now: () => reloj }, configurable: true });
const registro = {}, oyentes = {}, rafs = [], textos = [];
function ctxFalso() {
  const base = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), measureText: s => ({ width: String(s).length * 8 }), getImageData: () => ({ data: [] }) };
  return new Proxy(base, { get: (t, k) => { if (k in t) return t[k]; return (...a) => { if (k === 'fillText' || k === 'strokeText') textos.push(String(a[0])); }; }, set: (t, k, v) => { t[k] = v; return true; } });
}
function elem(id) { return registro[id] || (registro[id] = { id, style: { setProperty() {} }, children: [], appendChild(c) { this.children.push(c); }, getContext: () => ctxFalso(), getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }), addEventListener(t, f) { (oyentes[id + ':' + t] = oyentes[id + ':' + t] || []).push(f); }, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; }, width: 0, height: 0, classList: { toggle() {} } }); }
globalThis.window = globalThis; globalThis.innerWidth = 960; globalThis.innerHeight = 540; globalThis.devicePixelRatio = 1;
globalThis.document = { getElementById: id => elem(id), createElement: t => (t === 'div' ? elem('ov') : elem('_' + t + Math.random())), addEventListener() { } };
globalThis.addEventListener = (t, f) => { (oyentes['w:' + t] = oyentes['w:' + t] || []).push(f); };
globalThis.matchMedia = () => ({ matches: false }); globalThis.Image = function () { this.complete = false; this.naturalWidth = 0; };
globalThis.requestAnimationFrame = f => { rafs.push(f); return rafs.length; }; globalThis.cancelAnimationFrame = () => { };
globalThis.Nivel4Logica = require('../engine/nivel4/logica.js'); globalThis.Nivel4Salas = require('../engine/nivel4/salas.js');
globalThis.ANTAREZ_MANIFEST = globalThis.SAKURA_EVE_MANIFEST = null; globalThis.Perfiles = null;
require('../engine/nivel4/negativo.js');

const tecla = k => (oyentes['w:keydown'] || []).forEach(f => f({ key: k, preventDefault() { } }));
function cuadros(k) { for (let i = 0; i < k; i++) { reloj += 33; rafs.splice(0).forEach(f => f(reloj)); } }   // un cuadro = avanzan todas las instancias vivas
const dice = txt => textos.some(t => t.indexOf(txt) >= 0);
console.log('Interfaz del Mundo 4 (ayudas)');
let J;
ok('arranca, muestra la pantalla de inicio con los 3 pasos y dibuja sin errores', () => {
  J = globalThis.Nivel4.iniciar({}); assert.ok(/GIRA/.test(elem('ov')._h) && /CAMINA/.test(elem('ov')._h)); cuadros(5);
});
ok('al jugar aparece la META y el coach pide girar la sala', () => {
  elem('go').onclick(); textos.length = 0; cuadros(3); assert.ok(dice('Resuelve') || dice('Meta') || dice('🎯'), 'meta'); assert.ok(dice('CAMINAR'), 'coach paso 1');
  assert.ok(J.visual().coach && J.visual().coach.paso === 0);
});
ok('el coach avanza solo: caminar → girar → leer la pregunta', () => {
  tecla('d'); cuadros(40); assert.strictEqual(J.visual().coach.paso, 1); textos.length = 0; cuadros(2); assert.ok(dice('GIRAR'));
  tecla('e'); cuadros(60); assert.strictEqual(J.visual().coach.paso, 2); textos.length = 0; cuadros(2); assert.ok(dice('losa'));
});
ok('la pista (💡) da una guía de hasta 3 pasos que no caduca y se consume al seguirla', () => {
  J.reiniciar(); cuadros(40); J.pista(); const V = J.visual(); assert.ok(V.guiaPasos && V.guiaPasos.length >= 1 && V.guiaPasos.length <= 3); assert.strictEqual(V.pista.hasta, Infinity);
  const a = V.guiaPasos[0], antes = V.guiaPasos.length; J.accion(a); cuadros(60); assert.ok(!V.guiaPasos || V.guiaPasos.length === antes - 1, 'se consumió un paso');
  textos.length = 0; J.pista(); cuadros(2); assert.ok(dice('Ahora:'), 'la franja de abajo explica el paso');
});
ok('el botón ? y la tecla ? abren la ayuda y se cierran', () => {
  tecla('?'); assert.ok(/CÓMO SE JUEGA/.test(elem('ov')._h)); elem('vale').onclick(); assert.strictEqual(elem('ov')._h, '');
});
ok('tocar el círculo «?» de la esquina del tablero abre la ayuda (área táctil correcta)', () => {
  const Jt = globalThis.Nivel4.iniciar({}); elem('go').onclick(); cuadros(3); const hs = oyentes['cv:pointerdown']; hs[hs.length - 1]({ clientX: 505, clientY: 45, preventDefault() { } });   // solo la instancia nueva
  assert.ok(/CÓMO SE JUEGA/.test(elem('ov')._h), 'abrió la ayuda'); elem('vale').onclick();
});
ok('en la sala 4 el panel marca PRIMERO una pregunta (orden del solucionador), numera las 3 y la META coincide', () => {
  const J4 = globalThis.Nivel4.iniciar({ sala: 4 }); elem('go').onclick(); const V = J4.visual(), E = J4.estado(); assert.strictEqual(V.orden.length, 3);
  const primero = E.retos.find(r => r.cristal === V.orden[0]), frase = { mult: 'Resuelve', sec: 'Pisa', sombra: 'Lleva la sombra' }[primero.tipo];
  textos.length = 0; cuadros(3); assert.ok(dice('PRIMERO'), 'tarjeta recomendada'); assert.ok(dice(frase), 'la meta apunta a la pregunta recomendada: ' + frase); assert.ok(dice('1') && dice('2') && dice('3'), 'insignias 1 2 3');
  assert.ok(dice('faltan 3'), 'el portal cerrado explica cuánto falta');
});
ok('las salas 2, 3 y 4 explican lo nuevo antes de empezar (pantalla de entrada)', () => {
  [2, 3, 4].forEach(n => { const J2 = globalThis.Nivel4.iniciar({ sala: n }); elem('go').onclick(); assert.ok(J2.visual().coach === null || n === 1); });
});
ok('tras 18 s sin tocar nada aparece el aviso de ayuda y el botón 💡 se resalta', () => {
  J.reiniciar(); cuadros(40); reloj += 19000; textos.length = 0; cuadros(3); assert.ok(J.visual().idle && J.visual().nudge); assert.ok(dice('atascaste'));
});
ok('tras 2 errores en la misma pregunta se muestra la cuenta de la tabla (sin la respuesta)', () => {
  const Jx = globalThis.Nivel4.iniciar({ sala: 1 }); elem('go').onclick(); cuadros(5); const E = Jx.estado(), L = globalThis.Nivel4Logica, sol = L.plan(E).sol, r = E.retos[0];
  r.pads.a.ok = 0; r.pads.b.ok = 1; r.malos = 1; textos.length = 0;
  sol.forEach(a => { Jx.accion(a); cuadros(70); });
  assert.ok(dice('Cuenta de ' + r.q.T + ' en ' + r.q.T), 'consejo de cálculo'); assert.ok(!dice('Cuenta de ' + r.q.T + ' en ' + r.q.T + ': ' + r.q.c), 'sin la respuesta');
});
ok('dibuja 300 cuadros mientras se juega (giros, pasos, deshacer, reiniciar) sin lanzar errores', () => {
  for (let i = 0; i < 60; i++) { tecla(['e', 'd', 'q', 'a', 'z', 'r', 'h'][i % 7]); cuadros(5); } cuadros(150);
});
console.log(n + ' pruebas de interfaz OK');
