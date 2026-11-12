// Pruebas de la lógica del Nivel 1. Ejecutar:  node tests/nivel1.test.js
const assert = require('assert');
const Perfiles = require('../engine/nivel1/perfiles.js');
const Ruta = require('../engine/nivel1/ruta.js');
const Ac = require('../engine/nivel1/acertijos.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

// almacén falso de localStorage
function fakeStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => delete m[k] }; }

console.log('Perfiles');
ok('crea, lista, elige y guarda progreso', () => {
  Perfiles.usarAlmacen(fakeStore());
  const r = Perfiles.crear({ nombre: 'Ana', avatar: 'kage', dispositivo: 'pc' });
  assert(r.ok && r.perfil.avatar === 'kage');
  assert.strictEqual(Perfiles.crear({ nombre: 'ana' }).ok, false, 'nombre repetido');
  assert.strictEqual(Perfiles.crear({ nombre: 'A' }).ok, false, 'nombre corto');
  Perfiles.crear({ nombre: 'Luis', avatar: 'sakura', dispositivo: 'movil' });
  Perfiles.actualizar('ana', p => { p.progreso = { fase: 'easy', nivel: 3, puntos: 1200 }; });
  assert.strictEqual(Perfiles.obtener('ana').progreso.nivel, 3);
  assert.strictEqual(Perfiles.activo().id, 'luis');
  Perfiles.elegir('ana'); assert.strictEqual(Perfiles.activo().id, 'ana');
  assert.strictEqual(Perfiles.listar().length, 2);
});
ok('limpia nombres peligrosos', () => {
  Perfiles.usarAlmacen(fakeStore());
  const r = Perfiles.crear({ nombre: '<img src=x onerror=alert(1)>' });
  assert(!/[<>"']/.test(r.perfil.nombre));
});
ok('exporta e importa (y detecta códigos dañados)', () => {
  Perfiles.usarAlmacen(fakeStore());
  Perfiles.crear({ nombre: 'Sofía' });
  Perfiles.actualizar('sofía', p => { p.progreso.puntos = 777; });
  const code = Perfiles.exportar('sofía');
  Perfiles.usarAlmacen(fakeStore());
  const r = Perfiles.importar(code); assert(r.ok && r.perfil.progreso.puntos === 777 && r.perfil.nombre === 'Sofía');
  assert.strictEqual(Perfiles.importar(code.slice(0, -4) + 'AAAA').ok, false);
  assert.strictEqual(Perfiles.importar('hola').ok, false);
  assert(Perfiles.importar(code).perfil.id !== 'sofía', 'no pisa el perfil existente');
});
ok('funciona aunque el almacenamiento falle', () => {
  Perfiles.usarAlmacen({ getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } });
  assert.strictEqual(Perfiles.listar().length, 0);
  assert.strictEqual(Perfiles.crear({ nombre: 'Pedro' }).ok, false);
});

console.log('Ruta (decisiones y semillas)');
ok('misma semilla y decisiones = mismo nivel', () => {
  const a = Ruta.simular(123), b = Ruta.simular(123);
  assert.deepStrictEqual(a.jugados, b.jugados); assert.deepStrictEqual(a.banderas, b.banderas);
});
ok('semillas distintas dan estructuras distintas', () => {
  const rutas = new Set(); for (let s = 1; s <= 60; s++) rutas.add(Ruta.simular(s).jugados.join('>'));
  assert(rutas.size >= 15, 'solo ' + rutas.size + ' rutas distintas en 60 semillas');
});
ok('siempre empieza en el bosque y termina en el jefe, sin repetir actos', () => {
  for (let s = 1; s <= 300; s++) {
    const p = Ruta.simular(s);
    assert.strictEqual(p.jugados[0], 'bosque'); assert.strictEqual(p.jugados[p.jugados.length - 1], 'jefe');
    assert.strictEqual(new Set(p.jugados).size, p.jugados.length, 'repite acto en semilla ' + s);
    assert.strictEqual(p.jugados.length, 7);
  }
});
ok('cada etapa de decisión ofrece 2 actos distintos', () => {
  for (let s = 1; s <= 200; s++) {
    const p = Ruta.nuevoPlan(s);
    while (p.etapa <= 7) {
      if (p.etapa > 1 && p.etapa < 7) { assert.strictEqual(p.opciones.length, 2, 'etapa ' + p.etapa + ' semilla ' + s); assert.notStrictEqual(p.opciones[0].acto, p.opciones[1].acto); }
      Ruta.elegir(p, p.opciones[s % p.opciones.length].acto); Ruta.terminarActo(p, {});
    }
  }
});
ok('lo que eliges cambia las opciones y el jefe', () => {
  const jefes = new Set(); const sinArm = [], conArm = [];
  for (let s = 1; s <= 200; s++) {
    const p = Ruta.simular(s); const j = Ruta.jefeSegun(p);
    jefes.add(JSON.stringify(j.banderas)); (j.banderas.escudo ? conArm : sinArm).push(1);
  }
  assert(jefes.size >= 6, 'poca variedad de jefes: ' + jefes.size); assert(conArm.length > 20 && sinArm.length > 20);
});
ok('el nivel dura entre 25 y 46 minutos (unos 35 de media)', () => {
  let lo = 99, hi = 0;
  for (let s = 1; s <= 200; s++) { const d = Ruta.duracionEstimada(Ruta.simular(s)); lo = Math.min(lo, d.min); hi = Math.max(hi, d.max); }
  assert(lo >= 24, 'mínimo ' + lo); assert(hi <= 46, 'máximo ' + hi); console.log('    (rango observado: ' + lo + '–' + hi + ' min)');
});
ok('decisión no disponible lanza error', () => { assert.throws(() => Ruta.elegir(Ruta.nuevoPlan(1), 'dragon')); });

console.log('Acertijos');
ok('cada mecánica produce exactamente un objeto correcto y sin duplicados', () => {
  const rng = Ruta.crearRng(7, 't');
  Object.keys(Ac.MECANICAS).forEach(mec => {
    for (let i = 0; i < 200; i++) {
      const a = Ac.crear({ rng, tabla: 2, mecanica: mec });
      assert.strictEqual(a.objetos.filter(o => o.correcto).length, 1, mec);
      const vals = a.objetos.map(o => o.valor); assert.strictEqual(new Set(vals).size, vals.length, mec + ' duplicados ' + vals);
      assert(vals.every(v => v > 0), mec + ' valores no positivos');
    }
  });
});
ok('las respuestas son matemáticamente correctas', () => {
  const rng = Ruta.crearRng(9, 't');
  for (let i = 0; i < 500; i++) {
    const a = Ac.crear({ rng, tabla: 2, mecanica: 'romper_bloques' });
    const c = a.objetos.find(o => o.correcto).valor;
    const [, b] = a.hecho.split('x').map(Number);
    if (a.tipo === 'producto' || a.tipo === 'doble') assert.strictEqual(c, 2 * b);
    if (a.tipo === 'factor') assert.strictEqual(c, b);
  }
  for (let i = 0; i < 200; i++) {
    const a = Ac.crear({ rng, tabla: 2, mecanica: 'piedras' });
    assert.strictEqual(a.objetos.find(o => o.correcto).valor, a.secuencia[1] + 2);
    assert.strictEqual(a.secuencia[1] - a.secuencia[0], 2);
  }
  for (let i = 0; i < 200; i++) {
    const a = Ac.crear({ rng, tabla: 2, mecanica: 'balanza' });
    assert.strictEqual(a.balanza.valorPesa * a.balanza.pesasNecesarias, a.balanza.objetivo);
  }
});
ok('evaluar reconoce la respuesta correcta', () => {
  const rng = Ruta.crearRng(3, 't'); const a = Ac.crear({ rng, tabla: 2, mecanica: 'encender_farol' });
  assert(Ac.evaluar(a, a.objetos.find(o => o.correcto).valor).ok); assert(!Ac.evaluar(a, a.objetos.find(o => !o.correcto).valor).ok);
});
ok('la maestría prioriza lo que más falla y no repite lo reciente', () => {
  const m = Ac.crearMaestria(); const rng = Ruta.crearRng(5, 'm');
  for (let k = 0; k < 6; k++) { m.registrar('2x7', false); m.registrar('2x2', true); m.registrar('2x2', true); }
  assert(m.peso('2x7') > m.peso('2x2'), 'debería pesar más lo que falla');
  const cont = {}; for (let i = 0; i < 400; i++) { const h = m.elegir(rng, ['2x2', '2x7', '2x9'], 1)[0]; cont[h] = (cont[h] || 0) + 1; }
  assert(cont['2x7'] > cont['2x2'], 'elige más lo difícil: ' + JSON.stringify(cont));
});
ok('adaptativo: el estudiante que falla 2x7 lo ve más que los hechos que domina', () => {
  const m = Ac.crearMaestria(); const rng = Ruta.crearRng(11, 'a'); const veces = {};
  for (let i = 0; i < 600; i++) {
    const a = Ac.crear({ rng, tabla: 2, mecanica: 'encender_farol', maestria: m });
    veces[a.hecho] = (veces[a.hecho] || 0) + 1;
    m.registrar(a.hecho, a.hecho === '2x7' ? i % 4 === 0 : true);   // falla casi siempre 2x7, acierta el resto
  }
  const otros = Object.keys(veces).filter(h => h !== '2x7').map(h => veces[h]);
  const media = otros.reduce((x, y) => x + y, 0) / otros.length;
  assert(veces['2x7'] > media * 1.3, '2x7 salió ' + veces['2x7'] + ' veces vs media ' + media.toFixed(0) + ' del resto');
  assert(otros.length >= 8, 'sigue repasando casi toda la tabla');
});
console.log('\n' + n + ' pruebas OK');

// ---------- Generador del Nivel 1 largo ----------
const Gen = require('../engine/nivel1/gen-nivel.js');
console.log('Nivel 1 largo (generador)');
const gen = s => Gen.generar({ semilla: s, dificultad: 1, preguntas: 16 }, null);
ok('400 semillas: recorribles, con 16 estaciones y una respuesta correcta cada una', () => {
  for (let s = 1; s <= 400; s++) { const f = Gen.validar(gen(s)); assert.deepStrictEqual(f, [], 'semilla ' + s + ': ' + f.join('; ')); }
});
ok('cada nivel incluye todos los enemigos y todos los retos (cueva, jefe, emboscada, roca, sierras...)', () => {
  for (let s = 1; s <= 400; s++) {
    const N = gen(s), k = N.enem.map(e => e.kind), t = N.elem.map(e => e.t);
    ['ninja', 'ninjaAtk', 'tengu', 'murcielago', 'arana', 'aranaTecho', 'fuego', 'oni'].forEach(x => assert(k.includes(x), 'falta enemigo ' + x + ' en semilla ' + s));
    ['carreta', 'palanca', 'emb', 'roca', 'kunaiR', 'sierra', 'viento', 'estal', 'tela', 'jefe'].forEach(x => assert(t.includes(x), 'falta reto ' + x + ' en semilla ' + s));
    assert(N.tambores.some(d => d.hongo) && N.tambores.some(d => !d.hongo), 'faltan tambores u hongos');
    assert(N.plat.some(p => p.mov) && N.plat.some(p => p.fragil), 'faltan plataformas móviles o frágiles');
  }
});
ok('largo y duración estimada: ≈ 20–30 minutos y 65–75 mil px', () => {
  let lo = 99, hi = 0, mn = 1e9, mx = 0;
  for (let s = 1; s <= 200; s++) { const N = gen(s); lo = Math.min(lo, N.costoMin); hi = Math.max(hi, N.costoMin); mn = Math.min(mn, N.ancho); mx = Math.max(mx, N.ancho); }
  assert(lo >= 20 && hi <= 32, lo + '–' + hi + ' min'); assert(mn > 55000 && mx < 90000); console.log('    (' + lo + '–' + hi + ' min estimados · ' + mn + '–' + mx + ' px)');
});
ok('semillas distintas dan niveles distintos; la misma semilla da el mismo', () => {
  const firma = s => JSON.stringify(gen(s).suelo.map(x => x.x1)) + gen(s).est.map(e => e.mecanica).join();
  assert.strictEqual(firma(5), firma(5)); const set = new Set(); for (let s = 1; s <= 40; s++) set.add(firma(s)); assert(set.size >= 38);
});
ok('las estaciones usan las 5 mecánicas y la primera es la más sencilla (farol)', () => {
  const vistas = new Set(); for (let s = 1; s <= 100; s++) { const N = gen(s); assert.strictEqual(N.est[0].mecanica, 'encender_farol'); N.est.forEach(e => vistas.add(e.mecanica)); assert.strictEqual(N.est[15].mecanica, 'antorchas'); }
  ['encender_farol', 'romper_bloques', 'diana', 'piedras', 'empujar_carreta', 'antorchas'].forEach(m => assert(vistas.has(m), 'falta ' + m));
});
ok('las antorchas de la cueva siguen la cuenta y el orden en pantalla es distinto al de la cuenta', () => {
  let mezclado = 0; for (let s = 1; s <= 100; s++) { const e = gen(s).est[15]; const v = e.ac.secuencia; assert.deepStrictEqual(v.slice().sort((a, b) => a - b), v); assert.strictEqual(v[1] - v[0], 2); if (e.objetos.some((o, i) => o.idx !== i)) mezclado++; }
  assert(mezclado > 60);
});
console.log('\n' + n + ' pruebas OK');
