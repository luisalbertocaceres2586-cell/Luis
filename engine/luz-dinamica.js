/* LUZ DINÁMICA Y PROFUNDIDAD — juego principal (index.html)
 *
 * Qué hace (todo con Canvas 2D, sin dependencias):
 *  · MAPA DE LUZ: una imagen pequeña (1/4 de la pantalla) con la luz ambiente de cada bioma + las luces del momento. Se mezcla con la
 *    escena por multiplicación (lo no iluminado se oscurece) y con un brillo aditivo encima. Al ser pequeña, sale suave y barata.
 *  · FUENTES DE LUZ: el héroe (cambia de color con el poder activo), los kunai, las antorchas y lámparas del decorado, las explosiones,
 *    las monedas, y un resplandor de suelo en lava/infierno. En la tormenta, relámpagos que iluminan todo.
 *  · SOMBRAS SUAVES: las plataformas flotantes tapan la luz del héroe y de las antorchas hacia atrás (detrás de ellas queda más oscuro).
 *  · POLVO VOLUMÉTRICO: motas que solo se ven dentro de la luz, y chispas que suben de las antorchas.
 *  · PROFUNDIDAD para los temas con fondo vacío (cripta, castillo, jefe): capas de siluetas con paralaje + niebla entre ellas; y niebla
 *    baja y partículas propias (luciérnagas fantasma, polvo, brasas, destellos neón) donde el fondo original no tiene.
 *
 * Seguridad: si algo falla, el módulo se apaga solo (el juego sigue igual). Se baja de nivel si cuesta demasiado por fotograma o si el
 * juego entra en modo "lite". Se apaga con ?luz=0 en la URL. Intensidad: localStorage 'ninja_luz' (0 a 1; 0 = apagado) o
 * LuzDin.setIntensidad(0.5). Se engancha desde fx-engine.js (post) y envolviendo drawParallax. */
