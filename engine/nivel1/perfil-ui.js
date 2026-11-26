/* Pantalla "¿Quién juega?" — nombre, avatar, dispositivo y partidas guardadas.
 * Se conecta al menú existente sin cambiar su código: intercepta el botón JUGAR, reemplaza el guardado único
 * por el guardado por jugador y deja el dispositivo elegido en window.NINJA_DEVICE ('pc' | 'movil'). */
(function () {
  'use strict';
  if (typeof Perfiles === 'undefined') return;
  const AV = { sakura: { char: 'mario', nombre: 'SAKURA EVE', color: '#FF2E92' }, kage: { char: 'peach', nombre: 'ANTAREZ', color: '#FF3B44' } };
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
#pfChip:hover{background:rgba(255,201,60,.22)}
/* ── PERFIL NINJA / REDISEÑO PREMIUM ───────────────────────────── */
#pfOverlay{
  --pf-ink:#090d1d;--pf-panel:#111a32;--pf-line:rgba(180,198,255,.16);
  --pf-gold:#f6c768;--pf-muted:#aab7d3;
  padding:clamp(12px,2.8vw,34px);
  background:
    radial-gradient(ellipse at 14% 18%,rgba(221,65,150,.18),transparent 34%),
    radial-gradient(ellipse at 86% 16%,rgba(56,139,255,.2),transparent 36%),
    radial-gradient(ellipse at 50% 100%,rgba(130,72,220,.2),transparent 48%),
    linear-gradient(145deg,#080d1c 0%,#10152c 48%,#090d1d 100%);
  font-family:Inter,system-ui,sans-serif;
}
#pfOverlay:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.18;
  background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 88%)}
#pfOverlay:after{content:"";position:fixed;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 34%,rgba(0,0,0,.48) 100%)}
#pfOverlay *{box-sizing:border-box}
#pfOverlay .pf-card{
  position:relative;z-index:1;width:min(1000px,96vw);max-height:94vh;overflow:auto;
  display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.8vw,20px);
  padding:clamp(18px,2.8vw,34px);border:1px solid rgba(210,222,255,.2);border-radius:26px;
  background:linear-gradient(145deg,rgba(21,30,56,.96),rgba(8,14,30,.97));
  box-shadow:0 32px 100px rgba(0,0,0,.62),0 0 0 5px rgba(255,255,255,.025),inset 0 1px rgba(255,255,255,.12);
  backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)
}
#pfOverlay .pf-card:before{content:"";position:absolute;left:8%;right:8%;top:0;height:2px;
  background:linear-gradient(90deg,transparent,#ff79b8 22%,#f6c768 50%,#62cfff 78%,transparent);opacity:.9}
#pfOverlay .pf-card h2{grid-column:1/-1;margin:0;text-align:center;
  font:900 clamp(21px,3vw,32px)/1.1 Inter,system-ui,sans-serif;letter-spacing:.09em;
  color:#fff;text-shadow:0 4px 24px rgba(246,199,104,.2)}
#pfOverlay .pf-sub{grid-column:1/-1;margin:-7px 0 2px;text-align:center;
  color:#aebbd8;font:500 clamp(11px,1.35vw,14px)/1.6 Inter,system-ui,sans-serif}
#pfOverlay .pf-campo{margin:0;min-width:0}
#pfOverlay .pf-campo label{display:flex;align-items:center;gap:9px;margin:0 0 10px;
  color:#f5cc75;font:800 10px/1.4 Inter,system-ui,sans-serif;letter-spacing:.16em}
#pfOverlay .pf-campo label:before{content:"";width:22px;height:1px;background:currentColor;opacity:.7}
#pfOverlay .pf-name{grid-column:1/-1}
#pfOverlay .pf-campo input{height:54px;padding:0 18px;border:1px solid rgba(168,190,245,.26);
  border-radius:13px;background:rgba(4,9,22,.82);color:#fff;
  font:700 15px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;
  box-shadow:inset 0 2px 12px rgba(0,0,0,.22);transition:border-color .2s,box-shadow .2s}
