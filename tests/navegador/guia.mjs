// Prueba en navegador real de la guía visual del Nivel 1 ("Primeros minutos del jugador").
// Uso:  python3 -m http.server 8123   (en la raíz del repo)   y luego   node tests/navegador/guia.mjs
// Comprueba con la física real: el jugador que se queda quieto ve la ayuda dibujada (sin tarjeta de texto), el que juega bien NO ve nada,
// la ayuda apunta al enemigo y se va con un ✓ al lograrlo, en celular late el botón correcto, y si la guía faltara sigue la tarjeta de siempre.
// Cada escenario usa una pestaña nueva (el navegador sin pantalla se atora si se reinicia el nivel muchas veces en la misma).
// Capturas del lienzo del juego en /tmp/guia_*.png
import { writeFileSync } from 'fs';
import { open } from './lib.mjs';
const URL = 'http://localhost:8123/nivel1.html';
const inicio = await open(URL, { wait: 300 });
const { browser, logs } = inicio; let page = inicio.page, primera = true;
let fallos = 0; const check = (nombre, cond, extra) => { if (!cond) fallos++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 300) : '')); };
const pausa = ms => new Promise(r => setTimeout(r, ms));
const ev = (fn, ...a) => Promise.race([page.evaluate(fn, ...a), new Promise((_, no) => setTimeout(() => no(new Error('se colgó la página (30 s)')), 30000))]);

/** Pestaña nueva con el Nivel 1 listo; el jugador empieza sin haber visto ningún tutorial. */
async function escenario(o, vista) {
  if (!primera) { await page.close(); page = await browser.newPage(); page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 200))); page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 300))); await page.setViewport(vista || { width: 1280, height: 720 }); await page.goto(URL, { waitUntil: 'load', timeout: 90000 }); await pausa(300); }
  else if (vista) await page.setViewport(vista);
  primera = false;
  await ev(async (o) => {
    document.getElementById('ini') && document.getElementById('ini').remove();
    if (o && o.sinGuia) { window.__guia = window.N1guia; delete window.N1guia; }
    await Nivel1.iniciar(Object.assign({ heroe: 'sakura', semilla: 1, director: false }, o || {}));
    const S = Nivel1._estado(); S.tutoVisto = {}; if (window.N1guia) N1guia.iniciar(S); S.aviso = null;
  }, o);
}
const estado = () => ev(() => { const S = Nivel1._estado(), g = S.guia; return { act: g && g.act ? g.act.id : null, tip: S.tip ? S.tip.id : null, visto: Object.assign({}, S.tutoVisto), fx: g ? g.fx.length : 0, tajos: S.tajos, saltos: S.saltos, movido: Math.round(S.movido), x: Math.round(S.h.x), vida: S.h.vida }; });
const paso = n => ev(n => Nivel1._debug.paso(n), n);
const tecla = (k, v) => ev((k, v) => { Nivel1._debug.keys[k] = v; if (v) window.N1core.pulsar(k); }, k, v);
// la captura sale del propio lienzo del juego (page.screenshot descompone al navegador sin pantalla y cuelga el escenario siguiente)
const foto = async nombre => { await pausa(200); const d = await ev(() => document.querySelector('#n1Root canvas').toDataURL('image/png')); writeFileSync('/tmp/guia_' + nombre + '.png', Buffer.from(d.split(',')[1], 'base64')); };

console.log('Guía · jugador que se queda quieto');
await escenario();
check('la guía está cargada', await ev(() => typeof N1guia === 'object' && !!Nivel1._estado().guia));
await paso(60); check('al segundo no hay ayuda todavía (espera antes de ayudar)', (await estado()).act === null);
await paso(60 * 3);
let e = await estado(); check('a los ~4 s sin moverse sale la ayuda de caminar, DIBUJADA (no la tarjeta de texto)', e.act === 'mover' && e.tip === null, e);
await foto('1_caminar');
await tecla('ArrowRight', 1); await paso(60 * 2); e = await estado();
check('al caminar se va y queda como visto', e.act === null && e.visto.mover === 1 && e.movido > 160, e);

