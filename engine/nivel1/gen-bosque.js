/* Generador del Acto 1 — Bosque de Bambú.
 * Cada semilla arma un bosque distinto juntando "tramos" (llano, barranco con puente, barranco de bambúes,
 * estacas de kunai, escalera de bambú, tambor taiko, patrulla) y 6 estaciones de acertijo repartidas.
 * Todo son datos: el motor los dibuja y simula. Aquí no hay dibujo, así se puede probar en Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ruta.js'), require('./acertijos.js'));
  else root.GenBosque = factory(root.Ruta, root.Acertijos);
})(typeof self !== 'undefined' ? self : this, function (Ruta, Ac) {
  const G = 560;                       // altura del suelo
  const SALTO = { alto: 180, largo: 250 };   // lo que alcanza el héroe (el diseño usa márgenes más cortos)

  function generar(params, maestria) {
    const rng = Ruta.crearRng(params.semilla, 'bosque');
    const N = { suelo: [], plat: [], haz: [], enem: [], items: [], deco: [], est: [], ckp: [], tambores: [], gaps: [] };
    let x = 0, ultimoSuelo = null;

    function suelo(x0, x1) {
      if (ultimoSuelo && ultimoSuelo.x1 === x0) { ultimoSuelo.x1 = x1; return; }
      ultimoSuelo = { x0, x1, y: G }; N.suelo.push(ultimoSuelo);
    }
    function hueco(x0, x1) { N.gaps.push({ x0, x1 }); }
    function plat(px, py, w, tipo, extra) { const p = Object.assign({ x: px, y: py, w, tipo }, extra || {}); N.plat.push(p); return p; }
    function perg(px, py) { N.items.push({ x: px, y: py, tipo: 'pergamino' }); }
    function arco(x0, x1, y, n) { for (let i = 0; i < n; i++) perg(x0 + (x1 - x0) * (i + .5) / n, y - Math.sin((i + .5) / n * Math.PI) * 50); }
    function enemigo(x0, x1, dificultad) { N.enem.push({ x: (x0 + x1) / 2, min: x0, max: x1, y: G, vx: 55 + dificultad * 12, vivo: true }); }
    function decorar(x0, x1) {
      const n = Math.floor((x1 - x0) / 220);
      for (let i = 0; i < n; i++) {
        const t = rng.pick(['bambu', 'bambu', 'bambu', 'toro', 'kitsune', 'estandarte']);
        N.deco.push({ x: x0 + 90 + i * 220 + rng.int(-40, 40), tipo: t, capa: rng.chance(0.3) ? 'frente' : 'atras' });
      }
    }

    // ---------- tramos ----------
    const TRAMOS = {
      llano() { const w = rng.int(480, 760); suelo(x, x + w); decorar(x, x + w); arco(x + 80, x + w - 80, G - 30, rng.int(3, 5)); x += w; },
      patrulla() {
        const w = rng.int(700, 900); suelo(x, x + w); decorar(x, x + w);
        enemigo(x + 150, x + 380, params.dificultad); if (rng.chance(0.6)) enemigo(x + 450, x + w - 90, params.dificultad);
        x += w;
      },
      puente() {
        const g = rng.int(280, 420), a = rng.int(120, 180), b = 140;
        suelo(x, x + a); hueco(x + a, x + a + g);
        plat(x + a - 20, G, g + 40, 'puente');
        suelo(x + a + g, x + a + g + b);
        arco(x + a + 40, x + a + g - 40, G - 40, 4);
        x += a + g + b;
      },
      barranco() {
        const a = 130, b = 140, pasos = rng.int(2, 3);
        const g = pasos * 150 + (pasos + 1) * 40 + rng.int(0, 30);
        suelo(x, x + a); hueco(x + a, x + a + g);
        let px = x + a + 40, py = G;
        for (let i = 0; i < pasos; i++) {
          py = G - rng.int(45, 95) - (i % 2 ? 0 : 20); plat(px, py, 150, 'bambu'); perg(px + 75, py - 70); px += 150 + rng.int(60, 130);
        }
        const fin = Math.max(px, x + a + g); hueco(x + a, fin); N.gaps.pop(); hueco(x + a, fin);
        suelo(fin, fin + b); x = fin + b;
        // el último bambú debe quedar cerca del borde
        const ult = N.plat[N.plat.length - 1]; if (fin - (ult.x + ult.w) > 130) ult.x = fin - 130 - ult.w + 20;
      },
      estacas() {
        const w = rng.int(130, 200), a = 220, b = 220;
        suelo(x, x + a + w + b); N.haz.push({ x: x + a, y: G - 46, w, h: 46, tipo: 'kunai' });
        if (rng.chance(0.7)) { plat(x + a - 10, G - 120, w + 20, 'bambu'); perg(x + a + w / 2, G - 190); }
        x += a + w + b;
      },
      escalera() {
        const base = x; const w = 960; suelo(x, x + w); decorar(x, x + w);
        const xs = [0, 190, 380, 570, 760], ys = [-90, -170, -250, -170, -90];
        xs.forEach((dx, i) => { plat(base + 80 + dx, G + ys[i], 150, 'bambu'); if (i === 2) { perg(base + 80 + dx + 50, G + ys[i] - 70); perg(base + 80 + dx + 100, G + ys[i] - 70); } });
        if (rng.chance(0.5)) N.items.push({ x: base + 80 + 380 + 75, y: G - 330, tipo: 'onigiri' });
        x += w;
      },
      taiko() {
        const base = x, w = 760; suelo(x, x + w); decorar(x, x + w);
        N.tambores.push({ x: base + 200, y: G });
        plat(base + 400, G - 300, 220, 'piedra'); perg(base + 450, G - 370); perg(base + 510, G - 370); perg(base + 570, G - 370);
        if (rng.chance(0.4)) N.items.push({ x: base + 600, y: G - 330, tipo: 'onigiri' });
        x += w;
      }
    };
    const pesos = ['llano', 'patrulla', 'patrulla', 'puente', 'barranco', 'estacas', 'estacas', 'escalera', 'taiko'];
    // dificultad: los tramos peligrosos aparecen a partir de la segunda estación
    function tramoAleatorio(i, anterior) {
      let t; do { t = rng.pick(pesos); } while (t === anterior || (i === 0 && ['barranco', 'estacas'].indexOf(t) >= 0));
      return t;
    }

    // ---------- estaciones de acertijo ----------
    const N_EST = params.preguntas || 6;
    const secuencia = ['encender_farol', 'romper_bloques', 'piedras', 'diana'];
    const mecs = [];
    for (let i = 0; i < N_EST; i++) mecs.push(i === 0 ? 'encender_farol' : rng.pick(secuencia.filter(m => m !== mecs[i - 1])));

    function estacion(i, mec) {
      const ac = Ac.crear({ rng: rng.derivar('est' + i), tabla: params.tabla || 2, mecanica: mec, maestria });
      const e = { i, mecanica: mec, ac, x0: x, objetos: [], resuelta: false, errores: 0, puertaX: 0, ancho: 0 };
      if (mec === 'piedras') {
        const W = 1220; suelo(x, x + 280); hueco(x + 280, x + W - 150); suelo(x + W - 150, x + W);
        const A = plat(x + 330, G - 40, 120, 'piedra_num', { valor: ac.secuencia[0], fija: true });
        const B = plat(x + 500, G - 80, 120, 'piedra_num', { valor: ac.secuencia[1], fija: true });
        ac.objetos.forEach((o, k) => {
          const p = plat(x + 700 + k * 62, G - 30 - k * 78, 110, 'piedra_num', { valor: o.valor, correcta: o.correcto, estado: 'firme', t: 0 });
          e.objetos.push(p);
        });
        plat(x + 990, G - 80, 120, 'piedra_num', { fija: true, valor: null });
        e.ancho = W; e.puertaX = null; x += W;
        e.cartel = { x: x - W + 120, y: G };
      } else {
        const W = 820; suelo(x, x + W); decorar(x, x + 160);
        const n = ac.objetos.length;
        ac.objetos.forEach((o, k) => {
          const ox = x + 210 + k * (mec === 'diana' ? 135 : 125);
          const alturas = { encender_farol: [G - 150, G - 200, G - 135, G - 190], romper_bloques: [G - 150, G - 195, G - 160, G - 200], diana: [G - 110, G - 210, G - 150, G - 250] }[mec];
          e.objetos.push({ x: ox, y: alturas[(k + rng.int(0, 3)) % alturas.length], valor: o.valor, correcto: o.correcto, estado: 'listo' });
        });
        e.puertaX = x + W - 80; e.ancho = W; x += W;
      }
      N.est.push(e);
    }

    // ---------- armado ----------
    suelo(x, x + 680); decorar(x, x + 680); arco(x + 200, x + 560, G - 30, 4); x += 680;   // inicio tranquilo
    N.inicio = { x: 120 };
    let ant = null;
    for (let i = 0; i < N_EST; i++) {
      let cuantos = i === 0 ? 1 : (rng.chance(0.3) ? 2 : 1);
      if (i > 0 && x > 700 + i * 1900) cuantos = 0;          // presupuesto de largo: si ya vamos largos, se salta el tramo
      for (let k = 0; k < cuantos; k++) { const t = tramoAleatorio(i, ant); TRAMOS[t](); ant = t; }
      estacion(i, mecs[i]);
      if (i === 1 || i === 3) { suelo(x, x + 200); N.ckp.push({ x: x + 100, activo: false }); x += 200; }
    }
    suelo(x, x + 620); decorar(x, x + 440); N.meta = { x: x + 380 }; x += 620;
    N.ancho = x;
    N.params = params;
    return N;
  }

  /** Comprueba que todo se puede recorrer. Devuelve una lista de problemas (vacía = bien). */
  function validar(N) {
    const fallos = [];
    N.gaps.forEach(g => {
      const ps = N.plat.filter(p => p.x < g.x1 + 60 && p.x + p.w > g.x0 - 60).sort((a, b) => a.x - b.x);
      let borde = g.x0, y = G, hecho = false;
      ps.forEach(p => {
        if (p.x - borde <= 170 && Math.abs(p.y - y) <= 130) { if (p.x + p.w > borde) { borde = p.x + p.w; y = p.y; } }
      });
      if (g.x1 - borde > 170 && !(borde >= g.x1)) fallos.push('hueco sin cruzar ' + g.x0 + '-' + g.x1);
    });
    N.haz.forEach(h => { if (h.w > 210) fallos.push('estacas demasiado anchas'); });
    N.est.forEach(e => {
      const c = e.ac.objetos.filter(o => o.correcto); if (c.length !== 1) fallos.push('estación sin una respuesta correcta');
      if (e.puertaX !== null && e.puertaX > e.x0 + e.ancho) fallos.push('puerta fuera de la estación');
    });
    for (let i = 1; i < N.suelo.length; i++) if (N.suelo[i].x0 < N.suelo[i - 1].x1) fallos.push('suelos solapados');
    if (N.est.length !== (N.params.preguntas || 6)) fallos.push('faltan estaciones');
    if (N.ancho < 6500 || N.ancho > 14500) fallos.push('largo inesperado ' + N.ancho);
    return fallos;
  }

  return { generar, validar, G, SALTO };
});
