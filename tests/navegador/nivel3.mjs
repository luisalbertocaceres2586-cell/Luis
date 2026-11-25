// Nivel 3 (Carrera de los Farolillos) v10 — "robot jugador" en navegador real con la física real:
// recorre el nivel completo (hasta el jefe y la meta) y comprueba que nada se rompe (sin errores, sin NaN) y que cada mecánica nueva
// aparece y funciona: sombra única, nubes-plataforma, portales de poder (dash/imán/escudo), vallas, muros con hueco, shurikens, vigas,
// eventos (lluvia, viento, invertidos, oscuro), combo ×2…×5 y jefe final. Guarda capturas en /tmp/n3_<hito>.png.
// Uso:  python3 -m http.server 8123  (en la raíz del repo)  y luego   node tests/navegador/nivel3.mjs [http://localhost:8123] [intentos] [hacerErrores=0|1]
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const [,, base = 'http://localhost:8123', intentos = '3', errores = '0'] = process.argv;
const browser = await puppeteer.launch({ args: [...chromium.args.filter(a => !a.includes('single-process')), '--no-sandbox', '--disable-dev-shm-usage'], executablePath: await chromium.executablePath(), headless: 'shell' });
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };

async function partida(n) {
  const page = await browser.newPage(); await page.setViewport({ width: 540, height: 960 });
  const logs = []; page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message)); page.on('console', m => { if (m.type() === 'error') logs.push('console: ' + m.text().slice(0, 160)); });
  await page.evaluateOnNewDocument(() => {   // se guarda la API del juego y se frena el reloj real: la prueba avanza la física a mano
    let N; Object.defineProperty(window, 'Nivel3', { configurable: true, get: () => N, set: v => { N = { iniciar: o => (window.__n3 = v.iniciar(o)) }; } });
    window.requestAnimationFrame = () => 0;
  });
  await page.goto(base + '/nivel3.html?heroe=sakura&n=' + (n % 2 ? 4 : 6), { waitUntil: 'load', timeout: 90000 });
  await new Promise(r => setTimeout(r, 1200));
  const vistos = {}; const tomadas = new Set();
  async function foto(k) { if (tomadas.has(k)) return; tomadas.add(k); await page.evaluate(() => __n3.dibuja()); await page.screenshot({ path: `/tmp/n3_${k}.png` }); }
  await page.click('#go'); await page.evaluate(() => { window.__toasts = new Set(); window.__bot = { mal: 0 }; });
  const fallar = errores === '1';
  let pasos = 0, fin = false, res = null;
  while (pasos < 70000 && !fin) {
    res = await page.evaluate((fallar) => {
      const A = __n3, f = [];
      for (let i = 0; i < 40; i++) {
        const S = A.estado(); if (S.fin) break;
        S.toasts.forEach(t => __toasts.add(t.txt));
        const dz = it => it.d - S.dist, items = S.items;
        // 1) plaza y portales de poder: elegir el carril de la respuesta (o una mala a propósito si fallar)
        let objetivo = null;
        const fila = S.filaAct; if (fila && S.plaza) { const o = items.find(x => x.k === 'orb' && x.row === fila && (fallar ? !x.ok : x.ok)); if (o) objetivo = o.lane; }
        const po = items.find(x => x.k === 'orb' && x.row.poder && !x.row.res && dz(x) > 0 && dz(x) < 30 && x.ok); if (!objetivo && objetivo !== 0 && po) objetivo = po.lane;
        // 2) peligros inmediatos
        let salto = false, desliza = false, esquiva = null;
        for (const it of items) {
          const z = dz(it); if (z < -0.5 || z > 14) continue;
          if (it.k === 'obs' && !it.roto && Math.abs(S.tl - it.lane) < 0.5 && S.skate <= 0 && S.dash <= 0) {
            if (it.tipo === 'bajo' || it.tipo === 'fuego') { if (z < 5.5) salto = true; } else if (it.tipo === 'alto') { if (z < 4.5) desliza = true; }
            else if (it.tipo === 'muro') { const libre = [0, 1, 2].find(l => !items.some(o => o.k === 'obs' && o.tipo === 'muro' && !o.roto && Math.abs(dz(o) - z) < 1 && o.lane === l)); if (libre !== undefined) esquiva = libre; }
          }
          if (it.k === 'viga' && !it.roto && Math.abs(S.tl - it.lane) < 0.5 && S.dash <= 0) esquiva = [0, 1, 2].find(l => l !== it.lane && !items.some(o => o.k === 'obs' && !o.roto && o.lane === l && Math.abs(dz(o)) < 6));
          if (it.k === 'shu' && !it.roto && it.act && z < 8 && Math.abs(S.px - it.x) < 1.6 && S.dash <= 0) { if (z < 3.2) salto = true; }
          if (it.k === 'plat' && A.__sube !== false && Math.abs(S.tl - it.lane) < 0.5 && z > 0 && z < 4 && S.jh <= S.base + 1) salto = true;
        }
        // subir a la primera nube que se vea (para probar la mecánica)
        if (!objetivo && objetivo !== 0 && esquiva === null) { const pl = items.find(x => x.k === 'plat' && dz(x) > 2 && dz(x) < 26); if (pl && !S.sobre) objetivo = pl.lane; else if (S.sobre && S.sobre.hasta - S.dist > 2) objetivo = S.sobre.lane; }
        if (esquiva !== null && esquiva !== undefined) objetivo = esquiva;
        if (objetivo !== null && objetivo !== undefined && Math.abs(S.tl - objetivo) >= 1) A.accion(S.tl > objetivo ? 'izq' : 'der');
        else if (esquiva === null && !salto && !desliza && objetivo === null && S.tl !== 1 && Math.random() < 0.01) A.accion(S.tl > 1 ? 'izq' : 'der');
        if (salto && S.jh <= S.base + 1) A.accion('salta'); else if (desliza && S.slide <= 0) A.accion('baja');
        if (S.espera) A.accion('listo');
        if (S.invCtrl) { /* el robot sabe que izq/der están al revés: ya lo compensa el propio juego */ }
        A.paso(1 / 60); if (i % 20 === 0) A.dibuja();
        const k = x => x.k;
        if (S.sobre) f.push('plat'); if (S.dash > 0) f.push('dash'); if (S.iman > 0) f.push('iman'); if (S.escudo > 0) f.push('escudo'); if (S.jefeVis) f.push('jefe'); if (S.oscuro > 0.85) f.push('oscuro'); if (S.viento) f.push('viento'); if (S.invCtrl) f.push('invertido');
        if (S.mult >= 2) f.push('combo' + S.mult); if (S.jh > 100 && !S.sobre && S.vuelo <= 0) f.push('salto'); if (S.vuelo > 0) f.push('vuelo');
        if (items.some(x => x.k === 'oro' && dz(x) < 14 && x.hasta - S.dist > 0)) f.push('lluvia');
        if (items.some(x => x.k === 'shu' && x.act && !x.roto && dz(x) > 2 && dz(x) < 14)) f.push('shuriken');
        if (items.some(x => x.k === 'viga' && x.cayo && !x.roto && dz(x) > 3 && dz(x) < 14)) f.push('viga');
        if (items.some(x => x.k === 'obs' && x.tipo === 'muro' && !x.roto && dz(x) > 3 && dz(x) < 12)) f.push('muro');
        if (items.some(x => x.k === 'obs' && x.tipo === 'fuego' && x.act && !x.roto && dz(x) > 2 && dz(x) < 16)) f.push('fuego');
        if (items.some(x => x.k === 'obs' && x.skin === 'valla' && !x.roto && dz(x) > 3 && dz(x) < 12)) f.push('valla');
        if (items.some(x => x.k === 'orb' && x.row.poder && !x.row.res && dz(x) > 3 && dz(x) < 14)) f.push('poder');
        if (!isFinite(S.dist) || !isFinite(S.jh) || !isFinite(S.px) || !isFinite(S.v)) f.push('NAN');
        if (f.includes('NAN')) break;
      }
      const S = A.estado();
      return { fin: !!S.fin, f: [...new Set(f)], dist: S.dist, vidas: S.vidas, mundo: S.mundo, monedas: S.monedas, aciertos: S.aciertos, errores: S.errores, multMax: S.multMax, jefeHp: S.jefeHp, jefeVis: S.jefeVis, golpes: S.golpes, t: S.t, dash: S.dash };
    }, fallar);
    pasos += 40;
    for (const k of res.f) { vistos[k] = (vistos[k] || 0) + 1; if (!tomadas.has(k) && k !== 'NAN') await foto(k); }
    if (res.f.includes('NAN')) { console.log('  NaN en el estado', res); break; }
    fin = res.fin;
  }
  const toasts = await page.evaluate(() => [...window.__toasts]);
  await page.screenshot({ path: `/tmp/n3_final_${n}.png` });
  await page.close();
  return { res, vistos, toasts, logs, pasos };
}


