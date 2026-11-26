// WebP: lógica de engine/core/webp.js + coherencia de lo que dejó tools/convertir_webp.py (mapa, archivos, html/css).
const fs = require('fs'); const path = require('path'); const assert = require('assert');
const R = path.resolve(__dirname, '..');
const { crear } = require('../engine/core/webp.js');

const W = crear({ 'assets/a/': ['uno', 'dos tres'], 'assets/b/c/': ['x'] });
// rutas sueltas
assert.strictEqual(W.una('assets/a/uno.png'), 'assets/a/uno.webp');
assert.strictEqual(W.una('./assets/a/uno.png?v=3'), './assets/a/uno.webp?v=3', 'conserva ?v= y ./');
assert.strictEqual(W.una('https://sitio.com/Luis/assets/b/c/x.PNG#frag'), 'https://sitio.com/Luis/assets/b/c/x.webp#frag');
assert.strictEqual(W.una('assets/a/otro.png'), 'assets/a/otro.png', 'sin webp → no se toca');
assert.strictEqual(W.una('assets/a/uno.jpg'), 'assets/a/uno.jpg', 'solo .png');
assert.strictEqual(W.una('assets/a/uno.png.bak'), 'assets/a/uno.png.bak');
assert.strictEqual(W.una('data:image/png;base64,assets/a/uno.png'), 'data:image/png;base64,assets/a/uno.png', 'data: no se toca');
assert.strictEqual(W.una(null), null); assert.strictEqual(W.una(''), '');
assert.strictEqual(W.una('assets/a/dos tres.png'), 'assets/a/dos tres.webp');
// texto con varias rutas (CSS / HTML)
assert.strictEqual(W.cad('url(assets/a/uno.png) , url("../assets/b/c/x.png"), url(assets/a/otro.png)'),
  'url(assets/a/uno.webp) , url("../assets/b/c/x.webp"), url(assets/a/otro.png)');
assert.strictEqual(W.cad('<img src="assets/a/uno.png"><img src=\'assets/a/uno.png\'>'), '<img src="assets/a/uno.webp"><img src=\'assets/a/uno.webp\'>');
assert.strictEqual(W.cad('sin rutas'), 'sin rutas'); assert.strictEqual(W.cad(5), 5);
assert(W.tiene('assets/a/uno.png') && !W.tiene('assets/a/zzz.png') && W.total() === 3);

// coherencia del repositorio
const m = fs.readFileSync(path.join(R, 'engine/core/webp-mapa.js'), 'utf8');
const mapa = JSON.parse(m.slice(m.indexOf('{'), m.lastIndexOf('}') + 1));
let n = 0, ahorro = 0, orig = 0;
for (const d in mapa) for (const nom of mapa[d]) {
  const png = path.join(R, d + nom + '.png'), webp = path.join(R, d + nom + '.webp');
  assert(fs.existsSync(png), 'el mapa lista ' + d + nom + ' pero falta el PNG (es el respaldo)');
  assert(fs.existsSync(webp), 'el mapa lista ' + d + nom + ' pero falta el .webp');
  const a = fs.statSync(png).size, b = fs.statSync(webp).size;
  assert(b < a, d + nom + ': el WebP no es más liviano que el PNG');
  n++; orig += a; ahorro += a - b;
}
assert(n > 100, 'el mapa parece vacío (' + n + ')');
// html/css: toda ruta .png que tenga webp debe estar reescrita; toda .webp referenciada debe existir
const pat = /assets\/[^"'()\s?#<>]*?\.(png|webp)/gi;
const archivos = fs.readdirSync(R).filter(f => f.endsWith('.html')).concat(fs.readdirSync(path.join(R, 'engine/ui')).filter(f => f.endsWith('.css')).map(f => 'engine/ui/' + f));
for (const f of archivos) {
  const t = fs.readFileSync(path.join(R, f), 'utf8'); let x;
  while ((x = pat.exec(t))) {
    const r = x[0];
    if (/\.png$/i.test(r)) assert(!W.tiene.call(null, r) || !crear(mapa).tiene(r), f + ': ' + r + ' tiene .webp y no se reescribió (ejecuta: npm run webp)');
    else assert(fs.existsSync(path.join(R, r)) || fs.existsSync(path.join(R, '..', r)) || /\.\.\//.test(t.slice(x.index - 6, x.index)), f + ': referencia a ' + r + ' que no existe');
  }
}
// cada página que carga imágenes trae el mapa y el intermediario ANTES que cualquier otro script
for (const f of ['index.html', 'nivel1.html', 'nivel2.html', 'nivel3.html', 'nivel4.html', 'mundos.html']) {
  const t = fs.readFileSync(path.join(R, f), 'utf8');
  const i = t.indexOf('<script'), j = t.indexOf('engine/core/webp-mapa.js'), k = t.indexOf('engine/core/webp.js');
  assert(j > 0 && k > j && t.lastIndexOf('<script', j) === i, f + ': webp-mapa.js y webp.js deben ir primero');
}
console.log(`webp OK: ${n} imágenes con WebP · ${(orig / 1048576).toFixed(1)} MB → ${((orig - ahorro) / 1048576).toFixed(1)} MB (${Math.round(100 * ahorro / orig)} % menos)`);
