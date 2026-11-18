/* Nivel 2 · Surf de Dunas (motor propio, independiente del Nivel 1)
   Desliza por dunas con 3 carriles, salta obstáculos y cruza la compuerta con la respuesta correcta.
   Tablas 4, 5 y 6 con modo adaptativo. Final: Escorpión Colosal. */
(function () {
  'use strict';
  const W = 960, H = 540, GR = 1500, CARR = 42, X_H = 230;
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hY = x => 372 + Math.sin(x / 420) * 46 + Math.sin(x / 190 + 1.3) * 15;
  const laneY = (x, l) => hY(x) + (l - 1) * CARR;
  const mez = a => { for (let i = a.length - 1; i > 0; i--) { const j = RI(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function pregunta(fallos) {
    const pool = [];
    [4, 5, 6].forEach(t => { for (let n = 2; n <= 10; n++) { const w = 1 + 3 * (fallos[t + 'x' + n] || 0); for (let i = 0; i < w; i++) pool.push([t, n]); } });
    const [t, n] = pool[RI(0, pool.length - 1)], r = t * n, tipo = RI(0, 2);
    let txt, ans = r, cand;
    if (tipo === 0) txt = t + ' × ' + n + ' = ?';
    else if (tipo === 1) { txt = t + ' × ? = ' + r; ans = n; }
    else txt = n + ' veces ' + t + ' = ?';
    cand = tipo === 1 ? [n - 1, n + 1, n + 2, n - 2] : [r - t, r + t, r + 1, r - 1, r + 2 * t];
    const ops = mez([...new Set(cand.filter(x => x > 0 && x !== ans))]).slice(0, 2);
    ops.push(ans); mez(ops);
    return { txt, ans, ops, key: t + 'x' + n };
  }

  function iniciar(o) {
    o = o || {};
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;z-index:50;background:#060818;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;font-family:ui-monospace,monospace';
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = 'width:min(100vw,177.7vh);height:auto;max-height:100vh;background:#0a0c26';
    root.appendChild(cv); document.body.appendChild(root);
    const cx = cv.getContext('2d');
    const kage = o.heroe === 'kage', colH = kage ? '#4aa3ff' : '#ff6fa8';
    const fallosPrev = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.fallos) || {};
    const estrellas = Array.from({ length: 70 }, () => ({ x: R(0, W), y: R(0, 230), r: R(.4, 1.6), f: R(0, 6) }));
    let S, raf = 0, ult = 0, ac = null;
    // preferencias guardadas (vehículo y tabla se eligen en nivel2.html) y jefe por turnos
    let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('n2cfg') || '{}') || {}; } catch (e) {}
    const VEHS = ['tabla', 'alfombra', 'vagoneta'], TABLAS = ['tabla_clasica', 'tabla_cactus', 'tabla_cristal', 'tabla_dragon', 'tabla_faraon', 'tabla_neon'];
    const vehiculo = VEHS.includes(o.vehiculo || cfg.vehiculo) ? (o.vehiculo || cfg.vehiculo) : 'tabla';
    const tablaId = TABLAS.includes(o.tabla || cfg.tabla) ? (o.tabla || cfg.tabla) : 'tabla_clasica';
    const JEFES = [{ id: 'escorpion', n: 'ESCORPIÓN COLOSAL', art: 'AL', corto: 'Escorpión', aguijon: '¡Aguijón!' }, { id: 'gusano', n: 'GUSANO DE LAS DUNAS', art: 'AL', corto: 'Gusano', aguijon: '¡Mordisco!' },
      { id: 'esfinge', n: 'ESFINGE GUARDIANA', art: 'A LA', corto: 'Esfinge', aguijon: '¡Rayo de la esfinge!' }, { id: 'faraon', n: 'FARAÓN MOMIA', art: 'AL', corto: 'Faraón', aguijon: '¡Maldición del faraón!' }];
    const completados0 = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.completados) || 0;
    let ganadasSesion = 0;
    const jefeActual = () => JEFES.find(j => j.id === o.jefe) || JEFES[(completados0 + ganadasSesion) % JEFES.length];

    const beep = (f, d, tipo) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const os = ac.createOscillator(), g = ac.createGain(); os.type = tipo || 'square'; os.frequency.value = f; g.gain.value = .05; os.connect(g); g.connect(ac.destination); os.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); os.stop(ac.currentTime + d); } catch (e) {} };

    // arte del Nivel 2 (assets/nivel2/manifest.js): si falta o no ha cargado, se dibuja la versión simple
    const ARTE = window.NIVEL2_ARTE || {}, CACHE = {};
    function img(id, i) { const a = ARTE[id]; if (!a) return null; i = Math.abs(Math.floor(i || 0)) % a.frames.length; const k = id + i; if (!CACHE[k]) { CACHE[k] = new Image(); CACHE[k].src = 'assets/nivel2/' + a.frames[i].f; } const m = CACHE[k]; return m.complete && m.naturalWidth ? m : null; }
    // dibuja el sprite con la base centrada en (x,y) a la altura 'alto'; voltear = espejo horizontal
    function spr(id, i, x, y, alto, voltear, alfa) { const m = img(id, i); if (!m) return false; const w = m.naturalWidth * alto / m.naturalHeight; cx.save(); cx.translate(x, y); if (voltear) cx.scale(-1, 1); if (alfa != null) cx.globalAlpha = alfa; cx.drawImage(m, -w / 2, -alto, w, alto); cx.restore(); return true; }
    function obsSprite(ob, x, y) {
      if (ob.tipo === 'cac') return spr(ob.v ? 'cactus_barril' : 'cactus_saguaro', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'roca') return spr(ob.v === 2 ? 'piedra_agrietada' : ob.v ? 'rocas_pequenas' : 'roca_grande', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'rueda') return spr('rueda_carreta', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'pin') return spr('pinchos', 0, x, y + 6, ob.alto);
      if (ob.tipo === 'sie') return spr('sierra', 0, x, y + 6 + Math.sin(S.t * 8 + ob.x) * 2, ob.alto);
      if (ob.tipo === 'can') return spr('canon', 0, x, y + 6, ob.alto, true);
      if (ob.tipo === 'oni') return spr(ob.x - S.d < 260 ? 'oni_garrote_ataque' : 'oni_garrote_guardia', 0, x, y + 6, ob.alto, true);
      if (ob.tipo === 'esc') return spr('escorpion_walk', S.t * 10 + ob.x, x, y + 4, ob.alto, true);
      if (ob.tipo === 'ser') return ob.cd > 0 && ob.cd < .3 ? spr('serpiente_alerta', 0, x, y + 4, ob.alto * 1.6, true) : spr('serpiente_slither', S.t * 9 + ob.x, x, y + 4, ob.alto, true);
      return false;
    }
    // números de las compuertas: se dibujan al final para que el arco de adelante no tape al de atrás
    function etiquetasCompuertas(cam) {
      S.gates.forEach(g => { const x = g.x - cam; if (x < -60 || x > W + 60) return;
        for (let l = 0; l < 3; l++) {
          const y = laneY(g.x, l) - 62, mia = g.res && g.lane === l, col = !g.res ? '#ffd35a' : (mia ? (g.ok ? '#53e08a' : '#ff5a5a') : '#6b5a7a');
          cx.fillStyle = 'rgba(20,10,40,.82)'; cx.strokeStyle = col; cx.lineWidth = 3; cx.beginPath(); cx.roundRect ? cx.roundRect(x - 30, y - 16, 60, 32, 16) : cx.rect(x - 30, y - 16, 60, 32); cx.fill(); cx.stroke();
          cx.fillStyle = g.res && !mia ? '#9d97c9' : '#fff'; cx.font = 'bold 22px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(g.q.ops[l], x, y + 8);
          if (g.tach === l && !g.res) { cx.strokeStyle = '#ff5a5a'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x - 24, y - 12); cx.lineTo(x + 24, y + 12); cx.moveTo(x + 24, y - 12); cx.lineTo(x - 24, y + 12); cx.stroke(); }
        } });
    }
    // islas flotantes, puentes lejanos, enredadera y dragón de origami en el cielo (parallax lento)
    function cieloExtra(cam) {
      const per = 1700, px = ix => ((ix - cam * .05) % per + per) % per - 160;
      [['isla_desierto', 90, 150, 62], ['isla_cristal', 470, 98, 68], ['isla_hielo', 800, 168, 58], ['isla_hierba', 1180, 120, 64], ['isla_lava', 1470, 160, 60]].forEach(([id, ix, iy, al]) => spr(id, 0, px(ix), iy + al + Math.sin(S.t * .8 + ix) * 6, al, false, .92));
      spr('enredadera', 0, px(1180), 184 + Math.sin(S.t * .8 + 1180) * 6 + 30, 34, false, .85);
      spr('puente_colgante', 0, px(280), 205, 30, false, .7); spr('puente_piedra', 0, px(1020), 215, 34, false, .7);
      if (S.dragon) spr('dragon_origami', 0, S.dragon.x, S.dragon.y + 70 + Math.sin(S.t * 2) * 8, 70, true);
    }
    function zorroDib() {
      const lh = clamp(Math.round(S.ly), 0, 2);
      const peligro = S.obs.some(ob => !ob.hit && ob.l === lh && ob.x - S.d > 0 && ob.x - S.d < 300) || S.balas.some(b => !b.hit && b.l === lh && b.x - S.d > 0 && b.x - S.d < 380) || (S.jefe && S.jefe.atq) || (S.buitre && (S.buitre.est === 'aviso' || S.buitre.est === 'picada'));
      const id = S.est === 'gano' || S.celebra > 0 ? 'zorro_celebra' : S.est !== 'play' || S.pausa ? 'zorro_idle' : peligro ? 'zorro_alerta' : 'zorro_run';
      spr(id, S.t * 11, X_H - 110, laneY(S.d - 110, S.zly) - S.zz + 3, 58);
    }
    function dibujarVehiculo() {
      const q = kage ? 'kage' : 'sakura';
      if (vehiculo === 'alfombra') return spr('alfombra_' + q + (S.z > 8 && S.vz > 120 ? '_sube' : S.z > 8 && S.vz < -120 ? '_baja' : '_planeo'), S.t * 6, 0, 16, 112);
      if (vehiculo === 'vagoneta') return spr('vagoneta_' + q + (S.z > 8 ? '_salto' : '_rueda'), S.t * (S.v / 40), 0, 12, 108);
      return false;
    }
    function dibujarBuitre() {
      const b = S.buitre; if (!b) return;
      const id = b.est === 'picada' ? 'buitre_picada' : b.est === 'huida' ? 'buitre_huida' : 'buitre_vuelo';
      spr(id, S.t * 9, b.bx, b.by + 40, 84, b.est !== 'huida');
    }

    function nuevo() {
      S = { est: 'play', t: 0, d: 0, v: 300, lane: 1, ly: 1, z: 0, vz: 0, vidas: 3, punt: 0, racha: 0, aci: 0, err: 0, inv: 0, boost: 0, flash: 0, shake: 0,
        obs: [], gates: [], gotas: [], gen: 900, fallos: Object.assign({}, fallosPrev), fase: 'ruta', respondidas: 0, buitre: null, proxB: 22, jefe: null, msg: { t: 3, s: 'SURF DE DUNAS · ¡cruza la compuerta correcta!' }, part: [], inputs: {},
        pows: [], cofres: [], pads: [], flags: [], decor: [], balas: [], nGen: 0, escudo: 0, lento: 0, iman: 0, comodin: 0, celebra: 0, zly: 1, zz: 0, dragon: null, proxD: 24, jefeInfo: jefeActual() };
    }

    function generar() {
      while (S.gen < S.d + 3000) {
        const g0 = S.gen, jefe = S.fase === 'jefe', n = jefe ? RI(1, 2) : RI(3, 5);
        for (let i = 0; i < n; i++) {
          const x = g0 + 250 + i * RI(260, 380), tipo = ['cac', 'esc', 'roca', 'ser', 'rueda', 'pin', 'sie', 'can', 'oni'][RI(0, S.respondidas < 2 ? 2 : S.respondidas < 3 ? 4 : S.respondidas < 5 ? 6 : 8)], v = tipo === 'roca' ? RI(0, 2) : RI(0, 1);
          S.obs.push({ x, l: RI(0, 2), tipo, v, h: ({ cac: v ? 44 : 68, roca: v === 2 ? 56 : v ? 30 : 52, rueda: 46, ser: 26, esc: 30, pin: 24, sie: 46, can: 44, oni: 64 })[tipo], alto: ({ cac: v ? 68 : 112, roca: v === 2 ? 92 : v ? 46 : 80, rueda: 74, ser: 34, esc: 58, pin: 46, sie: 72, can: 76, oni: 124 })[tipo] });
          if (Math.random() < .7) for (let k = 0; k < 3; k++) S.gotas.push({ x: x - 120 + k * 36, l: RI(0, 2), y: 60 + Math.sin(k) * 20, ok: false });
        }
        const q = pregunta(S.fallos); S.gates.push({ x: g0 + 2000, q, res: false, lane: -1, ok: false });
        if (++S.nGen === 4) S.flags.push({ tipo: 'cp', x: g0 + 2350, ok: false });
        if (!jefe) generarExtras(g0);
        S.gen += 2500;
      }
    }

    // poderes, curación, cofres, plataformas de impulso y decorado de cada tramo (arte de assets/nivel2)
    function generarExtras(g0) {
      const PODERES = ['poder_escarabajo', 'poder_reloj', 'poder_iman', 'poder_comodin'];
      if (Math.random() < .6) S.pows.push({ x: g0 + RI(500, 1700), l: RI(0, 2), tipo: PODERES[RI(0, 3)] });
      if (S.vidas < 3 && Math.random() < .55) S.pows.push({ x: g0 + RI(500, 1700), l: RI(0, 2), tipo: 'onigiri' });
      if (Math.random() < .35) S.pows.push({ x: g0 + RI(500, 1700), l: RI(0, 2), tipo: 'pergamino' });
      if (Math.random() < .3) S.cofres.push({ x: g0 + RI(500, 1700), l: RI(0, 2), oscuro: S.racha >= 4, est: 0, t: 0 });
      if (Math.random() < .5) { const tra = Math.random() < .55, x = g0 + RI(450, 1500), l = RI(0, 2); S.pads.push({ x, l, tipo: tra ? 'trampolin' : 'cinta_transportadora', ok: false, t: 0 });
        if (tra) [[80, 150], [160, 240], [240, 270], [320, 240], [400, 150]].forEach(([dx, y]) => S.gotas.push({ x: x + dx, l, y, ok: false })); }
      for (let i = 0; i < 3; i++) S.decor.push({ x: g0 + RI(0, 2400), id: ['cristales_azules', 'vagoneta_oro', 'tambor_taiko', 'piedra_agrietada'][RI(0, 3)], alto: RI(54, 86) });
    }
    function recoger(p) {
      p.ok = true; beep(900, .08, 'sine');
      if (p.tipo === 'poder_escarabajo') { S.escudo = 1; S.msg = { t: 1.8, s: '¡ESCARABAJO! Te protege de 1 golpe' }; }
      else if (p.tipo === 'poder_reloj') { S.lento = 6; S.msg = { t: 1.8, s: '¡RELOJ! El tiempo va más lento' }; }
      else if (p.tipo === 'poder_iman') { S.iman = 8; S.msg = { t: 1.8, s: '¡IMÁN! Atrae las gotas' }; }
      else if (p.tipo === 'poder_comodin') { S.comodin = 1; S.msg = { t: 1.8, s: '¡COMODÍN! Tacha una respuesta mala' }; }
      else if (p.tipo === 'onigiri') { if (S.vidas < 3) { S.vidas++; S.msg = { t: 1.6, s: '¡ONIGIRI! +1 vida' }; } else { S.punt += 80; S.msg = { t: 1.4, s: '¡ONIGIRI! +80' }; } }
      else { S.punt += 150; S.msg = { t: 1.4, s: '¡PERGAMINO! +150' }; }
    }

    function responder(g) {
      const l = clamp(Math.round(S.ly), 0, 2), ok = g.q.ops[l] === g.q.ans;
      g.res = true; g.lane = l; g.ok = ok; S.respondidas++;
      if (ok) {
        S.aci++; S.racha++; S.punt += 100 + Math.min(S.racha, 6) * 25; S.boost = 1.4; S.flash = .25; beep(660, .12); setTimeout(() => beep(880, .15), 90);
        S.msg = { t: 1.3, s: S.racha >= 3 ? '¡RACHA ×' + S.racha + '!' : '¡CORRECTO! ' + g.q.txt.replace('?', g.q.ans) };
        S.celebra = 1.3; if (g.tach !== undefined) S.comodin = 0;
        if (S.jefe) { S.jefe.hp--; S.jefe.golpe = .7; S.jefe.gap = Math.min(S.jefe.gap + 55, 340); S.shake = .5; if (S.jefe.hp <= 0) return terminar(true); }
      } else {
        if (g.tach !== undefined) S.comodin = 0;
        S.err++; S.racha = 0; S.fallos[g.q.key] = (S.fallos[g.q.key] || 0) + 1; daño('¡Era ' + g.q.key.replace('x', ' × ') + ' = ' + g.q.key.split('x').reduce((a, b) => a * b) + '!');
        if (S.jefe) S.jefe.gap = Math.max(S.jefe.gap - 40, 150);
      }
      if (!S.jefe && S.respondidas >= 8 && S.fase === 'ruta') {
        S.fase = 'jefe'; S.jefe = { hp: 5, max: 5, gap: 300, atq: null, cd: 2.5 };
        S.msg = { t: 3.5, s: '¡' + S.jefeInfo.n + '! Acierta 5 compuertas' }; S.obs = S.obs.filter(ob => ob.x < S.d + 900); S.flags.push({ tipo: 'portal', x: S.d + 560 });
      }
    }

    function daño(txt) {
      if (S.inv > 0) return;
      if (S.escudo) { S.escudo = 0; S.inv = 1.2; S.shake = .2; beep(500, .2, 'triangle'); S.msg = { t: 1.4, s: '¡El escarabajo te protegió!' }; return; }
      S.vidas--; S.inv = 1.5; S.v = Math.min(S.v, 260); S.shake = .35; beep(150, .3, 'sawtooth');
      if (txt) S.msg = { t: 1.6, s: txt }; if (S.vidas <= 0) terminar(false);
    }

    function actualizar(dt) {
      S.t += dt; const k = S.inputs;
      if (S.msg.t > 0) S.msg.t -= dt; S.inv = Math.max(0, S.inv - dt); S.boost = Math.max(0, S.boost - dt); S.flash = Math.max(0, S.flash - dt); S.shake = Math.max(0, S.shake - dt);
      S.torm = Math.max(0, (S.torm || 0) - dt); S.proxT = (S.proxT === undefined ? 16 : S.proxT) - dt;
      if (S.proxT <= 0 && !S.jefe) { S.torm = 5; S.proxT = R(22, 32); S.msg = { t: 2, s: '¡TORMENTA DE ARENA! Memoriza los carriles' }; beep(200, .5, 'sawtooth'); }
      S.proxB -= dt;
      if (!S.buitre && S.proxB <= 0 && !S.jefe && !(S.torm > 0)) { S.buitre = { est: 'vuelo', bx: W + 70, by: 120, t: 0, lane: 1 }; S.proxB = R(26, 38); S.msg = { t: 1.8, s: '¡BUITRE LADRÓN! Cambia de carril' }; }
      if (S.buitre) { const b = S.buitre; b.t += dt;
        if (b.est === 'vuelo') { b.bx -= 250 * dt; if (b.bx < X_H + 330) { b.est = 'aviso'; b.t = 0; b.lane = clamp(Math.round(S.ly), 0, 2); beep(330, .25, 'triangle'); } }
        else if (b.est === 'aviso') { b.bx -= 60 * dt; if (b.t > .9) { b.est = 'picada'; b.t = 0; b.x0 = b.bx; b.y0 = b.by; } }
        else if (b.est === 'picada') { const k = Math.min(1, b.t / .45); b.bx = b.x0 + (X_H + 40 - b.x0) * k; b.by = b.y0 + (laneY(S.d, b.lane) - 80 - b.y0) * k;
          if (k >= 1) { const golpe = clamp(Math.round(S.ly), 0, 2) === b.lane && S.z < 60; b.est = golpe ? 'huida' : 'sale'; b.t = 0; if (golpe) { S.punt = Math.max(0, S.punt - 80); daño('¡Te robó 80 puntos!'); } } }
        else { b.bx += (b.est === 'huida' ? 300 : -260) * dt; b.by -= 140 * dt; if (b.bx < -120 || b.bx > W + 120 || b.by < -80) S.buitre = null; } }
      S.obs.forEach(ob => { const dx = ob.x - S.d; if (ob.tipo === 'esc' && dx > -100 && dx < 900) ob.x -= 80 * dt;
        if (ob.tipo === 'ser' && dx > 0 && dx < 700) { ob.cd = (ob.cd || 0) - dt; if (ob.cd <= 0) { ob.l = clamp(ob.l + (Math.random() < .5 ? -1 : 1), 0, 2); ob.cd = .8; } } });
      S.ly += (S.lane - S.ly) * Math.min(1, dt * 10);
      S.celebra = Math.max(0, S.celebra - dt); S.iman = Math.max(0, S.iman - dt); if (S.jefe && S.jefe.golpe > 0) S.jefe.golpe -= dt;
      S.zly += (S.ly - S.zly) * Math.min(1, dt * 3.5); S.zz += (S.z * .5 - S.zz) * Math.min(1, dt * 6);
      if (S.comodin) { const g = S.gates.find(g => !g.res && g.x > S.d && g.x - S.d < 1900); if (g && g.tach === undefined) { const malas = [0, 1, 2].filter(l => g.q.ops[l] !== g.q.ans); g.tach = malas[RI(0, malas.length - 1)]; } }
      S.proxD -= dt; if (!S.dragon && S.proxD <= 0 && !S.jefe) { S.dragon = { x: W + 90, y: RI(60, 150) }; S.proxD = R(35, 50); }
      if (S.dragon) { S.dragon.x -= 70 * dt; if (S.dragon.x < -120) S.dragon = null; }
      if (k.salto && S.z === 0) { S.vz = 560; k.salto = false; beep(420, .08, 'triangle'); }
      S.vz -= GR * dt; S.z = Math.max(0, S.z + S.vz * dt); if (S.z === 0 && S.vz < 0) S.vz = 0;
      const objetivo = (S.boost > 0 ? 560 : 360) + Math.min(S.respondidas, 8) * 12, pend = (hY(S.d + 6) - hY(S.d - 6)) / 12;
      S.v += (objetivo - S.v) * dt * 1.2 + pend * 520 * dt; S.v = clamp(S.v, 240, 640);
      S.d += S.v * dt;
      generar();
      const lh = clamp(Math.round(S.ly), 0, 2);
      S.obs.forEach(ob => { if (!ob.hit && ob.l === lh && Math.abs(ob.x - S.d) < 30 && S.z < ob.h - 8) { ob.hit = true; daño(); } });
      S.gotas.forEach(g => { if (S.iman > 0 && !g.ok && Math.abs(g.x - S.d) < 320 && g.x > S.d - 40) { g.l = lh; g.x += (S.d - g.x) * Math.min(1, dt * 5); g.y += (S.z + 30 - g.y) * Math.min(1, dt * 5); }
        if (!g.ok && g.l === lh && Math.abs(g.x - S.d) < 28 && S.z > g.y - 55 && S.z < g.y + 40) { g.ok = true; S.punt += 10; S.boost = Math.max(S.boost, .5); beep(980, .05, 'sine'); } });
      S.gates.forEach(g => { if (!g.res && S.d >= g.x) responder(g); });
      S.pows.forEach(p => { if (!p.ok && p.l === lh && Math.abs(p.x - S.d) < 34 && S.z < 100) recoger(p); });
      S.cofres.forEach(c => { if (c.est === 0 && c.l === lh && Math.abs(c.x - S.d) < 34 && S.z < 45) { c.est = 1; c.t = .3; S.punt += c.oscuro ? 300 : 150; S.msg = { t: 1.5, s: c.oscuro ? '¡COFRE OSCURO! +300' : '¡COFRE! +150' }; beep(780, .1, 'triangle'); setTimeout(() => beep(1040, .15), 100); } else if (c.est === 1) { c.t -= dt; if (c.t <= 0) c.est = 2; } });
      S.pads.forEach(pd => { if (pd.t > 0) pd.t -= dt; if (!pd.ok && pd.l === lh && Math.abs(pd.x - S.d) < 28 && S.z < 40) { pd.ok = true; pd.t = .35; if (pd.tipo === 'trampolin') { S.vz = 900; beep(300, .15, 'square'); setTimeout(() => beep(600, .15, 'square'), 80); } else { S.boost = Math.max(S.boost, 1.3); beep(520, .12, 'sawtooth'); } } });
      S.flags.forEach(f => { if (f.tipo === 'cp' && !f.ok && S.d >= f.x) { f.ok = true; if (S.vidas < 3) { S.vidas++; S.msg = { t: 2, s: '¡CHECKPOINT! +1 vida' }; } else { S.punt += 200; S.msg = { t: 2, s: '¡CHECKPOINT! +200' }; } beep(740, .15, 'sine'); } });
      S.obs.forEach(ob => { if (ob.tipo === 'can' && !ob.fired && ob.x - S.d > 0 && ob.x - S.d < 650) { ob.fired = true; S.balas.push({ x: ob.x - 30, l: ob.l, hit: false }); beep(110, .25, 'sawtooth'); } });
      S.balas.forEach(b => { b.x -= 380 * dt; if (!b.hit && b.l === lh && Math.abs(b.x - S.d) < 26 && S.z < 44) { b.hit = true; daño('¡Bola de fuego!'); } });
      if (S.jefe) {
        const j = S.jefe; j.cd -= dt;
        if (!j.atq && j.cd <= 0) { j.atq = { l: RI(0, 2), t: 0 }; }
        if (j.atq) { j.atq.t += dt; if (j.atq.t > .9 && !j.atq.golpe) { j.atq.golpe = true; if (clamp(Math.round(S.ly), 0, 2) === j.atq.l && S.z < 50) daño(S.jefeInfo.aguijon); S.shake = .3; }
          if (j.atq.t > 1.2) { j.atq = null; j.cd = R(1.6, 2.6); } }
      }
      if (S.est === 'play' && Math.random() < dt * 20) S.part.push({ x: S.d - 20, l: S.ly, z: S.z, vx: -R(60, 160), vz: R(30, 120), t: .5 });
      S.part.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.z += p.vz * dt; }); S.part = S.part.filter(p => p.t > 0);
      S.obs = S.obs.filter(ob => ob.x > S.d - 400); S.gotas = S.gotas.filter(g => g.x > S.d - 400); S.gates = S.gates.filter(g => !g.res || g.x > S.d - 500);
      S.pows = S.pows.filter(p => p.x > S.d - 400); S.cofres = S.cofres.filter(c => c.x > S.d - 400); S.pads = S.pads.filter(p => p.x > S.d - 400); S.decor = S.decor.filter(d => d.x > S.d - 500); S.balas = S.balas.filter(b => b.x > S.d - 400); S.flags = S.flags.filter(f => f.x > S.d - 500);
    }

    function dibujar() {
      const cam = S.d - X_H; cx.save();
      if (S.shake > 0) cx.translate(R(-5, 5) * S.shake * 2, R(-5, 5) * S.shake * 2);
      const cie = cx.createLinearGradient(0, 0, 0, 330); cie.addColorStop(0, '#05061a'); cie.addColorStop(.6, '#2a1f55'); cie.addColorStop(1, '#a4506a');
      cx.fillStyle = cie; cx.fillRect(-10, -10, W + 20, H + 20);
      estrellas.forEach(s => { cx.globalAlpha = .4 + .6 * Math.abs(Math.sin(S.t + s.f)); cx.fillStyle = '#fff'; cx.fillRect(s.x, s.y, s.r, s.r); }); cx.globalAlpha = 1;
      cx.fillStyle = '#ffe9a8'; cx.beginPath(); cx.arc(780, 90, 38, 0, 7); cx.fill(); cx.fillStyle = '#2a1f55'; cx.beginPath(); cx.arc(795, 82, 34, 0, 7); cx.fill();
      cieloExtra(cam);
      [[.12, 280, '#3a2a63', 90], [.28, 320, '#5b3a6e', 60]].forEach(([p, b, c, a]) => { cx.fillStyle = c; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W; x += 16) cx.lineTo(x, b + Math.sin((x + cam * p) / 230) * a * .5); cx.lineTo(W, H); cx.fill(); });
      cx.fillStyle = '#3a2a63'; const pc = -cam * .08 % 700; for (let i = -1; i < 3; i++) { const px = pc + i * 700 + 300; cx.beginPath(); cx.moveTo(px - 70, 285); cx.lineTo(px, 205); cx.lineTo(px + 70, 285); cx.fill(); }
      S.decor.forEach(d => { const x = d.x - cam; if (x < -90 || x > W + 90) return; spr(d.id, 0, x, laneY(d.x, 0) - CARR / 2 + 6, d.alto); });
      const cols = ['#b9764f', '#cf8a58', '#e3a066'];
      for (let l = 0; l < 3; l++) { cx.fillStyle = cols[l]; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W + 12; x += 12) cx.lineTo(x, laneY(cam + x, l) - CARR / 2); cx.lineTo(W + 12, H); cx.fill();
        cx.strokeStyle = 'rgba(255,230,170,.35)'; cx.lineWidth = 2; cx.beginPath(); for (let x = 0; x <= W + 12; x += 12) { const y = laneY(cam + x, l) - CARR / 2; x ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke();
        dibujarLane(l, cam); }
      etiquetasCompuertas(cam);
      dibujarBuitre();
      if (S.torm > 0) { const k = clamp(Math.min(S.torm, 5 - S.torm) * 2, 0, 1), g = cx.createLinearGradient(X_H + 110, 0, W, 0); g.addColorStop(0, 'rgba(214,160,100,0)'); g.addColorStop(.45, 'rgba(214,160,100,' + .93 * k + ')'); g.addColorStop(1, 'rgba(214,160,100,' + k + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        cx.strokeStyle = 'rgba(255,230,190,' + .5 * k + ')'; cx.lineWidth = 2; for (let i = 0; i < 26; i++) { const y = R(0, H), x = R(0, W); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - R(40, 120), y + R(-6, 6)); cx.stroke(); } }
      cx.restore(); hud();
    }

    function dibujarLane(l, cam) {
      const sx = x => x - cam, sy = (x, z) => laneY(x, l) - (z || 0);
      if ((S.jefe && S.jefe.atq && S.jefe.atq.l === l) || (S.buitre && (S.buitre.est === 'aviso' || S.buitre.est === 'picada') && S.buitre.lane === l)) { cx.fillStyle = 'rgba(255,40,40,' + (.25 + .2 * Math.sin(S.t * 30)) + ')'; cx.fillRect(X_H - 50, sy(S.d, 0) - 24, 120, 40); }
      S.gates.forEach(g => { const x = sx(g.x); if (x < -80 || x > W + 80) return; const y = sy(g.x, 0), alto = 100, mia = g.res && g.lane === l;
        const id = !g.res ? 'compuerta_neutral' : (mia ? (g.ok ? 'compuerta_correcta' : 'compuerta_incorrecta') : 'compuerta_usada');
        if (spr(id, 0, x, y + 4, alto, false, g.tach === l && !g.res ? .3 : null)) return;
        const col = !g.res ? '#ffd35a' : (g.lane === l ? (g.ok ? '#53e08a' : '#ff5a5a') : '#6b5a7a');
        cx.strokeStyle = col; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(x - 26, y); cx.lineTo(x - 26, y - 78); cx.moveTo(x + 26, y); cx.lineTo(x + 26, y - 78); cx.stroke();
        cx.fillStyle = col; cx.globalAlpha = .28; cx.fillRect(x - 24, y - 76, 48, 76); cx.globalAlpha = 1;
        cx.fillStyle = '#fff'; cx.font = 'bold 22px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(g.q.ops[l], x, y - 38); });
      S.obs.forEach(ob => { if (ob.l !== l) return; const x = sx(ob.x), y = sy(ob.x, 0); if (x < -60 || x > W + 60) return;
        if (obsSprite(ob, x, y)) return;
        if (ob.tipo === 'cac') { cx.fillStyle = '#2f9e5f'; cx.fillRect(x - 8, y - 56, 16, 56); cx.fillRect(x - 22, y - 38, 14, 8); cx.fillRect(x - 22, y - 46, 8, 16); cx.fillRect(x + 8, y - 30, 14, 8); cx.fillRect(x + 14, y - 40, 8, 16); }
        else if (ob.tipo === 'roca') { cx.fillStyle = '#6d5a73'; cx.beginPath(); cx.moveTo(x - 30, y); cx.lineTo(x - 18, y - 40); cx.lineTo(x + 14, y - 34); cx.lineTo(x + 30, y); cx.fill(); }
        else if (ob.tipo === 'ser') { cx.strokeStyle = '#c9d94a'; cx.lineWidth = 8; cx.lineCap = 'round'; cx.beginPath(); for (let i = 0; i < 9; i++) { const px = x - 32 + i * 8, py = y - 10 + Math.sin(S.t * 9 + i * .9) * 6; i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.stroke(); cx.fillStyle = '#e8f07a'; cx.beginPath(); cx.arc(x + 36, y - 10 + Math.sin(S.t * 9 + 7.2) * 6, 7, 0, 7); cx.fill(); }
        else { const w = Math.sin(S.t * 14 + ob.x) * 3; cx.fillStyle = '#d9473f'; cx.beginPath(); cx.ellipse(x, y - 12, 20, 11, 0, 0, 7); cx.fill(); cx.strokeStyle = '#d9473f'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x + 14, y - 14); cx.quadraticCurveTo(x + 36, y - 30 + w, x + 22, y - 36); cx.stroke(); cx.fillRect(x - 28, y - 14 + w, 10, 4); } });
      S.gotas.forEach(g => { if (g.l !== l || g.ok) return; const x = sx(g.x), y = sy(g.x, g.y); if (x < -20 || x > W + 20) return;
        if (spr('gota_agua', 0, x, y + 12 + Math.sin(S.t * 4 + g.x) * 3, 28)) return; cx.fillStyle = '#6fd6ff'; cx.beginPath(); cx.moveTo(x, y - 12); cx.quadraticCurveTo(x + 9, y, x, y + 8); cx.quadraticCurveTo(x - 9, y, x, y - 12); cx.fill(); });
      S.pads.forEach(pd => { if (pd.l !== l) return; const x = sx(pd.x); if (x < -60 || x > W + 60) return; spr(pd.tipo, 0, x, sy(pd.x, 0) + 8, pd.tipo === 'trampolin' ? 44 - (pd.t > 0 ? 12 : 0) : 34, false, pd.ok && pd.tipo !== 'trampolin' ? .6 : null); });
      S.cofres.forEach(c => { if (c.l !== l) return; const x = sx(c.x); if (x < -60 || x > W + 60) return; spr(c.est === 0 ? (c.oscuro ? 'cofre_oscuro_cerrado' : 'cofre_cerrado') : c.est === 1 && !c.oscuro ? 'cofre_entreabierto' : (c.oscuro ? 'cofre_oscuro_abierto' : 'cofre_abierto'), 0, x, sy(c.x, 0) + 8, 56); });
      S.pows.forEach(pw => { if (pw.l !== l || pw.ok) return; const x = sx(pw.x); if (x < -40 || x > W + 40) return; spr(pw.tipo, 0, x, sy(pw.x, 40 + Math.sin(S.t * 4 + pw.x) * 5) + 22, 44); });
      S.balas.forEach(b => { if (b.l !== l || b.hit) return; const x = sx(b.x); if (x < -40 || x > W + 40) return; spr('bola_fuego', 0, x, sy(b.x, 14) + 22, 46); });
      if (l === 1) S.flags.forEach(f => { const x = sx(f.x); if (x < -100 || x > W + 100) return; if (f.tipo === 'cp') spr('bandera_checkpoint', 0, x, sy(f.x, 0) + 6, 112, false, f.ok ? .5 : null); else spr('portal_piedra', 0, x, sy(f.x, 0) + 10, 190, false, .95); });
      if (l === 1 && S.est === 'gano') { spr('bandera_meta', 0, X_H + 330, laneY(S.d + 330, 1) + 6, 130); spr('teletransporte', 0, X_H + 480, laneY(S.d + 480, 1) + 10, 70); }
      if (l === Math.round(clamp(S.zly, 0, 2))) zorroDib();
      if (l === Math.round(clamp(S.ly, 0, 2))) { heroe(cam); jefeDib(cam); }
    }

    // sprites reales del héroe (assets/characters); si no cargan, se dibuja la versión simple
    const SP = kage ? { run: 15, hurt: 6, idle: 6 } : { run: 14, jump: 4, hurt: 5, sprint: 5, idle: 6 }, IMG = {};
    const carpeta = 'assets/characters/' + (kage ? 'kage' : 'sakura') + '/';
    Object.keys(SP).forEach(a => { IMG[a] = []; for (let i = 0; i < SP[a]; i++) { const im = new Image(); im.src = carpeta + a + '_' + String(i).padStart(2, '0') + '.png'; IMG[a].push(im); } });
    function dibujarSprite() {
      let a = S.inv > 1.1 ? 'hurt' : S.z > 6 && IMG.jump ? 'jump' : S.boost > 0 && IMG.sprint ? 'sprint' : 'run';
      const fr = IMG[a], i = a === 'jump' ? clamp(Math.floor((S.vz > 200 ? 0 : S.vz > 0 ? 1 : S.vz > -250 ? 2 : 3)), 0, fr.length - 1) : Math.floor(S.t * (S.v / 28)) % fr.length, im = fr[i];
      if (!im || !im.complete || !im.naturalWidth) return false;
      const h = 118, w = im.naturalWidth * h / im.naturalHeight; cx.drawImage(im, -w * .5, -h + 6, w, h); return true;
    }

    function heroe(cam) {
      const x = X_H, y = laneY(S.d, S.ly) - S.z, ang = Math.atan(-(hY(S.d + 6) - hY(S.d - 6)) / 12) * -1;
      if (S.inv > 0 && Math.floor(S.t * 14) % 2) return;
      S.part.forEach(p => { cx.globalAlpha = p.t; cx.fillStyle = '#ffe2a8'; cx.fillRect(p.x - cam, laneY(p.x, p.l) - p.z, 4, 3); }); cx.globalAlpha = 1;
      cx.save(); cx.translate(x, y); cx.rotate(ang * .8);
      const vehOk = dibujarVehiculo();
      if (!vehOk && !spr(tablaId, 0, 0, 22, 54)) { cx.fillStyle = '#7a4a8c'; cx.beginPath(); cx.ellipse(0, 4, 40, 8, 0, 0, 7); cx.fill(); cx.fillStyle = '#ffd35a'; cx.fillRect(-40, 2, 80, 3); }
      if (!vehOk && !dibujarSprite()) {
      cx.fillStyle = colH; cx.fillRect(-9, -40, 18, 30); cx.fillStyle = '#f2d1ad'; cx.beginPath(); cx.arc(0, -48, 10, 0, 7); cx.fill(); cx.fillStyle = '#222'; cx.fillRect(-10, -52, 20, 6);
      cx.fillStyle = '#fff'; cx.fillRect(2, -50, 4, 3);
      cx.strokeStyle = colH; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(-9, -48); cx.quadraticCurveTo(-34, -44 + Math.sin(S.t * 18) * 6, -52, -38 + Math.sin(S.t * 14) * 8); cx.stroke();
      }
      if (S.escudo) { cx.strokeStyle = 'rgba(255,214,90,' + (.55 + .25 * Math.sin(S.t * 8)) + ')'; cx.lineWidth = 4; cx.beginPath(); cx.arc(0, -48, 62, 0, 7); cx.stroke(); }
      if (S.boost > 0) { cx.strokeStyle = 'rgba(111,214,255,.8)'; cx.lineWidth = 3; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(-44 - i * 20, -10 + i * 6); cx.lineTo(-90 - i * 20, -10 + i * 6); cx.stroke(); } }
      cx.restore();
    }

    function jefeDib(cam) {
      const j = S.jefe; if (!j) return; const info = S.jefeInfo, bx = X_H - 100 - (j.gap - 150) * .55, by = laneY(S.d - j.gap, 1) + 30;
      const est = S.est === 'gano' ? 'derrota' : j.golpe > 0 ? 'golpe' : j.atq ? (j.atq.t > .5 ? 'ataque' : 'aviso') : 'idle';
      if (spr('jefe_' + info.id + '_' + est, 0, bx, by + Math.sin(S.t * 3) * 3, 210, !!info.espejo)) return;
      cx.save(); cx.translate(bx, by); const s = 2.6; cx.scale(s, s); cx.fillStyle = '#9c2f3b'; cx.beginPath(); cx.ellipse(0, -20, 46, 24, 0, 0, 7); cx.fill();
      cx.strokeStyle = '#9c2f3b'; cx.lineWidth = 9; const atq = j.atq && j.atq.t > .5; cx.beginPath(); cx.moveTo(-30, -30); cx.quadraticCurveTo(-60, -90, atq ? 30 : -10, atq ? -20 : -86); cx.stroke();
      cx.fillStyle = '#ffd35a'; cx.beginPath(); cx.arc(atq ? 34 : -6, atq ? -18 : -88, 8, 0, 7); cx.fill();
      cx.strokeStyle = '#7a2230'; cx.lineWidth = 6; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(20, -14 + i * 6); cx.lineTo(54, 6 + Math.sin(S.t * 10 + i) * 4); cx.stroke(); }
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(38, -30, 5, 0, 7); cx.fill(); cx.fillStyle = '#000'; cx.beginPath(); cx.arc(39, -30, 2.4, 0, 7); cx.fill(); cx.restore();
    }

    function hud() {
      cx.textAlign = 'left'; cx.font = 'bold 20px ui-monospace,monospace';
      for (let i = 0; i < 3; i++) { if (!spr('corazon_desierto', 0, 30 + i * 34, 46, 32, false, i < S.vidas ? 1 : .25)) { cx.fillStyle = i < S.vidas ? '#ff4d6d' : '#4a3a5a'; cx.fillText('♥', 16 + i * 26, 34); } }
      cx.fillStyle = '#ffe27a'; cx.fillText('★ ' + S.punt, 16, 62); cx.fillStyle = '#6fd6ff'; cx.fillText('⚡ ' + Math.round(S.v / 6) + ' km/h', 16, 88);
      let ix = 16; const ic = (id, t) => { if (spr(id, 0, ix + 17, 142, 34)) { if (t) { cx.fillStyle = '#fff'; cx.font = 'bold 12px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(Math.ceil(t) + 's', ix + 17, 156); } ix += 42; } };
      if (S.escudo) ic('poder_escarabajo'); if (S.lento > 0) ic('poder_reloj', S.lento); if (S.iman > 0) ic('poder_iman', S.iman); if (S.comodin) ic('poder_comodin');
      cx.textAlign = 'left'; cx.font = 'bold 20px ui-monospace,monospace';
      const pr = S.jefe ? S.jefe.hp / S.jefe.max : clamp(S.respondidas / 8, 0, 1); cx.fillStyle = '#00000088'; cx.fillRect(W - 236, 16, 220, 16); cx.fillStyle = S.jefe ? '#ff4d4d' : '#ffe27a'; cx.fillRect(W - 236, 16, 220 * pr, 16);
      cx.fillStyle = '#fff'; cx.font = '12px ui-monospace,monospace'; cx.textAlign = 'right'; cx.fillText(S.jefe ? S.jefeInfo.n : 'RECORRIDO ' + S.respondidas + '/8', W - 16, 46);
      const g = S.gates.find(g => !g.res && g.x - S.d < 1900);
      if (g) { cx.fillStyle = '#000000aa'; cx.fillRect(W / 2 - 130, 12, 260, 52); cx.strokeStyle = '#ffe27a'; cx.strokeRect(W / 2 - 130, 12, 260, 52); cx.fillStyle = '#ffe27a'; cx.font = 'bold 30px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(g.q.txt, W / 2, 49); }
      if (S.msg.t > 0) { cx.fillStyle = '#fff'; cx.font = 'bold 24px ui-monospace,monospace'; cx.textAlign = 'center'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText(S.msg.s, W / 2, 130); cx.shadowBlur = 0; }
      if (S.pausa) { cx.fillStyle = '#000000aa'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#ffe27a'; cx.font = 'bold 44px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText('PAUSA', W / 2, H / 2); cx.font = '18px ui-monospace,monospace'; cx.fillStyle = '#fff'; cx.fillText('P o toca II para continuar', W / 2, H / 2 + 36); }
      if (S.lento > 0) { cx.fillStyle = 'rgba(80,140,255,.10)'; cx.fillRect(0, 0, W, H); }
      if (S.flash > 0) { cx.fillStyle = 'rgba(111,214,255,' + S.flash + ')'; cx.fillRect(0, 0, W, H); }
      if (S.inv > 1.2) { cx.fillStyle = 'rgba(255,0,0,.25)'; cx.fillRect(0, 0, W, H); }
    }

    function terminar(gano) {
      if (S.est !== 'play') return; S.est = gano ? 'gano' : 'perdio'; if (gano) ganadasSesion++; beep(gano ? 988 : 120, .6, gano ? 'sine' : 'sawtooth');
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel2 = p.nivel2 || {}; p.nivel2.fallos = S.fallos; p.nivel2.mejor = Math.max(p.nivel2.mejor || 0, S.punt); p.nivel2.intentos = (p.nivel2.intentos || 0) + 1; if (gano) p.nivel2.completados = (p.nivel2.completados || 0) + 1; p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aci; p.estadisticas.errores += S.err; p.estadisticas.minutos += Math.round(S.t / 6) / 10; }); } catch (e) {} }
      const p = document.createElement('div'); p.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#000000b0;color:#fff;text-align:center;padding:20px';
      const url = id => ARTE[id] ? 'assets/nivel2/' + ARTE[id].frames[0].f : '';
      const premio = gano ? [S.jefeInfo.id === 'escorpion' ? 'trofeo_escorpion' : 'cofre_abierto', 'bandera_meta'] : ['zorro_idle'];
      p.innerHTML = '<div style="display:flex;align-items:flex-end;gap:14px">' + premio.filter(url).map(id => '<img src="' + url(id) + '" alt="" style="height:96px">').join('') + '</div><h1 style="margin:0;color:' + (gano ? '#ffe27a' : '#ff6b6b') + '">' + (gano ? '¡DERROTASTE ' + S.jefeInfo.art + ' ' + S.jefeInfo.n + '!' : 'EL DESIERTO TE VENCIÓ') + '</h1><div>Aciertos ' + S.aci + ' · Errores ' + S.err + ' · Puntos ' + S.punt + ' · Récord ' + Math.max(S.punt, (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.mejor) || 0) + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button id="r2">↻ REPETIR</button><button id="s2">VOLVER AL MENÚ</button></div>';
      p.querySelectorAll('button').forEach(b => b.style.cssText = 'font:inherit;font-weight:bold;padding:12px 18px;border:0;border-radius:8px;background:#ffc93c;cursor:pointer');
      root.appendChild(p); p.querySelector('#r2').onclick = () => { p.remove(); const f = S.fallos; nuevo(); S.fallos = f; ult = 0; };
      p.querySelector('#s2').onclick = salir;
    }

    function salir() { cancelAnimationFrame(raf); removeEventListener('keydown', kd); root.remove(); (o.onSalir || (() => { location.href = 'index.html'; }))(); }
    const kd = e => { if (!S || S.est !== 'play') return; const c = e.code; if (c === 'KeyP' || c === 'Escape') { S.pausa = !S.pausa; return; } if (S.pausa) return;
      if (c === 'ArrowUp' || c === 'KeyW') S.lane = Math.max(0, S.lane - 1); else if (c === 'ArrowDown' || c === 'KeyS') S.lane = Math.min(2, S.lane + 1);
      else if (c === 'Space' || c === 'KeyJ' || c === 'ArrowRight') S.inputs.salto = true; if (['Space', 'ArrowUp', 'ArrowDown'].includes(c)) e.preventDefault(); };
    addEventListener('keydown', kd);
    // controles táctiles: toca arriba/abajo para cambiar de carril, o la mitad derecha para saltar
    const botones = [['▲', 'left:14px;bottom:96px', () => S && (S.lane = Math.max(0, S.lane - 1))], ['▼', 'left:14px;bottom:20px', () => S && (S.lane = Math.min(2, S.lane + 1))], ['SALTAR', 'right:14px;bottom:20px;width:130px', () => S && (S.inputs.salto = true)]];
    botones.forEach(([t, pos, fn]) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'position:absolute;' + pos + ';width:70px;height:70px;border-radius:50%;border:2px solid #ffe27a;background:#ffffff22;color:#fff;font:bold 18px ui-monospace,monospace;touch-action:none'; b.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); root.appendChild(b); });
    const sb = document.createElement('button'); sb.textContent = '✕'; sb.style.cssText = 'position:absolute;right:10px;top:10px;opacity:.5;border:0;border-radius:6px;padding:4px 8px'; sb.onclick = salir; root.appendChild(sb);
    const pb = document.createElement('button'); pb.textContent = 'II'; pb.style.cssText = 'position:absolute;right:50px;top:10px;opacity:.5;border:0;border-radius:6px;padding:4px 8px'; pb.onclick = () => { if (S && S.est === 'play') S.pausa = !S.pausa; }; root.appendChild(pb);
    let sy0 = 0; cv.addEventListener('pointerdown', e => { sy0 = e.clientY; }); cv.addEventListener('pointerup', e => { if (!S || S.est !== 'play' || S.pausa) return; const dy = e.clientY - sy0; if (dy < -30) S.lane = Math.max(0, S.lane - 1); else if (dy > 30) S.lane = Math.min(2, S.lane + 1); else S.inputs.salto = true; });

    function bucle(ts) { const dt = Math.min(.033, ((ts - (ult || ts)) / 1000) || 0); ult = ts; if (S.est === 'play' && !S.pausa) { actualizar(dt * (S.lento > 0 ? .6 : 1)); S.lento = Math.max(0, S.lento - dt); } dibujar(); raf = requestAnimationFrame(bucle); }
    nuevo(); raf = requestAnimationFrame(bucle);
  }
  window.Nivel2 = { iniciar, _pregunta: pregunta };
})();
