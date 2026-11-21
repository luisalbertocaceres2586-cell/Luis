/* Selector de Mundos — motor. Requiere engine/ui/mundos-registro.js.
 *
 *   SelectorMundos.abrir({
 *     perfil,                 // perfil activo (de Perfiles) o null
 *     lanzar: { senda: fn },  // opcional: lanzador por id de mundo → fn(perfil, mundo). Si falta, se usa mundo.url(perfil)
 *     cerrable: false,        // muestra ✕ y permite Esc
 *     onCerrar: fn
 *   });
 *   SelectorMundos.cerrar();   SelectorMundos.estado(perfil);   SelectorMundos.siguiente(perfil);
 *
 * El estado de cada mundo (nuevo / en curso / completado / estrellas) se DERIVA del perfil: los niveles ya lo guardan. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.SelectorMundos = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';
  const doc = typeof document !== 'undefined' ? document : null;
  const VISTO_KEY = 'ninja_mundos_visto_v1';
  const CSS_HREF = 'engine/ui/selector-mundos.css?v=1';

  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const rango = (pre, a, b, suf, w) => { const r = []; for (let i = a; i <= b; i++) r.push(pre + pad(i, w) + suf); return r; };
  const SK = 'assets/characters/sakura_assets/sakura/frames/';
  const AN = 'assets/characters/antarez/';
  const HEROES = {
    sakura: { idle: rango(SK + 'idle/sakura_idle_', 1, 10, '.png'), run: rango(SK + 'run/sakura_run_', 1, 10, '.png'), idleFps: 6, runFps: 14,
      alfombra: [0, 1].map(i => 'assets/nivel2/vehiculos/alfombra_sakura_planeo_0' + i + '.png') },
    kage: { idle: [AN + 'mov_01.png', AN + 'mov_02.png'], run: rango(AN + 'run_', 1, 24, '.png'), idleFps: 2.5, runFps: 26,
      alfombra: [0, 1].map(i => 'assets/nivel2/vehiculos/alfombra_kage_planeo_0' + i + '.png') }
  };

  let R = null;        // estado de la pantalla abierta

  // ---------- sonidos de interfaz (WebAudio sintetizado: sin archivos) ----------
  const MUTE_KEY = 'ninja_mundos_mute_v1';
  let AC = null;
  const silenciado = () => { try { return root.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } };
  function ctxAudio() {
    if (AC) return AC;
    const C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
    try { AC = new C(); } catch (e) { AC = null; } return AC;
  }
  function tono(f, dur, tipo, vol, f2, retraso) {
    if (silenciado()) return; const a = ctxAudio(); if (!a) return;
    try {
      if (a.state === 'suspended') a.resume();
      const t0 = a.currentTime + (retraso || 0), o = a.createOscillator(), g = a.createGain();
      o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || .05, t0 + .012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + .02);
    } catch (e) {}
  }
  const SND = {
    mover() { tono(660, .05, 'triangle', .035, 880); },
    elegir() { tono(330, .5, 'sawtooth', .04, 990); tono(660, .18, 'triangle', .05, null, .35); tono(990, .3, 'sine', .05, null, .5); },
    sello() { tono(140, .3, 'sine', .16, 45); tono(1175, .5, 'triangle', .04, null, .06); },
    bloqueado() { tono(180, .14, 'square', .03, 120); },
    sesion() { tono(520, .18, 'triangle', .04, 300); }
  };

  // ---------- estado derivado del perfil ----------
  function registro() { return (root.MundosRegistro && root.MundosRegistro.lista) || []; }
  function estado(perfil) {
    return registro().filter(m => !m.visible || m.visible(perfil)).map(m => ({ mundo: m, prog: m.progreso ? m.progreso(perfil) : { estado: 'nuevo', estrellas: 0 } }));
  }
  /** Primer mundo jugable sin completar (o null si ya están todos). Es una sugerencia: nada se bloquea. */
  function siguiente(perfil) {
    const e = estado(perfil).find(x => !x.mundo.bloqueado && !x.mundo.fueraDeProgreso && x.prog.estado !== 'completado');
    return e ? e.mundo.id : null;
  }
  function leerVisto() { try { return JSON.parse(root.localStorage.getItem(VISTO_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function guardarVisto(pid, ids) {
    try { const v = leerVisto(); v[pid] = Object.assign(v[pid] || {}, ids); root.localStorage.setItem(VISTO_KEY, JSON.stringify(v)); } catch (e) {}
  }

  // ---------- utilidades DOM ----------
  function el(tag, cls, html) { const e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function img(src, cls) { const i = doc.createElement('img'); i.src = src; i.alt = ''; i.draggable = false; if (cls) i.className = cls; return i; }
  function asegurarCss() {
    if (doc.querySelector('link[data-mw-css]')) return;
    const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = CSS_HREF; l.setAttribute('data-mw-css', '1'); doc.head.appendChild(l);
  }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const reducido = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sinHover = () => root.matchMedia && root.matchMedia('(hover: none)').matches;

  // ---------- partículas ----------
  function particulas(tipo, seed) {
    const w = el('div', 'mw-part ' + tipo), r = rng(seed), n = tipo === 'farolillos' ? 9 : 16;
    for (let i = 0; i < n; i++) {
      const p = el('i');
      const x = r() * 100, y = 35 + r() * 55;
      p.style.left = x + '%'; p.style.top = y + '%';
      p.style.setProperty('--d', (4 + r() * 6).toFixed(1) + 's'); p.style.setProperty('--w', (-r() * 9).toFixed(1) + 's');
      let dx = (r() - .5) * 60, dy = -(40 + r() * 90);
      if (tipo === 'farolillos') { dy = -(90 + r() * 140); dx = (r() - .5) * 34; p.style.top = (55 + r() * 40) + '%'; const s = .6 + r() * .9; p.style.scale = s; }
      if (tipo === 'petalos') { dy = 90 + r() * 90; dx = -40 - r() * 50; p.style.top = (r() * 40) + '%'; }
      if (tipo === 'arena') { p.style.top = (45 + r() * 45) + '%'; }
      p.style.setProperty('--dx', dx.toFixed(0) + 'px'); p.style.setProperty('--dy', dy.toFixed(0) + 'px');
      w.appendChild(p);
    }
    return w;
  }

  // ---------- capa de decorados que se desplaza en bucle (2 baldosas idénticas) ----------
  function capaProps(lista, capa) {
    if (!lista.length) return null;
    const c = el('div', 'mw-capa mw-' + capa);
    for (let t = 0; t < 2; t++) {
      const tile = el('div');
      lista.forEach(p => {
        const im = img(p.img, 'mw-prop' + (p.alto ? ' alto' : ''));
        im.style.left = p.x + '%'; im.style.height = p.h + '%';
        if (p.y != null) { im.style.bottom = p.y + '%'; }
        tile.appendChild(im);
      });
      c.appendChild(tile);
    }
    c.dataset.loop = (capa === 'cerca' || capa === 'alta') ? '9000' : '17000';
    return c;
  }

  // ---------- una tarjeta ----------
  function crearTarjeta(it, i, ctx) {
    const m = it.mundo, p = it.prog, hero = HEROES[ctx.heroe] || HEROES.sakura;
    const card = el('article', 'mw-card');
    card.tabIndex = 0; card.setAttribute('role', 'option'); card.dataset.id = m.id; card.dataset.estado = p.estado;
    card.style.setProperty('--acc', m.acento); card.style.setProperty('--acc2', m.acento2); card.style.setProperty('--i', i);
    card.setAttribute('aria-label', m.nombre + (p.estado === 'completado' ? ' (terminado)' : p.estado === 'bloqueado' ? ' (próximamente)' : ''));
    if (ctx.sig === m.id) card.dataset.sig = '1';

    const esc = el('div', 'mw-escena');
    esc.style.setProperty('--c1', m.cielo[0]); esc.style.setProperty('--c2', m.cielo[1]);
    if (m.flota) esc.appendChild(img(m.flota, 'mw-flota'));

    const fasesBack = [], fasesFront = [];
    m.fases.forEach((f, k) => {
      const back = el('div', 'mw-fase' + (k === 0 ? ' on' : '')), front = el('div', 'mw-fase' + (k === 0 ? ' on' : ''));
      back.style.setProperty('--s1', f.suelo[0]); back.style.setProperty('--s2', f.suelo[1]);
      const far = el('div', 'mw-capa mw-far' + (f.completo ? ' completo' : '')); far.appendChild(img(f.far));
      back.appendChild(far);
      if (!f.completo) back.appendChild(el('div', 'mw-suelo'));
      else { const s = el('div', 'mw-suelo bajo'); back.appendChild(s); }
      const props = (f.props || m.props || []);
      const cm = capaProps(props.filter(x => x.capa !== 'cerca'), 'medio'); if (cm) back.appendChild(cm);
      const cc = capaProps(props.filter(x => x.capa === 'cerca' && !x.alto), 'cerca'); if (cc) front.appendChild(cc);
      const ca = capaProps(props.filter(x => x.alto), 'alta'); if (ca) front.appendChild(ca);
      esc.appendChild(back); fasesBack.push(back); fasesFront.push(front);
    });

    // sombra + héroe + extra
    esc.appendChild(el('div', 'mw-sombra'));
    const heroe = el('img', 'mw-spr mw-heroe' + (m.heroe === 'vuela' ? ' vuela' : '')); heroe.alt = ''; heroe.draggable = false;
    const setH = m.heroe === 'vuela' ? { reposo: hero.alfombra, activo: hero.alfombra, fpsR: 3, fpsA: 8 } : { reposo: hero.idle, activo: hero.run, fpsR: hero.idleFps, fpsA: hero.runFps };
    heroe.src = setH.reposo[0];
    esc.appendChild(heroe);
    const sprites = [{ el: heroe, reposo: setH.reposo, activo: setH.activo, fpsR: setH.fpsR, fpsA: setH.fpsA, t: Math.random() * 3 }];
    if (m.extra) {
      const ex = m.extra, fr = ex.frames || [ex.img];
      const ee = img(fr[0], 'mw-spr mw-extra ' + (ex.lado || 'der')); ee.style.setProperty('--h', (ex.h || 30) + '%');
      if (ex.y != null) ee.style.bottom = 'calc(var(--g) + ' + ex.y + '%)';
      esc.appendChild(ee);
      if (fr.length > 1) sprites.push({ el: ee, reposo: fr, activo: fr, fpsR: (ex.fps || 8) * .35, fpsA: ex.fps || 8, t: 0 });
    }
    fasesFront.forEach(f => esc.appendChild(f));
    if (m.particulas) esc.appendChild(particulas(m.particulas, 1000 + i * 77));
    esc.appendChild(el('div', 'mw-vig'));
    card.appendChild(esc);

    // textos
    card.appendChild(el('div', 'mw-badge', m.nivel));
    let fasenom = null;
    if (m.fases.length > 1) { fasenom = el('div', 'mw-fasenom', m.fases[0].nombre); card.appendChild(fasenom); }
    const tags = { nuevo: '✨ NUEVO', en_curso: '▶ EN CURSO' };
    if (tags[p.estado]) card.appendChild(el('div', 'mw-tag', tags[p.estado] + (ctx.ultimo === m.id ? ' · 🕘' : '')));
    card.appendChild(el('div', 'mw-lock', '🔒'));
    const sello = el('div', 'mw-sello', '<small>MUNDO</small><b>✔</b><small>TERMINADO</small>');
    if (p.estado === 'completado' && !ctx.visto[m.id]) sello.classList.add('nuevo');
    card.appendChild(sello);
    card.appendChild(el('div', 'mw-sig')); card.appendChild(el('div', 'mw-flecha', '★ SIGUIENTE'));

    const info = el('div', 'mw-info');
    info.appendChild(el('h2', '', m.nombre));
    info.appendChild(el('p', '', m.lema));
    if (m.fases.length > 1) { const d = el('div', 'mw-dots'); m.fases.forEach((_, k) => d.appendChild(el('b', k === 0 ? 'on' : ''))); info.appendChild(d); }
    if (!m.bloqueado) {
      const ch = el('div', 'mw-chips');
      ch.appendChild(el('span', '', '✖ ' + m.tablas)); ch.appendChild(el('span', '', '⏱ ' + m.duracion));
      if (p.mejor > 0) ch.appendChild(el('span', '', '🏆 ' + p.mejor));
      if (ctx.ultimo === m.id) ch.appendChild(el('span', 'mw-ult', '🕘 Último'));
      ch.appendChild(el('span', 'mw-dif', '★'.repeat(m.dificultad) + '<u>' + '★'.repeat(Math.max(0, 3 - m.dificultad)) + '</u>'));
      info.appendChild(ch);
    }
    if (p.estado === 'completado' && m.id !== 'senda') info.appendChild(el('div', 'mw-estrellas', '★'.repeat(p.estrellas || 0) + '<u>' + '★'.repeat(Math.max(0, 3 - (p.estrellas || 0))) + '</u>'));
    const go = el('button', 'mw-go', p.estado === 'completado' ? '↻ REPETIR' : p.estado === 'en_curso' ? '▶ CONTINUAR' : '▶ JUGAR');
    go.type = 'button'; go.tabIndex = -1; info.appendChild(go);
    card.appendChild(info);

    return { m, p, card, esc, heroe, sprites, fasesBack, fasesFront, fasenom, dots: info.querySelector('.mw-dots'), fase: 0, anims: [], vis: true, activo: false, bgIdx: i };
  }

  // ---------- animaciones (Web Animations API: se aceleran con playbackRate) ----------
  function iniciarAnims(t) {
    if (reducido()) return;
    t.anims.forEach(a => { try { a.cancel(); } catch (e) {} }); t.anims = [];
    t.card.querySelectorAll('.mw-capa[data-loop]').forEach(c => {
      t.anims.push(c.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: +c.dataset.loop, iterations: Infinity }));
    });
    t.card.querySelectorAll('.mw-far').forEach(far => {
      const im = far.querySelector('img'); if (!im) return;
      const medir = () => {
        const sw = t.esc.clientWidth, h = far.clientHeight; if (!sw || !h || !im.naturalWidth) return;
        const w = Math.round(h * im.naturalWidth / im.naturalHeight); im.style.width = w + 'px'; im.style.maxWidth = 'none'; im.style.height = '100%'; im.style.objectFit = 'fill';
        const dist = Math.max(0, w - sw); if (dist < 4) return;
        t.anims.push(far.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-dist) + 'px)' }], { duration: Math.min(60000, Math.max(14000, dist * 55)), direction: 'alternate', easing: 'ease-in-out', iterations: Infinity }));
        fijarRitmo(t);
      };
      if (im.complete && im.naturalWidth) medir(); else im.addEventListener('load', medir, { once: true });
    });
    fijarRitmo(t);
  }
  function fijarRitmo(t) { const r = t.activo ? 4 : 1; t.anims.forEach(a => { try { a.updatePlaybackRate(r); } catch (e) {} }); }
  function activar(t, on) {
    if (t.activo === on) return; t.activo = on; t.card.classList.toggle('mw-act', on && sinHover());
    fijarRitmo(t);
    if (R && on) { R.fondo(t.bgIdx); if (R.sonar && !sinHover()) SND.mover(); }
  }

  // ---------- bucle de frames de sprites ----------
  function bucle(ts) {
    if (!R) return;
    const dt = Math.min(.1, (ts - (R.ultimo || ts)) / 1000); R.ultimo = ts;
    if (!reducido() && !doc.hidden) {
      R.tarjetas.forEach(t => {
        if (!t.vis) return;
        t.sprites.forEach(s => {
          const lista = t.activo ? s.activo : s.reposo, fps = t.activo ? s.fpsA : s.fpsR;
          if (lista.length < 2) return;
          s.t += dt * fps; const f = lista[Math.floor(s.t) % lista.length];
          if (s.last !== f) { s.last = f; s.el.src = f; }
        });
      });
    }
    R.raf = root.requestAnimationFrame(bucle);
  }

  function ciclarFases(t) {
    t.fase = (t.fase + 1) % t.m.fases.length;
    t.fasesBack.forEach((f, k) => f.classList.toggle('on', k === t.fase));
    t.fasesFront.forEach((f, k) => f.classList.toggle('on', k === t.fase));
    if (t.fasenom) t.fasenom.textContent = t.m.fases[t.fase].nombre;
    if (t.dots) Array.prototype.forEach.call(t.dots.children, (d, k) => d.classList.toggle('on', k === t.fase));
  }

  // ---------- precarga: las tarjetas aparecen ya completas (útil con internet lento) ----------
  let precargado = false, LOAD = null;
  function precargar(urls, max, alAvanzar) {
    return new Promise(res => {
      let n = 0; const total = urls.length; if (!total) return res();
      const fin = () => { clearTimeout(tm); res(); };
      const tm = setTimeout(res, max);
      urls.forEach(u => { const i = new Image(); const ok = () => { n++; alAvanzar && alAvanzar(n / total); if (n >= total) fin(); }; i.onload = ok; i.onerror = ok; i.src = u; });
    });
  }
  function urlsNecesarias(heroeId) {
    const reg = (root.MundosRegistro && root.MundosRegistro.imagenes) ? root.MundosRegistro.imagenes() : [];
    const h = HEROES[heroeId] || HEROES.sakura;
    return reg.concat(h.idle, h.run, h.alfombra);
  }

  // ---------- abrir / cerrar ----------
  function abrir(opts) {
    if (!doc) return; opts = opts || {};
    cerrar(true); asegurarCss();
    if (!precargado && !opts._pre) {
      quitarCarga();
      const heroeP = (opts.perfil && opts.perfil.avatar === 'kage') ? 'kage' : (opts.heroe === 'kage' ? 'kage' : 'sakura');
      const l = el('div', 'mw-root mw-ini', '<div class="mw-ini-c"><div class="mw-ini-s">✦</div><b>Preparando mundos…</b><div class="mw-bar"><i></i></div></div>');
      doc.body.appendChild(l); LOAD = l;
      const barra = l.querySelector('.mw-bar i');
      precargar(urlsNecesarias(heroeP), 6000, f => { barra.style.width = Math.round(f * 100) + '%'; }).then(() => {
        precargado = true; if (LOAD !== l) return;           // si ya se canceló, no se abre
        quitarCarga(); abrir(Object.assign({}, opts, { _pre: true }));
      });
      return;
    }
    quitarCarga();
    const perfil = opts.perfil || null;
    const heroeId = (perfil && perfil.avatar === 'kage') ? 'kage' : (opts.heroe === 'kage' ? 'kage' : 'sakura');
    const items = estado(perfil), sig = siguiente(perfil);
    const pid = (perfil && perfil.id) || '_', visto = (leerVisto()[pid]) || {};
    const ctx = { heroe: heroeId, sig, visto, ultimo: perfil && perfil.mundos && perfil.mundos.ultimo };

    const rootEl = el('div', 'mw-root'); rootEl.setAttribute('role', 'dialog'); rootEl.setAttribute('aria-label', 'Elige tu mundo');
    const bg = el('div', 'mw-bg'); items.forEach((it, i) => { const b = el('i'); b.style.backgroundImage = 'url("' + it.mundo.fases[0].far + '")'; bg.appendChild(b); });
    rootEl.appendChild(bg);

    const jugables = items.filter(x => !x.mundo.bloqueado && !x.mundo.fueraDeProgreso), hechos = jugables.filter(x => x.prog.estado === 'completado').length;
    const top = el('header', 'mw-top');
    const tit = el('div', 'mw-title', '<small>' + (perfil ? '<span class="mw-avatar"><img alt="" draggable="false"></span>' : '') + '<span class="mw-nom"></span></small><h1>' + (jugables.length && hechos === jugables.length ? '¡ERES UN MAESTRO NINJA!' : 'ELIGE TU MUNDO') + '</h1>');
    const av = tit.querySelector('.mw-avatar img'); if (av) av.src = (HEROES[heroeId] || HEROES.sakura).idle[0];
    tit.querySelector('.mw-nom').textContent = perfil ? String(perfil.nombre || '').toUpperCase() : 'MUNDOS';
    top.appendChild(tit);
    const maestro = jugables.length > 0 && hechos === jugables.length;
    if (maestro) {
      rootEl.classList.add('mw-maestro');
      let ya = false; try { ya = root.sessionStorage.getItem('mw_maestro_' + pid) === '1'; root.sessionStorage.setItem('mw_maestro_' + pid, '1'); } catch (e) {}
      if (!ya && !reducido()) {
        const cf = el('div', 'mw-confeti'), cols = ['#ffe27a', '#ff9d4a', '#ff7aa8', '#7ad7ff', '#9dff9d', '#c9a3ff'], rr = rng(7);
        for (let k = 0; k < 46; k++) { const c = el('i'); c.style.left = (rr() * 100) + '%'; c.style.background = cols[k % cols.length]; c.style.setProperty('--d', (2.8 + rr() * 2.6).toFixed(1) + 's'); c.style.setProperty('--w', (rr() * 1.6).toFixed(2) + 's'); c.style.setProperty('--r', Math.round(rr() * 720 - 360) + 'deg'); cf.appendChild(c); }
        rootEl.appendChild(cf); setTimeout(() => cf.remove(), 7000);
        setTimeout(() => { tono(523, .16, 'triangle', .05); tono(659, .16, 'triangle', .05, null, .15); tono(784, .16, 'triangle', .05, null, .3); tono(1047, .5, 'triangle', .06, null, .45); }, 500);
      }
    }
    const pr = el('div', 'mw-prog', '🏯 <span><b>' + hechos + '</b> de ' + jugables.length + ' mundos</span><div class="mw-bar"><i></i></div>');
    top.appendChild(pr);
    const mu = el('button', 'mw-mute', silenciado() ? '🔇' : '🔊'); mu.type = 'button'; mu.title = 'Sonido de los menús'; mu.setAttribute('aria-label', 'Activar o silenciar el sonido de los menús');
    mu.onclick = e => { e.stopPropagation(); const quiere = !silenciado(); try { root.localStorage.setItem(MUTE_KEY, quiere ? '1' : '0'); } catch (er) {} mu.textContent = quiere ? '🔇' : '🔊'; if (!quiere) SND.mover(); };
    top.appendChild(mu);
    if (typeof opts.onCerrarSesion === 'function') {
      const s = el('button', 'mw-sesion', '<span class="mw-sesion-i">🚪</span><span class="mw-sesion-t">CERRAR SESIÓN</span>');
      s.type = 'button'; s.title = 'Cerrar sesión para que otra persona juegue'; s.setAttribute('aria-label', 'Cerrar sesión y cambiar de jugador');
      s.onclick = e => { e.stopPropagation(); if (R && R.lanzando) return; SND.sesion(); const cb = opts.onCerrarSesion; cerrar(true); cb(perfil); };
      top.appendChild(s);
    }
    if (opts.cerrable) { const x = el('button', 'mw-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.onclick = () => cerrar(); top.appendChild(x); }
    rootEl.appendChild(top);

    const track = el('div', 'mw-track'); track.setAttribute('role', 'listbox');
    const tarjetas = items.map((it, i) => crearTarjeta(it, i, ctx));
    tarjetas.forEach(t => track.appendChild(t.card));
    rootEl.appendChild(track);
    const nav = (dir) => { const b = el('button', 'mw-nav ' + (dir < 0 ? 'izq' : 'der'), dir < 0 ? '‹' : '›'); b.type = 'button'; b.setAttribute('aria-label', dir < 0 ? 'Mundos anteriores' : 'Mundos siguientes');
      b.onclick = e => { e.stopPropagation(); track.scrollBy({ left: dir * Math.max(200, tarjetas[0].card.offsetWidth + 20), behavior: reducido() ? 'auto' : 'smooth' }); }; rootEl.appendChild(b); return b; };
    const bIzq = nav(-1), bDer = nav(1);
    const actualizarNav = () => { const max = track.scrollWidth - track.clientWidth; bIzq.classList.toggle('on', max > 6 && track.scrollLeft > 6); bDer.classList.toggle('on', max > 6 && track.scrollLeft < max - 6); };
    let arr = null, arrastro = false;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; arr = { x: e.clientX, sl: track.scrollLeft, mov: false }; });
    root.addEventListener('pointermove', e => {
      if (!arr) return; const dx = e.clientX - arr.x;
      if (!arr.mov && Math.abs(dx) > 7) { arr.mov = true; track.classList.add('mw-arr'); }
      if (arr.mov) track.scrollLeft = arr.sl - dx;
    });
    root.addEventListener('pointerup', () => { if (arr && arr.mov) { arrastro = true; setTimeout(() => { arrastro = false; }, 60); } arr = null; track.classList.remove('mw-arr'); });
    track.addEventListener('click', e => { if (arrastro) { e.stopPropagation(); e.preventDefault(); } }, true);
    track.addEventListener('scroll', actualizarNav, { passive: true }); root.addEventListener('resize', actualizarNav); setTimeout(actualizarNav, 400);
    rootEl.appendChild(el('footer', 'mw-pie', 'Elige el mundo que más te guste · puedes jugarlos en el orden que quieras · <kbd>←</kbd> <kbd>→</kbd> <kbd>Enter</kbd>'));
    const iris = el('div', 'mw-iris', '<small>PREPÁRATE</small><h2></h2><div class="mw-carga"><i></i></div>'); rootEl.appendChild(iris);

    // el juego escucha el teclado en todo el documento: aquí las teclas son solo del selector
    ['keydown', 'keyup', 'keypress'].forEach(ev => rootEl.addEventListener(ev, e => e.stopPropagation()));
    doc.body.appendChild(rootEl);

    R = { sonar: false, root: rootEl, track, tarjetas, perfil, opts, bg, ctx, timers: [], io: null, raf: 0, lanzando: false,
      fondo(idx) { Array.prototype.forEach.call(bg.children, (b, k) => b.classList.toggle('on', k === idx)); } };
    const first = tarjetas.findIndex(t => t.m.id === sig); R.fondo(first >= 0 ? first : 0);
    root.requestAnimationFrame(() => { pr.querySelector('.mw-bar i').style.width = (jugables.length ? Math.round(hechos / jugables.length * 100) : 0) + '%'; });

    tarjetas.forEach(t => {
      const c = t.card;
      c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') activar(t, true); });
      c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { activar(t, false); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } });
      c.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || reducido()) return;
        const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        c.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
      });
      c.addEventListener('focus', () => activar(t, true)); c.addEventListener('blur', () => activar(t, false));
      c.addEventListener('click', () => elegir(t));
      iniciarAnims(t);
      if (t.m.fases.length > 1 && !reducido()) R.timers.push(root.setInterval(() => { if (t.vis && !doc.hidden) ciclarFases(t); }, 3300));
    });

    // solo se animan las tarjetas visibles; en pantallas táctiles la tarjeta centrada se "despierta"
    if ('IntersectionObserver' in root) {
      R.io = new IntersectionObserver(es => es.forEach(en => {
        const t = tarjetas.find(x => x.card === en.target); if (!t) return;
        t.vis = en.isIntersecting; t.anims.forEach(a => { try { t.vis ? a.play() : a.pause(); } catch (e) {} });
        if (sinHover()) activar(t, en.intersectionRatio > .7 && !t.m.bloqueado);
      }), { root: track, threshold: [0, .7] });
      tarjetas.forEach(t => R.io.observe(t.card));
    }

    const onKey = e => {
      if (!R || R.root !== rootEl) return;
      e.stopImmediatePropagation();   // el juego no debe reaccionar a teclas mientras el selector está abierto
      const idx = tarjetas.findIndex(t => t.card === doc.activeElement);
      const ir = k => { const t = tarjetas[Math.max(0, Math.min(tarjetas.length - 1, k))]; t.card.focus({ preventScroll: true }); t.card.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' }); };
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(idx < 0 ? 0 : idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(idx < 0 ? 0 : idx - 1); }
      else if (e.key === 'Home') { e.preventDefault(); ir(0); } else if (e.key === 'End') { e.preventDefault(); ir(tarjetas.length - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && idx >= 0) { e.preventDefault(); elegir(tarjetas[idx]); }
      else if (e.key === 'Escape' && opts.cerrable) { e.preventDefault(); cerrar(); }
    };
    root.addEventListener('keydown', onKey, true);
    R.onKey = onKey;

    // al reabrir, se enfoca el mundo sugerido y se centra
    const foco = tarjetas[first >= 0 ? first : 0];
    setTimeout(() => { if (!R) return; try { foco.card.focus({ preventScroll: true }); foco.card.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {} }, 60);
    R.raf = root.requestAnimationFrame(bucle);

    // sonido de hover solo después del arranque (evita el "tic" inicial) + sello con golpe y chispas
    setTimeout(() => { if (R) R.sonar = true; }, 900);
    tarjetas.forEach(t => { if (t.card.querySelector('.mw-sello.nuevo')) setTimeout(() => { if (!R) return; SND.sello(); chispas(t.card); }, 1050); });

    // lo que ya se vio con sello no vuelve a animarse
    const nuevosVistos = {}; items.forEach(it => { if (it.prog.estado === 'completado') nuevosVistos[it.mundo.id] = true; });
    if (perfil) guardarVisto(pid, nuevosVistos);
    return R;
  }

  function chispas(card) {
    if (reducido()) return; const s = card.querySelector('.mw-sello'); if (!s) return;
    const cb = card.getBoundingClientRect(), sb = s.getBoundingClientRect(), cx = sb.left + sb.width / 2 - cb.left, cy = sb.top + sb.height / 2 - cb.top;
    for (let i = 0; i < 16; i++) {
      const c = el('i', 'mw-chispa'), a = (i / 16) * Math.PI * 2 + Math.random() * .4, d = 38 + Math.random() * 46;
      c.style.left = cx + 'px'; c.style.top = cy + 'px'; c.style.setProperty('--cx', Math.cos(a) * d + 'px'); c.style.setProperty('--cy', Math.sin(a) * d + 'px');
      c.style.background = i % 3 ? '#ffe27a' : '#ff9d4a'; card.appendChild(c); setTimeout(() => c.remove(), 900);
    }
  }

  function elegir(t) {
    if (!R || R.lanzando) return;
    if (t.m.bloqueado) { SND.bloqueado(); t.card.animate([{ translate: '0' }, { translate: '-7px' }, { translate: '7px' }, { translate: '-4px' }, { translate: '0' }], { duration: 320 }); return; }
    R.lanzando = true; SND.elegir();
    try { root.sessionStorage.removeItem('ninja_abrir_mundos'); } catch (e) {}
    const rc = R.root.getBoundingClientRect(), b = t.card.getBoundingClientRect();
    const iris = R.root.querySelector('.mw-iris'); iris.style.setProperty('--ix', ((b.left + b.width / 2 - rc.left) / rc.width * 100).toFixed(1) + '%'); iris.style.setProperty('--iy', ((b.top + b.height / 2 - rc.top) / rc.height * 100).toFixed(1) + '%');
    iris.style.setProperty('--acc2', t.m.acento2); iris.querySelector('h2').textContent = t.m.nombre;
    t.card.classList.add('mw-elegida'); R.root.classList.add('mw-lanza');
    const perfil = R.perfil, opts = R.opts;
    try { if (perfil && root.Perfiles) root.Perfiles.actualizar(perfil.id, q => { q.mundos = q.mundos || {}; q.mundos.ultimo = t.m.id; }); } catch (e) {}
    const espera = reducido() ? 80 : 1750;
    setTimeout(() => {
      cerrar(true);
      const f = opts.lanzar && opts.lanzar[t.m.id];
      const fresco = (perfil && root.Perfiles && root.Perfiles.obtener(perfil.id)) || perfil;
      if (f) f(fresco, t.m);
      else if (t.m.url) root.location.href = t.m.url(fresco);
    }, espera);
  }

  function quitarCarga() { if (LOAD) { LOAD.remove(); LOAD = null; } }

  function cerrar(silencioso) {
    if (!R) { quitarCarga(); return; } const r = R; R = null;
    root.cancelAnimationFrame(r.raf); if (r.onKey) root.removeEventListener('keydown', r.onKey, true); r.timers.forEach(i => root.clearInterval(i)); if (r.io) r.io.disconnect();
    r.tarjetas.forEach(t => t.anims.forEach(a => { try { a.cancel(); } catch (e) {} }));
    r.root.remove();
    if (!silencioso && r.opts.onCerrar) r.opts.onCerrar();
  }

  return { abrir, cerrar, estado, siguiente, HEROES };
});
