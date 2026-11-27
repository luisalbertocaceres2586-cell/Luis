/* sw.js — Ninja Multiplicación · caché local para abrir rápido y poder jugar sin internet.

   POR QUÉ: al abrir el juego se descargan ~840 archivos (≈ 53 MB). Con datos móviles eso es lento y caro, y sin internet no abre.
   Con este archivo los dibujos se guardan en el teléfono: la 2.ª vez abre casi al instante, gasta ~0 datos y funciona sin conexión.

   REGLAS (pensadas para que NUNCA quede una versión vieja atascada):
   · Código y páginas (html, js, css, json…): SIEMPRE se pide al servidor primero ("red primero"). Solo si no hay internet
     (o tarda más de 6 s) se usa la copia guardada. Así cada actualización del juego llega sola.
   · Imágenes y recursos de /assets/: se sirven desde el teléfono al instante ("caché primero") y, si la copia tiene más
     de 24 h, se renueva en segundo plano. Un dibujo cambiado llega como mucho al día siguiente (o antes si cambia su nombre).
   · version.json NUNCA se guarda: el aviso de "hay una versión nueva" necesita hablar con el servidor real.
   · Si algo sale mal: abrir el juego con  ?sw=0  lo desactiva y borra lo guardado en ese teléfono (?sw=1 lo vuelve a activar). */

const SHELL = 'ninja-shell-v1';
const ASSETS = 'ninja-assets-v1';
const TTL_ASSET = 24 * 60 * 60 * 1000;     // 24 h
const MAX_ARCHIVO = 8 * 1024 * 1024;       // no se guardan archivos de más de 8 MB
const MAX_ENTRADAS_CODIGO = 400;           // tope de entradas del caché de código (los scripts con ?v= viejos se van borrando)
const ESPERA_RED = 6000;                   // ms antes de usar la copia guardada si la red no responde

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {             // borra cachés de versiones anteriores de este sistema
      if (k.startsWith('ninja-') && k !== SHELL && k !== ASSETS) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'limpiar') e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('ninja-')) await caches.delete(k); })());
  else if (e.data && e.data.tipo === 'precargar') e.waitUntil(precargar());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                 // fuentes de Google, etc.: que las maneje el navegador
  if (req.headers.has('range')) return;                            // audio/vídeo por trozos
  if (/\/version\.json$/.test(url.pathname)) return;               // siempre del servidor real
  if (/\/sw\.js$/.test(url.pathname)) return;
  if (/\/assets\//.test(url.pathname)) e.respondWith(activos(e));
  else e.respondWith(codigo(e));
});

/* ---- código y páginas: red primero, copia guardada si no hay internet ---- */
function conTiempo(p, ms) {
  return new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error('tiempo')), ms);
    p.then(r => { clearTimeout(t); ok(r); }, er => { clearTimeout(t); mal(er); });
  });
}
/* Las páginas (navegación) se guardan UNA vez por ruta, sin importar los parámetros (?r=…, ?debug=1, ?perfil=…):
   el contenido es el mismo y el juego lee los parámetros con JavaScript. Evita llenar el teléfono de copias del mismo index.html. */
function claveDe(req) {
  if (req.mode === 'navigate') { const u = new URL(req.url); return new Request(u.origin + u.pathname); }
  return req;
}
async function recortar(cache) {                         // tope: si hay demasiadas entradas se borran las más antiguas
  try {
    const ks = await cache.keys();
    if (ks.length > MAX_ENTRADAS_CODIGO) for (const k of ks.slice(0, ks.length - MAX_ENTRADAS_CODIGO + 60)) await cache.delete(k);
  } catch (err) {}
}
async function codigo(e) {
  const req = e.request;
  const cache = await caches.open(SHELL);
  const clave = claveDe(req);
  try {
    // cache:'no-cache' → siempre pregunta al servidor (si no cambió, responde 304 y no gasta datos)
    const net = await conTiempo(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }), ESPERA_RED);
    if (net && net.ok && net.type === 'basic') e.waitUntil(cache.put(clave, net.clone()).then(() => recortar(cache)).catch(() => {}));
    return net;
  } catch (err) {
    const hit = (await cache.match(clave)) || (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const idx = (await cache.match('index.html', { ignoreSearch: true })) || (await cache.match('./', { ignoreSearch: true }));
      if (idx) return idx;
    }
    return Response.error();
  }
}

