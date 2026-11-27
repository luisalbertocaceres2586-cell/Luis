/* DETALLES ANIMADOS del Nivel 1 — pequeños movimientos que dan vida al decorado, sin arte nuevo.
 *
 *  · CARRETA (carreta_madera.png): las 12 ruedas-radios giran según lo que avanza la carreta (rodar de verdad: al empujarla gira, al
 *    soltarla se queda quieta), el farol cuelga y se balancea (más si la empujas) y su luz parpadea cálida.
 *  · FUENTE DE BAMBÚ (fuente_bambu.png): el chorro cae con rayas de luz que aceleran, la pileta tiene ondas que se abren, hay gotas
 *    que saltan al caer el agua y destellos que brillan.
 *
 * Cómo se hace sin dibujar nada nuevo: al cargar el sprite se separa por píxeles (una sola vez) la parte que se mueve de la que no:
 *   - Radios: son 12, cada 30° desde el centro de la rueda. Se recortan en una capa propia y en la capa fija se rellenan sus huecos
 *     copiando el hueco vecino (a medio radio de distancia). Girando solo la capa de radios, la rueda rueda y el resto no se toca.
 *   - Agua: máscara por color (azules/espuma, no la piedra gris). Las rayas y ondas se dibujan y se recortan con esa máscara.
 * Las medidas salen de analizar los sprites actuales (483×411 y 363×405); si cambias el arte, ajusta RUEDA / FAROL / AGUA.
 * Si algo falla o el sprite no se puede leer, no se anima y el juego dibuja el sprite normal. Respeta "reducir movimiento". */
