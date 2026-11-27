#!/usr/bin/env node
/**
 * Lleva TUS cambios a main de forma segura, sin solicitudes (PR) ni robots que escriban en tus ramas:
 *
 *     npm run subir                         (guarda lo que tengas, lo pone al día con main, revisa y sube)
 *     npm run subir -- "qué cambié"         (igual, con tu mensaje para el commit)
 *     npm run subir -- --probar             (hace todo menos subir: para ver si saldría bien)
 *
 *   1. Si tienes cambios sin guardar, los guarda en un commit (nada se pierde).
 *   2. Trae lo último de main y lo mezcla. Los choques «tontos» (version.json, números ?v=N, listas de <script>) se resuelven solos
 *      con tools/resolver-conflictos.js; si hay un choque real NO sube nada, deja todo como estaba y te dice qué archivos son.
 *   3. Corre los chequeos (tipos, pruebas y, de los niveles que tocaste, el navegador).  SIN_CHEQUEOS=1 los omite.
 *   4. Sube a main SOLO si main no se movió mientras tanto; si se movió, repite desde el paso 2 (hasta 3 veces).
 *
 * Nunca fuerza el push, nunca borra ramas, nunca reescribe la historia: lo peor que puede pasar es que no suba y te lo explique.
 * Token: si tienes la variable de entorno GITHUB_TOKEN (o GH_TOKEN) se usa para hablar con GitHub sin guardarlo en ningún archivo.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REMOTO = process.env.REMOTO || 'origin';
const BASE = process.env.BASE || 'main';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const IDIOMA_RED = TOKEN ? ['-c', 'http.extraheader=AUTHORIZATION: basic ' + Buffer.from('x-access-token:' + TOKEN).toString('base64')] : [];

const colores = process.stdout.isTTY;
const c = (n, t) => (colores ? `\x1b[${n}m${t}\x1b[0m` : t);
const ok = (t) => console.log(c(32, '✔ ') + t);
const aviso = (t) => console.log(c(33, '⚠ ') + t);
const error = (t) => console.log(c(31, '✘ ') + t);
const paso = (t) => console.log(c(36, '▶ ') + t);

const quitarToken = (t) => (TOKEN ? String(t).split(TOKEN).join('***') : String(t));
const git = (args, o) => spawnSync('git', args, Object.assign({ encoding: 'utf8', env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }) }, o || {}));
const red = (args) => git([...IDIOMA_RED, ...args]);                 // comandos que hablan con GitHub (fetch/push)
const out = (args) => (git(args).stdout || '').trim();
const numero = (args) => parseInt(out(args), 10) || 0;

/** Copia de las herramientas: al mezclar main, git puede reemplazar los archivos de tools/ mientras corren; se trabaja con una copia. */
function copiarHerramientas() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'subir-'));
  fs.cpSync(__dirname, d, { recursive: true });
  return d;
}

function rutaGit(nombre) { return path.resolve(out(['rev-parse', '--git-dir']) || '.git', nombre); }

/** Mezcla origin/main en la rama actual. Devuelve true si quedó bien (con o sin choques tontos resueltos), false si hay un choque real. */
function ponerAlDia(herr) {
  const r = git(['-c', 'merge.conflictStyle=diff3', 'merge', '--no-edit', '-m', `Poner al día con ${BASE}`, `${REMOTO}/${BASE}`]);
  if (r.status === 0) { ok(`Puse tu trabajo al día con ${BASE}.`); return true; }
  const rs = spawnSync('node', [path.join(herr, 'resolver-conflictos.js')], { encoding: 'utf8' });
  if (rs.status === 0 && git(['-c', 'core.editor=true', 'commit', '-q', '--no-edit']).status === 0) {
    ok('Había choques «tontos» con ' + BASE + ' y los resolví solo:'); if (rs.stdout.trim()) console.log(rs.stdout.trimEnd());
    return true;
  }
  git(['merge', '--abort']);
  error(`Tu trabajo choca con ${BASE} en cambios reales de las dos partes. NO subí nada y tu rama quedó exactamente como estaba.`);
  const lista = (rs.stdout || '').trim() || (r.stdout || '').trim(); if (lista) console.log(lista);
  console.log(`   → Resuélvelo con:  npm run sincronizar   (luego vuelve a ejecutar  npm run subir )`);
  return false;
}

