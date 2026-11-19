/* Nivel 2 · Surf de Dunas — v5 (rediseño de jugabilidad)
   Desliza por el desierto en tu alfombra mágica, cambia de carril y cruza la puerta con la respuesta correcta.
   Tablas 4, 5 y 6 con modo adaptativo. Final: Escorpión Colosal (en vagoneta cohete).

   Qué cambió respecto a la v4
   1. Tutorial guiado por el zorro (5 pasos, se puede omitir; se salta solo si ya lo completaste).
   2. Ritmo lento y constante. Antes de cada puerta hay una "zona de respuesta" sin obstáculos y aún más lenta.
   3. La pregunta siempre está arriba y las respuestas se ven en 3 sitios: las puertas, los carteles de carril
      (a la izquierda, alineados con cada carril; se pueden tocar) y la puerta de tu carril se ilumina.
   4. Gotas con función: 8 gotas = +1 corazón (o un escudo si ya tienes los 3). Vuelan al medidor al recogerlas.
   5. Checkpoints (bandera) cada 2 preguntas y reaparición automática al quedarte sin corazones. Se guarda el avance.
   6. Alfombra mágica en el recorrido, vagoneta cohete contra el jefe, y el zorro como compañero.
   Todo lo ajustable está en CONFIG. */
(function () {
  'use strict';

  // ───────────────────────── ajustes ─────────────────────────
  const CONFIG = {
    RONDAS: 8,               // preguntas antes del jefe
    CHECKS: [2, 4, 6, 8],    // tras cuántas preguntas hay bandera (8 = inicio del jefe)
    VIDAS: 3,
    GOTAS_X_CORAZON: 8,      // gotas para ganar un corazón (o escudo)
    VEL_TUT: 120,            // velocidad en el tutorial (px/s)
    VEL_TUT_PREG: 150,
    VEL_BASE: 200,           // velocidad del recorrido; sube un poco con cada pregunta
    VEL_SUBE: 7,
    VEL_JEFE: 250,
    FACTOR_ZONA: 0.82,       // en la zona de respuesta se va a este % de la velocidad
    ZONA: 750,               // largo (px) de la zona de respuesta
    JEFE_HP: 5,
    PISTA_TRAS_ERRORES: 2    // el zorro señala la respuesta tras N errores seguidos
  };

  const W = 960, H = 540, CARR = 70, BASE_Y = 338, X_H = 250, GR = 1300, VSALTO = 620;
  const COL = ['#3fe0cf', '#ffd35a', '#ff7fae'];
  const FUENTE = '"Trebuchet MS",Verdana,ui-sans-serif,sans-serif';
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = a => a[RI(0, a.length - 1)];
  const hY = x => BASE_Y + Math.sin(x / 420) * 30 + Math.sin(x / 190 + 1.3) * 10;
  const laneY = (x, l) => hY(x) + (l - 1) * CARR;
  const mez = a => { for (let i = a.length - 1; i > 0; i--) { const j = RI(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const tactil = () => { try { return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } };

  // ───────────────────────── preguntas ─────────────────────────
  // fallos: { '6x7': veces } → las tablas falladas salen más; facil: solo ×2 y ×3 (para el tutorial)
  function pregunta(fallos, facil) {
    const pool = [];
    [4, 5, 6].forEach(t => {
      for (let n = facil ? 2 : 2; n <= (facil ? 3 : 10); n++) {
        const w = 1 + 3 * ((fallos && fallos[t + 'x' + n]) || 0);
        for (let i = 0; i < w; i++) pool.push([t, n]);
      }
    });
    const [t, n] = pool[RI(0, pool.length - 1)], r = t * n, tipo = facil ? 0 : RI(0, 2);
    let txt, ans = r;
    if (tipo === 0) txt = t + ' × ' + n + ' = ?';
    else if (tipo === 1) { txt = t + ' × ? = ' + r; ans = n; }
    else txt = n + ' veces ' + t + ' = ?';
    const cand = tipo === 1 ? [n - 1, n + 1, n + 2, n - 2] : [r - t, r + t, r + 1, r - 1, r + 2 * t];
    const ops = mez([...new Set(cand.filter(x => x > 0 && x !== ans))]).slice(0, 2);
    ops.push(ans); mez(ops);
    return { txt, ans, ops, key: t + 'x' + n };
  }

  // ───────────────────────── guardado local ─────────────────────────
  const clave = o => 'n2_' + ((o && o.perfil && o.perfil.id) || 'anon');
  const leer = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const guardar = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ───────────────────────── juego ─────────────────────────
  function iniciar(o) {
    o = o || {};
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;z-index:50;background:#060818;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;font-family:' + FUENTE;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = 'width:min(100vw,177.7vh);height:auto;max-height:100vh;background:#0a0c26';
    root.appendChild(cv); document.body.appendChild(root);
    const cx = cv.getContext('2d');
    const kage = o.heroe === 'kage', hero = kage ? 'kage' : 'sakura';
    // vehículo y tabla se eligen en nivel2.html (se recuerdan en n2cfg); el jefe rota con cada victoria
    let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('n2cfg') || '{}') || {}; } catch (e) {}
    const VEHS = ['tabla', 'alfombra', 'vagoneta'], TABLAS = ['tabla_clasica', 'tabla_cactus', 'tabla_cristal', 'tabla_dragon', 'tabla_faraon', 'tabla_neon'];
    const vehiculo = VEHS.includes(o.vehiculo || cfg.vehiculo) ? (o.vehiculo || cfg.vehiculo) : 'alfombra';
    const tablaId = TABLAS.includes(o.tabla || cfg.tabla) ? (o.tabla || cfg.tabla) : 'tabla_clasica';
    const JEFES = [
      { id: 'escorpion', n: 'ESCORPIÓN COLOSAL', art: 'AL', aguijon: '¡Aguijón!' }, { id: 'gusano', n: 'GUSANO DE LAS DUNAS', art: 'AL', aguijon: '¡Mordisco!' },
      { id: 'esfinge', n: 'ESFINGE GUARDIANA', art: 'A LA', aguijon: '¡Rayo de la esfinge!' }, { id: 'faraon', n: 'FARAÓN MOMIA', art: 'AL', aguijon: '¡Maldición del faraón!' }];
    const completados0 = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.completados) || 0;
    let ganadasSesion = 0;
    const jefeActual = () => JEFES.find(j => j.id === o.jefe) || JEFES[(completados0 + ganadasSesion) % JEFES.length];
    // fotogramas del personaje corriendo (solo se usan con el vehículo "tabla")
    const SP = kage ? { run: 15, hurt: 6, idle: 6 } : { run: 14, jump: 4, hurt: 5, sprint: 5, idle: 6 }, IMG = {}, carpeta = 'assets/characters/' + hero + '/';
    Object.keys(SP).forEach(a => { IMG[a] = []; if (vehiculo !== 'tabla') return; for (let i = 0; i < SP[a]; i++) { const im = new Image(); im.src = carpeta + a + '_' + String(i).padStart(2, '0') + '.png'; IMG[a].push(im); } });
    // Antarez (antes Kage): en modo "tabla" se dibuja con los fotogramas nuevos de assets/characters/antarez/ (manifiesto ANTAREZ_MANIFEST)
    const ANT = kage && vehiculo === 'tabla' && window.ANTAREZ_MANIFEST ? window.ANTAREZ_MANIFEST : null;
    if (ANT) {
      const pick = (nombre, n) => { const fr = ANT.animations[nombre].frames, paso = Math.max(1, Math.floor(fr.length / n)), out = []; for (let i = 0; i < fr.length && out.length < n; i += paso) out.push(fr[i]); return out; };
      const set = { run: pick('run', 12), hurt: ANT.animations.hurt.frames, jump: ANT.animations.jump.frames.slice(0, 4), sprint: ANT.animations.sprint.frames, idle: ANT.animations.idle.frames };
      Object.keys(set).forEach(a => { IMG[a] = set[a].map(f => { const im = new Image(); im.src = ANT.base + f.file; im._ax = f.ax; im._ay = f.ay; return im; }); });
    }
    const KCP = clave(o) + '_cp', KTUT = clave(o) + '_tut';
    const fallosPrev = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.fallos) || {};
    const touch = tactil();
    const estrellas = Array.from({ length: 70 }, () => ({ x: R(0, W), y: R(0, 230), r: R(.4, 1.6), f: R(0, 6) }));
    const viento = Array.from({ length: 22 }, () => ({ x: R(0, W), y: R(250, H), l: R(30, 90), s: R(.6, 1.4) }));
    let S, raf = 0, ult = 0, ac = null;

    const beep = (f, d, tipo, vol) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const os = ac.createOscillator(), g = ac.createGain(); os.type = tipo || 'square'; os.frequency.value = f; g.gain.value = vol || .05; os.connect(g); g.connect(ac.destination); os.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); os.stop(ac.currentTime + d); } catch (e) {} };
    const sonidoOk = () => { beep(660, .12, 'square'); setTimeout(() => beep(880, .16, 'square'), 90); setTimeout(() => beep(1175, .2, 'triangle'), 190); };

    // ── arte (assets/nivel2/manifest.js). Si algo falta se dibuja una versión simple ──
    const ARTE = window.NIVEL2_ARTE || {}, CACHE = {};
    function img(id, i) {
      const a = ARTE[id]; if (!a) return null;
      i = Math.abs(Math.floor(i || 0)) % a.frames.length; const k = id + '#' + i;
      if (!CACHE[k]) { CACHE[k] = new Image(); CACHE[k].src = 'assets/nivel2/' + a.frames[i].f; }
      const m = CACHE[k]; return m.complete && m.naturalWidth ? m : null;
    }
    // base centrada en (x,y); 'alto' en px; voltear = espejo; alfa opcional; ang = rotación
    function spr(id, i, x, y, alto, voltear, alfa, ang) {
      const m = img(id, i); if (!m) return false;
      const w = m.naturalWidth * alto / m.naturalHeight;
      cx.save(); cx.translate(x, y); if (ang) cx.rotate(ang); if (voltear) cx.scale(-1, 1); if (alfa != null) cx.globalAlpha = alfa;
      cx.drawImage(m, -w / 2, -alto, w, alto); cx.restore(); return true;
    }
    ['alfombra_' + hero + '_planeo', 'alfombra_' + hero + '_sube', 'alfombra_' + hero + '_baja', 'vagoneta_' + hero + '_rueda', 'vagoneta_' + hero + '_salto',
      'zorro_run', 'zorro_idle', 'zorro_alerta', 'zorro_celebra', 'compuerta_neutral', 'compuerta_correcta', 'compuerta_incorrecta', 'compuerta_usada',
      'gota_agua', 'corazon_desierto', 'bandera_checkpoint', 'cactus_saguaro', 'cactus_barril', 'roca_grande', 'rocas_pequenas', 'rueda_carreta',
      'escorpion_walk', 'serpiente_slither', 'serpiente_alerta', 'buitre_vuelo', 'buitre_picada', 'buitre_huida',
      'poder_escarabajo', 'poder_reloj', 'poder_iman', 'poder_comodin', 'onigiri', 'pergamino', 'cofre_cerrado', 'cofre_entreabierto', 'cofre_abierto', 'cofre_oscuro_cerrado', 'cofre_oscuro_abierto',
      'trampolin', 'cinta_transportadora', 'pinchos', 'sierra', 'canon', 'bola_fuego', 'oni_garrote_guardia', 'oni_garrote_ataque', 'piedra_agrietada', 'portal_piedra', 'bandera_meta', 'teletransporte',
      'trofeo_escorpion', 'isla_desierto', 'isla_cristal', 'isla_hielo', 'isla_hierba', 'isla_lava', 'enredadera', 'puente_colgante', 'puente_piedra', 'dragon_origami',
      'cristales_azules', 'vagoneta_oro', 'tambor_taiko', tablaId
    ].forEach(id => { const a = ARTE[id]; if (a) a.frames.forEach((_, i) => img(id, i)); });
    ['idle', 'aviso', 'ataque', 'golpe', 'derrota'].forEach(po => img('jefe_' + jefeActual().id + '_' + po, 0));   // sin parpadeos al atacar

    // ── utilidades de dibujo ──
    function T(s, x, y, size, col, al, lw) {
      cx.font = 'bold ' + size + 'px ' + FUENTE; cx.textAlign = al || 'left'; cx.textBaseline = 'alphabetic';
      if (lw) { cx.lineJoin = 'round'; cx.lineWidth = lw; cx.strokeStyle = 'rgba(30,12,40,.92)'; cx.strokeText(s, x, y); }
      cx.fillStyle = col; cx.fillText(s, x, y);
    }
    function caja(x, y, w, h, r, fill, stroke, lw) {
      cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, w, h, r); else cx.rect(x, y, w, h);
      if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 2; cx.stroke(); }
    }
    function chispas(x, y, n, cols, vel, vida) {
      for (let i = 0; i < n; i++) { const a = R(0, 6.283), v = R(.3, 1) * (vel || 220); S.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: R(.5, 1) * (vida || .8), t0: vida || .8, c: pick(cols), r: R(2, 4.5) }); }
    }
    const pop = (s, x, y, col, size) => S.pops.push({ s, x, y, t: 1.1, col: col || '#fff', size: size || 26 });
    const msg = (s, t) => { S.msg = { s, t: t || 1.8 }; };
    const banner = (s, sub, t, col) => { S.banner = { s, sub, t: t || 2.4, t0: t || 2.4, col: col || '#ffe27a' }; };

    // ───────────────────────── estado ─────────────────────────
    function nuevo(modo) {
      S = {
        est: 'play', t: 0, d: 0, v: CONFIG.VEL_TUT, lane: 1, ly: 1, fly: 1, z: 0, vz: 0, fz: 0,
        vidas: CONFIG.VIDAS, punt: 0, racha: 0, aci: 0, err: 0, errSeg: 0, inv: 0, boost: 0, flash: 0, shake: 0, fade: 1, caido: 0, caidas: 0,
        gotas: 0, gotasTot: 0, escudo: false, medidor: 0,
        obs: [], gates: [], drops: [], flags: [], fx: [], pops: [], vuelos: [], chips: [],
        gen: 900, rondaGen: 0, respondidas: 0, fase: 'ruta', jefe: null, buitre: null, proxB: 26, qpop: 0,
        cp: { ronda: 0, punt: 0, jefe: false }, fallos: Object.assign({}, fallosPrev),
        msg: { s: '', t: 0 }, banner: null, inputs: {}, zorro: { est: '', t: 0 }, tut: null, pausa: false,
        pows: [], cofres: [], pads: [], decor: [], balas: [], lento: 0, iman: 0, comodin: 0, dragon: null, proxD: 24, jefeInfo: jefeActual()
      };
      if (modo === 'continuar') {
        const c = leer(KCP); if (c) { S.cp = c; aplicarCheckpoint(); banner('CONTINUAMOS', 'Desde tu último checkpoint', 2.6); return; }
        modo = 'ruta';
      }
      if (modo === 'tut') { S.fase = 'tut'; S.tut = { paso: 0, t: 0, ok: 0, vis: [0, 1, 0], golpeado: false }; entrarPaso(0); }
      else if (o.directo) {   // ?jefe=gusano&directo=1 → práctica: empieza ya contra ese jefe
        S.respondidas = CONFIG.RONDAS; S.rondaGen = CONFIG.RONDAS; S.fase = 'jefe'; S.jefe = nuevoJefe(); S.v = CONFIG.VEL_JEFE; S.gen = S.d + 800; banner('¡' + S.jefeInfo.n + '!', 'Acierta ' + CONFIG.JEFE_HP + ' puertas para vencerlo', 3, '#ff7a6a');
      } else { S.gen = S.d + 800; msg('Cruza la puerta con la respuesta correcta', 3.2); }
    }

    // ───────────────────────── generación del recorrido ─────────────────────────
    function addObs(x, l, tipo, v) {
      const h = ({ cac: v ? 44 : 68, roca: v === 2 ? 56 : v ? 30 : 52, rueda: 46, ser: 26, esc: 30, pin: 24, sie: 46, can: 44, oni: 64 })[tipo];
      const alto = ({ cac: v ? 68 : 112, roca: v === 2 ? 92 : v ? 46 : 80, rueda: 74, ser: 34, esc: 58, pin: 46, sie: 72, can: 76, oni: 124 })[tipo];
      const ob = { x, l, tipo, v, h, alto, hit: false, cd: -1, cambio: false }; S.obs.push(ob); return ob;
    }
    const addGota = (x, l, y) => S.drops.push({ x, l, y, ok: false });
    function arcoGotas(x, l) { for (let k = 0; k < 5; k++) addGota(x - 100 + k * 50, l, 38 + 56 * Math.sin(Math.PI * k / 4)); }
    function lineaGotas(x, l, n) { for (let k = 0; k < n; k++) addGota(x + k * 44, l, 30); }
    function nuevaPuerta(x, q, ayuda) { const g = { x, q, res: false, lane: -1, ok: false, ayuda: !!ayuda, t: 0, corr: q.ops.indexOf(q.ans) }; S.gates.push(g); S.qpop = .5; return g; }

    function construirRonda() {
      const r = S.rondaGen++, x0 = S.gen, jefe = r >= CONFIG.RONDAS;
      // los enemigos se van sumando poco a poco: así cada ronda enseña algo nuevo sin abrumar
      const tipos = jefe ? ['cac', 'roca', 'pin'] : r < 2 ? ['cac', 'roca'] : r < 3 ? ['cac', 'roca', 'rueda', 'esc'] : r < 4 ? ['cac', 'roca', 'rueda', 'esc', 'pin', 'ser'] : r < 5 ? ['cac', 'roca', 'rueda', 'esc', 'pin', 'ser', 'sie'] : ['cac', 'roca', 'rueda', 'esc', 'pin', 'ser', 'sie', 'can', 'oni'];
      const nObs = jefe ? 1 : r < 2 ? 1 : r < 5 ? 2 : 3, largo = jefe ? 1500 : 1750;
      lineaGotas(x0 + 110, RI(0, 2), 5);
      let x = x0 + 400;
      for (let i = 0; i < nObs; i++) {
        const l = RI(0, 2), tipo = pick(tipos);
        addObs(x, l, tipo, tipo === 'roca' ? RI(0, 2) : RI(0, 1)); arcoGotas(x, l);
        x += RI(300, 380);
      }
      if (!jefe) generarExtras(x0, largo);
      // ≥ 600 px antes de la puerta sin obstáculos ni poderes: tiempo para pensar y elegir
      nuevaPuerta(x0 + largo, pregunta(S.fallos), S.errSeg >= CONFIG.PISTA_TRAS_ERRORES);
      if (CONFIG.CHECKS.includes(r + 1)) S.flags.push({ x: x0 + largo + 300, n: r + 1, tomada: false });
      S.gen = x0 + largo + 520;
    }
    // poderes, curación, cofres, plataformas y decorado: SOLO en la primera parte de cada ronda (nunca en la zona de respuesta)
    // Solo en el tramo libre: nunca dentro de la zona de respuesta (CONFIG.ZONA px antes de la puerta), para no romper el ritmo calmado.
    function generarExtras(x0, largo) {
      const a = x0 + 160, b = x0 + largo - CONFIG.ZONA - 120;
      const libre = (x, l) => !S.obs.some(ob => ob.l === l && Math.abs(ob.x - x) < 150) && !S.drops.some(g => g.l === l && !g.ok && Math.abs(g.x - x) < 60);
      const lugar = tope => { for (let k = 0; k < 8; k++) { const x = RI(a, Math.max(a, tope || b)), l = RI(0, 2); if (libre(x, l)) return { x, l }; } return null; };
      const PODERES = ['poder_escarabajo', 'poder_reloj', 'poder_iman', 'poder_comodin'];
      let p;
      if (Math.random() < .5 && (p = lugar())) S.pows.push({ x: p.x, l: p.l, tipo: pick(PODERES) });
      if (S.vidas < CONFIG.VIDAS && Math.random() < .5 && (p = lugar())) S.pows.push({ x: p.x, l: p.l, tipo: 'onigiri' });
      if (Math.random() < .3 && (p = lugar())) S.pows.push({ x: p.x, l: p.l, tipo: 'pergamino' });
      if (Math.random() < .3 && (p = lugar())) S.cofres.push({ x: p.x, l: p.l, oscuro: S.racha >= 4, est: 0, t: 0 });
      if (Math.random() < .4 && (p = lugar(b - 420))) {     // el trampolín lleva un arco de gotas de 400 px
        const tra = Math.random() < .55; S.pads.push({ x: p.x, l: p.l, tipo: tra ? 'trampolin' : 'cinta_transportadora', ok: false, t: 0 });
        if (tra) [[80, 150], [160, 240], [240, 270], [320, 240], [400, 150]].forEach(([dx, y]) => addGota(p.x + dx, p.l, y));
      }
      for (let k = 0; k < 3; k++) S.decor.push({ x: x0 + RI(0, largo), id: pick(['cristales_azules', 'vagoneta_oro', 'tambor_taiko', 'piedra_agrietada']), alto: RI(54, 86) });
    }
    function recoger(p) {
      p.ok = true; beep(900, .08, 'sine'); const px = X_H, py = laneY(S.d, S.lane) - 150;
      if (p.tipo === 'poder_escarabajo') { S.escudo = true; msg('¡ESCARABAJO! Te protege de 1 golpe', 2); pop('ESCUDO', px, py, '#ffd35a', 30); }
      else if (p.tipo === 'poder_reloj') { S.lento = 6; msg('¡RELOJ! El tiempo va más lento', 2); pop('RELOJ', px, py, '#8fb8ff', 30); }
      else if (p.tipo === 'poder_iman') { S.iman = 8; msg('¡IMÁN! Atrae las gotas', 2); pop('IMÁN', px, py, '#ff9a9a', 30); }
      else if (p.tipo === 'poder_comodin') { S.comodin = 1; msg('¡COMODÍN! Tacha una respuesta mala', 2.2); pop('COMODÍN', px, py, '#e9a8ff', 30); }
      else if (p.tipo === 'onigiri') { if (S.vidas < CONFIG.VIDAS) { S.vidas++; msg('¡ONIGIRI! +1 corazón', 1.8); pop('+1 ♥', px, py, '#ff6f8f', 34); } else { S.punt += 80; pop('+80', px, py, '#ffe27a', 30); } }
      else { S.punt += 150; pop('+150', px, py, '#ffe27a', 30); }
      chispas(px, laneY(S.d, S.lane) - 60, 14, ['#fff', '#ffe27a'], 220, .7);
    }
    function generar() { if (S.fase === 'tut') return; while (S.gen < S.d + 3200) construirRonda(); }

    const siguienteGate = () => S.gates.find(g => !g.res);
    const nuevoJefe = () => ({ hp: CONFIG.JEFE_HP, max: CONFIG.JEFE_HP, atq: null, cd: 3, golpe: 0 });

    function aplicarCheckpoint() {
      const c = S.cp;
      S.obs = []; S.gates = []; S.drops = []; S.flags = []; S.buitre = null; S.proxB = 22; S.vuelos = []; S.pows = []; S.cofres = []; S.pads = []; S.balas = []; S.decor = []; S.lento = 0; S.iman = 0; S.comodin = 0;
      S.rondaGen = c.ronda; S.respondidas = c.ronda; S.punt = c.punt; S.fase = c.jefe ? 'jefe' : 'ruta'; S.jefe = c.jefe ? nuevoJefe() : null;
      S.gen = S.d + 700; S.vidas = CONFIG.VIDAS; S.racha = 0; S.errSeg = 0; S.inv = 2.5; S.v = 140; S.lane = 1; S.ly = 1; S.fly = 1; S.z = 0; S.vz = 0; S.escudo = false; S.fade = 1; S.caido = 0; S.boost = 0;
    }

    // ───────────────────────── tutorial ─────────────────────────
    const K = (pc, mv) => touch ? mv : pc;
    function textoTutorial() {
      const T = S.tut; if (!T) return null;
      const L = [
        ['¡Hola! Soy Zorrito, tu compañero.', 'Tu alfombra mágica vuela sola y NO se detiene.', 'Yo te enseño en 5 pasos cortitos.'],
        ['Paso 1 · Cambia de carril', K('Pulsa ▲ ▼ (o las teclas W S) para moverte.', 'Desliza el dedo ↑ ↓, o toca los botones ▲ ▼.'), 'Visita los 3 carriles: ' + T.vis.map(v => v ? '✔' : '○').join(' ')],
        ['Paso 2 · ¡Salta!', K('Pulsa ESPACIO justo antes de la roca.', 'Toca la pantalla (o SALTAR) justo antes de la roca.'), 'No pasa nada si fallas: aquí no pierdes corazones.'],
        ['Paso 3 · Recoge las gotas', 'Pasa por ellas: ' + CONFIG.GOTAS_X_CORAZON + ' gotas = +1 corazón.', 'Si ya tienes los 3 corazones, ¡ganas un escudo!'],
        ['Paso 4 · Elige la respuesta', 'La pregunta está arriba. Cruza la puerta con la respuesta correcta.', K('Cambia de carril con ▲ ▼ o con las teclas 1 2 3.', 'Toca el cartel del carril (izquierda) o desliza ↑ ↓.')],
        ['Paso 5 · ¡Ahora tú solo!', 'Sin pistas. Tu respuesta es la del carril donde estás.', 'Los carteles de la izquierda siempre te lo recuerdan.'],
        ['¡Listo, campeón!', 'Cada 2 preguntas hay una bandera que guarda tu avance.', 'Si te quedas sin corazones, reapareces en la última bandera.']
      ];
      return L[T.paso];
    }
    function entrarPaso(p) {
      const T = S.tut; T.paso = p; T.t = 0; T.ok = 0; T.golpeado = false; S.zorro = { est: 'alerta', t: 1.2 };
      if (p === 2) crearMuro(); else if (p === 3) crearGotasTut(); else if (p === 4) crearPuertaTut(true); else if (p === 5) crearPuertaTut(false);
    }
    const exitoPaso = () => { const T = S.tut; if (T.ok > 0) return; T.ok = 1.7; msg('¡Muy bien!', 1.5); sonidoOk(); S.zorro = { est: 'celebra', t: 1.4 }; chispas(X_H, laneY(S.d, S.lane) - 70, 18, ['#ffe27a', '#fff', '#6fd6ff'], 260, .9); };
    function crearMuro() { const T = S.tut; T.muroX = S.d + 620; for (let l = 0; l < 3; l++) addObs(T.muroX, l, 'roca', 1).h = 20; }
    function crearGotasTut() {
      const T = S.tut; T.g0 = S.gotasTot; T.finG = S.d + 1300;
      [S.d + 450, S.d + 950].forEach(x => { for (let l = 0; l < 3; l++) lineaGotas(x, l, 5); });
    }
    function crearPuertaTut(ayuda) {
      const T = S.tut, q = pregunta(null, true);
      if (ayuda) { q.txt = '4 × 2 = ?'; q.ans = 8; q.key = '4x2'; q.ops = mez([8, 6, 12]); }
      T.q = q; nuevaPuerta(S.d + 1000, q, ayuda);
    }
    function tutorial(dt) {
      const T = S.tut; T.t += dt;
      if (T.ok > 0) { T.ok -= dt; if (T.ok <= 0) { if (T.paso >= 6) return; entrarPaso(T.paso + 1); } return; }
      if (T.paso === 0 && T.t > 6) entrarPaso(1);
      else if (T.paso === 1) { T.vis[S.lane] = 1; if (T.vis[0] && T.vis[1] && T.vis[2]) exitoPaso(); }
      else if (T.paso === 2 && S.d > T.muroX + 90) { if (!T.golpeado) exitoPaso(); else { T.golpeado = false; msg('¡Otra vez! Salta justo antes de la roca', 2); crearMuro(); } }
      else if (T.paso === 3) {
        const n = S.gotasTot - T.g0;
        if (n >= CONFIG.GOTAS_X_CORAZON) exitoPaso();
        else if (S.d > T.finG) { if (n >= 4) exitoPaso(); else { msg('¡Pasa por las gotas!', 2); crearGotasTut(); } }
      } else if (T.paso === 6 && T.t > 5) finalizarTutorial();
    }
    function tutRespuesta(g) {
      const T = S.tut;
      if (g.ok) { exitoPaso(); chispas(g.x - (S.d - X_H), laneY(g.x, g.lane) - 60, 26, ['#53e08a', '#ffe27a', '#fff'], 300, 1); }
      else {
        const [a, b] = g.q.key.split('x').map(Number); msg('¡Casi! Era ' + a + ' × ' + b + ' = ' + a * b + '. Probemos otra vez', 2.4); S.zorro = { est: 'alerta', t: 1.6 }; S.shake = .15; beep(220, .18, 'triangle');
        const q = T.paso === 4 ? T.q : pregunta(null, true); T.q = q; nuevaPuerta(S.d + 1000, q, T.paso === 4);
      }
    }
    function finalizarTutorial() {
      guardar(KTUT, 1);
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel2 = p.nivel2 || {}; p.nivel2.tutorial = true; }); } catch (e) {} }
      S.tut = null; S.fase = 'ruta'; S.obs = S.obs.filter(ob => ob.x > S.d + 200); S.gen = S.d + 600; S.punt = 0; S.aci = 0; S.err = 0;
      S.cp = { ronda: 0, punt: 0, jefe: false }; banner('¡EMPIEZA EL RECORRIDO!', '8 preguntas y el Escorpión Colosal te esperan', 2.8);
    }
    function omitirTutorial() { if (S && S.fase === 'tut') { S.gates = []; S.drops = []; S.obs = []; finalizarTutorial(); } }

    // ───────────────────────── reglas ─────────────────────────
    function responder(g) {
      const l = clamp(S.lane, 0, 2), ok = g.q.ops[l] === g.q.ans;
      g.res = true; g.lane = l; g.ok = ok; g.t = 0; if (g.tach !== undefined) S.comodin = 0;
      if (S.fase === 'tut') return tutRespuesta(g);
      const gx = g.x - (S.d - X_H), gy = laneY(g.x, l) - 60;
      S.respondidas++;
      if (ok) {
        S.aci++; S.racha++; S.errSeg = 0; const pts = 100 + Math.min(S.racha, 6) * 25; S.punt += pts; S.boost = .9; S.flash = .22; S.zorro = { est: 'celebra', t: 1.3 };
        chispas(gx, gy, 34, ['#53e08a', '#ffe27a', '#fff', '#6fd6ff'], 320, 1.1); pop('+' + pts, gx, gy - 40, '#53e08a', 34); sonidoOk();
        msg(S.racha >= 3 ? '¡RACHA ×' + S.racha + '!' : '¡CORRECTO! ' + g.q.txt.replace('?', g.q.ans), 1.6);
        if (S.jefe) { S.jefe.hp--; S.jefe.golpe = 1; S.jefe.atq = null; S.shake = .5; if (S.jefe.hp <= 0) return terminar(true); }
      } else {
        const [a, b] = g.q.key.split('x').map(Number);
        S.err++; S.racha = 0; S.errSeg++; S.fallos[g.q.key] = (S.fallos[g.q.key] || 0) + 1; S.zorro = { est: 'alerta', t: 1.8 };
        chispas(gx, gy, 18, ['#ff5a5a', '#ffb0a0'], 240, .8); msg('¡Era ' + a + ' × ' + b + ' = ' + a * b + '!', 2.4);
        daño(); if (S.errSeg === CONFIG.PISTA_TRAS_ERRORES) setTimeout(() => S && S.est === 'play' && msg('Zorrito te ayudará con una pista ✨', 2.2), 1400);
      }
      if (!S.jefe && S.respondidas >= CONFIG.RONDAS && S.fase === 'ruta') {
        S.fase = 'jefe'; S.jefe = nuevoJefe(); S.obs = S.obs.filter(ob => ob.x < S.d + 500); S.drops = S.drops.filter(d => d.x < S.d + 500);
        S.flags.push({ tipo: 'portal', x: S.d + 560 }); banner('¡' + S.jefeInfo.n + '!', 'Acierta ' + CONFIG.JEFE_HP + ' puertas para vencerlo', 3.2, '#ff7a6a'); beep(110, .6, 'sawtooth', .08);
      }
    }
    function daño() {
      if (S.inv > 0 || S.caido > 0) return false;
      if (S.escudo) { S.escudo = false; S.inv = 1.2; S.shake = .15; pop('¡Escudo!', X_H, laneY(S.d, S.lane) - 150, '#6fd6ff', 30); chispas(X_H, laneY(S.d, S.lane) - 60, 20, ['#6fd6ff', '#fff'], 260, .7); beep(500, .12, 'triangle'); return false; }
      S.vidas--; S.inv = 1.8; S.v = Math.min(S.v, 140); S.shake = .35; beep(150, .3, 'sawtooth');
      if (S.vidas <= 0) { S.caido = 2.3; S.caidas++; S.racha = 0; banner('¡SIN CORAZONES!', 'Volverás a la última bandera', 2.3, '#ff6b6b'); }
      return true;
    }
    function recogerGota(g, hx, hy) {
      g.ok = true; S.punt += 10; S.gotasTot++; S.gotas++; beep(900 + S.gotas * 40, .06, 'sine');
      S.vuelos.push({ x: hx, y: hy, sx: hx, sy: hy, tx: 28, ty: 84, t: 0, id: 'gota_agua', h: 24 });
      if (S.gotas >= CONFIG.GOTAS_X_CORAZON) {
        S.gotas = 0; S.medidor = 1;
        if (S.vidas < CONFIG.VIDAS) { S.vidas++; msg('¡8 gotas! Recuperas 1 corazón', 2.2); pop('+1 ♥', X_H, laneY(S.d, S.lane) - 150, '#ff6f8f', 34); S.vuelos.push({ x: X_H, y: laneY(S.d, S.lane) - 60, sx: X_H, sy: laneY(S.d, S.lane) - 60, tx: 30 + (S.vidas - 1) * 36, ty: 32, t: 0, id: 'corazon_desierto', h: 34 }); }
        else if (!S.escudo) { S.escudo = true; msg('¡8 gotas! Escudo de agua: bloquea 1 golpe', 2.4); pop('ESCUDO', X_H, laneY(S.d, S.lane) - 150, '#6fd6ff', 32); }
        else { S.punt += 150; pop('+150', X_H, laneY(S.d, S.lane) - 150, '#ffe27a', 30); }
        sonidoOk(); chispas(X_H, laneY(S.d, S.lane) - 60, 24, ['#6fd6ff', '#fff', '#b6f0ff'], 280, .9);
      }
    }
    function checkpoint(f) {
      f.tomada = true; const cura = S.vidas < CONFIG.VIDAS; if (cura) S.vidas++; else S.punt += 200; S.cp = { ronda: f.n, punt: S.punt, jefe: f.n === CONFIG.RONDAS }; guardar(KCP, S.cp);
      banner('CHECKPOINT', cura ? 'Avance guardado · +1 corazón' : 'Avance guardado · +200 puntos', 2.4, '#ffe27a'); S.zorro = { est: 'celebra', t: 1.5 }; sonidoOk();
      chispas(f.x - (S.d - X_H), laneY(f.x, 1) - 70, 36, ['#ffe27a', '#fff', '#ffad58'], 330, 1.1);
    }

    // ───────────────────────── actualización ─────────────────────────
    function velObjetivo() {
      if (S.fase === 'tut') return S.tut.paso >= 4 && S.tut.paso <= 5 ? CONFIG.VEL_TUT_PREG : CONFIG.VEL_TUT;
      let v = S.jefe ? CONFIG.VEL_JEFE : CONFIG.VEL_BASE + Math.min(S.respondidas, CONFIG.RONDAS) * CONFIG.VEL_SUBE;
      const g = siguienteGate(); if (g) { const d = g.x - S.d; if (d > 0 && d < CONFIG.ZONA) v *= CONFIG.FACTOR_ZONA; }
      return v + (S.boost > 0 ? 45 : 0);
    }
    function actualizar(dt) {
      S.t += dt; S.msg.t -= dt; S.inv = Math.max(0, S.inv - dt); S.boost = Math.max(0, S.boost - dt); S.flash = Math.max(0, S.flash - dt);
      S.shake = Math.max(0, S.shake - dt); S.fade = Math.max(0, S.fade - dt * 1.6); S.qpop = Math.max(0, S.qpop - dt); S.medidor = Math.max(0, S.medidor - dt * 1.5); S.iman = Math.max(0, S.iman - dt);
      if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }
      if (S.zorro.t > 0) S.zorro.t -= dt;
      if (S.caido > 0) {
        S.caido -= dt; S.v *= Math.max(0, 1 - dt * 3); S.d += S.v * dt; fxUpdate(dt);
        if (S.caido <= 0) { aplicarCheckpoint(); banner('¡OTRA VEZ!', 'Reapareces en el checkpoint · tú puedes', 2.4, '#53e08a'); }
        return;
      }
      if (S.fase === 'tut') tutorial(dt); else { generar(); buitreYJefe(dt); }
      // carril, salto y velocidad
      S.ly += (S.lane - S.ly) * Math.min(1, dt * 11); S.fly += (S.ly - S.fly) * Math.min(1, dt * 5);
      if (S.inputs.salto && S.z === 0) { S.vz = VSALTO; beep(420, .08, 'triangle'); } S.inputs.salto = false;
      S.vz -= GR * dt; S.z = Math.max(0, S.z + S.vz * dt); if (S.z === 0 && S.vz < 0) S.vz = 0; S.fz += (S.z - S.fz) * Math.min(1, dt * 7);
      S.v += (velObjetivo() - S.v) * Math.min(1, dt * 2.5); S.d += S.v * dt;
      const lh = clamp(Math.round(S.ly), 0, 2);
      // comodín: tacha una respuesta mala de la próxima puerta; dragón de origami decorativo en el cielo
      if (S.comodin) { const g = S.gates.find(g => !g.res && g.x > S.d && g.x - S.d < 1900); if (g && g.tach === undefined) { const malas = [0, 1, 2].filter(n => g.q.ops[n] !== g.q.ans); g.tach = pick(malas); } }
      S.proxD -= dt; if (!S.dragon && S.proxD <= 0 && !S.jefe && S.fase !== 'tut') { S.dragon = { x: W + 90, y: RI(60, 150) }; S.proxD = R(35, 50); }
      if (S.dragon) { S.dragon.x -= 70 * dt; if (S.dragon.x < -120) S.dragon = null; }
      // obstáculos
      S.obs.forEach(ob => {
        const dx = ob.x - S.d;
        if (ob.tipo === 'esc' && dx > -100 && dx < 800 && S.fase !== 'tut') ob.x -= 45 * dt;
        if (ob.tipo === 'ser' && !ob.cambio && dx > 0 && dx < 700) { if (ob.cd < 0) ob.cd = .9; ob.cd -= dt; if (ob.cd <= 0) { ob.cambio = true; ob.l = pick([0, 1, 2].filter(n => n !== ob.l)); chispas(ob.x - (S.d - X_H), laneY(ob.x, ob.l) - 10, 8, ['#e8c890'], 120, .5); } }
        if (!ob.hit && ob.l === lh && Math.abs(ob.x - S.d) < 28 && S.z < ob.h - 8) {
          ob.hit = true;
          if (S.fase === 'tut') { S.tut.golpeado = true; S.shake = .15; pop('¡Casi!', X_H, laneY(S.d, S.lane) - 150, '#ffb0a0', 28); beep(200, .15, 'triangle'); } else daño();
        }
      });
      // gotas (con imán suave para que se noten y se recojan)
      S.drops.forEach(g => {
        if (g.ok) return; const dx = g.x - S.d;
        if (S.iman > 0 && dx > -40 && dx < 320) { g.l = lh; g.x += (S.d - g.x) * Math.min(1, dt * 5); g.y += (S.z + 30 - g.y) * Math.min(1, dt * 5); }
        else if (g.l === lh && dx > -20 && dx < 120 && Math.abs(S.z - g.y) < 90) g.x -= (dx > 0 ? Math.min(dx, 260 * dt) : 0) * .5;
        if (g.l === lh && Math.abs(g.x - S.d) < 36 && Math.abs(S.z - g.y) < 80) recogerGota(g, X_H, laneY(S.d, S.ly) - S.z - 50);
      });
      S.gates.forEach(g => { g.t += dt; if (!g.res && S.d >= g.x) responder(g); });
      S.flags.forEach(f => { if (f.tipo !== 'portal' && !f.tomada && S.d >= f.x) checkpoint(f); });
      S.pows.forEach(pw => { if (!pw.ok && pw.l === lh && Math.abs(pw.x - S.d) < 34 && S.z < 100) recoger(pw); });
      S.cofres.forEach(c => { if (c.est === 0 && c.l === lh && Math.abs(c.x - S.d) < 34 && S.z < 45) { c.est = 1; c.t = .3; S.punt += c.oscuro ? 300 : 150; msg(c.oscuro ? '¡COFRE OSCURO! +300' : '¡COFRE! +150', 1.6); beep(780, .1, 'triangle'); setTimeout(() => beep(1040, .15), 100); } else if (c.est === 1) { c.t -= dt; if (c.t <= 0) c.est = 2; } });
      S.pads.forEach(pd => { if (pd.t > 0) pd.t -= dt; if (!pd.ok && pd.l === lh && Math.abs(pd.x - S.d) < 28 && S.z < 40) { pd.ok = true; pd.t = .35; if (pd.tipo === 'trampolin') { S.vz = 900; beep(300, .15, 'square'); setTimeout(() => beep(600, .15, 'square'), 80); } else { S.boost = Math.max(S.boost, 1.3); beep(520, .12, 'sawtooth'); } } });
      S.obs.forEach(ob => { if (ob.tipo === 'can' && !ob.fired && ob.x - S.d > 0 && ob.x - S.d < 650) { ob.fired = true; S.balas.push({ x: ob.x - 30, l: ob.l, hit: false }); beep(110, .25, 'sawtooth'); } });
      S.balas.forEach(b => { b.x -= 380 * dt; if (!b.hit && b.l === lh && Math.abs(b.x - S.d) < 26 && S.z < 44) { b.hit = true; if (daño()) msg('¡Bola de fuego!', 1.2); } });
      // zorro: avisa si hay un obstáculo cerca en tu carril
      if (S.zorro.t <= 0 && S.fase !== 'tut' && (S.obs.some(ob => ob.l === lh && ob.x - S.d > 80 && ob.x - S.d < 420 && !ob.hit) || S.balas.some(b => !b.hit && b.l === lh && b.x - S.d > 0 && b.x - S.d < 420))) S.zorro = { est: 'alerta', t: .35 };
      // estela de la alfombra
      if (Math.random() < dt * 26) S.fx.push({ x: X_H - 50, y: laneY(S.d, S.ly) - S.z - 6, vx: -R(90, 190) - S.v * .3, vy: R(-30, 30), t: .5, t0: .5, c: S.jefe ? '#ffb347' : '#ffe9a8', r: R(1.5, 3.2) });
      fxUpdate(dt);
      S.obs = S.obs.filter(ob => ob.x > S.d - 400); S.drops = S.drops.filter(g => g.x > S.d - 400); S.gates = S.gates.filter(g => !g.res || g.x > S.d - 500); S.flags = S.flags.filter(f => f.x > S.d - 500);
      S.pows = S.pows.filter(p => p.x > S.d - 400); S.cofres = S.cofres.filter(c => c.x > S.d - 400); S.pads = S.pads.filter(p => p.x > S.d - 400); S.decor = S.decor.filter(d => d.x > S.d - 500); S.balas = S.balas.filter(b => b.x > S.d - 400);
    }
    function fxUpdate(dt) {
      S.fx.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt * (p.t0 > .6 && p.r > 2 ? 1 : .2); }); S.fx = S.fx.filter(p => p.t > 0);
      S.pops.forEach(p => { p.t -= dt; p.y -= 46 * dt; }); S.pops = S.pops.filter(p => p.t > 0);
      S.vuelos.forEach(v => { v.t += dt * 1.8; const k = Math.min(1, v.t), e = k * k * (3 - 2 * k); v.x = v.sx + (v.tx - v.sx) * e; v.y = v.sy + (v.ty - v.sy) * e - Math.sin(Math.PI * e) * 60; }); S.vuelos = S.vuelos.filter(v => v.t < 1);
    }

    function buitreYJefe(dt) {
      const g = siguienteGate(), dg = g ? g.x - S.d : 9999;
      // buitre ladrón: roba gotas (no corazones); solo en el recorrido, lejos de las puertas
      S.proxB -= dt;
      if (!S.buitre && S.proxB <= 0 && !S.jefe && S.respondidas >= 3 && dg > 1100 && dg < 1500) { S.buitre = { est: 'vuelo', bx: W + 70, by: 120, t: 0, lane: 1 }; S.proxB = R(28, 40); msg('¡Buitre ladrón! Cambia de carril o salta', 2); }
      if (S.buitre) {
        const b = S.buitre; b.t += dt;
        if (b.est === 'vuelo') { b.bx -= 230 * dt; if (b.bx < X_H + 330) { b.est = 'aviso'; b.t = 0; b.lane = clamp(Math.round(S.ly), 0, 2); beep(330, .25, 'triangle'); } }
        else if (b.est === 'aviso') { b.bx -= 50 * dt; if (b.t > 1.3) { b.est = 'picada'; b.t = 0; b.x0 = b.bx; b.y0 = b.by; } }
        else if (b.est === 'picada') {
          const k = Math.min(1, b.t / .5); b.bx = b.x0 + (X_H + 40 - b.x0) * k; b.by = b.y0 + (laneY(S.d, b.lane) - 80 - b.y0) * k;
          if (k >= 1) {
            const golpe = clamp(Math.round(S.ly), 0, 2) === b.lane && S.z < 60; b.est = golpe ? 'huida' : 'sale'; b.t = 0;
            if (golpe) { if (S.gotas > 0) { const n = Math.min(4, S.gotas); S.gotas -= n; msg('¡Te robó ' + n + ' gotas!', 1.8); } else { S.punt = Math.max(0, S.punt - 80); msg('¡Te robó 80 puntos!', 1.8); } S.shake = .25; beep(160, .25, 'sawtooth'); }
          }
        } else { b.bx += (b.est === 'huida' ? 300 : -260) * dt; b.by -= 140 * dt; if (b.bx < -120 || b.bx > W + 120 || b.by < -80) S.buitre = null; }
      }
      // jefe: cada uno ataca distinto. Solo ataca con la puerta lejos (en la zona de respuesta te deja pensar).
      // escorpión/gusano: 1 carril (se esquiva cambiando de carril o saltando) · esfinge: 1 carril, NO se salta · faraón: 2 carriles (queda 1 libre)
      if (S.jefe) {
        const j = S.jefe, tipo = S.jefeInfo.id; j.cd -= dt; j.golpe = Math.max(0, j.golpe - dt * 1.4);
        if (!j.atq && j.cd <= 0 && dg > 650) { let lanes = [RI(0, 2)]; if (tipo === 'faraon') { const libre = RI(0, 2); lanes = [0, 1, 2].filter(n => n !== libre); } j.atq = { lanes, t: 0, golpe: false }; beep(260, .3, 'triangle'); }
        if (j.atq) {
          const A = j.atq; A.t += dt;
          if (A.t > 1.3 && !A.golpe) { A.golpe = true; S.shake = .3; const lh = clamp(Math.round(S.ly), 0, 2); if (A.lanes.includes(lh) && (tipo === 'esfinge' || S.z < 55) && daño()) msg(S.jefeInfo.aguijon, 1.2); }
          if (A.t > 1.7) { j.atq = null; j.cd = R(2.2, 3.2); }
        }
      }
    }

    // ───────────────────────── dibujo ─────────────────────────
    function fondo(cam) {
      const cie = cx.createLinearGradient(0, 0, 0, 330); cie.addColorStop(0, '#05061a'); cie.addColorStop(.6, '#2a1f55'); cie.addColorStop(1, '#a4506a');
      cx.fillStyle = cie; cx.fillRect(-10, -10, W + 20, H + 20);
      estrellas.forEach(s => { cx.globalAlpha = .4 + .6 * Math.abs(Math.sin(S.t + s.f)); cx.fillStyle = '#fff'; cx.fillRect(s.x, s.y, s.r, s.r); }); cx.globalAlpha = 1;
      cx.fillStyle = '#ffe9a8'; cx.beginPath(); cx.arc(800, 92, 38, 0, 7); cx.fill(); cx.fillStyle = '#2a1f55'; cx.beginPath(); cx.arc(815, 84, 34, 0, 7); cx.fill();
      cieloExtra(cam);
      cx.fillStyle = '#3a2a63'; const pc = -cam * .08 % 700; for (let i = -1; i < 3; i++) { const px = pc + i * 700 + 300; cx.beginPath(); cx.moveTo(px - 70, 262); cx.lineTo(px, 182); cx.lineTo(px + 70, 262); cx.fill(); }
      [[.12, 258, '#3a2a63', 90], [.28, 292, '#5b3a6e', 60]].forEach(([p, b, c, a]) => { cx.fillStyle = c; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W; x += 16) cx.lineTo(x, b + Math.sin((x + cam * p) / 230) * a * .5); cx.lineTo(W, H); cx.fill(); });
      S.decor.forEach(d => { const x = d.x - cam; if (x < -90 || x > W + 90) return; spr(d.id, 0, x, laneY(d.x, 0) - CARR / 2 + 6, d.alto); });
    }
    // islas flotantes, puentes lejanos y dragón de origami en el cielo (parallax lento)
    function cieloExtra(cam) {
      const per = 1700, px = ix => ((ix - cam * .05) % per + per) % per - 160;
      [['isla_desierto', 90, 150, 62], ['isla_cristal', 470, 98, 68], ['isla_hielo', 800, 168, 58], ['isla_hierba', 1180, 120, 64], ['isla_lava', 1470, 160, 60]].forEach(([id, ix, iy, al]) => spr(id, 0, px(ix), iy + al + Math.sin(S.t * .8 + ix) * 6, al, false, .92));
      spr('enredadera', 0, px(1180), 184 + Math.sin(S.t * .8 + 1180) * 6 + 30, 34, false, .85); spr('puente_colgante', 0, px(280), 205, 30, false, .7); spr('puente_piedra', 0, px(1020), 215, 34, false, .7);
      if (S.dragon) spr('dragon_origami', 0, S.dragon.x, S.dragon.y + 70 + Math.sin(S.t * 2) * 8, 70, true);
    }
    function curva(l, cam, dy, f) { for (let x = 0; x <= W + 12; x += 12) { const y = laneY(cam + x, l) + dy; f(x, y, x === 0); } }
    function banda(l, cam) {
      const base = ['#b9764f', '#cf8a58', '#e3a066'][l];
      cx.fillStyle = base; cx.beginPath(); cx.moveTo(0, H); curva(l, cam, -CARR / 2, (x, y) => cx.lineTo(x, y)); cx.lineTo(W + 12, H); cx.fill();
      // tinte del color del carril (el mismo color que su cartel de respuesta)
      cx.fillStyle = COL[l]; cx.globalAlpha = l === clamp(Math.round(S.ly), 0, 2) ? .2 : .08; cx.beginPath();
      curva(l, cam, -CARR / 2, (x, y, p) => p ? cx.moveTo(x, y) : cx.lineTo(x, y)); for (let x = W + 12; x >= 0; x -= 12) cx.lineTo(x, laneY(cam + x, l) + CARR / 2); cx.fill(); cx.globalAlpha = 1;
      cx.strokeStyle = COL[l]; cx.globalAlpha = .55; cx.lineWidth = 3; cx.beginPath(); curva(l, cam, -CARR / 2, (x, y, p) => p ? cx.moveTo(x, y) : cx.lineTo(x, y)); cx.stroke(); cx.globalAlpha = 1;
    }
    // flechas que guían hacia cada puerta (aparecen en la zona de respuesta)
    function guias(l, cam) {
      const g = siguienteGate(); if (!g) return; const d = g.x - S.d; if (d > CONFIG.ZONA + 250 || d < 40) return;
      const a0 = clamp((CONFIG.ZONA + 250 - d) / 200, 0, 1), off = (S.t * 90) % 56;
      {
        cx.strokeStyle = COL[l]; cx.lineWidth = l === S.lane ? 5 : 3; cx.lineCap = 'round'; cx.globalAlpha = a0 * (l === S.lane ? .95 : .45);
        for (let wx = S.d + 120 + off; wx < g.x - 60; wx += 56) { const sx = wx - cam, sy = laneY(wx, l) + 4; cx.beginPath(); cx.moveTo(sx - 7, sy - 9); cx.lineTo(sx + 3, sy); cx.lineTo(sx - 7, sy + 9); cx.stroke(); }
      }
      cx.globalAlpha = 1;
    }
    function dibujarCompuertas(l, cam) {
      S.gates.forEach(g => {
        let x = g.x - cam; if (x < -90 || x > W + 90) return; const y = laneY(g.x, l), alto = 98;
        let id = 'compuerta_neutral', k = 1;
        if (g.res) { id = l === g.lane ? (g.ok ? 'compuerta_correcta' : 'compuerta_incorrecta') : (l === g.corr ? 'compuerta_correcta' : 'compuerta_usada'); if (l === g.lane) { if (g.ok) k = 1 + .18 * Math.max(0, 1 - g.t * 2.5); else x += Math.sin(g.t * 55) * 5 * Math.max(0, 1 - g.t * 1.6); } }
        const cerca = !g.res && g.x - S.d < 950;
        if (cerca && l === S.lane) { const gr = cx.createRadialGradient(x, y - 50, 10, x, y - 50, 90); gr.addColorStop(0, COL[l] + 'cc'); gr.addColorStop(1, COL[l] + '00'); cx.fillStyle = gr; cx.fillRect(x - 100, y - 150, 200, 190); }
        if (!g.res && g.ayuda && l === g.corr) { cx.globalAlpha = .55 + .35 * Math.sin(S.t * 6); const gr = cx.createRadialGradient(x, y - 50, 10, x, y - 50, 100); gr.addColorStop(0, '#53e08a'); gr.addColorStop(1, '#53e08a00'); cx.fillStyle = gr; cx.fillRect(x - 110, y - 160, 220, 200); cx.globalAlpha = 1; }
        if (!spr(id, 0, x, y + 4, alto * k, false, g.tach === l && !g.res ? .3 : null)) {
          const col = !g.res ? '#ffd35a' : (l === g.lane ? (g.ok ? '#53e08a' : '#ff5a5a') : l === g.corr ? '#53e08a' : '#6b5a7a');
          cx.strokeStyle = col; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(x - 36, y); cx.lineTo(x - 36, y - 90); cx.lineTo(x + 36, y - 90); cx.lineTo(x + 36, y); cx.stroke(); cx.fillStyle = col; cx.globalAlpha = .25; cx.fillRect(x - 34, y - 88, 68, 88); cx.globalAlpha = 1;
        }
        if (g.tach === l && !g.res) { cx.strokeStyle = '#ff5a5a'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(x - 24, y - 70); cx.lineTo(x + 24, y - 24); cx.moveTo(x + 24, y - 70); cx.lineTo(x - 24, y - 24); cx.stroke(); }
        if (!g.res && g.ayuda && l === g.corr) T('▼', x, y - 118 + Math.sin(S.t * 7) * 6, 30, '#53e08a', 'center', 5);
        if (!g.res && cerca && l === S.lane && g.x - S.d < 420) T('TU RESPUESTA', x, y - 126, 15, '#fff', 'center', 4);
      });
    }
    // números de las puertas: se dibujan al final para que ningún arco los tape
    function numerosPuertas(cam) {
      S.gates.forEach(g => {
        const x = g.x - cam; if (x < -70 || x > W + 70) return;
        const dx = Math.abs(g.x - S.d), alfa = g.res ? 1 : clamp(dx / 110, .2, 1);
        for (let l = 0; l < 3; l++) {
          const y = laneY(g.x, l) - 52, mia = g.res && g.lane === l, corr = g.res && l === g.corr, txt = String(g.q.ops[l]);
          const col = !g.res ? '#fff' : (mia ? (g.ok ? '#d6ffe4' : '#ffd0d0') : corr ? '#d6ffe4' : '#a79fc4');
          cx.globalAlpha = alfa * (g.tach === l && !g.res ? .35 : 1); T(txt, x, y + 12, txt.length > 2 ? 30 : 36, col, 'center', 7); cx.globalAlpha = 1;
        }
      });
    }
    function obsSprite(ob, x, y) {
      if (ob.tipo === 'cac') return spr(ob.v ? 'cactus_barril' : 'cactus_saguaro', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'roca') return spr(ob.v === 2 ? 'piedra_agrietada' : ob.v ? 'rocas_pequenas' : 'roca_grande', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'pin') return spr('pinchos', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'sie') return spr('sierra', 0, x, y + 6 + Math.sin(S.t * 8 + ob.x) * 2, ob.alto);
      if (ob.tipo === 'can') return spr('canon', 0, x, y + 6, ob.alto, true);
      if (ob.tipo === 'oni') return spr(ob.x - S.d < 260 ? 'oni_garrote_ataque' : 'oni_garrote_guardia', 0, x, y + 6, ob.alto, true);
      if (ob.tipo === 'rueda') return spr('rueda_carreta', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'esc') return spr('escorpion_walk', S.t * 10 + ob.x, x, y + 4, ob.alto, true);
      if (ob.tipo === 'ser') return ob.cd > 0 && ob.cd < .9 && !ob.cambio ? spr('serpiente_alerta', 0, x, y + 4, ob.alto * 1.8, true) : spr('serpiente_slither', S.t * 9 + ob.x, x, y + 4, ob.alto, true);
      return false;
    }
    function obsFallback(ob, x, y) {
      cx.fillStyle = ob.tipo === 'cac' ? '#2f9e5f' : ob.tipo === 'roca' ? '#6d5a73' : ob.tipo === 'ser' ? '#c9d94a' : '#d9473f';
      cx.fillRect(x - 20, y - ob.h - 6, 40, ob.h + 6);
    }
    function dibujarLane(l, cam) {
      const sx = x => x - cam, sy = (x, dz) => laneY(x, l) - (dz || 0);
      // avisos rojos de ataque
      const atq = (S.jefe && S.jefe.atq && S.jefe.atq.lanes.includes(l)) ? S.jefe.atq : null, bu = S.buitre && (S.buitre.est === 'aviso' || S.buitre.est === 'picada') && S.buitre.lane === l;
      if (atq || bu) {
        const y = laneY(S.d, l); cx.fillStyle = 'rgba(255,40,40,' + (.2 + .18 * Math.sin(S.t * 24)) + ')'; cx.fillRect(X_H - 70, y - CARR / 2 + 6, 190, CARR - 12);
        T('!', X_H + 48, y - 56 + Math.sin(S.t * 20) * 3, 40, '#ffd35a', 'center', 6);
      }
      if (S.jefe) jefeCuerpo(l);
      if (l === 1 && S.est === 'gano') { spr('bandera_meta', 0, X_H + 330, laneY(S.d + 330, 1) + 6, 130); spr('teletransporte', 0, X_H + 480, laneY(S.d + 480, 1) + 10, 70); }
      S.flags.forEach(f => { const x = sx(f.x); if (x < -100 || x > W + 100 || l !== 1) return;
        if (f.tipo === 'portal') { spr('portal_piedra', 0, x, laneY(f.x, 1) + 10, 190, false, .95); return; }
        cx.fillStyle = 'rgba(255,226,122,' + (f.tomada ? .12 : .3) + ')'; cx.fillRect(x - 6, laneY(f.x, 0) - CARR, 12, CARR * 2 + 20);
        if (!spr('bandera_checkpoint', 0, x, laneY(f.x, 1) + 6, 120, false, f.tomada ? .65 : 1)) { cx.fillStyle = '#ff4d4d'; cx.fillRect(x, laneY(f.x, 1) - 100, 40, 26); cx.fillStyle = '#ddd'; cx.fillRect(x - 3, laneY(f.x, 1) - 100, 5, 100); }
        T(f.n < CONFIG.RONDAS ? 'CHECKPOINT' : 'JEFE', x, laneY(f.x, 1) - 126, 14, '#ffe27a', 'center', 4); });
      dibujarCompuertas(l, cam);
      S.pads.forEach(pd => { if (pd.l !== l) return; const x = sx(pd.x); if (x < -60 || x > W + 60) return; spr(pd.tipo, 0, x, sy(pd.x, 0) + 8, pd.tipo === 'trampolin' ? 44 - (pd.t > 0 ? 12 : 0) : 34, false, pd.ok && pd.tipo !== 'trampolin' ? .6 : null); });
      S.cofres.forEach(c => { if (c.l !== l) return; const x = sx(c.x); if (x < -60 || x > W + 60) return; spr(c.est === 0 ? (c.oscuro ? 'cofre_oscuro_cerrado' : 'cofre_cerrado') : c.est === 1 && !c.oscuro ? 'cofre_entreabierto' : (c.oscuro ? 'cofre_oscuro_abierto' : 'cofre_abierto'), 0, x, sy(c.x, 0) + 8, 56); });
      S.pows.forEach(pw => { if (pw.l !== l || pw.ok) return; const x = sx(pw.x); if (x < -40 || x > W + 40) return; spr(pw.tipo, 0, x, sy(pw.x, 40 + Math.sin(S.t * 4 + pw.x) * 5) + 22, 44); });
      S.balas.forEach(b => { if (b.l !== l || b.hit) return; const x = sx(b.x); if (x < -40 || x > W + 40) return; spr('bola_fuego', 0, x, sy(b.x, 14) + 22, 46); });
      S.obs.forEach(ob => { if (ob.l !== l) return; const x = sx(ob.x), y = laneY(ob.x, l); if (x < -60 || x > W + 60) return; if (!obsSprite(ob, x, y)) obsFallback(ob, x, y); });
      S.drops.forEach(g => { if (g.l !== l || g.ok) return; const x = sx(g.x), y = laneY(g.x, l) - g.y; if (x < -20 || x > W + 20) return;
        const bob = Math.sin(S.t * 4 + g.x * .05) * 3; cx.globalAlpha = .28; cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(x, laneY(g.x, l) + 3, 10, 3.5, 0, 0, 7); cx.fill(); cx.globalAlpha = 1;
        if (!spr('gota_agua', 0, x, y + 15 + bob, 32)) { cx.fillStyle = '#6fd6ff'; cx.beginPath(); cx.arc(x, y + bob, 9, 0, 7); cx.fill(); } });
      if (l === clamp(Math.round(S.fly), 0, 2)) zorro();
      if (l === clamp(Math.round(S.ly), 0, 2)) heroe();
    }

    function zorro() {
      const x = X_H - 102, wy = S.d - 102, y = laneY(wy, S.fly) - S.fz, e = S.zorro.t > 0 ? S.zorro.est : '';
      cx.globalAlpha = .3; cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(x, laneY(wy, S.fly) + 4, 30, 6, 0, 0, 7); cx.fill(); cx.globalAlpha = 1;
      const salto = e === 'celebra' ? Math.abs(Math.sin(S.t * 9)) * 14 : 0;
      const ok = e === 'celebra' ? spr('zorro_celebra', 0, x, y + 4 - salto, 84) : e === 'alerta' ? spr('zorro_alerta', 0, x, y + 4, 84) : spr('zorro_run', S.t * 11, x, y + 3, 62);
      if (!ok) { cx.fillStyle = '#f2a040'; cx.beginPath(); cx.ellipse(x, y - 20, 26, 16, 0, 0, 7); cx.fill(); }
    }
    function dibujarSprite() {      // personaje corriendo sobre la tabla (vehículo "tabla")
      const a = S.inv > 1.1 && IMG.hurt ? 'hurt' : S.z > 6 && IMG.jump ? 'jump' : S.boost > 0 && IMG.sprint ? 'sprint' : 'run', fr = IMG[a];
      if (!fr || !fr.length) return false;
      const i = a === 'jump' ? clamp(S.vz > 200 ? 0 : S.vz > 0 ? 1 : S.vz > -250 ? 2 : 3, 0, fr.length - 1) : Math.floor(S.t * 10) % fr.length, im = fr[i];
      if (!im || !im.complete || !im.naturalWidth) return false;
      if (ANT && im._ay) { const k = 118 / 235; cx.drawImage(im, -im._ax * k, -im._ay * k + 6, im.naturalWidth * k, im.naturalHeight * k); return true; }   // Antarez: se alinea por su ancla (pies)
      const h = 118, w = im.naturalWidth * h / im.naturalHeight; cx.drawImage(im, -w * .5, -h + 6, w, h); return true;
    }
    function heroe() {
      const x = X_H, gy = laneY(S.d, S.ly), y = gy - S.z, ang = Math.atan((hY(S.d + 10) - hY(S.d - 10)) / 20) * .7;
      cx.globalAlpha = clamp(.38 - S.z / 380, .08, .38); cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(x, gy + 5, 58, 9, 0, 0, 7); cx.fill(); cx.globalAlpha = 1;
      const parp = S.inv > 0 && Math.floor(S.t * 14) % 2, alfa = parp ? .4 : 1;
      let ok;
      if (vehiculo === 'vagoneta') { const id = S.z > 8 ? 'vagoneta_' + hero + '_salto' : 'vagoneta_' + hero + '_rueda'; ok = spr(id, S.t * 12, x, y + 4, 128, false, alfa, ang); }
      else if (vehiculo === 'alfombra') { const bob = S.z === 0 ? Math.sin(S.t * 5) * 3 : 0, id = S.vz > 160 ? 'alfombra_' + hero + '_sube' : S.vz < -160 ? 'alfombra_' + hero + '_baja' : 'alfombra_' + hero + '_planeo'; ok = spr(id, S.t * 5, x, y - 6 + bob, 122, false, alfa, ang); }
      else {
        cx.save(); cx.globalAlpha = alfa; cx.translate(x, y); cx.rotate(ang * .8);
        if (!spr(tablaId, 0, 0, 22, 54)) { cx.fillStyle = '#7a4a8c'; cx.beginPath(); cx.ellipse(0, 4, 40, 8, 0, 0, 7); cx.fill(); }
        ok = dibujarSprite(); cx.restore();
      }
      if (!ok) { cx.save(); cx.globalAlpha = alfa; cx.fillStyle = '#7a4a8c'; cx.fillRect(x - 40, y - 8, 80, 8); cx.fillStyle = kage ? '#4aa3ff' : '#ff6fa8'; cx.fillRect(x - 10, y - 50, 20, 40); cx.fillStyle = '#f2d1ad'; cx.beginPath(); cx.arc(x, y - 60, 12, 0, 7); cx.fill(); cx.restore(); }
      if (S.boost > 0) { cx.strokeStyle = 'rgba(111,214,255,.8)'; cx.lineWidth = 3; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(x - 70 - i * 16, y - 20 + i * 12); cx.lineTo(x - 120 - i * 16, y - 20 + i * 12); cx.stroke(); } }
      if (S.escudo) { const gr = cx.createRadialGradient(x, y - 58, 20, x, y - 58, 78); gr.addColorStop(0, 'rgba(111,214,255,.04)'); gr.addColorStop(.8, 'rgba(111,214,255,.22)'); gr.addColorStop(1, 'rgba(190,240,255,.7)'); cx.fillStyle = gr; cx.beginPath(); cx.arc(x, y - 58, 78 + Math.sin(S.t * 6) * 2, 0, 7); cx.fill(); }
    }
    // ── jefes: el escorpión persigue desde atrás, el gusano emerge delante, la esfinge y el faraón vigilan al fondo ──
    const poseJefe = () => { const j = S.jefe, A = j.atq; return S.est === 'gano' ? 'derrota' : j.golpe > 0 ? 'golpe' : A ? (A.t < 1.3 ? 'aviso' : 'ataque') : 'idle'; };
    function jefeCuerpo(l) {     // se llama en cada carril; dibuja solo cuando le toca
      const j = S.jefe, tipo = S.jefeInfo.id, A = j.atq, id = 'jefe_' + tipo + '_' + poseJefe(), sac = j.golpe > 0 ? Math.sin(S.t * 60) * 5 : 0;
      if (tipo === 'escorpion' && l === 1) {
        const bx = 40, by = laneY(S.d - 220, 1) + 34, adel = A && A.t > 1.3 ? 70 : 0; j.bx = bx + adel; j.by = by;
        cx.globalAlpha = .35; cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(bx, by + 4, 110, 14, 0, 0, 7); cx.fill(); cx.globalAlpha = 1;
        if (!spr(id, 0, bx + adel + sac, by, 235 + Math.sin(S.t * 3) * 4)) { cx.fillStyle = '#9c2f3b'; cx.beginPath(); cx.ellipse(bx, by - 50, 90, 50, 0, 0, 7); cx.fill(); }
      } else if (tipo === 'gusano' && A && S.est !== 'gano' && l === A.lanes[0]) {
        spr(id, 0, X_H + 130, laneY(S.d + 130, l) + 12, A.t < 1.3 ? 120 : 170, true);
      }
    }
    function jefeFondo(cam) {    // guardianes gigantes detrás de las dunas (no tapan nada de los carriles)
      const j = S.jefe, tipo = S.jefeInfo.id; if (!j || tipo === 'escorpion' || (tipo === 'gusano' && j.atq && S.est !== 'gano')) return;
      const bx = W - 150, by = laneY(cam + bx, 0) - CARR / 2 + 66 + (tipo === 'faraon' ? Math.sin(S.t * 3) * 6 : 0), sac = j.golpe > 0 ? Math.sin(S.t * 60) * 5 : 0;
      spr('jefe_' + tipo + '_' + poseJefe(), 0, bx + sac, by, 235, true);
    }
    function jefeRayos(cam) {    // ataques que cruzan los carriles: se dibujan encima de todo para que se vean
      const j = S.jefe; if (!j || !j.atq || !(j.atq.t > 1.3 && j.atq.t < 1.65)) return; const A = j.atq, tipo = S.jefeInfo.id, yA = l => laneY(S.d, l) - 38, bx = W - 210;
      cx.save(); cx.lineCap = 'round';
      A.lanes.forEach(l => {
        if (tipo === 'escorpion') { cx.strokeStyle = '#ffd35a'; cx.lineWidth = 9; cx.beginPath(); cx.moveTo((j.bx || 110) + 60, (j.by || 300) - 150); cx.quadraticCurveTo((j.bx || 110) + 160, (j.by || 300) - 200, X_H + 40, yA(l)); cx.stroke(); }
        else if (tipo === 'esfinge') { const g = cx.createLinearGradient(bx, 0, 0, 0); g.addColorStop(0, 'rgba(111,214,255,.95)'); g.addColorStop(1, 'rgba(111,214,255,.15)'); cx.fillStyle = g; cx.fillRect(0, yA(l) - 14, bx, 28); }
        else if (tipo === 'faraon') { cx.strokeStyle = '#e8dcc0'; cx.lineWidth = 12; cx.beginPath(); for (let x = bx; x > 0; x -= 14) { const y = yA(l) + Math.sin(x / 22 + S.t * 30) * 10; x === bx ? cx.moveTo(x, y) : cx.lineTo(x, y); } cx.stroke(); }
      });
      cx.restore();
    }
    function dibujarBuitre() {
      const b = S.buitre; if (!b) return; const id = b.est === 'picada' ? 'buitre_picada' : b.est === 'huida' ? 'buitre_huida' : 'buitre_vuelo';
      spr(id, S.t * 9, b.bx, b.by + 40, 90, b.est !== 'huida');
    }

    function dibujar() {
      const cam = S.d - X_H; cx.save();
      if (S.shake > 0) cx.translate(R(-5, 5) * S.shake * 2, R(-5, 5) * S.shake * 2);
      fondo(cam);
      viento.forEach(w => { const x = ((w.x - cam * .9 * w.s) % (W + 120) + (W + 120)) % (W + 120) - 60; cx.strokeStyle = 'rgba(255,230,190,.16)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, w.y); cx.lineTo(x - w.l, w.y + 2); cx.stroke(); });
      if (S.jefe) jefeFondo(cam);
      for (let l = 0; l < 3; l++) { banda(l, cam); guias(l, cam); dibujarLane(l, cam); }
      jefeRayos(cam); numerosPuertas(cam); dibujarBuitre();
      S.fx.forEach(p => { cx.globalAlpha = clamp(p.t / p.t0, 0, 1); cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill(); }); cx.globalAlpha = 1;
      cx.restore(); hud();
    }

    // ───────────────────────── interfaz ─────────────────────────
    function hud() {
      // corazones + medidor de agua
      for (let i = 0; i < CONFIG.VIDAS; i++) { if (!spr('corazon_desierto', 0, 30 + i * 36, 46, 36, false, i < S.vidas ? 1 : .22)) T('♥', 14 + i * 30, 36, 30, i < S.vidas ? '#ff4d6d' : '#4a3a5a'); }
      const mx = 16, my = 58, mw = 150, pul = S.medidor > 0 ? 1 + S.medidor * .35 : 1;
      caja(mx + 26, my + 4, mw, 18, 9, 'rgba(10,6,30,.7)', S.medidor > 0 ? '#fff' : '#6fd6ff', 2);
      for (let i = 0; i < CONFIG.GOTAS_X_CORAZON; i++) { const w = (mw - 8) / CONFIG.GOTAS_X_CORAZON; if (i < S.gotas) caja(mx + 30 + i * w, my + 8, w - 2, 10, 4, '#6fd6ff'); }
      if (!spr('gota_agua', 0, mx + 12, my + 28, 30 * pul)) T('💧', mx, my + 20, 20, '#6fd6ff');
      T(S.gotas + '/' + CONFIG.GOTAS_X_CORAZON + ' gotas = ♥', mx + 26, my + 40, 12, '#bfeaff', 'left', 3);
      let ix = 16; const ic = (id, t) => { if (spr(id, 0, ix + 17, 152, 34)) { if (t) T(Math.ceil(t) + 's', ix + 17, 166, 12, '#fff', 'center', 3); ix += 42; } };
      if (S.escudo) ic('poder_escarabajo'); if (S.lento > 0) ic('poder_reloj', S.lento); if (S.iman > 0) ic('poder_iman', S.iman); if (S.comodin) ic('poder_comodin');
      // pregunta
      const g = siguienteGate();
      if (g) {
        const sc = 1 + S.qpop * .35, w = 360, h = 70; cx.save(); cx.translate(W / 2, 12 + h / 2); cx.scale(sc, sc);
        caja(-w / 2, -h / 2, w, h, 16, 'rgba(12,6,34,.86)', '#ffe27a', 3);
        const lbl = S.fase === 'tut' ? 'PREGUNTA DE PRÁCTICA' : S.jefe ? 'JEFE · GOLPE ' + Math.min(S.jefe.max, S.jefe.max - S.jefe.hp + 1) + ' DE ' + S.jefe.max : 'PREGUNTA ' + Math.min(S.respondidas + 1, CONFIG.RONDAS) + ' DE ' + CONFIG.RONDAS;
        T(lbl, 0, -h / 2 + 18, 12, '#b9a8ff', 'center'); T(g.q.txt, 0, 22, 38, '#ffe27a', 'center', 5); cx.restore();
      }
      // carteles de carril (izquierda, alineados con cada carril; también se pueden tocar)
      S.chips = [];
      if (g) {
        const cam = S.d - X_H, lc = clamp(S.lane, 0, 2);
        for (let l = 0; l < 3; l++) {
          const act = l === lc, w = act ? 92 : 80, h = act ? 54 : 44, cy = laneY(cam + 52, l) - 26, x0 = 8;
          S.chips.push({ l, x: x0, y: cy - h / 2, w, h });
          cx.save(); cx.globalAlpha = g.tach === l ? .3 : act ? 1 : .8;
          if (act) { cx.shadowColor = COL[l]; cx.shadowBlur = 18; }
          caja(x0, cy - h / 2, w, h, 14, act ? COL[l] : 'rgba(14,8,36,.82)', act ? '#fff' : COL[l], act ? 4 : 3); cx.shadowBlur = 0;
          T(String(g.q.ops[l]), x0 + w / 2, cy + (act ? 11 : 9), act ? 32 : 26, act ? '#2a1030' : '#fff', 'center');
          if (g.tach === l) { cx.strokeStyle = '#ff5a5a'; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(x0 + 10, cy - 14); cx.lineTo(x0 + w - 10, cy + 14); cx.moveTo(x0 + w - 10, cy - 14); cx.lineTo(x0 + 10, cy + 14); cx.stroke(); }
          cx.restore();
          if (act) { cx.fillStyle = '#fff'; cx.beginPath(); cx.moveTo(x0 + w + 4, cy - 9); cx.lineTo(x0 + w + 18, cy); cx.lineTo(x0 + w + 4, cy + 9); cx.fill(); }
        }
      }
      // progreso (derecha)
      progreso();
      // textos
      if (S.msg.t > 0) T(S.msg.s, W / 2, g ? 114 : 120, 26, '#fff', 'center', 7);
      if (S.fase === 'tut' && S.tut) panelTutorial(g ? 160 : 100);
      bannerDib();
      S.pops.forEach(p => { cx.globalAlpha = clamp(p.t * 1.6, 0, 1); T(p.s, p.x, p.y, p.size, p.col, 'center', 6); }); cx.globalAlpha = 1;
      S.vuelos.forEach(v => { const k = clamp(v.t, 0, 1); if (!spr(v.id, 0, v.x, v.y + v.h / 2, v.h * (1 - .3 * k))) { cx.fillStyle = '#6fd6ff'; cx.beginPath(); cx.arc(v.x, v.y, 8, 0, 7); cx.fill(); } });
      if (S.pausa) { cx.fillStyle = '#000000aa'; cx.fillRect(0, 0, W, H); T('PAUSA', W / 2, H / 2, 54, '#ffe27a', 'center', 6); T('P o toca II para continuar', W / 2, H / 2 + 40, 20, '#fff', 'center'); }
      if (S.lento > 0) { cx.fillStyle = 'rgba(80,140,255,.10)'; cx.fillRect(0, 0, W, H); }
      if (S.flash > 0) { cx.fillStyle = 'rgba(120,255,170,' + S.flash * .8 + ')'; cx.fillRect(0, 0, W, H); }
      if (S.inv > 1.2 && S.caido <= 0) { cx.fillStyle = 'rgba(255,0,0,.22)'; cx.fillRect(0, 0, W, H); }
      if (S.caido > 0) { cx.fillStyle = 'rgba(40,0,10,' + clamp(.75 - S.caido * .15, 0, .7) + ')'; cx.fillRect(0, 0, W, H); }
      if (S.fade > 0) { cx.fillStyle = 'rgba(255,255,255,' + S.fade * .7 + ')'; cx.fillRect(0, 0, W, H); }
    }
    function progreso() {
      const x0 = W - 330, y0 = 58, wTot = 300;
      T('★ ' + S.punt, W - 16, 108, 20, '#ffe27a', 'right', 4);
      if (S.fase === 'tut') { T('TUTORIAL', W - 16, 66, 14, '#b9a8ff', 'right', 3); return; }
      if (S.jefe) {
        caja(W - 236, 50, 220, 18, 9, 'rgba(0,0,0,.55)', '#ff7a6a', 2); caja(W - 234, 52, 216 * clamp(S.jefe.hp / S.jefe.max, 0, 1), 14, 7, '#ff4d4d');
        T(S.jefeInfo.n, W - 16, 86, 13, '#fff', 'right', 3); return;
      }
      const n = CONFIG.RONDAS, paso = wTot / n; cx.strokeStyle = 'rgba(255,255,255,.3)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + wTot, y0); cx.stroke();
      cx.strokeStyle = '#ffe27a'; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + paso * Math.min(S.respondidas, n), y0); cx.stroke();
      for (let i = 1; i <= n; i++) {
        const x = x0 + paso * i, hecha = i <= S.respondidas, flag = CONFIG.CHECKS.includes(i) && i < n;
        if (flag) { if (!spr('bandera_checkpoint', 0, x, y0 + 4, 26, false, hecha ? 1 : .6)) T('⚑', x, y0 + 4, 18, '#ffe27a', 'center'); }
        else { cx.fillStyle = hecha ? '#ffe27a' : '#3a2a63'; cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y0, i === n ? 9 : 6, 0, 7); cx.fill(); cx.stroke(); }
      }
      T('JEFE', x0 + wTot, y0 + 28, 11, '#ff9a8a', 'center', 3);
    }
    function panelTutorial(y) {
      const L = textoTutorial(); if (!L) return; const w = 640, h = 20 + L.length * 24 + 12, x = W / 2 - w / 2;
      cx.save(); caja(x, y, w, h, 16, 'rgba(18,10,44,.92)', '#6fd6ff', 3);
      if (!spr('zorro_idle', 0, x + 56, y + h - 6, 92)) T('🦊', x + 30, y + 50, 40, '#fff');
      L.forEach((s, i) => T(s, x + 112, y + 28 + i * 24, i === 0 ? 19 : 16, i === 0 ? '#ffe27a' : '#fff', 'left', i === 0 ? 0 : 0));
      cx.restore();
      // flechas animadas en el paso de cambiar de carril
      if (S.tut.paso === 1 && S.tut.ok <= 0) { const b = Math.sin(S.t * 6) * 6, yy = laneY(S.d, S.ly); T('▲', X_H + 130, yy - 80 + b, 34, COL[0], 'center', 5); T('▼', X_H + 130, yy - 8 - b, 34, COL[2], 'center', 5); }
      if (S.tut.paso === 3) { cx.globalAlpha = .5 + .5 * Math.sin(S.t * 8); caja(10, 56, 196, 50, 14, null, '#6fd6ff', 3); cx.globalAlpha = 1; }
    }
    function bannerDib() {
      const b = S.banner; if (!b) return; const k = Math.min(1, (b.t0 - b.t) * 5, b.t * 3), y = 215 + (1 - k) * -30;
      cx.save(); cx.globalAlpha = clamp(k, 0, 1); const gr = cx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(10,6,30,0)'); gr.addColorStop(.2, 'rgba(10,6,30,.82)'); gr.addColorStop(.8, 'rgba(10,6,30,.82)'); gr.addColorStop(1, 'rgba(10,6,30,0)');
      cx.fillStyle = gr; cx.fillRect(0, y - 52, W, 112);
      if (b.s === 'CHECKPOINT') spr('bandera_checkpoint', 0, W / 2 - 190, y + 48, 96);
      T(b.s, W / 2, y + 12, 46, b.col, 'center', 8); if (b.sub) T(b.sub, W / 2, y + 46, 20, '#fff', 'center', 4); cx.restore();
    }

    // ───────────────────────── fin de partida ─────────────────────────
    function terminar(gano) {
      if (S.est !== 'play') return; S.est = gano ? 'gano' : 'perdio'; if (gano) ganadasSesion++; beep(gano ? 988 : 120, .6, gano ? 'sine' : 'sawtooth');
      if (gano) { guardar(KCP, null); S.zorro = { est: 'celebra', t: 9 }; chispas(W / 2, 220, 60, ['#ffe27a', '#53e08a', '#fff', '#ff7fae'], 420, 1.6); }
      const estr = !gano ? 0 : S.caidas > 0 ? (S.err <= 5 ? 2 : 1) : S.err <= 1 ? 3 : S.err <= 4 ? 2 : 1;
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel2 = p.nivel2 || {}; p.nivel2.fallos = S.fallos; p.nivel2.mejor = Math.max(p.nivel2.mejor || 0, S.punt); p.nivel2.intentos = (p.nivel2.intentos || 0) + 1; p.nivel2.estrellas = Math.max(p.nivel2.estrellas || 0, estr); if (gano) p.nivel2.completados = (p.nivel2.completados || 0) + 1; p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aci; p.estadisticas.errores += S.err; p.estadisticas.minutos += Math.round(S.t / 6) / 10; }); } catch (e) {} }
      setTimeout(() => {
        const p = document.createElement('div'); p.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#000000b0;color:#fff;text-align:center;padding:20px';
        const url = id => ARTE[id] ? 'assets/nivel2/' + ARTE[id].frames[0].f : '', premio = [S.jefeInfo.id === 'escorpion' ? 'trofeo_escorpion' : 'cofre_abierto', 'bandera_meta'].filter(url);
        p.innerHTML = '<div style="display:flex;align-items:flex-end;gap:14px">' + premio.map(id => '<img src="' + url(id) + '" alt="" style="height:90px">').join('') + '</div><h1 style="margin:0;color:#ffe27a">¡DERROTASTE ' + S.jefeInfo.art + ' ' + S.jefeInfo.n + '!</h1><div style="font-size:44px;color:#ffe27a;letter-spacing:6px">' + '★'.repeat(estr) + '<span style="color:#554">' + '★'.repeat(3 - estr) + '</span></div>' +
          '<div>Aciertos ' + S.aci + ' · Errores ' + S.err + ' · Puntos ' + S.punt + ' · Récord ' + Math.max(S.punt, (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.mejor) || 0) + (S.caidas ? ' · Caídas ' + S.caidas : '') + '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button id="r2">↻ REPETIR</button><button id="s2">VOLVER AL MENÚ</button></div>';
        p.querySelectorAll('button').forEach(b => b.style.cssText = 'font:inherit;font-weight:bold;padding:12px 18px;border:0;border-radius:8px;background:#ffc93c;cursor:pointer');
        root.appendChild(p); p.querySelector('#r2').onclick = () => { p.remove(); const f = S.fallos; nuevo('ruta'); S.fallos = f; ult = 0; ombit.style.display = 'none'; };
        p.querySelector('#s2').onclick = salir;
      }, gano ? 1800 : 0);
    }

    function salir() { cancelAnimationFrame(raf); removeEventListener('keydown', kd); document.removeEventListener('visibilitychange', vis); root.remove(); (o.onSalir || (() => { location.href = 'index.html'; }))(); }

    // ───────────────────────── controles ─────────────────────────
    const lane = n => { if (S && S.est === 'play' && !S.pausa) S.lane = clamp(n, 0, 2); };
    const kd = e => {
      if (!S || S.est !== 'play') return; const c = e.code;
      if (c === 'KeyP' || c === 'Escape') { S.pausa = !S.pausa; return; } if (S.pausa) return;
      if (c === 'ArrowUp' || c === 'KeyW') lane(S.lane - 1); else if (c === 'ArrowDown' || c === 'KeyS') lane(S.lane + 1);
      else if (c === 'Digit1' || c === 'Numpad1') lane(0); else if (c === 'Digit2' || c === 'Numpad2') lane(1); else if (c === 'Digit3' || c === 'Numpad3') lane(2);
      else if (c === 'Space' || c === 'KeyJ' || c === 'ArrowRight') S.inputs.salto = true;
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(c)) e.preventDefault();
    };
    addEventListener('keydown', kd);
    const vis = () => { if (document.hidden && S && S.est === 'play') S.pausa = true; };
    document.addEventListener('visibilitychange', vis);
    if (touch) {
      [['▲', 'right:14px;bottom:122px;width:64px;height:64px', () => lane(S.lane - 1)], ['▼', 'right:14px;bottom:40px;width:64px;height:64px', () => lane(S.lane + 1)], ['SALTAR', 'right:92px;bottom:40px;width:112px;height:64px', () => { if (S) S.inputs.salto = true; }]].forEach(([t, pos, fn]) => {
        const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'position:absolute;' + pos + ';border-radius:32px;border:2px solid #ffe27a;background:#ffffff26;color:#fff;font:bold 18px ' + FUENTE + ';touch-action:none';
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); }); root.appendChild(b);
      });
    }
    const sb = document.createElement('button'); sb.textContent = '✕'; sb.style.cssText = 'position:absolute;right:10px;top:10px;opacity:.55;border:0;border-radius:6px;padding:4px 8px'; sb.onclick = salir; root.appendChild(sb);
    const pb = document.createElement('button'); pb.textContent = 'II'; pb.style.cssText = 'position:absolute;right:50px;top:10px;opacity:.55;border:0;border-radius:6px;padding:4px 8px'; pb.onclick = () => { if (S && S.est === 'play') S.pausa = !S.pausa; }; root.appendChild(pb);
    const ombit = document.createElement('button'); ombit.textContent = 'OMITIR TUTORIAL ▶▶'; ombit.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:10px;border:1px solid #6fd6ff;border-radius:16px;padding:8px 16px;background:#120a2cdd;color:#fff;font:bold 14px ' + FUENTE + ';cursor:pointer;display:none'; ombit.onclick = omitirTutorial; ombit.addEventListener('pointerdown', e => e.stopPropagation()); root.appendChild(ombit);
    let sy0 = 0, sx0 = 0;
    const aDiseno = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    cv.addEventListener('pointerdown', e => { sy0 = e.clientY; sx0 = e.clientX; });
    cv.addEventListener('pointerup', e => {
      if (!S || S.est !== 'play' || S.pausa) return; const dy = e.clientY - sy0, dx = e.clientX - sx0;
      if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) { lane(S.lane + (dy < 0 ? -1 : 1)); return; }
      const p = aDiseno(e), chip = S.chips.find(c => p.x >= c.x - 4 && p.x <= c.x + c.w + 24 && p.y >= c.y - 6 && p.y <= c.y + c.h + 6);
      if (chip) lane(chip.l); else S.inputs.salto = true;
    });

    function bucle(ts) {
      const dt = Math.min(.033, ((ts - (ult || ts)) / 1000) || 0); ult = ts;
      if (S.est === 'play' && !S.pausa) { actualizar(dt * (S.lento > 0 ? .6 : 1)); S.lento = Math.max(0, S.lento - dt); } else if (S.est !== 'play') fxUpdate(dt);
      ombit.style.display = S.fase === 'tut' && S.est === 'play' ? 'block' : 'none';
      dibujar(); raf = requestAnimationFrame(bucle);
    }
    // modo: 'tut' (por defecto la primera vez), 'ruta' (sin tutorial) o 'continuar' (desde el último checkpoint)
    const hechoTut = leer(KTUT) || (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.tutorial);
    if (o.debug || /[?&]debug/.test(location.search)) window.__n2 = () => S;
    nuevo(o.modo || (hechoTut || o.directo ? 'ruta' : 'tut')); raf = requestAnimationFrame(bucle);
  }

  window.Nivel2 = { iniciar, _pregunta: pregunta, guardado: o => leer(clave(o) + '_cp'), tutorialHecho: o => !!(leer(clave(o) + '_tut') || (o && o.perfil && o.perfil.nivel2 && o.perfil.nivel2.tutorial)) };
})();
