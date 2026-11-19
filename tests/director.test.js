// Pruebas de la parte "pura" del director de eventos (Fase 2) y de lo que el generador añadió para la cueva.
// Ejecutar:  node tests/director.test.js      (la física y el dibujo reales se prueban en tests/navegador/director.mjs)
const assert = require('assert');
const D = require('../engine/nivel1/director.js');
const Ac = require('../engine/nivel1/acertijos.js');
const Gen = require('../engine/nivel1/gen-nivel.js');
const G = 560;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const nivel = s => Gen.generar({ semilla: s, variante: 'A' }, Ac.crearMaestria({}));
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const base = { vida: 1, errores: 0, racha: 0, ritmo: 50, muertes: 0, danio: 0 };

console.log('Director · cómo mira al estudiante');
ok('el dominio sube con vida, racha y ritmo, y baja con errores, daño y muertes (siempre entre 0 y 1)', () => {
  const d = o => D.evaluar(Object.assign({}, base, o));
  assert(d({ vida: 1 }) > d({ vida: .4 })); assert(d({ racha: 4 }) > d({ racha: 0 })); assert(d({ ritmo: 70 }) > d({ ritmo: 10 }));
  assert(d({ errores: 3 }) < d({ errores: 0 })); assert(d({ danio: 3 }) < d({ danio: 0 })); assert(d({ muertes: 2 }) < d({ muertes: 0 }));
  [{}, { vida: 0, errores: 9, muertes: 9, danio: 9, ritmo: 0 }, { vida: 1, racha: 9, ritmo: 500 }].forEach(o => { const v = d(o); assert(v >= 0 && v <= 1); });
});
ok('un estudiante dominando supera .85; uno en apuros queda por debajo de .28 (el umbral en que el director se calla)', () => {
  assert(D.evaluar({ vida: 1, errores: 0, racha: 4, ritmo: 70, muertes: 0, danio: 0 }) > .85);
  assert(D.evaluar({ vida: .4, errores: 3, racha: 0, ritmo: 10, muertes: 2, danio: 2 }) < .28);
});
ok('hay más calma entre eventos si va peor, y más aún dentro de la cueva', () => {
  assert(D.intervalo(0, 'bosque', .5) > D.intervalo(1, 'bosque', .5)); assert(D.intervalo(.6, 'cueva', .5) > D.intervalo(.6, 'bosque', .5));
  for (const dom of [0, .5, 1]) { const v = D.intervalo(dom, 'bosque', .5); assert(v >= 20 && v <= 60, '' + v); }
});

console.log('Director · qué evento sortea');
const dificultadMedia = (dom, zona, veces, seed) => { const r = mulberry(seed), ult = []; let t = 0; for (let i = 0; i < veces; i++) { const id = D.elegir(dom, zona, ult, [], r()); t += D.POR_ID[id].dif; ult.unshift(id); } return t / veces; };
ok('a quien va bien le tocan eventos más difíciles que a quien va mal', () => {
  const alto = dificultadMedia(.95, 'bosque', 3000, 1), bajo = dificultadMedia(.3, 'bosque', 3000, 1); assert(alto > bajo + .5, alto + ' vs ' + bajo);
});
ok('el fuego y el anochecer solo existen en el bosque; la cueva tiene un repertorio más amable', () => {
  const r = mulberry(5); for (let i = 0; i < 500; i++) { const id = D.elegir(.9, 'cueva', [], [], r()); assert(['viento', 'gravedad', 'resbala', 'rocas'].indexOf(id) >= 0, id); }
  assert(D.pesos(.9, 'cueva', [], []).every(p => p.id !== 'fuego' && p.id !== 'noche'));
  assert(dificultadMedia(.7, 'cueva', 3000, 2) < dificultadMedia(.7, 'bosque', 3000, 2));
});
ok('casi nunca repite el mismo evento seguido y los usa todos', () => {
  const r = mulberry(9); let ult = [], rep = 0, vistos = {}; for (let i = 0; i < 4000; i++) { const id = D.elegir(.7, 'bosque', ult, [], r()); if (ult[0] === id) rep++; vistos[id] = 1; ult.unshift(id); }
  assert(rep / 4000 < .06, 'repite ' + rep / 4000); assert(Object.keys(vistos).length === 6, JSON.stringify(vistos));
});
ok('lo excluido no sale; misma semilla = misma secuencia; semillas distintas = secuencias distintas', () => {
  const r = mulberry(3); for (let i = 0; i < 300; i++) assert(D.elegir(.9, 'bosque', [], ['fuego', 'noche'], r()) !== 'fuego');
  const sec = s => { const r = mulberry(s), u = []; for (let i = 0; i < 12; i++) u.unshift(D.elegir(.7, 'bosque', u, [], r())); return u.join(','); };
  assert.strictEqual(sec(11), sec(11)); assert.notStrictEqual(sec(11), sec(12));
});
ok('el viento cambia de dirección, tiene ráfagas y también calmas', () => {
  let pos = 0, neg = 0, calma = 0; for (let t = 0; t < 120; t += .25) { const v = D.ondaViento(t, 1.3); assert(Math.abs(v) <= 1); if (v > .3) pos++; if (v < -.3) neg++; if (Math.abs(v) < .15) calma++; }
  assert(pos > 20 && neg > 20 && calma > 5, pos + '/' + neg + '/' + calma);
});

