/* Profundidad 2.5D del Nivel 1 — «La Senda del Aprendiz Ninja»
 * Sigue siendo un juego 2D, pero el escenario se lee en capas y con volumen:
 *   · PARALLAX de 6 capas en el bosque (montañas → colinas con pagoda → bambú lejano → bambú medio → bambú cercano → PRIMER PLANO
 *     que pasa por delante del héroe a mayor velocidad que la cámara). También hay capas propias para la cueva y el desierto nocturno.
 *   · NIEBLA ATMOSFÉRICA: cuanto más lejos está una capa, más toma el color del horizonte (perspectiva aérea) + bancos de niebla que derivan solos.
 *   · PROFUNDIDAD DE CAMPO: las capas lejanas se pre-desenfocan; el primer plano va muy desenfocado, con círculos de «bokeh».
 *   · SOMBRAS proyectadas: héroe (contacto + penumbra), enemigos, objetos, plataformas, torii y decorado, con la luz entrando por la derecha.
 *   · RAYOS DE LUZ y motas de polvo/polen.
 * Todo se dibuja con código (sin imágenes nuevas) en «baldosas» que se generan una sola vez y se repiten sin costuras: cada fotograma solo
 * pega unas pocas imágenes, así que casi no cuesta rendimiento. En móvil se apagan los efectos caros (rayos, bokeh, hueco del primer plano).
 * Si algo falla, cada gancho devuelve false y motor.js usa su fondo de siempre. Se conecta desde motor.js con window.N1prof (ver ganchos allí).
 * Sin dependencias: solo usa window.N1core (que expone motor.js). */
