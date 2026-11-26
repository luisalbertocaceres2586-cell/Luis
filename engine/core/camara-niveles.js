/* Cámara de cine + luces para los Niveles 2 (desierto/surf) y 3 (corredor) — mismo lenguaje visual que engine/nivel1/camara.js.
 * Un motor común (zoom con «golpe», inclinación, hit-stop, luces aditivas, líneas de velocidad, barras de jefe, viñeta) y un
 * ADAPTADOR por nivel que traduce el estado del juego en eventos: acierto, error, daño, salto, cambio de carril, dash, jefe, final…
 * Ganchos (3 líneas por nivel):  NCam.nN.antes(cx[, S])  tras cx.save() · NCam.nN.encima(cx[, S])  tras cx.restore() · NCam.nN.escala()  en el bucle.
 * Se apaga con ?cam=0, con NCam.nN._apagar() o solo si algo falla. Respeta «reducir movimiento» (efectos al ~35 %). */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rnd = () => Math.random() < .5 ? -1 : 1;

  function motor(cfg) {
    const W = cfg.W, H = cfg.H, BASE = cfg.base || 1.04, ZMAX = 1.22, ROLL = cfg.roll || .014;
    const E = {
      S: null, off: false, t0: 0, z: BASE, zp: 0, roll: 0, rp: 0, fx: W / 2, fy: H / 2, oy: 0, kx: 0, stop: 0, intro: 1, hurt: 0, bars: 0, speed: 0, fin: 0,
      latido: 0, luces: [], prev: {}, reducido: false, lite: false, avg: 16.7, lento: 0, hx: W / 2, hy: H / 2, Z: BASE, par: {}
    };
    try { E.reducido = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* sin matchMedia */ }
    try { if (root.location && /[?&]cam=0\b/.test(root.location.search)) E.off = true; } catch (e) { /* nada */ }
    const AMP = () => E.reducido ? .35 : 1;

    // utilidades que ve el adaptador
    const u = {
      golpe(zoom, roll, parar) { const a = AMP(); E.zp = Math.min(.16, E.zp + zoom * a); E.rp = clamp(E.rp + roll * a, -.03, .03); if (parar && !E.reducido) E.stop = Math.max(E.stop, parar); },
      luz(x, y, r, col, vida, fuerza, flare) { if (E.luces.length > 20) E.luces.shift(); E.luces.push({ x, y, r, col, t: vida, vida, a: fuerza == null ? 1 : fuerza, flare: !!flare }); },
      empuje(dx, dy) { E.kx = clamp(E.kx + dx * AMP(), -8, 8); E.oy = clamp(E.oy + dy * AMP(), -14, 14); },
      daño() { E.hurt = 1; }
    };

    function estado(ext) {
      const S = ext || cfg.estado(); if (!S) return null;
      if (E.S !== S) { E.S = S; E.prev = {}; E.luces.length = 0; E.zp = E.rp = E.stop = E.hurt = E.kx = E.oy = E.fin = E.bars = E.speed = 0; E.z = BASE; E.t0 = 0; E.intro = 1; }
      return S;
    }
    const mapa = (x, y) => [E.fx + (x - E.fx) * E.Z, E.fy + (y - E.fy) * E.Z];

    function antes(cx, ext) {
      if (E.off || !cx) return;
      const S = estado(ext); if (!S) return;
      try {
        const ahora = performance.now(); let dt = E.t0 ? (ahora - E.t0) / 1000 : 1 / 60; E.t0 = ahora; dt = clamp(dt, .001, .1);
        E.avg = E.avg * .94 + dt * 1000 * .06; E.lento = E.avg > 26 ? E.lento + 1 : 0; if (E.lento > 90) E.lite = true;
        E.stop = Math.max(0, E.stop - dt);
        const par = E.par = { speed: 0, bars: 0, zoom: 0, roll: 0, fin: 0, latido: false, hx: W / 2, hy: H / 2 };
        if (!cfg.pausado(S)) cfg.leer(S, dt, u, par, E);
        const a = AMP();
        E.intro = Math.max(0, E.intro - dt / 1.5); E.hurt = Math.max(0, E.hurt - dt * 2.5);
        E.speed = lerp(E.speed, par.speed, clamp(dt * 6, 0, 1)); E.bars = lerp(E.bars, par.bars, clamp(dt * 3, 0, 1)); E.fin = lerp(E.fin, par.fin, clamp(dt * 1.6, 0, 1));
        E.latido = par.latido ? E.latido + dt : Math.max(0, E.latido - dt * 2);
        E.zp *= Math.pow(.0016, dt); E.rp *= Math.pow(.004, dt); E.kx *= Math.pow(.002, dt); E.oy *= Math.pow(.003, dt);
        const zObj = BASE + par.zoom * a + .15 * E.intro * E.intro * a + .03 * E.speed * a + .06 * E.fin * a;
        E.z = lerp(E.z, Math.max(BASE, zObj), clamp(dt * 6, 0, 1));
        const Z = E.Z = clamp(E.z + E.zp, BASE, ZMAX);
        const rObj = par.roll * a + E.intro * E.intro * .01 * a;
        E.roll = lerp(E.roll, rObj, clamp(dt * 5, 0, 1));
        const R = E.reducido ? 0 : clamp(E.roll + E.rp, -ROLL, ROLL);
        E.hx = par.hx; E.hy = par.hy;
        const fxObj = clamp(lerp(W / 2, par.hx, .5), W * .22, W * .78), fyObj = clamp(lerp(H / 2, par.hy, .45), H * .27, H * .73);
        E.fx = lerp(E.fx, fxObj, clamp(dt * 7, 0, 1)); E.fy = lerp(E.fy, fyObj, clamp(dt * 7, 0, 1));
        cx.translate(E.fx, E.fy); if (R) cx.rotate(R); cx.scale(Z, Z); cx.translate(-E.fx + E.kx, -E.fy + E.oy * .4);
      } catch (e) { E.off = true; if (root.console) console.warn('NCam desactivada:', e); }
    }

    function halo(cx, x, y, r, col, a) {
      const g = cx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
      cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    function encima(cx, ext) {
      if (E.off || !cx) return;
      const S = estado(ext); if (!S) return;
      try {
        const a = AMP(), dt = 1 / 60, big = Math.max(W, H), Z = E.Z;
        // luces aditivas (en pantalla, mapeadas con el zoom actual)
        cx.save(); cx.globalCompositeOperation = 'lighter';
        const [hx, hy] = mapa(E.hx, E.hy), col = E.hurt > .1 ? [255, 90, 90] : E.speed > .3 ? [130, 225, 255] : [255, 195, 120];
        halo(cx, hx, hy, big * .17 * Z, col, (.05 + .1 * E.speed + .1 * E.hurt + .1 * E.fin) * a);
        for (let i = E.luces.length - 1; i >= 0; i--) {
          const l = E.luces[i]; l.t -= dt; if (l.t <= 0) { E.luces.splice(i, 1); continue; }
          const k = l.t / l.vida, p = mapa(l.x, l.y); halo(cx, p[0], p[1], l.r * Z * (1.25 - .25 * k), l.col, l.a * k * k * .8 * a);
          if (l.flare && !E.lite) { cx.save(); cx.translate(p[0], p[1]); cx.scale(4.2, .1); halo(cx, 0, 0, l.r * Z, l.col, Math.min(1, l.a * k * a)); cx.restore(); }
        }
        cx.restore();
        // líneas de velocidad radiales
        if (E.speed > .08 && !E.lite && !E.reducido) {
          cx.save(); cx.strokeStyle = 'rgba(200,240,255,' + (.3 * E.speed) + ')'; cx.lineWidth = 2; cx.beginPath();
          for (let i = 0; i < 16; i++) { const an = (i / 16) * 6.2832 + (S.t || 0) * .25, r0 = big * .3 + (i * 37 % 80), r1 = r0 + 110 * E.speed; cx.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0 * .8); cx.lineTo(hx + Math.cos(an) * r1, hy + Math.sin(an) * r1 * .8); }
          cx.stroke(); cx.restore();
        }
        // viñeta que late (1 vida / caída) y bordes rojos al recibir daño
        if (E.latido > 0) { const p = .5 + .5 * Math.sin(E.latido * 7), g = cx.createRadialGradient(W / 2, H / 2, big * .3, W / 2, H / 2, big * .75); g.addColorStop(0, 'rgba(120,0,20,0)'); g.addColorStop(1, 'rgba(140,0,30,' + (.12 + .14 * p) * a + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
        if (E.hurt > .02) { const g = cx.createRadialGradient(W / 2, H / 2, big * .25, W / 2, H / 2, big * .7); g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, 'rgba(255,40,40,' + (.4 * E.hurt * a) + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
        // barras de cine (jefe)
        if (E.bars > .02) { const b = Math.min(H * .04, 26) * E.bars * a; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, b); cx.fillRect(0, H - b, W, b); }
      } catch (e) { E.off = true; }
    }

    return { antes, encima, escala: () => (!E.off && E.stop > 0) ? .08 : 1, golpe: u.golpe, luz: u.luz, _estado: () => E, _apagar: () => { E.off = true; }, _encender: () => { E.off = false; E.S = null; E.lite = false; E.lento = 0; } };
  }

  /* ======================= Nivel 2 · desierto (960×540, carriles + compuertas de preguntas) ======================= */
  const n2 = motor({
    W: 960, H: 540, base: 1.04, roll: .016,
    estado: () => root.Nivel2 && root.Nivel2._estado && root.Nivel2._estado(),
    pausado: S => !!S.pausa,
    leer(S, dt, u, par, E) {
      const p = E.prev, hx = 250, hy = 338 + ((S.ly == null ? 1 : S.ly) - 1) * 70 - (S.z || 0) - 60; par.hx = hx; par.hy = hy;
      if (p.aci != null) {
        if (S.aci > p.aci) { const r = Math.min(S.racha || 0, 6); u.golpe(.05 + r * .008, 0, 0); u.luz(hx + 60, hy, 260, [255, 214, 90], .45, 1, true); if (r >= 3) u.luz(hx, hy, 330, [255, 140, 200], .5, .9); }
        if (S.err > p.err) { u.golpe(.02, rnd() * .006, 0); u.luz(hx, hy, 180, [255, 160, 90], .25, .6); }
        if (S.vidas < p.vidas) { u.golpe(.06, rnd() * .01, .1); u.daño(); u.empuje(-6, 4); u.luz(hx, hy, 300, [255, 70, 70], .3, 1); }
        if (S.jefe && p.jg != null && S.jefe.golpe > p.jg + .5) { u.golpe(.08, 0, .08); u.luz(hx + 260, hy - 40, 340, [255, 255, 255], .35, 1, true); }
        if (S.escudo && !p.escudo) u.luz(hx, hy, 280, [110, 214, 255], .5, 1, true);
        if (S.lane !== p.lane) { const d = Math.sign(S.lane - p.lane); u.golpe(.012, d * .008, 0); u.empuje(0, d * 5); }
        if ((S.z || 0) > 8 && p.z <= 8) u.golpe(.012, 0, 0);
        if (p.z > 15 && (S.z || 0) <= 1) { u.golpe(.02, 0, 0); u.empuje(0, 8); }
      }
      par.speed = clamp(S.boost || 0, 0, 1) * .8 + (S.vuelo ? .25 : 0);
      par.bars = S.jefe ? 1 : 0; par.zoom = (S.caido > 0 ? .03 : 0) + (S.jefe ? .01 : 0);
      par.roll = (S.vuelo ? Math.sin((S.t || 0) * 1.5) * .006 : 0);
      par.fin = S.est === 'gano' ? 1 : 0; par.latido = (S.vidas === 1 && !(S.caido > 0) && S.est === 'play') || S.caido > 0;
      p.aci = S.aci; p.err = S.err; p.vidas = S.vidas; p.escudo = !!S.escudo; p.lane = S.lane; p.z = S.z || 0; p.jg = S.jefe ? S.jefe.golpe : null;
    }
  });

  /* ======================= Nivel 3 · corredor (540×960, vertical, perspectiva propia) ======================= */
  const n3 = motor({
    W: 540, H: 960, base: 1.03, roll: .01,
    estado: () => null,   // el Nivel 3 pasa su estado S en cada gancho: antes(ctx, S)
    pausado: S => !!S.pausa || !S.corriendo,
    leer(S, dt, u, par, E) {
      const p = E.prev, hx = 270 + (S.px - 1) * 150 + (S.escX || 0), hy = 800 - (S.jh || 0) - 120; par.hx = hx; par.hy = hy;
      if (p.aciertos != null) {
        if (S.aciertos > p.aciertos) { u.golpe(.045 + Math.min(S.racha || 0, 6) * .006, 0, 0); u.luz(hx, hy, 230, [255, 214, 90], .45, 1, true); }
        if (S.errores > p.errores) { u.golpe(.02, rnd() * .005, 0); u.luz(hx, hy, 160, [255, 160, 90], .25, .6); }
        if (S.vidas < p.vidas) { u.golpe(.06, rnd() * .01, .1); u.daño(); u.empuje(rnd() * 6, 4); u.luz(hx, hy, 280, [255, 70, 70], .3, 1); }
        if (S.mult > p.mult) u.luz(hx, hy, 250, [255, 179, 71], .4, .9, true);
        if (S.dash > 0 && !(p.dash > 0)) { u.golpe(.07, 0, 0); u.luz(hx, hy, 260, [120, 220, 255], .35, 1, true); }
        if (S.escudo > 0 && !(p.escudo > 0)) u.luz(hx, hy, 260, [110, 214, 255], .5, 1, true);
        if (S.iman > 0 && !(p.iman > 0)) u.luz(hx, hy, 260, [255, 120, 220], .5, .9);
        if ((S.jh || 0) > (S.base || 0) + 5 && p.jh <= p.base + 5 && !(S.vuelo > 0)) u.golpe(.015, 0, 0);
        if (p.jh > 20 && (S.jh || 0) <= (S.base || 0) + 1 && !(S.vuelo > 0)) { u.golpe(.025, 0, 0); u.empuje(0, 8); }
        if (S.jefeFlash > (p.jf || 0) + .5) { u.golpe(.09, 0, .08); u.luz(270, 420, 340, [200, 160, 255], .4, 1, true); }
        if (S.px !== p.px && Math.abs(S.px - p.px) >= 1) u.empuje(0, 0);
      }
      par.speed = (S.dash > 0 ? 1 : 0) * .9 + (S.vuelo > 0 ? .4 : 0);
      par.bars = (S.jefeVis && !S.fin) ? 1 : 0;
      par.zoom = (S.slide > 0 ? .015 : 0) + (S.vuelo > 0 ? .02 : 0) + ((S.plaza && !S.fin) ? .02 : 0) + (S.cae > 0 ? .03 : 0);
      par.roll = (S.vuelo > 0 ? Math.sin((S.t || 0) * 2) * .006 : 0);
      par.fin = (S.celeb != null || S.fin) ? 1 : 0; par.latido = S.vidas === 1 && !(S.cae > 0) && !S.fin;
      p.aciertos = S.aciertos; p.errores = S.errores; p.vidas = S.vidas; p.mult = S.mult; p.dash = S.dash; p.escudo = S.escudo; p.iman = S.iman; p.jh = S.jh || 0; p.base = S.base || 0; p.jf = S.jefeFlash || 0; p.px = S.px;
    }
  });

  const api = { motor, n2, n3 };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.NCam = api;
})(typeof window !== 'undefined' ? window : globalThis);