(function (root) {
  'use strict';

  // ---------- datos por bioma ----------
  // amb: luz ambiente (255,255,255 = no oscurece) · hero/heroR: color y radio (px a 720 de alto) de la luz del héroe · sombra: 0..1
  // suelo: resplandor desde abajo · niebla: niebla baja delante · part: partículas propias (solo donde el fondo no las trae)
  // capas: siluetas con paralaje detrás de las plataformas · lampara: color de las lámparas del decorado
  const BIOMAS = {
    prairie:  { amb: [250, 232, 226], hero: [255, 232, 200], heroR: 210, sombra: .35 },
    night:    { amb: [138, 140, 185], hero: [255, 225, 170], heroR: 250, sombra: .55, lampara: [255, 214, 140] },
    ice:      { amb: [226, 238, 255], hero: [200, 235, 255], heroR: 200, sombra: .3 },
    desert:   { amb: [255, 244, 226], hero: [255, 240, 200], heroR: 190, sombra: .3 },
    jungle:   { amb: [178, 214, 182], hero: [255, 245, 190], heroR: 230, sombra: .5 },
    water:    { amb: [120, 172, 214], hero: [190, 235, 255], heroR: 240, sombra: .5 },
    neon_city:{ amb: [104, 98, 150], hero: [235, 215, 255], heroR: 250, sombra: .55, lampara: [255, 120, 220],
                niebla: { col: [140, 90, 220], a: .13 }, part: { n: 18, col: [[255, 90, 200], [90, 230, 255], [255, 240, 120]], vy: -.012, vx: .02, r: 7 } },
    space:    { amb: [112, 116, 170], hero: [200, 220, 255], heroR: 240, sombra: .45 },
    lava:     { amb: [150, 100, 86], hero: [255, 210, 150], heroR: 250, sombra: .55, suelo: { col: [255, 110, 30], a: .5 },
                niebla: { col: [255, 90, 40], a: .1 } },
    castle:   { amb: [112, 98, 138], hero: [255, 220, 170], heroR: 260, sombra: .65, capas: 'castillo',
                niebla: { col: [150, 120, 190], a: .13 }, part: { n: 14, col: [[230, 210, 255]], vy: -.004, vx: .006, r: 5 } },
    crypt:    { amb: [92, 88, 122], hero: [190, 215, 255], heroR: 270, sombra: .7, capas: 'cripta',
                niebla: { col: [90, 140, 190], a: .16 }, part: { n: 12, col: [[140, 230, 220], [170, 200, 255]], vy: -.006, vx: .008, r: 9 } },
    storm:    { amb: [112, 120, 158], hero: [230, 240, 255], heroR: 240, sombra: .5, rayos: 1 },
    galaxy:   { amb: [106, 96, 160], hero: [230, 200, 255], heroR: 250, sombra: .45 },
    hell:     { amb: [150, 92, 84], hero: [255, 190, 140], heroR: 250, sombra: .55, suelo: { col: [255, 60, 20], a: .55 },
                niebla: { col: [255, 60, 30], a: .1 } },
    boss:     { amb: [108, 88, 124], hero: [255, 210, 200], heroR: 260, sombra: .65, capas: 'jefe', suelo: { col: [255, 90, 40], a: .3 },
                niebla: { col: [200, 70, 120], a: .12 }, part: { n: 20, col: [[255, 110, 60], [220, 90, 255]], vy: -.03, vx: .01, r: 6 } },
    clouds:   { amb: [255, 255, 255], hero: [255, 245, 220], heroR: 150, sombra: 0 }
  };
  // objetos del decorado que dan luz: y = altura de la llama/luz dentro del sprite (0 pie … 1 cabeza)
  const EMISOR = {
    torch: { col: [255, 160, 60], r: 210, a: .95, y: .82, fuego: 1 }, lamp: { col: [255, 225, 150], r: 190, a: .9, y: .92 },
    lavaspire: { col: [255, 100, 30], r: 150, a: .7, y: .35 }, icecrystal: { col: [140, 210, 255], r: 120, a: .6, y: .5 },
    pinkcrystal: { col: [255, 130, 230], r: 120, a: .6, y: .5 }, neonsign: { col: [90, 230, 255], r: 170, a: .85, y: .6 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const hexRgb = h => { h = String(h || '').replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; const n = parseInt(h, 16); return isNaN(n) || h.length !== 6 ? [255, 220, 160] : [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  // ---------- funciones puras (también se prueban en Node) ----------
  /** Las MISMAS posiciones que usa _drawDecorSpr (juego-principal.js) para colocar el decorado: de ahí salen las antorchas y lámparas. */
  function decorEmisores(bg, camX, W, grounds, flagX, lista, alturas, lampara) {
    const out = []; if (!lista || !grounds || !grounds.length) return out;
    const SLOT = 230, s0 = Math.floor((camX - 120) / SLOT), s1 = Math.floor((camX + W + 120) / SLOT);
    for (let s = s0; s <= s1; s++) {
      if (s < 1) continue;
      const h = (Math.imul(s, 2654435761) >>> 0); if (((h >>> 8) % 100) >= 58) continue;
      const wx = s * SLOT + (h % 110); if (wx < 260 || Math.abs(wx - flagX) < 190) continue;
      const g = grounds.find(p => wx >= p.x + 30 && wx <= p.x + p.w - 30); if (!g) continue;
      const key = lista[(h >>> 16) % lista.length], em = EMISOR[key]; if (!em) continue;
      const th = (alturas[key] || 90) * (0.9 + ((h >>> 4) % 25) / 100);
      out.push({ x: wx, y: g.y + 5 - th * em.y, key, col: key === 'lamp' && lampara ? lampara : em.col, r: em.r, a: em.a, fuego: !!em.fuego });
    }
    return out;
  }
  /** Cuadriláteros de sombra que proyecta un rectángulo {x,y,w,h} desde una luz (lx,ly): solo las aristas de ATRÁS (la cara que mira a la
   *  luz queda iluminada). dist = hasta dónde se estira. Devuelve [] si la luz está dentro del rectángulo. */
  function sombraQuads(lx, ly, r, dist) {
    const P = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]], out = [];
    if (lx > r.x && lx < r.x + r.w && ly > r.y && ly < r.y + r.h) return out;
    const ext = p => { const dx = p[0] - lx, dy = p[1] - ly, d = Math.hypot(dx, dy) || 1; return [p[0] + dx / d * dist, p[1] + dy / d * dist]; };
    for (let i = 0; i < 4; i++) {
      const A = P[i], B = P[(i + 1) % 4], nx = B[1] - A[1], ny = -(B[0] - A[0]), mx = (A[0] + B[0]) / 2 - lx, my = (A[1] + B[1]) / 2 - ly;
      if (mx * nx + my * ny > 0) out.push([A, B, ext(B), ext(A)]);   // arista que da la espalda a la luz
    }
    return out;
  }
  const ambiente = (cfg, I) => cfg.amb.map(c => Math.round(255 + (c - 255) * I));

  const API = { BIOMAS, EMISOR, decorEmisores, sombraQuads, ambiente, listo: false };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window === 'undefined' || !root.FX || typeof CX === 'undefined') return;
  if (/[?&]luz=0/.test(location.search)) return;
  root.LuzDin = API;

  // ---------- estado ----------
  const ST = { I: .85, nivel: 2, ema: 0, malos: 0, muerto: false, flash: 0 };
  try { const v = localStorage.getItem('ninja_luz'); if (v !== null && !isNaN(+v)) ST.I = clamp(+v, 0, 1); } catch (e) { /* sin almacenamiento */ }
  API.setIntensidad = v => { ST.I = clamp(+v || 0, 0, 1); try { localStorage.setItem('ninja_luz', String(ST.I)); } catch (e) { /* nada */ } };
  API._estado = () => ST;
  const quieto = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = () => typeof _perfMode !== 'undefined' && _perfMode === 'lite';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  const biomaDe = lv => (typeof zoneBgFor === 'function' && lv ? zoneBgFor(lv) : lv && lv.bg) || 'prairie';

  // ---------- sprites ----------
  const SPR = {};
  function spr(c) {   // brillo radial de un color (se crea una vez)
    const k = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0); let s = SPR[k]; if (s) return s;
    s = SPR[k] = mk(64, 64); const x = s.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32), q = 'rgba(' + k + ',';
    g.addColorStop(0, q + '1)'); g.addColorStop(.25, q + '.62)'); g.addColorStop(.6, q + '.2)'); g.addColorStop(1, q + '0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return s;
  }
  const NB = {};
  function nieblaSpr(c) {   // banco de niebla alargado
    const k = c.join(','); if (NB[k]) return NB[k]; const s = NB[k] = mk(512, 120), x = s.getContext('2d');
    for (let i = 0; i < 5; i++) { const cx0 = 70 + i * 90, g = x.createRadialGradient(cx0, 60, 0, cx0, 60, 80); g.addColorStop(0, 'rgba(' + k + ',.55)'); g.addColorStop(1, 'rgba(' + k + ',0)'); x.fillStyle = g; x.save(); x.translate(cx0, 60); x.scale(1.5, .6 + (i % 2) * .2); x.translate(-cx0, -60); x.fillRect(cx0 - 90, -40, 180, 200); x.restore(); }
    return s;
  }

  // ---------- mapa de luz ----------
  let lm = null, lo = null, mc = null, lmx = null, lox = null, mcx = null, S = 4;
  function preparar() {
    S = lite() ? 6 : 4; const w = Math.ceil(W / S), h = Math.ceil(H / S);
    if (!lm) { lm = mk(w, h); lo = mk(w, h); mc = mk(w, h); lmx = lm.getContext('2d'); lox = lo.getContext('2d'); mcx = mc.getContext('2d'); }
    if (lm.width !== w || lm.height !== h) { lm.width = lo.width = mc.width = w; lm.height = lo.height = mc.height = h; }
  }
  function fuentes(t, bg, cfg, pt, z, esc) {
    const F = [], viv = !quieto();
    if (P && P.w && P.alive !== false) {
      let col = cfg.hero, k = 1;
      if (P.starOn) { col = [255, 225, 90]; k = 1.25 + (viv ? .1 * Math.sin(t * .012) : 0); } else if (P.rocketOn) { col = [255, 130, 255]; k = 1.3; }
      else if (P.shieldOn) { col = [110, 180, 255]; k = 1.15; } else if (P.dashOn || P.speedBoost) { col = [220, 255, 255]; k = 1.1; } else if (P.lowGrav) { col = [190, 150, 255]; k = 1.1; }
      const p = pt(P.x - camX + P.w / 2, P.y + P.h * .45); F.push({ x: p[0], y: p[1], r: cfg.heroR * esc * k * z, col, a: .95, sombra: 1 });
    }
    let nb = 0;
    for (const b of bullets) {
      if (nb >= 6) break; const sx = b.x - camX; if (sx < -80 || sx > W + 80) continue; nb++;
      const mega = b.style === 'mega', col = mega ? [255, 240, 150] : b.style === 'gun' ? [255, 160, 70] : b.style === 'spread' ? [255, 130, 210] : [150, 210, 255], p = pt(sx, b.y);
      F.push({ x: p[0], y: p[1], r: (mega ? 150 : b.style === 'gun' ? 70 : 95) * esc * z, col, a: .85 });
    }
    const rings = root.FX.rings || []; let nr = 0;
    for (const r of rings) { if (nr >= 4) break; nr++; const k = r.l / r.L, p = pt(r.x - camX, r.y); F.push({ x: p[0], y: p[1], r: (50 + k * 170) * esc * z, col: hexRgb(r.c), a: clamp(1 - k, 0, 1) * .9 }); }
    const dark = (cfg.amb[0] + cfg.amb[1] + cfg.amb[2]) / 3 < 200;
    if (dark) { let nc = 0; for (const c of coins) { if (nc >= 10) break; if (c.taken) continue; const sx = c.x - camX + c.w / 2; if (sx < -50 || sx > W + 50) continue; nc++; const p = pt(sx, c.y + c.h / 2); F.push({ x: p[0], y: p[1], r: 56 * esc * z, col: [255, 210, 90], a: .5 }); } }
    const lv = curLV(), lista = typeof DECOR_BY_BG !== 'undefined' ? DECOR_BY_BG[bg] : null;
    if (lista && !(typeof _skyZone !== 'undefined' && _skyZone)) {
      const gr = platforms.filter(p => p.type === 'ground');
      for (const d of decorEmisores(bg, camX, W, gr, typeof flagX !== 'undefined' ? flagX : 1e9, lista, typeof DECOR_H !== 'undefined' ? DECOR_H : {}, cfg.lampara)) {
        const p = pt(d.x - camX, d.y), fl = viv ? 1 + .08 * Math.sin(t * .021 + d.x * .1) + .05 * Math.sin(t * .0113 + d.x) : 1;
        F.push({ x: p[0], y: p[1], r: d.r * esc * z * fl, col: d.col, a: d.a, fuego: d.fuego, sombra: d.fuego || d.key === 'lamp' ? 2 : 0 });
      }
    }
    return F;
  }
  function oclusores(pt, z) {
    const o = [];
    for (const p of platforms) { if (p.type === 'ground' || p.w < 30 || p.isSkyZone) continue; const sx = p.x - camX; if (sx > W + 300 || sx + p.w < -300) continue; const q = pt(sx, p.y); o.push({ x: q[0], y: q[1], w: p.w * z, h: (p.h || 22) * z }); }
    return o;
  }
  function pintarLuz(cx, f, a) { cx.globalAlpha = a; cx.drawImage(spr(f.col), (f.x - f.r) / S, (f.y - f.r) / S, 2 * f.r / S, 2 * f.r / S); }
  function luzConSombra(f, occ, cfg) {
    mcx.setTransform(1, 0, 0, 1, 0, 0); mcx.globalCompositeOperation = 'source-over'; mcx.clearRect(0, 0, mc.width, mc.height); pintarLuz(mcx, f, 1);
    mcx.globalCompositeOperation = 'destination-out'; mcx.fillStyle = 'rgba(0,0,0,' + cfg.sombra + ')'; if ('filter' in mcx) mcx.filter = 'blur(1px)';
    for (const r of occ) {
      if (r.x > f.x + f.r || r.x + r.w < f.x - f.r || r.y > f.y + f.r || r.y + r.h < f.y - f.r) continue;
      for (const q of sombraQuads(f.x, f.y, r, f.r * 2)) { mcx.beginPath(); mcx.moveTo(q[0][0] / S, q[0][1] / S); for (let i = 1; i < 4; i++) mcx.lineTo(q[i][0] / S, q[i][1] / S); mcx.closePath(); mcx.fill(); }
    }
    if ('filter' in mcx) mcx.filter = 'none'; mcx.globalAlpha = 1; mcx.globalCompositeOperation = 'source-over';
    lox.globalAlpha = f.a; lox.drawImage(mc, 0, 0);
  }
  function mapaDeLuz(t, bg, cfg, nivel) {
    preparar(); const z = root.FX.zoom > 1.002 && P && P.w ? root.FX.zoom : 1, zx = P && P.w ? P.x - camX + P.w / 2 : 0, zy = P && P.w ? P.y + P.h / 2 : 0;
    const pt = z === 1 ? (x, y) => [x, y] : (x, y) => [zx + (x - zx) * z, zy + (y - zy) * z], esc = H / 720, F = fuentes(t, bg, cfg, pt, z, esc);
    let amb = ambiente(cfg, ST.I);
    if (cfg.rayos && !quieto()) {   // relámpagos: dos destellos cada ~8 s que iluminan toda la escena
      const fp = (t / 1000) % 8, fl = fp < .1 ? 1 : fp > .22 && fp < .3 ? .7 : 0; ST.flash = fl;
      if (fl) amb = amb.map((c, i) => Math.round(c + ([215, 225, 255][i] - c) * fl * .8));
    }
    lmx.setTransform(1, 0, 0, 1, 0, 0); lmx.globalCompositeOperation = 'source-over'; lmx.globalAlpha = 1; lmx.fillStyle = 'rgb(' + amb.join(',') + ')'; lmx.fillRect(0, 0, lm.width, lm.height);
    lox.setTransform(1, 0, 0, 1, 0, 0); lox.globalCompositeOperation = 'source-over'; lox.globalAlpha = 1; lox.clearRect(0, 0, lo.width, lo.height); lox.globalCompositeOperation = 'lighter';
    const occ = nivel >= 2 && cfg.sombra > 0 ? oclusores(pt, z) : [], conSombra = F.filter(f => f.sombra).sort((a, b) => b.sombra - a.sombra).slice(0, 3);
    for (const f of F) { if (nivel >= 2 && occ.length && conSombra.indexOf(f) >= 0) luzConSombra(f, occ, cfg); else pintarLuz(lox, f, f.a); }
    if (cfg.suelo) {   // resplandor de lava desde abajo
      const g = lox.createLinearGradient(0, lo.height, 0, lo.height * .6), c = cfg.suelo.col, fl = quieto() ? 1 : 1 + .12 * Math.sin(t * .004);
      g.addColorStop(0, 'rgba(' + c.join(',') + ',' + clamp(cfg.suelo.a * fl, 0, 1) + ')'); g.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); lox.globalAlpha = 1; lox.fillStyle = g; lox.fillRect(0, lo.height * .6, lo.width, lo.height * .4);
    }
    lox.globalAlpha = 1; lmx.globalCompositeOperation = 'lighter'; lmx.drawImage(lo, 0, 0); lmx.globalCompositeOperation = 'source-over';
    return F;
  }
  function polvoYChispas(t, F) {   // motas visibles solo dentro de la luz + chispas de antorcha
    if (quieto()) return;
    CX.save(); CX.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const par = .3 + .6 * hash(i + 3), x = (((hash(i) * W * 1.4 - camX * par * .5 + t * .004 * (hash(i + 9) - .3)) % W) + W) % W, y = (((hash(i + 50) * H + Math.sin(t * .0006 + i) * 30) % H) + H) % H;
      let b = 0, col = null;
      for (const f of F) { const d = Math.hypot(x - f.x, y - f.y) / f.r; if (d < 1) { const v = (1 - d) * (1 - d) * f.a; if (v > b) { b = v; col = f.col; } } }
      if (b < .06) continue; CX.globalAlpha = clamp(b * .75, 0, .8); CX.fillStyle = 'rgb(' + col.join(',') + ')'; const s = 1 + hash(i + 20) * 2; CX.fillRect(x, y, s, s);
    }
    let n = 0; CX.fillStyle = 'rgb(255,190,90)';
    for (const f of F) { if (!f.fuego || n++ >= 3) continue; for (let i = 0; i < 5; i++) { const ph = ((t * .0012 + i * .37 + f.x * .013) % 1), x = f.x + Math.sin(ph * 9 + i + f.x) * 10 * esc2(), y = f.y - ph * 70; CX.globalAlpha = (1 - ph) * .9; CX.fillRect(x, y, 2, 2); } }
    CX.restore();
  }
  const esc2 = () => H / 720;
  function particulasBioma(t, cfg) {
    const p = cfg.part; if (!p || quieto()) return; const n = lite() ? Math.ceil(p.n / 3) : p.n;
    CX.save(); CX.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const par = .3 + .9 * hash(i + 1.3), c = p.col[i % p.col.length];
      const x = (((hash(i * 7.1) * W * 1.5 - camX * par * .5 + t * p.vx * 60 * par) % W) + W) % W, y = (((hash(i + 50) * H + t * p.vy * 60 * par + Math.sin(t * .001 + i) * 14) % H) + H) % H, r = p.r * (.5 + par) * esc2();
      CX.globalAlpha = (.25 + .45 * Math.abs(Math.sin(t * .0016 + i * 1.7))) * (.5 + par * .5); CX.drawImage(spr(c), x - r, y - r, r * 2, r * 2);
    }
    CX.restore();
  }
  function nieblaBaja(t, cfg) {
    const nb = cfg.niebla; if (!nb) return; const s = nieblaSpr(nb.col), gy = groundY(), w = 512 * 1.6 * esc2(), h = 120 * 1.6 * esc2();
    CX.save();
    for (let i = 0; i < 2; i++) {
      const par = 1.1 + i * .3, off = (((camX * par * .6 + t * .012 * (i + 1)) % w) + w) % w; CX.globalAlpha = nb.a * (i ? 1.3 : 1) * clamp(ST.I + .3, 0, 1);
      for (let x = -off - i * w * .4; x < W; x += w) CX.drawImage(s, x, gy - h * (.62 + i * .1), w, h);
    }
    CX.restore();
  }

  // ---------- capas de siluetas (temas sin fondo propio) ----------
  const TILES = {};
  function rng(sd) { let s = sd; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function construir(tipo, capa) {
    const TW = 1400, TH = 300, c = mk(TW, TH), x = c.getContext('2d'), R = rng(tipo.length * 977 + capa * 131 + 7), lejos = capa === 0;
    const col = { cripta: lejos ? '#2b2447' : '#16112b', castillo: lejos ? '#2a2046' : '#171128', jefe: lejos ? '#2c1236' : '#150a1e' }[tipo];
    x.fillStyle = col; x.strokeStyle = col;
    if (tipo === 'cripta') {
      for (let i = 0; i < (lejos ? 9 : 14); i++) {   // lápidas, cruces y árboles muertos
        const px = (i + .2 + R() * .6) / (lejos ? 9 : 14) * TW, tipoO = R();
        if (tipoO < .4) { const w = 26 + R() * 20, h = 50 + R() * (lejos ? 90 : 60); x.beginPath(); x.moveTo(px - w / 2, TH); x.lineTo(px - w / 2, TH - h); x.quadraticCurveTo(px, TH - h - w * .7, px + w / 2, TH - h); x.lineTo(px + w / 2, TH); x.fill(); }
        else if (tipoO < .7) { const h = 70 + R() * 80; x.fillRect(px - 4, TH - h, 8, h); x.fillRect(px - 22, TH - h * .75, 44, 8); }
        else { x.lineWidth = 7; x.beginPath(); x.moveTo(px, TH); x.lineTo(px + 6, TH - 110 - R() * 60); x.stroke(); x.lineWidth = 3; for (let k = 0; k < 4; k++) { const yy = TH - 40 - k * 32; x.beginPath(); x.moveTo(px + 2, yy); x.lineTo(px + (k % 2 ? 36 : -36), yy - 34); x.stroke(); } }
      }
    } else if (tipo === 'castillo') {
      let px = 20;
      while (px < TW) {   // torres con almenas y ventanas encendidas
        const w = (lejos ? 70 : 110) + R() * 70, h = (lejos ? 120 : 70) + R() * (lejos ? 140 : 60); x.fillStyle = col; x.fillRect(px, TH - h, w, h);
        for (let m = 0; m < w; m += 18) x.fillRect(px + m, TH - h - 10, 10, 10);
        if (lejos && R() < .6) { x.beginPath(); x.moveTo(px - 6, TH - h - 10); x.lineTo(px + w / 2, TH - h - 70); x.lineTo(px + w + 6, TH - h - 10); x.fill(); }
        x.fillStyle = 'rgba(255,200,110,' + (lejos ? .55 : .35) + ')';
        for (let k = 0; k < 3; k++) if (R() < .65) x.fillRect(px + 12 + R() * (w - 28), TH - h + 18 + k * 34, 7, 12);
        px += w + 8 + R() * 50;
      }
    } else {   // jefe: agujas de obsidiana
      for (let i = 0; i < (lejos ? 12 : 18); i++) { const px = (i + .1 + R() * .8) / (lejos ? 12 : 18) * TW, w = 40 + R() * 70, h = 90 + R() * (lejos ? 200 : 120); x.beginPath(); x.moveTo(px - w / 2, TH); x.lineTo(px - w * .1 + R() * 10, TH - h); x.lineTo(px + w / 2, TH); x.fill(); }
    }
    x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, 0, TH);   // se aclara hacia el horizonte (perspectiva aérea)
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, lejos ? 'rgba(120,90,170,.28)' : 'rgba(80,60,120,.18)'); x.fillStyle = g; x.fillRect(0, 0, TW, TH);
    return c;
  }
  function fondoExtra(lv) {
    const bg = biomaDe(lv), cfg = BIOMAS[bg]; if (!cfg || !cfg.capas || ST.I <= 0 || ST.nivel <= 0) return;
    const gy = groundY(), esc = H / 720;
    CX.save();
    [[0, .14, .55], [1, .3, .75]].forEach(([capa, par, al], i) => {
      const k = cfg.capas + capa, t = TILES[k] || (TILES[k] = construir(cfg.capas, capa)), w = t.width * esc, h = t.height * esc, off = (((camX * par) % w) + w) % w;
      CX.globalAlpha = al; for (let x = -off; x < W; x += w) CX.drawImage(t, x, gy + 12 - h, w, h);
      if (cfg.niebla) { const g = CX.createLinearGradient(0, gy - h * .8, 0, gy + 10), c = cfg.niebla.col; g.addColorStop(0, 'rgba(' + c.join(',') + ',0)'); g.addColorStop(1, 'rgba(' + c.join(',') + ',' + (.22 - i * .06) + ')'); CX.globalAlpha = 1; CX.fillStyle = g; CX.fillRect(0, gy - h * .8, W, h * .8 + 10); }
    });
    CX.restore();
  }

  // ---------- ganchos ----------
  function apagar(e) { ST.muerto = true; API.listo = false; if (root.console) console.warn('LuzDin desactivada:', e); }
  /** Se llama desde fx-engine.js (post), antes de las luces de monedas y del bloom. */
  API.pintar = function (t, bgFx, Q) {
    if (ST.muerto || ST.I <= 0 || !P || !GS.running) return;
    try {
      const lv = curLV(), bg = biomaDe(lv) || bgFx, cfg = BIOMAS[bg]; if (!cfg) return;
      const nivel = lite() ? Math.min(ST.nivel, 1) : ST.nivel; if (nivel <= 0) return;
      const t0 = performance.now(), F = mapaDeLuz(t, bg, cfg, nivel);
      CX.save(); CX.globalCompositeOperation = 'multiply'; CX.imageSmoothingEnabled = true; CX.globalAlpha = 1; CX.drawImage(lm, 0, 0, W, H);
      if (nivel >= 2) { CX.globalCompositeOperation = 'lighter'; CX.globalAlpha = .17 * clamp(ST.I + .15, 0, 1); CX.drawImage(lo, 0, 0, W, H); }
      CX.restore();
      if (nivel >= 2) polvoYChispas(t, F);
      nieblaBaja(t, cfg); if (nivel >= 2) particulasBioma(t, cfg);
      ST.ema = ST.ema * .95 + (performance.now() - t0) * .05;   // si cuesta más de ~4 ms sostenido, baja un nivel (sin sombras → apagado)
      if (ST.ema > 4) { if (++ST.malos > 90) { ST.nivel = Math.max(0, ST.nivel - 1); ST.malos = 0; ST.ema = 0; } } else ST.malos = 0;
    } catch (e) { apagar(e); }
  };
  const dp = root.drawParallax;
  if (typeof dp === 'function') root.drawParallax = function (lv) { const r = dp.apply(this, arguments); try { if (!ST.muerto && !(typeof _skyZone !== 'undefined' && _skyZone)) fondoExtra(lv); } catch (e) { apagar(e); } return r; };
  API.listo = true;
  if (root.console) console.log('[Luz] luz dinámica activa');
})(typeof window !== 'undefined' ? window : globalThis);
