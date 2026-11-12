/* Pantalla "¿Quién juega?" — nombre, avatar, dispositivo y partidas guardadas.
 * Se conecta al menú existente sin cambiar su código: intercepta el botón JUGAR, reemplaza el guardado único
 * por el guardado por jugador y deja el dispositivo elegido en window.NINJA_DEVICE ('pc' | 'movil'). */
(function () {
  'use strict';
  if (typeof Perfiles === 'undefined') return;
  const AV = { sakura: { char: 'mario', nombre: 'SAKURA', color: '#FF2E92' }, kage: { char: 'peach', nombre: 'KAGE', color: '#FF3B44' } };
  let listo = false, vista = 'auto', borrador = { nombre: '', avatar: 'sakura', dispositivo: null };

  const css = `
#pfOverlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 30%,rgba(60,20,110,.96),rgba(10,4,26,.98));font-family:'Press Start 2P',ui-monospace,monospace;color:#fff;padding:12px;overflow:auto}
#pfOverlay *{box-sizing:border-box}
.pf-card{width:min(760px,96vw);max-height:96vh;overflow:auto;background:linear-gradient(180deg,rgba(40,18,80,.92),rgba(18,8,42,.95));border:2px solid #FFC93C;border-radius:14px;box-shadow:0 0 40px rgba(255,201,60,.25),inset 0 0 30px rgba(0,0,0,.5);padding:clamp(14px,3vw,26px)}
.pf-card h2{margin:0 0 4px;font-size:clamp(13px,2.6vw,20px);color:#FFC93C;text-shadow:0 2px 0 #7a3a00;letter-spacing:1px;text-align:center}
.pf-sub{margin:0 0 14px;font-size:clamp(7px,1.3vw,9px);color:#c9b8ff;text-align:center;line-height:1.7}
.pf-lista{display:grid;gap:8px;margin-bottom:12px}
.pf-fila{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 10px}
.pf-fila img{width:46px;height:46px;border-radius:8px;object-fit:cover;object-position:top;border:2px solid var(--c,#FFC93C)}
.pf-info{flex:1;min-width:0;font-size:clamp(8px,1.5vw,11px);line-height:1.7}
.pf-info small{display:block;color:#b9a8ee;font-size:clamp(6px,1.1vw,8px)}
.pf-btn{font-family:inherit;cursor:pointer;border:0;border-radius:8px;padding:10px 14px;font-size:clamp(8px,1.4vw,10px);color:#1a0a33;background:linear-gradient(180deg,#FFE27A,#FFB300);box-shadow:0 3px 0 #8a5a00;letter-spacing:.5px}
.pf-btn:hover{filter:brightness(1.1)}.pf-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #8a5a00}
.pf-btn.sec{background:rgba(255,255,255,.12);color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.4)}
.pf-btn.mini{padding:6px 8px;font-size:8px}
.pf-btn[disabled]{opacity:.45;cursor:not-allowed;filter:grayscale(.6)}
.pf-campo{margin:12px 0}
.pf-campo label{display:block;font-size:clamp(7px,1.3vw,9px);color:#FFC93C;margin-bottom:6px}
.pf-campo input{width:100%;padding:11px;border-radius:8px;border:2px solid #6b4bd1;background:#0d0620;color:#fff;font-family:inherit;font-size:clamp(10px,1.8vw,13px);text-transform:uppercase;outline:none}
.pf-campo input:focus{border-color:#FFC93C}
.pf-opc{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf-op{cursor:pointer;text-align:center;border:2px solid rgba(255,255,255,.2);border-radius:10px;padding:8px;background:rgba(255,255,255,.05);font-size:clamp(7px,1.3vw,9px);line-height:1.8;color:#fff;font-family:inherit}
.pf-op.on{border-color:var(--c,#FFC93C);background:rgba(255,201,60,.14);box-shadow:0 0 14px var(--c,#FFC93C)}
.pf-op img{width:100%;max-height:150px;object-fit:cover;object-position:top;border-radius:6px;margin-bottom:5px}
.pf-op .ico{font-size:clamp(22px,4vw,34px);display:block;margin-bottom:4px}
.pf-err{min-height:14px;color:#ff8a8a;font-size:8px;margin:6px 0;text-align:center}
.pf-pie{display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:12px}
.pf-code{width:100%;min-height:64px;background:#0d0620;color:#9ff;border:1px solid #6b4bd1;border-radius:8px;font-size:9px;padding:8px;font-family:ui-monospace,monospace}
#pfChip{display:inline-flex;align-items:center;gap:8px;margin:0 auto 10px;cursor:pointer;background:rgba(255,255,255,.1);border:1px solid #FFC93C;border-radius:20px;padding:6px 12px;color:#FFE27A;font-family:'Press Start 2P',monospace;font-size:clamp(7px,1.3vw,9px)}
#pfChip:hover{background:rgba(255,201,60,.22)}`;

  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(k => { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }
  function imgAvatar(av) { const i = document.querySelector('.hcard[data-c="' + AV[av].char + '"] img'); return i ? i.src : ''; }
  function esTactil() { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; }

  function aplicar(p) {
    window.NINJA_DEVICE = p.dispositivo;
    document.documentElement.setAttribute('data-dispositivo', p.dispositivo);
    try { selChar(AV[p.avatar].char); } catch (e) {}
    try { GS.name = p.nombre.toUpperCase(); GS.char = AV[p.avatar].char; } catch (e) {}
    Perfiles.elegir(p.id); actualizarChip();
  }
  function cerrar() { const o = document.getElementById('pfOverlay'); if (o) o.remove(); }
  // El Nivel 1 rediseñado se descarga solo cuando se juega (así el index.html no engorda).
  let cargaN1 = null;
  function cargarNivel1() {
    if (window.Nivel1) return Promise.resolve();
    if (cargaN1) return cargaN1;
    const lista = ['ruta', 'acertijos', 'gen-nivel', 'motor', 'elementos'];
    cargaN1 = lista.reduce((pr, n) => pr.then(() => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'engine/nivel1/' + n + '.js?v=4'; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar ' + n)); document.head.appendChild(s); })), Promise.resolve());
    return cargaN1;
  }
  function nivel2Anterior(p) {
    Perfiles.actualizar(p.id, q => { q.progreso = { fase: 'easy', nivel: 1, puntos: q.progreso.puntos }; });
    try { GS.phase = 'easy'; GS.level = 1; GS.totalScore = Perfiles.obtener(p.id).progreso.puntos; startLevel(1, 'easy'); } catch (e) { const b = document.getElementById('btnStart'); if (b) b.click(); }
  }
  function jugarNivel1(p) {
    aplicar(p); listo = true; cerrar();
    cargarNivel1().then(() => {
      const fresco = Perfiles.obtener(p.id);
      Nivel1.iniciar({ heroe: p.avatar, dispositivo: p.dispositivo, perfil: fresco, onSalir: () => actualizarChip(), onSiguiente: () => nivel2Anterior(Perfiles.obtener(p.id)) });
    }).catch(e => { alert('No se pudo abrir el Nivel 1: ' + e.message); });
  }
  function jugarNuevo(p) { jugarNivel1(p); }
  function continuar(p) {
    if ((p.progreso.nivel || 0) === 0) return jugarNivel1(p);
    aplicar(p); listo = true; cerrar();
    try {
      GS.phase = p.progreso.fase || 'easy'; GS.level = p.progreso.nivel || 0; GS.totalScore = p.progreso.puntos || 0;
      startLevel(GS.level, GS.phase);
    } catch (e) { const b = document.getElementById('btnStart'); if (b) b.click(); }
  }

  function vistaLista(card) {
    const ps = Perfiles.listar();
    card.appendChild(el('h2', { text: '¿QUIÉN JUEGA?' }));
    card.appendChild(el('p', { class: 'pf-sub', text: 'Elige tu jugador para seguir tu partida, o crea uno nuevo.' }));
    const lista = el('div', { class: 'pf-lista' });
    ps.forEach(p => {
      const tiene = p.progreso && (p.progreso.puntos > 0 || p.progreso.nivel > 0);
      lista.appendChild(el('div', { class: 'pf-fila', style: '--c:' + AV[p.avatar].color }, [
        el('img', { src: imgAvatar(p.avatar), alt: '' }),
        el('div', { class: 'pf-info' }, [p.nombre.toUpperCase(), el('small', { text: (p.dispositivo === 'movil' ? '📱 Teléfono' : '💻 Computador') + ' · ' + (tiene ? 'Nivel ' + (p.progreso.nivel + 1) + ' · ' + p.progreso.puntos.toLocaleString() + ' pts' : 'Partida nueva') })]),
        tiene ? el('button', { class: 'pf-btn', text: '▶ CONTINUAR', onclick: () => continuar(p) }) : el('button', { class: 'pf-btn', text: '▶ JUGAR', onclick: () => jugarNuevo(p) }),
        tiene ? el('button', { class: 'pf-btn sec mini', text: 'NUEVA', title: 'Empezar desde el nivel 1 con este jugador', onclick: () => { if (confirm('¿Empezar de nuevo desde el nivel 1? Se conserva tu nombre pero se borra tu avance.')) { Perfiles.actualizar(p.id, q => { q.progreso = { fase: 'easy', nivel: 0, puntos: 0 }; q.nivel1 = { intentos: 0, semilla: null, plan: null, estado: null, completados: 0 }; }); jugarNuevo(Perfiles.obtener(p.id)); } } }) : '',
        el('button', { class: 'pf-btn sec mini', text: '🗑', title: 'Borrar jugador', onclick: () => { if (confirm('¿Borrar a ' + p.nombre + ' y todo su avance?')) { Perfiles.borrar(p.id); render(); } } })
      ]));
    });
    card.appendChild(lista);
    card.appendChild(el('div', { class: 'pf-pie' }, [
      el('button', { class: 'pf-btn', text: '＋ JUGADOR NUEVO', onclick: () => { vista = 'crear'; render(); } }),
      el('span', {}, [el('button', { class: 'pf-btn sec mini', text: '📤 EXPORTAR', onclick: () => { vista = 'exportar'; render(); } }), ' ', el('button', { class: 'pf-btn sec mini', text: '📥 IMPORTAR', onclick: () => { vista = 'importar'; render(); } })])
    ]));
  }

  function vistaCrear(card) {
    if (borrador.dispositivo === null) borrador.dispositivo = esTactil() ? 'movil' : 'pc';
    card.appendChild(el('h2', { text: 'JUGADOR NUEVO' }));
    card.appendChild(el('p', { class: 'pf-sub', text: 'Tu nombre y tu avatar se guardan para que no pierdas tu avance.' }));
    const inp = el('input', { type: 'text', maxlength: '14', placeholder: 'ESCRIBE TU NOMBRE', autocomplete: 'off', value: borrador.nombre });
    inp.addEventListener('input', () => { borrador.nombre = inp.value; });
    card.appendChild(el('div', { class: 'pf-campo' }, [el('label', { text: '1 · TU NOMBRE' }), inp]));
    const av = el('div', { class: 'pf-opc' });
    Object.keys(AV).forEach(k => av.appendChild(el('button', { class: 'pf-op' + (borrador.avatar === k ? ' on' : ''), style: '--c:' + AV[k].color, onclick: () => { borrador.avatar = k; render(); } }, [el('img', { src: imgAvatar(k), alt: '' }), AV[k].nombre])));
    card.appendChild(el('div', { class: 'pf-campo' }, [el('label', { text: '2 · ELIGE TU NINJA' }), av]));
    const dv = el('div', { class: 'pf-opc' });
    [['pc', '💻', 'COMPUTADOR', 'Teclado: flechas / WASD'], ['movil', '📱', 'TELÉFONO O TABLET', 'Controles táctiles en pantalla']].forEach(d => dv.appendChild(el('button', { class: 'pf-op' + (borrador.dispositivo === d[0] ? ' on' : ''), onclick: () => { borrador.dispositivo = d[0]; render(); } }, [el('span', { class: 'ico', text: d[1] }), d[2], el('br'), d[3]])));
    card.appendChild(el('div', { class: 'pf-campo' }, [el('label', { text: '3 · ¿DESDE DÓNDE JUEGAS?' }), dv]));
    const err = el('div', { class: 'pf-err' });
    card.appendChild(err);
    card.appendChild(el('div', { class: 'pf-pie' }, [
      Perfiles.listar().length ? el('button', { class: 'pf-btn sec', text: '← VOLVER', onclick: () => { vista = 'lista'; render(); } }) : el('span'),
      el('button', { class: 'pf-btn', text: '▶ CREAR Y JUGAR', onclick: () => {
        const r = Perfiles.crear({ nombre: borrador.nombre, avatar: borrador.avatar, dispositivo: borrador.dispositivo });
        if (!r.ok) { err.textContent = r.error; return; }
        borrador = { nombre: '', avatar: 'sakura', dispositivo: null }; jugarNuevo(r.perfil);
      } })
    ]));
    setTimeout(() => inp.focus(), 30);
  }

  function vistaCodigo(card, modo) {
    card.appendChild(el('h2', { text: modo === 'exportar' ? 'EXPORTAR PARTIDA' : 'IMPORTAR PARTIDA' }));
    const ps = Perfiles.listar();
    if (modo === 'exportar') {
      card.appendChild(el('p', { class: 'pf-sub', text: 'Copia este código y pégalo en otro computador (botón IMPORTAR) para seguir tu partida allí.' }));
      const sel = el('select', { class: 'pf-campo' }); ps.forEach(p => sel.appendChild(el('option', { value: p.id, text: p.nombre.toUpperCase() })));
      const ta = el('textarea', { class: 'pf-code', readonly: 'readonly' });
      const act = () => { ta.value = Perfiles.exportar(sel.value) || ''; };
      sel.addEventListener('change', act); act();
      card.appendChild(sel); card.appendChild(ta);
      card.appendChild(el('div', { class: 'pf-pie' }, [el('button', { class: 'pf-btn sec', text: '← VOLVER', onclick: () => { vista = 'lista'; render(); } }), el('button', { class: 'pf-btn', text: '📋 COPIAR', onclick: () => { ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } } })]));
    } else {
      card.appendChild(el('p', { class: 'pf-sub', text: 'Pega aquí el código que copiaste en el otro computador.' }));
      const ta = el('textarea', { class: 'pf-code', placeholder: 'NINJA1.…' }); const err = el('div', { class: 'pf-err' });
      card.appendChild(ta); card.appendChild(err);
      card.appendChild(el('div', { class: 'pf-pie' }, [el('button', { class: 'pf-btn sec', text: '← VOLVER', onclick: () => { vista = ps.length ? 'lista' : 'crear'; render(); } }), el('button', { class: 'pf-btn', text: 'IMPORTAR', onclick: () => { const r = Perfiles.importar(ta.value); if (!r.ok) { err.textContent = r.error; return; } vista = 'lista'; render(); } })]));
    }
  }

  function render() {
    let o = document.getElementById('pfOverlay');
    if (!o) {
      o = el('div', { id: 'pfOverlay' }); document.body.appendChild(o);
      // el juego escucha el teclado en todo el documento: aquí adentro las teclas son solo para escribir
      ['keydown', 'keyup', 'keypress'].forEach(t => o.addEventListener(t, e => e.stopPropagation()));
    }
    o.textContent = '';
    const card = el('div', { class: 'pf-card' }); o.appendChild(card);
    const hay = Perfiles.listar().length > 0;
    if (vista === 'auto') vista = hay ? 'lista' : 'crear';
    if (vista === 'lista' && !hay) vista = 'crear';
    if (vista === 'lista') vistaLista(card); else if (vista === 'crear') vistaCrear(card); else vistaCodigo(card, vista);
  }
  function abrir(v) { vista = v || 'auto'; render(); }

  function actualizarChip() {
    const a = Perfiles.activo(); let c = document.getElementById('pfChip');
    if (!c) {
      const b = document.getElementById('btnStart'); if (!b || !b.parentNode) return;
      c = el('div', { id: 'pfChip', onclick: () => abrir('lista') }); b.parentNode.insertBefore(c, b);
    }
    c.textContent = a ? '👤 ' + a.nombre.toUpperCase() + ' · CAMBIAR' : '👤 ¿QUIÉN JUEGA?';
  }

  function iniciar() {
    document.head.appendChild(el('style', { text: css }));
    const b = document.getElementById('btnStart'); if (!b) return;
    // 1) JUGAR exige elegir jugador primero
    b.addEventListener('click', e => { if (!listo) { e.stopImmediatePropagation(); e.preventDefault(); abrir(Perfiles.listar().length ? 'lista' : 'crear'); } }, true);
    // 2) tras el arranque normal, el marcador usa el nombre real del jugador
    b.addEventListener('click', () => { const a = Perfiles.activo(); if (a && listo) { try { GS.name = a.nombre.toUpperCase(); } catch (e) {} } });
    const old = document.getElementById('btnCont'); if (old) old.style.setProperty('display', 'none', 'important');
    // 3) el guardado único pasa a ser por jugador
    const orig = window.saveG;
    window.saveG = function () {
      try { if (orig) orig.apply(this, arguments); } catch (e) {}
      try { const a = Perfiles.activo(); if (a) Perfiles.actualizar(a.id, p => { p.progreso = { fase: GS.phase, nivel: GS.level, puntos: GS.totalScore || 0 }; }); } catch (e) {}
    };
    actualizarChip();
  }
  window.PerfilUI = { abrir, aplicar, actualizarChip };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
