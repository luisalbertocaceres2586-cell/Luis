/* Vistas previas vivas de las tarjetas de mundo — Ninja Multiplicación.
 * Cada tarjeta muestra una mini-partida en bucle (como un video corto) hecha con las imágenes reales del juego:
 * el personaje corre, salta, se desliza, recoge monedas y elige la respuesta correcta.
 * Todo se calcula como función del tiempo `t` (sin estado acumulado), así que el bucle siempre es limpio.
 *
 *   PreviewMundos.montar(escena, tarjeta, mundo, heroe, { pausa: () => bool }) → { visible(bool), destruir() } | null
 *   El mundo debe traer  demo: { tipo: 'carril' | 'lateral' | 'vuelo' }  (ver mundos-registro.js).
 * Cuando la primera imagen ya está lista, la tarjeta recibe la clase .demo-on (el CSS oculta entonces la escena estática). */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.PreviewMundos = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const doc = typeof document !== 'undefined' ? document : null;
  const A = 'assets/', EN = A + 'environment/', P = EN + 'props/', N1 = A + 'nivel1/', N2 = A + 'nivel2/';
  const B3 = A + 'nivel3/heroe/sakura/', SK = A + 'characters/sakura_assets/sakura/frames/', AN = A + 'characters/antarez/';
  const COIN = A + 'ui/hud/animados/moneda_girando.png';
  const FONT = '"Trebuchet MS","Segoe UI",system-ui,sans-serif';
  const pad = n => String(n).padStart(2, '0');
  const seq = (pre, a, b, suf) => { const r = []; for (let i = a; i <= b; i++) r.push(pre + pad(i) + suf); return r; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const mod = (a, n) => ((a % n) + n) % n;
  const hash = n => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0; };

  // ---------- imágenes ----------
  const cache = {};
  const IM = src => cache[src] || (cache[src] = (() => { const i = new root.Image(); i.src = src; return i; })());
  const ok = i => !!i && (i.naturalWidth || i.width) > 0;
  const iw = i => i.naturalWidth || i.width, ih = i => i.naturalHeight || i.height;

  const HEROES = {
    sakura: { run: seq(SK + 'run/sakura_run_', 1, 10, '.png'), jump: seq(SK + 'jump/sakura_jump_', 1, 10, '.png'),
      slide: seq(SK + 'crouch_slide_dash/sakura_crouch_slide_dash_', 1, 10, '.png'), melee: seq(SK + 'melee/sakura_melee_', 1, 10, '.png'), special: seq(SK + 'special/sakura_special_', 1, 10, '.png'),
      alf: [0, 1].map(i => N2 + 'vehiculos/alfombra_sakura_planeo_0' + i + '.png'), sube: N2 + 'vehiculos/alfombra_sakura_sube.png', baja: N2 + 'vehiculos/alfombra_sakura_baja.png' },
    kage: { run: seq(AN + 'run_', 1, 24, '.png'), jump: seq(AN + 'jump_', 1, 24, '.png'), slide: null, melee: seq(AN + 'kunai_', 1, 20, '.png'), special: seq(AN + 'kunai_', 1, 20, '.png'),
      alf: [0, 1].map(i => N2 + 'vehiculos/alfombra_kage_planeo_0' + i + '.png'), sube: N2 + 'vehiculos/alfombra_kage_sube.png', baja: N2 + 'vehiculos/alfombra_kage_baja.png' }
  };
  const man3 = () => root.NIVEL3_SAKURA_ESPALDA || null;

  // ---------- ayudas de dibujo ----------
  function texto(c, s, x, y, px, col, borde, al) {
    c.font = 'bold ' + Math.round(px) + 'px ' + FONT; c.textAlign = al || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = Math.max(2, px * .22); c.strokeStyle = borde || 'rgba(10,5,30,.92)'; c.strokeText(s, x, y); c.fillStyle = col || '#fff'; c.fillText(s, x, y);
  }
  function brillo(c, x, y, r, rgb, a) { if (r < 1) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function imagen(c, src, x, yBase, h, alpha, flip) {
    const i = IM(src); if (!ok(i) || h < 1) return false; const w = h * iw(i) / ih(i); c.globalAlpha = alpha == null ? 1 : alpha;
    if (flip) { c.save(); c.translate(x, 0); c.scale(-1, 1); c.drawImage(i, -w / 2, yBase - h, w, h); c.restore(); } else c.drawImage(i, x - w / 2, yBase - h, w, h);
    c.globalAlpha = 1; return true;
  }
  function moneda(c, x, y, r, t) {
    const i = IM(COIN);
    if (ok(i)) c.drawImage(i, (Math.floor(t * 10) % 6) * 160, 0, 160, 160, x - r, y - r, r * 2, r * 2);
    else { c.fillStyle = '#ffd35a'; c.beginPath(); c.arc(x, y, r * .8, 0, 7); c.fill(); }
  }
  function chispas(c, x, y, tp, n, esc, rgb, semilla) {
    if (tp < 0 || tp > .8) return;
    for (let i = 0; i < n; i++) {
      const h = hash(semilla * 97 + i), a = (h % 628) / 100, v = (50 + ((h >> 8) % 90)) * esc, d = tp * v;
      c.globalAlpha = clamp(1 - tp / .8, 0, 1); c.fillStyle = rgb; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + tp * tp * 140 * esc, Math.max(1, 3 * esc * (1 - tp / .8) + .5), 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }
  function pastilla(c, s, cx, cy, w, h, acento, px) { rr(c, cx - w / 2, cy - h / 2, w, h, h / 2); c.fillStyle = 'rgba(12,6,36,.78)'; c.fill(); c.lineWidth = 2; c.strokeStyle = acento; c.stroke(); texto(c, s, cx, cy + 1, px, '#fff6c2'); }
  // héroe de perfil (niveles 1 y 2): se escala con el alto del primer cuadro para que no «salte» entre cuadros
  function lado(c, lista, idx, x, yPies, alto) {
    const i = IM(lista[Math.floor(idx) % lista.length]), r = IM(lista[0]); if (!ok(i)) return;
    const sc = alto / (ok(r) ? ih(r) : ih(i)), w = iw(i) * sc, h = ih(i) * sc; c.drawImage(i, x - w / 2, yPies - h, w, h);
  }

  // ============================================================================================
  //  CARRIL — Carrera de los Farolillos (la dinámica real del Nivel 3, vista desde atrás)
  //  carrera libre → monedas, barril (salto), arco (deslizarse) → plaza de pregunta (la pista se frena) → puertas → premio
  // ============================================================================================
  function crearCarril(m, heroeId) {
    const T = 18.5, ZMAX = 80, Z0 = 18;
    const KF = [[0, 9], [7.6, 9], [9.2, 3.2], [10.6, 3.2], [10.95, 0], [11.9, 0], [12.4, 4.6], [13.6, 9], [T, 9]];
    const vel = t => { for (let i = 1; i < KF.length; i++) if (t <= KF[i][0]) { const a = KF[i - 1], b = KF[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / ((b[0] - a[0]) || 1); } return 9; };
    const N = Math.round(T * 100), tab = new Float32Array(N + 1);
    for (let i = 1; i <= N; i++) tab[i] = tab[i - 1] + vel((i - .5) / 100) / 100;
    const Dl = tab[N];
    const dist = t => { const k = Math.floor(t / T), f = (t - k * T) * 100, i = Math.min(N - 1, Math.floor(f)); return k * Dl + tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
    const tAt = D => { let lo = 0, hi = N; while (lo < hi) { const mid = (lo + hi) >> 1; if (tab[mid] < D) lo = mid + 1; else hi = mid; } return lo / 100; };
    const Dd = dist(11.9) + 9, tD = tAt(Dd);
    const items = [], add = (k, lane, tA, o) => items.push(Object.assign({ k, lane, tA, D: dist(tA) }, o || {}));
    const arc = [0, 40, 75, 90, 75, 40, 0];
    for (let i = 0; i < 6; i++) add('moneda', 1, .9 + i * .22);
    add('barril', 0, 4.0); for (let i = 0; i < 7; i++) add('moneda', 0, 3.55 + i * .15, { h: arc[i], pico: i === 3 });
    add('torii', 0, 6.3); for (let i = 0; i < 5; i++) add('moneda', 0, 5.85 + i * .2);
    items.push({ k: 'arco', D: Dd - 26, tA: tAt(Dd - 26) }); items.push({ k: 'puerta', D: Dd, tA: tD });
    for (let i = 0; i < 4; i++) add('moneda', 2, tD + .9 + i * .18);
    add('caja', 2, tD + 2.0);
    const LK = [[0, 1], [2.0, 1], [2.6, 0], [tD - 2.3, 0], [tD - 1.7, 2], [tD + 3.2, 2], [tD + 3.9, 1], [T, 1]];
    const lane = t => { for (let i = 1; i < LK.length; i++) if (t <= LK[i][0]) { const a = LK[i - 1], b = LK[i]; if (a[1] === b[1]) return { l: a[1] }; const s = (t - a[0]) / (b[0] - a[0]); return { l: a[1] + (b[1] - a[1]) * suave(s), cambia: true, s, der: b[1] > a[1] }; } return { l: 1 }; };
    const MONEDAS = items.filter(o => o.k === 'moneda');
    const suelo = (m.fases[0] && m.fases[0].suelo) || ['#10142e', '#1a2550'], ruta = (m.demo && m.demo.ruta) || ['#4b3f7c', '#2b2152'];
    const FAR = m.fases[0].far, DEC = (m.props || []).filter(p => !p.alto).map(p => p.img);
    const TORII = P + 'structures/torii_small_lanterns_c.png', ARCO = P + 'structures/torii_lanterns_a.png', BARRIL = P + 'objects/barrel_c.png';
    const H = HEROES[heroeId] || HEROES.sakura, espalda = () => heroeId !== 'kage' && man3();
    // arte propio del Nivel 3 (el mismo que se ve jugando)
    const NA = A + 'nivel3/arte/', PANO = m.demo && m.demo.pano, COINS = [1, 2, 3, 4].map(i => NA + 'monedas/coin_' + i + '.png'), COINR = NA + 'monedas/coin_racha.png';
    const OB_BARRIL = NA + 'obstaculos/barril.png', OB_TORII = NA + 'obstaculos/torii_bajo.png', CAJA = NA + 'potenciadores/caja.png', BURB = NA + 'efectos/burbuja.png', POLVO = NA + 'efectos/polvo.png';
    const ZRUN = [1, 2, 3, 4].map(i => NA + 'zorro/run_' + i + '.png'), ZSAL = NA + 'zorro/salto.png', ZSEN = NA + 'zorro/senala.png', ZCEL = NA + 'zorro/celebra.png', ZESP = NA + 'zorro/espera.png';
    const rgba = (hex, a) => { const n = parseInt(hex.replace('#', ''), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
    const imgs = [FAR, COIN, TORII, ARCO, BARRIL, COINR, OB_BARRIL, OB_TORII, CAJA, BURB, POLVO, ZSAL, ZSEN, ZCEL, ZESP].concat(COINS, ZRUN, PANO ? [PANO] : [], DEC, H.run, H.jump);
    if (heroeId !== 'kage') ['run', 'jump', 'roll', 'carril', 'celebra'].forEach(n => { for (let i = 1; i <= 8; i++) imgs.push(B3 + n + '_' + pad(i) + '.png'); });

    function dibujar(c, W, Hh, t, op) {
      const Wn = Math.min(W, Hh * .72), tl = mod(t, T), dn = dist(t), u = Hh / 960, hor = .19 * Hh, Py = .5 * Hh, LW = .27 * Wn, sinHud = !!(op && op.sinHud); let s;
      const pz = z => 1 / (1 + z / Z0), yz = z => hor + (Py - hor) * pz(z), xz = (l, z) => W / 2 + (l - 1) * LW * pz(z);
      let g = c.createLinearGradient(0, 0, 0, hor + 4); g.addColorStop(0, m.cielo[0]); g.addColorStop(1, m.cielo[1]); c.fillStyle = g; c.fillRect(0, 0, W, hor + 4);
      const mt = IM(FAR), pn = PANO ? IM(PANO) : null, lap = lane(tl);
      if (!(pn && ok(pn)) && ok(mt)) { const hh = .2 * Hh, ww = hh * iw(mt) / ih(mt), off = -mod(dn * 3 * u, ww); for (let x = off - ww; x < W + ww; x += ww) c.drawImage(mt, x, hor - hh + 2, ww, hh); }
      g = c.createLinearGradient(0, hor, 0, Hh); g.addColorStop(0, suelo[1]); g.addColorStop(1, suelo[0]); c.fillStyle = g; c.fillRect(0, hor, W, Hh - hor);

      if (pn && ok(pn)) {
        const hp = hor + .09 * Hh, asp = iw(pn) / ih(pn), hh = hp * 1.32, ww = hh * asp, lim = Math.min(ww * .04, 14), sh = clamp(-(lap.l - 1) * 6 + Math.sin(t * .25) * 4, -lim, lim), x0 = W / 2 - ww / 2 + sh;
        for (let k = Math.floor(-x0 / ww) - 1; k <= Math.ceil((W - x0) / ww); k++) {
          const xx = x0 + k * ww; c.save(); if (k & 1) { c.translate(xx + ww, 0); c.scale(-1, 1); c.drawImage(pn, 0, hp - hh, ww, hh); } else c.drawImage(pn, xx, hp - hh, ww, hh); c.restore();
        }
        const gf = c.createLinearGradient(0, hp * .5, 0, hp); gf.addColorStop(0, rgba(suelo[1], 0)); gf.addColorStop(1, rgba(suelo[1], 1)); c.fillStyle = gf; c.fillRect(0, hp * .5, W, hp * .5 + 1);
      }
      // camino en perspectiva
      const zf = ZMAX, zn = -11, lI = -.62, lD = 2.62;
      g = c.createLinearGradient(0, hor, 0, Hh); g.addColorStop(0, ruta[1]); g.addColorStop(1, ruta[0]); c.fillStyle = g;
      c.beginPath(); c.moveTo(xz(lI, zf), yz(zf)); c.lineTo(xz(lD, zf), yz(zf)); c.lineTo(xz(lD, zn), yz(zn)); c.lineTo(xz(lI, zn), yz(zn)); c.closePath(); c.fill();
      c.strokeStyle = m.acento || '#ffd24a'; c.globalAlpha = .75; c.lineWidth = 2; c.beginPath(); c.moveTo(xz(lI, zf), yz(zf)); c.lineTo(xz(lI, zn), yz(zn)); c.moveTo(xz(lD, zf), yz(zf)); c.lineTo(xz(lD, zn), yz(zn)); c.stroke(); c.globalAlpha = 1;
      c.strokeStyle = 'rgba(255,255,255,.3)';
      [.5, 1.5].forEach(lb => { for (let k = 0; k < 16; k++) { const z0 = k * 6 - mod(dn, 6), z1 = z0 + 2.6; if (z1 < zn || z0 > zf) continue; const a = Math.max(z0, zn), b = Math.min(z1, zf); c.lineWidth = Math.max(1, 3 * u * (pz(a) + pz(b))); c.beginPath(); c.moveTo(xz(lb, a), yz(a)); c.lineTo(xz(lb, b), yz(b)); c.stroke(); } });

      /** @type {[number, () => void][]} */
      const L = [], la = lane(tl), hx = W / 2 + (la.l - 1) * LW;
      // decorado a los lados
      if (DEC.length) for (let n = Math.floor(dn / 5.5) - 3; n < Math.floor((dn + ZMAX) / 5.5) + 1; n++) {
        const h = hash(n), z = n * 5.5 - dn, lado_ = (h & 1) ? 1 : -1, off = 1 + lado_ * (1.2 + .6 + ((h >> 4) & 3) * .28) + 0, img = DEC[(h >> 6) % DEC.length], hf = .9 + ((h >> 9) & 3) * .08;
        L.push([z, () => { const p = pz(z), x = xz(off, z), hh = .25 * Hh * p * hf; if (!imagen(c, img, x, yz(z), hh)) return; brillo(c, x, yz(z) - hh * .62, hh * .55, '255,185,80', .32 * clamp((ZMAX - z) / 26, 0, 1)); }]);
      }
      // objetos de la pista (en tres vueltas, para que el bucle no se note)
      [-1, 0, 1].forEach(k => items.forEach(o => {
        const z = o.D + k * Dl - dn; if (z < -4 || z > ZMAX) return; const tp = t - (o.tA + k * T), p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1);
        L.push([z, () => {
          const x = xz(o.lane == null ? 1 : o.lane, z), y = yz(z);
          if (o.k === 'moneda') { if (z < .4) { chispas(c, x, y - 46 * u * p * 1.3, tp, 5, .6, '#ffd35a', o.tA * 10 | 0); return; } const yy = y - (46 + (o.h || 0)) * u * p * 1.3; brillo(c, x, yy, .058 * Hh * p, '255,210,90', .4 * a); c.globalAlpha = a; if (!imagen(c, o.pico ? COINR : COINS[Math.floor(t * 9 + o.tA * 3) % 4], x, yy + .034 * Hh * p, .068 * Hh * p, a)) moneda(c, x, yy, .03 * Hh * p, t + o.tA); c.globalAlpha = 1; }
          else if (o.k === 'barril') { if (!imagen(c, OB_BARRIL, x, y, .15 * Hh * p, a)) imagen(c, BARRIL, x, y, .12 * Hh * p, a); }
          else if (o.k === 'torii') { if (!imagen(c, OB_TORII, x, y, .22 * Hh * p, a)) imagen(c, TORII, x, y, .21 * Hh * p, a); }
          else if (o.k === 'arco') { const hh = .34 * Hh * p; imagen(c, ARCO, W / 2, y, hh, a); }
          else if (o.k === 'caja') {
            if (z < .4) { chispas(c, x, y - 50 * u * p * 1.3, tp, 12, .7, '#c9a0ff', 7); return; }
            const r = .028 * Hh * p, yy = y - (50 + 8 * Math.sin(t * 4)) * u * p * 1.3; brillo(c, x, yy, r * 2.6, '190,140,255', .6 * a); if (imagen(c, CAJA, x, yy + r * 1.2, r * 2.5, a)) return; c.globalAlpha = a; c.fillStyle = '#7a3fd0'; c.strokeStyle = '#ffd35a'; c.lineWidth = Math.max(1.5, 3 * p); rr(c, x - r, yy - r, r * 2, r * 2, r * .22); c.fill(); c.stroke(); c.fillStyle = '#ffd35a'; c.fillRect(x - r * .14, yy - r, r * .28, r * 2); c.globalAlpha = 1; texto(c, '?', x, yy + r * .06, r * 1.2, '#fff');
          } else if (o.k === 'puerta') {
            const vals = [24, 32, 28], elegido = tp > -.02;
            for (let l = 0; l < 3; l++) {
              const x2 = xz(l, z), r = .05 * Hh * p, yy = y - 100 * u * p * 1.1, bob = Math.sin(t * 3 + l * 1.7) * 6 * u * p;
              if (elegido && l === 2) { if (tp < .5) chispas(c, x2, yy, tp, 22, 1, '#ffe27a', 11); continue; }
              const fade = elegido ? clamp(1 - tp * 2.2, 0, 1) * .3 : 1; if (fade <= .01 || z < -.3) continue;
              c.globalAlpha = a * fade; brillo(c, x2, y, r * 1.9, '110,190,255', .32);
              const og = c.createRadialGradient(x2, yy + bob, r * .1, x2, yy + bob, r); og.addColorStop(0, '#fffbe0'); og.addColorStop(.55, '#ffd35a'); og.addColorStop(1, '#ff8a3a');
              c.fillStyle = og; c.beginPath(); c.arc(x2, yy + bob, r, 0, 7); c.fill(); c.lineWidth = Math.max(1.5, 3 * p); c.strokeStyle = '#a8631b'; c.stroke(); c.globalAlpha = 1;
              texto(c, String(vals[l]), x2, yy + bob + r * .05, r * 1.0, '#3a1b00', 'rgba(255,255,255,.55)'); c.globalAlpha = 1;
            }
          }
        }]);
      }));
      // Sakura
      L.push([0, () => {
        let jh = 0, est = 'run', idx = Math.floor(t * 10) % 8;
        if ((s = (tl - 3.64) / .72) >= 0 && s <= 1) { est = 'jump'; idx = Math.min(7, Math.floor(s * 8)); jh = 120 * u * 4 * s * (1 - s); }
        else if ((s = (tl - 5.85) / .9) >= 0 && s <= 1) { est = 'roll'; idx = Math.min(7, Math.floor(s * 8)); }
        else if ((s = (tl - (tD - .05)) / 1.3) >= 0 && s <= 1) { est = 'celebra'; idx = Math.min(7, Math.floor(s * 8)); }
        else if (la.cambia) { est = 'carril'; idx = Math.min(3, Math.floor(la.s * 4)) + (la.der ? 4 : 0); }
        else if (tl > 10.9 && tl < 12.0) idx = Math.floor(t * 8) % 8;
        const y = Py - jh;
        { const kp = (tl - 4.36) / .5; if (kp >= 0 && kp <= 1) imagen(c, POLVO, hx, Py + 6 * u, .1 * Hh * (1 + kp * .7), (1 - kp) * .9); }
        c.fillStyle = 'rgba(0,0,0,.38)'; c.beginPath(); c.ellipse(hx, Py + 3 * u, 48 * u * (1 - jh / (400 * u)), 11 * u, 0, 0, 7); c.fill();
        const M = espalda();
        if (M && M.animations[est]) { const fr = M.animations[est].frames[idx % M.animations[est].frames.length], im = IM(B3 + fr.file), sc = .2 * Hh / M.refH; if (ok(im)) c.drawImage(im, hx - fr.ax * sc, y - fr.ay * sc, fr.w * sc, fr.h * sc); }
        else { lado(c, est === 'jump' ? H.jump : H.run, est === 'jump' ? s * H.jump.length : t * 14, hx, y, .22 * Hh); }
        const sh = clamp(Math.min(tl - (tD + 2.0), T - .5 - tl) / .4, 0, 1); // escudo de la caja sorpresa
        if (sh > 0 && imagen(c, BURB, hx, y + .05 * Hh, .23 * Hh, sh * .9)) { }
        else if (sh > 0) { c.globalAlpha = sh; c.fillStyle = 'rgba(120,200,255,.16)'; c.strokeStyle = 'rgba(160,225,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(hx, y - .095 * Hh, .105 * Hh + 3 * Math.sin(t * 6), 0, 7); c.fill(); c.stroke(); c.globalAlpha = 1; }
      }]);
      // zorro compañero (de espalda): corre al lado, salta con ella, señala la pista, espera en la plaza y celebra
      L.push([.02, () => {
        const side = clamp((1.15 - la.l) * 4, -1, 1), fx = clamp(hx + side * .2 * Wn, W * .08, W * .92), hh = .14 * Hh; let im = null, dy = 0;
        if (tl > tD - .05 && tl < tD + 1.5) im = ZCEL;
        else if (tl > 3.64 && tl < 4.36) { im = ZSAL; dy = -Math.abs(Math.sin((tl - 3.64) / .72 * Math.PI)) * 30 * u; }
        else if (tl > 9.3 && tl < 10.9) im = ZSEN;
        else if (tl >= 10.9 && tl < 12.05) im = ZESP;
        else { im = ZRUN[Math.floor(t * 10 + 2) % 4]; dy = -Math.abs(Math.sin(t * 8)) * 5 * u; }
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(fx, Py + 22 * u, hh * .24, 7 * u, 0, 0, 7); c.fill(); imagen(c, im, fx, Py + 22 * u + dy, hh);
      }]);
      L.sort((a, b) => b[0] - a[0]); L.forEach(f => f[1]());
      // texto en pantalla (igual que en el juego)
      const hayQ = tl > 8.6 && tl < tD + .1;
      if (sinHud) return;
      pastilla(c, hayQ ? '¿Cuánto es 7 × 4?' : '¡Corre y junta monedas!', W / 2, .2 * Hh, Wn * (hayQ ? .66 : .74), .06 * Hh, m.acento || '#ffd24a', .036 * Hh);
      const n = MONEDAS.filter(o => o.tA < tl).length + (tl > tD ? 8 : 0);
      moneda(c, W - .115 * W, .056 * Hh, .027 * Hh, t); texto(c, String(n), W - .07 * W, .058 * Hh, .034 * Hh, '#ffe27a', null, 'left');
      s = (tl - tD) / 1.4; if (s >= 0 && s <= 1) { c.globalAlpha = clamp(1 - Math.abs(s - .45) * 1.4, 0, 1); texto(c, '¡Perfecto! +8', W / 2, .31 * Hh - s * .04 * Hh, .05 * Hh, '#7dffb0'); c.globalAlpha = 1; }
    }
    return { dur: T, imgs, dibujar, listo: () => ok(IM(FAR)) && (espalda() ? ok(IM(B3 + 'run_01.png')) : ok(IM(H.run[0]))) };
  }

  // ============================================================================================
  //  LATERAL — La Senda del Aprendiz (Nivel 1): correr, saltar la roca, atacar al ninja sombra, deslizarse y cruzar el torii
  // ============================================================================================
  function crearLateral(m, heroeId) {
    const T = 11.5, f0 = m.fases[0], props = f0.props || m.props || [], H = HEROES[heroeId] || HEROES.sakura;
    const ORBE = N1 + 'items_jefe/orbe_energia.png', ROCA = N1 + 'enemigos/roca_gigante.png', NINJA = N1 + 'enemigos/ninja_sombra.png', BANDERA = N1 + 'decorado/estandarte_colgante.png', TORII = N1 + 'decorado/torii_activo.png';
    /** @type {any[][]} */
    const EV = [[.9, 'orbe'], [1.2, 'orbe'], [1.5, 'orbe'], [2.8, 'roca'], [4.35, 'ninja2'], [5.4, 'ninja'], [7.6, 'bandera'], [9.7, 'torii']];
    const arc = [0, .055, .1, .115, .1, .055, 0];
    const imgs = [f0.far, ORBE, ROCA, NINJA, BANDERA, TORII].concat(props.map(p => p.img), H.run, H.jump, H.slide || [], H.melee || [], H.special || []);
    function dibujar(c, W, Hh, t) {
      const Ws = Math.min(W, Hh * 1.15), tl = mod(t, T), kk = Math.floor(t / T), gy = .47 * Hh, pies = .5 * Hh, hx = (W - Ws) / 2 + .27 * Ws, sp = .55 * Ws;
      let g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, m.cielo[0]); g.addColorStop(1, m.cielo[1]); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
      const far = IM(f0.far); if (ok(far)) { const hh = .38 * Hh, ww = hh * iw(far) / ih(far); for (let x = -mod(t * sp * .06, ww); x < W + 4; x += ww) c.drawImage(far, x, .5 * Hh - hh, ww, hh); }
      g = c.createLinearGradient(0, gy, 0, Hh); g.addColorStop(0, f0.suelo[0]); g.addColorStop(1, f0.suelo[1]); c.fillStyle = g; c.fillRect(0, gy, W, Hh - gy);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, gy, W, 2);
      const capa = (lista, vel, base, alto) => lista.forEach(p => { const tile = W * 1.25, X = mod(p.x / 100 * tile - t * sp * vel, tile) - .15 * tile; [X, X - tile].forEach(x => imagen(c, p.img, x, base, alto * p.h / 100)); });
      capa(props.filter(p => p.capa !== 'cerca'), .3, .49 * Hh, .5 * Hh);
      capa(props.filter(p => p.capa === 'cerca'), 1, .52 * Hh, .42 * Hh);
      const ev = (k, fn) => EV.forEach(e => { const te = e[0] + k * T, x = hx + (te - t) * sp; if (x > -.3 * W && x < 1.3 * W) fn(e, x, t - te); });
      // objetos que vienen
      [kk, kk + 1].forEach(k => ev(k, (e, x, tp) => {
        const tg = e[1];
        if (tg === 'orbe') { if (x < hx + .03 * Ws) { chispas(c, x, gy - .08 * Hh, tp, 6, .7, '#9ad7ff', e[0] * 10 | 0); return; } brillo(c, x, pies - .065 * Hh, .06 * Hh, '150,210,255', .5); imagen(c, ORBE, x, pies - .04 * Hh, .06 * Hh); }
        else if (tg === 'roca') { imagen(c, ROCA, x, pies, .125 * Hh); [0, 1, 2, 3, 4, 5, 6].forEach(i => { const xx = x + (i - 3) * .035 * Ws, h = arc[i] * Hh; if (xx < hx + .03 * Ws) return; imagen(c, ORBE, xx, pies - .05 * Hh - h, .042 * Hh); }); }
        else if (tg === 'ninja2') { if (tp > -.45) { const f = clamp(1 - (tp + .45) * 3.5, 0, 1); chispas(c, x, pies - .12 * Hh, tp + .45, 20, 1, '#ff9ad5', 4); if (f > 0) imagen(c, NINJA, x, pies, .25 * Hh, f, true); return; } imagen(c, NINJA, x + Math.sin(t * 9) * 1.5, pies, .25 * Hh, 1, true); }
        else if (tg === 'ninja') { if (tp > .05) { const f = clamp(1 - (tp - .05) * 3, 0, 1); chispas(c, x, pies - .12 * Hh, tp, 22, 1, '#d9b3ff', 5); if (f > 0) imagen(c, NINJA, x, pies, .25 * Hh, f, true); return; } imagen(c, NINJA, x + Math.sin(t * 9) * 1.5, pies, .25 * Hh, 1, true); }
        else if (tg === 'bandera') { const top = pies - .33 * Hh; imagen(c, BANDERA, x, top + .21 * Hh, .21 * Hh); }
        else if (tg === 'torii') { brillo(c, x, pies - .2 * Hh, .3 * Hh, '255,210,90', .35); imagen(c, TORII, x, pies, .36 * Hh); if (tp > -.1) chispas(c, hx + .05 * Ws, pies - .2 * Hh, tp + .1, 26, 1.1, '#ffe27a', 9); }
      }));
      // Sakura
      let jh = 0, set = H.run, idx = t * 14, s, yy = 0;
      if ((s = (tl - 2.45) / .7) >= 0 && s <= 1) { set = H.jump; idx = Math.min(.999, s) * H.jump.length; jh = .2 * Hh * 4 * s * (1 - s); }
      else if ((s = (tl - 3.3) / .9) >= 0 && s <= 1) { set = H.special; idx = Math.min(.999, s) * H.special.length; }
      else if ((s = (tl - 4.95) / .6) >= 0 && s <= 1) { set = H.melee; idx = Math.min(.999, s) * H.melee.length; }
      else if ((s = (tl - 7.25) / .75) >= 0 && s <= 1) { set = H.slide || H.run; idx = H.slide ? Math.min(.999, s) * H.slide.length : t * 14; yy = H.slide ? 0 : 0; }
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(hx, pies + 2, .1 * W * (1 - jh / (.5 * Hh)), .016 * Hh, 0, 0, 7); c.fill();
      lado(c, set, idx, hx, pies - jh + yy, .3 * Hh);
      if (tl >= 3.5 && tl <= 3.92) { // kunai de energía hacia el ninja
        const k = (tl - 3.5) / .42, xs = hx + .07 * Ws, xe = hx + .45 * sp, px = xs + (xe - xs) * k, py = pies - .15 * Hh;
        brillo(c, px, py, .07 * Hh, '255,120,210', .6); c.save(); c.translate(px, py); c.rotate(t * 20); c.fillStyle = '#fff0fa'; c.strokeStyle = '#ff7ad9'; c.lineWidth = 2; c.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? .012 * Hh : .035 * Hh, a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.restore();
      }
    }
    return { dur: T, imgs, dibujar, listo: () => ok(IM(f0.far)) && ok(IM(H.run[0])) };
  }

  // ============================================================================================
  //  VUELO — Viaje por 4 Mundos (Nivel 2): alfombra voladora, compuertas con respuestas, cuatro paisajes
  // ============================================================================================
  function crearVuelo(m, heroeId) {
    const PL = 4.2, fases = m.fases, T = PL * fases.length, H = HEROES[heroeId] || HEROES.sakura;
    const Q = [{ q: '4 × 7', a: [24, 28, 32], ok: 1 }, { q: '5 × 6', a: [30, 35, 25], ok: 0 }, { q: '6 × 8', a: [42, 48, 54], ok: 1 }, { q: '5 × 9', a: [40, 50, 45], ok: 2 }];
    const G0 = N2 + 'compuertas/compuerta_neutral.png', G1 = N2 + 'compuertas/compuerta_correcta.png';
    const fr = (m.extra && m.extra.frames) || [];
    const imgs = [G0, G1].concat(H.alf, [H.sube, H.baja], fr, fases.map(f => f.far), fases.reduce((a, f) => a.concat((f.props || []).map(p => p.img)), []));
    function fondo(c, W, Hh, f, t, alfa) {
      const Ws = Math.min(W, Hh * 1.15); c.globalAlpha = alfa; const far = IM(f.far), gy = .5 * Hh;
      if (ok(far)) {
        const hh = (f.completo ? .66 : .38) * Hh, ww = hh * iw(far) / ih(far), base = (f.completo ? .53 : .5) * Hh, off = ww > W ? -(ww - W) * (.5 + .5 * Math.sin(t * .3)) : -mod(t * Ws * .05, ww);
        for (let x = off; x < W + 2; x += ww) c.drawImage(far, x, base - hh, ww, hh);
      }
      const g = c.createLinearGradient(0, gy, 0, Hh); g.addColorStop(0, f.suelo[0]); g.addColorStop(1, f.suelo[1]); c.fillStyle = g; c.fillRect(0, f.completo ? .53 * Hh : gy, W, Hh);
      (f.props || []).forEach(p => { const tile = W * 1.25, X = mod(p.x / 100 * tile - t * Ws * (p.capa === 'cerca' ? .55 : .2), tile) - .15 * tile; [X, X - tile].forEach(x => imagen(c, p.img, x, (p.capa === 'cerca' ? .55 : .49) * Hh, (p.capa === 'cerca' ? .7 : .5) * Hh * p.h / 100)); });
      c.globalAlpha = 1;
    }
    function dibujar(c, W, Hh, t, op) {
      const Ws = Math.min(W, Hh * 1.15), x0 = (W - Ws) / 2, sinHud = !!(op && op.sinHud), tl = mod(t, T), ph = Math.min(fases.length - 1, Math.floor(tl / PL)), tau = tl - ph * PL, nxt = (ph + 1) % fases.length;
      let g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, m.cielo[0]); g.addColorStop(1, m.cielo[1]); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
      fondo(c, W, Hh, fases[ph], t, 1); const fd = suave((tau - (PL - .7)) / .7); if (fd > 0) fondo(c, W, Hh, fases[nxt], t + 3, fd);
      const q = Q[ph % Q.length], hx = x0 + .3 * Ws, sp = .52 * Ws, gc = [.3, .41, .52].map(v => v * Hh), base = .35 * Hh, gh = .105 * Hh;
      const yOf = tt => base + (gc[q.ok] - base) * (suave((tt - .7) / .8) - suave((tt - 2.5) / .8));
      const y = yOf(tau), dy = yOf(tau + .06) - yOf(tau - .06) + Math.sin(t * 2.2) * .0, gx = hx + .85 * Ws - (tau - .3) * sp, paso = tau > 1.93, ga = clamp((tau - .3) / .3, 0, 1);
      // zorro compañero (corre por el suelo, detrás de las compuertas)
      if (fr.length) imagen(c, fr[Math.floor(t * 9) % fr.length], x0 + .74 * Ws, .52 * Hh, .18 * Hh);
      // compuertas
      if (gx > -.2 * W) for (let i = 0; i < 3; i++) {
        const esOk = i === q.ok, usada = paso && esOk; c.globalAlpha = (paso && !esOk ? .35 : 1) * ga;
        if (usada) brillo(c, gx, gc[i], gh * .9, '120,255,170', .55);
        imagen(c, usada ? G1 : G0, gx, gc[i] + gh / 2, gh); texto(c, String(q.a[i]), gx, gc[i] + .004 * Hh, .042 * Hh, '#fff6c2'); c.globalAlpha = 1;
      }
      if (paso && tau < 2.8) { chispas(c, hx + .08 * Ws, gc[q.ok], tau - 1.93, 24, 1.1, '#9fffc4', 21); if (sinHud) { } else { c.globalAlpha = clamp(1 - (tau - 1.93) * 1.2, 0, 1); texto(c, '¡Muy bien! +5', W / 2, .285 * Hh - (tau - 1.93) * .03 * Hh, .046 * Hh, '#7dffb0'); c.globalAlpha = 1; } }
      // alfombra voladora
      const al = dy < -.002 * Hh ? H.sube : dy > .002 * Hh ? H.baja : H.alf[Math.floor(t * 8) % 2];
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(hx, .52 * Hh, .08 * W, .011 * Hh, 0, 0, 7); c.fill();
      imagen(c, al, hx, y + Math.sin(t * 3) * .005 * Hh + .075 * Hh, .185 * Hh);
      const hayQ = tau > .2 && tau < 2.9; if (!sinHud) pastilla(c, hayQ ? '¿Cuánto es ' + q.q + '?' : '¡Cruza la puerta correcta!', W / 2, .2 * Hh, Ws * .72, .06 * Hh, m.acento || '#ffb44a', .036 * Hh);
    }
    return { dur: T, imgs, dibujar, listo: () => ok(IM(fases[0].far)) && ok(IM(H.alf[0])) };
  }

  // ============================================================================================
  //  MONTAJE — pantalla de carga: Sakura recorre los tres mundos (corre, salta, pelea, dispara, cruza portales).
  //  El mundo depende del progreso de carga (0–33 % La Senda · 33–66 % Viaje · 66–100 % Farolillos).
  // ============================================================================================
  function crearMontaje(heroe) {
    const reg = root.MundosRegistro && root.MundosRegistro.lista; if (!reg) return null;
    const ms = ['senda', 'viaje', 'farolillos'].map(id => reg.filter(m => m.id === id)[0]); if (ms.some(m => !m || !m.demo || !TIPOS[m.demo.tipo])) return null;
    const demos = ms.map(m => TIPOS[m.demo.tipo](m, heroe === 'kage' ? 'kage' : 'sakura')), inicio = [2.1, .6, 3.1];
    const imgs = demos.reduce((a, d) => a.concat(d.imgs), []);
    let idx = -1, tEnt = 0, tCam = -9, ult = 0, oc = null, o2 = null;
    function dibujar(c, W, H, ahora, prog) {
      if (ahora < ult) idx = -1; ult = ahora;
      const i = prog < .34 ? 0 : prog < .67 ? 1 : 2;
      if (i !== idx) { idx = i; tEnt = ahora; tCam = ahora; }
      const m = ms[i], Hs = Math.round(H * .78), y0 = H - Hs, dpr = Math.min(root.devicePixelRatio || 1, 1.5), tl = inicio[i] + (ahora - tEnt);
      if (!oc && doc) { oc = doc.createElement('canvas'); o2 = oc.getContext('2d'); }
      if (!oc) return;
      const pw = Math.round(W * dpr), ph = Math.round(Hs * dpr); if (oc.width !== pw || oc.height !== ph) { oc.width = pw; oc.height = ph; }
      o2.setTransform(dpr, 0, 0, dpr, 0, 0); o2.globalCompositeOperation = 'source-over'; o2.globalAlpha = 1; o2.clearRect(0, 0, W, Hs);
      demos[i].dibujar(o2, W, Hs, tl, { sinHud: true });
      o2.globalCompositeOperation = 'destination-in'; const gm = o2.createLinearGradient(0, 0, 0, Hs); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(.26, 'rgba(0,0,0,1)'); o2.fillStyle = gm; o2.fillRect(0, 0, W, Hs); o2.globalCompositeOperation = 'source-over';
      // cielo que sube detrás del logo (mismo color que el borde del paisaje) con estrellas
      const cs = c.createLinearGradient(0, 0, 0, y0 + Hs * .3); cs.addColorStop(0, '#050817'); cs.addColorStop(1, m.cielo[0]); c.fillStyle = cs; c.fillRect(0, 0, W, y0 + Hs * .3);
      for (let n = 0; n < 46; n++) { const h = hash(n * 31 + 7), x = (h % 1000) / 1000 * W, y = ((h >> 10) % 1000) / 1000 * y0 * .95; c.globalAlpha = .25 + .45 * Math.abs(Math.sin(ahora * .9 + n)); c.fillStyle = '#fff'; c.fillRect(x, y, 1.6, 1.6); } c.globalAlpha = 1;
      c.drawImage(oc, 0, y0, W, Hs);
      // legibilidad del logo (arriba) y de la barra de carga (abajo)
      let g = c.createLinearGradient(0, 0, 0, H * .5); g.addColorStop(0, 'rgba(3,4,16,.5)'); g.addColorStop(1, 'rgba(3,4,16,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * .5);
      g = c.createLinearGradient(0, H * .7, 0, H); g.addColorStop(0, 'rgba(3,4,16,0)'); g.addColorStop(1, 'rgba(3,4,16,.62)'); c.fillStyle = g; c.fillRect(0, H * .7, W, H * .3);
      // cruce de portal: destello dorado + rótulo del nuevo mundo
      const dc = ahora - tCam;
      if (dc < .75) { const a = 1 - dc / .75; c.fillStyle = 'rgba(255,236,170,' + (.8 * a * a) + ')'; c.fillRect(0, 0, W, H); brillo(c, W / 2, y0 + Hs * .5, Math.max(W, H) * (.25 + dc * .9), '255,214,110', .7 * a); }
      if (dc < 2.4) { const a = clamp(Math.min(dc / .3, (2.4 - dc) / .5), 0, 1); c.globalAlpha = a; const tx = 'MUNDO ' + (i + 1) + ' · ' + m.nombre.toUpperCase(), px = clamp(W * .03, 11, 17), ph2 = px * 2.1; c.font = 'bold ' + Math.round(px) + 'px ' + FONT; pastilla(c, tx, W / 2, H * .725, Math.min(W * .94, c.measureText(tx).width + ph2 * 1.2), ph2, m.acento || '#ffd24a', px); c.globalAlpha = 1; }
    }
    return { imgs, dibujar };
  }
  function precargar(lista) { (lista || []).forEach(IM); }

  // ============================================================================================
  //  Montaje en la tarjeta: un solo bucle compartido, solo anima lo que se ve, ~30 cuadros por segundo
  // ============================================================================================
  const TIPOS = { carril: crearCarril, lateral: crearLateral, vuelo: crearVuelo };
  const vivos = []; let raf = 0, ult = 0;
  function bucle(ts) {
    raf = root.requestAnimationFrame(bucle);
    const bajo = doc.documentElement.classList.contains('fx-low'), paso = bajo ? 1 / 20 : 1 / 30;
    if (doc.hidden) { ult = ts; return; }
    const dt = (ts - ult) / 1000; if (dt < paso - .004) return; ult = ts;
    vivos.forEach(v => {
      if (!v.vis || (v.pausa && v.pausa())) return;
      v.t += Math.min(dt, .1);
      const cv = v.cv, r = Math.min(root.devicePixelRatio || 1, bajo ? 1 : 1.5), w = Math.round(cv.clientWidth * r), h = Math.round(cv.clientHeight * r);
      if (!w || !h) return; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      try { v.demo.dibujar(v.c, w, h, v.t); if (!v.on && v.demo.listo()) { v.on = true; v.tarjeta.classList.add('demo-on'); } } catch (e) { v.vis = false; v.error = String(e && e.stack || e); v.tarjeta.classList.remove('demo-on'); if (root.console) root.console.warn('[vista previa] se detuvo:', e); }
    });
  }
  function montar(esc, tarjeta, m, heroe, op) {
    if (!doc || !m || !m.demo || !TIPOS[m.demo.tipo]) return null;
    const cv = doc.createElement('canvas'); cv.className = 'mw-demo'; cv.setAttribute('aria-hidden', 'true');
    esc.insertBefore(cv, esc.querySelector('.mw-part') || esc.querySelector('.mw-vig'));
    let demo; try { demo = TIPOS[m.demo.tipo](m, heroe === 'kage' ? 'kage' : 'sakura'); } catch (e) { cv.remove(); return null; }
    demo.imgs.forEach(IM);
    const v = { cv, c: cv.getContext('2d'), demo, tarjeta, vis: true, on: false, t: Math.random() * 1.5, pausa: op && op.pausa };
    vivos.push(v); if (!raf) { ult = 0; raf = root.requestAnimationFrame(bucle); }
    return { visible(b) { v.vis = !!b; }, destruir() { const i = vivos.indexOf(v); if (i >= 0) vivos.splice(i, 1); cv.remove(); tarjeta.classList.remove('demo-on'); if (!vivos.length && raf) { root.cancelAnimationFrame(raf); raf = 0; } } };
  }
  // Si una tarjeta no se anima: en la consola del navegador (F12) escribir  PreviewMundos.diagnostico()
  function diagnostico() {
    return vivos.map(v => ({ mundo: v.tarjeta.getAttribute('data-id') || v.tarjeta.className, visible: v.vis, pausada: !!(v.pausa && v.pausa()), enMarcha: v.on, tamano: v.cv.clientWidth + 'x' + v.cv.clientHeight,
      imagenListo: (function () { try { return v.demo.listo(); } catch (e) { return String(e); } })(), error: v.error || null, segundos: Math.round(v.t * 10) / 10 }));
  }
  return { diagnostico, montar, crearMontaje, precargar, crearCarril, crearLateral, crearVuelo, _cache: cache, _hash: hash };
});
