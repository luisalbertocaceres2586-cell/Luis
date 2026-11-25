// Pruebas de la LÓGICA del selector de mundos (sin navegador). Ejecutar:  node tests/selector-mundos.test.js
const assert = require('assert');
globalThis.MundosRegistro = require('../engine/ui/mundos-registro.js');
const Sel = require('../engine/ui/selector-mundos.js');
const Reg = globalThis.MundosRegistro;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

const base = (extra) => Object.assign({ id: 'ana', nombre: 'Ana', avatar: 'sakura', progreso: { fase: 'easy', nivel: 0, puntos: 0 } }, extra);
const hoy = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ayer = () => { const h = new Date(), d = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

console.log('Registro de mundos');
ok('ids únicos y datos completos', () => {
  const ids = Reg.lista.map(m => m.id); assert.strictEqual(new Set(ids).size, ids.length);
  Reg.lista.forEach(m => { assert.ok(m.nombre && m.fases.length && m.cielo.length === 2, m.id); assert.ok(m.acento && m.acento2, m.id); });
});
ok('el Mundo 4 (negativo) es jugable y su progreso se deriva del perfil', () => {
  const m = Reg.obtener('negativo'); assert.ok(m && !m.bloqueado && /nivel4\.html/.test(m.url({ id: 'a', avatar: 'sakura' })));
  assert.strictEqual(m.progreso(null).estado, 'nuevo'); assert.strictEqual(m.progreso({ nivel4: { salaMax: 2 } }).estado, 'en_curso');
  assert.strictEqual(m.progreso({ nivel4: { completado: true, estrellas: 2 } }).estado, 'completado');
});

console.log('Estado derivado del perfil');
ok('jugador nuevo: todo "nuevo" y se sugiere La Senda', () => {
  const e = Sel.estado(base()); assert.strictEqual(e.find(x => x.mundo.id === 'senda').prog.estado, 'nuevo');
  assert.strictEqual(Sel.siguiente(base()), 'senda');
});
ok('nivel 1 completado → se sugiere el viaje; sin perfil no falla', () => {
  assert.strictEqual(Sel.siguiente(base({ nivel1: { completados: 1 } })), 'viaje');
  assert.doesNotThrow(() => Sel.estado(null));
});
ok('nivel 2 con estrellas y nivel 3 completado', () => {
  const p = base({ nivel1: { completados: 1 }, nivel2: { completados: 1, estrellas: 3 }, nivel3: { completado: true, estrellas: 2 } });
  const e = Object.fromEntries(Sel.estado(p).map(x => [x.mundo.id, x.prog]));
  assert.strictEqual(e.viaje.estado, 'completado'); assert.strictEqual(e.viaje.estrellas, 3); assert.strictEqual(e.farolillos.estado, 'completado');
  assert.strictEqual(Sel.siguiente(p), 'negativo');
});
ok('"en curso" cuando hay intentos sin terminar', () => { assert.strictEqual(Sel.estado(base({ nivel3: { intentos: 2 } })).find(x => x.mundo.id === 'farolillos').prog.estado, 'en_curso'); });
ok('Torneo Clásico solo si hay progreso antiguo', () => {
  assert.ok(!Sel.estado(base()).some(x => x.mundo.id === 'clasico'));
  assert.ok(Sel.estado(base({ progreso: { fase: 'easy', nivel: 2, puntos: 10 } })).some(x => x.mundo.id === 'clasico'));
});

console.log('Racha diaria');
ok('sin racha / activa hoy / en peligro (ayer) / rota', () => {
  assert.strictEqual(Sel.estadoRacha(base()).dias, 0);
  assert.deepStrictEqual(Sel.estadoRacha(base({ racha: { ultimo: hoy(), dias: 4, mejor: 6 } })), { dias: 4, activa: true, enPeligro: false, mejor: 6 });
  const p = Sel.estadoRacha(base({ racha: { ultimo: ayer(), dias: 4, mejor: 6 } })); assert.ok(p.enPeligro && !p.activa && p.dias === 4);
  assert.strictEqual(Sel.estadoRacha(base({ racha: { ultimo: '2020-01-01', dias: 9, mejor: 9 } })).dias, 0);
});

console.log('Dominio por tabla');
const mae = { '7x3': { a: 1, e: 2, caja: 0, t: 1 }, '7x6': { a: 1, e: 3, caja: 0, t: 2 }, '2x4': { a: 6, e: 0, caja: 4, t: 3 }, '5x7': { a: 4, e: 2, caja: 2, t: 5 }, '9x9': { a: 1, e: 1, caja: 0, t: 6 } };
ok('clasifica dominada / casi / practicar / sin datos', () => {
  const r = Object.fromEntries(Sel.resumenTablas(base({ maestria: mae })).map(x => [x.t, x]));
  assert.strictEqual(r[2].estado, 'dominada'); assert.strictEqual(r[5].estado, 'casi'); assert.strictEqual(r[7].estado, 'practicar'); assert.strictEqual(r[9].estado, 'sin_datos');
  assert.strictEqual(r[7].a, 2); assert.strictEqual(r[7].e, 5);
});
ok('la tabla más débil es la del 7; sin datos no hay recomendación', () => {
  assert.strictEqual(Sel.tablaDebil(base({ maestria: mae })).t, 7);
  assert.strictEqual(Sel.tablaDebil(base()), null);
});
ok('resumen para compartir menciona nombre, racha y la tabla a reforzar', () => {
  const t = Sel.textoResumen(base({ maestria: mae, racha: { ultimo: hoy(), dias: 3, mejor: 5 }, nivel1: { completados: 1 } }));
  assert.ok(t.includes('Ana') && t.includes('Racha: 3 días') && t.includes('tabla del 7') && t.includes('1 de 4'));
});

console.log('Perfiles.registrarHechos');
ok('suma aciertos/errores, limita cajas e ignora claves inválidas', () => {
  const Perfiles = require('../engine/nivel1/perfiles.js'); const m = {}; Perfiles.usarAlmacen({ getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => delete m[k] });
  const c = Perfiles.crear({ nombre: 'Luis', avatar: 'sakura' }); assert.ok(c.ok);
  Perfiles.registrarHechos(c.perfil.id, { '7x8': { a: 3, e: 0 }, xx: { a: 9, e: 9 } });
  Perfiles.registrarHechos(c.perfil.id, { '7x8': { a: 1, e: 2 } });
  const q = Perfiles.obtener(c.perfil.id).maestria; assert.strictEqual(q['7x8'].a, 4); assert.strictEqual(q['7x8'].e, 2); assert.strictEqual(q['7x8'].caja, 0); assert.ok(!('xx' in q));
});
console.log('\n' + n + ' pruebas del selector OK');
