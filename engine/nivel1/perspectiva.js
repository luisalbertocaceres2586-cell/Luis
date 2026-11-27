/* Perspectiva pseudo-3D del Nivel 1 — «La Senda del Aprendiz Ninja»
 * Complementa a profundidad.js (capas del escenario) y camara.js (zoom, roll, luces): aquí la PERSPECTIVA reacciona a lo que hace el jugador.
 *   · GIRO DE CÁMARA (keystone): el cuadro se «inclina» como si la cámara girara hacia donde corres. El lado hacia el que avanzas queda más lejos
 *     (más pequeño) y el lado de atrás más cerca, y la línea del suelo se inclina. Crece con la velocidad, el dash y al apuntar a un blanco.
 *     Quieto no cuesta nada: el efecto se apaga solo cuando es casi cero.
 *   · ENFOQUE (tilt-shift): al apuntar con F todo lo que está fuera de la altura del blanco se desenfoca, como una lente de cine.
 *   · DESENFOQUE RADIAL en el dash: estelas de zoom desde el héroe.
 *   · ONDAS DE CHOQUE EN EL SUELO: elipses aplastadas (suelo visto en perspectiva) al empezar el dash, aterrizar fuerte y derrotar enemigos.
 * Sin imágenes ni dependencias. Se conecta desde motor.js con window.N1persp (ganchos suelo / encima / inv).
 * Se apaga con ?persp=0 en la URL o N1persp._apagar(). Respeta «reducir movimiento». En móvil y equipos lentos solo quedan las ondas del suelo.
 * Si algo falla, cada gancho se apaga solo y el juego sigue. */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const K = () => root.N1core;

  const W = 1280, H = 720;
  const PIVOTE = H * 0.45;        // altura del «horizonte» sobre la que se escala: el suelo se inclina, el cielo no se rompe
  const YAW_MAX = 0.06;           // escala extra máxima del lado cercano (6 %): se nota sin deformar
  const MIN_YAW = 0.0025;         // por debajo de esto no se dibuja el giro
  const LONJAS = 64;              // franjas verticales del giro (20 px cada una)

  const E = {
    S: null, off: false, t0: 0, yaw: 0, dashV: 0, aim: 0, aimX: W / 2, aimY: H / 2, dashDir: 1,
    prev: null, ondas: [], reducido: false, lite: false, movil: false, avg: 16.7, lento: 0,
    snap: null, desen: null, mascara: null
  };
  try { E.reducido = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* sin matchMedia */ }
  try { if (root.location && /[?&]persp=0\b/.test(root.location.search)) E.off = true; } catch (e) { /* nada */ }
  try { if (root.location && /[?&]persp=force\b/.test(root.location.search)) E.forzar = true; } catch (e) { /* nada */ }   // QA: no apagar efectos aunque el equipo sea lento

  function estado() {
    const k = K(); if (!k || !k.S) return null;
    const S = k.S(); if (!S) return null;
    if (E.S !== S) { E.S = S; E.prev = null; E.ondas.length = 0; E.yaw = 0; E.dashV = 0; E.aim = 0; E.t0 = 0; E.movil = !!(S.movil || S.dispositivo === 'movil'); }
    return S;
  }
  function lienzo(w, h) {
    const d = root.document; if (!d || !d.createElement) return null;
    const c = d.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  const caro = () => E.lite || E.reducido || E.movil;

  /* ---------- ondas de choque en el suelo ---------- */
  function onda(x, y, col, fuerza) {
    if (E.ondas.length > 12) E.ondas.shift();
    E.ondas.push({ x, y, col, f: clamp(fuerza == null ? 1 : fuerza, .3, 1.6), t: 0, vida: .6 });
  }

  /* ---------- lectura de lo que hace el héroe (solo flancos: el instante en que algo empieza) ---------- */
  const VUELA = { tengu: 1, murcielago: 1, arana: 1 };
  function leer(S, dt) {
    const h = S.h, k = K(), G = (k && k.G) || 560, A = S.hab;
    const p = E.prev || (E.prev = { dash: false, suelo: true, vy: 0, vivos: new Map() });
    const pies = (h.pisando ? h.y : G) + 4;

    const dash = !!(A && A.dash && A.dash.t > 0);
    if (dash && !p.dash) { onda(h.x, pies, [120, 220, 255], 1); E.dashV = 1; E.dashDir = h.dir || 1; }
    p.dash = dash; E.dashV = Math.max(0, E.dashV - dt * 3.2);

    if (h.suelo && !p.suelo && p.vy > 420) onda(h.x, pies, [255, 205, 130], clamp(p.vy / 900, .4, 1.4));
    p.suelo = h.suelo; p.vy = h.vy;

    const ahora = new Map();
    (S.enemigos || []).forEach(e => { if (e.vivo) ahora.set(e, [e.x, VUELA[e.kind] ? G + 5 : e.y + 4]); });
    p.vivos.forEach((pos, e) => { if (!ahora.has(e) && !e.vivo) onda(pos[0], pos[1], [255, 240, 190], 1.1); });
    p.vivos = ahora;

    // apuntar con F: el foco y el giro buscan el blanco elegido (se lee de la cámara, que ya lo calcula)
    const C = root.N1cam && root.N1cam._estado ? root.N1cam._estado() : null;
    const ap = !!S.apunta;
    E.aim = lerp(E.aim, ap ? 1 : 0, clamp(dt * (ap ? 7 : 5), 0, 1));
    if (C && ap) { E.aimX = C.aimX; E.aimY = C.aimY; }
  }

  /* ---------- giro de cámara: escala vertical de cada franja ---------- */
  const escalaEn = (sx, Y) => {
    // sx en px del lienzo (0..W). Y > 0: avanzas a la derecha → izquierda más cerca. Y < 0: al revés.
    const t = clamp(sx / W, 0, 1) * 2 - 1, ay = Math.abs(Y);
    return 1 + ay * (1 - Math.sign(Y) * t);
  };
  /* Deshace el giro para un punto de pantalla (sirve para apuntar con el puntero aunque el cuadro esté inclinado). */
  function inv(sx, sy) {
    if (E.off || caro() || Math.abs(E.yaw) < MIN_YAW) return { x: sx, y: sy };
    const j = Math.min(LONJAS - 1, Math.floor(clamp(sx, 0, W - 1) / (W / LONJAS))), cx0 = (j + .5) * (W / LONJAS);
    return { x: sx, y: PIVOTE + (sy - PIVOTE) / escalaEn(cx0, E.yaw) };
  }

  function girar(cx, c) {
    if (Math.abs(E.yaw) < MIN_YAW) return;
    const w = c.width, h = c.height, f = h / H, py = PIVOTE * f;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = true;
    for (let j = 0; j < LONJAS; j++) {
      const x0 = Math.round(j * w / LONJAS), x1 = Math.round((j + 1) * w / LONJAS), s = escalaEn((j + .5) * W / LONJAS, E.yaw);
      cx.drawImage(E.snap, x0, 0, x1 - x0, h, x0, py - py * s, x1 - x0, h * s);
    }
    cx.restore();
  }

  /* ---------- enfoque tilt-shift: desenfoca fuera de la altura del blanco ---------- */
  function enfocar(cx, c) {
    const w = c.width, h = c.height;
    if (!E.desen || E.desen.width !== (w >> 2)) { E.desen = lienzo(w >> 2, h >> 2); E.mascara = lienzo(w, h); }
    if (!E.desen || !E.mascara) return;
    const d = E.desen.getContext('2d'), m = E.mascara.getContext('2d');
    d.imageSmoothingEnabled = true; d.drawImage(c, 0, 0, E.desen.width, E.desen.height);     // reducir = desenfocar barato (y válido en Safari)
    m.save(); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, w, h); m.imageSmoothingEnabled = true; m.drawImage(E.desen, 0, 0, w, h);
    const fy = clamp(E.aimY / H, .2, .8), g = m.createLinearGradient(0, 0, 0, h), a = .85 * E.aim;
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(clamp(fy - .22, 0, 1), 'rgba(0,0,0,' + a * .9 + ')');
    g.addColorStop(clamp(fy - .08, 0, 1), 'rgba(0,0,0,0)'); g.addColorStop(clamp(fy + .08, 0, 1), 'rgba(0,0,0,0)');
    g.addColorStop(clamp(fy + .22, 0, 1), 'rgba(0,0,0,' + a * .9 + ')'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')');
    m.globalCompositeOperation = 'destination-in'; m.fillStyle = g; m.fillRect(0, 0, w, h); m.restore();
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.drawImage(E.mascara, 0, 0); cx.restore();
  }

  /* ---------- desenfoque radial del dash: copias ampliadas desde el héroe ---------- */
  function radial(cx, c, S) {
    const a = .13 * E.dashV; if (a < .01) return;
    const hx = (S.h.x - S.cam) * c.width / W, hy = (S.h.y - 70) * c.height / H;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    [1.035, 1.075, 1.12].forEach((z, i) => {
      cx.globalAlpha = a * (1 - i * .25);
      cx.drawImage(E.snap, 0, 0, c.width, c.height, hx - hx * z, hy - hy * z, c.width * z, c.height * z);
    });
    cx.restore();
  }

  /* ---------- gancho 1 (dentro de la cámara, tras las sombras, antes de los personajes): ondas en el suelo ---------- */
  function suelo(cx) {
    if (E.off) return;
    const S = estado(); if (!S || !cx) return;
    try {
      const ahora = performance.now(); let dt = E.t0 ? (ahora - E.t0) / 1000 : 1 / 60; E.t0 = ahora; dt = clamp(dt, .001, .1);
      E.avg = E.avg * .94 + dt * 1000 * .06; E.lento = E.avg > 26 ? E.lento + 1 : 0; if (E.lento > 90 && !E.forzar) E.lite = true;
      E.dt = dt;
      if (!S.pausa) leer(S, dt);
      for (let i = E.ondas.length - 1; i >= 0; i--) {
        const o = E.ondas[i]; if (!S.pausa) o.t += dt; if (o.t >= o.vida) { E.ondas.splice(i, 1); continue; }
        const q = o.t / o.vida, e = 1 - (1 - q) * (1 - q), rx = (24 + 230 * e) * o.f, a = (1 - q) * (1 - q), x = o.x - S.cam, col = o.col;
        if (x < -rx || x > W + rx) continue;
        cx.save(); cx.translate(x, o.y); cx.scale(1, .17);
        cx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (.16 * a) + ')'; cx.beginPath(); cx.arc(0, 0, rx, 0, 6.2832); cx.fill();
        cx.lineWidth = 7 * (1 - q) + 1.5; cx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (.75 * a) + ')'; cx.stroke();
        cx.beginPath(); cx.arc(0, 0, rx * .72, 0, 6.2832); cx.lineWidth = 3 * (1 - q) + .5; cx.strokeStyle = 'rgba(255,255,255,' + (.45 * a) + ')'; cx.stroke();
        cx.restore();
      }
    } catch (e) { E.off = true; if (root.console) console.warn('N1persp desactivada:', e); }
  }

  /* ---------- gancho 2 (tras cx.restore() y antes de las capas de pantalla de camara.js): giro, enfoque y radial ---------- */
  function encima(cx) {
    if (E.off || caro()) return;
    const S = estado(); if (!S || !cx || !cx.canvas) return;
    try {
      const c = cx.canvas, h = S.h, dt = E.dt || 1 / 60;
      // giro objetivo: velocidad lateral + dash + inclinarse hacia el blanco al apuntar; siempre suave
      let obj = clamp(h.vx / 600, -1, 1) * .045 + E.dashDir * E.dashV * .03 + clamp((E.aimX - W / 2) / W, -.5, .5) * .07 * E.aim;
      if (S.pausa || S.fin) obj = 0;
      E.yaw = lerp(E.yaw, clamp(obj, -YAW_MAX, YAW_MAX), clamp(dt * 4, 0, 1));
      if (E.aim > .03) enfocar(cx, c);
      const hayGiro = Math.abs(E.yaw) >= MIN_YAW, hayRadial = E.dashV > .05;
      if (!hayGiro && !hayRadial) return;
      if (!E.snap || E.snap.width !== c.width || E.snap.height !== c.height) E.snap = lienzo(c.width, c.height);
      if (!E.snap) return;
      const s = E.snap.getContext('2d'); s.clearRect(0, 0, c.width, c.height); s.drawImage(c, 0, 0);
      girar(cx, c); if (hayRadial) radial(cx, c, S);
    } catch (e) { E.off = true; if (root.console) console.warn('N1persp desactivada:', e); }
  }

  const api = {
    suelo, encima, inv, onda,
    _estado: () => E, _apagar: () => { E.off = true; },
    _encender: () => { E.off = false; E.S = null; E.lite = false; E.lento = 0; E.avg = 16.7; E.yaw = 0; }
  };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.N1persp = api;
})(typeof window !== 'undefined' ? window : globalThis);
