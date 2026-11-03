/* HERO PRO — reemplaza las animaciones de los dos héroes por las nuevas hojas de sprites.
   · Sakura (ninja rosa, assets/sakura/) y Kage (ninja rojo y negro, assets/kage/).
   · Cada héroe define en su manifest: run, sprint (dash / impulso), jump + jumpMap, crouch, idle, atk, hurt + hurtMap,
     kmul (corrección de tamaño por animación) y scale. Un manifest puede reutilizar el mismo archivo en varios grupos.
   · Idle/ataque/golpe/etc. que falten en un manifest siguen con el arte anterior.
   Desactivar: ?sakura=0 o ?kage=0 en la URL. */
(function(){
'use strict';
if(typeof NJX==='undefined')return;
const _prev=window._drawNinjaX;
const heroes=[
  {name:'Sakura',kind:'pink',man:'SAKURA_MANIFEST',base:'assets/sakura/',off:/[?&]sakura=0/},
  {name:'Kage',kind:'black',man:'KAGE_MANIFEST',base:'assets/kage/',off:/[?&]kage=0/}
];
const act={};                                           /* kind -> datos del héroe activo */
function install(h){
  const M=window[h.man],X=NJX[h.kind];
  if(!M||!X||h.off.test(location.search))return;
  const mk=l=>l.map(f=>({img:Object.assign(new Image(),{src:h.base+f.file}),ax:f.ax,ay:f.ay}));
  const run=mk(M.run),sprint=mk(M.sprint),jumpAll=mk(M.jump),crouch=mk(M.crouch)[0];
  const jump=M.jumpMap.map(i=>jumpAll[i]);
  const idle=M.idle?mk(M.idle):null,atk=M.atk?mk(M.atk):null,hurtAll=M.hurt?mk(M.hurt):null;
  const hurt=hurtAll?M.hurtMap.map(i=>hurtAll[i]):null;
  const all=run.concat(sprint,jumpAll,[crouch],idle||[],atk||[],hurtAll||[]);
  const KM=M.kmul||{};
  const K=()=>M.scale*X.refH/(46*1.30);                 /* escala relativa al tamaño del jugador */
  const Kg=g=>K()*(KM[g]||1);                           /* corrección por animación: todas las poses al mismo tamaño en pantalla */
  const d={on:false,sprint,crouch,Kg,X};act[h.kind]=d;
  function activate(){
    if(!all.every(f=>f.img.complete&&f.img.naturalWidth)){console.warn('['+h.name+'] faltan imágenes, se mantiene el arte anterior');return;}
    X.run=run;X.jump=jump;X.k=Object.assign({},X.k,{run:Kg('run'),jump:Kg('jump')});
    if(idle){X.idle=idle;X.k.idle=Kg('idle');}
    if(atk){X.atk=atk;X.k.atk=Kg('atk');}
    if(hurt){X.hurt=hurt;X.k.hurt=Kg('hurt');}
    d.on=true;if(window.FX&&FX.collect)FX.collect();
    console.log('['+h.name+'] animaciones nuevas activas ('+run.length+' cuadros de carrera)');
  }
  let left=all.length;
  all.forEach(f=>{const done=()=>{if(--left===0)activate();};
    if(f.img.complete&&f.img.naturalWidth)done();else{f.img.onload=done;f.img.onerror=done;}});
}
heroes.forEach(install);
function drawFr(d,fr,bx,by,effH,g){
  const S=(effH*1.30)/d.X.refH*d.Kg(g),w=fr.img.naturalWidth*S,h=fr.img.naturalHeight*S;
  CX.drawImage(fr.img,bx+P.w/2-fr.ax*S,by+P.h-fr.ay*S,w,h);
}
window._drawNinjaX=function(kind,bx,by,onGround,dxRun){
  const d=act[kind];
  if(d&&d.on){
    CX.imageSmoothingEnabled=true;CX.imageSmoothingQuality='high';
    let fr=null,effH=P.h,g='sprint';const sp=d.sprint;
    if(P._dashT>0){fr=sp[Math.min(sp.length-1,Math.floor((1-P._dashT/12)*sp.length))];}
    else if(P.crouching&&onGround&&!((P._meleeT||0)>0)){fr=d.crouch;g='crouch';effH=P._preCrouchH||P._baseH||46;}
    else if((P.speedBoost||P.rocketOn)&&onGround&&Math.abs(P.vx)>.5&&!((P._meleeT||0)>0)&&P.iframes<=60){
      const n=sp.length;fr=sp[Math.floor(_advanceRunPhase(n,dxRun)*n)%n];}
    if(fr){drawFr(d,fr,bx,by,effH,g);return true;}
  }
  return _prev.apply(this,arguments);
};
})();
