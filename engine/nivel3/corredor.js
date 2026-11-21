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
  const CFG = { VEL0: 9, VEL_SUBE: 0.25, VEL_MAX: 11.5, VIDAS: 3, INV: 1.8, ALTURA_HEROE: 215, RAMPA: 46, ESPERA: 9, VPLAZA: 3.2, PREG_TABLA: 6, PREG_MUNDO: 3 };
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
    fuego: [P + 'lights/fire_brazier_c.png', P + 'lights/stone_lantern_d.png', P + 'lights/stone_lantern_small_e.png'],
    cristal: [P + 'crystals/crystal_blue_d.png', P + 'crystals/crystal_purple_a.png', P + 'crystals/crystal_purple_b.png', P + 'crystals/crystal_purple_c.png'],
    trueno: [P + 'crystals/crystal_spire_c.png', P + 'decor/rock_pillar_e.png', P + 'crystals/crystal_purple_b.png'],
    corazon: 'assets/ui/hud/animados/corazon_latido.png'
  };
  const UI0 = 'assets/ui/hud/';
  Object.assign(ART, { medallon: UI0 + 'marcos/medallon_marco.png', insignia: UI0 + 'marcos/insignia_nivel.png', barra: UI0 + 'extras/barra_ornamental_azul_dorada.png', moneda: UI0 + 'animados/moneda_girando.png', clon: 'assets/ui/poderes/clone.png',
    esqSI: UI0 + 'pantalla/esquina_roja_sup_izq.png', esqSD: UI0 + 'pantalla/esquina_roja_sup_der.png', esqII: UI0 + 'pantalla/esquina_roja_inf_izq.png', esqID: UI0 + 'pantalla/esquina_roja_inf_der.png',
    retratos: ['sakura', 'antarez'].reduce((a, n) => a.concat(['normal', 'herido', 'radiante'].map(e => UI0 + 'retratos/' + n + '_' + e + '.png')), []) });
  const cache = {};
  function IMG(src) { let i = cache[src]; if (!i) { i = new Image(); i.src = src; cache[src] = i; } return i; }
  const listo = i => i && i.complete && i.naturalWidth > 0;
  function precargar() { Object.keys(ART).forEach(k => [].concat(ART[k]).forEach(IMG)); TEMAS.forEach(t => IMG(BG + t.bg + '.png')); }
  const BG = 'assets/environment/backgrounds/themes/';

  // ───────────────────────── temas por tabla ─────────────────────────
  const TEMAS = [
    { nombre: 'Bosque de Bambú', cielo: ['#120a2e', '#3b2a6d'], pasto: ['#0b2a2a', '#12413b'], c1: '#3d3560', c2: '#463e6c', borde: '#7fe3c4', niebla: '#4b5a9c', deco: 'bambu', amb: 0, bg: 'montanas_jungle', dh: [300, 420] },
    { nombre: 'Jardín de Sakura', cielo: ['#2a0c3a', '#8a3d7a'], pasto: ['#35193d', '#5a2a5c'], c1: '#5a3a63', c2: '#664270', borde: '#ffb3d9', niebla: '#b9609f', deco: 'sakura', amb: 1, bg: 'montanas_water', dh: [300, 420] },
    { nombre: 'Aldea de Farolillos', cielo: ['#0a0a2a', '#1d2a6b'], pasto: ['#10142e', '#1a2550'], c1: '#2f3558', c2: '#38406a', borde: '#ffd27a', niebla: '#33458a', deco: 'farolPiedra', amb: 0, bg: 'montanas_night', dh: [190, 250] },
    { nombre: 'Camino de Fuego', cielo: ['#2a0a0a', '#a8431f'], pasto: ['#2d1410', '#4d2316'], c1: '#5b3a32', c2: '#684239', borde: '#ffc36b', niebla: '#d9692f', deco: 'fuego', amb: 2, bg: 'montanas_lava', dh: [190, 250] },
    { nombre: 'Cristales de Hielo', cielo: ['#0b1740', '#2f7fbf'], pasto: ['#0d2a4a', '#16507a'], c1: '#3e5f88', c2: '#486c98', borde: '#9ee8ff', niebla: '#6fb4e6', deco: 'cristal', amb: 0, bg: 'montanas_ice', dh: [200, 300] },
    { nombre: 'Cumbres del Trueno', cielo: ['#0e0a22', '#4a3a7a'], pasto: ['#1a1230', '#2f2150'], c1: '#4a3f6e', c2: '#554a7c', borde: '#ffe27a', niebla: '#6b5aa8', deco: 'trueno', amb: 2, bg: 'montanas_storm', dh: [200, 300] }
  ];
  const hexA = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c, a) => a == null ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')' : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  TEMAS.forEach(t => { t.rc1 = hexA(t.c1); t.rc2 = hexA(t.c2); t.rb = hexA(t.borde); t.rn = hexA(t.niebla); });

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
    moneda(r) { tono(988 + (r % 6) * 90, 0.09, 'triangle', 0.07); },
    plaza() { tono(660, 0.25, 'sine', 0.08); tono(880, 0.3, 'sine', 0.06, 0.1); },
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

  // preguntas del nivel: 6 por tabla, de fácil a difícil, con 3 formatos (sin tiempo límite)
  function construir() {
    const np = +(new URLSearchParams(location.search).get('n')); if (np >= 3 && np <= 9) CFG.PREG_TABLA = np;
    const out = [], tipos = ['mult', 'mult', 'sigue', 'mult', 'multiplo', 'sigue'];
    TABLAS.forEach(T => {
      const ns = mez([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, CFG.PREG_TABLA).sort((a, b) => a - b);
      ns.forEach((n, i) => out.push({ T, n, tipo: tipos[i % tipos.length], inv: Math.random() < 0.4 }));
    });
    return out;
  }
  function textoPregunta(q) {
    const T = q.T, n = q.n;
    if (q.tipo === 'sigue') return T * (n - 3) + ' · ' + T * (n - 2) + ' · ' + T * (n - 1) + ' · ?';
    if (q.tipo === 'multiplo') return '¿Cuál es múltiplo de ' + T + '?';
    return '¿Cuánto es ' + (q.inv ? n + ' × ' + T : T + ' × ' + n) + '?';
  }
  function secuencia(T, n) { const a = []; for (let k = Math.max(1, n - 4); k <= n; k++) a.push(T * k); return a.join(' · '); }
  function distMult(c, T) { const o = []; mez([c + 1, c - 1, c + 2, c - 2, c + 3, c - 3, c + 4, c - 4]).forEach(v => { if (o.length < 2 && v > 0 && v % T !== 0 && o.indexOf(v) < 0) o.push(v); }); return o; }

  // ───────────────────────── juego ─────────────────────────
  function iniciar(o) {
    o = o || {};
    precargar();
    const PREGS = construir();
    // voz opcional: nivel3.html?voz=1 (o tecla V). Lee la pregunta al llegar a la plaza.
    let voz = /[?&]voz=1/.test(location.search || '');
    function textoVoz(r) { const T = r.T, n = r.n; return r.tipo === 'sigue' ? 'Qué número sigue. ' + [T * (n - 3), T * (n - 2), T * (n - 1)].join(', ') : r.tipo === 'multiplo' ? 'Cuál es múltiplo de ' + T : 'Cuánto es ' + (r.q0.inv ? n + ' por ' + T : T + ' por ' + n); }
    function hablar(r) { try { if (!voz || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(textoVoz(r)); u.lang = 'es-CO'; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) { } }
    const marco = document.getElementById('marco'), cv = document.getElementById('cv'), ctx = cv.getContext('2d');
    const heroe = o.heroe === 'kage' ? 'kage' : 'sakura';
    const HM = heroe === 'kage' ? window.ANTAREZ_MANIFEST : window.SAKURA_EVE_MANIFEST;
    const fr = n => (HM && HM.animations && HM.animations[n] && HM.animations[n].frames) || [];
    if (HM) ['run', 'jump', 'slide', 'hurt', 'win'].forEach(n => fr(n).forEach(f => IMG(HM.base + f.file)));
    // Sakura se dibuja DE ESPALDA (cuadros nuevos); Kage conserva los cuadros de lado hasta tener los suyos
    const HB = (heroe === 'sakura' && window.NIVEL3_SAKURA_ESPALDA) || null;
    const fb = n => (HB && HB.animations[n] && HB.animations[n].frames) || [];
    if (HB) Object.keys(HB.animations).forEach(n => fb(n).forEach(f => IMG(HB.base + f.file)));
    const kHeroe = HB ? CFG.ALTURA_HEROE / HB.refH : (fr('run')[0] ? CFG.ALTURA_HEROE / fr('run')[0].h : 1);

    let S = null, raf = 0, ultimo = 0, vivo = true;
    const ov = document.createElement('div'); ov.id = 'ov'; marco.appendChild(ov);
    const bPausa = document.createElement('button'); bPausa.id = 'bPausa'; bPausa.type = 'button'; bPausa.textContent = ''; marco.appendChild(bPausa);
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
        racha: 0, mejorRacha: 0, puntos: 0, aciertos: 0, errores: 0, golpes: 0, fallosSeg: 0, cazadas: 0, cazaOk: 0, repasos: [], fallos: {}, hudE: 0, cadena: [], monedas: 0, mundo: 0, qpas: 0, zp: 0, cortes: [{ d: 0, m: 0 }],
        plaza: false, espera: false, listo: false, filaAct: null, alegre: 0, alegreT: 0, pista: null, iman: 0, escudo: 0, vuelo: 0, vueloD: 0, mAc: 0, mFa: 0, tutor: false, malSeg: 0,
        sp: { nextD: 30, qi: 0, tr: 0, mundo: 0, patM: false, cieloM: false, ultLane: -1, decoD: 8 }, skate: 0, hist: [], tAnim: 0, shake: 0, flash: 0, banner: null, amb: [], rings: [], polvo: [], lineas: [], temaF: 0, polvoT: 0, flashB: 0,
        corriendo: false, pausa: false, fin: false, cae: 0, t: 0 };
    }

    // ───────────────────────── generador: carrera libre + plaza de pregunta ─────────────────────────
    function nuevaLane(s) { let l; do { l = RI(0, 2); } while (l === s.sp.ultLane && Math.random() < 0.7); s.sp.ultLane = l; return l; }
    function moneda(d, lane, h) { S.items.push({ k: 'coin', d, lane, h: h || 0, tomada: false }); }
    function obs(d, lane, tipo) { S.items.push({ k: 'obs', tipo, d, lane, skin: Math.random() < 0.5 ? 'barril' : 'caja', roto: false }); }
    function filaPregunta(q, repaso) {
      const T = q.T, n = q.n, c = T * n, d = S.sp.nextD, cl = nuevaLane(S), vals = q.tipo === 'multiplo' ? distMult(c, T) : distractores(c, T, n);
      const row = { d, tipo: q.tipo, T, n, c, q0: q, res: false, hint: !!repaso, repaso: !!repaso, pasada: false, plaza: true, q: textoPregunta(q) };
      [0, 1, 2].forEach(l => S.items.push({ k: 'orb', d, lane: l, val: l === cl ? c : vals.pop(), ok: l === cl, row, tomado: false }));
      S.filas.push(row); return row;
    }
    // un tramo de carrera libre: monedas en líneas, arcos y zigzag, con obstáculos que dan monedas si los esquivas
    function patrones(d0, len, tipo) {
      if (tipo === 'cielo') {
        S.items.push({ k: 'nube', d: d0 + 4, hasta: d0 + len - 4, pasado: false });
        for (let i = 0; i < 40; i++) { const dd = d0 + 12 + i * 2.2; if (dd > d0 + len - 6) break; moneda(dd, Math.round(1 + Math.sin(i * 0.5)), 120 + (i % 3) * 14); if (i % 4 === 0) { moneda(dd, 0, 135); moneda(dd, 2, 135); } }
        return d0 + len;
      }
      let d = d0 + 6; const suave = tipo === 'suave', pat = tipo === 'pat';
      if (pat) { S.items.push({ k: 'pat', d, lane: RI(0, 2), tomado: false }); d += 14; }
      while (d < d0 + len) {
        const lane = nuevaLane(S), r = Math.random(); let usado = 18;
        if (pat) { obs(d, lane, Math.random() < 0.5 ? 'bajo' : 'alto'); for (let i = 1; i <= 4; i++) moneda(d + i * 2.4, lane, 0); usado = 14; }
        else if (r < 0.3 || (suave && r >= 0.75)) { for (let i = 0; i < 6; i++) moneda(d + i * 2.6, lane, 0); }
        else if (r < 0.55) { const H = [0, 60, 105, 130, 105, 60, 0]; for (let i = 0; i < 7; i++) moneda(d + i * 2.4, lane, H[i]); }
        else if (r < 0.75) { const Z = [0, 1, 2, 1, 0, 1, 2]; for (let i = 0; i < 7; i++) moneda(d + i * 3, Z[i], 0); usado = 22; }
        else if (r < 0.9) { obs(d + 7, lane, 'bajo'); const H = [0, 70, 120, 140, 120, 70, 0]; for (let i = 0; i < 7; i++) moneda(d + 2 + i * 1.6, lane, H[i]); usado = 20; }
        else { obs(d + 6, lane, 'alto'); for (let i = 0; i < 5; i++) moneda(d + 2 + i * 2.4, lane, 0); }
        d += usado + 8;
      }
      return d;
    }
    function portal(d, m, final) { S.items.push({ k: 'portal', d, final: !!final, txt: final ? '¡META!' : '¡Nuevo mundo!', pasado: false, sigM: m }); }
    function generar() {
      const sp = S.sp;
      while (!sp.fin && sp.nextD < S.dist + ZMAX) {
        if (sp.qi >= PREGS.length) { portal(sp.nextD, 0, true); sp.nextD += 30; sp.fin = true; break; }
        if (sp.tr >= CFG.PREG_MUNDO) { const m = Math.min(TEMAS.length - 1, sp.mundo + 1); portal(sp.nextD, m, false); S.cortes.push({ d: sp.nextD, m }); sp.mundo = m; sp.tr = 0; sp.patM = false; sp.cieloM = false; sp.nextD += 24; continue; }
        const tipo = sp.qi === 0 ? 'suave' : (sp.tr === 1 && !sp.patM) ? 'pat' : (sp.tr === 2 && !sp.cieloM) ? 'cielo' : 'normal'; if (tipo === 'pat') sp.patM = true; if (tipo === 'cielo') sp.cieloM = true;
        const len = tipo === 'pat' ? 115 : tipo === 'cielo' ? 100 : tipo === 'suave' ? 80 : R(90, 115), d0 = sp.nextD; if (tipo === 'normal' && Math.random() < 0.55) S.items.push({ k: 'caja', d: d0 + 3, lane: RI(0, 2), tomado: false }); const dFin = patrones(d0, len, tipo);
        const doorD = Math.max(dFin, d0 + len) + CFG.RAMPA + 6; sp.nextD = doorD;
        const rep = S.repasos.find(x => x.espera <= 0); let q, esRep = false;
        if (rep) { S.repasos.splice(S.repasos.indexOf(rep), 1); q = rep.q; esRep = true; } else { q = PREGS[sp.qi++]; sp.tr++; S.repasos.forEach(x => x.espera--); }
        S.items.push({ k: 'portal', d: doorD - 26, final: false, arco: true, txt: '¡Pregunta!', pasado: false });
        filaPregunta(q, esRep); sp.nextD = doorD + 18;
      }
      // decorado a los lados, según el mundo en que esté esa parte de la pista
      while (sp.decoD < S.dist + ZMAX) {
        let m = 0; for (const c of S.cortes) if (c.d <= sp.decoD) m = c.m;
        const tema = TEMAS[m], set = ART[tema.deco], lado = Math.random() < 0.5 ? -1 : 1, dh = tema.dh;
        S.deco.push({ d: sp.decoD, off: lado * R(2.1, 3.4), img: set[RI(0, set.length - 1)], h: R(dh[0], dh[1]) });
        if (Math.random() < 0.5) S.deco.push({ d: sp.decoD + R(1, 4), off: -lado * R(2.1, 3.4), img: set[RI(0, set.length - 1)], h: R(dh[0], dh[1]) });
        sp.decoD += R(4.5, 7);
      }
    }

    // ───────────────────────── reglas ─────────────────────────
    function toast(txt, color, t) { S.toasts.push({ txt, color: color || '#fff', t: t || 1.3, t0: t || 1.3 }); if (S.toasts.length > 3) S.toasts.shift(); }
    function chispas(x, y, col, n) { for (let i = 0; i < n; i++) S.parts.push({ x, y, vx: R(-220, 220), vy: R(-300, 60), life: R(0.4, 0.9), t: 0, c: col, r: R(3, 7) }); }
    function guardaFallo(row) {
      const k = row.T + 'x' + row.n; S.fallos[k] = (S.fallos[k] || 0) + 1;
      if (!row.repaso && !S.repasos.some(x => x.q.T === row.T && x.q.n === row.n)) S.repasos.push({ q: row.q0, espera: 1 });
    }
    function recoge(it, x, y) {
      const row = it.row; it.tomado = true; row.res = true; if (!row.repaso) S.qpas++;
      if (!row.repaso) { if (it.ok) S.mAc++; else S.mFa++; }
      S.malSeg = it.ok ? 0 : S.malSeg + 1;
      if (it.ok) {
        S.aciertos++; S.racha++; S.mejorRacha = Math.max(S.mejorRacha, S.racha); const gan = row.repaso ? 3 : 5 + Math.min(S.racha, 5);
        S.monedas += gan; S.puntos += 10 + Math.min(S.racha, 10) * 2; S.alegre = 1.1; S.alegreT = S.t; S.pista = null;
        sfx.bien(S.racha - 1); chispas(x, y, '#ffe27a', 28); chispas(x, y, '#ffffff', 10); anillo(x, y, '#ffd35a', 1.3); S.flashB = Math.max(S.flashB, 0.12);
        if (S.racha % 3 === 0) { S.items.push({ k: 'pat', d: row.d + 8, lane: S.tl, tomado: false }); toast('¡' + S.racha + ' seguidas! 🛹 ¡Premio!', '#7dffb0', 1.8); }
        else toast(['¡Bien!', '¡Eso es!', '¡Perfecto!', '¡Genial!'][RI(0, 3)] + ' +' + gan + ' 🪙', '#7dffb0', 1.2);
      } else {
        S.errores++; S.racha = 0; guardaFallo(row); sfx.casi(); chispas(x, y, '#9aa3c7', 10); anillo(x, y, '#9aa3c7', 0.7);
        S.pista = { txt: secuencia(row.T, row.n), t: 5 }; toast('Casi… ' + row.T + ' × ' + row.n + ' = ' + row.c, '#ffd18a', 2);
      }
    }
    function golpe() {
      if (S.inv > 0) return;
      if (S.escudo > 0) { S.escudo = 0; S.inv = 1; sfx.bien(3); chispas(W / 2 + (S.px - 1) * LW, PY - 100, '#9ad7ff', 24); anillo(W / 2 + (S.px - 1) * LW, PY - 100, '#9ad7ff', 1.2); toast('🛡 ¡El escudo te protegió!', '#9ad7ff', 1.4); return; }
      S.vidas--; S.golpes++; S.inv = CFG.INV; S.hurt = 0.55; S.shake = 0.35; S.flash = 0.35; sfx.golpe();
      chispas(W / 2 + (S.px - 1) * LW, PY - 80, '#ff6a6a', 18);
      if (S.vidas <= 0) { S.cae = 1.2; toast('¡Tranquilo! Seguimos', '#ffd18a', 1.6); }
    }
    function reaparecer() { S.vidas = CFG.VIDAS; S.inv = 2.5; S.cae = 0; }
    function accion(a) {
      if (!S || !S.corriendo || S.pausa || S.fin || S.cae > 0) return;
      if (S.plaza && !S.listo) S.listo = true; // en la plaza, cualquier gesto significa «ya elegí, seguimos»
      if (a === 'listo') return;
      if (S.vuelo > 0 && a !== 'izq' && a !== 'der') return;
      if (a === 'izq') { if (S.tl > 0) S.cambio = { dir: -1, t: 0.3 }; S.tl = Math.max(0, S.tl - 1); }
      else if (a === 'der') { if (S.tl < 2) S.cambio = { dir: 1, t: 0.3 }; S.tl = Math.min(2, S.tl + 1); }
      else if (a === 'salta') { if (S.jh <= 1) { S.jv = S.skate > 0 ? 1060 : 900; S.jt = 0; S.slide = 0; sfx.salto(); } }
      else if (a === 'baja') { if (S.jh > 1) S.jv = -1500; else if (S.slide <= 0) { S.slide = 0.75; sfx.desliza(); } }
    }

    // ───────────────────────── actualización ─────────────────────────
    function paso(dt) {
      if (!S || !S.corriendo || S.pausa) return;
      dt = Math.min(dt, 0.05); S.t += dt;
      if (S.fin) {
        if (S.celeb != null) S.px += clamp(1 - S.px, -dt * 3, dt * 3);
        for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; } S.parts = S.parts.filter(p => p.t < p.life); for (const r of S.rings) r.t += dt; S.rings = S.rings.filter(r => r.t < r.dur);
        if (S.celeb != null && S.t - S.celeb < 2.3) { S.confT = (S.confT || 0) - dt; if (S.confT <= 0) { S.confT = 0.22; const cx = W / 2 + (S.px - 1) * LW; chispas(cx + R(-60, 60), PY - 230, ['#ffe27a', '#ff9ad5', '#7dffb0', '#9ad7ff'][RI(0, 3)], 14); } }
        return;
      }
      // la pista se frena sola al llegar a la plaza de pregunta y espera (sin reloj) hasta que el niño decida
      const fila = S.filas.find(f => !f.res && !f.pasada), dz = fila ? fila.d - S.dist : 999;
      if (fila !== S.filaAct) { S.filaAct = fila; S.listo = false; if (fila && S.malSeg >= 2 && !fila.hint) { fila.hint = true; toast('💡 Mira la puerta verde', '#bff5d0', 2.2); } }
      S.plaza = !!fila && dz < CFG.RAMPA; S.espera = S.plaza && dz <= CFG.ESPERA + 0.3 && !S.listo;
      if (S.plaza && fila && !fila.habl) { fila.habl = true; hablar(fila); }
      S.zp += ((S.plaza ? 1 : 0) - S.zp) * Math.min(1, dt * 3);
      const base = Math.min(CFG.VEL_MAX, CFG.VEL0 + CFG.VEL_SUBE * S.mundo + Math.max(0, S.racha - 4) * 0.02); let vObj = base;
      if (S.plaza) { const k = clamp((dz - CFG.ESPERA) / (CFG.RAMPA - CFG.ESPERA), 0, 1); vObj = CFG.VPLAZA + (base - CFG.VPLAZA) * k; if (dz <= CFG.ESPERA + 0.3) vObj = S.listo ? CFG.VPLAZA + 1.4 : 0; }
      if (S.cae > 0) { S.cae -= dt; S.v = Math.max(0, S.v - 20 * dt); if (S.cae <= 0) reaparecer(); }
      else S.v += clamp(vObj - S.v, -16 * dt, 7 * dt);
      S.dist += S.v * dt; S.tAnim += dt * (Math.max(S.v, S.espera ? 5 : 0) / CFG.VEL0);
      S.px += clamp(S.tl - S.px, -dt * 9, dt * 9);
      if (S.vuelo > 0) { S.jh = 135 + Math.sin(S.t * 4) * 12; S.jv = 0; if (S.dist >= S.vueloD) { S.vuelo = 0; toast('¡Aterrizaje!', '#9ad7ff', 1); sfx.salto(); } }
      else if (S.jh > 0 || S.jv > 0) { S.jt += dt; S.jv -= 2700 * dt; S.jh += S.jv * dt; if (S.jh <= 0) { S.jh = 0; S.jv = 0; } }
      if (S.cambio && S.cambio.t > 0) S.cambio.t -= dt;
      if (S.skate > 0 && !S.plaza) { S.skate -= dt; if (S.skate <= 0) { S.skate = 0; toast('Se acabó la patineta', '#ffd18a', 1.2); } }
      if (S.slide > 0) S.slide -= dt; if (S.inv > 0) S.inv -= dt; if (S.hurt > 0) S.hurt -= dt; if (S.shake > 0) S.shake -= dt; if (S.flash > 0) S.flash -= dt;
      if (!S.plaza) { if (S.iman > 0) S.iman -= dt; if (S.escudo > 0) S.escudo -= dt; }
      if (S.alegre > 0) S.alegre -= dt; if (S.pista) { S.pista.t -= dt; if (S.pista.t <= 0) S.pista = null; }
      S.hist.push({ t: S.t, px: S.px }); while (S.hist.length && S.hist[0].t < S.t - 1.4) S.hist.shift();
      if (!S.tutor && S.t > 3.4) { S.tutor = true; toast(tactil() ? 'Desliza ← → para juntar monedas' : 'Usa ← → para juntar monedas', '#ffffff', 3); }
      efectos(dt); generar();
      const jugando = S.cae <= 0;
      for (const it of S.items) {
        const z = it.d - S.dist;
        if (it.k === 'orb' && !it.tomado && !it.row.res && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) recoge(it, W / 2 + (it.lane - 1) * LW, yz(0) - 120);
        else if (it.k === 'coin' && !it.tomada && jugando && Math.abs(z) < 1.1 && Math.abs(S.px - it.lane) < (S.iman > 0 ? 1.7 : 0.6) && (S.iman > 0 || Math.abs(S.jh - it.h) < 85)) {
          it.tomada = true; { const g = S.racha >= 3 ? 2 : 1; S.monedas += g; S.puntos += g; } sfx.moneda(S.monedas); chispas(W / 2 + (it.lane - 1) * LW, PY - 60 - it.h, '#ffd35a', 5);
        }
        else if (it.k === 'obs' && !it.roto && jugando && Math.abs(z) < 0.6 && Math.abs(S.px - it.lane) < 0.55) {
          const esquiva = it.tipo === 'bajo' ? S.jh > 70 : S.slide > 0;
          if (!esquiva) { it.roto = true; if (S.skate > 0) { S.puntos += 5; S.monedas += 2; sfx.bien(2); chispas(W / 2 + (it.lane - 1) * LW, PY - 90, '#ff9ad5', 16); anillo(W / 2 + (it.lane - 1) * LW, PY - 90, '#ffb3e6', 0.8); toast('¡Crash! +2 🪙', '#ff9ad5', 0.7); } else golpe(); }
        } else if (it.k === 'pat' && !it.tomado && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) {
          it.tomado = true; S.skate = 8; S.puntos += 20; sfx.portal(); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#ff9ad5', 26); anillo(W / 2 + (it.lane - 1) * LW, PY - 100, '#ffd35a', 1.3); toast('🛹 ¡Patineta ninja!', '#ff9ad5', 1.8);
        } else if (it.k === 'caja' && !it.tomado && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) {
          it.tomado = true; const qi = (S.iman <= 0 && (S.escudo > 0 || Math.random() < 0.5)); S.puntos += 15; sfx.portal(); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#c9a0ff', 26); anillo(W / 2 + (it.lane - 1) * LW, PY - 100, '#e0c8ff', 1.3);
          if (qi) { S.iman = 10; toast('🧲 ¡Imán de monedas!', '#c9a0ff', 1.8); } else { S.escudo = 12; toast('🛡 ¡Escudo!', '#9ad7ff', 1.8); }
        } else if (it.k === 'nube' && !it.pasado && z < 0.5) {
          it.pasado = true; S.vuelo = 1; S.vueloD = it.hasta; S.skate = 0; sfx.portal(); chispas(W / 2, PY - 120, '#ffffff', 30); anillo(W / 2, PY - 120, '#9ad7ff', 1.6); toast('☁️ ¡Tabla voladora!', '#9ad7ff', 2);
        } else if (it.k === 'portal' && !it.pasado && z < 0) {
          it.pasado = true;
          if (it.arco) { sfx.plaza(); chispas(W / 2, 330, '#9ad7ff', 14); }
          else {
            const est = S.mFa === 0 ? 3 : S.mFa === 1 ? 2 : 1, bono = 10 + est * 5; S.monedas += bono; S.puntos += bono * 2; S.mAc = 0; S.mFa = 0;
            toast('🎁 ' + '⭐'.repeat(est) + ' +' + bono + ' 🪙', '#ffe27a', 2.6); chispas(W / 2, 420, '#ffe27a', 30);
            if (it.final) { terminar(); return; }
            S.mundo = it.sigM; ponBanner(S.mundo, PREGS[Math.min(PREGS.length - 1, S.qpas)].T, 3); S.puntos += 50; S.flashB = 0.5; sfx.portal(); chispas(W / 2, 330, '#ffe27a', 30); anillo(W / 2, 420, '#fff3b0', 1.6); }
        }
      }
      // filas que pasaron sin que se recogiera nada
      for (const f of S.filas) {
        if (!f.pasada && f.d - S.dist < -1.8) {
          f.pasada = true;
          if (!f.res && jugando) { f.res = true; guardaFallo(f); S.racha = 0; toast('Era ' + f.c + ' (' + f.T + ' × ' + f.n + ')', '#ffd18a', 1.6); }
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
    // ───────────────────────── efectos y atmósfera ─────────────────────────
    const cacheBg = []; let vineta = null;
    const UI = 'assets/ui/hud/';
    const easeBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    function temaIdx() { return S.mundo; }
    function ponBanner(m, T, t) { S.banner = { s: TEMAS[m].nombre, sub: '¡Ahora la tabla del ' + T + '!', T, t: t || 2.6, t0: t || 2.6 }; }
    function anillo(x, y, c, esc) { S.rings.push({ x, y, c, esc: esc || 1, t: 0, dur: 0.6 }); }
    function nuevaAmb(p, inicial) {
      const t = TEMAS[temaIdx()].amb; p.tipo = t; p.t = 0; p.ph = R(0, 6.3); p.life = R(5, 10);
      if (t === 0) { p.x = R(20, W - 20); p.y = R(HOR + 30, PY); p.vx = R(-12, 12); p.vy = R(-10, 10); p.r = R(2, 3.6); }
      else if (t === 1) { p.x = R(0, W); p.y = inicial ? R(-20, H * 0.8) : -20; p.vx = R(10, 40); p.vy = R(40, 90); p.r = R(5, 9); p.rot = R(0, 6.3); }
      else { p.x = R(0, W); p.y = inicial ? R(HOR, H) : H + 10; p.vx = R(-14, 14); p.vy = -R(40, 110); p.r = R(1.6, 3.2); }
    }
    function efectos(dt) {
      S.ema = (S.ema || 0.0167) * 0.95 + dt * 0.05; S.slowT = S.ema > 0.026 ? (S.slowT || 0) + dt : 0; if (S.slowT > 1.5) S.lite = true;
      const ob = temaIdx(); S.temaF += clamp(ob - S.temaF, -dt * 0.45, dt * 0.45); if (S.flashB > 0) S.flashB -= dt;
      const n = S.lite ? 10 : 26; while (S.amb.length < n) { const p = {}; nuevaAmb(p, true); S.amb.push(p); } if (S.amb.length > n) S.amb.length = n;
      for (const p of S.amb) {
        p.t += dt; p.ph += dt * 2.2; p.x += p.vx * dt + Math.sin(p.ph) * (p.tipo === 1 ? 30 : 10) * dt; p.y += p.vy * dt + (p.tipo === 0 ? Math.cos(p.ph * 0.7) * 10 * dt : 0); if (p.tipo === 1) p.rot += dt * 2;
        if (p.t > p.life || p.y < -30 || p.y > H + 30 || p.x < -30 || p.x > W + 30 || (p.tipo !== TEMAS[ob].amb && p.t > 1.5)) nuevaAmb(p, false);
      }
      S.polvoT -= dt; if (S.polvoT <= 0 && S.cae <= 0 && S.jh <= 1) { S.polvoT = S.slide > 0 ? 0.025 : 0.07; const hx = W / 2 + (S.px - 1) * LW; S.polvo.push({ x: hx + R(-16, 16), y: PY - 2 + R(-3, 3), vx: R(-35, 35), vy: R(-70, -25), life: R(0.35, 0.6), t: 0, r: R(6, 12) }); }
      for (const p of S.polvo) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 14; } S.polvo = S.polvo.filter(p => p.t < p.life);
      for (const r of S.rings) r.t += dt; S.rings = S.rings.filter(r => r.t < r.dur);
      const n2 = S.lite ? 0 : 16; while (S.lineas.length < n2) S.lineas.push({ a: 0, r: R(60, 900), l: 100, reset: true }); if (S.lineas.length > n2) S.lineas.length = n2;
      for (const l of S.lineas) { if (l.reset || l.r > 1100) { l.a = Math.PI / 2 + (Math.random() < 0.5 ? -1 : 1) * R(0.42, 1.1); l.r = R(80, 260); l.l = R(70, 170); l.reset = false; } l.r += (650 + S.v * 80) * dt; }
    }
    function cacheTema(i) {
      if (cacheBg[i]) return cacheBg[i]; const c = document.createElement('canvas'); c.width = W + 120; c.height = H + 120; const x = c.getContext('2d'), t = TEMAS[i], hy = HOR + 60;
      let g = x.createLinearGradient(0, 0, 0, hy + 20); g.addColorStop(0, t.cielo[0]); g.addColorStop(1, t.cielo[1]); x.fillStyle = g; x.fillRect(0, 0, c.width, hy + 20);
      x.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 40; k++) { const sx = (k * 197) % c.width, sy = (k * 83) % (hy - 90); x.fillRect(sx, sy, k % 5 === 0 ? 3 : 2, k % 5 === 0 ? 3 : 2); }
      const mg = x.createRadialGradient(470, 180, 6, 470, 180, 100); mg.addColorStop(0, 'rgba(255,248,214,.95)'); mg.addColorStop(0.25, 'rgba(255,240,190,.5)'); mg.addColorStop(1, 'rgba(255,240,190,0)'); x.fillStyle = mg; x.fillRect(360, 70, 220, 220);
      x.fillStyle = '#fff6d6'; x.beginPath(); x.arc(470, 180, 26, 0, 7); x.fill();
      g = x.createLinearGradient(0, hy, 0, c.height); g.addColorStop(0, t.pasto[0]); g.addColorStop(1, t.pasto[1]); x.fillStyle = g; x.fillRect(0, hy + 8, c.width, c.height - hy);
      cacheBg[i] = c; return c;
    }
    function fondoDib(ta, tb, f) {
      ctx.drawImage(cacheTema(ta), -60, -60); if (f > 0.01 && tb !== ta) { ctx.globalAlpha = f; ctx.drawImage(cacheTema(tb), -60, -60); ctx.globalAlpha = 1; }
      [[ta, 0.85], [tb, f * 0.85]].forEach(c => { if (c[1] <= 0.01 || (c[0] === ta && false)) return; const m = IMG(BG + TEMAS[c[0]].bg + '.png'); if (!listo(m)) return; const hh = 200, ww = hh * m.naturalWidth / m.naturalHeight, off = -((S.dist * 0.5 + (S.px - 1) * 30) % ww); ctx.globalAlpha = c[1]; for (let x = off - ww; x < W + 60; x += ww) ctx.drawImage(m, x, HOR - hh + 16, ww, hh); ctx.globalAlpha = 1; });
    }
    function camino(Tm) {
      const paso = S.lite ? 6 : 4; let prev = null;
      for (let y = HOR + 8; y < H; y += paso) {
        const p = (y - HOR) / (PY - HOR); if (p <= 0.01) continue; const z = Z0 * (1 / p - 1), par = Math.floor((z + S.dist) / 5) % 2 === 0, w = RW * p, ff = clamp(1 - p * 1.9, 0, 0.7);
        ctx.fillStyle = rgb(mix(par ? Tm.c1 : Tm.c2, Tm.niebla, ff)); ctx.fillRect(W / 2 - w, y, w * 2, paso + 1);
        const cw = 15 * p + 1.5, fino = Math.max(1, 2.5 * p);
        ctx.fillStyle = rgb(mix(par ? [150, 140, 170] : [118, 108, 140], Tm.niebla, ff)); ctx.fillRect(W / 2 - w - cw, y, cw, paso + 1); ctx.fillRect(W / 2 + w, y, cw, paso + 1);
        ctx.fillStyle = rgb(mix(Tm.borde, Tm.niebla, ff), 0.75); ctx.fillRect(W / 2 - w - cw, y, fino, paso + 1); ctx.fillRect(W / 2 + w + cw - fino, y, fino, paso + 1);
        if (prev !== null && prev !== par) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(W / 2 - w, y, w * 2, Math.max(1, 2.2 * p)); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(W / 2 - w, y + Math.max(1, 2.2 * p), w * 2, Math.max(1, 1.2 * p)); }
        prev = par;
        if (par) { ctx.fillStyle = 'rgba(255,255,255,' + (0.22 * (1 - ff)) + ')'; const lw = Math.max(1, 3 * p); ctx.fillRect(W / 2 - LW * p * 0.5 - lw / 2, y, lw, paso + 1); ctx.fillRect(W / 2 + LW * p * 0.5 - lw / 2, y, lw, paso + 1); }
      }
    }
    function charcos() {
      if (S.lite) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const d of S.deco) {
        if (d.img.indexOf('/lights/') < 0) continue; const z = d.d - S.dist; if (z < -3 || z > 60) continue;
        const p = pz(z), x = W / 2 + d.off * LW * p, y = yz(z), rad = 190 * p, fl = 0.85 + 0.15 * Math.sin(S.t * 9 + d.d);
        ctx.save(); ctx.translate(x - Math.sign(d.off) * rad * 0.35, y); ctx.scale(1, 0.3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        g.addColorStop(0, 'rgba(255,190,100,' + (0.5 * fl * clamp((ZMAX - z) / 30, 0, 1)) + ')'); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(-rad, -rad, rad * 2, rad * 2); ctx.restore();
      }
      ctx.restore();
    }
    function niebla(Tm) { const g = ctx.createLinearGradient(0, HOR - 40, 0, HOR + 170); g.addColorStop(0, rgb(Tm.niebla, 0)); g.addColorStop(0.28, rgb(Tm.niebla, 0.62)); g.addColorStop(1, rgb(Tm.niebla, 0)); ctx.fillStyle = g; ctx.fillRect(-60, HOR - 40, W + 120, 210); }
    function brillo(x, y, r, col, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); }
    function postes(d) {
      const z = d - S.dist; if (z < -3) return; const p = pz(z), z2 = z + 8, p2 = pz(z2), a = clamp((ZMAX - z) / 26, 0, 1), idx = Math.round(d / 8);
      for (const lado of [-1, 1]) {
        const x = W / 2 + lado * (RW + 22) * p, y = yz(z), h = 58 * p, wd = 11 * p + 1, x2 = W / 2 + lado * (RW + 22) * p2, y2 = yz(z2), h2 = 58 * p2;
        ctx.globalAlpha = a; ctx.strokeStyle = '#6b3b22'; ctx.lineWidth = Math.max(1, 4 * p); ctx.beginPath(); ctx.moveTo(x, y - h * 0.72); ctx.lineTo(x2, y2 - h2 * 0.72); ctx.moveTo(x, y - h * 0.4); ctx.lineTo(x2, y2 - h2 * 0.4); ctx.stroke();
        ctx.fillStyle = '#8a4a2b'; ctx.fillRect(x - wd / 2, y - h, wd, h); ctx.fillStyle = '#c0392b'; ctx.fillRect(x - wd * 0.8, y - h - 6 * p, wd * 1.6, 7 * p); ctx.globalAlpha = 1;
        brillo(x, y - h - 6 * p, 30 * p + 2, '255,205,110', 0.6 * a * (0.8 + 0.2 * Math.sin(S.t * 7 + idx)));
      }
    }
    function orbe(it, z) {
      const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, bob = Math.sin(S.t * 3 + it.lane * 1.7) * 6, y = yz(z) - (100 + bob) * p, r = (it.row.plaza ? 76 : 66) * p, row = it.row;
      if (it.tomado) return; let a = clamp((ZMAX - z) / 26, 0, 1); if (row.res) a *= 0.3; if (z < 0) a *= clamp(1 + z / 0.9, 0, 1); if (a <= 0) return;
      const hint = row.hint && it.ok && !row.res, pulso = hint ? 1 + 0.12 * Math.sin(S.t * 8) : 1;
      if (!row.res && z > 0.4) brillo(x, yz(z), r * 1.9, hint && it.ok ? '90,255,150' : '110,190,255', 0.3 * a);
      if (!row.res && !S.lite && z < 34 && z > 1) { for (let k = 1; k <= 3; k++) { const z2 = z + k * 2.6, p2 = pz(z2); brillo(W / 2 + (it.lane - 1) * LW * p2, yz(z2) - (100 + bob) * p2, 66 * p2 * 0.85, '255,190,90', a * 0.28 / k); } }
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(60,30,10,.85)'; ctx.lineWidth = Math.max(1, 3 * p); ctx.beginPath(); ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x, y - r * 2.4); ctx.stroke();
      ctx.restore(); brillo(x, y, r * 2.2 * pulso, '255,185,80', 0.7 * a);
      ctx.save(); ctx.globalAlpha = a;
      const b = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.1); b.addColorStop(0, '#fff4c9'); b.addColorStop(0.55, '#ffa63d'); b.addColorStop(1, '#d4551c'); ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(x, y, r * 0.92, r * 1.08, 0, 0, 7); ctx.fill();
      ctx.lineWidth = Math.max(1, 3 * p); ctx.strokeStyle = '#8a2b0e'; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,40,10,.35)'; ctx.lineWidth = Math.max(1, 2 * p); ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r * 1.08, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 1.08, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#3a1a10'; ctx.strokeStyle = '#f0b43c'; ctx.lineWidth = Math.max(1, 2 * p); rr(x - r * 0.42, y - r * 1.2, r * 0.84, r * 0.24, r * 0.08); ctx.fill(); ctx.stroke(); rr(x - r * 0.42, y + r * 0.97, r * 0.84, r * 0.24, r * 0.08); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = Math.max(1, 4 * p); ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.lineTo(x, y + r * 1.75); ctx.stroke(); ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(x, y + r * 1.8, r * 0.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff7de'; ctx.strokeStyle = hint ? '#35e07a' : '#b8741c'; ctx.lineWidth = Math.max(1.5, (hint ? 4.5 : 2.5) * p); rr(x - r * 0.78, y - r * 0.44, r * 1.56, r * 0.88, r * 0.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a1d05'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * (String(it.val).length > 2 ? 0.66 : 0.8)) + 'px ' + FUENTE; ctx.fillText(it.val, x, y + r * 0.04);
      ctx.restore();
    }
    function obstaculo(it, z) {
      if (it.roto) return; const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z);
      ctx.fillStyle = 'rgba(0,0,0,.33)'; ctx.beginPath(); ctx.ellipse(x, y, LW * 0.42 * p, 12 * p, 0, 0, 7); ctx.fill();
      if (it.tipo === 'bajo') { spr(IMG(it.skin === 'barril' ? ART.barril : ART.caja), it.lane - 1, z, 120); if (z < 40 && z > 2) { ctx.fillStyle = '#ffe27a'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬆', x, y - 150 * p); } }
      else { const im = IMG(ART.torii); if (listo(im)) { const ht = 215 * p, wd = LW * 1.05 * p; ctx.globalAlpha = clamp((ZMAX - z) / 26, 0, 1); ctx.drawImage(im, x - wd / 2, y - ht, wd, ht); ctx.globalAlpha = 1; } if (z < 40 && z > 2) { ctx.fillStyle = '#7fe3ff'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬇', x, y - 235 * p); } }
    }
    function portalDib(it, z) {
      const p = pz(z), im = IMG(ART.portal), y = yz(z); if (!listo(im) || z < -3) return;
      const wd = RW * 2.05 * p, ht = wd * im.naturalHeight / im.naturalWidth, x = W / 2, a = clamp((ZMAX - z) / 26, 0, 1), col = it.final ? '255,226,120' : '170,230,255';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gs = ctx.createRadialGradient(x, y, 0, x, y, wd * 0.6); gs.addColorStop(0, 'rgba(' + col + ',' + (0.5 * a) + ')'); gs.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.save(); ctx.translate(0, 0); ctx.scale(1, 0.28); ctx.translate(0, y / 0.28 - y); ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(x, y, wd * 0.6, 0, 7); ctx.fill(); ctx.restore();
      const pul = 0.75 + 0.25 * Math.sin(S.t * 3), gb = ctx.createLinearGradient(0, y - ht, 0, 0); gb.addColorStop(0, 'rgba(' + col + ',' + (0.4 * a * pul) + ')'); gb.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gb; ctx.fillRect(x - wd * 0.28, 0, wd * 0.56, y - ht + 4); ctx.restore();
      ctx.globalAlpha = a; ctx.drawImage(im, x - wd / 2, y - ht, wd, ht);
      const bw = wd * 0.8, bh = 46 * p * 1.6, by = y - ht - bh * 0.55; ctx.fillStyle = 'rgba(20,10,40,.88)'; rr(x - bw / 2, by, bw, bh, 12 * p); ctx.fill(); ctx.lineWidth = 3 * p; ctx.strokeStyle = '#ffe27a'; ctx.stroke();
      ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.fillText(it.txt, x, by + bh / 2); ctx.globalAlpha = 1;
    }
    function cajaDib(it, z) {
      if (it.tomado || z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z) - (50 + 8 * Math.sin(S.t * 4 + it.d)) * p, r = 34 * p;
      brillo(x, y, r * 2.6, '190,140,255', 0.6 * a); ctx.globalAlpha = a; ctx.fillStyle = '#7a3fd0'; ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = Math.max(1.5, 3 * p); rr(x - r, y - r, r * 2, r * 2, r * 0.22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd35a'; ctx.fillRect(x - r * 0.14, y - r, r * 0.28, r * 2); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * 1.2) + 'px ' + FUENTE; ctx.fillText('?', x, y + r * 0.06); ctx.globalAlpha = 1;
    }
    function nubeDib(it, z) {
      if (it.pasado && z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2, y = yz(z), wd = RW * 2.1 * p; if (z < -3) return;
      brillo(x, y - 60 * p, wd * 0.55, '180,225,255', 0.5 * a); ctx.globalAlpha = a * 0.95; ctx.fillStyle = '#ffffff';
      for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.arc(x + k * wd / 9, y - (36 + (k % 2 ? 16 : 0)) * p, (30 + (4 - Math.abs(k)) * 4) * p, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#7fd0ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.fillText('☁️ TABLA VOLADORA', x, y - 120 * p); ctx.globalAlpha = 1;
    }
    function monedaDib(it, z) {
      if (it.tomada || z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), ln = (S.iman > 0 && Math.abs(it.lane - S.px) <= 1.7) ? it.lane + (S.px - it.lane) * clamp(1 - z / 16, 0, 1) : it.lane, x = W / 2 + (ln - 1) * LW * p, y = yz(z) - (46 + it.h) * p, r = 26 * p, mo = IMG(ART.moneda);
      brillo(x, y, r * 1.9, '255,210,90', 0.45 * a); ctx.globalAlpha = a;
      if (listo(mo)) ctx.drawImage(mo, (Math.floor(S.t * 10 + it.d * 0.7) % 6) * 160, 0, 160, 160, x - r, y - r, r * 2, r * 2); else { ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    function patDib(it, z) {
      if (it.tomado || z < -3) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z) - (46 + 10 * Math.sin(S.t * 5 + it.d)) * p;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(p, p);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 105); g.addColorStop(0, 'rgba(255,150,220,.65)'); g.addColorStop(1, 'rgba(255,150,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 105, 0, 7); ctx.fill(); ctx.restore();
      ctx.rotate(-0.14 + 0.06 * Math.sin(S.t * 4 + it.d));
      ctx.fillStyle = '#e2208f'; [-46, 46].forEach(wx => { ctx.beginPath(); ctx.arc(wx, 24, 12, 0, 7); ctx.fill(); ctx.strokeStyle = '#4a0b32'; ctx.lineWidth = 3; ctx.stroke(); });
      ctx.fillStyle = '#241238'; rr(-72, -14, 144, 30, 15); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd35a'; ctx.stroke();
      ctx.fillStyle = '#ff8fcf'; for (let i = 0; i < 5; i++) { const a2 = i * 1.2566; ctx.beginPath(); ctx.arc(Math.cos(a2) * 7, 1 + Math.sin(a2) * 7, 5, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 1, 3.4, 0, 7); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function pintaHeroeE(x, y, k, estado, alpha) {
      const clon = alpha != null && alpha < 1, sk = S.skate > 0 && !clon && estado !== 'hurt' && estado !== 'win'; let f, mir = false, inclina = true;
      if (estado === 'win') {
        const L = fb('celebra'), seq = [0, 1, 2, 3, 4, 5, 4, 5, 4, 5, 4, 5]; f = L[seq[Math.min(seq.length - 1, Math.floor((S.t - (S.celeb != null ? S.celeb : S.alegreT)) / 0.2))]]; inclina = false;
      } else if (estado === 'vuelo' && fb('jump').length > 4) { f = fb('jump')[4]; inclina = true;
      } else if (sk) { const L = fb('skate'); f = estado === 'jump' ? L[3] : estado === 'slide' ? L[5] : L[[0, 6, 4, 7][Math.floor(S.tAnim * 8) % 4]]; }
      else if (estado === 'run' && !clon && S.cambio && S.cambio.t > 0 && fb('carril').length >= 4) {
        const L = fb('carril'); f = L[[1, 2, 2, 3][Math.min(3, Math.floor((1 - S.cambio.t / 0.3) * 4))]]; mir = S.cambio.dir < 0; inclina = false; // las hojas se inclinan hacia la derecha; para la izquierda se voltean
      } else {
        const L = fb(estado === 'hurt' ? 'hurt' : estado === 'slide' ? 'roll' : estado === 'jump' ? 'jump' : 'run'), n = L.length; let i;
        if (estado === 'hurt') i = Math.floor(clamp((0.55 - S.hurt) / 0.55, 0, 0.99) * n);
        else if (estado === 'slide') i = Math.floor(clamp((0.75 - S.slide) / 0.75, 0, 0.99) * n);
        else if (estado === 'jump') i = Math.floor(clamp(S.jt / 0.68, 0, 0.99) * n);
        else i = Math.floor(S.tAnim * 10) % n;
        f = L[i];
      }
      if (!f) return; const im = IMG(HB.base + f.file); if (!listo(im)) return;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 4, 54 * k / kHeroe * 0.35 + 30, 11, 0, 0, 7); ctx.fill();
      if (inclina) ctx.rotate(clamp((S.tl - S.px) * 0.16, -0.2, 0.2));
      if (mir) ctx.scale(-1, 1);
      ctx.drawImage(im, -f.ax * k, -f.ay * k, f.w * k, f.h * k);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function pintaHeroe(x, y, k, estado, flip, alpha) {
      if (HB) return pintaHeroeE(x, y, k, estado, alpha);
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
      const hx = W / 2 + (S.px - 1) * LW, hy = PY - S.jh, est = (S.celeb != null && HB) ? 'win' : S.hurt > 0 ? 'hurt' : S.vuelo > 0 ? 'vuelo' : (S.alegre > 0 && HB && S.jh <= 1) ? 'win' : S.jh > 1 ? 'jump' : S.slide > 0 ? 'slide' : 'run', flip = S.tl < S.px - 0.15, parpadeo = S.inv > 0 && S.celeb == null && Math.floor(S.t * 14) % 2 === 0;
      const nClones = Math.min(4, Math.floor(S.racha / 2)); if (S.racha >= 4) brillo(hx, hy - 100, 150, '255,200,90', 0.22 + 0.06 * Math.sin(S.t * 6));
      for (let i = nClones; i >= 1; i--) {
        const h = S.hist.find(e => e.t >= S.t - 0.16 * i - 0.05) || S.hist[0], pxc = h ? h.px : S.px, lado = i % 2 ? -1 : 1;
        pintaHeroe(W / 2 + (pxc - 1) * LW + lado * (46 + 22 * Math.floor(i / 2)), PY - 6 - 10 * i, kHeroe * (0.8 - 0.03 * i), 'run', flip, 0.4);
      }
      if (S.vuelo > 0) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(hx, PY + 4, 46, 9, 0, 0, 7); ctx.fill(); brillo(hx, hy + 6, 110, '150,215,255', 0.5); ctx.fillStyle = 'rgba(255,255,255,.95)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(hx + k * 24, hy + 6 + (k % 2 ? 6 : 0), 22 - Math.abs(k) * 3, 0, 7); ctx.fill(); } }
      if (!parpadeo) pintaHeroe(hx, hy, kHeroe, est, flip, 1);
      if (S.escudo > 0) { ctx.save(); ctx.fillStyle = 'rgba(120,200,255,.16)'; ctx.strokeStyle = 'rgba(160,225,255,' + (S.escudo < 3 && Math.floor(S.t * 8) % 2 ? 0.3 : 0.85) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, hy - 100, 100 + 4 * Math.sin(S.t * 6), 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    }
    function dibAmb() {
      ctx.save();
      for (const p of S.amb) {
        const fade = clamp(Math.min(p.t / 0.8, (p.life - p.t) / 0.8), 0, 1); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        if (p.tipo === 0) { brillo(p.x, p.y, p.r * 5, '220,255,140', (0.4 + 0.4 * Math.sin(p.ph * 1.6)) * fade); }
        else if (p.tipo === 1) { ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = '#ffc2e0'; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.sin(p.ph)) * 0.6 + 0.4); ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); ctx.fill(); ctx.restore(); }
        else { brillo(p.x, p.y, p.r * 4, '255,170,60', fade * (1 - p.t / p.life) * 0.9); }
      }
      ctx.restore();
    }
    function dibEfectos() {
      for (const p of S.polvo) { ctx.globalAlpha = 0.28 * (1 - p.t / p.life); ctx.fillStyle = '#d9c9a8'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
      S.parts.forEach(p => { ctx.globalAlpha = clamp(1 - p.t / p.life, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const r of S.rings) { const k = r.t / r.dur, rad = (20 + k * 130) * r.esc; ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = 9 * (1 - k) + 2; ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, 7); ctx.stroke(); if (k < 0.25) { ctx.fillStyle = r.c; ctx.globalAlpha = (0.25 - k) * 2; ctx.beginPath(); ctx.arc(r.x, r.y, rad * 0.8, 0, 7); ctx.fill(); } }
      const inten = clamp((S.v - CFG.VEL0) / (CFG.VEL_MAX - CFG.VEL0), 0, 1) * 0.8 + clamp(S.racha / 10, 0, 0.5);
      ctx.strokeStyle = '#ffffff'; for (const l of S.lineas) { const c = Math.cos(l.a), s = Math.sin(l.a), r1 = l.r, r2 = l.r + l.l * (0.6 + inten); ctx.globalAlpha = 0.05 + 0.13 * inten; ctx.lineWidth = 1.6 + 2 * inten * (l.r / 1000); ctx.beginPath(); ctx.moveTo(W / 2 + c * r1, HOR + 40 + s * r1); ctx.lineTo(W / 2 + c * r2, HOR + 40 + s * r2); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function vinetaDib() {
      if (!vineta) { vineta = document.createElement('canvas'); vineta.width = W; vineta.height = H; const x = vineta.getContext('2d'), g = x.createRadialGradient(W / 2, H * 0.52, H * 0.26, W / 2, H * 0.52, H * 0.78); g.addColorStop(0, 'rgba(5,2,18,0)'); g.addColorStop(1, 'rgba(5,2,18,.62)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      ctx.drawImage(vineta, 0, 0);
    }
    function hud() {
      let g = ctx.createLinearGradient(0, 0, 0, 262); g.addColorStop(0, 'rgba(8,4,24,.8)'); g.addColorStop(1, 'rgba(8,4,24,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 262);
      const row = S.filaAct, e = { T: (row || PREGS[Math.min(PREGS.length - 1, S.qpas)]).T }, tema = TEMAS[S.mundo], mostrarQ = !!row && S.plaza;
      // retrato del héroe en medallón
      const nom = heroe === 'kage' ? 'antarez' : 'sakura', est = (S.hurt > 0 || S.vidas <= 1) ? 'herido' : (S.racha >= 4 ? 'radiante' : 'normal'), pi = IMG(UI + 'retratos/' + nom + '_' + est + '.png'), mi = IMG(ART.medallon);
      if (listo(pi)) { ctx.save(); ctx.beginPath(); ctx.arc(53, 51, 34, 0, 7); ctx.clip(); ctx.drawImage(pi, 17, 15, 72, 72); ctx.restore(); } if (listo(mi)) ctx.drawImage(mi, 6, 4, 94, 94);
      const hi = IMG(ART.corazon); for (let i = 0; i < CFG.VIDAS; i++) { ctx.globalAlpha = i < S.vidas ? 1 : 0.22; if (listo(hi)) ctx.drawImage(hi, 0, 0, 200, 175, 108 + i * 44, 14, 40, 35); else { ctx.fillStyle = '#ff5a7a'; ctx.font = '34px serif'; ctx.fillText('♥', 108 + i * 44, 44); } } ctx.globalAlpha = 1;
      const mo = IMG(ART.moneda); if (listo(mo)) ctx.drawImage(mo, (Math.floor(S.t * 8) % 6) * 160, 0, 160, 160, 108, 56, 30, 30);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 26px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)'; { const mt = S.monedas + (S.racha >= 3 ? '  ×2' : ''); ctx.strokeText(mt, 144, 72); ctx.fillStyle = S.racha >= 3 ? '#fff3a0' : '#ffe27a'; ctx.fillText(mt, 144, 72); }
      // insignia con el número de la tabla
      const ins = IMG(ART.insignia); if (listo(ins)) ctx.drawImage(ins, 300, 6, 90, 90);
      ctx.textAlign = 'center'; ctx.font = 'bold 42px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.strokeText(e.T, 343, 48); ctx.fillStyle = '#fff'; ctx.fillText(e.T, 343, 48);
      ctx.fillStyle = tema.borde; ctx.font = 'bold 18px ' + FUENTE; ctx.lineWidth = 4; ctx.strokeText('🌍 ' + tema.nombre.toUpperCase(), W / 2, 112); ctx.fillText('🌍 ' + tema.nombre.toUpperCase(), W / 2, 112);
      // placa de la pregunta
      const ba = IMG(ART.barra); if (listo(ba)) ctx.drawImage(ba, 20, 124, 500, 89); else { ctx.fillStyle = 'rgba(15,8,40,.85)'; rr(24, 130, W - 48, 78, 18); ctx.fill(); }
      const txt = mostrarQ ? row.q : '¡Corre y junta monedas!';
      ctx.font = 'bold ' + (txt.length > 22 ? 28 : txt.length > 14 ? 34 : 46) + 'px ' + FUENTE; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(8,20,60,.95)'; ctx.strokeText(txt, W / 2, 169); ctx.fillStyle = '#fff'; ctx.fillText(txt, W / 2, 169);
      { const n = S.qpas % CFG.PREG_TABLA, X = i => W / 2 + (i - (CFG.PREG_TABLA - 1) / 2) * 40;
        for (let i = 0; i < CFG.PREG_TABLA; i++) { const on = i < n; if (on) brillo(X(i), 240, 17, '255,210,90', 0.55); ctx.fillStyle = on ? '#ffe27a' : 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(X(i), 240, on ? 10 : 8, 0, 7); ctx.fill(); if (on) { ctx.strokeStyle = '#a8631b'; ctx.lineWidth = 2; ctx.stroke(); } } }
      if (S.pista && S.pista.t > 0) { ctx.globalAlpha = clamp(S.pista.t, 0, 1); ctx.font = 'bold 26px ' + FUENTE; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.textAlign = 'center'; ctx.strokeText('Pista: ' + S.pista.txt, W / 2, 280); ctx.fillStyle = '#bff5d0'; ctx.fillText('Pista: ' + S.pista.txt, W / 2, 280); ctx.globalAlpha = 1; }
      if (S.espera) { ctx.globalAlpha = 0.65 + 0.35 * Math.sin(S.t * 4); ctx.textAlign = 'center'; ctx.font = 'bold 28px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.95)'; const t4 = tactil() ? 'Elige tu carril y toca para seguir' : 'Elige con ← → y pulsa Espacio'; ctx.strokeText(t4, W / 2, 470); ctx.fillStyle = '#ffffff'; ctx.fillText(t4, W / 2, 470); ctx.globalAlpha = 1; }
      // abajo: sombras y racha
      const ci = IMG(ART.clon), nCl = Math.min(4, Math.floor(S.racha / 2)); ctx.globalAlpha = nCl ? 1 : 0.4; if (listo(ci)) ctx.drawImage(ci, 12, H - 66, 48, 48); ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = 'bold 22px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)'; const t3 = 'Racha ' + S.racha + (nCl ? '  ×' + nCl : ''); ctx.strokeText(t3, 68, H - 42); ctx.fillStyle = '#fff'; ctx.fillText(t3, 68, H - 42);
      if (S.skate > 0) { const w = 150 * clamp(S.skate / 8, 0, 1); ctx.fillStyle = 'rgba(10,5,30,.72)'; rr(W - 196, H - 62, 176, 36, 18); ctx.fill(); ctx.fillStyle = (S.skate < 2 && Math.floor(S.t * 8) % 2) ? '#ff6a6a' : '#ff9ad5'; rr(W - 180, H - 53, Math.max(6, w), 18, 9); ctx.fill(); ctx.textAlign = 'left'; ctx.font = '26px serif'; ctx.fillStyle = '#fff'; ctx.fillText('🛹', W - 224, H - 42); }
      { let yy = H - 112; ctx.textAlign = 'left'; ctx.font = 'bold 24px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)'; [['🧲 ', S.iman, '#e0c8ff'], ['🛡 ', S.escudo, '#9ad7ff']].forEach(c => { if (c[1] > 0) { const tx = c[0] + Math.ceil(c[1]) + ' s'; ctx.strokeText(tx, 14, yy); ctx.fillStyle = c[2]; ctx.fillText(tx, 14, yy); yy -= 34; } }); }
      // avisos
      ctx.textAlign = 'center'; S.toasts.forEach((t, i) => { const a = clamp(t.t / 0.35, 0, 1) * clamp((t.t0 - t.t) / 0.1 + 0.2, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold 36px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.9)'; const ty = 330 + i * 48 - (t.t0 - t.t) * 22; ctx.strokeText(t.txt, W / 2, ty); ctx.fillStyle = t.color; ctx.fillText(t.txt, W / 2, ty); ctx.globalAlpha = 1; });
      // tarjeta animada de etapa
      const b = S.banner; if (b && b.t > 0) {
        const el = b.t0 - b.t, kin = clamp(el / 0.5, 0, 1), kout = clamp(b.t / 0.45, 0, 1), off = (1 - easeBack(kin)) * W, a = Math.min(kin * 1.6, 1) * kout;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(off, 0);
        if (listo(ba)) ctx.drawImage(ba, 22, 478, 496, 89); if (listo(ins)) ctx.drawImage(ins, 14, 462, 112, 112);
        ctx.textAlign = 'center'; ctx.font = 'bold 46px ' + FUENTE; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.strokeText(b.T, 70, 513); ctx.fillStyle = '#fff'; ctx.fillText(b.T, 70, 513);
        ctx.font = 'bold 38px ' + FUENTE; ctx.strokeStyle = 'rgba(8,20,60,.95)'; ctx.strokeText(b.s, W / 2 + 54, 523); ctx.fillStyle = '#fff'; ctx.fillText(b.s, W / 2 + 54, 523);
        ctx.font = 'bold 24px ' + FUENTE; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.strokeText(b.sub, W / 2, 600); ctx.fillStyle = '#ffe27a'; ctx.fillText(b.sub, W / 2, 600); ctx.restore();
      }
      // daño: esquinas rojas (y pulso si queda 1 corazón)
      const dano = clamp(S.flash / 0.35, 0, 1) + (S.vidas === 1 && S.cae <= 0 ? 0.3 + 0.15 * Math.sin(S.t * 5) : 0);
      if (dano > 0.01) { ctx.globalAlpha = clamp(dano, 0, 1); const sz = 250, E = [[ART.esqSI, 0, 0], [ART.esqSD, W - sz, 0], [ART.esqII, 0, H - sz], [ART.esqID, W - sz, H - sz]]; E.forEach(c => { const im = IMG(c[0]); if (listo(im)) ctx.drawImage(im, c[1], c[2], sz, sz); }); ctx.globalAlpha = 1; }
      if (S.flashB > 0) { ctx.fillStyle = 'rgba(255,248,214,' + (S.flashB * 0.9) + ')'; ctx.fillRect(0, 0, W, H); }
    }
    function dibuja() {
      ctx.setTransform(q, 0, 0, q, 0, 0); ctx.clearRect(0, 0, W, H);
      if (!S) { ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, W, H); return; }
      const ta = Math.floor(S.temaF), tb = Math.min(TEMAS.length - 1, ta + 1), f = S.temaF - ta, A = TEMAS[ta], B = TEMAS[tb];
      const Tm = { c1: mix(A.rc1, B.rc1, f), c2: mix(A.rc2, B.rc2, f), borde: mix(A.rb, B.rb, f), niebla: mix(A.rn, B.rn, f) };
      ctx.save();
      const inten = clamp((S.v - CFG.VEL0) / (CFG.VEL_MAX - CFG.VEL0), 0, 1), zoom = 1 + 0.018 * inten + 0.012 * Math.min(1, S.racha / 8) + 0.03 * S.zp, tilt = (S.tl - S.px) * 0.014, bob = S.cae > 0 || S.jh > 0 ? 0 : Math.sin(S.t * 11) * 1.6;
      ctx.translate(W / 2, PY); ctx.rotate(tilt); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -PY + bob);
      if (S.shake > 0) ctx.translate(R(-6, 6) * S.shake * 3, R(-6, 6) * S.shake * 3);
      fondoDib(ta, tb, f); camino(Tm); charcos(); niebla(Tm);
      const cola = [];
      S.deco.forEach(d => { const z = d.d - S.dist; cola.push({ z, f: () => { spr(IMG(d.img), d.off, z, d.h); if (d.img.indexOf('/lights/') >= 0 && !S.lite) { const p = pz(z); brillo(W / 2 + d.off * LW * p, yz(z) - d.h * p * 0.72, 70 * p + 4, '255,190,100', (0.55 + 0.15 * Math.sin(S.t * 9 + d.d)) * clamp((ZMAX - z) / 30, 0, 1)); } } }); });
      for (let k = Math.floor((S.dist - 3) / 8); k * 8 - S.dist < ZMAX; k++) { const d = k * 8, z = d - S.dist; if (z >= -3) cola.push({ z, f: () => postes(d) }); }
      S.items.forEach(it => { const z = it.d - S.dist; if (z > -4 && z < ZMAX) cola.push({ z, f: () => it.k === 'orb' ? orbe(it, z) : it.k === 'coin' ? monedaDib(it, z) : it.k === 'caja' ? cajaDib(it, z) : it.k === 'nube' ? nubeDib(it, z) : it.k === 'obs' ? obstaculo(it, z) : it.k === 'pat' ? patDib(it, z) : portalDib(it, z) }); });
      cola.sort((a, b) => b.z - a.z); let heroeHecho = false;
      cola.forEach(c => { if (!heroeHecho && c.z < 0 && S.celeb == null) { dibujaHeroes(); heroeHecho = true; } c.f(); }); if (!heroeHecho) dibujaHeroes();
      dibAmb(); dibEfectos();
      ctx.restore(); vinetaDib(); hud();
    }
    function bucle(t) {
      if (!vivo) return; raf = requestAnimationFrame(bucle); const dt = (t - ultimo) / 1000; ultimo = t;
      if (S) { S.cazaDe = S.filas.length ? S.cazadas - (S.cazaBase || 0) : S.cazadas; paso(isFinite(dt) && dt > 0 ? dt : 0); } dibuja();
    }

    // ───────────────────────── pantallas ─────────────────────────
    function pantalla(html, clase) { ov.className = clase || ''; ov.innerHTML = html; ov.style.display = html ? 'flex' : 'none'; }
    const retrato = est => '<div class="retrato"><img class="ret" src="' + UI + 'retratos/' + (heroe === 'kage' ? 'antarez' : 'sakura') + '_' + (est || 'normal') + '.png" alt=""><img class="mar" src="' + UI + 'marcos/medallon_marco.png" alt=""></div>';
    const BARRA = '<img class="barra" src="' + UI + 'extras/barra_ornamental_azul_dorada.png" alt="">';
    function inicio() {
      S = nuevo(); S.cazaBase = 0;
      pantalla(retrato('normal') + '<h1>CARRERA DE LOS FAROLILLOS</h1>' + BARRA + '<p>Corre por <b>6 mundos</b>, junta <b>monedas</b> 🪙 y, en cada <b>plaza</b>, elige con calma la respuesta de las tablas del <b>7, 8 y 9</b>.</p>' +
        '<div class="reglas"><span>🪙 Junta monedas saltando y deslizando</span><span>🤔 En la plaza no hay prisa</span><span>💛 Si fallas, te damos una pista</span><span>🛹 Cada 3 aciertos seguidos: ¡premio!</span><span>☁️ Cajas ? y tabla voladora</span></div>' +
        '<p class="ctl">' + (tactil() ? 'Desliza ← → para cambiar de carril, ↑ para saltar (barriles), ↓ para deslizarte (arcos). En la plaza, toca para seguir.' : 'Flechas ← → cambian de carril · ↑ salta los barriles · ↓ te desliza bajo los arcos · Espacio sigue en la plaza · P pausa · M sonido · V voz.') + '</p>' +
        '<button id="go" type="button">▶ JUGAR</button>');
      document.getElementById('go').onclick = () => { intentarPantallaCompleta(); try { ac() && ac().resume && ac().resume(); } catch (e) {} pantalla(''); S.corriendo = true; ponBanner(0, PREGS[0].T, 3); vigilarGiro(); };
    }
    function pausar(forzar) {
      if (!S || !S.corriendo || S.fin) return; if (S.pausa && !forzar) { S.pausa = false; pantalla(''); return; } if (S.pausa) return; S.pausa = true;
      pantalla('<h1>PAUSA</h1>' + BARRA + '<button id="seg" type="button">▶ SEGUIR</button><button id="sal" type="button" class="sec">⟵ SALIR</button>', 'pausa');
      document.getElementById('seg').onclick = () => { if (!vigilarGiro()) { S.pausa = false; pantalla(''); } };
      document.getElementById('sal').onclick = () => salir();
    }
    function salir() { vivo = false; cancelAnimationFrame(raf); if (o.onSalir) o.onSalir(); }
    function terminar() {
      if (S.fin) return; S.fin = true; S.tl = 1; S.jh = 0; S.jv = 0; S.slide = 0; S.skate = 0; sfx.gana();
      const conCel = !!(HB && fb('celebra').length);
      if (conCel) { S.celeb = S.t; const cx = W / 2 + (S.px - 1) * LW; chispas(cx, PY - 200, '#ffe27a', 40); anillo(cx, PY - 160, '#fff3b0', 1.8); setTimeout(() => { if (vivo) mostrarFin(); }, 2700); } else mostrarFin();
    }
    function mostrarFin() {
      const tot = S.aciertos + S.errores, prec = tot ? S.aciertos / tot : 1, est = prec >= 0.9 && S.golpes <= 2 ? 3 : prec >= 0.75 ? 2 : 1;
      const dificiles = Object.keys(S.fallos).sort((a, b) => S.fallos[b] - S.fallos[a]).slice(0, 4).map(k => k.replace('x', ' × '));
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel3 = p.nivel3 || {}; p.nivel3.completado = true; p.nivel3.monedas = (p.nivel3.monedas || 0) + S.monedas; p.nivel3.mejor = Math.max(p.nivel3.mejor || 0, S.puntos); p.nivel3.estrellas = Math.max(p.nivel3.estrellas || 0, est); p.nivel3.intentos = (p.nivel3.intentos || 0) + 1; p.nivel3.fallos = S.fallos; p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aciertos; p.estadisticas.errores += S.errores; }); } catch (e) {} }
      pantalla(retrato('radiante') + '<h1>¡NIVEL COMPLETADO!</h1>' + BARRA + '<div class="estrellas">' + '⭐'.repeat(est) + '<span style="opacity:.25">' + '⭐'.repeat(3 - est) + '</span></div>' +
        '<p>Monedas: <b>' + S.monedas + ' 🪙</b> · Puntos: <b>' + S.puntos + '</b> · Aciertos: <b>' + S.aciertos + '</b> · Mejor racha: <b>' + S.mejorRacha + '</b></p>' + (dificiles.length ? '<p>Para repasar: <b>' + dificiles.join(' · ') + '</b></p>' : '<p>¡Sin tablas difíciles! 🏆</p>') +
        '<button id="otra" type="button">↻ JUGAR OTRA VEZ</button><button id="sal2" type="button" class="sec">⟵ SALIR</button>', 'fin');
      document.getElementById('otra').onclick = () => { inicio(); };
      document.getElementById('sal2').onclick = () => salir();
    }

    // ───────────────────────── controles ─────────────────────────
    window.addEventListener('keydown', e => {
      const k = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') accion('izq'); else if (k === 'ArrowRight' || k === 'd' || k === 'D') accion('der');
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') accion('salta'); else if (k === 'ArrowDown' || k === 's' || k === 'S') accion('baja');
      else if (k === 'Enter') accion('listo'); else if (k === 'v' || k === 'V') { voz = !voz; toast(voz ? '🔊 Voz activada' : '🔇 Voz apagada', '#ffffff', 1.3); if (voz && S.filaAct && S.plaza) hablar(S.filaAct); } else if (k === 'p' || k === 'P' || k === 'Escape') pausar(); else if (k === 'm' || k === 'M') alternarSonido();
    });
    let t0 = null;
    marco.addEventListener('touchstart', e => { if (e.target.closest('button')) return; const t = e.changedTouches[0]; t0 = { x: t.clientX, y: t.clientY, hecho: false, ts: Date.now() }; e.preventDefault(); }, { passive: false });
    marco.addEventListener('touchmove', e => {
      if (!t0 || t0.hecho) return; const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, u = 20; e.preventDefault();
      if (Math.abs(dx) > u && Math.abs(dx) > Math.abs(dy)) { accion(dx < 0 ? 'izq' : 'der'); t0.hecho = true; } else if (Math.abs(dy) > u) { accion(dy < 0 ? 'salta' : 'baja'); t0.hecho = true; }
    }, { passive: false });
    marco.addEventListener('touchend', () => { if (t0 && !t0.hecho && Date.now() - t0.ts < 350) accion('listo'); t0 = null; });
    function alternarSonido() { mudo = !mudo; bMudo.textContent = mudo ? '🔇' : '🔊'; }
    bPausa.onclick = () => pausar(); bMudo.onclick = alternarSonido;
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(true); });

    inicio(); vigilarGiro(); raf = requestAnimationFrame(bucle);
    return { paso, accion, estado: () => S, dibuja, CFG, ET: PREGS };
  }

  window.Nivel3 = { iniciar };
})();
