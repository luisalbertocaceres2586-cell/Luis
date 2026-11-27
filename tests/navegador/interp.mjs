// Prueba de la interpolación de dibujo con un reloj VIRTUAL de 120 Hz (cada cuadro dura exactamente 8,33 ms, sin depender de la velocidad del equipo).
// Mismo juego dos veces: con interpolación y con ?interp=0. Debe cumplirse:
//   1) la FÍSICA queda idéntica (la interpolación solo cambia lo dibujado, nunca el estado real);
//   2) con interpolación se dibuja en cada cuadro (≈ el doble de dibujos que pasos de física);
//   3) lo dibujado avanza uniforme (sin tirones de 60 Hz).
// Uso:  npm i --no-save puppeteer-core @sparticuz/chromium  &&  node tests/navegador/interp.mjs
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { servir } from './servidor.mjs';

const HZ = 120, CUADROS = Number(process.env.CUADROS || 360);
const srv = await servir();
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };

async function correr(interp) {
  const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
    const errores = []; page.on('pageerror', e => errores.push(e.message.slice(0, 160)));
    await page.evaluateOnNewDocument((hz) => {
      // rAF virtual: el tiempo solo avanza cuando la prueba llama a __tick(n)
      let T = 1000, cbs = [], id = 0; const dtv = 1000 / hz;
      window.requestAnimationFrame = cb => { cbs.push(cb); return ++id; };
      window.cancelAnimationFrame = () => {};
      window.__tick = n => { for (let k = 0; k < n; k++) { T += dtv; const run = cbs; cbs = []; for (const f of run) { try { f(T); } catch (e) { /* el juego ya captura sus errores */ } } } };
    }, HZ);
    await page.goto(srv.url + 'index.html?' + (interp ? '' : 'interp=0&') + 'semilla=3', { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => window.__tick(90));                                   // calentamiento: NinjaCalidad mide la frecuencia de pantalla
    const pre = await page.evaluate(() => ({ hz: window.NinjaCalidad && window.NinjaCalidad.hz, interp: window.NinjaCalidad && window.NinjaCalidad.interp(), nivel: window.NinjaCalidad && window.NinjaCalidad.nivel }));
    await page.evaluate(() => {
      const w = /** @type {any} */ (window);
      w.__rend = []; const orig = w.render;
      w.render = function () { w.__ult = P.y; w.__rend.push(w.__ult); return orig.apply(this, arguments); };   // ¿qué altura del héroe se DIBUJA?
      let pasos = 0; w.__corrupto = 0; let ult = null; const up = w.update;
      w.update = function () {   // antes de cada paso, el estado debe ser EXACTAMENTE el que dejó el paso anterior
        pasos++; w.__pasos = pasos;
        if (ult && (P.x !== ult[0] || P.y !== ult[1] || camX !== ult[2])) w.__corrupto++;
        const r = up.apply(this, arguments); ult = [P.x, P.y, camX]; (w.__real = w.__real || []).push(P.y); return r;
      };
      w.__disp = []; w.__tickDisp = n => { for (let k = 0; k < n; k++) { w.__tick(1); w.__disp.push(w.__ult); } };   // lo que mostraría la pantalla en cada cuadro
      w.startLevel(0);
    });
    // el nivel arranca tras una cuenta atrás con setTimeout (tiempo real): se avanza el reloj virtual mientras tanto
    for (let i = 0; i < 80 && !(await page.evaluate(() => GS.running && !!RAF)); i++) { await page.evaluate(() => window.__tick(5)); await new Promise(r => setTimeout(r, 250)); }
    await page.evaluate(() => window.__tick(30));
    await page.evaluate(() => window.__tickDisp(60));                               // que el héroe se asiente en el suelo
    await page.evaluate(() => { window.__rend.length = 0; window.__disp.length = 0; window.__pasos = 0; window.__real = []; K.ArrowUp = 1; });   // SALTO (movimiento vertical: no lo frena ninguna puerta)
    await page.evaluate(() => window.__tickDisp(4));
    await page.evaluate(() => { K.ArrowUp = 0; });
    for (let i = 0; i < CUADROS; i += 40) await page.evaluate(n => window.__tickDisp(n), Math.min(40, CUADROS - i));
    const r = await page.evaluate(() => ({ x: P.x, y: P.y, cam: camX, run: GS.running, dib: window.__rend.slice(), disp: window.__disp.slice(), pasos: window.__pasos || 0 }));
    return { ...r, pre, errores, corrupto: await page.evaluate(() => window.__corrupto), real: await page.evaluate(() => window.__real.slice()) };
  } finally { await browser.close(); }
}

