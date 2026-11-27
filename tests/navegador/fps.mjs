// Prueba de rendimiento: carga y FPS reales del juego en un Chromium sin pantalla. Falla si baja de los límites de tools/presupuesto.json.
// En un servidor de GitHub el dibujo es por software (sin tarjeta gráfica): los límites son bajos a propósito, para detectar
// REGRESIONES grandes (algo que de pronto va 3 veces más lento), no para medir cuánto corre en un celular.
// Uso:  npm i --no-save puppeteer-core @sparticuz/chromium  &&  node tests/navegador/fps.mjs
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { servir } from './servidor.mjs';

const lim = JSON.parse(fs.readFileSync(new URL('../../tools/presupuesto.json', import.meta.url), 'utf8'));
const salida = process.env.SALIDA_PRUEBAS || path.join(os.tmpdir(), 'ninja-fps'); fs.mkdirSync(salida, { recursive: true });
const ESTRICTO = process.env.FPS_ESTRICTO === '1';
const solo = process.env.ESCENAS ? process.env.ESCENAS.split(',') : null;
const escenas = [
  { id: 'menu',   nombre: 'Menú principal', url: 'index.html',                                  acciones: false },
  { id: 'nivel1', nombre: 'Nivel 1 jugando', url: 'nivel1.html?auto=1&semilla=3&heroe=kage',     acciones: true  },
];
const srv = await servir();
const lista = escenas.filter(e => !solo || solo.includes(e.id));
const filas = []; let fallos = 0;
for (const e of lista) {
  const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
    const errores = []; page.on('pageerror', x => errores.push(x.message.slice(0, 160)));
    const t0 = Date.now();
    await page.goto(srv.url + e.url, { waitUntil: 'load', timeout: 170000 });
    const carga = (Date.now() - t0) / 1000;
    await new Promise(r => setTimeout(r, 3000));                       // calentamiento
    if (e.acciones) await page.keyboard.down('ArrowRight');           // el héroe avanza: se mueve la cámara y aparecen enemigos
    const m = await page.evaluate(() => new Promise(res => {
      const t = []; let ult = performance.now(); const ini = ult;
      (function f(now) { t.push(now - ult); ult = now; if (now - ini < 6000) requestAnimationFrame(f); else res(t); })(performance.now());
    }));
    if (e.acciones) await page.keyboard.up('ArrowRight');
    await page.screenshot({ path: path.join(salida, `${e.id}.png`) }).catch(() => {});
    const dt = m.slice(2).sort((a, b) => a - b);                       // sin los 2 primeros cuadros
    const fps = 1000 / dt[dt.length >> 1];                           // por la MEDIANA: unos pocos cuadros enormes (carga, recolector de basura) no deben falsear el resultado
    const p95 = dt[Math.floor(dt.length * 0.95)];
    const lentos = dt.filter(x => x > 100).length;
    // Errores de JavaScript y carga eterna SIEMPRE fallan. El FPS bajo solo falla con FPS_ESTRICTO=1: en un servidor sin tarjeta gráfica
    // el valor depende del equipo y los límites aún no se calibraron con datos reales de GitHub (ver docs/AUTOMATIZACION.md).
    const bajo = fps < lim.fps_min;
    const ok = carga <= lim.carga_max_s && errores.length === 0 && !(bajo && ESTRICTO);
    if (!ok) fallos++;
    filas.push({ ok, bajo, nombre: e.nombre, fps: fps.toFixed(1), p95: p95.toFixed(0), lentos, carga: carga.toFixed(1), errores: errores.length, primero: errores[0] || '' });
  } catch (err) { fallos++; filas.push({ ok: false, nombre: e.nombre, fps: '—', p95: '—', lentos: '—', carga: '—', errores: 1, primero: err.message.slice(0, 120) }); }
  await browser.close().catch(() => {});
}
await srv.cerrar();

console.log(`\nRENDIMIENTO (objetivo ${lim.fps_min} FPS por la mediana${ESTRICTO ? ' · ESTRICTO' : ' · solo avisa'} · carga máx ${lim.carga_max_s} s · 0 errores de JavaScript)`);
for (const f of filas) console.log(`${f.ok ? (f.bajo ? '⚠' : '✓') : '✗'} ${f.nombre.padEnd(18)} ${String(f.fps).padStart(5)} FPS · cuadro p95 ${String(f.p95).padStart(4)} ms · ${f.lentos} cuadros >100 ms · carga ${f.carga} s · ${f.errores} errores ${f.primero}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  let md = '## 🎮 Rendimiento (Chromium sin GPU)\n\n| | Escena | FPS | Cuadro p95 | Cuadros >100 ms | Carga | Errores JS |\n|---|---|---:|---:|---:|---:|---:|\n';
  for (const f of filas) md += `| ${f.ok ? (f.bajo ? '⚠️' : '✅') : '❌'} | ${f.nombre} | ${f.fps} | ${f.p95} ms | ${f.lentos} | ${f.carga} s | ${f.errores} |\n`;
  md += `\nFalla si hay errores de JavaScript o la carga pasa de ${lim.carga_max_s} s. FPS objetivo ≥ ${lim.fps_min} (por la mediana): ${ESTRICTO ? 'ESTRICTO, también falla' : 'solo avisa ⚠️ hasta calibrarlo con datos reales; para exigirlo usa FPS_ESTRICTO=1'}. En un servidor de GitHub no hay tarjeta gráfica: sirve para detectar regresiones, no para medir un celular.\n`;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
process.exit(fallos ? 1 : 0);