(function (root) {
  'use strict';

  const RUEDA = { w: 483, h: 411, cx: 275.5, cy: 293, r0: 23, r1: 91, aro: 104, radios: 12, ancho: 9 };   // rueda delantera (px del sprite)
  const FAROL = { x0: 22, x1: 96, y0: 100, y1: 190, px: 60, py: 100, gx: 60, gy: 143, glow: 62 };      // recorte del farol y su gancho
  const AGUA = { w: 363, h: 405, x0: 165, x1: 315, y0: 98, y1: 255, caeX: 212, caeY: 108, caeLargo: 120, caeDesv: 26, ix: 238, iy: 232, sx: 239, sy: 238 };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  // ---------- funciones puras sobre píxeles RGBA (src = Uint8ClampedArray, W×H) ----------
  /** Separa la rueda en capa fija (sin radios, huecos rellenos) y capa de radios (lista para girar). Devuelve {base, radios}. */
  function separarRadios(src, W, H, k) {
    const base = new Uint8ClampedArray(src), radios = new Uint8ClampedArray(src.length);
    const cx = RUEDA.cx * k, cy = RUEDA.cy * k, r0 = RUEDA.r0 * k, r1 = RUEDA.r1 * k, hw = RUEDA.ancho * k, paso = 2 * Math.PI / RUEDA.radios;
    for (let y = Math.max(0, Math.floor(cy - r1 - 1)); y <= Math.min(H - 1, Math.ceil(cy + r1 + 1)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r1 - 1)); x <= Math.min(W - 1, Math.ceil(cx + r1 + 1)); x++) {
        const u = x - cx, v = y - cy, r = Math.hypot(u, v); if (r <= r0 || r >= r1) continue;
        const th = Math.atan2(v, u), d = ((th + paso / 2) % paso + paso) % paso - paso / 2;   // desvío al radio más cercano
        const a = clamp((hw + 1 - r * Math.abs(Math.sin(d))) / 2, 0, 1); if (a <= 0) continue;
        const tg = th - d + paso / 2, gx = clamp(Math.round(cx + r * Math.cos(tg)), 0, W - 1), gy = clamp(Math.round(cy + r * Math.sin(tg)), 0, H - 1);
        const i = (y * W + x) * 4, j = (gy * W + gx) * 4;   // j = el mismo punto en el hueco de al lado
        for (let c = 0; c < 4; c++) base[i + c] = src[i + c] * (1 - a) + src[j + c] * a;
        radios[i] = src[i]; radios[i + 1] = src[i + 1]; radios[i + 2] = src[i + 2]; radios[i + 3] = src[i + 3] * a;
      }
    }
    return { base, radios };
  }
  /** Recorta el farol (para columpiarlo): lo quita de la capa fija y devuelve una copia solo con el farol. */
  function separarFarol(base, W, H, k) {
    const far = new Uint8ClampedArray(base.length);
    for (let y = Math.floor(FAROL.y0 * k); y < Math.min(H, Math.ceil(FAROL.y1 * k)); y++) {
      for (let x = Math.floor(FAROL.x0 * k); x < Math.min(W, Math.ceil(FAROL.x1 * k)); x++) {
        const i = (y * W + x) * 4; far[i] = base[i]; far[i + 1] = base[i + 1]; far[i + 2] = base[i + 2]; far[i + 3] = base[i + 3]; base[i + 3] = 0;
      }
    }
    return far;
  }
  /** Máscara (1 = agua) del chorro, la salpicadura y la pileta: azules, azul oscuro de la pileta y la espuma pegada a ellos. */
  function mascaraAgua(src, W, H, k) {
    const m = new Uint8Array(W * H), blanca = [];
    const x0 = Math.floor(AGUA.x0 * k), x1 = Math.ceil(AGUA.x1 * k), y0 = Math.floor(AGUA.y0 * k), y1 = Math.ceil(AGUA.y1 * k), yPileta = 226 * k;
    for (let y = y0; y <= Math.min(H - 1, y1); y++) {
      for (let x = x0; x <= Math.min(W - 1, x1); x++) {
        const i = (y * W + x) * 4, r = src[i], g = src[i + 1], b = src[i + 2]; if (src[i + 3] < 200) continue;
        if ((b > 165 && b - r >= 22 && g >= r) || (y >= yPileta && b > 110 && b - r >= 55 && g - r >= 20)) m[y * W + x] = 1;
        else if (.3 * r + .59 * g + .11 * b > 205 && b - r >= 8) blanca.push(y * W + x);
      }
    }
    const rad = Math.max(1, Math.round(3 * k)), hay = (p) => { const px = p % W, py = (p - px) / W; for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const xx = px + dx, yy = py + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && m[yy * W + xx] === 1) return true; } return false; };
    const sumar = blanca.filter(hay); for (const p of sumar) m[p] = 1;   // la espuma blanca solo si toca agua (no la piedra clara)
    return m;
  }
  const API = { RUEDA, FAROL, AGUA, separarRadios, separarFarol, mascaraAgua };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window === 'undefined' || !root.N1core) return;

  // ---------- navegador ----------
  const core = root.N1core, D = {}; root.N1det = D;
  const quieto = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lento = () => !!(root.N1prof && root.N1prof._estado && root.N1prof._estado().lento);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  const CACHE = new WeakMap();
  const aCanvas = (data, W, H) => { const c = mk(W, H); c.getContext('2d').putImageData(new ImageData(data, W, H), 0, 0); return c; };
  function leer(im) {
    if (!im || !im.naturalWidth) return null;
    try { const c = mk(im.naturalWidth, im.naturalHeight), x = c.getContext('2d'); x.drawImage(im, 0, 0); return { W: c.width, H: c.height, px: x.getImageData(0, 0, c.width, c.height).data }; } catch (e) { return null; }
  }
  function prepararCarreta(im) {
    const L = leer(im); if (!L) return null; const k = L.W / RUEDA.w, { base, radios } = separarRadios(L.px, L.W, L.H, k), far = separarFarol(base, L.W, L.H, k);
    const gl = mk(64, 64), g = gl.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,215,130,1)'); rg.addColorStop(.35, 'rgba(255,170,70,.45)'); rg.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return { W: L.W, H: L.H, k, base: aCanvas(base, L.W, L.H), radios: aCanvas(radios, L.W, L.H), farol: aCanvas(far, L.W, L.H), glow: gl };
  }
  function prepararFuente(im) {
    const L = leer(im); if (!L) return null; const k = L.W / AGUA.w, m = mascaraAgua(L.px, L.W, L.H, k), d = new Uint8ClampedArray(L.W * L.H * 4);
    for (let p = 0; p < m.length; p++) if (m[p]) { d[p * 4 + 3] = 255; }
    const bx = Math.floor(AGUA.x0 * k), by = Math.floor(AGUA.y0 * k), bw = Math.ceil((AGUA.x1 - AGUA.x0) * k) + 2, bh = Math.ceil((AGUA.y1 - AGUA.y0) * k) + 2;
    return { W: L.W, H: L.H, k, mascara: aCanvas(d, L.W, L.H), bx, by, tmp: mk(bw, bh) };
  }
  const dePrep = (im, f) => { let P = CACHE.get(im); if (P === undefined) { try { P = f(im); } catch (e) { P = null; } CACHE.set(im, P); } return P; };

  /** Dibuja la carreta con ruedas que giran y farol que se balancea. Devuelve false si no pudo (el llamador dibuja el sprite normal).
   *  px,py,w,hh = caja en pantalla · xw = posición X de la carreta en el mundo (de ahí sale el giro) · t = tiempo en segundos · est = objeto carreta */
  D.carreta = function (cx, im, px, py, w, hh, xw, t, est) {
    const P = dePrep(im, prepararCarreta); if (!P) return false;
    try {
      const sx = w / P.W, sy = hh / P.H, k = P.k, ang = xw / (RUEDA.aro * k * sx), o = est._n1d || (est._n1d = { x: xw, t, a: 0 });
      const dt = clamp(t - o.t, 0, .1); if (dt > 0) { const vx = (xw - o.x) / dt, meta = -clamp(vx * .0035, -.4, .4); o.a += (meta - o.a) * Math.min(1, dt * 7); o.x = xw; o.t = t; }
      const vivo = !quieto(), bal = o.a + (vivo ? .04 * Math.sin(t * 2.3 + xw * .01) : 0);
      cx.save(); cx.translate(px, py); cx.scale(sx, sy); cx.drawImage(P.base, 0, 0);
      cx.save(); cx.translate(RUEDA.cx * k, RUEDA.cy * k); cx.rotate(ang); cx.drawImage(P.radios, -RUEDA.cx * k, -RUEDA.cy * k); cx.restore();
      cx.save(); cx.translate(FAROL.px * k, FAROL.py * k); cx.rotate(bal); cx.translate(-FAROL.px * k, -FAROL.py * k); cx.drawImage(P.farol, 0, 0);
      const fl = vivo ? .55 + .12 * Math.sin(t * 17) + .08 * Math.sin(t * 9.3 + 1) : .55, r = FAROL.glow * k;
      cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = fl; cx.drawImage(P.glow, FAROL.gx * k - r, FAROL.gy * k - r, 2 * r, 2 * r); cx.restore();
      cx.restore(); return true;
    } catch (e) { CACHE.set(im, null); return false; }
  };

  /** Anima el agua de la fuente (se llama justo después de dibujar su sprite). x = centro en pantalla, top = borde de arriba, w = ancho. */
  D.fuente = function (cx, im, x, top, w, t) {
    if (quieto()) return; const P = dePrep(im, prepararFuente); if (!P) return;
    try {
      const k = P.k, s = w / P.W, lo = lento(), T = P.tmp, tx = T.getContext('2d');
      const pathX = u => (AGUA.caeX + AGUA.caeDesv * (1 - Math.pow(1 - u, 1.6))) * k, pathY = u => (AGUA.caeY + AGUA.caeLargo * u) * k;
      tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, T.width, T.height); tx.translate(-P.bx, -P.by);
      for (let lane = -1; lane <= 1; lane++) {   // rayas de luz que aceleran al caer (claras y azules, en 3 carriles)
        for (let i = 0; i < (lo ? 3 : 6); i++) {
          const p = (((t * (.75 + .12 * lane) + i / (lo ? 3 : 6) + lane * .17) % 1) + 1) % 1, u = Math.pow(p, 1.35), fade = Math.sin(Math.PI * p);
          const ddx = AGUA.caeDesv * 1.6 * Math.pow(1 - u, .6), a = Math.atan2(AGUA.caeLargo, ddx);
          tx.save(); tx.translate(pathX(u) + lane * 8 * k * (.7 + .5 * u), pathY(u)); tx.rotate(a - Math.PI / 2);
          tx.fillStyle = i % 2 ? 'rgba(255,255,255,' + (.6 * fade) + ')' : 'rgba(25,120,200,' + (.34 * fade) + ')';
          tx.beginPath(); tx.ellipse(0, 0, 2.6 * k, (7 + 10 * u) * k, 0, 0, 6.2832); tx.fill(); tx.restore();
        }
      }
      const ig = tx.createRadialGradient(AGUA.ix * k, AGUA.iy * k, 0, AGUA.ix * k, AGUA.iy * k, 26 * k), pul = .16 + .1 * Math.sin(t * 9);   // espuma del golpe
      ig.addColorStop(0, 'rgba(255,255,255,' + pul + ')'); ig.addColorStop(1, 'rgba(255,255,255,0)'); tx.fillStyle = ig; tx.fillRect((AGUA.ix - 30) * k, (AGUA.iy - 30) * k, 60 * k, 60 * k);
      if (!lo) {
        for (let i = 0; i < 3; i++) {   // ondas que se abren en la pileta
          const p = (t * .5 + i / 3) % 1, rx = (8 + p * 60) * k; tx.beginPath(); tx.ellipse(AGUA.sx * k, AGUA.sy * k, rx, rx * .17, 0, 0, 6.2832);
          tx.strokeStyle = 'rgba(255,255,255,' + (.6 * (1 - p)) + ')'; tx.lineWidth = 2.4 * k; tx.stroke();
        }
        [[205, 238], [262, 240], [228, 243], [190, 236]].forEach((q, i) => {   // destellos que se encienden y apagan
          const b = Math.pow(Math.max(0, Math.sin(t * 3 + i * 2.1)), 6); if (b < .05) return; const r = (3 + 4 * b) * k;
          tx.strokeStyle = 'rgba(255,255,255,' + b + ')'; tx.lineWidth = 1.6 * k; tx.beginPath(); tx.moveTo(q[0] * k - r, q[1] * k); tx.lineTo(q[0] * k + r, q[1] * k); tx.moveTo(q[0] * k, q[1] * k - r); tx.lineTo(q[0] * k, q[1] * k + r); tx.stroke();
        });
      }
      tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(P.mascara, -P.bx, -P.by);   // solo donde hay agua
      cx.save(); cx.translate(x - w / 2, top); cx.scale(s, s); cx.drawImage(T, P.bx, P.by);
      cx.fillStyle = 'rgb(215,245,255)';   // gotas que saltan al caer el agua
      for (let i = 0; i < (lo ? 5 : 13); i++) {
        const dur = .85 + .4 * hash(i), ph = (t / dur + hash(i + 7)) % 1, tau = ph * dur, gx = AGUA.ix + (hash(i + 3) - .5) * 80 * tau * 2, gy = AGUA.iy - 4 + (-(70 + hash(i + 11) * 80)) * tau + .5 * 320 * tau * tau;
        if (gy > AGUA.sy + 6) continue; cx.globalAlpha = clamp(1 - ph * ph * ph, 0, 1) * .9; cx.beginPath(); cx.arc(gx * k, gy * k, (1.5 + hash(i + 5) * 1.8) * k, 0, 6.2832); cx.fill();
      }
      cx.restore();
    } catch (e) { CACHE.set(im, null); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