(function (root) {
  'use strict';

  // ---------- utilidades ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mezcla = (a, b, t) => { const A = typeof a === 'string' ? hex(a) : a, B = typeof b === 'string' ? hex(b) : b; return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; };
  const rgb = (c, a) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')';
  const K = () => root.N1core;

  // Cielos del bosque (los mismos que usa motor.js) — de ahí sale el color del horizonte para la niebla
  const SKY = { A: ['#2b2468', '#ff8f6b', '#ffe3a3'], B: ['#3d5a80', '#98c1d9', '#e8f1f2'], C: ['#5c2a6e', '#e86a5c', '#ffd08a'] };

  // ---------- desenfoque (profundidad de campo) ----------
  // Usa ctx.filter donde existe (Chrome, Firefox, Edge); en Safari/iOS reduce y amplía la imagen, que desenfoca parecido.
  function desenfocar(src, k) {
    if (!(k > 0.4)) return src;
    const w = src.width, h = src.height, o = mk(w, h), c = o.getContext('2d');
    if (typeof c.filter === 'string') { c.filter = 'blur(' + k + 'px)'; c.drawImage(src, 0, 0); c.filter = 'none'; return o; }
    const f = Math.max(2, Math.round(k)), a = mk(w / f, h / f), ac = a.getContext('2d');
    ac.imageSmoothingQuality = 'high'; ac.drawImage(src, 0, 0, a.width, a.height);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(a, 0, 0, w, h); return o;
  }
  /* Baldosa repetible sin costuras: dibuja el mismo contenido 3 veces seguidas, desenfoca y se queda con la del centro. */
  function baldosa(tw, th, blur, seed, dibujar) {
    const big = mk(tw * 3, th), c = big.getContext('2d');
    for (let k = 0; k < 3; k++) { c.save(); c.translate(k * tw, 0); dibujar(c, rng(seed), tw, th); c.restore(); }
    const src = blur > 0 ? desenfocar(big, blur) : big, out = mk(tw, th);
    out.getContext('2d').drawImage(src, tw, 0, tw, th, 0, 0, tw, th); return { c: out, tw, th };
  }

  /* Pieza suelta desenfocada (un tallo, una hoja, una roca del primer plano): se dibuja sola y con su propia transparencia. */
  function pieza(w, h, blur, dibujar) {
    const m = Math.ceil(blur * 3) + 4, c = mk(w + 2 * m, h + 2 * m), x = c.getContext('2d'); x.translate(m, m); dibujar(x);
    return { c: blur > 0 ? desenfocar(c, blur) : c, m, w, h };
  }

  // ---------- formas ----------
  function tallo(c, x, y0, y1, w, col, R, o) {
    // Tallo de bambú: cuerpo con luz por la derecha, nudos y una ligera inclinación
    const lean = (R() - .5) * w * .5, hh = y0 - y1;
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, rgb(mezcla(col, [0, 0, 0], .32))); g.addColorStop(.55, rgb(col)); g.addColorStop(1, rgb(mezcla(col, o.luz, o.brillo)));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, y0); c.lineTo(x - w / 2 + lean, y1); c.lineTo(x + w / 2 + lean, y1); c.lineTo(x + w / 2, y0); c.closePath(); c.fill();
    const nd = Math.max(40, w * 4.2 + R() * 30), osc = rgb(mezcla(col, [0, 0, 0], .45), .85);
    for (let yy = y0 - 20 - R() * nd; yy > y1; yy -= nd * (.8 + R() * .4)) {
      const xx = x + lean * ((y0 - yy) / hh);
      c.fillStyle = osc; c.fillRect(xx - w / 2 - w * .06, yy, w * 1.12, Math.max(2, w * .16));
      c.fillStyle = rgb(mezcla(col, o.luz, .4), .35); c.fillRect(xx + w * .12, yy - 1, w * .3, Math.max(1, w * .06));
    }
    return x + lean;
  }
  function hoja(c, x, y, len, ang, w, col) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath();
    c.moveTo(0, 0); c.quadraticCurveTo(len * .45, -w, len, 0); c.quadraticCurveTo(len * .45, w * .55, 0, 0); c.fill(); c.restore();
  }
  function copa(c, x, y, tam, col, R) { for (let i = 0; i < 9; i++) hoja(c, x + (R() - .5) * tam * .25, y + (R() - .5) * tam * .2, tam * (.55 + R() * .6), -Math.PI / 2 + (R() - .5) * 2.8, tam * .1, col); }
  // o: n (cuántos), w [mín,máx], col, luz, brillo, corona (prob. de acabar en copa de hojas), hoja (color de la hoja)
  function bosqueDeBambu(c, R, tw, th, o) {
    for (let i = 0; i < o.n; i++) {
      const x = (i + .15 + R() * .7) / o.n * tw, w = o.w[0] + R() * (o.w[1] - o.w[0]), corona = R() < o.corona, y1 = corona ? th * (.1 + R() * .42) : -20;
      const col = mezcla(o.col, o.col2 || o.col, R()), xt = tallo(c, x, th + 10, y1, w, col, R, o);
      if (corona) copa(c, xt, y1, w * 7 + 40, o.hoja, R);
      if (o.ramas && R() < .6) { const yb = th * (.35 + R() * .4), d = R() < .5 ? -1 : 1; hoja(c, x, yb, w * 5 + 30, d < 0 ? Math.PI + .5 : -.5, w * .45, o.hoja); hoja(c, x, yb + 14, w * 4 + 20, d < 0 ? Math.PI + .9 : -.9, w * .4, o.hoja); }
    }
  }
  function pagoda(c, x, base, s, col) {
    // Silueta de pagoda (techos curvos apilados) — da carácter japonés al horizonte lejano
    c.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      const w = s * (1 - i * .18), y = base - i * s * .34;
      c.fillRect(x - w * .3, y - s * .3, w * .6, s * .3);
      c.beginPath(); c.moveTo(x - w * .62, y - s * .28); c.quadraticCurveTo(x - w * .25, y - s * .3, x, y - s * .46); c.quadraticCurveTo(x + w * .25, y - s * .3, x + w * .62, y - s * .28);
      c.quadraticCurveTo(x + w * .3, y - s * .22, x, y - s * .24); c.quadraticCurveTo(x - w * .3, y - s * .22, x - w * .62, y - s * .28); c.fill();
    }
    c.fillRect(x - 1.5, base - s * 1.8, 3, s * .4);
  }
  // Crestas suaves sin costura: suma de senos con frecuencias enteras sobre el ancho de la baldosa
  function cresta(c, R, tw, th, base, amp, col, luz) {
    const f = [1 + Math.floor(R() * 2), 3 + Math.floor(R() * 3), 7 + Math.floor(R() * 4)], ph = [R() * 6.28, R() * 6.28, R() * 6.28], aa = [1, .55, .22];
    const y = x => base - amp * (.5 + .5 * (aa[0] * Math.sin(x / tw * 6.2832 * f[0] + ph[0]) + aa[1] * Math.sin(x / tw * 6.2832 * f[1] + ph[1]) + aa[2] * Math.sin(x / tw * 6.2832 * f[2] + ph[2])) / 1.77);
    c.fillStyle = col; c.beginPath(); c.moveTo(-8, th + 4);
    for (let x = -8; x <= tw + 8; x += 6) c.lineTo(x, y(x)); c.lineTo(tw + 8, th + 4); c.closePath(); c.fill();
    if (luz) { c.strokeStyle = luz; c.lineWidth = 2; c.beginPath(); for (let x = -8; x <= tw + 8; x += 6) { x === -8 ? c.moveTo(x, y(x)) : c.lineTo(x, y(x)); } c.stroke(); }
    return y;
  }
  function estalactitas(c, R, tw, o) {
    // Dientes de roca que cuelgan del techo (o.suelo = true: crecen desde abajo)
    for (let i = 0; i < o.n; i++) {
      const x = (i + .1 + R() * .8) / o.n * tw, w = o.w[0] + R() * (o.w[1] - o.w[0]), hh = o.h[0] + R() * (o.h[1] - o.h[0]), s = o.suelo ? -1 : 1, y0 = o.suelo ? o.th : 0, lean = (R() - .5) * w * .5;
      const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, rgb(mezcla(o.col, [0, 0, 0], .35))); g.addColorStop(.6, rgb(o.col)); g.addColorStop(1, rgb(mezcla(o.col, o.luz, o.brillo)));
      c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, y0); c.quadraticCurveTo(x - w * .3 + lean * .4, y0 + s * hh * .55, x + lean, y0 + s * hh); c.quadraticCurveTo(x + w * .3 + lean * .4, y0 + s * hh * .55, x + w / 2, y0); c.closePath(); c.fill();
      if (o.rim) { c.strokeStyle = o.rim; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x + w * .45, y0 + s * 2); c.quadraticCurveTo(x + w * .3 + lean * .4, y0 + s * hh * .55, x + lean, y0 + s * hh); c.stroke(); }
    }
  }
  function roca(c, x, base, w, h, col, R) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, base); c.lineTo(x - w * .38, base - h * .6); c.lineTo(x - w * .12, base - h); c.lineTo(x + w * .2, base - h * .75); c.lineTo(x + w * .5, base - h * .3); c.lineTo(x + w / 2, base); c.closePath(); c.fill();
  }

  // ---------- sprites pequeños (se crean una vez) ----------
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const sh = mk(128, 128), s = sh.getContext('2d'), g = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(.45, 'rgba(0,0,0,.34)'); g.addColorStop(1, 'rgba(0,0,0,0)'); s.fillStyle = g; s.fillRect(0, 0, 128, 128);
    const bo = mk(96, 96), b = bo.getContext('2d'), gb = b.createRadialGradient(48, 48, 0, 48, 48, 48);
    gb.addColorStop(0, 'rgba(255,255,255,.55)'); gb.addColorStop(.82, 'rgba(255,255,255,.4)'); gb.addColorStop(1, 'rgba(255,255,255,0)'); b.fillStyle = gb; b.fillRect(0, 0, 96, 96);
    return SPR = { sombra: sh, bokeh: bo };
  }
  function nieblaSprite(col) {
    const c = mk(512, 140), x = c.getContext('2d');
    for (let i = 0; i < 5; i++) { const cx0 = 90 + i * 85, g = x.createRadialGradient(cx0, 70, 0, cx0, 70, 90); g.addColorStop(0, rgb(col, .5)); g.addColorStop(1, rgb(col, 0)); x.fillStyle = g; x.save(); x.translate(cx0, 70); x.scale(1.5, .55 + (i % 2) * .15); x.translate(-cx0, -70); x.fillRect(cx0 - 100, -40, 200, 220); x.restore(); }
    return c;
  }

  // ---------- estado y construcción ----------
  const E = { S: null, bosque: null, cueva: null, desierto: null, dead: false, tp: 0, avg: 16.7, lento: 0, lite: false };
  /* Red de seguridad de rendimiento: si el juego va lento de forma sostenida (≈ menos de 38 fps durante ~1,5 s), apaga solo los efectos caros. */
  function ritmo() { const n = performance.now(), d = n - E.tp; E.tp = n; if (d > 0 && d < 250) { E.avg = E.avg * .94 + d * .06; E.lento = E.avg > 26 ? E.lento + 1 : 0; if (E.lento > 90) E.lite = true; } }
  function estado() { const k = K(); if (!k) return null; const S = k.S(); if (!S) return null; if (E.S !== S) { E.S = S; E.bosque = E.cueva = E.desierto = null; } return S; }
  const calidad = S => (S.movil || E.lite || (root.NinjaCalidad && root.NinjaCalidad.nivel === 'baja')) ? 1 : 2;   // NinjaCalidad: engine/core/calidad.js
  const semilla = S => 1000 + ((S.params && S.params.semilla) | 0) % 9000;

  function construirBosque(S, k) {
    const sk = SKY[S.params && S.params.variante] || SKY.A, hor = mezcla(sk[1], sk[2], .45), th = k.G + 40, TW = 1600, sd = semilla(S), L = {};
    L.hor = hor; L.niebla = nieblaSprite(mezcla(hor, [255, 255, 255], .35));
    const luz = mezcla(sk[2], [255, 255, 255], .3);
    // Colinas lejanas con pagoda (perspectiva aérea fuerte, desenfocadas)
    L.colinas = baldosa(TW, th, 3, sd + 1, (c, R, tw) => {
      cresta(c, R, tw, th, th - 120, 150, rgb(mezcla('#3a4a78', hor, .6)), rgb(mezcla(luz, hor, .3), .35));
      pagoda(c, tw * .62, th - 140, 46, rgb(mezcla('#3a3f70', hor, .58)));
    });
    L.colinas2 = baldosa(TW, th, 2, sd + 2, (c, R, tw) => { cresta(c, R, tw, th, th - 60, 120, rgb(mezcla('#2c4a5c', hor, .5)), rgb(mezcla(luz, hor, .2), .4)); });
    const bb = { luz, hoja: null, ramas: true };
    L.cerca = baldosa(TW, th, 0, sd + 5, (c, R, tw) => bosqueDeBambu(c, R, tw, th, Object.assign({}, bb, { n: 4, w: [22, 30], col: mezcla('#1f5c3e', hor, .08), col2: mezcla('#2a6e48', hor, .06), brillo: .3, corona: .25, hoja: rgb(mezcla('#1f6a42', hor, .08), 1) })));
    // Primer plano: muy desenfocado y oscuro (pasa por delante del héroe)
    L.frente = (() => {
      const R = rng(sd + 6), tw = 3200, p = [], col = [14, 38, 32], o = { luz, brillo: .1 };
      for (let i = 0; i < 2; i++) { const sw = 34 + R() * 20, pc = pieza(Math.round(sw * 1.7), k.H, 10, x => tallo(x, sw * .85, k.H + 10, -20, sw, mezcla(col, [18, 46, 38], R()), R, o)); p.push({ pc, x: (i + .2 + R() * .6) / 2 * tw, y: 0 }); }
      for (let i = 0; i < 2; i++) { const len = 150 + R() * 90, pc = pieza(Math.round(len + 40), Math.round(len + 40), 10, x => { x.translate(20, 20); hoja(x, 0, 0, len, 1.2 + R() * .7, 24, 'rgba(10,34,26,.85)'); }); p.push({ pc, x: R() * tw, y: -10 + R() * 20 }); }
      return { tw, p };
    })();
    // Motas de polen, bancos de niebla y círculos de bokeh (posiciones fijas por nivel)
    const R = rng(sd + 9);
    L.motas = Array.from({ length: 38 }, () => ({ x: R(), y: R(), p: .5 + R() * 1.1, v: 6 + R() * 16, s: 1 + R() * 2.6, f: .6 + R() * 1.4, o: R() * 6.28 }));
    L.bancos = Array.from({ length: 7 }, (_, i) => ({ x: R(), y: (k.G - 250) + R() * 230, esc: .9 + R() * 1.1, v: 4 + R() * 9, p: .22 + R() * .3, a: .22 + R() * .18, f: R() < .5 }));
    L.bokeh = Array.from({ length: 9 }, () => ({ x: R(), y: R(), r: 24 + R() * 54, p: 1.25 + R() * .6, v: 5 + R() * 10, a: .05 + R() * .08 }));
    return L;
  }
  function construirMontes(L, k) {
    const im = k.img.montanas; if (!im || L.montes) return;
    const mw = 1400, mh = Math.round(im.height * mw / im.width);
    const t = baldosa(mw, mh, 2, 77, c => c.drawImage(im, 0, 0, mw, mh)), g = t.c.getContext('2d');
    g.globalCompositeOperation = 'source-atop'; const q = g.createLinearGradient(0, 0, 0, mh); q.addColorStop(0, rgb(L.hor, .08)); q.addColorStop(1, rgb(L.hor, .55)); g.fillStyle = q; g.fillRect(0, 0, mw, mh);
    L.montes = t;
  }
  function construirCueva(S, k) {
    const TW = 1500, th = k.H, sd = semilla(S) + 40, azul = [90, 170, 255], L = {};
    L.techoLejos = baldosa(TW, th, 3.5, sd + 1, (c, R, tw) => estalactitas(c, R, tw, { n: 15, w: [70, 150], h: [110, 260], col: [24, 18, 56], luz: azul, brillo: .08, th }));
    L.techoMedio = baldosa(TW, th, 1.6, sd + 2, (c, R, tw) => estalactitas(c, R, tw, { n: 9, w: [80, 160], h: [140, 320], col: [34, 26, 76], luz: azul, brillo: .18, th, rim: 'rgba(110,190,255,.28)' }));
    L.techoCerca = baldosa(TW, th, 0, sd + 3, (c, R, tw) => estalactitas(c, R, tw, { n: 5, w: [90, 170], h: [150, 330], col: [46, 36, 98], luz: azul, brillo: .22, th, rim: 'rgba(130,205,255,.4)' }));
    const hs = 320;
    L.suelosLejos = baldosa(TW, hs, 3, sd + 4, (c, R, tw) => estalactitas(c, R, tw, { n: 12, w: [60, 130], h: [60, 170], col: [26, 20, 60], luz: azul, brillo: .08, th: hs, suelo: true }));
    L.suelosMedio = baldosa(TW, hs, 1.4, sd + 5, (c, R, tw) => estalactitas(c, R, tw, { n: 7, w: [70, 150], h: [90, 240], col: [38, 29, 84], luz: azul, brillo: .16, th: hs, suelo: true, rim: 'rgba(110,190,255,.25)' }));
    L.frente = (() => {
      const R = rng(sd + 6), tw = 2400, p = [];
      for (let i = 0; i < 3; i++) { const pc = pieza(300, 440, 9, x => estalactitas(x, R, 300, { n: 1, w: [150, 230], h: [230, 420], col: [6, 4, 16], luz: azul, brillo: 0, th: 440 })); p.push({ pc, x: (i + .1 + R() * .7) / 3 * tw, y: 0 }); }
      return { tw, p };
    })();
    L.niebla = nieblaSprite([70, 110, 190]);
    const R = rng(sd + 9);
    L.motas = Array.from({ length: 34 }, () => ({ x: R(), y: R(), p: .5 + R() * 1.1, v: 4 + R() * 10, s: 1 + R() * 2.4, f: .5 + R() * 1.2, o: R() * 6.28 }));
    L.bancos = Array.from({ length: 6 }, () => ({ x: R(), y: (k.G - 160) + R() * 150, esc: 1 + R() * 1.2, v: 3 + R() * 6, p: .2 + R() * .3, a: .22 + R() * .15 }));
    return L;
  }
  function construirDesierto(S, k) {
    const TW = 1700, th = k.G + 60, sd = semilla(S) + 80, hor = [96, 56, 84], luz = [255, 215, 145], L = {};
    const dunas = (n, blur, base, amp, col, rim) => baldosa(TW, th, blur, sd + n, (c, R, tw) => cresta(c, R, tw, th, base, amp, rgb(col), rim));
    L.d1 = dunas(1, 3.5, th - 170, 120, mezcla([52, 40, 88], hor, .5), 'rgba(255,215,145,.16)');
    L.d2 = dunas(2, 2.2, th - 120, 120, mezcla([70, 46, 82], hor, .35), 'rgba(255,215,145,.2)');
    L.d3 = dunas(3, 1, th - 80, 100, mezcla([96, 56, 78], hor, .15), 'rgba(255,215,145,.26)');
    L.d4 = dunas(4, 0, th - 40, 80, [122, 70, 62], 'rgba(255,215,145,.32)');
    L.frente = (() => {
      const R = rng(sd + 6), tw = 2600, p = [];
      for (let i = 0; i < 3; i++) { const w = 200 + R() * 160, h = 150 + R() * 200, pc = pieza(Math.round(w), Math.round(h), 8, x => roca(x, w / 2, h + 10, w * .9, h, 'rgba(14,8,26,.95)', R)); p.push({ pc, x: (i + .2 + R() * .6) / 3 * tw, y: k.H - h }); }
      return { tw, p };
    })();
    L.niebla = nieblaSprite([150, 100, 110]);
    const R = rng(sd + 9);
    L.motas = Array.from({ length: 36 }, () => ({ x: R(), y: R(), p: .5 + R() * 1.1, v: 18 + R() * 30, s: 1 + R() * 2, f: .6 + R() * 1.4, o: R() * 6.28 }));
    L.bancos = Array.from({ length: 6 }, () => ({ x: R(), y: (k.G - 120) + R() * 110, esc: 1.1 + R() * 1.2, v: 10 + R() * 14, p: .25 + R() * .3, a: .2 + R() * .14 }));
    return L;
  }

  // ---------- dibujo ----------
  function pegar(t, par, y, S, k, alfa) {
    const cx = k.cx, W = k.W, off = (((S.cam * par) % t.tw) + t.tw) % t.tw; if (alfa != null) cx.globalAlpha = alfa;
    for (let x = -off; x < W; x += t.tw) cx.drawImage(t.c, Math.floor(x), y, t.tw, t.th);
  }
  function bancos(L, S, k, rojo, alfa, desde, hasta) {
    const cx = k.cx, W = k.W, t = S.t, per = W + 700;
    for (let i = 0; i < L.bancos.length; i++) {
      const b = L.bancos[i]; if (b.p < desde || b.p >= hasta) continue;
      const w = 512 * b.esc, x = ((((b.x * per - (t * b.v + (S.vd || 0) * b.v * .5) - S.cam * b.p) % per) + per) % per) - 350, y = b.y + Math.sin(t * .25 + i * 2) * 5;
      cx.globalAlpha = alfa * b.a * 2.2 * (.8 + .2 * Math.sin(t * .4 + i)); cx.drawImage(L.niebla, x, y, w, 140 * b.esc);
    }
  }
  function motas(L, S, k, col, alfa, noche) {
    const cx = k.cx, W = k.W, H = k.H, t = S.t; cx.save(); cx.globalCompositeOperation = 'lighter'; cx.fillStyle = col;
    for (const m of L.motas) {
      const x = (((m.x * W * 1.5 - S.cam * m.p - (t * m.v + (S.vd || 0) * m.v * .4)) % W) + W) % W, y = ((m.y * k.G * .95 + Math.sin(t * .5 * m.f + m.o) * 20) + H) % H;
      cx.globalAlpha = alfa * (.25 + .75 * Math.max(0, Math.sin(t * m.f * 1.6 + m.o))); cx.fillRect(x, y, m.s * (noche ? 1 : m.p), m.s * (noche ? 1 : m.p));
    }
    cx.restore();
  }
  function rayos(S, k, sx, sy, col, alfa) {
    const cx = k.cx, t = S.t; if (sx < -200 || sx > k.W + 200) return; cx.save(); cx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const a = 1.95 + i * .13 + Math.sin(t * .22 + i * 1.7) * .035, ab = .045 + (i % 3) * .012, L = 1150, ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
      const g = cx.createLinearGradient(sx, sy, ex, ey); const p = alfa * (.55 + .45 * Math.sin(t * .35 + i * 2.3)); g.addColorStop(0, rgb(col, p)); g.addColorStop(.7, rgb(col, p * .3)); g.addColorStop(1, rgb(col, 0));
      cx.fillStyle = g; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + Math.cos(a - ab) * L, sy + Math.sin(a - ab) * L); cx.lineTo(sx + Math.cos(a + ab) * L, sy + Math.sin(a + ab) * L); cx.closePath(); cx.fill();
    }
    cx.restore();
  }

  function bosque(alfa) {
    if (E.dead) return false;
    try {
      ritmo();
      const S = estado(), k = K(); if (!S || !k) return false; const cx = k.cx, W = k.W, H = k.H, G = k.G, calid = calidad(S);
      const L = E.bosque || (E.bosque = construirBosque(S, k)); construirMontes(L, k);
      const sk = SKY[S.params && S.params.variante] || SKY.A, base = G + 40;
      cx.globalAlpha = alfa;
      const g = cx.createLinearGradient(0, 0, 0, G + 40); g.addColorStop(0, sk[0]); g.addColorStop(.55, sk[1]); g.addColorStop(1, sk[2]); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      // Sol con halo (los rayos nacen de aquí)
      const sx = 880 - (S.cam * .02) % 2000, sy = 190;
      const sg = cx.createRadialGradient(sx, sy, 10, sx, sy, 190); sg.addColorStop(0, 'rgba(255,244,210,.95)'); sg.addColorStop(.3, 'rgba(255,236,190,.55)'); sg.addColorStop(1, 'rgba(255,220,170,0)');
      cx.globalAlpha = alfa; cx.fillStyle = sg; cx.fillRect(sx - 200, -10, 400, 400); cx.fillStyle = 'rgba(255,248,226,.96)'; cx.beginPath(); cx.arc(sx, sy, 50, 0, 7); cx.fill();
      const nube = k.img.nube; if (nube) for (let i = 0; i < 4; i++) { const w = 280 + i * 60, x = ((i * 430 - (S.t * (8 + i * 3) + (S.vd || 0) * (5 + i * 2)) - S.cam * (.04 + i * .01)) % (W + 500) + (W + 500)) % (W + 500) - 250; cx.globalAlpha = alfa * .75; cx.drawImage(nube, x, 60 + i * 55, w, nube.height * w / nube.width); }
      // Capas, de lo más lejano a lo más cercano
      if (L.montes) pegar(L.montes, .05, G - L.montes.th + 30, S, k, alfa);
      pegar(L.colinas, .09, base - L.colinas.th, S, k, alfa);
      { const v = cx.createLinearGradient(0, G - 230, 0, G + 40); v.addColorStop(0, rgb(L.hor, 0)); v.addColorStop(.55, rgb(L.hor, .3)); v.addColorStop(1, rgb(L.hor, .36)); cx.globalAlpha = alfa; cx.fillStyle = v; cx.fillRect(0, G - 230, W, 270); }   // velo de horizonte
      if (calid > 1) pegar(L.colinas2, .15, base - L.colinas2.th, S, k, alfa);
      if (calid > 1) bancos(L, S, k, 0, alfa, 0, .27);
      // Bambú lejano y medio: las ilustraciones del rediseño visual (motor.js → tilesBosque), cada una con su paralaje; yo añado la niebla entre ellas
      const T = k.tilesBosque ? k.tilesBosque() : [];
      const capa = (t, a) => { const tw = t.cv.width, wv = k.viento ? k.viento(S.cam + W / 2, S.t) : 0, o = -((S.cam * t.par) % tw) - (wv * t.par * 10 + Math.sin(S.t * .9 + t.par * 6) * t.par * 3); cx.globalAlpha = a; for (let x = o; x < W; x += tw) cx.drawImage(t.cv, Math.floor(x), 0); };
      if (T[0]) capa(T[0], alfa);
      if (calid > 1) bancos(L, S, k, 0, alfa, .27, .4);
      if (T[1]) capa(T[1], alfa);
      if (calid > 1) rayos(S, k, sx, sy, [255, 214, 150], .1 * alfa);
      pegar(L.cerca, .58, base - L.cerca.th, S, k, alfa);
      // Neblina baja delante de todo el bosque (profundidad atmosférica hacia el suelo)
      const f = cx.createLinearGradient(0, G - 240, 0, G + 20); f.addColorStop(0, rgb(L.hor, 0)); f.addColorStop(1, rgb(L.hor, .4)); cx.globalAlpha = alfa; cx.fillStyle = f; cx.fillRect(0, G - 240, W, 260);
      if (calid > 1) motas(L, S, k, 'rgb(255,236,190)', .8 * alfa, false);
      cx.globalAlpha = 1; return true;
    } catch (e) { E.dead = true; if (root.console) console.warn('N1prof.bosque desactivado:', e); return false; }
  }
  function cueva(alfa) {
    if (E.dead) return false;
    try {
      ritmo();
      const S = estado(), k = K(); if (!S || !k) return false; const cx = k.cx, W = k.W, H = k.H, G = k.G, calid = calidad(S), L = E.cueva || (E.cueva = construirCueva(S, k));
      cx.globalAlpha = alfa; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07050f'); g.addColorStop(.6, '#150e2c'); g.addColorStop(1, '#241648'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      // Cristales lejanos que brillan (luz azul) con parallax
      for (let i = 0; i < 9; i++) { const par = .12 + (i % 3) * .07, x = ((i * 337 - S.cam * par) % (W + 200) + W + 200) % (W + 200) - 100, y = 200 + (i * 97) % 260, r = 50 + (i * 31) % 40 + Math.sin(S.t * 1.2 + i) * 4; const gl = cx.createRadialGradient(x, y, 0, x, y, r); gl.addColorStop(0, 'rgba(80,170,255,.3)'); gl.addColorStop(1, 'rgba(80,170,255,0)'); cx.globalAlpha = alfa; cx.fillStyle = gl; cx.fillRect(x - r, y - r, r * 2, r * 2); }
      pegar(L.techoLejos, .08, 0, S, k, alfa);
      pegar(L.suelosLejos, .12, G + 30 - L.suelosLejos.th, S, k, alfa);
      if (calid > 1) bancos(L, S, k, 0, alfa, 0, .3);
      pegar(L.techoMedio, .2, 0, S, k, alfa);
      pegar(L.suelosMedio, .28, G + 30 - L.suelosMedio.th, S, k, alfa);
      if (calid > 1) rayos(S, k, W * .62, -30, [90, 160, 255], .05 * alfa);
      pegar(L.techoCerca, .4, 0, S, k, alfa);
      const f = cx.createLinearGradient(0, G - 200, 0, G + 20); f.addColorStop(0, 'rgba(70,110,190,0)'); f.addColorStop(1, 'rgba(70,110,190,' + .3 * alfa + ')'); cx.globalAlpha = 1; cx.fillStyle = f; cx.fillRect(0, G - 200, W, 220);
      if (calid > 1) bancos(L, S, k, 0, alfa, .3, 1);
      if (calid > 1) motas(L, S, k, 'rgb(150,200,255)', .7 * alfa, true);
      cx.globalAlpha = 1; return true;
    } catch (e) { E.dead = true; if (root.console) console.warn('N1prof.cueva desactivado:', e); return false; }
  }
  function desierto(alfa) {
    if (E.dead) return false;
    try {
      ritmo();
      const S = estado(), k = K(); if (!S || !k) return false; const cx = k.cx, W = k.W, H = k.H, G = k.G, calid = calidad(S), L = E.desierto || (E.desierto = construirDesierto(S, k)), base = G + 60;
      cx.globalAlpha = alfa; const sky = cx.createLinearGradient(0, 0, 0, G + 40); sky.addColorStop(0, '#070b28'); sky.addColorStop(.58, '#17143b'); sky.addColorStop(1, '#4b2940'); cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++) { const x = ((i * 197 - S.cam * .04) % (W + 80) + W + 80) % (W + 80) - 40, y = 22 + (i * 83 % 280), r = .7 + (i % 3) * .45; cx.globalAlpha = alfa * (.45 + .45 * Math.sin(S.t * 2 + i)); cx.fillStyle = '#d9e8ff'; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }
      const mx = W * .79, my = H * .17, mg = cx.createRadialGradient(mx, my, 20, mx, my, 260); mg.addColorStop(0, 'rgba(255,215,145,' + .38 * alfa + ')'); mg.addColorStop(1, 'rgba(255,215,145,0)'); cx.globalAlpha = 1; cx.fillStyle = mg; cx.fillRect(mx - 260, my - 260, 520, 520);
      cx.globalAlpha = alfa; cx.fillStyle = 'rgba(255,215,145,.9)'; cx.beginPath(); cx.arc(mx, my, 30, 0, 7); cx.fill();
      pegar(L.d1, .05, base - L.d1.th, S, k, alfa);
      if (calid > 1) bancos(L, S, k, 0, alfa, 0, .3);
      pegar(L.d2, .1, base - L.d2.th, S, k, alfa);
      pegar(L.d3, .18, base - L.d3.th, S, k, alfa);
      if (calid > 1) bancos(L, S, k, 0, alfa, .3, 1);
      pegar(L.d4, .3, base - L.d4.th, S, k, alfa);
      const f = cx.createLinearGradient(0, G - 160, 0, G + 20); f.addColorStop(0, 'rgba(120,70,90,0)'); f.addColorStop(1, 'rgba(120,70,90,' + .32 * alfa + ')'); cx.globalAlpha = 1; cx.fillStyle = f; cx.fillRect(0, G - 160, W, 180);
      if (calid > 1) motas(L, S, k, 'rgb(255,215,160)', .7 * alfa, true);
      cx.globalAlpha = 1; return true;
    } catch (e) { E.dead = true; if (root.console) console.warn('N1prof.desierto desactivado:', e); return false; }
  }

  // ---------- primer plano (delante del héroe, antes de la oscuridad de la cueva) ----------
  function frente() {
    if (E.dead) return;
    try {
      const S = estado(), k = K(); if (!S || !k) return; const cx = k.cx, W = k.W, H = k.H, G = k.G, calid = calidad(S);
      const capas = []; // [piezas, parallax, alfa]
      if (S.nivel2) { if (E.desierto) capas.push([E.desierto.frente, 1.45, .95]); }
      else {
        if (E.bosque && S.mezcla < .98) capas.push([E.bosque.frente, 1.45, (1 - S.mezcla) * .85]);
        if (E.cueva && S.mezcla > .02) capas.push([E.cueva.frente, 1.3, S.mezcla * .95]);
      }
      const h = S.h, hx = h.x - S.cam;
      for (const [F, par, a] of capas) {
        if (a < .01) continue; const sh = S.cam * par;
        for (const q of F.p) {
          const x0 = (((q.x - sh) % F.tw) + F.tw) % F.tw, pc = q.pc;
          for (let r = 0; r < 2; r++) {
            const xx = r ? x0 - F.tw : x0, dx = xx - pc.m; if (dx > W || dx + pc.c.width < 0) continue;
            // se vuelve casi transparente cerca del héroe: lo de delante nunca tapa lo que hay que leer o esquivar
            const f = .15 + .85 * clamp((Math.abs(xx + pc.w / 2 - hx) - 70) / 240, 0, 1);
            const wv = k.viento ? k.viento(S.cam + xx, S.t) : 0, vai = -(wv * 9) + Math.sin(S.t * 1.3 + q.x * .01) * 2.5;
            cx.globalAlpha = a * f * (calid > 1 ? 1 : .6); cx.drawImage(pc.c, dx + vai, q.y - pc.m);
          }
        }
      }
      cx.globalAlpha = 1;
      // Bokeh: círculos de luz desenfocados muy cerca de la cámara
      if (calid > 1 && !S.nivel2 && E.bosque && S.mezcla < .5) {
        const L = E.bosque, sp = sprites(); cx.save(); cx.globalCompositeOperation = 'lighter';
        for (const b of L.bokeh) { const per = W + 300, x = ((((b.x * per - S.t * b.v - S.cam * b.p) % per) + per) % per) - 150, y = ((b.y * H + Math.sin(S.t * .3 + b.x * 9) * 18) % H); cx.globalAlpha = b.a * (1 - S.mezcla * 2); cx.drawImage(sp.bokeh, x - b.r, y - b.r, b.r * 2, b.r * 2); }
        cx.restore(); cx.globalAlpha = 1;
      }
    } catch (e) { E.dead = true; if (root.console) console.warn('N1prof.frente desactivado:', e); }
  }

  // ---------- sombras ----------
  // La luz entra por la derecha (el sol del bosque): las sombras se estiran un poco hacia la izquierda.
  function sombra(x, y, rx, ry, a, desvio) {
    const k = K(), cx = k.cx, sp = sprites(); if (a <= .01 || rx < 2) return;
    const d = desvio == null ? -rx * .22 : desvio; cx.globalAlpha = clamp(a, 0, 1); cx.drawImage(sp.sombra, x + d - rx, y - ry, rx * 2, ry * 2); cx.globalAlpha = 1;
  }
  function sombraHeroe(h, al, escala) {
    if (E.dead) return false;
    try {
      const S = estado(), k = K(); if (!S || !k) return false; const G = k.G, x = h.x - S.cam, y = (h.pisando ? h.y : G) + 4, e = escala || 1.35, f = 1 - .35 * al, noche = S.osc > .3 ? 1 : 0;
      sombra(x, y, 52 * e * f, 11 * e * f, .55 * (1 - .55 * al) * (noche ? .7 : 1));                  // penumbra ancha
      sombra(x, y, 26 * e * f, 5.5 * e * f, .7 * (1 - .6 * al), 0);                                     // sombra de contacto, más oscura y pegada
      return true;
    } catch (e) { E.dead = true; return false; }
  }
  const ANCHO = { ninja: 38, ninjaAtk: 42, arquero: 50, lancero: 54, serpiente: 44, escarabajo: 46, rana: 34, tengu: 40, murcielago: 30, arana: 28, guardiaPiedra: 52, sombraPers: 36 };
  const VUELA = { tengu: 1, murcielago: 1, arana: 1 };
  function sombras() {
    if (E.dead) return;
    try {
      const S = estado(), k = K(); if (!S || !k) return; const G = k.G, W = k.W, cam = S.cam, enGap = x => S.N.gaps.some(g => x > g.x0 && x < g.x1);
      // Plataformas: sombra suave en el suelo, más tenue y difusa cuanto más alto están
      S.N.plat.forEach(p => {
        if (p.estado === 'caida' || p.X + p.w < cam - 80 || p.X > cam + W + 80) return; const top = p.Y + (p.cy || 0), alt = G - top; if (alt < 25 || alt > 420) return;
        const cxp = p.X + p.w / 2; if (enGap(cxp)) return; const q = clamp(alt / 420, 0, 1);
        sombra(cxp - cam, G + 6, p.w * (.5 + .12 * q), 9 + 8 * q, .34 * (1 - .75 * q), -p.w * .06);
      });
      // Enemigos en el suelo (o sobre su plataforma); los que vuelan proyectan su sombra al suelo, más pequeña cuanto más alto
      S.enemigos.forEach(e => {
        if (!e.vivo || e.x < cam - 160 || e.x > cam + W + 160) return; const w = ANCHO[e.kind] || 42;
        if (VUELA[e.kind]) { const alt = Math.max(0, G - e.y), q = clamp(alt / 320, 0, 1); sombra(e.x - cam, G + 5, w * (1 - .45 * q), 7 * (1 - .4 * q), .4 * (1 - .7 * q)); }
        else sombra(e.x - cam, e.y + 4, w * 1.15, 8, .5);
      });
      // Objetos que flotan: sombrita en el suelo que late con ellos
      S.items.forEach(i => {
        if (i.tomado || i.x < cam - 60 || i.x > cam + W + 60) return; const alt = G - i.y; if (alt < 0 || alt > 160 || enGap(i.x)) return; const q = alt / 160, b = Math.sin(S.t * 3 + i.x) * .12;
        sombra(i.x - cam, G + 5, 22 * (1 - .3 * q) * (1 + b), 5, .32 * (1 - .6 * q));
      });
      // Decorado y torii
      const D = k.DECO; if (D) S.N.deco.forEach(d => {
        if (d.capa !== 'atras' || d.techo || d.x < cam - 300 || d.x > cam + W + 300) return; const q = D[d.tipo]; if (!q || /cielo|nube|luz/.test(d.tipo)) return;
        sombra(d.x - cam, G + 6, q[1] * .42, 8, .3);
      });
      S.ckp.forEach(c => { if (c.x < cam - 300 || c.x > cam + W + 300) return; sombra(c.x - cam, G + 7, c.zona === 'cueva' ? 70 : 96, 9, .34); });
      if (S.N.meta && S.N.meta.x > cam - 300 && S.N.meta.x < cam + W + 300) sombra(S.N.meta.x - cam, G + 7, 125, 10, .36);
    } catch (e) { E.dead = true; if (root.console) console.warn('N1prof.sombras desactivado:', e); }
  }

  root.N1prof = { bosque, cueva, desierto, frente, sombras, sombraHeroe, _estado: () => E, _desactivar: () => { E.dead = true; }, _activar: () => { E.dead = false; E.S = null; E.lite = false; E.lento = 0; E.avg = 16.7; } };
})(typeof window !== 'undefined' ? window : globalThis);
