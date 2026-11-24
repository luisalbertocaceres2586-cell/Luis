// Pruebas de las herramientas de trabajo en equipo (tools/flujo.js y tools/publicar-version.js).  node tests/flujo.test.js
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const F = require('../tools/flujo.js'); const V = require('../tools/publicar-version.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };

console.log('flujo.js');
ok('nombreRama limpia acentos, símbolos y largo', () => {
  assert.strictEqual(F.nombreRama('Mi Tarea Nº 3!'), 'mi-tarea-n-3');
  assert.strictEqual(F.nombreRama('  Árbol  ñandú '), 'arbol-nandu');
  assert.strictEqual(F.nombreRama('???'), '');
  assert.ok(F.nombreRama('x'.repeat(100)).length <= 40);
});
ok('enAmbos devuelve solo los archivos comunes, ordenados', () => {
  assert.deepStrictEqual(F.enAmbos(['b.js', 'a.js', 'c.js'], ['c.js', 'a.js', 'z.js']), ['a.js', 'c.js']);
  assert.deepStrictEqual(F.enAmbos([], ['a']), []);
});
ok('archivosEnConflicto lee la salida de git merge-tree', () => {
  const sal = 'abc123\nAuto-merging x.js\nCONFLICT (content): Merge conflict in types/globales.d.ts\nCONFLICT (content): Merge conflict in version.json\n';
  assert.deepStrictEqual(F.archivosEnConflicto(sal), ['types/globales.d.ts', 'version.json']);
  assert.deepStrictEqual(F.archivosEnConflicto('sin conflictos'), []);
});

console.log('publicar-version.js');
ok('calcularVersion: fecha UTC + 7 letras del commit', () => {
  assert.strictEqual(V.calcularVersion('ABCDEF1234567', new Date('2026-11-22T10:00:00Z')), '2026-11-22-abcdef1');
  assert.strictEqual(V.calcularVersion(undefined, new Date('2026-01-02T00:00:00Z')), '2026-01-02-local');
});
ok('aplicar escribe la MISMA versión en version.json e index.html y conserva el formato', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ver-'));
  fs.writeFileSync(path.join(d, 'version.json'), '{"v": "2026-11-21-zbx", "nota": "n"}\n');
  fs.writeFileSync(path.join(d, 'index.html'), '<html><script>window.NJ_BUILD="2026-11-21-k";</script><script>var otro="2026-11-21-k"</script></html>');
  const r = V.aplicar(d, '2026-11-22-abc1234');
  assert.deepStrictEqual(r.cambios.sort(), ['index.html', 'version.json']);
  assert.strictEqual(fs.readFileSync(path.join(d, 'version.json'), 'utf8'), '{"v": "2026-11-22-abc1234", "nota": "n"}\n');
  const h = fs.readFileSync(path.join(d, 'index.html'), 'utf8');
  assert.ok(h.includes('window.NJ_BUILD="2026-11-22-abc1234"') && h.includes('var otro="2026-11-21-k"'));
  assert.deepStrictEqual(V.aplicar(d, '2026-11-22-abc1234').cambios, []);      // repetir no cambia nada
  fs.writeFileSync(path.join(d, 'index.html'), '<html></html>');
  assert.throws(() => V.aplicar(d, 'x'), /NJ_BUILD/);                           // falla claro si falta la declaración
});
console.log('\n' + n + ' pruebas OK');
