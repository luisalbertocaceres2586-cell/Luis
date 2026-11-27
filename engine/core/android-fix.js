/* engine/core — Respuesta háptica para Android (Chrome / Samsung Internet)
   Solo actúa en Android. Para probar en otro equipo: ?android=1. Para apagarlo: ?android=0.

   Antes: 18 ms iguales en CUALQUIER botón, sin forma de apagarla.
   Ahora:
   - Cada evento real del juego tiene su propio "golpe": saltar, aterrizar, atacar, moneda, acierto, error,
     explosión, caer, nivel superado… Se enlazan a los mismos sonidos (SFX), así que vibra EXACTAMENTE cuando
     algo ocurre (no cuando solo se toca el botón: si el salto no se hace, no vibra).
   - Toda la vibración del juego (poderes, jefes, daño, secretos) pasa por un solo control:
     FUERTE / SUAVE / APAGADA, guardado en el teléfono y con botón en el menú de pausa.
   - Funciona aunque el sonido esté silenciado (así se puede jugar en clase sin ruido y sentir el juego). */
(function(){
'use strict';
const Q=location.search;
if(/[?&]android=0/.test(Q))return;
const esAndroid=/Android/i.test(navigator.userAgent||'');
if(!esAndroid&&!/[?&]android=1/.test(Q))return;

document.documentElement.classList.add('android');

/* ---------- Control central ---------- */
const KEY='ninja_haptics';
const MODOS=['fuerte','suave','off'];
let modo='fuerte';
try{const v=localStorage.getItem(KEY);if(MODOS.indexOf(v)>=0)modo=v;}catch(e){}

const nativo=(navigator.vibrate&&navigator.vibrate.bind)?navigator.vibrate.bind(navigator):null;
const escala=()=>modo==='suave'?0.55:1;
function escalar(p){
  if(Array.isArray(p))return p.map((x,i)=>i%2===0?Math.max(4,Math.round(x*escala())):x);   // solo las vibraciones; las pausas no cambian
  return Math.max(4,Math.round((+p||0)*escala()));
}
function vib(p){
  if(!nativo||modo==='off')return false;
  if(p===0||(Array.isArray(p)&&!p.length))return nativo(0);                                  // "parar" siempre pasa
  try{return nativo(escalar(p));}catch(e){return false;}
}
/* Todo lo que ya llamaba navigator.vibrate (poderes, jefes, daño, secretos, rumble) queda bajo el mismo control */
if(nativo){
  try{Object.defineProperty(navigator,'vibrate',{value:function(p){return vib(p);},configurable:true,writable:true});}catch(e){}
}

/* ---------- Golpes por evento (ms de vibración, pausa, vibración…) ---------- */
const GOLPES={
  jump:10,
  land:6,
  coin:6,
  attack:16,
  correct:[14,30,22],
  wrong:[40,30,55],
  explode:[30,20,45],
  die:[70,40,110],
  clear:[20,40,20,40,70],
  win:[20,40,20,40,20,40,90],
  combo:[10,20,16],
  life:[14,24,14,24,32]
};
function enlazarSFX(){
  if(typeof SFX==='undefined'||!SFX||SFX.__haptica)return typeof SFX!=='undefined'&&!!SFX&&!!SFX.__haptica;
  Object.keys(GOLPES).forEach(k=>{
    const f=SFX[k];
    if(typeof f!=='function')return;
    SFX[k]=function(){
      try{vib(GOLPES[k]);}catch(e){}
      return f.apply(this,arguments);
    };
  });
  SFX.__haptica=1;
  return true;
}

/* El juego trae su propia capa (mobile-fix.js: 18 ms en cualquier botón y en cada respuesta).
   Se sustituye por una más fina para que no se pisen: un "tic" mínimo al tocar y el resto lo dicen los eventos. */
function reemplazarCapaVieja(){
  window.NinjaHaptics={
    tap(){vib(5);},
    correct(){},      // ya lo hace SFX.correct
    error(){},        // ya lo hace SFX.wrong
    dash(){vib(14);}
  };
}

function iniciar(){
  reemplazarCapaVieja();
  let n=0;
  const t=setInterval(()=>{if(enlazarSFX()||++n>20)clearInterval(t);},250);   // por si algún módulo carga después
}
if(document.readyState==='complete')iniciar();else window.addEventListener('load',iniciar);

/* ---------- Botón en el menú de pausa ---------- */
const ROT={fuerte:'📳 VIBRACIÓN: FUERTE',suave:'📳 VIBRACIÓN: SUAVE',off:'📴 VIBRACIÓN: APAGADA'};
function pintar(b){b.textContent=ROT[modo];}
function inyectarBoton(){
  if(!nativo)return;
  const ov=document.getElementById('pauseOverlay');
  if(!ov||document.getElementById('njHapBtn'))return;
  const b=document.createElement('button');
  b.id='njHapBtn';b.type='button';
  b.style.cssText="margin-top:10px;background:linear-gradient(160deg,rgba(0,20,60,.9),rgba(0,10,42,.95));border:2px solid rgba(0,180,255,.5);border-radius:8px;padding:10px 16px;min-height:44px;color:#FFF;font-family:var(--nj-font-display);font-size:clamp(9px,1.6vw,12px);cursor:pointer;touch-action:manipulation";
  pintar(b);
  b.addEventListener('click',e=>{
    e.stopPropagation();
    modo=MODOS[(MODOS.indexOf(modo)+1)%MODOS.length];
    try{localStorage.setItem(KEY,modo);}catch(_){}
    pintar(b);
    vib([30,40,30]);                       // muestra de la intensidad elegida (no suena si está apagada)
  });
  const mute=document.getElementById('btnMutePause');
  if(mute)mute.after(b);else ov.appendChild(b);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inyectarBoton);else inyectarBoton();

window.NinjaAndroid={vib,modo:()=>modo,GOLPES};
})();
