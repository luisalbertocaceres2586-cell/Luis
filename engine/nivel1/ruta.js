/* Ruta del Nivel 1 — "La Senda del Aprendiz Ninja"
 * El nivel NO es una línea fija: es un árbol de decisiones. Cada vez que se empieza se sortea una SEMILLA,
 * y en cada etapa el jugador elige entre 2 actos distintos. Lo que elige (y lo que consigue o pierde por el
 * camino: antorcha, armadura, aliados...) cambia las opciones siguientes y cómo es el jefe final.
 * Mismas decisiones + misma semilla = mismo nivel (así se puede guardar y continuar). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Ruta = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // ---------- números aleatorios con semilla ----------
  function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; }; }
  function crearRng(semilla, etiqueta) {
    let a = hash(String(semilla) + '|' + (etiqueta || ''))();
    const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return {
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      chance: p => next() < p,
      pick: arr => arr[Math.floor(next() * arr.length)],
      shuffle: arr => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; },
      derivar: et => crearRng(semilla, (etiqueta || '') + '/' + et)
    };
  }
  function nuevaSemilla() { return Math.floor(Math.random() * 2147483647) + 1; }

  // ---------- catálogo de actos ----------
  // min: minutos de juego típicos [mínimo, máximo] · modo: cómo se juega · otorga/pierde: banderas que cambia
  const ACTOS = {
    bosque:  { listo: true, nombre: 'Bosque de Bambú',        modo: 'horizontal',     dir: 1,  min: [4, 6], preguntas: 6, riesgo: 1, pista: 'Camino suave entre bambúes. Ideal para entrar en calor.', otorga: [] },
    cueva:   { nombre: 'Cueva de las Luciérnagas', modo: 'oscuro',        dir: 1,  min: [5, 7], preguntas: 7, riesgo: 3, pista: 'Oscura y peligrosa: solo ves lo que alumbra tu antorcha.', otorga: ['antorcha'] },
    dojo:    { nombre: 'Dojo de las Pruebas',    modo: 'acertijos',      dir: 1,  min: [4, 6], preguntas: 7, riesgo: 2, pista: 'Salas con trampas y mecanismos que hay que mover y romper.', otorga: ['llave_dojo'] },
    jardin:  { nombre: 'Jardín de los Zorros',   modo: 'memoria',        dir: 1,  min: [3, 5], preguntas: 6, riesgo: 1, pista: 'Tranquilo y misterioso. Los zorros de piedra guardan un secreto.', otorga: ['bendicion_zorro'] },
    torre:   { nombre: 'Torre del Dojo',         modo: 'vertical',       dir: 0,  min: [5, 7], preguntas: 6, riesgo: 3, pista: 'Se sube sin parar mientras la sombra te alcanza.', otorga: ['vista_torre'] },
    mercado: { nombre: 'Mercado Nocturno',       modo: 'carreta',        dir: 1,  min: [4, 6], preguntas: 6, riesgo: 2, pista: 'Faroles, carretas y un mercader que quizá te ayude.', otorga: ['aliado_mercader'] },
    armeria: { nombre: 'Armería del Maestro',    modo: 'transformacion', dir: 1,  min: [4, 6], preguntas: 5, riesgo: 2, pista: 'Un cofre guarda una armadura legendaria… si superas su guardia.', otorga: ['armadura'] },
    tejados: { nombre: 'Tejados al Atardecer',   modo: 'reversa',        dir: -1, min: [4, 5], preguntas: 6, riesgo: 3, pista: 'Corres de derecha a izquierda perseguido por una roca gigante.', otorga: ['ritmo_tejados'] },
    dragon:  { nombre: 'Vuelo del Dragón de Papel', modo: 'nave',        dir: 1,  min: [3, 5], preguntas: 6, riesgo: 2, pista: 'Vuelo automático: sube, baja y cruza el farol correcto.', otorga: ['pergamino_dragon'] },
    secreto: { nombre: 'Portal Azul',            modo: 'secreto',        dir: 1,  min: [2, 4], preguntas: 4, riesgo: 2, pista: 'Un portal que casi nadie encuentra. Algo cambia si entras.', otorga: ['llave_portal'] },
    jefe:    { nombre: 'Santuario del Oni Guardián', modo: 'jefe',       dir: 1,  min: [5, 8], preguntas: 8, riesgo: 4, pista: 'El guardián del portón final.', otorga: [] }
  };

  // Qué actos pueden aparecer en cada etapa (se ofrecen 2 distintos de los que aún no se jugaron)
  const ETAPAS = [
    { id: 1, fijo: 'bosque' },
    { id: 2, pool: ['cueva', 'dojo', 'jardin'] },
    { id: 3, pool: ['torre', 'mercado', 'jardin', 'dojo'] },
    { id: 4, pool: ['armeria', 'mercado', 'dojo', 'torre'] },
    { id: 5, pool: ['tejados', 'dragon', 'torre', 'cueva'] },
    { id: 6, pool: ['dragon', 'tejados', 'secreto', 'jardin', 'mercado'] },
    { id: 7, fijo: 'jefe' }
  ];

  const config = { soloListos: false };   // el motor lo activa: solo se ofrecen actos que ya existen
  function tiene(plan, bandera) { return plan.banderas.indexOf(bandera) >= 0; }
  function dar(plan, b) { if (!tiene(plan, b)) plan.banderas.push(b); }
  function quitar(plan, b) { plan.banderas = plan.banderas.filter(x => x !== b); }

  function opcion(plan, id, etapa) {
    const base = ACTOS[id];
    const rng = crearRng(plan.semilla, 'acto/' + etapa + '/' + id);
    return {
      acto: id, nombre: base.nombre, modo: base.modo, dir: base.dir, pista: base.pista, riesgo: base.riesgo,
      recompensa: base.otorga.slice(),
      // parámetros que hacen distinto cada intento del mismo acto
      params: {
        semilla: rng.int(1, 2147483646),
        dificultad: Math.min(5, 1 + Math.floor((etapa - 1) * 0.6) + (base.riesgo > 2 ? 1 : 0)),
        preguntas: base.preguntas,
        variante: rng.pick(['A', 'B', 'C'])
      }
    };
  }

  /** Crea una ruta nueva. Solo conoce la etapa 1; las siguientes salen de las decisiones. */
  function nuevoPlan(semilla) {
    const plan = { v: 1, semilla: semilla || nuevaSemilla(), etapa: 1, jugados: [], banderas: [], decisiones: [], opciones: null, vidas: 3 };
    plan.opciones = [opcion(plan, 'bosque', 1)];
    return plan;
  }

  /** Las opciones que se ofrecen en la etapa actual (1 si es fija, 2 si hay que decidir). */
  function ofrecer(plan) {
    const e = ETAPAS[plan.etapa - 1];
    if (e.fijo) return [opcion(plan, e.fijo, plan.etapa)];
    const rng = crearRng(plan.semilla, 'etapa/' + plan.etapa + '/' + plan.jugados.join(','));
    let libres = e.pool.filter(a => plan.jugados.indexOf(a) < 0);
    if (config.soloListos) libres = libres.filter(a => ACTOS[a].listo);
    // consecuencias: sin el secreto del dojo/jardín no aparece el Portal Azul
    if (plan.etapa === 6 && !(tiene(plan, 'llave_dojo') || tiene(plan, 'bendicion_zorro'))) libres = libres.filter(a => a !== 'secreto');
    let mezcla = rng.shuffle(libres);
    // la armería (armadura) se ofrece casi siempre en la etapa 4, pero no es obligatorio tomarla
    if (plan.etapa === 4 && libres.indexOf('armeria') >= 0 && rng.chance(0.65)) mezcla = ['armeria'].concat(mezcla.filter(a => a !== 'armeria'));
    return mezcla.slice(0, 2).map(a => opcion(plan, a, plan.etapa));
  }

  /** Aplica una decisión: devuelve el plan avanzado a la siguiente etapa con sus nuevas opciones. */
  function elegir(plan, acto) {
    const op = (plan.opciones || []).find(o => o.acto === acto);
    if (!op) throw new Error('Esa opción no está disponible: ' + acto);
    plan.decisiones.push({ etapa: plan.etapa, elegido: acto, descartado: plan.opciones.filter(o => o.acto !== acto).map(o => o.acto) });
    plan.jugados.push(acto);
    op.recompensa.forEach(b => dar(plan, b));
    plan.ultimo = op;
    return plan;
  }
  /** Se llama al terminar el acto (con lo ocurrido adentro) y prepara la siguiente etapa. */
  function terminarActo(plan, resultado) {
    resultado = resultado || {};
    (resultado.gano || []).forEach(b => dar(plan, b));
    (resultado.perdio || []).forEach(b => quitar(plan, b));
    plan.etapa += 1;
    plan.opciones = plan.etapa <= ETAPAS.length ? ofrecer(plan) : [];
    return plan;
  }

  /** Cómo será el jefe final según lo que pasó en el camino. */
  function jefeSegun(plan) {
    const f = {
      escudo: tiene(plan, 'armadura'),          // con armadura: puede embestir
      luz: tiene(plan, 'antorcha'),             // con antorcha: la fase oscura es más fácil
      aliado: tiene(plan, 'aliado_mercader'),   // el mercader lanza un escudo
      secreto: tiene(plan, 'llave_portal'),     // el portal azul abre una cuarta fase
      bendicion: tiene(plan, 'bendicion_zorro') // un error se perdona
    };
    const rng = crearRng(plan.semilla, 'jefe/' + plan.decisiones.map(d => d.elegido).join(','));
    return { fases: 3 + (f.secreto ? 1 : 0), banderas: f, patron: rng.pick(['martillo', 'orbes', 'ondas']), semilla: rng.int(1, 2147483646) };
  }

  function duracionEstimada(plan) {
    let lo = 0, hi = 0;
    plan.jugados.forEach(a => { lo += ACTOS[a].min[0]; hi += ACTOS[a].min[1]; });
    return { min: lo, max: hi };
  }

  /** Recorre toda la ruta de forma automática (para pruebas y para estimar duración). */
  function simular(semilla, politica) {
    const plan = nuevoPlan(semilla); const rng = crearRng(semilla, 'sim');
    while (plan.etapa <= ETAPAS.length) {
      const ops = plan.opciones;
      const op = politica ? politica(ops, plan) : rng.pick(ops);
      elegir(plan, op.acto); terminarActo(plan, {});
    }
    return plan;
  }

  return { config, crearRng, nuevaSemilla, ACTOS, ETAPAS, nuevoPlan, ofrecer, elegir, terminarActo, jefeSegun, duracionEstimada, simular, tiene };
});
