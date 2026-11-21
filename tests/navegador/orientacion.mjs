// Orientación automática: reproduce el atasco "GIRA TU TELÉFONO" del Nivel 3 con un screen.orientation SIMULADO que se comporta como Chrome:
//   · requestFullscreen solo se concede con un gesto real reciente (pointerup/touchend);  · lock() solo funciona en pantalla completa;
//   · el teléfono está atascado en horizontal (bloqueo de rotación activado): girarlo físicamente no cambia nada, solo lock() lo gira.
// Uso:  python3 -m http.server 8124   y luego   node tests/navegador/orientacion.mjs http://localhost:8124 [etiqueta]
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const [,, base = 'http://localhost:8124', et = 'RAMA'] = process.argv;
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (k, v) => console.log(`[${et}] ${k.padEnd(58)} ${v}`);
const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });

async function sesion(nombre, url, vp, cfg, fn) {
  const page = await browser.newPage();
  await page.setViewport({ ...vp, hasTouch: true, isMobile: true });
  await page.exposeFunction('__rotar', async m => { await page.setViewport({ width: m === 'portrait' ? 360 : 800, height: m === 'portrait' ? 760 : 360, hasTouch: true, isMobile: true }); });
  await page.evaluateOnNewDocument(cfg => {
    const st = { calls: [], failLock: !!cfg.failLock, act: 0 }; window.__or = st;
    // en Chrome la activación del usuario existe ANTES de que corra cualquier manejador del gesto: por eso se registra en window (va primero)
    window.addEventListener('pointerup', () => { st.act = Date.now(); }, true); window.addEventListener('touchend', () => { st.act = Date.now(); }, true);
    let fs = null; Object.defineProperty(document, 'fullscreenElement', { get: () => fs, configurable: true });
    Element.prototype.requestFullscreen = function () { if (Date.now() - st.act > 3000) { st.calls.push('fs:rechazado(sin gesto)'); return Promise.reject(new TypeError('requires user gesture')); } fs = this; st.calls.push('fs:ok'); document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); };
    const o = { type: 'landscape-primary', addEventListener() {},
      unlock() { st.calls.push('unlock'); },
      async lock(m) { st.calls.push('lock:' + m); if (st.failLock) throw new DOMException('no soportado', 'NotSupportedError'); if (!fs) throw new DOMException('hace falta pantalla completa', 'SecurityError'); await window.__rotar(m.startsWith('portrait') ? 'portrait' : 'landscape'); } };
    Object.defineProperty(screen, 'orientation', { get: () => o, configurable: true });
  }, cfg);
  const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await page.goto(base + url, { waitUntil: 'load', timeout: 60000 }); await wait(2500);
  const tap = async (x, y) => { const c = await page.createCDPSession(); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await wait(60); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(1200); };
  const est = () => page.evaluate(sel => { const g = document.querySelector(sel); return { aviso: !!g && getComputedStyle(g).display !== 'none', vertical: innerHeight > innerWidth, calls: window.__or.calls.join(' › ') }; }, nombre);
  try { await fn({ page, tap, est }); } catch (e) { log('ERROR en la prueba', e.message.slice(0, 100)); }
  if (errs.length) log('errores de página', errs.join(' | '));
  await page.close();
}
const f = e => `${e.aviso ? 'AVISO "GIRA" visible' : 'aviso oculto'} · pantalla ${e.vertical ? 'VERTICAL' : 'horizontal'}`;

// 1) Nivel 3 llegando desde el Nivel 2 con la pantalla atascada en horizontal (lock API disponible, pantalla completa solo con gesto)
await sesion('#girar', '/nivel3.html', { width: 800, height: 360 }, {}, async ({ tap, est }) => {
  log('1a al abrir el Nivel 3 (sin tocar nada)', f(await est()));
  await tap(400, 180); log('1b tras un toque sobre el aviso', f(await est()));
  log('   llamadas al navegador', (await est()).calls || '(ninguna)');
});
// 2) Navegador SIN bloqueo de orientación (iPhone/Safari, Firefox…): el jugador debe poder entrar igualmente
await sesion('#girar', '/nivel3.html', { width: 800, height: 360 }, { failLock: true }, async ({ page, tap, est }) => {
  await tap(400, 180); log('2a bloqueo imposible: tras tocar', f(await est()));
  const hay = await page.evaluate(() => !!document.getElementById('girarAsi'));
  if (hay) { await page.evaluate(() => document.getElementById('girarAsi').click()); await wait(500); log('2b pulsar "Jugar así de todos modos"', f(await est())); }
  else log('2b salida disponible', 'NINGUNA ✘ (el jugador no puede empezar)');
});
// 3) Nivel 3 con el teléfono ya en vertical: nada que arreglar, el aviso no debe aparecer
await sesion('#girar', '/nivel3.html', { width: 360, height: 760 }, {}, async ({ est }) => { log('3 Nivel 3 ya en vertical', f(await est())); });
// 4) Juego principal con el teléfono en vertical: un toque debe girarlo a horizontal (aviso "gira" de pantalla-movil)
await sesion('#rotarAviso', '/index.html?movil=1', { width: 360, height: 760 }, {}, async ({ tap, est }) => {
  log('4a juego principal en vertical (sin tocar)', f(await est()));
  await tap(180, 380); await wait(800); log('4b tras un toque', f(await est()));
  log('   llamadas al navegador', (await est()).calls || '(ninguna)');
});
await browser.close();