/* ---- imágenes y recursos: caché primero, se renueva en segundo plano pasadas 24 h ---- */
async function guardar(cache, req, net) {
  try {
    if (!net || net.status !== 200 || net.type !== 'basic') return;
    const len = +net.headers.get('content-length') || 0;
    if (len > MAX_ARCHIVO) return;
    const h = new Headers(net.headers);
    h.set('x-nj-t', String(Date.now()));
    const body = await net.clone().blob();
    if (body.size > MAX_ARCHIVO) return;
    await cache.put(req, new Response(body, { status: 200, statusText: 'OK', headers: h }));
  } catch (err) { /* sin espacio u otro problema: se ignora */ }
}
async function activos(e) {
  const req = e.request;
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req);
  if (hit) {
    const t = +hit.headers.get('x-nj-t') || 0;
    if (Date.now() - t > TTL_ASSET) {
      e.waitUntil((async () => { try { const net = await fetch(req.url, { cache: 'no-cache' }); await guardar(cache, req, net); } catch (err) {} })());
    }
    return hit;
  }
  try {
    const net = await fetch(req);
    e.waitUntil(guardar(cache, req, net));
    return net;
  } catch (err) {
    return Response.error();
  }
}

/* ---- precarga opcional: baja TODO lo de precache.json para jugar sin internet ----
   Solo se hace si el jugador lo pide (?offline=1, ver engine/core/sw-registro.js): son decenas de MB.
   · lo que ya está guardado NO se vuelve a descargar (solo baja lo que falta);
   · se detiene si no hay espacio suficiente en el teléfono;
   · avisa el avance a la página con postMessage({tipo:'precarga', hechos, total, estado}). */
let precargando = false;
async function avisar(datos) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(Object.assign({ tipo: 'precarga' }, datos));
}
async function precargar() {
  if (precargando) return;
  precargando = true;
  try {
    const lista = await (await fetch('precache.json', { cache: 'no-cache' })).json();
    const base = self.registration.scope;
    const abs = r => new URL(r, base).href;
    const mb = lista.mb || 0;
    try {
      const est = await navigator.storage.estimate();
      if (est && est.quota && (est.quota - est.usage) < mb * 1048576 * 1.3) { await avisar({ estado: 'sin-espacio', mb }); return; }
    } catch (err) { /* sin estimación: se intenta igual */ }
    const cCodigo = await caches.open(SHELL), cActivos = await caches.open(ASSETS);
    const trabajo = lista.codigo.map(r => ({ r, codigo: true })).concat(lista.activos.map(r => ({ r, codigo: false })));
    const total = trabajo.length;
    let hechos = 0, fallos = 0, i = 0;
    async function uno(t) {
      const url = abs(t.r), req = new Request(url);
      try {
        if (t.codigo) {
          const net = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
          if (net && net.ok && net.type === 'basic') await cCodigo.put(req, net);
        } else if (!(await cActivos.match(req))) {
          await guardar(cActivos, req, await fetch(url));
        }
      } catch (err) { fallos++; }
      hechos++;
      if (hechos % 25 === 0 || hechos === total) await avisar({ estado: 'bajando', hechos, total });
    }
    await avisar({ estado: 'bajando', hechos: 0, total });
    await Promise.all(Array.from({ length: 6 }, async () => { while (i < total) await uno(trabajo[i++]); }));
    await avisar({ estado: fallos > total * 0.02 ? 'incompleto' : 'listo', hechos, total, fallos, v: lista.v });
  } catch (err) {
    await avisar({ estado: 'error' });
  } finally { precargando = false; }
}
