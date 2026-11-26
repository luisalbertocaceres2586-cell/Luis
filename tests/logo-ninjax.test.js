// Logo "NINJA X: Guardianes de las Tablas" (capas): que existan todos los recursos que usa y que ningún lugar siga apuntando al logo viejo. Ejecutar: node tests/logo-ninjax.test.js
const assert = require('assert'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'); let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');
console.log('Logo NINJA X');
ok('todos los recursos que arma logo-ninjax.js existen', () => {
  const js = leer('engine/ui/logo-ninjax.js'), usados = new Set([...js.matchAll(/'([a-z_]+\.webp)'/g)].map(m => m[1]));
  ['fx_destello', 'fx_polvo', 'fx_chispas'].forEach(f => usados.add(f + '.webp'));
  assert.ok(usados.size >= 8, 'se esperaban al menos 8 recursos, hay ' + usados.size);
  usados.forEach(f => assert.ok(fs.existsSync(path.join(raiz, 'assets/logo-ninja-x', f)), 'falta assets/logo-ninja-x/' + f));
  assert.ok(fs.existsSync(path.join(raiz, 'assets/logo-ninja-x/logo_completo.webp')));
});
ok('el CSS apunta a recursos que existen (máscara del brillo y pétalo)', () => {
  const css = leer('engine/ui/logo-ninjax.css');
  assert.ok(fs.existsSync(path.join(raiz, 'assets/logo-ninja-x/ninja.webp')) && css.includes('assets/logo-ninja-x/ninja.webp'));
  assert.ok(fs.existsSync(path.join(raiz, 'assets/intro-premium/petalo_sakura.png')) && css.includes('petalo_sakura.png'));
});
ok('ningún archivo del juego usa ya el logo viejo "Ninja Multiplicación"', () => {
  const lugares = ['index.html', 'engine/ui/intro-2026.js', 'manifest.json', 'engine/legal.js'];
  lugares.forEach(f => { const t = leer(f); assert.ok(!t.includes('67423bd03d'), f + ' todavía apunta al logo viejo'); assert.ok(!/Ninja Multiplicaci/i.test(t.replace(/\/\*[\s\S]*?\*\//g, '')), f + ' todavía dice "Ninja Multiplicación"'); });
});
ok('index.html trae el logo en capas y carga su CSS y JS', () => {
  const h = leer('index.html');
  assert.ok(/id="introTitle" class="nxl"/.test(h) && h.includes('logo-ninjax.css') && h.includes('logo-ninjax.js'));
});
console.log('\n' + n + ' pruebas OK');
