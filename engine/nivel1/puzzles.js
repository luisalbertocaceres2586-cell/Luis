/* Retos de ingenio del Nivel 1 (v1): cajas que se empujan, placas de presión, compuerta animada, pilares de secuencia con tablero
 * de pistas, puente que se arma y portón de las tres gemas. Todo son DATOS que genera gen-nivel.js (elementos 'caja', 'placa',
 * 'enlace', 'pilar', 'tablero', 'porton', 'pista' y muros 'compuerta' / 'barrera' / 'porton'); este archivo los simula y los dibuja.
 * Se engancha a elementos.js con N1puz.paso / empujes / apoyos / dibujar / dibujarMuro / hud / alReaparecer. */
(function () {
  'use strict';
  const core = window.N1core, { W, H, G, clamp, rect, cruza } = core;
  const S = () => core.S();
  const cx = () => core.cx;
  const P = {};
  window.N1puz = P;

  // ---------- arte (se carga en segundo plano: si falta algo, ese elemento simplemente no se dibuja) ----------
  const A = 'assets/nivel1/puzzles/';
  const NOM = ['caja_madera', 'caja_piedra', 'caja_rota', 'placa_off', 'placa_on', 'barrera_on', 'barrera_off', 'porton_off', 'porton_on',
    'pilar_rojo_off', 'pilar_rojo_on', 'pilar_azul_off', 'pilar_azul_on', 'pilar_dorado_off', 'pilar_dorado_on', 'pilar_verde_off', 'pilar_verde_on',
    'seg_madera', 'seg_piedra', 'seg_bambu', 'tablero_vacio', 'compuerta_abre_8',
    'fx_anillo', 'fx_chispas', 'fx_error', 'fx_polvo', 'fx_aterriza', 'fx_motas', 'fx_humo', 'fx_estrella'];
  const im = {}; let cargando = false;
  function cargar() { if (cargando) return; cargando = true; NOM.forEach(n => { const i = new Image(); i.onload = () => { im[n] = i; }; i.onerror = () => console.warn('[puzzles] falta', n); i.src = A + n + '.png'; }); }
  P.imagenes = im;
  cargar();   // precarga inmediata: así barreras, pilares y tableros ya están listos cuando el jugador llega

  const COL = { rojo: '#D8321F', azul: '#3A8DFF', dorado: '#FFC93C', verde: '#4ADE6B' };
  const NOMBRE = { rojo: 'ROJA', azul: 'AZUL', dorado: 'DORADA', verde: 'VERDE' };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const TOPE_PLACA = 52, TOPE_PLACA_ON = 38;   // alto de la losa sobre su base (sin pisar / pisada)

  // ---------- efectos (hoja 16): imágenes fijas que se agrandan y se desvanecen ----------
  const fxs = [];
  function fx(n, x, y, w, dur, o) { o = o || {}; fxs.push(Object.assign({ n, x, y, w, dur, t: 0, s0: .35, s1: 1.25, rot: 0, vy: 0, add: true, a: 1 }, o)); if (fxs.length > 60) fxs.shift(); }
  /* motas redondas y suaves (reemplazan a las chispas cuadradas): suben desde la placa y se apagan, siempre DETRÁS del héroe */
  const motas = [];
  function motasBurst(x, y, ancho) {
    for (let i = 0; i < 12; i++) motas.push({ x: x + (Math.random() - .5) * ancho * .7, y: y - 4, vx: (Math.random() - .5) * 40, vy: -(40 + Math.random() * 70), t: 0, dur: .9 + Math.random() * .6, r: 5 + Math.random() * 6 });
    if (motas.length > 80) motas.splice(0, motas.length - 80);
  }
  function dibujarMotas(s, c) {
    for (let i = motas.length - 1; i >= 0; i--) {
      const m = motas[i]; m.t += 1 / 60; const k = m.t / m.dur; if (k >= 1) { motas.splice(i, 1); continue; }
      const x = m.x - s.cam + m.vx * m.t, y = m.y + m.vy * m.t * (1 - .35 * k), a = Math.sin(k * Math.PI) * .85, g = c.createRadialGradient(x, y, 0, x, y, m.r * 2);
      g.addColorStop(0, 'rgba(235,255,240,' + a + ')'); g.addColorStop(.35, 'rgba(120,235,150,' + a * .8 + ')'); g.addColorStop(1, 'rgba(74,222,107,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, m.r * 2, 0, 7); c.fill();
    }
  }
  function dibujarFx(capa) {
    const s = S(), c = cx(); capa = capa || 'frente';
    if (capa === 'atras') dibujarMotas(s, c);
    for (let i = fxs.length - 1; i >= 0; i--) {
      if ((fxs[i].capa || 'frente') !== capa) continue;
      const f = fxs[i]; f.t += 1 / 60; const k = f.t / f.dur; if (k >= 1) { fxs.splice(i, 1); continue; }
      const m = im[f.n]; if (!m) continue; const sc = f.s0 + (f.s1 - f.s0) * ease(k), w = f.w * sc, h = m.height * w / m.width;
      c.save(); c.globalAlpha = f.a * (k < .15 ? k / .15 : 1 - Math.pow((k - .15) / .85, 1.6)); if (f.add) c.globalCompositeOperation = 'lighter';
      c.translate(f.x - s.cam, f.y + f.vy * f.t); if (f.rot) c.rotate(f.rot * f.t); c.drawImage(m, -w / 2, -h / 2, w, h); c.restore();
    }
  }

  // ---------- utilidades ----------
  const N_ = () => { const N = S().N; if (!N._p) { const el = N.elem; N._p = { cajas: el.filter(e => e.t === 'caja'), placas: el.filter(e => e.t === 'placa'), enlaces: el.filter(e => e.t === 'enlace'), pilares: el.filter(e => e.t === 'pilar'), tableros: el.filter(e => e.t === 'tablero'), pistas: el.filter(e => e.t === 'pista'), portones: el.filter(e => e.t === 'porton') }; N.gemas = N.gemas || {}; } return N._p; };
  const muro = id => S().N.muros.find(m => m.id === id);
  const plat = id => S().N.plat.find(p => p.id === id);
  const topPlaca = p => TOPE_PLACA_ON + (TOPE_PLACA - TOPE_PLACA_ON) * (1 - p.k);
  function gema(color, x, y) {
    const s = S(), N = s.N; if (N.gemas[color]) return; N.gemas[color] = true;
    fx('fx_estrella', x, y - 120, 190, 1.1, { s0: .3, s1: 1.1 }); fx('fx_chispas', x, y - 120, 260, .8); core.chispas(x, y - 120, 26, COL[color]);
    s.aviso = { t: 3, s: '¡GEMA ' + NOMBRE[color] + '!  (' + Object.keys(N.gemas).length + '/3)' }; s.shake = .25;
    for (let i = 0; i < 5; i++) s.items.push({ x: x - 100 + i * 50, y: G - 70, tipo: 'pergamino', tomado: false });
  }
  function simbolo(c, color, x, y, r, relleno) {
    c.save(); c.translate(x, y); c.lineWidth = Math.max(3, r * .24); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = relleno || COL[color]; c.beginPath();
    if (color === 'rojo') c.arc(0, 0, r * .8, 0, 7);
    else if (color === 'azul') { c.moveTo(0, -r * .9); c.lineTo(r * .9, r * .7); c.lineTo(-r * .9, r * .7); c.closePath(); }
    else if (color === 'dorado') c.rect(-r * .7, -r * .7, r * 1.4, r * 1.4);
    else { for (let k = -1; k <= 1; k += 2) { c.moveTo(-r * .9, k * r * .4); for (let i = 1; i <= 12; i++) c.lineTo(-r * .9 + i * r * 1.8 / 12, k * r * .4 + Math.sin(i / 12 * Math.PI * 4) * r * .22 * -1); } }
    c.stroke(); c.restore();
  }
  P.simbolo = simbolo; P.COL = COL;

  // ---------- simulación ----------
  P.paso = function (dt, hb) {
    const s = S(), N = s.N, h = s.h, Q = N_(); cargar();
    // pistas: un aviso la primera vez que el héroe pasa por la marca
    Q.pistas.forEach(p => { if (!p.dicha && Math.abs(h.x - p.x) < 150) { p.dicha = true; s.aviso = { t: 3.6, s: p.msg }; } });

    // barrera de energía: si el jugador la toca sin haber resuelto el tablero, se le explica qué hacer (antes parecía un muro invisible)
    s.avisoBarrera = Math.max(0, (s.avisoBarrera || 0) - dt);
    N.muros.forEach(m => {
      if (m.tipo !== 'barrera' || m.abierta) return; const tb = Q.tableros.find(q => q.barId === m.id); if (tb && tb.hecho) return;
      if (h.x > m.x - 90 && h.x < m.x + m.w + 90 && s.avisoBarrera <= 0) { s.avisoBarrera = 6; s.aviso = { t: 4.5, s: tb ? 'BARRERA DE ENERGÍA: golpea los pilares (C) en el orden del tablero. Está más atrás ◀' : 'BARRERA DE ENERGÍA: resuelve el reto para apagarla' }; }
    });

    // cajas: se levantan sobre las placas, caen si no hay suelo, se rompen y reaparecen
    Q.cajas.forEach(c => {
      if (c.x0 === undefined) { c.x0 = c.x; c.lift = 0; c.cy = 0; c.vy = 0; c.a = 1; c.sinApoyo = 0; c.estado = 'ok'; }
      if (c.estado === 'cae') { c.vy += 1700 * dt; c.cy += c.vy * dt; c.rot = (c.rot || 0) + dt * 4 * (c.dirCae || 1); if (c.cy > 300) { c.estado = 'rota'; c.rt = 1.3; fx('fx_humo', c.x, G + 40, 190, .9, { add: false, s0: .5, s1: 1.2 }); s.shake = .15; } return; }
      if (c.estado === 'rota') { c.rt -= dt; if (c.rt <= 0) { c.estado = 'ok'; c.x = c.x0; c.cy = 0; c.vy = 0; c.rot = 0; c.lift = 0; c.a = 0; c.sinApoyo = 0; fx('fx_aterriza', c.x, G, 170, .6, { add: false, s0: .5, s1: 1 }); } return; }
      c.a = Math.min(1, c.a + dt * 3);
      let ty = 0; Q.placas.forEach(p => { if (p.y === G && Math.abs(p.x - c.x) < p.w * .36) ty = Math.max(ty, topPlaca(p)); });
      const antes = c.lift; c.lift += (ty - c.lift) * Math.min(1, dt * 12); if (antes < ty * .8 && c.lift >= ty * .8) fx('fx_aterriza', c.x, G - c.lift, 120, .45, { add: false, s0: .5, s1: 1 });
      const apoyada = N.suelo.some(q => c.x > q.x0 + 4 && c.x < q.x1 - 4) || N.plat.some(q => q.tipo === 'puenteSeg' && c.x > q.x && c.x < q.x + q.w);
      if (!apoyada) { c.sinApoyo += dt; if (c.sinApoyo > .12) { c.estado = 'cae'; c.vy = 0; c.cy = 0; c.dirCae = h.x < c.x ? 1 : -1; core.texto(c.x, G - 150, '¡Se cae!', '#ffb'); } } else c.sinApoyo = 0;
      // polvo al arrastrarla
      if (c.movio) { c.polvoT = (c.polvoT || 0) - dt; if (c.polvoT <= 0) { c.polvoT = .22; fx('fx_polvo', c.x - h.dir * 50, G - 14, 64, .5, { add: false, s0: .5, s1: 1, vy: -22, a: .8 }); } } c.movio = false;
    });

    // placas de presión
    Q.placas.forEach(p => {
      if (p.k === undefined) { p.k = 0; p.on = false; }
      let por = null, ligera = false;
      Q.cajas.forEach(c => { if (c.estado === 'ok' && p.y === G && Math.abs(c.x - p.x) < p.w * .34 && c.lift > topPlaca(p) * .7) { if (p.req === 'pesada' && c.peso < 2) ligera = true; else por = 'caja'; } });
      if (!por && (p.req === 'heroe' || p.req === 'cualquiera') && h.suelo && h.pisando && h.pisando.ref === p) por = 'heroe';
      const antes = p.on; p.on = !!por;
      if (p.on && !antes) { fx('fx_motas', p.x, p.y - 30, 118, 1.15, { s0: .6, s1: .95, vy: -28, add: false, a: .8, capa: 'atras' }); motasBurst(p.x, p.y, p.w); s.shake = Math.max(s.shake, .06); }
      if (ligera && !p.on && (p.avisoT = (p.avisoT || 0) - dt) <= 0) { p.avisoT = 2.6; core.texto(p.x, p.y - 130, '¡Muy ligera!', '#ffb'); fx('fx_error', p.x, p.y - 40, 70, .5, { add: true, s0: .5, s1: 1 }); }
      p.k += ((p.on ? 1 : 0) - p.k) * Math.min(1, dt * 14);
    });

    // enlaces: placas → compuerta / segmento de puente
    Q.enlaces.forEach(e => {
      const ps = e.placas.map(id => Q.placas.find(p => p.id === id)).filter(Boolean), todas = ps.length > 0 && ps.every(p => p.on);
      e.parcial = ps.some(p => p.on);
      if (e.accion === 'compuerta') {
        const m = muro(e.id); if (!m) return;
        if (!e.abierto && todas) { e.abierto = true; e.t0 = s.t; s.shake = .3; s.aviso = { t: 2.6, s: '¡LA COMPUERTA SE ABRE!' }; fx('fx_anillo', m.x + m.w / 2, G - 190, 300, 1, { s0: .3, s1: 1.2 }); core.chispas(m.x + m.w / 2, G - 190, 22, '#7dff9a'); }
        if (e.abierto) { e.k = clamp((s.t - e.t0) / 1.5, 0, 1); if (e.k >= .72 && !m.abierta) { m.abierta = true; fx('fx_polvo', m.x + m.w / 2, G - 30, 220, .8, { add: false, s0: .5, s1: 1.1 }); } if (e.k >= 1 && !e.fin) { e.fin = true; gema(e.gema, m.x + m.w / 2, G); } }
      } else if (e.accion === 'seg') {
        const p = plat(e.id); if (!p) return; if (e.ext === undefined) e.ext = 0;
        if (todas && e.latch) e.abierto = true; const obj = (todas || e.abierto) ? 1 : 0, antes = e.ext;
        e.ext += clamp(obj - e.ext, -dt / 1.1, dt / 1.1); p.w = e.len * ease(e.ext);
        if (antes < 1 && e.ext >= 1) { fx('fx_aterriza', e.x0 + e.len, G, 190, .6, { add: false, s0: .5, s1: 1 }); fx('fx_chispas', e.x0 + e.len, G - 20, 150, .6); s.shake = .15; }
        if (antes > 0 && e.ext <= 0) fx('fx_polvo', e.x0, G - 10, 120, .6, { add: false });
        if (e.gema && !e.fin && e.ext >= 1) { e.fin = true; gema(e.gema, e.x0 + e.len, G); }
      }
    });

    // pilares de secuencia
    Q.tableros.forEach(tb => {
      if (tb.prog === undefined) { tb.prog = 0; tb.err = 0; tb.t0 = 0; }
      const m = muro(tb.barId);
      if (tb.hecho) { tb.k = clamp((s.t - tb.t0) / 1.1, 0, 1); if (m && tb.k >= .5 && !m.abierta) m.abierta = true; return; }
      Q.pilares.forEach(p => {
        if (p.tb !== tb.id) return; p.cd = Math.max(0, (p.cd || 0) - dt); p.pulso = Math.max(0, (p.pulso || 0) - dt * 2); if (p.cd > 0) return;
        const caja = rect(p.x - 52, G - 190, 104, 190); let g = !!(s.tajo && cruza(s.tajo, caja));
        s.shur.forEach(q => { if (!q.golpe && !q.obj && cruza(rect(q.x - 16, q.y - 16, 32, 32), caja)) { g = true; q.golpe = true; q.t = 0; } });
        if (!g) return; p.cd = .55; p.pulso = 1;
        if (p.color === tb.seq[tb.prog]) {
          p.on = true; tb.prog++; fx('fx_chispas', p.x, G - 140, 170, .6); core.chispas(p.x, G - 150, 12, COL[p.color]);
          if (tb.prog >= tb.seq.length) { tb.hecho = true; tb.t0 = s.t; s.shake = .3; s.aviso = { t: 2.8, s: '¡SECUENCIA CORRECTA! La barrera se apaga' }; if (m) { fx('fx_anillo', m.x + m.w / 2, G - 200, 320, 1.1, { s0: .3, s1: 1.2 }); fx('fx_estrella', m.x + m.w / 2, G - 200, 200, 1, {}); } gema(tb.gema, m ? m.x + m.w / 2 : p.x, G); }
          else core.texto(p.x, G - 220, (tb.prog) + '/' + tb.seq.length, COL[p.color]);
        } else {
          tb.err++; tb.prog = 0; tb.sacude = .6; s.shake = .22; fx('fx_error', p.x, G - 130, 230, .6, { s0: .4, s1: 1.1 }); core.texto(p.x, G - 220, '¡Orden equivocado!', '#ff8a7a');
          Q.pilares.forEach(q => { if (q.tb === tb.id) q.on = false; });
          if (tb.err === 2) s.aviso = { t: 3, s: 'Mira el tablero con calma: ahora se ve desde más lejos' };
        }
      });
      tb.sacude = Math.max(0, (tb.sacude || 0) - dt);
    });

    // portón de las tres gemas
    Q.portones.forEach(t => {
      const m = muro(t.id); if (!m) return; const n = Object.keys(N.gemas).length;
      if (!t.abierto && n >= 3) { t.abierto = true; t.t0 = s.t; s.shake = .4; s.aviso = { t: 3.4, s: '¡LAS TRES GEMAS! El portón se abre' }; fx('fx_anillo', m.x + m.w / 2, G - 220, 380, 1.2, { s0: .3, s1: 1.3 }); fx('fx_estrella', m.x + m.w / 2, G - 250, 260, 1.2, {}); }
      if (t.abierto) { t.k = clamp((s.t - t.t0) / 1.2, 0, 1); if (t.k >= .6 && !m.abierta) m.abierta = true; }
      else if (Math.abs(h.x - m.x) < 420 && !t.dicho) { t.dicho = true; s.aviso = { t: 3.6, s: 'Portón sellado: necesita las 3 gemas (' + n + '/3)' }; }
    });
  };

  P.alReaparecer = function () {   // las cajas caídas vuelven a su sitio; lo resuelto se queda resuelto
    const s = S(); if (!s || !s.N._p) return; s.N._p.cajas.forEach(c => { if (c.estado === 'cae' || c.estado === 'rota') { c.estado = 'ok'; c.x = c.x0; c.cy = 0; c.vy = 0; c.rot = 0; c.lift = 0; c.sinApoyo = 0; } });
  };

  // ---------- empujar cajas / pararse encima ----------
  P.empujes = function (h, hb) {
    const s = S(), Q = N_();
    Q.cajas.forEach(c => {
      if (c.estado !== 'ok') return; const top = G - c.lift - c.h, L = c.x - c.w / 2, R = c.x + c.w / 2, k = c.peso >= 2 ? .5 : 1;
      if (h.y > top + 8 && h.x + h.w / 2 > L && h.x - h.w / 2 < R && h.y - h.h < G - c.lift) {
        let ov, dir; if (h.x < c.x) { ov = h.x + h.w / 2 - L; dir = 1; } else { ov = R - (h.x - h.w / 2); dir = -1; }
        let nx = clamp(c.x + dir * ov * k, c.min, c.max);
        Q.cajas.forEach(o => { if (o === c || o.estado !== 'ok') return; const sep = (c.w + o.w) / 2; if (Math.abs(nx - o.x) < sep && Math.abs(o.x - nx) < Math.abs(o.x - c.x) + 1) nx = o.x - dir * sep; });
        nx = clamp(nx, c.min, c.max); const mv = nx - c.x; c.x = nx;
        const fal = ov - Math.abs(mv); if (fal > .01) h.x -= dir * fal; if (Math.abs(mv) > .01) c.movio = true; h.empuja = true; core.cartaEmpujada = true;
      }
    });
  };
  P.apoyos = function (h, antesY, cb) {
    const Q = N_();
    Q.cajas.forEach(c => { if (c.estado !== 'ok') return; const top = G - c.lift - c.h; if (h.x + h.w / 2 > c.x - c.w / 2 + 6 && h.x - h.w / 2 < c.x + c.w / 2 - 6 && antesY <= top + 8 && h.y >= top) cb(top, c); });
    Q.placas.forEach(p => { const top = p.y - topPlaca(p); if (h.x + h.w / 2 > p.x - p.w / 2 + 14 && h.x - h.w / 2 < p.x + p.w / 2 - 14 && antesY <= top + 8 && h.y >= top) cb(top, p); });
  };

  // ---------- dibujo ----------
  function dib(n, x, base, w, o) { const m = im[n]; if (!m) return 0; const c = cx(), h = m.height * w / m.width; o = o || {}; c.save(); if (o.a !== undefined) c.globalAlpha = o.a; if (o.rot) { c.translate(x, base - h / 2); c.rotate(o.rot); c.drawImage(m, -w / 2, -h / 2, w, h); } else if (o.flip) { c.translate(x, base); c.scale(-1, 1); c.drawImage(m, -w / 2, -h, w, h); } else c.drawImage(m, x - w / 2, base - h, w, h); c.restore(); return h; }

  function dibujarPlaca(p, s) {
    const x = p.x - s.cam, off = im.placa_off, on = im.placa_on; if (!off || !on) return;
    const w = p.w, ho = off.height * w / off.width, hn = on.height * w / on.width;
    cx().save(); cx().globalAlpha = 1; dib('placa_off', x, p.y + 4, w, { a: 1 - p.k }); dib('placa_on', x, p.y + 4, w, { a: p.k }); cx().restore();
    if (p.k > .05) {   // aura plana sobre la losa + motas suaves; todo queda bajo los pies y detrás del héroe
      const c = cx(), pul = .85 + .15 * Math.sin(s.t * 5), R = p.w * .62;
      c.save(); c.translate(x, p.y - 4); c.scale(1, .28);
      const g = c.createRadialGradient(0, 0, 2, 0, 0, R); g.addColorStop(0, 'rgba(190,255,205,' + (.5 * p.k * pul) + ')'); g.addColorStop(.55, 'rgba(74,222,107,' + (.26 * p.k) + ')'); g.addColorStop(1, 'rgba(74,222,107,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.restore();
      for (let i = 0; i < 6; i++) {
        const ph = (s.t * .5 + i / 6) % 1, mx = x + Math.sin(i * 2.4) * p.w * .32, my = p.y - 8 - ph * 70, al = Math.sin(ph * Math.PI) * .65 * p.k, gm = c.createRadialGradient(mx, my, 0, mx, my, 8);
        gm.addColorStop(0, 'rgba(235,255,240,' + al + ')'); gm.addColorStop(.4, 'rgba(120,235,150,' + al * .7 + ')'); gm.addColorStop(1, 'rgba(74,222,107,0)'); c.fillStyle = gm; c.beginPath(); c.arc(mx, my, 8, 0, 7); c.fill();
      }
    }
    void ho; void hn;
  }
  function dibujarCaja(c, s) {
    if (c.estado === 'rota') { const a = clamp(c.rt, 0, 1); dib('caja_rota', c.x - s.cam, G + 4, 120, { a }); return; }
    const x = c.x - s.cam, n = c.peso >= 2 ? 'caja_piedra' : 'caja_madera', m = im[n]; if (!m) return;
    const w = c.w + 18, hh = m.height * w / m.width, y = G - c.lift + (c.cy || 0) + 4, cc = cx();
    cc.save(); cc.globalAlpha = c.a === undefined ? 1 : c.a;
    cc.fillStyle = 'rgba(10,5,30,.28)'; cc.beginPath(); cc.ellipse(x, G + 3, w * .5, 8, 0, 0, 7); cc.fill();   // sombra en el suelo
    if (c.estado === 'cae') { cc.translate(x, y - hh / 2); cc.rotate(c.rot || 0); cc.drawImage(m, -w / 2, -hh / 2, w, hh); } else cc.drawImage(m, x - w / 2, y - hh, w, hh);
    cc.restore();
  }
  function dibujarPilar(p, s) {
    const x = p.x - s.cam, n = 'pilar_' + p.color + (p.on ? '_on' : '_off'), cc = cx(), sq = 1 + (p.pulso > 0 ? Math.sin(p.pulso * 8) * .05 * p.pulso : 0);
    cc.save(); cc.translate(x, G + 6); cc.scale(1 / sq, sq); dib(n, 0, 0, 112); cc.restore();
    if (p.on) { cc.save(); cc.globalCompositeOperation = 'lighter'; cc.globalAlpha = .3 + .12 * Math.sin(s.t * 5 + p.x); const g = cc.createRadialGradient(x, G - 190, 6, x, G - 190, 90); g.addColorStop(0, COL[p.color]); g.addColorStop(1, 'rgba(0,0,0,0)'); cc.fillStyle = g; cc.fillRect(x - 100, G - 290, 200, 200); cc.restore(); }
  }
  function dibujarTablero(tb, s) {
    const m = im.tablero_vacio; if (!m) return; const w = 360, h = m.height * w / m.width, x0 = tb.x - s.cam - w / 2, y0 = G + 2 - h, c = cx();
    const cerca = Math.abs(s.h.x - tb.x) < (tb.err >= 2 ? 1100 : 430) || tb.hecho, sac = tb.sacude > 0 ? Math.sin(tb.sacude * 60) * 4 * tb.sacude : 0;
    c.save(); c.translate(sac, 0); c.drawImage(m, x0, y0, w, h);
    const cxs = [121, 261, 401, 541], sc = w / m.width;
    tb.seq.forEach((col, i) => {
      const px = x0 + cxs[i] * sc, py = y0 + 92 * sc, r = 24 * sc * 1.1, lit = i < tb.prog || tb.hecho, sig = i === tb.prog && tb.err >= 2 && !tb.hecho;
      if (cerca) { c.globalAlpha = lit ? 1 : .8; if (lit) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(px, py, 2, px, py, r * 2); g.addColorStop(0, COL[col]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.globalAlpha = .55; c.fillRect(px - r * 2, py - r * 2, r * 4, r * 4); c.restore(); } simbolo(c, col, px, py, r, lit ? '#fff' : COL[col]); if (lit) simbolo(c, col, px, py, r); }
      else { c.globalAlpha = .75; c.fillStyle = 'rgba(255,255,255,.55)'; c.font = 'bold ' + Math.round(34 * sc) + 'px ui-monospace,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', px, py); }
      if (sig && cerca) { c.globalAlpha = .5 + .5 * Math.sin(s.t * 6); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(px - r * 1.3, py - r * 1.3, r * 2.6, r * 2.6); }
    });
    c.restore();
  }
  function dibujarEnlaceSeg(e, s) {
    if (e.ext === undefined || e.ext <= 0.001) return; const m = im[e.mat]; if (!m) return; const c = cx(), w = e.len + 24, hh = m.height * w / m.width, top = G - hh * e.deck, ext = ease(e.ext), x0 = e.x0 - s.cam - 12;
    c.save(); c.beginPath(); c.rect(x0 - 4, top - 120, e.len * ext + 24, hh + 160); c.clip(); c.drawImage(m, x0 - (w - (e.len * ext + 24)) * 1, top, w, hh); c.restore();
    if (e.ext < 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6; const g = c.createRadialGradient(e.x0 + e.len * ext - s.cam, G - 4, 2, e.x0 + e.len * ext - s.cam, G - 4, 46); g.addColorStop(0, '#ffc93c'); g.addColorStop(1, 'rgba(255,201,60,0)'); c.fillStyle = g; c.fillRect(e.x0 + e.len * ext - s.cam - 50, G - 50, 100, 100); c.restore(); }
  }

  P.dibujar = function (capa) {
    const s = S(), Q = N_(), c = cx(); const vis = x => x > s.cam - 400 && x < s.cam + W + 400;
    if (capa === 'atras') {
      Q.enlaces.forEach(e => { if (e.accion === 'seg' && vis(e.x0 + e.len / 2)) dibujarEnlaceSeg(e, s); });
      Q.tableros.forEach(tb => { if (vis(tb.x)) dibujarTablero(tb, s); });
      Q.placas.forEach(p => { if (vis(p.x)) dibujarPlaca(p, s); });
      Q.pilares.forEach(p => { if (vis(p.x)) dibujarPilar(p, s); });
      dibujarFx('atras');
    } else if (capa === 'enemigos') Q.cajas.forEach(cj => { if (vis(cj.x)) dibujarCaja(cj, s); });
    else if (capa === 'frente') dibujarFx('frente');
    void c;
  };

  // compuerta animada (8 cuadros), barrera de energía y portón de tres gemas: son muros del generador
  P.dibujarMuro = function (m) {
    const s = S(), c = cx(), Q = N_(), x = m.x + m.w / 2 - s.cam;
    if (m.tipo === 'compuerta') {
      const t = im.compuerta_abre_8; if (!t) return; const e = Q.enlaces.find(q => q.id === m.id), fw = t.width / 8, w = 270, hh = t.height * w / fw;
      let f = 0; if (e && e.abierto) f = 2 + Math.floor((e.k || 0) * 5.99); else if (e && e.parcial) f = 1; else f = 0;
      if (e && e.parcial && !e.abierto) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .22 + .12 * Math.sin(s.t * 9); c.fillStyle = '#ff4030'; c.fillRect(x - 60, G - 330, 120, 300); c.restore(); }
      c.drawImage(t, f * fw, 0, fw, t.height, x - w / 2, G + 10 - hh, w, hh); return;
    }
    if (m.tipo === 'barrera') {
      const tb = Q.tableros.find(q => q.barId === m.id), k = tb && tb.hecho ? tb.k || 0 : 0, w = 270;
      if (k < 1) { c.save(); c.globalAlpha = (1 - k) * (.55 + .2 * Math.sin(s.t * 6)); const gr = c.createLinearGradient(x - 70, 0, x + 70, 0); gr.addColorStop(0, 'rgba(90,170,255,0)'); gr.addColorStop(.5, 'rgba(120,200,255,.9)'); gr.addColorStop(1, 'rgba(90,170,255,0)'); c.fillStyle = gr; c.fillRect(x - 70, G - 460, 140, 470); c.restore(); }   // columna azul brillante: siempre se ve, aunque falle la imagen
      if (!im.barrera_off && !im.barrera_on && k < 1) { c.save(); c.strokeStyle = '#9fd4ff'; c.lineWidth = 4; c.strokeRect(x - 28, G - 440, 56, 440); c.restore(); }
      dib('barrera_off', x, G + 10, w); if (k < 1) { const a = (1 - k) * (.88 + .12 * Math.sin(s.t * 10)); const mm = im.barrera_on; if (mm) { c.save(); c.globalAlpha = a; c.drawImage(mm, x - w / 2, G + 10 - mm.height * w / mm.width, w, mm.height * w / mm.width); if (k === 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12 + .08 * Math.sin(s.t * 14); c.fillStyle = '#7ab8ff'; c.fillRect(x - 55, G - 400, 110, 400); } c.restore(); } } return;
    }
    if (m.tipo === 'porton') {
      const t = Q.portones.find(q => q.id === m.id), k = t && t.abierto ? t.k || 0 : 0, w = 290; dib('porton_off', x, G + 10, w, { a: 1 }); if (k > 0) dib('porton_on', x, G + 10, w, { a: k });
      const mm = im.porton_off; if (mm && k < 1) { const hh = mm.height * w / mm.width, top = G + 10 - hh, N = s.N; [{ c: 'rojo', fx: .445, fy: .09 }, { c: 'azul', fx: .25, fy: .18 }, { c: 'dorado', fx: .67, fy: .18 }].forEach(g => { const px = x - w / 2 + g.fx * w, py = top + g.fy * hh; if (N.gemas && N.gemas[g.c]) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 + .2 * Math.sin(s.t * 6); const gr = c.createRadialGradient(px, py, 2, px, py, 34); gr.addColorStop(0, COL[g.c]); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(px - 36, py - 36, 72, 72); c.restore(); } else { c.fillStyle = 'rgba(12,8,30,.62)'; c.beginPath(); c.arc(px, py, 17, 0, 7); c.fill(); } }); }
    }
  };

  // panel de gemas (debajo de los pergaminos)
  P.hud = function (c, caja) {
    const s = S(), N = s.N; if (!N._p || !N._p.portones.length) return; const g = N.gemas || {}, n = Object.keys(g).length, ve = n > 0 || Math.abs(s.h.x - (N._p.portones[0].x || 0)) < 2600; if (!ve) return;
    caja(20, 98, 140, 40, 10, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.6)');
    ['rojo', 'azul', 'dorado'].forEach((col, i) => { const px = 50 + i * 44, py = 118; c.beginPath(); c.arc(px, py, 14, 0, 7); c.fillStyle = g[col] ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)'; c.fill(); c.globalAlpha = g[col] ? 1 : .3; simbolo(c, col, px, py, 9, g[col] ? COL[col] : '#aab'); c.globalAlpha = 1; });
  };
})();