console.log('Director · el fuego nunca te encierra');
ok('el fuego se apaga antes de llegar al próximo acertijo, al jefe o a un módulo duro (60 semillas, todo el bosque)', () => {
  for (let s = 1; s <= 60; s++) {
    const N = nivel(s), jefe = N.elem.find(t => t.t === 'jefe');
    for (let x = 200; x < N.cueva.x; x += 150) {
      const b = D.barreraFuego(N, x), est = N.est.find(e => e.x0 > x); if (est) assert(b <= est.x0 - 200, 'semilla ' + s + ' x ' + x + ' pasaría el acertijo');
      if (jefe && jefe.x0 > x) assert(b <= jefe.x0 - 450, 'entraría al jefe');
      N.especiales.forEach(sp => { if (D.DUROS.indexOf(sp.tipo) >= 0 && sp.x0 > x) assert(b <= sp.x0 - 100, sp.tipo); });
    }
  }
});
ok('hay suficientes tramos libres para que el fuego pueda salir (≥1800 px de carrera) y sin pasarse de la zona del bosque', () => {
  let libres = 0, tot = 0; for (let s = 1; s <= 40; s++) { const N = nivel(s); for (let x = 1500; x < N.cueva.x - 1500; x += 100) { tot++; if (D.barreraFuego(N, x) - x >= 1800) libres++; } }
  assert(libres / tot > .25, 'solo ' + Math.round(100 * libres / tot) + '%');
});
ok('la superficie bajo cada punto: suelo = G, hueco = nada, plataforma = su altura', () => {
  const N = nivel(4); const g = N.gaps[0]; assert.strictEqual(D.superficie(N, N.inicio.x + 10), G);
  const hueco = (g.x0 + g.x1) / 2; const sp = N.plat.some(p => hueco >= p.x && hueco <= p.x + p.w); if (!sp) assert.strictEqual(D.superficie(N, hueco), null);
  const p = N.plat[0]; const y = D.superficie(N, p.x + p.w / 2); assert(y !== null && y <= p.y + 1);
});

console.log('Generador · ayudas en la cueva');
ok('la cueva tiene un punto de control tras CADA acertijo y más comida que antes (100 semillas)', () => {
  for (let s = 1; s <= 100; s++) {
    const N = nivel(s), cu = N.ckp.filter(k => k.zona === 'cueva').length, on = N.items.filter(i => i.tipo === 'onigiri' && i.x > N.cueva.x).length;
    assert(cu >= 7, 'semilla ' + s + ': solo ' + cu + ' puntos de control'); assert(on >= 5, 'semilla ' + s + ': solo ' + on + ' onigiris');
    assert(Gen.validar(N).length === 0);
  }
});
ok('los puntos de control de la cueva quedan sobre suelo y bien separados', () => {
  for (let s = 1; s <= 60; s++) { const N = nivel(s), K = N.ckp.filter(k => k.zona === 'cueva'); K.forEach(k => assert(N.suelo.some(g => k.x >= g.x0 && k.x <= g.x1))); for (let i = 1; i < K.length; i++) assert(K[i].x - K[i - 1].x > 1500); }
});
console.log('\n' + n + ' pruebas OK');
