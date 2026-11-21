/* Perfiles y guardado — Ninja Multiplicación
 * Varios jugadores en el mismo computador, cada uno con su nombre, avatar, dispositivo y progreso.
 * Todo se guarda en localStorage (clave ninja_perfiles_v1). También se puede exportar/importar con un código
 * para pasar la partida a otro computador. Funciona en navegador y en Node (para las pruebas). */
(/** @param {any} root @param {(root?: any) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Perfiles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  const KEY = 'ninja_perfiles_v1';
  /** @type {Storage | {getItem(k: string): string | null, setItem(k: string, v: string): void, removeItem(k: string): void} | null} */
  let store = (typeof localStorage !== 'undefined') ? localStorage : null;

  function usarAlmacen(s) { store = s; }
  function leer() {
    if (!store) return { v: 1, activo: null, perfiles: {} };
    try { const d = JSON.parse(store.getItem(KEY) || 'null'); if (d && d.v === 1 && d.perfiles) return d; } catch (e) {}
    return { v: 1, activo: null, perfiles: {} };
  }
  function escribir(d) { if (!store) return false; try { store.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function limpiarNombre(n) { return String(n == null ? '' : n).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14); }
  function idDe(nombre) { return limpiarNombre(nombre).toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, '-'); }

  function nuevoPerfil(nombre, avatar, dispositivo) {
    return {
      id: idDe(nombre), nombre: limpiarNombre(nombre),
      avatar: avatar === 'kage' ? 'kage' : 'sakura',
      dispositivo: dispositivo === 'movil' ? 'movil' : 'pc',
      creado: Date.now(), ultimo: Date.now(),
      progreso: { fase: 'easy', nivel: 0, puntos: 0 },
      nivel1: { intentos: 0, semilla: null, plan: null, estado: null, completados: 0 },
      maestria: {},
      estadisticas: { aciertos: 0, errores: 0, minutos: 0 }
    };
  }

  function crear(o) {
    o = o || {};
    const nombre = limpiarNombre(o.nombre);
    if (nombre.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 letras.' };
    const d = leer(), id = idDe(nombre);
    if (!id) return { ok: false, error: 'Nombre no válido.' };
    if (d.perfiles[id]) return { ok: false, error: 'Ya existe un jugador con ese nombre.' };
    const p = nuevoPerfil(nombre, o.avatar, o.dispositivo);
    d.perfiles[id] = p; d.activo = id;
    return escribir(d) ? { ok: true, perfil: p } : { ok: false, error: 'No se pudo guardar (almacenamiento bloqueado).' };
  }
  function listar() {
    return Object.values(leer().perfiles).sort((a, b) => b.ultimo - a.ultimo);
  }
  function obtener(id) { return leer().perfiles[id] || null; }
  function activo() { const d = leer(); return d.activo ? d.perfiles[d.activo] || null : null; }
  /* Suma aciertos/errores por operación ("7x8": {a, e}) a la maestría del perfil. Lo usan los niveles 2 y 3
     (el nivel 1 la maneja con su propio modelo). Misma regla de cajas: acierto +1, error −2, entre 0 y 4. */
  function registrarHechos(id, hechos) {
    if (!hechos) return null;
    return actualizar(id, p => {
      const m = p.maestria = p.maestria || {};
      Object.keys(hechos).forEach(k => {
        if (!/^\d+x\d+$/.test(k)) return;
        const h = hechos[k] || {}, r = m[k] || (m[k] = { a: 0, e: 0, caja: 0, t: 0 });
        r.a += h.a | 0; r.e += h.e | 0; r.caja = Math.max(0, Math.min(4, (r.caja | 0) + (h.a | 0) - 2 * (h.e | 0)));
      });
    });
  }
  /* Cierra la sesión: nadie queda como jugador activo (los datos de los perfiles NO se borran). */
  function cerrarSesion() { const d = leer(); d.activo = null; return escribir(d); }
  function elegir(id) {
    const d = leer(); if (!d.perfiles[id]) return null;
    d.activo = id; d.perfiles[id].ultimo = Date.now(); escribir(d); return d.perfiles[id];
  }
  /** Modifica el perfil con una función y guarda. Devuelve el perfil nuevo. */
  function actualizar(id, fn) {
    const d = leer(); const p = d.perfiles[id]; if (!p) return null;
    fn(p); p.ultimo = Date.now(); escribir(d); return p;
  }
  function actualizarActivo(fn) { const a = activo(); return a ? actualizar(a.id, fn) : null; }
  function borrar(id) {
    const d = leer(); if (!d.perfiles[id]) return false;
    delete d.perfiles[id]; if (d.activo === id) d.activo = null; return escribir(d);
  }

  // ---- exportar / importar (para llevar la partida a otro computador) ----
  function b64(s) { return typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'); }
  function unb64(s) { return typeof atob === 'function' ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8'); }
  function exportar(id) {
    const p = obtener(id); if (!p) return null;
    const json = JSON.stringify(p);
    let h = 0; for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) >>> 0;
    return 'NINJA1.' + h.toString(36) + '.' + b64(json);
  }
  function importar(codigo) {
    try {
      const [pref, hash, data] = String(codigo).trim().split('.');
      if (pref !== 'NINJA1' || !data) return { ok: false, error: 'Código no válido.' };
      const json = unb64(data);
      let h = 0; for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) >>> 0;
      if (h.toString(36) !== hash) return { ok: false, error: 'El código está incompleto o dañado.' };
      const p = JSON.parse(json);
      if (!p || !p.nombre || !p.progreso) return { ok: false, error: 'Código no válido.' };
      const base = nuevoPerfil(p.nombre, p.avatar, p.dispositivo);
      const lim = Object.assign(base, p, { nombre: limpiarNombre(p.nombre) });
      const d = leer(); let id = idDe(lim.nombre), n = 2;
      while (d.perfiles[id]) id = idDe(lim.nombre) + '-' + n++;
      lim.id = id; d.perfiles[id] = lim; d.activo = id;
      return escribir(d) ? { ok: true, perfil: lim } : { ok: false, error: 'No se pudo guardar.' };
    } catch (e) { return { ok: false, error: 'Código no válido.' }; }
  }

  return { crear, listar, obtener, activo, elegir, cerrarSesion, registrarHechos, actualizar, actualizarActivo, borrar, exportar, importar, usarAlmacen, limpiarNombre, KEY };
});
