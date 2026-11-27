/* engine/core/webp.js — carga WebP en lugar de PNG sin cambiar el código del juego.
   tools/convertir_webp.py crea imagen.webp junto a imagen.png (≈ 70 % más liviano) y lista cuáles en engine/core/webp-mapa.js.
   Este archivo (cargado el primero) hace que, cuando el código pide 'assets/…/imagen.png' y existe su .webp, el navegador baje el .webp:
     · new Image().src = '….png' · img.setAttribute('src', …) · el.style.backgroundImage / background / cssText · setProperty · innerHTML / outerHTML / insertAdjacentHTML
   (las rutas escritas directamente en los .html y en engine/ui/*.css las reescribe el conversor).
   RESPALDO: si una imagen .webp no carga (navegador viejo, archivo ausente), se pide automáticamente su .png original, que sigue en el repositorio.
   Se puede apagar con ?webp=0. Nada de esto toca imágenes sin .webp. El cerebro (crear) no usa el DOM: se prueba con node (tests/webp.test.js). */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    const g = /** @type {any} */ (root);
    g.NJ_WEBP = api.instalar(root);
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** mapa: { 'assets/carpeta/': ['nombre1','nombre2'] }  → funciones puras una() y cad() */
  function crear(mapa) {
    const S = Object.create(null);
    for (const d in mapa) { const a = mapa[d]; for (let i = 0; i < a.length; i++) S[d + a[i]] = 1; }
    const CAD = /assets\/[^"'()\s?#<>]*?\.png/gi;
    /** una ruta suelta: 'assets/x/y.png' · './assets/x/y.png' · 'https://sitio/assets/x/y.png?v=2' */
    function una(u) {
      if (typeof u !== 'string' || u.length < 12 || u.charCodeAt(0) === 100 && u.slice(0, 5) === 'data:') return u;
      const i = u.indexOf('assets/'); if (i < 0) return u;
      const j = u.search(/[?#]/), fin = j < 0 ? u.length : j;
      if (!/\.png$/i.test(u.slice(0, fin))) return u;
      return S[u.slice(i, fin - 4)] ? u.slice(0, fin - 4) + '.webp' + u.slice(fin) : u;
    }
    /** texto con varias rutas (CSS, HTML) */
    function cad(s) {
      if (typeof s !== 'string' || s.indexOf('.png') < 0 || s.indexOf('assets/') < 0) return s;
      return s.replace(CAD, m => (S[m.slice(0, -4)] ? m.slice(0, -4) + '.webp' : m));
    }
    return { una, cad, tiene: ruta => !!S[ruta.replace(/\.png$/i, '')], total: () => Object.keys(S).length };
  }

  /** conecta con el navegador */
  function instalar(w) {
    const doc = w.document; if (!doc) return null;
    const M = w.NJ_WEBP_MAPA;
    const apagado = /[?&]webp=0/.test((w.location && w.location.search) || '');
    const IMG = w.HTMLImageElement;
    const ds = IMG && Object.getOwnPropertyDescriptor(IMG.prototype, 'src');
    const setOriginal = ds && ds.set;

    // RESPALDO (siempre activo): si un .webp falla, se pide el .png de al lado
    doc.addEventListener('error', function (e) {
      const t = /** @type {any} */ (e.target);
      if (!t || t.tagName !== 'IMG' || t.__njRe || !setOriginal) return;
      const s = t.getAttribute('src') || '';
      if (!/\.webp([?#]|$)/i.test(s)) return;
      t.__njRe = 1; setOriginal.call(t, s.replace(/\.webp(?=([?#]|$))/i, '.png'));
    }, true);

    // iPhone/Safari anteriores a 14 no leen WebP: ahí solo queda el respaldo (las rutas ya reescritas en el HTML caen al .png)
    const ua = (w.navigator && w.navigator.userAgent) || '';
    const ios = /OS (\d+)_/.exec(ua), saf = /Version\/(\d+)[\d.]* (?:Mobile\/\S+ )?Safari/.exec(ua);
    const viejo = (/iP(hone|ad|od)/.test(ua) && ios && +ios[1] < 14) || (!/Chrom(e|ium)|Android/.test(ua) && saf && +saf[1] < 14);
    if (!M || apagado || viejo) return { activo: false };

    const api = crear(M);
    const intentar = f => { try { f(); } catch (err) { /* un parche que no aplica no debe romper el juego */ } };
    function envolver(proto, prop, fn) {
      let p = proto, d;
      while (p && !(d = Object.getOwnPropertyDescriptor(p, prop))) p = Object.getPrototypeOf(p);
      if (!d || !d.set) return;
      const dd = d;
      Object.defineProperty(proto, prop, { configurable: true, enumerable: dd.enumerable, get: dd.get, set(v) { dd.set.call(this, fn(v)); } });
    }
    // 1) <img>.src  (incluye new Image().src)
    if (ds && ds.set) intentar(() => Object.defineProperty(IMG.prototype, 'src', {
      configurable: true, enumerable: ds.enumerable, get: ds.get,
      set(v) { const x = api.una(v); if (x !== v) this.__njPng = v; /** @type {any} */ (ds.set).call(this, x); },
    }));
    // 2) setAttribute('src' | 'style', …)
    intentar(() => {
      const sa = w.Element.prototype.setAttribute;
      w.Element.prototype.setAttribute = function (n, v) {
        if (typeof n === 'string' && typeof v === 'string') {
          const k = n.toLowerCase();
          if (k === 'src' && IMG && this instanceof IMG) v = api.una(v); else if (k === 'style') v = api.cad(v);
        }
        return sa.call(this, n, v);
      };
    });
    // 3) estilos en JS
    if (w.CSSStyleDeclaration) {
      for (const p of ['backgroundImage', 'background', 'cssText', 'maskImage', 'webkitMaskImage', 'borderImageSource', 'listStyleImage'])
        intentar(() => envolver(w.CSSStyleDeclaration.prototype, p, api.cad));
      intentar(() => {
        const sp = w.CSSStyleDeclaration.prototype.setProperty;
        w.CSSStyleDeclaration.prototype.setProperty = function (n, v, pr) { return sp.call(this, n, typeof v === 'string' ? api.cad(v) : v, pr); };
      });
    }
    // 4) HTML en texto
    intentar(() => envolver(w.Element.prototype, 'innerHTML', api.cad));
    intentar(() => envolver(w.Element.prototype, 'outerHTML', api.cad));
    intentar(() => {
      const ia = w.Element.prototype.insertAdjacentHTML;
      w.Element.prototype.insertAdjacentHTML = function (pos, h) { return ia.call(this, pos, api.cad(h)); };
    });
    return Object.assign({ activo: true }, api);
  }
  return { crear, instalar };
});
