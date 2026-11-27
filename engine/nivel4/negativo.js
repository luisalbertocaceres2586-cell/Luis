/* Mundo 4 · EL MUNDO NEGATIVO — dibujo, controles y flujo del nivel.
   La lógica (gravedad, fantasmas, retos) vive en logica.js; aquí solo se muestra y se anima.
   · Toda la sala se dibuja en "negativo" (invertida, gris, con contraste) usando modos de mezcla del canvas
     (funcionan también en Safari/iPhone, que no soporta ctx.filter).
   · Cada cristal restaurado suelta una mancha de tinta que devuelve el color por zonas. El fondo del mundo
     también va tomando color a medida que avanzas de sala.
   · Un toque en ⟲ ⟳ gira TODA la sala 90°: el héroe y los objetos se mantienen de pie, el mundo gira.
   Todo lo que se dibuja usa imágenes que ya existen en el repositorio. */
(function () {
  'use strict';
  const Lg = window.Nivel4Logica, SA = window.Nivel4Salas;
  const W = 960, H = 540, T = 56, RS = T * 9, RX = 28, RY = 18, PX = 592, PW = 340;
  const FUENTE = 'Lilita One,Trebuchet MS,Verdana,sans-serif';
  const COL = ['#35d6ff', '#ff5bd1', '#ffd84a'];
  const NOMBRE_RETO = { mult: 'Resultado', sec: 'Secuencia', sombra: 'Sombra' };
  const SIMB = { L: '◀', R: '▶', CW: '⟳', CCW: '⟲' };
  const ACC_TXT = { L: '◀ camina a la izquierda', R: '▶ camina a la derecha', CW: '⟳ gira la sala a la derecha', CCW: '⟲ gira la sala a la izquierda' };
  const CIRC = ['①', '②', '③'];
  // guía del primer nivel: se avanza sola cuando el jugador hace lo que se pide
  const COACH = [
    { ids: ['R', 'L'], msg: () => '👋 ¡Hola! Toca ▶' + (tactil() ? '' : ' (o la flecha →)') + ' para CAMINAR hacia la derecha.' },
    { ids: ['CW', 'CCW'], msg: () => '¡Muy bien! Ahora toca ⟳' + (tactil() ? '' : ' (o la tecla E)') + ' para GIRAR la sala: el suelo cambia y Sakura cae hacia él.' },
    { ids: [], msg: () => 'Lee la pregunta del panel y busca la losa con el resultado. ¡Camina y gira hasta pisarla!' }
  ];
  // explicación corta al entrar en cada sala nueva
  const INTRO = {
    2: ['👻 Las casillas de color con borde punteado son <b>fantasmas</b>: las atraviesas.', '💎 Resuelve la pregunta del <b>mismo color</b> y esas casillas se vuelven sólidas.', '① ② Hay <b>DOS preguntas</b>: cada una tiene su número y su color. Sus losas llevan ese mismo número.'],
    3: ['🪨 La <b>sombra de piedra</b> también cae cuando giras la sala.', '◎ Tu meta: dejarla caer sobre el <b>interruptor</b>.', '⚠️ Los pinchos te mandan al inicio, ¡sin castigo!'],
    4: ['Aquí vienen <b>las 3 preguntas</b> juntas: resultado, secuencia y sombra.', '👉 El panel marca cuál conviene hacer <b>PRIMERO</b>.', '💡 Si te pierdes, toca 💡: te muestra los próximos pasos.']
  };
  const AYUDA_HTML = '<h1>¿CÓMO SE JUEGA?</h1><div class="reglas"><span>⟲ ⟳ <b>GIRAR</b>: toda la sala gira y cambia el suelo. Sakura cae hacia el nuevo suelo.</span><span>◀ ▶ <b>CAMINAR</b> por el suelo.</span>' +
    '<span>① ② ③ <b>PREGUNTAS</b>: cada una tiene su número y su color. Sus losas llevan ese mismo número y color.</span><span>👻 <b>FANTASMAS</b>: se atraviesan hasta que resuelvas la pregunta de su color.</span>' +
    '<span>💎 Resuelve todas las preguntas y se abre el 🌀 <b>PORTAL</b>.</span><span>↶ Deshacer · ↺ Reiniciar · 💡 Pista: te dice el siguiente paso</span></div>';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const tactil = () => { try { return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } };
  const hash = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7 + 1.7) * 43758.5453; return v - Math.floor(v); };

  // ───────────────────────── imágenes (todas ya existen en el repositorio) ─────────────────────────
  const A = 'assets/', UI = A + 'ui/hud/';
  const RUTA = {
    fondo: A + 'environment/backgrounds/themes/montanas_ice.png', guardia: A + 'nivel1/enemigos/guardia_piedra.png',
    pinchos: A + 'nivel2/extras/pinchos.png', cristal: A + 'nivel2/extras/cristales_azules.png', portal: A + 'nivel2/extras/portal_piedra.png',
    interr: A + 'nivel2/extras/teletransporte.png', farol: A + 'nivel1/decorado/farol_templo.png', kitsune: A + 'nivel1/decorado/estatua_kitsune.png',
    bambu: A + 'nivel1/decorado/bambu_primer_plano.png', torii: A + 'nivel1/decorado/torii_activo.png',
    // arte propio del Mundo 4 (hojas 1 y 2). Si alguna falta, el juego sigue con el dibujo por código.
    n_muro: A + 'nivel4/bloques/muro_piedra.png', n_fantasma: A + 'nivel4/bloques/bloque_fantasma.png',
    n_b1: A + 'nivel4/bloques/bloque_cian.png', n_b2: A + 'nivel4/bloques/bloque_magenta.png', n_b3: A + 'nivel4/bloques/bloque_dorado.png',
    n_losa0: A + 'nivel4/bloques/losa_apagada.png', n_losa1: A + 'nivel4/bloques/losa_encendida.png', n_pinchos: A + 'nivel4/bloques/pinchos_sombra.png',
    n_sw0: A + 'nivel4/objetos/interruptor_apagado.png', n_sw1: A + 'nivel4/objetos/interruptor_encendido.png',
    n_portal0: A + 'nivel4/objetos/portal_cerrado.png', n_portal1: A + 'nivel4/objetos/portal_abierto.png', n_golem: A + 'nivel4/objetos/sombra_de_piedra.png',
    d_0: A + 'nivel4/decorado/farolillo_flotante.png', d_1: A + 'nivel4/decorado/torii_roto.png', d_2: A + 'nivel4/decorado/bambu_seco.png', d_3: A + 'nivel4/decorado/kitsune_de_piedra.png',
    d_4: A + 'nivel4/decorado/roca_flotante.png', d_5: A + 'nivel4/decorado/cerezo_marchito.png', d_6: A + 'nivel4/decorado/hongo_luminoso.png', d_7: A + 'nivel4/decorado/pergamino_runas.png',
    e_tinta1: A + 'nivel4/efectos/mancha_tinta_1.png', e_tinta2: A + 'nivel4/efectos/mancha_tinta_2.png', e_onda: A + 'nivel4/efectos/onda_de_color.png', e_destello: A + 'nivel4/efectos/destello_cristal.png',
    e_estrellas: A + 'nivel4/efectos/lluvia_de_estrellas.png', e_petalos: A + 'nivel4/efectos/petalos_de_cerezo.png', e_niebla: A + 'nivel4/efectos/niebla_gris.png', e_espiral: A + 'nivel4/efectos/espiral_de_giro.png',
    b_CCW: A + 'nivel4/botones/boton_giro_antihorario.png', b_L: A + 'nivel4/botones/boton_izquierda.png', b_R: A + 'nivel4/botones/boton_derecha.png', b_CW: A + 'nivel4/botones/boton_giro_horario.png',
    b_deshacer: A + 'nivel4/botones/boton_deshacer.png', b_reiniciar: A + 'nivel4/botones/boton_reiniciar.png', b_pista: A + 'nivel4/botones/boton_pista.png', b_pausa: A + 'nivel4/botones/boton_pausa.png',
    n_g1: A + 'nivel4/objetos/gema_cian.png', n_g2: A + 'nivel4/objetos/gema_magenta.png', n_g3: A + 'nivel4/objetos/gema_dorada.png'
  };
  const cache = {};
  function IMG(src) { let i = cache[src]; if (!i) { i = new Image(); i.src = src; cache[src] = i; } return i; }
  const listo = i => i && i.complete && i.naturalWidth > 0;

  // ───────────────────────── sonido sencillo ─────────────────────────
  let AC = null, mudo = false;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } } return AC || null; }
  function tono(f, d, tipo, vol, ini, f2) {
    if (mudo) return; const a = ac(); if (!a) return;
    try { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (ini || 0); o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05); } catch (e) { }
  }
  const sfx = {
    giro() { tono(220, 0.4, 'sawtooth', 0.05, 0, 660); tono(330, 0.4, 'sine', 0.05, 0.05, 110); },
    paso() { tono(160, 0.06, 'triangle', 0.05); },
    aterriza() { tono(90, 0.14, 'triangle', 0.08); },
    losa() { tono(520, 0.1, 'triangle', 0.07); },
    bien() { [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.3, 'triangle', 0.1, i * 0.08)); },
    cristal() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tono(f, 0.45, 'sine', 0.09, i * 0.07)); },
    error() { tono(200, 0.22, 'square', 0.05); tono(150, 0.28, 'square', 0.05, 0.12); },
    muerte() { tono(300, 0.4, 'sawtooth', 0.07, 0, 60); },
    gana() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tono(f, 0.4, 'triangle', 0.12, i * 0.12)); }
  };

  function iniciar(o) {
    o = o || {};
    Object.keys(RUTA).forEach(k => IMG(RUTA[k]));
    const marco = document.getElementById('marco'), cv = document.getElementById('cv'), ctx = cv.getContext('2d');
    const heroe = o.heroe === 'kage' ? 'kage' : 'sakura';
    const HM = heroe === 'kage' ? window.ANTAREZ_MANIFEST : window.SAKURA_EVE_MANIFEST;
    const frames = n => (HM && HM.animations && HM.animations[n] && HM.animations[n].frames) || [];
    const fps = n => (HM && HM.animations && HM.animations[n] && HM.animations[n].fps) || 8;
    ['idle', 'walk'].forEach(n => frames(n).forEach(f => IMG(HM.base + f.file)));
    const POSES = ['caer_1', 'caer_2', 'aterrizar', 'girar_mundo', 'pensando', 'asustada', 'celebrar_1', 'celebrar_2'];
    const poseImg = n => IMG(A + 'nivel4/heroe/' + (heroe === 'kage' ? 'antarez' : 'sakura') + '/' + n + '.png');
    POSES.forEach(poseImg);
    const retrato = UI + 'retratos/' + (heroe === 'kage' ? 'antarez' : 'sakura') + '_normal.png'; IMG(retrato);
    const ov = document.createElement('div'); ov.id = 'ov'; marco.appendChild(ov);

    // ── lienzos auxiliares (a la resolución del lienzo principal) ──
    let q = 1, esc = 1, rc, nc, vc, tc, mc, rcx, ncx, vcx, tcx, mcx, bgNeg = null;
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = Math.round(RS * q); return c; };
    function ajustar() {
      const iw = window.innerWidth, ih = window.innerHeight; esc = Math.min(iw / W, ih / H);
      marco.style.width = Math.floor(W * esc) + 'px'; marco.style.height = Math.floor(H * esc) + 'px'; marco.style.setProperty('--u', (esc * 0.62) + 'px');
      q = clamp(esc * Math.min(window.devicePixelRatio || 1, 2), 0.6, 2); cv.width = Math.round(W * q); cv.height = Math.round(H * q); cv.style.width = '100%'; cv.style.height = '100%';
      rc = mk(); nc = mk(); vc = mk(); tc = mk(); mc = mk(); rcx = rc.getContext('2d'); ncx = nc.getContext('2d'); vcx = vc.getContext('2d'); tcx = tc.getContext('2d'); mcx = mc.getContext('2d'); bgNeg = null;
    }
    window.addEventListener('resize', ajustar); ajustar();

    // ───────────────────────── estado ─────────────────────────
    let E = null, V = null, salaIdx = 0, vivo = true, raf = 0, ultimo = 0, pausa = false, enJuego = false, pila = [], tablasDelNivel = [2, 3, 4, 5, 6, 7, 8, 9];
    const tot = { errores: 0, aciertos: 0, pistas: 0, pasos: 0, deshacer: 0, estrellas: [] };
    const fallos = Object.assign({}, (o.perfil && o.perfil.nivel4 && o.perfil.nivel4.fallos) || {});
    const toasts = []; let particulas = [];
    const toast = (t, c, d) => toasts.push({ t, c: c || '#fff', d: d || 2.2, t0: performance.now() / 1000 });

    function cargarSala(i, mantenerNumeros) {
      salaIdx = i; const def = SA.copia(i);
      E = Lg.crear(def); E.tablas = def.tablas; E.def = def;
      // evitar repetir las preguntas que el niño ya domina: pesa más lo que falló
      Lg.rellenar(E, def.tablas, Math.random, null);
      pila = [];
      V = { hx: E.hero.x, hy: E.hero.y, en: E.enemigos.map(e => ({ x: e.x, y: e.y })), ang: 0, angObj: 0, mira: 1, mov: 0, cola: [], seg: null, pend: null, inks: /** @type {any[]} */ ([]), ordenRest: [], restPos: {}, t0: performance.now() / 1000, fx: [], pista: null, ultimaAccion: performance.now() / 1000, aterrizaT: 0, susto: 0, tShake: {}, aviso: performance.now() / 1000, erroresSala: 0, pistasSala: 0, ganaT: 0, muertoT: 0, rVis: 0, orden: /** @type {number[]} */ ([]), coach: null, guiaPasos: null, guiaMeta: 0, nudge: false, idle: false };
      try { const pl = Lg.plan(E, 400000); if (pl) V.orden = pl.orden; } catch (e) { /* sin plan: no se marca «primero» */ }
      if (def.tinte0 > 0) V.inks.push({ cx: 0, cy: 0, t0: -99, rMax: def.tinte0 * 14 * T, base: true, lobes: lobulos(i + 7) });
      const ex = findXY('X'); if (ex && V.inks[0]) { V.inks[0].cx = (ex[0] + .5) * T; V.inks[0].cy = (ex[1] + .5) * T; }
      particulas = [];
    }
    function findXY(c) { for (let y = 0; y < E.h; y++) for (let x = 0; x < E.w; x++) if (E.mapa[y][x] === c) return [x, y]; return null; }
    function lobulos(seed) { const r = []; for (let k = 0; k < 7; k++) r.push({ a: hash(seed, k) * 6.283, d: 0.15 + hash(k, seed) * 0.5, s: 0.55 + hash(seed + k, 3) * 0.45 }); return r; }

    // ───────────────────────── animación de las acciones ─────────────────────────
    const SPEED = { giro: 0.45, paso: 0.13, cae: 0.085 };
    function accion(a) {
      if (!enJuego || pausa || !E || E.gana) return;
      if (V.seg || V.cola.length) { V.pend = a; return; }
      if (E.muerto) return;
      const antes = Lg.clonar(E), rAntes = E.r;
      const res = Lg.aplicar(E, a, true);
      if (!res.valida) { if (a === 'L' || a === 'R') { V.tShake.hero = performance.now() / 1000; tono(110, 0.08, 'square', 0.04); } return; }
      pila.push(antes); if (pila.length > 200) pila.shift(); tot.pasos++; V.ultimaAccion = performance.now() / 1000; V.nudge = false; V.idle = false;
      if (V.guiaPasos) { if (V.guiaPasos[0] === a) { V.guiaPasos.shift(); V.pista = V.guiaPasos.length ? { a: V.guiaPasos[0], hasta: Infinity } : null; if (!V.guiaPasos.length) V.guiaPasos = null; } else { V.guiaPasos = null; V.pista = null; } }
      if (V.coach) { if (V.coach.paso === 0 && (a === 'L' || a === 'R')) V.coach.paso = 1; else if (V.coach.paso === 1 && (a === 'CW' || a === 'CCW')) V.coach.paso = 2; }
      V.mira = (a === 'L') ? -1 : (a === 'R') ? 1 : V.mira;
      const trazo = res.trazo || [];
      if (a === 'CW' || a === 'CCW') { V.angObj += a === 'CW' ? 90 : -90; V.cola.push({ tipo: 'giro', dur: SPEED.giro, desde: V.ang, hasta: V.angObj }); sfx.giro(); }
      let prev = { hero: { x: antes.hero.x, y: antes.hero.y }, enemigos: antes.enemigos.map(e => ({ x: e.x, y: e.y })) };
      trazo.forEach((s, i) => {
        if ((a === 'CW' || a === 'CCW') && i === 0) { prev = s; return; }
        V.cola.push({ tipo: (i === 0 && (a === 'L' || a === 'R')) ? 'paso' : 'cae', dur: (i === 0 && (a === 'L' || a === 'R')) ? SPEED.paso : SPEED.cae, de: prev, a: s });
        prev = s;
      });
      V.cola.push({ tipo: 'fin', dur: 0, ev: res.ev });
    }
    function avanzaCola(dt) {
      let guard = 0;
      while (guard++ < 8) {
        if (!V.seg) { if (!V.cola.length) break; V.seg = V.cola.shift(); V.seg.t = 0; if (V.seg.tipo === 'fin') { finAccion(V.seg.ev); V.seg = null; continue; } }
        const s = V.seg; s.t += dt; const k = clamp(s.t / s.dur, 0, 1);
        if (s.tipo === 'giro') V.ang = lerp(s.desde, s.hasta, ease(k));
        else { V.hx = lerp(s.de.hero.x, s.a.hero.x, k); V.hy = lerp(s.de.hero.y, s.a.hero.y, k); V.en = s.a.enemigos.map((e, i) => ({ x: lerp(s.de.enemigos[i].x, e.x, k), y: lerp(s.de.enemigos[i].y, e.y, k) })); V.mov = 1; }
        if (k >= 1) { dt = s.t - s.dur; if (s.tipo === 'cae') sfxAter(s); else if (s.tipo === 'paso') sfx.paso(); V.seg = null; if (!V.cola.length) V.mov = 0; } else break;
      }
      if (!V.seg && !V.cola.length) { V.mov = 0; V.hx = E.hero.x; V.hy = E.hero.y; V.en = E.enemigos.map(e => ({ x: e.x, y: e.y })); if (V.pend) { const p = V.pend; V.pend = null; accion(p); } }
    }
    function sfxAter(s) { if (s.a.hero.x === E.hero.x && s.a.hero.y === E.hero.y && !V.cola.some(c => c.tipo === 'cae')) { sfx.aterriza(); V.aterrizaT = performance.now() / 1000; } }

    function finAccion(ev) {
      const ahora = performance.now() / 1000;
      (ev || []).forEach(e => {
        if (e.t === 'cristal') {
          V.restPos[e.n] = [(e.x + .5) * T, (e.y + .5) * T]; V.ordenRest.push(e.n);
          const idx = V.ordenRest.length, req = bits(E.req), frac = req <= 1 ? 1 : idx / req;
          V.inks.push({ n: e.n, cx: (e.x + .5) * T, cy: (e.y + .5) * T, t0: ahora, rMax: (frac >= 1 ? 15 : lerp(4.6, 10, Math.pow(frac, 1.3))) * T, lobes: lobulos(e.n * 13 + salaIdx) });
          chispas((e.x + .5) * T, (e.y + .5) * T, COL[e.n - 1], 46); sfx.cristal();
          efecto(V.ordenRest.length % 2 ? 'e_tinta1' : 'e_tinta2', e.x, e.y, ahora, 1.1, T * .6, T * 3.4); efecto('e_onda', e.x, e.y, ahora, 1.3, T * .8, T * 9); efecto('e_destello', e.x, e.y, ahora, .7, T * .8, T * 2.6); efecto('e_estrellas', e.x, e.y - .6, ahora + .15, 1.5, T * 1.2, T * 2.4);
          toast('✨ ¡Cristal ' + NOMBRE_RETO[retoDe(e.n).tipo].toLowerCase() + ' restaurado!', COL[e.n - 1], 2.4);
        } else if (e.t === 'acierto') { sfx.bien(); tot.aciertos++; registrar(retoMult(), true); finCoach(); const rm = retoMult(); if (rm) rm.malos = 0; }
        else if (e.t === 'paso') { sfx.losa(); chispas((e.x + .5) * T, (e.y + .5) * T, '#ffffff', 10); }
        else if (e.t === 'error') {
          sfx.error(); V.susto = ahora; V.tShake['p' + e.pad] = ahora; tot.errores++; V.erroresSala++;
          const r = E.retos.find(r => r.pads && r.pads[e.pad]);
          finCoach(); if (r) r.malos = (r.malos || 0) + 1;
          if (r && r.tipo === 'mult') { registrar(r, false); toast('Casi… ' + r.q.T + ' × ' + r.q.n + ' no es ' + r.pads[e.pad].n + '. ¡Inténtalo otra vez!', '#ffb3b3', 3); if (r.malos >= 2) toast('💡 Cuenta de ' + r.q.T + ' en ' + r.q.T + ': ' + Lg.cuentaDe(r.q.T, r.q.n).join(', ') + ', …', '#ffe27a', 5); }
          else { toast('Ese no era el siguiente. ¡Empieza la secuencia de nuevo!', '#ffb3b3', 3); if (r && r.malos >= 2) toast('💡 Empieza por el ' + r.T + ', luego el ' + r.T * 2 + ', luego el ' + r.T * 3, '#ffe27a', 5); }
        } else if (e.t === 'interruptor') { chispas((e.x + .5) * T, (e.y + .5) * T, COL[2], 20); sfx.losa(); }
        else if (e.t === 'muerte') { sfx.muerte(); V.muertoT = ahora; setTimeout(() => { if (vivo) reaparecer(); }, 900); }
        else if (e.t === 'gana') { V.ganaT = ahora; for (let i = 0; i < 4; i++) efecto('e_petalos', 1 + i * 2, -1, ahora + i * .3, 2.8, T * 1.6, T * 1.6, 9.5); efecto('e_estrellas', E.hero.x, E.hero.y - 1, ahora, 1.6, T * 1.4, T * 2.8); sfx.gana(); setTimeout(() => { if (vivo) salaCompletada(); }, 1500); }
      });
      if (E.rest === E.req && !V.abierto && !E.gana) { V.abierto = true; toast('🌀 ¡El portal está abierto!', '#fff3b0', 2.6); }
    }
    const finCoach = () => { if (V.coach) { V.coach = null; V0.coachHecho = true; } };
    const bits = m => { let n = 0; while (m) { n += m & 1; m >>= 1; } return n; };
    const retoDe = n => E.retos.find(r => r.cristal === n);
    const retoMult = () => E.retos.find(r => r.tipo === 'mult');
    function registrar(r, ok) { if (!r || !r.q || !r.q.T || !r.q.n) return; const k = r.q.T + 'x' + r.q.n; fallos[k] = Math.max(0, (fallos[k] || 0) + (ok ? -1 : 2)); if (!fallos[k]) delete fallos[k]; }

    function reaparecer() {
      E.muerto = false; V.muertoT = 0; E.muertes++; E.r = 0; E.hero.x = E.inicio.x; E.hero.y = E.inicio.y;
      let g = 0; while ((E.mapa[E.hero.y][E.hero.x] !== '.' && E.mapa[E.hero.y][E.hero.x] !== 'H') && g++ < 20) E.hero.y--;
      Lg.caer(E, null);
      const d = ((0 - V.angObj) % 360 + 540) % 360 - 180; V.angObj += d;
      V.cola.push({ tipo: 'giro', dur: 0.5, desde: V.ang, hasta: V.angObj }); V.hx = E.hero.x; V.hy = E.hero.y; V.en = E.enemigos.map(e => ({ x: e.x, y: e.y }));
      toast('Los pinchos te devolvieron al inicio. ¡Sin problema!', '#ffe27a', 2.4);
    }
    function deshacer() {
      if (!enJuego || pausa || V.seg || V.cola.length) return; if (!pila.length) { toast('No hay nada que deshacer', '#ffffff', 1.2); return; }
      V.guiaPasos = null; V.pista = null; const e = pila.pop(); e.retos = E.retos; e.errores = E.errores; e.aciertos = E.aciertos; E = e; tot.deshacer++;
      const d = ((E.r * 90 - V.angObj) % 360 + 540) % 360 - 180; V.angObj += d; V.cola.push({ tipo: 'giro', dur: 0.3, desde: V.ang, hasta: V.angObj });
      V.hx = E.hero.x; V.hy = E.hero.y; V.en = E.enemigos.map(x => ({ x: x.x, y: x.y })); V.abierto = E.rest === E.req;
      V.inks = V.inks.filter(k => k.base || (E.rest & (1 << (k.n - 1)))); V.ordenRest = V.ordenRest.filter(n => E.rest & (1 << (n - 1))); sfx.paso();
    }
    function reiniciar() {
      if (!enJuego || pausa) return; V.guiaPasos = null; V.pista = null; const nums = E.retos.map(r => JSON.parse(JSON.stringify({ q: r.q, pads: r.pads })));
      const def = SA.copia(salaIdx); const antE = E.errores; const nuevoE = Lg.crear(def); nuevoE.retos.forEach((r, i) => { r.q = nums[i].q; r.pads = nums[i].pads; }); nuevoE.tablas = def.tablas; nuevoE.def = def; nuevoE.errores = antE;
      E = nuevoE; pila = []; V.cola = []; V.seg = null; V.pend = null; V.hx = E.hero.x; V.hy = E.hero.y; V.en = E.enemigos.map(e => ({ x: e.x, y: e.y }));
      const d = ((0 - V.angObj) % 360 + 540) % 360 - 180; V.angObj += d; V.cola.push({ tipo: 'giro', dur: 0.4, desde: V.ang, hasta: V.angObj });
      V.inks = V.inks.filter(k => k.base); V.ordenRest = []; V.abierto = false; toast('Sala reiniciada', '#ffffff', 1.4);
    }
    function pista() {
      if (!enJuego || pausa || V.seg || V.cola.length) return;
      const pl = Lg.plan(E, 300000);
      if (!pl) { toast('Desde aquí no hay salida. Usa ↶ Deshacer o ↺ Reiniciar.', '#ffe27a', 3.2); return; }
      if (!pl.sol.length) return;
      V.guiaPasos = pl.sol.slice(0, 3); V.pista = { a: V.guiaPasos[0], hasta: Infinity }; tot.pistas++; V.pistasSala++;
      const rr0 = pl.hitos.length ? E.retos.findIndex(r => r.cristal === pl.hitos[0].n) : -1; V.guiaMeta = rr0 + 1;
      toast('💡 Siguiente paso: ' + ACC_TXT[pl.sol[0]], '#ffe27a', 3.4);
    }
    const recomendado = () => {
      if (!E || E.retos.length < 2) return 0; const ord = V.orden || [];
      for (let i = 0; i < ord.length; i++) if (!(E.rest & (1 << (ord[i] - 1)))) return ord[i];
      const r = E.retos.find((q, i) => !E.hechoReto[i]); return r ? r.cristal : 0;
    };
    /** La meta de ahora, en una frase: la pregunta que conviene hacer primero (según el solucionador). */
    function meta() {
      if (E.rest === E.req) return { txt: '¡Todo restaurado! Corre al portal de salida', c: '#fff3b0', n: 0 };
      const rc = recomendado(), r = rc ? retoDe(rc) : E.retos.find((q, i) => !E.hechoReto[i]); if (!r) return null;
      const txt = r.tipo === 'mult' ? 'Resuelve ' + r.q.T + ' × ' + r.q.n + ' y pisa su resultado' : r.tipo === 'sec' ? 'Pisa ' + r.orden.map((_, i) => r.T * (i + 1)).join(' → ') + ' en orden' : 'Lleva la sombra de piedra al interruptor ◎';
      return { txt, c: COL[r.cristal - 1], n: E.retos.indexOf(r) + 1 };
    }
    function ayuda() {
      if (!enJuego || pausa || (E && E.gana)) return; pausa = true;
      pantalla(AYUDA_HTML + '<button id="vale" type="button">▶ ¡A JUGAR!</button>', 'pausa');
      document.getElementById('vale').onclick = () => { pausa = false; pantalla(''); V.ultimaAccion = performance.now() / 1000; };
    }

    // ───────────────────────── efectos con imagen (tinta, onda, destello, estrellas, pétalos) ─────────────────────────
    /** x,y en casillas del mundo; crece de s0 a s1 (px) y se desvanece. caida = casillas que baja mientras dura. */
    function efecto(k, x, y, t0, dur, s0, s1, caida) { V.fx.push({ k, x: (x + .5) * T, y: (y + .5) * T, t0, dur, s0, s1, caida: (caida || 0) * T }); }
    function dibujaEfectos(g, now) {
      V.fx = V.fx.filter(f => now - f.t0 < f.dur);
      V.fx.forEach(f => { const p = (now - f.t0) / f.dur; if (p < 0) return; const im = IMG(RUTA[f.k]); if (!listo(im)) return;
        const e = 1 - Math.pow(1 - p, 3), s = lerp(f.s0, f.s1, e), a = f.k === 'e_petalos' ? Math.sin(Math.PI * p) : (p < .15 ? p / .15 : 1 - Math.pow((p - .15) / .85, 1.5)), r = im.naturalHeight / im.naturalWidth;
        local(g, f.x + (f.k === 'e_petalos' ? Math.sin(p * 6) * 14 : 0), f.y + f.caida * p - (f.k === 'e_estrellas' ? p * T * .8 : 0), () => { g.globalAlpha = clamp(a, 0, 1); g.drawImage(im, -s / 2, -s * r / 2, s, s * r); g.globalAlpha = 1; });
      });
    }
    // ───────────────────────── partículas ─────────────────────────
    function chispas(x, y, c, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 40 + Math.random() * 190; particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0, vida: 0.6 + Math.random() * 0.8, c, r: 2 + Math.random() * 3.5 }); } }

    // ───────────────────────── dibujo ─────────────────────────
    function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function local(g, x, y, fn) { g.save(); g.translate(x, y); g.rotate(-V.ang * Math.PI / 180); fn(); g.restore(); }
    const cx = x => (x + .5) * T;
    function solidoVis(x, y) { const t = E.mapa[y][x]; if (t === '#') return true; if (!Lg.esFantasma(t)) return false; const n = t.charCodeAt(0) - 49; if (!(E.rest & (1 << (n + 0)))) return false;
      const k = V.inks.find(k => k.n === n + 1); if (!k) return true; const d = Math.hypot(cx(x) - k.cx, cx(y) - k.cy), r = k.rMax * ease(clamp((performance.now() / 1000 - k.t0) / 1.1, 0, 1)); return d <= r || (performance.now() / 1000 - k.t0) > 1.4; }

    function mundoColor() { const total = SA.salas.length; let f = salaIdx; if (E && E.req) f += bits(E.rest) / bits(E.req); if (V && V.ganaT) f = salaIdx + 1; return clamp(f / total, 0, 1); }

    // — sala en color (mundo normal), se dibuja sin rotar; luego se convierte a negativo —
    function dibujaSala(now) {
      const g = rcx; g.setTransform(q, 0, 0, q, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, RS, RS);
      const gr = g.createLinearGradient(0, 0, RS, RS); gr.addColorStop(0, '#ffe3f1'); gr.addColorStop(.5, '#ffc9a8'); gr.addColorStop(1, '#9fe3ff'); g.fillStyle = gr; g.fillRect(0, 0, RS, RS);
      // rejilla tenue + decorado de fondo (de pie)
      g.strokeStyle = 'rgba(80,40,120,.10)'; g.lineWidth = 1; for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(i * T, 0); g.lineTo(i * T, RS); g.moveTo(0, i * T); g.lineTo(RS, i * T); g.stroke(); }
      const deco = [RUTA.farol, RUTA.kitsune, RUTA.bambu, RUTA.torii];
      for (let y = 1; y < 8; y++) for (let x = 1; x < 8; x++) if (E.mapa[y][x] === '.' && hash(x + salaIdx * 9, y) > 0.88) {
        const nuevo = IMG(RUTA['d_' + Math.floor(hash(x * 3 + salaIdx, y * 7) * 8)]), im = listo(nuevo) ? nuevo : IMG(deco[(x + y + salaIdx) % 4]);
        if (listo(im)) local(g, cx(x), cx(y), () => { g.globalAlpha = .55; const k = Math.min(T * 1.1 / im.naturalWidth, T * 1.15 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; g.drawImage(im, -w / 2, T / 2 - h, w, h); g.globalAlpha = 1; });
      }
      // 1ª pasada: costados (dan volumen 3D), 2ª: caras
      const celdas = []; for (let y = 0; y < E.h; y++) for (let x = 0; x < E.w; x++) { const t = E.mapa[y][x]; if (t === '#' || (Lg.esFantasma(t) && solidoVis(x, y))) celdas.push([x, y, t]); }
      celdas.forEach(c => local(g, cx(c[0]), cx(c[1]), () => { g.fillStyle = 'rgba(10,6,30,.65)'; rr(g, -T / 2 + 5, -T / 2 + 6, T, T, 6); g.fill(); }));
      celdas.forEach(c => local(g, cx(c[0]), cx(c[1]), () => bloque(g, c[2], c[0], c[1])));
      // fantasmas sin restaurar
      for (let y = 0; y < E.h; y++) for (let x = 0; x < E.w; x++) { const t = E.mapa[y][x]; if (Lg.esFantasma(t) && !solidoVis(x, y)) local(g, cx(x), cx(y), () => fantasma(g, +t, x, y, now)); }
      // casillas especiales
      for (let y = 0; y < E.h; y++) for (let x = 0; x < E.w; x++) { const t = E.mapa[y][x]; if (t === '.' || t === '#' || Lg.esFantasma(t)) continue; local(g, cx(x), cx(y), () => especial(g, t, x, y, now)); }
      // sombras de piedra y héroe
      V.en.forEach(e => local(g, cx(e.x), cx(e.y), () => enemigo(g, now)));
      local(g, cx(V.hx), cx(V.hy), () => dibujaHeroe(g, now));
      dibujaEfectos(g, now);
      // partículas
      particulas.forEach(p => { g.globalAlpha = clamp(1 - p.t / p.vida, 0, 1); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); }); g.globalAlpha = 1;
    }
    function bloque(g, t, x, y) {
      const fan = Lg.esFantasma(t), c = fan ? COL[+t - 1] : null;
      const spr = IMG(fan ? RUTA['n_b' + t] : RUTA.n_muro); if (listo(spr)) { g.drawImage(spr, -T / 2 - 1, -T / 2 - 1, T + 2, T + 2); return; }
      const gr = g.createLinearGradient(-T / 2, -T / 2, T / 2, T / 2);
      if (fan) { gr.addColorStop(0, '#fff'); gr.addColorStop(.3, c); gr.addColorStop(1, '#2a2a6a'); } else { gr.addColorStop(0, '#6e4fb0'); gr.addColorStop(.5, '#46307f'); gr.addColorStop(1, '#25173f'); }
      g.fillStyle = gr; rr(g, -T / 2, -T / 2, T, T, 6); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-T / 2 + 6, T / 2 - 4); g.lineTo(-T / 2 + 2, -T / 2 + 6); g.arcTo(-T / 2 + 2, -T / 2 + 2, -T / 2 + 8, -T / 2 + 2, 5); g.lineTo(T / 2 - 6, -T / 2 + 2); g.stroke();
      g.strokeStyle = 'rgba(10,0,40,.5)'; g.beginPath(); g.moveTo(T / 2 - 2, -T / 2 + 8); g.lineTo(T / 2 - 2, T / 2 - 6); g.lineTo(-T / 2 + 8, T / 2 - 2); g.stroke();
      // grietas y musgo (siempre iguales para cada casilla)
      g.strokeStyle = 'rgba(20,10,50,.35)'; g.lineWidth = 1.4; g.beginPath(); const h1 = hash(x, y), h2 = hash(y, x + 5); g.moveTo(-T / 2 + h1 * T, -T / 2 + 4); g.lineTo(-T / 2 + h1 * T + 8, -4 + h2 * 10); g.lineTo(-T / 2 + h2 * T, T / 2 - 4); g.stroke();
      if (!fan) { g.fillStyle = 'rgba(120,230,130,.75)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-T / 2 + 6 + hash(x + i, y) * (T - 12), -T / 2 + 5 + hash(y, x + i) * 12, 2 + hash(i, x + y) * 2.4, 0, 6.283); g.fill(); } }
      else { g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(-8, -T / 2 + 6); g.lineTo(2, -T / 2 + 6); g.lineTo(-10, 8); g.lineTo(-18, 8); g.closePath(); g.fill(); }
    }
    function fantasma(g, n, x, y, now) {
      const c = COL[n - 1], pulso = .5 + .5 * Math.sin(now * 2.2 + x + y);
      const sp = IMG(RUTA.n_fantasma); if (listo(sp)) { g.globalAlpha = .38 + .2 * pulso; g.drawImage(sp, -T / 2, -T / 2, T, T); g.globalAlpha = 1; }
      g.fillStyle = c; g.globalAlpha = .1 + .08 * pulso; rr(g, -T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 6); g.fill(); g.globalAlpha = .85;
      g.strokeStyle = c; g.lineWidth = 2; g.setLineDash([6, 5]); g.lineDashOffset = -now * 12; rr(g, -T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 6); g.stroke(); g.setLineDash([]);
      g.globalAlpha = .5; g.lineWidth = 1.2; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(-T / 2 + 6, i * 11 + 6 * Math.sin(now * 2 + i)); g.lineTo(T / 2 - 6, i * 11 - 8); } g.stroke(); g.globalAlpha = 1;
    }
    function texto(g, s, x, y, tam, col, borde, alin) { g.font = ''+tam + 'px ' + FUENTE; g.textAlign = alin || 'center'; g.textBaseline = 'middle'; if (borde) { g.lineWidth = Math.max(3, tam / 5); g.strokeStyle = borde; g.lineJoin = 'round'; g.strokeText(s, x, y); } g.fillStyle = col; g.fillText(s, x, y); }
    function especial(g, t, x, y, now) {
      if (t === '^') { const im = IMG(listo(IMG(RUTA.n_pinchos)) ? RUTA.n_pinchos : RUTA.pinchos); if (listo(im)) { const w = T * .95, h = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, -w / 2, T / 2 - h, w, h); } return; }
      if (t === 'S') { const on = E.retos.some((r, i) => r.tipo === 'sombra' && E.hechoReto[i]), nuevo = IMG(on ? RUTA.n_sw1 : RUTA.n_sw0); if (listo(nuevo)) { const h = T * (on ? 1.25 : 1.05), w = h * nuevo.naturalWidth / nuevo.naturalHeight; g.drawImage(nuevo, -w / 2, T / 2 - h + 2, w, h); return; } const im = IMG(RUTA.interr); const k = on ? 1 : .8 + .2 * Math.sin(now * 3); if (listo(im)) { const w = T * 1.05, h = w * im.naturalHeight / im.naturalWidth; g.globalAlpha = .75 + .25 * k; g.drawImage(im, -w / 2, T / 2 - h + 2, w, h); g.globalAlpha = 1; } else { g.fillStyle = COL[2]; g.fillRect(-T / 3, T / 2 - 8, T * .66, 8); } return; }
      if (t === 'X') {
        const abierto = E.rest === E.req, nuevoP = IMG(abierto ? RUTA.n_portal1 : RUTA.n_portal0), im = listo(nuevoP) ? nuevoP : IMG(RUTA.portal);
        if (listo(im)) { const h = T * 1.1, w = h * im.naturalWidth / im.naturalHeight; g.globalAlpha = listo(nuevoP) ? 1 : (abierto ? 1 : .45); g.drawImage(im, -w / 2, T / 2 - h, w, h); g.globalAlpha = 1; }
        if (abierto && !listo(nuevoP)) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, T * .42 + 3 * Math.sin(now * 5), 0, 6.283); g.stroke(); }
        return;
      }
      // losas de respuesta (a b c) y de secuencia (p q r)
      const reto = E.retos.find(r => r.pads && r.pads[t]); if (!reto) return;
      const pad = reto.pads[t], c = COL[reto.cristal - 1], hecho = E.hechoReto[E.retos.indexOf(reto)];
      const sh = V.tShake['p' + t] ? clamp(1 - (now - V.tShake['p' + t]) / 0.5, 0, 1) : 0, dx = Math.sin(now * 60) * 5 * sh;
      const iluminada = reto.tipo === 'sec' && E.prog[E.retos.indexOf(reto)] > reto.orden.indexOf(t);
      g.translate(dx, 0);
      const lo = IMG(hecho || iluminada ? RUTA.n_losa1 : RUTA.n_losa0);
      if (listo(lo)) {
        const w = T * .92, h = w * lo.naturalHeight / lo.naturalWidth, hunde = sh > 0 ? 2 : 0;
        g.globalAlpha = .3 + .12 * Math.sin(now * 3 + x); g.fillStyle = c; g.beginPath(); g.ellipse(0, T / 2 - h * .5, T * .5, h * .55, 0, 0, 6.283); g.fill(); g.globalAlpha = 1;
        g.drawImage(lo, -w / 2, T / 2 - h + 1 + hunde, w, h);
        if (sh > 0) { g.globalAlpha = .45 * sh; g.fillStyle = '#ff3b3b'; g.fillRect(-w / 2, T / 2 - h + 1, w, h); g.globalAlpha = 1; }
        texto(g, String(pad.n), 0, T / 2 - h / 2 + 1, pad.n > 99 ? 19 : 23, '#fff', 'rgba(10,0,40,.9)');
        return;
      }
      g.fillStyle = 'rgba(10,6,30,.55)'; rr(g, -T * .44, T / 2 - 14, T * .88, 14, 5); g.fill();
      const gr = g.createLinearGradient(0, T / 2 - 14, 0, T / 2); gr.addColorStop(0, sh > 0 ? '#ff6a6a' : (hecho || iluminada ? '#fff' : c)); gr.addColorStop(1, '#222'); g.fillStyle = gr; rr(g, -T * .44, T / 2 - 14, T * .88, 11, 5); g.fill();
      g.globalAlpha = .28 + .12 * Math.sin(now * 3 + x); g.fillStyle = c; g.beginPath(); g.arc(0, 0, T * .36, 0, 6.283); g.fill(); g.globalAlpha = 1;
      texto(g, String(pad.n), 0, -2, pad.n > 99 ? 20 : 24, '#fff', 'rgba(10,0,40,.85)');
      if (reto.tipo === 'sec') texto(g, '', 0, -T * .5, 10, '#fff');
    }
    function enemigo(g, now) {
      const im = IMG(listo(IMG(RUTA.n_golem)) ? RUTA.n_golem : RUTA.guardia); g.fillStyle = 'rgba(10,6,30,.5)'; g.beginPath(); g.ellipse(0, T / 2 - 2, T * .38, 6, 0, 0, 6.283); g.fill();
      if (listo(im)) { const h = T * 1.08 + Math.sin(now * 2) * 1.2, w = h * im.naturalWidth / im.naturalHeight; g.drawImage(im, -w / 2, T / 2 - h + 2, w, h); } else { g.fillStyle = '#777'; g.fillRect(-T / 3, -T / 3, T * .66, T * .8); }
    }
    /** Poses propias del héroe en este mundo (Sakura y Antarez). Si falta la imagen se usan los cuadros normales. */
    function poseHeroe(now) {
      if (V.ganaT) return (Math.floor((now - V.ganaT) * 2) % 2) ? 'celebrar_2' : 'celebrar_1';
      if (V.muertoT && now - V.muertoT < 1.3) return 'asustada';
      if (V.susto && now - V.susto < 0.9) return 'asustada';
      if (V.seg && V.seg.tipo === 'giro') return 'girar_mundo';
      if (V.seg && V.seg.tipo === 'cae' && (V.seg.de.hero.x !== V.seg.a.hero.x || V.seg.de.hero.y !== V.seg.a.hero.y)) return (Math.floor(now * 9) % 2) ? 'caer_2' : 'caer_1';
      if (V.mov) return null;
      if (V.aterrizaT && now - V.aterrizaT < 0.25) return 'aterrizar';
      if ((V.pista && now < V.pista.hasta) || (enJuego && !pausa && now - V.ultimaAccion > 8)) return 'pensando';
      return null;
    }
    function dibujaHeroe(g, now) {
      g.fillStyle = 'rgba(10,6,30,.5)'; g.beginPath(); g.ellipse(0, T / 2 - 2, T * .3, 5.5, 0, 0, 6.283); g.fill();
      const pn = poseHeroe(now);
      if (pn) {
        const pim = poseImg(pn), ref = poseImg('pensando');
        if (listo(pim) && listo(ref)) {
          const k = (T * 1.3) / ref.naturalHeight, w = pim.naturalWidth * k, h = pim.naturalHeight * k, dis0 = V.muertoT ? clamp((now - V.muertoT) / 1.1, 0, 1) : 0;
          g.save(); g.translate(0, T / 2 - 2); g.scale(V.mira < 0 ? -1 : 1, 1); if (dis0 > 0) g.globalAlpha = 1 - dis0 * .6;
          if (pn.indexOf('celebrar') === 0) g.translate(0, -Math.abs(Math.sin((now - V.ganaT) * 5)) * 7);
          g.drawImage(pim, -w / 2, -h, w, h); g.restore(); return;
        }
      }
      const anim = V.mov ? 'walk' : 'idle', lst = frames(anim); if (!lst.length) { g.fillStyle = '#fff'; g.fillRect(-10, -T / 2, 20, T); return; }
      const ref = frames('idle')[0] || lst[0], k = (T * 1.3) / ref.h;
      const f = lst[Math.floor(now * fps(anim)) % lst.length], im = IMG(HM.base + f.file);
      const sh = V.tShake.hero ? clamp(1 - (now - V.tShake.hero) / 0.25, 0, 1) : 0, dis = V.muertoT ? clamp((now - V.muertoT) / 0.8, 0, 1) : 0;
      g.save(); g.translate(Math.sin(now * 70) * 3 * sh, T / 2 - 2); g.scale(V.mira < 0 ? -1 : 1, 1); if (dis > 0) g.globalAlpha = 1 - dis;
      if (listo(im)) g.drawImage(im, -f.ax * k, -f.ay * k, f.w * k, f.h * k); g.restore();
    }

    // — conversión a negativo + tinta de color —
    function componer(now) {
      const g = ncx; g.setTransform(q, 0, 0, q, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, RS, RS); g.drawImage(rc, 0, 0, RS, RS);
      g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, RS, RS);                 // invertir
      g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, RS, RS);              // gris
      tcx.setTransform(q, 0, 0, q, 0, 0); tcx.globalCompositeOperation = 'source-over'; tcx.clearRect(0, 0, RS, RS); tcx.drawImage(nc, 0, 0, RS, RS);
      g.globalCompositeOperation = 'overlay'; g.drawImage(tc, 0, 0, RS, RS); g.globalCompositeOperation = 'soft-light'; g.drawImage(tc, 0, 0, RS, RS);   // contraste
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(205,215,240,1)'; g.fillRect(0, 0, RS, RS); g.globalCompositeOperation = 'source-over';
      // máscara de tinta
      const m = mcx; m.setTransform(q, 0, 0, q, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, RS, RS);
      V.inks.forEach(k => { const p = ease(clamp((now - k.t0) / 1.1, 0, 1)); if (p <= 0) return; const R = k.rMax * p; blob(m, k.cx, k.cy, R); k.lobes.forEach(l => blob(m, k.cx + Math.cos(l.a) * R * l.d, k.cy + Math.sin(l.a) * R * l.d, R * l.s)); });
      vcx.setTransform(q, 0, 0, q, 0, 0); vcx.globalCompositeOperation = 'source-over'; vcx.clearRect(0, 0, RS, RS); vcx.drawImage(rc, 0, 0, RS, RS); vcx.globalCompositeOperation = 'destination-in'; vcx.drawImage(mc, 0, 0, RS, RS); vcx.globalCompositeOperation = 'source-over';
    }
    function blob(m, x, y, r) { if (r < 1) return; const gr = m.createRadialGradient(x, y, r * .78, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = gr; m.beginPath(); m.arc(x, y, r, 0, 6.283); m.fill(); }

    function fondo(g, now) {
      const im = IMG(RUTA.fondo), mc2 = mundoColor();
      if (listo(im) && !bgNeg) { bgNeg = document.createElement('canvas'); bgNeg.width = Math.round(W * q); bgNeg.height = Math.round(H * q); const b = bgNeg.getContext('2d'); b.setTransform(q, 0, 0, q, 0, 0);
        const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); b.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
        b.globalCompositeOperation = 'difference'; b.fillStyle = '#fff'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'saturation'; b.fillStyle = '#808080'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'multiply'; b.fillStyle = 'rgb(190,200,225)'; b.fillRect(0, 0, W, H); }
      g.fillStyle = '#080a18'; g.fillRect(0, 0, W, H);
      if (bgNeg) { g.drawImage(bgNeg, 0, 0, W, H); }
      if (listo(im) && mc2 > 0) { g.globalAlpha = mc2; const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); g.globalAlpha = 1; }
      g.fillStyle = 'rgba(6,8,20,.55)'; g.fillRect(0, 0, W, H);
    }

    // ───────────────────────── panel y botones ─────────────────────────
    const BTN = [], presion = {};
    (function () { const y1 = 354, w = 76, gp = 10; ['CCW', 'L', 'R', 'CW'].forEach((a, i) => BTN.push({ id: a, x: PX + 8 + i * (w + gp), y: y1, w, h: 84 }));
      ['deshacer', 'reiniciar', 'pista', 'pausa'].forEach((a, i) => BTN.push({ id: a, x: PX + 8 + i * (w + gp), y: y1 + 92, w, h: 54 })); })();
    BTN.push({ id: 'ayuda', x: RX + RS - 46, y: RY + 8, w: 38, h: 38 });   // «?» pequeño en la esquina del tablero (no tiene sprite)
    const resaltado = id => { const t = performance.now() / 1000; return !!((V.pista && t < V.pista.hasta && V.pista.a === id) || (V.coach && COACH[V.coach.paso].ids.indexOf(id) >= 0) || (id === 'pista' && V.idle)); };
    function boton(g, b, now) {
      const pistaA = resaltado(b.id), pulso = pistaA ? .5 + .5 * Math.sin(now * 9) : 0, im = IMG(RUTA['b_' + b.id]);
      if (b.id === 'ayuda') { const pr0 = presion.ayuda ? clamp(1 - (now - presion.ayuda) / 0.16, 0, 1) : 0, cx0 = b.x + b.w / 2, cy0 = b.y + b.h / 2; g.fillStyle = 'rgba(10,10,30,.88)'; g.beginPath(); g.arc(cx0, cy0, 18 - 2 * pr0, 0, 6.283); g.fill(); g.strokeStyle = '#ffe27a'; g.lineWidth = 2.5; g.stroke(); texto(g, '?', cx0, cy0 + 1, 22, '#ffe27a'); return; }
      const pr = presion[b.id] ? clamp(1 - (now - presion[b.id]) / 0.16, 0, 1) : 0, esc2 = 1 - .08 * pr;
      if (listo(im)) {
        g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2 + pr * 2); g.scale(esc2, esc2);
        if (pistaA) { g.shadowColor = '#ffe27a'; g.shadowBlur = 16 + 12 * pulso; }
        g.drawImage(im, -b.w / 2, -b.h / 2, b.w, b.h); g.restore(); return;
      }
      const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, pistaA ? '#ffe27a' : '#4a4a7a'); gr.addColorStop(1, '#20203f');
      g.fillStyle = gr; rr(g, b.x, b.y, b.w, b.h, 12); g.fill(); g.lineWidth = pistaA ? 3 : 2; g.strokeStyle = pistaA ? 'rgba(255,226,122,' + (.6 + .4 * pulso) + ')' : 'rgba(255,255,255,.28)'; g.stroke();
      g.font = '22px ' + FUENTE; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText({ CCW: '⟲', CW: '⟳', L: '◀', R: '▶', deshacer: '↶', reiniciar: '↺', pista: '💡', pausa: 'II' }[b.id] || '', b.x + b.w / 2, b.y + b.h / 2);
    }
    const gris = {};
    function gemaGris(im, n) { if (gris[n]) return gris[n]; const c = document.createElement('canvas'); c.width = 64; c.height = 64; const k = c.getContext('2d'); const r = Math.min(64 / im.naturalWidth, 64 / im.naturalHeight); k.drawImage(im, 32 - im.naturalWidth * r / 2, 32 - im.naturalHeight * r / 2, im.naturalWidth * r, im.naturalHeight * r); k.globalCompositeOperation = 'saturation'; k.fillStyle = '#808080'; k.fillRect(0, 0, 64, 64); k.globalCompositeOperation = 'source-atop'; k.fillStyle = 'rgba(15,15,35,.55)'; k.fillRect(0, 0, 64, 64); gris[n] = c; return c; }
    function gema(g, x, y, n, on, now) {
      const im = IMG(RUTA['n_g' + n]);
      if (listo(im)) { const r = Math.min(40 / im.naturalWidth, 40 / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r;
        if (on) { g.save(); g.shadowColor = COL[n - 1]; g.shadowBlur = 14 + 6 * Math.sin(now * 3); g.drawImage(im, x - w / 2, y - h / 2, w, h); g.restore(); }
        else g.drawImage(gemaGris(im, n), x - 20, y - 20, 40, 40);
        return; }
      g.save(); g.translate(x, y); const c = COL[n - 1];
      g.beginPath(); g.moveTo(0, -16); g.lineTo(13, -4); g.lineTo(8, 14); g.lineTo(-8, 14); g.lineTo(-13, -4); g.closePath();
      if (on) { const gr = g.createLinearGradient(-13, -16, 13, 14); gr.addColorStop(0, '#fff'); gr.addColorStop(.4, c); gr.addColorStop(1, c); g.fillStyle = gr; g.shadowColor = c; g.shadowBlur = 14 + 6 * Math.sin(now * 3); g.fill(); g.shadowBlur = 0; }
      else { g.fillStyle = '#2a2a3a'; g.fill(); g.strokeStyle = '#6a6a85'; g.lineWidth = 2; g.stroke(); }
      g.restore();
    }
    /** Distintivo redondo con el número de la pregunta (① ② ③) en su color. */
    function insignia(g, x, y, n, c, ok, r) {
      g.save(); g.fillStyle = ok ? '#4fd17f' : c; g.strokeStyle = 'rgba(10,0,40,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke(); g.fill();
      texto(g, ok ? '✔' : String(n), x, y + 1, r * 1.3, '#10082e'); g.restore();
    }
    /** Pantalla (x, y) del centro de una casilla del mundo, con la sala girada. */
    function pantallaDe(x, y) { const a = V.ang * Math.PI / 180, dx = (x + .5) * T - RS / 2, dy = (y + .5) * T - RS / 2; return [RX + RS / 2 + dx * Math.cos(a) - dy * Math.sin(a), RY + RS / 2 + dx * Math.sin(a) + dy * Math.cos(a)]; }
    function etiqueta(g, s, x, y, c) { g.font = '13px ' + FUENTE; const w = g.measureText(s).width + 18; g.fillStyle = 'rgba(10,10,30,.88)'; rr(g, x - w / 2, y - 12, w, 24, 12); g.fill(); g.strokeStyle = c; g.lineWidth = 2; g.stroke(); texto(g, s, x, y + 1, 13, '#fff'); }
    /** Capa EN COLOR sobre el tablero (el tablero va en negativo/gris): une cada losa, fantasma y sombra con su pregunta. */
    function capaColor(g, now) {
      g.save(); rr(g, RX, RY, RS, RS, 14); g.clip();
      const a = V.ang * Math.PI / 180, pul = .5 + .5 * Math.sin(now * 4), num = r => E.retos.indexOf(r) + 1;
      const anillo = (x, y, c, k) => { const p = pantallaDe(x, y); g.save(); g.translate(p[0], p[1]); g.rotate(a); g.globalAlpha = .12 + .1 * pul; g.fillStyle = c; rr(g, -T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 9); g.fill(); g.globalAlpha = k; g.strokeStyle = c; g.lineWidth = 3; rr(g, -T / 2 + 3, -T / 2 + 3, T - 6, T - 6, 9); g.stroke(); g.restore(); };
      const marca = (x, y, r, rad) => { const p = pantallaDe(x, y); insignia(g, p[0] - T / 2 + 11, p[1] - T / 2 + 11, num(r), COL[r.cristal - 1], false, rad || 10); };
      const sombraReto = E.retos.find(q => q.tipo === 'sombra'), sombraPend = sombraReto && !E.hechoReto[E.retos.indexOf(sombraReto)];
      for (let y = 0; y < E.h; y++) for (let x = 0; x < E.w; x++) {
        const t = E.mapa[y][x]; if (t === '.' || t === '#') continue;
        if (Lg.esFantasma(t)) { if (!solidoVis(x, y)) { const r = retoDe(+t); if (r) { anillo(x, y, COL[r.cristal - 1], .5); marca(x, y, r, 9); } } continue; }
        const r = E.retos.find(q => q.pads && q.pads[t]);
        if (r) {
          const k = E.retos.indexOf(r); if (E.hechoReto[k]) continue; const c = COL[r.cristal - 1];
          if (r.tipo === 'sec') {
            const i = r.orden.indexOf(t); if (E.prog[k] > i) { anillo(x, y, '#7ee89a', .85); continue; }
            anillo(x, y, c, E.prog[k] === i ? .6 + .4 * pul : .5); marca(x, y, r); const p = pantallaDe(x, y); texto(g, (i + 1) + 'º', p[0] + T / 2 - 12, p[1] - T / 2 + 11, 13, '#fff', 'rgba(10,0,40,.95)');
          } else { anillo(x, y, c, .8); marca(x, y, r); }
          continue;
        }
        if (t === 'S' && sombraPend) { anillo(x, y, COL[sombraReto.cristal - 1], .9); marca(x, y, sombraReto); }
        if (t === 'X') { const p = pantallaDe(x, y), falta = bits(E.req) - bits(E.rest); if (falta <= 0) { g.strokeStyle = 'rgba(255,255,255,' + (.5 + .4 * pul) + ')'; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], T * .55 + 3 * pul, 0, 6.283); g.stroke(); etiqueta(g, '🌀 SALIDA', p[0], p[1] - T * .78, '#fff3b0'); } else etiqueta(g, '🔒 faltan ' + falta + ' 💎', p[0], p[1] - T * .78, '#9fb0ff'); }
      }
      if (sombraPend) V.en.forEach(e => { const p = pantallaDe(e.x, e.y); insignia(g, p[0], p[1] - T * .9, num(sombraReto), COL[sombraReto.cristal - 1], false, 10); });
      g.restore();
    }
    /** Cuadro de texto con ajuste de línea, anclado por arriba (abajo = false) o por abajo (abajo = true). */
    function pildora(g, s, yBase, c, tam, abajo) {
      g.font = ''+tam + 'px ' + FUENTE; const mw = RS - 40, pal = s.split(' '), lin = []; let ln = '';
      pal.forEach(p => { const t = ln ? ln + ' ' + p : p; if (g.measureText(t).width > mw - 30 && ln) { lin.push(ln); ln = p; } else ln = t; }); if (ln) lin.push(ln);
      const w = Math.min(mw, Math.max.apply(null, lin.map(l => g.measureText(l).width)) + 30), h = lin.length * (tam + 5) + 12, x = RX + RS / 2 - w / 2, y = abajo ? yBase - h : yBase;
      g.fillStyle = 'rgba(10,10,30,.9)'; rr(g, x, y, w, h, 14); g.fill(); g.strokeStyle = c; g.lineWidth = 2; g.stroke();
      lin.forEach((l, i) => texto(g, l, RX + RS / 2, y + 6 + (tam + 5) * i + (tam + 5) / 2, tam, '#fff'));
    }
    /** Franja de arriba: la META de ahora. Franja de abajo: lo que toca hacer (guía, pista o consejo). */
    function bandas(g, now) {
      g.save(); rr(g, RX, RY, RS, RS, 14); g.clip();
      const m = meta();
      if (m) {
        const maxW = RS - 100, pad = m.n ? 82 : 40; let tam = 17; g.font = ''+tam + 'px ' + FUENTE;
        while (tam > 11 && g.measureText(m.txt).width + pad > maxW) { tam--; g.font = ''+tam + 'px ' + FUENTE; }
        const w = Math.min(maxW, g.measureText(m.txt).width + pad), mid = RX + (RS - 50) / 2, x = mid - w / 2;   // deja libre la esquina del botón «?»
        g.fillStyle = 'rgba(10,10,30,.9)'; rr(g, x, RY + 8, w, 36, 18); g.fill(); g.strokeStyle = m.c; g.lineWidth = 2; g.stroke();
        if (m.n) { insignia(g, x + 22, RY + 26, m.n, m.c, false, 13); texto(g, '🎯 ' + m.txt, x + 42, RY + 27, tam, '#fff', null, 'left'); } else texto(g, '🌀 ' + m.txt, mid, RY + 27, tam, '#fff');
      }
      let msg = '', col = '#ffe27a';
      if (V.guiaPasos && V.guiaPasos.length) msg = '💡 Ahora: ' + ACC_TXT[V.guiaPasos[0]] + (V.guiaPasos.length > 1 ? '   ·   luego: ' + V.guiaPasos.slice(1).map(a => SIMB[a]).join(' ') : '') + (V.guiaMeta ? '   ·   vas por ' + CIRC[V.guiaMeta - 1] : '');
      else if (V.coach) msg = COACH[V.coach.paso].msg();
      else if (V.idle) msg = '¿Te atascaste? Toca 💡 y te muestro el siguiente paso.';
      else if (now - V.aviso < 12 && E.def.aviso) { msg = E.def.aviso; col = '#9fb0ff'; }
      if (msg) pildora(g, msg, RY + RS - 10, col, 15, true);
      g.restore();
    }
    function panel(g, now) {
      g.fillStyle = 'rgba(12,12,32,.82)'; rr(g, PX - 6, 18, PW + 12, 504, 18); g.fill(); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.stroke();
      const imr = IMG(retrato); if (listo(imr)) { g.save(); g.beginPath(); g.arc(PX + PW - 34, 56, 30, 0, 6.283); g.clip(); g.drawImage(imr, PX + PW - 64, 26, 60, 60); g.restore(); g.strokeStyle = '#ffe27a'; g.lineWidth = 3; g.beginPath(); g.arc(PX + PW - 34, 56, 30, 0, 6.283); g.stroke(); }
      texto(g, 'SALA ' + (salaIdx + 1) + ' DE ' + SA.salas.length, PX + 8, 40, 14, '#9fb0ff', null, 'left');
      texto(g, SA.salas[salaIdx].nombre, PX + 8, 68, 24, '#fff', 'rgba(0,0,30,.8)', 'left');
      // cristales
      const ns = [1, 2, 3].filter(n => E.req & (1 << (n - 1)));
      ns.forEach((n, i) => { const x = PX + 30 + i * 52; gema(g, x, 112, n, !!(E.rest & (1 << (n - 1))), now); });
      texto(g, bits(E.rest) + ' / ' + bits(E.req) + ' cristales', PX + 30 + ns.length * 52 + 8, 112, 15, '#d7d4ee', null, 'left');
      // retos: cada pregunta tiene su NÚMERO y su COLOR (los mismos que se ven en sus losas del tablero)
      let y = 150; const rec = recomendado();
      E.retos.forEach((r, k) => {
        const ok = E.hechoReto[k] || !!(E.rest & (1 << (r.cristal - 1))), c = COL[r.cristal - 1], primero = !ok && rec === r.cristal && E.retos.length > 1;
        g.fillStyle = ok ? 'rgba(80,200,120,.18)' : 'rgba(255,255,255,.07)'; rr(g, PX, y, PW - 4, 58, 10); g.fill();
        if (primero) { g.strokeStyle = 'rgba(255,226,122,' + (.5 + .4 * Math.sin(now * 5)) + ')'; g.lineWidth = 2.5; rr(g, PX, y, PW - 4, 58, 10); g.stroke(); }
        g.fillStyle = c; g.fillRect(PX, y + 8, 5, 42); insignia(g, PX + 25, y + 29, k + 1, c, ok, 15);
        const tx = PX + 48; let l2 = '';
        if (r.tipo === 'mult') { texto(g, r.q.T + ' × ' + r.q.n + ' = ?', tx, y + 20, 22, ok ? '#9fe8b0' : '#fff', null, 'left'); l2 = 'Pisa la losa con el resultado'; }
        else if (r.tipo === 'sec') {
          const n = r.orden.length, cw = 52, gap = 22;
          for (let i = 0; i < n; i++) {
            const cx0 = tx + i * (cw + gap), hecho = ok || E.prog[k] > i, sig = !ok && E.prog[k] === i;
            g.fillStyle = hecho ? 'rgba(80,200,120,.35)' : 'rgba(255,255,255,.1)'; rr(g, cx0, y + 7, cw, 26, 8); g.fill(); g.strokeStyle = sig ? 'rgba(255,226,122,' + (.6 + .4 * Math.sin(now * 6)) + ')' : (hecho ? '#7ee89a' : c); g.lineWidth = sig ? 3 : 2; g.stroke();
            texto(g, String(r.T * (i + 1)), cx0 + cw / 2, y + 21, 17, hecho ? '#c9ffd8' : '#fff');
            if (i < n - 1) texto(g, '→', cx0 + cw + gap / 2, y + 21, 15, '#c9c6e6');
          }
          l2 = 'Pisa las losas en este orden (' + E.prog[k] + '/' + n + ')';
        } else { texto(g, 'Sombra de piedra', tx, y + 20, 20, ok ? '#9fe8b0' : '#fff', null, 'left'); l2 = 'Llévala al interruptor ◎'; }
        texto(g, l2, tx, y + 44, 12, '#c9c6e6', null, 'left');
        if (ok) texto(g, '✔', PX + PW - 24, y + 44, 22, '#7ee89a'); else if (primero) texto(g, '👉 PRIMERO', PX + PW - 12, y + 44, 12, '#ffe27a', null, 'right');
        y += 64;
      });
      BTN.forEach(b => boton(g, b, now));
      texto(g, tactil() ? 'Gira la sala y camina para llegar al portal' : '← → caminar · Q/E girar · Z deshacer · R reiniciar · H pista · ? ayuda', PX + PW / 2, 512, 10.5, '#8e8cb8');
    }
    function ajusteTexto(g, s, x, y, w, tam, col) { g.font = tam + 'px ' + FUENTE; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = col; const pal = s.split(' '); let ln = '', yy = y; pal.forEach(p => { const t = ln ? ln + ' ' + p : p; if (g.measureText(t).width > w && ln) { g.fillText(ln, x, yy); yy += tam + 3; ln = p; } else ln = t; }); if (ln) g.fillText(ln, x, yy); }

    function dibuja(now) {
      const g = ctx; g.setTransform(q, 0, 0, q, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      fondo(g, now); dibujaSala(now); componer(now);
      g.save(); rr(g, RX, RY, RS, RS, 14); g.clip(); g.fillStyle = '#04050c'; g.fillRect(RX, RY, RS, RS);
      g.translate(RX + RS / 2, RY + RS / 2); g.rotate(V.ang * Math.PI / 180); g.drawImage(nc, -RS / 2, -RS / 2, RS, RS); g.drawImage(vc, -RS / 2, -RS / 2, RS, RS); g.restore();
      // niebla gris (mundo sin color) y espiral al girar
      g.save(); rr(g, RX, RY, RS, RS, 14); g.clip();
      const nie = IMG(RUTA.e_niebla), sinColor = 1 - (V.ganaT ? 1 : bits(E.rest) / Math.max(1, bits(E.req)));
      if (listo(nie) && sinColor > 0) for (let i = 0; i < 3; i++) { const w = 340, x = RX - 160 + ((now * (7 + i * 3) + i * 210) % (RS + 320)), y = RY + RS * (.12 + i * .3) + Math.sin(now * .5 + i) * 18; g.globalAlpha = .17 * sinColor; g.drawImage(nie, x, y, w, w * nie.naturalHeight / nie.naturalWidth); }
      g.globalAlpha = 1;
      if (V.seg && V.seg.tipo === 'giro') { const esp = IMG(RUTA.e_espiral); if (listo(esp)) { const k = clamp(V.seg.t / V.seg.dur, 0, 1), cw = V.seg.hasta > V.seg.desde, sz = RS * .9; g.translate(RX + RS / 2, RY + RS / 2); g.rotate(V.ang * Math.PI / 180 * .35); if (!cw) g.scale(-1, 1); g.globalAlpha = Math.sin(Math.PI * k) * .85; g.drawImage(esp, -sz / 2, -sz * esp.naturalHeight / esp.naturalWidth / 2, sz, sz * esp.naturalHeight / esp.naturalWidth); g.globalAlpha = 1; } }
      g.restore();
      // marco de la ventana y viñeta
      g.save(); rr(g, RX, RY, RS, RS, 14); g.clip(); const vg = g.createRadialGradient(RX + RS / 2, RY + RS / 2, RS * .32, RX + RS / 2, RY + RS / 2, RS * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,12,.6)'); g.fillStyle = vg; g.fillRect(RX, RY, RS, RS);
      if (V.ganaT) { const k = clamp((now - V.ganaT) / 1.2, 0, 1); g.fillStyle = 'rgba(255,255,255,' + (.5 * (1 - k)) + ')'; g.fillRect(RX, RY, RS, RS); } g.restore();
      const col = bits(E.rest) ? COL[[1, 2, 3].filter(n => E.rest & (1 << (n - 1)))[0] - 1] : 'rgba(255,255,255,.35)'; g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 14; rr(g, RX, RY, RS, RS, 14); g.stroke(); g.shadowBlur = 0;
      if ((enJuego || pausa) && !E.gana) { capaColor(g, now); bandas(g, now); }
      panel(g, now);
      // avisos
      let ty = 74; for (let i = toasts.length - 1; i >= 0; i--) { const t = toasts[i], e = now - t.t0; if (e > t.d) { toasts.splice(i, 1); continue; } }
      toasts.slice(-2).forEach((t, i) => { const e = now - t.t0, a = clamp(Math.min(e / 0.2, (t.d - e) / 0.4), 0, 1); g.globalAlpha = a; g.font = '18px ' + FUENTE; const w = g.measureText(t.t).width + 34; g.fillStyle = 'rgba(10,10,30,.88)'; rr(g, RX + RS / 2 - w / 2, ty + i * 44 - 4, w, 36, 18); g.fill(); g.strokeStyle = t.c; g.lineWidth = 2; g.stroke(); texto(g, t.t, RX + RS / 2, ty + i * 44 + 14, 18, t.c); g.globalAlpha = 1; });
    }

    // ───────────────────────── pantallas ─────────────────────────
    function pantalla(html, clase) { ov.className = clase || ''; ov.innerHTML = html; ov.style.display = html ? 'flex' : 'none'; }
    const retratoH = () => '<div class="retrato"><img class="ret" src="' + retrato + '" alt=""><img class="mar" src="' + UI + 'marcos/medallon_marco.png" alt=""></div>';
    const BARRA = '<img class="barra" src="' + UI + 'extras/barra_ornamental_azul_dorada.png" alt="">';
    let salaInicial = clamp((o.sala | 0) - 1, 0, SA.salas.length - 1);   // opcional: abrir directamente una sala (1–4), útil para probar
    const arranca = () => { enJuego = true; V.aviso = V.ultimaAccion = performance.now() / 1000; if (salaIdx === 0 && !V0.coachHecho) V.coach = { paso: 0 }; };
    /** Explicación corta al entrar en una sala nueva (si tiene); luego empieza el juego. */
    function introSala(cb) {
      const it = INTRO[SA.salas[salaIdx].id]; if (!it) { pantalla(''); cb(); return; }
      enJuego = false;
      pantalla(retratoH() + '<h1>SALA ' + SA.salas[salaIdx].id + ' · ' + SA.salas[salaIdx].nombre + '</h1>' + BARRA + '<div class="reglas">' + it.map(t => '<span>' + t + '</span>').join('') + '</div><button id="vamos" type="button">▶ ¡VAMOS!</button>');
      document.getElementById('vamos').onclick = () => { pantalla(''); cb(); };
    }
    function inicio() {
      cargarSala(salaInicial); salaInicial = 0; enJuego = false;
      pantalla(retratoH() + '<h1>EL MUNDO NEGATIVO</h1>' + BARRA + '<p>El color se escapó de este mundo. ¡Devuélveselo resolviendo las tablas!</p>' +
        '<div class="reglas"><span>1️⃣ <b>GIRA</b> la sala ⟲ ⟳: el suelo cambia</span><span>2️⃣ <b>CAMINA</b> ◀ ▶ hasta la losa con la respuesta</span><span>3️⃣ Cada pregunta restaura un 💎 y abre el 🌀 portal</span></div>' +
        '<p class="ctl">' + (tactil() ? 'Usa los botones de abajo a la derecha. Toca 💡 si necesitas ayuda y ? para ver las reglas.' : 'Flechas ← → caminan · Q / E giran la sala · Z deshace · R reinicia · H pista · ? ayuda · P pausa') + '</p><button id="go" type="button">▶ JUGAR</button>');
      document.getElementById('go').onclick = () => { try { ac() && ac().resume && ac().resume(); } catch (e) { } pantalla(''); arranca(); };
    }
    function pausar() {
      if (!enJuego || (E && E.gana)) return; if (pausa) { pausa = false; pantalla(''); return; } pausa = true;
      pantalla('<h1>PAUSA</h1>' + BARRA + '<button id="seg" type="button">▶ SEGUIR</button><button id="sal" type="button" class="sec">⟵ SALIR</button>', 'pausa');
      document.getElementById('seg').onclick = () => { pausa = false; pantalla(''); }; document.getElementById('sal').onclick = () => salir();
    }
    function salir() { guardar(false); vivo = false; cancelAnimationFrame(raf); if (o.onSalir) o.onSalir(); }
    function estrellasSala() { return V.erroresSala <= 1 && V.pistasSala === 0 ? 3 : V.erroresSala <= 4 && V.pistasSala <= 1 ? 2 : 1; }
    function salaCompletada() {
      const est = estrellasSala(); tot.estrellas[salaIdx] = est; const ultima = salaIdx >= SA.salas.length - 1; guardar(ultima, ultima ? mediaEstrellas() : 0); enJuego = false;
      const estH = '<div class="estrellas">' + [0, 1, 2].map(i => i < est ? '<span class="st" style="animation-delay:' + (0.3 + i * 0.35) + 's">⭐</span>' : '<span class="st0">⭐</span>').join('') + '</div>';
      if (!ultima) {
        pantalla(retratoH() + '<h1>¡SALA RESTAURADA!</h1>' + BARRA + estH + '<p>' + SA.salas[salaIdx].nombre + ' recuperó su color. Errores: <b>' + V.erroresSala + '</b> · Pistas: <b>' + V.pistasSala + '</b></p><button id="sig" type="button">SIGUIENTE SALA ▶</button><button id="sal2" type="button" class="sec">⟵ SALIR</button>', 'fin');
        document.getElementById('sig').onclick = () => { V0.coachHecho = true; cargarSala(salaIdx + 1); introSala(arranca); };
        document.getElementById('sal2').onclick = () => salir();
      } else {
        const m = mediaEstrellas();
        pantalla(retratoH() + '<h1>¡EL COLOR HA VUELTO!</h1>' + BARRA + '<div class="estrellas">' + [0, 1, 2].map(i => i < m ? '<span class="st" style="animation-delay:' + (0.3 + i * 0.35) + 's">⭐</span>' : '<span class="st0">⭐</span>').join('') + '</div><p>Restauraste las ' + SA.salas.length + ' salas del Mundo Negativo. Aciertos: <b>' + tot.aciertos + '</b> · Errores: <b>' + tot.errores + '</b> · Pistas: <b>' + tot.pistas + '</b></p><button id="otra" type="button">↻ JUGAR OTRA VEZ</button><button id="sal3" type="button" class="sec">⟵ SALIR</button>', 'fin');
        document.getElementById('otra').onclick = () => { tot.errores = tot.aciertos = tot.pistas = 0; tot.estrellas = []; V0.guardado = false; inicio(); }; document.getElementById('sal3').onclick = () => salir();
      }
    }
    const V0 = { guardado: false, coachHecho: false };
    const mediaEstrellas = () => { const a = tot.estrellas.filter(Boolean); return a.length ? clamp(Math.round(a.reduce((s, x) => s + x, 0) / a.length), 1, 3) : 1; };
    function guardar(completo, est) {
      if (!o.perfil || !window.Perfiles) return;
      try { Perfiles.actualizar(o.perfil.id, p => {
        p.nivel4 = p.nivel4 || {}; p.nivel4.salaMax = Math.max(p.nivel4.salaMax || 0, salaIdx + (E && E.gana ? 1 : 0));
        if (completo && !V0.guardado) { V0.guardado = true; p.nivel4.completado = true; p.nivel4.estrellas = Math.max(p.nivel4.estrellas || 0, est || 1); p.nivel4.intentos = (p.nivel4.intentos || 0) + 1; p.nivel4.mejor = Math.max(p.nivel4.mejor || 0, tot.aciertos * 100 - tot.errores * 10 - tot.pistas * 15); }
        else if (!completo && !p.nivel4.intentos) p.nivel4.intentos = 0;
        p.nivel4.fallos = Object.assign({}, fallos);
        p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += tot.aciertos; p.estadisticas.errores += tot.errores; tot.aciertos = 0; tot.errores = 0;
      }); } catch (e) { }
    }

    // ───────────────────────── controles ─────────────────────────
    window.addEventListener('keydown', e => {
      const k = e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') accion('L'); else if (k === 'ArrowRight' || k === 'd' || k === 'D') accion('R');
      else if (k === 'q' || k === 'Q' || k === 'ArrowUp') accion('CCW'); else if (k === 'e' || k === 'E' || k === 'ArrowDown') accion('CW');
      else if (k === 'z' || k === 'Z' || k === 'Backspace') deshacer(); else if (k === 'r' || k === 'R') reiniciar(); else if (k === 'h' || k === 'H') pista(); else if (k === '?' || k === 'i' || k === 'I') ayuda();
      else if (k === 'p' || k === 'P' || k === 'Escape') pausar(); else if (k === 'm' || k === 'M') { mudo = !mudo; toast(mudo ? '🔇 Sonido apagado' : '🔊 Sonido activado', '#fff', 1.2); }
    });
    function punto(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    cv.addEventListener('pointerdown', e => {
      const p = punto(e); const b = BTN.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h); if (!b) return; e.preventDefault();
      try { ac() && ac().resume && ac().resume(); } catch (er) { }
      presion[b.id] = performance.now() / 1000; if (b.id === 'deshacer') deshacer(); else if (b.id === 'reiniciar') reiniciar(); else if (b.id === 'pista') pista(); else if (b.id === 'ayuda') ayuda(); else if (b.id === 'pausa') pausar(); else accion(b.id);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
    window.addEventListener('pagehide', () => guardar(false));

    function bucle(t) {
      if (!vivo) return; raf = requestAnimationFrame(bucle); const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t; const now = t / 1000;
      if (V && enJuego && !pausa && !V.seg && !V.cola.length && E && !E.gana && !E.muerto && now - V.ultimaAccion > 18) { V.idle = true; if (!V.nudge) { V.nudge = true; toast('💡 ¿Te atascaste? Toca 💡 para ver el siguiente paso', '#ffe27a', 4); } }
      if (V) { if (!pausa) { avanzaCola(dt); for (let i = particulas.length - 1; i >= 0; i--) { const p = particulas[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; if (p.t > p.vida) particulas.splice(i, 1); } }
        dibuja(now); }
    }
    inicio(); raf = requestAnimationFrame(bucle);
    return { accion, deshacer, reiniciar, pista, ayuda, estado: () => E, visual: () => V };
  }

  window.Nivel4 = { iniciar };
})();