function chequeos(herr) {
  if (process.env.SIN_CHEQUEOS === '1') { aviso('Chequeos omitidos (SIN_CHEQUEOS=1).'); return true; }
  if (!fs.existsSync('node_modules')) { paso('Instalando dependencias (una sola vez)…'); spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { stdio: 'inherit', shell: process.platform === 'win32' }); }
  paso('Corriendo los chequeos (tipos, pruebas y navegador de lo que tocaste)…');
  const r = spawnSync('bash', [path.join(herr, 'revisar-avance.sh')], { stdio: 'inherit', env: Object.assign({}, process.env, { BASE, REMOTO }) });
  if (r.error) { aviso('No encontré «bash» en este equipo, así que no pude correr los chequeos. (En Windows usa Git Bash.) Sigo sin ellos.'); return true; }
  if (r.status !== 0) { error('Fallaron los chequeos: NO subí nada y tu rama sigue intacta. Arregla lo que dice arriba y vuelve a ejecutar  npm run subir.'); return false; }
  ok('Los chequeos pasaron.'); return true;
}

function main() {
  const args = process.argv.slice(2), soloProbar = args.includes('--probar'), mensaje = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (git(['rev-parse', '--git-dir']).status !== 0) { error('Esto no es un repositorio de git.'); return 1; }
  const rama = out(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (rama === 'HEAD') { error('Estás en «HEAD suelto» (sin rama). Crea una con:  npm run rama -- mi-tarea'); return 1; }
  if (['MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD'].some(f => fs.existsSync(rutaGit(f)))) {
    error('Hay un merge/rebase a medias. Termínalo (o aborta con  git merge --abort ) y vuelve a ejecutar  npm run subir.'); return 1;
  }

  // 1) guardar lo que haya sin guardar
  if (out(['status', '--porcelain'])) {
    git(['add', '-A']);
    const r = git(['commit', '-q', '-m', mensaje || 'Cambios guardados con npm run subir']);
    if (r.status !== 0) { error('No pude guardar tus cambios: ' + (r.stderr || r.stdout).trim()); return 1; }
    ok('Guardé tus cambios sin guardar en un commit (no se pierde nada).');
  }

  const herr = copiarHerramientas();
  try {
    for (let intento = 1; intento <= 3; intento++) {
      const f = red(['fetch', '-q', REMOTO, BASE]);
      if (f.status !== 0) { error(`No pude traer ${BASE} de GitHub: ${quitarToken(f.stderr).trim()}\n   → ¿Hay internet y el token es válido? (variable GITHUB_TOKEN)`); return 1; }
      const adelante = numero(['rev-list', '--count', `${REMOTO}/${BASE}..HEAD`]), atras = numero(['rev-list', '--count', `HEAD..${REMOTO}/${BASE}`]);
      if (adelante === 0) { ok(`No hay nada nuevo que subir: ${BASE} ya tiene todo lo tuyo.`); return 0; }
      if (atras > 0) { paso(`${BASE} tiene ${atras} cambio(s) nuevo(s); los mezclo con tu trabajo…`); if (!ponerAlDia(herr)) return 1; }
      if (!chequeos(herr)) return 1;
      if (soloProbar) { ok(`Todo bien. (Modo prueba: no subí nada. Para subir de verdad: npm run subir)`); return 0; }
      const p = red(['push', REMOTO, `HEAD:${BASE}`]);
      if (p.status === 0) { ok(`¡Subido a ${BASE}! (${numero(['rev-list', '--count', `${REMOTO}/${BASE}..HEAD`]) || adelante} commit(s) tuyos). GitHub publicará la versión en un par de minutos.`); red(['fetch', '-q', REMOTO, BASE]); return 0; }
      const msg = quitarToken((p.stderr || '') + (p.stdout || ''));
      if (/non-fast-forward|fetch first|rejected.*(fetch|behind)|stale info/i.test(msg) && !/protected branch|GH006|workflow/i.test(msg)) { aviso(`Mientras revisaba, ${BASE} cambió (otra pestaña subió algo). Reintento (${intento}/3)…`); continue; }
      error('GitHub no me dejó subir:\n' + msg.trim());
      if (/protected branch|GH006/i.test(msg)) console.log(`   → ${BASE} está protegida: pide revisión/chequeos obligatorios. Quita esa regla en Settings → Branches, o sube la rama y acéptala a mano.`);
      if (/workflow/i.test(msg)) console.log('   → Tu token no tiene permiso para cambiar archivos de .github/workflows. Crea uno con el permiso «Workflows», o edita ese archivo en github.com.');
      return 1;
    }
    error(`${BASE} cambió 3 veces seguidas mientras subía. Vuelve a ejecutar  npm run subir  en un minuto.`); return 1;
  } finally { try { fs.rmSync(herr, { recursive: true, force: true }); } catch (e) { /* nada */ } }
}

if (require.main === module) process.exit(main());
module.exports = { main };
