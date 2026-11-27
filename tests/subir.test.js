// «npm run subir» (tools/subir.js): se prueba con repositorios git reales — un origen y dos copias que hacen de dos pestañas/sesiones.
const assert = require('assert'); const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawnSync } = require('child_process');
const SUBIR = path.join(__dirname, '..', 'tools', 'subir.js');
let n = 0; const ok = (t, f) => { f(); n++; console.log('  ✓ ' + t); };
const run = (cwd, cmd, args, env) => spawnSync(cmd, args, { cwd, encoding: 'utf8', env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0', SIN_CHEQUEOS: '1' }, env || {}) });
const git = (cwd, ...a) => { const r = run(cwd, 'git', a); assert.strictEqual(r.status, 0, 'git ' + a.join(' ') + ' → ' + r.stderr); return (r.stdout || '').trim(); };
const subir = (cwd, ...a) => run(cwd, 'node', [SUBIR, ...a]);

function escenario() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'subir-test-')), origen = path.join(raiz, 'origen.git');
  git(raiz, 'init', '-q', '--bare', '-b', 'main', origen);
  const clonar = (nombre) => { const d = path.join(raiz, nombre); git(raiz, 'clone', '-q', origen, d); git(d, 'config', 'user.name', 'Pestaña ' + nombre); git(d, 'config', 'user.email', nombre + '@prueba.local'); git(d, 'checkout', '-q', '-B', 'main'); return d; };
  const A = clonar('A'); fs.writeFileSync(path.join(A, 'leeme.txt'), 'uno\ndos\ntres\n'); fs.writeFileSync(path.join(A, 'version.json'), '{"v":"0"}\n');
  git(A, 'add', '-A'); git(A, 'commit', '-q', '-m', 'inicio'); git(A, 'push', '-q', '-u', 'origin', 'main');
  return { raiz, origen, A, B: clonar('B'), limpiar: () => fs.rmSync(raiz, { recursive: true, force: true }) };
}
const enOrigen = (e, archivo) => git(e.raiz, '--git-dir', e.origen, 'show', 'main:' + archivo);

