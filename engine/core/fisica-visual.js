/* Física visual compartida (niveles 1, 2 y 3): da peso a los personajes sin cambiar su física real.
   · estira al subir/caer rápido, aplasta con rebote de resorte al aterrizar, rebote suave al correr, inclinación según la velocidad
   · devuelve eventos «despega» / «aterriza» para que cada nivel ponga su polvo y su sonido
   Convención: vy en px/s con el eje de la pantalla (negativo = sube). Todo se escala con `amp` (0 = nada, 1 = completo). */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function nuevo() { return { t: 0, suelo: true, vyPrev: 0, sq: null, sj: -9, fase: 0, lean: 0 }; }
  // e: { suelo, vy, vyImpacto?, vx, vmax?, vref?, fps? }
  function paso(fx, dt, e) {
    fx.t += dt; let ev = null; const vref = e.vref || 1000;
    if (fx.suelo && !e.suelo && e.vy < -200) { fx.sj = fx.t; fx.sq = null; ev = { tipo: 'despega', f: clamp(-e.vy / vref, 0.2, 1) }; }
    else if (!fx.suelo && e.suelo) { const vi = Math.abs(e.vyImpacto != null ? e.vyImpacto : fx.vyPrev); if (vi > 250) { const f = clamp(vi / vref, 0.25, 1); fx.sq = { t0: fx.t, f }; ev = { tipo: 'aterriza', f }; } }
    fx.suelo = e.suelo; fx.vyPrev = e.vy;
    const vmax = e.vmax || 340, ob = clamp(e.vx / vmax, -1, 1) * (e.suelo ? 1 : 0.5) * 0.08; fx.lean += (ob - fx.lean) * Math.min(1, dt * 12);
    fx.fase += dt * clamp(Math.abs(e.vx) / vmax, 0, 1.2) * (e.fps || 10) / 5;
    return ev;
  }
  // → { sx, sy, rot, oy } para aplicar con el origen en los pies: translate(x, y) · translate(0, oy) · rotate(rot) · scale(sx, sy)
  function transformar(fx, e) {
    let sx = 1, sy = 1, oy = 0; const vref = e.vref || 1000, amp = e.amp == null ? 1 : e.amp;
    if (!e.suelo) { const st = clamp(Math.abs(e.vy) / vref, 0, 1); sy += 0.16 * st; sx -= 0.10 * st; const k = (fx.t - fx.sj) / 0.18; if (k >= 0 && k < 1) { sy += 0.12 * (1 - k); sx -= 0.08 * (1 - k); } }
    else if (Math.abs(e.vx) > (e.vmin || 40)) { const b = Math.abs(Math.sin(fx.fase * Math.PI)); oy = -(e.bob == null ? 3 : e.bob) * b * amp; sy += 0.018 * b; sx -= 0.01 * b; }
    if (fx.sq) { const k = (fx.t - fx.sq.t0) / 0.3; if (k < 1) { const sp = Math.exp(-4.2 * k) * Math.cos(12 * k) * fx.sq.f; sy *= 1 - 0.28 * sp * amp; sx *= 1 + 0.22 * sp * amp; } else fx.sq = null; }
    return { sx: 1 + (sx - 1) * amp, sy: 1 + (sy - 1) * amp, rot: fx.lean * amp, oy };
  }
  root.FisicaVisual = { nuevo, paso, transformar };
})(typeof window !== 'undefined' ? window : globalThis);
