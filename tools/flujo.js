#!/usr/bin/env node
/**
 * Herramientas para trabajar en VARIAS pestañas/sesiones a la vez sin pisarse.   Se usan con npm:
 *
 *   npm run rama -- mi-tarea     crea una rama NUEVA desde el main más reciente (una pestaña = una rama)
 *   npm run estado               dónde estás: rama, cambios sin guardar, cuánto te separa de main
 *   npm run radar                ¿qué archivos tocaste tú Y alguien más en main? ¿habrá conflicto?  (úsalo seguido)
 *   npm run sincronizar          trae lo último de main a tu rama; resuelve solo lo automático (version.json)
 *   npm run configurar           ajustes de git que facilitan resolver conflictos (una sola vez por equipo)
 *
 * Solo usa git; funciona igual en Windows, Mac y Linux.
 */
const { spawnSync } = require('child_process');

const git = (args, o) => spawnSync('git', args, Object.assign({ encoding: 'utf8' }, o || {}));
const out = (args) => (git(args).stdout || '').trim();
const lineas = (txt) => String(txt || '').split('\n').map(s => s.trim()).filter(Boolean);
const colores = process.stdout.isTTY;
const c = (n, t) => (colores ? `\x1b[${n}m${t}\x1b[0m` : t);
const ok = (t) => console.log(c(32, '✔ ') + t);
const aviso = (t) => console.log(c(33, '⚠ ') + t);
const error = (t) => console.log(c(31, '✘ ') + t);

/** "Mi tarea Nº 3!" → "mi-tarea-n-3" */
function nombreRama(txt) {
  return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

/** Intersección de dos listas de archivos, ordenada. */
function enAmbos(a, b) { const s = new Set(b); return a.filter(x => s.has(x)).sort(); }

/** Archivos con conflicto según la salida de `git merge-tree --write-tree`. */
function archivosEnConflicto(salida) {
  const r = []; const re = /CONFLICT \([^)]*\):.*? in (.+)$/;
  lineas(salida).forEach(l => { const m = re.exec(l); if (m) r.push(m[1].trim()); });
  return Array.from(new Set(r)).sort();
}

function sinCambiosPendientes() { return out(['status', '--porcelain']) === ''; }
function ramaActual() { return out(['rev-parse', '--abbrev-ref', 'HEAD']); }
function traerMain() {
  const r = git(['fetch', '-q', 'origin', 'main']);
  if (r.status !== 0) { error('No pude conectar con GitHub (git fetch). Revisa tu internet o tu inicio de sesión.'); process.exit(1); }
}

// ───────────────────────── comandos ─────────────────────────
function cmdRama(args) {
  const nombre = nombreRama(args.join(' '));
  if (!nombre) { error('Escribe un nombre.  Ejemplo:  npm run rama -- arreglar-nivel-3'); process.exit(1); }
  if (!sinCambiosPendientes()) { error('Tienes cambios sin guardar. Haz commit (o git stash) antes de crear otra rama, así no se mezclan tareas.'); process.exit(1); }
  traerMain();
  if (git(['rev-parse', '--verify', '-q', nombre]).status === 0) { error(`Ya existe una rama llamada "${nombre}". Elige otro nombre o cámbiate a ella: git switch ${nombre}`); process.exit(1); }
  const r = git(['switch', '-c', nombre, 'origin/main']);
  if (r.status !== 0) { error(r.stderr || 'No se pudo crear la rama'); process.exit(1); }
  ok(`Rama nueva "${nombre}" creada desde el main más reciente.`);
  console.log('   Ahora trabaja aquí. Al terminar:  git push -u origin ' + nombre + '  y abre el Pull Request.');
}

function cmdEstado() {
  traerMain();
  const rama = ramaActual();
  const detras = +out(['rev-list', '--count', 'HEAD..origin/main']);
  const delante = +out(['rev-list', '--count', 'origin/main..HEAD']);
  const pendientes = lineas(out(['status', '--porcelain'])).length;
  console.log(`Rama: ${c(36, rama)}`);
  console.log(`Cambios sin guardar (sin commit): ${pendientes ? c(33, pendientes) : '0'}`);
  console.log(`Commits tuyos que main aún no tiene: ${delante}`);
  console.log(`Commits de main que tu rama aún no tiene: ${detras ? c(33, detras) : '0'}`);
  const up = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (up.status !== 0) aviso('Esta rama NO está subida a GitHub todavía: si algo le pasa a tu computador se pierde. Haz: git push -u origin ' + rama);
  else { const sinSubir = +out(['rev-list', '--count', '@{u}..HEAD']); if (sinSubir) aviso(`${sinSubir} commit(s) sin subir a GitHub: git push`); else ok('Todo lo tuyo está respaldado en GitHub.'); }
  if (rama === 'main') aviso('Estás en main. Para trabajar usa una rama propia:  npm run rama -- nombre-de-la-tarea');
  if (detras) console.log('\nSugerencia: npm run radar   (para ver si habrá conflicto)   y   npm run sincronizar');
}

