/* Habilidades ninja del Nivel 1 — Fase 1 "Sentirse ninja".
 *
 * Seis habilidades que el jugador desbloquea con pergaminos y ELIGE en qué orden:
 *   💨 Dash          SHIFT (o V / L)   impulso rápido, invulnerable mientras dura. 1 en el aire hasta tocar suelo/pared/rebotar.
 *   🌀 Doble salto   ESPACIO en el aire un segundo salto.
 *   🪂 Planeo        mantén ESPACIO al caer: caes despacio y llegas más lejos.
 *   🧗 Pared         empuja contra una pared de bambú o piedra al caer: te agarras; ESPACIO salta de ella.
 *   ⚔️ Tajo aéreo    en el aire, ↓ + C: tajo hacia abajo; rebotas sobre enemigos y trampas de kunai.
 *   🪝 Gancho        mantén G (o E) cerca de una argolla ◎: te balanceas; ← → impulsan; suelta (o salta) para salir volando.
 *
 * Este archivo trae la lógica y el dibujo. motor.js solo llama a unos ganchos (N1hab.antes, despuesGravedad, pulsar...).
 * La parte "pura" (umbrales, argollas, física de la cuerda) no usa el navegador y se prueba en Node.
 * Las habilidades NO son obligatorias: el nivel se puede terminar sin ninguna; sirven para ir más rápido,
 * alcanzar tesoros (chimeneas de bambú) y tener más control sobre lo que pasa. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.N1hab = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const G = 560;

  const DEFS = [
    { id: 'dash', icono: '💨', nombre: 'DASH NINJA', tecla: 'SHIFT', teclas: ['SHIFT'], desc: 'Te lanzas en línea recta y NADA te puede herir mientras dura. En el aire solo una vez hasta tocar suelo.' },
    { id: 'doble', icono: '🌀', nombre: 'DOBLE SALTO', tecla: '2×ESP', teclas: ['ESPACIO', 'ESPACIO'], desc: 'Un segundo salto en el aire. Se recarga al tocar suelo o pared, o al rebotar.' },
    { id: 'planeo', icono: '🪂', nombre: 'PLANEO', tecla: 'ESP…', teclas: ['ESPACIO (mantener)'], desc: 'Mantén ESPACIO mientras caes: bajas despacio y llegas mucho más lejos.' },
    { id: 'pared', icono: '🧗', nombre: 'AGARRE DE PARED', tecla: '← →', teclas: ['← →', 'ESPACIO'], desc: 'Empuja contra una pared al caer para agarrarte y deslizarte. ESPACIO salta de la pared. ¡Hay tesoros arriba de las chimeneas de bambú!' },
    { id: 'tajoAereo', icono: '⚔️', nombre: 'TAJO AÉREO', tecla: '↓+C', teclas: ['↓', 'C'], desc: 'En el aire, mantén ↓ y pulsa C: tajo hacia abajo. ¡Rebotas sobre enemigos y trampas de kunai!' },
    { id: 'gancho', icono: '🪝', nombre: 'GANCHO', tecla: 'G', teclas: ['G (mantener)'], desc: 'Mantén G cerca de una argolla ◎ y balancéate. ← → te impulsan; suelta o salta para salir volando.' }
  ];
  // pergaminos acumulados en la partida para ganar la 1.ª, 2.ª, 3.ª... habilidad (cada nivel trae ~120-150 pergaminos)
  const UMBRALES = [8, 26, 44, 62, 80, 98];
  const P = {
    dashT: .16, dashV: 1020, dashCd: .5, invExtra: .12,
    saltoDoble: -830, planeoVy: 150, planeoTope: 430, paredVy: 130, paredSaltoVy: -870, paredSaltoVx: 440, bloqueoPared: .2, graciaPared: .14,
    ganchoRango: 560, ganchoMin: 140, ganchoVmax: 1150, bombeo: 1500, pogoVy: -880
  };
  const DASH_KEYS = ['ShiftLeft', 'ShiftRight', 'KeyV', 'KeyL'], GANCHO_KEYS = ['KeyG', 'KeyE'];

  // =================== parte pura (se prueba en Node) ===================
  const umbral = n => (n < UMBRALES.length ? UMBRALES[n] : Infinity);
  const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  /* Argollas del gancho de un nivel: una en medio de cada hueco ancho y "ramas" cada ~1100 px.
   * Nunca dentro de la arena del jefe, de las emboscadas ni de las puertas de acertijo (para no poder esquivar un reto). */
  function anclas(N) {
    const veto = [];
    (N.elem || []).forEach(t => { if (typeof t.x0 !== 'number') return; if (t.t === 'jefe') veto.push([t.x0 - 300, t.x1 + 300]); else if (t.t === 'emb') veto.push([t.x0 - 150, t.x1 + 150]); });
    (N.est || []).forEach(e => veto.push([e.x0 - 120, e.x0 + (e.ancho || 0) + 120]));
    const fin = N.meta ? N.meta.x : 1e9, out = [];
    const poner = (x, y, tipo) => { if (x < 300 || x > fin - 300 || veto.some(v => x >= v[0] && x <= v[1]) || out.some(a => Math.abs(a.x - x) < 380)) return; out.push({ x: Math.round(x), y, tipo }); };
    (N.gaps || []).forEach((g, i) => { if (g.x1 - g.x0 >= 220) poner((g.x0 + g.x1) / 2, G - 300 - Math.round(hash(i) * 50), 'hueco'); });
    for (let x = 900, i = 0; x < fin - 400; x += 1050 + Math.round(hash(i + 50) * 500), i++) poner(x, G - 290 - Math.round(hash(i + 90) * 90), 'rama');
    return out.sort((a, b) => a.x - b.x);
  }
  /* La argolla que el gancho agarraría desde (hx, hy): arriba del héroe, a menos de `rango`, mejor si está hacia donde mira. */
  function elegirAncla(lista, hx, hy, dir, rango) {
    let mejor = null, ms = Infinity;
    for (const a of lista) {
      const dx = a.x - hx; if (dx > rango || dx < -rango) continue;
      const dy = a.y - hy; if (dy > -60) continue;
      const d = Math.hypot(dx, dy); if (d > rango || d < P.ganchoMin * .6) continue;
      const sc = d + (dx * dir < 0 ? 140 : 0); if (sc < ms) { ms = sc; mejor = a; }
    }
    return mejor;
  }
  /* Un paso de la cuerda: si el siguiente punto queda más lejos de la argolla que el largo L, se proyecta sobre el círculo
   * y la velocidad se corrige (así se conserva el movimiento de péndulo). */
  function restringirCuerda(px, py, vx, vy, dt, ax, ay, L, vmax) {
    let nx = px + vx * dt, ny = py + vy * dt; const dx = nx - ax, dy = ny - ay, d = Math.hypot(dx, dy);
    if (d > L) { nx = ax + dx / d * L; ny = ay + dy / d * L; vx = (nx - px) / dt; vy = (ny - py) / dt; }
    const v = Math.hypot(vx, vy); if (v > vmax) { vx *= vmax / v; vy *= vmax / v; }
    return { vx, vy };
  }
  const rectTajo = (h, base) => (h.tajoAbajo ? { x: h.x - 70, y: h.y - 30, w: 140, h: 150 } : base);

  // =================== navegador ===================
  const core = () => (typeof window !== 'undefined' ? window.N1core : null);
  const S = () => { const c = core(); return c && c.S ? c.S() : null; };
  const keysDe = () => core().keys;
  const salto = () => { const K = keysDe(); return K.Space || K.ArrowUp || K.KeyW; };

  function crearEstado() {
    return {
      tiene: {}, orden: [], eligiendo: false, panel: null, tac: null,
      invT: 0, esqCd: 0, pogoCd: 0, pogos: 0, estela: [], anclas: [], cand: null, sinAncla: -9,
      dash: { t: 0, cd: 0, dir: 1, usado: false, usos: 0 }, doble: { usado: false, usos: 0 }, planeando: false, planeoSeg: 0,
      pared: { lado: 0, gracia: 0, lock: 0, cling: false, usos: 0 }, gancho: { on: false, ax: 0, ay: 0, L: 0, cd: 0, t: 0, usos: 0 }
    };
  }
  function iniciar(sx, o) {
    const A = sx.hab = crearEstado(); A.anclas = anclas(sx.N);
    let ids = (o && o.habilidades) || null;
    if (!ids && typeof location !== 'undefined') { const m = /[?&]hab=([^&]+)/.exec(location.search); if (m) ids = decodeURIComponent(m[1]).split(','); }   // ?hab=todas  ·  ?hab=dash,gancho  (pruebas)
    if (ids && ids[0] === 'todas') ids = DEFS.map(d => d.id);
    (ids || []).forEach(id => { if (DEFS.some(d => d.id === id) && !A.tiene[id]) { A.tiene[id] = true; A.orden.push(id); } });
    botones();
  }

  // ---------- consultas del mundo ----------
  /* ¿hay una pared agarrable pegada al héroe? -1 = a su izquierda, 1 = a su derecha, 0 = ninguna */
  function tocaPared(s) {
    const h = s.h;
    for (const m of s.N.muros) {
      if (!core().muroSolido(m) || (m.tipo !== 'escalada' && m.tipo !== 'muro')) continue;     // las rejas y los sellos no se escalan
      if (!(h.y - h.h < m.y + m.h - 6 && h.y - 6 > m.y)) continue;
      if (h.x > m.x + m.w / 2 && Math.abs((h.x - h.w / 2) - (m.x + m.w)) <= 5) return -1;
      if (h.x < m.x + m.w / 2 && Math.abs((h.x + h.w / 2) - m.x) <= 5) return 1;
    }
    return 0;
  }
  /* distancia hasta el suelo o plataforma que tiene debajo (para no gastar el doble salto justo antes de aterrizar) */
  function distSuelo(s) {
    const h = s.h; let d = Infinity;
    for (const g of s.N.suelo) if (h.x >= g.x0 - 8 && h.x <= g.x1 + 8 && h.y <= G + 6) d = Math.min(d, G - h.y);
    for (const p of s.N.plat) { if (p.estado === 'caida') continue; const top = (p.Y !== undefined ? p.Y : p.y) + (p.cy || 0); if (h.x + h.w / 2 > (p.X !== undefined ? p.X : p.x) + 6 && h.x - h.w / 2 < (p.X !== undefined ? p.X : p.x) + p.w - 6 && top >= h.y - 4) d = Math.min(d, top - h.y); }
    return d;
  }
  const recargar = A => { A.doble.usado = false; A.dash.usado = false; };

  // ---------- acciones ----------
  function intentarDash() {
    const s = S(), A = s && s.hab; if (!A || !A.tiene.dash || s.fin || s.pausa || s.eligiendo) return;
    const h = s.h; if (A.dash.cd > 0 || h.aturdido > 0 || h.muerto > 0 || (!h.suelo && A.dash.usado)) return;
    const K = keysDe(), d = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0);
    soltarGancho(); s.apunta = null;
    A.dash.dir = d || h.dir; A.dash.t = P.dashT; A.dash.cd = P.dashCd; A.dash.usos++; if (!h.suelo) A.dash.usado = true;
    A.invT = P.dashT + P.invExtra; h.dir = A.dash.dir; core().chispas(h.x, h.y - 40, 10, '#9fe8ff');
  }
  function intentarGancho() {
    const s = S(), A = s && s.hab; if (!A || !A.tiene.gancho || A.gancho.on || A.gancho.cd > 0 || s.fin || s.pausa || s.eligiendo) return;
    const h = s.h; if (h.aturdido > 0 || h.muerto > 0) return;
    const a = elegirAncla(A.anclas, h.x, h.y - 70, h.dir, P.ganchoRango);
    if (!a) { if (s.t - A.sinAncla > 1.6) { A.sinAncla = s.t; core().texto(h.x, h.y - 130, 'Busca una argolla ◎', '#ffe27a'); } return; }
    const g = A.gancho; g.on = true; g.ax = a.x; g.ay = a.y; g.L = Math.max(P.ganchoMin, Math.hypot(a.x - h.x, a.y - (h.y - 70))); g.t = 0; g.usos++; A.dash.t = 0;
    core().chispas(a.x, a.y, 10, '#ffe27a');
  }
  function soltarGancho(conSalto) {
    const s = S(), A = s && s.hab; if (!A || !A.gancho.on) return;
    A.gancho.on = false; A.gancho.cd = .22; recargar(A);
    if (conSalto) { s.h.vy -= 380; s.h.cortado = true; }
  }
  function pogo() {
    const s = S(), A = s.hab, h = s.h; if (A.pogoCd > 0) return;
    h.vy = P.pogoVy; h.suelo = false; h.cortado = true; h.tajoAbajo = false; recargar(A); A.pogoCd = .15; A.pogos++; s.shake = Math.max(s.shake, .08);
    core().chispas(h.x, h.y + 10, 14, '#fff6c2'); core().texto(h.x, h.y - 100, '¡REBOTE!', '#fff6c2');
  }
  function pulsar(code) {
    if (DASH_KEYS.indexOf(code) >= 0) intentarDash(); else if (GANCHO_KEYS.indexOf(code) >= 0) intentarGancho();
  }
  function soltar(code) { if (GANCHO_KEYS.indexOf(code) >= 0) soltarGancho(); }

  // ---------- ganchos que motor.js llama cada paso ----------
  function antes(dt, dirIn) {
    const s = S(), h = s.h, A = s.hab, res = { skipMove: false, skipGrav: false, tope: 0 };
    if (!A) return res;
    const dec = k => Math.max(0, k - dt);
    A.invT = dec(A.invT); A.dash.cd = dec(A.dash.cd); A.gancho.cd = dec(A.gancho.cd); A.pogoCd = dec(A.pogoCd); A.esqCd = dec(A.esqCd);
    A.pared.gracia = dec(A.pared.gracia); A.pared.lock = dec(A.pared.lock); A.estela = A.estela.filter(e => (e.t -= dt) > 0);
    if (h.atk <= 0) h.tajoAbajo = false;
    if (h.suelo) { recargar(A); A.pared.lado = 0; A.pared.gracia = 0; }
    A.planeando = false; A.pared.cling = false;
    if (h.aturdido > 0) { soltarGancho(); A.dash.t = 0; return res; }
    A.cand = A.tiene.gancho && !A.gancho.on ? elegirAncla(A.anclas, h.x, h.y - 70, h.dir, P.ganchoRango) : null;

    if (A.dash.t > 0) {                                           // --- dash: línea recta, sin gravedad, invulnerable
      A.dash.t -= dt; h.vx = A.dash.dir * P.dashV; h.vy = 0; h.dir = A.dash.dir;
      A.estela.push({ x: h.x, y: h.y, dir: h.dir, t: .22 }); if (A.dash.t <= 0) h.vx = A.dash.dir * 420;
      res.skipMove = res.skipGrav = true; return res;
    }
    if (A.tiene.pared && !h.suelo && !A.gancho.on) {              // --- pared: agarre, deslizar y salto
      const lado = tocaPared(s);
      if (lado && dirIn === lado && h.vy >= -50) {
        A.pared.cling = true; A.pared.lado = lado; A.pared.gracia = P.graciaPared; h.dir = lado; recargar(A);
        if (Math.floor(s.t * 12) !== Math.floor((s.t - dt) * 12)) core().chispas(h.x + lado * 17, h.y - 30, 2, '#cbbfa0');
      }
      if (A.pared.gracia > 0 && h.buffer > 0) {
        const l = A.pared.lado; h.vy = P.paredSaltoVy; h.vx = -l * P.paredSaltoVx; h.dir = -l; h.buffer = 0; h.cortado = true; h.suelo = false;
        A.pared.lock = P.bloqueoPared; A.pared.gracia = 0; A.pared.cling = false; A.pared.usos++; recargar(A); core().chispas(h.x + l * 17, h.y - 40, 8, '#cbbfa0');
      }
    }
    if (A.pared.lock > 0) res.skipMove = true;                    // justo tras saltar de la pared se conserva el impulso
    if (A.tiene.doble && !h.suelo && h.coyote <= 0 && h.buffer > 0 && !A.doble.usado && !s.apunta && !A.gancho.on && A.pared.gracia <= 0 && !(h.vy > 0 && distSuelo(s) < 40)) {
      h.vy = P.saltoDoble; h.buffer = 0; h.cortado = false; A.doble.usado = true; A.doble.usos++;
      for (let i = 0; i < 6; i++) s.part.push({ x: h.x + (i - 2.5) * 10, y: h.y, vx: (i - 2.5) * 60, vy: 40 + Math.random() * 60, t: .35, col: '#cfe8ff', r: 4 });
    }
    if (A.gancho.on) {                                            // --- gancho: balanceo (la cuerda se aplica después de la gravedad)
      res.skipMove = true;
      if (dirIn) { h.vx += dirIn * P.bombeo * dt; h.dir = dirIn; }
      if (h.suelo) h.vx *= .88;
      if (h.buffer > 0) { h.buffer = 0; soltarGancho(true); }
    } else if (A.tiene.planeo && !h.suelo && h.vy > 40 && salto() && !A.pared.cling && !s.apunta) { A.planeando = true; A.planeoSeg += dt; res.tope = P.planeoTope; }
    return res;
  }
  function despuesGravedad(dt) {
    const s = S(), h = s.h, A = s.hab; if (!A) return;
    const g = A.gancho;
    if (g.on) { g.t += dt; const r = restringirCuerda(h.x, h.y - 70, h.vx, h.vy, dt, g.ax, g.ay, g.L, P.ganchoVmax); h.vx = r.vx; h.vy = r.vy; if (Math.abs(h.vx) > 30) h.dir = h.vx > 0 ? 1 : -1; }
    else if (A.planeando) h.vy = Math.min(h.vy, P.planeoVy);
    if (A.pared.cling && h.vy > P.paredVy) h.vy = P.paredVy;
  }
  function alTajo() { const s = S(), h = s.h; h.tajoAbajo = !!(s.hab && s.hab.tiene.tajoAereo && !h.suelo && (keysDe().ArrowDown || keysDe().KeyS)); }
  function despuesTajo() {
    const s = S(), A = s.hab, h = s.h; if (!A || !h.tajoAbajo || !s.tajo || A.pogoCd > 0) return;
    for (const z of s.N.haz) if (core().cruza(s.tajo, { x: z.x, y: z.y, w: z.w, h: z.h })) { pogo(); return; }
  }
  function alGolpear(via) { const s = S(); if (s && s.hab && via === 'tajo' && s.h.tajoAbajo) pogo(); }
  function invulnerable() {
    const s = S(), A = s && s.hab; if (!A || A.invT <= 0) return false;
    if (A.esqCd <= 0) { A.esqCd = .5; core().texto(s.h.x, s.h.y - 110, '¡ESQUIVA!', '#9fe8ff'); }
    return true;
  }
  function alDanio() { const s = S(), A = s && s.hab; if (!A) return; soltarGancho(); A.dash.t = 0; }
  function alReaparecer() { const s = S(), A = s && s.hab; if (!A) return; soltarGancho(); A.dash.t = 0; A.invT = 0; A.planeando = false; A.pared.cling = false; A.pared.gracia = 0; recargar(A); }
  function revisar() {
    const s = S(), A = s && s.hab; if (!A || A.eligiendo || s.fin || A.orden.length >= DEFS.length) return;
    if (s.pergaminos >= umbral(A.orden.length)) abrirPanel();
  }

  // =================== panel para elegir habilidad ===================
  const CSS = `.n1HabGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.n1HabCard.n1Op{text-align:center}.n1HabCard h3{margin:4px 0 6px}.n1HabCard .ic{font-size:clamp(22px,5vw,36px);line-height:1.2}.n1HabCard .k{display:inline-block;margin-top:6px;padding:3px 7px;border-radius:6px;background:#f4ead0;color:#2a1a0a;font-size:clamp(7px,1.2vw,9px)}
.n1HabCard.sel{border-color:#FFC93C;background:rgba(255,201,60,.18);box-shadow:0 0 18px rgba(255,201,60,.35)}@media(max-width:560px){.n1HabGrid{grid-template-columns:repeat(2,1fr)}}`;
  function abrirPanel() {
    const s = S(), A = s.hab, raiz = document.getElementById('n1Root'); if (!raiz) return;
    if (!document.getElementById('n1HabCss')) { const st = document.createElement('style'); st.id = 'n1HabCss'; st.textContent = CSS; document.head.appendChild(st); }
    const K = keysDe(); Object.keys(K).forEach(k => { K[k] = 0; });
    A.eligiendo = s.eligiendo = true; s.apunta = null;
    const lista = DEFS.filter(d => !A.tiene[d.id]), el = document.createElement('div'); el.className = 'n1Panel'; el.id = 'n1HabPanel';
    el.innerHTML = '<div class="n1Card"><h2>¡NUEVA HABILIDAD NINJA!</h2><p>Llevas ' + s.pergaminos + ' 📜. Elige la que quieras: ← → y ENTER, el número, o toca una.</p><div class="n1HabGrid">' +
      lista.map((d, i) => '<button class="n1Op n1HabCard" data-id="' + d.id + '"><div class="ic">' + d.icono + '</div><h3>' + (i + 1) + '. ' + d.nombre + '</h3>' + d.desc + '<br><span class="k">' + d.teclas.join(' + ') + '</span></button>').join('') +
      '</div><p>' + (lista.length > 1 ? 'Las demás las ganas con más pergaminos.' : 'Esta es la última habilidad.') + '</p></div>';
    raiz.appendChild(el);
    A.panel = { el, lista, sel: 0, t0: performance.now() };
    el.querySelectorAll('.n1HabCard').forEach(b => { b.addEventListener('click', () => { if (performance.now() - A.panel.t0 > 500) elegir(b.getAttribute('data-id')); }); });
    marcar();
  }
  function marcar() { const A = S().hab; if (!A.panel) return; A.panel.el.querySelectorAll('.n1HabCard').forEach((b, i) => b.classList.toggle('sel', i === A.panel.sel)); }
  function tecla(e) {
    const s = S(), A = s && s.hab; if (!A || !A.panel || e.repeat) return;
    const n = A.panel.lista.length, ok = performance.now() - A.panel.t0 > 500; let i = A.panel.sel;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') i = (i + 1) % n; else if (e.code === 'ArrowLeft' || e.code === 'KeyA') i = (i + n - 1) % n;
    else if (e.code === 'ArrowDown') i = Math.min(n - 1, i + 3); else if (e.code === 'ArrowUp') i = Math.max(0, i - 3);
    else if (/^Digit[1-9]$/.test(e.code) && +e.code.slice(5) <= n) { if (ok) elegir(A.panel.lista[+e.code.slice(5) - 1].id); return; }
    else if (e.code === 'Enter' || e.code === 'Space') { if (ok) elegir(A.panel.lista[i].id); return; }
    A.panel.sel = i; marcar();
  }
  function elegir(id) {
    const s = S(), A = s && s.hab; if (!A || !A.panel || A.tiene[id]) return;
    const d = DEFS.find(q => q.id === id); A.tiene[id] = true; A.orden.push(id);
    A.panel.el.remove(); A.panel = null; A.eligiendo = s.eligiendo = false;
    const K = keysDe(); Object.keys(K).forEach(k => { K[k] = 0; });
    s.aviso = { t: 3, s: d.icono + ' ' + d.nombre }; core().chispas(s.h.x, s.h.y - 60, 30, '#ffe27a'); botones();
  }

  // =================== botones táctiles de las habilidades ===================
  function botones() {
    const s = S(), A = s && s.hab, raiz = document.getElementById('n1Root'); if (!A || !s.movil || !raiz) return;
    if (A.tac) { A.tac.remove(); A.tac = null; }
    const defs = []; if (A.tiene.dash) defs.push(['💨', 'ShiftLeft']); if (A.tiene.gancho) defs.push(['🪝', 'KeyG']); if (A.tiene.tajoAereo) defs.push(['⬇', 'ArrowDown']);
    if (!defs.length) return;
    const c = document.createElement('div'); c.className = 'n1Tac'; c.style.right = '14px'; c.style.bottom = 'clamp(74px,17vw,112px)'; const K = keysDe();
    defs.forEach(([txt, code]) => {
      const b = document.createElement('button'); b.textContent = txt;
      const on = ev => { ev.preventDefault(); if (!K[code]) core().pulsar(code); K[code] = 1; }, off = ev => { ev.preventDefault(); if (K[code]) core().soltar(code); K[code] = 0; };
      b.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, off)); c.appendChild(b);
    });
    raiz.appendChild(c); A.tac = c;
  }

  // =================== tutoriales (los usa motor.js junto a los suyos) ===================
  const hab = () => S().hab;
  const TUTOS = [
    { id: 'h_dash', txt: 'SHIFT: lánzate en un dash. ¡Mientras dura, nada te puede herir!', teclas: ['SHIFT'], ok: () => hab().dash.usos > 0, cuando: () => hab().tiene.dash },
    { id: 'h_doble', txt: 'Pulsa ESPACIO otra vez en el aire para un segundo salto', teclas: ['ESPACIO', 'ESPACIO'], ok: () => hab().doble.usos > 0, cuando: () => hab().tiene.doble },
    { id: 'h_planeo', txt: 'Mantén ESPACIO mientras caes para planear', teclas: ['ESPACIO'], ok: () => hab().planeoSeg > .5, cuando: () => hab().tiene.planeo },
    { id: 'h_pared', txt: 'Al caer, empuja contra una pared para agarrarte · ESPACIO salta de ella. ¡Prueba las chimeneas de bambú!', teclas: ['← →', 'ESPACIO'], ok: () => hab().pared.usos > 0, cuando: () => hab().tiene.pared },
    { id: 'h_tajo', txt: 'En el aire, mantén ↓ y pulsa C: tajo hacia abajo. ¡Rebotas sobre enemigos y kunai!', teclas: ['↓', 'C'], ok: () => hab().pogos > 0, cuando: () => hab().tiene.tajoAereo },
    { id: 'h_gancho', txt: 'Mantén G junto a una argolla ◎ y balancéate · ← → impulsan · suelta o salta para salir volando', teclas: ['G'], ok: () => hab().gancho.usos > 0, cuando: () => hab().tiene.gancho }
  ];

  // =================== dibujo ===================
  const ctx = () => core().cx;
  function mundo() {                                              // argollas del gancho y flechas guía de las chimeneas
    const s = S(), c = ctx(), A = s.hab, cam = s.cam, t = s.t;
    A.anclas.forEach(a => {
      const x = a.x - cam; if (x < -60 || x > 1340) return;
      const activo = A.tiene.gancho, objetivo = A.cand === a, enUso = A.gancho.on && A.gancho.ax === a.x;
      c.strokeStyle = activo ? 'rgba(130,90,45,.9)' : 'rgba(130,90,45,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, a.y - 15); c.stroke();
      if (objetivo || enUso) { const r = 44 + Math.sin(t * 8) * 4, g = c.createRadialGradient(x, a.y, 4, x, a.y, r); g.addColorStop(0, 'rgba(255,226,122,.75)'); g.addColorStop(1, 'rgba(255,226,122,0)'); c.fillStyle = g; c.fillRect(x - r, a.y - r, r * 2, r * 2); }
      c.globalAlpha = activo ? 1 : .4; c.lineWidth = 6; c.strokeStyle = '#8a6a22'; c.beginPath(); c.arc(x, a.y, 14, 0, 7); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#ffd86a'; c.beginPath(); c.arc(x, a.y, 14, 3.4, 5.2); c.stroke(); c.globalAlpha = 1;
    });
    if (!A.tiene.pared) return;
    s.N.muros.forEach(m => {
      if (m.tipo !== 'escalada' || m.lado !== 'izq') return; const p = s.N.muros.find(q => q.par === m.par && q.lado === 'der'); if (!p) return;
      const x0 = m.x + m.w - cam, x1 = p.x - cam; if (x1 < -50 || x0 > 1330) return;
      for (let i = 0; i < 5; i++) { const ph = (t * 1.1 + i / 5) % 1, y = m.y + m.h - 30 - ph * (m.h - 60); c.globalAlpha = Math.sin(ph * Math.PI) * .55; c.fillStyle = '#ffe27a'; const cxm = (x0 + x1) / 2; c.beginPath(); c.moveTo(cxm, y - 14); c.lineTo(cxm + 16, y + 8); c.lineTo(cxm - 16, y + 8); c.closePath(); c.fill(); }
      c.globalAlpha = 1;
    });
  }
  function dibujarPared(m) {                                      // pared de bambú de la chimenea
    const s = S(), c = ctx(), x = m.x - s.cam, g = c.createLinearGradient(x, 0, x + m.w, 0);
    g.addColorStop(0, '#2f6b3a'); g.addColorStop(.35, '#7fc16a'); g.addColorStop(.7, '#4f9a4f'); g.addColorStop(1, '#23512d'); c.fillStyle = g; c.fillRect(x, m.y, m.w, m.h);
    c.fillStyle = '#1d4425'; for (let y = m.y + 10; y < m.y + m.h; y += 64) { c.fillRect(x - 3, y, m.w + 6, 7); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 6, y - 40, 5, 34); c.fillStyle = '#1d4425'; }
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2; c.strokeRect(x, m.y, m.w, m.h);
    c.fillStyle = '#e9d9a6'; c.fillRect(x - 4, m.y + m.h - 10, m.w + 8, 10);
  }
  function estelas() {                                            // imágenes fantasma del dash (detrás del héroe)
    const s = S(), A = s.hab, c = ctx(), sp = api.sprite; if (!A || !sp || !A.estela.length) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    A.estela.forEach(e => { c.globalAlpha = Math.max(0, e.t / .22) * .4; c.save(); c.translate(e.x - s.cam, e.y); if (e.dir < 0) c.scale(-1, 1); c.drawImage(sp.im, -sp.ax, -sp.ay, sp.w, sp.hh); c.restore(); });
    c.restore();
  }
  function encima() {                                             // cuerda, ala del planeo, tajo hacia abajo, aura del dash
    const s = S(), c = ctx(), h = s.h, A = s.hab, cam = s.cam; if (!A) return;
    const hx = h.x - cam, hy = h.y - 70;
    if (A.gancho.on) {
      const g = A.gancho, k = Math.min(1, g.t / .09), ex = hx + (g.ax - cam - hx) * k, ey = hy + (g.ay - hy) * k;
      c.lineCap = 'round'; c.strokeStyle = '#4a2e14'; c.lineWidth = 5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = '#d8b070'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffd86a'; c.beginPath(); c.arc(ex, ey, 5, 0, 7); c.fill();
    }
    if (A.planeando) {
      const y = h.y - 108, sw = Math.sin(s.t * 6) * 3; c.save(); c.translate(hx, y);
      c.fillStyle = '#ff4d6d'; c.beginPath(); c.moveTo(-58, 8 + sw); c.quadraticCurveTo(0, -34, 58, 8 - sw); c.quadraticCurveTo(0, -6, -58, 8 + sw); c.fill();
      c.strokeStyle = '#fff6c2'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-52, 8); c.lineTo(-6, 52); c.moveTo(52, 8); c.lineTo(6, 52); c.stroke(); c.restore();
    }
    if (h.tajoAbajo && h.atk > 0) {
      const p = 1 - h.atk / .28; c.save(); c.translate(hx, h.y - 10); c.globalAlpha = Math.sin(p * Math.PI) * .95; c.lineCap = 'round';
      c.strokeStyle = '#fff6c2'; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, 78, .35 + p * .5, Math.PI - .35 - p * .5); c.stroke(); c.strokeStyle = '#ffc93c'; c.lineWidth = 4; c.stroke(); c.restore();
    }
    if (A.dash.t > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(hx, h.y - 50, 4, hx, h.y - 50, 70); g.addColorStop(0, 'rgba(160,230,255,.55)'); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.fillRect(hx - 70, h.y - 120, 140, 140); c.restore(); }
  }
  function hud(c, caja) {
    const s = S(), A = s.hab, n = A.orden.length, sig = umbral(n), prev = n ? UMBRALES[n - 1] : 0;
    if (n < DEFS.length) {
      caja(20, 94, 120, 10, 5, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.5)'); c.fillStyle = '#ffc93c'; c.fillRect(23, 97, 114 * Math.max(0, Math.min(1, (s.pergaminos - prev) / (sig - prev))), 4);
      c.font = '10px ui-monospace,monospace'; c.fillStyle = '#ffe27a'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('→ HABILIDAD  ' + s.pergaminos + '/' + sig, 22, 108);
    }
    A.orden.forEach((id, i) => {
      const d = DEFS.find(q => q.id === id), x = 20 + i * 50, y = 124;
      const uso = (id === 'dash' && A.dash.t > 0) || (id === 'planeo' && A.planeando) || (id === 'pared' && A.pared.cling) || (id === 'gancho' && A.gancho.on) || (id === 'doble' && A.doble.usado && !s.h.suelo);
      caja(x, y, 44, 44, 9, uso ? 'rgba(255,201,60,.35)' : 'rgba(10,4,30,.6)', uso ? '#ffc93c' : 'rgba(255,255,255,.35)');
      c.font = '22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = (id === 'dash' && A.dash.cd > 0 && !uso) || (id === 'gancho' && A.cand === null && !A.gancho.on) ? .45 : 1; c.fillStyle = '#fff'; c.fillText(d.icono, x + 22, y + 19); c.globalAlpha = 1;
      if (id === 'dash' && A.dash.cd > 0) { c.fillStyle = '#9fe8ff'; c.fillRect(x + 3, y + 41, 38 * (1 - A.dash.cd / P.dashCd), 3); }
      c.font = 'bold 9px ui-monospace,monospace'; c.fillStyle = '#ffe27a'; c.fillText(d.tecla, x + 22, y + 38);
    });
  }

  const api = { DEFS, UMBRALES, P, TUTOS, umbral, anclas, elegirAncla, restringirCuerda, rectTajo, DASH_KEYS, GANCHO_KEYS,
    iniciar, antes, despuesGravedad, alTajo, despuesTajo, alGolpear, invulnerable, alDanio, alReaparecer, revisar, tecla, pulsar, soltar,
    mundo, dibujarPared, estelas, encima, hud, sprite: null,
    _elegir: elegir, _pogo: pogo };
  if (typeof window !== 'undefined' && window.N1core) window.N1core.alGolpear = alGolpear;
  return api;
});
