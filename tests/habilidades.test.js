// Pruebas de la parte "pura" de las habilidades ninja (Fase 1) y de lo que el generador añadió para ellas.
// Ejecutar:  node tests/habilidades.test.js      (la física real se prueba en tests/navegador/habilidades.mjs)
const assert = require('assert');
const H = require('../engine/nivel1/habilidades.js');
const Ac = require('../engine/nivel1/acertijos.js');
const Gen = require('../engine/nivel1/gen-nivel.js');
const G = 560;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const nivel = s => Gen.generar({ semilla: s, variante: 'A' }, Ac.crearMaestria({}));

console.log('Habilidades · definiciones');
ok('hay 6 habilidades y 6 umbrales de pergaminos crecientes', () => {
  assert.strictEqual(H.DEFS.length, 6); assert.strictEqual(H.UMBRALES.length, 6);
  for (let i = 1; i < 6; i++) assert(H.UMBRALES[i] > H.UMBRALES[i - 1]);
  assert.strictEqual(H.umbral(6), Infinity);
  assert.deepStrictEqual(H.DEFS.map(d => d.id).sort(), ['dash', 'doble', 'gancho', 'pared', 'planeo', 'tajoAereo']);
  H.DEFS.forEach(d => assert(d.nombre && d.desc && d.icono && d.teclas.length, d.id));
});
ok('todas se pueden ganar en un nivel: el último umbral queda por debajo de los pergaminos fijos del nivel', () => {
  for (let s = 1; s <= 40; s++) { const N = nivel(s); const perg = N.items.filter(i => i.tipo === 'pergamino').length; assert(perg > H.UMBRALES[5] + 10, 'semilla ' + s + ': ' + perg); }
});

console.log('Gancho · argollas');
ok('cada nivel trae argollas suficientes, separadas y dentro del nivel (100 semillas)', () => {
  for (let s = 1; s <= 100; s++) {
    const N = nivel(s), A = H.anclas(N); assert(A.length >= 12, 'semilla ' + s + ': solo ' + A.length);
    for (let i = 0; i < A.length; i++) {
      assert(A[i].x > 300 && A[i].x < N.meta.x - 300, 'fuera de rango'); assert(A[i].y >= G - 400 && A[i].y <= G - 280, 'altura ' + A[i].y);
      if (i) assert(A[i].x - A[i - 1].x >= 380, 'muy juntas');
    }
  }
});
ok('ninguna argolla en la arena del jefe, en las emboscadas ni en las puertas de acertijo (no se esquivan retos)', () => {
  for (let s = 1; s <= 100; s++) {
    const N = nivel(s), A = H.anclas(N);
    const zonas = [];
    N.elem.forEach(t => { if (t.t === 'jefe') zonas.push([t.x0 - 300, t.x1 + 300]); if (t.t === 'emb') zonas.push([t.x0 - 150, t.x1 + 150]); });
    N.est.forEach(e => zonas.push([e.x0 - 120, e.x0 + e.ancho + 120]));
    A.forEach(a => zonas.forEach(z => assert(!(a.x >= z[0] && a.x <= z[1]), 'semilla ' + s + ' argolla ' + a.x + ' en ' + z)));
  }
});
ok('todo hueco ancho tiene su argolla en el medio (para cruzarlo balanceándose)', () => {
  const N = nivel(7), A = H.anclas(N); let anchos = 0, con = 0;
  N.gaps.forEach(g => { if (g.x1 - g.x0 >= 220) { anchos++; if (A.some(a => a.x >= g.x0 && a.x <= g.x1)) con++; } });
  assert(anchos > 0 && con >= anchos * .6, con + '/' + anchos);
});
ok('elegirAncla elige la de arriba y más cercana, prefiere la que está hacia donde mira, y nunca una por debajo', () => {
  const L = [{ x: 100, y: 200 }, { x: 500, y: 250 }, { x: 300, y: 700 }];
  assert.strictEqual(H.elegirAncla(L, 300, 450, 1, 560).x, 500);   // mirando a la derecha
  assert.strictEqual(H.elegirAncla(L, 300, 450, -1, 560).x, 100);  // mirando a la izquierda
  assert.strictEqual(H.elegirAncla(L, 300, 450, 1, 100), null);    // fuera de alcance
  assert.strictEqual(H.elegirAncla([{ x: 300, y: 700 }], 300, 450, 1, 560), null);   // por debajo
});

