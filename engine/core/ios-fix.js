/* engine/core — Mejoras para iPhone / iPad (Safari y app de pantalla de inicio)
   Solo actúa en iOS/iPadOS; en Android y computador no hace nada. Para probar en otro equipo: ?ios=1. Para apagarlo: ?ios=0.

   Qué arregla (todo lo que Safari de iPhone hace distinto a Android):
   1) Safari NO tiene pantalla completa en iPhone (no existe requestFullscreen). Se aprovecha TODO el espacio visible,
      se mide con visualViewport (no con innerHeight, que en iOS miente al girar o al mostrar/ocultar barras)
      y se muestra un aviso discreto para instalar el juego en la pantalla de inicio (ahí sí abre a pantalla completa real).
   2) Quita lo que "rompe" el juego en iOS: zoom con dos dedos, zoom con doble toque, rebote/arrastre de la página,
      menú de copiar/lupa al mantener pulsado, zoom automático al tocar un campo de texto (<16px).
   3) Respeta el notch / isla dinámica / barra de inicio en horizontal: pausa, marcador y controles quedan siempre dentro de la zona segura.
   4) Audio: iOS solo activa el sonido tras un toque "real" y lo silencia con el interruptor de timbre; aquí se desbloquea
      y se pone en modo "reproducción" (suena aunque el timbre esté en silencio, donde el sistema lo permite).
   5) Botones táctiles: zona de toque un poco mayor que el dibujo (sin solaparse entre sí) y respuesta inmediata. */
(function(){
'use strict';
const Q=location.search;
if(/[?&]ios=0/.test(Q))return;
const UA=navigator.userAgent||'';
const iOS=/iP(hone|ad|od)/.test(UA)||(navigator.platform==='MacIntel'&&(navigator.maxTouchPoints||0)>1);
if(!iOS&&!/[?&]ios=1/.test(Q))return;

const root=document.documentElement;
const standalone=()=>navigator.standalone===true||(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches));
root.classList.add('ios');
if(standalone())root.classList.add('ios-app');

/* ---------- CSS ---------- */
const css=document.createElement('style');
css.id='iosFixCss';
css.textContent=`
html.ios,html.ios body{
  position:fixed;inset:0;width:100%;height:100%;overflow:hidden;background:#000;
  overscroll-behavior:none;touch-action:manipulation;
  -webkit-text-size-adjust:100%;text-size-adjust:100%;
  -webkit-touch-callout:none;-webkit-user-select:none;user-select:none;
  -webkit-tap-highlight-color:transparent}
html.ios #c{touch-action:none}
/* un campo de texto con letra menor de 16px hace que iOS acerque la pantalla y ya no vuelva a su tamaño */
html.ios input,html.ios select,html.ios textarea{font-size:16px!important;-webkit-user-select:text;user-select:text}
html.ios input[type=range]{font-size:inherit!important;touch-action:pan-x}
/* nada de 100vh: en iOS incluye las barras de Safari y el contenido queda cortado */
html.ios [style*="min-height:100vh"]{min-height:100%!important}
@supports(height:100dvh){
  html.ios .card,html.ios .lbcard,html.ios #S1 .lbcard,html.ios #S6 .lbcard{max-height:96dvh!important}
  html.ios #reportRows{max-height:50dvh!important}
}
/* zona segura (notch / isla dinámica / barra de inicio) en horizontal */
html.ios #pauseBtn{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important;top:max(5px,env(safe-area-inset-top,0px))!important}
html.ios #tring{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important}
html.ios #miniLB{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important}
@media (max-height:560px) and (orientation:landscape){
  /* en pantallas bajas el marcador se pasaba abajo a la derecha, justo encima de SALTAR y ATACAR: se sube a la esquina */
  html.ios #miniLB{top:max(46px,calc(env(safe-area-inset-top,0px) + 42px))!important;bottom:auto!important}
}
html.ios #njUpd{top:max(8px,env(safe-area-inset-top,0px))}
/* botones táctiles: zona de toque 5 px más grande por cada lado (el dibujo no cambia, y nunca se pisan) */
html.ios #mctl .mbt::before,html.ios #mctl .mbx::before{content:"";position:absolute;inset:-5px;border-radius:50%}
html.ios #mctl .mbt,html.ios #mctl .mbx{-webkit-tap-highlight-color:transparent;touch-action:none;transition:transform .05s,box-shadow .05s,background .05s,border-color .05s}
/* aviso de pantalla completa */
#iosHint{position:fixed;left:50%;top:max(8px,env(safe-area-inset-top,0px));transform:translate(-50%,-140%);z-index:19000;display:flex;align-items:center;gap:10px;
  max-width:min(92vw,560px);padding:9px 12px 9px 14px;border-radius:16px;background:rgba(10,22,52,.96);border:2px solid #F0A91E;
  box-shadow:0 8px 26px rgba(0,0,0,.55);font:700 12px/1.35 Inter,-apple-system,system-ui,sans-serif;color:#fff;
  transition:transform .35s cubic-bezier(.2,.9,.3,1.1);pointer-events:auto}
#iosHint.on{transform:translate(-50%,0)}
#iosHint b{color:#FFD36B}
#iosHint button{flex:none;min-width:40px;min-height:40px;border-radius:12px;border:2px solid rgba(255,255,255,.45);background:rgba(255,255,255,.12);color:#fff;font:800 16px/1 Inter,sans-serif;padding:0}
`;
(document.head||root).appendChild(css);

/* ---------- Medida real de la pantalla (visualViewport) ---------- */
let lastW=0,lastH=0;
function medir(){
  const vv=window.visualViewport;
  return{w:Math.round(vv&&vv.width?vv.width:innerWidth),h:Math.round(vv&&vv.height?vv.height:innerHeight)};
}
function aplicarMedida(){
  const m=medir();
  root.style.setProperty('--app-h',m.h+'px');
  root.style.setProperty('--app-w',m.w+'px');
  root.style.setProperty('--vh',(m.h/100)+'px');
  return m;
}
function escribiendo(){
  const a=document.activeElement;
  return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='range'&&a.type!=='checkbox');
}
function sincronizar(){
  /* con el teclado abierto iOS reduce el área visible: no se reacomoda el juego mientras se escribe (se hace al cerrarlo) */
  if(escribiendo())return;
  const m=aplicarMedida();
  if(Math.abs(m.w-lastW)<2&&Math.abs(m.h-lastH)<2)return;
  lastW=m.w;lastH=m.h;
  try{window.scrollTo(0,0);}catch(e){}
  /* el resto del juego (lienzo, botones, aviso de girar) ya escucha 'resize': se le avisa con la medida correcta */
  window.dispatchEvent(new Event('resize'));
}
/* iOS entrega la medida correcta un instante DESPUÉS de girar o de cargar: se revisa varias veces */
function revisarVarias(){[60,200,450,900,1600].forEach(d=>setTimeout(sincronizar,d));}
aplicarMedida();
lastW=medir().w;lastH=medir().h;
window.addEventListener('orientationchange',revisarVarias);
window.addEventListener('pageshow',revisarVarias);
window.addEventListener('load',revisarVarias);
if(window.visualViewport){visualViewport.addEventListener('resize',sincronizar);}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)revisarVarias();});
document.addEventListener('focusout',()=>setTimeout(revisarVarias,150));   // al cerrar el teclado
revisarVarias();

