/**
 * Encuentra qué archivos de /assets usa realmente el juego (lee el código, no el disco).
 * Lo comparten generar_precache.js (lista para jugar sin internet) y presupuesto.js (control de peso).
 *
 * Cómo busca:
 *  1) Rutas completas escritas en el código:  'assets/nivel1/jefe/oni_caminar_8.png'
 *  2) Carpetas base + nombres sueltos en el mismo archivo (como manifest.js: "base": "assets/.../frames/" + "frames": [...]).
 *     Solo cuenta si el archivo existe de verdad en esa carpeta.
 * Lo que se arma con código en tiempo de ejecución ('hoja'+n+'.png') no se puede ver desde aquí:
 * eso lo sigue guardando sw.js a medida que se juega. Para forzar carpetas enteras: tools/precache-extra.json
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const EXT_ACTIVO = 'png|webp|jpg|jpeg|gif|svg|mp3|ogg|wav|json|woff2|woff|ttf';   // incluye fuentes (@font-face en los .css)
const EXT_CODIGO = new Set(['.html', '.js', '.css', '.json']);
// carpetas que NO forman parte del juego publicado en uso (arte fuente, documentación, herramientas…)
const IGNORAR_DIR = new Set(['node_modules', '.git', '.github', 'docs', 'tests', 'tools', 'types', 'servidor',
  '_originales', 'fuentes_originales', '_hojas_originales', '_previews']);
const NO_CODIGO = new Set(['sw.js', 'version.json', 'precache.json', 'package.json', 'package-lock.json',
  'tsconfig.json', 'tsconfig.basico.json']);
const MAX_ARCHIVO = 8 * 1024 * 1024; // mismo tope que sw.js

function recorrer(dir, cb, raiz = dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p, cb, raiz);
    else cb(p, path.relative(raiz, p).split(path.sep).join('/'));
  }
}

function existe(rel) {
  try { return fs.statSync(path.join(RAIZ, rel)).isFile(); } catch (e) { return false; }
}

/** Devuelve { activos:Set<ruta>, codigo:Set<ruta> } con rutas relativas a la raíz, usando "/" */
function referencias() {
  const activos = new Set();
  const codigo = new Set();
  const reRuta = new RegExp('assets/[A-Za-z0-9_./%\\-]+\\.(?:' + EXT_ACTIVO + ')', 'g');
  const reBase = /assets\/[A-Za-z0-9_./%\-]+\//g;
  const reNombre = new RegExp('["\']([A-Za-z0-9_%\\-][A-Za-z0-9_./%\\-]*\\.(?:png|webp|jpg|jpeg|gif|svg|mp3|ogg|wav))["\']', 'g');

  recorrer(RAIZ, (abs, rel) => {
    const ext = path.extname(rel).toLowerCase();
    if (!EXT_CODIGO.has(ext)) return;
    const base = path.basename(rel);
    if (!NO_CODIGO.has(base) && !rel.startsWith('assets/')) codigo.add(rel);
    let txt;
    try { txt = fs.readFileSync(abs, 'utf8'); } catch (e) { return; }
    for (const m of txt.match(reRuta) || []) { const r = decodeURI(m); if (existe(r)) activos.add(r); }
    const bases = [...new Set(txt.match(reBase) || [])].filter(b => { try { return fs.statSync(path.join(RAIZ, b)).isDirectory(); } catch (e) { return false; } });
    if (bases.length) {
      let m; reNombre.lastIndex = 0;
      const nombres = new Set();
      while ((m = reNombre.exec(txt))) nombres.add(m[1]);
      for (const b of bases) for (const n of nombres) { if (existe(b + n)) activos.add(b + n); }
    }
  });

  // series numeradas: si el código nombra 'coin_1.png' y arma el resto con un bucle ('coin_'+i+'.png'),
  // se completan las hermanas de la misma carpeta con el mismo prefijo y extensión (coin_2, coin_3, …)
  const listados = {};
  for (const a of [...activos]) {
    const m = /^(.*\/)([^/]*?)(\d+)(\.[a-z0-9]+)$/i.exec(a);
    if (!m) continue;
    const [, dir, pre, , ext] = m;
    if (!listados[dir]) { try { listados[dir] = fs.readdirSync(path.join(RAIZ, dir)); } catch (e) { listados[dir] = []; } }
    const re = new RegExp('^' + pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\d+' + ext.replace('.', '\\.') + '$', 'i');
    for (const n of listados[dir]) if (re.test(n)) activos.add(dir + n);
  }

  // carpetas pedidas a mano
  try {
    const extra = JSON.parse(fs.readFileSync(path.join(__dirname, 'precache-extra.json'), 'utf8'));
    for (const d of extra.carpetas || []) {
      const abs = path.join(RAIZ, d);
      if (fs.existsSync(abs)) recorrer(abs, (a, rel) => activos.add(d.replace(/\/$/, '') + '/' + path.relative(abs, a).split(path.sep).join('/')), abs);
    }
  } catch (e) { /* el archivo es opcional */ }

  // el SW no guarda archivos de más de 8 MB: no tiene sentido listarlos
  for (const a of [...activos]) { try { if (fs.statSync(path.join(RAIZ, a)).size > MAX_ARCHIVO) activos.delete(a); } catch (e) { activos.delete(a); } }
  return { activos, codigo };
}

const tam = rel => fs.statSync(path.join(RAIZ, rel)).size;

/** Lo que el jugador DESCARGA de verdad: si un .png tiene su .webp al lado, engine/core/webp.js pide el .webp (ver tools/convertir_webp.py). */
function referenciasServidas() {
  const { activos, codigo } = referencias();
  const servidos = new Set();
  for (const a of activos) {
    const w = a.replace(/\.png$/i, '.webp');
    servidos.add(w !== a && existe(w) ? w : a);
  }
  return { activos: servidos, codigo };
}

module.exports = { RAIZ, referencias, referenciasServidas, tam, MAX_ARCHIVO };
