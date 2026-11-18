/* Renderiza las animaciones de Sakura Eve y de Antarez (antes Kage). Mismo sistema para ambos.
   Antarez: 3 katanas (Honō fuego, Raiden rayo, Kaze viento). Cambiar con la tecla Q o con el botón redondo. */
(function(){
'use strict';
if(typeof NJX==='undefined')return;
const _prev=window._drawNinjaX;
const heroes=[
  {name:'Sakura Eve',kind:'pink',man:'SAKURA_EVE_MANIFEST',base:'assets/characters/sakura_assets/sakura/',off:/[?&]sakura=0/},
  {name:'Antarez',kind:'black',man:'ANTAREZ_MANIFEST',fallback:'KAGE_MANIFEST',base:'assets/characters/kage/',off:/[?&](kage|antarez)=0/}
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
  const d={on:false,animations,Kg,X,M,groundOffset:(M.groundOffset===undefined?5:M.groundOffset),state:'',stateStart:0,lastGrounded:null,landUntil:0,crouching:false,crouchUntil:0,
    used:new Set(),phase:0,wall:0,glideOn:false,glideLeft:84,maxFall:0,peakUp:1,prevVy:0,wallJumpUntil:0,foldUntil:0,landStart:0,landDur:.16,airStart:0,djAt:0,djSeen:false,wasGlide:false,glideAt:0,combatUntil:0,katanaFx:0,landHard:false};
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
    set(k){if(!KT[k]||!this.unlocked[k])return false;const ch=this.katana!==k;this.katana=k;apply(true);if(ch&&d.M.fluid)d.katanaFx=performance.now()/1000+.45;return true;},
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
  const M=window[h.man]||(h.fallback&&window[h.fallback]),X=NJX[h.kind];if(!M||!X)return;
  if(M.animations)installSakura(h,M,X);else installLegacy(h,M,X);
});
function drawFr(d,fr,bx,by,effH,name,onGround){
  const S=(effH*1.30)/d.X.refH*d.Kg(name)*(fr.s||1),w=fr.img.naturalWidth*S,h=fr.img.naturalHeight*S;
  const groundOffset=onGround?d.groundOffset:0;
  CX.drawImage(fr.img,bx+P.w/2-fr.ax*S,by+P.h+groundOffset-fr.ay*S,w,h);
}
function selectFrame(d,name,progress,now,forceIdx){
  const anim=d.animations[name];if(!anim||!anim.frames.length)return null;
  if(d.state!==name){d.state=name;d.stateStart=now;}
  const count=anim.frames.length;
  let index;
  if(forceIdx!==undefined)index=Math.max(0,Math.min(count-1,forceIdx));
  else{
    index=progress===undefined?Math.floor((now-d.stateStart)*anim.fps):Math.floor(Math.max(0,Math.min(.999999,progress))*count);
    if(anim.loop)index%=count;else index=Math.min(count-1,index);
  }
  const fr=anim.frames[index];
  if(fr&&d.used)d.used.add(fr.file);
  return fr;
}
/* ── Movimiento fluido (Sakura): usa TODOS los fotogramas de las 10 hojas ──
   · caminar/correr: el fotograma avanza según la distancia recorrida (los pies no patinan)
   · salto: preparación (1-2) → subida por velocidad (3-6) → caída (7-9) → caída libre (planeo 9-10)
   · doble salto → mantener salto = planeo con capa (planeo 1-3, 4-8) y al soltar pliega la capa (9-10)
   · pared: agarrarse (1-3), resbalar (4-5), trepar (6-8), salto de pared (9-10)
   Se desactivan las mecánicas con ?paredes=0 y ?planeo=0 (los fotogramas siguen usándose). */
const WALK_PX=5.2,RUN_PX=6.5,GLIDE_MAX=84,WALL_SLIDE=2.3,WALLJUMP_T=.22;
const kat=()=>window.ANTAREZ?ANTAREZ.katana:null;
const isAnt=d=>!!(d.M&&d.M.katanas);
/* variante por katana: special_hono, dash_raiden, idle_kaze… (si no existe, se usa la animación base) */
const variant=(d,name)=>{const k=kat();return k&&d.animations[name+'_'+k]?name+'_'+k:name;};
const noWall=/[?&]paredes=0/.test(location.search),noGlide=/[?&]planeo=0/.test(location.search);
const clamp01=v=>v<0?0:v>1?1:v;
function wallSide(dir){
  if(!dir||P.crouching||typeof platforms==='undefined')return 0;
  const x=dir>0?P.x+P.w:P.x,sky=(typeof _skyZone!=='undefined')&&_skyZone;
  for(let i=0;i<platforms.length;i++){
    const pl=platforms[i];
    if(pl.isSkyPortal||(pl.isSkyZone&&!sky))continue;
    if(P.y+P.h<=pl.y+10||P.y>=pl.y+pl.h-4)continue;       // pies por encima del borde o cabeza por debajo
    const gap=dir>0?pl.x-x:x-(pl.x+pl.w);
    if(gap>=-1&&gap<=3)return dir;
  }
  return 0;
}
function fluidPre(d){
  const glideOK=!isAnt(d)||kat()==='kaze';
  const dir=(K.ArrowRight||K.KeyD)?1:(K.ArrowLeft||K.KeyA)?-1:0;
  const jP=!!(K.ArrowUp||K[' ']||K.Space||K.KeyW),edge=jP&&!d._jp;d._jp=jP;
  if(P.onGround){d.glideLeft=GLIDE_MAX;d.glideOn=false;d.wall=0;return;}
  const w=noWall?0:wallSide(dir);d.wall=w;
  if(w){
    d.glideOn=false;
    if(edge){                                              // salto de pared
      P.vy=(P.jumpForce||-12)*.92;P.vx=-w*(P.spd||4)*1.2;P.facing=-w;
      P.jumping=true;P.jumpHeld=6;P._air=0;P.coyote=0;P.jumpBuffer=0;P._jWas=true;
      d.wallJumpUntil=performance.now()/1000+WALLJUMP_T;d.wall=0;
      try{if(typeof SFX!=='undefined'&&SFX.jump)SFX.jump();spawnPfx(P.x-camX+(w>0?P.w:0),P.y+P.h*.6,'#FFAADD',5);}catch(e){}
    }else if(P.vy>WALL_SLIDE)P.vy=WALL_SLIDE;               // resbala despacio por la pared
    return;
  }
  if(!noGlide&&glideOK&&P._dj&&jP&&P.vy>1&&d.glideLeft>0&&!P.crouching){d.glideOn=true;d.glideLeft-=1;if(P.vy>2.2)P.vy=2.2;}
  else d.glideOn=false;
}
function airStateNamed(d,now){
  const vy=P.vy;
  if(vy<d.prevVy-3)d.peakUp=Math.max(1,-vy);
  if(-vy>d.peakUp)d.peakUp=-vy;
  d.prevVy=vy;
  if(now<d.wallJumpUntil)return ['wall_jump',1-(d.wallJumpUntil-now)/WALLJUMP_T];
  if(d.wall){d.wasGlide=false;return [vy>1.2?'wall_slide':vy<-1.5?'wall_climb':'wall_grab'];}
  const gl=!!d.glideOn||(P.lowGrav&&vy>0&&kat()==='kaze');
  d.wasGlide=gl;
  if(gl)return ['glide'];
  if(P._dj&&!d.djSeen){d.djSeen=true;d.djAt=now;d.peakUp=Math.max(1,-vy);}
  if(!P._dj)d.djSeen=false;
  if(d.djAt&&now-d.djAt<.3)return ['jump_flip',(now-d.djAt)/.3];                 // doble salto: voltereta
  if(vy<.5&&d.peakUp>4)return ['jump_up',clamp01(1-(-vy)/d.peakUp)];              // subida → cima
  if((K.ArrowDown||K.KeyS)&&vy>2)return ['dive'];                                  // ⬇ en el aire: picada
  if(vy>12)return ['fall_fast'];                                                   // caída rápida (patada)
  return ['jump_fall',clamp01(vy/9)];                                              // caída
}
function airState(d,now){
  if(d.animations.jump_up)return airStateNamed(d,now);
  const vy=P.vy,t=now-d.airStart;
  if(vy<d.prevVy-3)d.peakUp=Math.max(1,-vy);               // impulso nuevo hacia arriba (rebote, resorte)
  if(-vy>d.peakUp)d.peakUp=-vy;
  d.prevVy=vy;
  if(now<d.wallJumpUntil)return ['wall_jump',1-(d.wallJumpUntil-now)/WALLJUMP_T];
  if(d.wall){d.wasGlide=false;return [vy>1.2?'wall_slide':vy<-1.5?'wall_climb':'wall_grab'];}
  const gl=!!d.glideOn||(P.lowGrav&&vy>0);
  if(gl&&!d.wasGlide)d.glideAt=now;
  if(!gl&&d.wasGlide)d.foldUntil=now+.24;
  d.wasGlide=gl;
  if(gl)return now-d.glideAt<.25?['glide_start',(now-d.glideAt)/.25]:['glide'];
  if(now<d.foldUntil)return ['fall'];                      // pliega la capa (planeo 9-10)
  if(P._dj&&!d.djSeen){d.djSeen=true;d.djAt=now;d.peakUp=Math.max(1,-vy);}
  if(!P._dj)d.djSeen=false;
  if(vy<-3&&!d.djAt&&t<.1)return ['jump',undefined,t<.05?0:1];   // preparación/impulso (salto 1-2)
  if(vy<.5&&d.peakUp>4)return ['jump',undefined,2+Math.min(3,Math.floor(clamp01(1-(-vy)/d.peakUp)*4))]; // subida 3-6
  if(vy>12)return ['fall'];                                // caída libre (planeo 9-10)
  return ['jump',undefined,6+Math.min(2,Math.floor(clamp01(vy/7)*3))];                              // caída 7-9
}
function sakuraState(d,onGround,now,dx){
  const fl=!!(d.M&&d.M.fluid);
  if(d.lastGrounded===false&&onGround){
    const hard=d.maxFall>11;d.landHard=hard;
    if(fl&&Math.abs(P.vx)>3.5&&!hard)d.landUntil=0;      // corriendo: sigue sin frenar
    else{d.landDur=fl?(hard?.26:.16):.15;d.landStart=now;d.landUntil=now+d.landDur;}
    d.maxFall=0;d.djAt=0;d.wasGlide=false;d.foldUntil=0;
  }
  if(d.lastGrounded!==false&&!onGround){d.airStart=now;d.peakUp=Math.max(1,-P.vy);d.prevVy=P.vy;d.maxFall=0;d.djAt=0;d.djSeen=!!P._dj;}
  d.lastGrounded=onGround;
  if(!onGround)d.maxFall=Math.max(d.maxFall||0,P.vy);else d.wall=0;
  if(typeof GS!=='undefined'&&GS.doneFired)return ['win'];
  if(typeof GS!=='undefined'&&GS.dying)return ['death'];
  if(P.iframes>60)return ['hurt'];
  if((P._specialT||0)>0){d.combatUntil=now+2.5;return [variant(d,'special'),1-P._specialT/36];}
  if((P._kunaiT||0)>0){d.combatUntil=now+2.5;return ['kunai',1-P._kunaiT/24];}
  if((P._meleeT||0)>0){
    let nm='melee';
    if(window.ANTAREZ&&d.M&&d.M.katanas){nm=ANTAREZ.meleeName(onGround);if(!d.animations[nm])nm=ANTAREZ.meleeName(true);}
    d.combatUntil=now+2.5;
    return [nm,1-P._meleeT/MELEE_DUR];
  }
  if(P._dashT>0)return [variant(d,'dash')];
  if(fl&&now<d.katanaFx&&d.animations['special_'+kat()])return ['special_'+kat(),1-(d.katanaFx-now)/.45];
  if(P.crouching&&onGround){
    if(!d.crouching){d.crouching=true;d.crouchUntil=now+2/12;}
    if(now<d.crouchUntil)return ['crouch_enter'];
    if(Math.abs(P.vx)>3.5)return ['slide'];
    if(Math.abs(P.vx)>.5)return ['crawl'];
    return ['crouch'];
  }
  d.crouching=false;
  if(!onGround){
    if(fl)return airState(d,now);
    if(P.lowGrav&&P.vy>0)return ['glide'];
    return [P.vy<0?'jump_rise':'jump_fall'];
  }
  if(now<d.landUntil)return fl?[(d.landHard&&d.animations.land_hard)?'land_hard':'land',(now-d.landStart)/d.landDur]:['land'];
  if(Math.abs(P.vx)>.5){
    const run=Math.abs(P.vx)>=3.5,nm=(run&&P.speedBoost&&d.animations.sprint)?'sprint':run?'run':'walk';
    if(fl){
      const n=d.animations[nm].frames.length,pp=(d.M.ppf&&d.M.ppf[nm])||(run?RUN_PX:WALK_PX);
      d.phase=((d.phase||0)+Math.min(Math.max(dx||0,.8),14)/(n*pp))%1;
      return [nm,d.phase];
    }
    return [nm];
  }
  return [(fl&&now<d.combatUntil)?variant(d,'idle'):'idle'];
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
    const [name,progress,idx]=sakuraState(d,onGround,now,dxRun),fr=selectFrame(d,name,progress,now,idx);
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
/* Mecánicas de Sakura (pared y planeo): se aplican justo antes de cada actualización del juego */
const _upd=window.update;
if(typeof _upd==='function'){
  window.update=function(){
    const d=(typeof GS!=='undefined'&&GS.char==='peach')?act.black:act.pink;
    if(d&&d.on&&d.M&&d.M.fluid&&typeof P!=='undefined'&&P&&P.alive&&GS.running&&!GS.dying&&!(typeof AQ!=='undefined'&&AQ)){
      try{fluidPre(d);}catch(e){}
    }
    return _upd.apply(this,arguments);
  };
}
/* Kunais de Antarez: sprites reales (kunai_10 doble / kunai_15 con estela) en vez del círculo/ícono genérico */
(function(){
  const d=act.black,_old=window._drawBulletSpr;
  if(typeof _old!=='function')return;
  const imgs={};
  window._drawBulletSpr=function(bs,b,bsx){
    const M=d&&d.on&&d.M&&d.M.projectiles;
    if(M&&bs==='kunai'&&b.char==='peach'){
      if(b._ks===undefined)b._ks=(b.vx*P.facing>0)?'twin':'single';
      const pj=M[b._ks];let im=imgs[pj.file];
      if(!im){im=imgs[pj.file]=new Image();im.src=d.M.base+pj.file;}
      if(im.complete&&im.naturalWidth){
        const h=b.r*2.4,S=h/pj.h,w=pj.w*S,dir=b.vx<0?-1:1;
        CX.save();CX.translate(bsx,b.y);CX.scale(dir,1);CX.drawImage(im,-pj.ax*S,-pj.ay*S,w,h);CX.restore();
        d.used.add(pj.file);return true;
      }
    }
    return _old.apply(this,arguments);
  };
})();
/* Comprobación en consola: SAKURA_USO() / ANTAREZ_USO() → cuántos fotogramas se han dibujado ya */
function usoDe(d,nombre){
  if(!d)return null;
  const all=new Set();Object.keys(d.animations).forEach(n=>d.animations[n].frames.forEach(f=>all.add(f.file)));
  if(d.M.projectiles)Object.keys(d.M.projectiles).forEach(k=>all.add(d.M.projectiles[k].file));
  const miss=[...all].filter(f=>!d.used.has(f));
  console.log('['+nombre+'] fotogramas usados: '+d.used.size+' / '+all.size+(miss.length?'\nFaltan: '+miss.join(', '):' ✔ todos'));
  return {usados:d.used.size,total:all.size,faltan:miss};
}
window.SAKURA_USO=()=>usoDe(act.pink,'Sakura');
window.ANTAREZ_USO=()=>usoDe(act.black,'Antarez');
window.__HERO_PRO_TEST={act,sakuraState,selectFrame,airState,fluidPre,wallSide,usoDe};
})();
