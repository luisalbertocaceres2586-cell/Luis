/* Nube — Ninja Multiplicación
 * Cuentas con apodo + clave y progreso guardado en una hoja de Google (Apps Script), para poder jugar desde
 * cualquier dispositivo sin depender solo de localStorage. NO se pide ningún dato personal: solo apodo y clave.
 *
 * Cómo funciona (sin tocar el resto del juego):
 *  - Se "fotografían" las claves de localStorage que son progreso (ver CLAVES / PREFIJOS) y se suben como un JSON.
 *  - Un gancho en Storage.setItem avisa cuando cambia alguna; se guarda en la nube 2,5 s después (con pausa).
 *  - Al abrir el juego con la sesión iniciada se compara con la nube y gana lo más reciente.
 *  - Al iniciar sesión en un dispositivo con progreso distinto al de la nube, se le pregunta al jugador cuál conservar.
 *
 * Funciona en navegador y en Node (para las pruebas: Nube.crear({ store, fetch })). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Nube = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbw0F6vIsqJE63E764x3iuAp7YUUuqC3ldkqaj8wbkYmV7prh_rpO6Khw_JVWkkZS2t7/exec';
  const K_SESION = 'ninja_nube_sesion_v1';   // { nick, token } — solo identifica la sesión, no es progreso
  const K_TS = 'ninja_nube_ts_v1';           // momento del último cambio local (para saber qué copia es más reciente)
  const MAX_JSON = 45000;                    // mismo límite que el servidor (Code.gs)
  const NICK_RE = /^[A-Za-z0-9_]{3,16}$/;
  const CLAVE_MIN = 4;

  // Claves de localStorage que cuentan como progreso (las demás son preferencias del dispositivo: volumen, botones, etc.)
  const CLAVES = [
    'mpl_v10_sv',                 // partida guardada (fase, nivel, puntos)
    'mpl_v10_lb',                 // ranking local
    'ninja_mult_table_stats_v1',  // aciertos por tabla
    'ninja_mult_stars_v1',        // estrellas por nivel
    'ninja_perfiles_v1',          // perfiles, maestría y avance del nivel 1
    'ninja_achievements_v1',      // logros
    'ninja_repaso_v1',            // operaciones que más se fallan
    'n2cfg'                       // elecciones del nivel 2 (preferencia: se sincroniza pero no cuenta como "tener progreso")
  ];
  const PREFIJOS = ['n2_'];       // n2_<perfil>_cp, n2_<perfil>_tut… (checkpoints del nivel 2)
  const PREFS = ['n2cfg'];

  const esProgreso = k => CLAVES.indexOf(k) >= 0 || PREFIJOS.some(p => k.indexOf(p) === 0);
  const esPref = k => PREFS.indexOf(k) >= 0;
  const estable = d => JSON.stringify(Object.keys(d || {}).sort().map(k => [k, d[k]]));

  const MENSAJES = {
    nick_invalido: 'El apodo debe tener de 3 a 16 letras, números o _ (sin espacios).',
    clave_corta: 'La clave debe tener al menos ' + CLAVE_MIN + ' caracteres.',
    nick_en_uso: 'Ese apodo ya está en uso. Prueba con otro.',
    credenciales: 'Apodo o clave incorrectos.',
    demasiados_intentos: 'Demasiados intentos. Espera 10 minutos y vuelve a probar.',
    sesion: 'Tu sesión terminó (quizá entraste desde otro dispositivo). Inicia sesión de nuevo.',
    muy_grande: 'El progreso es demasiado grande para guardarlo en la nube.',
    red: 'No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.',
    error_servidor: 'El servidor tuvo un problema. Inténtalo en un momento.',
    accion_invalida: 'Respuesta inesperada del servidor.'
  };
  const mensajeDe = e => MENSAJES[e] || 'Algo salió mal. Inténtalo otra vez.';

  /** @param {{store:any, fetch:any, url?:string, now?:()=>number, espera?:number, on?:any}} o */
  function crear(o) {
    const store = o.store, doFetch = o.fetch, url = o.url || API_URL;
    const ahora = o.now || Date.now, espera = o.espera == null ? 2500 : o.espera, on = o.on || {};
    let aplicando = false, timer = null, ultimoEnviado = null, guardando = false, otraVez = false, conflicto = null;

    /* ───────── almacenamiento ───────── */
    function leerDatos() {
      const d = {};
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && esProgreso(k)) { const v = store.getItem(k); if (v != null) d[k] = v; }
      }
      return d;
    }
    const tieneProgreso = d => Object.keys(d || {}).some(k => !esPref(k));
    function snapshot() { return { v: 1, ts: Number(store.getItem(K_TS)) || 0, datos: leerDatos() }; }
    function normalizar(p) {
      if (p && typeof p === 'object' && p.datos && typeof p.datos === 'object') return { v: 1, ts: Number(p.ts) || 0, datos: p.datos };
      return { v: 1, ts: 0, datos: {} };
    }
    function aplicar(snap) {
      aplicando = true;
      try {
        Object.keys(leerDatos()).forEach(k => store.removeItem(k));
        Object.keys(snap.datos || {}).forEach(k => {
          if (esProgreso(k) && typeof snap.datos[k] === 'string') store.setItem(k, snap.datos[k]);
        });
        store.setItem(K_TS, String(snap.ts || ahora()));
        ultimoEnviado = estable(leerDatos());
      } finally { aplicando = false; }
    }
    function borrarLocal() {
      aplicando = true;
      try { Object.keys(leerDatos()).forEach(k => store.removeItem(k)); store.removeItem(K_TS); ultimoEnviado = null; }
      finally { aplicando = false; }
    }

    /* ───────── sesión ───────── */
    function sesion() {
      try { const s = JSON.parse(store.getItem(K_SESION) || 'null'); return s && s.nick && s.token ? s : null; } catch (e) { return null; }
    }
    function ponerSesion(s) { try { s ? store.setItem(K_SESION, JSON.stringify(s)) : store.removeItem(K_SESION); } catch (e) {} }

    /* ───────── red ───────── */
    // Sin cabeceras personalizadas (el cuerpo va como text/plain): así Apps Script no exige CORS preflight.
    async function api(accion, datos, opc) {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t = ctl ? setTimeout(() => ctl.abort(), 20000) : null;
      try {
        const r = await doFetch(url, {
          method: 'POST', body: JSON.stringify(Object.assign({ action: accion }, datos || {})),
          signal: ctl ? ctl.signal : undefined, keepalive: !!(opc && opc.keepalive)
        });
        const j = await r.json();
        return j && typeof j === 'object' ? j : { ok: false, error: 'error_servidor' };
      } catch (e) { return { ok: false, error: 'red' }; }
      finally { if (t) clearTimeout(t); }
    }

    /* ───────── cuentas ───────── */
    async function disponible(nick) {
      nick = String(nick || '').trim();
      if (!NICK_RE.test(nick)) return { ok: false, error: 'nick_invalido' };
      return api('check', { nick });
    }
    async function registrar(nick, clave) {
      nick = String(nick || '').trim(); clave = String(clave || '');
      if (!NICK_RE.test(nick)) return { ok: false, error: 'nick_invalido' };
      if (clave.length < CLAVE_MIN) return { ok: false, error: 'clave_corta' };
      if (!Number(store.getItem(K_TS))) store.setItem(K_TS, String(ahora()));
      const snap = snapshot();
      const r = await api('register', { nick, pass: clave, progress: snap });
      if (r.ok) { ponerSesion({ nick, token: r.token }); ultimoEnviado = estable(snap.datos); }
      return r;
    }
    /** Devuelve { ok, accion: 'cargado' | 'subido' | 'nada' | 'conflicto', nube?, local? } */
    async function entrar(nick, clave) {
      nick = String(nick || '').trim(); clave = String(clave || '');
      if (!NICK_RE.test(nick)) return { ok: false, error: 'nick_invalido' };
      const r = await api('login', { nick, pass: clave });
      if (!r.ok) return r;
      ponerSesion({ nick, token: r.token });
      const nube = normalizar(r.progress), local = snapshot();
      const nubeTiene = tieneProgreso(nube.datos), localTiene = tieneProgreso(local.datos);
      if (!nubeTiene) {
        if (localTiene) { await guardarYa({ force: true }); return { ok: true, accion: 'subido' }; }
        return { ok: true, accion: 'nada' };
      }
      if (!localTiene || estable(nube.datos) === estable(local.datos)) { aplicar(nube); return { ok: true, accion: 'cargado' }; }
      conflicto = nube;
      return { ok: true, accion: 'conflicto', nube, local };
    }
    /** Resuelve el conflicto de entrar(): 'nube' (usar lo de la nube) o 'local' (usar lo de este dispositivo). */
    async function resolver(eleccion) {
      const nube = conflicto; conflicto = null;
      if (eleccion === 'nube' && nube) { aplicar(nube); return { ok: true, accion: 'cargado' }; }
      store.setItem(K_TS, String(ahora()));
      await guardarYa({ force: true });
      return { ok: true, accion: 'subido' };
    }
    async function salir(opc) {
      if (timer) { clearTimeout(timer); timer = null; }
      ponerSesion(null); conflicto = null;
      if (opc && opc.borrarLocal) borrarLocal();
    }

    /* ───────── guardado ───────── */
    function cambio(clave) {
      if (aplicando || !esProgreso(clave)) return;
      try { store.setItem(K_TS, String(ahora())); } catch (e) {}
      if (!sesion()) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { guardarYa(); }, espera);
    }
    async function guardarYa(opc) {
      opc = opc || {};
      if (timer) { clearTimeout(timer); timer = null; }
      const s = sesion();
      if (!s) return { ok: false, error: 'sin_sesion' };
      if (guardando) { otraVez = true; return { ok: true, enCurso: true }; }
      const snap = snapshot(), clave = estable(snap.datos);
      if (!opc.force && clave === ultimoEnviado) return { ok: true, igual: true };
      if (JSON.stringify(snap).length > MAX_JSON) { if (on.estado) on.estado('muy_grande'); return { ok: false, error: 'muy_grande' }; }
      guardando = true; if (on.estado) on.estado('guardando');
      let r;
      try { r = await api('save', { nick: s.nick, token: s.token, progress: snap }, { keepalive: !!opc.keepalive }); }
      finally { guardando = false; }
      if (r.ok) { ultimoEnviado = clave; if (on.estado) on.estado('guardado', ahora()); }
      else if (r.error === 'sesion') { ponerSesion(null); if (on.sesionExpirada) on.sesionExpirada(); }
      else if (on.estado) on.estado('error', r.error);
      if (otraVez) { otraVez = false; guardarYa(); }
      return r;
    }
    /** Al abrir el juego con sesión: gana la copia más reciente (por fecha del último cambio). */
    async function sincronizarAlAbrir() {
      const s = sesion();
      if (!s) return { ok: true, accion: 'sin_sesion' };
      const r = await api('load', { nick: s.nick, token: s.token });
      if (!r.ok) {
        if (r.error === 'sesion') { ponerSesion(null); if (on.sesionExpirada) on.sesionExpirada(); }
        return { ok: false, error: r.error };
      }
      const nube = normalizar(r.progress), local = snapshot();
      ultimoEnviado = estable(nube.datos);
      if (estable(nube.datos) === estable(local.datos)) return { ok: true, accion: 'nada' };
      if (tieneProgreso(nube.datos) && nube.ts > local.ts) { aplicar(nube); return { ok: true, accion: 'cargado' }; }
      await guardarYa({ force: true });
      return { ok: true, accion: 'subido' };
    }

    return {
      snapshot, aplicar, sesion, disponible, registrar, entrar, resolver, salir, cambio, guardarYa, sincronizarAlAbrir,
      get pendiente() { return !!timer; }
    };
  }

  /* ═════════════════════════ Navegador: gancho + interfaz ═════════════════════════ */
  function iniciarNavegador() {
    let ls; try { ls = window.localStorage; ls.length; } catch (e) { return null; }   // almacenamiento bloqueado
    if (!window.fetch) return null;

    const ui = { estado: 'inactivo', hora: 0, listeners: [] };
    const avisar = () => ui.listeners.forEach(f => { try { f(); } catch (e) {} });
    const n = crear({
      store: ls, fetch: window.fetch.bind(window),
      on: {
        estado: (e, h) => { ui.estado = e; if (h) ui.hora = typeof h === 'number' ? h : ui.hora; avisar(); },
        sesionExpirada: () => { ui.estado = 'expirada'; avisar(); }
      }
    });

    // Gancho: avisa cuando el juego escribe una clave de progreso (sin modificar el resto del código)
    const P = Storage.prototype, setO = P.setItem, remO = P.removeItem;
    P.setItem = function (k) { const r = setO.apply(this, arguments); try { if (this === ls) n.cambio(String(k)); } catch (e) {} return r; };
    P.removeItem = function (k) { const r = remO.apply(this, arguments); try { if (this === ls) n.cambio(String(k)); } catch (e) {} return r; };

    // Guardar al salir / ocultar la pestaña
    const volcar = () => { if (n.sesion() && n.pendiente) n.guardarYa({ keepalive: true }); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') volcar(); });
    window.addEventListener('pagehide', volcar);
    window.addEventListener('online', () => { if (n.sesion()) n.guardarYa(); });

    // Al abrir: traer lo más reciente de la nube (y recargar una vez si cambió)
    const recargar = () => {
      let t = 0; try { t = Number(sessionStorage.getItem('ninja_nube_rl')) || 0; } catch (e) {}
      if (Date.now() - t < 20000) return;
      try { sessionStorage.setItem('ninja_nube_rl', String(Date.now())); } catch (e) {}
      aviso('☁️ Progreso actualizado desde la nube');
      setTimeout(() => location.reload(), 1200);
    };
    if (n.sesion()) n.sincronizarAlAbrir().then(r => { if (r && r.accion === 'cargado') recargar(); avisar(); });

    if (!window.NUBE_SIN_UI) montarUI(n, ui, recargar);
    return n;
  }

  /* ───────── interfaz ───────── */
  let toastEl = null, toastT = null;
  function aviso(txt) {
    if (!document.body) return;
    if (!toastEl) { toastEl = el('div', { className: 'nb-toast', role: 'status' }); document.body.appendChild(toastEl); }
    toastEl.textContent = txt; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 3000);
  }
  function el(tag, props, hijos) {
    const e = document.createElement(tag);
    Object.keys(props || {}).forEach(k => {
      if (k === 'ariaLabel') e.setAttribute('aria-label', props[k]);
      else if (k === 'style') e.style.cssText = props[k];
      else e[k] = props[k];
    });
    (hijos || []).forEach(h => e.appendChild(typeof h === 'string' ? document.createTextNode(h) : h));
    return e;
  }

  const CSS = '' +
    '.nb-btn{position:fixed;left:10px;bottom:10px;z-index:99990;width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(20,24,60,.85);color:#fff;font-size:22px;cursor:pointer}' +
    '.nb-btn[data-e="guardado"],.nb-btn[data-e="guardando"]{border-color:#4ade80}.nb-btn[data-e="error"],.nb-btn[data-e="expirada"],.nb-btn[data-e="muy_grande"]{border-color:#fb923c}' +
    '.m26-d[data-nube] .m26-i{position:relative}.m26-d[data-nube][data-e="guardado"] .m26-i:after,.m26-d[data-nube][data-e="guardando"] .m26-i:after{content:"";position:absolute;right:-4px;bottom:-2px;width:9px;height:9px;border-radius:50%;background:#4ade80;border:1px solid #0b1030}' +
    '.m26-d[data-nube][data-e="error"] .m26-i:after,.m26-d[data-nube][data-e="expirada"] .m26-i:after,.m26-d[data-nube][data-e="muy_grande"] .m26-i:after{content:"";position:absolute;right:-4px;bottom:-2px;width:9px;height:9px;border-radius:50%;background:#fb923c;border:1px solid #0b1030}' +
    '.nb-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(3,5,20,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.nb-box{width:min(380px,100%);max-height:94vh;overflow:auto;background:#12163a;color:#eef;border:2px solid #5b6cff;border-radius:16px;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.6)}' +
    '.nb-box h2{margin:0 0 6px;font-size:20px}.nb-box p{margin:6px 0;font-size:14px;line-height:1.4;color:#cfd4ff}' +
    '.nb-tabs{display:flex;gap:6px;margin:10px 0}.nb-tabs button{flex:1;padding:9px;border-radius:10px;border:1px solid #444b9a;background:#1b2050;color:#cfd4ff;font-size:14px;cursor:pointer}.nb-tabs button.on{background:#5b6cff;color:#fff;border-color:#5b6cff}' +
    '.nb-box label{display:block;margin:10px 0 4px;font-size:13px;color:#aab}.nb-box input{width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid #444b9a;background:#0b0e2a;color:#fff;font-size:16px}' +
    '.nb-row{display:flex;gap:6px}.nb-row input{flex:1}.nb-row button{padding:0 12px}' +
    '.nb-go,.nb-sec{margin-top:12px;width:100%;padding:12px;border-radius:12px;border:0;font-size:16px;font-weight:700;cursor:pointer}.nb-go{background:#22c55e;color:#04130a}.nb-sec{background:#252a63;color:#eef}.nb-go:disabled,.nb-sec:disabled{opacity:.55;cursor:default}' +
    '.nb-msg{min-height:18px;margin-top:8px;font-size:13px}.nb-msg.bad{color:#ff8a8a}.nb-msg.ok{color:#86efac}.nb-msg.mid{color:#cfd4ff}' +
    '.nb-close{float:right;background:none;border:0;color:#aab;font-size:22px;cursor:pointer;line-height:1}' +
    '.nb-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%) translateY(20px);opacity:0;z-index:2147483001;background:#12163a;color:#fff;border:1px solid #5b6cff;border-radius:12px;padding:10px 16px;font:14px system-ui,sans-serif;pointer-events:none;transition:.3s}.nb-toast.on{opacity:1;transform:translateX(-50%)}';

  function montarUI(n, ui, recargar) {
    const st = el('style', {}); st.textContent = CSS; document.head.appendChild(st);

    /* botón: dentro del dock del menú principal si existe; si no, flotante */
    const btn = el('button', { type: 'button', title: 'Cuenta y nube', ariaLabel: 'Cuenta y nube' });
    btn.dataset.nube = '1';
    const poner = (dock) => {
      if (dock) { btn.className = 'm26-d'; btn.innerHTML = '<i class="m26-i">☁️</i><span class="m26-l">Cuenta</span>'; dock.insertBefore(btn, dock.lastElementChild); }
      else { btn.className = 'nb-btn'; btn.textContent = '☁️'; document.body.appendChild(btn); }
    };
    let intentos = 0;
    (function buscar() {
      const dock = document.querySelector('.m26-dock');
      if (dock || ++intentos > 12) return poner(dock);
      setTimeout(buscar, 400);
    })();
    const pintarBoton = () => { btn.dataset.e = n.sesion() ? ui.estado : 'inactivo'; };
    ui.listeners.push(pintarBoton); pintarBoton();
    btn.addEventListener('click', abrir);

    function abrir() {
      if (document.querySelector('.nb-ov')) return;
      const ov = el('div', { className: 'nb-ov' }), box = el('div', { className: 'nb-box', role: 'dialog' });
      ov.appendChild(box); document.body.appendChild(ov);
      const cerrar = () => { ui.listeners = ui.listeners.filter(f => f !== refrescar); ov.remove(); };
      ov.addEventListener('click', e => { if (e.target === ov) cerrar(); });
      let refrescar = () => {};
      const pintar = (fn) => { ui.listeners = ui.listeners.filter(f => f !== refrescar); box.textContent = ''; refrescar = fn(); if (refrescar) ui.listeners.push(refrescar); };
      const cab = (t) => [el('button', { className: 'nb-close', type: 'button', textContent: '×', ariaLabel: 'Cerrar', onclick: cerrar }), el('h2', { textContent: t })];

      /* ── con sesión ── */
      function vistaSesion() {
        const s = n.sesion();
        cab('☁️ Tu cuenta').forEach(x => box.appendChild(x));
        const quien = el('p', {}); quien.appendChild(document.createTextNode('Conectado como ')); quien.appendChild(el('b', { textContent: s.nick }));
        const est = el('p', { className: 'nb-msg mid' });
        const txt = () => {
          const m = { guardando: 'Guardando…', error: 'No se pudo guardar. Se reintentará.', muy_grande: mensajeDe('muy_grande'), expirada: mensajeDe('sesion') };
          if (ui.estado === 'guardado' && ui.hora) return '✅ Guardado a las ' + new Date(ui.hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return m[ui.estado] || 'Tu progreso se guarda solo cada vez que juegas.';
        };
        est.textContent = txt();
        const ya = el('button', { className: 'nb-go', type: 'button', textContent: 'Guardar ahora', onclick: async () => { ya.disabled = true; await n.guardarYa({ force: true }); ya.disabled = false; } });
        const out = el('button', { className: 'nb-sec', type: 'button', textContent: 'Cerrar sesión', onclick: async () => {
          await n.guardarYa(); await n.salir();
          if (confirm('¿Borrar también el progreso de ESTE dispositivo?\n(Tu progreso sigue guardado en la nube. Elige "Aceptar" si es un equipo compartido.)')) { await n.salir({ borrarLocal: true }); location.reload(); return; }
          pintarBoton(); pintar(vistaEntrada);
        } });
        [quien, est, ya, out].forEach(x => box.appendChild(x));
        return () => { if (!n.sesion()) { pintar(vistaEntrada); return; } est.textContent = txt(); };
      }

      /* ── conflicto ── */
      function vistaConflicto(r) {
        cab('¿Qué progreso conservar?').forEach(x => box.appendChild(x));
        box.appendChild(el('p', { textContent: 'Hay progreso distinto en este dispositivo y en tu cuenta. Elige cuál quieres usar (el otro se reemplaza).' }));
        const hecho = (res) => { pintarBoton(); if (res.accion === 'cargado') { cerrar(); recargar(); } else pintar(vistaSesion); };
        box.appendChild(el('button', { className: 'nb-go', type: 'button', textContent: '☁️ Usar el de mi cuenta', onclick: async () => hecho(await n.resolver('nube')) }));
        box.appendChild(el('button', { className: 'nb-sec', type: 'button', textContent: '📱 Usar el de este dispositivo', onclick: async () => hecho(await n.resolver('local')) }));
        return null;
      }

      /* ── sin sesión: entrar / crear cuenta ── */
      function vistaEntrada(modo) {
        modo = modo === 'crear' ? 'crear' : 'entrar';
        cab('☁️ Guarda tu progreso').forEach(x => box.appendChild(x));
        box.appendChild(el('p', { textContent: 'Crea un apodo y una clave para seguir jugando desde cualquier dispositivo. No uses tu nombre real ni datos personales.' }));
        const tabs = el('div', { className: 'nb-tabs' }, [
          el('button', { type: 'button', textContent: 'Entrar', className: modo === 'entrar' ? 'on' : '', onclick: () => pintar(() => vistaEntrada('entrar')) }),
          el('button', { type: 'button', textContent: 'Crear cuenta', className: modo === 'crear' ? 'on' : '', onclick: () => pintar(() => vistaEntrada('crear')) })
        ]);
        const nick = el('input', { type: 'text', maxLength: 16, autocapitalize: 'none', autocomplete: 'username', spellcheck: false, placeholder: 'Ej: ninja_veloz' });
        const clave = el('input', { type: 'password', autocomplete: modo === 'crear' ? 'new-password' : 'current-password', placeholder: 'Mínimo ' + CLAVE_MIN + ' caracteres' });
        const ver = el('button', { type: 'button', className: 'nb-sec', textContent: '👁', style: 'margin:0;width:auto', ariaLabel: 'Mostrar u ocultar la clave', onclick: () => { clave.type = clave.type === 'password' ? 'text' : 'password'; } });
        const msgNick = el('div', { className: 'nb-msg mid' }), msg = el('div', { className: 'nb-msg' });
        const go = el('button', { className: 'nb-go', type: 'button', textContent: modo === 'crear' ? 'Crear cuenta' : 'Entrar' });
        [tabs, el('label', { textContent: 'Apodo' }), nick, msgNick, el('label', { textContent: 'Clave' }), el('div', { className: 'nb-row' }, [clave, ver]), go, msg].forEach(x => box.appendChild(x));

        let t = null, seq = 0;
        nick.addEventListener('input', () => {
          clearTimeout(t); msgNick.className = 'nb-msg mid'; msgNick.textContent = '';
          if (modo !== 'crear') return;
          const v = nick.value.trim(); if (!v) return;
          if (!NICK_RE.test(v)) { msgNick.className = 'nb-msg bad'; msgNick.textContent = mensajeDe('nick_invalido'); return; }
          msgNick.textContent = 'Revisando…';
          const mi = ++seq;
          t = setTimeout(async () => {
            const r = await n.disponible(v); if (mi !== seq) return;
            if (!r.ok) { msgNick.className = 'nb-msg bad'; msgNick.textContent = mensajeDe(r.error); }
            else if (r.available) { msgNick.className = 'nb-msg ok'; msgNick.textContent = '✅ ¡Ese apodo está libre!'; }
            else { msgNick.className = 'nb-msg bad'; msgNick.textContent = '❌ ' + mensajeDe('nick_en_uso'); }
          }, 500);
        });

        const enviar = async () => {
          msg.className = 'nb-msg mid'; msg.textContent = modo === 'crear' ? 'Creando tu cuenta…' : 'Entrando…'; go.disabled = true;
          const r = modo === 'crear' ? await n.registrar(nick.value, clave.value) : await n.entrar(nick.value, clave.value);
          go.disabled = false;
          if (!r.ok) { msg.className = 'nb-msg bad'; msg.textContent = mensajeDe(r.error); return; }
          ui.estado = 'guardado'; ui.hora = Date.now(); pintarBoton();
          if (r.accion === 'conflicto') return pintar(() => vistaConflicto(r));
          if (r.accion === 'cargado') { cerrar(); recargar(); return; }
          pintar(vistaSesion); aviso('☁️ ¡Listo! Tu progreso se guardará solo');
        };
        go.addEventListener('click', enviar);
        [nick, clave].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); }));
        setTimeout(() => nick.focus(), 50);
        return null;
      }

      pintar(n.sesion() ? vistaSesion : () => vistaEntrada('entrar'));
    }
    window.Nube.abrir = abrir;
  }

  const api = { crear, esProgreso, CLAVES, PREFIJOS, API_URL, NICK_RE, abrir: function () {} };
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const arrancar = () => { try { api.instancia = iniciarNavegador(); } catch (e) { if (window.console) console.warn('Nube: no se pudo iniciar', e); } };
    // se ejecuta cuando exista window.Nube (la fábrica ya devolvió api): se difiere al siguiente tick
    setTimeout(() => { window.Nube = window.Nube || api; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar(); }, 0);
  }
  return api;
});
