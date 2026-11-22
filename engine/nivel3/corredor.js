/* Nivel 3 · Carrera de los Farolillos — corredor VERTICAL en perspectiva (estilo "corre hacia el fondo")
   Diferente al Nivel 1 (plataformas) y al Nivel 2 (surf lateral con puertas):
   · Pantalla en VERTICAL (celular) o columna centrada (PC). El ninja corre hacia el fondo de la pantalla.
   · Dos tipos de etapa que se alternan para no ser monótono:
       CADENA  → farolillos con números: recoge el que sigue en la tabla (7 · 14 · 21 · ?). Cadena de 10 pasos.
       CAZA    → "recoge SOLO los múltiplos del 7": reconocer múltiplos entre números parecidos.
   · Sin castigo duro: equivocarse solo rompe la racha (y la respuesta se repite más adelante, "repaso del zorro").
     Los obstáculos quitan corazones, pero si se acaban solo se repite la etapa con los corazones llenos.
   · Racha → aura dorada y monedas ×2. (Las copias del personaje ya no salen solas: eso se veía como un "doble"; ahora solo hay estela en el dash.)
   · v10: nubes-plataforma para subirse, portales de poder con pregunta (dash ninja / imán / escudo), vallas, muros con hueco, shurikens y vigas,
     eventos por tramo (lluvia de monedas, viento, carriles invertidos, tramo oscuro), combo de monedas ×2…×5 y jefe final (Rey del Caos).
   Tablas 7, 8 y 9. Todo lo ajustable está en CFG. Sprites provisionales: los héroes se ven de lado (faltan los de espalda). */
