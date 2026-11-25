/* Director de eventos del Nivel 1 — Fase 2 "Un mundo vivo e impredecible".
 *
 * El director MIRA cómo juega el estudiante (vida, errores, racha de acertijos, ritmo, muertes, daño) y, mientras juega,
 * SORTEA eventos en tiempo real. No se deciden al generar el nivel: dos partidas con la misma semilla no son iguales.
 *
 *   🌪️ Tormenta de viento   ráfagas que empujan al héroe de lado, cambiando de dirección
 *   🧊 Suelo resbaladizo     el suelo patina: arrancas y frenas despacio
 *   🌙 Gravedad lunar         saltos más altos y caída lenta
 *   🌆 Anochecer (bosque)     oscurece: solo ves lo que alumbra tu antorcha
 *   🪨 Lluvia de rocas        sombras rojas avisan dónde cae cada roca
 *   🔥 Bosque en llamas       un muro de fuego te persigue hasta el próximo refugio (acertijo, jefe...)
 *
 * Reglas de juego limpio:
 *  - Quien va muy bien recibe eventos más difíciles y seguidos; quien va mal, más suaves y espaciados; y si anda muy flojo de vida
 *    el director no lanza nada y hasta le regala un onigiri por delante.
 *  - Los acertijos son zona de calma: los eventos se congelan mientras estás frente a uno, y el fuego se apaga antes de llegar.
 *  - Nunca durante el jefe, una emboscada o la roca gigante.
 *
 * Este archivo trae decisión, efectos y dibujo. motor.js solo llama a unos ganchos (N1dir.paso, fondo, mundo, encima, hud, luces...)
 * y lee los modificadores S.mod (gravedad, fricción, viento, noche). La parte "pura" se prueba en Node. */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.N1dir = api;
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const G = 560, W = 1280, H = 720;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

  const EVENTOS = [
    { id: 'viento', icono: '🌪️', nombre: 'TORMENTA DE VIENTO', dif: 1, zonas: ['bosque', 'cueva'], dur: [16, 24], tip: '¡Viento! Te empuja de lado: avanza con fuerza o aprovecha la ráfaga' },
    { id: 'gravedad', icono: '🌙', nombre: 'GRAVEDAD LUNAR', dif: 1, zonas: ['bosque', 'cueva'], dur: [14, 20], tip: 'Gravedad baja: saltas más alto y flotas al caer' },
    { id: 'resbala', icono: '🧊', nombre: 'SUELO RESBALADIZO', dif: 2, zonas: ['bosque', 'cueva'], dur: [18, 26], tip: 'El suelo patina: suelta las flechas con anticipación' },
    { id: 'noche', icono: '🌆', nombre: 'ANOCHECER', dif: 2, zonas: ['bosque'], dur: [20, 28], tip: 'Anochece: solo ves lo que alumbra tu antorcha' },
    { id: 'rocas', icono: '🪨', nombre: 'LLUVIA DE ROCAS', dif: 2, zonas: ['bosque', 'cueva'], dur: [12, 18], tip: '¡Lluvia de rocas! Corre de las sombras rojas' },
    { id: 'fuego', icono: '🔥', nombre: 'BOSQUE EN LLAMAS', dif: 3, zonas: ['bosque'], dur: [60, 60], tip: '¡El bosque arde! Corre a la derecha sin parar hasta el refugio' }
  ];
  const POR_ID = {}; EVENTOS.forEach(e => { POR_ID[e.id] = e; });
  const DUROS = ['carreta', 'palanca', 'emboscada', 'roca'];   // módulos donde el fuego nunca debe alcanzarte

  // =================== parte pura (se prueba en Node) ===================
  /* "Dominio" del momento, de 0 (apurado) a 1 (dominando el nivel).
   * m: { vida: 0..1, errores (últimos 60 s), racha (acertijos limpios seguidos), ritmo (px/s), muertes (últimos 120 s), danio (últimos 30 s) } */
  function evaluar(m) {
    return clamp(.35 * clamp(m.vida, 0, 1) + .25 * (1 - Math.min(1, m.errores / 3)) + .15 * Math.min(1, m.racha / 4) + .25 * Math.min(1, m.ritmo / 70)
      - .25 * Math.min(1, m.muertes / 2) - .15 * Math.min(1, m.danio / 3), 0, 1);
  }
  const intervalo = (dom, zona, r) => lerp(56, 22, dom) * (zona === 'cueva' ? 1.35 : 1) * (.8 + .4 * r);   // segundos de calma entre eventos
  const objetivoDif = (dom, zona) => 1 + 2 * dom - (zona === 'cueva' ? .4 : 0);                           // dificultad que se busca (1..3)
  /* pesos del sorteo: se prefieren eventos cuya dificultad se parece a la buscada; no se repite el último y se penaliza lo reciente */
  function pesos(dom, zona, ultimos, excluir) {
    const obj = objetivoDif(dom, zona), out = [];
    EVENTOS.forEach(ev => {
      if (ev.zonas.indexOf(zona) < 0 || (excluir && excluir.indexOf(ev.id) >= 0)) return;
      let w = Math.exp(-Math.pow(ev.dif - obj, 2) / 1.1);
      if (ultimos[0] === ev.id) w *= .06; else if (ultimos.slice(0, 3).indexOf(ev.id) >= 0) w *= .5;
      out.push({ id: ev.id, w });
    });
    return out;
  }
  function elegir(dom, zona, ultimos, excluir, r) {
    const p = pesos(dom, zona, ultimos, excluir); if (!p.length) return null;
    let t = p.reduce((a, q) => a + q.w, 0) * r; for (const q of p) { t -= q.w; if (t <= 0) return q.id; } return p[p.length - 1].id;
  }
  /* viento: -1..1, con calmas y ráfagas; cambia de dirección solo */
  const ondaViento = (t, fase) => clamp(.62 * Math.sin(t * .42 + fase) + .5 * Math.sin(t * 1.25 + fase * 2.3), -1, 1);
  const zonaDe = (N, x) => (x > N.cueva.x + 120 ? 'cueva' : 'bosque');
  /* superficie más alta bajo x (suelo o plataforma), o null si es un hueco */
  function superficie(N, x) {
    let y = null;
    for (const s of N.suelo) if (x >= s.x0 && x <= s.x1) { y = G; break; }
    for (const p of N.plat) {
      if (p.estado === 'caida') continue; const px = p.X !== undefined ? p.X : p.x, py = (p.Y !== undefined ? p.Y : p.y) + (p.cy || 0);
      if (x >= px && x <= px + p.w && (y === null || py < y)) y = py;
    }
    return y;
  }
  /* hasta dónde puede avanzar el fuego: se apaga antes del próximo acertijo, del jefe o de un módulo "duro" (carreta, palanca, emboscada, roca) */
  function barreraFuego(N, x) {
    let b = Infinity;
    (N.est || []).forEach(e => { if (!e.resuelta && e.x0 > x) b = Math.min(b, e.x0 - 200); });
    (N.elem || []).forEach(t => { if (t.t === 'jefe' && t.x0 > x) b = Math.min(b, t.x0 - 450); });
    (N.especiales || []).forEach(sp => { if (DUROS.indexOf(sp.tipo) >= 0 && sp.x0 > x) b = Math.min(b, sp.x0 - 100); });
    return b;
  }

  // =================== navegador ===================
  const core = () => (typeof window !== 'undefined' ? window.N1core : null);
  const S = () => { const c = core(); return c && c.S ? c.S() : null; };
  const ctx = () => core().cx;
  const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  function iniciar(sx, o) {
    const url = typeof location !== 'undefined' ? location.search : '';
    const off = (o && o.director === false) || /[?&]director=0/.test(url), ev = (o && o.evento) || (/[?&]evento=(\w+)/.exec(url) || [])[1];
    const rng = (o && o.directorRng) || Math.random;
    sx.dir = {
      auto: !off, rng, dom: .75, espera: 30 + rng() * 25, activo: null, k: 0, hist: [], contados: 0, regalos: 0, regaloT: -999, rocas: [], fuego: null, vpos: 0,
      pendiente: ev && POR_ID[ev] ? ev : null, forzado: false, debug: /[?&]dirdebug=1/.test(url),
      m: { errT: [], dmT: [], muT: [], racha: 0, xMax: 0, xs: [], acu: 0, ult: { errores: 0, limpios: 0 }, ritmo: 50 }
    };
  }
  const enEstacion = s => s.est.some(e => !e.resuelta && s.h.x > e.x0 - 120 && s.h.x < e.x0 + e.ancho + 60);
  const enJefe = s => { const j = s.N.elem.find(t => t.t === 'jefe'); return !!(core().jefeActivo || (j && s.h.x > j.x0 - 500 && s.h.x < j.x1 + 250)); };

  function observar(dt) {
    const s = S(), D = s.dir, h = s.h, M = D.m, rec = (arr, w) => { while (arr.length && s.t - arr[0] > w) arr.shift(); return arr.length; };
    for (let i = M.ult.errores; i < s.errores; i++) M.errT.push(s.t); if (s.errores > M.ult.errores) M.racha = 0;
    if (s.limpios > M.ult.limpios) M.racha += s.limpios - M.ult.limpios;
    M.ult.errores = s.errores; M.ult.limpios = s.limpios; M.xMax = Math.max(M.xMax, h.x);
    M.acu += dt; if (M.acu >= 1) { M.acu = 0; M.xs.push({ t: s.t, x: M.xMax }); if (M.xs.length > 90) M.xs.shift(); }
    const ref = M.xs.find(q => s.t - q.t <= 40); M.ritmo = M.xs.length >= 10 && ref ? (M.xMax - ref.x) / Math.max(5, s.t - ref.t) : 50;
    const m = { vida: h.vida / s.vidaMax, errores: rec(M.errT, 60), racha: M.racha, ritmo: M.ritmo, muertes: rec(M.muT, 120), danio: rec(M.dmT, 30) };
    const dom = evaluar(m); D.dom = D.visto ? D.dom + (dom - D.dom) * Math.min(1, dt * .6) : dom; D.visto = true; D.metricas = m;   // el primer paso toma el valor real (no arranca "dominando")
  }
  function puedeLanzar() {
    const s = S(), h = s.h, c = core();
    return s.t > 25 && h.x > 1400 && !s.fin && h.muerto <= 0 && h.aturdido <= 0 && !c.emboscadaActiva && !c.jefeActivo && !c.rocaActiva && !enEstacion(s) && !enJefe(s)
      && s.N.meta.x - h.x > 700 && s.dir.dom >= .28 && h.vida >= 2;
  }
  const excluidos = s => {
    const h = s.h, N = s.N, ex = [], zona = zonaDe(N, h.x);
    if (zona !== 'bosque' || barreraFuego(N, h.x) - h.x < 1800 || h.x < 1500) ex.push('fuego');
    if (zona !== 'bosque' || s.osc > .2 || h.x > N.cueva.x - 1500) ex.push('noche');
    return ex;
  };
  function lanzar(id, forzar) {
    const s = S(), D = s.dir, h = s.h, def = POR_ID[id]; if (!def || D.activo) return false; const r = D.rng;
    const a = { id, def, t: 0, dur: lerp(def.dur[0], def.dur[1], r()), fase: r() * 6.28, amp: 150 + 70 * D.dom, sale: false, sig: 1.2 };
    if (id === 'fuego') {
      const b = barreraFuego(s.N, h.x); if (!forzar && b - h.x < 1800) return false;
      D.fuego = { x: Math.max(40, h.x - 650), h0: h.x, v: 190 + 50 * D.dom, barrera: Math.min(b, s.N.meta.x), tocado: false, t: 0 };
    }
    D.activo = a; D.forzado = !!forzar; D.hist.unshift(id); D.contados++; s.aviso = { t: 3.2, s: def.icono + ' ' + def.nombre };
    return true;
  }
  function salir(a, motivo) {
    const s = S(), D = s.dir; if (!a || a.sale) return; a.sale = true; a.motivo = motivo;
    if (a.id === 'fuego' && D.fuego && !D.fuego.tocado && (motivo === 'natural' || motivo === 'refugio')) {
      s.pergaminos += 5; core().texto(s.h.x, s.h.y - 175, '+5 📜 ¡A SALVO!', '#ffd54a'); core().chispas(s.h.x, s.h.y - 60, 24, '#ffd54a'); s.aviso = { t: 2.6, s: '🔥 ¡ESCAPASTE DEL FUEGO!  +5 📜' };
    }
    D.espera = intervalo(D.dom, zonaDe(s.N, s.h.x), D.rng());
  }
  function crearRoca() {
    const s = S(), D = s.dir, h = s.h, r = D.rng;
    for (let i = 0; i < 6; i++) {
      const x = h.x + (r() < .6 ? 120 + r() * 420 : -320 + r() * 520), y = superficie(s.N, x); if (y === null) continue;
      D.rocas.push({ x, y, tAv: 1.1, caida: .55, estado: 'aviso', r: 30 + r() * 12, ang: r() * 6.28, f: [0, 1, 2, 3, 4, 5, 6].map(() => .8 + r() * .3), yy: -120 }); return;
    }
  }
  function actualizarRoca(rk, dt) {
    const s = S(), h = s.h; rk.tAv -= dt;
    rk.yy = rk.tAv > rk.caida ? -120 : rk.y - rk.r - (rk.y - rk.r + 120) * Math.pow(clamp(rk.tAv / rk.caida, 0, 1), 2);
    if (rk.yy > -60 && s.hb && h.muerto <= 0) {
      const q = rk.r * .8;
      if (core().cruza(s.hb, { x: rk.x - q, y: rk.yy - q, w: q * 2, h: q * 2 })) core().danio('roca', h.x < rk.x ? -1 : 1);
    }
    if (rk.tAv <= 0) { core().chispas(rk.x, rk.y, 14, '#b9a98a'); if (Math.abs(h.x - rk.x) < 520) s.shake = Math.max(s.shake, .12); rk.estado = 'fin'; }
  }
  function regalo() {
    const s = S(), D = s.dir, h = s.h, M = D.m;
    if (s.t - D.regaloT < 75 || h.muerto > 0 || !h.suelo || enEstacion(s)) return;
    if (!(h.vida <= 1 || (M.muT.length >= 2 && h.vida <= 3))) return;
    for (let d = 420; d <= 900; d += 120) {
      const x = h.x + d; if (superficie(s.N, x) !== G) continue;
      s.items.push({ x, y: G - 70, tipo: 'onigiri', tomado: false, regalo: true }); D.regaloT = s.t; D.regalos++;
      core().texto(x, G - 150, '🍙 ¡REGALO!', '#7dff9a'); s.aviso = { t: 2.6, s: '🍙 UN ONIGIRI TE ESPERA ADELANTE' }; return;
    }
  }

  /* un paso del director (lo llama motor.js al inicio de cada paso) */
  function paso(dt) {
    const s = S(), D = s && s.dir; if (!D) return;
    const h = s.h, N = s.N, c = core(); observar(dt); regalo();
    if (D.pendiente && s.t > 1.5 && !D.activo) { lanzar(D.pendiente, true); D.pendiente = null; }
    let a = D.activo;
    if (!a && D.auto && puedeLanzar()) {
      D.espera -= dt;
      if (D.espera <= 0) { const id = elegir(D.dom, zonaDe(N, h.x), D.hist, excluidos(s), D.rng()); if (!(id && lanzar(id))) D.espera = 6; a = D.activo; }
    }
    if (a) {
      const pausa = enEstacion(s) && !D.forzado;
      if (!a.sale) {
        if ((enJefe(s) || c.emboscadaActiva || c.rocaActiva) && !D.forzado) salir(a, 'corte');
        else if ((a.id === 'fuego' || a.id === 'rocas') && h.vida <= 1) salir(a, 'piedad');           // si anda al límite, se corta lo peligroso
        else if (a.id === 'fuego' && pausa) salir(a, 'refugio');                                       // llegó al acertijo: a salvo
        else { if (!pausa) a.t += dt; if (a.t >= a.dur) salir(a, 'natural'); }
      }
      const meta = !a.sale && !pausa ? 1 : 0; D.k = clamp(D.k + clamp(meta - D.k, -dt / 1.2, dt / 1.6), 0, 1);
      if (a.sale && D.k <= .02 && !D.rocas.length) { D.activo = null; D.fuego = null; D.k = 0; D.forzado = false; }
    }
    // modificadores físicos que lee motor.js
    const m = s.mod; m.g = 1; m.gc = 1; m.jv = 1; m.ag = 1; m.fr = 1; m.vv = 0; m.noche = 0;
    a = D.activo;
    if (a) {
      const k = D.k;
      if (a.id === 'viento') { m.vv = a.amp * k * ondaViento(a.t, a.fase); D.vpos += m.vv * dt; }
      else if (a.id === 'resbala') { m.ag = 1 - .78 * k; m.fr = 1 - .88 * k; }
      else if (a.id === 'gravedad') { m.g = 1 - .55 * k; m.gc = 1 - .3 * k; m.jv = 1 - .23 * k; }
      else if (a.id === 'noche') m.noche = .82 * k;
      else if (a.id === 'rocas' && !a.sale && k > .6) { a.sig -= dt; if (a.sig <= 0) { a.sig = lerp(1.5, .7, D.dom) * (.7 + .6 * D.rng()); crearRoca(); } }
    }
    D.rocas.forEach(rk => actualizarRoca(rk, dt)); D.rocas = D.rocas.filter(rk => rk.estado !== 'fin');
    const f = D.fuego;
    if (f && a) {
      if (!a.sale) { f.x += f.v * dt; f.t += dt; if (f.x >= f.barrera) salir(a, 'natural'); }
      if (h.x < f.x + 24 && h.muerto <= 0) { f.tocado = true; c.danio('fuego', 1); }
      if (h.x - f.x < 500) s.shake = Math.max(s.shake, .03);
    }
  }
  const alDanio = () => { const s = S(); if (s && s.dir) s.dir.m.dmT.push(s.t); };
  function alMuerte() { const s = S(); if (s && s.dir) s.dir.m.muT.push(s.t); }
  function alReaparecer() {
    const s = S(), D = s && s.dir; if (!D || !D.activo) return;
    if (D.activo.id === 'fuego' || D.activo.id === 'rocas') salir(D.activo, 'reaparece');
    D.rocas = [];
  }
  const contados = () => { const s = S(); return s && s.dir ? s.dir.contados : 0; };

  // =================== dibujo ===================
  function fondo() {
    const s = S(), D = s.dir, c = ctx(); if (!D) return; const n = s.mod.noche / .82;
    if (n > .01) { const g = c.createLinearGradient(0, 0, 0, H * .85); g.addColorStop(0, 'rgba(25,8,70,' + .55 * n + ')'); g.addColorStop(.7, 'rgba(220,90,70,' + .28 * n + ')'); g.addColorStop(1, 'rgba(255,150,60,' + .35 * n + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (D.fuego) { c.fillStyle = 'rgba(255,70,10,' + .16 * D.k + ')'; c.fillRect(0, 0, W, H); }
  }
  function dibujarRoca(c, rk, cam) {
    c.save(); c.translate(rk.x - cam, rk.yy); c.rotate(rk.ang + rk.tAv * 3);
    c.beginPath(); rk.f.forEach((q, i) => { const a = i / rk.f.length * 6.2832; const px = Math.cos(a) * rk.r * q, py = Math.sin(a) * rk.r * q; if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath();
    c.fillStyle = '#7d6f5e'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#4b4034'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(-rk.r * .3, -rk.r * .3, rk.r * .3, 0, 7); c.fill(); c.restore();
  }
  function muroDeFuego(c, f, k, t, cam) {
    const fx = f.x - cam; if (fx < -400) return;
    const lg = c.createLinearGradient(fx - 320, 0, fx + 10, 0); lg.addColorStop(0, 'rgba(255,60,0,0)'); lg.addColorStop(1, 'rgba(255,90,10,' + .38 * k + ')'); c.fillStyle = lg; c.fillRect(fx - 320, 0, 330, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const bx = fx - i * 11, vivo = 1 - i / 26, hh = (110 + 190 * vivo + (i % 4 === 0 ? 200 : 0)) * (.75 + .25 * Math.sin(t * 9 + i * 1.7)) * k, w = 46 + (i % 3) * 10;
      const g = c.createLinearGradient(0, G + 10, 0, G + 10 - hh); g.addColorStop(0, 'rgba(255,170,40,' + .5 * vivo * k + ')'); g.addColorStop(.5, 'rgba(255,70,10,' + .42 * vivo * k + ')'); g.addColorStop(1, 'rgba(150,15,0,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - w / 2, G + 10); c.quadraticCurveTo(bx - w * .1 + Math.sin(t * 7 + i) * 8, G - hh * .5, bx + Math.sin(t * 8 + i * 2) * 10, G + 10 - hh); c.quadraticCurveTo(bx + w * .1, G - hh * .5, bx + w / 2, G + 10); c.fill();
    }
    c.restore();
    c.fillStyle = 'rgba(255,170,60,' + .8 * k + ')'; for (let i = 0; i < 12; i++) { const px = fx - 20 - ((t * 140 + i * 83) % 320), py = G - ((t * 90 + i * 57) % 360); c.fillRect(px, py, 3, 3); }
  }
  function mundo() {
    const s = S(), D = s.dir, c = ctx(), cam = s.cam, a = D.activo, k = D.k; if (!D) return;
    if (a && a.id === 'resbala' && k > .01) {
      s.N.suelo.forEach(g => { const x0 = Math.max(g.x0 - cam, 0), x1 = Math.min(g.x1 - cam, W); if (x1 <= x0) return; c.fillStyle = 'rgba(170,220,255,' + .42 * k + ')'; c.fillRect(x0, G - 4, x1 - x0, 11);
        for (let i = 0; i < 9; i++) { const px = ((i * 143 + s.t * 70) % (W + 200)) - 100; if (px < x0 || px > x1) continue; c.fillStyle = 'rgba(255,255,255,' + .5 * k + ')'; c.fillRect(px, G - 2, 36, 2); } });
    }
    D.rocas.forEach(rk => { if (rk.yy > -100 && rk.x - cam > -80 && rk.x - cam < W + 80) dibujarRoca(c, rk, cam); });
    if (D.fuego) muroDeFuego(c, D.fuego, k, s.t, cam);
  }
  function encima() {
    const s = S(), D = s.dir, c = ctx(), cam = s.cam, a = D.activo, k = D.k, t = s.t, h = s.h; if (!D) return;
    D.rocas.forEach(rk => {                                                  // avisos rojos de dónde va a caer cada roca
      if (rk.tAv <= 0) return; const x = rk.x - cam; if (x < -60 || x > W + 60) return; const p = clamp(1 - rk.tAv / 1.1, 0, 1), al = .5 + .4 * Math.abs(Math.sin(t * (6 + p * 12)));
      c.strokeStyle = 'rgba(255,60,60,' + al + ')'; c.fillStyle = 'rgba(255,40,40,' + al * .45 + ')'; c.lineWidth = 3; const r = lerp(10, rk.r + 14, p);
      c.beginPath(); c.ellipse(x, rk.y, r * 1.5, r * .4, 0, 0, 7); c.fill(); c.stroke(); c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,230,120,' + al + ')'; c.fillText('!', x, rk.y - 28 - p * 20);
    });
    if (!a) return;
    if (a.id === 'viento' && Math.abs(s.mod.vv) > 8) {
      const v = s.mod.vv, sg = v > 0 ? 1 : -1, al = Math.min(.5, Math.abs(v) / 260) * .65; c.strokeStyle = 'rgba(255,255,255,' + al + ')'; c.lineWidth = 2;
      for (let i = 0; i < 28; i++) { const q = W + 200, x = (((i * 173.7 + D.vpos * (1 + (i % 3) * .3) * 1.6) % q) + q) % q - 100, y = 30 + (i * 61.3) % (H - 150), len = 60 + Math.abs(v) * .5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - sg * len, y + 2); c.stroke(); }
    }
    if (a.id === 'resbala' && k > .01) {
      const cueva = s.mezcla > .5; c.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) { const x = (i * 97.3 + t * 90) % (W + 100) - 50, y = ((i * 53.7 + t * (cueva ? 40 : 520)) % (H + 40)) - 20;
        if (cueva) { c.fillStyle = 'rgba(220,245,255,' + .7 * k * (.5 + .5 * Math.sin(t * 3 + i)) + ')'; c.fillRect(x, G - 14 - (i * 7) % 60, 3, 3); } else { c.strokeStyle = 'rgba(175,215,255,' + .45 * k + ')'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6, y + 22); c.stroke(); } }
    }
    if (a.id === 'gravedad' && k > .01) {
      for (let i = 0; i < 26; i++) { const x = (i * 131.7 + Math.sin(t * .6 + i) * 24) % W, y = H - ((t * 28 * (1 + (i % 3) * .5) + i * 83) % (H + 40)), r = 2 + (i % 4); c.fillStyle = 'rgba(210,190,255,' + .5 * k + ')'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      const v = c.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * .95); v.addColorStop(0, 'rgba(120,60,220,0)'); v.addColorStop(1, 'rgba(120,60,220,' + .22 * k + ')'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
    if (a.id === 'noche' && k > .01) {
      for (let i = 0; i < 18; i++) { const x = (i * 97.3 + cam * .5 + Math.sin(t * .7 + i) * 40) % W, y = 200 + (i * 37) % 320 + Math.sin(t * 1.1 + i * 2) * 30, al = (.55 + .4 * Math.sin(t * 2 + i * 1.3)) * k;
        const g = c.createRadialGradient(x, y, 0, x, y, 20); g.addColorStop(0, 'rgba(255,240,120,' + al + ')'); g.addColorStop(1, 'rgba(255,240,120,0)'); c.fillStyle = g; c.fillRect(x - 20, y - 20, 40, 40); }
    }
    if (D.fuego) {
      const f = D.fuego, d = h.x - f.x, al = clamp(1 - (d - 250) / 850, 0, .8) * k;
      if (al > .01) { const g = c.createLinearGradient(0, 0, 240, 0); g.addColorStop(0, 'rgba(255,70,10,' + al + ')'); g.addColorStop(1, 'rgba(255,70,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 240, H); }
      if (f.x < cam && k > .05) { c.font = 'bold ' + Math.round(26 + 10 * Math.sin(t * 8) + al * 16) + 'px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,230,120,' + (.6 + .4 * Math.sin(t * 8)) * k + ')'; c.fillText('🔥◀', 14, H * .45); }
    }
  }
  function hud(c, caja) {
    const s = S(), D = s.dir; if (!D) return;
    if (D.activo) {
      const a = D.activo, y = s.osc > .3 ? 92 : 58; caja(W - 220, y, 200, 30, 8, 'rgba(10,4,30,.6)', a.id === 'fuego' ? 'rgba(255,90,20,.85)' : 'rgba(160,200,255,.7)');
      c.font = 'bold 11px ui-monospace,monospace'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(a.def.icono + ' ' + a.def.nombre, W - 212, y + 4);
      const fr = a.id === 'fuego' && D.fuego ? clamp((s.h.x - D.fuego.h0) / Math.max(1, D.fuego.barrera - D.fuego.h0), 0, 1) : clamp(1 - a.t / a.dur, 0, 1);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(W - 212, y + 21, 184, 5); c.fillStyle = a.id === 'fuego' ? '#ff8a3a' : '#9fd0ff'; c.fillRect(W - 212, y + 21, 184 * fr, 5);
    }
    if (D.debug) {
      const m = D.metricas || {}; c.font = '11px ui-monospace,monospace'; c.fillStyle = 'rgba(255,255,255,.85)'; c.textAlign = 'left'; c.textBaseline = 'top';
      ['director · dominio ' + D.dom.toFixed(2) + ' · espera ' + Math.max(0, D.espera).toFixed(0) + 's · eventos ' + D.contados + ' · regalos ' + D.regalos,
        'vida ' + (m.vida || 0).toFixed(2) + ' err60 ' + (m.errores || 0) + ' racha ' + (m.racha || 0) + ' ritmo ' + (m.ritmo || 0).toFixed(0) + ' muertes ' + (m.muertes || 0) + ' daño ' + (m.danio || 0), 'recientes: ' + D.hist.slice(0, 4).join(', ')].forEach((l, i) => c.fillText(l, 20, 190 + i * 14));
    }
  }
  function luces(L) { const s = S(), D = s.dir; if (D && D.fuego) L.push({ x: D.fuego.x + 20, y: G - 120, r: 460 * D.k }); }

  // tutoriales de la primera vez que sale cada evento (motor.js los junta con los suyos)
  const dir = () => S().dir;
  const TUTOS = EVENTOS.map(ev => ({ id: 'd_' + ev.id, txt: ev.tip, teclas: [ev.icono], ok: () => !dir().activo || dir().activo.id !== ev.id || dir().activo.t > 6, cuando: () => !!dir().activo && dir().activo.id === ev.id && !dir().activo.sale }));

  const api = { EVENTOS, POR_ID, DUROS, evaluar, intervalo, objetivoDif, pesos, elegir, ondaViento, zonaDe, superficie, barreraFuego, TUTOS,
    iniciar, paso, alDanio, alMuerte, alReaparecer, contados, fondo, mundo, encima, hud, luces, _lanzar: lanzar, _salir: salir, _crearRoca: crearRoca };
  return api;
});
