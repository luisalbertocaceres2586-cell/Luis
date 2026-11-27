// Pruebas de los retos de ingenio del Nivel 1 (engine/nivel1/puzzles.js): simulan al héroe sin navegador.  node tests/puzzles.test.js
const assert = require('assert');
const Gen = require('../engine/nivel1/gen-nivel.js');
const G = 560; let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
let S = null; const textos = [];
global.window = global; global.Image = function () {};
global.N1core = { W: 1280, H: 720, G, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), rect: (x, y, w, h) => ({ x, y, w, h }), cruza: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y, S: () => S, chispas() {}, texto: (x, y, t) => textos.push(t) };
require('../engine/nivel1/puzzles.js'); const P = global.N1puz;
const nuevo = sem => { const N = Gen.generar({ semilla: sem, tablas: [2] }, null); S = { N, t: 0, cam: 0, shur: [], tajo: null, shake: 0, aviso: null, items: [], h: { x: 100, y: G, w: 60, h: 100, dir: 1, suelo: true, pisando: null, empuja: false } }; return N; };
const paso = (k = 1) => { for (let i = 0; i < k; i++) { S.t += 1 / 60; P.paso(1 / 60, null); } };
const buscar = (N, f) => N.elem.filter(f);
// empuja la caja `c` hasta `x` caminando contra ella (como el héroe real)
function empujar(c, x) { const h = S.h; for (let i = 0; i < 4000 && Math.abs(c.x - x) > 3; i++) { const dir = x > c.x ? 1 : -1; h.y = G; h.x = c.x - dir * (c.w / 2 + h.w / 2 - 4); h.dir = dir; P.empujes(h, null); paso(); } }
const pisar = p => { S.h.pisando = { tipo: 'elem', ref: p }; S.h.suelo = true; S.h.x = p.x; S.h.y = p.y; };
const bajar = () => { S.h.pisando = null; };

