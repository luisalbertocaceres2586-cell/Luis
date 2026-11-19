/* MOBILE FIX — controles táctiles
   1) El botón ⬆ llamaba a doJump() directamente, sin comprobar el suelo (el teclado sí pasa por el control de suelo + tiempo de gracia).
      Resultado: se podía saltar infinitas veces en el aire ("volar"). Ahora el toque se convierte en una pulsación de la tecla de salto,
      con exactamente las mismas reglas que el teclado (salto desde el suelo, mantener = más alto, soltar = más bajo).
   2) Botones más pequeños para que no tapen el juego.
   Desactivar: ?mfix=0 en la URL. */
(function(){
'use strict';
if(/[?&]mfix=0/.test(location.search))return;
const mobileStyle=document.createElement('style');mobileStyle.textContent=`
@media(max-width:379px){
  #qpanel{width:96vw;padding:6px 6px 8px;top:48px}
  #qexpr{font-size:clamp(14px,5vw,19px)}
  #agrid{gap:5px}
  .ans{padding:9px 2px;font-size:clamp(10px,4vw,14px)}
  .card,.lbcard{padding:12px;gap:8px}
  .pbtn{letter-spacing:0;padding:9px 5px}
  #fxVolumeControl{font-size:6px;gap:6px}
  #mctl{--mbs:clamp(46px,12vh,56px)}
}
`;document.head.appendChild(mobileStyle);
function vibrate(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(e){}}
window.NinjaHaptics={
  tap(){vibrate(18);},
  correct(){vibrate([18,30,24]);},
  error(){vibrate([45,25,55]);},
  dash(){vibrate(28);}
};
document.addEventListener('pointerdown',e=>{
  if(e.target&&e.target.closest&&e.target.closest('#mctl .mbt,#mctl .mbx'))window.NinjaHaptics.tap();
},true);
document.addEventListener('click',e=>{
  const answer=e.target&&e.target.closest?e.target.closest('#agrid .ans'):null;
  if(answer)window.NinjaHaptics[answer.classList.contains('ok')?'correct':'error']();
});
const canvas=document.getElementById('c'),swipes=new Map();let dashTimer=0;
function gameActive(){return typeof GS!=='undefined'&&GS.running&&!GS.dying&&!(typeof _paused!=='undefined'&&_paused);}
if(canvas){
  canvas.addEventListener('pointerdown',e=>{if(gameActive())swipes.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  addEventListener('pointerup',e=>{
    const start=swipes.get(e.pointerId);if(!start)return;swipes.delete(e.pointerId);
    const dx=e.clientX-start.x,dy=e.clientY-start.y,threshold=Math.max(68,innerWidth*.12);
    if(gameActive()&&Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.3&&typeof K!=='undefined'){
      K['ShiftLeft']=1;window.NinjaHaptics.dash();clearTimeout(dashTimer);
      dashTimer=setTimeout(()=>{if(typeof K!=='undefined')K['ShiftLeft']=0;},180);
    }
  },{passive:true});
  addEventListener('pointercancel',e=>swipes.delete(e.pointerId),{passive:true});
}
if(typeof doJump!=='function'||typeof update!=='function'||typeof K==='undefined')return;
let inUpd=false,downAt=0,relT=0,held=false;
const _u=window.update;
window.update=function(){inUpd=true;try{return _u.apply(this,arguments);}finally{inUpd=false;}};
function touchJump(){
  held=true;downAt=performance.now();K['Space']=1;    /* toque: se comporta como tecla */
  clearTimeout(relT);relT=setTimeout(release,700);   /* seguridad: nunca queda "pegada" */
}
const _j=window.doJump;
window.doJump=function(){
  if(inUpd)return _j.apply(this,arguments);          /* llamada legítima desde la física (suelo/coyote/buffer) */
  touchJump();                                        /* llamada directa (versiones antiguas del botón) */
};
/* El botón ⬆ actual ya presiona la flecha ↑ (salto solo desde el suelo). Aquí solo se garantiza una pulsación mínima de
   ~190 ms (11 cuadros = todo el impulso extra) para que un toque rápido dé el salto completo (el salto variable corta el salto al soltar el botón). */
addEventListener('pointerdown',e=>{if(e.target&&e.target.id==='mbJ')touchJump();},true);
function release(){
  if(!held)return;const wait=Math.max(0,190-(performance.now()-downAt));   /* mínimo ~9 cuadros (un toque = salto casi completo) para que la física vea el toque */
  clearTimeout(relT);relT=setTimeout(()=>{K['Space']=0;held=false;},wait);
}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>addEventListener(ev,e=>{if(e.target&&e.target.id==='mbJ')release();},true));
addEventListener('blur',()=>{K['Space']=0;held=false;});
/* El tamaño de los botones lo controla ahora engine/ui/controles-tactiles-extra.js (🧩 MEJORAS → tamaño). */
})();
