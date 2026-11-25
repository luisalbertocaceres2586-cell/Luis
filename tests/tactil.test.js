// Pruebas del núcleo puro de la capa táctil (zonas, halos, cruceta ◀▶, histéresis).  Ejecutar:  node tests/tactil.test.js
// La parte con DOM (multitáctil, soltado seguro, toques sub-cuadro) se prueba en el navegador: tests/navegador/tactil.mjs
const assert = require('assert');
const { core } = require('../engine/core/tactil.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

// Disposición real de un teléfono de 420 px de alto: u = 63 px, ◀ a 30 px del borde, ▶ a 1.25u de ◀, saltar y atacar a la derecha.
const u = 63, r = u / 2, h = 420, w = 900, xm = 30, ym = 22;
const L = { id: 'L', cx: xm + .5 * u, cy: h - ym - .5 * u, r, grupo: 'dir', tol: .7 };
const R = { id: 'R', cx: xm + 1.75 * u, cy: h - ym - .5 * u, r, grupo: 'dir', tol: .7 };
const J = { id: 'J', cx: w - 30 - .75 * u, cy: h - ym - .75 * u, r: r * 1.1 };
const A = { id: 'A', cx: w - 30 - 2.1 * u, cy: h - ym - .5 * u, r };
const P = { id: 'P', cx: w - 30 - 1.0 * u, cy: h - ym - 2.25 * u, r };
const todos = [L, R, J, A, P];
const lim = { w, h };
const id = (x, y, lista, tol, desl) => { const s = core.elegir(lista || todos, x, y, tol, desl, lim); return s && s.id; };

console.log('Toque directo');
ok('el centro de cada botón elige ese botón', () => { for (const c of todos) assert.strictEqual(id(c.cx, c.cy), c.id); });
ok('un toque en el borde del círculo sigue siendo del botón', () => { assert.strictEqual(id(J.cx + J.r * .95, J.cy), 'J'); });

console.log('Tolerancia (halo): antes un dedo "casi encima" no hacía nada');
ok('un dedo 25 % fuera del círculo de ⬆ sigue saltando', () => { assert.strictEqual(id(J.cx + J.r * 1.25, J.cy), 'J'); });
ok('un dedo 25 % fuera del círculo de ⚔ sigue atacando', () => { assert.strictEqual(id(A.cx, A.cy - A.r * 1.25), 'A'); });
ok('lejos de todo (más de 40 % fuera) no se reclama nada', () => { assert.strictEqual(core.elegir(todos, 450, 200, undefined, undefined, lim), null); assert.strictEqual(id(J.cx + J.r * 1.6, J.cy), null); });
ok('tol = 0 (modo MOVER) desactiva el halo', () => { assert.strictEqual(id(J.cx + J.r * 1.25, J.cy, todos, 0), null); });

console.log('Cruceta ◀ ▶ (el botón "volver")');
ok('el hueco entre ◀ y ▶ camina (antes no hacía nada)', () => {
  const mid = (L.cx + R.cx) / 2; assert(Math.abs(L.cx - R.cx) > L.r + R.r - 1, 'hay hueco');
  assert.strictEqual(id(mid - 4, L.cy), 'L'); assert.strictEqual(id(mid + 4, L.cy), 'R');
});
ok('el borde de la pantalla, a la izquierda de ◀, sigue siendo ◀ (zona del gesto "atrás")', () => { assert.strictEqual(id(6, L.cy), 'L'); assert.strictEqual(id(0, L.cy), 'L'); });
ok('un dedo por debajo/encima de la cruceta (dentro del halo) también cuenta', () => { assert.strictEqual(id(L.cx, L.cy + L.r * 1.3), 'L'); assert.strictEqual(id(R.cx, R.cy - R.r * 1.3), 'R'); });
ok('toda la zona derecha de ▶ (hasta el halo) es ▶', () => { assert.strictEqual(id(R.cx + R.r * 1.3, R.cy), 'R'); });
ok('sin deslizar (modo MOVER) cada botón es solo su círculo', () => { assert.strictEqual(id((L.cx + R.cx) / 2, L.cy, todos, 0, false), null); assert.strictEqual(id(L.cx, L.cy, todos, 0, false), 'L'); });

console.log('Deslizar y histéresis');
ok('deslizar de ◀ a ▶ cambia en el punto medio (más la histéresis)', () => {
  const g = core.grupos(todos).dir, mid = (L.cx + R.cx) / 2; let cur = 'L';
  cur = core.dirGrupo(g, mid + 1, cur); assert.strictEqual(cur, 'L', 'justo pasado el medio aún se mantiene (sin parpadeo)');
  cur = core.dirGrupo(g, mid + core.HIST * r + 2, cur); assert.strictEqual(cur, 'R');
  cur = core.dirGrupo(g, mid - 1, cur); assert.strictEqual(cur, 'R', 'volver un pelín no cambia');
  cur = core.dirGrupo(g, mid - core.HIST * r - 2, cur); assert.strictEqual(cur, 'L');
});
ok('sin parpadeo: un dedo temblando ±2 px en el medio no cambia nunca de dirección', () => {
  const g = core.grupos(todos).dir, mid = (L.cx + R.cx) / 2; let cur = 'L', cambios = 0;
  for (let i = 0; i < 200; i++) { const nx = core.dirGrupo(g, mid + (i % 2 ? 2 : -2), cur); if (nx !== cur) cambios++; cur = nx; }
  assert.strictEqual(cambios, 0);
});
ok('recorrer todo el ancho de la cruceta pasa por L y luego R una sola vez', () => {
  const g = core.grupos(todos).dir; let cur = 'L', seq = ['L'];
  for (let x = L.cx - 20; x <= R.cx + 20; x += 2) { const nx = core.dirGrupo(g, x, cur); if (nx !== cur) seq.push(nx); cur = nx; }
  assert.deepStrictEqual(seq, ['L', 'R']);
});

console.log('Botones cercanos y zonas');
ok('si dos halos se solapan gana el más cercano (normalizado por radio)', () => {
  const a = { id: 'a', cx: 0, cy: 0, r: 30 }, b = { id: 'b', cx: 70, cy: 0, r: 30 };
  assert.strictEqual(id(32, 0, [a, b]), 'a'); assert.strictEqual(id(36, 0, [a, b]), 'b'); assert.strictEqual(id(40, 0, [a, b]), 'b', 'dentro del círculo de b: toque directo');
});
ok('los botones de la derecha no invaden la zona de la cruceta izquierda', () => {
  const z = core.zonaGrupo(core.grupos(todos).dir, undefined, lim);
  for (const c of [J, A, P]) assert(!core.dentro(z, c.cx, c.cy), c.id + ' fuera de la zona de ◀▶');
});
ok('la zona de la cruceta cubre el hueco y el halo', () => {
  const z = core.zonaGrupo(core.grupos(todos).dir, undefined, lim);
  assert(z.x0 < L.cx - L.r && z.x1 > R.cx + R.r && z.y0 < L.cy - L.r && z.y1 > L.cy + L.r);
});
ok('si el usuario aleja ◀ y ▶ (botones movidos), cada uno sigue funcionando', () => {
  const l2 = { id: 'L', cx: 60, cy: 300, r, grupo: 'dir' }, r2 = { id: 'R', cx: 420, cy: 150, r, grupo: 'dir' };
  assert.strictEqual(id(60, 300, [l2, r2]), 'L'); assert.strictEqual(id(420, 150, [l2, r2]), 'R');
});
ok('un solo botón en un grupo no crea zona (se comporta como botón suelto)', () => {
  const solo = { id: 'S', cx: 100, cy: 100, r: 30, grupo: 'g' };
  assert.strictEqual(id(100, 100, [solo]), 'S'); assert.strictEqual(core.elegir([solo], 100, 150), null);
});

console.log('Casos reales que fallaban antes (medidos en el navegador con la versión anterior)');
ok('15 px por encima de ◀ (antes: nada) ahora camina', () => { assert.strictEqual(id(L.cx, L.cy - L.r - 15), 'L'); });
ok('25 px por encima de ◀ (≈0.8 del radio, aún dentro de la tolerancia 0.7 + hueco) camina o no reclama, nunca otro botón', () => { const x = id(L.cx, L.cy - L.r - 25); assert(x === 'L' || x === null, String(x)); });
ok('15 px a la izquierda del borde de ◀ (antes: nada) ahora camina', () => { assert.strictEqual(id(L.cx - L.r - 15, L.cy), 'L'); });
ok('un dedo que se desliza hacia abajo, hasta el borde inferior, sigue en la cruceta', () => { assert.strictEqual(id(L.cx, h - 1), 'L'); assert.strictEqual(id(R.cx, h - 1), 'R'); });
ok('toda la banda de ◀ ▶ es continua: ningún píxel sin dueño entre x=0 y el borde derecho de ▶ (a la altura de los botones)', () => {
  for (let x = 0; x <= R.cx + R.r + 6; x++) { const q = id(x, L.cy); assert(q === 'L' || q === 'R', 'x=' + x + ' → ' + q); }
});
ok('las zonas de ◀▶ y de ⬇ (entre ambos, arriba) se reparten sin dejar a ⬇ sin su círculo', () => {
  const B = { id: 'B', cx: xm + 1.125 * u, cy: h - ym - 1.7 * u, r: u * .3 };
  const lista = [L, R, B, J, A, P]; assert.strictEqual(id(B.cx, B.cy, lista), 'B');
});

console.log('\n' + n + ' bien');
