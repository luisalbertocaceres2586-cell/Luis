/* Ambiente vivo del Nivel 1 (bosque): el decorado reacciona al héroe y esconde pequeños secretos.
 *
 *  · Todo se mece un poco con el viento; al pasar corriendo o al darle un tajo, se agita y suelta hojas, pétalos,
 *    luciérnagas, agua o chispas (según lo que sea).
 *  · Algunos objetos brillan con una estrella ✦: al pegarles con la espada sueltan 3 pergaminos (o curan 1 corazón,
 *    la fuente). Están repartidos por el generador (d.premio), como mucho uno cada ~1500 px.
 *  · Los carteles de madera avisan de lo que viene en los próximos pasos (d.msg), p. ej. "Estacas adelante: ¡salta!".
 *
 * Es solo ambiente: nunca bloquea ni daña, y no cambia la forma del nivel. Si este archivo no se carga, el juego
 * funciona igual (el motor comprueba window.N1amb antes de usarlo). */
(function () {
  'use strict';
  const core = window.N1core; if (!core) return;
  const { W, G, img, clamp, rect, cruza } = core;
  const S = () => core.S();
  const A = {}; window.N1amb = A;

  // qué hace cada tipo de decorado: amp = cuánto se mece (rad), imp = fuerza del empujón, piv = de dónde cuelga, par = partículas
  const MEC = {
    bambu: { amp: .11, imp: 1.0, piv: 'base', par: 'hoja', viento: .22 }, pino: { amp: .03, imp: .8, piv: 'base', par: 'hoja', viento: .1 },
    cerezo: { amp: .03, imp: .9, piv: 'base', par: 'petalo', viento: .12 }, helechos: { amp: .07, imp: 1.0, piv: 'base', par: 'luci', viento: .2 },
    farolitos: { amp: .09, imp: 1.0, piv: 'colgar', par: 'chispa', viento: .3 }, estandarte: { amp: .08, imp: 1.0, piv: 'colgar', par: 'chispa', viento: .35 },
    cartel: { amp: .05, imp: 1.0, piv: 'base', par: 'hoja', viento: 0 }, valla: { amp: .012, imp: .8, piv: 'base', par: 'hoja', viento: 0 },
    rocas: { amp: 0, imp: .8, piv: 'base', par: 'chispa', viento: 0 }, toro: { amp: 0, imp: .8, piv: 'base', par: 'chispa', viento: 0 },
    kitsune: { amp: 0, imp: .8, piv: 'base', par: 'chispa', viento: 0 }, fuente: { amp: 0, imp: .8, piv: 'base', par: 'agua', viento: 0 }
  };
  const COL = { hoja: ['#8fd14f', '#5fae3a', '#a6d13f'], petalo: ['#ff8fb8', '#ffc2d8', '#ffe1ec'], luci: ['#b5f23d', '#e8ff7a'], agua: ['#8fe3ff', '#c9f3ff', '#5ccbf0'], chispa: ['#ffe27a', '#fff3b8', '#ffd54a'] };
  let petalos = [];

  function dim(d) { const q = core.DECO && core.DECO[d.tipo]; if (!q) return null; const im = img[q[0]]; if (!im) return null; const w = q[1]; return { w, hh: im.height * w / im.width }; }
  function caja(d, t) { const m = dim(d); if (!m) return null; return rect(d.x - m.w * .4, (d.techo ? 0 : G + 4 - m.hh), m.w * .8, m.hh); }
  function soltar(tipo, x, y, n, vx) {
    const cols = COL[tipo] || COL.hoja;
    for (let i = 0; i < n; i++) petalos.push({ x: x + (Math.random() - .5) * 60, y: y + (Math.random() - .5) * 50, vx: (vx || 0) * 40 + (Math.random() - .5) * 90, vy: -30 - Math.random() * 70, t: 1.1 + Math.random() * .9, t0: 2, ph: Math.random() * 6, col: cols[i % cols.length], r: tipo === 'luci' ? 3 : 4 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - .5) * 8, tipo });
  }
  function abrir(d) {
    const s = S(), m = dim(d); d.abierto = true; s.secretos = (s.secretos || 0) + 1; const top = G - (m ? m.hh : 120);
    core.chispas(d.x, G - (m ? m.hh * .5 : 60), 16, '#ffe27a'); s.shake = Math.max(s.shake || 0, .05);
    if (d.premio === 'cura' && s.h.vida < s.vidaMax) { s.h.vida = Math.min(s.vidaMax, s.h.vida + 1); core.texto(d.x, top - 10, '+1 ♥', '#7dff9a'); s.aviso = { t: 1.6, s: '¡EL AGUA TE CURA!' }; return; }
    const n = d.premio === 'cura' ? 2 : 3;
    for (let k = 0; k < n; k++) s.items.push({ x: d.x + (k - (n - 1) / 2) * 48, y: G - 74 - (k % 2) * 22, tipo: 'pergamino', tomado: false });
    core.texto(d.x, top - 10, '¡TESORO!', '#ffe27a'); s.aviso = { t: 1.6, s: '¡UN SECRETO!' };
  }

  A.paso = function (dt) {
    const s = S(); if (!s || s.nivel2 || !s.N) return; const h = s.h, tj = s.tajo;
    s.N.deco.forEach(d => {
      const m = MEC[d.tipo]; if (!m || d.x < s.cam - 500 || d.x > s.cam + W + 500) return;
      const e = d.e || (d.e = { sw: 0, v: 0, roce: 0, golpe: 0 }); const dm = dim(d); if (!dm) return;
      e.v += (-62 * e.sw - 5.2 * e.v) * dt; e.sw += e.v * dt; e.roce -= dt; e.golpe -= dt;
      if (e.roce <= 0 && Math.abs(h.x - d.x) < dm.w * .38 && h.y > G - dm.hh * .8 && Math.abs(h.vx) > 70 && !h.muerto) {   // pasar corriendo
        e.roce = .6; e.v += (h.vx > 0 ? 1 : -1) * 1.5 * m.imp; if (m.par !== 'chispa' && m.par !== 'agua') soltar(m.par, d.x, G - dm.hh * .55, 2, h.vx > 0 ? 1 : -1);
      }
      if (e.golpe <= 0 && tj && cruza(tj, caja(d))) {     // un tajo
        e.golpe = .45; e.v += (h.dir > 0 ? 1 : -1) * 3.2 * m.imp; soltar(m.par, d.x, G - dm.hh * .55, m.par === 'luci' ? 9 : 11, h.dir);
        if (m.par === 'chispa') core.chispas(d.x, G - dm.hh * .5, 7, '#cfd6ff'); if (m.par === 'agua') core.chispas(d.x, G - dm.hh * .45, 8, '#8fe3ff');
        if (d.premio && !d.abierto) abrir(d);
      }
    });
    petalos.forEach(p => { p.t -= dt; p.vy += 55 * dt; p.vx *= (1 - .6 * dt); p.x += (p.vx + Math.sin(s.t * 4 + p.ph) * 26) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; });
    petalos = petalos.filter(p => p.t > 0);
  };

  // transformación de un decorado (balanceo con el viento + empujones). null si no se mueve
  A.pose = function (d, hh) {
    const m = MEC[d.tipo], s = S(); if (!m) return null; const e = d.e; const sw = (e ? e.sw : 0), v = Math.sin(s.t * 1.3 + d.x * .011) * m.viento;
    if (!sw && !v) return null;
    if (m.amp > 0) return { py: m.piv === 'colgar' ? (d.tipo === 'estandarte' ? G - hh - 60 : 0) : G + 4, rot: (sw + v * .18) * m.amp, sy: 1 };   // los farolitos cuelgan del borde de arriba
    return { py: G + 4, rot: 0, sy: 1 - sw * .025 };   // rocas, estatuas y fuente: solo un pequeño "bote"
  };

  // estrella de los secretos + cartel que avisa (se dibuja justo después del sprite)
  A.extra = function (d, x, top, w) {
    const s = S();
    if (d.premio && !d.abierto) {
      const k = s.t * 2.2 + d.x * .01, a = .8 + .2 * Math.sin(k * 2), cx = core.cx, sx = x + Math.sin(k) * w * .08, sy = top - 8 + Math.sin(k * 1.3) * 5;
      cx.save(); cx.globalAlpha = a; cx.translate(sx, sy); const hg = cx.createRadialGradient(0, 0, 2, 0, 0, 30); hg.addColorStop(0, 'rgba(255,240,170,.75)'); hg.addColorStop(1, 'rgba(255,240,170,0)'); cx.fillStyle = hg; cx.beginPath(); cx.arc(0, 0, 30, 0, 7); cx.fill();
      cx.rotate(Math.sin(k) * .4); cx.fillStyle = '#ffd54a'; cx.shadowColor = '#fff3b8'; cx.shadowBlur = 14; cx.strokeStyle = '#7a4b00'; cx.lineWidth = 2;
      cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4.5 : 16; cx.lineTo(Math.cos(i * Math.PI / 4 - Math.PI / 2) * r, Math.sin(i * Math.PI / 4 - Math.PI / 2) * r); } cx.closePath(); cx.stroke(); cx.fill();
      cx.shadowBlur = 0; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, 0, 3, 0, 7); cx.fill(); cx.restore();
    }
    if (d.tipo === 'cartel' && d.msg) {
      const dist = Math.abs(s.h.x - d.x), al = clamp((250 - dist) / 90, 0, 1); if (al <= 0) return;
      const cx = core.cx; cx.save(); cx.globalAlpha = al; cx.font = 'bold 16px ui-monospace,monospace'; const tw = Math.min(W - 40, cx.measureText(d.msg).width + 34), bx = clamp(x - tw / 2, 12, W - tw - 12), by = top - 58 - (1 - al) * 10;
      core.caja(bx, by, tw, 40, 10, 'rgba(18,8,51,.9)', '#ffc93c');
      cx.beginPath(); cx.moveTo(x - 9, by + 40); cx.lineTo(x + 9, by + 40); cx.lineTo(x, by + 52); cx.closePath(); cx.fillStyle = 'rgba(18,8,51,.9)'; cx.fill();
      cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(d.msg, bx + tw / 2, by + 21); cx.restore();
    }
  };

  A.dibujar = function () {   // partículas del ambiente (delante del decorado)
    const s = S(), cx = core.cx; if (!petalos.length) return;
    petalos.forEach(p => {
      const x = p.x - s.cam; if (x < -20 || x > W + 20) return; cx.globalAlpha = clamp(p.t * 2.2, 0, 1) * .95;
      if (p.tipo === 'luci') { cx.fillStyle = 'rgba(200,255,90,.35)'; cx.beginPath(); cx.arc(x, p.y, p.r * 2.2, 0, 7); cx.fill(); cx.fillStyle = p.col; cx.beginPath(); cx.arc(x, p.y, p.r, 0, 7); cx.fill(); }
      else if (p.tipo === 'agua' || p.tipo === 'chispa') { cx.fillStyle = p.col; cx.beginPath(); cx.arc(x, p.y, p.r * .8, 0, 7); cx.fill(); }
      else { cx.save(); cx.translate(x, p.y); cx.rotate(p.rot); cx.fillStyle = p.col; cx.beginPath(); cx.ellipse(0, 0, p.r * 1.5, p.r * .6, 0, 0, 7); cx.fill(); cx.restore(); }
    }); cx.globalAlpha = 1;
  };

  // ¿hay un secreto sin abrir cerca (para el cartel de ayuda)?
  A.cercaPremio = function (r) { const s = S(); return !!(s && s.N && s.N.deco.some(d => d.premio && !d.abierto && Math.abs(d.x - s.h.x) < r)); };
  A.reiniciar = function () { petalos = []; };
})();
