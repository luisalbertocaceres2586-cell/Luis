/* Motor del Nivel 1 — Ninja Multiplicación
 * Corre en su propia pantalla (un canvas de 1280×720 escalado), sin tocar el motor de los otros niveles.
 * Carga solo el arte del acto que se juega. Acto 1 (Bosque de Bambú) completo: física con salto preciso,
 * enemigos, trampas, tambores, pergaminos, checkpoints y acertijos que se responden tocando el mundo.
 * Al terminar muestra el resumen y la decisión de qué camino seguir (ver ruta.js). */
(function () {
  'use strict';
  const W = 1280, H = 720, G = 560, DT = 1 / 60;
  const A = 'assets/nivel1/';
  const IMGS = {
    suelo: 'terreno/suelo_bosque', puente: 'terreno/puente_cuerda', bambu: 'terreno/plataforma_bambu', piedra: 'terreno/plataforma_piedra_toro',
    kunai: 'terreno/kunai_trampa', bambuDeco: 'decorado/bambu_primer_plano', toro: 'decorado/toro_piedra', kitsune: 'decorado/estatua_kitsune',
    estandarte: 'decorado/estandarte_colgante', toriiOff: 'decorado/torii_inactivo', toriiOn: 'decorado/torii_activo',
    farolOff: 'cueva/farol_papel_apagado', farolOn: 'cueva/farol_papel_encendido', ninja: 'enemigos/ninja_sombra',
    pergamino: 'items_jefe/pergamino', onigiri: 'items_jefe/onigiri_curacion', taiko: 'items_jefe/tambor_taiko', sello: 'items_jefe/sello_piedra',
    shuriken: 'animados/shuriken_espiritual_8', montanas: '../environment/levels/nivel1/n1_bg_montanas_lejos', nube: '../environment/levels/nivel1/nubes/nube_01'
  };
  const SKY = {
    A: ['#2b2468', '#ff8f6b', '#ffe3a3'],   // amanecer
    B: ['#3d5a80', '#98c1d9', '#e8f1f2'],   // mañana con niebla
    C: ['#5c2a6e', '#e86a5c', '#ffd08a']    // atardecer temprano
  };
  const BANDERAS = { antorcha: 'una antorcha', armadura: 'la armadura samurái', aliado_mercader: 'la ayuda del mercader', bendicion_zorro: 'la bendición del zorro', llave_dojo: 'la llave del dojo', llave_portal: 'la llave del portal', vista_torre: 'vista desde la torre', pergamino_dragon: 'el pergamino del dragón', ritmo_tejados: 'ritmo de tejados' };

  let root, cv, cx, raf = 0, last = 0, acc = 0;
  let S = null;                    // estado de la partida del acto
  const keys = {}, img = {}, surfCache = new Map();
  let touchUI = null;

  // ============ utilidades ============
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rect = (x, y, w, h) => ({ x, y, w, h });
  const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function cargarImg(src) {
    return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { console.warn('[Nivel1] falta', src); res(null); }; i.src = src; });
  }
  function cargarScript(src) {
    return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  }
  /** Altura (0..1) donde está la superficie de una pieza, medida mirando su transparencia. */
  function superficie(im) {
    if (!im) return 0;
    if (surfCache.has(im)) return surfCache.get(im);
    const w = Math.min(160, im.width), h = Math.round(im.height * w / im.width);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let r = 0;
    for (let y = 0; y < h; y++) {
      let n = 0; for (let k = Math.floor(w * .15); k < w * .85; k++) if (d[(y * w + k) * 4 + 3] > 120) n++;
      if (n / (w * .7) > 0.6) { r = y / h; break; }
    }
    surfCache.set(im, r); return r;
  }

  // ============ carga ============
  async function cargar(heroe, progreso) {
    const hm = heroe === 'kage' ? 'KAGE_MANIFEST' : 'SAKURA_MANIFEST';
    if (!window[hm]) await cargarScript('assets/characters/' + heroe + '/manifest.js');
    const M = window[hm]; if (!M) throw new Error('No se encontró el manifest de ' + heroe);
    const lista = []; Object.keys(IMGS).forEach(k => lista.push([k, A + IMGS[k] + '.png']));
    ['idle', 'run', 'jump', 'atk', 'hurt', 'death'].forEach(set => (M[set] || []).forEach((f, i) => lista.push(['h:' + set + ':' + i, 'assets/characters/' + heroe + '/' + f.file])));
    let hechos = 0;
    await Promise.all(lista.map(async ([k, src]) => { img[k] = await cargarImg(src); progreso(++hechos / lista.length); }));
    return M;
  }

  // ============ arranque ============
  async function iniciar(o) {
    o = o || {}; cerrar(true);
    const heroe = o.heroe === 'kage' ? 'kage' : 'sakura';
    crearPantalla();
    const barra = root.querySelector('#n1Barra'), msg = root.querySelector('#n1Msg');
    msg.textContent = 'Preparando el bosque…';
    let M; try { M = await cargar(heroe, p => { barra.style.width = Math.round(p * 100) + '%'; }); } catch (e) { msg.textContent = 'No se pudo cargar: ' + e.message; return; }
    root.querySelector('#n1Carga').remove();
    const plan = o.plan || Ruta.nuevoPlan(o.semilla);
    if (!plan.jugados.length) Ruta.elegir(plan, 'bosque');
    const op = plan.opciones.find(x => x.acto === 'bosque') || plan.ultimo;
    const maestria = Acertijos.crearMaestria(o.perfil && o.perfil.maestria ? o.perfil.maestria : {});
    const N = GenBosque.generar(op.params, maestria);
    S = {
      heroeId: heroe, M, plan, params: op.params, N, maestria, perfil: o.perfil || null, onSalir: o.onSalir || null, onSiguiente: o.onSiguiente || null, movil: o.dispositivo === 'movil' || /[?&]movil=1/.test(location.search),
      h: { x: N.inicio.x, y: G, vx: 0, vy: 0, w: 34, h: 92, dir: 1, suelo: true, coyote: 0, buffer: 0, inv: 0, atk: 0, atkCd: 0, shCd: 0, vida: 5, muerto: 0, aturdido: 0, pisando: null, estado: 'idle', anim: 0 },
      cam: 0, t: 0, tiempo: 0, vidaMax: 5, seguro: { x: N.inicio.x, y: G }, resp: { x: N.inicio.x, y: G },
      shur: [], part: [], hojas: [], textos: [], enemigos: N.enem.map(e => Object.assign({}, e)), items: N.items.map(i => Object.assign({ tomado: false }, i)),
      est: N.est, ckp: N.ckp, pergaminos: 0, aciertos: 0, errores: 0, pausa: false, fin: null, aviso: { t: 4, s: 'ACTO 1 · BOSQUE DE BAMBÚ' }, estSel: null, shake: 0, flash: 0,
      alto: 100 / (M.idle[0].h || 200)
    };
    for (let i = 0; i < 26; i++) S.hojas.push({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 30, r: Math.random() * 6, s: 5 + Math.random() * 6 });
    if (S.movil) crearTactil();
    window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyUp, true); window.addEventListener('resize', ajustar);
    ajustar(); last = performance.now(); acc = 0; raf = requestAnimationFrame(bucle);
  }

  function cerrar(silencioso) {
    cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true); window.removeEventListener('resize', ajustar);
    if (root) root.remove(); root = null; touchUI = null;
    Object.keys(keys).forEach(k => delete keys[k]);
    const cb = S && S.onSalir; S = null;
    if (!silencioso && cb) cb();
  }

  // ============ pantalla ============
  const CSS = `
#n1Root{position:fixed;inset:0;z-index:90000;background:#0a0618;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:'Press Start 2P',ui-monospace,monospace;color:#fff;touch-action:none;user-select:none}
#n1Root canvas{display:block;background:#000;image-rendering:auto}
#n1Carga{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(ellipse at 50% 35%,#3a1a6e,#0a0618);z-index:3}
#n1Carga .t{color:#FFC93C;font-size:clamp(12px,2.4vw,20px)}#n1Carga .b{width:min(420px,70vw);height:12px;border:2px solid #FFC93C;border-radius:8px;overflow:hidden}
#n1Barra{height:100%;width:0;background:linear-gradient(90deg,#ff4d9d,#ffc93c);transition:width .15s}
#n1Msg{font-size:9px;color:#c9b8ff}
.n1Panel{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;background:rgba(8,3,24,.82);padding:10px;overflow:auto}
.n1Card{width:min(820px,96vw);background:linear-gradient(180deg,#2a1257,#120833);border:2px solid #FFC93C;border-radius:14px;padding:clamp(14px,2.6vw,26px);box-shadow:0 0 40px rgba(255,201,60,.25)}
.n1Card h2{margin:0 0 8px;color:#FFC93C;font-size:clamp(13px,2.4vw,19px);text-align:center;text-shadow:0 2px 0 #7a3a00}
.n1Card p{font-size:clamp(7px,1.3vw,9px);line-height:1.9;color:#d9ccff;text-align:center;margin:6px 0}
.n1Stats{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:12px 0}
.n1Stats div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px 10px;font-size:clamp(8px,1.4vw,10px);text-align:center;line-height:1.8}
.n1Stats b{display:block;color:#FFE27A;font-size:clamp(12px,2vw,16px)}
.n1Opc{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
.n1Op{cursor:pointer;font-family:inherit;text-align:left;color:#fff;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.25);border-radius:12px;padding:12px;font-size:clamp(7px,1.3vw,9px);line-height:1.9}
.n1Op:hover,.n1Op:focus{border-color:#FFC93C;background:rgba(255,201,60,.14);outline:none}.n1Op h3{margin:0 0 6px;color:#FFE27A;font-size:clamp(9px,1.7vw,12px)}
.n1Btn{font-family:inherit;cursor:pointer;border:0;border-radius:8px;padding:11px 15px;font-size:clamp(8px,1.4vw,10px);color:#1a0a33;background:linear-gradient(180deg,#FFE27A,#FFB300);box-shadow:0 3px 0 #8a5a00}
.n1Btn.sec{background:rgba(255,255,255,.14);color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.4)}
.n1Fila{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.n1Tac{position:absolute;z-index:5;display:flex;gap:10px;bottom:14px}
.n1Tac button{width:clamp(54px,12vw,84px);height:clamp(54px,12vw,84px);border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(255,255,255,.18);color:#fff;font-size:clamp(16px,4vw,26px);touch-action:none}`;

  function crearPantalla() {
    if (!document.getElementById('n1Css')) { const s = document.createElement('style'); s.id = 'n1Css'; s.textContent = CSS; document.head.appendChild(s); }
    root = document.createElement('div'); root.id = 'n1Root';
    root.innerHTML = '<div id="n1Carga"><div class="t">LA SENDA DEL APRENDIZ NINJA</div><div class="b"><div id="n1Barra"></div></div><div id="n1Msg"></div></div>';
    cv = document.createElement('canvas'); cv.width = W; cv.height = H; root.insertBefore(cv, root.firstChild);
    cx = cv.getContext('2d'); document.body.appendChild(root);
    ['keydown', 'keyup', 'keypress'].forEach(t => root.addEventListener(t, e => e.stopPropagation()));
  }
  function ajustar() { if (!cv) return; const k = Math.min(innerWidth / W, innerHeight / H); cv.style.width = Math.floor(W * k) + 'px'; cv.style.height = Math.floor(H * k) + 'px'; }

  function crearTactil() {
    const izq = document.createElement('div'); izq.className = 'n1Tac'; izq.style.left = '14px';
    const der = document.createElement('div'); der.className = 'n1Tac'; der.style.right = '14px';
    function b(txt, tecla, cont) {
      const e = document.createElement('button'); e.textContent = txt;
      const on = ev => { ev.preventDefault(); keys[tecla] = 1; if (tecla === 'Space') S.h.buffer = .12; }, off = ev => { ev.preventDefault(); keys[tecla] = 0; };
      e.addEventListener('pointerdown', on); e.addEventListener('pointerup', off); e.addEventListener('pointerleave', off); e.addEventListener('pointercancel', off); cont.appendChild(e);
    }
    b('◀', 'ArrowLeft', izq); b('▶', 'ArrowRight', izq); b('🗡', 'KeyC', der); b('✦', 'KeyF', der); b('⤒', 'Space', der);
    root.appendChild(izq); root.appendChild(der); touchUI = [izq, der];
  }

  // ============ teclado ============
  const CTRL = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyF', 'KeyC', 'KeyJ', 'KeyK', 'KeyZ', 'KeyX'];
  function onKey(e) {
    if (!S) return;
    if (CTRL.indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (!S.fin) S.pausa = !S.pausa; return; }
    if (S.pausa && e.code === 'KeyQ') { cerrar(); return; }
    if (!keys[e.code] && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) S.h.buffer = .12;
    keys[e.code] = 1; e.stopImmediatePropagation();
  }
  function onKeyUp(e) { if (!S) return; keys[e.code] = 0; if (CTRL.indexOf(e.code) >= 0) { e.preventDefault(); e.stopImmediatePropagation(); } }
  const izq = () => keys.ArrowLeft || keys.KeyA, der = () => keys.ArrowRight || keys.KeyD, salto = () => keys.Space || keys.ArrowUp || keys.KeyW;

  // ============ simulación ============
  function bucle(now) {
    raf = requestAnimationFrame(bucle);
    if (!S) return;
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    let n = 0; while (acc >= DT && n++ < 6) { if (!S.pausa && !S.fin) paso(DT); acc -= DT; }
    dibujar();
  }

  function texto(x, y, s, col) { S.textos.push({ x, y, s, col: col || '#fff', t: 1.1 }); }
  function chispas(x, y, n, col) { for (let i = 0; i < n; i++) S.part.push({ x, y, vx: (Math.random() - .5) * 300, vy: -Math.random() * 300 - 40, t: .5 + Math.random() * .4, col: col || '#ffd54a', r: 2 + Math.random() * 3 }); }

  function danio(razon, kx) {
    const h = S.h; if (h.inv > 0 || h.muerto > 0) return;
    h.vida--; h.inv = 1.4; h.aturdido = .28; h.vy = -420; h.vx = (kx || -h.dir) * 260; h.suelo = false; S.shake = .25; S.flash = .2;
    texto(h.x, h.y - 100, '-1 ♥', '#ff6b6b'); chispas(h.x, h.y - 50, 10, '#ff6b6b');
    if (h.vida <= 0) { h.muerto = 1.2; }
  }
  function reaparecer(caida) {
    const h = S.h;
    if (h.vida <= 0) { h.vida = 3; S.aviso = { t: 2.5, s: 'VUELVES AL ÚLTIMO PUNTO DE CONTROL' }; h.x = S.resp.x; } else h.x = S.seguro.x;
    h.y = G - 400; h.vy = 0; h.vx = 0; h.inv = 1.6; h.muerto = 0; h.suelo = false;
    S.cam = clamp(h.x - 440, 0, S.N.ancho - W);
  }

  function paso(dt) {
    const h = S.h, N = S.N; S.t += dt; S.tiempo += dt;
    if (S.aviso && S.aviso.t > 0) S.aviso.t -= dt;
    h.inv = Math.max(0, h.inv - dt); h.aturdido = Math.max(0, h.aturdido - dt); h.atkCd = Math.max(0, h.atkCd - dt); h.shCd = Math.max(0, h.shCd - dt); h.atk = Math.max(0, h.atk - dt);
    h.buffer = Math.max(0, h.buffer - dt); h.coyote = Math.max(0, h.coyote - dt);
    S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt);
    if (h.muerto > 0) { h.muerto -= dt; h.vy += 2300 * dt; h.y += h.vy * dt; if (h.muerto <= 0) reaparecer(); return; }

    // --- control ---
    let dirIn = (der() ? 1 : 0) - (izq() ? 1 : 0);
    if (h.aturdido <= 0) {
      const obj = dirIn * 340, a = h.suelo ? 3400 : 2300;
      if (dirIn) { h.vx += clamp(obj - h.vx, -a * dt, a * dt); h.dir = dirIn; } else h.vx += clamp(-h.vx, -3000 * dt, 3000 * dt) * (h.suelo ? 1 : .4);
      if (h.buffer > 0 && (h.suelo || h.coyote > 0)) { h.vy = -900; h.suelo = false; h.coyote = 0; h.buffer = 0; h.cortado = false; chispas(h.x, h.y, 4, '#c8b48a'); }
      if (!salto() && h.vy < -330 && !h.cortado) { h.vy *= .55; h.cortado = true; }
      if ((keys.KeyC || keys.KeyJ || keys.KeyZ) && h.atkCd <= 0) { h.atk = .28; h.atkCd = .38; h.atkT = 0; }
      if ((keys.KeyF || keys.KeyK || keys.KeyX) && h.shCd <= 0) { h.shCd = .5; S.shur.push({ x: h.x + h.dir * 30, y: h.y - 58, vx: 760 * h.dir, t: 1.2, a: 0 }); }
    }
    h.vy = Math.min(1250, h.vy + 2300 * dt);

    // --- movimiento y colisiones ---
    const antesY = h.y; h.x += h.vx * dt; h.y += h.vy * dt;
    h.x = clamp(h.x, 20, N.ancho - 20);
    S.est.forEach(e => { if (e.puertaX !== null && !e.resuelta) { const px = e.puertaX; if (h.x + h.w / 2 > px - 12 && h.x - h.w / 2 < px + 12 && h.y > G - 300) { if (h.x < px) h.x = px - 12 - h.w / 2; else h.x = px + 12 + h.w / 2; h.vx = 0; } } });
    let apoyo = null;
    if (h.vy >= 0) {
      for (const s of N.suelo) if (h.x >= s.x0 - 8 && h.x <= s.x1 + 8 && antesY <= G + 6 && h.y >= G) { apoyo = { y: G, tipo: 'suelo', s }; break; }
      for (const p of N.plat) {
        const top = platTop(p); if (p.estado === 'caida') continue;
        if (h.x + h.w / 2 > p.x + 6 && h.x - h.w / 2 < p.x + p.w - 6 && antesY <= top + 6 && h.y >= top && (!apoyo || top < apoyo.y)) apoyo = { y: top, tipo: 'plat', p };
      }
    }
    for (const t of N.tambores) { const top = G - 52; if (h.vy >= 0 && Math.abs(h.x - t.x) < 62 && antesY <= top + 8 && h.y >= top) { h.y = top; h.vy = -1320; h.suelo = false; t.rebote = .3; chispas(t.x, top, 10, '#ffe27a'); texto(t.x, top - 40, '¡BOING!', '#ffe27a'); apoyo = null; } }
    const estabaSuelo = h.suelo;
    if (apoyo) {
      if (!estabaSuelo && h.vy > 500) chispas(h.x, apoyo.y, 5, '#c8b48a');
      h.y = apoyo.y; h.vy = 0; h.suelo = true; h.coyote = .1; h.pisando = apoyo;
      if (apoyo.tipo === 'suelo' && h.x > apoyo.s.x0 + 70 && h.x < apoyo.s.x1 - 70 && !hayEnemigoCerca()) { S.seguro = { x: h.x, y: G }; }
      if (apoyo.tipo === 'plat' && apoyo.p.tipo === 'piedra_num') pisarPiedra(apoyo.p);
    } else { if (h.suelo && h.vy >= 0) h.coyote = .1; h.suelo = false; h.pisando = null; }
    if (h.y > H + 160) { danio('caída'); h.inv = 0; h.vida = Math.max(0, h.vida); if (h.vida <= 0) { h.muerto = .4; } else { reaparecer(true); S.h.inv = 1.6; } return; }

    N.plat.forEach(p => { if (p.estado === 'cruje') { p.t -= dt; if (p.t <= 0) { p.estado = 'caida'; p.vy = 0; } } if (p.estado === 'caida') { p.vy = (p.vy || 0) + 1500 * dt; p.cy = (p.cy || 0) + p.vy * dt; } });
    N.tambores.forEach(t => { if (t.rebote > 0) t.rebote -= dt; });

    // --- trampas ---
    const hb = rect(h.x - h.w / 2 + 4, h.y - h.h, h.w - 8, h.h - 4);
    N.haz.forEach(z => { if (cruza(hb, rect(z.x + 6, z.y + 8, z.w - 12, z.h))) danio('kunai', h.x < z.x + z.w / 2 ? -1 : 1); });

    // --- ataque cuerpo a cuerpo ---
    let tajo = null;
    if (h.atk > .06) tajo = rect(h.dir > 0 ? h.x - 10 : h.x - 120, h.y - 150, 130, 160);
    S.tajoBox = tajo;

    // --- shurikens ---
    S.shur.forEach(s => { s.x += s.vx * dt; s.t -= dt; s.a += dt * 20; });
    S.shur = S.shur.filter(s => s.t > 0 && s.x > S.cam - 80 && s.x < S.cam + W + 80);

    // --- enemigos ---
    S.enemigos.forEach(e => {
      if (!e.vivo) return;
      e.x += e.vx * dt; if (e.x < e.min || e.x > e.max) e.vx = -e.vx; e.dir = e.vx > 0 ? 1 : -1;
      const eb = rect(e.x - 26, e.y - 84, 52, 84);
      let muere = false;
      if (tajo && cruza(tajo, eb)) muere = true;
      S.shur.forEach(s => { if (!s.golpe && cruza(rect(s.x - 16, s.y - 16, 32, 32), eb)) { muere = true; s.golpe = true; s.t = 0; } });
      if (!muere && h.inv <= 0 && cruza(hb, eb)) {
        if (h.vy > 160 && h.y < e.y - 50) { muere = true; h.vy = -650; h.cortado = true; } else danio('ninja', h.x < e.x ? -1 : 1);
      }
      if (muere) { e.vivo = false; chispas(e.x, e.y - 40, 14, '#bbb'); texto(e.x, e.y - 100, '¡Hi-yah!', '#fff'); if (Math.random() < .6) S.items.push({ x: e.x, y: e.y - 40, tipo: 'pergamino', tomado: false }); S.shake = .1; }
    });

    // --- objetos ---
    S.items.forEach(i => {
      if (i.tomado) return;
      if (cruza(hb, rect(i.x - 28, i.y - 28, 56, 56))) {
        if (i.tipo === 'onigiri') { if (h.vida >= S.vidaMax) return; h.vida = Math.min(S.vidaMax, h.vida + 1); texto(i.x, i.y - 30, '+1 ♥', '#7dff9a'); } else { S.pergaminos++; texto(i.x, i.y - 30, '+1 📜', '#ffe27a'); }
        i.tomado = true; chispas(i.x, i.y, 8, '#ffe27a');
      }
    });
    S.ckp.forEach(c => { if (!c.activo && Math.abs(h.x - c.x) < 70 && h.y >= G - 4) { c.activo = true; S.resp = { x: c.x, y: G }; S.seguro = { x: c.x, y: G }; h.vida = Math.min(S.vidaMax, h.vida + 2); S.aviso = { t: 2.2, s: 'PUNTO DE CONTROL · +2 ♥' }; chispas(c.x, G - 120, 24, '#ffd54a'); } });

    estaciones(dt, hb, tajo);

    // --- meta ---
    if (Math.abs(h.x - N.meta.x) < 80 && h.y >= G - 4) {
      if (S.est.every(e => e.resuelta)) terminar(); else if (!S.avisoMeta || S.avisoMeta <= 0) { S.aviso = { t: 2.5, s: 'FALTAN ACERTIJOS POR RESOLVER' }; S.avisoMeta = 3; }
    }
    if (S.avisoMeta > 0) S.avisoMeta -= dt;

    // --- cámara y adornos ---
    const obj = clamp(h.x - 430 + h.dir * 70, 0, N.ancho - W); S.cam += (obj - S.cam) * Math.min(1, dt * 5);
    S.part.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt; }); S.part = S.part.filter(p => p.t > 0);
    S.textos.forEach(t => { t.y -= 40 * dt; t.t -= dt; }); S.textos = S.textos.filter(t => t.t > 0);
    S.hojas.forEach(l => { l.x -= l.v * dt; l.y += (l.v * .5) * dt; l.r += dt; if (l.x < -10 || l.y > H + 10) { l.x = W + 10; l.y = Math.random() * H * .6; } });
    // estación más cercana (para mostrar la pregunta)
    S.estSel = null; S.est.forEach(e => { if (!e.resuelta && h.x > e.x0 - 260 && h.x < e.x0 + e.ancho + 40) S.estSel = e; });
  }
  const hayEnemigoCerca = () => S.enemigos.some(e => e.vivo && Math.abs(e.x - S.h.x) < 260);
  function platTop(p) { const im = p.tipo === 'puente' ? img.puente : p.tipo === 'bambu' ? img.bambu : img.piedra; const w = p.w, hh = im ? im.height * w / im.width : 40; p._h = hh; return p.y + (p.cy || 0); }

  // ============ acertijos en el mundo ============
  function pista(e) {
    const m = /^(\d+)x(\d+)$/.exec(e.ac.hecho); if (!m) return 'Piensa en grupos iguales.';
    const t = +m[1], b = +m[2]; const suma = Array(b).fill(t).join(' + ');
    if (e.ac.tipo === 'salto') return 'Suma ' + t + ' al último número de la cuenta.';
    if (e.ac.tipo === 'factor') return 'Cuenta de ' + t + ' en ' + t + ' hasta llegar a ' + (t * b) + '.';
    if (e.ac.mecanica === 'piedras') return 'Suma ' + t + ' al último número de la cuenta.';
    return b + ' veces ' + t + ' = ' + suma;
  }
  function resolver(e, ok, x, y) {
    if (e.resuelta) return;
    S.maestria.registrar(e.ac.hecho, ok);
    if (ok) {
      e.resuelta = true; S.aciertos++; if (e.errores === 0) S.limpios = (S.limpios || 0) + 1;
      chispas(x, y, 30, '#7dff9a'); texto(x, y - 50, '¡CORRECTO!', '#7dff9a'); S.aviso = { t: 1.6, s: '¡BIEN! ' + e.ac.enunciado.replace(/^.*?(\d)/, '$1') };
      if (e.puertaX !== null) texto(e.puertaX, G - 160, 'SE ABRE EL PASO', '#ffe27a');
      S.items.push({ x: x, y: y - 20, tipo: 'pergamino', tomado: false });
    } else {
      e.errores++; S.errores++; texto(x, y - 40, '¡CASI!', '#ff8a8a');
      e.pistaVisible = true;
    }
  }
  function estaciones(dt, hb, tajo) {
    const h = S.h;
    S.est.forEach(e => {
      if (e.mecanica === 'encender_farol') e.objetos.forEach(o => {
        if (e.resuelta || o.estado !== 'listo') return;
        if (cruza(hb, rect(o.x - 34, o.y - 70, 68, 130))) {
          o.estado = o.correcto ? 'encendido' : 'apagado'; resolver(e, o.correcto, o.x, o.y);
          if (!o.correcto) danio('farol', h.x < o.x ? -1 : 1);
        }
      });
      if (e.mecanica === 'romper_bloques') e.objetos.forEach(o => {
        if (e.resuelta || o.estado !== 'listo') return;
        const bb = rect(o.x - 44, o.y - 44, 88, 88); let golpe = tajo && cruza(tajo, bb);
        S.shur.forEach(s => { if (!s.golpe && cruza(rect(s.x - 16, s.y - 16, 32, 32), bb)) { golpe = true; s.golpe = true; s.t = 0; } });
        if (golpe) { o.estado = 'roto'; chispas(o.x, o.y, 22, o.correcto ? '#7dff9a' : '#ff8a6b'); resolver(e, o.correcto, o.x, o.y); if (!o.correcto && Math.abs(h.x - o.x) < 190) danio('bloque', h.x < o.x ? -1 : 1); }
      });
      if (e.mecanica === 'diana') e.objetos.forEach(o => {
        if (e.resuelta || o.estado !== 'listo') return;
        S.shur.forEach(s => { if (!s.golpe && Math.hypot(s.x - o.x, s.y - o.y) < 52) { s.golpe = true; s.t = 0; o.estado = o.correcto ? 'acertada' : 'fallada'; chispas(o.x, o.y, 16, o.correcto ? '#7dff9a' : '#ff8a6b'); resolver(e, o.correcto, o.x, o.y); if (!o.correcto) danio('diana', h.x < o.x ? -1 : 1); } });
      });
    });
  }
  function pisarPiedra(p) {
    const e = S.est.find(q => q.mecanica === 'piedras' && q.objetos.indexOf(p) >= 0); if (!e || e.resuelta) return;
    if (p.correcta) { if (!p.ok) { p.ok = true; resolver(e, true, p.x + p.w / 2, p.y - 60); } }
    else if (p.estado === 'firme') { p.estado = 'cruje'; p.t = .45; if (!p.contado) { p.contado = true; resolver(e, false, p.x + p.w / 2, p.y - 60); } }
  }

  function terminar() {
    if (S.fin) return; S.fin = { t: 0 };
    const seg = Math.round(S.tiempo);
    Ruta.terminarActo(S.plan, { gano: ['antorcha'].filter(() => false) });
    if (S.perfil && window.Perfiles) {
      Perfiles.actualizar(S.perfil.id, p => {
        p.maestria = S.maestria.estado; p.nivel1 = p.nivel1 || {}; p.nivel1.plan = S.plan; p.nivel1.semilla = S.plan.semilla; p.nivel1.intentos = (p.nivel1.intentos || 0) + 1;
        p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aciertos; p.estadisticas.errores += S.errores; p.estadisticas.minutos += Math.round(seg / 6) / 10;
        p.progreso = p.progreso || { fase: 'easy', nivel: 0, puntos: 0 }; p.progreso.puntos += S.pergaminos * 10 + S.aciertos * 50;
      });
    }
    setTimeout(pantallaFinal, 900);
  }

  // ============ pantallas de fin y decisión ============
  function panel(html) { const d = document.createElement('div'); d.className = 'n1Panel'; d.innerHTML = '<div class="n1Card">' + html + '</div>'; root.appendChild(d); return d; }
  const mm = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function pantallaFinal() {
    if (!S || !root) return;
    const est = S.est.length, limpios = S.limpios || 0;
    const d = panel('<h2>¡ACTO 1 COMPLETADO!</h2><p>Saliste del Bosque de Bambú.</p><div class="n1Stats"><div><b>' + S.aciertos + '/' + est + '</b>acertijos</div><div><b>' + limpios + '</b>a la primera</div><div><b>' + S.errores + '</b>errores</div><div><b>' + S.pergaminos + '</b>pergaminos</div><div><b>' + mm(S.tiempo) + '</b>tiempo</div></div><p>¿Qué camino eliges? Lo que decidas cambia el resto del viaje.</p><div class="n1Opc" id="n1Ops"></div>');
    const cont = d.querySelector('#n1Ops'); const ops = S.plan.opciones;
    ops.forEach((o, i) => {
      const b = document.createElement('button'); b.className = 'n1Op'; b.setAttribute('data-acto', o.acto);
      const estrellas = '★'.repeat(o.riesgo) + '☆'.repeat(Math.max(0, 4 - o.riesgo));
      const rec = o.recompensa.length ? o.recompensa.map(r => BANDERAS[r] || r).join(', ') : 'ninguna';
      b.innerHTML = '<h3>' + (i + 1) + '. ' + o.nombre + '</h3>' + o.pista + '<br><br>Riesgo: ' + estrellas + '<br>Recompensa: ' + rec;
      b.addEventListener('click', () => elegirCamino(o.acto, d)); cont.appendChild(b);
    });
    const tecla = ev => { if (ev.code === 'Digit1' && ops[0]) elegirCamino(ops[0].acto, d); if (ev.code === 'Digit2' && ops[1]) elegirCamino(ops[1].acto, d); };
    window.addEventListener('keydown', tecla, { once: false }); d._k = tecla;
    if (cont.firstChild) cont.firstChild.focus();
  }
  function elegirCamino(acto, d) {
    if (d._k) window.removeEventListener('keydown', d._k);
    Ruta.elegir(S.plan, acto);
    if (S.perfil && window.Perfiles) Perfiles.actualizar(S.perfil.id, p => { p.nivel1.plan = S.plan; });
    const o = S.plan.ultimo; const estado = Ruta.duracionEstimada(S.plan);
    d.remove();
    const p2 = panel('<h2>ELEGISTE: ' + o.nombre.toUpperCase() + '</h2><p>' + o.pista + '</p><p>Tu decisión quedó guardada y cambia las opciones y el jefe final de esta partida.</p><p style="color:#ffc93c">Este acto todavía se está construyendo. Pronto podrás seguir tu camino aquí.</p><div class="n1Fila"><button class="n1Btn" id="n1Otra">↻ JUGAR OTRO BOSQUE</button>' + (S.onSiguiente ? '<button class="n1Btn" id="n1Sig">▶ SEGUIR AL NIVEL 2 (juego anterior)</button>' : '') + '<button class="n1Btn sec" id="n1Menu">VOLVER AL MENÚ</button></div>');
    const bs = p2.querySelector('#n1Sig'); if (bs) bs.onclick = () => { const f = S.onSiguiente; cerrar(true); f(); };
    p2.querySelector('#n1Otra').onclick = () => { const o2 = { heroe: S.heroeId, dispositivo: S.movil ? 'movil' : 'pc', perfil: S.perfil && window.Perfiles ? Perfiles.obtener(S.perfil.id) : null, onSalir: S.onSalir, onSiguiente: S.onSiguiente }; iniciar(o2); };
    p2.querySelector('#n1Menu').onclick = () => cerrar();
  }

  // ============ dibujo ============
  function sprite(im, x, y, w, h, flip) {
    if (!im) return; cx.save(); if (flip) { cx.translate(x + w, y); cx.scale(-1, 1); cx.drawImage(im, 0, 0, w, h); } else cx.drawImage(im, x, y, w, h); cx.restore();
  }
  function porAncho(im, cxm, base, w, flip) { if (!im) return; const h = im.height * w / im.width; sprite(im, cxm - w / 2, base - h, w, h, flip); return h; }

  function fondo() {
    const c = SKY[S.params.variante] || SKY.A, g = cx.createLinearGradient(0, 0, 0, G + 40);
    g.addColorStop(0, c[0]); g.addColorStop(.55, c[1]); g.addColorStop(1, c[2]); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    cx.fillStyle = 'rgba(255,240,200,.9)'; cx.beginPath(); cx.arc(880 - S.cam * .02, 190, 62, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,240,200,.25)'; cx.beginPath(); cx.arc(880 - S.cam * .02, 190, 96, 0, 7); cx.fill();
    if (img.nube) for (let i = 0; i < 4; i++) { const w = 280 + i * 60, x = ((i * 430 - S.t * (8 + i * 3) - S.cam * (.04 + i * .01)) % (W + 500) + (W + 500)) % (W + 500) - 250; cx.globalAlpha = .75; cx.drawImage(img.nube, x, 60 + i * 55, w, img.nube.height * w / img.nube.width); cx.globalAlpha = 1; }
    if (img.montanas) { const mw = 1400, mh = img.montanas.height * mw / img.montanas.width, off = -((S.cam * .12) % mw); for (let x = off; x < W; x += mw) cx.drawImage(img.montanas, x, G - mh + 30, mw, mh); }
    // bambúes lejanos
    for (let capa = 0; capa < 2; capa++) {
      const par = capa ? .4 : .22, sep = capa ? 120 : 90; cx.fillStyle = capa ? 'rgba(30,88,64,.55)' : 'rgba(70,120,110,.35)';
      const o = -((S.cam * par) % sep); for (let x = o - sep; x < W + sep; x += sep) {
        const id = Math.floor((x + S.cam * par) / sep), j = ((id * 9301 + 49297) % 233280) / 233280;
        const w = capa ? 14 : 10, top = 40 + j * 160; cx.fillRect(x + j * 30, top, w, G - top);
        for (let k = top + 50; k < G; k += 60 + j * 20) cx.fillRect(x + j * 30 - 2, k, w + 4, 4);
      }
    }
    const f = cx.createLinearGradient(0, G - 230, 0, G + 20); f.addColorStop(0, 'rgba(255,240,220,0)'); f.addColorStop(1, 'rgba(255,240,220,.35)'); cx.fillStyle = f; cx.fillRect(0, G - 230, W, 250);
  }

  function suelos() {
    const N = S.N, tile = img.suelo; if (!tile) return;
    const tw = 440, th = tile.height * tw / tile.width, so = superficie(tile) * th;
    S.N.gaps.forEach(g => { if (g.x1 < S.cam || g.x0 > S.cam + W) return; const ab = cx.createLinearGradient(0, G, 0, H); ab.addColorStop(0, 'rgba(40,20,70,.0)'); ab.addColorStop(.35, 'rgba(30,12,52,.85)'); ab.addColorStop(1, '#0a0418'); cx.fillStyle = ab; cx.fillRect(g.x0 - S.cam, G - 40, g.x1 - g.x0, H); });
    N.suelo.forEach(s => {
      if (s.x1 < S.cam - 20 || s.x0 > S.cam + W + 20) return;
      cx.save(); cx.beginPath(); cx.rect(s.x0 - S.cam, 0, s.x1 - s.x0, H); cx.clip();
      const gr = cx.createLinearGradient(0, G + th - so - 6, 0, H); gr.addColorStop(0, '#5a321c'); gr.addColorStop(1, '#1c0f08'); cx.fillStyle = gr; cx.fillRect(s.x0 - S.cam, G - so + th - 4, s.x1 - s.x0, H);
      for (let x = Math.floor((s.x0) / tw) * tw; x < s.x1; x += tw) cx.drawImage(tile, x - S.cam, G - so, tw + 1, th);
      cx.restore();
    });
  }

  function decorado(capa) {
    const D = { bambu: [img.bambuDeco, 130], toro: [img.toro, 110], kitsune: [img.kitsune, 110], estandarte: [img.estandarte, 100] };
    S.N.deco.forEach(d => {
      if (d.capa !== capa || d.x < S.cam - 160 || d.x > S.cam + W + 160) return;
      const [im, w] = D[d.tipo]; const esg = d.tipo === 'estandarte'; if (!im) return;
      const hh = im.height * w / im.width; cx.globalAlpha = capa === 'frente' && Math.abs(d.x - S.h.x) < 170 ? .35 : 1;
      if (esg) sprite(im, d.x - S.cam - w / 2, G - hh - 60, w, hh); else sprite(im, d.x - S.cam - w / 2, G + 4 - hh, w, hh); cx.globalAlpha = 1;
    });
    if (capa === 'atras') {
      S.ckp.forEach(c => porAncho(c.activo ? img.toriiOn : img.toriiOff, c.x - S.cam, G + 6, 230));
      porAncho(img.toriiOn, S.N.meta.x - S.cam, G + 6, 300);
    }
  }

  function plataformas() {
    S.N.plat.forEach(p => {
      if (p.x + p.w < S.cam - 40 || p.x > S.cam + W + 40) return;
      const top = platTop(p), im = p.tipo === 'puente' ? img.puente : p.tipo === 'bambu' ? img.bambu : img.piedra; if (!im) return;
      const w = p.tipo === 'piedra_num' ? p.w + 30 : p.w, hh = im.height * w / im.width, so = superficie(im) * hh;
      let dx = p.x - S.cam - (w - p.w) / 2, dy = top - so;
      if (p.estado === 'cruje') dx += Math.sin(S.t * 70) * 3;
      if (p.estado === 'caida' && top > H + 100) return;
      sprite(im, dx, dy, w, hh);
      if (p.tipo === 'piedra_num' && p.valor !== null && p.valor !== undefined) etiqueta(String(p.valor), p.x + p.w / 2 - S.cam, top - 14, 26, p.fija ? '#fff' : '#ffe27a');
    });
    S.N.tambores.forEach(t => { const sq = t.rebote > 0 ? 1 - Math.sin(t.rebote * 10) * .12 : 1; cx.save(); cx.translate(t.x - S.cam, G + 4); cx.scale(1 / sq, sq); porAncho(img.taiko, 0, 0, 130); cx.restore(); });
    S.N.haz.forEach(z => { if (z.x + z.w < S.cam - 20 || z.x > S.cam + W + 20) return; const k = img.kunai; if (k) { const hh = k.height * (z.w + 30) / k.width; sprite(k, z.x - S.cam - 15, z.y + z.h + 6 - hh, z.w + 30, hh); } });
  }
  function etiqueta(s, x, y, tam, col) {
    cx.font = 'bold ' + tam + 'px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.lineWidth = 5; cx.strokeStyle = 'rgba(20,8,40,.9)'; cx.strokeText(s, x, y); cx.fillStyle = col || '#fff'; cx.fillText(s, x, y);
  }

  function estacionesDibujo() {
    S.est.forEach(e => {
      if (e.x0 > S.cam + W + 100 || e.x0 + e.ancho < S.cam - 100) return;
      if (e.puertaX !== null) { // portón de bambú
        const alto = 300, px = e.puertaX - S.cam, k = e.resuelta ? (e.abre = Math.min(1, (e.abre || 0) + .03)) : 0;
        for (let i = -1; i <= 1; i++) { const im = img.bambuDeco; if (im) { cx.save(); cx.beginPath(); cx.rect(px - 40, G - alto, 80, alto); cx.clip(); sprite(im, px - 18 + i * 22, G - alto + k * (alto + 20), 54, alto + 20); cx.restore(); } }
      }
      e.objetos.forEach(o => {
        if (e.mecanica === 'encender_farol') {
          cx.strokeStyle = 'rgba(60,35,20,.8)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(o.x - S.cam, o.y - 150); cx.lineTo(o.x - S.cam, o.y - 70); cx.stroke();
          const im = o.estado === 'encendido' || (e.resuelta && o.correcto) ? img.farolOn : img.farolOff;
          if (im) { cx.save(); if (o.estado === 'apagado') cx.globalAlpha = .5; const hh = im.height * 66 / im.width; sprite(im, o.x - S.cam - 33, o.y - 70, 66, hh); cx.restore(); }
          etiqueta(String(o.valor), o.x - S.cam, o.y - 6, 26, '#fff');
        } else if (e.mecanica === 'romper_bloques') {
          if (o.estado === 'roto') return; const im = img.sello; if (im) sprite(im, o.x - S.cam - 46, o.y - 46 + Math.sin(S.t * 2 + o.x) * 4, 92, 92);
          etiqueta(String(o.valor), o.x - S.cam, o.y + Math.sin(S.t * 2 + o.x) * 4, 26, '#fff');
        } else if (e.mecanica === 'diana') {
          const x = o.x - S.cam; cx.strokeStyle = 'rgba(60,35,20,.8)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x, o.y - 120); cx.lineTo(x, o.y - 40); cx.stroke();
          const cols = o.estado === 'fallada' ? ['#552', '#633'] : o.estado === 'acertada' ? ['#2c7', '#fff'] : ['#d33', '#fff'];
          [44, 33, 22, 11].forEach((r, i) => { cx.fillStyle = i % 2 ? cols[1] : cols[0]; cx.beginPath(); cx.arc(x, o.y, r, 0, 7); cx.fill(); });
          cx.lineWidth = 3; cx.strokeStyle = '#2a1408'; cx.beginPath(); cx.arc(x, o.y, 44, 0, 7); cx.stroke();
          if (o.estado !== 'fallada') etiqueta(String(o.valor), x, o.y + 62, 22, '#fff');
        }
      });
    });
  }

  function dibujarHeroe() {
    const h = S.h, M = S.M; let set = 'idle', fps = 8, idx = 0;
    if (h.muerto > 0) set = 'death'; else if (h.aturdido > 0) set = 'hurt'; else if (h.atk > 0) set = 'atk'; else if (!h.suelo) set = 'jump'; else if (Math.abs(h.vx) > 40) { set = 'run'; fps = 26; }
    const arr = M[set] || M.idle;
    if (set === 'atk') idx = Math.min(arr.length - 1, Math.floor((1 - h.atk / .28) * arr.length));
    else if (set === 'jump') idx = h.vy < -300 ? 0 : h.vy < -60 ? 1 : h.vy < 260 ? Math.min(2, arr.length - 1) : arr.length - 1;
    else if (set === 'hurt' || set === 'death') idx = Math.min(arr.length - 1, Math.floor(S.t * 12) % arr.length);
    else { h.anim += (1 / 60) * fps; idx = Math.floor(h.anim) % arr.length; }
    const f = arr[Math.min(idx, arr.length - 1)], im = img['h:' + set + ':' + Math.min(idx, arr.length - 1)] || img['h:idle:0']; if (!im || !f) return;
    const s = S.alto, w = f.w * s, hh = f.h * s, ax = f.ax * s, ay = f.ay * s;
    if (h.inv > 0 && Math.floor(S.t * 20) % 2) return;
    // sombra
    cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(h.x - S.cam, (h.pisando ? h.y : G) + 4, 30, 7, 0, 0, 7); cx.fill();
    cx.save(); cx.translate(h.x - S.cam, h.y);
    if (h.dir < 0) { cx.scale(-1, 1); }
    cx.drawImage(im, -ax, -ay, w, hh); cx.restore();
    // arco del tajo
    if (h.atk > 0) {
      const p = 1 - h.atk / .28; cx.save(); cx.translate(h.x - S.cam, h.y - 60); cx.scale(h.dir, 1); cx.globalAlpha = Math.sin(p * Math.PI) * .9; cx.strokeStyle = '#fff6c2'; cx.lineWidth = 9; cx.lineCap = 'round';
      cx.beginPath(); cx.arc(10, 0, 86, -1.1 + p * .9, .35 + p * .9); cx.stroke(); cx.strokeStyle = '#ffc93c'; cx.lineWidth = 4; cx.stroke(); cx.restore();
    }
  }

  function dibujar() {
    if (!S || !cx) return;
    const sh = S.shake > 0 ? (Math.random() - .5) * 10 * S.shake * 4 : 0;
    cx.save(); cx.translate(sh, sh); cx.clearRect(-20, -20, W + 40, H + 40);
    fondo(); decorado('atras'); suelos(); plataformas(); estacionesDibujo();
    // enemigos
    S.enemigos.forEach(e => { if (!e.vivo || e.x < S.cam - 80 || e.x > S.cam + W + 80) return; const b = Math.abs(Math.sin(S.t * 8 + e.x)) * 4; porAncho2(img.ninja, e.x - S.cam, e.y - b, 96, e.dir < 0); });
    // objetos
    S.items.forEach(i => { if (i.tomado || i.x < S.cam - 60 || i.x > S.cam + W + 60) return; const im = i.tipo === 'onigiri' ? img.onigiri : img.pergamino; const w = i.tipo === 'onigiri' ? 46 : 52; if (im) { const hh = im.height * w / im.width; sprite(im, i.x - S.cam - w / 2, i.y - hh / 2 + Math.sin(S.t * 3 + i.x) * 5, w, hh); } });
    dibujarHeroe();
    // shurikens
    S.shur.forEach(s => { const im = img.shuriken; if (!im) return; const fw = im.width / 8, f = Math.floor(S.t * 20) % 8; cx.drawImage(im, f * fw, 0, fw, im.height, s.x - S.cam - 40, s.y - 40, 80, 80 * im.height / fw); });
    decorado('frente');
    // partículas y hojas
    S.part.forEach(p => { cx.globalAlpha = clamp(p.t * 2, 0, 1); cx.fillStyle = p.col; cx.fillRect(p.x - S.cam - p.r / 2, p.y - p.r / 2, p.r, p.r); }); cx.globalAlpha = 1;
    S.hojas.forEach(l => { cx.save(); cx.translate(l.x, l.y); cx.rotate(l.r); cx.fillStyle = 'rgba(120,200,90,.75)'; cx.beginPath(); cx.ellipse(0, 0, l.s, l.s * .35, 0, 0, 7); cx.fill(); cx.restore(); });
    S.textos.forEach(t => { cx.globalAlpha = clamp(t.t * 2, 0, 1); etiqueta(t.s, t.x - S.cam, t.y, 22, t.col); }); cx.globalAlpha = 1;
    const v = cx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,30,.45)'); cx.fillStyle = v; cx.fillRect(0, 0, W, H);
    if (S.flash > 0) { cx.fillStyle = 'rgba(255,60,60,' + S.flash * 1.2 + ')'; cx.fillRect(0, 0, W, H); }
    cx.restore();
    hud();
  }
  function porAncho2(im, x, base, w, flip) { if (!im) return; const hh = im.height * w / im.width; sprite(im, x - w / 2, base - hh, w, hh, flip); }

  function caja(x, y, w, h, r, fill, stroke) { cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, w, h, r) : cx.rect(x, y, w, h); cx.fillStyle = fill; cx.fill(); if (stroke) { cx.lineWidth = 2; cx.strokeStyle = stroke; cx.stroke(); } }
  function hud() {
    const h = S.h;
    for (let i = 0; i < S.vidaMax; i++) { cx.fillStyle = i < h.vida ? '#ff4d6d' : 'rgba(255,255,255,.18)'; cx.font = '30px sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'top'; cx.fillText('♥', 20 + i * 36, 14); }
    caja(20, 58, 120, 32, 8, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.6)'); cx.font = 'bold 16px ui-monospace,monospace'; cx.fillStyle = '#ffe27a'; cx.textAlign = 'left'; cx.fillText('📜 ' + S.pergaminos, 32, 65);
    const res = S.est.filter(e => e.resuelta).length; caja(W - 220, 14, 200, 38, 10, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.6)'); cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.font = 'bold 15px ui-monospace,monospace'; cx.fillText('ACERTIJOS ' + res + '/' + S.est.length, W - 120, 26);
    // barra de avance
    const px = 20 + (W - 40) * clamp(h.x / S.N.ancho, 0, 1); cx.fillStyle = 'rgba(255,255,255,.2)'; cx.fillRect(20, H - 16, W - 40, 5); cx.fillStyle = '#ffc93c'; cx.fillRect(20, H - 16, px - 20, 5);
    S.est.forEach(e => { cx.fillStyle = e.resuelta ? '#7dff9a' : '#fff'; cx.fillRect(20 + (W - 40) * (e.x0 + e.ancho / 2) / S.N.ancho - 3, H - 20, 6, 13); });
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(px, H - 13, 8, 0, 7); cx.fill();
    // pregunta de la estación cercana
    const e = S.estSel;
    if (e) {
      const t = e.ac.enunciado; cx.font = 'bold 24px ui-monospace,monospace'; const tw = Math.min(W - 80, cx.measureText(t).width + 60);
      caja(W / 2 - tw / 2, 14, tw, e.pistaVisible ? 88 : 54, 14, 'rgba(18,8,51,.88)', '#ffc93c'); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, W / 2, 41);
      if (e.pistaVisible) { cx.font = '15px ui-monospace,monospace'; cx.fillStyle = '#ffe27a'; cx.fillText('Pista: ' + pista(e), W / 2, 78); }
      cx.font = '13px ui-monospace,monospace'; cx.fillStyle = 'rgba(255,255,255,.85)'; cx.fillText({ encender_farol: 'SALTA y toca el farol con la respuesta', romper_bloques: 'SALTA y rompe el sello con el TAJO (C) o un SHURIKEN (F)', diana: 'Lanza el SHURIKEN (F) a la diana correcta · salta para apuntar más alto', piedras: 'Salta a la piedra que sigue la cuenta · ¡las otras se rompen!' }[e.mecanica] || '', W / 2, e.pistaVisible ? 118 : 74);
    }
    if (S.aviso && S.aviso.t > 0) { cx.globalAlpha = clamp(S.aviso.t, 0, 1); cx.font = 'bold 30px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; const tw = cx.measureText(S.aviso.s).width + 70; caja(W / 2 - tw / 2, 150, tw, 62, 14, 'rgba(18,8,51,.85)', '#ffc93c'); cx.fillStyle = '#ffe27a'; cx.fillText(S.aviso.s, W / 2, 182); cx.globalAlpha = 1; }
    if (S.t < 14 && !S.movil) { cx.globalAlpha = clamp(1 - (S.t - 9) / 5, 0, .85); cx.font = '14px ui-monospace,monospace'; cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText('← → mover · ESPACIO saltar (mantén para saltar más alto) · C tajo · F shuriken · ESC pausa', W / 2, H - 34); cx.globalAlpha = 1; }
    if (S.pausa) { cx.fillStyle = 'rgba(8,3,24,.75)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#ffc93c'; cx.font = 'bold 44px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('PAUSA', W / 2, H / 2 - 20); cx.font = '18px ui-monospace,monospace'; cx.fillStyle = '#fff'; cx.fillText('ESC para seguir · Q para salir al menú', W / 2, H / 2 + 30); }
  }

  window.Nivel1 = { iniciar, cerrar, _estado: () => S, _debug: { G, DT, paso: n => { for (let i = 0; i < (n || 1); i++) paso(DT); }, keys } };
})();
