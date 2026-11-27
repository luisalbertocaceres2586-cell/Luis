/* engine/core — CAPA ÚNICA DE BOTONES TÁCTILES (NinjaTouch)
   ───────────────────────────────────────────────────────────────────────────────────────────────────
   Antes cada botón tenía sus propios listeners repartidos en 4 archivos (index.html, mobile-fix, movil-comun, extra) y era un
   blanco duro del tamaño del círculo: un dedo en el hueco entre ◀ y ▶, o un poco fuera, no hacía NADA; el deslizar de ◀ a ▶ era un
   truco con eventos falsos; un toque más corto que un cuadro se perdía; y una tecla podía quedarse pegada.
   Ahora TODA la entrada táctil de los botones pasa por aquí:

   1. Zonas de toque con TOLERANCIA: cada botón tiene un "halo" (+40 % de su radio). Gana el botón más cercano; no hay huecos muertos.
   2. CRUCETA: los botones del grupo "dir" (◀ ▶) forman una sola zona. La dirección la decide la posición horizontal del dedo
      (con histéresis para que no parpadee), así que se puede deslizar de un lado a otro sin levantar el dedo, y tocar el hueco
      entre ambos o por fuera del botón también camina.
   3. MULTITÁCTIL real: cada dedo (pointerId) es independiente; un dedo nuevo en la cruceta reemplaza al anterior.
   4. Toque mínimo (minHold): un toque más corto que un cuadro de juego no se pierde.
   5. SOLTADO SEGURO: pointerup/cancel, touchend sin dedos, blur, ocultar la página, girar el teléfono → se sueltan todas las teclas.
   6. Un toque "reclamado" fuera del botón (el halo) NO llega al lienzo, así no se confunde con un deslizamiento de esquiva.
   7. Los toques sobre menús/pausa/botones normales de la página no se tocan (solo se reclama lo que cae sobre el lienzo o un control).
   Depuración visual: añade ?tactil=1 a la URL (dibuja las zonas de toque y los dedos activos).
   Uso: const quitar = NinjaTouch.add(elemento, { id, grupo, minHold, clase, down(info), up(info), move(info) }); */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { const g = /** @type {any} */ (root); g.NinjaTouchCore = api.core; g.NinjaTouch = api.touch; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  /* ═════════════ NÚCLEO PURO (sin DOM: se prueba con node) ═════════════
     Un control es { id, cx, cy, r, grupo? } en píxeles de pantalla. */
  const TOL = 0.4;            // halo alrededor de cada botón, como fracción de su radio
  const HIST = 0.2;           // histéresis de la cruceta, como fracción del radio

  const dist = (c, x, y) => Math.hypot(x - c.cx, y - c.cy);
  const grupos = lista => { const g = {}; for (const c of lista) if (c.grupo) (g[c.grupo] = g[c.grupo] || []).push(c); return g; };

  // Rectángulo de la zona de un grupo: cubre todos sus botones (incluido el hueco entre ellos) más el halo (la tolerancia del grupo).
  // Si la zona ya queda cerca de un borde de la pantalla se extiende hasta él: el pulgar que busca "volver" y se pasa hacia el borde
  // (donde el sistema suele quitar el dedo), o se desliza hacia abajo, sigue contando. lim = { w, h } (tamaño de la pantalla).
  function zonaGrupo(miembros, tol, lim) {
    const rMax = Math.max.apply(null, miembros.map(c => c.r));
    const m = Math.max.apply(null, miembros.map(c => (c.tol != null ? c.tol : (tol == null ? TOL : tol)) * c.r));
    const x0 = Math.min.apply(null, miembros.map(c => c.cx - c.r)) - m, x1 = Math.max.apply(null, miembros.map(c => c.cx + c.r)) + m;
    const y0 = Math.min.apply(null, miembros.map(c => c.cy - c.r)) - m, y1 = Math.max.apply(null, miembros.map(c => c.cy + c.r)) + m;
    const e = Math.max(m * 3, rMax * 1.2);
    return {
      x0: x0 <= e ? -Infinity : x0, x1: lim && lim.w && lim.w - x1 <= e ? Infinity : x1,
      y0, y1: lim && lim.h && lim.h - y1 <= e ? Infinity : y1
    };
  }
  const dentro = (z, x, y) => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1;

  // Dirección dentro de un grupo: el botón cuyo centro (en x) está más cerca del dedo; si el dedo está casi a medio camino
  // se mantiene el anterior (histéresis) para evitar el parpadeo ◀▶◀▶.
  function dirGrupo(miembros, x, previoId) {
    let mejor = null, md = Infinity, dPrev = null;
    for (const c of miembros) { const d = Math.abs(x - c.cx); if (d < md) { md = d; mejor = c; } if (c.id === previoId) dPrev = d; }
    if (previoId != null && dPrev != null && mejor.id !== previoId) {
      const r = Math.max.apply(null, miembros.map(c => c.r));
      if (dPrev - md < HIST * r) return previoId;
    }
    return mejor.id;
  }

  // ¿Qué control recibe un toque nuevo en (x, y)? → { id, grupo } o null (el toque no es de ningún botón).
  //  1) toque directo dentro del círculo: gana el más cercano (normalizado por su radio)
  //  2) zona de un grupo (cruceta): incluye el hueco y el halo → dirección por posición
  //  3) halo de un botón suelto: gana el más cercano
  function elegir(lista, x, y, tol, deslizar, lim) {
    tol = tol == null ? TOL : tol; deslizar = deslizar !== false;
    let mejor = null, md = Infinity;
    for (const c of lista) { const d = dist(c, x, y) / c.r; if (d <= 1 && d < md) { md = d; mejor = c; } }
    if (mejor) return { id: (mejor.grupo && deslizar) ? dirGrupo(grupos(lista)[mejor.grupo], x, null) : mejor.id, grupo: mejor.grupo || null };
    if (deslizar) {
      const g = grupos(lista);
      for (const nombre in g) if (g[nombre].length >= 2 && dentro(zonaGrupo(g[nombre], tol, lim), x, y)) return { id: dirGrupo(g[nombre], x, null), grupo: nombre };
    }
    mejor = null; md = Infinity;
    for (const c of lista) { const t = tol === 0 ? 0 : (c.tol != null ? c.tol : tol), d = dist(c, x, y) / c.r; if (d <= 1 + t && d < md) { md = d; mejor = c; } }
    return mejor ? { id: mejor.id, grupo: mejor.grupo || null } : null;
  }

  const core = { TOL, HIST, dist, zonaGrupo, dentro, dirGrupo, elegir, grupos };

  /* ═════════════ ROUTER (DOM) ═════════════ */
  const touch = (function () {
    if (!root || !root.document) return null;
    const doc = root.document, ahora = () => (root.performance && performance.now()) || Date.now();
    const ctls = new Map();      // id → control registrado
    const claims = new Map();    // pointerId → { id, grupo, geo }
    let edicion = false, seq = 0;

    function add(el, o) {
      o = o || {};
      const id = o.id || ('c' + (++seq));
      const c = { id, el, grupo: o.grupo || null, tol: o.tol, down: o.down, up: o.up, move: o.move, minHold: o.minHold || 0, clase: o.clase || 'down', _n: 0, _tok: 0, _desde: 0 };
      ctls.set(id, c);
      return () => { if (ctls.get(id) === c) ctls.delete(id); };
    }

    // Geometría viva de los controles visibles (se descartan los que ya no están en la página).
    function geometria() {
      const out = [];
      for (const c of ctls.values()) {
        if (!c.el.isConnected) { ctls.delete(c.id); continue; }
        const r = c.el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) continue;
        out.push({ id: c.id, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2, grupo: c.grupo, tol: c.tol });
      }
      return out;
    }
    const dentroDeControl = t => { if (!t) return false; for (const c of ctls.values()) if (c.el === t || c.el.contains(t)) return true; return false; };
    // Un toque fuera de los botones solo se reclama si cae sobre el lienzo o el fondo (nunca sobre un menú/pausa/botón de la página).
    const neutro = t => !!t && (t.tagName === 'CANVAS' || t === doc.body || t === doc.documentElement || (t.hasAttribute && t.hasAttribute('data-tactil-neutro')));

    function pulsar(id, info) {
      const c = ctls.get(id); if (!c) return;
      c._tok++; c._n++;
      if (c._n === 1) { c._desde = ahora(); c.el.classList.add(c.clase); try { c.down && c.down(info); } catch (e) { console.error(e); } }
    }
    function soltar(id, info, inmediato) {
      const c = ctls.get(id); if (!c || c._n === 0) return;
      if (--c._n > 0) return;
      c.el.classList.remove(c.clase);
      const falta = inmediato ? 0 : Math.max(0, c.minHold - (ahora() - c._desde)), tok = ++c._tok;
      const fin = () => { if (c._tok !== tok || c._n > 0) return; try { c.up && c.up(info); } catch (e) { console.error(e); } };
      falta > 0 ? setTimeout(fin, falta) : fin();
    }
    function soltarClaim(pid, info, inmediato) { const cl = claims.get(pid); if (!cl) return; claims.delete(pid); soltar(cl.id, info, inmediato); }
    function liberarTodo(inmediato) { for (const pid of Array.from(claims.keys())) soltarClaim(pid, null, inmediato); }

    const info = e => ({ x: e.clientX, y: e.clientY, pointerId: e.pointerId, e });

    function alBajar(e) {
      if (!ctls.size || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const directo = dentroDeControl(e.target);
      if (!directo && !neutro(e.target)) return;                         // menús, pausa, botones de la página: no se tocan
      const geo = geometria(); if (!geo.length) return;
      const sel = core.elegir(geo, e.clientX, e.clientY, edicion ? 0 : TOL, !edicion, { w: root.innerWidth, h: root.innerHeight });
      if (!sel) return;
      if (sel.grupo) for (const [pid, cl] of claims) if (cl.grupo === sel.grupo && pid !== e.pointerId) soltarClaim(pid, null, true);   // el dedo nuevo manda
      if (claims.has(e.pointerId)) soltarClaim(e.pointerId, null, true);
      claims.set(e.pointerId, { id: sel.id, grupo: sel.grupo, geo: sel.grupo ? geo.filter(c => c.grupo === sel.grupo) : null });
      pulsar(sel.id, info(e));
      e.preventDefault();
      if (!directo) {                                                     // toque en el halo: que no llegue al lienzo (esquiva por deslizamiento)
        e.stopPropagation();
        try { root.NinjaHaptics && root.NinjaHaptics.tap(); } catch (_) { }
      }
    }
    function alMover(e) {
      const cl = claims.get(e.pointerId); if (!cl) return;
      if (cl.grupo && !edicion && cl.geo) {
        const nuevo = core.dirGrupo(cl.geo, e.clientX, cl.id);
        if (nuevo !== cl.id) { const viejo = cl.id; cl.id = nuevo; soltar(viejo, info(e), true); pulsar(nuevo, info(e)); return; }   // soltar uno y pulsar el otro, sin hueco
      }
      const c = ctls.get(cl.id); if (c && c.move) { try { c.move(info(e)); } catch (er) { console.error(er); } }
    }
    function alSoltar(e) { if (claims.has(e.pointerId)) soltarClaim(e.pointerId, info(e)); }

    const opt = { capture: true, passive: false };
    root.addEventListener('pointerdown', alBajar, opt);
    root.addEventListener('pointermove', alMover, opt);
    root.addEventListener('pointerup', alSoltar, opt);
    root.addEventListener('pointercancel', alSoltar, opt);
    // Redes de seguridad: si se pierde un pointerup (gesto del sistema, notificación, cambio de app...) nada se queda pegado.
    ['touchend', 'touchcancel'].forEach(t => doc.addEventListener(t, e => { if (e.touches && e.touches.length === 0) liberarTodo(); }, { capture: true, passive: true }));
    root.addEventListener('blur', () => liberarTodo(true));
    root.addEventListener('pagehide', () => liberarTodo(true));
    root.addEventListener('orientationchange', () => liberarTodo(true));
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) liberarTodo(true); });
    root.addEventListener('contextmenu', e => { if (claims.size || dentroDeControl(e.target)) e.preventDefault(); }, true);   // sin menú al mantener pulsado

    /* ── Depuración visual (?tactil=1) ── */
    let dbg = null, dbgRaf = 0;
    function dibujarDbg() {
      if (!dbg) return;
      const geo = geometria(), g = grupos(geo); let h = '';
      for (const c of geo) {
        const act = Array.from(claims.values()).some(k => k.id === c.id);
        h += '<div style="position:fixed;left:' + (c.cx - c.r * (1 + (c.tol != null ? c.tol : TOL))) + 'px;top:' + (c.cy - c.r * (1 + (c.tol != null ? c.tol : TOL))) + 'px;width:' + (2 * c.r * (1 + (c.tol != null ? c.tol : TOL))) + 'px;height:' + (2 * c.r * (1 + (c.tol != null ? c.tol : TOL))) + 'px;border:1px dashed #0ff;border-radius:50%"></div>' +
          '<div style="position:fixed;left:' + (c.cx - c.r) + 'px;top:' + (c.cy - c.r) + 'px;width:' + (2 * c.r) + 'px;height:' + (2 * c.r) + 'px;border:2px solid ' + (act ? '#ff0' : '#0f8') + ';border-radius:50%;background:' + (act ? '#ff03' : 'transparent') + '"></div>';
      }
      for (const n in g) if (g[n].length >= 2) { const z = zonaGrupo(g[n], TOL, { w: root.innerWidth, h: root.innerHeight }), zx0 = isFinite(z.x0) ? z.x0 : 0, zx1 = isFinite(z.x1) ? z.x1 : root.innerWidth, zy1 = isFinite(z.y1) ? z.y1 : root.innerHeight; h += '<div style="position:fixed;left:' + zx0 + 'px;top:' + z.y0 + 'px;width:' + (zx1 - zx0) + 'px;height:' + (zy1 - z.y0) + 'px;border:1px dashed #f0f;background:#f0f1"></div>'; }
      dbg.innerHTML = h + '<div style="position:fixed;left:6px;top:6px;font:11px monospace;color:#0f8;background:#000a;padding:2px 5px">tactil · dedos: ' + claims.size + '</div>';
      dbgRaf = requestAnimationFrame(dibujarDbg);
    }
    function debug(on) {
      if (on && !dbg) { dbg = doc.createElement('div'); dbg.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none'; doc.body.appendChild(dbg); dibujarDbg(); }
      else if (!on && dbg) { cancelAnimationFrame(dbgRaf); dbg.remove(); dbg = null; }
    }
    if (/[?&]tactil=1/.test(root.location ? root.location.search : '')) { if (doc.body) debug(true); else doc.addEventListener('DOMContentLoaded', () => debug(true)); }

    return {
      add, liberarTodo, debug,
      edicion(v) { edicion = !!v; if (edicion) liberarTodo(true); },        // en modo MOVER no hay halos ni cruceta: cada botón se arrastra solo
      estado() { return { dedos: claims.size, activos: Array.from(claims.values()).map(c => c.id) }; },
      geometria
    };
  })();

  return { core, touch };
});
