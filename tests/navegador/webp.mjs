// Prueba de WebP en un navegador real: abre cada página SIN WebP (?webp=0) y CON WebP y compara lo que de verdad se descarga.
// Debe cumplirse: menos bytes de imágenes, ninguna imagen que falle, ningún error de JavaScript, y capturas de pantalla casi idénticas.
// Uso:  npm i --no-save puppeteer-core @sparticuz/chromium  &&  node tests/navegador/webp.mjs     (capturas en $SALIDA_PRUEBAS o /tmp/ninja-webp)
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { servir } from './servidor.mjs';

const salida = process.env.SALIDA_PRUEBAS || path.join(os.tmpdir(), 'ninja-webp'); fs.mkdirSync(salida, { recursive: true });
const paginas = [['index.html', 'menu'], ['nivel1.html?auto=1&semilla=3&heroe=kage', 'nivel1']];
const srv = await servir();
const RAIZ = process.env.RAIZ_JUEGO || path.resolve(new URL('../..', import.meta.url).pathname);   // raíz del repo (donde está assets/)
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };

async function cargar(url, etiqueta, conWebp) {
  const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell', protocolTimeout: 240000 });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
    const r = { png: 0, webp: 0, bytes: 0, fallidas: [], errores: [] };
    page.on('pageerror', e => r.errores.push(e.message.slice(0, 160)));
    page.on('response', res => {
      const u = new URL(res.url()); if (u.origin !== new URL(srv.url).origin || !u.pathname.startsWith('/assets/')) return;
      if (res.status() >= 400) { r.fallidas.push(u.pathname); return; }
      const ext = path.extname(u.pathname).toLowerCase();
      if (ext === '.png') r.png++; else if (ext === '.webp') r.webp++;
      if (/\.(png|webp|jpg|jpeg|gif)$/.test(ext)) { try { r.bytes += fs.statSync(path.join(RAIZ, decodeURI(u.pathname))).size; } catch (e) { /* no es de disco */ } }
    });
    page.on('requestfailed', q => { const u = new URL(q.url()); if (u.pathname.startsWith('/assets/') && !/net::ERR_ABORTED/.test(q.failure()?.errorText || '')) r.fallidas.push(u.pathname); });
    const sep = url.includes('?') ? '&' : '?';
    await page.goto(srv.url + url + (conWebp ? '' : sep + 'webp=0'), { waitUntil: 'load', timeout: 170000 });
    await new Promise(r => setTimeout(r, 9000));
    r.activo = await page.evaluate(() => !!(window.NJ_WEBP && window.NJ_WEBP.activo));
    await page.screenshot({ path: path.join(salida, `${etiqueta}-${conWebp ? 'webp' : 'png'}.png`) }).catch(() => console.log('  (no se pudo tomar la captura de ' + etiqueta + ')'));
    return r;
  } finally { await browser.close(); }
}

try {
  for (const [url, etiqueta] of paginas) {
    const a = await cargar(url, etiqueta, false), b = await cargar(url, etiqueta, true);
    const mb = n => (n / 1048576).toFixed(1) + ' MB';
    console.log(`\n${url}\n  sin WebP: ${a.png} PNG + ${a.webp} WebP = ${mb(a.bytes)} | con WebP: ${b.png} PNG + ${b.webp} WebP = ${mb(b.bytes)}`);
    ok(a.activo === false && b.activo === true, 'webp.js se apaga con ?webp=0 y se activa por defecto');
    ok(b.webp > a.webp + 20, `con WebP se piden más .webp (${b.webp} frente a ${a.webp})`);
    ok(a.bytes > 1048576, `se pudo medir el peso de las imágenes (${mb(a.bytes)})`);
    ok(b.bytes <= a.bytes * 0.75, `se descarga al menos 25 % menos (${mb(a.bytes)} → ${mb(b.bytes)}, ${Math.round(100 - 100 * b.bytes / a.bytes)} % menos)`);
    const nuevas = b.fallidas.filter(x => !a.fallidas.includes(x));
    ok(nuevas.length === 0, `ninguna imagen falla por usar WebP (${nuevas.length}) ${nuevas[0] || ''}`);
    ok(b.errores.length === 0, `sin errores de JavaScript (${b.errores.length}) ${b.errores[0] || ''}`);
  }
} finally { await srv.cerrar(); }
console.log('\ncapturas en ' + salida);
process.exit(fallos ? 1 : 0);
