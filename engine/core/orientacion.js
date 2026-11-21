/* engine/core — ORIENTACIÓN AUTOMÁTICA (NinjaOrient)
   ───────────────────────────────────────────────────────────────────────────────────────────────────
   Problema que arregla: el juego principal bloquea la pantalla en horizontal (screen.orientation.lock) y el Nivel 3 pide vertical.
   El aviso "GIRA TU TELÉFONO" tapaba todo, el único código que pedía vertical estaba detrás del botón ¡A correr! (tapado), y por
   eso, por más que se girara el teléfono, nunca cambiaba y no se podía empezar. Además la pantalla completa se pedía en
   `pointerdown`, que con el dedo NO cuenta como "gesto del usuario" para el navegador (sí cuentan `pointerup`/`touchend`/`click`).

   Qué hace ahora, en cada página:
   1. NinjaOrient.querer('portrait' | 'landscape'): intenta al instante fijar la orientación; si hace falta un gesto, lo reintenta
      en CADA toque (touchend/pointerup/click/tecla) hasta conseguirlo. Antes de bloquear siempre DESBLOQUEA (adiós bloqueo viejo).
   2. Pide pantalla completa (Chrome/Edge/Samsung solo dejan bloquear la orientación en pantalla completa). Con el bloqueo de
      orientación del sistema ACTIVADO, el navegador gira igualmente: screen.orientation.lock() manda sobre el ajuste del teléfono.
   3. Vigila el giro con 5 señales a la vez (resize, orientationchange, screen.orientation, matchMedia y un reloj de respaldo) y
      avisa con el evento 'ninja-orient' → el aviso de "gira" desaparece solo en cuanto la pantalla queda bien.
   4. Al salir de la página suelta el bloqueo, para que la página siguiente pueda elegir la suya (el bloqueo ya no "se hereda").
   Límite honesto: iPhone/iPad (Safari) NO permite bloquear ni forzar la orientación desde una web; ahí solo se puede pedir al
   usuario que desactive el bloqueo de rotación (Centro de control). Por eso las páginas ofrecen también "Jugar así".
   API: NinjaOrient.querer(modo) · .forzar(modo) · .correcta() · .vertical() · .alCambiar(fn(ok, vertical)) · .estado() */
(function () {
  'use strict';
  const UA = navigator.userAgent || '';
  const iOS = /iP(hone|ad|od)/.test(UA) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  const tactil = iOS || /Android/i.test(UA) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const cbs = [];
  let quiero = null, fijada = false, intentando = false, ultimo = 0, ultimoOk = null, fallos = 0, lastErr = '', aceptaAsi = false;

  const vertical = () => window.innerHeight > window.innerWidth;
  // ¿la pantalla ya está como la quiere esta página? (si "Jugar así" está aceptado, siempre sí)
  const correcta = () => aceptaAsi || !quiero || (quiero === 'portrait') === vertical();
  const api = () => { try { const o = screen.orientation; return o && typeof o.lock === 'function' ? o : null; } catch (e) { return null; } };
  const completa = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  function avisar() {
    const ok = correcta(), v = vertical(); ultimoOk = ok;
    cbs.slice().forEach(f => { try { f(ok, v); } catch (e) { } });
    try { document.dispatchEvent(new CustomEvent('ninja-orient', { detail: { ok, vertical: v } })); } catch (e) { }
  }

  async function pantallaCompleta() {
    if (completa()) return true;
    const el = document.documentElement, rf = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!rf) return false;
    try { const p = rf.call(el, { navigationUI: 'hide' }); if (p && p.then) await p; } catch (e) { lastErr = 'fullscreen: ' + (e && e.name); }
    return completa();
  }

  // Fija la orientación: pantalla completa → desbloquear → bloquear (probando también las variantes -primary).
  async function forzar(modo) {
    modo = modo || quiero;
    if (!modo || !tactil || intentando) return false;
    intentando = true;
    try {
      await pantallaCompleta();
      const o = api(); if (!o) { lastErr = 'sin screen.orientation.lock'; return false; }
      try { o.unlock && o.unlock(); } catch (e) { }
      for (const m of [modo, modo + '-primary']) {
        try { await o.lock(m); fijada = true; fallos = 0; setTimeout(avisar, 200); setTimeout(avisar, 700); return true; }
        catch (e) { lastErr = 'lock ' + m + ': ' + (e && e.name); }
      }
      fallos++; return false;
    } finally { intentando = false; }
  }

  // Cada gesto real del usuario es una oportunidad (el navegador solo concede pantalla completa/bloqueo con gesto).
  function alGesto() {
    if (!quiero || !tactil) return;
    const t = Date.now(); if (t - ultimo < 600) return;
    if (fijada && correcta() && completa()) return;           // ya está todo bien
    ultimo = t; forzar();
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, alGesto, { capture: true, passive: true }));

  // Señales de cambio de orientación (cada navegador manda unas distintas) + reloj de respaldo.
  const pronto = () => setTimeout(avisar, 120);
  window.addEventListener('resize', pronto);
  window.addEventListener('orientationchange', pronto);
  document.addEventListener('fullscreenchange', () => { pronto(); if (quiero && completa()) forzar(); });
  document.addEventListener('webkitfullscreenchange', pronto);
  try { screen.orientation.addEventListener('change', pronto); } catch (e) { }
  try { matchMedia('(orientation: portrait)').addEventListener('change', pronto); } catch (e) { }
  setInterval(() => { if (quiero && ultimoOk !== correcta()) avisar(); }, 500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && quiero) { pronto(); forzar(); } });
  // al salir se suelta el bloqueo: la página siguiente elige el suyo (antes se heredaba y dejaba el Nivel 3 atascado en horizontal)
  window.addEventListener('pagehide', () => { try { const o = api(); o && o.unlock && o.unlock(); } catch (e) { } });

  window.NinjaOrient = {
    tactil, iOS,
    // Esta página quiere 'portrait' o 'landscape'
    querer(modo) { quiero = modo; aceptaAsi = false; fijada = false; avisar(); forzar(modo); },
    forzar, correcta, vertical, completa,
    // "Jugar así": el jugador acepta la orientación actual (el aviso deja de bloquear)
    aceptarAsi(v) { aceptaAsi = v !== false; avisar(); },
    alCambiar(fn) { cbs.push(fn); },
    estado() { return { quiero, vertical: vertical(), correcta: correcta(), fijada, completa: completa(), fallos, ultimoError: lastErr, soportaLock: !!api(), iOS, tactil }; }
  };
})();
