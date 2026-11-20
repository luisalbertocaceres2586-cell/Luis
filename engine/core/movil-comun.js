/* engine/core — Mejoras comunes para teléfonos y tablets (iPhone y Android)
   Solo actúa en pantallas táctiles. Para probar en otro equipo: ?movil=1. Para apagarlo: ?movil=0.

   - Sin "tirar para recargar" de Chrome/Android (con los gestos de bajar en el canvas recargaba la página a mitad de partida)
   - Sin selección de texto / menú al mantener pulsado, y el canvas no hace scroll ni zoom
   - Zona segura (notch, isla, esquinas) para pausa, marcador y timer; el marcador sube en pantallas bajas para no tapar SALTAR/ATACAR
   - Botón ▶ CONTINUAR en la pausa (en el teléfono no existe la tecla P)
   - Deslizar el dedo entre ◀ y ▶, pausa automática al salir de la app, pantalla encendida y guardia del gesto "atrás" */
(function(){
'use strict';
const Q=location.search;
if(/[?&]movil=0/.test(Q))return;
const UA=navigator.userAgent||'';
const iOS=/iP(hone|ad|od)/.test(UA)||(navigator.platform==='MacIntel'&&(navigator.maxTouchPoints||0)>1);
const android=/Android/i.test(UA);
const grueso=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
if(!iOS&&!android&&!grueso&&!/[?&]movil=1/.test(Q))return;

const root=document.documentElement;
root.classList.add('movil');

const css=document.createElement('style');
css.id='movilComunCss';
css.textContent=`
html.movil,html.movil body{overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
html.movil body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html.movil input,html.movil textarea{-webkit-user-select:text;user-select:text}
html.movil #c{touch-action:none}
/* los botones táctiles NO deben dejar que el navegador interprete scroll: si el pulgar se desliza unos píxeles, Chrome cancelaba el toque y el ninja se detenía solo */
html.movil #mctl .mbt,html.movil #mctl .mbx{touch-action:none!important}
/* zona de toque 5 px más grande por cada lado (el dibujo no cambia y los botones nunca se pisan) */
html.movil #mctl .mbt::before,html.movil #mctl .mbx::before{content:"";position:absolute;inset:-5px;border-radius:50%}
html.movil #pauseBtn{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important;top:max(5px,env(safe-area-inset-top,0px))!important}
html.movil #tring{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important}
html.movil #miniLB{right:max(8px,calc(env(safe-area-inset-right,0px) + 6px))!important}
@media (max-height:560px) and (orientation:landscape){
  html.movil #miniLB{top:max(46px,calc(env(safe-area-inset-top,0px) + 42px))!important;bottom:auto!important}
}
#pauseOverlay .njResume{margin-top:14px;min-width:min(70vw,260px);min-height:52px;padding:12px 22px;border-radius:12px;cursor:pointer;
  border:3px solid #FFD36B;background:linear-gradient(160deg,#1f9d4c,#0f6b33);color:#fff;
  font-family:'Press Start 2P',Inter,sans-serif;font-size:clamp(10px,2.2vw,14px);letter-spacing:.5px;
  box-shadow:0 6px 18px rgba(0,0,0,.5);touch-action:manipulation}
#pauseOverlay .njResume:active{transform:scale(.97)}
`;
(document.head||root).appendChild(css);

/* ---------- Botón CONTINUAR en la pausa ---------- */
function inyectarContinuar(){
  const ov=document.getElementById('pauseOverlay');
  if(!ov||ov.querySelector('.njResume'))return;
  const b=document.createElement('button');
  b.type='button';b.className='njResume';b.textContent='▶ CONTINUAR';
  b.addEventListener('click',e=>{e.stopPropagation();try{if(typeof togglePause==='function')togglePause();}catch(_){}});
  const sub=ov.querySelector('.pause-sub');
  if(sub){sub.textContent='TOCA CONTINUAR PARA SEGUIR';sub.after(b);}else ov.prepend(b);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inyectarContinuar);else inyectarContinuar();


/* ---------- Deslizar el dedo entre ◀ y ▶ sin levantarlo ----------
   Antes cada botón "se quedaba" con el dedo (setPointerCapture): para girar había que soltar y volver a tocar.
   Aquí, si el dedo que empezó en ◀ cruza hacia ▶ (o al revés), se suelta uno y se pulsa el otro reutilizando
   la lógica del juego (se le envían los mismos eventos de puntero), así que no se toca ningún código existente. */
(function(){
  const dedos=new Map();                 // pointerId -> 'mbL' | 'mbR'
  document.addEventListener('pointerdown',e=>{
    if(!e.isTrusted||e.pointerType!=='touch')return;
    const t=e.target&&e.target.closest?e.target.closest('#mbL,#mbR'):null;
    if(t)dedos.set(e.pointerId,t.id);
  },true);
  const soltar=e=>{if(e.isTrusted)dedos.delete(e.pointerId);};
  document.addEventListener('pointerup',soltar,true);
  document.addEventListener('pointercancel',soltar,true);
  document.addEventListener('pointermove',e=>{
    if(!e.isTrusted)return;
    const cur=dedos.get(e.pointerId);if(!cur)return;
    const box=document.getElementById('mctl');
    if(!box||box.classList.contains('edit'))return;            // en modo MOVER no se cambia nada
    const otroId=cur==='mbL'?'mbR':'mbL';
    const a=document.getElementById(cur),o=document.getElementById(otroId);
    if(!a||!o)return;
    const ra=a.getBoundingClientRect(),ro=o.getBoundingClientRect();
    const dA=Math.hypot(e.clientX-(ra.left+ra.width/2),e.clientY-(ra.top+ra.height/2));
    const dO=Math.hypot(e.clientX-(ro.left+ro.width/2),e.clientY-(ro.top+ro.height/2));
    if(dO<ro.width*0.6&&dO<dA){                                // el dedo ya está sobre el otro botón y más cerca de él
      const init={pointerId:e.pointerId,pointerType:'touch',isPrimary:e.isPrimary,clientX:e.clientX,clientY:e.clientY,bubbles:true,cancelable:true,composed:true};
      try{
        a.dispatchEvent(new PointerEvent('pointerup',init));
        o.dispatchEvent(new PointerEvent('pointerdown',init));
        dedos.set(e.pointerId,otroId);
      }catch(_){}
    }
  },true);
})();

/* ---------- Pausa automática al salir del juego ----------
   Llamada, otra app, bloqueo de pantalla o gesto del sistema: el juego se pausa y se sueltan las teclas virtuales
   (si no, el ninja seguía corriendo y el audio quedaba a medias). */
function autoPausa(){
  try{
    if(typeof K!=='undefined'&&K){K.ArrowLeft=0;K.ArrowRight=0;K.ArrowUp=0;K.KeyX=0;}
    if(typeof GS!=='undefined'&&GS&&GS.running&&typeof _paused!=='undefined'&&!_paused&&typeof togglePause==='function')togglePause();
  }catch(e){}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPausa();});
window.addEventListener('pagehide',autoPausa);

/* ---------- Pantalla encendida mientras se juega (iOS 16.4+) ---------- */
let wl=null,pidiendoWL=false;
async function pedirWL(){
  if(wl||pidiendoWL||document.hidden||!('wakeLock' in navigator))return;
  pidiendoWL=true;
  try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;});}catch(e){wl=null;}
  pidiendoWL=false;
}
function soltarWL(){try{if(wl)wl.release();}catch(e){}wl=null;}

/* ---------- Gesto "atrás" de Safari (deslizar desde el borde izquierdo) ----------
   El botón ◀ está pegado a ese borde: un deslizamiento sacaba al jugador de la página. Mientras se juega se
   guarda una entrada de historial; si el sistema intenta ir "atrás", se queda en el juego y se pausa. */
let atrasArmado=false;
function armarAtras(){
  if(atrasArmado)return;
  atrasArmado=true;
  try{history.pushState({nj:1},'',location.href);}catch(e){}
}
window.addEventListener('popstate',()=>{
  const jugando=typeof GS!=='undefined'&&GS&&GS.running;
  if(jugando){try{history.pushState({nj:1},'',location.href);}catch(e){}autoPausa();}
  else atrasArmado=false;           // en el menú el "atrás" funciona normal; se vuelve a proteger al empezar a jugar
});

/* ---------- Vigilante único (cada 1,5 s, muy liviano) ---------- */
setInterval(()=>{
  const jugando=typeof GS!=='undefined'&&GS&&GS.running;
  if(jugando){armarAtras();pedirWL();}
  else soltarWL();
},1500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&typeof GS!=='undefined'&&GS&&GS.running)setTimeout(pedirWL,300);});


window.NinjaMovil={autoPausa};
})();
