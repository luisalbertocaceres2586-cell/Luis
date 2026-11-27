// Pruebas de la guía visual del Nivel 1 ("Primeros minutos del jugador"): cuándo ayudar, cuándo NO, y que todo se pueda dibujar.
// Ejecutar:  node tests/guia.test.js      (el dibujo real en un navegador: tests/navegador/guia.mjs)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const N1guia = require('../engine/nivel1/guia.js');
const Hab = require('../engine/nivel1/habilidades.js');
const Dir = require('../engine/nivel1/director.js');
const leer = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

// ---------- ayudas para armar un mundo falso ----------
const mundo = (extra) => Object.assign({
  h: { x: 600, y: 560, vida: 5, dir: 1, muerto: 0 }, cam: 300, t: 5, errores: 0, tutoVisto: {}, part: [], textos: [], movil: false, aviso: null,
  enemigos: [], items: [], N: { elem: [], tambores: [], muros: [], deco: [] }
}, extra || {});
const tut = (id, cuando, hecho) => ({ id, txt: 'x', teclas: ['C'], cuando: cuando || (() => true), ok: hecho || (() => false) });
const avanzar = (S, lista, seg, dt) => { dt = dt || .1; for (let t = 0; t < seg - 1e-9; t += dt) N1guia.actualizar(S, dt, lista); };

