// Ejecuta todas las pruebas de Node (tests/*.test.js) y falla si alguna falla.   Uso:  npm test
const { readdirSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const archivos = readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let fallos = 0;
for (const f of archivos) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' });
  const ok = r.status === 0;
  console.log((ok ? '✓ ' : '✗ ') + f + (ok ? '' : '\n' + (r.stdout || '') + (r.stderr || '')));
  if (!ok) fallos++;
}
console.log('\n' + (archivos.length - fallos) + '/' + archivos.length + ' suites OK');
process.exit(fallos ? 1 : 0);