(function () {
  'use strict';

  const W = 540, H = 960, HOR = 268, PY = 800, Z0 = 18, ZMAX = 84, LW = 150, RW = 258;
  const CFG = { VEL0: 9, VEL_SUBE: 0.25, VEL_MAX: 11.5, VIDAS: 3, INV: 1.8, ALTURA_HEROE: 215, RAMPA: 46, ESPERA: 9, VPLAZA: 3.2, PREG_TABLA: 6, PREG_MUNDO: 3 };
  const TABLAS = [7, 8, 9], PLAT_H = 105;
  const FUENTE = '"Trebuchet MS",Verdana,ui-sans-serif,sans-serif';
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mez = a => { for (let i = a.length - 1; i > 0; i--) { const j = RI(0, i); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  // geometría del sprite torii_lanterns_a.png (371×328): centro de la escalera, corte suelo/alto, borde frontal y punto de apoyo de cada peldaño (de delante hacia atrás)
  const PORT = { w: 371, h: 328, cx: 224, corte: 272, medio: 54, frentes: [323, 315, 303, 289, 276], apoyos: [319.5, 312, 299.5, 286, 274], tope: 270.5 };
  const pz = z => 1 / (1 + z / Z0);
  const yz = z => HOR + (PY - HOR) * pz(z);
  const tactil = () => { try { return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } };

  // ───────────────────────── imágenes (todas ya existen en el repositorio) ─────────────────────────
  const NA = 'assets/nivel3/arte/';
  const P = 'assets/environment/props/';
  const ART = {
    bambu: [P + 'nature/bamboo_a.png', P + 'nature/bamboo_b.png', P + 'nature/bamboo_c.png', P + 'nature/bamboo_d.png'],
    sakura: [P + 'nature/sakura_tree_a.png', P + 'nature/sakura_tree_b.png', P + 'nature/sakura_tree_c.png'],
    farolPiedra: [P + 'lights/stone_lantern_a.png', P + 'lights/stone_lantern_b.png', P + 'lights/stone_lantern_c.png', P + 'lights/fire_brazier_c.png'],
    torii: P + 'structures/torii_gate_f.png', portal: P + 'structures/torii_lanterns_a.png',
    barril: P + 'objects/barrel_c.png', caja: P + 'objects/crate_c.png',
    fuego: [NA + 'mundos/lava/roca_lava.png', NA + 'mundos/lava/lights/farol.png', NA + 'mundos/lava/roca_plantas.png', NA + 'mundos/lava/bandera.png'],
    cristal: [P + 'crystals/crystal_blue_d.png', P + 'crystals/crystal_purple_a.png', P + 'crystals/crystal_purple_b.png', P + 'crystals/crystal_purple_c.png'],
    trueno: [P + 'crystals/crystal_spire_c.png', P + 'decor/rock_pillar_e.png', P + 'crystals/crystal_purple_b.png'],
    corazon: 'assets/ui/hud/animados/corazon_latido.png'
  };
  const UI0 = 'assets/ui/hud/';
  Object.assign(ART, { medallon: UI0 + 'marcos/medallon_marco.png', insignia: UI0 + 'marcos/insignia_nivel.png', barra: UI0 + 'extras/barra_ornamental_azul_dorada.png', moneda: UI0 + 'animados/moneda_girando.png', clon: 'assets/ui/poderes/clone.png',
    esqSI: UI0 + 'pantalla/esquina_roja_sup_izq.png', esqSD: UI0 + 'pantalla/esquina_roja_sup_der.png', esqII: UI0 + 'pantalla/esquina_roja_inf_izq.png', esqID: UI0 + 'pantalla/esquina_roja_inf_der.png',
    retratos: ['sakura', 'antarez'].reduce((a, n) => a.concat(['normal', 'herido', 'radiante'].map(e => UI0 + 'retratos/' + n + '_' + e + '.png')), []) });
  Object.assign(ART, {
    coin: [1, 2, 3, 4].map(i => NA + 'monedas/coin_' + i + '.png'), coinRacha: NA + 'monedas/coin_racha.png', gema: NA + 'monedas/gema.png', shuriken: NA + 'monedas/shuriken.png', bolsa: NA + 'monedas/bolsa.png',
    pu_caja: NA + 'potenciadores/caja.png', pu_cajaAb: NA + 'potenciadores/caja_abierta.png', pu_cofre: NA + 'potenciadores/cofre.png', pu_cofreAb: NA + 'potenciadores/cofre_abierto.png',
    pu_iman: NA + 'potenciadores/iman.png', pu_escudo: NA + 'potenciadores/escudo.png', pu_vida: NA + 'potenciadores/corazon_alas.png', pu_reloj: NA + 'potenciadores/reloj.png',
    ob_barril: NA + 'obstaculos/barril.png', ob_caja: NA + 'obstaculos/caja.png', ob_valla: NA + 'obstaculos/valla.png', ob_roca: NA + 'obstaculos/roca.png', ob_torii: NA + 'obstaculos/torii_bajo.png',
    ob_viga: NA + 'obstaculos/viga.png', ob_tramp: NA + 'obstaculos/trampolin.png', ob_farol: NA + 'obstaculos/farol_roto.png',
    lv_barril: NA + 'mundos/lava/barril.png', lv_caja: NA + 'mundos/lava/caja.png', lv_valla: NA + 'mundos/lava/valla.png', lv_torii: NA + 'mundos/lava/torii.png',
    fx_vel: NA + 'efectos/velocidad.png', fx_polvo: NA + 'efectos/polvo.png', fx_dest: NA + 'efectos/destello.png', fx_burb: NA + 'efectos/burbuja.png', fx_remo: NA + 'efectos/remolino.png',
    fx_estr: NA + 'efectos/estrellas.png', fx_iman: NA + 'efectos/iman.png', fx_choque: NA + 'efectos/choque.png',
    zo_run: [1, 2, 3, 4].map(i => NA + 'zorro/run_' + i + '.png'), zo_salto: NA + 'zorro/salto.png', zo_senala: NA + 'zorro/senala.png', zo_celebra: NA + 'zorro/celebra.png', zo_espera: NA + 'zorro/espera.png'
  });
  const cache = {};
  function IMG(src) { let i = cache[src]; if (!i) { i = new Image(); i.src = src; cache[src] = i; } return i; }
  const listo = i => i && i.complete && i.naturalWidth > 0;
  function precargar() { Object.keys(ART).forEach(k => [].concat(ART[k]).forEach(IMG)); TEMAS.forEach(t => { IMG(BG + t.bg + '.png'); if (t.pano) IMG(t.pano); }); }
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
  TEMAS[1].pano = NA + 'mundos/pano_sakura.jpg'; TEMAS[3].pano = NA + 'mundos/pano_lava.jpg'; TEMAS[0].pano = NA + 'mundos/pano_bambu.jpg'; TEMAS[2].pano = NA + 'mundos/pano_aldea.jpg'; TEMAS[4].pano = NA + 'mundos/pano_hielo.jpg'; TEMAS[5].pano = NA + 'mundos/pano_trueno.jpg'; // fondos completos (reemplazan la franja de montañas)

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
    aterriza(f) { tono(95, 0.14, 'triangle', 0.05 + 0.05 * f); tono(60, 0.18, 'sine', 0.05 * f, 0.02); },
    desliza() { tono(300, 0.18, 'sawtooth', 0.04); },
    moneda(r) { tono(988 + (r % 6) * 90, 0.09, 'triangle', 0.07); },
    plaza() { tono(660, 0.25, 'sine', 0.08); tono(880, 0.3, 'sine', 0.06, 0.1); },
    portal() { [523, 659, 784, 1047].forEach((f, i) => tono(f, 0.3, 'triangle', 0.12, i * 0.09)); },
    gana() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tono(f, 0.4, 'triangle', 0.13, i * 0.12)); },
    poder() { [392, 523, 659, 784, 1047].forEach((f, i) => tono(f, 0.22, 'square', 0.06, i * 0.05)); },
    viento() { tono(180, 0.5, 'sawtooth', 0.035); tono(240, 0.5, 'sawtooth', 0.025, 0.1); },
    alerta() { tono(880, 0.12, 'square', 0.04); tono(660, 0.14, 'square', 0.04, 0.14); },
    jefe() { tono(110, 0.5, 'sawtooth', 0.11); tono(82, 0.7, 'square', 0.08, 0.1); },
    golpeJefe() { [784, 659, 523, 392].forEach((f, i) => tono(f, 0.18, 'sawtooth', 0.09, i * 0.06)); }
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
  // las multiplicaciones que al niño le cuestan salen con más probabilidad (pesos 1 + 3·fallos del nivel 3 + 1.5·fallos del nivel 2),
  // siempre ordenadas de fácil a difícil dentro de cada tabla; si no hay historial, es al azar como antes
  // largo del nivel: nivel3.html?n=4 (de 3 a 9 preguntas por tabla; por defecto 6)
  function construir(m3, m2) {
    const np = +(new URLSearchParams(location.search).get('n')); if (np >= 3 && np <= 9) CFG.PREG_TABLA = np;
    const out = [], tipos = ['mult', 'mult', 'sigue', 'mult', 'multiplo', 'sigue'];
    TABLAS.forEach(T => {
      const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ n, w: 1 + 3 * ((m3 && m3[T + 'x' + n]) || 0) + 1.5 * ((m2 && m2[T + 'x' + n]) || 0) })), ns = [];
      for (let k = 0; k < CFG.PREG_TABLA && pool.length; k++) { let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), idx = 0; while (idx < pool.length - 1 && (r -= pool[idx].w) > 0) idx++; ns.push(pool.splice(idx, 1)[0].n); }
      ns.sort((a, b) => a - b).forEach((n, i) => out.push({ T, n, tipo: tipos[i % tipos.length], inv: Math.random() < 0.4 }));
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
    let m3 = Object.assign({}, (o.perfil && o.perfil.nivel3 && o.perfil.nivel3.fallos) || {}); const m2 = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.fallos) || {};
    let PREGS = construir(m3, m2);
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
    // El aviso "GIRA TU TELÉFONO" ya no atrapa al jugador: se quita solo al girar, ofrece girar automáticamente (NinjaOrient bloquea la
    // orientación aunque el teléfono tenga el bloqueo de rotación activado) y deja "Jugar así" (columna centrada) como salida.
    let jugarAsi = false;
    function vigilarGiro() {
      const mal = !jugarAsi && tactil() && innerWidth > innerHeight && innerHeight < 640;
      const g = document.getElementById('girar'); if (g) g.classList.toggle('on', mal);
      try { if (mal && S && S.corriendo && !S.pausa) pausar(true); } catch (e) { }
      return mal;
    }
    const refrescarGiro = () => { ajustar(); vigilarGiro(); };
    window.addEventListener('resize', refrescarGiro);
    window.addEventListener('orientationchange', () => setTimeout(refrescarGiro, 250));
    document.addEventListener('ninja-orient', refrescarGiro);
    ajustar(); vigilarGiro();
    (() => {
      const bA = document.getElementById('girarAuto'), bS = document.getElementById('girarAsi'), ios = document.getElementById('girarIos');
      if (bA) bA.onclick = () => { if (window.NinjaOrient) NinjaOrient.forzar('portrait'); };
      if (bS) bS.onclick = () => { jugarAsi = true; refrescarGiro(); };
      if (ios && window.NinjaOrient && NinjaOrient.iOS) { ios.style.display = 'block'; if (bA) bA.style.display = 'none'; }   // iOS no deja forzar la orientación
      if (window.NinjaOrient) NinjaOrient.querer('portrait');
    })();

    function intentarPantallaCompleta() {
      if (!tactil()) return;
      if (window.NinjaOrient) { NinjaOrient.forzar('portrait'); return; }
      const el = document.documentElement, rf = el.requestFullscreen || el.webkitRequestFullscreen;
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {}); } catch (e) {} };
      try { if (rf && !document.fullscreenElement) { const p = rf.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(lock); else lock(); } else lock(); } catch (e) { lock(); }
    }

    // ───────────────────────── estado ─────────────────────────
    function nuevo() {
      return { dist: 0, v: CFG.VEL0, px: 1, tl: 1, jh: 0, jv: 0, jt: 0, slide: 0, inv: 0, hurt: 0, vidas: CFG.VIDAS, items: [], deco: [], filas: [], parts: [], fx: [], toasts: [],
        racha: 0, mejorRacha: 0, puntos: 0, aciertos: 0, errores: 0, golpes: 0, fallosSeg: 0, cazadas: 0, cazaOk: 0, repasos: [], fallos: {}, hudE: 0, cadena: [], monedas: 0, mundo: 0, qpas: 0, zp: 0, cortes: [{ d: 0, m: 0 }],
        plaza: false, espera: false, listo: false, filaAct: null, alegre: 0, alegreT: 0, pista: null, iman: 0, escudo: 0, vuelo: 0, vueloD: 0, mAc: 0, mFa: 0, tutor: false, malSeg: 0,
        sp: { nextD: 30, qi: 0, tr: 0, mundo: 0, patM: false, cieloM: false, ultLane: -1, decoD: 8, evI: RI(0, 3), jr: 0, ultP: '', jUsadas: [] }, skate: 0, tiempo: 0, dash: 0, base: 0, sobre: null, combo: 0, comboT: 0, mult: 1, multMax: 1, multPulso: 0, invCtrl: false, viento: null, vientoT: 1.4, vientoAv: false, oscuro: 0, jefeHp: 3, jefeVis: false, jefeX: 1, jefeFlash: 0, jefeDerr: -1, nPod: 0, filaPod: null, hist: [], tAnim: 0, shake: 0, flash: 0, banner: null, amb: [], rings: [], polvo: [], lineas: [], temaF: 0, polvoT: 0, flashB: 0,
        corriendo: false, pausa: false, fin: false, cae: 0, t: 0 };
    }

    // ───────────────────────── generador: carrera libre + plaza de pregunta ─────────────────────────
    function nuevaLane(s) { let l; do { l = RI(0, 2); } while (l === s.sp.ultLane && Math.random() < 0.7); s.sp.ultLane = l; return l; }
    function moneda(d, lane, h, tipo) { S.items.push({ k: 'coin', d, lane, h: h || 0, tomada: false, tipo }); }
    const SKB = { n: ['barril', 'caja', 'valla', 'roca', 'farol'], l: ['l_barril', 'l_caja', 'l_valla'] }, SKA = { n: ['torii', 'viga', 'puerta'], l: ['l_torii', 'puerta'] };
    function obs(d, lane, tipo) { const set = (tipo === 'bajo' ? SKB : SKA)[S.sp.mundo === 3 ? 'l' : 'n']; S.items.push({ k: 'obs', tipo, d, lane, skin: set[RI(0, set.length - 1)], roto: false }); }
    function filaPregunta(q, repaso) {
      const T = q.T, n = q.n, c = T * n, d = S.sp.nextD, cl = nuevaLane(S), vals = q.tipo === 'multiplo' ? distMult(c, T) : distractores(c, T, n);
      const row = { d, tipo: q.tipo, T, n, c, q0: q, res: false, hint: !!repaso, repaso: !!repaso, pasada: false, plaza: true, q: textoPregunta(q) };
      [0, 1, 2].forEach(l => S.items.push({ k: 'orb', d, lane: l, val: l === cl ? c : vals.pop(), ok: l === cl, row, tomado: false }));
      S.filas.push(row); return row;
    }
    // un tramo de carrera libre: monedas en líneas, arcos y zigzag, con obstáculos que dan monedas si los esquivas
    // v10: portales de poder, patrones libres con nubes-plataforma, muros, shurikens y vigas, eventos por tramo y jefe final
    function filaPoder(d) {
      const T = (PREGS[Math.min(PREGS.length - 1, S.sp.qi)] || PREGS[0]).T, n = RI(3, 9), c = T * n, vals = distractores(c, T, n), cl = nuevaLane(S);
      const row = { d, T, n, c, res: false, poder: true, plaza: false, q: T + ' × ' + n + ' = ?' };
      S.items.push({ k: 'portal', d: d - 8, final: false, arco: true, poder: true, txt: '⚡ ¡PODER!', pasado: false });
      [0, 1, 2].forEach(l => S.items.push({ k: 'orb', d, lane: l, val: l === cl ? c : vals.pop(), ok: l === cl, row, tomado: false }));
    }
    function patronLibre(d, lane, suave, calma, M, ev) {
      const A = [['linea', 14], ['arco', 12], ['zig', 10]];
      if (!suave) A.push(['tramp', 8]);
      if (!calma) A.push(['bajo', 10], ['alto', 8]);
      if (!suave && ev !== 'oscuro') A.push(['nube', 13]);
      if (!calma && M >= 1) A.push(['muro', 9], ['shu', 8]);
      if (!calma && M >= 2) A.push(['viga', 8]);
      let tot = 0; A.forEach(a => { if (a[0] === S.sp.ultP) a[1] *= 0.25; tot += a[1]; });
      let r = Math.random() * tot, k = A[0][0]; for (const a of A) { r -= a[1]; if (r <= 0) { k = a[0]; break; } }
      S.sp.ultP = k;
      switch (k) {
        case 'arco': { const H = [0, 60, 105, 130, 105, 60, 0]; for (let i = 0; i < 7; i++) moneda(d + i * 2.4, lane, H[i], i === 3 ? 'racha' : undefined); return 18; }
        case 'zig': { const Z = [0, 1, 2, 1, 0, 1, 2]; for (let i = 0; i < 7; i++) moneda(d + i * 3, Z[i], 0, i === 3 ? 'shuriken' : undefined); return 22; }
        case 'tramp': { S.items.push({ k: 'tramp', d, lane, tomado: false }); const Ht = [172, 284, 334, 324, 253, 122]; for (let i = 0; i < 6; i++) moneda(d + 1.5 * (i + 1), lane, Ht[i]); return 18; }
        case 'bajo': { obs(d + 7, lane, 'bajo'); const H = [0, 70, 120, 140, 120, 70, 0]; for (let i = 0; i < 7; i++) moneda(d + 2 + i * 1.6, lane, H[i]); return 20; }
        case 'alto': { obs(d + 6, lane, 'alto'); for (let i = 0; i < 5; i++) moneda(d + 2 + i * 2.4, lane, 0); return 18; }
        case 'nube': {   // plataforma de nube: salta, aterriza y corre por un tercer nivel lleno de monedas y bonos
          const L = 16; S.items.push({ k: 'plat', d: d + 6, hasta: d + 6 + L, lane });
          [0, 40, 80, 105, 122].forEach((h, i) => moneda(d + 1 + i * 1.3, lane, h));
          for (let i = 0; i < 7; i++) moneda(d + 8 + i * 1.9, lane, PLAT_H + 22);
          if (Math.random() < 0.6) S.items.push({ k: 'caja', d: d + 17, lane, tomado: false, h: PLAT_H + 6 });
          return L + 10;
        }
        case 'muro': { [0, 1, 2].forEach(l => { if (l !== lane) S.items.push({ k: 'obs', tipo: 'muro', d: d + 8, lane: l, roto: false }); }); for (let i = 0; i < 6; i++) moneda(d + 2 + i * 1.8, lane, 0); return 20; }
        case 'shu': { const izq = Math.random() < 0.5, l2 = RI(0, 2); S.items.push({ k: 'shu', d: d + 8, x: izq ? -0.35 : 2.35, dir: izq ? 1 : -1, act: false, roto: false, rot: 0 }); for (let i = 0; i < 5; i++) moneda(d + 12 + i * 2.2, l2, 0); return 22; }
        case 'viga': { S.items.push({ k: 'viga', d: d + 8, lane, roto: false, cayo: false, suelo: false }); const l2 = (lane + 1 + RI(0, 1)) % 3; for (let i = 0; i < 6; i++) moneda(d + 2 + i * 2, l2, 0); return 20; }
        default: for (let i = 0; i < 6; i++) moneda(d + i * 2.6, lane, 0); return 18;
      }
    }
    function patrones(d0, len, tipo, ev, poder) {
      if (tipo === 'cielo') {
        S.items.push({ k: 'nube', d: d0 + 4, hasta: d0 + len - 4, pasado: false });
        for (let i = 0; i < 40; i++) { const dd = d0 + 12 + i * 2.2; if (dd > d0 + len - 6) break; moneda(dd, Math.round(1 + Math.sin(i * 0.5)), 120 + (i % 3) * 14, i === 12 ? 'gema' : undefined); if (i % 4 === 0) { moneda(dd, 0, 135); moneda(dd, 2, 135); } }
        return d0 + len;
      }
      let d = d0 + 6; const suave = tipo === 'suave', pat = tipo === 'pat', calma = suave || ev === 'inv' || ev === 'oscuro' || ev === 'lluvia', M = S.sp.mundo;
      if (!pat && S.vidas < CFG.VIDAS && Math.random() < 0.45) S.items.push({ k: 'vida', d: d0 + 12, lane: RI(0, 2), tomado: false });
      if (ev === 'viento') S.items.push({ k: 'zona', tipo: 'viento', d: d0 + 8, hasta: d0 + len - 4, dir: Math.random() < 0.5 ? -1 : 1 });
      if (ev === 'inv') S.items.push({ k: 'zona', tipo: 'inv', d: d0 + 8, hasta: d0 + len - 6 });
      if (ev === 'oscuro') S.items.push({ k: 'zona', tipo: 'oscuro', d: d0 + 5, hasta: d0 + len - 4 });
      if (ev === 'lluvia') { const lo = nuevaLane(S); S.items.push({ k: 'oro', d: d0 + 10, hasta: d0 + len - 6, lane: lo }); for (let dd = d0 + 12; dd < d0 + len - 8; dd += 1.9) moneda(dd, lo, 0, 'oro'); }
      if (pat) { S.items.push({ k: 'pat', d, lane: RI(0, 2), tomado: false }); d += 14; }
      let pp = !poder;
      while (d < d0 + len) {
        if (!pp && d > d0 + len * 0.45) { pp = true; filaPoder(d + 6); d += 30; continue; }
        const lane = nuevaLane(S); let usado = 18;
        if (pat) { obs(d, lane, Math.random() < 0.5 ? 'bajo' : 'alto'); for (let i = 1; i <= 4; i++) moneda(d + i * 2.4, lane, 0); usado = 14; }
        else usado = patronLibre(d, lane, suave, calma, M, ev);
        d += usado + 8;
      }
      if (pat) { S.items.push({ k: 'cofre', d: d + 2, lane: RI(0, 2), tomado: false, tAb: null }); d += 12; }
      return d;
    }
    // jefe final: el Rey del Caos lanza bolas de fuego en patrones; cada pregunta acertada le quita una vida
    function jefeQ(r) {
      const rangos = [[5, 6, 7], [6, 7, 8], [7, 8, 9]][r]; let q = null;
      for (let k = 0; k < 20; k++) { const T = TABLAS[RI(0, 2)], n = rangos[RI(0, 2)], id = T + 'x' + n; if (S.sp.jUsadas.indexOf(id) < 0) { S.sp.jUsadas.push(id); q = { T, n, tipo: 'mult', inv: Math.random() < 0.4 }; break; } }
      return q || { T: TABLAS[RI(0, 2)], n: rangos[RI(0, 2)], tipo: 'mult', inv: false };
    }
    function rondaJefe() {
      const sp = S.sp, r = sp.jr++, d0 = sp.nextD;
      if (r === 0) S.items.push({ k: 'jefe', d: d0 + 2 });
      const L = [[0, 2, 1, 0, 2], [1, 0, 2, 2, 0, 1], [0, 1, 2, 1, 0, 2, 1]][r]; let d = d0 + 24;
      L.forEach((ln, i) => {
        S.items.push({ k: 'obs', tipo: 'fuego', d, lane: ln, vd: 5 + r * 1.3, roto: false });
        let libre = (ln + 1) % 3;
        if (r === 2 && i % 2 === 1) { const l2 = (ln + 1) % 3; S.items.push({ k: 'obs', tipo: 'fuego', d: d + 1, lane: l2, vd: 5 + r * 1.3, roto: false }); libre = (ln + 2) % 3; }
        for (let c = 0; c < 3; c++) moneda(d + 3 + c * 2, libre, 0);
        d += 12;
      });
      const doorD = d + CFG.RAMPA + 6;
      S.items.push({ k: 'portal', d: doorD - 26, final: false, arco: true, txt: '¡Pregunta!', pasado: false });
      const row = filaPregunta(jefeQ(r), false); row.jefe = true; sp.nextD = doorD + 18;
    }
    function portal(d, m, final) { S.items.push({ k: 'portal', d, final: !!final, txt: final ? '¡META!' : '¡Nuevo mundo!', pasado: false, sigM: m }); }
    function generar() {
      const sp = S.sp;
      while (!sp.fin && sp.nextD < S.dist + ZMAX) {
        if (sp.qi >= PREGS.length) { if (sp.jr < 3) { rondaJefe(); continue; } portal(sp.nextD, 0, true); sp.nextD += 30; sp.fin = true; break; }
        if (sp.tr >= CFG.PREG_MUNDO) { const m = Math.min(TEMAS.length - 1, sp.mundo + 1); portal(sp.nextD, m, false); moneda(sp.nextD + 12, 1, 0, 'bolsa'); S.cortes.push({ d: sp.nextD, m }); sp.mundo = m; sp.tr = 0; sp.patM = false; sp.cieloM = false; sp.nextD += 24; continue; }
        let tipo = sp.qi === 0 ? 'suave' : (sp.tr === 1 && !sp.patM) ? 'pat' : (sp.tr === 2 && !sp.cieloM) ? 'cielo' : 'normal';
        if (tipo === 'pat' && sp.mundo % 2 === 1) tipo = 'normal';   // en los mundos impares ese tramo es un evento en vez de patineta
        if (tipo === 'pat') sp.patM = true; if (tipo === 'cielo') sp.cieloM = true;
        const EVS = ['lluvia', 'viento', 'inv', 'oscuro'];
        const ev = (tipo === 'normal' && sp.qi >= 2 && Math.random() < 0.85) ? EVS[sp.evI++ % EVS.length] : null;
        const poder = (tipo === 'normal' || tipo === 'pat') && sp.qi >= 2 && (ev ? Math.random() < 0.4 : Math.random() < 0.7);
        const len = tipo === 'pat' ? 115 : tipo === 'cielo' ? 100 : tipo === 'suave' ? 80 : ev ? R(115, 130) : R(90, 115), d0 = sp.nextD; if (tipo === 'normal' && Math.random() < 0.55) S.items.push({ k: 'caja', d: d0 + 3, lane: RI(0, 2), tomado: false }); const dFin = patrones(d0, len, tipo, ev, poder);
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
    function fx(k, x, y, dur, s0, s1, o) { S.fx.push(Object.assign({ k, x, y, t: 0, dur, s0, s1 }, o)); if (S.fx.length > 36) S.fx.shift(); }
    function chispas(x, y, col, n) { for (let i = 0; i < n; i++) S.parts.push({ x, y, vx: R(-220, 220), vy: R(-300, 60), life: R(0.4, 0.9), t: 0, c: col, r: R(3, 7) }); }
    function guardaFallo(row) {
      const k = row.T + 'x' + row.n; S.fallos[k] = (S.fallos[k] || 0) + 1; const h = (S.hechos = S.hechos || {}); (h[k] = h[k] || { a: 0, e: 0 }).e++;
      if (!row.repaso && !S.repasos.some(x => x.q.T === row.T && x.q.n === row.n)) S.repasos.push({ q: row.q0, espera: 1 });
    }
    function recoge(it, x, y) {
      const row = it.row; it.tomado = true; row.res = true;
      if (row.poder) { if (it.ok) darPoder(x, y); else { sfx.casi(); chispas(x, y, '#9aa3c7', 10); toast('Era ' + row.c + ' (' + row.T + ' × ' + row.n + ')', '#ffd18a', 1.8); } return; }
      if (!row.repaso && !row.jefe) S.qpas++;
      if (!row.repaso && !row.jefe) { if (it.ok) S.mAc++; else S.mFa++; }
      S.malSeg = it.ok ? 0 : S.malSeg + 1;
      if (it.ok) {
        { const k = row.T + 'x' + row.n, h = (S.hechos = S.hechos || {}); (h[k] = h[k] || { a: 0, e: 0 }).a++; }
        S.aciertos++; S.racha++; S.mejorRacha = Math.max(S.mejorRacha, S.racha); const gan = row.repaso ? 3 : 5 + Math.min(S.racha, 5);
        S.monedas += gan; S.puntos += 10 + Math.min(S.racha, 10) * 2; S.alegre = 1.1; S.alegreT = S.t; S.pista = null;
        sfx.bien(S.racha - 1); fx('fx_dest', x, y, 0.6, 120, 270); chispas(x, y, '#ffe27a', 28); chispas(x, y, '#ffffff', 10); anillo(x, y, '#ffd35a', 1.3); S.flashB = Math.max(S.flashB, 0.12);
        if (S.racha % 3 === 0) { S.items.push({ k: 'pat', d: row.d + 8, lane: S.tl, tomado: false }); toast('¡' + S.racha + ' seguidas! 🛹 ¡Premio!', '#7dffb0', 1.8); }
        else toast(['¡Bien!', '¡Eso es!', '¡Perfecto!', '¡Genial!'][RI(0, 3)] + ' +' + gan + ' 🪙', '#7dffb0', 1.2);
      } else {
        S.errores++; S.racha = 0; guardaFallo(row); sfx.casi(); chispas(x, y, '#9aa3c7', 10); anillo(x, y, '#9aa3c7', 0.7);
        S.pista = { txt: secuencia(row.T, row.n), t: 5 }; toast('Casi… ' + row.T + ' × ' + row.n + ' = ' + row.c, '#ffd18a', 2);
      }
      if (row.jefe) {
        if (it.ok) { S.jefeHp = Math.max(0, S.jefeHp - 1); S.jefeFlash = 1; sfx.golpeJefe(); chispas(W / 2 + (S.jefeX - 1) * LW * 0.4, 420, '#c9a0ff', 30); anillo(W / 2, 430, '#c9a0ff', 1.6); toast(S.jefeHp ? '💥 ¡Golpe al jefe!' : '💥 ¡JEFE VENCIDO!', '#d9b3ff', 2); if (!S.jefeHp) { S.jefeDerr = S.t; chispas(W / 2, 430, '#ffe27a', 50); S.flashB = 0.4; } }
        else toast('😈 ¡El jefe se ríe!', '#ff9ab5', 1.6);
      }
    }
    // ── v10: poderes, combo y choques ──
    function darPoder(x, y) {
      const k = ['dash', 'iman', 'escudo'][S.nPod++ % 3]; sfx.poder(); chispas(x, y, '#d9b3ff', 26); anillo(x, y, '#d9b3ff', 1.4); S.puntos += 20; S.monedas += 5; S.flashB = Math.max(S.flashB, 0.1);
      if (k === 'dash') { S.dash = 3; S.inv = Math.max(S.inv, 0.3); toast('⚡ ¡DASH NINJA! 3 s', '#7fe9ff', 2.2); }
      else if (k === 'iman') { S.iman = 10; toast('🧲 ¡Imán de monedas!', '#e0c8ff', 2); }
      else { S.escudo = 12; toast('🛡 ¡Escudo!', '#9ad7ff', 2); }
    }
    function comboMoneda() {   // cada moneda seguida sube el combo: ×2 a las 6, ×3 a las 14, ×4 a las 24, ×5 a las 36 (3 s sin monedas o un golpe lo reinician)
      S.combo++; S.comboT = 3;
      const m = S.combo >= 36 ? 5 : S.combo >= 24 ? 4 : S.combo >= 14 ? 3 : S.combo >= 6 ? 2 : 1;
      if (m > S.mult) { S.mult = m; S.multPulso = 0.6; toast('🔥 COMBO ×' + m + '!', '#ffb347', 1.4); sfx.portal(); anillo(W / 2 + (S.px - 1) * LW, PY - 120, '#ffb347', 1.3); S.flashB = Math.max(S.flashB, 0.07); }
      S.multMax = Math.max(S.multMax, S.mult); return S.mult;
    }
    function rompe(it, dash) {
      const x = W / 2 + (it.lane - 1) * LW, y = PY - 90; S.puntos += 5; S.monedas += dash ? 1 : 2; sfx.bien(2);
      fx('fx_choque', x, y, 0.45, 90, 210); chispas(x, y, dash ? '#7fe9ff' : '#ff9ad5', 16); anillo(x, y, dash ? '#aef3ff' : '#ffb3e6', 0.8); toast(dash ? '⚡ ¡Atraviesas! +1 🪙' : '¡Crash! +2 🪙', dash ? '#7fe9ff' : '#ff9ad5', 0.7);
    }
    function golpe() {
      if (S.inv > 0 || S.dash > 0) return;
      if (S.escudo > 0) { S.escudo = 0; S.inv = 1; sfx.bien(3); chispas(W / 2 + (S.px - 1) * LW, PY - 100, '#9ad7ff', 24); anillo(W / 2 + (S.px - 1) * LW, PY - 100, '#9ad7ff', 1.2); toast('🛡 ¡El escudo te protegió!', '#9ad7ff', 1.4); return; }
      S.vidas--; S.golpes++; S.combo = 0; S.mult = 1; S.comboT = 0; S.inv = CFG.INV; S.hurt = 0.55; S.shake = 0.35; S.flash = 0.35; sfx.golpe();
      chispas(W / 2 + (S.px - 1) * LW, PY - 80, '#ff6a6a', 18);
      if (S.vidas <= 0) { S.cae = 1.2; toast('¡Tranquilo! Seguimos', '#ffd18a', 1.6); }
    }
    function reaparecer() { S.vidas = CFG.VIDAS; S.inv = 2.5; S.cae = 0; }
    function accion(a) {
      if (!S || !S.corriendo || S.pausa || S.fin || S.cae > 0) return;
      if (S.plaza && !S.listo) S.listo = true; // en la plaza, cualquier gesto significa «ya elegí, seguimos»
      if (a === 'listo') return;
      if (S.vuelo > 0 && a !== 'izq' && a !== 'der') return;
      if (S.invCtrl && !S.plaza) { if (a === 'izq') a = 'der'; else if (a === 'der') a = 'izq'; }   // evento: carriles invertidos
      if (a === 'izq') { if (S.tl > 0) S.cambio = { dir: -1, t: 0.3 }; S.tl = Math.max(0, S.tl - 1); }
      else if (a === 'der') { if (S.tl < 2) S.cambio = { dir: 1, t: 0.3 }; S.tl = Math.min(2, S.tl + 1); }
      else if (a === 'salta') { if (S.jh <= S.base + 1) { S.jv = S.skate > 0 ? 1060 : 900; S.jt = 0; S.slide = 0; sfx.salto(); S.sj = S.t; S.sq = null; despega(); } }
      else if (a === 'baja') { if (S.jh > S.base + 1) S.jv = -1500; else if (S.sobre) { S.soltada = S.sobre; S.sobre = null; S.base = 0; S.jv = -250; S.jt = 0.3; sfx.desliza(); } else if (S.slide <= 0) { S.slide = 0.75; sfx.desliza(); } }
    }

    const AYUDA = {
      bajo: ['⬆  Desliza hacia arriba: ¡salta!', '⬆  ¡Salta con la flecha ↑!'], alto: ['⬇  Desliza hacia abajo: ¡agáchate!', '⬇  ¡Agáchate con la flecha ↓!'],
      muro: ['↔  ¡Pasa por el hueco del muro!', '↔  ¡Pasa por el hueco del muro!'], fuego: ['🔥  ¡Salta o cambia de carril!', '🔥  ¡Salta o cambia de carril!'],
      viga: ['⚠  ¡Cambia de carril: cae una viga!', '⚠  ¡Cambia de carril: cae una viga!'], shu: ['✦  ¡Salta la shuriken!', '✦  ¡Salta la shuriken con ↑!'],
      plat: ['☁️  ¡Salta para subir a la nube!', '☁️  ¡Salta con ↑ para subir a la nube!']
    };
    const clave = it => it.k === 'obs' ? it.tipo : it.k, esPeligro = it => it.k === 'obs' || it.k === 'viga' || it.k === 'shu' || it.k === 'plat';
    // ── v10: todo lo que se mueve o cambia con el mundo (plataformas, shurikens, vigas, bolas del jefe y eventos) ──
    function mundoVivo(dt, jugando) {
      let sobre = null, inv = false, vz = null, osc = 0, fire = null;
      for (const it of S.items) {
        const z = it.d - S.dist, k = it.k;
        if (k === 'plat') {
          if (!jugando || S.vuelo > 0) continue;
          if (!(S.dist >= it.d - 1.8 && S.dist <= it.hasta && Math.abs(S.px - it.lane) < 0.62)) { if (S.soltada === it) S.soltada = null; continue; }
          if (S.sobre === it) sobre = it;
          else if (!S.sobre && S.soltada !== it && S.jv <= 0 && S.jh >= PLAT_H - 28 && S.jh <= PLAT_H + 75) {
            S.sobre = it; sobre = it; S.base = PLAT_H; S.jh = PLAT_H; S.jv = 0; S.jt = 0; S.puntos += 10; sfx.portal(); S.sq = { t0: S.t, f: 0.5 }; sfx.aterriza(0.6);
            chispas(W / 2 + (S.px - 1) * LW, PY - PLAT_H, '#ffffff', 22); anillo(W / 2 + (S.px - 1) * LW, PY - PLAT_H, '#bfe6ff', 1.2); toast('☁️ ¡Sobre la nube!', '#bfe6ff', 1.2);
          }
        } else if (k === 'shu') {
          if (it.roto) continue;
          if (!it.act && z < 26) { it.act = true; sfx.alerta(); }
          if (it.act) { it.x += it.dir * 1.8 * dt; if (it.x > 2.35) { it.x = 2.35; it.dir = -1; } else if (it.x < -0.35) { it.x = -0.35; it.dir = 1; } it.rot += dt * 16; }
          if (jugando && it.act && Math.abs(z) < 0.6 && Math.abs(S.px - it.x) < 0.5) {
            if (S.dash > 0 || S.skate > 0) { it.roto = true; it.lane = clamp(Math.round(it.x), 0, 2); rompe(it, S.dash > 0); }
            else if (S.jh - S.base <= 60) { it.roto = true; golpe(); }
          }
        } else if (k === 'viga') {
          if (it.roto) continue;
          if (!it.av && z < 38) { it.av = true; sfx.alerta(); }
          if (!it.cayo && z < 17) { it.cayo = true; it.tc = S.t; }
          if (it.cayo && !it.suelo && S.t - it.tc >= 0.28) { it.suelo = true; S.shake = Math.max(S.shake, 0.2); sfx.golpe(); chispas(W / 2 + (it.lane - 1) * LW, PY - 20, '#c9b79a', 12); }
          if (it.suelo && jugando && Math.abs(z) < 0.7 && Math.abs(S.px - it.lane) < 0.55) { it.roto = true; if (S.dash > 0 || S.skate > 0) rompe(it, S.dash > 0); else golpe(); }
        } else if (k === 'obs' && it.vd && !it.roto) {
          if (!it.act && z < 36) it.act = true;
          if (it.act) it.d -= it.vd * dt;
          if (z > -1 && (!fire || z < fire.d - S.dist)) fire = it;
        } else if (k === 'zona') {
          const dentro = S.dist >= it.d && S.dist <= it.hasta;
          if (!it.ann && z < 24) { it.ann = true; toast(it.tipo === 'viento' ? '🌪 ¡Viento de lado!' : it.tipo === 'inv' ? '🔄 ¡Carriles al revés!' : '🌙 ¡Sigue las luciérnagas!', '#cfe8ff', 2.2); sfx.alerta(); }
          if (dentro) { if (it.tipo === 'viento') vz = it; else if (it.tipo === 'inv') inv = true; else osc = Math.max(osc, clamp((S.dist - it.d) / 7, 0, 1) * clamp((it.hasta - S.dist) / 7, 0, 1)); }
        } else if (k === 'oro') {
          if (!it.ann && z < 26) { it.ann = true; toast('🌸 ¡Carril dorado!', '#ffe27a', 2.2); sfx.portal(); }
        } else if (k === 'jefe') {
          if (!S.jefeVis && z < 50) { S.jefeVis = true; S.banner = { s: '¡JEFE FINAL!', sub: 'Esquiva sus ataques y responde', T: '👹', t: 3.2, t0: 3.2 }; sfx.jefe(); }
        }
      }
      if (!jugando) { S.sobre = null; S.base = 0; } else if (S.sobre && S.sobre !== sobre) { S.sobre = null; S.base = 0; S.jv = 0; S.jt = 0.3; }
      // eventos
      if (inv && !S.invCtrl) toast('🔄 ¡← y → al revés!', '#ffb3ff', 1.8);
      if (!inv && S.invCtrl) toast('✅ ¡Controles normales!', '#bff5d0', 1.2);
      S.invCtrl = inv; S.viento = vz; S.oscuro += clamp(osc - S.oscuro, -dt * 2, dt * 2);
      if (vz && jugando && !S.plaza) {
        S.vientoT -= dt;
        if (S.vientoT < 0.9 && !S.vientoAv) { S.vientoAv = true; sfx.viento(); }
        if (S.vientoT <= 0) {
          S.vientoT = R(1.9, 2.8); S.vientoAv = false; const nt = clamp(S.tl + vz.dir, 0, 2);
          if (nt !== S.tl) { S.tl = nt; S.cambio = { dir: vz.dir, t: 0.3 }; toast(vz.dir < 0 ? '🌪 ← ¡Viento!' : '¡Viento! → 🌪', '#cfe8ff', 0.9); }
        }
      } else { S.vientoAv = false; if (!vz) S.vientoT = 1.4; }
      { const dj = (fire ? fire.lane : 1) - S.jefeX; if (Math.abs(dj) > 0.05) S.jefeDir = dj > 0 ? 1 : -1; S.jefeX += clamp(dj, -dt * 2.2, dt * 2.2); }
      // portal de poder más cercano (para mostrar su pregunta arriba)
      let fp = null; for (const it of S.items) if (it.k === 'orb' && it.row.poder && !it.row.res) { const z = it.d - S.dist; if (z > -1 && z < 42) { fp = it.row; break; } }
      S.filaPod = fp;
    }

    // ───────────────────────── actualización ─────────────────────────
    function paso(dt) {
      if (!S || !S.corriendo || S.pausa) return;
      dt = Math.min(dt, 0.05); S.t += dt;
      if (S.fin) {
        if (S.celeb != null) S.px += clamp(1 - S.px, -dt * 3, dt * 3);
        for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; } S.parts = S.parts.filter(p => p.t < p.life); for (const e of S.fx) e.t += dt; S.fx = S.fx.filter(e => e.t < e.dur); for (const r of S.rings) r.t += dt; S.rings = S.rings.filter(r => r.t < r.dur);
        if (S.celeb != null && S.t - S.celeb < 2.3) { S.confT = (S.confT || 0) - dt; if (S.confT <= 0) { S.confT = 0.22; const cx = W / 2 + (S.px - 1) * LW; chispas(cx + R(-60, 60), PY - 230, ['#ffe27a', '#ff9ad5', '#7dffb0', '#9ad7ff'][RI(0, 3)], 14); } }
        return;
      }
      // la pista se frena sola al llegar a la plaza de pregunta y espera (sin reloj) hasta que el niño decida
      const fila = S.filas.find(f => !f.res && !f.pasada), dz = fila ? fila.d - S.dist : 999;
      if (fila !== S.filaAct) { S.filaAct = fila; S.listo = false; if (fila && S.malSeg >= 2 && !fila.hint) { fila.hint = true; toast('💡 Mira la puerta verde', '#bff5d0', 2.2); } }
      S.plaza = !!fila && dz < CFG.RAMPA; S.espera = S.plaza && dz <= CFG.ESPERA + 0.3 && !S.listo;
      if (S.plaza && fila && !fila.habl) { fila.habl = true; hablar(fila); }
      S.zp += ((S.plaza ? 1 : 0) - S.zp) * Math.min(1, dt * 3);
      const base = Math.min(CFG.VEL_MAX, CFG.VEL0 + CFG.VEL_SUBE * S.mundo + Math.max(0, S.racha - 4) * 0.02); let vObj = base + (S.mult - 1) * 0.15;
      if (S.dash > 0 && !S.plaza) vObj = base * 1.45;
      if (S.plaza) { const k = clamp((dz - CFG.ESPERA) / (CFG.RAMPA - CFG.ESPERA), 0, 1); vObj = CFG.VPLAZA + (base - CFG.VPLAZA) * k; if (dz <= CFG.ESPERA + 0.3) vObj = S.listo ? CFG.VPLAZA + 1.4 : 0; }
      if (S.tiempo > 0 && !S.plaza) vObj *= 0.62;
      if (S.cae > 0) { S.cae -= dt; S.v = Math.max(0, S.v - 20 * dt); if (S.cae <= 0) reaparecer(); }
      else { if (S.vuelo <= 0 && S.skate <= 0) { const es = escaleraInfo(); if (es) vObj *= 1 - 0.4 * es.lento; } S.v += clamp(vObj - S.v, -16 * dt, 7 * dt); }
      S.dist += S.v * dt; S.tAnim += dt * (Math.max(S.v, S.espera ? 5 : 0) / CFG.VEL0);
      S.px += clamp(S.tl - S.px, -dt * 9, dt * 9);
      if (S.vuelo > 0) { S.jh = 135 + Math.sin(S.t * 4) * 12; S.jv = 0; if (S.dist >= S.vueloD) { S.vuelo = 0; toast('¡Aterrizaje!', '#9ad7ff', 1); sfx.salto(); } }
      else if (S.jh > S.base || S.jv > 0) { S.jt += dt; S.jv -= 2700 * dt; S.jh += S.jv * dt; if (S.jh <= S.base && S.jv <= 0) { const vi = -S.jv; S.jh = S.base; S.jv = 0; if (!S.base) aterriza(vi); } }
      if (S.cambio && S.cambio.t > 0) S.cambio.t -= dt;
      if (S.skate > 0 && !S.plaza) { S.skate -= dt; if (S.skate <= 0) { S.skate = 0; toast('Se acabó la patineta', '#ffd18a', 1.2); } }
      if (S.slide > 0) S.slide -= dt; if (S.inv > 0) S.inv -= dt; if (S.hurt > 0) S.hurt -= dt; if (S.shake > 0) S.shake -= dt; if (S.flash > 0) S.flash -= dt;
      if (!S.plaza) {
        if (S.tiempo > 0) S.tiempo -= dt; if (S.iman > 0) S.iman -= dt; if (S.escudo > 0) S.escudo -= dt;
        if (S.dash > 0) { S.dash -= dt; if (S.dash <= 0) { S.dash = 0; toast('Fin del dash', '#bfefff', 1); } }
        if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) { if (S.mult > 1) toast('Combo terminado', '#ffd18a', 1); S.combo = 0; S.mult = 1; } }
      }
      if (S.multPulso > 0) S.multPulso -= dt; if (S.jefeFlash > 0) S.jefeFlash -= dt;
      if (S.alegre > 0) S.alegre -= dt; if (S.pista) { S.pista.t -= dt; if (S.pista.t <= 0) S.pista = null; }
      S.hist.push({ t: S.t, px: S.px, jh: S.jh }); while (S.hist.length && S.hist[0].t < S.t - 1.4) S.hist.shift();
      efectos(dt); generar(); mundoVivo(dt, S.cae <= 0);
      const jugando = S.cae <= 0;
      for (const it of S.items) {
        const z = it.d - S.dist;
        if (it.k === 'orb' && !it.tomado && !it.row.res && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) recoge(it, W / 2 + (it.lane - 1) * LW, yz(0) - 120);
        else if (it.k === 'coin' && !it.tomada && jugando && Math.abs(z) < 1.1 && Math.abs(S.px - it.lane) < (S.iman > 0 ? 1.7 : 0.6) && (S.iman > 0 || Math.abs(S.jh - it.h) < 85)) {
          it.tomada = true; const g = comboMoneda() + (S.racha >= 3 ? 1 : 0), esp = it.tipo === 'gema' || it.tipo === 'bolsa' || it.tipo === 'racha' || it.tipo === 'shuriken', val = it.tipo === 'gema' ? 10 : it.tipo === 'bolsa' ? 15 : it.tipo === 'racha' || it.tipo === 'shuriken' ? 3 : it.tipo === 'oro' ? g + 2 : g, cx = W / 2 + (it.lane - 1) * LW, cy = PY - 60 - it.h; S.monedas += val; S.puntos += val;
          if (esp) { sfx.bien(3); chispas(cx, cy, '#ffe27a', 22); fx('fx_dest', cx, cy, 0.55, 90, 210); toast('+' + val + ' 🪙', '#ffe27a', 0.9); } else { sfx.moneda(S.combo); chispas(cx, cy, it.tipo === 'oro' ? '#fff2a0' : S.mult > 1 ? '#ffb347' : '#ffd35a', 4); fx('fx_dest', cx, cy, 0.32, 46, 92); }
        }
        else if (it.k === 'obs' && !it.roto && jugando && Math.abs(z) < 0.6 && Math.abs(S.px - it.lane) < 0.55) {
          const esquiva = (it.tipo === 'bajo' || it.tipo === 'fuego') ? S.jh > 70 : it.tipo === 'muro' ? S.jh > 140 : S.slide > 0;
          if (!esquiva) { it.roto = true; if (S.dash > 0) rompe(it, true); else if (S.skate > 0) { S.puntos += 5; S.monedas += 2; sfx.bien(2); fx('fx_choque', W / 2 + (it.lane - 1) * LW, PY - 90, 0.45, 90, 210); chispas(W / 2 + (it.lane - 1) * LW, PY - 90, '#ff9ad5', 16); anillo(W / 2 + (it.lane - 1) * LW, PY - 90, '#ffb3e6', 0.8); toast('¡Crash! +2 🪙', '#ff9ad5', 0.7); } else golpe(); }
        } else if (it.k === 'pat' && !it.tomado && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6) {
          it.tomado = true; S.skate = 8; S.puntos += 20; sfx.portal(); fx('fx_remo', W / 2 + (it.lane - 1) * LW, PY - 90, 0.8, 90, 250); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#ff9ad5', 26); anillo(W / 2 + (it.lane - 1) * LW, PY - 100, '#ffd35a', 1.3); toast('🛹 ¡Patineta ninja!', '#ff9ad5', 1.8);
        } else if (it.k === 'caja' && !it.tomado && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.6 && Math.abs(S.jh - (it.h || 0)) < 105) {
          it.tomado = true; const ops = ['iman', 'escudo', 'reloj'].filter(k => (k === 'reloj' ? S.tiempo : S[k]) <= 0), pk = ops.length ? ops[RI(0, ops.length - 1)] : 'escudo'; S.puntos += 15; sfx.portal(); fx('fx_remo', W / 2 + (it.lane - 1) * LW, PY - 90, 0.8, 90, 240); fx('pu_cajaAb', W / 2 + (it.lane - 1) * LW, PY - 100, 0.7, 120, 150, { sube: true }); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#c9a0ff', 26); anillo(W / 2 + (it.lane - 1) * LW, PY - 100, '#e0c8ff', 1.3);
          if (pk === 'iman') { S.iman = 10; fx('fx_iman', W / 2 + (S.px - 1) * LW, PY - 110, 0.9, 110, 260); toast('🧲 ¡Imán de monedas!', '#c9a0ff', 1.8); }
          else if (pk === 'reloj') { S.tiempo = 8; S.flashB = Math.max(S.flashB, 0.15); toast('⏳ ¡Tiempo ninja! Todo va más lento', '#9ad7ff', 2); }
          else { S.escudo = 12; toast('🛡 ¡Escudo!', '#9ad7ff', 1.8); }
        } else if (it.k === 'nube' && !it.pasado && z < 0.5) {
          it.pasado = true; S.vuelo = 1; S.vueloD = it.hasta; S.skate = 0; sfx.portal(); fx('fx_remo', W / 2 + (S.px - 1) * LW, PY - 100, 0.9, 100, 280); chispas(W / 2, PY - 120, '#ffffff', 30); anillo(W / 2, PY - 120, '#9ad7ff', 1.6); toast('☁️ ¡Tabla voladora!', '#9ad7ff', 2);
        } else if (it.k === 'tramp' && !it.tomado && jugando && S.vuelo <= 0 && S.jh < 60 && Math.abs(z) < 0.8 && Math.abs(S.px - it.lane) < 0.6) {
          it.tomado = true; S.jv = 1350; S.jt = 0; S.slide = 0; S.puntos += 5; sfx.salto(); sfx.bien(4); fx('fx_remo', W / 2 + (it.lane - 1) * LW, PY - 20, 0.5, 60, 170); toast('¡Trampolín!', '#ffe27a', 0.9);
        } else if (it.k === 'vida' && !it.tomado && jugando && Math.abs(z) < 1.2 && Math.abs(S.px - it.lane) < 0.7) {
          it.tomado = true; S.vidas = Math.min(CFG.VIDAS, S.vidas + 1); S.puntos += 10; sfx.portal(); fx('fx_dest', W / 2 + (it.lane - 1) * LW, PY - 100, 0.7, 120, 260); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#ff9ad5', 20); toast('💛 ¡Un corazón más!', '#ffb3d9', 1.6);
        } else if (it.k === 'cofre' && !it.tomado && jugando && Math.abs(z) < 1.3 && Math.abs(S.px - it.lane) < 0.7) {
          it.tomado = true; it.tAb = S.t; S.monedas += 25; S.puntos += 30; sfx.gana(); fx('fx_dest', W / 2 + (it.lane - 1) * LW, PY - 110, 0.9, 140, 340); chispas(W / 2 + (it.lane - 1) * LW, PY - 100, '#ffe27a', 40); anillo(W / 2 + (it.lane - 1) * LW, PY - 100, '#fff3b0', 1.5); toast('🎁 ¡Cofre! +25 🪙', '#ffe27a', 1.8);
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
      { const tu = S.tuto || (S.tuto = {}); for (const it of S.items) if (esPeligro(it) && !it.cont && it.d - S.dist < -1) { it.cont = true; tu[clave(it)] = (tu[clave(it)] || 0) + 1; } }
      // filas que pasaron sin que se recogiera nada
      for (const f of S.filas) {
        if (!f.pasada && f.d - S.dist < -1.8) {
          f.pasada = true;
          if (!f.res && jugando) { f.res = true; guardaFallo(f); S.racha = 0; toast('Era ' + f.c + ' (' + f.T + ' × ' + f.n + ')', '#ffd18a', 1.6); }
        }
      }
      S.items = S.items.filter(i => (i.hasta != null ? i.hasta : i.d) - S.dist > -5); S.deco = S.deco.filter(i => i.d - S.dist > -6); S.filas = S.filas.filter(f => f.d - S.dist > -12);
      for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; } S.parts = S.parts.filter(p => p.t < p.life); for (const e of S.fx) e.t += dt; S.fx = S.fx.filter(e => e.t < e.dur);
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
    // ───────────────────────── música de fondo (sencilla, cambia con el mundo; M la silencia) ─────────────────────────
    const mus = { t: 0, paso: 0 };
    const NOTAS = [[220, 261.63, 293.66, 329.63, 392], [293.66, 329.63, 369.99, 440, 493.88], [196, 233.08, 261.63, 293.66, 349.23], [329.63, 392, 440, 493.88, 587.33], [261.63, 293.66, 329.63, 392, 440], [246.94, 293.66, 329.63, 370, 440]], PAT = [0, 2, 4, 2, 3, 2, 4, 1];
    function musica(dt) {
      if (mudo || !AC || S.fin || S.pausa) return; mus.t -= dt; if (mus.t < -1) mus.t = 0; if (mus.t > 0) return;
      mus.t += 60 / (150 + S.mundo * 3 + (S.mult - 1) * 10) / 2; const sc = NOTAS[Math.min(NOTAS.length - 1, S.mundo)], i = mus.paso++ % 8;
      if (S.espera && i % 2) return; // en la plaza de pregunta suena más tranquila
      tono(sc[PAT[i]], 0.28, 'triangle', 0.03); if (i % 4 === 0) tono(sc[0] / 2, 0.5, 'sine', 0.05); if (i === 6) tono(sc[4] * 2, 0.2, 'sine', 0.018);
    }
    // ───────────────────────── física visual: despegue, aterrizaje, escalones ─────────────────────────
    function despega() {
      const hx = W / 2 + (S.px - 1) * LW; for (let i = 0; i < 5; i++) { const lado = i % 2 ? 1 : -1; S.polvo.push({ x: hx + lado * R(8, 22), y: PY - 2, vx: lado * R(40, 120), vy: R(-70, -20), life: R(0.25, 0.45), t: 0, r: R(5, 9) }); }
      (S.ondas = S.ondas || []).push({ x: hx, y: PY + 2, t: 0, f: 0.4 });
    }
    function aterriza(vi) {
      if (vi < 250) return; const f = clamp(vi / 1300, 0.25, 1), hx = W / 2 + (S.px - 1) * LW; S.sq = { t0: S.t, f }; S.bump = Math.max(S.bump || 0, f);
      for (let i = 0; i < 6 + Math.round(8 * f); i++) { const lado = i % 2 ? 1 : -1; S.polvo.push({ x: hx + lado * R(10, 30), y: PY - 2 - (S.escal || 0), vx: lado * R(70, 230) * (0.5 + f), vy: R(-110, -30), life: R(0.35, 0.65), t: 0, r: R(7, 13) }); }
      (S.ondas = S.ondas || []).push({ x: hx, y: PY + 2 - (S.escal || 0), t: 0, f }); if (vi > 500) sfx.aterriza(f);
    }
    // ESCALERA DEL PORTAL. Con la geometría real del sprite (PORT) se calcula en qué peldaño está la Sakura según la distancia al portal:
    //  · sus pies se apoyan en cada peldaño (no lo atraviesan), pegando un saltito con estiramiento y polvito al subir al siguiente,
    //  · el cuerpo se achica un poco al subir (se aleja) y recupera su tamaño arriba,
    //  · la carrera se frena un poco en la escalera para que se vea que la sube, y se recupera sola al salir.
    function escaleraInfo() {
      const im = IMG(ART.portal); if (!listo(im)) return null;
      let z = null; for (const it of S.items) if (it.k === 'portal') { const d = it.d - S.dist; if (d < 3.6 && d > -3.4 && (z === null || Math.abs(d) < Math.abs(z))) z = d; }
      if (z === null) return null;
      const K = RW * 2.05 * pz(z) / PORT.w, yb = yz(z), ys = PORT.h - (yb - PY) / K;      // ys: dónde cae el pie dentro del sprite (coordenadas del sprite)
      const dx = Math.abs((S.px - 1) * LW), c = clamp(1 - (dx - PORT.medio * K * 0.85) / (0.45 * LW), 0, 1);   // 1 = en el carril de la escalera, 0 = en un carril lateral
      let idx = 0; for (let j = 0; j < PORT.frentes.length; j++) if (ys <= PORT.frentes[j]) idx = j + 1;
      if (ys < PORT.tope) idx = PORT.frentes.length + 1;                                   // ya pasó el último peldaño: suelo llano
      const alt = idx >= 1 && idx <= PORT.frentes.length ? PY - (yb - (PORT.h - PORT.apoyos[idx - 1]) * K) : 0;
      const ramp = z > 1.2 ? clamp((3.4 - z) / 2.2, 0, 1) : z > -2.6 ? 1 : clamp((z + 3.2) / 0.6, 0, 1);
      const wIn = z > 2.6 ? 0 : z > 1.2 ? (2.6 - z) / 1.4 : z > -2.6 ? 1 : clamp((z + 3.1) / 0.5, 0, 1), off = (PORT.cx - PORT.w / 2) * K * c * wIn;   // la escalera del sprite queda a la derecha del centro del arco
      return { z, idx, c, off, alt: alt * c, prog: clamp((PORT.frentes[0] - ys) / (PORT.frentes[0] - PORT.tope), 0, 1), lento: c * ramp };
    }
    function escalones(dt) {
      const e = (S.vuelo > 0 || S.skate > 0) ? null : escaleraInfo(), tgt = e ? e.alt : 0, prev = S.escal || 0;
      S.escal = prev + (tgt - prev) * Math.min(1, dt * 26); S.escX = (S.escX || 0) + ((e ? e.off : 0) - (S.escX || 0)) * Math.min(1, dt * 12);
      const idx = e && e.c > 0.5 ? e.idx : 0;
      if (idx >= 1 && idx <= PORT.frentes.length && idx > (S._idxE || 0) && S.jh <= 1 && S.cae <= 0) {
        S.hop = { t0: S.t }; const hx = W / 2 + (S.px - 1) * LW;
        for (let i = 0; i < 4; i++) S.polvo.push({ x: hx + R(-22, 22), y: PY - 2 - S.escal, vx: R(-60, 60), vy: R(-55, -18), life: R(0.22, 0.4), t: 0, r: R(4, 8) });
      }
      S._idxE = idx;
      S.escHop = S.hop && S.t - S.hop.t0 < 0.2 ? 9 * Math.sin(Math.PI * (S.t - S.hop.t0) / 0.2) : 0;
      const kT = e && e.idx >= 1 && e.idx <= PORT.frentes.length ? 1 - 0.07 * e.prog * e.c : 1;
      S.escK = (S.escK || 1) + (kT - (S.escK || 1)) * Math.min(1, dt * 8);
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
      musica(dt);
      S.ema = (S.ema || 0.0167) * 0.95 + dt * 0.05; S.slowT = S.ema > 0.026 ? (S.slowT || 0) + dt : 0; if (S.slowT > 1.5) S.lite = true;
      const ob = temaIdx(); S.temaF += clamp(ob - S.temaF, -dt * 0.45, dt * 0.45); if (S.flashB > 0) S.flashB -= dt;
      const n = S.lite ? 10 : 26; while (S.amb.length < n) { const p = {}; nuevaAmb(p, true); S.amb.push(p); } if (S.amb.length > n) S.amb.length = n;
      for (const p of S.amb) {
        p.t += dt; p.ph += dt * 2.2; p.x += p.vx * dt + Math.sin(p.ph) * (p.tipo === 1 ? 30 : 10) * dt; p.y += p.vy * dt + (p.tipo === 0 ? Math.cos(p.ph * 0.7) * 10 * dt : 0); if (p.tipo === 1) p.rot += dt * 2;
        if (p.t > p.life || p.y < -30 || p.y > H + 30 || p.x < -30 || p.x > W + 30 || (p.tipo !== TEMAS[ob].amb && p.t > 1.5)) nuevaAmb(p, false);
      }
      S.polvoT -= dt; if (S.polvoT <= 0 && S.cae <= 0 && S.jh <= S.base + 1) { S.polvoT = S.slide > 0 ? 0.025 : 0.07; const hx = W / 2 + (S.px - 1) * LW; S.polvo.push({ x: hx + R(-16, 16), y: PY - S.base - 2 + R(-3, 3), vx: R(-35, 35), vy: R(-70, -25), life: R(0.35, 0.6), t: 0, r: R(6, 12) }); }
      for (const p of S.polvo) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 14; } S.polvo = S.polvo.filter(p => p.t < p.life); S.ondas = (S.ondas || []).filter(o => (o.t += dt) < 0.45); S.bump = Math.max(0, (S.bump || 0) - dt * 3.5); escalones(dt);
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
    const cachePanoC = {};
    function cachePano(i) {
      if (cachePanoC[i]) return cachePanoC[i]; const t = TEMAS[i]; if (!t.pano) return null; const m = IMG(t.pano); if (!listo(m)) return null;
      const h = HOR + 78, w = Math.round(h * m.naturalWidth / m.naturalHeight), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.drawImage(m, 0, 0, w, h); x.globalCompositeOperation = 'destination-out'; const g = x.createLinearGradient(0, h - 96, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = g; x.fillRect(0, h - 96, w, 96);
      return (cachePanoC[i] = c);
    }
    function fondoDib(ta, tb, f) {
      ctx.drawImage(cacheTema(ta), -60, -60); if (f > 0.01 && tb !== ta) { ctx.globalAlpha = f; ctx.drawImage(cacheTema(tb), -60, -60); ctx.globalAlpha = 1; }
      const lst = [[ta, 1 - f, 0.85]]; if (f > 0.01 && tb !== ta) lst.push([tb, f, f * 0.85]);
      lst.forEach(c => {
        const tm = TEMAS[c[0]], pc = tm.pano ? cachePano(c[0]) : null;
        if (pc) { ctx.globalAlpha = clamp(c[1], 0, 1); ctx.drawImage(pc, -(pc.width - W) / 2 - (S.px - 1) * 12 - ((S.dist * 0.12) % 14), 0); ctx.globalAlpha = 1; return; }
        if (c[2] <= 0.01) return; const m = IMG(BG + tm.bg + '.png'); if (!listo(m)) return; const hh = 200, ww = hh * m.naturalWidth / m.naturalHeight, off = -((S.dist * 0.5 + (S.px - 1) * 30) % ww);
        ctx.globalAlpha = c[2]; for (let x = off - ww; x < W + 60; x += ww) ctx.drawImage(m, x, HOR - hh + 16, ww, hh); ctx.globalAlpha = 1;
      });
    }
    // ───────────────────────── capas visuales extra (todo procedural, no necesita imágenes) ─────────────────────────
    // adoquines con juntas escalonadas + detalle del suelo por mundo, nubes, rayos de luz, aurora (hielo), tormenta (trueno) y corrección de color
    let adoR = null, nubesC = null, nubesO = null;
    const GRADOS = [['#35d6b0', '#ffd36b'], ['#ff8fcf', '#ffd0a8'], ['#5a7bff', '#ffb86b'], ['#ff6a2a', '#ffd36b'], ['#6fe0ff', '#a8d0ff'], ['#8a6bff', '#ffe27a']].map(p => p.map(hexA));
    function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
    function adoquin(y, p, z, w, paso) {
      const r = Math.floor((z + S.dist) / 2.2), mu = Math.min(TEMAS.length - 1, Math.round(S.temaF));
      if (adoR !== null && adoR !== r) { ctx.fillStyle = 'rgba(0,0,0,.17)'; ctx.fillRect(W / 2 - w, y, w * 2, Math.max(1, 1.6 * p)); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(W / 2 - w, y + Math.max(1, 1.6 * p), w * 2, Math.max(1, p)); }
      ctx.fillStyle = 'rgba(0,0,0,.13)'; const st = (r & 1) * 0.275, jw = Math.max(1, 1.5 * p); if (p > 0.3) { ctx.beginPath(); for (let u = -1.65 + st; u < 1.7; u += 0.55) ctx.rect(W / 2 + u * LW * p - jw / 2, y, jw, paso + 1); ctx.fill(); }
      if (adoR !== r && p > 0.2) {
        const h = hash(r * 7 + 13), ux = (hash(r * 3 + 1) * 2 - 1) * RW * p * 0.8, x = W / 2 + ux;
        if (mu === 3 && h < 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,30,.55)'; ctx.fillRect(x, y, (20 + hash(r + 5) * 40) * p, Math.max(1.5, 3 * p)); ctx.restore(); }
        else if (mu === 4 && h < 0.4) { const a = 0.35 + 0.35 * Math.sin(S.t * 3 + r), s = 5 * p; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,245,255,' + a + ')'; ctx.fillRect(x - s, y, s * 2, Math.max(1, 1.4 * p)); ctx.fillRect(x - Math.max(.7, .7 * p), y - s * 0.8, Math.max(1.4, 1.4 * p), s * 1.6); ctx.restore(); }
        else if (mu === 5 && h < 0.22) { ctx.fillStyle = 'rgba(150,170,255,.16)'; ctx.beginPath(); ctx.ellipse(x, y, 42 * p, 7 * p, 0, 0, 7); ctx.fill(); }
        else if (mu === 1 && h < 0.35) { ctx.fillStyle = 'rgba(255,190,225,.55)'; ctx.beginPath(); ctx.ellipse(x, y, 7 * p, 3.5 * p, hash(r) * 3, 0, 7); ctx.fill(); }
        else if (mu === 0 && h < 0.3) { ctx.fillStyle = 'rgba(90,200,120,.4)'; ctx.beginPath(); ctx.ellipse(x, y, 9 * p, 3 * p, hash(r) * 3, 0, 7); ctx.fill(); }
        else if (mu === 2 && h < 0.18) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,210,120,.28)'; ctx.beginPath(); ctx.ellipse(x, y, 16 * p, 4 * p, 0, 0, 7); ctx.fill(); ctx.restore(); }
      }
      adoR = r;
    }
    function nubesCache(osc) {
      const c = document.createElement('canvas'); c.width = 1080; c.height = 200; const x = c.getContext('2d');
      for (let i = 0; i < 9; i++) { const cx = (i * 131 + 60) % 1080, cy = 40 + ((i * 57) % 110), s = 50 + ((i * 37) % 40);
        for (let k = 0; k < 6; k++) { const ox = cx + (k - 2.5) * s * 0.5, oy = cy + Math.sin(k * 1.3 + i) * s * 0.2, r = s * (0.55 + ((k * 13 + i * 7) % 10) / 30), g = x.createRadialGradient(ox, oy, 0, ox, oy, r); g.addColorStop(0, osc ? 'rgba(15,10,35,.55)' : 'rgba(255,255,255,.5)'); g.addColorStop(1, osc ? 'rgba(15,10,35,0)' : 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(ox - r, oy - r, r * 2, r * 2); } }
      return c;
    }
    function nubesDib() {
      if (S.lite) return; const osc = S.temaF > 4.5, c = osc ? (nubesO || (nubesO = nubesCache(true))) : (nubesC || (nubesC = nubesCache(false))), off = -((S.t * 7 + S.dist * 0.12 + (S.px - 1) * 24) % 1080);
      ctx.globalAlpha = osc ? 0.9 : 0.32; ctx.drawImage(c, off, 30); ctx.drawImage(c, off + 1080, 30); ctx.globalAlpha = 1;
    }
    function auroraDib() {
      if (S.lite) return; const a = clamp(1 - Math.abs(S.temaF - 4), 0, 1); if (a <= 0.02) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { const col = k === 0 ? '80,255,200' : k === 1 ? '120,200,255' : '200,140,255', g = ctx.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.25, 'rgba(' + col + ',' + (0.26 * a) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g;
        for (let x = -60; x < W + 60; x += 20) { const y = 70 + k * 34 + Math.sin(x * 0.011 + S.t * 0.55 + k * 1.7) * 24 + Math.sin(x * 0.027 - S.t * 0.3) * 8; ctx.translate(x, y); ctx.fillRect(0, 0, 21, 110); ctx.translate(-x, -y); } }
      ctx.restore();
    }
    function rayosLuz(Tm) {
      if (S.lite) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) { const x0 = 360 + k * 46 + Math.sin(S.t * 0.22 + k * 1.3) * 24, g = ctx.createLinearGradient(x0, 0, x0 - 300, H * 0.75); g.addColorStop(0, rgb(Tm.borde, 0.11)); g.addColorStop(1, rgb(Tm.borde, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, -20); ctx.lineTo(x0 + 52, -20); ctx.lineTo(x0 - 280, H * 0.75); ctx.lineTo(x0 - 370, H * 0.75); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    function rayoDib() {
      const a = clamp((S.temaF - 4.4) / 0.6, 0, 1); if (a <= 0 || S.pausa) return; const r = S.rayo || (S.rayo = { next: 2, t0: -9, pts: [] });
      if (S.t > r.next) { r.t0 = S.t; r.next = S.t + R(3, 7); let x = R(80, W - 80), y = -10; r.pts = [[x, y]]; while (y < HOR + 10) { y += R(24, 46); x += R(-34, 34); r.pts.push([x, y]); } if (!mudo) tono(60, 0.8, 'sawtooth', 0.04, 0.25); }
      const el = S.t - r.t0; if (el > 0.4) return; const k = clamp(1 - el / 0.4, 0, 1) * (0.6 + 0.4 * Math.sin(el * 60)) * a;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(210,225,255,' + (0.2 * k) + ')'; ctx.fillRect(-60, -60, W + 120, H + 120);
      ctx.strokeStyle = 'rgba(230,240,255,' + k + ')'; ctx.lineWidth = 3; ctx.shadowColor = '#bcd0ff'; ctx.shadowBlur = 18; ctx.beginPath(); r.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.restore();
    }
    function lluviaDib() {
      const a = clamp((S.temaF - 4.2) / 0.8, 0, 1); if (a <= 0 || S.lite) return; ctx.save(); ctx.strokeStyle = 'rgba(190,205,255,' + (0.28 * a) + ')'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let i = 0; i < 70; i++) { const x = ((i * 97.3) + S.t * 70) % (W + 80) - 40, y = ((i * 131.7) + S.t * 950) % (H + 60) - 30; ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 36); } ctx.stroke(); ctx.restore();
    }
    function gradoDib(ta, tb, f) {
      if (S.lite) return;
      const A = GRADOS[ta], B = GRADOS[tb], g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(mix(A[0], B[0], f))); g.addColorStop(1, rgb(mix(A[1], B[1], f)));
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.38; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    function camino(Tm) {
      const paso = S.lite ? 6 : 4; let prev = null; adoR = null;
      for (let y = HOR + 8; y < H; y += paso) {
        const p = (y - HOR) / (PY - HOR); if (p <= 0.01) continue; const z = Z0 * (1 / p - 1), par = Math.floor((z + S.dist) / 5) % 2 === 0, w = RW * p, ff = clamp(1 - p * 1.9, 0, 0.7);
        ctx.fillStyle = rgb(mix(par ? Tm.c1 : Tm.c2, Tm.niebla, ff)); ctx.fillRect(W / 2 - w, y, w * 2, paso + 1);
        const cw = 15 * p + 1.5, fino = Math.max(1, 2.5 * p);
        ctx.fillStyle = rgb(mix(par ? [150, 140, 170] : [118, 108, 140], Tm.niebla, ff)); ctx.fillRect(W / 2 - w - cw, y, cw, paso + 1); ctx.fillRect(W / 2 + w, y, cw, paso + 1);
        ctx.fillStyle = rgb(mix(Tm.borde, Tm.niebla, ff), 0.75); ctx.fillRect(W / 2 - w - cw, y, fino, paso + 1); ctx.fillRect(W / 2 + w + cw - fino, y, fino, paso + 1);
        if (prev !== null && prev !== par) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(W / 2 - w, y, w * 2, Math.max(1, 2.2 * p)); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(W / 2 - w, y + Math.max(1, 2.2 * p), w * 2, Math.max(1, 1.2 * p)); }
        prev = par; if (!S.lite && p > 0.14) adoquin(y, p, z, w, paso);
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
      const hint = row.hint && it.ok && !row.res, pulso = hint ? 1 + 0.12 * Math.sin(S.t * 8) : 1, pod = !!row.poder;
      if (!row.res && z > 0.4) brillo(x, yz(z), r * 1.9, hint && it.ok ? '90,255,150' : pod ? '200,140,255' : '110,190,255', 0.3 * a);
      if (!row.res && !S.lite && z < 34 && z > 1) { for (let k = 1; k <= 3; k++) { const z2 = z + k * 2.6, p2 = pz(z2); brillo(W / 2 + (it.lane - 1) * LW * p2, yz(z2) - (100 + bob) * p2, 66 * p2 * 0.85, '255,190,90', a * 0.28 / k); } }
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = 'rgba(60,30,10,.85)'; ctx.lineWidth = Math.max(1, 3 * p); ctx.beginPath(); ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x, y - r * 2.4); ctx.stroke();
      ctx.restore(); brillo(x, y, r * 2.2 * pulso, pod ? '210,150,255' : '255,185,80', 0.7 * a);
      ctx.save(); ctx.globalAlpha = a;
      const b = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.1); b.addColorStop(0, pod ? '#f3e6ff' : '#fff4c9'); b.addColorStop(0.55, pod ? '#b074f0' : '#ffa63d'); b.addColorStop(1, pod ? '#5a2aa8' : '#d4551c'); ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(x, y, r * 0.92, r * 1.08, 0, 0, 7); ctx.fill();
      ctx.lineWidth = Math.max(1, 3 * p); ctx.strokeStyle = '#8a2b0e'; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,40,10,.35)'; ctx.lineWidth = Math.max(1, 2 * p); ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r * 1.08, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 1.08, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#3a1a10'; ctx.strokeStyle = '#f0b43c'; ctx.lineWidth = Math.max(1, 2 * p); rr(x - r * 0.42, y - r * 1.2, r * 0.84, r * 0.24, r * 0.08); ctx.fill(); ctx.stroke(); rr(x - r * 0.42, y + r * 0.97, r * 0.84, r * 0.24, r * 0.08); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = Math.max(1, 4 * p); ctx.beginPath(); ctx.moveTo(x, y + r * 1.2); ctx.lineTo(x, y + r * 1.75); ctx.stroke(); ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(x, y + r * 1.8, r * 0.1, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff7de'; ctx.strokeStyle = hint ? '#35e07a' : '#b8741c'; ctx.lineWidth = Math.max(1.5, (hint ? 4.5 : 2.5) * p); rr(x - r * 0.78, y - r * 0.44, r * 1.56, r * 0.88, r * 0.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a1d05'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * (String(it.val).length > 2 ? 0.66 : 0.8)) + 'px ' + FUENTE; ctx.fillText(it.val, x, y + r * 0.04);
      ctx.restore();
    }
    // Puerta baja: abertura libre de 165 px (la Sakura de pie mide ~215, deslizándose ~110) con vigas rojas, placa dorada y tejadillo
    function puerta(x, y, p, a) {
      const w = LW * 0.5, H1 = 165;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.globalAlpha = a;
      [-1, 1].forEach(sg => { const px = sg * w, g = ctx.createLinearGradient(px - 9, 0, px + 9, 0); g.addColorStop(0, '#e24a3a'); g.addColorStop(0.5, '#b3261e'); g.addColorStop(1, '#7a1612');
        ctx.fillStyle = '#4a4455'; ctx.fillRect(px - 17, -22, 34, 22); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px - 17, -22, 34, 4);
        ctx.fillStyle = g; ctx.fillRect(px - 9, -222, 18, 200); ctx.fillStyle = '#ffd35a'; ctx.fillRect(px - 10, -62, 20, 4); ctx.fillRect(px - 10, -150, 20, 3); });
      ctx.fillStyle = '#c0281f'; ctx.fillRect(-w - 14, -H1 - 18, 2 * w + 28, 18); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-w - 14, -H1 - 4, 2 * w + 28, 4); ctx.fillStyle = '#ffd35a'; ctx.fillRect(-w - 14, -H1 - 18, 2 * w + 28, 3);
      ctx.fillStyle = '#3a1218'; ctx.fillRect(-26, -H1 - 52, 52, 30); ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = 3; ctx.strokeRect(-26, -H1 - 52, 52, 30); ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(0, -H1 - 37, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#c0281f'; ctx.fillRect(-w - 24, -H1 - 76, 2 * w + 48, 22);
      ctx.fillStyle = '#2b1a24'; ctx.beginPath(); ctx.moveTo(-w - 52, -H1 - 78); ctx.lineTo(w + 52, -H1 - 78); ctx.lineTo(w + 34, -H1 - 104); ctx.lineTo(-w - 34, -H1 - 104); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd35a'; ctx.fillRect(-w - 52, -H1 - 80, 2 * w + 104, 3);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-w + 9, -H1, 2 * w - 18, 14);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    const SKIN = {
      barril: { a: 'ob_barril', h: 120 }, caja: { a: 'ob_caja', h: 112 }, valla: { a: 'ob_valla', h: 104 }, roca: { a: 'ob_roca', h: 118 }, farol: { a: 'ob_farol', h: 92 },
      l_barril: { a: 'lv_barril', h: 120 }, l_caja: { a: 'lv_caja', h: 112 }, l_valla: { a: 'lv_valla', h: 106 },
      torii: { a: 'ob_torii', h: 275 }, viga: { a: 'ob_viga', h: 190, cuelga: 118 }, l_torii: { a: 'lv_torii', h: 236 }, puerta: { proc: true }
    }; // los de «agacharse» dejan un hueco libre de unos 150 px (la Sakura deslizándose mide ~110)
    function muroDib(x, y, p, a) {
      const w = LW * 0.99 * p, h = 135 * p; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#6a4f66'; ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.strokeStyle = 'rgba(20,8,30,.55)'; ctx.lineWidth = Math.max(1, 2 * p);
      for (let r = 0; r < 5; r++) { const yy = y - h * (r + 1) / 5, off = r % 2 ? w / 6 : 0; ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); for (let c = 0; c < 3; c++) { const xx = x - w / 2 + off + c * w / 3; ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + h / 5); } ctx.stroke(); }
      ctx.fillStyle = '#c0392b'; ctx.fillRect(x - w / 2, y - h - 7 * p, w, 9 * p); ctx.restore();
    }
    function fuegoDib(it, z, x, y, p) {
      if (it.vd && z > 36) return; const a = clamp((ZMAX - z) / 26, 0, 1) * (it.vd ? clamp((36 - z) / 3, 0, 1) : 1), r = 36 * p * (1 + 0.08 * Math.sin(S.t * 20 + it.d)), yy = y - 50 * p;
      ctx.save(); ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r * 0.32, 0, 0, 7); ctx.fill();
      for (let k = 3; k >= 1; k--) { const z2 = z + k * 2.2, p2 = pz(z2); ctx.globalAlpha = a * 0.3 / k; ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(W / 2 + (it.lane - 1) * LW * p2, yz(z2) - 50 * p2, 30 * p2, 0, 7); ctx.fill(); }
      ctx.restore(); brillo(x, yy, r * 2.6, '255,120,40', 0.7 * a);
      ctx.save(); ctx.globalAlpha = a; const g = ctx.createRadialGradient(x - r * 0.2, yy - r * 0.2, r * 0.1, x, yy, r); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.5, '#ff9a2a'); g.addColorStop(1, '#d4300e'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, yy, r, 0, 7); ctx.fill(); ctx.restore();
    }
    function estrella(x, y, r, rot, fill, lw) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.38 : r, an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#2a2a44'; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
    }
    function shuDib(it, z) {
      if (it.roto || z < -2) return; const p = pz(z), x = W / 2 + (it.x - 1) * LW * p, y = yz(z) - 46 * p, a = clamp((ZMAX - z) / 26, 0, 1), r = 34 * p;
      ctx.save(); ctx.globalAlpha = a * 0.28; ctx.fillStyle = '#ff4a4a'; ctx.fillRect(W / 2 - LW * 1.75 * p, yz(z) - 2 * p, LW * 3.5 * p, 4 * p);
      ctx.globalAlpha = a * 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, yz(z), r * 0.9, r * 0.28, 0, 0, 7); ctx.fill();
      if (it.act) for (let k = 3; k >= 1; k--) { ctx.globalAlpha = a * 0.16 * (4 - k) / 3; estrella(x - it.dir * k * 22 * p, y, r * 0.9, it.rot - k * 0.4, '#cfd8ff', 1); }
      ctx.restore(); brillo(x, y, r * 2.2, '255,90,90', 0.5 * a);
      ctx.save(); ctx.globalAlpha = a; estrella(x, y, r, it.rot, '#d8def8', Math.max(1, 2.5 * p)); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x, y, r * 0.18, 0, 7); ctx.fill(); ctx.restore();
    }
    function vigaDib(it, z) {
      if (it.roto || z < -2) return; const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z), a = clamp((ZMAX - z) / 26, 0, 1);
      if (!it.suelo) {
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,40,40,' + (0.3 + 0.2 * Math.sin(S.t * 10)) + ')'; ctx.beginPath(); ctx.ellipse(x, y, LW * 0.46 * p, 15 * p, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,80,.9)'; ctx.lineWidth = Math.max(1, 3 * p); ctx.stroke();
        if (!it.cayo) { ctx.fillStyle = '#ffdede'; ctx.font = 'bold ' + Math.round(44 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚠', x, y - 40 * p); }
        ctx.restore();
      }
      if (it.cayo) {
        const f = clamp((S.t - it.tc) / 0.28, 0, 1), off = (1 - f * f) * 420 * p, w = LW * 0.5 * p, h = 165 * p;
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - w / 2, y - h - off, w, h); ctx.fillStyle = '#d4a63c';
        ctx.fillRect(x - w / 2 - 3 * p, y - h - off + h * 0.15, w + 6 * p, 12 * p); ctx.fillRect(x - w / 2 - 3 * p, y - h - off + h * 0.7, w + 6 * p, 12 * p);
        ctx.strokeStyle = '#2d1608'; ctx.lineWidth = Math.max(1, 2 * p); ctx.strokeRect(x - w / 2, y - h - off, w, h); ctx.restore();
      }
    }
    function platDib(it) {
      const zA = it.d - S.dist, zB = it.hasta - S.dist;
      for (let zz = Math.min(zB, ZMAX - 1); zz >= Math.max(zA, -3); zz -= 1.3) {
        const p = pz(zz), x = W / 2 + (it.lane - 1) * LW * p, yg = yz(zz), y = yg - PLAT_H * p, a = clamp((ZMAX - zz) / 26, 0, 1) * clamp((zz + 3) / 3, 0, 1);
        ctx.globalAlpha = a * 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, yg, LW * 0.45 * p, 9 * p, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = a; ctx.fillStyle = '#b9cdf0'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(x + k * 34 * p, y + 22 * p, 40 * p, 20 * p, 0, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#f6f9ff'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(x + k * 34 * p, y + (k ? 15 : 10) * p, 40 * p, 20 * p, 0, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      const zm = clamp((zA + zB) / 2, 0.5, ZMAX - 2); if (zB > 0) brillo(W / 2 + (it.lane - 1) * LW * pz(zm), yz(zm) - PLAT_H * pz(zm), 120 * pz(zm), '200,230,255', 0.35);
      if (zA > 2 && zA < 42) {
        const p = pz(zA), tx = W / 2 + (it.lane - 1) * LW * p, ty = yz(zA) - (PLAT_H + 70) * p;
        ctx.save(); ctx.globalAlpha = clamp((ZMAX - zA) / 26, 0, 1); ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = 'rgba(10,5,30,.9)'; ctx.lineWidth = Math.max(1, 5 * p); ctx.font = 'bold ' + Math.round(30 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeText('⬆ ☁️ ¡SALTA!', tx, ty); ctx.fillText('⬆ ☁️ ¡SALTA!', tx, ty); ctx.restore();
      }
    }
    function oroDib(it) {
      const zA = Math.max(it.d - S.dist, -2), zB = Math.min(it.hasta - S.dist, ZMAX - 2); if (zB <= zA) return;
      const pa = pz(zA), pb = pz(zB), xa = W / 2 + (it.lane - 1) * LW * pa, xb = W / 2 + (it.lane - 1) * LW * pb, wa = LW * 0.46 * pa, wb = LW * 0.46 * pb, ya = yz(zA), yb = yz(zB);
      ctx.save(); const g = ctx.createLinearGradient(0, yb, 0, ya); g.addColorStop(0, 'rgba(255,226,120,0)'); g.addColorStop(1, 'rgba(255,214,90,' + (0.38 + 0.1 * Math.sin(S.t * 6)) + ')');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(xa - wa, ya); ctx.lineTo(xa + wa, ya); ctx.lineTo(xb + wb, yb); ctx.lineTo(xb - wb, yb); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,240,170,.8)';
      for (let i = 0; i < 10; i++) { const zz = zA + ((i * 7.3 + S.t * 14) % Math.max(1, zB - zA)), pp = pz(zz); ctx.beginPath(); ctx.arc(W / 2 + (it.lane - 1) * LW * pp + Math.sin(i * 3 + S.t * 4) * 30 * pp, yz(zz) - (30 + 40 * ((S.t * 1.5 + i * 0.37) % 1)) * pp, 3.5 * pp + 1, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    function jefeDib() {
      const V = window.VILLAIN_MANIFEST, zb = 38, p = pz(zb), alpha = (S.jefeHp > 0 || S.jefeDerr < 0) ? 1 : clamp(1 - (S.t - S.jefeDerr) / 1.2, 0, 1); if (alpha <= 0) return;
      const x = W / 2 + (S.jefeX - 1) * LW * p * 1.3, yb = yz(zb) - 20 * p + Math.sin(S.t * 2.2) * 8 * p;
      const carga = S.items.some(i => i.k === 'obs' && i.vd && !i.roto && !i.act && i.d - S.dist < 52 && i.d - S.dist > 0);
      ctx.save(); ctx.globalAlpha = alpha * ((S.jefeFlash > 0 && Math.floor(S.t * 20) % 2) ? 0.45 : 1);
      brillo(x, yb - 160 * p, 280 * p, carga ? '255,80,60' : '150,40,255', (carga ? 0.55 : 0.4) + 0.1 * Math.sin(S.t * 6));
      const fr = V && V.walk && V.walk.length > 6 ? V.walk.slice(5) : null; let hecho = false;
      if (fr) { const f = fr[Math.floor(S.t * 16) % fr.length], im = IMG('assets/characters/villain/' + f.file); if (listo(im)) { const k = 3.7 * p; ctx.translate(x, yb); if ((S.jefeDir || 1) < 0) ctx.scale(-1, 1); ctx.drawImage(im, -f.ax * k, -f.ay * k, f.w * k, f.h * k); hecho = true; } }
      if (!hecho) { ctx.font = Math.round(300 * p) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('👹', x, yb); }
      ctx.restore();
    }
    function jefeBarra() {
      const w = 300, x = (W - w) / 2, y = 226, hp = S.jefeHp / 3;
      ctx.save(); ctx.fillStyle = 'rgba(10,5,30,.8)'; rr(x - 4, y - 4, w + 8, 30, 15); ctx.fill(); ctx.strokeStyle = '#c9a0ff'; ctx.lineWidth = 3; ctx.stroke();
      if (hp > 0) { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ff3d6a'); g.addColorStop(1, '#ff9a3d'); ctx.fillStyle = g; rr(x, y, w * hp, 22, 11); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 16px ' + FUENTE; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,5,30,.95)';
      const t = '👹 REY DEL CAOS · ' + S.jefeHp + '/3'; ctx.strokeText(t, W / 2, y + 12); ctx.fillText(t, W / 2, y + 12); ctx.restore();
    }
    function comboHud() {
      if (S.mult > 1 || S.combo >= 3) {
        const pul = 1 + 0.22 * clamp(S.multPulso / 0.6, 0, 1), col = ['#ffe27a', '#ffe27a', '#ffb347', '#ff8a3d', '#ff5a5a', '#ff3d9a'][S.mult];
        ctx.save(); ctx.translate(W - 16, 98); ctx.scale(pul, pul); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,5,30,.92)'; ctx.font = 'bold 34px ' + FUENTE;
        const t = S.mult > 1 ? '🔥 ×' + S.mult : '✨ ' + S.combo; ctx.strokeText(t, 0, 0); ctx.fillStyle = col; ctx.fillText(t, 0, 0);
        ctx.font = 'bold 15px ' + FUENTE; ctx.lineWidth = 4; ctx.strokeText('COMBO ' + S.combo, 0, 24); ctx.fillStyle = '#fff'; ctx.fillText('COMBO ' + S.combo, 0, 24);
        const f = clamp(S.comboT / 3, 0, 1); ctx.fillStyle = 'rgba(10,5,30,.7)'; ctx.fillRect(-96, 36, 96, 7); ctx.fillStyle = col; ctx.fillRect(-96, 36, 96 * f, 7); ctx.restore();
      }
      if (S.vientoAv && S.viento) { ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 64px ' + FUENTE; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,5,30,.9)'; const tx = S.viento.dir < 0 ? '⟵ 🌪' : '🌪 ⟶'; ctx.strokeText(tx, W / 2, 520); ctx.fillStyle = '#cfe8ff'; ctx.fillText(tx, W / 2, 520); ctx.restore(); }
    }
    function oscuroDib() {
      const k = S.oscuro; if (k <= 0.02) return;
      ctx.save(); const cx = W / 2 + (S.px - 1) * LW * 0.35, cy = PY - 170, g = ctx.createRadialGradient(cx, cy, 100, cx, cy, 380);
      g.addColorStop(0, 'rgba(3,2,16,0)'); g.addColorStop(1, 'rgba(3,2,16,' + (0.96 * k).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400); ctx.restore();
      for (const it of S.items) {   // luciérnagas: marcan el camino de monedas
        if (it.k !== 'coin' || it.tomada) continue; const z = it.d - S.dist; if (z < -1 || z > 50) continue;
        const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p + Math.sin(S.t * 3 + it.d) * 8 * p, y = yz(z) - (46 + it.h) * p - 10 * p * Math.sin(S.t * 4 + it.d);
        brillo(x, y, 26 * p + 8, '200,255,140', 0.85 * k);
      }
    }
    function obstaculo(it, z) {
      if (it.roto) return; const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z), a = clamp((ZMAX - z) / 26, 0, 1), sk = SKIN[it.skin] || SKIN.barril;
      if (it.tipo === 'fuego') { fuegoDib(it, z, x, y, p); return; }
      ctx.fillStyle = 'rgba(0,0,0,.33)'; ctx.beginPath(); ctx.ellipse(x, y, LW * 0.42 * p, 12 * p, 0, 0, 7); ctx.fill();
      if (it.tipo === 'muro') { muroDib(x, y, p, a); return; }
      if (it.tipo === 'bajo') { spr(IMG(ART[sk.a]), it.lane - 1, z, sk.h); if (z < 40 && z > 2) { ctx.fillStyle = '#ffe27a'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬆', x, y - (sk.h + 30) * p); } }
      else {
        let top = 290;
        if (sk.proc) puerta(x, y, p, a);
        else { const im = IMG(ART[sk.a]); if (listo(im)) { const ht = sk.h * p, wd = ht * im.naturalWidth / im.naturalHeight; ctx.globalAlpha = a; ctx.drawImage(im, x - wd / 2, y - (sk.cuelga || 0) * p - ht, wd, ht); ctx.globalAlpha = 1; } top = sk.h + (sk.cuelga || 0) + 24; }
        if (z < 40 && z > 2) { ctx.fillStyle = '#7fe3ff'; ctx.font = 'bold ' + Math.round(40 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬇', x, y - top * p); }
      }
    }
    // El portal se dibuja en dos partes: 'alto' (arco, pilares, rótulo) y 'suelo' (escalera, rocas, plantas). Así la Sakura pisa los peldaños (suelo va ANTES que ella)
    // y pasa por debajo del arco (alto va DESPUÉS). La escalera no está centrada en el sprite: es la heroína quien se acomoda sobre ella (ver escaleraInfo).
    function portalDib(it, z, parte) {
      const p = pz(z), im = IMG(ART.portal), y = yz(z); if (!listo(im) || z < -3) return; parte = parte || 'todo';
      const wd = RW * 2.05 * p, ht = wd * im.naturalHeight / im.naturalWidth, x = W / 2, a = clamp((ZMAX - z) / 26, 0, 1), col = it.final ? '255,226,120' : it.poder ? '210,150,255' : '170,230,255';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gs = ctx.createRadialGradient(x, y, 0, x, y, wd * 0.6); gs.addColorStop(0, 'rgba(' + col + ',' + (0.5 * a) + ')'); gs.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.save(); ctx.translate(0, 0); ctx.scale(1, 0.28); ctx.translate(0, y / 0.28 - y); ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(x, y, wd * 0.6, 0, 7); ctx.fill(); ctx.restore();
      const pul = 0.75 + 0.25 * Math.sin(S.t * 3), gb = ctx.createLinearGradient(0, y - ht, 0, 0); gb.addColorStop(0, 'rgba(' + col + ',' + (0.4 * a * pul) + ')'); gb.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = gb; ctx.fillRect(x - wd * 0.28, 0, wd * 0.56, y - ht + 4); ctx.restore();
      ctx.globalAlpha = a;
      { const nw = im.naturalWidth, nh = im.naturalHeight, sc = wd / nw, corte = Math.round(nh * PORT.corte / PORT.h), dx = 0;
        if (parte !== 'suelo') ctx.drawImage(im, 0, 0, nw, corte, x - wd / 2, y - ht, wd, corte * sc);
        if (parte !== 'alto') ctx.drawImage(im, 0, corte, nw, nh - corte, x - wd / 2 + dx, y - ht + corte * sc, wd, (nh - corte) * sc); }
      if (parte === 'suelo') { ctx.globalAlpha = 1; return; }
      const bw = wd * 0.8, bh = 46 * p * 1.6, by = y - ht - bh * 0.55; ctx.fillStyle = 'rgba(20,10,40,.88)'; rr(x - bw / 2, by, bw, bh, 12 * p); ctx.fill(); ctx.lineWidth = 3 * p; ctx.strokeStyle = '#ffe27a'; ctx.stroke();
      ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.fillText(it.txt, x, by + bh / 2); ctx.globalAlpha = 1;
    }
    function cajaDib(it, z) {
      if (it.tomado || z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z) - (50 + (it.h || 0) + 8 * Math.sin(S.t * 4 + it.d)) * p, r = 34 * p, im = IMG(ART.pu_caja);
      brillo(x, y, r * 2.6, '190,140,255', 0.6 * a); ctx.globalAlpha = a;
      if (listo(im)) { const hh = r * 2.7, ww = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x - ww / 2, y - hh / 2, ww, hh); }
      else { ctx.fillStyle = '#7a3fd0'; ctx.strokeStyle = '#ffd35a'; ctx.lineWidth = Math.max(1.5, 3 * p); rr(x - r, y - r, r * 2, r * 2, r * 0.22); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(r * 1.2) + 'px ' + FUENTE; ctx.fillText('?', x, y + r * 0.06); }
      ctx.globalAlpha = 1;
    }
    function trampDib(it, z) {
      if (z < -3) return; const p = pz(z), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z);
      ctx.fillStyle = 'rgba(0,0,0,.33)'; ctx.beginPath(); ctx.ellipse(x, y, LW * 0.4 * p, 11 * p, 0, 0, 7); ctx.fill(); spr(IMG(ART.ob_tramp), it.lane - 1, z, 84);
      if (!it.tomado && z < 40 && z > 2) { ctx.fillStyle = '#ffe27a'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.textAlign = 'center'; ctx.fillText('⬆⬆', x, y - 118 * p); }
    }
    function vidaDib(it, z) {
      if (it.tomado || z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z) - (74 + 9 * Math.sin(S.t * 4 + it.d)) * p, im = IMG(ART.pu_vida);
      brillo(x, y, 70 * p, '255,150,200', 0.55 * a); if (!listo(im)) return; ctx.globalAlpha = a; const hh = 64 * p * (1 + 0.05 * Math.sin(S.t * 8)), ww = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x - ww / 2, y - hh / 2, ww, hh); ctx.globalAlpha = 1;
    }
    function cofreDib(it, z) {
      if (z < -3) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2 + (it.lane - 1) * LW * p, y = yz(z), abierto = it.tomado, im = IMG(abierto ? ART.pu_cofreAb : ART.pu_cofre);
      ctx.fillStyle = 'rgba(0,0,0,.33)'; ctx.beginPath(); ctx.ellipse(x, y, LW * 0.36 * p, 11 * p, 0, 0, 7); ctx.fill();
      if (!abierto) brillo(x, y - 50 * p, 90 * p, '255,215,110', (0.35 + 0.15 * Math.sin(S.t * 5)) * a);
      if (!listo(im)) return; ctx.globalAlpha = a; const hh = (abierto ? 116 : 98) * p, ww = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x - ww / 2, y - hh, ww, hh); ctx.globalAlpha = 1;
    }
    function nubeDib(it, z) {
      if (it.pasado && z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), x = W / 2, y = yz(z), wd = RW * 2.1 * p; if (z < -3) return;
      brillo(x, y - 60 * p, wd * 0.55, '180,225,255', 0.5 * a); ctx.globalAlpha = a * 0.95; ctx.fillStyle = '#ffffff';
      for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.arc(x + k * wd / 9, y - (36 + (k % 2 ? 16 : 0)) * p, (30 + (4 - Math.abs(k)) * 4) * p, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#7fd0ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(34 * p) + 'px ' + FUENTE; ctx.fillText('☁️ TABLA VOLADORA', x, y - 120 * p); ctx.globalAlpha = 1;
    }
    function monedaDib(it, z) {
      if (it.tomada || z < -2) return; const p = pz(z), a = clamp((ZMAX - z) / 26, 0, 1), ln = (S.iman > 0 && Math.abs(it.lane - S.px) <= 1.7) ? it.lane + (S.px - it.lane) * clamp(1 - z / 16, 0, 1) : it.lane, x = W / 2 + (ln - 1) * LW * p, y = yz(z) - (46 + it.h) * p;
      const tp = it.tipo, r = (tp === 'bolsa' ? 44 : tp === 'shuriken' ? 30 : tp === 'gema' ? 33 : tp === 'racha' ? 31 : tp === 'oro' ? 31 : 25) * p * (tp === 'racha' ? 1 + 0.06 * Math.sin(S.t * 7) : 1);
      const im = IMG(tp === 'shuriken' ? ART.shuriken : tp === 'gema' ? ART.gema : tp === 'bolsa' ? ART.bolsa : tp === 'racha' ? ART.coinRacha : ART.coin[Math.floor(S.t * 8 + it.d * 0.7) % 4]);
      brillo(x, y, r * (tp === 'oro' ? 2.4 : 1.9), tp === 'gema' ? '190,120,255' : tp === 'oro' ? '255,236,130' : '255,210,90', (tp === 'oro' ? 0.7 : 0.45) * a); ctx.globalAlpha = a;
      if (listo(im)) { const hh = r * 2, ww = hh * im.naturalWidth / im.naturalHeight; if (tp === 'shuriken') { ctx.save(); ctx.translate(x, y); ctx.rotate(S.t * 6 + it.d); ctx.drawImage(im, -ww / 2, -hh / 2, ww, hh); ctx.restore(); } else ctx.drawImage(im, x - ww / 2, y - hh / 2, ww, hh); } else { ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.fill(); }
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
    // Zorro compañero (de espalda): corre al lado, se sienta a esperar en la plaza, salta si aciertas y señala cuando hay pista
    function pintaZorro(hx) {
      if (S.vuelo > 0) return; const lado = S.px < 1.15 ? 1 : -1; S.zx = S.zx == null ? lado : S.zx + (lado - S.zx) * 0.07;
      let nom, im, dy = 0; const hh = 128;
      if (S.celeb != null) nom = 'zo_celebra';
      else if (S.pista && S.pista.t > 3.3) nom = 'zo_senala';
      else if (S.alegre > 0) { nom = 'zo_salto'; dy = -Math.abs(Math.sin((S.t - S.alegreT) * 9)) * 26; }
      else if (S.espera) nom = 'zo_espera';
      else { im = IMG(ART.zo_run[Math.floor(S.tAnim * 10 + 2) % 4]); dy = -Math.abs(Math.sin(S.tAnim * 10 * 0.8)) * 5; }
      if (nom) im = IMG(ART[nom]); if (!listo(im)) return;
      const x = clamp(hx + S.zx * 108, 52, W - 52), y = PY + 26 + dy * 0, ww = hh * im.naturalWidth / im.naturalHeight;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, PY + 26, ww * 0.34, 8, 0, 0, 7); ctx.fill();
      ctx.drawImage(im, x - ww / 2, y + dy - hh, ww, hh);
    }
    function pintaHeroeE(x, y, k, estado, alpha) {
      const clon = alpha != null && alpha < 1, sk = S.skate > 0 && !clon && estado !== 'hurt' && estado !== 'win'; let f, mir = false, inclina = true;
      if (estado === 'espera') { const L = fb('celebra'); f = L[6 + (Math.floor(S.t / 0.7) % 2)]; inclina = false; }
      else if (estado === 'win') {
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
      if (inclina) ctx.rotate(clamp((S.tl - S.px) * 0.16, -0.2, 0.2));
      if (S._fx && !clon) { ctx.translate(0, S._fx.oy); ctx.scale(S._fx.sx, S._fx.sy); }
      if (mir) ctx.scale(-1, 1);
      ctx.drawImage(im, -f.ax * k, -f.ay * k, f.w * k, f.h * k);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function pintaHeroe(x, y, k, estado, flip, alpha) {
      if (HB) return pintaHeroeE(x, y, k, estado, alpha);
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha == null ? 1 : alpha;
      if (S._fx && !(alpha != null && alpha < 1)) { ctx.translate(0, S._fx.oy); ctx.scale(S._fx.sx, S._fx.sy); }
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
      const hx = W / 2 + (S.px - 1) * LW + (S.escX || 0), hy = PY - S.jh - (S.escal || 0) - (S.escHop || 0), est = (S.celeb != null && HB) ? 'win' : S.hurt > 0 ? 'hurt' : S.vuelo > 0 ? 'vuelo' : (S.alegre > 0 && HB && S.jh - S.base <= 1) ? 'win' : (S.espera && HB && S.skate <= 0 && S.jh - S.base <= 1) ? 'espera' : S.jh - S.base > 1 ? 'jump' : S.slide > 0 ? 'slide' : 'run', flip = S.tl < S.px - 0.15, parpadeo = S.inv > 0 && S.dash <= 0 && S.celeb == null && Math.floor(S.t * 14) % 2 === 0;
      S._fx = null; if (S.racha >= 4) brillo(hx, hy - 100, 150, '255,200,90', 0.22 + 0.06 * Math.sin(S.t * 6));
      if (S.dash > 0) {   // la única "copia" del personaje: estela corta y con intención, solo mientras dura el dash (antes las copias de la racha parecían un error)
        brillo(hx, hy - 100, 170, '120,230,255', 0.35 + 0.08 * Math.sin(S.t * 30));
        for (let i = 3; i >= 1; i--) { const h = S.hist.find(e => e.t >= S.t - 0.075 * i) || S.hist[0]; if (h) pintaHeroe(W / 2 + (h.px - 1) * LW, PY - h.jh - (S.escal || 0), kHeroe * (S.escK || 1), est, flip, 0.34 - i * 0.07); }
      }
      if (S.vuelo > 0) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(hx, PY + 4, 46, 9, 0, 0, 7); ctx.fill(); brillo(hx, hy + 6, 110, '150,215,255', 0.5); ctx.fillStyle = 'rgba(255,255,255,.95)'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(hx + k * 24, hy + 6 + (k % 2 ? 6 : 0), 22 - Math.abs(k) * 3, 0, 7); ctx.fill(); } }
      pintaZorro(hx);
      if (S.skate > 0 && HB) { const iv = IMG(ART.fx_vel); if (listo(iv)) { [-1, 1].forEach(sg => { ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(S.t * 18 + sg); ctx.translate(hx + sg * 88, hy - 70); ctx.rotate(Math.PI / 2 * sg); const ww = 150, hh2 = ww * iv.naturalHeight / iv.naturalWidth; ctx.drawImage(iv, -ww / 2, -hh2 / 2, ww, hh2); ctx.restore(); }); } }
      { // sombra en el suelo (se encoge y aclara con la altura) + estela al cambiar de carril
        const alt = clamp(S.jh / 260, 0, 1); if (S.vuelo <= 0) { ctx.fillStyle = 'rgba(0,0,0,' + (0.38 * (1 - 0.65 * alt)) + ')'; ctx.beginPath(); ctx.ellipse(hx, PY + 4 - (S.escal || 0), 49 * (1 - 0.35 * alt), 11 * (1 - 0.35 * alt), 0, 0, 7); ctx.fill(); }
        if (!S.lite && Math.abs(S.tl - S.px) > 0.2 && S.celeb == null) for (let g = 2; g >= 1; g--) { const h = S.hist.find(e => e.t >= S.t - 0.05 * g) || S.hist[0]; if (h) pintaHeroe(W / 2 + (h.px - 1) * LW, hy, kHeroe, est, flip, 0.16 * (3 - g)); }
        let sx = 1, sy = 1, oy = 0;
        if (S.jh - S.base > 1 || S.vuelo > 0) { const st = S.vuelo > 0 ? 0 : clamp(Math.abs(S.jv) / 1200, 0, 1); sy = 1 + 0.16 * st; sx = 1 - 0.1 * st; if (S.sj != null && S.t - S.sj < 0.18) { const k = (S.t - S.sj) / 0.18; sy += 0.12 * (1 - k); sx -= 0.08 * (1 - k); } }
        else if (S.slide <= 0) { const n = Math.max(2, fb('run').length || 8), b = Math.abs(Math.sin(S.tAnim * 10 / (n / 2) * Math.PI)); oy = -3 * b; sy = 1 + 0.018 * b; sx = 1 - 0.01 * b; }
        if (S.sq && S.t - S.sq.t0 < 0.3) { const k = (S.t - S.sq.t0) / 0.3, sp = Math.exp(-4.2 * k) * Math.cos(12 * k) * S.sq.f; sy *= 1 - 0.28 * sp; sx *= 1 + 0.22 * sp; }
        if (S.hop && S.t - S.hop.t0 < 0.2 && S.jh - S.base <= 1) { const q = Math.sin(Math.PI * (S.t - S.hop.t0) / 0.2); sy *= 1 + 0.1 * q; sx *= 1 - 0.06 * q; }
        S._fx = { sx, sy, oy };
      }
      if (!parpadeo) pintaHeroe(hx, hy, kHeroe * (S.escK || 1), est, flip, 1);
      S._fx = null;
      if (S.hurt > 0) { const ie = IMG(ART.fx_estr); if (listo(ie)) { const ww = 112, hh2 = ww * ie.naturalHeight / ie.naturalWidth; ctx.save(); ctx.globalAlpha = clamp(S.hurt / 0.4, 0, 1); ctx.translate(hx, hy - 212); ctx.rotate(S.t * 5); ctx.drawImage(ie, -ww / 2, -hh2 / 2, ww, hh2); ctx.restore(); } }
      if (S.escudo > 0) { const ib = IMG(ART.fx_burb), al = (S.escudo < 3 && Math.floor(S.t * 8) % 2) ? 0.25 : 0.5; ctx.save(); ctx.globalAlpha = al;
        if (listo(ib)) { const ww = 226 + 6 * Math.sin(S.t * 6); ctx.drawImage(ib, hx - ww / 2, hy - 104 - ww / 2, ww, ww); }
        else { ctx.fillStyle = 'rgba(120,200,255,.16)'; ctx.strokeStyle = 'rgba(160,225,255,.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, hy - 100, 100 + 4 * Math.sin(S.t * 6), 0, 7); ctx.fill(); ctx.stroke(); } ctx.restore(); }
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
      if (S.viento) { ctx.save(); ctx.strokeStyle = 'rgba(230,245,255,.28)'; ctx.lineWidth = 2.5; for (let i = 0; i < 14; i++) { const yy = HOR + 30 + ((i * 137 + S.t * 160) % (H - HOR - 40)), xx = ((((S.t * 900 * S.viento.dir) + i * 211) % (W + 200)) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - S.viento.dir * 70, yy + 6); ctx.stroke(); } ctx.restore(); }
      for (const e of S.fx) { const im = IMG(ART[e.k]); if (!listo(im)) continue; const k = e.t / e.dur, sz = e.s0 + (e.s1 - e.s0) * k, hh = sz * im.naturalHeight / im.naturalWidth; ctx.save(); ctx.globalAlpha = clamp(1 - k * k, 0, 1); ctx.translate(e.x, e.y - (e.sube ? k * 80 : 0)); if (e.k === 'fx_remo') ctx.rotate(k * 5); ctx.drawImage(im, -sz / 2, -hh / 2, sz, hh); ctx.restore(); } ctx.globalAlpha = 1;
      for (const o of (S.ondas || [])) { const k = o.t / 0.45, r = 30 + 120 * k * (0.6 + o.f); ctx.globalAlpha = (1 - k) * 0.45 * o.f + 0.05 * (1 - k); ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(o.x, o.y, r, r * 0.25, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1;
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
      const mo = IMG(ART.coin[Math.floor(S.t * 6) % 4]); if (listo(mo)) { const hh = 30, ww = hh * mo.naturalWidth / mo.naturalHeight; ctx.drawImage(mo, 123 - ww / 2, 56, ww, hh); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 26px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)'; { const mt = S.monedas + (S.racha >= 3 ? '  ×2' : ''); ctx.strokeText(mt, 144, 72); ctx.fillStyle = S.racha >= 3 ? '#fff3a0' : '#ffe27a'; ctx.fillText(mt, 144, 72); }
      // insignia con el número de la tabla
      const ins = IMG(ART.insignia); if (listo(ins)) ctx.drawImage(ins, 300, 6, 90, 90);
      ctx.textAlign = 'center'; ctx.font = 'bold 42px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.strokeText(e.T, 343, 48); ctx.fillStyle = '#fff'; ctx.fillText(e.T, 343, 48);
      ctx.fillStyle = tema.borde; ctx.font = 'bold 18px ' + FUENTE; ctx.lineWidth = 4; ctx.strokeText('🌍 ' + tema.nombre.toUpperCase(), W / 2, 112); ctx.fillText('🌍 ' + tema.nombre.toUpperCase(), W / 2, 112);
      // placa de la pregunta
      const ba = IMG(ART.barra); if (listo(ba)) ctx.drawImage(ba, 20, 124, 500, 89); else { ctx.fillStyle = 'rgba(15,8,40,.85)'; rr(24, 130, W - 48, 78, 18); ctx.fill(); }
      const fp = S.filaPod, txt = mostrarQ ? row.q : fp ? '⚡ ' + fp.q : (S.jefeVis && !S.fin) ? '¡Esquiva al jefe!' : '¡Corre y junta monedas!';
      ctx.font = 'bold ' + (txt.length > 22 ? 28 : txt.length > 14 ? 34 : 46) + 'px ' + FUENTE; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(8,20,60,.95)'; ctx.strokeText(txt, W / 2, 169); ctx.fillStyle = '#fff'; ctx.fillText(txt, W / 2, 169);
      if (S.jefeVis) jefeBarra(); else { const n = S.qpas % CFG.PREG_TABLA, X = i => W / 2 + (i - (CFG.PREG_TABLA - 1) / 2) * 40;
        for (let i = 0; i < CFG.PREG_TABLA; i++) { const on = i < n; if (on) brillo(X(i), 240, 17, '255,210,90', 0.55); ctx.fillStyle = on ? '#ffe27a' : 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(X(i), 240, on ? 10 : 8, 0, 7); ctx.fill(); if (on) { ctx.strokeStyle = '#a8631b'; ctx.lineWidth = 2; ctx.stroke(); } } }
      if (S.pista && S.pista.t > 0) { ctx.globalAlpha = clamp(S.pista.t, 0, 1); ctx.font = 'bold 26px ' + FUENTE; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(10,5,30,.95)'; ctx.textAlign = 'center'; ctx.strokeText('Pista: ' + S.pista.txt, W / 2, 280); ctx.fillStyle = '#bff5d0'; ctx.fillText('Pista: ' + S.pista.txt, W / 2, 280); ctx.globalAlpha = 1; }
      if (S.espera) { ctx.globalAlpha = 0.65 + 0.35 * Math.sin(S.t * 4); ctx.textAlign = 'center'; ctx.font = 'bold 28px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.95)'; const t4 = tactil() ? 'Elige tu carril y toca para seguir' : 'Elige con ← → y pulsa Espacio'; ctx.strokeText(t4, W / 2, 470); ctx.fillStyle = '#ffffff'; ctx.fillText(t4, W / 2, 470); ctx.globalAlpha = 1; }
      // abajo: sombras y racha
      const ci = IMG(ART.clon); ctx.globalAlpha = S.dash > 0 ? 1 : 0.4; if (listo(ci)) ctx.drawImage(ci, 12, H - 66, 48, 48); ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = 'bold 22px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)'; const t3 = 'Racha ' + S.racha + (S.racha >= 3 ? '  ✨ ×2 🪙' : ''); ctx.strokeText(t3, 68, H - 42); ctx.fillStyle = '#fff'; ctx.fillText(t3, 68, H - 42);
      if (S.skate > 0) { const w = 150 * clamp(S.skate / 8, 0, 1); ctx.fillStyle = 'rgba(10,5,30,.72)'; rr(W - 196, H - 62, 176, 36, 18); ctx.fill(); ctx.fillStyle = (S.skate < 2 && Math.floor(S.t * 8) % 2) ? '#ff6a6a' : '#ff9ad5'; rr(W - 180, H - 53, Math.max(6, w), 18, 9); ctx.fill(); ctx.textAlign = 'left'; ctx.font = '26px serif'; ctx.fillStyle = '#fff'; ctx.fillText('🛹', W - 224, H - 42); }
      if (S.tiempo > 0) { ctx.fillStyle = 'rgba(90,160,255,' + (0.1 + 0.04 * Math.sin(S.t * 5)) * clamp(S.tiempo, 0, 1) + ')'; ctx.fillRect(0, 0, W, H); }
      { let yy = H - 112; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 24px ' + FUENTE; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,5,30,.9)';
        [[null, S.dash, '#7fe9ff'], [ART.pu_iman, S.iman, '#e0c8ff'], [ART.pu_escudo, S.escudo, '#9ad7ff'], [ART.pu_reloj, S.tiempo || 0, '#9ad7ff']].forEach(c => { if (c[1] > 0) { const ic = c[0] ? IMG(c[0]) : null; if (!c[0]) { ctx.font = '30px serif'; ctx.fillText('⚡', 14, yy); ctx.font = 'bold 24px ' + FUENTE; } else if (listo(ic)) { const hh = 36, ww = hh * ic.naturalWidth / ic.naturalHeight; ctx.drawImage(ic, 12, yy - 20, ww, hh); } const tx = Math.ceil(c[1]) + ' s'; ctx.strokeText(tx, 54, yy); ctx.fillStyle = c[2]; ctx.fillText(tx, 54, yy); yy -= 42; } }); }
      // ayudas para aprender los controles (solo las primeras veces)
      if (!S.pausa && !S.fin && S.cae <= 0 && !S.plaza && S.vuelo <= 0) {
        const tu = S.tuto || {}; let ayuda = S.t < 6 ? (tactil() ? '←  Desliza para elegir carril  →' : '←  Usa las flechas para elegir carril  →') : null;
        const ob = S.items.find(i => esPeligro(i) && !i.roto && i.d - S.dist > 3 && i.d - S.dist < 17 && (tu[clave(i)] || 0) < 2);
        if (ob && S.skate <= 0 && S.dash <= 0) ayuda = AYUDA[clave(ob)][tactil() ? 0 : 1];
        if (ayuda) { ctx.globalAlpha = 0.75 + 0.25 * Math.sin(S.t * 6); ctx.textAlign = 'center'; ctx.font = 'bold 23px ' + FUENTE; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,5,30,.92)'; ctx.strokeText(ayuda, W / 2, 872); ctx.fillStyle = '#fff6c2'; ctx.fillText(ayuda, W / 2, 872); ctx.globalAlpha = 1; }
      }
      comboHud();
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
      ctx.translate(W / 2, PY); ctx.rotate(tilt); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -PY + bob + (S.bump || 0) * 12);
      if (S.shake > 0) ctx.translate(R(-6, 6) * S.shake * 3, R(-6, 6) * S.shake * 3);
      fondoDib(ta, tb, f); nubesDib(); auroraDib(); rayoDib(); camino(Tm); charcos(); niebla(Tm);
      const cola = [];
      S.deco.forEach(d => { const z = d.d - S.dist; cola.push({ z, f: () => { spr(IMG(d.img), d.off, z, d.h); if (d.img.indexOf('/lights/') >= 0 && !S.lite) { const p = pz(z); brillo(W / 2 + d.off * LW * p, yz(z) - d.h * p * 0.72, 70 * p + 4, '255,190,100', (0.55 + 0.15 * Math.sin(S.t * 9 + d.d)) * clamp((ZMAX - z) / 30, 0, 1)); } } }); });
      for (let k = Math.floor((S.dist - 3) / 8); k * 8 - S.dist < ZMAX; k++) { const d = k * 8, z = d - S.dist; if (z >= -3) cola.push({ z, f: () => postes(d) }); }
      S.items.forEach(it => { const z = it.d - S.dist; if (it.k === 'plat' || it.k === 'oro') { const zB = it.hasta - S.dist; if (zB > -3 && z < ZMAX) cola.push({ z: it.k === 'plat' ? Math.max(zB, 0.2) : zB, f: () => it.k === 'plat' ? platDib(it) : oroDib(it) }); return; } if (it.k === 'zona' || it.k === 'jefe') return; if (z > -4 && z < ZMAX) cola.push({ z, f: () => it.k === 'orb' ? orbe(it, z) : it.k === 'coin' ? monedaDib(it, z) : it.k === 'caja' ? cajaDib(it, z) : it.k === 'tramp' ? trampDib(it, z) : it.k === 'vida' ? vidaDib(it, z) : it.k === 'cofre' ? cofreDib(it, z) : it.k === 'nube' ? nubeDib(it, z) : it.k === 'obs' ? obstaculo(it, z) : it.k === 'shu' ? shuDib(it, z) : it.k === 'viga' ? vigaDib(it, z) : it.k === 'pat' ? patDib(it, z) : (z < 0 ? portalDib(it, z, 'alto') : portalDib(it, z)) }); if (it.k === 'portal' && z < 0 && z > -4) cola.push({ z: 0.0001, f: () => portalDib(it, z, 'suelo') }); });
      if (S.jefeVis && !S.fin) cola.push({ z: 40, f: jefeDib });
      cola.sort((a, b) => b.z - a.z); let heroeHecho = false;
      cola.forEach(c => { if (!heroeHecho && c.z < 0 && S.celeb == null) { dibujaHeroes(); heroeHecho = true; } c.f(); }); if (!heroeHecho) dibujaHeroes();
      dibAmb(); dibEfectos(); rayosLuz(Tm); lluviaDib(); oscuroDib();
      ctx.restore(); gradoDib(ta, tb, f); vinetaDib(); hud();
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
      S = nuevo(); S.cazaBase = 0; PREGS = construir(m3, m2);
      pantalla(retrato('normal') + '<h1>CARRERA DE LOS FAROLILLOS</h1>' + BARRA + '<p>Corre por <b>6 mundos</b>, junta <b>monedas</b> 🪙 y, en cada <b>plaza</b>, elige con calma la respuesta de las tablas del <b>7, 8 y 9</b>.</p>' +
        '<div class="reglas"><span>🪙 Junta monedas saltando y deslizando</span><span>🤔 En la plaza no hay prisa</span><span>💛 Si fallas, te damos una pista</span><span>🛹 Cada 3 aciertos seguidos: ¡premio!</span><span>☁️ Salta a las nubes</span><span>⚡ Portales de poder</span><span>🔥 Combos de monedas</span><span>👹 Jefe final</span></div>' +
        '<p class="ctl">' + (tactil() ? 'Desliza ← → para cambiar de carril, ↑ para saltar (vallas, barriles y nubes), ↓ para deslizarte (arcos y barras). En la plaza, toca para seguir.' : 'Flechas ← → cambian de carril · ↑ salta vallas, barriles y nubes · ↓ te desliza bajo los arcos (o te baja de la nube) · Espacio sigue en la plaza · P pausa · M sonido · V voz.') + '</p>' +
        '<button id="go" type="button">▶ JUGAR</button>');
      document.getElementById('go').onclick = () => { intentarPantallaCompleta(); try { ac() && ac().resume && ac().resume(); } catch (e) {} pantalla(''); S.corriendo = true; ponBanner(0, PREGS[0].T, 3); vigilarGiro(); };
    }
    function pausar(forzar) {
      if (!S || !S.corriendo || S.fin) return; if (S.pausa && !forzar) { S.pausa = false; pantalla(''); return; } if (S.pausa) return; S.pausa = true;
      pantalla('<h1>PAUSA</h1>' + BARRA + '<button id="seg" type="button">▶ SEGUIR</button><button id="sal" type="button" class="sec">⟵ SALIR</button>', 'pausa');
      document.getElementById('seg').onclick = () => { if (!vigilarGiro()) { S.pausa = false; pantalla(''); } };
      document.getElementById('sal').onclick = () => salir();
    }
    function salir() { if (S && !S.fin && S.corriendo) guardar(false); vivo = false; cancelAnimationFrame(raf); if (o.onSalir) o.onSalir(); }
    function terminar() {
      if (S.fin) return; S.fin = true; S.tl = 1; S.jh = 0; S.jv = 0; S.base = 0; S.sobre = null; S.dash = 0; S.slide = 0; S.skate = 0; sfx.gana();
      const conCel = !!(HB && fb('celebra').length);
      if (conCel) { S.celeb = S.t; const cx = W / 2 + (S.px - 1) * LW; chispas(cx, PY - 200, '#ffe27a', 40); anillo(cx, PY - 160, '#fff3b0', 1.8); setTimeout(() => { if (vivo) mostrarFin(); }, 2700); } else mostrarFin();
    }
    // guarda en el perfil: monedas, estadísticas y el «mapa de dificultad» (cada error suma 2, cada acierto resta 1; llega a 0 y se olvida)
    function guardar(completo, est) {
      if (!S || S.guardado || !o.perfil || !window.Perfiles) return; S.guardado = true;
      try { Perfiles.actualizar(o.perfil.id, p => {
        p.nivel3 = p.nivel3 || {}; p.nivel3.monedas = (p.nivel3.monedas || 0) + S.monedas;
        if (completo) { p.nivel3.completado = true; p.nivel3.mejor = Math.max(p.nivel3.mejor || 0, S.puntos); p.nivel3.estrellas = Math.max(p.nivel3.estrellas || 0, est || 1); p.nivel3.intentos = (p.nivel3.intentos || 0) + 1; }
        const f = p.nivel3.fallos || {}; Object.keys(S.hechos || {}).forEach(k => { const h = S.hechos[k], v = Math.max(0, (f[k] || 0) + h.e * 2 - h.a); if (v > 0) f[k] = v; else delete f[k]; });
        p.nivel3.fallos = f; m3 = Object.assign({}, f);
        p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aciertos; p.estadisticas.errores += S.errores;
      }); if (Perfiles.registrarHechos) Perfiles.registrarHechos(o.perfil.id, S.hechos); } catch (e) {}
    }
    function mostrarFin() {
      const tot = S.aciertos + S.errores, prec = tot ? S.aciertos / tot : 1, est = prec >= 0.9 && S.golpes <= 2 ? 3 : prec >= 0.75 ? 2 : 1;
      const dificiles = Object.keys(S.fallos).sort((a, b) => S.fallos[b] - S.fallos[a]).slice(0, 4).map(k => k.replace('x', ' × '));
      guardar(true, est);
      pantalla(retrato('radiante') + '<h1>¡NIVEL COMPLETADO!</h1>' + BARRA + '<div class="estrellas">' + '⭐'.repeat(est) + '<span style="opacity:.25">' + '⭐'.repeat(3 - est) + '</span></div>' +
        '<p>Monedas: <b>' + S.monedas + ' 🪙</b> · Puntos: <b>' + S.puntos + '</b> · Aciertos: <b>' + S.aciertos + '</b> · Mejor racha: <b>' + S.mejorRacha + '</b> · Mejor combo: <b>×' + S.multMax + '</b></p>' + (S.jefeVis ? '<p>' + (S.jefeHp === 0 ? '🏆 ¡Venciste al Rey del Caos!' : '👹 El Rey del Caos huyó herido… ¡inténtalo otra vez!') + '</p>' : '') + (dificiles.length ? '<p>Para repasar: <b>' + dificiles.join(' · ') + '</b></p>' : '<p>¡Sin tablas difíciles! 🏆</p>') +
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
    window.addEventListener('pagehide', () => { if (S && !S.fin && S.corriendo) guardar(false); });

    inicio(); vigilarGiro(); raf = requestAnimationFrame(bucle);
    return { paso, accion, estado: () => S, dibuja, CFG, ET: PREGS, preguntas: () => PREGS, guardar };
  }

  window.Nivel3 = { iniciar };
})();
