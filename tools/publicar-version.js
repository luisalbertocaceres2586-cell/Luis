#!/usr/bin/env node
/**
 * Escribe la MISMA versión en version.json y en window.NJ_BUILD (index.html).
 *
 * Por qué existe: version.json cambiaba en 1 de cada 3 commits y chocaba siempre que dos pestañas/personas trabajaban a la vez.
 * Ahora NADIE lo edita a mano: la acción de GitHub .github/workflows/publicar-version.yml lo genera al fusionar en main.
 * También sirve a mano:   npm run publicar            (usa el commit actual)
 *
 * Formato:  AAAA-MM-DD-<7 letras del commit>   (el juego solo compara que sea distinto al que tiene cargado)
 */
const fs = require('fs');
const path = require('path');

function calcularVersion(sha, ahora) {
  const d = (ahora || new Date()).toISOString().slice(0, 10);
  const s = String(sha || 'local').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 7) || 'local';
  return d + '-' + s;
}

/** Cambia la versión en los dos archivos conservando su formato. Devuelve {version, cambios:[archivos]} */
function aplicar(raiz, version) {
  const cambios = [];
  const pj = path.join(raiz, 'version.json'), pi = path.join(raiz, 'index.html');
  let j = fs.readFileSync(pj, 'utf8');
  if (!/("v"\s*:\s*")[^"]*(")/.test(j)) throw new Error('version.json no tiene el campo "v"');
  const j2 = j.replace(/("v"\s*:\s*")[^"]*(")/, '$1' + version + '$2');
  if (j2 !== j) { fs.writeFileSync(pj, j2); cambios.push('version.json'); }
  let h = fs.readFileSync(pi, 'utf8');
  const re = /(window\.NJ_BUILD\s*=\s*")[^"]*(")/;
  if (!re.test(h)) throw new Error('index.html no declara window.NJ_BUILD');
  const h2 = h.replace(re, '$1' + version + '$2');
  if (h2 !== h) { fs.writeFileSync(pi, h2); cambios.push('index.html'); }
  return { version, cambios };
}

module.exports = { calcularVersion, aplicar };

if (require.main === module) {
  const arg = process.argv.indexOf('--sha');
  let sha = arg > 0 ? process.argv[arg + 1] : process.env.GITHUB_SHA;
  if (!sha) { try { sha = require('child_process').execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch (e) { sha = 'local'; } }
  const r = aplicar(path.resolve(__dirname, '..'), calcularVersion(sha));
  console.log('Versión publicada: ' + r.version + (r.cambios.length ? '  (actualizados: ' + r.cambios.join(', ') + ')' : '  (ya estaba así)'));
}
