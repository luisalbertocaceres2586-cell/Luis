/* Cámara de cine + luces dinámicas del Nivel 1 — «La Senda del Aprendiz Ninja»
 * Complementa a profundidad.js (que da las CAPAS del escenario): aquí la CÁMARA y la LUZ reaccionan a lo que hace el jugador.
 *   · ZOOM con «golpe» (punch): dash, lanzar kunai, recibir daño, matar enemigo, recoger pergamino, aterrizar.
 *   · ENCUADRE: al apuntar con F la cámara se acerca al blanco elegido y oscurece el resto (foco de luz); contra el jefe se abre el plano.
 *   · INCLINACIÓN (roll) según la velocidad lateral y el dash: da sensación de cámara al hombro / perspectiva.
 *   · CÁMARA VERTICAL: sube cuando el héroe salta alto o está en plataformas altas, baja al caer a un foso y se anticipa a la velocidad vertical.
 *     El mundo se desplaza en vertical y profundidad.js mueve cada capa del fondo una fracción distinta (paralaje real en los dos ejes).
 *   · ADELANTO horizontal: la cámara se adelanta hacia donde corres, proporcional a la velocidad y con giros suaves (adelanto()).
 *   · ZOOM DE VELOCIDAD: el plano se abre un poco al correr rápido o caer, y se cierra al parar, en el dash y al recibir/dar golpes.
 *   · HIT-STOP: congela casi un instante el juego al golpear o recibir daño (el golpe «pesa»).
 *   · LUCES aditivas: halo del héroe que cambia de color según la acción, estallidos de luz donde cae un enemigo, brillo en shurikens/kunais.
 *   · POST-PROCESO barato: líneas de velocidad en el dash, viñeta que late con 1 vida, bordes rojos al recibir daño.
 * Sin imágenes ni dependencias; solo usa window.N1core (que expone motor.js). Si algo falla cada gancho se apaga solo y el juego sigue.
 * Se desactiva con ?cam=0 en la URL o con N1cam._apagar(). Respeta «reducir movimiento» del sistema (efectos al ~35 %). */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const K = () => root.N1core;

  const W = 1280, H = 720;
  const BASE = 1.045;            // zoom mínimo: deja margen para inclinar y sacudir sin enseñar bordes
  const REPOSO = 1.085;          // zoom en reposo: algo más cerca que el mínimo, para poder «abrir» el plano al correr
  const ZMAX = 1.22, ROLL_MAX = 0.018;
  const CAMY_MAX = 120, CAMY_MIN = -45;   // desplazamiento vertical máximo hacia arriba / hacia abajo (px del mundo)
  const G0 = 560;                // altura del suelo si el núcleo no la expone (en el juego real viene de N1core.G)

  const E = {
    S: null, off: false, t0: 0, z: BASE, zPunch: 0, roll: 0, rollPunch: 0, fx: W / 2, fy: H / 2, oy: 0,
    stop: 0, aim: 0, aimX: W / 2, aimY: H / 2, jefe: 0, golpeado: 0, dashV: 0, latido: 0, camY: 0, lead: 0, tf: null,
    prev: null, luces: [], estelas: [], reducido: false, lite: false, avg: 16.7, lento: 0
  };
  try { E.reducido = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* sin matchMedia */ }
  try { if (root.location && /[?&]cam=0\b/.test(root.location.search)) E.off = true; } catch (e) { /* nada */ }
  try { if (root.location && /[?&]camv=0\b/.test(root.location.search)) E.sinVert = true; } catch (e) { /* nada */ }
  const AMP = () => E.reducido ? .35 : 1;
  /* La cámara vertical solo se usa si profundidad.js está cargado y sano: sus capas llevan margen extra para que el desplazamiento no deje bordes vacíos. */
  const vertOK = () => { const P = root.N1prof; return !E.sinVert && !!(P && P._estado && !P._estado().dead); };

  function estado() {
    const k = K(); if (!k || !k.S) return null;
    const S = k.S(); if (!S) return null;
    if (E.S !== S) { E.S = S; E.prev = null; E.luces.length = 0; E.zPunch = E.rollPunch = E.stop = E.golpeado = 0; E.z = REPOSO; E.t0 = 0; E.camY = 0; E.lead = 0; E.tf = null; }
    return S;
  }

  /* ---------- luces: estallidos de luz aditiva que se apagan solos ---------- */
  function luz(x, y, r, col, vida, fuerza) { if (E.luces.length > 24) E.luces.shift(); E.luces.push({ x, y, r, col, t: vida, vida, a: fuerza == null ? 1 : fuerza }); }
  function golpe(zoom, roll, parar) {
    const a = AMP();
    E.zPunch = Math.min(.16, E.zPunch + zoom * a);
    E.rollPunch = clamp(E.rollPunch + roll * a, -.03, .03);
    if (parar && !E.reducido) E.stop = Math.max(E.stop, parar);
  }

  /* ---------- lectura de lo que hace el héroe (detecta «flancos»: el instante en que algo empieza) ---------- */
  function leer(S, dt) {
    const h = S.h, A = S.hab, k = K(), p = E.prev || (E.prev = {
      dash: false, atk: 0, kunai: 0, shake: 0, suelo: true, vy: 0, perg: S.pergaminos, vida: h.vida, vivos: new Map(), ap: false, jefe: false
    });
    const hx = h.x - S.cam, hy = h.y - 70;

    // dash (flanco de subida)
    const dash = !!(A && A.dash && A.dash.t > 0);
    if (dash && !p.dash) { golpe(.07, (h.dir || 1) * .008, 0); luz(hx, hy, 260, [120, 220, 255], .35, 1); E.dashV = 1; }
    p.dash = dash;
    E.dashV = Math.max(0, E.dashV - dt * 4);

    // ataque cuerpo a cuerpo y kunai
    if (h.atk > 0 && !(p.atk > 0)) { golpe(.03, (h.dir || 1) * .004, 0); luz(hx + (h.dir || 1) * 50, hy, 150, [255, 230, 160], .18, .8); }
    if (h.kunaiT > 0 && !(p.kunai > 0)) { golpe(.025, 0, 0); luz(hx + (h.dir || 1) * 40, hy, 130, [255, 190, 230], .2, .8); }
    p.atk = h.atk; p.kunai = h.kunaiT;

    // daño recibido (S.shake sube de golpe) → hit-stop + zoom + bordes rojos
    if (S.shake > p.shake + .15) { golpe(.06, (Math.random() < .5 ? -1 : 1) * .01, .09); E.golpeado = 1; luz(hx, hy, 300, [255, 70, 70], .3, 1); }
    p.shake = S.shake; E.golpeado = Math.max(0, E.golpeado - dt * 2.5);

    // aterrizaje fuerte
    if (h.suelo && !p.suelo && p.vy > 520) { golpe(.02 + clamp((p.vy - 520) / 4000, 0, .03), 0, 0); E.oy = Math.min(14, E.oy + 8 + (p.vy - 520) / 120); }
    p.suelo = h.suelo; p.vy = h.vy;

    // pergamino recogido
    if (S.pergaminos > p.perg) { golpe(.03, 0, 0); luz(hx, hy, 280, [255, 214, 90], .5, 1); }
    p.perg = S.pergaminos;

    // enemigo derrotado: se compara quién estaba vivo en el cuadro anterior
    const ahora = new Map();
    (S.enemigos || []).forEach(e => { if (e.vivo) ahora.set(e, [e.x, e.y]); });
    p.vivos.forEach((pos, e) => { if (!ahora.has(e) && !e.vivo) { golpe(.05, 0, .06); luz(pos[0] - S.cam, pos[1] - 40, 240, [255, 245, 200], .35, 1); luz(pos[0] - S.cam, pos[1] - 40, 120, [255, 150, 60], .5, .9); } });
    p.vivos = ahora;

    // apuntar con F: acercar al blanco elegido
    const ap = S.apunta;
    if (ap && ap.lst && ap.lst[ap.sel]) { const q = ap.lst[ap.sel]; E.aimX = lerp(E.aimX, q.x - S.cam, clamp(dt * 9, 0, 1)); E.aimY = lerp(E.aimY, q.y, clamp(dt * 9, 0, 1)); }
    E.aim = lerp(E.aim, ap ? 1 : 0, clamp(dt * (ap ? 7 : 5), 0, 1));

    // jefe: plano más abierto
    E.jefe = lerp(E.jefe, (k && k.jefeActivo) ? 1 : 0, clamp(dt * 2, 0, 1));
    p.jefe = !!(k && k.jefeActivo);

    // latido con 1 vida
    E.latido = (h.vida === 1 && !h.muerto) ? E.latido + dt : Math.max(0, E.latido - dt * 2);
  }

  /* ---------- gancho 1: se llama dentro de dibujar(), justo después de cx.save() ---------- */
  function antes(cx) {
    if (E.off) return;
    const S = estado(); if (!S || !cx) return;
    try {
      const ahora = performance.now(); let dt = E.t0 ? (ahora - E.t0) / 1000 : 1 / 60; E.t0 = ahora; dt = clamp(dt, 0.001, 0.1);
      E.avg = E.avg * .94 + dt * 1000 * .06; E.lento = E.avg > 26 ? E.lento + 1 : 0; if (E.lento > 90) E.lite = true;
      E.stop = Math.max(0, E.stop - dt);
      if (!S.pausa) leer(S, dt);

      const h = S.h, a = AMP();
      // zoom objetivo: base + abrir en jefe − abrir un poco al saltar/caer rápido + acercar al apuntar + golpe que decae
      const vyAbs = clamp(Math.abs(h.vy) / 900, 0, 1);
      // velocidad horizontal (sin contar el dash, que acerca en vez de alejar): a más velocidad, plano más abierto
      const velX = clamp((Math.abs(h.vx) - 140) / 260, 0, 1) * (1 - clamp(E.dashV, 0, 1));
      let zObj = REPOSO - .012 * E.jefe - .03 * velX * a - .012 * vyAbs * a + .085 * E.aim + .03 * E.dashV * a;
      zObj = Math.max(BASE, zObj);
      E.zPunch *= Math.pow(.0016, dt);                 // decae en ~0,4 s
      E.z = lerp(E.z, zObj, clamp(dt * 6, 0, 1));
      const Z = clamp(E.z + E.zPunch, BASE, ZMAX);

      // inclinación: velocidad lateral + dash + golpe, siempre suave
      const rObj = clamp(h.vx / 700, -1, 1) * .006 * a + (E.jefe > .5 ? Math.sin(S.t * 1.3) * .003 * a : 0);
      E.rollPunch *= Math.pow(.004, dt);
      E.roll = lerp(E.roll, rObj, clamp(dt * 5, 0, 1));
      const R = E.reducido ? 0 : clamp(E.roll + E.rollPunch, -ROLL_MAX, ROLL_MAX);

      // foco: entre el centro y el héroe (para no mostrar bordes), o hacia el blanco si se apunta
      // cámara vertical: sube con el héroe al saltar alto o en plataformas altas, baja si cae a un foso, y se anticipa a vy
      const k = K(), G = (k && k.G) || G0, vOK = vertOK(); let yObj = 0;
      if (vOK && !(h.muerto > 0)) {
        yObj = Math.max(0, (G - h.y) - 60) * .55;
        if (h.y > G + 20) yObj = -Math.min(-CAMY_MIN, (h.y - G) * .5);
        yObj += clamp(-h.vy * .03, -22, 26);
        yObj = clamp(yObj, CAMY_MIN, CAMY_MAX) * a;
      }
      E.camY = vOK ? lerp(E.camY, yObj, clamp(dt * (yObj > E.camY ? 3.2 : 4.5), 0, 1)) : 0;
      const hx = h.x - S.cam, hy = h.y - 70 + E.oy + E.camY;
      E.oy *= Math.pow(.003, dt);
      const fxObj = lerp(lerp(W / 2, hx, .55), E.aimX, E.aim), fyObj = lerp(lerp(H / 2, hy, .45), E.aimY + E.camY, E.aim);
      E.fx = lerp(E.fx, clamp(fxObj, W * .2, W * .8), clamp(dt * 7, 0, 1)); E.fy = lerp(E.fy, clamp(fyObj, H * .25, H * .75), clamp(dt * 7, 0, 1));

      const dyT = E.oy * .4 + E.camY; E.tf = { fx: E.fx, fy: E.fy, Z, R, dy: dyT };
      cx.translate(E.fx, E.fy); if (R) cx.rotate(R); cx.scale(Z, Z); cx.translate(-E.fx, -E.fy + dyT);
    } catch (e) { E.off = true; if (root.console) console.warn('N1cam desactivada:', e); }
  }

  /* Adelanto horizontal de la cámara (px): lo usa motor.js al elegir hacia dónde mira. Es proporcional a la velocidad y cambia despacio al girar,
   * así no hay tirón al cambiar de dirección. Con la cámara apagada devuelve el adelanto fijo de siempre (70 px). */
  function adelanto(h, dt) {
    const dir = h.dir || 1; if (E.off) return dir * 70;
    const a = AMP(), obj = clamp(h.vx * .27, -125, 125) * a + dir * (a < 1 ? 62 : 40);
    E.lead = lerp(E.lead, clamp(obj, -135, 135), clamp((dt || 1 / 60) * 3.4, 0, 1)); return E.lead;
  }
  /* Convierte un punto de la pantalla (px del lienzo 1280×720) a coordenadas del mundo relativas a la cámara (sume S.cam a x).
   * Sirve para apuntar con el puntero/dedo aunque haya zoom, inclinación o desplazamiento vertical. */
  function mundo(sx, sy) {
    const T = E.tf; if (E.off || !T) return { x: sx, y: sy };
    let vx = sx - T.fx, vy = sy - T.fy;
    if (T.R) { const c = Math.cos(-T.R), s = Math.sin(-T.R), x2 = vx * c - vy * s; vy = vx * s + vy * c; vx = x2; }
    return { x: vx / T.Z + T.fx, y: vy / T.Z + T.fy - T.dy };
  }
  const camY = () => (E.off ? 0 : E.camY);

  /* ---------- gancho 2: luces aditivas dentro del mundo (tras el primer plano, antes de la oscuridad) ---------- */
  function halo(cx, x, y, r, col, a) {
    const g = cx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
    cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function luces(cx) {
    if (E.off) return;
    const S = estado(); if (!S || !cx) return;
    try {
      const h = S.h, hx = h.x - S.cam, hy = h.y - 70, dt = 1 / 60, cueva = clamp(S.mezcla || 0, 0, 1);
      if (E.camY < -1) { const g = cx.createLinearGradient(0, H - 26, 0, H + 14); g.addColorStop(0, 'rgba(14,8,22,0)'); g.addColorStop(1, 'rgba(14,8,22,1)'); cx.fillStyle = g; cx.fillRect(-80, H - 26, W + 160, 340); }
      cx.save(); cx.globalCompositeOperation = 'lighter';
      // halo del héroe (rim light): más fuerte en la cueva, cambia de color según la acción
      const col = E.golpeado > .1 ? [255, 90, 90] : E.dashV > .1 ? [130, 225, 255] : S.apunta ? [255, 255, 255] : [255, 190, 110];
      halo(cx, hx, hy, 170 + 60 * E.dashV, col, (.06 + .10 * cueva + .12 * E.dashV + .10 * E.aim + .1 * E.golpeado) * AMP());
      // brillo de proyectiles
      if (!E.lite) (S.shur || []).forEach(s => { const x = s.x - S.cam; if (x < -80 || x > W + 80) return; halo(cx, x, s.y, s.kunai ? 70 : 90, s.kunai ? [255, 170, 230] : [150, 235, 255], .35); });
      // estallidos
      for (let i = E.luces.length - 1; i >= 0; i--) {
        const l = E.luces[i]; l.t -= dt; if (l.t <= 0) { E.luces.splice(i, 1); continue; }
        const k = l.t / l.vida; halo(cx, l.x, l.y, l.r * (1.25 - .25 * k), l.col, l.a * k * k * .8 * AMP());
      }
      cx.restore();
    } catch (e) { E.off = true; }
  }

  /* ---------- gancho 3: tras cx.restore() (espacio de pantalla, sin zoom): foco al apuntar, líneas de velocidad, viñeta, bordes ---------- */
  function encima(cx) {
    if (E.off) return;
    const S = estado(); if (!S || !cx) return;
    try {
      const a = AMP(), h = S.h;
      // foco de luz al apuntar: oscurece todo menos el blanco
      if (E.aim > .02) {
        const g = cx.createRadialGradient(E.aimX, E.aimY, 70, E.aimX, E.aimY, 520);
        g.addColorStop(0, 'rgba(6,2,20,0)'); g.addColorStop(1, 'rgba(6,2,20,' + (.5 * E.aim) + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      }
      // líneas de velocidad en el dash (solo en equipos que aguantan)
      if (E.dashV > .05 && !E.lite && !E.reducido) {
        const cxh = h.x - S.cam, cyh = h.y - 70; cx.save(); cx.strokeStyle = 'rgba(200,240,255,' + (.35 * E.dashV) + ')'; cx.lineWidth = 2; cx.beginPath();
        for (let i = 0; i < 18; i++) { const an = (i / 18) * 6.2832 + S.t * .3, r0 = 260 + (i * 37 % 90), r1 = r0 + 140 * E.dashV; cx.moveTo(cxh + Math.cos(an) * r0, cyh + Math.sin(an) * r0 * .7); cx.lineTo(cxh + Math.cos(an) * r1, cyh + Math.sin(an) * r1 * .7); }
        cx.stroke(); cx.restore();
      }
      // viñeta que late con 1 vida
      if (E.latido > 0) {
        const p = .5 + .5 * Math.sin(E.latido * 7), g = cx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, H * .95);
        g.addColorStop(0, 'rgba(120,0,20,0)'); g.addColorStop(1, 'rgba(140,0,30,' + (.14 + .16 * p) * a + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      }
      // bordes rojos al recibir daño
      if (E.golpeado > .02) {
        const g = cx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .85);
        g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, 'rgba(255,40,40,' + (.45 * E.golpeado * a) + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      }
    } catch (e) { E.off = true; }
  }

  /* ---------- gancho 4: escala de tiempo del bucle (hit-stop). 1 = normal ---------- */
  function escala() { return (!E.off && E.stop > 0) ? .08 : 1; }

  const api = {
    antes, luces, encima, escala, golpe, luz, adelanto, mundo, camY,
    _estado: () => E, _apagar: () => { E.off = true; }, _encender: () => { E.off = false; E.S = null; E.lite = false; E.lento = 0; E.avg = 16.7; E.camY = 0; E.lead = 0; }
  };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.N1cam = api;
})(typeof window !== 'undefined' ? window : globalThis);
