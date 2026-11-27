// precache.json (lista para jugar sin internet) y su conexión con sw.js: estructura válida y coherente.
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const R = path.resolve(__dirname, '..');
const p = JSON.parse(fs.readFileSync(path.join(R, 'precache.json'), 'utf8'));
assert(Array.isArray(p.codigo) && Array.isArray(p.activos), 'precache.json: faltan codigo/activos');
assert(typeof p.v === 'string' && p.v.length >= 6, 'precache.json: falta la versión "v"');
assert(p.codigo.includes('index.html'), 'precache.json: index.html debe estar en "codigo"');
assert(!p.codigo.concat(p.activos).some(f => /^(\/|\.\.)|\\|_originales|fuentes_originales|node_modules/.test(f)), 'precache.json: rutas no permitidas (absolutas, con .. o de arte fuente)');
assert(!p.codigo.some(f => /^(sw\.js|version\.json|precache\.json)$/.test(f)), 'precache.json: sw.js, version.json y precache.json no se guardan nunca');
const MAX = 8 * 1024 * 1024; let faltan = 0;
for (const f of p.codigo.concat(p.activos)) {
  const a = path.join(R, f);
  if (!fs.existsSync(a)) { faltan++; continue; }          // puede pasar entre un cambio y la regeneración automática en main
  assert(fs.statSync(a).size <= MAX, f + ': pesa más de 8 MB y sw.js no lo guarda');
}
assert(faltan <= (p.codigo.length + p.activos.length) * 0.05, `precache.json apunta a ${faltan} archivos que ya no existen (ejecuta: node tools/generar_precache.js)`);
const sw = fs.readFileSync(path.join(R, 'sw.js'), 'utf8');
assert(/tipo === 'precargar'/.test(sw) && /async function precargar/.test(sw), 'sw.js: falta la precarga');
assert(!/version\.json/.test(JSON.stringify(p.codigo)), 'version.json nunca debe estar en la lista');
const reg = fs.readFileSync(path.join(R, 'engine/core/sw-registro.js'), 'utf8');
assert(/offline=1/.test(reg) && /saveData/.test(reg) && /cellular/.test(reg), 'sw-registro.js: la precarga debe ser opcional y respetar ahorro de datos / datos móviles');
console.log('precache OK:', p.codigo.length, 'código +', p.activos.length, 'recursos ≈', p.mb, 'MB');