/* ---------- Gestos que en iOS ignoran user-scalable=no ---------- */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
function desplazable(el){
  while(el&&el!==document.body&&el!==root){
    if(el.nodeType===1){
      const s=getComputedStyle(el);
      if((s.overflowY==='auto'||s.overflowY==='scroll')&&el.scrollHeight>el.clientHeight+1)return true;
      if((s.overflowX==='auto'||s.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+1)return true;
    }
    el=el.parentElement;
  }
  return false;
}
document.addEventListener('touchmove',e=>{
  const t=e.target;
  if(t&&t.type==='range')return;                                    // deslizadores de volumen/tamaño
  if(e.touches.length>1||!desplazable(t))e.preventDefault();         // sin rebote ni arrastre de la página; los menús con scroll siguen funcionando
},{passive:false});
document.addEventListener('contextmenu',e=>{const t=e.target;if(!(t&&/^(INPUT|TEXTAREA)$/.test(t.tagName)))e.preventDefault();});

/* ---------- Audio ---------- */
function desbloquearAudio(){
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(e){}
  try{
    if(typeof AC!=='undefined'&&AC&&AC.state!=='running'&&!(typeof _muted!=='undefined'&&_muted))AC.resume();
  }catch(e){}
}
['touchend','pointerup','click'].forEach(ev=>document.addEventListener(ev,desbloquearAudio,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(desbloquearAudio,200);});

/* ---------- Aviso discreto: instalar en pantalla de inicio (solo en Safari, no si ya es app) ---------- */
function mostrarAviso(){
  if(standalone())return;
  const KEY='ninja_ios_hint_v1',TRES_DIAS=3*864e5;
  try{const t=+localStorage.getItem(KEY)||0;if(Date.now()-t<TRES_DIAS)return;}catch(e){}
  let el=document.getElementById('iosHint');
  if(el)return;
  el=document.createElement('div');el.id='iosHint';
  el.setAttribute('role','status');
  el.innerHTML='<span>📲 Para jugar a <b>pantalla completa</b>: toca <b>Compartir</b> ⬆︎ y luego <b>“Añadir a pantalla de inicio”</b>.</span><button type="button" aria-label="Cerrar">✕</button>';
  document.body.appendChild(el);
  /* si el juego muestra su aviso de "versión nueva" arriba, este cartel se coloca justo debajo para que no se tapen */
  const acomodar=()=>{
    let top=Math.max(8,parseFloat(getComputedStyle(root).getPropertyValue('--sat'))||0);
    const u=document.getElementById('njUpd');
    if(u){
      const cs=getComputedStyle(u),r=u.getBoundingClientRect();
      if(cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity)>0.05&&r.height>0&&r.bottom>0)top=Math.max(top,Math.round(r.bottom+6));
    }
    el.style.top=top+'px';
  };
  acomodar();const vigia=setInterval(acomodar,400);
  const cerrar=()=>{clearInterval(vigia);el.classList.remove('on');try{localStorage.setItem(KEY,String(Date.now()));}catch(e){}setTimeout(()=>el.remove(),500);};
  el.querySelector('button').addEventListener('click',cerrar);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));
  setTimeout(cerrar,12000);
}
function programarAviso(){
  let intentos=0;
  const t=setInterval(()=>{
    intentos++;
    const jugando=typeof GS!=='undefined'&&GS&&GS.running;
    const horizontal=innerWidth>innerHeight;
    if(jugando||intentos>40){clearInterval(t);return;}
    if(horizontal){clearInterval(t);mostrarAviso();}
  },1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(programarAviso,4000));
else setTimeout(programarAviso,4000);

window.NinjaIOS={medir,sincronizar,standalone};
})();
