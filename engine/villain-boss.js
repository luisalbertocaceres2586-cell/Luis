/* VILLAIN BOSS — el Mago del Caos como jefe final (nivel "El Trono del Caos Final").
   Sustituye el sprite estático del jefe 7 por su ciclo de caminata (assets/characters/villain/): pasea de lado a lado frente al jugador,
   con aura morada; al estar herido (≤ mitad de vida) se tiñe de rojo. La lógica de combate, vida y preguntas no cambia.
   Desactivar: ?villain=0 en la URL. */
(function(){
'use strict';
if(/[?&]villain=0/.test(location.search))return;
if(!window.VILLAIN_MANIFEST||typeof SPR==='undefined')return;
window.VILLAIN_NAME=window.VILLAIN_NAME||'REY DEL CAOS';   /* nombre que usa el juego ("¡EL REY DEL CAOS DESPIERTA!") */
const VB=window.VillainBoss={last:null};                   /* última posición dibujada: la usan las cinemáticas */
const M=VILLAIN_MANIFEST,base='assets/characters/villain/';
const all=M.walk.map(f=>({img:Object.assign(new Image(),{src:base+f.file}),ax:f.ax,ay:f.ay}));
const loop=all.slice(5);                       /* cuadros 5–24 = ciclo de caminata continuo (0–4 son el arranque) */
const tint=new WeakMap();
function hurtVariant(f){
  let c=tint.get(f);if(c)return c;const im=f.img;c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(255,40,40,.38)';x.fillRect(0,0,c.width,c.height);
  tint.set(f,c);return c;
}
const frame=()=>loop[Math.floor(performance.now()/62)%loop.length];
function mkProxy(hurt){
  const p={__villain:true,hurt};
  Object.defineProperty(p,'complete',{get(){return true;}});
  Object.defineProperty(p,'naturalWidth',{get(){return frame().img.naturalWidth;}});
  Object.defineProperty(p,'naturalHeight',{get(){return frame().img.naturalHeight;}});
  return p;
}
function activate(){
  if(!all.every(f=>f.img.complete&&f.img.naturalWidth)){console.warn('[Villano] faltan imágenes, se mantiene el jefe original');return;}
  const _di=CanvasRenderingContext2D.prototype.drawImage,pN=mkProxy(false),pH=mkProxy(true);
  CanvasRenderingContext2D.prototype.drawImage=function(img,dx,dy,dw,dh){
    if(img&&img.__villain){
      const f=frame(),s=dh/f.img.naturalHeight,t=performance.now(),ph=t*.0011,pace=Math.sin(ph)*40,dir=Math.cos(ph)>=0?1:-1;
      const cxp=dx+dw/2+pace,feet=dy+dh;
      VB.last={x:cxp,feet:feet,dh:dh,s:s,dir:dir,f:f,t:t};
      this.save();
      this.globalCompositeOperation='lighter';
      const r=dh*.75,g=this.createRadialGradient(cxp,feet-dh*.5,0,cxp,feet-dh*.5,r);
      g.addColorStop(0,'rgba(150,40,255,'+(.38+.12*Math.sin(t*.005))+')');g.addColorStop(1,'rgba(150,40,255,0)');
      this.fillStyle=g;this.fillRect(cxp-r,feet-dh*.5-r,r*2,r*2);
      this.globalCompositeOperation='source-over';
      this.translate(cxp,0);if(dir<0)this.scale(-1,1);
      _di.call(this,img.hurt?hurtVariant(f):f.img,-f.ax*s,feet-f.ay*s,f.img.naturalWidth*s,f.img.naturalHeight*s);
      this.restore();return;
    }
    return _di.apply(this,arguments);
  };
  SPR.boss_7_normal=pN;SPR.boss_7_herido=pH;
  console.log('[Villano] Mago del Caos activo como jefe final');
}
let left=all.length;
all.forEach(f=>{const d=()=>{if(--left===0)activate();};if(f.img.complete&&f.img.naturalWidth)d();else{f.img.onload=d;f.img.onerror=d;}});
})();