console.log('Gancho · cuerda');
ok('péndulo: la cuerda nunca se alarga y no se gana energía de la nada', () => {
  const ax = 1000, ay = 260, L = 300, dt = 1 / 60, g = 2300;
  let px = ax - 200, py = ay + Math.sqrt(L * L - 200 * 200), vx = 0, vy = 0, minY = py, maxD = 0;
  const E = (x, y, vx, vy) => .5 * (vx * vx + vy * vy) - g * y; const E0 = E(px, py, vx, vy); let Emax = E0;
  for (let i = 0; i < 60 * 10; i++) {
    vy += g * dt; const r = H.restringirCuerda(px, py, vx, vy, dt, ax, ay, L, 1e9); vx = r.vx; vy = r.vy; px += vx * dt; py += vy * dt;
    maxD = Math.max(maxD, Math.hypot(px - ax, py - ay)); minY = Math.min(minY, py); Emax = Math.max(Emax, E(px, py, vx, vy));
  }
  assert(maxD <= L + 1e-6, 'cuerda ' + maxD); assert(minY >= ay + Math.sqrt(L * L - 200 * 200) - 25, 'sube más alto de donde empezó: ' + minY);
  assert(Emax <= E0 + .04 * Math.abs(E0), 'energía ' + (Emax - E0));
});
ok('la velocidad máxima se respeta', () => {
  const r = H.restringirCuerda(0, 0, 5000, 5000, 1 / 60, 0, -100, 1e6, 1150); assert(Math.hypot(r.vx, r.vy) <= 1150 + 1e-9);
});
ok('el tajo hacia abajo golpea debajo de los pies; si no es hacia abajo, queda el tajo normal', () => {
  const base = { x: 1, y: 2, w: 3, h: 4 }, h = { x: 500, y: 400, tajoAbajo: false };
  assert.strictEqual(H.rectTajo(h, base), base);
  h.tajoAbajo = true; const r = H.rectTajo(h, base); assert(r.y + r.h > h.y + 100 && r.y < h.y && r.w >= 120);
});

console.log('Generador · chimeneas y rejas');
ok('cada nivel trae al menos una chimenea completa: 2 paredes enfrentadas, por debajo se camina, repisa con tesoro arriba (100 semillas)', () => {
  for (let s = 1; s <= 100; s++) {
    const N = nivel(s), izq = N.muros.filter(m => m.tipo === 'escalada' && m.lado === 'izq'); assert(izq.length >= 1, 'semilla ' + s + ' sin chimenea');
    izq.forEach(i => {
      const d = N.muros.find(m => m.par === i.par && m.lado === 'der'); assert(d, 'sin pareja');
      assert(i.y + i.h <= G - 150 && d.y + d.h <= G - 150, 'bloquea el paso'); assert(i.y >= 0 && d.x - (i.x + i.w) >= 180 && d.x - (i.x + i.w) <= 260, 'separación');
      const repisa = N.plat.find(p => p.x > i.x && p.x < d.x && p.y < i.y + 120); assert(repisa, 'sin repisa');
      assert(N.items.filter(it => it.x > i.x && it.x < d.x && it.y < repisa.y).length >= 5, 'sin tesoro arriba');
    });
  }
});
ok('las rejas (jefe, emboscada, palanca) miden 520: no se saltan con doble salto, planeo o gancho', () => {
  for (let s = 1; s <= 60; s++) { const R = nivel(s).muros.filter(m => m.tipo === 'reja'); assert(R.length >= 4); R.forEach(r => { assert.strictEqual(r.h, 520); assert.strictEqual(r.y, G - 520); }); }
});
ok('el validador rechaza una chimenea que bajara a la altura de la cabeza', () => {
  const N = nivel(3); const m = N.muros.find(q => q.tipo === 'escalada'); m.h += 100;
  assert(Gen.validar(N).some(f => /chimenea/.test(f)));
});
console.log('\n' + n + ' pruebas OK');
