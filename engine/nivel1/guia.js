/* Guía visual del Nivel 1 — "Primeros minutos del jugador".
 *
 * Reemplaza la tarjeta de texto de los tutoriales por ayudas que se ENTIENDEN MIRANDO:
 *   · una burbuja con la tecla dibujada (o el botón táctil) que se "pulsa" sola, flotando sobre el objeto que hay que usar
 *     (el enemigo, el tambor, la palanca...) o sobre la cabeza del héroe; como mucho 1-3 palabras, nunca frases;
 *   · una flecha y un resplandor sobre el objetivo, y flechas ››› delante del héroe al caminar;
 *   · en celular, el botón de verdad (◀ ▶ ⤒ 🗡 ✦ 💬) late en dorado;
 *   · "pasos del aprendiz": cuatro iconos abajo (👣 ⤒ 🗡 ✦) que se encienden al hacer cada cosa; desaparecen al completarlos;
 *   · al lograrlo, un destello ✓ con chispas y la ayuda se va al instante.
 *
 * Y solo aparecen cuando hacen falta:
 *   · si el jugador ya hizo la acción solo (antes de que le toque la ayuda), NO se muestra nada;
 *   · se espera unos segundos antes de ayudar (más corto si hay peligro) y se esconde sola al salir de la situación;
 *   · si se equivoca o lo hieren 2 veces seguidas cerca de algo que ya había visto, la ayuda vuelve a salir (1 vez por cosa).
 *
 * motor.js solo llama a N1guia.iniciar / actualizar / hud. Si algo falla ahí, el motor sigue con la tarjeta de texto de siempre.
 * La parte de decisión (cuándo ayudar) no usa el navegador y se prueba en Node (tests/guia.test.js). */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.N1guia = api;
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const W = 1280, H = 720, G = 560;

  /** Los cuatro primeros pasos del aprendiz (usan los ids de los tutoriales de motor.js). */
  const PASOS = [{ id: 'mover', ico: '👣' }, { id: 'saltar', ico: '⤒' }, { id: 'tajo', ico: '🗡' }, { id: 'apuntar', ico: '✦' }];

  /** Segundos que se espera, ya dentro de la situación, antes de ayudar (si el jugador no lo ha hecho solo). */
  const ESPERA = {
    mover: 2.4, saltar: 2.2, tajo: 1, secreto: 1.5, apuntar: 3, apuntar2: 1.2, tambor: 1, carreta: 1.5, palanca: 1.5, viento: 1,
    emb: 0, roca: 0, ritmo: 1.2, oscuro: .6, antorchas: 2, jefe: 0, sellos: 1.2, frasco: .8, llave: 1.5, tanuki: .8,
    arquero: 0, escarabajo: .4, tela: .8, h_dash: 1, h_doble: 1, h_planeo: 1, h_pared: 1, h_tajo: 1, h_gancho: 1,
    d_viento: 0, d_gravedad: 0, d_resbala: 0, d_noche: 0, d_rocas: 0, d_fuego: 0
  };
  const ESPERA_BASE = .8, MAX_VISIBLE = 10, MAX_REPETIDA = 8;
  /** Volver a ayudar: n golpes/errores dentro de la ventana (s); y un descanso entre ayudas repetidas. */
  const APURO = { n: 2, ventana: 30, descanso: 30 };

  // ---- objetivos en el mundo (a dónde apunta la flecha). Todos devuelven {x, y} (punta de la flecha) o null ----
  const delante = (S, lista, f) => (lista || []).filter(e => f(e) && e.x > S.h.x - 60).sort((a, b) => a.x - b.x)[0] || null;
  const enemigo = (kinds, dy) => S => { const e = delante(S, S.enemigos, q => q.vivo && (!kinds || kinds.indexOf(q.kind) >= 0) && q.kind !== 'oni'); return e ? { x: e.x, y: e.y - (dy || 150) } : null; };
  const elem = (t, dy, dx) => S => { const e = delante(S, S.N && S.N.elem, q => q.t === t && !q.on && !q.roto); return e ? { x: e.x + (dx ? (e.w || 0) / 2 : 0), y: (e.y || G) - dy } : null; };
  const OBJ = {
    tajo: enemigo(null, 150),
    arquero: enemigo(['arquero'], 170),
    escarabajo: enemigo(['escarabajo'], 130),
    tambor: S => { const t = delante(S, S.N && S.N.tambores, () => true); return t ? { x: t.x, y: t.y - 90 } : null; },
    carreta: elem('carreta', 150, false),
    palanca: elem('palanca', 55, false),
    viento: S => { const e = delante(S, S.N && S.N.elem, q => q.t === 'viento'); return e ? { x: e.x + e.w / 2, y: e.y + 150 } : null; },
    tela: elem('tela', 30, true),
    tanuki: S => { const e = delante(S, S.N && S.N.elem, q => q.t === 'npc' && q.who === 'tanuki'); return e ? { x: e.x, y: G - 200 } : null; },
    sellos: S => { const m = delante(S, S.N && S.N.muros, q => q.rompible && !q.roto); return m ? { x: m.x + m.w / 2, y: m.y - 30 } : null; },
    frasco: S => { const i = delante(S, S.items, q => q.tipo === 'frasco' && !q.tomado); return i ? { x: i.x, y: i.y - 60 } : null; },
    llave: S => { const i = delante(S, S.items, q => q.tipo === 'llave' && !q.tomado); return i ? { x: i.x, y: i.y - 60 } : null; },
    secreto: S => { const d = (S.N && S.N.deco || []).filter(q => q.premio && !q.abierto && Math.abs(q.x - S.h.x) < 430).sort((a, b) => Math.abs(a.x - S.h.x) - Math.abs(b.x - S.h.x))[0]; return d ? { x: d.x, y: (d.y || G) - 170 } : null; }
  };

  /** Qué dibujar para cada tutorial: k = teclas (o emojis), lbl = 1-3 palabras, anim = cómo se mueve la burbuja, obj = a qué apunta. */
  const ESPEC = {
    mover: { k: ['←', '→'], lbl: '', anim: 'caminar', flechas: true },
    saltar: { k: ['ESPACIO'], lbl: 'Salta', anim: 'tocar' },
    tajo: { k: ['C'], lbl: 'Golpea', anim: 'tocar', obj: OBJ.tajo },
    secreto: { k: ['C'], lbl: '¡Brilla!', anim: 'tocar', obj: OBJ.secreto },
    apuntar: { k: ['F'], lbl: 'Mantén y suelta', anim: 'mantener' },
    apuntar2: { k: ['C'], lbl: 'Salta y golpea', anim: 'tocar' },
    tambor: { k: ['ESPACIO'], lbl: 'Rebota', anim: 'tocar', obj: OBJ.tambor },
    carreta: { k: ['→'], lbl: 'Empuja', anim: 'mantener', obj: OBJ.carreta },
    palanca: { k: ['C'], lbl: 'Golpea', anim: 'tocar', obj: OBJ.palanca },
    viento: { k: ['ESPACIO'], lbl: 'Mantén', anim: 'mantener', obj: OBJ.viento },
    emb: { k: ['C', 'F'], lbl: '¡Vence a todos!', anim: 'tocar' },
    roca: { k: ['→', 'ESPACIO'], lbl: '¡Corre!', anim: 'tocar', flechas: true },
    ritmo: { k: ['⏱'], lbl: 'Espera…', anim: 'latir' },
    oscuro: { k: ['🔥'], lbl: 'Sigue tu luz', anim: 'latir' },
    antorchas: { k: ['C', 'F'], lbl: 'Menor → mayor', anim: 'tocar' },
    jefe: { k: ['C', 'F'], lbl: 'Esquiva y golpea', anim: 'tocar' },
    sellos: { k: ['C'], lbl: 'Rompe', anim: 'tocar', obj: OBJ.sellos },
    frasco: { k: ['🔥'], lbl: 'Recarga luz', anim: 'latir', obj: OBJ.frasco },
    llave: { k: ['🔑'], lbl: 'Toma la llave', anim: 'latir', obj: OBJ.llave },
    tanuki: { k: ['E'], lbl: 'Habla', anim: 'tocar', obj: OBJ.tanuki },
    arquero: { k: ['ESPACIO'], lbl: '¡Esquiva!', anim: 'tocar', obj: OBJ.arquero },
    escarabajo: { k: ['C'], lbl: 'Solo espada', anim: 'tocar', obj: OBJ.escarabajo },
    tela: { k: ['C'], lbl: 'Córtala', anim: 'tocar', obj: OBJ.tela },
    h_dash: { k: ['SHIFT'], lbl: 'Dash', anim: 'tocar' },
    h_doble: { k: ['ESPACIO', 'ESPACIO'], lbl: 'Doble salto', anim: 'tocar' },
    h_planeo: { k: ['ESPACIO'], lbl: 'Mantén y planea', anim: 'mantener' },
    h_pared: { k: ['← →', 'ESPACIO'], lbl: 'Agárrate', anim: 'tocar' },
    h_tajo: { k: ['↓', 'C'], lbl: 'Tajo abajo', anim: 'tocar' },
    h_gancho: { k: ['G'], lbl: 'Gancho', anim: 'mantener' },
    d_viento: { k: ['🌪️'], lbl: 'Avanza fuerte', anim: 'latir' },
    d_gravedad: { k: ['🌙'], lbl: 'Salta alto', anim: 'latir' },
    d_resbala: { k: ['🧊'], lbl: 'Frena antes', anim: 'latir' },
    d_noche: { k: ['🌆'], lbl: 'Sigue la luz', anim: 'latir' },
    d_rocas: { k: ['🪨'], lbl: 'Huye de rocas', anim: 'latir' },
    d_fuego: { k: ['🔥'], lbl: 'Corre →', anim: 'latir', flechas: true }
  };
  /** Tecla del teclado → [código del botón táctil, símbolo del botón]. */
  const TOUCH = { '←': ['ArrowLeft', '◀'], '→': ['ArrowRight', '▶'], ESPACIO: ['Space', '⤒'], C: ['KeyC', '🗡'], F: ['KeyF', '✦'], E: ['KeyE', '💬'] };

  const esEmoji = k => /[\u{1F000}-\u{1FFFF}\u23F1]/u.test(k);   // 🔥 🔑 🌪️ ⏱ ... se dibujan grandes, sin relieve de tecla
  const espera = id => (id in ESPERA ? ESPERA[id] : ESPERA_BASE);
  const espec = def => ESPEC[def.id] || { k: (def.teclas || []).slice(0, 3), lbl: '', anim: 'latir' };
  const seguro = f => { try { return !!f(); } catch (e) { return false; } };

  // ============================== decisión (pura: sin navegador) ==============================
  /** Crea (o reinicia) el estado de la guía dentro de S. */
  function iniciar(S) {
    const vistos = S.tutoVisto || (S.tutoVisto = {});
    S.guia = { t: 0, pend: {}, act: null, cool: 0, fuera: 0, rehacer: {}, rehechos: {}, ev: [], ult: -999, fx: [], lista: [],
      vidaPrev: S.h ? S.h.vida : 0, errPrev: S.errores || 0, nuevo: PASOS.some(p => !vistos[p.id]), pasosFin: 0, btn: '' };
    return S.guia;
  }

  /** Se llama cada cuadro en lugar de la tarjeta de texto. `lista` = los tutoriales {id, ok(), cuando()} de motor.js, habilidades y director. */
  function actualizar(S, dt, lista) {
    const g = S.guia || iniciar(S), vistos = S.tutoVisto || (S.tutoVisto = {});
    g.t += dt; g.lista = lista; g.fx = g.fx.filter(f => (f.t += dt) < 1);
    const vida = S.h ? S.h.vida : 0; if (vida < g.vidaPrev) g.ev.push(g.t); g.vidaPrev = vida;
    const err = S.errores || 0; if (err > g.errPrev) g.ev.push(g.t); g.errPrev = err;
    g.ev = g.ev.filter(t => g.t - t < APURO.ventana);
    if (g.nuevo) { if (PASOS.every(p => vistos[p.id] || hecho(lista, p.id))) g.pasosFin += dt; else g.pasosFin = 0; }

    if (g.act) { mantener(S, g, dt); return true; }
    if (g.cool > 0) g.cool -= dt;

    // ¿se está atorando? vuelve a ayudar con algo que ya había visto y todavía no logra (una vez por cosa, con descanso)
    if (g.ev.length >= APURO.n && g.t - g.ult > APURO.descanso) {
      const c = lista.find(t => vistos[t.id] && !g.rehechos[t.id] && seguro(t.cuando) && !seguro(t.ok));
      if (c) { g.rehacer[c.id] = true; g.rehechos[c.id] = true; g.ult = g.t; g.ev.length = 0; }
    }

    const bloqueado = !!(S.apunta || S.eligiendo || S.pausa || S.fin || (S.aviso && S.aviso.t > 0) || (S.h && S.h.muerto > 0));
    for (const t of lista) {
      const id = t.id, visto = !!vistos[id], reh = !!g.rehacer[id];
      if (visto && !reh) continue;
      if (!seguro(t.cuando)) { delete g.pend[id]; continue; }
      if (!reh && seguro(t.ok)) { vistos[id] = 1; delete g.pend[id]; continue; }   // ya lo hizo solo: no hace falta ayudar
      g.pend[id] = (g.pend[id] || 0) + dt;
      if (bloqueado || g.cool > 0) continue;
      if (g.pend[id] >= (reh ? 0 : espera(id))) { mostrar(S, g, t, reh); break; }
    }
    return true;
  }
  const hecho = (lista, id) => { const t = lista.find(q => q.id === id); return !!t && seguro(t.ok); };

  function mostrar(S, g, t, reh) {
    g.act = { def: t, id: t.id, t: 0, max: reh ? MAX_REPETIDA : MAX_VISIBLE, reh };
    delete g.pend[t.id]; g.fuera = 0; botones(S, g, espec(t));
  }
  function mantener(S, g, dt) {
    const a = g.act; a.t += dt;
    g.fuera = seguro(a.def.cuando) ? 0 : g.fuera + dt;
    if (seguro(a.def.ok) && a.t > .3) return terminar(S, g, true);
    if (a.t > a.max || g.fuera > 1.5 || S.fin) terminar(S, g, false);
  }
  function terminar(S, g, exito) {
    const a = g.act; if (!a) return;
    S.tutoVisto[a.id] = 1; g.rehacer[a.id] = false; g.act = null; g.cool = exito ? .8 : 2.5; botones(S, g, null);
    if (exito && S.h) {
      g.fx.push({ x: S.h.x, y: S.h.y - 190, t: 0 });
      for (let i = 0; i < 14; i++) { const an = Math.PI * 2 * i / 14; S.part && S.part.push({ x: S.h.x, y: S.h.y - 110, vx: Math.cos(an) * 260, vy: Math.sin(an) * 260 - 120, t: .7, col: i % 2 ? '#ffe27a' : '#9dffc2', r: 7 }); }
    }
  }

  /** Estado de los pasos del aprendiz (para dibujar y para probar). null si ya no hay que mostrarlos. */
  function pasos(S, lista) {
    const g = S.guia; if (!g || !g.nuevo || g.pasosFin > 2.5) return null;
    let actual = -1; const st = PASOS.map((p, i) => { const h = !!(S.tutoVisto && S.tutoVisto[p.id]) || hecho(lista || [], p.id); if (!h && actual < 0) actual = i; return { id: p.id, ico: p.ico, hecho: h, actual: false }; });
    if (actual >= 0) st[actual].actual = true;
    return st;
  }

  // ============================== botones táctiles que laten ==============================
  function botones(S, g, sp) {
    if (typeof document === 'undefined' || !S.movil) return;
    const cod = sp ? sp.k.map(k => TOUCH[k] && TOUCH[k][0]).filter(Boolean) : [], clave = cod.join(',');
    if (clave === g.btn) return; g.btn = clave;
    if (!document.getElementById('n1GuiaCss')) {
      const s = document.createElement('style'); s.id = 'n1GuiaCss';
      s.textContent = '.n1Tac button.n1Guia{box-shadow:0 0 0 3px rgba(255,226,122,.95),0 0 24px 6px rgba(255,226,122,.8);border-color:#ffe27a;animation:n1GuiaLate .9s ease-in-out infinite}@keyframes n1GuiaLate{50%{transform:scale(1.14)}}';
      document.head.appendChild(s);
    }
    document.querySelectorAll('.n1Tac button').forEach(b => b.classList.toggle('n1Guia', cod.indexOf(/** @type {HTMLElement} */ (b).dataset.k || '') >= 0));
  }

  // ============================== dibujo ==============================
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  function tapa(cx, caja, k, x, y, w, pulsada, movil) {   // una tecla (o botón táctil) con relieve
    const t = movil && TOUCH[k];
    if (esEmoji(k)) { cx.font = '34px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.fillText(k, x + w / 2, y + 22); return; }
    const dy = pulsada ? 4 : 0;
    if (t) { cx.beginPath(); cx.arc(x + w / 2, y + 22 + dy, 22, 0, 7); cx.fillStyle = pulsada ? '#ffe27a' : 'rgba(255,255,255,.28)'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#fff'; cx.stroke(); cx.font = '22px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = pulsada ? '#2a1a0a' : '#fff'; cx.fillText(t[1], x + w / 2, y + 23 + dy); return; }
    caja(x, y + 6, w, 38, 8, '#8a6a3a', null);                                            // sombra del relieve
    caja(x, y + dy, w, 38, 8, pulsada ? '#ffe27a' : '#f4ead0', '#7a5a2a');
    cx.font = 'bold 18px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#2a1a0a'; cx.fillText(k, x + w / 2, y + 20 + dy);
  }
  function ancho(cx, k, movil) { if (movil && TOUCH[k]) return 46; if (esEmoji(k)) return 44; cx.font = 'bold 18px ui-monospace,monospace'; return Math.max(40, cx.measureText(k).width + 22); }

  function burbuja(cx, caja, S, g, sp, ax, ay) {
    const a = g.act, t = a.t, mov = !!S.movil, ks = sp.k, ws = ks.map(k => ancho(cx, k, mov));
    const kw = ws.reduce((s, w) => s + w, 0) + 8 * (ks.length - 1); cx.font = 'bold 15px ui-monospace,monospace';
    const lw = sp.lbl ? cx.measureText(sp.lbl).width : 0, bw = Math.max(kw, lw) + 32, bh = sp.lbl ? 88 : 62;
    const e = Math.min(1, t / .25), sc = e < 1 ? .6 + .4 * (1 - Math.pow(1 - e, 3)) : 1 + Math.sin(t * 5) * .02, al = Math.min(1, t / .15);
    const bob = Math.sin(t * 4) * 4;
    cx.save(); cx.globalAlpha = al; cx.translate(ax, ay + bob); cx.scale(sc, sc);
    caja(-bw / 2, -bh - 14, bw, bh, 14, 'rgba(18,8,51,.9)', '#ffc93c');
    cx.beginPath(); cx.moveTo(-10, -15); cx.lineTo(0, -2); cx.lineTo(10, -15); cx.closePath(); cx.fillStyle = 'rgba(18,8,51,.9)'; cx.fill();   // colita
    cx.beginPath(); cx.moveTo(-10, -14); cx.lineTo(0, -2); cx.lineTo(10, -14); cx.lineWidth = 2; cx.strokeStyle = '#ffc93c'; cx.stroke();
    const ciclo = 1.4, idx = Math.floor(t / ciclo) % ks.length, fase = t % ciclo;
    const pulsa = i => sp.anim === 'mantener' ? fase < .9 : (sp.anim === 'tocar' || sp.anim === 'caminar') && i === idx && fase < .3;
    let x = -kw / 2; const y = -bh - 4;
    ks.forEach((k, i) => { tapa(cx, caja, k, x, y, ws[i], pulsa(i), mov); if (sp.anim === 'latir' || esEmoji(k)) { cx.globalAlpha = al * (.25 + .25 * Math.sin(t * 6)); cx.beginPath(); cx.arc(x + ws[i] / 2, y + 22, 30, 0, 7); cx.strokeStyle = '#ffe27a'; cx.lineWidth = 3; cx.stroke(); cx.globalAlpha = al; } x += ws[i] + 8; });
    if (sp.lbl) { cx.font = 'bold 15px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#ffe27a'; cx.fillText(sp.lbl, 0, -22); }
    cx.restore();
  }
  function objetivo(cx, S, g, p) {   // resplandor + flecha que rebota sobre lo que hay que usar
    const t = g.act.t, x = p.x - S.cam, y = p.y, b = Math.abs(Math.sin(t * 5)) * 10;
    cx.save(); cx.globalCompositeOperation = 'lighter';
    const r = 56 + Math.sin(t * 5) * 6, gr = cx.createRadialGradient(x, y + 70, 4, x, y + 70, r); gr.addColorStop(0, 'rgba(255,226,122,.5)'); gr.addColorStop(1, 'rgba(255,226,122,0)'); cx.fillStyle = gr; cx.fillRect(x - r, y + 70 - r, r * 2, r * 2);
    cx.restore();
    cx.beginPath(); cx.moveTo(x - 13, y - 4 + b); cx.lineTo(x + 13, y - 4 + b); cx.lineTo(x, y + 18 + b); cx.closePath(); cx.fillStyle = '#ffe27a'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = 'rgba(20,8,40,.9)'; cx.stroke();
  }
  function flechas(cx, S, g) {   // ››› delante del héroe: "por aquí"
    const h = S.h, d = h.dir < 0 ? -1 : 1, t = g.act.t;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 - i * .22) % 1.6, al = Math.max(0, Math.sin(Math.min(1, Math.max(0, ph)) * Math.PI)) * .85, x = h.x - S.cam + d * (110 + i * 46), y = h.y - 70;
      cx.globalAlpha = al; cx.lineWidth = 9; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#ffe27a'; cx.beginPath(); cx.moveTo(x - d * 9, y - 22); cx.lineTo(x + d * 9, y); cx.lineTo(x - d * 9, y + 22); cx.stroke();
    }
    cx.globalAlpha = 1;
  }
  function destellos(cx, S, g) {   // ✓ al lograrlo
    g.fx.forEach(f => {
      const p = f.t, x = f.x - S.cam, y = f.y - p * 40, e = 1 - Math.pow(1 - Math.min(1, p * 2), 3);
      cx.save(); cx.globalAlpha = 1 - p; cx.beginPath(); cx.arc(x, y, 14 + 56 * e, 0, 7); cx.lineWidth = 6 * (1 - p); cx.strokeStyle = '#9dffc2'; cx.stroke();
      cx.beginPath(); cx.arc(x, y, 24 * (.6 + .4 * e), 0, 7); cx.fillStyle = 'rgba(40,160,90,.95)'; cx.fill();
      cx.lineWidth = 6; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#fff'; cx.beginPath(); cx.moveTo(x - 10, y + 1); cx.lineTo(x - 2, y + 9); cx.lineTo(x + 11, y - 8); cx.stroke(); cx.restore();
    });
  }
  function dibujarPasos(cx, S, st) {
    const n = st.length, sep = 62, x0 = W / 2 - (n - 1) * sep / 2, y = H - 62, g = S.guia, sal = g.pasosFin > 0 ? 1 - Math.min(1, g.pasosFin / 2.5) : 1;
    cx.save(); cx.globalAlpha = sal; cx.lineCap = 'round';
    cx.lineWidth = 4; for (let i = 0; i < n - 1; i++) { cx.strokeStyle = st[i].hecho ? '#ffc93c' : 'rgba(255,255,255,.25)'; cx.beginPath(); cx.moveTo(x0 + i * sep + 22, y); cx.lineTo(x0 + (i + 1) * sep - 22, y); cx.stroke(); }
    st.forEach((p, i) => {
      const x = x0 + i * sep, pul = p.actual ? 1 + Math.sin(g.t * 5) * .07 : 1;
      cx.save(); cx.translate(x, y); cx.scale(pul, pul);
      cx.beginPath(); cx.arc(0, 0, 21, 0, 7); cx.fillStyle = p.hecho ? '#ffc93c' : 'rgba(18,8,51,.78)'; cx.fill(); cx.lineWidth = p.actual ? 4 : 2; cx.strokeStyle = p.hecho ? '#fff3b0' : (p.actual ? '#ffe27a' : 'rgba(255,255,255,.4)'); cx.stroke();
      cx.font = p.hecho ? 'bold 22px sans-serif' : '19px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = p.hecho ? '#2a1a0a' : (p.actual ? '#fff' : 'rgba(255,255,255,.55)'); cx.fillText(p.hecho ? '✓' : p.ico, 0, 1);
      cx.restore();
    });
    cx.restore();
  }

  /** Se llama desde hud() de motor.js (pantalla, ya sin temblor). */
  function hud(cx, caja, S) {
    const g = S.guia; if (!g || !S.h) return;
    destellos(cx, S, g);
    if (S.apunta) return;
    const st = pasos(S, g.lista); if (st) dibujarPasos(cx, S, st);
    if (!g.act) return;
    const sp = espec(g.act.def); let p = null; if (sp.obj) { try { p = sp.obj(S); } catch (e) { p = null; } }
    if (sp.flechas) flechas(cx, S, g);
    let ax, ay;
    if (p && p.x - S.cam > -40 && p.x - S.cam < W + 40) { objetivo(cx, S, g, p); ax = p.x - S.cam; ay = p.y - 26; }
    else { ax = S.h.x - S.cam; ay = S.h.y - 175; }
    burbuja(cx, caja, S, g, sp, lim(ax, 110, W - 110), lim(ay, 150, H - 170));
  }

  return { PASOS, ESPERA, ESPEC, APURO, TOUCH, espera, espec, iniciar, actualizar, pasos, hud };
});