console.log('subir');
ok('sube cambios sin guardar a main y deja la copia local igual que el origen', () => {
  const e = escenario(); try {
    fs.writeFileSync(path.join(e.A, 'nuevo.txt'), 'hola\n'); const r = subir(e.A, 'agrego nuevo.txt');
    assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.strictEqual(enOrigen(e, 'nuevo.txt'), 'hola');
    assert.strictEqual(git(e.A, 'rev-parse', 'HEAD'), git(e.A, 'rev-parse', 'origin/main')); assert.strictEqual(git(e.A, 'status', '--porcelain'), '');
    assert.strictEqual(git(e.A, 'log', '-1', '--format=%s'), 'agrego nuevo.txt');
  } finally { e.limpiar(); }
});
ok('desde una rama también sube a main, sin borrar la rama ni tocar otras', () => {
  const e = escenario(); try {
    git(e.A, 'checkout', '-q', '-b', 'mi-tarea'); fs.writeFileSync(path.join(e.A, 'tarea.txt'), 'x\n'); const r = subir(e.A, 'tarea');
    assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.strictEqual(enOrigen(e, 'tarea.txt'), 'x');
    assert.strictEqual(git(e.A, 'rev-parse', '--abbrev-ref', 'HEAD'), 'mi-tarea'); assert.ok(git(e.raiz, '--git-dir', e.origen, 'branch').split('\n').length === 1, 'no crea ramas en el origen');
  } finally { e.limpiar(); }
});
ok('si main avanzó con otra cosa, mezcla y sube sin perder nada de nadie', () => {
  const e = escenario(); try {
    fs.writeFileSync(path.join(e.B, 'de-b.txt'), 'b\n'); assert.strictEqual(subir(e.B, 'cambio de B').status, 0);
    fs.writeFileSync(path.join(e.A, 'de-a.txt'), 'a\n'); const r = subir(e.A, 'cambio de A'); assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    assert.strictEqual(enOrigen(e, 'de-a.txt'), 'a'); assert.strictEqual(enOrigen(e, 'de-b.txt'), 'b');
  } finally { e.limpiar(); }
});
ok('un choque «tonto» (version.json) se resuelve solo y gana el de main', () => {
  const e = escenario(); try {
    fs.writeFileSync(path.join(e.B, 'version.json'), '{"v":"de-main"}\n'); assert.strictEqual(subir(e.B, 'version de main').status, 0);
    fs.writeFileSync(path.join(e.A, 'version.json'), '{"v":"mia"}\n'); fs.writeFileSync(path.join(e.A, 'otra.txt'), 'o\n'); const r = subir(e.A, 'mi version');
    assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.strictEqual(enOrigen(e, 'version.json'), '{"v":"de-main"}'); assert.strictEqual(enOrigen(e, 'otra.txt'), 'o');
  } finally { e.limpiar(); }
});
ok('un choque REAL no sube nada, aborta limpio y conserva el trabajo local', () => {
  const e = escenario(); try {
    fs.writeFileSync(path.join(e.B, 'leeme.txt'), 'uno\nDOS DE B\ntres\n'); assert.strictEqual(subir(e.B, 'b toca dos').status, 0);
    const antes = enOrigen(e, 'leeme.txt'); fs.writeFileSync(path.join(e.A, 'leeme.txt'), 'uno\nDOS DE A\ntres\n'); const r = subir(e.A, 'a toca dos');
    assert.notStrictEqual(r.status, 0, 'debe fallar'); assert.ok(/NO sub[ií] nada/.test(r.stdout), r.stdout); assert.ok(/leeme\.txt/.test(r.stdout), 'nombra el archivo: ' + r.stdout);
    assert.strictEqual(enOrigen(e, 'leeme.txt'), antes, 'el origen no cambió'); assert.strictEqual(git(e.A, 'status', '--porcelain'), '', 'sin merge a medias');
    assert.ok(git(e.A, 'show', 'HEAD:leeme.txt').includes('DOS DE A'), 'tu commit sigue en tu rama'); assert.ok(!fs.existsSync(path.join(e.A, '.git', 'MERGE_HEAD')));
  } finally { e.limpiar(); }
});
ok('--probar hace todo menos subir', () => {
  const e = escenario(); try {
    fs.writeFileSync(path.join(e.A, 'solo-prueba.txt'), 'p\n'); const antes = git(e.raiz, '--git-dir', e.origen, 'rev-parse', 'main'); const r = subir(e.A, '--probar');
    assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.strictEqual(git(e.raiz, '--git-dir', e.origen, 'rev-parse', 'main'), antes); assert.ok(/no sub[ií] nada/i.test(r.stdout));
  } finally { e.limpiar(); }
});
ok('sin nada nuevo no hace commits vacíos y sale bien', () => {
  const e = escenario(); try { const r = subir(e.A); assert.strictEqual(r.status, 0, r.stdout + r.stderr); assert.ok(/nada nuevo/i.test(r.stdout)); } finally { e.limpiar(); }
});
ok('se niega con un merge a medias o sin rama, sin tocar nada', () => {
  const e = escenario(); try {
    const sha = git(e.A, 'rev-parse', 'HEAD'); git(e.A, 'checkout', '-q', '--detach'); const r = subir(e.A); assert.notStrictEqual(r.status, 0); assert.ok(/HEAD suelto/.test(r.stdout));
    git(e.A, 'checkout', '-q', 'main'); fs.writeFileSync(path.join(e.A, '.git', 'MERGE_HEAD'), sha + '\n'); const r2 = subir(e.A); assert.notStrictEqual(r2.status, 0); assert.ok(/merge\/rebase a medias/.test(r2.stdout));
  } finally { e.limpiar(); }
});
ok('si los chequeos fallan no sube (usa un revisar-avance.sh que falla)', () => {
  // con SIN_CHEQUEOS=0 llama al revisar-avance.sh real; el «npm run typecheck» de este repo de juguete falla a propósito
  const e = escenario(); try {
    fs.mkdirSync(path.join(e.A, 'node_modules')); fs.writeFileSync(path.join(e.A, 'package.json'), JSON.stringify({ scripts: { typecheck: 'exit 1', test: 'exit 0' } })); fs.writeFileSync(path.join(e.A, 'x.txt'), 'x\n');
    const antes = git(e.raiz, '--git-dir', e.origen, 'rev-parse', 'main');
    const r2 = run(e.A, 'node', [SUBIR, 'con tipos rotos'], { SIN_CHEQUEOS: '0' }); assert.notStrictEqual(r2.status, 0, r2.stdout); assert.ok(/Fallaron los chequeos|fallan los tipos/.test(r2.stdout), r2.stdout);
    assert.strictEqual(git(e.raiz, '--git-dir', e.origen, 'rev-parse', 'main'), antes, 'no subió');
  } finally { e.limpiar(); }
});
console.log(n + ' pruebas OK');