#pfOverlay .pf-campo input::placeholder{color:#6e7c9c}
#pfOverlay .pf-campo input:focus{border-color:#f6c768;box-shadow:0 0 0 3px rgba(246,199,104,.12),0 0 24px rgba(246,199,104,.1);outline:none}
#pfOverlay .pf-avatars{grid-column:1/-1}
#pfOverlay .pf-opc{gap:clamp(10px,1.5vw,16px)}
#pfOverlay .pf-avatars .pf-opc{grid-template-columns:repeat(2,minmax(0,1fr))}
#pfOverlay .pf-op{
  position:relative;min-width:0;overflow:hidden;padding:0;border:1px solid rgba(174,193,238,.2);
  border-radius:18px;background:linear-gradient(150deg,rgba(31,43,72,.94),rgba(12,20,40,.98));
  color:#f5f7ff;font:800 11px/1.5 Inter,system-ui,sans-serif;letter-spacing:.09em;
  box-shadow:0 12px 26px rgba(0,0,0,.24);transition:transform .22s,border-color .22s,box-shadow .22s,background .22s
}
#pfOverlay .pf-op:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.42);background:linear-gradient(150deg,rgba(42,55,89,.98),rgba(13,22,44,.98))}
#pfOverlay .pf-op.on{border:2px solid var(--c,#f6c768);background:linear-gradient(150deg,rgba(56,34,70,.96),rgba(17,22,43,.98));
  box-shadow:0 0 0 3px rgba(255,255,255,.045),0 0 28px color-mix(in srgb,var(--c,#f6c768) 34%,transparent),0 18px 34px rgba(0,0,0,.38)}
#pfOverlay .pf-avatars .pf-op{min-height:260px;display:flex;flex-direction:column;justify-content:flex-end;padding:0 12px 15px}
#pfOverlay .pf-avatars .pf-op:before{content:"";position:absolute;inset:0 0 42px;pointer-events:none;
  background:radial-gradient(ellipse at 50% 62%,color-mix(in srgb,var(--c,#f6c768) 24%,transparent),transparent 66%),
  linear-gradient(180deg,rgba(255,255,255,.035),transparent 65%,rgba(3,7,18,.45))}
#pfOverlay .pf-avatars .pf-op:after{content:"";position:absolute;inset:9px 9px 48px;border:1px solid rgba(255,255,255,.12);border-radius:12px;pointer-events:none}
#pfOverlay .pf-avatars .pf-op img{position:relative;z-index:1;width:100%;height:215px;max-height:none;margin:0 0 10px;
  object-fit:contain;object-position:center bottom;border:0;border-radius:0;
  filter:drop-shadow(0 12px 12px rgba(0,0,0,.42));}
#pfOverlay .pf-avatars .pf-op.on:after{border-color:color-mix(in srgb,var(--c,#f6c768) 65%,white)}
#pfOverlay .pf-avatars .pf-op.on:before{background:radial-gradient(ellipse at 50% 62%,color-mix(in srgb,var(--c,#f6c768) 38%,transparent),transparent 68%)}
#pfOverlay .pf-avatars .pf-op{font-size:12px}
#pfOverlay .pf-devices{grid-column:1/-1}
#pfOverlay .pf-devices .pf-opc{grid-template-columns:repeat(2,minmax(0,1fr))}
#pfOverlay .pf-devices .pf-op{min-height:104px;padding:15px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
#pfOverlay .pf-devices .ico{font-size:30px;line-height:1.2;filter:drop-shadow(0 5px 9px rgba(0,0,0,.3))}
#pfOverlay .pf-devices .pf-op br{display:none}
#pfOverlay .pf-err{grid-column:1/-1;min-height:0;margin:0;color:#ff9caa;font:600 12px Inter,system-ui,sans-serif}
#pfOverlay .pf-pie{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 0;padding-top:15px;border-top:1px solid rgba(190,205,245,.12)}
#pfOverlay .pf-btn{min-height:46px;padding:0 20px;border:1px solid rgba(255,224,156,.72);border-radius:12px;
  background:linear-gradient(180deg,#ffe39a,#f2b93e);color:#241b16;
  font:900 11px Inter,system-ui,sans-serif;letter-spacing:.08em;
  box-shadow:0 5px 0 #9a6a20,0 10px 24px rgba(242,185,62,.16);transition:transform .18s,filter .18s}
#pfOverlay .pf-btn:hover{filter:brightness(1.08);transform:translateY(-2px)}
#pfOverlay .pf-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #9a6a20}
#pfOverlay .pf-btn.sec{border:1px solid rgba(177,192,229,.18);background:rgba(130,148,190,.12);color:#dce5fa;box-shadow:0 4px 0 rgba(0,0,0,.25)}
#pfOverlay .pf-btn.sec:hover{background:rgba(150,170,220,.2)}
#pfOverlay .pf-lista{grid-column:1/-1}
#pfOverlay .pf-fila{border:1px solid var(--pf-line);border-radius:14px;background:rgba(255,255,255,.045);padding:11px}
#pfOverlay .pf-info{font:800 11px/1.5 Inter,system-ui,sans-serif}
#pfOverlay .pf-info small{font:500 10px/1.5 Inter,system-ui,sans-serif;color:#9eaccb}
#pfOverlay .pf-code{font:12px ui-monospace,monospace}
#pfOverlay #pfChip{font:800 10px Inter,system-ui,sans-serif}
@media(max-width:680px){
 #pfOverlay{align-items:flex-start;padding:10px}
 #pfOverlay .pf-card{width:100%;max-height:none;min-height:min-content;grid-template-columns:1fr;padding:18px 14px;border-radius:20px;gap:13px}
 #pfOverlay .pf-card h2,#pfOverlay .pf-sub,#pfOverlay .pf-name,#pfOverlay .pf-avatars,#pfOverlay .pf-devices,#pfOverlay .pf-err,#pfOverlay .pf-pie,#pfOverlay .pf-lista{grid-column:1}
 #pfOverlay .pf-avatars .pf-op{min-height:205px;padding:0 8px 12px}
 #pfOverlay .pf-avatars .pf-op img{height:165px}
 #pfOverlay .pf-devices .pf-op{min-height:92px;padding:10px 6px;font-size:9px}
 #pfOverlay .pf-devices .ico{font-size:25px}
 #pfOverlay .pf-pie{align-items:stretch}
 #pfOverlay .pf-pie>.pf-btn{flex:1}
 #pfOverlay .pf-fila{flex-wrap:wrap}
}
@media(max-width:380px){
 #pfOverlay .pf-avatars .pf-op{min-height:175px;font-size:9px}
 #pfOverlay .pf-avatars .pf-op img{height:135px}
 #pfOverlay .pf-btn{padding:0 12px;font-size:9px}
}
@media(prefers-reduced-motion:reduce){#pfOverlay *,#pfOverlay *:before,#pfOverlay *:after{transition:none!important;animation:none!important}}
`;

  function el(tag, attrs, kids) {
    const e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(k => { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }
  function imgAvatar(av) { const i = document.querySelector('.hcard[data-c="' + AV[av].char + '"] img'); return i ? /** @type {HTMLImageElement} */ (i).src : ''; }
  function esTactil() { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; }
  // El dispositivo ya no se elige: se detecta solo cada vez que se juega (un mismo jugador puede abrir desde PC y desde el celular).
  function dispo() { return window.NinjaDevice ? NinjaDevice.tipo() : (esTactil() ? 'movil' : 'pc'); }
  /* Con cuenta iniciada (☁️) el jugador es el apodo de la cuenta: no se pide el nombre ni se elige jugador. */
  function cuentaNick() { try { return (window.Nube && Nube.nickActivo && Nube.nickActivo()) || null; } catch (e) { return null; } }
  function perfilCuenta() {
    const nick = cuentaNick(); if (!nick) return null;
    try { return Perfiles.paraCuenta(nick, heroeActual(), dispo()); } catch (e) { return null; }
  }
  function heroeActual() { try { return _char === 'peach' ? 'kage' : 'sakura'; } catch (e) { return 'sakura'; } }

  function aplicar(p) {
    p.dispositivo = dispo();
    try { Perfiles.actualizar(p.id, q => { q.dispositivo = p.dispositivo; }); } catch (e) {}
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
    const lista = ['ruta', 'acertijos', 'gen-nivel', 'motor', 'elementos', 'ambiente', 'habilidades', 'director', 'guia'];
    cargaN1 = lista.reduce((pr, n) => pr.then(() => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'engine/nivel1/' + n + '.js?v=13'; s.onload = () => ok(); s.onerror = () => mal(new Error('No se pudo cargar ' + n)); document.head.appendChild(s); })), Promise.resolve());
    return cargaN1;
  }
  function nivel2Nuevo(p) {
    if (!p) return;
    const q = new URLSearchParams({ heroe: p.avatar, dispositivo: dispo(), perfil: p.id });
    location.href = 'nivel2.html?' + q.toString();
  }
  function jugarNivel1(p) {
    aplicar(p); listo = true; cerrar();
    cargarNivel1().then(() => {
      const fresco = Perfiles.obtener(p.id);
      Nivel1.iniciar({ heroe: p.avatar, dispositivo: p.dispositivo, perfil: fresco, onSalir: () => abrirMundos(Perfiles.obtener(p.id)), onSiguiente: () => abrirMundos(Perfiles.obtener(p.id)) });
    }).catch(e => { alert('No se pudo abrir el Nivel 1: ' + e.message); });
  }
  function nivel3Nuevo(p) {
    if (!p) return;
    location.href = 'nivel3.html?' + new URLSearchParams({ heroe: p.avatar, perfil: p.id }).toString();
  }
  /* Selector de mundos: el jugador elige con cuál empezar y, al terminar o salir, vuelve aquí. */
  function abrirMundos(p) {
    p = p || Perfiles.activo();
    if (!p) return abrir('auto');
    if (!window.SelectorMundos) return jugarNivel1(p);   // por si el selector no cargó
    aplicar(p); listo = true; cerrar();
    SelectorMundos.abrir({
      perfil: Perfiles.obtener(p.id),
      lanzar: { senda: q => jugarNivel1(q), viaje: q => nivel2Nuevo(q), farolillos: q => nivel3Nuevo(q), clasico: q => continuar(q) },
      onCerrarSesion: () => {            // para que otra persona pueda jugar: el avance de cada perfil queda guardado
        if (cuentaNick() && window.Nube && Nube.abrir) { Nube.abrir(); return; }   // con cuenta: se cierra desde ☁️ Cuenta
        try { sessionStorage.removeItem('ninja_abrir_mundos'); } catch (e) {}
        if (Perfiles.cerrarSesion) Perfiles.cerrarSesion();
        listo = false; actualizarChip(); abrir('lista');
      }
    });
  }
  function jugarNuevo(p) { abrirMundos(p); }
  let pasarClasico = false;   // deja pasar el clic de JUGAR cuando el selector lanza el torneo clásico
  function continuar(p) {
    if ((p.progreso.nivel || 0) === 0) {          // torneo clásico desde cero (con el jugador ya identificado)
      aplicar(p); listo = true; cerrar();
      const b = document.getElementById('btnStart'); if (!b) return abrirMundos(p);
      pasarClasico = true; try { b.click(); } finally { pasarClasico = false; }
      return;
    }
    aplicar(p); listo = true; cerrar();
    try {
      GS.phase = p.progreso.fase || 'easy'; GS.level = p.progreso.nivel || 0; GS.totalScore = p.progreso.puntos || 0;
      startLevel(GS.level, GS.phase);
    } catch (e) { const b = document.getElementById('btnStart'); if (b) { pasarClasico = true; try { b.click(); } finally { pasarClasico = false; } } }
  }

  function vistaLista(card) {
    card.classList.add('pf-card-s');
    const ps = Perfiles.listar();
    card.appendChild(el('h2', { text: '¿QUIÉN JUEGA?' }));
    card.appendChild(el('p', { class: 'pf-sub', text: 'Elige tu jugador para seguir tu partida.' }));
    const lista = el('div', { class: 'pf-lista' });
    ps.forEach(p => {
      const tiene = p.progreso && (p.progreso.puntos > 0 || p.progreso.nivel > 0 || (p.nivel1 && p.nivel1.intentos > 0) || (p.nivel2 && p.nivel2.intentos > 0) || (p.nivel3 && p.nivel3.intentos > 0));
      const reiniciar = () => { if (confirm('¿Empezar de nuevo desde el nivel 1? Se conserva tu nombre pero se borra tu avance.')) { Perfiles.actualizar(p.id, q => { q.progreso = { fase: 'easy', nivel: 0, puntos: 0 }; q.nivel1 = { intentos: 0, semilla: null, plan: null, estado: null, completados: 0 }; }); jugarNuevo(Perfiles.obtener(p.id)); } };
      const borrar = () => { if (confirm('¿Borrar a ' + p.nombre + ' y todo su avance?')) { Perfiles.borrar(p.id); render(); } };
      const acc = el('div', { class: 'pf-acc' }, [
        tiene ? el('button', { class: 'pf-btn', text: '🌍 ELEGIR MUNDO', onclick: () => abrirMundos(p) }) : el('button', { class: 'pf-btn', text: '▶ JUGAR', onclick: () => jugarNuevo(p) })
      ]);
      if (tiene) acc.appendChild(el('button', { class: 'pf-ic', text: '↺', title: 'Empezar de nuevo desde el nivel 1', 'aria-label': 'Empezar de nuevo', onclick: reiniciar }));
      acc.appendChild(el('button', { class: 'pf-ic', text: '🗑', title: 'Borrar jugador', 'aria-label': 'Borrar jugador', onclick: borrar }));
      lista.appendChild(el('div', { class: 'pf-fila', style: '--c:' + AV[p.avatar].color }, [
        el('img', { src: imgAvatar(p.avatar), alt: '' }),
        el('div', { class: 'pf-info' }, [el('b', { text: p.nombre.toUpperCase() }), el('small', { text: tiene ? 'Nivel ' + (p.progreso.nivel + 1) + ' · ' + p.progreso.puntos.toLocaleString() + ' pts' : 'Partida nueva' })]),
        acc
      ]));
    });
    card.appendChild(lista);
    card.appendChild(el('div', { class: 'pf-pie' }, [
      el('button', { class: 'pf-btn', text: '＋ JUGADOR NUEVO', onclick: () => { vista = 'crear'; render(); } }),
      el('span', { class: 'pf-mas' }, [el('button', { class: 'pf-link', text: 'Exportar', onclick: () => { vista = 'exportar'; render(); } }), el('button', { class: 'pf-link', text: 'Importar', onclick: () => { vista = 'importar'; render(); } })])
    ]));
  }

  function vistaCrear(card) {
    card.classList.add('pf-card-s');
    // Solo se pide el nombre: el ninja es el que se eligió en el menú y el dispositivo se detecta solo.
    borrador.avatar = heroeActual();
    borrador.dispositivo = dispo();
    card.appendChild(el('h2', { text: '¿CÓMO TE LLAMAS?' }));
    card.appendChild(el('p', { class: 'pf-sub', text: 'Con tu nombre guardamos tu avance. Jugarás con ' + AV[borrador.avatar].nombre + '.' }));
    const inp = el('input', { type: 'text', maxlength: '16', placeholder: 'TU NOMBRE', autocomplete: 'off', value: borrador.nombre });
    inp.addEventListener('input', () => { borrador.nombre = inp.value; });
    card.appendChild(el('div', { class: 'pf-campo pf-name' }, [inp]));
    const err = el('div', { class: 'pf-err' });
    card.appendChild(err);
    const crear = () => {
      const r = Perfiles.crear({ nombre: borrador.nombre, avatar: borrador.avatar, dispositivo: borrador.dispositivo });
      if (!r.ok) { err.textContent = r.error; return; }
      borrador = { nombre: '', avatar: 'sakura', dispositivo: null }; jugarNuevo(r.perfil);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') crear(); });
    card.appendChild(el('div', { class: 'pf-pie' }, [
      Perfiles.listar().length ? el('button', { class: 'pf-btn sec', text: '← VOLVER', onclick: () => { vista = 'lista'; render(); } }) : el('span'),
      el('button', { class: 'pf-btn', text: '▶ JUGAR', onclick: crear })
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
      c = el('div', { id: 'pfChip', onclick: () => { if (cuentaNick() && window.Nube && Nube.abrir) Nube.abrir(); else abrir('lista'); } }); b.parentNode.insertBefore(c, b);
    }
    const nk = cuentaNick();
    c.textContent = nk ? '👤 ' + nk.toUpperCase() + ' · CUENTA' : a ? '👤 ' + a.nombre.toUpperCase() + ' · CAMBIAR' : '👤 ¿QUIÉN JUEGA?';
  }

  function iniciar() {
    document.head.appendChild(el('style', { text: css }));
    const b = document.getElementById('btnStart'); if (!b) return;
    // 1) JUGAR exige elegir jugador primero
    b.addEventListener('click', e => {
      const pc = pasarClasico ? null : perfilCuenta();
      if (pc) { e.stopImmediatePropagation(); e.preventDefault(); abrirMundos(pc); return; }   // con cuenta: directo a los mundos
      if (!listo) { e.stopImmediatePropagation(); e.preventDefault(); abrir(Perfiles.listar().length ? 'lista' : 'crear'); }
      else if (!pasarClasico && Perfiles.activo()) { e.stopImmediatePropagation(); e.preventDefault(); abrirMundos(Perfiles.activo()); }   // JUGAR = elegir mundo
    }, true);
    // 2) tras el arranque normal, el marcador usa el nombre real del jugador
    b.addEventListener('click', () => { const a = Perfiles.activo(); if (a && listo) { try { GS.name = a.nombre.toUpperCase(); } catch (e) {} } });
    const old = document.getElementById('btnCont'); if (old) old.style.setProperty('display', 'none', 'important');
    // 3) el guardado único pasa a ser por jugador
    const orig = window.saveG;
    window.saveG = function () {
      try { if (orig) orig.apply(this, arguments); } catch (e) {}
      try { const a = Perfiles.activo(); if (a) Perfiles.actualizar(a.id, p => { p.progreso = { fase: GS.phase, nivel: GS.level, puntos: GS.totalScore || 0 }; }); } catch (e) {}
    };
    // Entra o sale una cuenta: se crea/elige el jugador con el apodo (o se suelta al salir)
    if (window.Nube && Nube.alCambiarSesion) Nube.alCambiarSesion((nick, motivo) => {
      if (nick) { perfilCuenta(); }
      else if (motivo === 'salir') { try { if (Perfiles.cerrarSesion) Perfiles.cerrarSesion(); } catch (e) {} listo = false; }
      actualizarChip();
    });
    if (cuentaNick()) perfilCuenta();
    actualizarChip();
    // los niveles 2 y 3 regresan con ?mundos=1: se vuelve directo al selector con el jugador activo
    let flag = false; try { flag = sessionStorage.getItem('ninja_abrir_mundos') === '1'; } catch (e) {}
    if (flag || /[?&]mundos=1/.test(location.search)) { const a = Perfiles.activo(); if (a) setTimeout(() => abrirMundos(a), 0); }
  }
  window.PerfilUI = { abrir, aplicar, actualizarChip, abrirMundos };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
