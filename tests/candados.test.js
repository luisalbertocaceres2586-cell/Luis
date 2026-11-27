// Pruebas de los candados por progreso de los mundos. Ejecutar:  node tests/candados.test.js
const assert = require('assert');
globalThis.MundosRegistro = require('../engine/ui/mundos-registro.js');
const Sel = require('../engine/ui/selector-mundos.js');
const Reg = globalThis.MundosRegistro;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const bloq = p => Object.fromEntries(Object.entries(Reg.candados(p)).map(([k, v]) => [k, v.bloqueado]));

console.log('Candados por progreso');
ok('jugador nuevo: solo el Mundo 1 está abierto', () => {
  assert.deepStrictEqual(bloq({}), { senda: false, viaje: true, farolillos: true, negativo: true });
  assert.doesNotThrow(() => Reg.candados(null));
});
ok('terminar el Mundo 1 abre el Mundo 2 (y solo ese)', () => {
  assert.deepStrictEqual(bloq({ nivel1: { completados: 1 } }), { senda: false, viaje: false, farolillos: true, negativo: true });
});
ok('terminar todos abre el final', () => {
  const p = { nivel1: { completados: 1 }, nivel2: { completados: 1 }, nivel3: { completado: true } };
  assert.deepStrictEqual(bloq(p), { senda: false, viaje: false, farolillos: false, negativo: false });
});
ok('un mundo ya empezado nunca se bloquea (jugadores que ya tenían progreso)', () => {
  assert.strictEqual(bloq({ nivel3: { intentos: 2 } }).farolillos, false);
});
ok('modo libre abre todo', () => {
  assert.ok(Object.values(bloq({ mundos: { libre: true } })).every(b => !b));
});
ok('indica qué mundo hay que terminar', () => {
  const c = Reg.candados({}); assert.strictEqual(c.viaje.requiere, 'senda'); assert.strictEqual(c.negativo.requiere, 'farolillos');
  assert.strictEqual(c.senda.requiere, null);
});
ok('el selector marca el estado "bloqueado" con candado y lo distingue de "Próximamente"', () => {
  const e = Sel.estado({ id: 'a', nombre: 'A', avatar: 'sakura', progreso: {} });
  const v = e.find(x => x.mundo.id === 'viaje').prog;
  assert.strictEqual(v.estado, 'bloqueado'); assert.strictEqual(v.candado, true); assert.ok(v.requiereNombre);
  assert.strictEqual(e.find(x => x.mundo.id === 'senda').prog.estado, 'nuevo');
});
ok('la sugerencia "siguiente" nunca apunta a un mundo bloqueado', () => {
  assert.strictEqual(Sel.siguiente({ id: 'a', progreso: {} }), 'senda');
  assert.strictEqual(Sel.siguiente({ id: 'a', progreso: {}, nivel1: { completados: 1 } }), 'viaje');
});
console.log('\n' + n + ' pruebas OK');
