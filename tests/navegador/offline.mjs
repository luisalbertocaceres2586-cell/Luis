// Prueba: precarga (?offline=1) → luego se APAGA el servidor y el juego debe abrir igual (sin internet).
// Uso:  npm i --no-save puppeteer-core @sparticuz/chromium  &&  node tests/navegador/offline.mjs
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { servir } from './servidor.mjs';
const srv = await servir();
// el juego precarga cientos de imágenes: en equipos lentos tarda; se espera hasta 3 min a que el documento termine de cargar
async function esperarCarga(page) {
  const t = Date.now();
  while (Date.now() - t < 180000) { if (await page.evaluate(() => document.readyState).catch(() => '') === 'complete') break; await new Promise(r => setTimeout(r, 1000)); }
  await new Promise(r => setTimeout(r, 1500));
}
const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
try {
  const page = await browser.newPage();
  const errores = []; page.on('pageerror', e => errores.push(e.message));
  const caidasOnline = new Set(); page.on('response', r => { if (r.status() >= 400) caidasOnline.add(r.url()); });   // lo que ya falla CON internet no cuenta
  await page.goto(srv.url + 'index.html?offline=1', { waitUntil: 'load', timeout: 90000 });
  const t0 = Date.now();
  const est = await page.evaluate(() => new Promise(res => {
    const fin = d => d && ['listo', 'incompleto', 'sin-espacio', 'error'].includes(d.estado);
    if (fin(window.NinjaSW && window.NinjaSW.precarga)) return res(window.NinjaSW.precarga);
    window.addEventListener('ninja-precarga', e => { if (fin(e.detail)) res(e.detail); });
    setTimeout(() => res({ estado: 'tiempo' }), 240000);
  }));
  console.log(`  precarga: ${est.estado} · ${est.hechos}/${est.total} archivos · ${est.fallos || 0} fallos · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  ok(est.estado === 'listo', 'la precarga termina en "listo"');
  const cache = await page.evaluate(async () => { const o = {}; for (const n of await caches.keys()) o[n] = (await (await caches.open(n)).keys()).length; return o; });
  console.log('  cachés:', JSON.stringify(cache));
  ok((cache['ninja-assets-v1'] || 0) > 500, 'hay más de 500 recursos guardados');

  const rotasOnline = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src') || '(sin src)'));
  await srv.cerrar();                                   // ← SIN INTERNET: el servidor ya no existe
  const fallidas = []; page.on('requestfailed', r => fallidas.push(r.url()));
  await page.goto(srv.url + 'index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await esperarCarga(page);
  const titulo = await page.title();
  ok(!!titulo, `index.html abre sin internet (título: "${titulo}")`);
  const rotasOffline = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src') || '(sin src)'));
  const nuevas = rotasOffline.filter(x => !rotasOnline.includes(x));
  if (rotasOnline.length) console.log('  (ya estaban rotas CON internet, no cuentan: ' + rotasOnline.join(', ') + ')');
  ok(nuevas.length === 0, `ninguna imagen se rompe solo por estar sin internet (${nuevas.length}) ${nuevas[0] || ''}`);
  const n1 = await page.goto(srv.url + 'nivel1.html', { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => null);
  ok(!!n1 && n1.ok(), 'nivel1.html abre sin internet');
  await esperarCarga(page);
  const jsFallidos = fallidas.filter(u => /\.js(\?|$)/.test(u));
  ok(jsFallidos.length === 0, `scripts que no cargaron sin internet: ${jsFallidos.length} ${jsFallidos[0] || ''}`);
  const imgFallidas = fallidas.filter(u => /\/assets\//.test(u) && u.startsWith(srv.url) && !caidasOnline.has(u));
  ok(imgFallidas.length === 0, `recursos de /assets que fallaron sin internet: ${imgFallidas.length} ${imgFallidas[0] || ''}`);
  ok(errores.length === 0, `sin errores de JavaScript (${errores.length}) ${errores[0] || ''}`);
} finally { await browser.close(); await srv.cerrar().catch(() => {}); }
process.exit(fallos ? 1 : 0);
