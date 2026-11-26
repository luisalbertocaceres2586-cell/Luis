/* engine/core/interpolacion.js — dibujar ENTRE pasos de física (NinjaInterp).
   La física corre siempre a 60 pasos por segundo (paso fijo). En pantallas de 90/120 Hz el juego dibujaba solo tras cada paso, o sea a 60 Hz.
   Con esto, en cada cuadro se dibuja la posición intermedia entre el paso anterior y el actual: el movimiento se ve fluido sin tocar la física.
   Uso (ver el bucle de engine/juego-principal.js):
     const I = NinjaInterp.crear();
     I.marcar(lista)           ← justo ANTES de cada paso de física: recuerda x,y previos
     I.aplicar(lista, alpha)   ← justo antes de dibujar: pone x,y interpolados (alpha 0..1 = cuánto avanzó hacia el paso actual)
     I.restaurar()             ← justo después de dibujar: devuelve x,y reales (la física nunca ve valores interpolados)
     I.esc(previo, actual, alpha) ← lo mismo para un número suelto (la cámara)
   Teletransportes (reaparecer, cambio de nivel): si algo se movió más de "salto" px en un paso, no se interpola ese objeto. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else /** @type {any} */ (root).NinjaInterp = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function esc(prev, cur, alpha, salto) {
    if (typeof prev !== 'number' || !isFinite(prev) || !isFinite(cur)) return cur;
    if (Math.abs(cur - prev) > salto) return cur;
    return prev + (cur - prev) * alpha;
  }
  function crear(opt) {
    const salto = (opt && opt.salto) || 160;
    const objs = [], sx = [], sy = [];
    let n = 0;
    return {
      marcar(lista) {
        for (let i = 0; i < lista.length; i++) { const o = lista[i]; if (o && typeof o.x === 'number') { o._px = o.x; o._py = o.y; } }
      },
      aplicar(lista, alpha) {
        if (!(alpha >= 0)) alpha = 0; else if (alpha > 1) alpha = 1;
        n = 0;
        for (let i = 0; i < lista.length; i++) {
          const o = lista[i];
          if (!o || typeof o.x !== 'number' || o._px === undefined) continue;
          objs[n] = o; sx[n] = o.x; sy[n] = o.y; n++;
          o.x = esc(o._px, o.x, alpha, salto); o.y = esc(o._py, o.y, alpha, salto);
        }
      },
      restaurar() { for (let i = 0; i < n; i++) { objs[i].x = sx[i]; objs[i].y = sy[i]; objs[i] = null; } n = 0; },
      esc(prev, cur, alpha) { if (!(alpha >= 0)) alpha = 0; else if (alpha > 1) alpha = 1; return esc(prev, cur, alpha, salto); },
    };
  }
  return { crear, esc };
});