try {
  const off = await correr(false), on = await correr(true);
  console.log(`  sin interpolar: pasos ${off.pasos}, dibujos ${off.dib.length}, P.x final ${off.x.toFixed(2)} | con interpolación: pasos ${on.pasos}, dibujos ${on.dib.length}, P.x final ${on.x.toFixed(2)}`);
  ok(on.pre.hz >= 85 && on.pre.interp === true, `NinjaCalidad detecta ${on.pre.hz} Hz y activa la interpolación`);
  ok(off.pre.interp === false, 'con ?interp=0 queda apagada');
  ok(off.run && on.run, 'el nivel está en marcha');
  ok(on.corrupto === 0 && off.corrupto === 0, `la física nunca ve valores interpolados (${on.corrupto} pasos con estado alterado)`);
  ok(on.dib.length >= off.dib.length * 1.8, `se dibuja casi el doble (${on.dib.length} frente a ${off.dib.length})`);
  // lo que ve el ojo: cuánto cambia la posición mostrada de un cuadro al siguiente
  const dif = a => { const d = a.map((v, i) => (i ? v - a[i - 1] : 0)).slice(1); const ini = d.findIndex(x => Math.abs(x) > 1e-9); let fin = d.length - 1; while (fin > 0 && Math.abs(d[fin]) < 1e-9) fin--; return d.slice(Math.max(0, ini), fin + 1); };   // solo mientras dura el salto
  const dOn = dif(on.disp), dOff = dif(off.disp);
  const fz = a => a.filter(x => Math.abs(x) < 1e-9).length / a.length;
  console.log(`  cuadros sin movimiento (tirones): sin interpolar ${(fz(dOff) * 100).toFixed(0)} % · con interpolación ${(fz(dOn) * 100).toFixed(0)} %`);
  ok(dOn.length > 40 && dOff.length > 20, `el salto dura ${dOn.length} cuadros (con interpolación) y ${dOff.length} (sin)`);
  ok(fz(dOff) > 0.35, 'sin interpolar, en 120 Hz la mitad de los cuadros repite imagen (el problema)');
  ok(fz(dOn) < 0.05, 'con interpolación NO se repite imagen: cada cuadro avanza');
  // el mayor salto de un cuadro al siguiente, frente al mayor paso REAL de física: con interpolación debe ser ~la mitad (a 120 Hz hay 2 cuadros por paso)
  const pasoReal = Math.max(...on.real.map((v, i, a) => (i ? Math.abs(v - a[i - 1]) : 0)));
  const maxOn = Math.max(...dOn.map(Math.abs)), maxOff = Math.max(...dOff.map(Math.abs));
  console.log(`  mayor salto entre cuadros: sin interpolar ${maxOff.toFixed(2)} px · con interpolación ${maxOn.toFixed(2)} px · mayor paso real de física ${pasoReal.toFixed(2)} px`);
  ok(maxOn <= pasoReal * 0.65, 'con interpolación, ningún cuadro salta más de ~la mitad de un paso de física');
  ok(on.errores.length === 0 && off.errores.length === 0, `sin errores de JavaScript (${on.errores.length + off.errores.length}) ${on.errores[0] || off.errores[0] || ''}`);
} finally { await srv.cerrar(); }
process.exit(fallos ? 1 : 0);
