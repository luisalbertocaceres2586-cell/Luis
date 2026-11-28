// Pruebas de los mundos: ningún mundo está bloqueado por progreso. Ejecutar:  node tests/candados.test.js
const assert = require('assert');
globalThis.MundosRegistro = require('../engine/ui/mundos-registro.js');
const Sel = require('../engine/ui/selector-mundos.js');
const Reg = globalThis.MundosRegistro;
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const bloq = p => Object.fromEntries(Object.entries(Reg.candados(p)).map(([k, v]) => [k, v.bloqueado]));

console.log('Mundos siempre abiertos');
ok('jugador nuevo: todos los mundos están abiertos', () => {
  assert.deepStrictEqual(bloq({}), { senda: false, viaje: false, farolillos: false, negativo: false });
  assert.doesNotThrow(() => Reg.candados(null));
});
ok('ningún mundo pide terminar otro antes', () => {
  Object.values(Reg.candados({})).forEach(c => { assert.strictEqual(c.requiere, null); assert.strictEqual(c.requiereNombre, null); });
});
ok('el selector no marca ningún mundo como bloqueado por candado', () => {
  const e = Sel.estado({ id: 'a', nombre: 'A', avatar: 'sakura', progreso: {} });
  e.forEach(x => assert.notStrictEqual(x.prog.candado, true));
  assert.strictEqual(e.find(x => x.mundo.id === 'viaje').prog.estado, 'nuevo');
  assert.strictEqual(e.find(x => x.mundo.id === 'farolillos').prog.estado, 'nuevo');
});
ok('la sugerencia "siguiente" sigue apuntando al primer mundo sin terminar', () => {
  assert.strictEqual(Sel.siguiente({ id: 'a', progreso: {} }), 'senda');
  assert.strictEqual(Sel.siguiente({ id: 'a', progreso: {}, nivel1: { completados: 1 } }), 'viaje');
});
console.log('\n' + n + ' pruebas OK');
