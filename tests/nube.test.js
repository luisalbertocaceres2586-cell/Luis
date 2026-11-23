// Pruebas de cuentas y guardado en la nube (engine/nube.js) con un servidor simulado. Ejecutar: node tests/nube.test.js
const assert = require('assert');
const Nube = require('../engine/nube.js');

function fakeStore() {
  const d = {};
  return {
    get length() { return Object.keys(d).length; },
    key: i => Object.keys(d)[i] || null,
    getItem: k => (k in d ? d[k] : null),
    setItem: (k, v) => { d[k] = String(v); },
    removeItem: k => { delete d[k]; }
  };
}
// Servidor simulado con las mismas reglas del Code.gs (v2.1)
function fakeServer() {
  const users = {}; let n = 0, c = 0; const llamadas = [];
  const clases = { K7M24P: { nombre: '3A', activa: true }, OFF222: { nombre: 'Vieja', activa: false } };
  const cuentaDe = u => ({ clase: u.clase ? { codigo: u.clase, nombre: clases[u.clase].nombre } : null, ranking: !u.oculto });
  const cod = () => 'COD' + (++c) + '-AAAA-BBBB';
  const fetch = async (url, init) => {
    const q = JSON.parse(init.body); llamadas.push(q.action);
    const nick = String(q.nick || '').trim(), low = nick.toLowerCase(), u = users[low];
    const ok = tk => u && u.tokens.indexOf(tk) >= 0;
    let r;
    switch (q.action) {
      case 'check': r = /^[A-Za-z0-9_]{3,16}$/.test(nick) ? { ok: true, available: !u } : { ok: false, error: 'nick_invalido' }; break;
      case 'register':
        if (u) r = { ok: false, error: 'nick_en_uso' };
        else if (q.clase && !(clases[String(q.clase).toUpperCase()] || {}).activa) r = { ok: false, error: 'clase_invalida' };
        else { const tk = 't' + (++n), rc = cod(); users[low] = { nick, pass: q.pass, tokens: [tk], progress: q.progress || {}, rescate: rc, clase: q.clase ? String(q.clase).toUpperCase() : '' }; r = { ok: true, token: tk, progress: q.progress, rescate: rc, tieneRescate: true, cuenta: cuentaDe(users[low]) }; }
        break;
      case 'login':
        if (!u || u.pass !== q.pass) r = { ok: false, error: 'credenciales' };
        else { const tk = 't' + (++n); u.tokens.push(tk); r = { ok: true, token: tk, nick: u.nick, progress: u.progress, tieneRescate: !!u.rescate, cuenta: cuentaDe(u) }; }
        break;
      case 'recover':
        if (!u || !u.rescate) r = { ok: false, error: u ? 'sin_codigo' : 'codigo_invalido' };
        else if (u.rescate !== q.codigo) r = { ok: false, error: 'codigo_invalido' };
        else { u.pass = q.newpass; const tk = 't' + (++n); u.tokens = [tk]; u.rescate = cod(); r = { ok: true, token: tk, nick: u.nick, progress: u.progress, rescate: u.rescate, tieneRescate: true }; }
        break;
      case 'changepass':
        if (!ok(q.token)) r = { ok: false, error: 'sesion' };
        else if (u.pass !== q.pass) r = { ok: false, error: 'credenciales' };
        else { u.pass = q.newpass; u.tokens = [q.token]; r = { ok: true }; }
        break;
      case 'newrescue':
        if (!ok(q.token)) r = { ok: false, error: 'sesion' };
        else if (u.pass !== q.pass) r = { ok: false, error: 'credenciales' };
        else { u.rescate = cod(); r = { ok: true, rescate: u.rescate }; }
        break;
      case 'load': r = ok(q.token) ? { ok: true, progress: u.progress, cuenta: cuentaDe(u) } : { ok: false, error: 'sesion' }; break;
      case 'checkclass': { const k = clases[String(q.codigo).toUpperCase()]; r = { ok: true, valid: !!(k && k.activa), nombre: k && k.activa ? k.nombre : '' }; break; }
      case 'joinclass':
        if (!ok(q.token)) r = { ok: false, error: 'sesion' };
        else if (!q.codigo) { u.clase = ''; r = { ok: true, cuenta: cuentaDe(u) }; }
        else if (!(clases[String(q.codigo).toUpperCase()] || {}).activa) r = { ok: false, error: 'clase_invalida' };
        else { u.clase = String(q.codigo).toUpperCase(); r = { ok: true, cuenta: cuentaDe(u) }; }
        break;
      case 'setranking': if (!ok(q.token)) r = { ok: false, error: 'sesion' }; else { u.oculto = !q.visible; r = { ok: true, cuenta: cuentaDe(u) }; } break;
      case 'top':
        if (!ok(q.token)) r = { ok: false, error: 'sesion' };
        else if (q.ambito === 'clase' && !u.clase) r = { ok: false, error: 'sin_clase' };
        else { const l = Object.values(users).filter(x => !x.oculto && (q.ambito !== 'clase' || x.clase === u.clase)).map((x, i) => ({ pos: i + 1, nick: x.nick, puntaje: 100 - i, yo: x === u })); r = { ok: true, ambito: q.ambito, top: l, total: l.length, yo: u.oculto ? null : { pos: 1, puntaje: 100 }, oculto: !!u.oculto }; }
        break;
      case 'save': if (!ok(q.token)) r = { ok: false, error: 'sesion' }; else { u.progress = q.progress; r = { ok: true }; } break;
      default: r = { ok: false, error: 'accion_invalida' };
    }
    return { json: async () => JSON.parse(JSON.stringify(r)) };
  };
  return { fetch, users, llamadas };
}
const dispositivo = (srv, t) => {
  const store = fakeStore(); let reloj = t || 1000;
  const eventos = [], sesiones = [];
  const nube = Nube.crear({ store, fetch: srv.fetch, now: () => ++reloj, espera: 5,
    on: { estado: e => eventos.push(e), sesionExpirada: () => eventos.push('expirada'), sesion: (nick, motivo) => sesiones.push([nick, motivo]) } });
  return { store, nube, eventos, sesiones, jugar: (k, v) => { store.setItem(k, v); nube.cambio(k); } };
};
const espera = ms => new Promise(r => setTimeout(r, ms));
const perfil = (id, extra) => Object.assign({ id, nombre: id, avatar: 'sakura', progreso: { fase: 'easy', nivel: 0, puntos: 0 } }, extra);
const perfiles = (activo, ...ps) => JSON.stringify({ v: 1, activo, perfiles: Object.fromEntries(ps.map(p => [p.id, p])) });
const lista = d => Object.keys(JSON.parse(d.store.getItem('ninja_perfiles_v1') || '{"perfiles":{}}').perfiles).sort();

