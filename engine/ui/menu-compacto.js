/* engine/ui — Menú principal compacto.
   Problema: el dock del menú (menu-2026.js) llegaba a 9 iconos (Ranking, Logros, Reporte, Sonido, Créditos, Historia,
   Cuenta, Legal, Progreso) en una cuadrícula de 4+4+1 con etiquetas de 8 px casi ilegibles sobre el fondo.
   Solución: una sola fila con lo que usan los estudiantes (Ranking, Logros, Historia, Sonido) y un botón "Más" que abre
   un panel con el resto (Reporte del profe, Cuenta, Progreso, Créditos, Legal…).
   · Los botones originales se MUEVEN (no se copian): conservan sus eventos y sus módulos siguen funcionando.
   · El panel vive DENTRO de .m26-dock a propósito: progreso.js busca su botón con dock.querySelector('.njProgBtn') y,
     si no lo encontrara, crearía uno nuevo cada vez.
   · Cualquier botón que otro módulo agregue después (o que cambie de etiqueta, como Cuenta → nombre del jugador)
     que no sea de los 4 principales va solo al panel.
   · Se puede apagar desde 🧩 MEJORAS o con ?mods=0: sin él, el menú queda como antes. */
(function () {
  'use strict';
  /** Etiquetas de los botones que se quedan siempre a la vista, en este orden. */
  var PRIMARIOS = ['Ranking', 'Logros', 'Historia', 'Sonido'];

  function iniciar() {
    var dock = /** @type {HTMLElement|null} */ (document.querySelector('#m26 .m26-dock'));
    if (!dock || dock.dataset.mc26) return;
    dock.dataset.mc26 = '1';

    var mas = document.createElement('button');
    mas.type = 'button';
    mas.className = 'm26-d mc-more';
    mas.id = 'mcMore';
    mas.innerHTML = '<i class="m26-i mc-dots" aria-hidden="true"><b></b><b></b><b></b></i><span class="m26-l">Más</span>';
    mas.title = 'Más opciones';
    mas.setAttribute('aria-label', 'Más opciones');
    mas.setAttribute('aria-haspopup', 'true');
    mas.setAttribute('aria-expanded', 'false');
    mas.setAttribute('aria-controls', 'mcPanel');

    var panel = document.createElement('div');
    panel.id = 'mcPanel';
    panel.className = 'mc-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Más opciones');
    var tit = document.createElement('div');
    tit.className = 'mc-tit';
    tit.textContent = 'Más opciones';
    panel.appendChild(tit);

    dock.appendChild(mas);
    dock.appendChild(panel);
    document.documentElement.classList.add('mc26');

    /** @param {Element} b */
    function etiqueta(b) {
      var l = b.querySelector('.m26-l');
      return ((l ? l.textContent : b.textContent) || '').trim();
    }

    var obs = null;
    function ordenar() {
      if (obs) obs.disconnect();           // al mover botones no queremos dispararnos a nosotros mismos
      try {
        var botones = Array.prototype.slice.call(dock.children).concat(Array.prototype.slice.call(panel.children))
          .filter(function (b) { return b.tagName === 'BUTTON' && b !== mas; });
        var prim = [], sec = [];
        botones.forEach(function (b) {
          var t = etiqueta(b);
          if (!t) return;                  // sin etiqueta: no se toca
          if (PRIMARIOS.indexOf(t) >= 0) prim.push(b); else sec.push(b);
        });
        prim.sort(function (a, b) { return PRIMARIOS.indexOf(etiqueta(a)) - PRIMARIOS.indexOf(etiqueta(b)); });
        prim.forEach(function (b) { dock.insertBefore(b, mas); });
        sec.forEach(function (b) { if (b.parentNode !== panel) panel.appendChild(b); });
        var hay = sec.length > 0;
        mas.hidden = !hay;
        if (!hay) cerrar();
      } finally {
        if (obs) obs.observe(dock, { childList: true });
      }
    }

    var abierto = false;
    function abrir() {
      abierto = true;
      panel.hidden = false;
      mas.setAttribute('aria-expanded', 'true');
      var primero = /** @type {HTMLElement|null} */ (panel.querySelector('button'));
      if (primero) try { primero.focus({ preventScroll: true }); } catch (e) { /* navegador antiguo */ }
    }
    /** @param {boolean=} devolverFoco */
    function cerrar(devolverFoco) {
      if (!abierto && panel.hidden) return;
      abierto = false;
      panel.hidden = true;
      mas.setAttribute('aria-expanded', 'false');
      if (devolverFoco) try { mas.focus({ preventScroll: true }); } catch (e) { /* navegador antiguo */ }
    }

    mas.addEventListener('click', function () { if (abierto) cerrar(true); else abrir(); });
    // elegir una opción del panel la ejecuta (su evento original) y cierra el panel
    panel.addEventListener('click', function (e) {
      var t = /** @type {Element|null} */ (e.target);
      if (t && t.closest && t.closest('button')) setTimeout(function () { cerrar(false); }, 0);
    });
    // tocar fuera o pulsar Escape lo cierra
    document.addEventListener('pointerdown', function (e) {
      if (!abierto) return;
      var t = /** @type {Node|null} */ (e.target);
      if (t && (panel.contains(t) || mas.contains(t))) return;
      cerrar(false);
    }, true);
    document.addEventListener('keydown', function (e) {
      if (abierto && e.key === 'Escape') { e.stopPropagation(); cerrar(true); }
    }, true);

    if (typeof MutationObserver === 'function') {
      var pend = false;
      obs = new MutationObserver(function () {      // otros módulos agregan botones tarde (Cuenta, Legal, Progreso…)
        if (pend) return; pend = true;
        requestAnimationFrame(function () { pend = false; ordenar(); });
      });
    }
    ordenar();
  }

  function arrancar() {
    try { iniciar(); } catch (e) { if (window.console) console.warn('[menu-compacto] no se pudo iniciar:', e); }
  }
  var NM = /** @type {any} */ (window).NinjaMods;
  if (NM && NM.register) NM.register({ id: 'menu-compacto', carpeta: 'ui', nombre: 'Menú principal compacto (fila de iconos + "Más")', init: arrancar });
  else arrancar();
})();
