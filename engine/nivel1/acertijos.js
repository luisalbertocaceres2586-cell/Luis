/* Acertijos del mundo — Ninja Multiplicación
 * Las preguntas de matemáticas NO salen como un cuadro de opciones: son objetos del mundo con los que el
 * ninja interactúa (romper un bloque, empujar una carreta, encender un farol, lanzar un shuriken, saltar a
 * la piedra correcta...). Este módulo decide QUÉ se pregunta (según lo que el estudiante domina) y CÓMO se
 * responde (qué mecánica), y genera la descripción de los objetos. El dibujo y la física los pone el motor. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Acertijos = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---------- maestría: qué hechos domina el estudiante ----------
  // estado[hecho] = { a: aciertos, e: errores, caja: 0..4, t: turno de la última vez }
  function crearMaestria(estado) {
    const st = estado || {};
    let turno = Object.keys(st).reduce((m, k) => Math.max(m, st[k].t || 0), 0);
    function reg(h) { return st[h] || (st[h] = { a: 0, e: 0, caja: 0, t: 0 }); }
    return {
      estado: st,
      registrar(hecho, acierto) {
        const r = reg(hecho); turno++; r.t = turno;
        if (acierto) { r.a++; r.caja = Math.min(4, r.caja + 1); } else { r.e++; r.caja = Math.max(0, r.caja - 2); }
      },
      /** Cuánto "necesita" practicar este hecho (más alto = más urgente). */
      peso(hecho) {
        const r = st[hecho]; if (!r) return 3;                 // nunca visto: bastante prioridad
        const total = r.a + r.e || 1;
        const falla = r.e / total;
        const reciente = Math.max(0, 4 - (turno - r.t)) * 1.5;  // no repetir lo que acaba de salir
        return Math.max(0.15, (4 - r.caja) * 0.8 + falla * 3 - reciente);
      },
      elegir(rng, candidatos, n) {
        const pool = candidatos.slice(), res = [];
        for (let k = 0; k < n && pool.length; k++) {
          const pesos = pool.map(h => this.peso(h)); const suma = pesos.reduce((a, b) => a + b, 0);
          let x = rng.next() * suma, i = 0;
          while (i < pool.length - 1 && x >= pesos[i]) { x -= pesos[i]; i++; }
          res.push(pool.splice(i, 1)[0]);
        }
        return res;
      }
    };
  }

  // ---------- tipos de pregunta (todas refuerzan la tabla y matemáticas básicas) ----------
  // Cada una devuelve { respuesta, texto, hecho, concepto, distractores(rng) }
  const TIPOS = {
    producto: (t, b) => ({ respuesta: t * b, texto: t + ' × ' + b, concepto: 'multiplicar', hecho: t + 'x' + b }),
    factor:   (t, b) => ({ respuesta: b, texto: t + ' × ? = ' + (t * b), concepto: 'factor que falta', hecho: t + 'x' + b }),
    doble:    (t, b) => ({ respuesta: t * b, texto: b + ' veces ' + t, concepto: 'sumar repetido', hecho: t + 'x' + b }),
    mitad:    (t, b) => ({ respuesta: b, texto: 'la mitad de ' + (t * b) + (t === 2 ? '' : ' entre ' + t / 2), concepto: 'dividir', hecho: t + 'x' + b }),
    salto:    (t, b) => ({ respuesta: t * b, texto: 'cuenta de ' + t + ' en ' + t + ': ' + [1, 2, 3].map(k => t * Math.max(1, b - 3 + k)).filter((_, i) => b - 3 + i + 1 >= 1).slice(0, 2).join(', ') + ', ?', concepto: 'secuencia', hecho: t + 'x' + b })
  };

  function distractores(rng, correcta, n, tabla) {
    const cand = new Set();
    // errores típicos: vecino de la tabla, cambio de dígito, suma en vez de multiplicar
    [correcta - tabla, correcta + tabla, correcta + 1, correcta - 1, correcta + 2, correcta - 2, correcta + 10, correcta - 10].forEach(v => { if (v > 0 && v !== correcta) cand.add(v); });
    const lista = rng.shuffle(Array.from(cand));
    while (lista.length < n) { const v = correcta + rng.int(-6, 6); if (v > 0 && v !== correcta && lista.indexOf(v) < 0) lista.push(v); }
    return lista.slice(0, n);
  }

  // ---------- mecánicas: cómo se responde dentro del mundo ----------
  const MECANICAS = {
    romper_bloques:  { verbo: 'Rompe el bloque con', objetos: 4, tipos: ['producto', 'doble', 'factor'],           penal: 'los demás bloques explotan' },
    empujar_carreta: { verbo: 'Empuja la carreta hasta la plataforma de', objetos: 3, tipos: ['producto', 'doble'], penal: 'la carreta se atasca' },
    encender_farol:  { verbo: 'Enciende el farol de', objetos: 4, tipos: ['producto', 'factor', 'salto'],          penal: 'el farol se apaga y la luz se encoge' },
    diana:           { verbo: 'Lanza el shuriken a la diana de', objetos: 4, tipos: ['producto', 'factor', 'mitad'],  penal: 'el shuriken rebota' },
    piedras:         { verbo: 'Salta a la piedra que sigue la cuenta:', objetos: 3, tipos: ['salto'],               penal: 'la piedra se desmorona' },
    dial:            { verbo: 'Gira las ruedas hasta formar', objetos: 1, tipos: ['producto', 'doble', 'factor'],   penal: 'la cerradura se bloquea un instante' },
    balanza:         { verbo: 'Arrastra pesas hasta equilibrar', objetos: 1, tipos: ['factor'],                    penal: 'la balanza se inclina' },
    luciernagas:     { verbo: 'Cuenta los grupos de luciérnagas y toca', objetos: 4, tipos: ['producto', 'doble'],   penal: 'las luciérnagas huyen' }
  };

  /** Crea un acertijo listo para que el motor lo coloque en el mundo. */
  function crear(op) {
    const rng = op.rng, tabla = op.tabla || 2, maestria = op.maestria;
    const mec = op.mecanica || rng.pick(op.permitidas || Object.keys(MECANICAS));
    const m = MECANICAS[mec];
    const candidatos = []; for (let b = 1; b <= 10; b++) candidatos.push(tabla + 'x' + b);
    const hecho = maestria ? maestria.elegir(rng, candidatos, 1)[0] : rng.pick(candidatos);
    const b = parseInt(hecho.split('x')[1], 10);
    const tipo = rng.pick(m.tipos);
    const q = TIPOS[tipo](tabla, b);
    const out = { mecanica: mec, tipo: tipo, hecho: q.hecho, concepto: q.concepto, enunciado: m.verbo + ' ' + q.texto, penalizacion: m.penal, objetos: [] };

    if (mec === 'dial') {
      out.objetos = [{ valor: q.respuesta, correcto: true, digitos: String(q.respuesta).length }];
    } else if (mec === 'balanza') {
      out.balanza = { valorPesa: tabla, objetivo: tabla * b, pesasNecesarias: b };
      out.objetos = [{ valor: b, correcto: true }];
      out.enunciado = m.verbo + ' ' + (tabla * b) + ' (cada pesa vale ' + tabla + ')';
    } else if (mec === 'luciernagas') {
      out.grupos = { cuantos: b, tamano: tabla };      // b grupos de `tabla` luciérnagas
      const ds = distractores(rng, q.respuesta, m.objetos - 1, tabla);
      out.objetos = rng.shuffle([{ valor: q.respuesta, correcto: true }].concat(ds.map(v => ({ valor: v, correcto: false }))));
      out.enunciado = m.verbo + ' el total';
    } else if (mec === 'piedras') {
      // piedras con la cuenta: dos ya puestas y la que sigue entre varias
      const start = Math.max(1, b - 2);
      out.secuencia = [tabla * start, tabla * (start + 1)];
      const sig = tabla * (start + 2);
      const ds = distractores(rng, sig, m.objetos - 1, tabla);
      out.objetos = rng.shuffle([{ valor: sig, correcto: true }].concat(ds.map(v => ({ valor: v, correcto: false }))));
      out.hecho = tabla + 'x' + (start + 2);
      out.enunciado = m.verbo + ' ' + out.secuencia.join(', ') + ', ?';
    } else {
      const ds = distractores(rng, q.respuesta, m.objetos - 1, tabla);
      out.objetos = rng.shuffle([{ valor: q.respuesta, correcto: true }].concat(ds.map(v => ({ valor: v, correcto: false }))));
    }
    out.objetos.forEach((o, i) => { o.id = 'o' + i; });
    return out;
  }

  /** ¿La interacción del jugador fue la correcta? (el motor llama a esto cuando toca/rompe/empuja un objeto) */
  function evaluar(acertijo, valorElegido) {
    const ok = acertijo.objetos.some(o => o.correcto && o.valor === valorElegido);
    return { ok, hecho: acertijo.hecho };
  }

  return { crearMaestria, crear, evaluar, MECANICAS, TIPOS };
});
