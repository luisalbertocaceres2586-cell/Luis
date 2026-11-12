/* Elementos especiales del Nivel 1: enemigos (bosque y cueva), jefe, carretas que se empujan, palancas y rejas,
 * emboscadas, roca que persigue, kunai a ritmo, sierras de shuriken, viento, estalactitas y telarañas. */
(function () {
  'use strict';
  const core = window.N1core, { W, H, G, img, keys, clamp, rect, cruza } = core;
  const S = () => core.S();
  const cx = () => core.cx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const E = {};
  window.N1elem = E;

  // ---------- utilidades de golpes ----------
  function golpeado(e, hb, opts) {
    // ¿recibió un tajo, un shuriken o un pisotón? devuelve 'tajo' | 'shuriken' | 'pisa' | null
    const s = S(), h = s.h, b = opts.caja;
    if (s.tajo && cruza(s.tajo, b)) return 'tajo';
    for (const sh of s.shur) if (!sh.golpe && !sh.obj && cruza(rect(sh.x - 16, sh.y - 16, 32, 32), b)) { sh.golpe = true; sh.t = 0; return 'shuriken'; }
    if (opts.pisable && h.inv <= 0 && h.vy > 160 && cruza(hb, b) && h.y < b.y + b.h * .55) return 'pisa';
    return null;
  }
  function matar(e, via) {
    const s = S(); e.vivo = false; core.chispas(e.x, e.y - 40, 14, '#bbb'); core.texto(e.x, e.y - 100, '¡Hi-yah!', '#fff'); s.shake = .1;
    if (via === 'pisa') { s.h.vy = -650; s.h.cortado = true; }
    if (Math.random() < .55) s.items.push({ x: e.x, y: Math.min(e.y - 40, G - 40), tipo: 'pergamino', tomado: false });
    if (e.emb) e.emb.vivos--;
  }

  // ---------- enemigos ----------
  function actualizarEnemigo(e, dt, hb) {
    const s = S(), h = s.h; if (!e.vivo) return; if (Math.abs(e.x - h.x) > 1500 && e.kind !== 'oni') return;
    const dx = h.x - e.x;
    switch (e.kind) {
      case 'ninja': case 'arana': e.x += e.vx * dt; if (e.x < e.min || e.x > e.max) e.vx = -e.vx; e.dir = e.vx > 0 ? 1 : -1; e.caja = rect(e.x - 26, e.y - 84, 52, 84); break;
      case 'ninjaAtk': {
        e.t = (e.t || 0) + dt; e.dir = e.dir || 1;
        if (e.fase === 'carga') { e.x += e.dir * 520 * dt; e.f -= dt; if (e.f <= 0) { e.fase = 'cd'; e.f = 1.6; } }
        else if (e.fase === 'aviso') { e.f -= dt; if (e.f <= 0) { e.fase = 'carga'; e.f = .5; } }
        else if (e.fase === 'cd') { e.f -= dt; if (e.f <= 0) e.fase = null; }
        else { e.x += e.vx * dt; if (e.x < e.min || e.x > e.max) e.vx = -e.vx; e.dir = e.vx > 0 ? 1 : -1; if (Math.abs(dx) < 330 && Math.abs(h.y - e.y) < 120 && h.y >= G - 10) { e.fase = 'aviso'; e.f = .45; e.dir = dx > 0 ? 1 : -1; } }
        e.x = clamp(e.x, e.min - 120, e.max + 120); e.caja = rect(e.x - 26, e.y - 84, 52, 84); break;
      }
      case 'tengu': case 'murcielago': {
        e.x += (e.vx || 90) * dt; if (e.x < e.min || e.x > e.max) e.vx = -(e.vx || 90); e.dir = (e.vx || 90) > 0 ? 1 : -1;
        const tgt = e.kind === 'murcielago' && Math.abs(dx) < 280 ? h.y - 90 : e.base + Math.sin(s.t * 3 + e.x * .01) * e.amp; e.y += (tgt - e.y) * Math.min(1, dt * 2.5); e.caja = rect(e.x - 40, e.y - 36, 80, 56); break;
      }
      case 'aranaTecho': {
        if (e.estado === 'espera') { if (Math.abs(dx) < 150) { e.estado = 'baja'; } }
        else if (e.estado === 'baja') { e.y += 300 * dt; if (e.y >= G - 70) { e.y = G - 70; e.estado = 'abajo'; e.f = .9; } }
        else if (e.estado === 'abajo') { e.f -= dt; if (e.f <= 0) e.estado = 'sube'; }
        else if (e.estado === 'sube') { e.y -= 200 * dt; if (e.y <= e.base) { e.y = e.base; e.estado = 'espera'; } }
        e.caja = rect(e.x - 34, e.y - 30, 68, 64); break;
      }
      case 'fuego': {
        if (Math.abs(dx) < 430) { const dy = (h.y - 70) - e.y, d = Math.hypot(dx, dy) || 1; e.x += dx / d * 85 * dt; e.y += dy / d * 85 * dt; } else { e.y = e.base + Math.sin(s.t * 2 + e.x) * e.amp; }
        e.dir = dx > 0 ? 1 : -1; e.caja = rect(e.x - 26, e.y - 36, 52, 70); break;
      }
      case 'oni': return actualizarJefe(e, dt, hb);
    }
    const via = golpeado(e, hb, { caja: e.caja, pisable: e.kind === 'ninja' || e.kind === 'ninjaAtk' || e.kind === 'arana' });
    if (via) { matar(e, via); return; }
    if (h.inv <= 0 && cruza(hb, e.caja)) core.danio(e.kind, dx > 0 ? 1 : -1);
  }

  // ---------- jefe: Oni rojo ----------
  function actualizarJefe(e, dt, hb) {
    const s = S(), h = s.h, el = s.N.elem.find(q => q.t === 'jefe'); if (!el) return;
    if (el.estado === 0) { if (h.x > el.x0 + 180 && h.x < el.x1) { el.estado = 1; cerrar(['jL', 'jR']); e.estado = 'camina'; e.t = 2; core.jefeActivo = true; s.aviso = { t: 3, s: '¡EL ONI ROJO!' }; } return; }
    if (el.estado === 2) return;
    e.inv = Math.max(0, (e.inv || 0) - dt); e.t -= dt; const dx = h.x - e.x; e.dir = dx > 0 ? 1 : -1;
    if (e.estado === 'camina') { e.x += e.dir * 100 * dt; if (e.t <= 0) { e.estado = 'aviso'; e.t = .75; } }
    else if (e.estado === 'aviso') { if (e.t <= 0) { e.estado = 'carga'; e.t = .85; e.cdir = e.dir; } }
    else if (e.estado === 'carga') { e.x += e.cdir * 620 * dt; if (e.t <= 0) { e.estado = 'cansado'; e.t = 1.1; } }
    else if (e.estado === 'cansado') { if (e.t <= 0) { e.estado = 'camina'; e.t = 2 + Math.random(); } }
    e.x = clamp(e.x, el.x0 + 80, el.x1 - 80); e.caja = rect(e.x - 60, e.y - 170, 120, 170);
    const via = golpeado(e, hb, { caja: e.caja, pisable: true });
    if (via && e.inv <= 0) { e.hp -= via === 'tajo' ? 1 : 1; e.inv = .55; core.chispas(e.x, e.y - 100, 18, '#ffd54a'); core.texto(e.x, e.y - 190, '-1', '#ffd54a'); s.shake = .15; if (via === 'pisa') { h.vy = -700; } e.x += (e.estado === 'cansado' ? 0 : 0); if (e.hp <= 0) { terminarJefe(e, el); return; } }
    if (h.inv <= 0 && cruza(hb, e.caja) && !via) core.danio('oni', dx > 0 ? 1 : -1, e.estado === 'carga' ? 2 : 1);
  }
  function terminarJefe(e, el) {
    const s = S(); e.vivo = false; el.estado = 2; core.jefeActivo = false; abrir(['jL', 'jR']); core.chispas(e.x, e.y - 100, 50, '#ffd54a'); s.aviso = { t: 3, s: '¡DERROTASTE AL ONI ROJO!' }; s.shake = .4;
    for (let i = 0; i < 6; i++) s.items.push({ x: e.x - 100 + i * 40, y: G - 60, tipo: 'pergamino', tomado: false }); s.items.push({ x: e.x, y: G - 90, tipo: 'onigiri', tomado: false }); s.items.push({ x: e.x + 60, y: G - 90, tipo: 'onigiri', tomado: false });
  }
  function cerrar(ids) { S().N.muros.forEach(m => { if (ids.indexOf(m.id) >= 0) m.abierta = false; }); }
  function abrir(ids) { S().N.muros.forEach(m => { if (ids.indexOf(m.id) >= 0) m.abierta = true; }); }

  // ---------- elementos del mundo ----------
  function actualizarElem(t, dt, hb) {
    const s = S(), h = s.h;
    switch (t.t) {
      case 'carreta': {
        t.movio = false; t.x0 = t.x0 === undefined ? t.x : t.x0;
        if (t.est !== undefined) {
          const e = s.est[t.est]; if (e && !e.resuelta) {
            const pad = e.pads.find(p => Math.abs(p.x - t.x) < 46 && p.estado === 'listo');
            if (pad && !t.prev) { t.reposo = (t.reposo || 0) + dt; } else t.reposo = 0;
            if (t.reposo > .9) { t.reposo = 0; if (pad.correcto) { pad.estado = 'bien'; core.resolver(e, true, pad.x, G - 60); } else { pad.estado = 'mal'; core.resolver(e, false, pad.x, G - 60); core.texto(pad.x, G - 120, 'La carreta vuelve…', '#ffb'); t.vuelve = true; setTimeout(() => { pad.estado = 'listo'; }, 900); } }
          }
        }
        if (t.vuelve) { t.x += (t.x0 - t.x) * Math.min(1, dt * 4); if (Math.abs(t.x - t.x0) < 3) { t.x = t.x0; t.vuelve = false; } }
        t.prev = false; break;
      }
      case 'palanca': {
        const caja = rect(t.x - 36, t.y - 90, 72, 100);
        if (!t.on && s.tajo && cruza(s.tajo, caja)) { t.on = true; s.N.muros.forEach(m => { if (m.id === t.id) m.abierta = true; }); core.chispas(t.x, t.y - 50, 18, '#ffe27a'); core.texto(t.x, t.y - 110, '¡CLAC!', '#ffe27a'); s.aviso = { t: 1.6, s: 'SE ABRE LA REJA' }; }
        break;
      }
      case 'emb': {
        if (t.estado === 0 && h.x > t.x0 + 140 && h.x < t.x1 - 140) { t.estado = 1; t.ola = 0; cerrar([t.idL, t.idR]); core.emboscadaActiva = true; spawnOla(t); }
        else if (t.estado === 1) { t.vivos = s.enemigos.filter(q => q.emb === t && q.vivo).length; if (t.vivos === 0) { t.ola++; if (t.ola >= t.olas.length) { t.estado = 2; abrir([t.idL, t.idR]); core.emboscadaActiva = false; s.aviso = { t: 2.5, s: '¡EMBOSCADA SUPERADA!' }; s.items.push({ x: (t.x0 + t.x1) / 2, y: G - 80, tipo: 'onigiri', tomado: false }); } else { spawnOla(t); } } }
        break;
      }
      case 'roca': {
        if (!t.activa && !t.fin && h.x > t.x0 && h.x < t.x1) { t.activa = true; core.rocaActiva = true; s.aviso = { t: 2, s: '¡UNA ROCA TE PERSIGUE!' }; s.shake = .4; }
        if (t.activa) {
          t.x += 300 * dt; if (h.x > t.x1) { t.activa = false; t.fin = true; core.rocaActiva = false; core.chispas(t.x, G - 80, 30, '#bbb'); s.aviso = { t: 2, s: '¡LA ROCA SE ESTRELLÓ!' }; }
          else if (t.x + t.r * .7 > h.x - 10 && h.y > G - 200) { core.danio('roca', 1, 2); h.x = t.x + t.r + 260; h.vx = 200; }
        }
        break;
      }
      case 'kunaiR': {
        const per = t.per, ph = ((s.t + t.f * per) % per) / per; t.ext = ph < .12 ? ph / .12 : ph < .5 ? 1 : ph < .62 ? 1 - (ph - .5) / .12 : 0;
        if (t.ext > .55 && h.inv <= 0 && cruza(hb, rect(t.x, G - 46 * t.ext, t.w, 46 * t.ext))) core.danio('kunai', h.x < t.x + t.w / 2 ? -1 : 1); break;
      }
      case 'sierra': {
        const f = .5 + .5 * Math.sin(s.t * Math.PI * 2 / t.per + t.f); t.cy = t.y0 + (t.y1 - t.y0) * f; t.a = (t.a || 0) + dt * 14;
        if (h.inv <= 0 && Math.hypot(h.x - t.x, (h.y - 46) - t.cy) < 44 + 26) core.danio('sierra', h.x < t.x ? -1 : 1); break;
      }
      case 'viento': {
        if (h.x > t.x && h.x < t.x + t.w && h.y > t.y && h.y < t.y + t.h + 80) { const fuerte = keys.Space || keys.ArrowUp || keys.KeyW; h.vy -= (fuerte ? 5600 : 3000) * (1 / 60); if (h.vy < -560) h.vy = -560; if (h.vy < -150) { t.uso = (t.uso || 0) + dt; if (t.uso > .5) core.vientoUsado = true; } h.suelo = false; }
        break;
      }
      case 'estal': {
        if (t.y === undefined) { t.y = -10; t.vy = 0; } const im = img.estal, hh = im ? im.height * 90 / im.width : 120;
        if (t.estado === 'colgada' && Math.abs(h.x - t.x) < 140 && h.y >= G - 4) { t.estado = 'tiembla'; t.t0 = .8; }
        else if (t.estado === 'tiembla') { t.t0 -= dt; if (t.t0 <= 0) { t.estado = 'cae'; t.vy = 0; } }
        else if (t.estado === 'cae') { t.vy += 1900 * dt; t.y += t.vy * dt; if (cruza(hb, rect(t.x - 28, t.y, 56, hh * .9))) core.danio('estalactita', h.x < t.x ? -1 : 1); if (t.y + hh >= G) { t.estado = 'rota'; core.chispas(t.x, G - 10, 20, '#99a'); s.shake = .2; } }
        break;
      }
      case 'tela': {
        if (t.roto) break; const caja = rect(t.x - t.w / 2, t.y - t.h / 2, t.w, t.h + 60);
        if (s.tajo && cruza(s.tajo, caja)) { t.roto = true; core.chispas(t.x, t.y, 14, '#fff'); core.texto(t.x, t.y - 50, '¡ZAS!', '#fff'); }
        else if (cruza(hb, caja)) h.lento = .15; break;
      }
    }
  }
  function spawnOla(t) {
    const s = S(), n = t.olas[t.ola]; core.texto((t.x0 + t.x1) / 2, G - 220, 'OLA ' + (t.ola + 1) + '/' + t.olas.length, '#ffe27a'); s.shake = .2;
    for (let i = 0; i < n; i++) { const izq = i % 2 === 0, x = izq ? t.x0 + 60 : t.x1 - 60, ataca = (i + t.ola) % 2 === 1; s.enemigos.push({ kind: ataca ? 'ninjaAtk' : 'ninja', x, min: t.x0 + 40, max: t.x1 - 40, y: G, vx: (izq ? 1 : -1) * 70, vivo: true, hp: 1, emb: t, t: 0 }); }
  }

  E.paso = function (dt, hb) {
    const s = S(), h = s.h;
    s.enemigos.forEach(e => actualizarEnemigo(e, dt, hb));
    s.N.muros.forEach(m => {   // paredes de sellos: se rompen con el tajo o un shuriken
      if (!m.rompible || m.roto || Math.abs(m.x - h.x) > 400) return; let g = s.tajo && cruza(s.tajo, m);
      s.shur.forEach(q => { if (!q.golpe && !q.obj && cruza(rect(q.x - 16, q.y - 16, 32, 32), m)) { g = true; q.golpe = true; q.t = 0; } });
      if (g) { s.N.muros.forEach(o => { if (o.rompible && !o.roto && Math.abs(o.x - m.x) < 5) { o.roto = true; core.chispas(o.x + o.w / 2, o.y + o.h / 2, 18, '#cba'); } }); core.texto(m.x + 40, m.y - 20, '¡CRASH!', '#ffe27a'); s.shake = .15; }
    });
    s.N.elem.forEach(t => { if (Math.abs((t.x !== undefined ? t.x : (t.x0 || 0)) - h.x) < 2200 || t.t === 'emb' || t.t === 'jefe' || t.t === 'roca') actualizarElem(t, dt, hb); });
  };
  E.alReaparecer = function () {
    const s = S(); if (!s) return;
    s.N.elem.forEach(t => {
      if (t.t === 'emb' && t.estado === 1) { t.estado = 0; abrir([t.idL, t.idR]); s.enemigos.forEach(q => { if (q.emb === t) q.vivo = false; }); core.emboscadaActiva = false; }
      if (t.t === 'roca' && t.activa) { t.activa = false; t.x = t.x0 - 450; core.rocaActiva = false; }
      if (t.t === 'jefe' && t.estado === 1) { t.estado = 0; abrir(['jL', 'jR']); core.jefeActivo = false; const o = s.enemigos.find(q => q.kind === 'oni'); if (o) { o.hp = o.hpMax; o.estado = 'quieto'; o.x = t.x1 - 330; } }
    });
  };
  E.empujes = function (h, hb) {
    const s = S(); s.N.elem.forEach(c => {
      if (c.t !== 'carreta') return; const top = c.y - c.h, L = c.x - c.w / 2, R = c.x + c.w / 2;
      if (h.y > top + 8 && h.x + h.w / 2 > L && h.x - h.w / 2 < R && h.y - h.h < c.y) {
        if (h.x < c.x) { const ov = h.x + h.w / 2 - L, nx = Math.min(c.max, c.x + ov), mv = nx - c.x; c.x = nx; if (mv < ov) h.x -= ov - mv; if (mv > .01) { c.movio = true; c.prev = true; } }
        else { const ov = R - (h.x - h.w / 2), nx = Math.max(c.min, c.x - ov), mv = c.x - nx; c.x = nx; if (mv < ov) h.x += ov - mv; if (mv > .01) { c.movio = true; c.prev = true; } }
        h.empuja = true; core.cartaEmpujada = true; c.vuelve = false;
      }
    });
  };
  E.apoyos = function (h, antesY, cb) {
    S().N.elem.forEach(c => { if (c.t !== 'carreta') return; const top = c.y - c.h; if (h.x + h.w / 2 > c.x - c.w / 2 + 6 && h.x - h.w / 2 < c.x + c.w / 2 - 6 && antesY <= top + 8 && h.y >= top) cb(top, c); });
  };

  // ---------- dibujo ----------
  function sprite(im, x, y, w, hh, flip) { core.sprite(im, x, y, w, hh, flip); }
  E.dibujarMuro = function (m) {
    const s = S(), c = cx(), x = m.x - s.cam;
    if (m.tipo === 'sello') { if (img.sello) sprite(img.sello, x, m.y, m.w, m.h); return; }
    if (m.tipo === 'reja') {
      const k = m.abierta ? 0 : 1; c.save(); c.globalAlpha = m.abierta ? .0 : 1; c.fillStyle = '#6b8f3a'; for (let i = 0; i < 3; i++) { c.fillRect(x + i * 11, m.y, 8, m.h); } c.fillStyle = '#3d5a1c'; for (let y = m.y + 30; y < m.y + m.h; y += 60) c.fillRect(x - 2, y, m.w + 4, 6); c.restore();
      if (m.abierta) { c.fillStyle = 'rgba(160,200,90,.35)'; c.fillRect(x, m.y, 3, 40); } return;
    }
    const g = c.createLinearGradient(x, 0, x + m.w, 0); g.addColorStop(0, '#6f6a80'); g.addColorStop(1, '#4a455c'); c.fillStyle = g; c.fillRect(x, m.y, m.w, m.h); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let y = m.y; y < m.y + m.h; y += 50) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + m.w, y); c.stroke(); } c.strokeRect(x, m.y, m.w, m.h);
  };
  function dibujarEnemigo(e) {
    const s = S(), c = cx(); if (!e.vivo || e.x < s.cam - 200 || e.x > s.cam + W + 200) return; const x = e.x - s.cam;
    switch (e.kind) {
      case 'ninja': { const b = Math.abs(Math.sin(s.t * 8 + e.x)) * 4; core.porAncho(img.ninja, x, e.y - b, 96, e.dir < 0); break; }
      case 'ninjaAtk': { const im = e.fase === 'carga' ? img.ninjaAtk : img.ninja; if (e.fase === 'aviso') { c.fillStyle = 'rgba(255,60,60,.4)'; c.beginPath(); c.arc(x, e.y - 90, 18 + Math.sin(s.t * 40) * 4, 0, 7); c.fill(); } core.porAncho(im, x, e.y - Math.abs(Math.sin(s.t * 8 + e.x)) * 3, e.fase === 'carga' ? 130 : 96, e.dir < 0); break; }
      case 'tengu': core.porAncho(img.tengu, x, e.y + 20, 120, e.dir < 0); break;
      case 'murcielago': { const f = 1 + Math.sin(s.t * 18 + e.x) * .12; c.save(); c.translate(x, e.y); c.scale(1, f); core.porAncho(img.murcielago, 0, 24, 110, false); c.restore(); break; }
      case 'arana': core.porAncho(img.arana, x, e.y + 8, 84, e.dir < 0); break;
      case 'aranaTecho': { c.strokeStyle = 'rgba(220,220,240,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, e.y - 30); c.stroke(); core.porAncho(img.arana, x, e.y + 34, 88, false); break; }
      case 'fuego': { c.save(); c.globalAlpha = .92; core.porAncho(img.fuego, x, e.y + 40 + Math.sin(s.t * 4 + e.x) * 5, 84, e.dir < 0); c.restore(); break; }
      case 'oni': {
        const ex = e.estado === 'aviso' ? Math.sin(s.t * 60) * 4 : 0; if (e.estado === 'aviso') { c.fillStyle = 'rgba(255,40,40,.28)'; c.fillRect(0, 0, W, H); }
        if (e.inv > 0 && Math.floor(s.t * 20) % 2) break; core.porAncho(img.oni, x + ex, e.y, 200, e.dir < 0); break;
      }
    }
  }
  function dibujarElem(t, capa) {
    const s = S(), c = cx(); const x = (t.x !== undefined ? t.x : 0) - s.cam;
    switch (t.t) {
      case 'carreta': if (capa === 'enemigos' && x > -300 && x < W + 300) { const im = img.carreta; if (im) { const w = 190, hh = im.height * w / im.width; sprite(im, x - w / 2, t.y - hh + 6, w, hh); } } break;
      case 'palanca': if (capa === 'atras' && x > -100 && x < W + 100) { c.fillStyle = '#5a4a3a'; c.fillRect(x - 24, t.y - 18, 48, 18); c.save(); c.translate(x, t.y - 16); c.rotate(t.on ? .8 : -.8); c.fillStyle = '#8b5a2b'; c.fillRect(-4, -54, 8, 54); c.fillStyle = t.on ? '#6f6' : '#f44'; c.beginPath(); c.arc(0, -56, 11, 0, 7); c.fill(); c.restore(); } break;
      case 'roca': if (capa === 'enemigos' && t.activa) { const im = img.rocaG; if (im) { c.save(); c.translate(x, G - t.r); c.rotate(t.x / t.r); c.drawImage(im, -t.r, -t.r, t.r * 2, t.r * 2); c.restore(); } } break;
      case 'kunaiR': if (capa === 'atras' && t.x - s.cam > -200 && t.x - s.cam < W + 200) { const k = img.kunai; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, G - 4, t.w, 8); if (k && t.ext > 0) { c.save(); c.beginPath(); c.rect(x - 10, G - 60, t.w + 20, 60 + 2); c.clip(); const hh = k.height * (t.w + 30) / k.width; sprite(k, x - 15, G + 10 - hh + (1 - t.ext) * 56, t.w + 30, hh); c.restore(); } else { c.fillStyle = 'rgba(255,90,60,.6)'; for (let i = 0; i < 4; i++) c.fillRect(x + 14 + i * 34, G - 3, 8, 4); } } break;
      case 'sierra': if (capa === 'enemigos' && x > -100 && x < W + 100) { c.strokeStyle = 'rgba(90,70,60,.85)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, t.y0 - 70); c.lineTo(x, t.y1 + 60); c.stroke(); const im = img.shuriken; if (im) { const fw = im.width / 8; c.save(); c.translate(x, t.cy); c.rotate(t.a); c.drawImage(im, 4 * fw, 0, fw, im.height, -62, -62, 124, 124 * im.height / fw); c.restore(); } } break;
      case 'viento': if (capa === 'frente' && x > -300 && x < W + 300) { c.save(); for (let i = 0; i < 26; i++) { const ph = (s.t * .6 + i / 26) % 1, yy = t.y + t.h - ph * (t.h + 40), xx = x + t.w / 2 + Math.sin(ph * 12 + i) * t.w * .38; c.globalAlpha = Math.sin(ph * Math.PI) * .8; c.fillStyle = i % 3 ? 'rgba(120,255,230,.9)' : 'rgba(255,216,110,.95)'; c.beginPath(); c.ellipse(xx, yy, 6 + (i % 3), 3, ph * 9, 0, 7); c.fill(); } c.restore(); } break;
      case 'estal': if (capa === 'enemigos' && t.estado !== 'rota' && x > -150 && x < W + 150) { const im = img.estal; if (im) { const w = 90, hh = im.height * w / im.width, sh = t.estado === 'tiembla' ? Math.sin(s.t * 70) * 3 : 0; sprite(im, x - w / 2 + sh, (t.y === undefined ? -10 : t.y), w, hh); } } break;
      case 'tela': if (capa === 'enemigos' && !t.roto && x > -200 && x < W + 200) { const im = img.tela; if (im) sprite(im, x - t.w / 2, t.y - t.h / 2 - 20, t.w * 1.1, im.height * t.w * 1.1 / im.width); } break;
    }
  }
  E.dibujar = function (capa) {
    const s = S(); if (capa === 'enemigos') s.enemigos.forEach(dibujarEnemigo);
    s.N.elem.forEach(t => { if (t.x === undefined || Math.abs(t.x - s.h.x) < 1900) dibujarElem(t, capa); });
  };
  E.luces = function (L) {
    const s = S(); s.enemigos.forEach(e => { if (e.vivo && e.kind === 'fuego' && Math.abs(e.x - s.h.x) < 900) L.push({ x: e.x, y: e.y, r: 110 }); });
  };
  E.ojos = function () {
    const s = S(), c = cx(); s.enemigos.forEach(e => {
      if (!e.vivo || Math.abs(e.x - s.h.x) > 760 || e.x < s.cam - 40 || e.x > s.cam + W + 40) return; if (e.kind !== 'murcielago' && e.kind !== 'arana' && e.kind !== 'aranaTecho' && e.kind !== 'ninja' && e.kind !== 'ninjaAtk') return;
      if (Math.floor(s.t * 1.6 + e.x) % 5 === 0) return; const x = e.x - s.cam, y = e.y - (e.kind === 'ninja' || e.kind === 'ninjaAtk' ? 64 : 0), col = e.kind === 'murcielago' ? '#ffe040' : '#ff3a3a';
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10; c.beginPath(); c.arc(x - 9, y, 3.2, 0, 7); c.arc(x + 9, y, 3.2, 0, 7); c.fill(); c.shadowBlur = 0;
    });
  };
  E.hud = function (c, caja) {
    const s = S(); const o = s.enemigos.find(q => q.kind === 'oni' && q.vivo);
    if (core.jefeActivo && o) { caja(W / 2 - 220, H - 60, 440, 32, 10, 'rgba(10,4,30,.7)', '#ff5a3a'); c.fillStyle = '#ff3a3a'; c.fillRect(W / 2 - 214, H - 54, 428 * clamp(o.hp / o.hpMax, 0, 1), 20); c.font = 'bold 14px ui-monospace,monospace'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ONI ROJO', W / 2, H - 44); }
    const em = s.N.elem.find(t => t.t === 'emb' && t.estado === 1); if (em) { caja(W / 2 - 110, 100, 220, 34, 10, 'rgba(10,4,30,.75)', '#ff9a3a'); c.font = 'bold 15px ui-monospace,monospace'; c.fillStyle = '#ffe27a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OLA ' + (em.ola + 1) + '/' + em.olas.length + ' · quedan ' + s.enemigos.filter(q => q.emb === em && q.vivo).length, W / 2, 117); }
  };
})();
