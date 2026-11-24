#!/usr/bin/env node
/**
 * Resuelve SOLO los choques "tontos" que quedan después de `git merge origin/main` (lo usa el asistente de avances).
 * Todo lo demás se deja intacto y el script termina con código 1 para que una persona lo mire.
 *
 * Lo que sabe resolver:
 *   · version.json            → gana la versión de main (la escribe GitHub sola al fusionar; nadie la edita a mano)
 *   · window.NJ_BUILD (index) → gana la de main (misma razón)
 *   · números de caché  ?v=N  → si dos ramas subieron el mismo número, se usa  mayor + 1  (así ningún teléfono se queda con la copia vieja)
 *   · listas de <script>/<link> → si las dos ramas SOLO añadieron líneas de este tipo, se conservan las de ambas
 *
 * Uso:  node tools/resolver-conflictos.js        (dentro del repo, con un merge a medias)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');

const git = (args, o) => spawnSync('git', args, Object.assign({ encoding: 'utf8' }, o || {}));
const HUNK = /^<<<<<<< [^\n]*\n([\s\S]*?)(?:^\|\|\|\|\|\|\| [^\n]*\n([\s\S]*?))?^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm;
const ES_TAG = /^\s*<(script|link)\b/;

const numerosV = (t) => (String(t).match(/\?v=(\d+)/g) || []).map(s => +s.slice(3));

/** Dos textos que solo se diferencian en los números ?v=N → el de main con cada número = mayor + 1. */
function unirNumerosV(nuestro, suyo) {
  const norm = (t) => String(t).replace(/\?v=\d+/g, '?v=#');
  if (norm(nuestro) !== norm(suyo)) return null;
  const a = numerosV(nuestro), b = numerosV(suyo);
  if (!a.length || a.length !== b.length) return null;
  let i = 0; return String(suyo).replace(/\?v=\d+/g, () => '?v=' + (Math.max(a[i], b[i++]) + 1));
}

/** Fusión línea por línea (solo HTML): cada <script>/<link> se identifica por su ruta, sin el ?v=. Solo acepta diferencias en etiquetas, NJ_BUILD y números ?v=. */
function fusionPorClaves(nuestro, base, suyo) {
  const L = (t) => String(t).split('\n').filter((x, i, arr) => !(i === arr.length - 1 && x === ''));
  const clave = (l) => { if (/NJ_BUILD/.test(l)) return 'NJ'; const m = l.match(/^\s*<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"'?]+)/); return m ? 'tag:' + m[1] : 'raw:' + l; };
  const mapa = (lineas) => { const cuenta = {}, m = new Map(), orden = []; for (const l of lineas) { let k = clave(l); cuenta[k] = (cuenta[k] || 0) + 1; if (cuenta[k] > 1) k += '#' + cuenta[k]; m.set(k, l); orden.push(k); } return { m, orden }; };
  const O = mapa(L(nuestro)), B = mapa(L(base)), T = mapa(L(suyo)), norm = (t) => String(t).replace(/\?v=\d+/g, '?v=#');
  const res = T.orden.slice(), linea = new Map(T.m), esTag = (k) => k.startsWith('tag:') || k === 'NJ';
  for (const k of T.orden) {                                             // claves de main
    if (O.m.has(k)) {
      const o = O.m.get(k), t = T.m.get(k), b = B.m.get(k);
      if (k === 'NJ') { linea.set(k, t); continue; }
      if (o === t) { if (b !== undefined && b !== o && norm(b) === norm(o) && numerosV(o).length) linea.set(k, unirNumerosV(o, t)); continue; }   // las dos ramas subieron el MISMO ?v=N: +1 para romper la caché de ambas
      if (b !== undefined && o === b) { linea.set(k, t); continue; } if (b !== undefined && t === b) { linea.set(k, o); continue; }
      const v = unirNumerosV(o, t); if (v === null) return null; linea.set(k, v);
    } else if (B.m.has(k)) {                                             // la rama la borró: solo vale si main no la tocó
      if (norm(T.m.get(k)) !== norm(B.m.get(k)) || !esTag(k)) return null; res.splice(res.indexOf(k), 1);
    } else if (!esTag(k)) return null;                                   // main añadió algo que no es una etiqueta
  }
  let previa = null;
  for (const k of O.orden) {                                             // claves que solo tiene la rama
    if (T.m.has(k)) { previa = k; continue; }
    if (B.m.has(k)) { if (norm(O.m.get(k)) !== norm(B.m.get(k)) || !esTag(k)) return null; continue; }   // main la borró
    if (!esTag(k)) return null;                                          // la rama añadió algo que no es una etiqueta
    res.splice(previa === null ? 0 : res.indexOf(previa) + 1, 0, k); linea.set(k, O.m.get(k)); previa = k;
  }
  return res.map(k => linea.get(k)).join('\n') + '\n';
}

/** Resuelve UN trozo en conflicto. nuestro = tu rama, suyo = main, base = ancestro (solo con diff3). Devuelve texto o null. */
function resolverTrozo(nuestro, base, suyo, archivo) {
  if (nuestro === suyo) return nuestro;
  const v = unirNumerosV(nuestro, suyo); if (v !== null) return v;
  if (/NJ_BUILD/.test(nuestro) && /NJ_BUILD/.test(suyo) && nuestro.trim().split('\n').length === 1 && suyo.trim().split('\n').length === 1) return suyo;   // solo si el trozo ES esa línea
  if (base !== undefined && /\.html?$/.test(archivo || '')) { const f = fusionPorClaves(nuestro, base, suyo); if (f !== null) return f; }
  return null;
}

/** Resuelve un archivo entero. Devuelve {texto, sinResolver} (sinResolver = cuántos trozos quedaron). */
function resolverTexto(texto, archivo) {
  let sin = 0;
  const out = texto.replace(HUNK, (todo, nuestro, base, suyo) => { const r = resolverTrozo(nuestro, base, suyo, archivo); if (r === null) { sin++; return todo; } return r; });
  return { texto: out, sinResolver: sin };
}

function main() {
  const lista = (git(['diff', '--name-only', '--diff-filter=U']).stdout || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!lista.length) { console.log('No hay choques que resolver.'); return 0; }
  const pendientes = [];
  for (const f of lista) {
    if (f === 'version.json') { git(['checkout', '--theirs', '--', f]); git(['add', f]); console.log('✔ ' + f + ': se queda la versión de main'); continue; }
    let txt; try { txt = fs.readFileSync(f, 'utf8'); } catch (e) { pendientes.push(f + ' (archivo borrado/movido en una de las ramas)'); continue; }
    const r = resolverTexto(txt, f);
    if (r.sinResolver) { pendientes.push(f + ' (' + r.sinResolver + ' trozo' + (r.sinResolver > 1 ? 's' : '') + ' con cambios reales de las dos ramas)'); continue; }
    fs.writeFileSync(f, r.texto); git(['add', f]); console.log('✔ ' + f + ': choques automáticos resueltos');
  }
  if (pendientes.length) { console.log('\n✘ Necesitan una persona:\n' + pendientes.map(p => '   · ' + p).join('\n')); return 1; }
  return 0;
}

module.exports = { resolverTrozo, resolverTexto, unirNumerosV };
if (require.main === module) process.exit(main());
