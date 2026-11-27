#!/usr/bin/env node
/**
 * Comprime los PNG de /assets SIN cambiar su aspecto ni su nombre (así no se rompe ninguna referencia del juego).
 *   · Por defecto: compresión SIN pérdida con optipng (los píxeles quedan idénticos).
 *   · --lossy: además, reduce a paleta con pngquant, pero SOLO si queda con calidad ≥ 85-100 y ahorra ≥ 25 %
 *              (pngquant se niega solo cuando la imagen perdería demasiado: fotos y degradados se quedan igual).
 *
 * Qué archivos:   --cambiados <rama>   los PNG añadidos/modificados frente a esa rama (lo usa el PR)
 *                 --usados             los PNG que usa el juego (precache.json)
 *                 --todo               todos los PNG de assets/ salvo los de arte fuente (_originales…)
 * Otros:          --dry                solo cuenta, no escribe
 * Requiere:       sudo apt-get install optipng pngquant
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { RAIZ } = require('./lib-referencias');

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const FUENTE = /\/(_originales|fuentes_originales|_hojas_originales|_previews)\//;

function tiene(bin) { return spawnSync(bin, ['--version'], { stdio: 'ignore' }).status === 0; }
if (!tiene('optipng')) { console.error('Falta optipng:  sudo apt-get install optipng pngquant'); process.exit(2); }
const hayQuant = flag('--lossy') && tiene('pngquant');

function archivos() {
  let l = [];
  const base = val('--cambiados');
  if (base) {
    const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', 'assets'], { cwd: RAIZ, encoding: 'utf8' });
    l = out.split('\n').filter(f => f.toLowerCase().endsWith('.png'));
  } else if (flag('--usados')) {
    l = JSON.parse(fs.readFileSync(path.join(RAIZ, 'precache.json'), 'utf8')).activos.filter(f => f.toLowerCase().endsWith('.png'));
  } else if (flag('--todo')) {
    (function rec(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) rec(p); else if (/\.png$/i.test(e.name)) l.push(path.relative(RAIZ, p).split(path.sep).join('/')); } })(path.join(RAIZ, 'assets'));
  } else { console.error('Indica qué optimizar: --cambiados <rama> | --usados | --todo   (más --lossy / --dry)'); process.exit(2); }
  return l.filter(f => f && !FUENTE.test('/' + f) && fs.existsSync(path.join(RAIZ, f)));
}

const lista = archivos();
let antes = 0, despues = 0, tocados = 0;
for (const f of lista) {
  const abs = path.join(RAIZ, f), o = fs.statSync(abs).size; antes += o;
  if (flag('--dry')) { despues += o; continue; }
  const tmp = abs + '.opt.tmp.png';
  fs.copyFileSync(abs, tmp);
  spawnSync('optipng', ['-quiet', '-o2', tmp], { stdio: 'ignore' });                    // sin pérdida
  let mejor = tmp;
  if (hayQuant) {
    const q = abs + '.q.tmp.png';
    const r = spawnSync('pngquant', ['--quality=85-100', '--speed', '3', '--force', '--output', q, tmp], { stdio: 'ignore' });
    if (r.status === 0 && fs.existsSync(q) && fs.statSync(q).size <= fs.statSync(tmp).size * 0.75) { spawnSync('optipng', ['-quiet', '-o2', q], { stdio: 'ignore' }); mejor = q; }
    else if (fs.existsSync(q)) fs.unlinkSync(q);
  }
  const n = fs.statSync(mejor).size;
  if (n < o) { fs.copyFileSync(mejor, abs); tocados++; despues += n; } else despues += o;
  for (const t of [tmp, abs + '.q.tmp.png']) if (fs.existsSync(t)) fs.unlinkSync(t);
}
const pct = antes ? Math.round(100 - 100 * despues / antes) : 0;
console.log(`${lista.length} PNG revisados · ${tocados} comprimidos · ${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(1)} MB (${pct}% menos)${flag('--dry') ? ' [simulación]' : ''}`);
if (process.env.GITHUB_STEP_SUMMARY && lista.length) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## 🖼️ Optimización de imágenes\n\n${lista.length} PNG revisados, ${tocados} comprimidos: **${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(1)} MB** (${pct}% menos)${hayQuant ? ' · modo con pérdida controlada' : ' · sin pérdida'}\n`);