(async () => {
  // qué claves son progreso y cómo se llama el perfil de una cuenta
  assert.ok(Nube.esProgreso('mpl_v10_sv') && Nube.esProgreso('n2_ana_cp') && Nube.esProgreso('ninja_perfiles_v1'));
  assert.ok(!Nube.esProgreso('ninja_fx_volume') && !Nube.esProgreso('ninja_btn_pos_v3') && !Nube.esProgreso('ninja_nube_sesion_v1'));
  assert.strictEqual(Nube.perfilId('Ninja_Veloz'), 'ninja-veloz');

  // nick: validación, disponibilidad y registro
  const srv = fakeServer(), A = dispositivo(srv);
  assert.strictEqual((await A.nube.disponible('a')).error, 'nick_invalido');
  assert.strictEqual((await A.nube.disponible('ninja_1')).available, true);
  assert.strictEqual((await A.nube.registrar('ninja_1', '12')).error, 'clave_corta');

  // En el dispositivo hay OTROS jugadores: no deben viajar a la cuenta
  A.store.setItem('ninja_perfiles_v1', perfiles('ninja-1', perfil('ninja-1', { cuenta: 'ninja_1' }), perfil('hermano')));
  A.store.setItem('n2_ninja-1_cp', '{"ronda":2}');
  A.store.setItem('n2_hermano_cp', '{"ronda":9}');
  A.store.setItem('mpl_v10_sv', '{"phase":"easy","level":3}');
  A.store.setItem('ninja_fx_volume', '0.3');
  const rr = await A.nube.registrar('ninja_1', 'secreta');
  assert.ok(rr.ok && rr.rescate, 'el registro entrega el código de rescate');
  assert.deepStrictEqual(A.sesiones.pop(), ['ninja_1', 'entrar']);
  assert.strictEqual((await A.nube.disponible('NINJA_1')).available, false, 'sin distinguir mayúsculas');
  assert.strictEqual((await A.nube.registrar('Ninja_1', 'otra')).error, 'nick_en_uso');
  const subido = srv.users['ninja_1'].progress.datos;
  assert.deepStrictEqual(Object.keys(JSON.parse(subido['ninja_perfiles_v1']).perfiles), ['ninja-1'], 'solo el jugador de la cuenta');
  assert.ok('n2_ninja-1_cp' in subido && !('n2_hermano_cp' in subido), 'solo los checkpoints de la cuenta');
  assert.ok(!('ninja_fx_volume' in subido) && !('ninja_nube_sesion_v1' in subido));

  // guardado automático con pausa (varios cambios seguidos = una sola subida)
  const antes = srv.llamadas.filter(x => x === 'save').length;
  A.jugar('mpl_v10_sv', '{"level":4}'); A.jugar('ninja_mult_stars_v1', '{"1":3}'); A.jugar('n2_ninja-1_cp', '{"ronda":3}');
  A.jugar('ninja_fx_volume', '0.1');
  await espera(40);
  assert.strictEqual(srv.llamadas.filter(x => x === 'save').length - antes, 1);
  assert.strictEqual(srv.users['ninja_1'].progress.datos['n2_ninja-1_cp'], '{"ronda":3}');
  assert.ok(A.eventos.includes('guardado'));

  // lo que cambian OTROS jugadores del dispositivo no se sube ni mueve la fecha de la cuenta
  const ts0 = A.store.getItem('ninja_nube_ts_v1'), saves0 = srv.llamadas.filter(x => x === 'save').length;
  A.jugar('n2_hermano_cp', '{"ronda":10}');
  A.jugar('ninja_perfiles_v1', perfiles('ninja-1', perfil('ninja-1', { cuenta: 'ninja_1' }), perfil('hermano', { progreso: { fase: 'easy', nivel: 5, puntos: 99 } })));
  await espera(40);
  assert.strictEqual(A.store.getItem('ninja_nube_ts_v1'), ts0, 'la fecha de la cuenta no cambia');
  assert.strictEqual(srv.llamadas.filter(x => x === 'save').length, saves0, 'no se sube nada');
  assert.ok((await A.nube.guardarYa()).igual);

  // dispositivo B con otro jugador local: al entrar carga la cuenta SIN tocar al otro jugador
  const B = dispositivo(srv, 5000);
  B.store.setItem('ninja_perfiles_v1', perfiles('lola', perfil('lola', { progreso: { fase: 'easy', nivel: 2, puntos: 50 } })));
  B.store.setItem('n2_lola_cp', '{"ronda":1}');
  assert.strictEqual((await B.nube.entrar('ninja_1', 'mala')).error, 'credenciales');
  const rb = await B.nube.entrar('NINJA_1', 'secreta');
  assert.strictEqual(rb.accion, 'cargado');
  assert.deepStrictEqual(B.sesiones.pop(), ['ninja_1', 'entrar'], 'usa el apodo tal como se registró');
  assert.strictEqual(B.store.getItem('mpl_v10_sv'), '{"level":4}');
  assert.strictEqual(B.store.getItem('n2_ninja-1_cp'), '{"ronda":3}');
  assert.strictEqual(B.store.getItem('n2_lola_cp'), '{"ronda":1}', 'el otro jugador sigue intacto');
  assert.deepStrictEqual(lista(B), ['lola', 'ninja-1']);
  assert.strictEqual(JSON.parse(B.store.getItem('ninja_perfiles_v1')).activo, 'ninja-1', 'el jugador de la cuenta queda activo');
  assert.strictEqual(B.store.getItem('ninja_fx_volume'), null);

  // varias sesiones a la vez: A sigue conectado aunque B entró
  A.jugar('mpl_v10_sv', '{"level":5}'); await espera(40);
  assert.ok(!A.eventos.includes('expirada'));
  assert.strictEqual(srv.users['ninja_1'].progress.datos['mpl_v10_sv'], '{"level":5}');

  // conflicto: dos dispositivos con avance distinto → se pregunta; las sesiones se anuncian al resolver
  B.nube.salir(); B.sesiones.length = 0;
  B.store.setItem('mpl_v10_sv', '{"level":1}');
  const rc = await B.nube.entrar('ninja_1', 'secreta');
  assert.strictEqual(rc.accion, 'conflicto'); assert.strictEqual(B.sesiones.length, 0, 'aún no se anuncia la sesión');
  assert.strictEqual((await B.nube.resolver('nube')).accion, 'cargado');
  assert.strictEqual(B.store.getItem('mpl_v10_sv'), '{"level":5}'); assert.deepStrictEqual(B.sesiones.pop(), ['ninja_1', 'entrar']);
  B.nube.salir(); B.store.setItem('mpl_v10_sv', '{"level":2}');
  assert.strictEqual((await B.nube.entrar('ninja_1', 'secreta')).accion, 'conflicto');
  assert.strictEqual((await B.nube.resolver('local')).accion, 'subido');
  assert.strictEqual(srv.users['ninja_1'].progress.datos['mpl_v10_sv'], '{"level":2}');

  // volver a entrar en un dispositivo que ya tiene lo mismo que la nube: no hace falta recargar nada
  B.nube.salir();
  assert.strictEqual((await B.nube.entrar('ninja_1', 'secreta')).accion, 'nada');

  // cambiar clave (pide la actual) y generar código nuevo
  assert.strictEqual((await B.nube.cambiarClave('mala', 'nueva1')).error, 'credenciales');
  assert.strictEqual((await B.nube.cambiarClave('secreta', '12')).error, 'clave_corta');
  assert.ok((await B.nube.cambiarClave('secreta', 'nueva1')).ok);
  assert.strictEqual((await dispositivo(srv).nube.entrar('ninja_1', 'secreta')).error, 'credenciales');
  const codViejo = srv.users['ninja_1'].rescate;
  const nc = await B.nube.nuevoCodigo('nueva1'); assert.ok(nc.ok && nc.rescate && nc.rescate !== codViejo);
  assert.strictEqual((await B.nube.nuevoCodigo('mala')).error, 'credenciales');

  // RECUPERAR CLAVE con el código de rescate (en un dispositivo nuevo)
  const C = dispositivo(srv, 90000);
  assert.strictEqual((await C.nube.recuperar('ninja_1', 'XXXX', 'otra77')).error, 'codigo_invalido');
  assert.strictEqual((await C.nube.recuperar('ninja_1', nc.rescate, '12')).error, 'clave_corta');
  assert.strictEqual((await C.nube.recuperar('no_existe', nc.rescate, 'otra77')).error, 'codigo_invalido');
  const rr2 = await C.nube.recuperar('ninja_1', nc.rescate, 'otra77');
  assert.ok(rr2.ok && rr2.accion === 'cargado' && rr2.rescate && rr2.rescate !== nc.rescate, 'entra y recibe un código NUEVO');
  assert.strictEqual(C.nube.sesion().nick, 'ninja_1'); assert.deepStrictEqual(C.sesiones.pop(), ['ninja_1', 'entrar']);
  assert.strictEqual(C.store.getItem('mpl_v10_sv'), '{"level":2}'); assert.ok(lista(C).includes('ninja-1'));
  assert.strictEqual((await dispositivo(srv).nube.recuperar('ninja_1', nc.rescate, 'otra88')).error, 'codigo_invalido', 'el código usado ya no sirve');
  assert.ok((await dispositivo(srv).nube.entrar('ninja_1', 'otra77')).ok, 'la clave nueva funciona');
  // cuenta sin código (creada antes de v2.1)
  srv.users['viejo_1'] = { pass: 'abcd1', tokens: [], progress: {}, rescate: null };
  assert.strictEqual((await C.nube.recuperar('viejo_1', 'AAAA-BBBB-CCCC', 'zzzz1')).error, 'sin_codigo');
  assert.strictEqual((await dispositivo(srv).nube.entrar('viejo_1', 'abcd1')).tieneRescate, false);

  // cerrar sesión y borrar lo local: solo desaparece el jugador de la cuenta
  C.store.setItem('ninja_perfiles_v1', perfiles('ninja-1', perfil('ninja-1'), perfil('lola')));
  await C.nube.salir({ borrarLocal: true });
  assert.deepStrictEqual(C.sesiones.pop(), [null, 'salir']);
  assert.strictEqual(C.store.getItem('mpl_v10_sv'), null); assert.deepStrictEqual(lista(C), ['lola']);
  assert.strictEqual(C.nube.sesion(), null);

  // al abrir con sesión gana lo más reciente
  const D = dispositivo(srv, 200000);
  await D.nube.entrar('ninja_1', 'otra77');
  srv.users['ninja_1'].progress = { v: 1, ts: 9999999, datos: { mpl_v10_sv: '{"level":7}' } };
  assert.strictEqual((await D.nube.sincronizarAlAbrir()).accion, 'cargado');
  assert.strictEqual(D.store.getItem('mpl_v10_sv'), '{"level":7}');

  // sesión vencida (porque se restableció la clave desde la hoja): avisa y no borra nada local
  srv.users['ninja_1'].tokens = [];
  D.jugar('mpl_v10_sv', '{"level":8}'); await espera(40);
  assert.ok(D.eventos.includes('expirada')); assert.deepStrictEqual(D.sesiones.pop(), [null, 'expirada']);
  assert.strictEqual(D.store.getItem('mpl_v10_sv'), '{"level":8}');

  // CLASES Y RANKING
  const G = dispositivo(srv, 300000);
  assert.deepStrictEqual(await G.nube.verificarClase('k7m24p'), { ok: true, valid: true, nombre: '3A' });
  assert.strictEqual((await G.nube.verificarClase('OFF222')).valid, false, 'una clase desactivada no cuenta');
  assert.strictEqual((await G.nube.verificarClase('')).valid, false);
  assert.strictEqual((await G.nube.registrar('alumno_1', 'clave1', 'MALA99')).error, 'clase_invalida');
  assert.strictEqual((await G.nube.disponible('alumno_1')).available, true, 'con clase mala no se crea la cuenta');
  assert.ok((await G.nube.registrar('alumno_1', 'clave1', ' k7m24p ')).ok);
  assert.deepStrictEqual(G.nube.cuenta(), { clase: { codigo: 'K7M24P', nombre: '3A' }, ranking: true }, 'la clase queda guardada en el dispositivo');
  const H = dispositivo(srv, 310000);                                    // otro alumno, sin clase
  await H.nube.registrar('alumno_2', 'clave2');
  assert.deepStrictEqual(H.nube.cuenta(), { clase: null, ranking: true });
  assert.strictEqual((await H.nube.ranking('clase')).error, 'sin_clase');
  assert.strictEqual((await H.nube.unirseClase('MALA99')).error, 'clase_invalida');
  assert.ok((await H.nube.unirseClase('K7M24P')).ok && H.nube.cuenta().clase.nombre === '3A');
  const rk = await H.nube.ranking('clase');
  assert.ok(rk.ok && rk.top.length === 2 && rk.top.some(x => x.nick === 'alumno_2' && x.yo));
  assert.ok((await H.nube.unirseClase('')).ok && H.nube.cuenta().clase === null, 'salir de la clase');
  assert.ok((await H.nube.verEnRanking(false)).ok && H.nube.cuenta().ranking === false);
  assert.strictEqual((await H.nube.ranking('todos')).oculto, true);
  assert.ok((await H.nube.verEnRanking(true)).ok && H.nube.cuenta().ranking === true);
  // pedir el ranking sube antes el avance pendiente (para que el puntaje propio esté al día)
  H.jugar('mpl_v10_sv', '{"level":3}'); const saves1 = srv.llamadas.filter(x => x === 'save').length;
  await H.nube.ranking('todos'); assert.strictEqual(srv.llamadas.filter(x => x === 'save').length, saves1 + 1);
  // iniciar sesión en otro dispositivo trae la clase; cerrar sesión la olvida
  const I = dispositivo(srv, 320000); await I.nube.entrar('alumno_1', 'clave1');
  assert.strictEqual(I.nube.cuenta().clase.codigo, 'K7M24P');
  await I.nube.salir(); assert.deepStrictEqual(I.nube.cuenta(), { clase: null, ranking: true });
  // sesión vencida: ranking/clase avisan
  srv.users['alumno_1'].tokens = [];
  assert.strictEqual((await G.nube.ranking('todos')).error, 'sesion'); assert.deepStrictEqual(G.sesiones.pop(), [null, 'expirada']);

  // sin red
  const E = dispositivo({ fetch: async () => { throw new Error('offline'); } });
  assert.strictEqual((await E.nube.disponible('abc')).error, 'red');

  // progreso demasiado grande para la hoja
  const F = dispositivo(srv); await F.nube.registrar('grande_1', 'clave1');
  F.jugar('mpl_v10_lb', 'x'.repeat(46000)); await espera(40);
  assert.ok(F.eventos.includes('muy_grande'));

  console.log('nube: todo OK');
})().catch(e => { console.error(e); process.exit(1); });
