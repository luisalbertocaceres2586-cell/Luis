// Pruebas del resolvedor de choques automáticos (tools/resolver-conflictos.js): unitarias + un merge real en un repo temporal.
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const { resolverTrozo, resolverTexto, unirNumerosV } = require('../tools/resolver-conflictos.js');
let n = 0; const ok = (nombre, f) => { try { f(); n++; console.log('  ✓ ' + nombre); } catch (e) { console.log('  ✗ ' + nombre + '\n    ' + e.message); process.exitCode = 1; } };
console.log('Resolvedor de choques');

ok('números ?v=N: gana mayor + 1 en todas las líneas', () => {
  assert.strictEqual(unirNumerosV('<script src="a.js?v=5"></script>\n<script src="b.js?v=2"></script>\n', '<script src="a.js?v=6"></script>\n<script src="b.js?v=2"></script>\n'),
    '<script src="a.js?v=7"></script>\n<script src="b.js?v=3"></script>\n');
});
ok('números ?v=N: si el texto cambia de verdad, NO se resuelve', () => { assert.strictEqual(unirNumerosV('<script src="a.js?v=5"></script>', '<script src="OTRO.js?v=6"></script>'), null); });
ok('NJ_BUILD: gana el de main', () => { assert.strictEqual(resolverTrozo('window.NJ_BUILD="2026-01-01-aaaaaaa";\n', undefined, 'window.NJ_BUILD="2026-01-02-bbbbbbb";\n', 'index.html'), 'window.NJ_BUILD="2026-01-02-bbbbbbb";\n'); });
ok('listas de scripts: se conservan las líneas añadidas por las dos ramas', () => {
  const base = '<script src="a.js"></script>\n', nuestro = base + '<script src="mia.js"></script>\n', suyo = base + '<script src="suya.js"></script>\n';
  assert.strictEqual(resolverTrozo(nuestro, base, suyo, 'x.html'), base + '<script src="mia.js"></script>\n<script src="suya.js"></script>\n');
});
ok('listas de scripts: si una rama cambia código real, NO se resuelve', () => {
  const base = '<script src="a.js"></script>\n';
  assert.strictEqual(resolverTrozo(base + 'const x = 1;\n', base, base + '<script src="suya.js"></script>\n', 'x.html'), null);
});
ok('código JS con cambios distintos: NO se toca', () => { assert.strictEqual(resolverTexto('<<<<<<< HEAD\nlet a = 1;\n=======\nlet a = 2;\n>>>>>>> origin/main\n', 'x.js').sinResolver, 1); });

// ── merge real ──
const g = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-')), w = (f, t) => fs.writeFileSync(path.join(tmp, f), t), r = (f) => fs.readFileSync(path.join(tmp, f), 'utf8');
g(tmp, 'init', '-q', '-b', 'main'); g(tmp, 'config', 'user.email', 't@t'); g(tmp, 'config', 'user.name', 't');
const pagina = (extra, v) => '<html>\n<script>window.NJ_BUILD="' + v + '";</script>\n<script src="engine/a.js?v=5"></script>\n' + extra + '<script src="engine/z.js?v=1"></script>\n</html>\n';
w('version.json', '{"v": "base"}\n'); w('nivel.html', pagina('', 'base')); w('codigo.js', 'let a = 0;\n'); g(tmp, 'add', '-A'); g(tmp, 'commit', '-qm', 'base');
g(tmp, 'checkout', '-q', '-b', 'mia'); w('version.json', '{"v": "mia"}\n'); w('nivel.html', pagina('<script src="engine/mia.js"></script>\n', 'mia').replace('a.js?v=5', 'a.js?v=6')); g(tmp, 'commit', '-qam', 'mia');
g(tmp, 'checkout', '-q', 'main'); w('version.json', '{"v": "main"}\n'); w('nivel.html', pagina('<script src="engine/suya.js"></script>\n', 'main').replace('a.js?v=5', 'a.js?v=6')); g(tmp, 'commit', '-qam', 'main');
g(tmp, 'checkout', '-q', 'mia');
ok('merge real: version.json, NJ_BUILD, ?v= y scripts se resuelven solos', () => {
  const m = g(tmp, '-c', 'merge.conflictStyle=diff3', 'merge', '--no-edit', 'main'); assert.notStrictEqual(m.status, 0, 'debía haber conflicto');
  const res = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'resolver-conflictos.js')], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(res.status, 0, res.stdout + res.stderr);
  const html = r('nivel.html'); assert.ok(!/<<<<<<<|>>>>>>>/.test(html), 'quedaron marcas'); assert.ok(html.includes('mia.js') && html.includes('suya.js'), 'faltó un script');
  assert.ok(html.includes('NJ_BUILD="main"') && html.includes('a.js?v=7'), html); assert.strictEqual(r('version.json'), '{"v": "main"}\n');
  assert.strictEqual(g(tmp, '-c', 'core.editor=true', 'commit', '--no-edit').status, 0);
});
g(tmp, 'checkout', '-q', '-b', 'mia2', 'main~0'); g(tmp, 'checkout', '-q', '-B', 'x1', 'HEAD'); w('codigo.js', 'let a = 1;\n'); g(tmp, 'commit', '-qam', 'x1');
g(tmp, 'checkout', '-q', '-B', 'x2', 'main'); w('codigo.js', 'let a = 2;\n'); g(tmp, 'commit', '-qam', 'x2'); g(tmp, 'checkout', '-q', 'x1');
ok('merge real: un choque de código real NO se resuelve (código de salida 1)', () => {
  g(tmp, '-c', 'merge.conflictStyle=diff3', 'merge', '--no-edit', 'x2');
  const res = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'resolver-conflictos.js')], { cwd: tmp, encoding: 'utf8' });
  assert.strictEqual(res.status, 1, res.stdout); assert.ok(/codigo\.js/.test(res.stdout)); g(tmp, 'merge', '--abort');
});
fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n  ' + n + ' pruebas OK');
