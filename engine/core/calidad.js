/* engine/core/calidad.js — CALIDAD AUTOMÁTICA (NinjaCalidad). Un solo controlador para todo el juego.
   Antes había cuatro controles sueltos que no se hablaban (_perfMode, fx26, E.lite del nivel 1, S.lite del nivel 3), y fx26 medía UNA vez
   y se quedaba fijo para siempre. Ahora se mide de forma continua y se baja o sube de nivel sola:
     alta  → todo (partículas 100 %, brillos 100 %)       media → partículas 60 %, brillos 50 %, sin rayos ni primer plano
     baja  → partículas 30 %, sin brillos ni confeti, CSS en modo "fx-low", sin interpolación
   Reglas (anti-parpadeo):  baja de nivel tras 3 s seguidos por debajo de ~45 FPS;  sube tras 25 s seguidos por encima de ~56 FPS;
   si subió y volvió a bajar en menos de 60 s, la próxima subida espera el doble (hasta ×4). Lo que baja se recuerda 3 días.
   API:  NinjaCalidad.nivel ('alta'|'media'|'baja') · .fx (0.3–1: multiplicador de partículas) · .sombra (0–1: multiplicador de brillos)
         .hz (frecuencia real de la pantalla) · .interp() (true si conviene dibujar entre pasos de física, solo ≥ 85 Hz) · .on(fn) · .forzar('alta'|'media'|'baja'|'auto') · .info()
   Forzar:  ?calidad=alta|media|baja|auto  (o ?fx=low|high de antes)  ·  ?interp=0 apaga la interpolación.
   El cerebro (crear) no toca el DOM: se prueba con node (tests/calidad.test.js). */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { const g = /** @type {any} */ (root); g.NinjaCalidadCore = api.core; g.NinjaCalidad = api.calidad; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const NIVELES = ['alta', 'media', 'baja'];
  const FX = { alta: 1, media: 0.6, baja: 0.3 };
  const SOMBRA = { alta: 1, media: 0.5, baja: 0 };
  const num = (a, b) => a - b;
  const percentil = (arr, p) => { const s = arr.slice().sort(num); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
  // umbrales sesgados hacia abajo: un 60 Hz con jitter (cuadros de 14,6 ms) NO debe parecer de 75 Hz
  function cuantizar(hz) {
    const lim = [[45, 30], [72, 60], [82, 75], [105, 90], [130, 120], [155, 144], [200, 165]];
    for (const [tope, r] of lim) if (hz <= tope) return r;
    return 240;
  }

  /* ═════════════ CEREBRO PURO ═════════════
     muestra(dtMs, tMs) se llama en cada cuadro; devuelve null o { de, a } cuando cambia de nivel. */
  function crear(o) {
    o = o || {};
    let idx = Math.max(0, NIVELES.indexOf(o.inicial || 'alta'));
    let fijo = !!o.fijo;
    const objetivo = Math.min(o.objetivo || 60, 60);
    const buf = [], bufT = [], bufHz = [];   // buf/bufT: cuadros recientes (ventana de 1,5 s); bufHz: para la frecuencia de pantalla
    let ultEval = null, malas = 0, buenas = 0, ultCambio = -1e9, ultSubida = -1e9, penal = 1;

    function evaluar(t) {
      const w = [];
      for (let i = buf.length - 1; i >= 0 && bufT[i] >= t - 1500; i--) w.push(buf[i]);   // solo lo último 1,5 s: reacciona rápido
      if (w.length < 20) return null;
      const fps = 1000 / percentil(w, 0.5), p95 = percentil(w, 0.95);
      const mala = fps < objetivo * 0.75 || p95 > 70;
      const buena = fps >= objetivo * 0.93 && p95 < 40;
      if (mala) { malas++; buenas = 0; } else if (buena) { buenas++; malas = 0; } else { malas = 0; }
      if (t - ultCambio > 90000) penal = 1;
      if (malas >= 3 && idx < NIVELES.length - 1 && t - ultCambio >= 3500) {
        const de = NIVELES[idx]; idx++; malas = buenas = 0;
        if (t - ultSubida < 60000) penal = Math.min(penal * 2, 4);
        ultCambio = t; buf.length = bufT.length = 0; return { de, a: NIVELES[idx] };
      }
      if (buenas >= 25 * penal && idx > 0 && t - ultCambio >= 25000) {
        const de = NIVELES[idx]; idx--; malas = buenas = 0; ultCambio = ultSubida = t; buf.length = bufT.length = 0; return { de, a: NIVELES[idx] };
      }
      return null;
    }
    return {
      muestra(dt, t) {
        if (!(dt > 0) || dt > 250) return null;                 // pausa, pestaña oculta o cuadro congelado: no cuenta
        buf.push(dt); bufT.push(t); if (buf.length > 240) { buf.shift(); bufT.shift(); }
        bufHz.push(dt); if (bufHz.length > 240) bufHz.shift();
        if (ultEval === null) ultEval = t;
        if (t - ultEval < 1000) return null;
        ultEval = t;
        return fijo ? null : evaluar(t);
      },
      nivel() { return NIVELES[idx]; },
      forzar(n) { if (n === 'auto') { fijo = false; return; } const i = NIVELES.indexOf(n); if (i >= 0) { idx = i; fijo = true; buf.length = bufT.length = 0; } },
      auto() { fijo = false; },
      esFijo() { return fijo; },
      /* frecuencia de la pantalla: con el 20 % de los cuadros más rápidos (robusto ante cuadros lentos sueltos) */
      hz() { return bufHz.length < 60 ? 60 : cuantizar(1000 / percentil(bufHz, 0.2)); },
      estado() { return { nivel: NIVELES[idx], malas, buenas, penal, fijo }; },
    };
  }

  /* ═════════════ CONEXIÓN CON EL NAVEGADOR ═════════════ */
  const core = { crear, NIVELES, FX, SOMBRA, cuantizar };
  let calidad = null;
  const doc = root && root.document;
  if (doc && typeof root.requestAnimationFrame === 'function') {
    const LS = 'ninja_calidad_v2', LSF = 'ninja_calidad_fija', DIAS3 = 3 * 864e5;
    const qs = (root.location && root.location.search) || '';
    const leer = (k) => { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    const guardar = (k, v) => { try { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
    const nav = root.navigator || {}, con = nav.connection || {};
    const debil = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || (nav.deviceMemory && nav.deviceMemory <= 2) || con.saveData === true;

    // nivel inicial: ?calidad= (o el ?fx= de antes) > fijo guardado > lo que bajó hace poco > equipo modesto → media > alta
    let q = (/[?&]calidad=(alta|media|baja|auto)/.exec(qs) || [])[1];
    const fx = (/[?&]fx=(low|high|auto)/.exec(qs) || [])[1];
    if (!q && fx) q = fx === 'low' ? 'baja' : fx === 'high' ? 'alta' : 'auto';
    if (q && q !== 'auto') guardar(LSF, q); else if (q === 'auto') guardar(LSF, null);
    const fijoGuardado = (leer(LSF) || null);
    const rec = leer(LS);
    const recordado = rec && NIVELES.indexOf(rec.n) > 0 && Date.now() - rec.t < DIAS3 ? rec.n : null;
    const inicial = fijoGuardado || recordado || (debil ? 'media' : 'alta');
    const cerebro = crear({ inicial: inicial, fijo: !!fijoGuardado });
    const oyentes = [];
    const H = doc.documentElement;
    const noInterp = /[?&]interp=0/.test(qs);

    calidad = {
      nivel: cerebro.nivel(), fx: FX[cerebro.nivel()], sombra: SOMBRA[cerebro.nivel()], hz: 60,
      interp() { return !noInterp && this.hz >= 85 && this.nivel !== 'baja'; },
      on(fn) { oyentes.push(fn); try { fn(this); } catch (e) { /* un oyente no rompe a los demás */ } },
      forzar(n) {
        if (n === 'auto') { cerebro.auto(); guardar(LSF, null); return this.nivel; }
        if (NIVELES.indexOf(n) < 0) return this.nivel;
        cerebro.forzar(n); guardar(LSF, n); aplicar(); return this.nivel;
      },
      info() { return Object.assign({ hz: this.hz, interp: this.interp(), inicial: inicial }, cerebro.estado()); },
    };
    function aplicar() {
      const n = cerebro.nivel();
      calidad.nivel = n; calidad.fx = FX[n]; calidad.sombra = SOMBRA[n];
      H.setAttribute('data-calidad', n);
      H.classList.toggle('fx-low', n === 'baja');           // compatibilidad con los CSS *-2026
      for (const f of oyentes.slice()) { try { f(calidad); } catch (e) { /* ignorar */ } }
    }
    aplicar();

    let ult = 0;
    function cuadro(t) {
      if (ult && !doc.hidden) {
        const c = cerebro.muestra(t - ult, t);
        calidad.hz = cerebro.hz();
        if (c) { guardar(LS, c.a === 'alta' ? null : { n: c.a, t: Date.now() }); aplicar(); try { root.console.info('[calidad] ' + c.de + ' → ' + c.a); } catch (e) { /* sin consola */ } }
      }
      ult = t; root.requestAnimationFrame(cuadro);
    }
    doc.addEventListener('visibilitychange', () => { ult = 0; });
    root.requestAnimationFrame(cuadro);
  }
  return { core, calidad };
});
