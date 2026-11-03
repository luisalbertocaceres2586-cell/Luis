/* engine/movimiento — Caída rápida
   Mantén ⬇ (S o el botón ⬇ táctil) en el aire para caer más rápido y aterrizar justo donde quieres. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'caida-rapida',carpeta:'movimiento',nombre:'Caída rápida (⬇ en el aire)',
 desc:'Mantén ⬇ en el aire para caer más rápido y caer exacto sobre una plataforma o enemigo.',
 init(){
  NinjaMods.before('update',function(){
    if(typeof P==='undefined'||!P||!P.alive||typeof GS==='undefined'||!GS.running)return;
    if(typeof _skyZone!=='undefined'&&_skyZone)return;
    if(P.onGround||P.vy<-1)return;
    if(K['ArrowDown']||K['KeyS'])P.vy=Math.max(P.vy,Math.min(P.vy+0.55,19));   // solo acelera: nunca frena una caída ya rápida
  });
 }});
})();
