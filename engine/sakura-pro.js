/* SAKURA PRO — reemplaza las animaciones de la ninja rosa por las nuevas hojas de sprites (assets/sakura/).
   · Carrera: 14 cuadros   · Salto: 4 poses   · Sprint (dash / impulso): 5 cuadros   · Agachado: pose baja
   · Reposo: 6 cuadros   · Ataque: 7 cuadros (espada, shuriken, arco)   · Golpe recibido: 3 poses
   Disponibles sin usar aún: run2 (8), death (6) y extra (5).
   Desactivar: ?sakura=0 en la URL. */
(function(){
'use strict';
if(/[?&]sakura=0/.test(location.search))return;
if(typeof NJX==='undefined'||!NJX.pink||!window.SAKURA_MANIFEST)return;
const M=window.SAKURA_MANIFEST,X=NJX.pink,base='assets/sakura/';
const mk=l=>l.map(f=>{const img=new Image();img.src=base+f.file;return{img,ax:f.ax,ay:f.ay};});
const run=mk(M.run),sprint=mk(M.sprint),jumpAll=mk(M.jump),crouch=mk(M.crouch)[0];
const jump=M.jumpMap.map(i=>jumpAll[i]);
const idle=M.idle?mk(M.idle):null,atk=M.atk?mk(M.atk):null,hurtAll=M.hurt?mk(M.hurt):null;
const hurt=hurtAll?M.hurtMap.map(i=>hurtAll[i]):null;
const all=run.concat(sprint,jumpAll,[crouch],idle||[],atk||[],hurtAll||[]);
let active=false,left=all.length;
function K(){return M.scale*X.refH/(46*1.30);}      /* escala relativa al tamaño del jugador */
/* NORMALIZACIÓN DE TAMAÑO: cada animación viene dibujada con distinta altura en su hoja
   (reposo ≈249 px, carrera ≈203 px, ataque ≈192 px...). Se iguala la altura del cuerpo de todas
   a la de la carrera para que el personaje NO crezca ni se encoja al cambiar de animación. */
const _avgH=l=>l&&l.length?l.reduce((a,f)=>a+f.h,0)/l.length:0;
const REF_H=_avgH(M.run)||203;
const F=(l,mx)=>{const a=_avgH(l);return a?Math.min(mx||1.25,REF_H/a):1;};
const FI=F(M.idle),FA=F(M.atk),FJ=F(M.jump),FS=F(M.sprint),FH=F(M.hurt,1.10);
function activate(){
  if(!all.every(f=>f.img.complete&&f.img.naturalWidth)){console.warn('[Sakura] faltan imágenes, se mantiene el arte anterior');return;}
  X.run=run;X.jump=jump;X.k=Object.assign({},X.k,{run:K(),jump:K()*FJ});
  if(idle){X.idle=idle;X.k.idle=K()*FI;}
  if(atk){X.atk=atk;X.k.atk=K()*FA;}
  if(hurt){X.hurt=hurt;X.k.hurt=K()*FH;}
  active=true;if(window.FX&&FX.collect)FX.collect();
  console.log('[Sakura] animaciones nuevas activas ('+run.length+' cuadros de carrera)');
}
all.forEach(f=>{const d=()=>{if(--left===0)activate();};
  if(f.img.complete&&f.img.naturalWidth)d();else{f.img.onload=d;f.img.onerror=d;}});

function drawFr(fr,bx,by,effH,fk){
  const S=(effH*1.30)/X.refH*K()*(fk||1),w=fr.img.naturalWidth*S,h=fr.img.naturalHeight*S;
  CX.drawImage(fr.img,bx+P.w/2-fr.ax*S,by+P.h-fr.ay*S,w,h);
}
const _o=window._drawNinjaX;
window._drawNinjaX=function(kind,bx,by,onGround,dxRun){
  if(kind==='pink'&&active){
    CX.imageSmoothingEnabled=true;CX.imageSmoothingQuality='high';
    let fr=null,effH=P.h;
    if(P._dashT>0){fr=sprint[Math.min(sprint.length-1,Math.floor((1-P._dashT/12)*sprint.length))];}
    else if(P.crouching&&onGround&&!((P._meleeT||0)>0)){fr=crouch;effH=P._preCrouchH||P._baseH||46;}
    else if((P.speedBoost||P.rocketOn)&&onGround&&Math.abs(P.vx)>.5&&!((P._meleeT||0)>0)&&P.iframes<=60){
      const n=sprint.length;fr=sprint[Math.floor(_advanceRunPhase(n,dxRun)*n)%n];}
    if(fr){drawFr(fr,bx,by,effH,(fr===crouch)?1:FS);return true;}
  }
  return _o.apply(this,arguments);
};
})();