console.log('Guía · cobertura de tutoriales');
const idsMotor = [...leer('engine/nivel1/motor.js').match(/const TUTOS = \[([\s\S]*?)\n  \];/)[1].matchAll(/\{ id: '(\w+)'/g)].map(m => m[1]);
const idsTodos = idsMotor.concat(Hab.TUTOS.map(t => t.id), Dir.TUTOS.map(t => t.id));
ok('se encontraron los tutoriales de motor.js, habilidades y director', () => { assert(idsMotor.length >= 20, String(idsMotor.length)); assert(idsTodos.length >= 32); });
ok('cada tutorial tiene su ayuda dibujada (teclas, ≤3 palabras) y su tiempo de espera; no sobran entradas', () => {
  idsTodos.forEach(id => {
    const sp = N1guia.ESPEC[id]; assert(sp, 'falta ESPEC de ' + id); assert(sp.k.length >= 1 && sp.k.length <= 3, id);
    assert(sp.lbl.split(/\s+/).filter(Boolean).length <= 3 && sp.lbl.length <= 22, id + ': "' + sp.lbl + '" es muy largo');
    assert(typeof N1guia.ESPERA[id] === 'number', 'falta ESPERA de ' + id);
  });
  Object.keys(N1guia.ESPEC).forEach(id => assert(idsTodos.indexOf(id) >= 0, 'ESPEC sin tutorial: ' + id));
  Object.keys(N1guia.ESPERA).forEach(id => assert(idsTodos.indexOf(id) >= 0, 'ESPERA sin tutorial: ' + id));
});
ok('un tutorial desconocido igual se muestra (solo con sus iconos, sin texto)', () => {
  const sp = N1guia.espec({ id: 'nuevo_x', txt: 'Una frase larga que no debe verse', teclas: ['Q', 'W'] });
  assert.deepStrictEqual(sp.k, ['Q', 'W']); assert.strictEqual(sp.lbl, '');
});
ok('los pasos del aprendiz son tutoriales que existen', () => { N1guia.PASOS.forEach(p => assert(idsMotor.indexOf(p.id) >= 0, p.id)); });

console.log('Guía · solo cuando hace falta');
ok('NO ayuda antes de la espera; después sí', () => {
  const S = mundo(), L = [tut('tajo', null, () => (S.tajos || 0) > 0)];
  N1guia.iniciar(S); avanzar(S, L, .8); assert.strictEqual(S.guia.act, null);
  avanzar(S, L, .5); assert(S.guia.act && S.guia.act.id === 'tajo');
});
ok('si el jugador ya lo hizo solo, no se muestra nunca (y queda como visto)', () => {
  const S = mundo(), L = [tut('tajo', null, () => (S.tajos || 0) > 0)];
  N1guia.iniciar(S); avanzar(S, L, .5); S.tajos = 1; avanzar(S, L, 5);
  assert.strictEqual(S.guia.act, null); assert.strictEqual(S.tutoVisto.tajo, 1);
});
ok('si lo hace mientras espera la ayuda, tampoco sale', () => {
  const S = mundo(), L = [tut('mover', null, () => (S.movido || 0) > 160)];
  N1guia.iniciar(S); avanzar(S, L, 1); S.movido = 300; avanzar(S, L, 5);
  assert.strictEqual(S.guia.act, null);
});
ok('los tutoriales que ya se vieron (otra partida) no salen', () => {
  const S = mundo({ tutoVisto: { tajo: 1 } }), L = [tut('tajo')];
  N1guia.iniciar(S); avanzar(S, L, 10); assert.strictEqual(S.guia.act, null);
});
ok('los avisos de peligro (espera 0) salen de inmediato', () => {
  const S = mundo(), L = [tut('arquero')]; N1guia.iniciar(S); avanzar(S, L, .1); assert(S.guia.act && S.guia.act.id === 'arquero');
});
ok('no sale durante el título del nivel, al apuntar ni al elegir habilidad; sale cuando termina', () => {
  const S = mundo({ aviso: { t: 3, s: 'BOSQUE' } }), L = [tut('tajo')]; N1guia.iniciar(S); avanzar(S, L, 2.5); assert.strictEqual(S.guia.act, null);
  S.aviso.t = 0; avanzar(S, L, .1); assert(S.guia.act, 'debía salir al terminar el aviso');
  const S2 = mundo({ apunta: {} }); N1guia.iniciar(S2); avanzar(S2, L, 5); assert.strictEqual(S2.guia.act, null);
  const S3 = mundo({ eligiendo: true }); N1guia.iniciar(S3); avanzar(S3, L, 5); assert.strictEqual(S3.guia.act, null);
});
ok('una sola ayuda a la vez: la segunda espera su turno', () => {
  const S = mundo(), L = [tut('arquero'), tut('escarabajo')]; N1guia.iniciar(S); avanzar(S, L, .2);
  assert.strictEqual(S.guia.act.id, 'arquero'); S.guia.act.def.ok = () => true; avanzar(S, L, .5); assert.strictEqual(S.guia.act, null);
  avanzar(S, L, 1.2); assert(S.guia.act && S.guia.act.id === 'escarabajo');
});

console.log('Guía · al lograrlo y al salir de la situación');
ok('al lograrlo se va (tras ≥0,3 s), queda visto y celebra con ✓ y chispas', () => {
  let hecho = false; const S = mundo(), L = [tut('tajo', null, () => hecho)];
  N1guia.iniciar(S); avanzar(S, L, 1.2); assert(S.guia.act); hecho = true;
  avanzar(S, L, .1); assert(S.guia.act, 'no debe desaparecer antes de 0,3 s: se vería el parpadeo');
  avanzar(S, L, .3); assert.strictEqual(S.guia.act, null); assert.strictEqual(S.tutoVisto.tajo, 1);
  assert.strictEqual(S.guia.fx.length, 1); assert.strictEqual(S.part.length, 14);
  avanzar(S, L, 1.2); assert.strictEqual(S.guia.fx.length, 0, 'el destello dura menos de 1 s');
});
ok('se esconde sola si el jugador sale de la situación', () => {
  let aqui = true; const S = mundo(), L = [tut('tajo', () => aqui)];
  N1guia.iniciar(S); avanzar(S, L, 1.2); assert(S.guia.act); aqui = false; avanzar(S, L, 1.2); assert(S.guia.act); avanzar(S, L, .5); assert.strictEqual(S.guia.act, null);
  assert.strictEqual(S.tutoVisto.tajo, 1);
});
ok('si no hace caso, se cansa a los 10 s (no molesta para siempre)', () => {
  const S = mundo(), L = [tut('tajo')]; N1guia.iniciar(S); avanzar(S, L, 1.2); assert(S.guia.act); avanzar(S, L, 10.3); assert.strictEqual(S.guia.act, null);
});

console.log('Guía · si se atora, vuelve a ayudar');
const dano = (S, L) => { S.h.vida--; avanzar(S, L, .1); };
ok('2 golpes seguidos junto a algo ya visto que no logra → la ayuda vuelve (con su aviso corto)', () => {
  const S = mundo({ tutoVisto: { ritmo: 1 } }), L = [tut('ritmo')]; N1guia.iniciar(S);
  avanzar(S, L, 5); assert.strictEqual(S.guia.act, null); dano(S, L); assert.strictEqual(S.guia.act, null, 'con un solo golpe aún no');
  avanzar(S, L, 3); dano(S, L); assert(S.guia.act && S.guia.act.id === 'ritmo' && S.guia.act.reh, 'debía volver');
});
ok('los errores de respuesta también cuentan', () => {
  const S = mundo({ tutoVisto: { apuntar: 1 } }), L = [tut('apuntar')]; N1guia.iniciar(S);
  S.errores = 1; avanzar(S, L, 1); S.errores = 2; avanzar(S, L, .1); assert(S.guia.act && S.guia.act.reh);
});
ok('vuelve una sola vez por cosa, aunque siga fallando', () => {
  const S = mundo({ tutoVisto: { ritmo: 1 } }), L = [tut('ritmo')]; N1guia.iniciar(S);
  dano(S, L); dano(S, L); assert(S.guia.act); avanzar(S, L, 9); assert.strictEqual(S.guia.act, null);
  avanzar(S, L, 40); S.h.vida = 5; avanzar(S, L, .1); dano(S, L); dano(S, L); avanzar(S, L, 3); assert.strictEqual(S.guia.act, null, 'no se repite');
});
ok('no repite algo que el jugador ya domina, ni golpes viejos (fuera de la ventana de 30 s)', () => {
  const S = mundo({ tutoVisto: { tajo: 1 } }), L = [tut('tajo', null, () => true)]; N1guia.iniciar(S);
  dano(S, L); dano(S, L); avanzar(S, L, 3); assert.strictEqual(S.guia.act, null);
  const S2 = mundo({ tutoVisto: { ritmo: 1 } }), L2 = [tut('ritmo')]; N1guia.iniciar(S2);
  dano(S2, L2); avanzar(S2, L2, 31); dano(S2, L2); avanzar(S2, L2, 2); assert.strictEqual(S2.guia.act, null);
});
ok('curarse (la vida sube) no cuenta como golpe', () => {
  const S = mundo({ tutoVisto: { ritmo: 1 } }), L = [tut('ritmo')]; N1guia.iniciar(S); S.h.vida = 3; avanzar(S, L, .1); S.h.vida = 2; avanzar(S, L, .1);
  const antes = S.guia.ev.length; S.h.vida = 5; avanzar(S, L, .1); assert.strictEqual(S.guia.ev.length, antes);
});

console.log('Guía · pasos del aprendiz');
ok('jugador nuevo: 4 pasos, se van encendiendo; al terminar desaparecen', () => {
  const S = mundo(), hechos = { mover: false, saltar: false, tajo: false, apuntar: false };
  const L = Object.keys(hechos).map(id => tut(id, () => false, () => hechos[id])); N1guia.iniciar(S);
  let st = N1guia.pasos(S, L); assert.strictEqual(st.length, 4); assert(st[0].actual && !st[0].hecho);
  hechos.mover = true; st = N1guia.pasos(S, L); assert(st[0].hecho && st[1].actual && !st[0].actual);
  hechos.saltar = hechos.tajo = hechos.apuntar = true; avanzar(S, L, 1); st = N1guia.pasos(S, L); assert(st && st.every(p => p.hecho) && !st.some(p => p.actual));
  avanzar(S, L, 2); assert.strictEqual(N1guia.pasos(S, L), null);
});
ok('jugador que ya los vio todos: no hay pasos', () => {
  const S = mundo({ tutoVisto: { mover: 1, saltar: 1, tajo: 1, apuntar: 1 } }); N1guia.iniciar(S); assert.strictEqual(N1guia.pasos(S, []), null);
});

console.log('Guía · objetivos y dibujo');
// un canvas falso que acepta cualquier llamada (para comprobar que dibujar no lanza errores)
const lienzo = () => { const pila = []; const cx = new Proxy({}, {
  get: (t, k) => k in t ? t[k] : k === 'measureText' ? s => ({ width: String(s).length * 9 }) : (/** @type {any[]} */ ...a) => { if (k === 'save') pila.push(1); if (k === 'restore') pila.pop(); return { addColorStop() {} }; },
  set: (t, k, v) => { t[k] = v; return true; } }); /** @type {any} */ (cx).__pila = pila; return cx; };
const mundoLleno = (movil) => mundo({
  movil, enemigos: [{ kind: 'ninja', x: 900, y: 560, vivo: true }, { kind: 'arquero', x: 1000, y: 560, vivo: true }, { kind: 'escarabajo', x: 1100, y: 560, vivo: true }, { kind: 'oni', x: 1300, y: 560, vivo: true }],
  items: [{ tipo: 'frasco', x: 800, y: 500, tomado: false }, { tipo: 'llave', x: 820, y: 500, tomado: false }],
  N: { elem: [{ t: 'carreta', x: 900, y: 560, w: 150 }, { t: 'palanca', x: 920, y: 400, on: false }, { t: 'viento', x: 950, y: 40, w: 190, h: 520 }, { t: 'tela', x: 960, y: 440, w: 120, roto: false }, { t: 'npc', who: 'tanuki', x: 980 }],
    tambores: [{ x: 900, y: 550 }], muros: [{ x: 1000, y: 300, w: 80, h: 260, rompible: true, roto: false }], deco: [{ x: 900, premio: true, abierto: false }] } });
ok('cada ayuda con objetivo lo encuentra en un mundo que lo tiene (y el jefe Oni no es objetivo del tajo)', () => {
  const S = mundoLleno(false);
  Object.keys(N1guia.ESPEC).forEach(id => { const sp = N1guia.ESPEC[id]; if (!sp.obj) return; const p = sp.obj(S); assert(p && isFinite(p.x) && isFinite(p.y), id + ' sin objetivo'); });
  assert.strictEqual(N1guia.ESPEC.tajo.obj(S).x, 900);
  const vacio = mundo(); Object.keys(N1guia.ESPEC).forEach(id => { const sp = N1guia.ESPEC[id]; if (sp.obj) assert.strictEqual(sp.obj(vacio), null, id + ' debe dar null si no hay nada'); });
});
ok('dibujar todas las ayudas (teclado y celular) no falla y deja el lienzo balanceado', () => {
  [false, true].forEach(movil => Object.keys(N1guia.ESPEC).forEach(id => {
    const S = mundoLleno(movil), L = [tut(id)]; N1guia.iniciar(S); N1guia.actualizar(S, 5, L); N1guia.actualizar(S, .1, L);
    assert(S.guia.act && S.guia.act.id === id, id); const cx = lienzo(); const caja = () => {};
    [0, .1, .5, 1.3, 4].forEach(t => { S.guia.act.t = t; N1guia.hud(cx, caja, S); }); assert.strictEqual(cx.__pila.length, 0, id + ': save/restore desparejos');
  }));
});
ok('dibujar con destello y con pasos, y no dibujar la burbuja al apuntar', () => {
  const S = mundoLleno(false), L = [tut('tajo', null, () => S.tajos > 0)]; N1guia.iniciar(S); avanzar(S, L, 1.2); S.tajos = 1; avanzar(S, L, .4);
  const cx = lienzo(); N1guia.hud(cx, () => {}, S); S.apunta = {}; N1guia.hud(cx, () => {}, S); assert.strictEqual(cx.__pila.length, 0);
});

console.log('Guía · conexión con el juego');
ok('motor.js, el cargador del juego y la página de desarrollo conocen la guía', () => {
  const m = leer('engine/nivel1/motor.js');
  ['N1guia.iniciar(S)', 'N1guia.actualizar(S, dt,', 'N1guia.hud(cx, caja, S)', 'e.dataset.k = tecla'].forEach(t => assert(m.includes(t), 'motor.js sin: ' + t));
  assert(/'director', 'guia'\]/.test(leer('engine/nivel1/perfil-ui.js')), 'perfil-ui.js no carga guia');
  assert(leer('nivel1.html').includes('engine/nivel1/guia.js'), 'nivel1.html no carga guia.js');
});
ok('si la guía falla, el motor conserva la tarjeta de texto de siempre (sigue ahí)', () => {
  const m = leer('engine/nivel1/motor.js'); assert(m.includes('if (S.tip && !S.apunta) {') && m.includes('S.tutoVisto[t.id] = 1; S.tip = null'));
});

console.log('\n' + n + ' pruebas OK');
