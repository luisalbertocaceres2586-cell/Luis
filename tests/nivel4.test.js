// Pruebas del Mundo 4 (El Mundo Negativo): lógica de gravedad rotatoria, retos y que TODAS las salas tengan solución.
const assert = require('assert');
const L = require('../engine/nivel4/logica.js'), S = require('../engine/nivel4/salas.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const sala = (mapa, retos) => ({ mapa, retos: retos || [] });
const vacia = ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#########'];
const con = (cambios) => { const m = vacia.map(f => f.split('')); cambios.forEach(([x, y, c]) => { m[y][x] = c; }); return m.map(f => f.join('')); };

console.log('Gravedad rotatoria');
ok('el héroe cae al suelo y camina', () => {
  const E = L.crear(sala(con([[3, 2, 'H']]))); L.aplicar(E, 'R'); assert.strictEqual(E.hero.y, 7); assert.strictEqual(E.hero.x, 4);
});
ok('girar la sala cambia la gravedad: CW → cae hacia la derecha del mundo', () => {
  const E = L.crear(sala(con([[3, 7, 'H']]))); L.aplicar(E, 'CW'); assert.strictEqual(E.r, 1); assert.deepStrictEqual([E.hero.x, E.hero.y], [7, 7]);
});
ok('con la sala girada, "derecha" de la pantalla es "arriba" del mundo', () => {
  const E = L.crear(sala(con([[3, 7, 'H']]))); L.aplicar(E, 'CW'); L.aplicar(E, 'R'); assert.deepStrictEqual([E.hero.x, E.hero.y], [7, 6]);
});
ok('4 giros vuelven a la gravedad original', () => {
  const E = L.crear(sala(con([[3, 7, 'H']]))); for (let i = 0; i < 4; i++) L.aplicar(E, 'CW'); assert.strictEqual(E.r, 0); assert.deepStrictEqual([E.hero.x, E.hero.y], [1, 7], 'dio la vuelta por las 4 paredes');
});
ok('no se puede caminar contra una pared (acción inválida)', () => {
  const E = L.crear(sala(con([[1, 7, 'H']]))); assert.strictEqual(L.aplicar(E, 'L').valida, false);
});

console.log('Fantasmas y cristales');
const mult = { tipo: 'mult', cristal: 1, pads: { a: { ok: 1, n: 10 }, b: { n: 11 } } };
ok('la casilla fantasma se atraviesa y se vuelve sólida al restaurar su cristal', () => {
  const E = L.crear(sala(con([[3, 2, 'H'], [3, 5, '1'], [6, 7, 'a'], [5, 7, 'b']]), [JSON.parse(JSON.stringify(mult))]));
  L.aplicar(E, 'R'); assert.strictEqual(E.hero.y, 7, 'atraviesa el fantasma y llega al suelo');
});
ok('losa incorrecta suma error y no restaura; la correcta restaura el cristal', () => {
  const E = L.crear(sala(con([[2, 7, 'H'], [3, 7, 'b'], [5, 7, 'a']]), [JSON.parse(JSON.stringify(mult))]));
  let r = L.aplicar(E, 'R'); assert.strictEqual(E.errores, 1); assert.strictEqual(E.rest, 0); assert.ok(r.ev.some(e => e.t === 'error'));
  L.aplicar(E, 'R'); r = L.aplicar(E, 'R'); assert.strictEqual(E.rest, 1); assert.ok(r.ev.some(e => e.t === 'cristal'));
});
ok('secuencia: orden correcto restaura, orden equivocado reinicia', () => {
  const sec = { tipo: 'sec', cristal: 1, orden: ['q', 'p'], pads: {} };
  const E = L.crear(sala(con([[1, 7, 'H'], [3, 7, 'p'], [5, 7, 'q']]), [sec]));
  L.aplicar(E, 'R'); L.aplicar(E, 'R'); assert.strictEqual(E.errores, 1, 'p antes que q es un error');
  L.aplicar(E, 'R'); L.aplicar(E, 'R'); assert.strictEqual(E.prog[0], 1, 'q primero avanza'); L.aplicar(E, 'L'); L.aplicar(E, 'L'); assert.strictEqual(E.rest, 1);
});
ok('la sombra de piedra cae con la gravedad y activa el interruptor', () => {
  const E = L.crear(sala(con([[5, 2, 'E'], [5, 7, 'S'], [1, 7, 'H']]), [{ tipo: 'sombra', cristal: 1 }]));
  L.aplicar(E, 'CW'); assert.strictEqual(E.rest, 0, 'con la sala girada la sombra se va hacia la derecha, no cae sobre S');
  L.aplicar(E, 'CCW'); L.aplicar(E, 'CCW'); L.aplicar(E, 'CCW'); L.aplicar(E, 'CCW');
  const E2 = L.crear(sala(con([[5, 2, 'E'], [5, 7, 'S'], [1, 7, 'H']]), [{ tipo: 'sombra', cristal: 1 }]));
  const r2 = L.aplicar(E2, 'R'); assert.strictEqual(E2.rest, 1, 'la sombra cae con la gravedad hasta el interruptor'); assert.ok(r2.ev.some(e => e.t === 'interruptor'));
});
ok('los pinchos devuelven muerte y el solucionador nunca los usa', () => {
  const E = L.crear(sala(con([[4, 7, '^'], [2, 7, 'H']])));
  L.aplicar(E, 'R'); const r = L.aplicar(E, 'R'); assert.ok(E.muerto && r.ev.some(e => e.t === 'muerte'));
});
ok('una casilla fantasma que se solidifica con alguien dentro espera (no atrapa)', () => {
  const E = L.crear(sala(con([[3, 7, 'H'], [4, 7, '1'], [6, 7, 'a']]), [JSON.parse(JSON.stringify(mult))]));
  E.hero.x = 4; E.hero.y = 7; E.rest = 1; L.caer(E, null);
  assert.deepStrictEqual([E.hero.x, E.hero.y], [4, 7], 'sigue dentro: la tinta espera');
  L.aplicar(E, 'L'); assert.strictEqual(L.aplicar(E, 'R').valida, false, 'al salir, la casilla ya es sólida');
});

console.log('Salas del mundo');
ok('hay 4 salas y cada una tiene mapa 9×9 con héroe y portal', () => {
  assert.strictEqual(S.salas.length, 4);
  S.salas.forEach(s => { assert.strictEqual(s.mapa.length, 9); s.mapa.forEach(f => assert.strictEqual(f.length, 9)); const j = s.mapa.join(''); assert.ok(j.includes('H') && j.includes('X'), s.nombre); });
});
ok('TODAS las salas tienen solución y esta gana de verdad', () => {
  S.salas.forEach((s, i) => {
    const E = L.crear(S.copia(i)); const sol = L.resolver(E); assert.ok(sol && sol.length > 0, 'sin solución: ' + s.nombre);
    const F = L.crear(S.copia(i)); sol.forEach(a => assert.ok(L.aplicar(F, a).valida)); assert.ok(F.gana && F.rest === F.req, s.nombre);
  });
});
ok('las salas obligan a girar (no se resuelven solo caminando)', () => {
  S.salas.forEach((s, i) => { const sol = L.resolver(L.crear(S.copia(i))); assert.ok(sol.filter(a => a === 'CW' || a === 'CCW').length >= 2, s.nombre); });
});
ok('la dificultad crece: cada sala pide más pasos que la primera', () => {
  const len = S.salas.map((s, i) => L.resolver(L.crear(S.copia(i))).length); assert.ok(len[3] > len[0] && len[1] > len[0], len.join(','));
});
ok('hay un cristal por reto y las salas 2-4 combinan retos', () => {
  assert.strictEqual(S.copia(3).retos.length, 3); assert.ok(S.copia(1).retos.length >= 2);
});

console.log('Preguntas de las tablas');
ok('la respuesta correcta está entre las losas y los distractores son distintos', () => {
  for (let k = 0; k < 200; k++) {
    const E = L.crear(S.copia(k % 4)); L.rellenar(E, S.copia(k % 4).tablas);
    E.retos.filter(r => r.tipo === 'mult').forEach(r => { const v = Object.keys(r.pads).map(p => r.pads[p].n); assert.strictEqual(new Set(v).size, v.length); assert.strictEqual(r.pads.a.n, r.q.T * r.q.n); });
    const m = E.retos.find(r => r.tipo === 'mult'), sc = E.retos.find(r => r.tipo === 'sec');
    if (m && sc) { const nums = [].concat(Object.keys(m.pads).map(p => m.pads[p].n), sc.orden.map(p => sc.pads[p].n)); assert.strictEqual(new Set(nums).size, nums.length, 'números repetidos entre losas: ' + nums); }
    E.retos.filter(r => r.tipo === 'sec').forEach(r => { assert.deepStrictEqual(r.orden.map(p => r.pads[p].n), r.orden.map((_, i) => r.T * (i + 1))); });
  }
});
console.log('Arte del Mundo 4');
ok('todas las imágenes de assets/nivel4 que usa el juego existen', () => {
  const fs = require('fs'), path = require('path'), src = fs.readFileSync(path.join(__dirname, '../engine/nivel4/negativo.js'), 'utf8');
  const rutas = (src.match(/A \+ '(nivel4\/[^']+)'/g) || []).map(t => t.replace(/^A \+ '|'$/g, ''));
  assert.ok(rutas.length >= 40, 'se esperaban al menos 40 imágenes, hay ' + rutas.length);
  rutas.forEach(r => assert.ok(fs.existsSync(path.join(__dirname, '../assets', r)), 'falta assets/' + r));
});
ok('los dos héroes tienen sus 8 poses', () => {
  const fs = require('fs'), path = require('path');
  ['sakura', 'antarez'].forEach(h => ['caer_1', 'caer_2', 'aterrizar', 'girar_mundo', 'pensando', 'asustada', 'celebrar_1', 'celebrar_2'].forEach(p => assert.ok(fs.existsSync(path.join(__dirname, '../assets/nivel4/heroe', h, p + '.png')), 'falta ' + h + '/' + p)));
});
console.log('\n' + n + ' pruebas del Mundo 4 OK');