console.log('Guía · jugador que ya sabe jugar');
await escenario();
await tecla('ArrowRight', 1); let vio = [];
for (let i = 0; i < 9; i++) { await tecla('Space', 1); await paso(8); await tecla('Space', 0); await paso(22); const a = (await estado()).act; if (a && a !== 'arquero' && a !== 'escarabajo') vio.push(a); }
e = await estado(); check('si camina y salta solo desde el principio, NO se le muestra la ayuda de caminar ni la de saltar', vio.length === 0 && e.visto.mover === 1 && e.visto.saltar === 1 && e.saltos > 1, { vio, e });

console.log('Guía · apunta al enemigo y celebra');
await escenario();
const dx = await ev(() => { const S = Nivel1._estado(); const en = S.enemigos.filter(q => q.vivo && q.kind !== 'oni').sort((a, b) => a.x - b.x)[0]; S.tutoVisto.mover = S.tutoVisto.saltar = S.tutoVisto.arquero = S.tutoVisto.escarabajo = 1; S.h.x = en.x - 330; S.cam = Math.max(0, S.h.x - 400); S.enemigos.forEach(q => { q.vx = 0; }); return Math.round(en.x); });
await paso(60 * 2.5); e = await estado(); check('cerca de un enemigo sale "Golpea" (tajo)', e.act === 'tajo', e);
const objetivo = await ev(() => N1guia.ESPEC.tajo.obj(Nivel1._estado()));
check('y apunta al enemigo de verdad', objetivo && Math.abs(objetivo.x - dx) < 120, { objetivo, dx });
await foto('2_tajo');
await tecla('KeyC', 1); await paso(8); await tecla('KeyC', 0); await paso(30); e = await estado();
check('al pegar con la espada la ayuda se va y destella ✓', e.act === null && e.visto.tajo === 1 && e.tajos > 0, e);
await foto('3_logrado');

console.log('Guía · celular');
await escenario({ dispositivo: 'movil' }, { width: 844, height: 390 });
await ev(() => { const S = Nivel1._estado(); S.tutoVisto.mover = 1; S.movido = 300; });
await paso(60 * 3.5); e = await estado(); check('en celular sale la ayuda de saltar', e.act === 'saltar', e);
const botones = await ev(() => [...document.querySelectorAll('.n1Tac button')].map(b => ({ k: b.dataset.k, late: b.classList.contains('n1Guia') })));
check('cada botón táctil sabe su tecla', botones.length >= 6 && botones.every(b => b.k), botones);
check('y SOLO late el botón de saltar (⤒)', botones.filter(b => b.late).map(b => b.k).join() === 'Space', botones);
await foto('4_celular');
for (let i = 0; i < 2; i++) { await tecla('Space', 1); await paso(10); await tecla('Space', 0); await paso(80); }   // dos saltos, esperando a aterrizar entre uno y otro
await paso(30);
e = await estado(); const late2 = await ev(() => document.querySelectorAll('.n1Tac button.n1Guia').length);
check('al lograrlo el botón deja de latir', e.act === null && late2 === 0, { e, late2 });

console.log('Guía · respaldo');
await escenario({ sinGuia: true });
await paso(60 * 3); e = await estado(); check('si faltara la guía, el motor muestra la tarjeta de texto de siempre', e.tip === 'mover', e);

const malos = logs.filter(l => /PAGEERROR|^error/i.test(l) && !/favicon|Failed to load resource/i.test(l));
check('sin errores en la consola', malos.length === 0, malos);
await browser.close();
console.log(fallos ? '\n' + fallos + ' comprobaciones FALLARON' : '\nTodo OK');
process.exit(fallos ? 1 : 0);
