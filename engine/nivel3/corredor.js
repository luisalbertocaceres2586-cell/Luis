/* Nivel 3 · Carrera de los Farolillos — corredor VERTICAL en perspectiva (estilo "corre hacia el fondo")
   Diferente al Nivel 1 (plataformas) y al Nivel 2 (surf lateral con puertas):
   · Pantalla en VERTICAL (celular) o columna centrada (PC). El ninja corre hacia el fondo de la pantalla.
   · Dos tipos de etapa que se alternan para no ser monótono:
       CADENA  → farolillos con números: recoge el que sigue en la tabla (7 · 14 · 21 · ?). Cadena de 10 pasos.
       CAZA    → "recoge SOLO los múltiplos del 7": reconocer múltiplos entre números parecidos.
   · Sin castigo duro: equivocarse solo rompe la racha (y la respuesta se repite más adelante, "repaso del zorro").
     Los obstáculos quitan corazones, pero si se acaban solo se repite la etapa con los corazones llenos.
   · Racha → "sombras" (clones de sombra) que siguen al ninja.
   Tablas 7, 8 y 9. Todo lo ajustable está en CFG. Sprites provisionales: los héroes se ven de lado (faltan los de espalda). */
(function () {
  'use strict';

  const W = 540, H = 960, HOR = 268, PY = 800, Z0 = 18, ZMAX = 84, LW = 150, RW = 258;
  const CFG = { VEL0: 9.5, VEL_SUBE: 0.35, VEL_MAX: 12.5, GAP: 19, FILAS_CAD: 10, FILAS_CAZA: 8, VIDAS: 3, INV: 1.8, ALTURA_HEROE: 215 };
  const TABLAS = [7, 8, 9];
  const FUENTE = '"Trebuchet MS",Verdana,ui-sans-serif,sans-serif';
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mez = a => { for (let i = a.length - 1; i > 0; i--) { const j = RI(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const pz = z => 1 / (1 + z / Z0);
  const yz = z => HOR + (PY - HOR) * pz(z);
  const tactil = () => { try { return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } };

  // ───────────────────────── imágenes (todas ya existen en el repositorio) ─────────────────────────
  const P = 'assets/environment/props/';
  const ART = {
    bambu: [P + 'nature/bamboo_a.png', P + 'nature/bamboo_b.png', P + 'nature/bamboo_c.png', P + 'nature/bamboo_d.png'],
    sakura: [P + 'nature/sakura_tree_a.png', P + 'nature/sakura_tree_b.png', P + 'nature/sakura_tree_c.png'],
    farolPiedra: [P + 'lights/stone_lantern_a.png', P + 'lights/stone_lantern_b.png', P + 'lights/stone_lantern_c.png', P + 'lights/fire_brazier_c.png'],
    torii: P + 'structures/torii_gate_f.png', portal: P + 'structures/torii_lanterns_a.png',
    barril: P + 'objects/barrel_c.png', caja: P + 'objects/crate_c.png',
    montanas: 'assets/environment/backgrounds/themes/montanas_night.png',
    corazon: 'assets/ui/hud/animados/corazon_latido.png'
  };
  const cache = {};
  function IMG(src) { let i = cache[src]; if (!i) { i = new Image(); i.src = src; cache[src] = i; } return i; }
  const listo = i => i && i.complete && i.naturalWidth > 0;
  function precargar() { Object.keys(ART).forEach(k => [].concat(ART[k]).forEach(IMG)); }

  // ───────────────────────── temas por tabla ─────────────────────────
  const TEMAS = [
    { nombre: 'Bosque de Bambú', cielo: ['#120a2e', '#3b2a6d'], pasto: ['#0b2a2a', '#12413b'], c1: '#3d3560', c2: '#463e6c', borde: '#7fe3c4', deco: 'bambu' },
    { nombre: 'Jardín de Sakura', cielo: ['#2a0c3a', '#8a3d7a'], pasto: ['#35193d', '#5a2a5c'], c1: '#5a3a63', c2: '#664270', borde: '#ffb3d9', deco: 'sakura' },
    { nombre: 'Camino de Fuego', cielo: ['#2a0a0a', '#a8431f'], pasto: ['#2d1410', '#4d2316'], c1: '#5b3a32', c2: '#684239', borde: '#ffc36b', deco: 'farolPiedra' }
  ];

  // ───────────────────────── sonido (sencillo, se puede silenciar) ─────────────────────────
  let AC = null, mudo = false;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } } return AC || null; }
  function tono(f, d, tipo, vol, ini) {
    if (mudo) return; const a = ac(); if (!a) return;
    try { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (ini || 0); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) {}
  }
  const ESC = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  const sfx = {
    bien(r) { tono(ESC[Math.min(ESC.length - 1, r)], 0.22, 'triangle', 0.14); tono(ESC[Math.min(ESC.length - 1, r)] * 1.5, 0.2, 'sine', 0.06, 0.06); },
    casi() { tono(262, 0.25, 'triangle', 0.1); tono(220, 0.3, 'triangle', 0.08, 0.1); },
    golpe() { tono(140, 0.25, 'sawtooth', 0.12); tono(90, 0.3, 'square', 0.08, 0.05); },
    salto() { tono(380, 0.16, 'sine', 0.08); tono(560, 0.14, 'sine', 0.06, 0.07); },
    desliza() { tono(300, 0.18, 'sawtooth', 0.04); },
    portal() { [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.3, 'triangle', 0.12, i * 0.09)); },
    gana() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tono(f, 0.4, 'triangle', 0.13, i * 0.12)); }
  };

  // ───────────────────────── preguntas ─────────────────────────
  function distractores(c, T, n) {
    const cand = [c + T, c - T, c + 1, c - 1, c + 2, c - 2, c + 10, c - 10, (T + 1) * n, (T - 1) * n, T * (n + 1), T * (n - 1)];
    if (c > 9) cand.push(+String(c).split('').reverse().join(''));
    const out = [];
    mez(cand).forEach(v => { if (out.length < 2 && v > 0 && v !== c && out.indexOf(v) < 0) out.push(v); });
    while (out.length < 2) { const v = c + RI(-12, 12); if (v > 0 && v !== c && out.indexOf(v) < 0) out.push(v); }
    return out;
  }
  function textoCadena(T, n) {
    if (n <= 2 || Math.random() < 0.35) return T + ' × ' + n + ' = ?';
    const ini = Math.max(1, n - 3), s = []; for (let k = ini; k < n; k++) s.push(T * k);
    return s.join(' · ') + ' · ?';
  }

  // ───────────────────────── juego ─────────────────────────
  function iniciar(o) {
    o = o || {};
    precargar();
    const ET = []; TABLAS.forEach(T => { ET.push({ tipo: 'cadena', T }); ET.push({ tipo: 'caza', T }); });
    const marco = document.getElementById('marco'), cv = document.getElementById('cv'), ctx = cv.getContext('2d');
    const heroe = o.heroe === 'kage' ? 'kage' : 'sakura';
    const HM = heroe === 'kage' ? window.ANTAREZ_MANIFEST : window.SAKURA_EVE_MANIFEST;
    const fr = n => (HM && HM.animations && HM.animations[n] && HM.animations[n].frames) || [];
    if (HM) ['run', 'jump', 'slide', 'hurt', 'win'].forEach(n => fr(n).forEach(f => IMG(HM.base + f.file)));
    const kHeroe = (fr('run')[0] ? CFG.ALTURA_HEROE / fr('run')[0].h : 1);

    let S = null, raf = 0, ultimo = 0, vivo = true;
    const ov = document.createElement('div'); ov.id = 'ov'; marco.appendChild(ov);
    const bPausa = document.createElement('button'); bPausa.id = 'bPausa'; bPausa.type = 'button'; bPausa.textContent = '⏸'; marco.appendChild(bPausa);
    const bMudo = document.createElement('button'); bMudo.id = 'bMudo'; bMudo.type = 'button'; bMudo.textContent = '🔊'; marco.appendChild(bMudo);

    // ── ajuste de pantalla: columna 9:16 centrada (PC) o pantalla completa en vertical (celular) ──
    let q = 1, esc = 1;
    function ajustar() {
      const iw = window.innerWidth, ih = window.innerHeight;
      esc = Math.min(iw / W, ih / H);
      marco.style.width = Math.floor(W * esc) + 'px'; marco.style.height = Math.floor(H * esc) + 'px';
      marco.style.setProperty('--u', esc + 'px');
      q = clamp(esc * Math.min(window.devicePixelRatio || 1, 2), 0.6, 2.2);
      cv.width = Math.round(W * q); cv.height = Math.round(H * q);
      cv.style.width = '100%'; cv.style.height = '100%';
    }
    function vigilarGiro() {
      const mal = tactil() && innerWidth > innerHeight && innerHeight < 640;
      const g = document.getElementById('girar'); if (g) g.classList.toggle('on', mal);
      if (mal && S && S.corriendo && !S.pausa) pausar(true);
      return mal;
    }
    window.addEventListener('resize', () => { ajustar(); vigilarGiro(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { ajustar(); vigilarGiro(); }, 250));
    ajustar();

    function intentarPantallaCompleta() {
      if (!tactil()) return;
      const el = document.documentElement, rf = el.requestFullscreen || el.webkitRequestFullscreen;
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {}); } catch (e) {} };
      try { if (rf && !document.fullscreenElement) { const p = rf.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(lock); else lock(); } else lock(); } catch (e) { lock(); }
    }

    // ───────────────────────── estado ─────────────────────────
    function nuevo() {
      return { dist: 0, v: CFG.VEL0, px: 1, tl: 1, jh: 0, jv: 0, jt: 0, slide: 0, inv: 0, hurt: 0, vidas: CFG.VIDAS, items: [], deco: [], filas: [], parts: [], toasts: [],
        racha: 0, mejorRacha: 0, puntos: 0, aciertos: 0, errores: 0, golpes: 0, fallosSeg: 0, cazadas: 0, cazaOk: 0, repasos: [], fallos: {}, hudE: 0, cadena: [],
        sp: { e: 0, r: 0, nextD: 34, fase: 'fila', extra: null, ultLane: -1, decoD: 8 }, hist: [], tAnim: 0, shake: 0, flash: 0, banner: { txt: ET[0].tipo === 'cadena' ? 'Tabla del ' + ET[0].T + ' · Cadena' : '', t: 2.6 },
        corriendo: false, pausa: false, fin: false, cae: 0, t: 0 };
    }

    // ───────────────────────── generador de filas ─────────────────────────
    function nuevaLane(s) { let l; do { l = RI(0, 2); } while (l === s.sp.ultLane && Math.random() < 0.7); s.sp.ultLane = l; return l; }
    function filaCadena(e, n, repaso) {
      const T = e.T, c = T * n, cl = nuevaLane(S), d = S.sp.nextD, vals = distractores(c, T, n), lanes = [0, 1, 2], row = { d, tipo: 'cadena', T, n, c, res: false, hint: S.fallosSeg >= 2, repaso: !!repaso, q: repaso ? T + ' × ' + n + ' = ?' : textoCadena(T, n), pasada: false };
      lanes.forEach(l => S.items.push({ k: 'orb', d, lane: l, val: l === cl ? c : vals.pop(), ok: l === cl, row, tomado: false }));
      S.filas.push(row); return row;
    }
    function filaCaza(e) {
      const T = e.T, d = S.sp.nextD, m = Math.random() < 0.55 ? 1 : 2, mult = []; for (let k = 2; k <= 10; k++) mult.push(T * k);
      mez(mult); const lanes = mez([0, 1, 2]), esM = lanes.slice(0, m), row = { d, tipo: 'caza', T, res: false, q: 'Recoge SOLO los múltiplos del ' + T, pasada: false, buenos: m, tomados: 0 };
      lanes.forEach(l => {
        let v; if (esM.indexOf(l) >= 0) v = mult.pop(); else { const base = T * RI(2, 10); const off = [1, 2, -1, -2, 3][RI(0, 4)]; v = base + off; if (v % T === 0 || v < 3) v = base + 1; }
        S.items.push({ k: 'orb', d, lane: l, val: v, ok: esM.indexOf(l) >= 0, row, tomado: false });
      });
      S.filas.push(row); S.cazaTotal = (S.cazaTotal || 0) + m; return row;
    }
    function obstaculos(dFila, e) {
      const prob = e.tipo === 'caza' ? 0.6 : 0.42 + 0.06 * Math.floor(S.sp.e / 2); if (Math.random() > prob) return;
      const lanes = mez([0, 1, 2]), cuantos = (S.sp.e >= 2 && Math.random() < 0.4) ? 2 : 1, d = dFila + CFG.GAP * 0.5;
      for (let i = 0; i < cuantos; i++) S.items.push({ k: 'obs', tipo: Math.random() < 0.5 ? 'bajo' : 'alto', d, lane: lanes[i], skin: Math.random() < 0.5 ? 'barril' : 'caja', roto: false });
    }
    function portal(d, e, final) {
      const sig = ET[S.sp.e + 1];
      S.items.push({ k: 'portal', d, final: !!final, txt: final ? '¡META!' : (sig.tipo === 'cadena' ? 'Tabla del ' + sig.T : 'Caza de múltiplos del ' + sig.T), pasado: false, sigE: S.sp.e + 1 });
    }
    function generar() {
      const sp = S.sp;
      while (!sp.fin && sp.nextD < S.dist + ZMAX) {
        const e = ET[sp.e];
        if (sp.fase === 'portal') {
          const ultima = sp.e === ET.length - 1; portal(sp.nextD, e, ultima); sp.nextD += 30;
          if (ultima) { sp.fin = true; break; } sp.e++; sp.r = 0; sp.extra = null; sp.fase = 'fila'; continue;
        }
        const d0 = sp.nextD;
        if (e.tipo === 'cadena') {
          if (sp.r === CFG.FILAS_CAD && sp.extra == null) sp.extra = Math.min(2, S.repasos.length);
          if (sp.r < CFG.FILAS_CAD) filaCadena(e, sp.r + 1, false);
          else if (sp.r < CFG.FILAS_CAD + (sp.extra || 0)) { const f = S.repasos.shift(); if (f) filaCadena({ T: f.T }, f.n, true); }
          else { sp.fase = 'portal'; continue; }
        } else {
          if (sp.r < CFG.FILAS_CAZA) filaCaza(e); else { sp.fase = 'portal'; continue; }
        }
        obstaculos(d0, e); sp.r++; sp.nextD += CFG.GAP;
      }
      // decorado a los lados (según el tema de la etapa que se está generando)
      while (sp.decoD < S.dist + ZMAX) {
        const tema = TEMAS[Math.min(2, Math.floor(sp.e / 2))], lado = Math.random() < 0.5 ? -1 : 1, set = ART[tema.deco];
        S.deco.push({ d: sp.decoD, off: lado * R(2.1, 3.4), img: set[RI(0, set.length - 1)], h: tema.deco === 'farolPiedra' ? R(190, 250) : R(300, 420) });
        if (Math.random() < 0.5) S.deco.push({ d: sp.decoD + R(1, 4), off: -lado * R(2.1, 3.4), img: set[RI(0, set.length - 1)], h: tema.deco === 'farolPiedra' ? R(190, 250) : R(300, 420) });
        sp.decoD += R(4.5, 7);
      }
    }

    // ───────────────────────── reglas ─────────────────────────
    function toast(txt, color, t) { S.toasts.push({ txt, color: color || '#fff', t: t || 1.3, t0: t || 1.3 }); if (S.toasts.length > 3) S.toasts.shift(); }
    function chispas(x, y, col, n) { for (let i = 0; i < n; i++) S.parts.push({ x, y, vx: R(-220, 220), vy: R(-300, 60), life: R(0.4, 0.9), t: 0, c: col, r: R(3, 7) }); }
    function guardaFallo(T, n) { const k = T + 'x' + n; S.fallos[k] = (S.fallos[k] || 0) + 1; if (!S.repasos.some(f => f.T === T && f.n === n)) S.repasos.push({ T, n }); }
    function recoge(it, x, y) {
      const row = it.row; it.tomado = true; row.res = true;
      if (row.tipo === 'cadena') {
        if (it.ok) {
          S.aciertos++; S.racha++; S.fallosSeg = 0; S.mejorRacha = Math.max(S.mejorRacha, S.racha); S.puntos += 10 + Math.min(S.racha, 10) * 2;
          if (!row.repaso) S.cadena.push(it.val); sfx.bien(S.racha - 1); chispas(x, y, '#ffe27a', 16);
          if (S.racha === 3 || S.racha === 6 || S.racha === 10) toast('¡Racha de ' + S.racha + '! 🥷 sombras', '#7dffb0', 1.6);
          else toast(['¡Bien!', '¡Eso es!', '¡Perfecto!', '¡Genial!'][RI(0, 3)], '#7dffb0', 0.9);
        } else {
          S.errores++; S.racha = 0; S.fallosSeg++; guardaFallo(row.T, row.n); sfx.casi(); chispas(x, y, '#9aa3c7', 10);
          toast('Casi… ' + row.T + ' × ' + row.n + ' = ' + row.c, '#ffd18a', 1.8);
        }
      } else {
        S.cazaOk = S.cazaOk || 0;
        if (it.ok) { S.cazadas++; row.tomados++; S.racha++; S.mejorRacha = Math.max(S.mejorRacha, S.racha); S.puntos += 15; S.aciertos++; sfx.bien(S.racha - 1); chispas(x, y, '#ffe27a', 14); toast('¡Múltiplo!', '#7dffb0', 0.8); row.res = row.tomados >= row.buenos; }
        else { S.errores++; S.racha = 0; sfx.casi(); chispas(x, y, '#9aa3c7', 10); toast(it.val + ' no está en la tabla del ' + row.T, '#ffd18a', 1.6); }
      }
    }
    function golpe() {
      if (S.inv > 0) return; S.vidas--; S.golpes++; S.inv = CFG.INV; S.hurt = 0.55; S.shake = 0.35; S.flash = 0.35; S.racha = 0; sfx.golpe();
      chispas(W / 2 + (S.px - 1) * LW, PY - 80, '#ff6a6a', 18);
      if (S.vidas <= 0) { S.cae = 1.6; toast('¡Tranquilo! Repetimos la etapa', '#ffd18a', 1.6); }
    }
    function reaparecer() {
      const e = S.hudE; S.items = []; S.filas = []; S.cadena = []; S.vidas = CFG.VIDAS; S.racha = 0; S.fallosSeg = 0; S.inv = 2.2; S.cae = 0;
      S.sp.e = e; S.sp.r = 0; S.sp.fase = 'fila'; S.sp.extra = null; S.sp.fin = false; S.sp.nextD = S.dist + 30; S.banner = { txt: ET[e].tipo === 'cadena' ? 'Tabla del ' + ET[e].T + ' · Cadena' : 'Caza de múltiplos del ' + ET[e].T, t: 2 };
    }
    function accion(a) {
      if (!S || !S.corriendo || S.pausa || S.fin || S.cae > 0) return;
      if (a === 'izq') S.tl = Math.max(0, S.tl - 1);
      else if (a === 'der') S.tl = Math.min(2, S.tl + 1);
      else if (a === 'salta') { if (S.jh <= 1) { S.jv = 900; S.jt = 0; S.slide = 0; sfx.salto(); } }
      else if (a === 'baja') { if (S.jh > 1) S.jv = -1500; else if (S.slide <= 0) { S.slide = 0.75; sfx.desliza(); } }
    }

    // ───────────────────────── actualización ─────────────────────────
    function paso(dt) {
      if (!S || !S.corriendo || S.pausa) return;
      dt = Math.min(dt, 0.05); S.t += dt;
      if (S.fin) return;
      if (S.cae > 0) { S.cae -= dt; S.v = Math.max(2, S.v - 20 * dt); if (S.cae <= 0) reaparecer(); }
      else S.v = Math.min(CFG.VEL_MAX, CFG.VEL0 + CFG.VEL_SUBE * S.hudE * 1.4 + Math.max(0, S.racha - 4) * 0.02);
      S.dist += S.v * dt; S.tAnim += dt * (S.v / CFG.VEL0);
      S.px += clamp(S.tl - S.px, -dt * 9, dt * 9);
      if (S.jh > 0 || S.jv > 0) { S.jt += dt; S.jv -= 2700 * dt; S.jh += S.jv * dt; if (S.jh <= 0) { S.jh = 0; S.jv = 0; } }
      if (S.slide > 0) S.slide -= dt; if (S.inv > 0) S.inv -= dt; if (S.hurt > 0) S.hurt -= dt; if (S.shake > 0) S.shake -= dt; if (S.flash > 0) S.flash -= dt;
      S.hist.push({ t: S.t, px: S.px }); while (S.hist.length && S.hist[0].t < S.t - 1.4) S.hist.shift();
      generar();
      const jugando = S.cae <= 0;
      for (const it of S.items) {
        const z = it.d - S.dist;
        if (it.k === 'orb' && !it.tomado && !it.row.res && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) recoge(it, W / 2 + (it.lane - 1) * LW, yz(0) - 120);
        else if (it.k === 'obs' && !it.roto && jugando && Math.abs(z) < 0.6 && Math.abs(S.px - it.lane) < 0.55) {
          const esquiva = it.tipo === 'bajo' ? S.jh > 70 : S.slide > 0;
          if (!esquiva) { it.roto = true; golpe(); }
        } else if (it.k === 'portal' && !it.pasado && z < 0) {
          it.pasado = true;
          if (it.final) { terminar(); } else { S.hudE = it.sigE; S.cadena = []; S.fallosSeg = 0; const e = ET[S.hudE]; S.banner = { txt: e.tipo === 'cadena' ? 'Tabla del ' + e.T + ' · Cadena' : 'Caza de múltiplos del ' + e.T, t: 2.4 }; S.puntos += 50; sfx.portal(); chispas(W / 2, 330, '#ffe27a', 30); }
        }
      }
      // filas que pasaron sin que se recogiera nada
      for (const f of S.filas) {
        if (!f.pasada && f.d - S.dist < -1.8) {
          f.pasada = true;
          if (!f.res && f.tipo === 'cadena' && jugando) { guardaFallo(f.T, f.n); S.racha = 0; toast('Era ' + f.c + ' (' + f.T + ' × ' + f.n + ')', '#ffd18a', 1.6); }
        }
      }
      S.items = S.items.filter(i => i.d - S.dist > -5); S.deco = S.deco.filter(i => i.d - S.dist > -6); S.filas = S.filas.filter(f => f.d - S.dist > -12);
      for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; } S.parts = S.parts.filter(p => p.t < p.life);
      for (const t of S.toasts) t.t -= dt; S.toasts = S.toasts.filter(t => t.t > 0);
      if (S.banner && S.banner.t > 0) S.banner.t -= dt;
    }

    // ───────────────────────── dibujo ─────────────────────────
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function spr(img, off, z, hh, alpha) {
      if (!listo(img)) return; const p = pz(z); if (p <= 0 || z < -4) return;
      const x = W / 2 + off * LW * p - (S.px - 1) * LW * p * 0.0, y = yz(z), ht = hh * p, wd = ht * img.naturalWidth / img.naturalHeight;
      ctx.globalAlpha = (alpha == null ? 1 : alpha) * clamp((ZMAX - z) / 26, 0, 1); ctx.drawImage(img, x - wd / 2, y - ht, wd, ht); ctx.globalAlpha = 1;
    }
    function fondo(tema) {
      let g = ctx.createLinearGradient(0, 0, 0, HOR + 20); g.addColorStop(0, tema.cielo[0]); g.addColorStop(1, tema.cielo[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR + 20);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 26; i++) { const sx = (i * 197) % W, sy = (i * 83) % (HOR - 60); ctx.fillRect(sx, sy, 2, 2); }
      const mg = ctx.createRadialGradient(410, 120, 6, 410, 120, 90); mg.addColorStop(0, 'rgba(255,248,214,.95)'); mg.addColorStop(0.25, 'rgba(255,240,190,.5)'); mg.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = mg; ctx.fillRect(310, 20, 200, 200);
      ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.arc(410, 120, 26, 0, 7); ctx.fill();
      const m = IMG(ART.montanas); if (listo(m)) { const hh = 200, ww = hh * m.naturalWidth / m.naturalHeight, off = -((S.dist * 0.5 + (S.px - 1) * 30) % ww); ctx.globalAlpha = 0.85; for (let x = off - ww; x < W; x += ww) ctx.drawImage(m, x, HOR - hh + 16, ww, hh); ctx.globalAlpha = 1; }
      g = ctx.createLinearGradient(0, HOR, 0, H); g.addColorStop(0, tema.pasto[0]); g.addColorStop(1, tema.pasto[1]); ctx.fillStyle = g; ctx.fillRect(0, HOR + 8, W, H - HOR);
    }
    function camino(tema) {
      const paso = 4;
      for (let y = HOR + 8; y < H; y += paso) {
        const p = (y - HOR) / (PY - HOR); if (p <= 0.01) continue; const z = Z0 * (1 / p - 1), par = Math.floor((z + S.dist) / 5) % 2 === 0, w = RW * p;
        ctx.fillStyle = par ? tema.c1 : tema.c2; ctx.fillRect(W / 2 - w, y, w * 2, paso + 1);
        ctx.fillStyle = tema.borde; ctx.globalAlpha = 0.55; ctx.fillRect(W / 2 - w - 3 * p - 1, y, 3 * p + 2, paso + 1); ctx.fillRect(W / 2 + w - 1, y, 3 * p + 2, paso + 1); ctx.globalAlpha = 1;
        if (par) { ctx.fillStyle = 'rgba(255,255,255,.22)'; const lw = Math.max(1, 3 * p); ctx.fillRect(W / 2 - LW * p * 0.5 - lw / 2, y, lw, paso + 1); ctx.fillRect(W / 2 + LW * p * 0.5 - lw / 2, y, lw, paso + 1); }
      }
    }
    function orbe(it, z) {
      const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z) - (80 + Math.sin(S.t * 3 + it.lane) * 6) * p, r = 62 * p, row = it.row;
      let a = clamp((ZMAX - z) / 26, 0, 1); if (it.tomado) return; if (row.res) a *= 0.3; ctx.globalAlpha = a;
      const pulso = (row.hint && it.ok && !row.res) ? 1 + 0.12 * Math.sin(S.t * 8) : 1;
      const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.7 * pulso); g.addColorStop(0, 'rgba(255,226,122,.85)'); g.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.7 * pulso, 0, 7); ctx.fill();
      const b = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); b.addColorStop(0, '#fffbe8'); b.addColorStop(1, '#ffc65a'); ctx.fillStyle = b; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.lineWidth = Math.max(1.5, 5 * p); ctx.strokeStyle = (row.hint && it.ok && !row.res) ? '#58ff9a' : '#c2701c'; ctx.stroke();
      ctx.fillStyle = '#3a1d05'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * (String(it.val).length > 2 ? 0.95 : 1.15)) + 'px ' + FUENTE; ctx.fillText(it.val, x, y + r * 0.04); ctx.globalAlpha = 1;
    }
    function obstaculo(it, z) {
      if (it.roto) return; const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z);
      if (it.tipo === 'bajo') { spr(IMG(it.skin === 'barril' ? ART.barril : ART.caja), it.lane - 1, z, 120); if (z < 40 && z > 2) { ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffe27a'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬆', x, y - 150 * p); ctx.globalAlpha = 1; } }
      else { const im = IMG(ART.torii); if (listo(im)) { const ht = 215 * p, wd = LW * 1.05 * p; ctx.globalAlpha = clamp((ZMAX - z) / 26, 0, 1); ctx.drawImage(im, x - wd / 2, y - ht, wd, ht); ctx.globalAlpha = 1; } if (z < 40 && z > 2) { ctx.fillStyle = '#7fe3ff'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬇', x, y - 235 * p); } }
    }
    function portalDib(it, z) {
      const p = pz(z), im = IMG(ART.portal), y = yz(z); if (!listo(im) || z < -3) return;
      const wd = RW * 2.05 * p, ht = wd * im.naturalHeight / im.naturalWidth, x = W / 2; ctx.globalAlpha = clamp((ZMAX - z) / 26, 0, 1); ctx.drawImage(im, x - wd / 2, y - ht, wd, ht);
      const bw = wd * 0.8, bh = 46 * p * 1.6, by = y - ht - bh * 0.55; ctx.fillStyle = 'rgba(20,10,40,.88)'; rr(x - bw / 2, by, bw, bh, 12 * p); ctx.fill(); ctx.lineWidth = 3 * p; ctx.strokeStyle = '#ffe27a'; ctx.stroke();
      ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.fillText(it.txt, x, by + bh / 2); ctx.globalAlpha = 1;
    }
    function pintaHeroe(x, y, k, estado, flip, alpha) {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 4, 54 * k / kHeroe * 0.35 + 30, 11, 0, 0, 7); ctx.fill();
      let lista = estado === 'hurt' ? fr('hurt') : estado === 'slide' ? fr('slide') : estado === 'jump' ? fr('jump') : (estado === 'win' ? fr('win') : fr('run')), idx = 0;
      if (!lista.length) lista = fr('run');
      if (lista.length) {
        const A = HM.animations; if (estado === 'run') idx = Math.floor(S.tAnim * (A.run.fps || 14) * 0.55) % lista.length;
        else if (estado === 'jump') idx = clamp(Math.floor(clamp(S.jt / 0.7, 0, 0.99) * lista.length), 0, lista.length - 1);
        else if (estado === 'slide') idx = Math.min(lista.length - 1, Math.floor((0.75 - S.slide) * 14)); else idx = Math.floor(S.t * 10) % lista.length;
        const f = lista[idx], im = IMG(HM.base + f.file);
        if (listo(im)) { ctx.scale(flip ? -1 : 1, 1); ctx.drawImage(im, -f.ax * k, -f.ay * k, f.w * k, f.h * k); }
      } else { ctx.font = '120px serif'; ctx.textAlign = 'center'; ctx.fillText('🥷', 0, -20); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function dibujaHeroes() {
      const hx = W / 2 + (S.px - 1) * LW, hy = PY - S.jh, est = S.hurt > 0 ? 'hurt' : S.jh > 1 ? 'jump' : S.slide > 0 ? 'slide' : 'run', flip = S.tl < S.px - 0.15, parpadeo = S.inv > 0 && Math.floor(S.t * 14) % 2 === 0;
      const nClones = Math.min(4, Math.floor(S.racha / 2));
      for (let i = nClones; i >= 1; i--) {
        const h = S.hist.find(e => e.t >= S.t - 0.16 * i - 0.05) || S.hist[0], pxc = h ? h.px : S.px, lado = i % 2 ? -1 : 1;
        pintaHeroe(W / 2 + (pxc - 1) * LW + lado * (46 + 22 * Math.floor(i / 2)), PY - 6 - 10 * i, kHeroe * (0.8 - 0.03 * i), 'run', flip, 0.4);
      }
      if (!parpadeo) pintaHeroe(hx, hy, kHeroe, est, flip, 1);
    }
    function boton(txt, x, y, w, h) { ctx.fillStyle = 'rgba(15,8,40,.8)'; rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); }
    function hud() {
      let g = ctx.createLinearGradient(0, 0, 0, 215); g.addColorStop(0, 'rgba(8,4,24,.78)'); g.addColorStop(1, 'rgba(8,4,24,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 215);
      const hi = IMG(ART.corazon); for (let i = 0; i < CFG.VIDAS; i++) { ctx.globalAlpha = i < S.vidas ? 1 : 0.22; if (listo(hi)) ctx.drawImage(hi, 0, 0, 200, 175, 16 + i * 46, 14, 44, 38); else { ctx.fillStyle = '#ff5a7a'; ctx.font = '34px serif'; ctx.fillText('♥', 16 + i * 46, 44); } } ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe27a'; ctx.font = 'bold 26px ' + FUENTE; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('⭐ ' + S.puntos, W - 128, 33);
      const e = ET[S.hudE], tema = TEMAS[Math.min(2, Math.floor(S.hudE / 2))];
      ctx.textAlign = 'center'; ctx.fillStyle = tema.borde; ctx.font = 'bold 19px ' + FUENTE; ctx.fillText((e.tipo === 'cadena' ? '⛓ CADENA' : '🎯 CAZA') + ' · TABLA DEL ' + e.T + ' · ' + tema.nombre.toUpperCase(), W / 2, 80);
      const row = S.filas.find(f => !f.res && f.d - S.dist > -1.5) || S.filas[S.filas.length - 1];
      ctx.fillStyle = 'rgba(15,8,40,.82)'; rr(24, 94, W - 48, 84, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,226,122,.7)'; ctx.stroke();
      const txt = row ? row.q : (e.tipo === 'cadena' ? '¡Prepárate!' : '¡Prepárate!'); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + (txt.length > 18 ? 34 : 46) + 'px ' + FUENTE; ctx.fillText(txt, W / 2, 138);
      if (e.tipo === 'cadena') { for (let i = 0; i < CFG.FILAS_CAD; i++) { const on = i < S.cadena.length; ctx.fillStyle = on ? '#ffe27a' : 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(W / 2 + (i - 4.5) * 34, 198, on ? 9 : 7, 0, 7); ctx.fill(); } }
      else { ctx.fillStyle = '#d7d4ee'; ctx.font = 'bold 20px ' + FUENTE; ctx.fillText('Múltiplos recogidos: ' + (S.cazaDe || 0) + ' en esta etapa', W / 2, 198); }
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px ' + FUENTE; ctx.fillText('Racha ' + S.racha + (S.racha >= 2 ? '   🥷×' + Math.min(4, Math.floor(S.racha / 2)) : ''), 18, H - 22);
      // avisos
      S.toasts.forEach((t, i) => { const a = clamp(t.t / 0.35, 0, 1) * clamp((t.t0 - t.t) / 0.1 + 0.2, 0, 1); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = 'bold 36px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.9)'; const ty = 370 + i * 48 - (t.t0 - t.t) * 22; ctx.strokeText(t.txt, W / 2, ty); ctx.fillStyle = t.color; ctx.fillText(t.txt, W / 2, ty); ctx.globalAlpha = 1; });
      if (S.banner && S.banner.t > 0) { const a = clamp(S.banner.t / 0.4, 0, 1); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = 'bold 44px ' + FUENTE; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.strokeText(S.banner.txt, W / 2, 470); ctx.fillStyle = '#ffe27a'; ctx.fillText(S.banner.txt, W / 2, 470); ctx.globalAlpha = 1; }
      if (S.flash > 0) { ctx.fillStyle = 'rgba(255,40,40,' + (S.flash * 0.9) + ')'; ctx.fillRect(0, 0, W, H); }
    }
    function dibuja() {
      ctx.setTransform(q, 0, 0, q, 0, 0); ctx.clearRect(0, 0, W, H);
      if (!S) { ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, W, H); return; }
      const tema = TEMAS[Math.min(2, Math.floor(S.hudE / 2))];
      ctx.save(); if (S.shake > 0) ctx.translate(R(-6, 6) * S.shake * 3, R(-6, 6) * S.shake * 3);
      fondo(tema); camino(tema);
      const cola = []; S.deco.forEach(d => cola.push({ z: d.d - S.dist, f: () => spr(IMG(d.img), d.off, d.d - S.dist, d.h) }));
      S.items.forEach(it => { const z = it.d - S.dist; if (z > -4 && z < ZMAX) cola.push({ z, f: () => it.k === 'orb' ? orbe(it, z) : it.k === 'obs' ? obstaculo(it, z) : portalDib(it, z) }); });
      cola.sort((a, b) => b.z - a.z); let heroeHecho = false;
      cola.forEach(c => { if (!heroeHecho && c.z < 0) { dibujaHeroes(); heroeHecho = true; } c.f(); }); if (!heroeHecho) dibujaHeroes();
      S.parts.forEach(p => { ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.restore(); hud();
    }
    function bucle(t) {
      if (!vivo) return; raf = requestAnimationFrame(bucle); const dt = (t - ultimo) / 1000; ultimo = t;
      if (S) { S.cazaDe = S.filas.length ? S.cazadas - (S.cazaBase || 0) : S.cazadas; paso(isFinite(dt) && dt > 0 ? dt : 0); } dibuja();
    }

    // ───────────────────────── pantallas ─────────────────────────
    function pantalla(html, clase) { ov.className = clase || ''; ov.innerHTML = html; ov.style.display = html ? 'flex' : 'none'; }
    function inicio() {
      S = nuevo(); S.cazaBase = 0;
      pantalla('<h1>CARRERA DE LOS FAROLILLOS</h1><p>Corre hacia el fondo y recoge el farolillo con la <b>respuesta correcta</b> de las tablas del <b>7, 8 y 9</b>.</p>' +
        '<div class="reglas"><span>⛓ Cadenas: 7 · 14 · 21 · ?</span><span>🎯 Caza: solo los múltiplos</span><span>🥷 La racha crea sombras</span><span>💛 Si fallas, solo se repasa</span></div>' +
        '<p class="ctl">' + (tactil() ? 'Desliza ← → para cambiar de carril, ↑ para saltar (barriles), ↓ para deslizarte (arcos).' : 'Flechas ← → cambian de carril · ↑ salta los barriles · ↓ te desliza bajo los arcos · P pausa · M sonido.') + '</p>' +
        '<button id="go" type="button">▶ JUGAR</button>');
      document.getElementById('go').onclick = () => { intentarPantallaCompleta(); try { ac() && ac().resume && ac().resume(); } catch (e) {} pantalla(''); S.corriendo = true; S.banner.t = 2.6; vigilarGiro(); };
    }
    function pausar(forzar) {
      if (!S || !S.corriendo || S.fin) return; if (S.pausa && !forzar) { S.pausa = false; pantalla(''); return; } if (S.pausa) return; S.pausa = true;
      pantalla('<h1>PAUSA</h1><button id="seg" type="button">▶ SEGUIR</button><button id="sal" type="button" class="sec">⟵ SALIR</button>', 'pausa');
      document.getElementById('seg').onclick = () => { if (!vigilarGiro()) { S.pausa = false; pantalla(''); } };
      document.getElementById('sal').onclick = () => salir();
    }
    function salir() { vivo = false; cancelAnimationFrame(raf); if (o.onSalir) o.onSalir(); }
    function terminar() {
      S.fin = true; sfx.gana(); const tot = S.aciertos + S.errores, prec = tot ? S.aciertos / tot : 1, est = prec >= 0.9 && S.golpes <= 2 ? 3 : prec >= 0.75 ? 2 : 1;
      const dificiles = Object.keys(S.fallos).sort((a, b) => S.fallos[b] - S.fallos[a]).slice(0, 4).map(k => k.replace('x', ' × '));
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel3 = p.nivel3 || {}; p.nivel3.completado = true; p.nivel3.mejor = Math.max(p.nivel3.mejor || 0, S.puntos); p.nivel3.estrellas = Math.max(p.nivel3.estrellas || 0, est); p.nivel3.intentos = (p.nivel3.intentos || 0) + 1; p.nivel3.fallos = S.fallos; p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aciertos; p.estadisticas.errores += S.errores; }); } catch (e) {} }
      pantalla('<h1>¡NIVEL COMPLETADO!</h1><div class="estrellas">' + '⭐'.repeat(est) + '<span style="opacity:.25">' + '⭐'.repeat(3 - est) + '</span></div>' +
        '<p>Puntos: <b>' + S.puntos + '</b> · Aciertos: <b>' + S.aciertos + '</b> · Mejor racha: <b>' + S.mejorRacha + '</b></p>' + (dificiles.length ? '<p>Para repasar: <b>' + dificiles.join(' · ') + '</b></p>' : '<p>¡Sin tablas difíciles! 🏆</p>') +
        '<button id="otra" type="button">↻ JUGAR OTRA VEZ</button><button id="sal2" type="button" class="sec">⟵ SALIR</button>', 'fin');
      document.getElementById('otra').onclick = () => { inicio(); };
      document.getElementById('sal2').onclick = () => salir();
    }

    // ───────────────────────── controles ─────────────────────────
    window.addEventListener('keydown', e => {
      const k = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') accion('izq'); else if (k === 'ArrowRight' || k === 'd' || k === 'D') accion('der');
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') accion('salta'); else if (k === 'ArrowDown' || k === 's' || k === 'S') accion('baja');
      else if (k === 'p' || k === 'P' || k === 'Escape') pausar(); else if (k === 'm' || k === 'M') alternarSonido();
    });
    let t0 = null;
    marco.addEventListener('touchstart', e => { if (e.target.closest('button')) return; const t = e.changedTouches[0]; t0 = { x: t.clientX, y: t.clientY, hecho: false }; e.preventDefault(); }, { passive: false });
    marco.addEventListener('touchmove', e => {
      if (!t0 || t0.hecho) return; const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, u = 26; e.preventDefault();
      if (Math.abs(dx) > u && Math.abs(dx) > Math.abs(dy)) { accion(dx < 0 ? 'izq' : 'der'); t0.hecho = true; } else if (Math.abs(dy) > u) { accion(dy < 0 ? 'salta' : 'baja'); t0.hecho = true; }
    }, { passive: false });
    marco.addEventListener('touchend', () => { t0 = null; });
    function alternarSonido() { mudo = !mudo; bMudo.textContent = mudo ? '🔇' : '🔊'; }
    bPausa.onclick = () => pausar(); bMudo.onclick = alternarSonido;
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(true); });

    inicio(); vigilarGiro(); raf = requestAnimationFrame(bucle);
    return { paso, accion, estado: () => S, dibuja, CFG, ET };
  }

  window.Nivel3 = { iniciar };
})();
