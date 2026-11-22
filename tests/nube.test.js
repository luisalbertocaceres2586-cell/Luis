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
// Servidor simulado con las mismas reglas del Code.gs
function fakeServer() {
  const users = {}; let n = 0; const llamadas = [];
  const fetch = async (url, init) => {
    const q = JSON.parse(init.body); llamadas.push(q.action);
    const nick = String(q.nick || '').trim(), low = nick.toLowerCase(), u = users[low];
    let r;
    switch (q.action) {
      case 'check': r = /^[A-Za-z0-9_]{3,16}$/.test(nick) ? { ok: true, available: !u } : { ok: false, error: 'nick_invalido' }; break;
      case 'register':
        if (u) r = { ok: false, error: 'nick_en_uso' };
        else { users[low] = { pass: q.pass, token: 't' + (++n), progress: q.progress || {} }; r = { ok: true, token: users[low].token, progress: q.progress }; }
        break;
      case 'login':
        if (!u || u.pass !== q.pass) r = { ok: false, error: 'credenciales' };
        else { u.token = 't' + (++n); r = { ok: true, token: u.token, progress: u.progress }; }
        break;
      case 'load': r = u && u.token === q.token ? { ok: true, progress: u.progress } : { ok: false, error: 'sesion' }; break;
      case 'save':
        if (!u || u.token !== q.token) r = { ok: false, error: 'sesion' };
        else { u.progress = q.progress; r = { ok: true }; }
        break;
      default: r = { ok: false, error: 'accion_invalida' };
    }
    return { json: async () => JSON.parse(JSON.stringify(r)) };
  };
  return { fetch, users, llamadas };
}
const dispositivo = (srv, t, extra) => {
  const store = fakeStore(); let reloj = t || 1000;
  const eventos = [];
  const nube = Nube.crear(Object.assign({ store, fetch: srv.fetch, now: () => ++reloj, espera: 5, on: { estado: e => eventos.push(e), sesionExpirada: () => eventos.push('expirada') } }, extra));
  return { store, nube, eventos, jugar: (k, v) => { store.setItem(k, v); nube.cambio(k); } };
};
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // claves de progreso vs. preferencias del dispositivo
  assert.ok(Nube.esProgreso('mpl_v10_sv') && Nube.esProgreso('n2_ana_cp') && Nube.esProgreso('ninja_perfiles_v1'));
  assert.ok(!Nube.esProgreso('ninja_fx_volume') && !Nube.esProgreso('ninja_btn_pos_v3') && !Nube.esProgreso('ninja_nube_sesion_v1'));

  // nick: validación y disponibilidad
  const srv = fakeServer(), A = dispositivo(srv);
  assert.strictEqual((await A.nube.disponible('a')).error, 'nick_invalido');
  assert.strictEqual((await A.nube.disponible('ninja_1')).available, true);
  assert.strictEqual((await A.nube.registrar('ninja_1', '12')).error, 'clave_corta');

  // registrar sube el progreso que ya había en el dispositivo
  A.store.setItem('mpl_v10_sv', '{"phase":"easy","level":3}');
  A.store.setItem('ninja_fx_volume', '0.3');
  assert.strictEqual((await A.nube.registrar('ninja_1', 'secreta')).ok, true);
  assert.strictEqual((await A.nube.disponible('NINJA_1')).available, false, 'sin distinguir mayúsculas');
  assert.strictEqual((await A.nube.registrar('Ninja_1', 'otra')).error, 'nick_en_uso');
  const subido = srv.users['ninja_1'].progress;
  assert.strictEqual(subido.datos['mpl_v10_sv'], '{"phase":"easy","level":3}');
  assert.ok(!('ninja_fx_volume' in subido.datos), 'las preferencias del dispositivo no se suben');
  assert.ok(!('ninja_nube_sesion_v1' in subido.datos), 'la sesión no se sube');

  // guardado automático con pausa (varios cambios seguidos = una sola subida)
  const antes = srv.llamadas.filter(x => x === 'save').length;
  A.jugar('mpl_v10_sv', '{"level":4}'); A.jugar('ninja_mult_stars_v1', '{"1":3}'); A.jugar('n2_anon_cp', '{"ronda":2}');
  A.jugar('ninja_fx_volume', '0.1');   // no es progreso: no dispara nada extra
  await espera(40);
  assert.strictEqual(srv.llamadas.filter(x => x === 'save').length - antes, 1);
  assert.strictEqual(srv.users['ninja_1'].progress.datos['n2_anon_cp'], '{"ronda":2}');
  assert.ok(A.eventos.includes('guardado'));

  // sin cambios no vuelve a subir
  const r0 = await A.nube.guardarYa(); assert.ok(r0.igual);

  // dispositivo B vacío: al entrar carga el progreso de la nube
  const B = dispositivo(srv, 5000);
  assert.strictEqual((await B.nube.entrar('ninja_1', 'mala')).error, 'credenciales');
  const rb = await B.nube.entrar('NINJA_1', 'secreta');
  assert.strictEqual(rb.accion, 'cargado');
  assert.strictEqual(B.store.getItem('mpl_v10_sv'), '{"level":4}');
  assert.strictEqual(B.store.getItem('n2_anon_cp'), '{"ronda":2}');
  assert.strictEqual(B.store.getItem('ninja_fx_volume'), null);

  // B entró con otra sesión → la de A queda vencida y lo avisa (sin borrar su progreso local)
  A.jugar('mpl_v10_sv', '{"level":5}'); await espera(40);
  assert.ok(A.eventos.includes('expirada'));
  assert.strictEqual(A.nube.sesion(), null);
  assert.strictEqual(A.store.getItem('mpl_v10_sv'), '{"level":5}');

  // B sigue jugando; A vuelve a entrar con progreso distinto → conflicto
  B.jugar('mpl_v10_sv', '{"level":9}'); await espera(40);
  const ra = await A.nube.entrar('ninja_1', 'secreta');
  assert.strictEqual(ra.accion, 'conflicto');
  assert.strictEqual((await A.nube.resolver('nube')).accion, 'cargado');
  assert.strictEqual(A.store.getItem('mpl_v10_sv'), '{"level":9}');

  // conflicto resuelto a favor del dispositivo: sube lo local
  A.jugar('mpl_v10_sv', '{"level":10}'); await espera(40);
  B.nube.salir(); B.store.setItem('mpl_v10_sv', '{"level":2}');
  const rb2 = await B.nube.entrar('ninja_1', 'secreta');
  assert.strictEqual(rb2.accion, 'conflicto');
  assert.strictEqual((await B.nube.resolver('local')).accion, 'subido');
  assert.strictEqual(JSON.stringify(srv.users['ninja_1'].progress.datos['mpl_v10_sv']), '"{\\"level\\":2}"');

  // al abrir con sesión: gana lo más reciente
  const C = dispositivo(srv, 90000);
  await C.nube.entrar('ninja_1', 'secreta');                   // carga level 2
  srv.users['ninja_1'].progress = { v: 1, ts: 999999, datos: { mpl_v10_sv: '{"level":7}' } };
  assert.strictEqual((await C.nube.sincronizarAlAbrir()).accion, 'cargado');
  assert.strictEqual(C.store.getItem('mpl_v10_sv'), '{"level":7}');

  // cerrar sesión y borrar lo local (equipo compartido)
  await C.nube.salir({ borrarLocal: true });
  assert.strictEqual(C.store.getItem('mpl_v10_sv'), null);
  assert.strictEqual(C.nube.sesion(), null);

  // sin red
  const D = dispositivo({ fetch: async () => { throw new Error('offline'); } });
  assert.strictEqual((await D.nube.disponible('abc')).error, 'red');

  // progreso demasiado grande para la hoja
  const E = dispositivo(srv); await E.nube.registrar('grande_1', 'clave1');
  E.jugar('mpl_v10_lb', 'x'.repeat(46000)); await espera(40);
  assert.ok(E.eventos.includes('muy_grande'));

  console.log('nube: todo OK');
})().catch(e => { console.error(e); process.exit(1); });
