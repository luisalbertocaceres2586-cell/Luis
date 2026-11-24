// Pruebas del robot de fusión (tools/fusionar-pr.js).  node tests/fusionar.test.js
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const F = require('../tools/fusionar-pr.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const M = (a, b) => `antes\n<<<<<<< HEAD\n${a}=======\n${b}>>>>>>> origin/main\ndespués\n`;

console.log('fusionar-pr.js (resolución de marcas)');
ok('dos pestañas agregan scripts distintos en el mismo sitio → se conservan ambos', () => {
  const r = F.resolverMarcas(M('<script src="a.js"></script>\n', '<script src="b.js"></script>\n'));
  assert.strictEqual(r.pendientes, 0); assert.strictEqual(r.resueltos, 1);
  assert.strictEqual(r.texto, 'antes\n<script src="a.js"></script>\n<script src="b.js"></script>\ndespués\n');
});
ok('mismo script con distinto ?v= → gana el número más alto, sin duplicar la etiqueta', () => {
  const r = F.resolverMarcas(M('<script src="engine/x.js?v=14"></script>\n', '<script src="engine/x.js?v=15"></script>\n'));
  assert.strictEqual(r.texto, 'antes\n<script src="engine/x.js?v=15"></script>\ndespués\n');
  const r2 = F.resolverMarcas(M('<script src="engine/x.js?v=16"></script>\n', '<script src="engine/x.js?v=15"></script>\n'));
  assert.strictEqual(r2.texto, 'antes\n<script src="engine/x.js?v=16"></script>\ndespués\n');
});
ok('la línea de NJ_BUILD toma la de main', () => {
  const r = F.resolverMarcas(M('<script>window.NJ_BUILD="2026-01-01-aaa";</script>\n', '<script>window.NJ_BUILD="2026-01-02-bbb";</script>\n'));
  assert.strictEqual(r.texto, 'antes\n<script>window.NJ_BUILD="2026-01-02-bbb";</script>\ndespués\n');
});
ok('un choque con código real NO se resuelve (se deja con marcas)', () => {
  const r = F.resolverMarcas(M('const a = 1;\n', '<script src="b.js"></script>\n'));
  assert.strictEqual(r.pendientes, 1); assert.strictEqual(r.resueltos, 0); assert.ok(F.hayMarcas(r.texto));
});
ok('varios choques: resuelve los seguros y deja el real', () => {
  const t = M('<link rel="stylesheet" href="a.css">\n', '<link rel="stylesheet" href="b.css">\n') + M('x = 1;\n', 'x = 2;\n');
  const r = F.resolverMarcas(t); assert.strictEqual(r.resueltos, 1); assert.strictEqual(r.pendientes, 1);
});
ok('acepta marcas estilo zdiff3 (con la sección base)', () => {
  const t = 'a\n<<<<<<< HEAD\n<script src="x.js"></script>\n||||||| base\n=======\n<script src="y.js"></script>\n>>>>>>> origin/main\nb\n';
  const r = F.resolverMarcas(t); assert.strictEqual(r.pendientes, 0);
  assert.strictEqual(r.texto, 'a\n<script src="x.js"></script>\n<script src="y.js"></script>\nb\n');
});

console.log('fusionar-pr.js unir (repositorios de prueba con git de verdad)');
const sh = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
function mundo() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'fus-')); const origen = path.join(raiz, 'origen.git'); const w = path.join(raiz, 'w');
  sh(raiz, ['init', '--bare', '-b', 'main', origen]); sh(raiz, ['clone', origen, w]);
  ['user.name', 'user.email'].forEach(k => sh(w, ['config', k, 'robot@test']));
  fs.writeFileSync(path.join(w, 'index.html'), '<head>\n<script src="base.js"></script>\n</head>\n<script>window.NJ_BUILD="v0";</script>\n');
  fs.writeFileSync(path.join(w, 'version.json'), '{"v":"v0"}\n'); fs.writeFileSync(path.join(w, 'codigo.js'), 'let x = 0;\n');
  sh(w, ['add', '-A']); sh(w, ['commit', '-m', 'base']); sh(w, ['push', 'origin', 'main']);
  return { w, run: (args) => spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'fusionar-pr.js'), ...args], { cwd: w, encoding: 'utf8' }) };
}
const escribe = (w, f, t) => fs.writeFileSync(path.join(w, f), t);
const lee = (w, f) => fs.readFileSync(path.join(w, f), 'utf8');
function ramaYMain(w, enRama, enMain) {      // enRama/enMain: {archivo: contenido}
  sh(w, ['checkout', '-b', 'pr']); Object.entries(enRama).forEach(([f, t]) => escribe(w, f, t)); sh(w, ['add', '-A']); sh(w, ['commit', '-m', 'rama']);
  sh(w, ['checkout', 'main']); Object.entries(enMain).forEach(([f, t]) => escribe(w, f, t)); sh(w, ['add', '-A']); sh(w, ['commit', '-m', 'main']); sh(w, ['push', 'origin', 'main']);
  sh(w, ['checkout', 'pr']);
}
ok('rama ya al día → código 0', () => { const { w, run } = mundo(); sh(w, ['checkout', '-b', 'pr']); assert.strictEqual(run(['unir']).status, 0); });
ok('sin choques → se une (0)', () => {
  const { w, run } = mundo(); ramaYMain(w, { 'nuevo1.txt': '1\n' }, { 'nuevo2.txt': '2\n' });
  assert.strictEqual(run(['unir']).status, 0); assert.ok(fs.existsSync(path.join(w, 'nuevo1.txt')) && fs.existsSync(path.join(w, 'nuevo2.txt')));
});
ok('version.json en choque → gana main y todo se une', () => {
  const { w, run } = mundo(); ramaYMain(w, { 'version.json': '{"v":"rama"}\n' }, { 'version.json': '{"v":"main"}\n' });
  const r = run(['unir']); assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.strictEqual(lee(w, 'version.json'), '{"v":"main"}\n');
});
ok('dos pestañas agregan su <script> en el mismo sitio de index.html → quedan los dos', () => {
  const { w, run } = mundo();
  ramaYMain(w, { 'index.html': '<head>\n<script src="base.js"></script>\n<script src="mia.js"></script>\n</head>\n<script>window.NJ_BUILD="v0";</script>\n' },
               { 'index.html': '<head>\n<script src="base.js"></script>\n<script src="otra.js"></script>\n</head>\n<script>window.NJ_BUILD="v0";</script>\n' });
  const r = run(['unir']); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const h = lee(w, 'index.html'); assert.ok(h.includes('mia.js') && h.includes('otra.js') && !/<<<<<<<|>>>>>>>/.test(h));
});
ok('conflicto real en código → código 2 y la rama queda intacta', () => {
  const { w, run } = mundo(); ramaYMain(w, { 'codigo.js': 'let x = 1;\n' }, { 'codigo.js': 'let x = 2;\n' });
  const antes = sh(w, ['rev-parse', 'HEAD']).stdout; const r = run(['unir']);
  assert.strictEqual(r.status, 2); assert.strictEqual(sh(w, ['rev-parse', 'HEAD']).stdout, antes); assert.strictEqual(lee(w, 'codigo.js'), 'let x = 1;\n');
  assert.strictEqual(sh(w, ['status', '--porcelain']).stdout.trim(), '');
});
ok('choque de index.html mezclado con código real → se cancela todo (2)', () => {
  const { w, run } = mundo();
  ramaYMain(w, { 'index.html': '<head>\n<script src="base.js"></script>\n</head>\nlet z = 1;\n' }, { 'index.html': '<head>\n<script src="base.js"></script>\n</head>\nlet z = 2;\n' });
  assert.strictEqual(run(['unir']).status, 2);
});
console.log(`\n${n} pruebas OK`);