// ── Escenarios deterministas: se coloca UNA cosa delante del héroe y se comprueba qué pasa (sin azar ni robot) ──
async function escenarios() {
  console.log('\n== Escenarios deterministas');
  const page = await browser.newPage(); await page.setViewport({ width: 540, height: 960 });
  const logs = []; page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message)); page.on('console', m => { if (m.type() === 'error') logs.push('console: ' + m.text().slice(0, 160)); });
  await page.evaluateOnNewDocument(() => { let N; Object.defineProperty(window, 'Nivel3', { configurable: true, get: () => N, set: v => { N = { iniciar: o => (window.__n3 = v.iniciar(o)) }; } }); window.requestAnimationFrame = () => 0; });
  await page.goto(base + '/nivel3.html?heroe=sakura', { waitUntil: 'load', timeout: 90000 }); await new Promise(r => setTimeout(r, 1000)); await page.click('#go');
  const R = await page.evaluate(() => {
    const A = __n3, S = A.estado(), o = {};
    const reset = () => { Object.assign(S, { items: [], filas: [], vidas: 3, inv: 0, dash: 0, escudo: 0, iman: 0, skate: 0, tl: 1, px: 1, jh: 0, jv: 0, base: 0, sobre: null, cae: 0, invCtrl: false, plaza: false, espera: false, racha: 0, combo: 0, mult: 1, comboT: 0, monedas: 0, viento: null, slide: 0, hurt: 0, v: 9 }); S.sp.nextD = 1e9; S.sp.fin = true; };
    const run = (s, cada) => { for (let i = 0; i < s * 60; i++) { A.paso(1 / 60); if (cada) cada(i); } };
    const it = (x, d) => Object.assign({ d: S.dist + d, roto: false, tomado: false, tomada: false }, x);
    // 1) viga: golpea si no cambias de carril; se esquiva cambiando; el dash la atraviesa
    reset(); S.items = [it({ k: 'viga', lane: 1 }, 25)]; run(4); o.vigaGolpe = S.vidas;
    reset(); S.items = [it({ k: 'viga', lane: 1 }, 25)]; A.accion('izq'); run(4); o.vigaEsquiva = S.vidas;
    reset(); S.items = [it({ k: 'viga', lane: 1 }, 25)]; S.dash = 3; run(4); o.vigaDash = S.vidas;
    // 2) muro con hueco
    reset(); S.items = [it({ k: 'obs', tipo: 'muro', lane: 0 }, 25), it({ k: 'obs', tipo: 'muro', lane: 2 }, 25)]; run(4); o.muroHueco = S.vidas;
    reset(); S.items = [it({ k: 'obs', tipo: 'muro', lane: 1 }, 25), it({ k: 'obs', tipo: 'muro', lane: 2 }, 25)]; run(4); o.muroChoque = S.vidas;
    // 3) valla (saltar) y barra (deslizarse)
    reset(); S.items = [it({ k: 'obs', tipo: 'bajo', skin: 'valla', lane: 1 }, 25)]; run(4); o.vallaSinSaltar = S.vidas;
    reset(); const v1 = it({ k: 'obs', tipo: 'bajo', skin: 'valla', lane: 1 }, 25); S.items = [v1]; run(4, () => { const z = v1.d - S.dist; if (z < 3.8 && z > 2.8 && S.jh <= 1) A.accion('salta'); }); o.vallaSaltando = S.vidas;
    reset(); const v2 = it({ k: 'obs', tipo: 'alto', skin: 'barra', lane: 1 }, 25); S.items = [v2]; run(4, () => { const z = v2.d - S.dist; if (z < 4.5 && z > 3.5 && S.slide <= 0) A.accion('baja'); }); o.barraDeslizando = S.vidas;
    // 4) shuriken: el dash la rompe
    reset(); S.dash = 3; S.items = [it({ k: 'shu', x: 0.2, dir: 1, act: false, rot: 0 }, 24)]; run(3); o.shuDash = S.vidas;
    // 5) nube-plataforma: saltar sube, queda a la altura de la nube, baja al terminar; ↓ te baja antes
    reset(); const pl = it({ k: 'plat', lane: 1, hasta: S.dist + 8 + 16 }, 8); S.items = [pl]; let subio = false, alt = 0, salto = false; run(3.6, () => { if (!salto && pl.d - S.dist <= 5.5) { A.accion('salta'); salto = true; } if (S.sobre) { subio = true; alt = S.jh; } });
    o.nubeSubio = subio; o.nubeAltura = Math.round(alt); o.nubeBase = S.base; o.nubeJhFinal = Math.round(S.jh);
    reset(); const pl2 = it({ k: 'plat', lane: 1, hasta: S.dist + 8 + 60 }, 8); S.items = [pl2]; let s2 = false; run(1.6, () => { if (!s2 && pl2.d - S.dist <= 5.5) { A.accion('salta'); s2 = true; } }); o.nubeSobre1 = !!S.sobre; A.accion('baja'); run(0.8); o.nubeBajaConAbajo = !S.sobre && S.base === 0 && S.jh === 0;
    reset(); S.items = [it({ k: 'plat', lane: 1, hasta: S.dist + 8 + 60 }, 8)]; run(1); o.nubeSinSaltarNoSube = !S.sobre;
    // 6) viento: empuja de lado; invertidos: izquierda y derecha cambian
    reset(); S.items = [it({ k: 'zona', tipo: 'viento', dir: 1, hasta: S.dist + 80 }, 1)]; run(6); o.vientoDer = S.tl;
    reset(); S.items = [it({ k: 'zona', tipo: 'viento', dir: -1, hasta: S.dist + 80 }, 1)]; run(6); o.vientoIzq = S.tl;
    reset(); S.items = [it({ k: 'zona', tipo: 'inv', hasta: S.dist + 80 }, 1)]; run(0.5); o.invActivo = S.invCtrl; A.accion('izq'); o.invIzqVaDer = S.tl;
    // 7) portal de poder: acertar da poder (el primero es el dash); fallar no da nada ni rompe la racha
    const row = ok => ({ d: 0, T: 7, n: 8, c: 56, res: false, poder: true, plaza: false, q: '7 × 8 = ?' });
    reset(); S.racha = 4; { const r = row(); r.d = S.dist + 20; S.items = [0, 1, 2].map(l => it({ k: 'orb', lane: l, val: l === 1 ? 56 : 50 + l, ok: l === 1, row: r }, 20)); } run(3); o.poderAcierto = { dash: S.dash > 0, nPod: S.nPod };
    reset(); S.racha = 4; { const r = row(); r.d = S.dist + 20; S.items = [0, 1, 2].map(l => it({ k: 'orb', lane: l, val: l === 1 ? 56 : 50 + l, ok: l === 1, row: r }, 20)); } A.accion('izq'); run(3); o.poderFallo = { dash: S.dash, iman: S.iman, escudo: S.escudo, racha: S.racha };
    // 8) combo: 40 monedas seguidas suben el multiplicador hasta ×5
    reset(); S.items = []; for (let i = 0; i < 40; i++) S.items.push(it({ k: 'coin', lane: 1, h: 0 }, 6 + i * 1.5)); run(8); o.comboMult = S.mult; o.comboMax = S.multMax; o.comboMonedas = S.monedas;
    reset(); S.items = []; for (let i = 0; i < 10; i++) S.items.push(it({ k: 'coin', lane: 1, h: 0 }, 6 + i * 1.5)); run(2); S.vidas = 3; o.comboAntesGolpe = S.mult; S.items = [it({ k: 'obs', tipo: 'muro', lane: 1 }, 5)]; run(1.5); o.comboTrasGolpe = S.mult;
    // 9) la ninja se dibuja UNA sola vez (sin copias) aunque tenga racha; con dash hay estela de 3
    const cont = () => { let n = 0; const d0 = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (im) { try { if (im && im.src && /nivel3\/heroe\/sakura/.test(im.src)) n++; } catch (e) {} return d0.apply(this, arguments); }; A.dibuja(); CanvasRenderingContext2D.prototype.drawImage = d0; return n; };
    reset(); S.racha = 10; run(1); o.dibujosConRacha = cont();
    reset(); S.dash = 3; run(0.5); o.dibujosConDash = cont();
    reset(); S.racha = 0; run(0.2); S.jv = 900; S.jt = 0; run(0.25); o.alturaSalto = Math.round(S.jh);
    return o;
  });
  console.log('  ', JSON.stringify(R));
  ok(R.vigaGolpe === 2, 'la viga golpea si no cambias de carril'); ok(R.vigaEsquiva === 3, 'cambiar de carril esquiva la viga'); ok(R.vigaDash === 3, 'el dash atraviesa la viga');
  ok(R.muroHueco === 3, 'por el hueco del muro se pasa'); ok(R.muroChoque === 2, 'chocar contra el muro quita un corazón');
  ok(R.vallaSinSaltar === 2, 'la valla golpea si no saltas'); ok(R.vallaSaltando === 3, 'saltar la valla la esquiva'); ok(R.barraDeslizando === 3, 'deslizarse pasa bajo la barra');
  ok(R.shuDash === 3, 'el dash rompe la shuriken');
  ok(R.nubeSubio && R.nubeAltura === 105, 'saltar sobre la nube-plataforma sube al tercer nivel (altura 105)'); ok(R.nubeBase === 0 && R.nubeJhFinal === 0, 'al terminar la nube el héroe baja al suelo');
  ok(R.nubeSobre1 && R.nubeBajaConAbajo, '↓ te baja de la nube'); ok(R.nubeSinSaltarNoSube, 'sin saltar no se sube a la nube');
  ok(R.vientoDer === 2 && R.vientoIzq === 0, 'el viento empuja hacia su lado'); ok(R.invActivo && R.invIzqVaDer === 2, 'en carriles invertidos ← mueve a la derecha');
  ok(R.poderAcierto.dash && R.poderAcierto.nPod === 1, 'acertar el portal de poder da el dash'); ok(!R.poderFallo.dash && !R.poderFallo.iman && !R.poderFallo.escudo && R.poderFallo.racha === 4, 'fallar el portal no da poder ni rompe la racha');
  ok(R.comboMax === 5 && R.comboMonedas > 40, 'el combo llega a ×5 (' + R.comboMonedas + ' monedas)'); ok(R.comboAntesGolpe >= 2 && R.comboTrasGolpe === 1, 'un golpe reinicia el combo');
  ok(R.dibujosConRacha === 1, 'con racha larga la ninja se dibuja UNA vez (sin dobles): ' + R.dibujosConRacha); ok(R.dibujosConDash === 4, 'con dash: ella + 3 de estela: ' + R.dibujosConDash);
  ok(R.alturaSalto > 60, 'el salto sigue funcionando (' + R.alturaSalto + ')');
  ok(!logs.length, 'sin errores' + (logs.length ? ' → ' + logs.slice(0, 3).join(' | ') : ''));
  await page.close();
}