function cmdRadar() {
  traerMain();
  const base = out(['merge-base', 'HEAD', 'origin/main']);
  if (!base) { error('No encuentro el punto común con main.'); process.exit(1); }
  const mios = lineas(out(['diff', '--name-only', base + '..HEAD']));
  const suyos = lineas(out(['diff', '--name-only', base + '..origin/main']));
  const comunes = enAmbos(mios, suyos);
  console.log(`Tu rama (${ramaActual()}) cambió ${mios.length} archivo(s); main cambió ${suyos.length} desde que te separaste.\n`);
  if (!comunes.length) { ok('Ningún archivo en común: no puede haber conflicto ahora mismo.'); return; }
  aviso(`${comunes.length} archivo(s) tocados por los dos lados (zona de riesgo):`);
  comunes.forEach(f => {
    const quien = out(['log', '-1', '--format=%an, %ar', 'origin/main', '--', f]);
    const n = out(['rev-list', '--count', base + '..origin/main', '--', f]);
    console.log(`   · ${f}   ← main lo cambió ${n} vez/veces (última: ${quien})${f === 'version.json' ? '   [se resuelve solo con npm run sincronizar]' : ''}`);
  });
  // predicción real (git 2.38+)
  const mt = git(['merge-tree', '--write-tree', '--name-only', 'HEAD', 'origin/main']);
  console.log('');
  if (mt.status === 0) {
    ok('Predicción de git: la mezcla saldría LIMPIA (los cambios están en zonas distintas de los archivos).');
  } else if (mt.status === 1) {
    const sal = (mt.stdout || '');
    const conf = archivosEnConflicto(sal + '\n' + (mt.stderr || ''));
    const nombres = conf.length ? conf : lineas(sal).slice(1).filter(l => !l.startsWith('CONFLICT') && !l.startsWith('Auto-merging') && l.length < 200);
    error('Predicción de git: HABRÁ CONFLICTO en: ' + (nombres.length ? nombres.join(', ') : '(ver con git merge)'));
    console.log('   Qué hacer: npm run sincronizar  ahora, mientras el conflicto es pequeño.');
  } else {
    aviso('Tu git es antiguo y no puede predecir; usa npm run sincronizar para probar.');
  }
}

function cmdSincronizar() {
  if (!sinCambiosPendientes()) { error('Tienes cambios sin guardar. Haz commit primero (git add -A && git commit -m "mensaje") y vuelve a ejecutar.'); process.exit(1); }
  traerMain();
  const detras = +out(['rev-list', '--count', 'HEAD..origin/main']);
  if (!detras) { ok('Tu rama ya tiene todo lo de main. Nada que sincronizar.'); return; }
  console.log(`Trayendo ${detras} commit(s) de main a "${ramaActual()}"…`);
  const m = git(['merge', 'origin/main', '--no-edit']);
  if (m.status === 0) { ok('Sincronizado sin conflictos.'); console.log('   Siguiente:  npm run verify'); return; }
  let conflictos = lineas(out(['diff', '--name-only', '--diff-filter=U']));
  if (conflictos.includes('version.json')) {          // lo único que se resuelve solo: gana la versión de main
    git(['checkout', '--theirs', '--', 'version.json']); git(['add', 'version.json']);
    ok('version.json: resuelto solo (se queda la versión de main; la actualiza GitHub automáticamente).');
    conflictos = conflictos.filter(f => f !== 'version.json');
  }
  if (!conflictos.length) { git(['commit', '--no-edit']); ok('Sincronizado.'); console.log('   Siguiente:  npm run verify'); return; }
  error(`Quedan ${conflictos.length} archivo(s) con conflicto real (los dos lados cambiaron las mismas líneas):`);
  conflictos.forEach(f => console.log('   · ' + f));
  console.log('\nQué hacer:');
  console.log('   1. Abre cada archivo y busca las marcas <<<<<<<  =======  >>>>>>>  (arriba = lo tuyo, abajo = lo de main).');
  console.log('   2. Deja el resultado correcto (normalmente se conservan AMBOS cambios) y borra las marcas.');
  console.log('   3. git add -A && git commit --no-edit  →  npm run verify');
  console.log('   ¿Dudas? Pega este mensaje a Claude con los nombres de arriba y lo resuelve.');
  console.log('   Para cancelar todo sin perder nada:  git merge --abort');
  process.exit(2);
}

function cmdConfigurar() {
  const cfg = [
    ['rerere.enabled', 'true', 'git recuerda cómo resolviste un conflicto y lo repite solo la próxima vez'],
    ['merge.conflictstyle', 'zdiff3', 'los conflictos muestran también el original (más fácil decidir)'],
    ['pull.rebase', 'false', 'git pull mezcla (no reescribe la historia: no se pierde trabajo)'],
    ['fetch.prune', 'true', 'limpia ramas borradas en GitHub'],
  ];
  cfg.forEach(([k, v, why]) => { git(['config', k, v]); ok(`${k} = ${v}   — ${why}`); });
}

module.exports = { nombreRama, enAmbos, archivosEnConflicto };

if (require.main === module) {
  const [cmd, ...resto] = process.argv.slice(2);
  const tabla = { rama: cmdRama, estado: cmdEstado, radar: cmdRadar, sincronizar: cmdSincronizar, configurar: cmdConfigurar };
  if (!tabla[cmd]) { console.log('Uso: node tools/flujo.js <rama|estado|radar|sincronizar|configurar>'); process.exit(1); }
  tabla[cmd](resto);
}