console.log('Retos de ingenio (puzzles.js)');
ok('400 semillas: cada nivel trae placas, pilares, puente y portón, y valida', () => {
  for (let s = 1; s <= 400; s++) { const N = Gen.generar({ semilla: s, tablas: [2] }, null); assert.deepStrictEqual(Gen.validar(N), [], 'semilla ' + s); ['compuerta', 'barrera', 'porton'].forEach(t => assert(N.muros.some(m => m.tipo === t), 'falta ' + t + ' en ' + s)); assert.strictEqual(N.elem.filter(e => e.t === 'enlace' && e.accion === 'seg').length, 3); }
});
ok('sala de la compuerta: la caja ligera no activa la placa pesada; la pesada + el héroe en la repisa abren la compuerta', () => {
  const N = nuevo(7), liv = buscar(N, e => e.t === 'caja' && /^g\d+m$/.test(e.id))[0], pes = buscar(N, e => e.t === 'caja' && /^g\d+p$/.test(e.id))[0];
  const pb = buscar(N, e => e.t === 'placa' && e.req === 'pesada')[0], pa = buscar(N, e => e.t === 'placa' && /^g\d+a$/.test(e.id))[0], m = N.muros.find(q => q.tipo === 'compuerta');
  paso(2); empujar(liv, pb.x); paso(30); assert(!pb.on, 'la caja ligera no debe pulsarla'); assert(textos.includes('¡Muy ligera!'));
  empujar(liv, liv.x0 + 20); paso(10); assert(!liv.lift || liv.lift < 1); empujar(pes, pb.x); paso(30); assert(pb.on, 'la caja pesada sí'); assert(!m.abierta);
  pisar(pa); paso(30); assert(pa.on); paso(120); assert(m.abierta, 'compuerta abierta'); assert(S.N.gemas.rojo, 'da la gema roja');
  bajar(); paso(60); assert(m.abierta, 'queda abierta (se traba)');
});
ok('la placa de la repisa solo la pisa el héroe y la repisa se alcanza usando la otra caja de escalón', () => {
  const N = nuevo(8), pa = buscar(N, e => e.t === 'placa' && /^g\d+a$/.test(e.id))[0], cajas = buscar(N, e => e.t === 'caja' && /^g\d+m$/.test(e.id)), p = N.plat.find(q => q.tipo === 'losa' && Math.abs(q.x + 105 - pa.x) < 5);
  assert(p && p.y === G - 205, 'repisa'); const salto = 900 * 900 / (2 * 2300); assert(salto < 205 - 10, 'sin escalón no llega (' + salto.toFixed(0) + ' px)'); assert(salto + cajas[0].h > 205 + 30, 'con la caja de escalón sí llega');
});
ok('pilares: un orden equivocado reinicia; el orden del tablero apaga la barrera y da la gema azul', () => {
  const N = nuevo(11), tb = buscar(N, e => e.t === 'tablero')[0], pil = buscar(N, e => e.t === 'pilar'), m = N.muros.find(q => q.tipo === 'barrera');
  const tajo = p => { S.tajo = { x: p.x - 40, y: G - 150, w: 80, h: 150 }; paso(1); S.tajo = null; paso(40); };
  const malo = pil.find(p => p.color !== tb.seq[0]); tajo(malo); assert.strictEqual(tb.prog, 0); assert.strictEqual(tb.err, 1); assert(!pil.some(p => p.on));
  tb.seq.forEach(c => tajo(pil.find(p => p.color === c))); assert(tb.hecho, 'secuencia completa'); paso(120); assert(m.abierta, 'barrera abierta'); assert(N.gemas.azul);
  assert.strictEqual(new Set(tb.seq).size, 4, 'los 4 colores'); assert.strictEqual(new Set(pil.map(p => p.color)).size, 4);
});
ok('puente: cada tramo se mantiene mientras haya caja en su placa y la caja que cae al vacío reaparece', () => {
  const N = nuevo(13), A = buscar(N, e => /A$/.test(e.id) && e.t === 'caja')[0], B = buscar(N, e => /B$/.test(e.id) && e.t === 'caja')[0];
  const pa = buscar(N, e => /pa$/.test(e.id))[0], pb = buscar(N, e => /pb$/.test(e.id))[0], pc = buscar(N, e => /pc$/.test(e.id))[0];
  const e1 = N.elem.find(e => e.t === 'enlace' && /1$/.test(e.id) && e.accion === 'seg'), e2 = N.elem.find(e => e.t === 'enlace' && /2$/.test(e.id) && e.accion === 'seg'), e3 = N.elem.find(e => e.t === 'enlace' && /3$/.test(e.id) && e.accion === 'seg');
  const p1 = N.plat.find(p => p.id === e1.id), p2 = N.plat.find(p => p.id === e2.id), p3 = N.plat.find(p => p.id === e3.id); paso(5);
  empujar(A, pa.x); paso(90); assert(pa.on); assert(p1.w >= e1.len - 1, 'tramo 1 extendido');
  empujar(B, pb.x); paso(120); assert(pb.on, 'caja B en su placa (cruzó el tramo 1)'); assert(p2.w >= e2.len - 1);
  pisar(pc); paso(120); assert(p3.w >= e3.len - 1); assert(N.gemas.dorado); bajar(); paso(90); assert(p3.w >= e3.len - 1, 'el último tramo queda');
  empujar(A, A.x0); paso(90); assert(p1.w < 1, 'sin caja el tramo 1 se retrae');
  // caída al vacío: B sin tramo bajo sus pies
  paso(5); B.x = e1.x0 + 100; paso(30); assert(B.estado === 'cae', 'cae'); paso(240); assert(B.estado === 'ok' && B.x === B.x0, 'reaparece en su sitio');
});
ok('portón: se abre solo con las tres gemas', () => {
  const N = nuevo(17), m = N.muros.find(q => q.tipo === 'porton'); N.gemas = {}; paso(5); N.gemas.rojo = true; N.gemas.azul = true; paso(120); assert(!m.abierta); N.gemas.dorado = true; paso(120); assert(m.abierta);
});
console.log('\n' + n + ' pruebas OK');
