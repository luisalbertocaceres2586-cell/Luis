#!/usr/bin/env node
/**
 * Ayudante del robot que fusiona los Pull Requests solo (.github/workflows/auto-fusionar.yml).
 *
 *   node tools/fusionar-pr.js unir     trae main a la rama actual y resuelve SOLO lo seguro:
 *                                      · version.json  → gana la versión de main (la escribe GitHub)
 *                                      · *.html        → choques en listas de <script>/<link>/NJ_BUILD (dos pestañas agregaron su línea
 *                                                        en el mismo sitio): se conservan AMBAS líneas; si las dos tocaron el mismo
 *                                                        archivo (distinto ?v=), gana el ?v= más alto
 *                                      cualquier otro choque (código, datos) NO se adivina: se cancela la unión y se avisa.
 *
 * Códigos de salida:  0 = unido (o ya estaba al día)   2 = hay conflictos reales (rama intacta, nada se pierde)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');

const git = (args, o) => spawnSync('git', args, Object.assign({ encoding: 'utf8', maxBuffer: 1 << 28 }, o || {}));
const out = (args) => (git(args).stdout || '').trim();

/** ¿Es una línea que se puede "sumar" sin riesgo? (etiqueta script/link, la línea de NJ_BUILD, un comentario HTML corto o una línea vacía) */
function lineaSegura(l) {
  return /^\s*$/.test(l) || /^\s*<(script|link)\b/i.test(l) || /window\.NJ_BUILD\s*=/.test(l) || /^\s*<!--.*-->\s*$/.test(l);
}
/** Ruta del archivo de una etiqueta <script src=…> / <link href=…> sin el "?v=". */
function claveEtiqueta(l) {
  const m = /(?:src|href)\s*=\s*["']([^"'?#]+)/i.exec(l); return m ? m[1] : null;
}
function numeroV(l) { const m = /[?&]v=(\d+)/.exec(l); return m ? +m[1] : -1; }

/** Junta los dos lados de un choque entre líneas seguras. null = no es seguro. */
function unirLados(ours, theirs) {
  const todas = ours.concat(theirs);
  if (!todas.every(lineaSegura)) return null;
  const res = ours.slice();
  for (const t of theirs) {
    if (/window\.NJ_BUILD\s*=/.test(t)) { const i = res.findIndex(x => /window\.NJ_BUILD\s*=/.test(x)); if (i >= 0) res[i] = t; else res.push(t); continue; }
    if (/^\s*$/.test(t)) continue;
    const k = claveEtiqueta(t);
    const i = k ? res.findIndex(x => claveEtiqueta(x) === k) : res.indexOf(t);
    if (i < 0) res.push(t);
    else if (k && numeroV(t) > numeroV(res[i])) res[i] = t;      // mismo archivo en los dos lados: gana el ?v= más alto
  }
  return res;
}

/**
 * Resuelve las marcas de conflicto de un texto (estilo normal o zdiff3).
 * @returns {{texto:string, resueltos:number, pendientes:number}}
 */
function resolverMarcas(texto) {
  const re = /^<<<<<<< [^\n]*\n([\s\S]*?)(?:^\|\|\|\|\|\|\| [^\n]*\n[\s\S]*?)?^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm;
  let resueltos = 0, pendientes = 0;
  const nuevo = texto.replace(re, (todo, a, b) => {
    const r = unirLados(a.split('\n').filter((x, i, arr) => !(i === arr.length - 1 && x === '')),
                        b.split('\n').filter((x, i, arr) => !(i === arr.length - 1 && x === '')));
    if (!r) { pendientes++; return todo; }
    resueltos++; return r.join('\n') + '\n';
  });
  return { texto: nuevo, resueltos, pendientes };
}

function hayMarcas(texto) { return /^(<<<<<<< |>>>>>>> )/m.test(texto); }

function cmdUnir() {
  git(['fetch', 'origin', 'main']);
  const detras = +out(['rev-list', '--count', 'HEAD..origin/main']);
  if (!detras) { console.log('Al día: la rama ya tiene todo lo de main.'); return 0; }
  const m = git(['merge', 'origin/main', '--no-edit', '-m', 'Unir main (robot de fusión)']);
  if (m.status === 0) { console.log(`Unido sin conflictos (${detras} commit(s) de main).`); return 0; }
  let conflictos = out(['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean);
  const reales = [];
  for (const f of conflictos) {
    if (f === 'version.json') { git(['checkout', '--theirs', '--', f]); git(['add', f]); console.log('version.json: gana la de main.'); continue; }
    if (/\.html?$/i.test(f)) {
      const r = resolverMarcas(fs.readFileSync(f, 'utf8'));
      if (!r.pendientes && !hayMarcas(r.texto)) { fs.writeFileSync(f, r.texto); git(['add', f]); console.log(`${f}: ${r.resueltos} choque(s) de líneas <script>/<link> resueltos conservando ambas.`); continue; }
    }
    reales.push(f);
  }
  if (reales.length) {
    git(['merge', '--abort']);
    console.log('CONFLICTO REAL en: ' + reales.join(', '));
    return 2;
  }
  const c = git(['commit', '--no-edit']);
  if (c.status !== 0) { git(['merge', '--abort']); console.log('No se pudo cerrar la unión: ' + (c.stderr || c.stdout)); return 2; }
  console.log('Unido y resuelto automáticamente.');
  return 0;
}

module.exports = { lineaSegura, claveEtiqueta, unirLados, resolverMarcas, hayMarcas };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd !== 'unir') { console.log('Uso: node tools/fusionar-pr.js unir'); process.exit(1); }
  process.exit(cmdUnir());
}
