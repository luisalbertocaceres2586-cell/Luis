/* Logo "NINJA X: Guardianes de las Tablas" en capas: arma las capas dentro de #introTitle (que ya está en index.html como div.nxl),
   agrega chispas y pétalos, da profundidad con un pequeño paralaje (mouse o inclinación del celular) y pausa todo cuando no se ve. */
(function () {
  'use strict';
  const root = document.getElementById('introTitle');
  if (!root || !root.classList.contains('nxl')) return;
  const P = 'assets/logo-ninja-x/';
  const L = (cls, html) => { const d = document.createElement('div'); d.className = 'l ' + cls; if (html) d.innerHTML = html; root.appendChild(d); return d; };
  const im = (f) => '<img src="' + P + f + '" alt="" decoding="async" draggable="false">';
  root.innerHTML = '';
  root.setAttribute('role', 'img'); root.setAttribute('aria-label', 'NINJA X: Guardianes de las Tablas');
  L('l-halo'); L('l-aura', im('aura.webp')); L('l-onda', im('fx_onda.webp')); L('l-perg', im('pergamino.webp')); L('l-ninja', im('ninja.webp')); L('l-brillo');
  L('l-xglow'); L('l-x', im('emblema_x.webp'));
  const fx = L('l-fx');
  const rnd = (a, b) => a + Math.random() * (b - a);
  // chispas fijas sobre los puntos brillantes del logo (x, y en % del lienzo) y la gema de la X
  const CH = [[7, 24, 7, 'fx_destello'], [30, 17, 5, 'fx_destello'], [54, 19, 6, 'fx_destello'], [75, 25, 5, 'fx_destello'], [91, 16, 6, 'fx_destello'], [81.5, 38, 9, 'fx_destello'],
    [96, 58, 6, 'fx_polvo'], [66, 62, 7, 'fx_polvo'], [20, 66, 6, 'fx_destello'], [48, 92, 6, 'fx_polvo'], [60, 40, 7, 'fx_chispas'], [4, 52, 7, 'fx_chispas']];
  CH.forEach(([x, y, s, f]) => { const i = document.createElement('i'); i.className = 'sp'; i.style.cssText = '--x:' + x + '%;--y:' + y + '%;--s:' + s + '%;--img:url(' + new URL(P + f + '.webp', document.baseURI).href + ');--t:' + rnd(2.2, 4.2).toFixed(2) + 's;--w:' + rnd(0, 4).toFixed(2) + 's'; fx.appendChild(i); });
  for (let k = 0; k < 6; k++) { const i = document.createElement('i'); i.className = 'pt'; i.style.cssText = '--x:' + (8 + k * 16 + rnd(-4, 4)).toFixed(1) + '%;--s:' + rnd(2.6, 4.2).toFixed(1) + '%;--t:' + rnd(6, 10).toFixed(1) + 's;--w:' + rnd(0, 7).toFixed(1) + 's'; fx.appendChild(i); }
  // entrada: se reproduce la primera vez que el logo se ve (así no se gasta mientras la intro todavía está tapando el menú)
  root.classList.add('pre');
  let visible = false, entro = false;
  const mirar = (v) => {
    visible = v && !document.hidden; root.classList.toggle('off', !visible);
    if (visible && !entro) { entro = true; root.classList.remove('pre'); root.classList.add('in'); }
  };
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => mirar(es[0].isIntersecting), { threshold: 0.05 }).observe(root); else mirar(true);
  document.addEventListener('visibilitychange', () => mirar(visible || !document.hidden));
  setTimeout(() => { if (!entro) { root.classList.remove('pre'); root.classList.add('in'); } }, 6000);   // por si el observador nunca avisa
  // paralaje suave
  let raf = 0, nx = 0, ny = 0;
  const poner = () => { raf = 0; root.style.setProperty('--px', nx.toFixed(3)); root.style.setProperty('--py', ny.toFixed(3)); };
  const mover = (x, y) => { nx = Math.max(-1, Math.min(1, x)); ny = Math.max(-1, Math.min(1, y)); if (!raf) raf = requestAnimationFrame(poner); };
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mover((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2); }, { passive: true });
  addEventListener('deviceorientation', (e) => { if (e.gamma != null) mover(e.gamma / 30, (e.beta - 45) / 30); }, { passive: true });
})();
