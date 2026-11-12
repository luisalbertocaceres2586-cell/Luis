/* Motor del Nivel 1 — Ninja Multiplicación (núcleo)
 * Una sola pantalla (canvas 1280×720 escalado) sin tocar el motor de los otros niveles.
 * Núcleo: carga de arte, entrada, física del héroe, sólidos, plataformas móviles, estaciones de acertijo,
 * apuntado con el shuriken (diana fija), tutoriales, cueva a oscuras, dibujo y pantallas.
 * Los elementos especiales (carretas, palancas, jefe, enemigos...) están en elementos.js. */
(function () {
  'use strict';
  const W = 1280, H = 720, G = 560, DT = 1 / 60;
  const A = 'assets/nivel1/';
  const IMGS = {
    suelo: 'terreno/suelo_bosque', sueloCueva: 'terreno/suelo_cueva', puente: 'terreno/puente_cuerda', bambu: 'terreno/plataforma_bambu', piedra: 'terreno/plataforma_piedra_toro',
    roca: 'terreno/roca_cueva_flotante', viga: 'terreno/viga_torre', kunai: 'terreno/kunai_trampa', bambuDeco: 'decorado/bambu_primer_plano', toro: 'decorado/toro_piedra',
    kitsune: 'decorado/estatua_kitsune', estandarte: 'decorado/estandarte_colgante', toriiOff: 'decorado/torii_inactivo', toriiOn: 'decorado/torii_activo', carreta: 'decorado/carreta_madera',
    farolOff: 'cueva/farol_papel_apagado', farolOn: 'cueva/farol_papel_encendido', estal: 'cueva/estalactita_grande', cristal: 'cueva/cristales_azules', hongo: 'cueva/hongos_luminosos',
    tela: 'cueva/telarana', antOn: 'cueva/antorcha_pared_encendida', antOff: 'cueva/antorcha_pared_apagada', boca: 'cueva/boca_cueva',
    ninja: 'enemigos/ninja_sombra', ninjaAtk: 'enemigos/ninja_sombra_ataque', tengu: 'enemigos/tengu_cuervo', murcielago: 'enemigos/murcielago', arana: 'enemigos/arana_colgante',
    fuego: 'enemigos/espiritu_fuego_fatuo', rocaG: 'enemigos/roca_gigante', oni: 'enemigos/oni_rojo_minijefe',
    pergamino: 'items_jefe/pergamino', onigiri: 'items_jefe/onigiri_curacion', taiko: 'items_jefe/tambor_taiko', sello: 'items_jefe/sello_piedra', orbe: 'items_jefe/orbe_energia',
    shuriken: 'animados/shuriken_espiritual_8', antorchaAnim: 'animados/antorcha_llama_10',
    montanas: '../environment/levels/nivel1/n1_bg_montanas_lejos', nube: '../environment/levels/nivel1/nubes/nube_01'
  };
  const SKY = { A: ['#2b2468', '#ff8f6b', '#ffe3a3'], B: ['#3d5a80', '#98c1d9', '#e8f1f2'], C: ['#5c2a6e', '#e86a5c', '#ffd08a'] };
  const BANDERAS = { antorcha: 'una antorcha', armadura: 'la armadura samurái', aliado_mercader: 'la ayuda del mercader', bendicion_zorro: 'la bendición del zorro', llave_dojo: 'la llave del dojo', llave_portal: 'la llave del portal', vista_torre: 'vista desde la torre', pergamino_dragon: 'el pergamino del dragón', ritmo_tejados: 'ritmo de tejados' };

  let root, cv, cx, oc, ox, raf = 0, last = 0, acc = 0, S = null;
  const keys = {}, img = {}, surfCache = new Map();
  const core = { W, H, G, DT, img, keys };
  window.N1core = core;

  // ============ utilidades ============
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rect = (x, y, w, h) => ({ x, y, w, h });
  const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  Object.assign(core, { clamp, rect, cruza, S: () => S });
  const cargarImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { console.warn('[Nivel1] falta', src); res(null); }; i.src = src; });
  const cargarScript = src => new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  function superficie(im) {
    if (!im) return 0; if (surfCache.has(im)) return surfCache.get(im);
    const w = Math.min(160, im.width), h = Math.round(im.height * w / im.width), c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data; let r = 0;
    for (let y = 0; y < h; y++) { let n = 0; for (let k = Math.floor(w * .15); k < w * .85; k++) if (d[(y * w + k) * 4 + 3] > 120) n++; if (n / (w * .7) > 0.6) { r = y / h; break; } }
    surfCache.set(im, r); return r;
  }
  core.superficie = superficie;

  // ============ carga ============
  async function cargar(heroe, progreso) {
    const hm = heroe === 'kage' ? 'KAGE_MANIFEST' : 'SAKURA_MANIFEST';
    if (!window[hm]) await cargarScript('assets/characters/' + heroe + '/manifest.js');
    const M = window[hm]; if (!M) throw new Error('No se encontró el manifest de ' + heroe);
    const lista = Object.keys(IMGS).map(k => [k, A + IMGS[k] + '.png']);
    ['idle', 'run', 'jump', 'atk', 'hurt', 'death'].forEach(set => (M[set] || []).forEach((f, i) => lista.push(['h:' + set + ':' + i, 'assets/characters/' + heroe + '/' + f.file])));
    let n = 0; await Promise.all(lista.map(async ([k, src]) => { img[k] = await cargarImg(src); progreso(++n / lista.length); }));
    return M;
  }

  // ============ arranque ============
  async function iniciar(o) {
    o = o || {}; cerrar(true);
    const heroe = o.heroe === 'kage' ? 'kage' : 'sakura';
    crearPantalla();
    const barra = root.querySelector('#n1Barra'), msg = root.querySelector('#n1Msg'); msg.textContent = 'Preparando el bosque…';
    let M; try { M = await cargar(heroe, p => { barra.style.width = Math.round(p * 100) + '%'; }); } catch (e) { msg.textContent = 'No se pudo cargar: ' + e.message; return; }
    root.querySelector('#n1Carga').remove();
    Ruta.config.soloListos = true;
    const plan = o.plan || Ruta.nuevoPlan(o.semilla);
    if (!plan.jugados.length) Ruta.elegir(plan, 'bosque');
    const op = plan.opciones.find(x => x.acto === 'bosque') || plan.ultimo;
    const maestria = Acertijos.crearMaestria(o.perfil && o.perfil.maestria ? o.perfil.maestria : {});
    const N = GenNivel.generar(Object.assign({}, op.params, { preguntas: 16 }), maestria);
    const visto = Object.assign({}, o.perfil && o.perfil.tutoriales);
    S = {
      heroeId: heroe, M, plan, params: op.params, N, maestria, perfil: o.perfil || null, onSalir: o.onSalir || null, onSiguiente: o.onSiguiente || null,
      movil: o.dispositivo === 'movil' || /[?&]movil=1/.test(location.search),
      h: { x: N.inicio.x, y: G, vx: 0, vy: 0, w: 34, h: 92, dir: 1, suelo: true, coyote: 0, buffer: 0, inv: 0, atk: 0, atkCd: 0, shCd: 0, vida: 5, muerto: 0, aturdido: 0, pisando: null, anim: 0, lento: 0 },
      cam: 0, t: 0, tiempo: 0, vidaMax: 5, seguro: { x: N.inicio.x, y: G }, resp: { x: N.inicio.x, y: G },
      shur: [], part: [], hojas: [], textos: [], enemigos: N.enem, items: N.items.map(i => Object.assign({ tomado: false }, i)), est: N.est, ckp: N.ckp,
      pergaminos: 0, aciertos: 0, errores: 0, limpios: 0, pausa: false, fin: null, aviso: { t: 4, s: 'BOSQUE DE BAMBÚ' }, estSel: null, shake: 0, flash: 0,
      alto: 100 / (M.idle[0].h || 200), luz: 240, osc: 0, mezcla: 0, zonaVista: 'bosque', apunta: null, tutoVisto: visto, tip: null, tipT: 0, movido: 0, saltos: 0, tajos: 0, rebotes: 0, tiros: 0
    };
    N.plat.forEach(p => { p.X = p.x; p.Y = p.y; p.dX = 0; p.dY = 0; });
    for (let i = 0; i < 26; i++) S.hojas.push({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 30, r: Math.random() * 6, s: 5 + Math.random() * 6 });
    oc = document.createElement('canvas'); oc.width = W; oc.height = H; ox = oc.getContext('2d');
    if (S.movil) crearTactil();
    window.addEventListener('keydown', onKey, true); window.addEventListener('keyup', onKeyUp, true); window.addEventListener('resize', ajustar);
    cv.addEventListener('pointerdown', onPointer);
    ajustar(); last = performance.now(); acc = 0; raf = requestAnimationFrame(bucle);
  }
  function cerrar(silencioso) {
    cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true); window.removeEventListener('resize', ajustar);
    if (root) root.remove(); root = null; Object.keys(keys).forEach(k => delete keys[k]);
    const cb = S && S.onSalir; S = null; core.cartaEmpujada = core.vientoUsado = core.emboscadaActiva = core.rocaActiva = core.jefeActivo = false; if (!silencioso && cb) cb();
  }

  // ============ pantalla ============
  const CSS = `
#n1Root{position:fixed;inset:0;z-index:90000;background:#0a0618;display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:'Press Start 2P',ui-monospace,monospace;color:#fff;touch-action:none;user-select:none}
#n1Root canvas{display:block;background:#000}
#n1Carga{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(ellipse at 50% 35%,#3a1a6e,#0a0618);z-index:3}
#n1Carga .t{color:#FFC93C;font-size:clamp(12px,2.4vw,20px)}#n1Carga .b{width:min(420px,70vw);height:12px;border:2px solid #FFC93C;border-radius:8px;overflow:hidden}
#n1Barra{height:100%;width:0;background:linear-gradient(90deg,#ff4d9d,#ffc93c);transition:width .15s}#n1Msg{font-size:9px;color:#c9b8ff}
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
.n1Btn.sec{background:rgba(255,255,255,.14);color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.4)}.n1Fila{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.n1Tac{position:absolute;z-index:5;display:flex;gap:10px;bottom:14px}
.n1Tac button{width:clamp(54px,12vw,84px);height:clamp(54px,12vw,84px);border-radius:50%;border:2px solid rgba(255,255,255,.6);background:rgba(255,255,255,.18);color:#fff;font-size:clamp(16px,4vw,26px);touch-action:none}`;
  function crearPantalla() {
    if (!document.getElementById('n1Css')) { const s = document.createElement('style'); s.id = 'n1Css'; s.textContent = CSS; document.head.appendChild(s); }
    root = document.createElement('div'); root.id = 'n1Root';
    root.innerHTML = '<div id="n1Carga"><div class="t">LA SENDA DEL APRENDIZ NINJA</div><div class="b"><div id="n1Barra"></div></div><div id="n1Msg"></div></div>';
    cv = document.createElement('canvas'); cv.width = W; cv.height = H; root.insertBefore(cv, root.firstChild); cx = cv.getContext('2d'); core.cx = cx; document.body.appendChild(root);
    ['keydown', 'keyup', 'keypress'].forEach(t => root.addEventListener(t, e => e.stopPropagation()));
  }
  function ajustar() { if (!cv) return; const k = Math.min(innerWidth / W, innerHeight / H); cv.style.width = Math.floor(W * k) + 'px'; cv.style.height = Math.floor(H * k) + 'px'; }
  function crearTactil() {
    const izq = document.createElement('div'), der = document.createElement('div'); izq.className = der.className = 'n1Tac'; izq.style.left = '14px'; der.style.right = '14px';
    const b = (txt, tecla, cont) => { const e = document.createElement('button'); e.textContent = txt; const on = ev => { ev.preventDefault(); if (!keys[tecla]) pulsar(tecla); keys[tecla] = 1; }, off = ev => { ev.preventDefault(); if (keys[tecla]) soltar(tecla); keys[tecla] = 0; }; e.addEventListener('pointerdown', on); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => e.addEventListener(t, off)); cont.appendChild(e); };
    b('◀', 'ArrowLeft', izq); b('▶', 'ArrowRight', izq); b('🗡', 'KeyC', der); b('✦', 'KeyF', der); b('⤒', 'Space', der); root.appendChild(izq); root.appendChild(der);
  }

  // ============ entrada ============
  const CTRL = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyF', 'KeyC', 'KeyJ', 'KeyK', 'KeyZ', 'KeyX'];
  const izq = () => keys.ArrowLeft || keys.KeyA, der = () => keys.ArrowRight || keys.KeyD, salto = () => keys.Space || keys.ArrowUp || keys.KeyW;
  const esF = c => c === 'KeyF' || c === 'KeyK' || c === 'KeyX';
  function pulsar(code) {
    if (!S) return;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') S.h.buffer = .12;
    if (esF(code) && !S.fin && !S.pausa) empezarApuntar();
    if (S.apunta && (code === 'ArrowLeft' || code === 'KeyA')) cambiarObjetivo(-1);
    if (S.apunta && (code === 'ArrowRight' || code === 'KeyD')) cambiarObjetivo(1);
  }
  function soltar(code) { if (S && esF(code)) lanzar(); }
  function onKey(e) {
    if (!S) return;
    if (CTRL.indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (S.apunta) { S.apunta = null; } else if (!S.fin) S.pausa = !S.pausa; return; }
    if (S.pausa && e.code === 'KeyQ') { cerrar(); return; }
    if (!keys[e.code]) pulsar(e.code); keys[e.code] = 1; e.stopImmediatePropagation();
  }
  function onKeyUp(e) { if (!S) return; if (keys[e.code]) soltar(e.code); keys[e.code] = 0; if (CTRL.indexOf(e.code) >= 0) { e.preventDefault(); e.stopImmediatePropagation(); } }
  function onPointer(e) {   // toque o clic sobre un objetivo: lo elige y lanza
    if (!S || S.fin || S.pausa) return; const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * W / r.width + S.cam, py = (e.clientY - r.top) * H / r.height;
    const est = S.estSel; if (!est) return; const lst = objetivos(est);
    let mejor = null, d = 70; lst.forEach(o => { const dd = Math.hypot(o.x - px, o.y - py); if (dd < d) { d = dd; mejor = o; } }); if (mejor) disparar(mejor, est);
  }

  // ============ efectos y daño ============
  const texto = (x, y, s, col) => S.textos.push({ x, y, s, col: col || '#fff', t: 1.1 });
  const chispas = (x, y, n, col) => { for (let i = 0; i < n; i++) S.part.push({ x, y, vx: (Math.random() - .5) * 300, vy: -Math.random() * 300 - 40, t: .5 + Math.random() * .4, col: col || '#ffd54a', r: 2 + Math.random() * 3 }); };
  function danio(razon, kx, cuanto) {
    const h = S.h; if (h.inv > 0 || h.muerto > 0) return; cuanto = cuanto || 1;
    h.vida -= cuanto; h.inv = 1.4; h.aturdido = .28; h.vy = -420; h.vx = (kx || -h.dir) * 260; h.suelo = false; S.shake = .25; S.flash = .2; S.apunta = null;
    texto(h.x, h.y - 100, '-' + cuanto + ' ♥', '#ff6b6b'); chispas(h.x, h.y - 50, 10, '#ff6b6b'); if (h.vida <= 0) h.muerto = 1.2;
  }
  function reaparecer() {
    const h = S.h; if (h.vida <= 0) { h.vida = 3; S.aviso = { t: 2.5, s: 'VUELVES AL ÚLTIMO PUNTO DE CONTROL' }; h.x = S.resp.x; } else h.x = S.seguro.x;
    h.y = G - 400; h.vy = 0; h.vx = 0; h.inv = 1.6; h.muerto = 0; h.suelo = false; S.cam = clamp(h.x - 440, 0, S.N.ancho - W); S.apunta = null;
    N1elem.alReaparecer();
  }
  Object.assign(core, { texto, chispas, danio });

  // ============ plataformas ============
  function actualizarPlataformas(dt) {
    S.N.plat.forEach(p => {
      const ox = p.X, oy = p.Y;
      if (p.mov) { const f = Math.sin(S.t * p.mov.v + p.mov.f * 2); p.X = p.x + f * p.mov.rx; p.Y = p.y + f * p.mov.ry; } else { p.X = p.x; p.Y = p.y; }
      if (p.estado === 'cruje') { p.t -= dt; if (p.t <= 0) { p.estado = 'caida'; p.vy = 0; p.reset = 3.2; } }
      if (p.estado === 'caida') { p.vy += 1500 * dt; p.cy = (p.cy || 0) + p.vy * dt; if (p.fragil) { p.reset -= dt; if (p.reset <= 0 && Math.abs(S.h.x - p.x) > 260) { p.estado = 'firme'; p.cy = 0; } } }
      p.dX = p.X - ox; p.dY = p.Y - oy;
    });
  }
  const platY = p => p.Y + (p.cy || 0);

  // ============ simulación ============
  function bucle(now) {
    raf = requestAnimationFrame(bucle); if (!S) return;
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    let n = 0; while (acc >= DT && n++ < 6) { if (!S.pausa && !S.fin) paso(DT * (S.apunta ? .3 : 1)); acc -= DT; }
    dibujar();
  }
  const muroSolido = m => !(m.abierta || m.roto);
  core.muroSolido = muroSolido;
  const hayEnemigoCerca = () => S.enemigos.some(e => e.vivo && e.kind !== 'oni' && Math.abs(e.x - S.h.x) < 260);

  function paso(dt) {
    const h = S.h, N = S.N; S.t += dt; S.tiempo += dt;
    if (S.aviso && S.aviso.t > 0) S.aviso.t -= dt;
    h.inv = Math.max(0, h.inv - dt); h.aturdido = Math.max(0, h.aturdido - dt); h.atkCd = Math.max(0, h.atkCd - dt); h.shCd = Math.max(0, h.shCd - dt); h.atk = Math.max(0, h.atk - dt);
    h.buffer = Math.max(0, h.buffer - dt); h.coyote = Math.max(0, h.coyote - dt); h.lento = Math.max(0, h.lento - dt); S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt);
    if (h.muerto > 0) { h.muerto -= dt; h.vy += 2300 * dt; h.y += h.vy * dt; if (h.muerto <= 0) reaparecer(); return; }
    actualizarPlataformas(dt);
    if (h.pisando && h.pisando.tipo === 'plat' && h.suelo) { h.x += h.pisando.p.dX; h.y = platY(h.pisando.p); }

    const dirIn = S.apunta ? 0 : (der() ? 1 : 0) - (izq() ? 1 : 0);
    if (h.aturdido <= 0) {
      const tope = h.lento > 0 ? 120 : (h.empuja ? 150 : 340), a = h.suelo ? 3400 : 2300;
      if (dirIn) { h.vx += clamp(dirIn * tope - h.vx, -a * dt, a * dt); h.dir = dirIn; } else h.vx += clamp(-h.vx, -3000 * dt, 3000 * dt) * (h.suelo ? 1 : .4);
      if (h.buffer > 0 && (h.suelo || h.coyote > 0) && !S.apunta) { h.vy = -900; h.suelo = false; h.coyote = 0; h.buffer = 0; h.cortado = false; S.saltos++; chispas(h.x, h.y, 4, '#c8b48a'); }
      if (!salto() && h.vy < -330 && !h.cortado) { h.vy *= .55; h.cortado = true; }
      if ((keys.KeyC || keys.KeyJ || keys.KeyZ) && h.atkCd <= 0 && !S.apunta) { h.atk = .28; h.atkCd = .38; S.tajos++; }
    }
    h.empuja = false; h.vy = Math.min(1250, h.vy + 2300 * dt);

    h.x += h.vx * dt; h.x = clamp(h.x, 20, N.ancho - 20); if (Math.abs(h.vx) > 40) S.movido += Math.abs(h.vx) * dt;
    resolverHorizontal();
    const antesY = h.y; h.y += h.vy * dt; let apoyo = null;
    if (h.vy >= 0) {
      for (const s of N.suelo) if (h.x >= s.x0 - 8 && h.x <= s.x1 + 8 && antesY <= G + 6 && h.y >= G) { apoyo = { y: G, tipo: 'suelo', s }; break; }
      for (const p of N.plat) { if (p.estado === 'caida') continue; const top = platY(p); if (h.x + h.w / 2 > p.X + 6 && h.x - h.w / 2 < p.X + p.w - 6 && antesY <= top + 8 && h.y >= top) { if (!apoyo || top < apoyo.y) apoyo = { y: top, tipo: 'plat', p }; } }
      for (const m of N.muros) { if (!muroSolido(m)) continue; if (h.x + h.w / 2 > m.x + 4 && h.x - h.w / 2 < m.x + m.w - 4 && antesY <= m.y + 8 && h.y >= m.y) { if (!apoyo || m.y < apoyo.y) apoyo = { y: m.y, tipo: 'muro', m }; } }
      N1elem.apoyos(h, antesY, (top, ref) => { if (!apoyo || top < apoyo.y) apoyo = { y: top, tipo: 'elem', ref }; });
    } else { for (const m of N.muros) { if (muroSolido(m) && h.x + h.w / 2 > m.x && h.x - h.w / 2 < m.x + m.w && antesY - h.h >= m.y + m.h - 4 && h.y - h.h < m.y + m.h) { h.y = m.y + m.h + h.h; h.vy = 80; } } }
    for (const t of N.tambores) {
      t.cd = Math.max(0, (t.cd || 0) - dt); t.rebote = Math.max(0, (t.rebote || 0) - dt); const top = t.y - 52;
      if (t.cd <= 0 && Math.abs(h.x - t.x) < 60 && h.y >= top && h.y <= t.y + 12 && h.vy >= 0) { h.y = top; h.vy = -1320; h.suelo = false; t.rebote = .3; t.cd = .35; S.rebotes++; chispas(t.x, top, 10, t.hongo ? '#7ff' : '#ffe27a'); texto(t.x, top - 40, t.hongo ? '¡BOING!' : '¡BOOM!', '#ffe27a'); apoyo = null; }
    }
    const estaba = h.suelo;
    if (apoyo) {
      if (!estaba && h.vy > 500) chispas(h.x, apoyo.y, 5, '#c8b48a');
      h.y = apoyo.y; h.vy = 0; h.suelo = true; h.coyote = .1; h.pisando = apoyo;
      if (apoyo.tipo === 'suelo' && h.x > apoyo.s.x0 + 70 && h.x < apoyo.s.x1 - 70 && !hayEnemigoCerca()) S.seguro = { x: h.x, y: G };
      if (apoyo.tipo === 'plat') { const p = apoyo.p; if (p.tipo === 'piedra_num') pisarPiedra(p); if (p.fragil && p.estado === 'firme') { p.estado = 'cruje'; p.t = .4; } }
    } else { if (h.suelo && h.vy >= 0) h.coyote = .1; h.suelo = false; h.pisando = null; }
    if (h.y > H + 160) { if (h.vida > 1) { h.vida--; texto(h.x, 300, '-1 ♥', '#ff6b6b'); S.shake = .3; reaparecer(); } else { h.vida = 0; h.muerto = .4; } return; }

    const hb = rect(h.x - h.w / 2 + 4, h.y - h.h, h.w - 8, h.h - 4); S.hb = hb;
    N.haz.forEach(z => { if (cruza(hb, rect(z.x + 6, z.y + 8, z.w - 12, z.h))) danio('kunai', h.x < z.x + z.w / 2 ? -1 : 1); });
    S.tajo = h.atk > .06 ? rect(h.dir > 0 ? h.x - 10 : h.x - 120, h.y - 150, 130, 160) : null;

    S.shur.forEach(s => {
      s.t -= dt; s.a += dt * 20;
      if (s.obj) { const dx = s.obj.x - s.x, dy = s.obj.y - s.y, d = Math.hypot(dx, dy) || 1; s.x += dx / d * 980 * dt; s.y += dy / d * 980 * dt; if (d < 40) { s.t = 0; golpearObjetivo(s.est, s.obj, 'shuriken'); } } else s.x += s.vx * dt;
    });
    S.shur = S.shur.filter(s => s.t > 0 && s.x > S.cam - 120 && s.x < S.cam + W + 120);

    S.items.forEach(i => { if (i.tomado) return; if (cruza(hb, rect(i.x - 28, i.y - 28, 56, 56))) { if (i.tipo === 'onigiri') { if (h.vida >= S.vidaMax) return; h.vida = Math.min(S.vidaMax, h.vida + 1); texto(i.x, i.y - 30, '+1 ♥', '#7dff9a'); } else { S.pergaminos++; texto(i.x, i.y - 30, '+1 📜', '#ffe27a'); } i.tomado = true; chispas(i.x, i.y, 8, '#ffe27a'); } });
    S.ckp.forEach(c => { if (!c.activo && Math.abs(h.x - c.x) < 70 && h.y >= G - 4) { c.activo = true; S.resp = { x: c.x, y: G }; S.seguro = { x: c.x, y: G }; h.vida = Math.min(S.vidaMax, h.vida + 2); S.luz = 250; S.aviso = { t: 2.2, s: 'PUNTO DE CONTROL · +2 ♥' }; chispas(c.x, G - 120, 24, '#ffd54a'); } });

    N1elem.paso(dt, hb); estaciones();

    const cuevaX = N.cueva.x + 120, alC = clamp((h.x - cuevaX) / 360, 0, 1);
    S.mezcla += (alC - S.mezcla) * Math.min(1, dt * 3); S.osc = S.mezcla;
    if (S.zonaVista === 'bosque' && h.x > cuevaX + 100) { S.zonaVista = 'cueva'; S.aviso = { t: 3.5, s: 'CUEVA DE LAS LUCIÉRNAGAS' }; S.luz = 250; }
    if (S.osc > .3) S.luz = Math.max(130, S.luz - 1.4 * dt);
    if (Math.abs(h.x - N.meta.x) < 80 && h.y >= G - 4) { if (S.est.every(e => e.resuelta)) terminar(); else if (!(S.avisoMeta > 0)) { S.aviso = { t: 2.5, s: 'FALTAN ACERTIJOS POR RESOLVER' }; S.avisoMeta = 3; } }
    if (S.avisoMeta > 0) S.avisoMeta -= dt;

    const obj = clamp(h.x - 430 + h.dir * 70, 0, N.ancho - W); S.cam += (obj - S.cam) * Math.min(1, dt * 5);
    S.part.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt; }); S.part = S.part.filter(p => p.t > 0);
    S.textos.forEach(t => { t.y -= 40 * dt; t.t -= dt; }); S.textos = S.textos.filter(t => t.t > 0);
    S.hojas.forEach(l => { l.x -= l.v * dt; l.y += l.v * .5 * dt; l.r += dt; if (l.x < -10 || l.y > H + 10) { l.x = W + 10; l.y = Math.random() * H * .6; } });
    S.estSel = null; S.est.forEach(e => { if (!e.resuelta && h.x > e.x0 - 260 && h.x < e.x0 + e.ancho + 40) S.estSel = e; });
    tutoriales(dt);
  }

  function resolverHorizontal() {
    const h = S.h, N = S.N, hb = rect(h.x - h.w / 2, h.y - h.h, h.w, h.h - 2);
    S.est.forEach(e => { if (e.puertaX !== null && !e.resuelta) { const px = e.puertaX; if (h.x + h.w / 2 > px - 12 && h.x - h.w / 2 < px + 12 && h.y > G - 300) { h.x = h.x < px ? px - 12 - h.w / 2 : px + 12 + h.w / 2; h.vx = 0; } } });
    N.muros.forEach(m => { if (!muroSolido(m)) return; if (cruza(hb, m) && h.y > m.y + 8) { h.x = (h.x < m.x + m.w / 2) ? m.x - h.w / 2 : m.x + m.w + h.w / 2; h.vx = 0; } });
    N1elem.empujes(h, hb);
  }

  // ============ acertijos en el mundo ============
  const objetivos = e => e.mecanica === 'empujar_carreta' ? [] : e.objetos.filter(o => (o.estado === 'listo' || o.estado === 'apagada') && o.valor !== undefined);
  function pista(e) {
    const m = /^(\d+)x(\d+)$/.exec(e.ac.hecho); if (!m) return 'Piensa en grupos iguales.'; const t = +m[1], b = +m[2];
    if (e.mecanica === 'antorchas') return 'Empieza por la más pequeña y suma ' + t + ' cada vez.';
    if (e.ac.tipo === 'salto' || e.mecanica === 'piedras') return 'Suma ' + t + ' al último número de la cuenta.';
    if (e.ac.tipo === 'factor') return 'Cuenta de ' + t + ' en ' + t + ' hasta llegar a ' + (t * b) + '.';
    return b + ' veces ' + t + ' = ' + Array(b).fill(t).join(' + ');
  }
  function resolver(e, ok, x, y) {
    if (e.resuelta) return; S.maestria.registrar(e.ac.hecho, ok);
    if (ok) {
      e.resuelta = true; S.aciertos++; if (e.errores === 0) S.limpios++; chispas(x, y, 30, '#7dff9a'); texto(x, y - 50, '¡CORRECTO!', '#7dff9a'); S.aviso = { t: 1.6, s: '¡BIEN! +1 acertijo' };
      if (e.puertaX !== null) texto(e.puertaX, G - 160, 'SE ABRE EL PASO', '#ffe27a'); S.items.push({ x, y: y - 20, tipo: 'pergamino', tomado: false });
    } else { e.errores++; S.errores++; texto(x, y - 40, '¡CASI!', '#ff8a8a'); e.pistaVisible = true; if (S.osc > .3) S.luz = Math.max(130, S.luz - 28); }
  }
  core.resolver = resolver;
  function golpearObjetivo(e, o, via) {
    if (!e || e.resuelta) return;
    if (e.mecanica === 'antorchas') {
      if (o.estado === 'encendida') return;
      if (o.idx === e.sig) { o.estado = 'encendida'; e.sig++; chispas(o.x, o.y, 14, '#ffb84a'); texto(o.x, o.y - 50, '✓', '#7dff9a'); if (e.sig === 4) resolver(e, true, o.x, o.y); }
      else { e.objetos.forEach(q => { q.estado = 'apagada'; }); e.sig = 0; resolver(e, false, o.x, o.y); danio('antorchas', S.h.x < o.x ? -1 : 1, 1); }
      return;
    }
    if (o.estado !== 'listo') return; const ok = !!o.correcto;
    if (e.mecanica === 'encender_farol') o.estado = ok ? 'encendido' : 'apagado'; else if (e.mecanica === 'romper_bloques') o.estado = 'roto'; else o.estado = ok ? 'acertada' : 'fallada';
    chispas(o.x, o.y, 20, ok ? '#7dff9a' : '#ff8a6b'); resolver(e, ok, o.x, o.y); if (!ok) danio(e.mecanica, S.h.x < o.x ? -1 : 1, 1);
  }
  function estaciones() {
    const tajo = S.tajo; if (!tajo || tajo.usado) return; const e = S.estSel; if (!e || e.resuelta) return; const lst = objetivos(e); if (!lst.length) return;
    let mejor = null, d = 1e9; lst.forEach(o => { const bb = rect(o.x - 44, o.y - 50, 88, 100); if (cruza(tajo, bb)) { const dd = Math.abs(o.x - S.h.x); if (dd < d) { d = dd; mejor = o; } } });
    if (mejor) { tajo.usado = true; golpearObjetivo(e, mejor, 'tajo'); }
  }
  function pisarPiedra(p) {
    const e = S.est.find(q => q.mecanica === 'piedras' && q.objetos.indexOf(p) >= 0); if (!e || e.resuelta) return;
    if (p.correcta) { if (!p.ok) { p.ok = true; resolver(e, true, p.x + p.w / 2, p.Y - 60); } }
    else if (p.estado === 'firme') { p.estado = 'cruje'; p.t = .45; if (!p.contado) { p.contado = true; resolver(e, false, p.x + p.w / 2, p.Y - 60); } }
  }
  function empezarApuntar() {
    const e = S.estSel, h = S.h; const lst = e ? objetivos(e).filter(o => Math.abs(o.x - h.x) < 900) : [];
    if (lst.length) { lst.sort((a, b) => a.x - b.x); let k = 0, d = 1e9; lst.forEach((o, i) => { const dd = Math.abs(o.x - h.x - h.dir * 150); if (dd < d) { d = dd; k = i; } }); S.apunta = { e, sel: k, lst, t: 0 }; }
    else if (h.shCd <= 0 && h.aturdido <= 0) { h.shCd = .45; S.tiros++; S.shur.push({ x: h.x + h.dir * 30, y: h.y - 58, vx: 760 * h.dir, vy: 0, t: 1.2, a: 0, recto: true }); }
  }
  const cambiarObjetivo = d => { const a = S.apunta; if (a) a.sel = (a.sel + d + a.lst.length) % a.lst.length; };
  function disparar(o, e) { const h = S.h; S.tiros++; S.shur.push({ x: h.x + h.dir * 30, y: h.y - 58, vx: 0, vy: 0, t: 1.5, a: 0, obj: o, est: e }); }
  function lanzar() { const a = S.apunta; if (!a) return; S.apunta = null; const o = a.lst[a.sel]; if (o && (o.estado === 'listo' || o.estado === 'apagada')) disparar(o, a.e); }
  Object.assign(core, { objetivos, golpearObjetivo, pisarPiedra });

  function terminar() {
    if (S.fin) return; S.fin = { t: 0 }; const seg = Math.round(S.tiempo);
    Ruta.terminarActo(S.plan, {});
    if (S.perfil && window.Perfiles) Perfiles.actualizar(S.perfil.id, p => {
      p.maestria = S.maestria.estado; p.tutoriales = S.tutoVisto; p.nivel1 = p.nivel1 || {}; p.nivel1.plan = S.plan; p.nivel1.semilla = S.plan.semilla; p.nivel1.intentos = (p.nivel1.intentos || 0) + 1; p.nivel1.completados = (p.nivel1.completados || 0) + 1;
      p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aciertos; p.estadisticas.errores += S.errores; p.estadisticas.minutos += Math.round(seg / 6) / 10;
      p.progreso = p.progreso || { fase: 'easy', nivel: 0, puntos: 0 }; p.progreso.puntos += S.pergaminos * 10 + S.aciertos * 50;
    });
    setTimeout(pantallaFinal, 900);
  }

  // ============ tutoriales (la primera vez que aparece cada cosa) ============
  const TUTOS = [
    { id: 'mover', txt: 'Muévete', teclas: ['←', '→'], ok: () => S.movido > 160, cuando: () => S.t > .8 },
    { id: 'saltar', txt: 'Salta (mantén para saltar más alto)', teclas: ['ESPACIO'], ok: () => S.saltos > 1, cuando: () => S.movido > 200 },
    { id: 'tajo', txt: 'Golpea con el tajo', teclas: ['C'], ok: () => S.tajos > 0, cuando: () => S.enemigos.some(e => e.vivo && e.kind !== 'oni' && e.x > S.h.x && e.x - S.h.x < 520 && Math.abs(e.y - S.h.y) < 250) },
    { id: 'apuntar', txt: 'Mantén F para apuntar · ← → eligen la respuesta · suelta F para lanzar el shuriken', teclas: ['F'], ok: () => S.tiros > 0, cuando: () => S.estSel && objetivos(S.estSel).length && Math.abs(S.estSel.x0 + 260 - S.h.x) < 480 },
    { id: 'apuntar2', txt: 'También puedes saltar y golpear la respuesta con el tajo', teclas: ['C'], ok: () => S.tajos > 2 || S.estSel === null, cuando: () => S.tutoVisto.apuntar && S.estSel && S.estSel.errores > 0 },
    { id: 'tambor', txt: '¡Salta sobre el tambor para rebotar muy alto!', teclas: ['ESPACIO'], ok: () => S.rebotes > 0, cuando: () => S.N.tambores.some(t => Math.abs(t.x - S.h.x) < 380 && t.x > S.h.x - 60) },
    { id: 'carreta', txt: 'Camina contra la carreta para empujarla', teclas: ['→'], ok: () => core.cartaEmpujada, cuando: () => S.N.elem.some(e => e.t === 'carreta' && Math.abs(e.x - S.h.x) < 420) },
    { id: 'palanca', txt: 'Golpea la palanca con el tajo', teclas: ['C'], ok: () => S.N.elem.some(e => e.t === 'palanca' && e.on), cuando: () => S.N.elem.some(e => e.t === 'palanca' && !e.on && Math.abs(e.x - S.h.x) < 300) },
    { id: 'viento', txt: 'Mantén ESPACIO dentro del viento para subir', teclas: ['ESPACIO'], ok: () => core.vientoUsado, cuando: () => S.N.elem.some(e => e.t === 'viento' && Math.abs(e.x + e.w / 2 - S.h.x) < 300) },
    { id: 'emb', txt: '¡Emboscada! Derrota a todos los ninjas para abrir la reja', teclas: ['C', 'F'], ok: () => false, cuando: () => core.emboscadaActiva },
    { id: 'roca', txt: '¡CORRE! Salta los kunai y no te detengas', teclas: ['→', 'ESPACIO'], ok: () => false, cuando: () => core.rocaActiva },
    { id: 'ritmo', txt: 'Espera el momento justo para pasar', teclas: ['⏱'], ok: () => false, cuando: () => S.N.elem.some(e => (e.t === 'kunaiR' || e.t === 'sierra') && Math.abs(e.x - S.h.x) < 420 && e.x > S.h.x - 100) },
    { id: 'oscuro', txt: 'En la cueva solo ves lo que alumbra tu antorcha. Los errores la apagan', teclas: ['🔥'], ok: () => false, cuando: () => S.osc > .5 },
    { id: 'antorchas', txt: 'Enciende las antorchas en orden, de menor a mayor (golpea con C o apunta con F)', teclas: ['C', 'F'], ok: () => false, cuando: () => S.estSel && S.estSel.mecanica === 'antorchas' && S.h.x > S.estSel.x0 - 100 },
    { id: 'jefe', txt: 'Esquiva sus embestidas y golpéalo con C, con F o saltándole encima', teclas: ['C', 'F'], ok: () => false, cuando: () => core.jefeActivo },
    { id: 'sellos', txt: 'Rompe la pared de sellos con el tajo: ¡hay un tesoro detrás!', teclas: ['C'], ok: () => S.N.muros.some(m => m.rompible && m.roto), cuando: () => S.N.muros.some(m => m.rompible && !m.roto && m.x > S.h.x && m.x - S.h.x < 380) },
    { id: 'tela', txt: 'Las telarañas te frenan: córtalas con el tajo', teclas: ['C'], ok: () => false, cuando: () => S.N.elem.some(e => e.t === 'tela' && !e.roto && Math.abs(e.x - S.h.x) < 300 && e.x > S.h.x - 40) }
  ];
  function tutoriales(dt) {
    if (S.tip) { S.tipT += dt; const t = S.tip; if (S.tipT > 1.5 && (t.ok() || S.tipT > 14)) { S.tutoVisto[t.id] = 1; S.tip = null; } return; }
    for (const t of TUTOS) { if (S.tutoVisto[t.id]) continue; let ok = false; try { ok = t.cuando(); } catch (e) {} if (ok) { S.tip = t; S.tipT = 0; break; } }
  }

  // ============ pantallas de fin y decisión ============
  const panel = html => { const d = document.createElement('div'); d.className = 'n1Panel'; d.innerHTML = '<div class="n1Card">' + html + '</div>'; root.appendChild(d); return d; };
  const mm = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function pantallaFinal() {
    if (!S || !root) return; const ops = S.plan.opciones || [];
    const d = panel('<h2>¡NIVEL 1 COMPLETADO!</h2><p>Atravesaste el Bosque de Bambú y la Cueva de las Luciérnagas.</p><div class="n1Stats"><div><b>' + S.aciertos + '/' + S.est.length + '</b>acertijos</div><div><b>' + S.limpios + '</b>a la primera</div><div><b>' + S.errores + '</b>errores</div><div><b>' + S.pergaminos + '</b>pergaminos</div><div><b>' + mm(S.tiempo) + '</b>tiempo</div></div>' + (ops.length ? '<p>¿Qué camino eliges? Lo que decidas cambia el resto del viaje.</p><div class="n1Opc" id="n1Ops"></div>' : '<p style="color:#ffc93c">El camino continúa… los siguientes actos se están construyendo.</p><div class="n1Fila" id="n1Fin"></div>'));
    if (!ops.length) { botonesFin(d.querySelector('#n1Fin')); return; }
    const cont = d.querySelector('#n1Ops');
    ops.forEach((o, i) => { const b = document.createElement('button'); b.className = 'n1Op'; b.setAttribute('data-acto', o.acto); const est = '★'.repeat(o.riesgo) + '☆'.repeat(Math.max(0, 4 - o.riesgo)), rec = o.recompensa.length ? o.recompensa.map(r => BANDERAS[r] || r).join(', ') : 'ninguna'; b.innerHTML = '<h3>' + (i + 1) + '. ' + o.nombre + '</h3>' + o.pista + '<br><br>Riesgo: ' + est + '<br>Recompensa: ' + rec; b.addEventListener('click', () => elegirCamino(o.acto, d)); cont.appendChild(b); });
  }
  function botonesFin(fila) {
    fila.innerHTML = '<button class="n1Btn" id="n1Otra">↻ JUGAR OTRO NIVEL 1</button>' + (S.onSiguiente ? '<button class="n1Btn" id="n1Sig">▶ SEGUIR AL NIVEL 2 (juego anterior)</button>' : '') + '<button class="n1Btn sec" id="n1Menu">VOLVER AL MENÚ</button>';
    fila.querySelector('#n1Otra').onclick = () => { const o2 = { heroe: S.heroeId, dispositivo: S.movil ? 'movil' : 'pc', perfil: S.perfil && window.Perfiles ? Perfiles.obtener(S.perfil.id) : null, onSalir: S.onSalir, onSiguiente: S.onSiguiente }; iniciar(o2); };
    const bs = fila.querySelector('#n1Sig'); if (bs) bs.onclick = () => { const f = S.onSiguiente; cerrar(true); f(); };
    fila.querySelector('#n1Menu').onclick = () => cerrar();
  }
  function elegirCamino(acto, d) {
    Ruta.elegir(S.plan, acto); if (S.perfil && window.Perfiles) Perfiles.actualizar(S.perfil.id, p => { p.nivel1.plan = S.plan; }); const o = S.plan.ultimo; d.remove();
    const p2 = panel('<h2>ELEGISTE: ' + o.nombre.toUpperCase() + '</h2><p>' + o.pista + '</p><p>Tu decisión quedó guardada.</p><p style="color:#ffc93c">Este acto todavía se está construyendo.</p><div class="n1Fila" id="n1Fin"></div>'); botonesFin(p2.querySelector('#n1Fin'));
  }

  // ============ dibujo ============
  function sprite(im, x, y, w, h, flip) { if (!im) return; cx.save(); if (flip) { cx.translate(x + w, y); cx.scale(-1, 1); cx.drawImage(im, 0, 0, w, h); } else cx.drawImage(im, x, y, w, h); cx.restore(); }
  const porAncho = (im, x, base, w, flip) => { if (!im) return 0; const h = im.height * w / im.width; sprite(im, x - w / 2, base - h, w, h, flip); return h; };
  function etiqueta(s, x, y, tam, col) { cx.font = 'bold ' + tam + 'px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 5; cx.strokeStyle = 'rgba(20,8,40,.92)'; cx.strokeText(s, x, y); cx.fillStyle = col || '#fff'; cx.fillText(s, x, y); }
  Object.assign(core, { sprite, porAncho, etiqueta });

  function fondoBosque(alpha) {
    cx.globalAlpha = alpha; const c = SKY[S.params.variante] || SKY.A, g = cx.createLinearGradient(0, 0, 0, G + 40);
    g.addColorStop(0, c[0]); g.addColorStop(.55, c[1]); g.addColorStop(1, c[2]); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    const sx = 880 - (S.cam * .02) % 2000; cx.fillStyle = 'rgba(255,240,200,.9)'; cx.beginPath(); cx.arc(sx, 190, 62, 0, 7); cx.fill(); cx.fillStyle = 'rgba(255,240,200,.25)'; cx.beginPath(); cx.arc(sx, 190, 96, 0, 7); cx.fill();
    if (img.nube) for (let i = 0; i < 4; i++) { const w = 280 + i * 60, x = ((i * 430 - S.t * (8 + i * 3) - S.cam * (.04 + i * .01)) % (W + 500) + (W + 500)) % (W + 500) - 250; cx.globalAlpha = alpha * .75; cx.drawImage(img.nube, x, 60 + i * 55, w, img.nube.height * w / img.nube.width); }
    cx.globalAlpha = alpha;
    if (img.montanas) { const mw = 1400, mh = img.montanas.height * mw / img.montanas.width, off = -((S.cam * .12) % mw); for (let x = off; x < W; x += mw) cx.drawImage(img.montanas, x, G - mh + 30, mw, mh); }
    for (let capa = 0; capa < 2; capa++) {
      const par = capa ? .4 : .22, sep = capa ? 120 : 90; cx.fillStyle = capa ? 'rgba(30,88,64,.55)' : 'rgba(70,120,110,.35)'; const o = -((S.cam * par) % sep);
      for (let x = o - sep; x < W + sep; x += sep) { const id = Math.floor((x + S.cam * par) / sep), j = (((id * 9301 + 49297) % 233280) + 233280) % 233280 / 233280, w = capa ? 14 : 10, top = 40 + j * 160; cx.fillRect(x + j * 30, top, w, G - top); for (let k = top + 50; k < G; k += 60 + j * 20) cx.fillRect(x + j * 30 - 2, k, w + 4, 4); }
    }
    const f = cx.createLinearGradient(0, G - 230, 0, G + 20); f.addColorStop(0, 'rgba(255,240,220,0)'); f.addColorStop(1, 'rgba(255,240,220,.35)'); cx.fillStyle = f; cx.fillRect(0, G - 230, W, 250); cx.globalAlpha = 1;
  }
  function fondoCueva(alpha) {
    cx.globalAlpha = alpha; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07050f'); g.addColorStop(.6, '#150e2c'); g.addColorStop(1, '#241648'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    for (let capa = 0; capa < 2; capa++) {
      const par = capa ? .35 : .18, sep = capa ? 170 : 130; cx.fillStyle = capa ? 'rgba(46,36,84,.8)' : 'rgba(30,22,60,.7)'; const o = -((S.cam * par) % sep);
      for (let x = o - sep; x < W + sep; x += sep) { const id = Math.floor((x + S.cam * par) / sep), j = (((id * 9301 + 49297) % 233280) + 233280) % 233280 / 233280, hh = 90 + j * 190; cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x + sep * .8, 0); cx.lineTo(x + sep * .4 + j * 20, hh); cx.fill(); }
    }
    for (let i = 0; i < 9; i++) { const x = ((i * 337 - S.cam * .3) % (W + 200) + W + 200) % (W + 200) - 100, y = 200 + (i * 97) % 260, r = 50 + (i * 31) % 40; const gl = cx.createRadialGradient(x, y, 0, x, y, r); gl.addColorStop(0, 'rgba(80,170,255,.28)'); gl.addColorStop(1, 'rgba(80,170,255,0)'); cx.fillStyle = gl; cx.fillRect(x - r, y - r, r * 2, r * 2); }
    cx.globalAlpha = 1;
  }
  function suelos() {
    const N = S.N;
    N.gaps.forEach(g => { if (g.x1 < S.cam || g.x0 > S.cam + W) return; const ab = cx.createLinearGradient(0, G, 0, H); ab.addColorStop(0, 'rgba(40,20,70,0)'); ab.addColorStop(.35, 'rgba(30,12,52,.85)'); ab.addColorStop(1, '#0a0418'); cx.fillStyle = ab; cx.fillRect(g.x0 - S.cam, G - 40, g.x1 - g.x0, H); });
    N.suelo.forEach(s => {
      if (s.x1 < S.cam - 20 || s.x0 > S.cam + W + 20) return;
      const tile = s.zona === 'cueva' ? img.sueloCueva : img.suelo; if (!tile) return; const tw = 440, th = tile.height * tw / tile.width, so = superficie(tile) * th;
      cx.save(); cx.beginPath(); cx.rect(s.x0 - S.cam, 0, s.x1 - s.x0, H); cx.clip();
      const gr = cx.createLinearGradient(0, G + th - so - 6, 0, H); if (s.zona === 'cueva') { gr.addColorStop(0, '#2a2a3c'); gr.addColorStop(1, '#0c0c18'); } else { gr.addColorStop(0, '#5a321c'); gr.addColorStop(1, '#1c0f08'); }
      cx.fillStyle = gr; cx.fillRect(s.x0 - S.cam, G - so + th - 4, s.x1 - s.x0, H);
      for (let x = Math.floor(s.x0 / tw) * tw; x < s.x1; x += tw) cx.drawImage(tile, x - S.cam, G - so, tw + 1, th); cx.restore();
    });
  }
  function decorado(capa) {
    const D = { bambu: [img.bambuDeco, 130], toro: [img.toro, 110], kitsune: [img.kitsune, 110], estandarte: [img.estandarte, 100], cristal: [img.cristal, 110], hongo: [img.hongo, 100] };
    S.N.deco.forEach(d => {
      if (d.capa !== capa || d.x < S.cam - 160 || d.x > S.cam + W + 160) return; const q = D[d.tipo]; if (!q || !q[0]) return; const im = q[0], w = q[1], hh = im.height * w / im.width;
      cx.globalAlpha = capa === 'frente' && Math.abs(d.x - S.h.x) < 170 ? .35 : 1; if (d.tipo === 'estandarte') sprite(im, d.x - S.cam - w / 2, G - hh - 60, w, hh); else sprite(im, d.x - S.cam - w / 2, G + 4 - hh, w, hh); cx.globalAlpha = 1;
    });
    if (capa === 'atras') { S.ckp.forEach(c => porAncho(c.activo ? img.toriiOn : img.toriiOff, c.x - S.cam, G + 6, 230)); porAncho(img.toriiOn, S.N.meta.x - S.cam, G + 6, 300); porAncho(img.boca, S.N.cueva.x + 250 - S.cam, G + 10, 520); }
  }
  function plataformas() {
    S.N.plat.forEach(p => {
      if (p.X + p.w < S.cam - 120 || p.X > S.cam + W + 120) return; const top = platY(p); if (p.estado === 'caida' && top > H + 100) return;
      const im = { puente: img.puente, bambu: img.bambu, roca: img.roca, viga: img.viga, piedra: img.piedra, piedra_num: img.piedra }[p.tipo]; if (!im) return;
      const w = p.tipo === 'piedra_num' ? p.w + 30 : p.w, hh = im.height * w / im.width, so = superficie(im) * hh; let dx = p.X - S.cam - (w - p.w) / 2; if (p.estado === 'cruje') dx += Math.sin(S.t * 70) * 3;
      sprite(im, dx, top - so, w, hh); if (p.tipo === 'piedra_num' && p.valor !== null && p.valor !== undefined) etiqueta(String(p.valor), p.X + p.w / 2 - S.cam, top - 14, 26, p.fija ? '#fff' : '#ffe27a');
    });
    S.N.tambores.forEach(t => { if (t.x < S.cam - 100 || t.x > S.cam + W + 100) return; const sq = t.rebote > 0 ? 1 - Math.sin(t.rebote * 10) * .12 : 1; cx.save(); cx.translate(t.x - S.cam, t.y + 4); cx.scale(1 / sq, sq); porAncho(t.hongo ? img.hongo : img.taiko, 0, 0, t.hongo ? 120 : 130); cx.restore(); });
    S.N.haz.forEach(z => { if (z.x + z.w < S.cam - 20 || z.x > S.cam + W + 20) return; const k = img.kunai; if (k) { const hh = k.height * (z.w + 30) / k.width; sprite(k, z.x - S.cam - 15, z.y + z.h + 6 - hh, z.w + 30, hh); } });
    S.N.muros.forEach(m => { if (m.x + m.w < S.cam - 40 || m.x > S.cam + W + 40 || m.roto) return; N1elem.dibujarMuro(m); });
  }
  function estacionesDibujo() {
    S.est.forEach(e => {
      if (e.x0 > S.cam + W + 100 || e.x0 + e.ancho < S.cam - 100) return;
      if (e.puertaX !== null) { const alto = 300, px = e.puertaX - S.cam, k = e.resuelta ? (e.abre = Math.min(1, (e.abre || 0) + .03)) : 0; for (let i = -1; i <= 1; i++) { const im = img.bambuDeco; if (im) { cx.save(); cx.beginPath(); cx.rect(px - 40, G - alto, 80, alto); cx.clip(); sprite(im, px - 18 + i * 22, G - alto + k * (alto + 20), 54, alto + 20); cx.restore(); } } }
      if (e.mecanica === 'empujar_carreta') e.pads.forEach(p => { const px = p.x - S.cam; cx.fillStyle = p.estado === 'bien' ? '#3ac46a' : 'rgba(255,230,150,.9)'; cx.fillRect(px - 62, G - 6, 124, 10); cx.fillStyle = '#6b4a1c'; cx.fillRect(px - 62, G + 4, 124, 6); etiqueta(String(p.valor), px, G - 40, 26, '#fff'); cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.setLineDash([6, 6]); cx.strokeRect(px - 62, G - 112, 124, 106); cx.setLineDash([]); });
      e.objetos.forEach(o => {
        if (e.mecanica === 'encender_farol') {
          cx.strokeStyle = 'rgba(60,35,20,.8)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(o.x - S.cam, o.y - 150); cx.lineTo(o.x - S.cam, o.y - 40); cx.stroke();
          const im = o.estado === 'encendido' || (e.resuelta && o.correcto) ? img.farolOn : img.farolOff; if (im) { cx.save(); if (o.estado === 'apagado') cx.globalAlpha = .45; sprite(im, o.x - S.cam - 33, o.y - 47, 66, im.height * 66 / im.width); cx.restore(); } etiqueta(String(o.valor), o.x - S.cam, o.y - 4, 26, '#fff');
        } else if (e.mecanica === 'romper_bloques') { if (o.estado === 'roto') return; if (img.sello) sprite(img.sello, o.x - S.cam - 46, o.y - 46 + Math.sin(S.t * 2 + o.x) * 4, 92, 92); etiqueta(String(o.valor), o.x - S.cam, o.y + Math.sin(S.t * 2 + o.x) * 4, 26, '#fff'); }
        else if (e.mecanica === 'diana') {
          const x = o.x - S.cam; cx.strokeStyle = 'rgba(60,35,20,.8)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x, o.y - 120); cx.lineTo(x, o.y - 40); cx.stroke();
          const cols = o.estado === 'fallada' ? ['#552', '#633'] : o.estado === 'acertada' ? ['#2c7', '#fff'] : ['#d33', '#fff']; [44, 33, 22, 11].forEach((r, i) => { cx.fillStyle = i % 2 ? cols[1] : cols[0]; cx.beginPath(); cx.arc(x, o.y, r, 0, 7); cx.fill(); }); cx.lineWidth = 3; cx.strokeStyle = '#2a1408'; cx.beginPath(); cx.arc(x, o.y, 44, 0, 7); cx.stroke(); if (o.estado !== 'fallada') etiqueta(String(o.valor), x, o.y + 62, 22, '#fff');
        } else if (e.mecanica === 'antorchas') { const im = o.estado === 'encendida' ? img.antOn : img.antOff; if (im) sprite(im, o.x - S.cam - 40, o.y - 80, 80, im.height * 80 / im.width); etiqueta(String(o.valor), o.x - S.cam, o.y + 70, 24, o.estado === 'encendida' ? '#ffe27a' : '#fff'); }
      });
    });
  }
  function dibujarHeroe() {
    const h = S.h, M = S.M; let set = 'idle', fps = 8, idx = 0;
    if (h.muerto > 0) set = 'death'; else if (h.aturdido > 0) set = 'hurt'; else if (h.atk > 0) set = 'atk'; else if (!h.suelo) set = 'jump'; else if (Math.abs(h.vx) > 40) { set = 'run'; fps = 26; }
    const arr = M[set] || M.idle;
    if (set === 'atk') idx = Math.min(arr.length - 1, Math.floor((1 - h.atk / .28) * arr.length)); else if (set === 'jump') idx = h.vy < -300 ? 0 : h.vy < -60 ? 1 : h.vy < 260 ? Math.min(2, arr.length - 1) : arr.length - 1;
    else if (set === 'hurt' || set === 'death') idx = Math.min(arr.length - 1, Math.floor(S.t * 12) % arr.length); else { h.anim += (1 / 60) * fps; idx = Math.floor(h.anim) % arr.length; }
    const f = arr[Math.min(idx, arr.length - 1)], im = img['h:' + set + ':' + Math.min(idx, arr.length - 1)] || img['h:idle:0']; if (!im || !f) return;
    const s = S.alto, w = f.w * s, hh = f.h * s, ax = f.ax * s, ay = f.ay * s; if (h.inv > 0 && Math.floor(S.t * 20) % 2) return;
    cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(h.x - S.cam, (h.pisando ? h.y : G) + 4, 30, 7, 0, 0, 7); cx.fill();
    cx.save(); cx.translate(h.x - S.cam, h.y); if (h.dir < 0) cx.scale(-1, 1); cx.drawImage(im, -ax, -ay, w, hh);
    if (S.osc > .2 && img.antorchaAnim) { const fw = img.antorchaAnim.width / 10, fr = Math.floor(S.t * 14) % 10; cx.drawImage(img.antorchaAnim, fr * fw, 0, fw, img.antorchaAnim.height, 14, -112, 52, 52 * img.antorchaAnim.height / fw); }
    cx.restore();
    if (h.atk > 0) { const p = 1 - h.atk / .28; cx.save(); cx.translate(h.x - S.cam, h.y - 60); cx.scale(h.dir, 1); cx.globalAlpha = Math.sin(p * Math.PI) * .9; cx.strokeStyle = '#fff6c2'; cx.lineWidth = 9; cx.lineCap = 'round'; cx.beginPath(); cx.arc(10, 0, 86, -1.1 + p * .9, .35 + p * .9); cx.stroke(); cx.strokeStyle = '#ffc93c'; cx.lineWidth = 4; cx.stroke(); cx.restore(); }
  }
  function luces() {
    const L = [], h = S.h, fl = 1 + Math.sin(S.t * 13) * .04 + Math.sin(S.t * 31) * .03;
    L.push({ x: h.x, y: h.y - 70, r: S.luz * fl });
    S.ckp.forEach(c => { if (c.zona === 'cueva' && Math.abs(c.x - h.x) < 900) L.push({ x: c.x, y: G - 100, r: c.activo ? 230 : 90 }); });
    S.N.deco.forEach(d => { if (d.zona === 'cueva' && (d.tipo === 'cristal' || d.tipo === 'hongo') && Math.abs(d.x - h.x) < 800) L.push({ x: d.x, y: G - 50, r: d.tipo === 'cristal' ? 95 : 80 }); });
    S.est.forEach(e => { if (Math.abs(e.x0 + e.ancho / 2 - h.x) > 1100) return; e.objetos.forEach(o => { if (e.mecanica === 'antorchas' && o.estado === 'encendida') L.push({ x: o.x, y: o.y, r: 210 }); else if (o.estado === 'encendido') L.push({ x: o.x, y: o.y, r: 120 }); }); });
    N1elem.luces(L); S.shur.forEach(s => L.push({ x: s.x, y: s.y, r: 55 })); return L;
  }
  function oscuridad() {
    if (S.osc < .02) return; ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, W, H); ox.fillStyle = 'rgba(3,1,10,' + (.965 * S.osc) + ')'; ox.fillRect(0, 0, W, H); ox.globalCompositeOperation = 'destination-out';
    luces().forEach(l => { const x = l.x - S.cam, y = l.y; if (x < -l.r || x > W + l.r) return; const g = ox.createRadialGradient(x, y, 0, x, y, l.r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ox.fillStyle = g; ox.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2); });
    cx.drawImage(oc, 0, 0);
    const h = S.h, g = cx.createRadialGradient(h.x - S.cam, h.y - 70, 0, h.x - S.cam, h.y - 70, S.luz); g.addColorStop(0, 'rgba(255,170,60,' + .16 * S.osc + ')'); g.addColorStop(1, 'rgba(255,120,20,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    N1elem.ojos();
  }
  function dibujar() {
    if (!S || !cx) return;
    const sh = S.shake > 0 ? (Math.random() - .5) * 10 * S.shake * 4 : 0; cx.save(); cx.translate(sh, sh); cx.clearRect(-20, -20, W + 40, H + 40);
    if (S.mezcla < .98) fondoBosque(1); if (S.mezcla > .02) fondoCueva(S.mezcla);
    decorado('atras'); suelos(); plataformas(); estacionesDibujo(); N1elem.dibujar('atras');
    S.items.forEach(i => { if (i.tomado || i.x < S.cam - 60 || i.x > S.cam + W + 60) return; const im = i.tipo === 'onigiri' ? img.onigiri : img.pergamino, w = i.tipo === 'onigiri' ? 46 : 52; if (im) sprite(im, i.x - S.cam - w / 2, i.y - im.height * w / im.width / 2 + Math.sin(S.t * 3 + i.x) * 5, w, im.height * w / im.width); });
    N1elem.dibujar('enemigos'); dibujarHeroe(); N1elem.dibujar('frente');
    S.shur.forEach(s => { const im = img.shuriken; if (!im) return; const fw = im.width / 8, f = Math.floor(S.t * 20) % 8; cx.drawImage(im, f * fw, 0, fw, im.height, s.x - S.cam - 40, s.y - 40, 80, 80 * im.height / fw); });
    decorado('frente');
    S.part.forEach(p => { cx.globalAlpha = clamp(p.t * 2, 0, 1); cx.fillStyle = p.col; cx.fillRect(p.x - S.cam - p.r / 2, p.y - p.r / 2, p.r, p.r); }); cx.globalAlpha = 1;
    if (S.mezcla < .5) S.hojas.forEach(l => { cx.save(); cx.translate(l.x, l.y); cx.rotate(l.r); cx.fillStyle = 'rgba(120,200,90,.75)'; cx.beginPath(); cx.ellipse(0, 0, l.s, l.s * .35, 0, 0, 7); cx.fill(); cx.restore(); });
    oscuridad();
    S.textos.forEach(t => { cx.globalAlpha = clamp(t.t * 2, 0, 1); etiqueta(t.s, t.x - S.cam, t.y, 22, t.col); }); cx.globalAlpha = 1;
    const v = cx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,30,.45)'); cx.fillStyle = v; cx.fillRect(0, 0, W, H);
    if (S.flash > 0) { cx.fillStyle = 'rgba(255,60,60,' + S.flash * 1.2 + ')'; cx.fillRect(0, 0, W, H); }
    if (S.apunta) mira(); cx.restore(); hud();
  }
  function mira() {
    const a = S.apunta, h = S.h; a.t += 1 / 60; cx.fillStyle = 'rgba(10,4,30,.35)'; cx.fillRect(0, 0, W, H);
    a.lst.forEach((q, i) => { const xx = q.x - S.cam; cx.strokeStyle = i === a.sel ? '#ffe27a' : 'rgba(255,255,255,.4)'; cx.lineWidth = i === a.sel ? 4 : 2; cx.beginPath(); cx.arc(xx, q.y, 56 + (i === a.sel ? Math.sin(a.t * 10) * 4 : 0), 0, 7); cx.stroke(); if (i === a.sel) { cx.setLineDash([10, 8]); cx.beginPath(); cx.moveTo(h.x - S.cam + h.dir * 30, h.y - 58); cx.lineTo(xx, q.y); cx.stroke(); cx.setLineDash([]); } });
    etiqueta('← → elige · suelta F para lanzar', W / 2, H - 70, 18, '#ffe27a');
  }
  function caja(x, y, w, h, r, fill, stroke) { cx.beginPath(); cx.roundRect ? cx.roundRect(x, y, w, h, r) : cx.rect(x, y, w, h); cx.fillStyle = fill; cx.fill(); if (stroke) { cx.lineWidth = 2; cx.strokeStyle = stroke; cx.stroke(); } }
  core.caja = caja;
  function tecla(t, x, y) { cx.font = 'bold 20px ui-monospace,monospace'; const w = Math.max(40, cx.measureText(t).width + 22); caja(x, y, w, 42, 8, '#f4ead0', '#7a5a2a'); cx.fillStyle = 'rgba(0,0,0,.2)'; cx.fillRect(x + 4, y + 34, w - 8, 5); cx.fillStyle = '#2a1a0a'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, x + w / 2, y + 20); return w; }
  function hud() {
    const h = S.h;
    for (let i = 0; i < S.vidaMax; i++) { cx.fillStyle = i < h.vida ? '#ff4d6d' : 'rgba(255,255,255,.18)'; cx.font = '30px sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'top'; cx.fillText('♥', 20 + i * 36, 14); }
    caja(20, 58, 120, 32, 8, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.6)'); cx.font = 'bold 16px ui-monospace,monospace'; cx.fillStyle = '#ffe27a'; cx.textAlign = 'left'; cx.fillText('📜 ' + S.pergaminos, 32, 65);
    const res = S.est.filter(e => e.resuelta).length; caja(W - 220, 14, 200, 38, 10, 'rgba(10,4,30,.55)', 'rgba(255,201,60,.6)'); cx.textAlign = 'center'; cx.fillStyle = '#fff'; cx.font = 'bold 15px ui-monospace,monospace'; cx.fillText('ACERTIJOS ' + res + '/' + S.est.length, W - 120, 26);
    if (S.osc > .3) { caja(W - 220, 58, 200, 26, 8, 'rgba(10,4,30,.55)', 'rgba(255,150,40,.6)'); cx.fillStyle = '#ff9a3a'; cx.fillRect(W - 214, 64, 188 * clamp((S.luz - 100) / 160, 0, 1), 14); cx.font = '12px sans-serif'; cx.fillStyle = '#fff'; cx.fillText('🔥 LUZ', W - 170, 72); }
    const px = 20 + (W - 40) * clamp(h.x / S.N.ancho, 0, 1); cx.fillStyle = 'rgba(255,255,255,.2)'; cx.fillRect(20, H - 16, W - 40, 5); cx.fillStyle = '#ffc93c'; cx.fillRect(20, H - 16, px - 20, 5);
    S.est.forEach(e => { cx.fillStyle = e.resuelta ? '#7dff9a' : '#fff'; cx.fillRect(20 + (W - 40) * (e.x0 + e.ancho / 2) / S.N.ancho - 2, H - 20, 4, 13); }); cx.fillStyle = '#c84'; cx.fillRect(20 + (W - 40) * S.N.cueva.x / S.N.ancho - 2, H - 22, 4, 17); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(px, H - 13, 8, 0, 7); cx.fill();
    N1elem.hud(cx, caja);
    const e = S.estSel;
    if (e) {
      const t = e.ac.enunciado; cx.font = 'bold 24px ui-monospace,monospace'; const tw = Math.min(W - 80, cx.measureText(t).width + 60);
      caja(W / 2 - tw / 2, 14, tw, e.pistaVisible ? 88 : 54, 14, 'rgba(18,8,51,.88)', '#ffc93c'); cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, W / 2, 41);
      if (e.pistaVisible) { cx.font = '15px ui-monospace,monospace'; cx.fillStyle = '#ffe27a'; cx.fillText('Pista: ' + pista(e), W / 2, 78); }
    }
    if (S.aviso && S.aviso.t > 0) { cx.globalAlpha = clamp(S.aviso.t, 0, 1); cx.font = 'bold 30px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; const tw = cx.measureText(S.aviso.s).width + 70; caja(W / 2 - tw / 2, 150, tw, 62, 14, 'rgba(18,8,51,.85)', '#ffc93c'); cx.fillStyle = '#ffe27a'; cx.fillText(S.aviso.s, W / 2, 182); cx.globalAlpha = 1; }
    if (S.tip && !S.apunta) {
      const t = S.tip; cx.font = '16px ui-monospace,monospace'; const tw = Math.min(W - 60, cx.measureText(t.txt).width + 40); let kw = 0; t.teclas.forEach(k => { cx.font = 'bold 20px ui-monospace,monospace'; kw += Math.max(40, cx.measureText(k).width + 22) + 8; });
      const bw = Math.min(W - 40, Math.max(tw, kw + 40)), bx = W / 2 - bw / 2, by = H - 150, pulso = 1 + Math.sin(S.t * 6) * .03;
      cx.save(); cx.translate(W / 2, by + 50); cx.scale(pulso, pulso); cx.translate(-W / 2, -by - 50); caja(bx, by, bw, 100, 14, 'rgba(18,8,51,.92)', '#ffc93c');
      let kx = W / 2 - kw / 2 + 4; t.teclas.forEach(k => { kx += tecla(k, kx, by + 10) + 8; });
      cx.font = '16px ui-monospace,monospace'; cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t.txt, W / 2, by + 74); cx.restore();
    }
    if (S.pausa) { cx.fillStyle = 'rgba(8,3,24,.75)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#ffc93c'; cx.font = 'bold 44px ui-monospace,monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('PAUSA', W / 2, H / 2 - 20); cx.font = '18px ui-monospace,monospace'; cx.fillStyle = '#fff'; cx.fillText('ESC para seguir · Q para salir al menú', W / 2, H / 2 + 30); }
  }

  window.Nivel1 = { iniciar, cerrar, _estado: () => S, _debug: { G, DT, paso: n => { for (let i = 0; i < (n || 1); i++) paso(DT); }, keys } };
})();