await escenarios();
if (process.env.SOLO_ESCENARIOS) { await browser.close(); console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodo en orden'); process.exit(fallos ? 1 : 0); }
const todos = {};
for (let n = 1; n <= +intentos; n++) {
  console.log(`\n== Partida ${n} ${errores === '1' ? '(responde mal a propósito)' : ''}`);
  const r = await partida(n);
  console.log('  resultado:', JSON.stringify(r.res)); console.log('  mecánicas (frames):', JSON.stringify(r.vistos)); console.log('  avisos:', r.toasts.slice(0, 60).join(' | '));
  ok(r.res.fin, 'el nivel termina (meta alcanzada) en ' + (r.pasos / 60 | 0) + ' s simulados');
  ok(!r.logs.length, 'sin errores de consola ni de página' + (r.logs.length ? ' → ' + r.logs.slice(0, 3).join(' | ') : ''));
  ok(!r.res.f.includes('NAN'), 'sin valores NaN');
  ok(r.res.jefeVis, 'apareció el jefe final'); if (errores !== '1') ok(r.res.jefeHp === 0, 'el jefe fue vencido respondiendo bien (vidas del jefe: ' + r.res.jefeHp + ')');
  Object.keys(r.vistos).forEach(k => todos[k] = (todos[k] || 0) + r.vistos[k]);
}
console.log('\n== Mecánicas vistas en total:', Object.keys(todos).sort().join(', '));
// lo que sale por sorteo (nubes, obstáculos, eventos) se prueba a fondo en los escenarios; aquí solo se informa. Obligatorio: jefe, salto y algún combo.
['plat', 'dash', 'oscuro', 'viento', 'invertido', 'lluvia', 'shuriken', 'viga', 'muro', 'fuego', 'valla', 'poder'].forEach(k => console.log('  ' + (todos[k] ? '·' : '○') + ' en las partidas ' + (todos[k] ? 'se vio: ' : 'no tocó (azar): ') + k));
['jefe', 'salto'].forEach(k => ok(todos[k], 'se vio: ' + k));
ok(Object.keys(todos).some(k => /^combo/.test(k)), 'se vio algún combo');
await browser.close();
console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodo en orden'); process.exit(fallos ? 1 : 0);
