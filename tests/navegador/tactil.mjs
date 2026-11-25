// Botones táctiles del juego principal con toques reales (CDP). Sirve para comparar versiones.
// Uso:  python3 -m http.server 8124   (en la raíz del repo)
//       node tests/navegador/tactil.mjs http://localhost:8124 [etiqueta] [grupos]
//   grupos (cada uno abre un navegador nuevo, porque esta página es pesada y el de pruebas se degrada con muchos toques seguidos):
//   A zonas de toque · B deslizar y temblor · C robustez (0 ms, pointerup perdido, cancelación, menú encima) · D esquiva falsa · E dos dedos
// El hilo principal de la página va lento en el navegador de pruebas, así que cada medida ESPERA a que el juego reaccione (hasta 700 ms).
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const [,, base = 'http://localhost:8124', et = 'RAMA', G = 'ABCDE'] = process.argv;
const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 420, hasTouch: true, isMobile: true });
const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 160)));
await page.goto(base + '/index.html?movil=1', { waitUntil: 'load', timeout: 90000 });
await new Promise(r => setTimeout(r, 3500));
// la intro/menús cubren la pantalla hasta que empieza la partida: se vuelven transparentes al toque (sin borrarlos) para probar como en juego real
await page.evaluate(() => {
  document.getElementById('mctl').classList.add('on');
  for (let x = 0; x <= 900; x += 15) for (let y = 250; y <= 419; y += 10) for (let i = 0; i < 15; i++) {
    const t = document.elementFromPoint(x, y); if (!t || t.closest('#mctl') || t.id === 'c' || t === document.body || t === document.documentElement) break; t.style.pointerEvents = 'none'; }
});
// los menús que aparecen después (p. ej. #tutorialModal a los ~40 s) también se neutralizan, y los lienzos de la intro se ocultan para que la página vaya más fluida
await page.evaluate(() => {
  const st = document.createElement('style'); st.textContent = '#tutorialModal{display:none!important}'; document.head.appendChild(st);   // el juego lo vuelve a mostrar solo
  document.querySelectorAll('canvas').forEach(c => { if (c.id !== 'c') c.style.display = 'none'; });
  setInterval(() => { const m = document.getElementById('tutorialModal'); if (m) m.style.display = 'none';
    for (const e of document.body.children) if (e.id !== 'mctl' && e.id !== 'c' && e.id !== 'ovl' && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE') e.style.pointerEvents = 'none'; }, 150);
});
await new Promise(r => setTimeout(r, 600));
const cdp = await page.createCDPSession();
const wait = ms => new Promise(r => setTimeout(r, ms));
const tc = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
const fin = async () => { await tc('touchEnd', []); await wait(350); };
const log = (k, v) => console.log(`[${et}] ${k.padEnd(52)} ${v}`);
const R = key => page.evaluate(key => { const b = document.getElementById(key) || [...document.querySelectorAll('.mbx')].find(x => x.textContent.includes(key)); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; }, key);
const K = () => page.evaluate(() => ({ L: K.ArrowLeft | 0, R: K.ArrowRight | 0, U: K.ArrowUp | 0, S: K.Space | 0, D: K.ShiftLeft | 0, B: (K.KeyS | 0) || (K.ArrowDown | 0) }));
const dir = k => `${k.L ? '◀' : ''}${k.R ? '▶' : ''}` || '—';
const hasta = async (pred, ms = 700) => { const t0 = Date.now(); let k; do { await wait(25); k = await K(); } while (!pred(k) && Date.now() - t0 < ms); return k; };
const alguna = k => k.L || k.R || k.U || k.S || k.B;
const L = await R('mbL'), Rr = await R('mbR'), J = await R('mbJ'), Bd = await R('BAJAR');
const gx = (L.x + L.r + Rr.x - Rr.r) / 2;
const toque = async (x, y) => { await tc('touchStart', [{ x, y, id: 1 }]); const k = await hasta(alguna); await fin(); return k; };

if (G.includes('A')) {
  // alcance: cuántos px fuera del círculo de ◀ sigue caminando (pasos de 5 px)
  const alcance = async (dx, dy) => { let mx = -1; for (let d = 0; d <= 60; d += 5) { const k = await toque(L.x + dx * (L.r + d), L.y + dy * (L.r + d)); if (k.L || k.R) mx = d; else break; } return mx < 0 ? 'ninguno' : mx + ' px'; };
  log('1 centro de ◀', dir(await toque(L.x, L.y)));
  log('2 alcance de ◀ por arriba (px fuera del círculo)', await alcance(0, -1));
  log('3 alcance de ◀ por la izquierda (px fuera)', await alcance(-1, 0));
  log('4 hueco entre ◀ y ▶ (centro del hueco)', dir(await toque(gx, L.y)));
  log('5 borde de la pantalla, x=6', dir(await toque(6, L.y)));
  log('6 bajo ◀ hasta el borde inferior (y=419)', dir(await toque(L.x, 419)));
  log('7 halo de ⬇ (25 % fuera del círculo)', (await toque(Bd.x + Bd.r * 1.25, Bd.y)).B ? 'baja ✔' : '—');
}
if (G.includes('B')) {
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }]); const a5 = dir(await hasta(k => k.L || k.R));
  for (let i = 1; i <= 12; i++) { await tc('touchMove', [{ x: L.x + (Rr.x - L.x) * i / 12, y: L.y, id: 1 }]); await wait(14); }
  const b5 = dir(await hasta(k => k.R)); await fin(); log('8 deslizar ◀ → ▶ sin levantar', `${a5} → ${b5}`);
  // dedo tembloroso sobre el punto medio: no debe parpadear
  await tc('touchStart', [{ x: gx - 8, y: L.y, id: 1 }]); await hasta(alguna, 400); const vistos = [];
  for (let i = 0; i < 14; i++) { await tc('touchMove', [{ x: gx + (i % 2 ? 3 : -3), y: L.y, id: 1 }]); await wait(60); vistos.push(dir(await K())); }
  let cambios = 0; for (let i = 1; i < vistos.length; i++) if (vistos[i] !== vistos[i - 1]) cambios++;
  await fin(); log('9 dedo temblando ±3 px en el medio', `${[...new Set(vistos)].join(' ')} · cambios de dirección: ${cambios}`);
}
if (G.includes('C')) {
  // toques de 0 ms (empiezan y terminan en el mismo instante): ¿la tecla sigue pulsada para que el juego la vea? ¿y se suelta después?
  const r11 = await page.evaluate(async () => {
    const el = document.getElementById('mbL'), r = el.getBoundingClientRect(); let vistos = 0, pegadas = 0;
    const ev = t => new PointerEvent(t, { pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, clientX: r.x + 20, clientY: r.y + 20 });
    for (let i = 0; i < 10; i++) { el.dispatchEvent(ev('pointerdown')); el.dispatchEvent(ev('pointerup')); if (K.ArrowLeft) vistos++; await new Promise(q => setTimeout(q, 150)); if (K.ArrowLeft) pegadas++; }
    return { vistos, pegadas }; });
  log('11 diez toques de 0 ms (la tecla sigue pulsada al instante)', `${r11.vistos}/10 · se quedan pegadas: ${r11.pegadas}`);
  // tecla pegada: se pierde el pointerup (solo llega un touchend sin dedos)
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }]); await hasta(k => k.L);
  await page.evaluate(() => document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [], bubbles: true })));
  await wait(300); log('12 se pierde el pointerup → ¿◀ queda pegada?', dir(await K()) === '—' ? 'se suelta ✔' : 'PEGADA ✘'); await fin();
  // el sistema cancela el toque (gesto de borde de Android/iPhone)
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }]); await hasta(k => k.L); await tc('touchCancel', []); await wait(300);
  log('13 el sistema cancela el toque (touchCancel)', dir(await K()) === '—' ? 'se suelta ✔' : 'PEGADA ✘'); await wait(300);
  // un menú encima de ◀ no debe ser robado por los botones
  await page.evaluate(() => { const l = document.getElementById('mbL').getBoundingClientRect(); const b = document.createElement('button'); b.id = 'ovl'; b.style.cssText = `position:fixed;z-index:99999;left:${l.left - 30}px;top:${l.top - 30}px;width:${l.width + 60}px;height:${l.height + 60}px`; window.__ovl = 0; b.addEventListener('pointerdown', () => window.__ovl++); document.body.appendChild(b); });
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }]); await wait(500); const k14 = await K(); await fin();
  log('14 botón de menú encima de ◀', `menú lo recibe: ${await page.evaluate(() => window.__ovl)} · ◀ se activa: ${dir(k14) === '—' ? 'no ✔' : 'SÍ ✘'}`);
}
if (G.includes('D')) {
  // deslizar desde junto a ◀ lejos hacia la derecha NO debe disparar la esquiva (deslizamiento sobre el lienzo) mientras se camina
  await page.evaluate(() => { GS.running = true; });
  await tc('touchStart', [{ x: L.x, y: L.y - L.r * 1.25, id: 1 }]); await wait(300);
  for (let i = 1; i <= 10; i++) { await tc('touchMove', [{ x: L.x + 18 * i, y: L.y - L.r * 1.25, id: 1 }]); await wait(40); }
  await tc('touchEnd', []); await wait(400); const k15 = await K(); await page.evaluate(() => { GS.running = false; });
  log('15 deslizar desde el halo (¿esquiva falsa?)', k15.D ? 'ESQUIVA ✘' : 'sin esquiva ✔');
}
if (G.includes('E')) {
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }]); await hasta(k => k.L);
  await tc('touchStart', [{ x: L.x, y: L.y, id: 1 }, { x: J.x, y: J.y, id: 2 }]); const k10 = await hasta(k => k.U || k.S);
  await tc('touchEnd', [{ x: J.x, y: J.y, id: 2 }]); await wait(400); const k10b = await K();   // touchEnd libera los puntos que se LISTAN: aquí solo el dedo de ⬆
  await fin();
  log('10 ◀ + ⬆ a la vez', `durante: ${dir(k10)}${k10.U || k10.S ? ' + salto' : ''}; tras soltar ⬆ (◀ sigue apoyado): ${dir(k10b)}`);
}
if (errs.length) console.log('ERRORES:', errs);
await browser.close();
