/* Mundo 4 · El Mundo Negativo — LÓGICA PURA (sin dibujo, sin DOM). Se puede probar en Node.
   Idea: salas cuadradas de 9×9 casillas. Un toque gira TODA la sala 90° y cambia la gravedad.
   El héroe camina a izquierda/derecha (según como se ve la sala) y cae hacia donde apunta la gravedad.
   · Casillas fantasma (1, 2, 3): se atraviesan mientras estén en negativo y se vuelven SÓLIDAS cuando se restaura su cristal.
   · Retos que restauran un cristal:
       mult   → varias losas con números: pisa la que es el resultado de la tabla.
       sec    → pisa las losas en el orden de la tabla (3 · 6 · 9 …).
       sombra → la sombra de piedra cae con la gravedad: hay que dejarla caer sobre el interruptor.
   · Cuando todos los cristales de la sala están restaurados, el portal de salida se abre.
   Todo es por turnos y determinista, así un solucionador (BFS) puede comprobar que cada sala tiene solución
   y dar pistas. */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Nivel4Logica = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // gravedad en coordenadas del mundo según cuántos giros horarios lleva la vista (r = 0..3)
  const G = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  // "derecha de la pantalla" en coordenadas del mundo para cada r
  const DER = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  const ACCIONES = ['L', 'R', 'CW', 'CCW'];

  const esFantasma = t => t >= '1' && t <= '3';

  /** Crea el estado inicial de una sala. sala = {mapa:[9 textos], retos:[...]} */
  function crear(sala) {
    const mapa = sala.mapa.map(f => f.split(''));
    const h = mapa.length, w = mapa[0].length;
    let hero = null; const enemigos = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = mapa[y][x];
      if (c === 'H') { hero = { x, y }; mapa[y][x] = '.'; }
      else if (c === 'E') { enemigos.push({ x, y }); mapa[y][x] = '.'; }
    }
    if (!hero) throw new Error('La sala no tiene héroe (H)');
    let req = 0; (sala.retos || []).forEach(r => { req |= 1 << (r.cristal - 1); });
    return {
      w, h, mapa, hero, enemigos, r: 0, rest: 0, req,
      prog: (sala.retos || []).map(() => 0),     // avance de cada reto de secuencia
      hechoReto: (sala.retos || []).map(() => false),
      retos: sala.retos || [],
      inicio: { x: hero.x, y: hero.y },
      errores: 0, aciertos: 0, muertes: 0, pasos: 0, gana: false, muerto: false
    };
  }

  function clonar(E) {
    return {
      w: E.w, h: E.h, mapa: E.mapa, hero: { x: E.hero.x, y: E.hero.y }, enemigos: E.enemigos.map(e => ({ x: e.x, y: e.y })),
      r: E.r, rest: E.rest, req: E.req, prog: E.prog.slice(), hechoReto: E.hechoReto.slice(), retos: E.retos, inicio: E.inicio,
      errores: E.errores, aciertos: E.aciertos, muertes: E.muertes, pasos: E.pasos, gana: E.gana, muerto: E.muerto
    };
  }

  function moverEn(E, x, y, yo) {
    if (E.hero !== yo && E.hero.x === x && E.hero.y === y) return true;
    for (let i = 0; i < E.enemigos.length; i++) { const e = E.enemigos[i]; if (e !== yo && e.x === x && e.y === y) return true; }
    return false;
  }
  /** ¿Hay algo sólido en esa casilla para el que se mueve? */
  function bloquea(E, x, y, yo) {
    if (x < 0 || y < 0 || x >= E.w || y >= E.h) return true;
    const t = E.mapa[y][x];
    if (t === '#') return true;
    if (esFantasma(t) && (E.rest & (1 << (t.charCodeAt(0) - 49))) && !moverEn(E, x, y, null)) return true;   // la tinta espera si alguien está dentro de esa casilla
    return moverEn(E, x, y, yo);
  }

  /** Todos caen hacia la gravedad hasta apoyarse. Devuelve false si el héroe cayó en pinchos. */
  function caer(E, trazo) {
    const g = G[E.r]; let mueve = true, guarda = 0;
    while (mueve && guarda++ < 64) {
      mueve = false;
      const ms = [E.hero].concat(E.enemigos).sort((a, b) => (b.x * g[0] + b.y * g[1]) - (a.x * g[0] + a.y * g[1]));
      for (let i = 0; i < ms.length; i++) {
        const m = ms[i], nx = m.x + g[0], ny = m.y + g[1];
        if (!bloquea(E, nx, ny, m)) {
          m.x = nx; m.y = ny; mueve = true;
          if (m === E.hero && E.mapa[ny][nx] === '^') { E.muerto = true; if (trazo) trazo.push(instantanea(E)); return false; }
        }
      }
      if (mueve && trazo) trazo.push(instantanea(E));
    }
    return true;
  }
  function instantanea(E) { return { hero: { x: E.hero.x, y: E.hero.y }, enemigos: E.enemigos.map(e => ({ x: e.x, y: e.y })), r: E.r, rest: E.rest }; }

  function restaurar(E, reto, ev, x, y) {
    const bit = 1 << (reto.cristal - 1);
    if (E.rest & bit) return;
    E.rest |= bit; ev.push({ t: 'cristal', n: reto.cristal, x, y });
  }

  /** Efectos al quedar quieto (pisar losas, sombra sobre el interruptor, salida). */
  function evaluar(E, ev, cambio) {
    const hx = E.hero.x, hy = E.hero.y, c = E.mapa[hy][hx];
    E.retos.forEach((r, k) => {
      if (r.tipo === 'sombra') {
        if (E.hechoReto[k]) return;
        const ok = E.enemigos.some(e => E.mapa[e.y][e.x] === 'S');
        if (ok) { E.hechoReto[k] = true; const e = E.enemigos.find(q => E.mapa[q.y][q.x] === 'S'); restaurar(E, r, ev, e.x, e.y); ev.push({ t: 'interruptor', x: e.x, y: e.y }); }
      } else if (cambio && r.tipo === 'mult' && !E.hechoReto[k] && r.pads[c]) {
        if (r.pads[c].ok) { E.hechoReto[k] = true; E.aciertos++; ev.push({ t: 'acierto', x: hx, y: hy, pad: c }); restaurar(E, r, ev, hx, hy); }
        else { E.errores++; ev.push({ t: 'error', x: hx, y: hy, pad: c }); }
      } else if (cambio && r.tipo === 'sec' && !E.hechoReto[k] && r.orden.indexOf(c) >= 0) {
        const i = r.orden.indexOf(c);
        if (i === E.prog[k]) {
          E.prog[k]++; ev.push({ t: 'paso', x: hx, y: hy, pad: c, i });
          if (E.prog[k] >= r.orden.length) { E.hechoReto[k] = true; E.aciertos++; restaurar(E, r, ev, hx, hy); }
        } else if (i > E.prog[k]) { E.prog[k] = 0; E.errores++; ev.push({ t: 'error', x: hx, y: hy, pad: c }); }
      }
    });
  }

  /** Aplica una acción. Devuelve {valida, ev[], trazo[]}. Modifica E. */
  function aplicar(E, accion, conTrazo) {
    const ev = [], trazo = conTrazo ? [] : null;
    if (E.gana || E.muerto) return { valida: false, ev, trazo };
    let prev = E.hero.x + ',' + E.hero.y;
    if (accion === 'L' || accion === 'R') {
      const d = DER[E.r], s = accion === 'R' ? 1 : -1, nx = E.hero.x + d[0] * s, ny = E.hero.y + d[1] * s;
      if (bloquea(E, nx, ny, E.hero)) return { valida: false, ev, trazo };
      E.hero.x = nx; E.hero.y = ny; if (trazo) trazo.push(instantanea(E));
      if (E.mapa[ny][nx] === '^') { E.muerto = true; ev.push({ t: 'muerte' }); return { valida: true, ev, trazo }; }
    } else if (accion === 'CW' || accion === 'CCW') {
      E.r = (E.r + (accion === 'CW' ? 1 : 3)) & 3;
      if (trazo) trazo.push(instantanea(E));
    } else return { valida: false, ev, trazo };
    E.pasos++;
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      if (!caer(E, trazo)) { ev.push({ t: 'muerte' }); return { valida: true, ev, trazo }; }
      const pos = E.hero.x + ',' + E.hero.y, rest0 = E.rest;
      evaluar(E, ev, pos !== prev); prev = pos;
      if (E.rest === rest0) break;   // si se restauró un cristal, las casillas fantasma cambian → volver a caer
    }
    if (E.mapa[E.hero.y][E.hero.x] === 'X' && E.rest === E.req) { E.gana = true; ev.push({ t: 'gana' }); }
    return { valida: true, ev, trazo };
  }

  /** Clave compacta del estado (para el solucionador). */
  function clave(E) {
    let k = E.hero.x + ',' + E.hero.y + ',' + E.r + ',' + E.rest;
    for (let i = 0; i < E.enemigos.length; i++) k += ',' + E.enemigos[i].x + '.' + E.enemigos[i].y;
    for (let i = 0; i < E.prog.length; i++) k += ',' + E.prog[i] + (E.hechoReto[i] ? 'h' : '');
    return k;
  }

  /** BFS: camino más corto hasta ganar. Devuelve array de acciones o null (sin solución) — máx. `tope` estados.
      Con `evitaErrores` descarta los pasos que pisan una losa equivocada (para que las pistas nunca guíen a un error). */
  function resolver(E0, tope, evitaErrores) {
    tope = tope || 400000;
    if (E0.gana) return [];
    const ini = clonar(E0); ini.muerto = false;
    const vistos = new Map(); vistos.set(clave(ini), null);
    let frente = [ini]; const padre = new Map();
    let n = 0;
    while (frente.length) {
      const sig = [];
      for (let i = 0; i < frente.length; i++) {
        const E = frente[i], kE = clave(E);
        for (let a = 0; a < ACCIONES.length; a++) {
          const F = clonar(E); const res = aplicar(F, ACCIONES[a], false);
          if (!res.valida || F.muerto) continue;
          if (evitaErrores && res.ev.some(e => e.t === 'error')) continue;   // no pasar por una losa equivocada
          const kF = clave(F); if (vistos.has(kF)) continue;
          vistos.set(kF, true); padre.set(kF, [kE, ACCIONES[a]]);
          if (F.gana) { const cam = []; let k = kF; while (padre.has(k)) { const p = padre.get(k); cam.push(p[1]); k = p[0]; } return cam.reverse(); }
          sig.push(F); if (++n > tope) return null;
        }
      }
      frente = sig;
    }
    return null;
  }

  // ───────────────────────── preguntas de las tablas ─────────────────────────
  const rnd = (a, b, r) => a + Math.floor((r || Math.random)() * (b - a + 1));
  function barajar(a, r) { r = r || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /** Pregunta a×b con distractores creíbles (errores típicos de las tablas). */
  function pregunta(tablas, r, evitar) {
    r = r || Math.random;
    let T, n, guard = 0;
    do { T = tablas[rnd(0, tablas.length - 1, r)]; n = rnd(2, 9, r); } while (evitar && evitar[T + 'x' + n] && guard++ < 20);
    const c = T * n, cand = [c + T, c - T, c + 1, c - 1, c + 2, c - 2, c + 10, c - 10, T * (n + 1), T * (n - 1), (T + 1) * n, (T - 1) * n].filter(v => v > 0 && v !== c);
    const uni = []; cand.forEach(v => { if (uni.indexOf(v) < 0) uni.push(v); });
    return { T, n, c, malos: barajar(uni, r) };
  }

  /** Reparte números a las losas de un reto `mult` y `sec` según la pregunta. Se reintenta hasta que
      ningún número se repita entre las losas de la sala (si no, el niño no sabría cuál es cuál). */
  function rellenar(E, tablas, r, evitar) {
    r = r || Math.random; let info = [];
    for (let intento = 0; intento < 60; intento++) {
      info = []; const usados = [];
      E.retos.forEach(reto => {
        if (reto.tipo === 'mult') {
          const q = pregunta(tablas, r, evitar); let i = 0; reto.q = q;
          Object.keys(reto.pads).forEach(k => { reto.pads[k].n = reto.pads[k].ok ? q.c : q.malos[i++]; usados.push(reto.pads[k].n); });
          info.push(reto);
        } else if (reto.tipo === 'sec') {
          const T = tablas[rnd(0, tablas.length - 1, r)]; reto.T = T; reto.q = { T, n: 0, c: 0 };
          reto.orden.forEach((k, i) => { reto.pads[k] = { n: T * (i + 1) }; usados.push(T * (i + 1)); });
          info.push(reto);
        }
      });
      if (new Set(usados).size === usados.length) break;
    }
    return info;
  }

  /** Plan de ayuda desde el estado actual: la solución más corta y EN QUÉ ORDEN restaura los cristales
      (p. ej. en la sala 4: sombra → secuencia → resultado). Devuelve {sol, orden, hitos} o null si no hay salida. */
  function plan(E0, tope) {
    const sol = resolver(E0, tope, true) || resolver(E0, tope, false); if (!sol) return null;   // 1º un camino SIN errores; si no existe, el más corto
    const F = clonar(E0); F.muerto = false; const orden = [], hitos = [];
    sol.forEach((a, i) => { const r = aplicar(F, a, false); r.ev.forEach(e => { if (e.t === 'cristal') { orden.push(e.n); hitos.push({ i, n: e.n }); } }); });
    return { sol, orden, hitos };
  }
  /** Pista de cálculo sin regalar la respuesta: los primeros n-1 términos de la tabla de T (3 × 4 → [3, 6, 9]). */
  function cuentaDe(T, n) { const a = []; for (let i = 1; i < n; i++) a.push(T * i); return a; }

  return { G, DER, ACCIONES, crear, clonar, aplicar, resolver, clave, caer, pregunta, rellenar, esFantasma, barajar, plan, cuentaDe };
});
