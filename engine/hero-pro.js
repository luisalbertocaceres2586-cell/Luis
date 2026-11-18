/* Renderiza las animaciones de Sakura Eve y de Antarez (antes Kage). Mismo sistema para ambos.
   Antarez: 3 katanas (Honō fuego, Raiden rayo, Kaze viento). Cambiar con la tecla Q o con el botón redondo. */
(function(){
'use strict';
if(typeof NJX==='undefined')return;
const _prev=window._drawNinjaX;
const heroes=[
  {name:'Sakura Eve',kind:'pink',man:'SAKURA_EVE_MANIFEST',base:'assets/characters/sakura_assets/sakura/',off:/[?&]sakura=0/},
  {name:'Antarez',kind:'black',man:'KAGE_MANIFEST',base:'assets/characters/kage/',off:/[?&]kage=0/}
];
const act={};
function installLegacy(h,M,X){
  const mk=l=>l.map(f=>({img:Object.assign(new Image(),{src:h.base+f.file}),ax:f.ax,ay:f.ay}));
  const run=mk(M.run),sprint=mk(M.sprint),jumpAll=mk(M.jump),crouch=mk(M.crouch)[0];
  const jump=M.jumpMap.map(i=>jumpAll[i]);
  const idle=M.idle?mk(M.idle):null,atk=M.atk?mk(M.atk):null,hurtAll=M.hurt?mk(M.hurt):null;
  const hurt=hurtAll?M.hurtMap.map(i=>hurtAll[i]):null;
  const all=run.concat(sprint,jumpAll,[crouch],idle||[],atk||[],hurtAll||[]);
  const KM=M.kmul||{};
  const K=()=>M.scale*X.refH/(46*1.30);
  const Kg=g=>K()*(KM[g]||1);
  const d={on:false,sprint,crouch,Kg,X};act[h.kind]=d;
  function activate(){
    if(!all.every(f=>f.img.complete&&f.img.naturalWidth)){console.warn('['+h.name+'] faltan imágenes, se mantiene el arte anterior');return;}
    X.run=run;X.jump=jump;X.k=Object.assign({},X.k,{run:Kg('run'),jump:Kg('jump')});
    if(idle){X.idle=idle;X.k.idle=Kg('idle');}
    if(atk){X.atk=atk;X.k.atk=Kg('atk');}
    if(hurt){X.hurt=hurt;X.k.hurt=Kg('hurt');}
    d.on=true;if(window.FX&&FX.collect)FX.collect();
  }
  let left=all.length;
  all.forEach(f=>{const done=()=>{if(--left===0)activate();};
    if(f.img.complete&&f.img.naturalWidth)done();else{f.img.onload=done;f.img.onerror=done;}});
}
function installSakura(h,M,X){
  const cache=new Map(),animations={};
  Object.keys(M.animations).forEach(name=>{
    const source=M.animations[name];
    animations[name]={fps:source.fps,loop:source.loop,frames:source.frames.map(f=>{
      let img=cache.get(f.file);
      if(!img){img=new Image();img.src=M.base+f.file;cache.set(f.file,img);}
      return {img,ax:f.ax,ay:f.ay,s:f.s||1,file:f.file};
    })};
  });
  const KM=M.kmul||{};
  const K=()=>M.scale*X.refH/(46*1.30);
  const Kg=name=>K()*(KM[name]||1);
  const d={on:false,animations,Kg,X,M,groundOffset:(M.groundOffset===undefined?5:M.groundOffset),state:'',stateStart:0,lastGrounded:null,landUntil:0,crouching:false,crouchUntil:0};
  act[h.kind]=d;
  const images=Array.from(cache.values());let left=images.length,failed=false;
  function activate(){
    if(failed){console.warn('['+h.name+'] faltan imágenes, se mantiene el arte anterior');return;}
    const atk=animations.melee||animations.melee_hono;
    X.run=animations.run.frames;X.jump=M.jumpMap.map(i=>animations.jump.frames[i]);
    X.idle=animations.idle.frames;X.atk=atk.frames;X.hurt=animations.hurt.frames;
    X.k=Object.assign({},X.k,{run:Kg('run'),jump:Kg('jump'),idle:Kg('idle'),atk:Kg('atk'),hurt:Kg('hurt')});
    d.on=true;if(window.FX&&FX.collect)FX.collect();
    if(M.katanas)initKatanas(h,M,d);
    console.log('['+h.name+'] animaciones activas ('+Object.keys(animations).length+' secuencias, '+images.length+' imágenes)');
  }
  images.forEach(img=>{
    const done=()=>{if(--left===0)activate();};
    if(img.complete){if(!img.naturalWidth)failed=true;done();}
    else{img.addEventListener('load',done,{once:true});img.addEventListener('error',()=>{failed=true;done();},{once:true});}
  });
}
/* ── Katanas de Antarez ── */
function initKatanas(h,M,d){
  const KT=M.katanas,order=['hono','raiden','kaze'];
  const A=window.ANTAREZ={
    katana:'hono',order,data:KT,
    // Todas desbloqueadas para probar. Para bloquear: ANTAREZ.unlocked.raiden=false (y llamar ANTAREZ.unlock('raiden') al recoger el fragmento)
    unlocked:{hono:true,raiden:true,kaze:true},
    meleeName(onGround){return (onGround?'melee_':'melee_air_')+this.katana;},
    set(k){if(!KT[k]||!this.unlocked[k])return false;this.katana=k;apply(true);return true;},
    next(){const i=order.indexOf(this.katana);
      for(let n=1;n<=order.length;n++){const k=order[(i+n)%order.length];if(this.unlocked[k]){this.set(k);return k;}}
      return this.katana;},
    unlock(k){if(KT[k]){this.unlocked[k]=true;try{spawnTfx(P.x-camX,P.y-50,KT[k].icon+' ¡'+KT[k].name+' DESBLOQUEADA!',KT[k].colors[0],'clamp(11px,2.2vw,16px)');}catch(e){}}}
  };
  const nj=(typeof NJ!=='undefined')?NJ[h.kind]:null;
  let btn=null;
  function apply(announce){
    const k=KT[A.katana];
    if(nj)nj.ribbonColors=k.colors;                     // partículas, ondas y kunais toman el color de la katana
    if(btn){btn.textContent=k.icon;btn.style.borderColor=k.colors[0];btn.style.boxShadow='0 0 12px '+k.colors[0];}
    if(announce){try{spawnTfx(P.x-camX,P.y-34,k.icon+' '+k.name,k.colors[0],'clamp(11px,2.2vw,16px)');spawnPfx(P.x-camX+P.w/2,P.y+P.h/2,k.colors[0],8);}catch(e){}}
  }
  const isAntarez=()=>typeof GS!=='undefined'&&GS.running&&GS.char==='peach';
  document.addEventListener('keydown',e=>{
    if(e.repeat||!isAntarez()||(typeof AQ!=='undefined'&&AQ))return;
    if(e.code==='KeyQ')A.next();
    else if(e.code==='Digit1')A.set('hono');
    else if(e.code==='Digit2')A.set('raiden');
    else if(e.code==='Digit3')A.set('kaze');
  });
  const mount=()=>{
    btn=document.createElement('button');btn.id='antKatana';btn.type='button';btn.setAttribute('aria-label','Cambiar katana');
    btn.style.cssText='position:fixed;right:12px;top:44%;z-index:60;width:48px;height:48px;border-radius:50%;border:2px solid #FF8A1F;background:rgba(5,8,40,.65);font-size:22px;line-height:1;display:none;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer';
    btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(isAntarez())A.next();});
    document.body.appendChild(btn);apply(false);
    setInterval(()=>{btn.style.display=isAntarez()?'block':'none';},300);
  };
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
}
heroes.forEach(h=>{
  if(h.off.test(location.search))return;
  const M=window[h.man],X=NJX[h.kind];if(!M||!X)return;
  if(M.animations)installSakura(h,M,X);else installLegacy(h,M,X);
});
function drawFr(d,fr,bx,by,effH,name,onGround){
  const S=(effH*1.30)/d.X.refH*d.Kg(name)*(fr.s||1),w=fr.img.naturalWidth*S,h=fr.img.naturalHeight*S;
  const groundOffset=onGround?d.groundOffset:0;
  CX.drawImage(fr.img,bx+P.w/2-fr.ax*S,by+P.h+groundOffset-fr.ay*S,w,h);
}
function selectFrame(d,name,progress,now){
  const anim=d.animations[name];if(!anim||!anim.frames.length)return null;
  if(d.state!==name){d.state=name;d.stateStart=now;}
  const count=anim.frames.length;
  let index=progress===undefined?Math.floor((now-d.stateStart)*anim.fps):Math.floor(Math.max(0,Math.min(.999999,progress))*count);
  if(anim.loop)index%=count;else index=Math.min(count-1,index);
  return anim.frames[index];
}
function sakuraState(d,onGround,now){
  if(d.lastGrounded===false&&onGround)d.landUntil=now+.15;
  d.lastGrounded=onGround;
  if(typeof GS!=='undefined'&&GS.doneFired)return ['win'];
  if(typeof GS!=='undefined'&&GS.dying)return ['death'];
  if(P.iframes>60)return ['hurt'];
  if((P._specialT||0)>0)return ['special',1-P._specialT/36];
  if((P._kunaiT||0)>0)return ['kunai',1-P._kunaiT/24];
  if((P._meleeT||0)>0){
    let nm='melee';
    if(window.ANTAREZ&&d.M&&d.M.katanas){nm=ANTAREZ.meleeName(onGround);if(!d.animations[nm])nm=ANTAREZ.meleeName(true);}
    return [nm,1-P._meleeT/MELEE_DUR];
  }
  if(P._dashT>0)return ['dash'];
  if(P.crouching&&onGround){
    if(!d.crouching){d.crouching=true;d.crouchUntil=now+2/12;}
    if(now<d.crouchUntil)return ['crouch_enter'];
    if(Math.abs(P.vx)>3.5)return ['slide'];
    if(Math.abs(P.vx)>.5)return ['crawl'];
    return ['crouch'];
  }
  d.crouching=false;
  if(!onGround){
    if(P.lowGrav&&P.vy>0)return ['glide'];
    return [P.vy<0?'jump_rise':'jump_fall'];
  }
  if(now<d.landUntil)return ['land'];
  if(Math.abs(P.vx)>.5)return [Math.abs(P.vx)<3.5?'walk':'run'];
  return ['idle'];
}
window._drawNinjaX=function(kind,bx,by,onGround,dxRun){
  const d=act[kind];
  if(d&&d.on){
    // Antarez: X lanza dos kunais a la vez (lógica de Kage) pero no activaba animación: se dispara aquí al detectar el disparo.
    if(kind==='black'&&typeof K!=='undefined'&&typeof _spreadCooldown!=='undefined'){
      const x=!!K.KeyX;
      if(x&&!d._xw&&_spreadCooldown>=28&&!(P._kunaiT>0))P._kunaiT=24;
      d._xw=x;
    }
    const now=performance.now()/1000;
    const [name,progress]=sakuraState(d,onGround,now),fr=selectFrame(d,name,progress,now);
    if(fr&&fr.img.complete&&fr.img.naturalWidth){
      const effH=name.indexOf('crouch')===0||name==='crawl'||name==='slide'?(P._preCrouchH||P._baseH||46):P.h;
      const smooth=CX.imageSmoothingEnabled,quality=CX.imageSmoothingQuality;
      CX.imageSmoothingEnabled=true;CX.imageSmoothingQuality='high';
      drawFr(d,fr,bx,by,effH,name,onGround);
      CX.imageSmoothingEnabled=smooth;CX.imageSmoothingQuality=quality;
      return true;
    }
  }
  return _prev.apply(this,arguments);
};
})();
