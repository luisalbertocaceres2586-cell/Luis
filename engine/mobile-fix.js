/* MOBILE FIX — controles táctiles
   1) El botón ⬆ llamaba a doJump() directamente, sin comprobar el suelo (el teclado sí pasa por el control de suelo + tiempo de gracia).
      Resultado: se podía saltar infinitas veces en el aire ("volar"). Ahora el toque se convierte en una pulsación de la tecla de salto,
      con exactamente las mismas reglas que el teclado (salto desde el suelo, mantener = más alto, soltar = más bajo).
   2) Botones más pequeños para que no tapen el juego.
   Desactivar: ?mfix=0 en la URL. */
(function(){
'use strict';
if(/[?&]mfix=0/.test(location.search))return;
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
   ~150 ms para que un toque rápido dé un salto casi completo (el salto variable corta el salto al soltar el botón). */
addEventListener('pointerdown',e=>{if(e.target&&e.target.id==='mbJ')touchJump();},true);
function release(){
  if(!held)return;const wait=Math.max(0,150-(performance.now()-downAt));   /* mínimo ~9 cuadros (un toque = salto casi completo) para que la física vea el toque */
  clearTimeout(relT);relT=setTimeout(()=>{K['Space']=0;held=false;},wait);
}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>addEventListener(ev,e=>{if(e.target&&e.target.id==='mbJ')release();},true));
addEventListener('blur',()=>{K['Space']=0;held=false;});
/* El tamaño de los botones lo controla ahora engine/ui/controles-tactiles-extra.js (🧩 MEJORAS → tamaño). */
})();
