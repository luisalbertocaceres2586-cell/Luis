/* engine/core — Mejoras táctiles para las páginas de nivel (nivel2.html, nivel3.html)
   Son páginas aparte: no cargan el menú principal, así que no recibían las mejoras de iPhone/Android.
   Versión ligera de movil-comun.js. Apagar con ?movil=0 */
(function(){
'use strict';
if(/[?&]movil=0/.test(location.search))return;
const UA=navigator.userAgent||'';
const iOS=/iP(hone|ad|od)/.test(UA)||(navigator.platform==='MacIntel'&&(navigator.maxTouchPoints||0)>1);
const tactil=iOS||/Android/i.test(UA)||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
if(!tactil)return;
const root=document.documentElement;
root.classList.add('movil-nivel');

/* pantalla completa real bajo el notch (necesario para que valgan los env(safe-area-inset-*)) */
try{const m=document.querySelector('meta[name=viewport]');if(m&&!/viewport-fit/.test(m.content))m.content+=',viewport-fit=cover';}catch(e){}

const css=document.createElement('style');
css.textContent=`
html.movil-nivel,html.movil-nivel body{overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-text-size-adjust:100%}
html.movil-nivel body{-webkit-user-select:none;user-select:none}
html.movil-nivel canvas{touch-action:none}
html.movil-nivel button{touch-action:manipulation}
`;
(document.head||root).appendChild(css);
/* sin zoom por doble toque (solo si la página no definió ya su propio touch-action) */
function ta(){try{if(getComputedStyle(root).touchAction==='auto')root.style.touchAction='manipulation';}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ta);else ta();

/* iOS ignora user-scalable=no: se bloquea el pellizco y el rebote de la página (los menús con scroll siguen funcionando) */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
function desplazable(el){
  while(el&&el!==document.body&&el!==root){
    if(el.nodeType===1){const s=getComputedStyle(el);
      if((s.overflowY==='auto'||s.overflowY==='scroll')&&el.scrollHeight>el.clientHeight+1)return true;}
    el=el.parentElement;
  }
  return false;
}
document.addEventListener('touchmove',e=>{if(e.touches.length>1||!desplazable(e.target))e.preventDefault();},{passive:false});
document.addEventListener('contextmenu',e=>{const t=e.target;if(!(t&&/^(INPUT|TEXTAREA)$/.test(t.tagName)))e.preventDefault();});

/* pantalla encendida mientras la página está a la vista */
let wl=null,pidiendo=false;
async function pedir(){
  if(wl||pidiendo||document.hidden||!('wakeLock' in navigator))return;
  pidiendo=true;
  try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;});}catch(e){wl=null;}
  pidiendo=false;
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(pedir,300);});
['touchend','pointerup'].forEach(ev=>document.addEventListener(ev,pedir,{passive:true,once:true,capture:true}));
})();
