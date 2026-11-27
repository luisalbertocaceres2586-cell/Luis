#!/usr/bin/env node
/**
 * Presupuesto de peso: falla si el juego "engorda" demasiado. Pensado para celulares con datos móviles.
 * Mide (sin instalar nada):  index.html · código del motor (engine/**.js) · recursos que usa el juego · y, en un PR,
 * cada imagen/recurso NUEVO o cambiado frente a la rama base.
 *
 * Los límites viven en tools/presupuesto.json (se pueden subir a propósito cuando el juego crece de verdad).
 * Uso:  node tools/presupuesto.js                       → mide el estado actual
 *       node tools/presupuesto.js --base origin/main    → además revisa lo que cambió el PR
 *       (si existe $GITHUB_STEP_SUMMARY, escribe ahí una tabla)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { RAIZ, referenciasServidas: referencias, tam } = require('./lib-referencias');

const lim = JSON.parse(fs.readFileSync(path.join(__dirname, 'presupuesto.json'), 'utf8'));
const kb = n => (n / 1024).toFixed(0) + ' KB', mb = n => (n / 1048576).toFixed(1) + ' MB';
const filas = []; let fallos = 0;
function chequear(nombre, valor, limite, fmt) {
  const ok = valor <= limite; if (!ok) fallos++;
  filas.push({ ok, nombre, valor: fmt(valor), limite: fmt(limite) });
}

// 1) index.html
chequear('index.html', tam('index.html'), lim.index_html_kb * 1024, kb);

// 2) código del motor
let motor = 0;
(function suma(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) suma(p); else if (e.name.endsWith('.js')) motor += fs.statSync(p).size; } })(path.join(RAIZ, 'engine'));
chequear('código del motor (engine/**/*.js)', motor, lim.motor_js_kb * 1024, kb);

// 3) recursos que usa el juego + el más pesado
const { activos } = referencias();
const lista = [...activos].map(f => [f, tam(f)]).sort((a, b) => b[1] - a[1]);
const total = lista.reduce((s, x) => s + x[1], 0);
chequear(`recursos que usa el juego (${lista.length} archivos)`, total, lim.recursos_total_mb * 1048576, mb);
chequear('recurso individual más pesado', lista[0][1], lim.recurso_max_kb * 1024, kb);

// 4) lo que añade/cambia este PR
let nuevos = [];
const i = process.argv.indexOf('--base');
if (i > 0) {
  const base = process.argv[i + 1];
  try {
    const out = execFileSync('git', ['diff', '--name-status', '--diff-filter=AM', `${base}...HEAD`, '--', 'assets'], { cwd: RAIZ, encoding: 'utf8' });
    for (const l of out.split('\n').filter(Boolean)) {
      const f = l.split('\t')[1];
      if (/\/(_originales|fuentes_originales|_hojas_originales|_previews)\//.test('/' + f)) continue;   // arte fuente: no se descarga en el juego
      if (!fs.existsSync(path.join(RAIZ, f))) continue;
      const t = tam(f); if (t > lim.recurso_nuevo_max_kb * 1024) nuevos.push([f, t]);
    }
  } catch (e) { console.log('(no se pudo comparar con ' + base + ': ' + e.message.split('\n')[0] + ')'); }
  const ok = nuevos.length === 0; if (!ok) fallos++;
  filas.push({ ok, nombre: `recursos nuevos o cambiados de más de ${lim.recurso_nuevo_max_kb} KB`, valor: String(nuevos.length), limite: '0' });
}

console.log('\nPRESUPUESTO DE PESO');
for (const f of filas) console.log(`${f.ok ? '✓' : '✗'} ${f.nombre.padEnd(52)} ${f.valor.padStart(9)}   (límite ${f.limite})`);
if (nuevos.length) { console.log('\nEstos archivos son muy pesados para celular (conviene comprimirlos o pasarlos a WebP):'); for (const [f, t] of nuevos) console.log('  · ' + kb(t).padStart(8) + '  ' + f); }
console.log('\nLos 5 recursos más pesados que usa el juego:'); for (const [f, t] of lista.slice(0, 5)) console.log('  · ' + kb(t).padStart(8) + '  ' + f);

if (process.env.GITHUB_STEP_SUMMARY) {
  let md = '## 📦 Presupuesto de peso\n\n| | Medida | Valor | Límite |\n|---|---|---:|---:|\n';
  for (const f of filas) md += `| ${f.ok ? '✅' : '❌'} | ${f.nombre} | ${f.valor} | ${f.limite} |\n`;
  if (nuevos.length) md += '\n**Archivos nuevos demasiado pesados:**\n' + nuevos.map(([f, t]) => `- \`${f}\` — ${kb(t)}`).join('\n') + '\n';
  md += '\n<details><summary>5 recursos más pesados</summary>\n\n' + lista.slice(0, 5).map(([f, t]) => `- \`${f}\` — ${kb(t)}`).join('\n') + '\n</details>\n';
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
if (fallos) { console.error(`\n✗ ${fallos} límite(s) superado(s). Si el aumento es intencional, sube el valor en tools/presupuesto.json en el mismo PR.`); process.exit(1); }
console.log('\n✓ Dentro del presupuesto');
