/* NINJA MULTIPLICACIÓN — Motor FX v1
   Capa independiente: postproceso (bloom, viñeta, gradación de color), profundidad (niebla + primer plano
   con paralaje), cámara cinematográfica (zoom de impacto, cámara lenta, hit-stop, barras), partículas
   aditivas y audio con compresor + reverb. Desactivar: añade ?fx=0 a la URL. */
(function(){
'use strict';
if(/[?&]fx=0/.test(location.search))return;
if(typeof render!=='function'||typeof update!=='function'||typeof CX==='undefined')return;
const FX=window.FX={ts:1,tsT:1,hold:0,zoom:1,zoomT:1,bars:0,parts:[],rings:[],_slow:0,_punch:0,post:true,trauma:0,ghosts:[]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lite=()=>typeof _perfMode!=='undefined'&&_perfMode==='lite';
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};
FX.slowmo=(k,f)=>{FX.tsT=k;FX._slow=f;};
FX.punch=z=>{FX.zoomT=z;FX._punch=10;};
FX.freeze=f=>{FX.hold=Math.max(FX.hold,f);};
FX.burst=(...a)=>burst(...a);FX.dust=(...a)=>dust(...a);   /* usados por las cinemáticas */

/* ---------- partículas (coordenadas de mundo, mezcla aditiva) ---------- */
function burst(wx,wy,n,col){
  const cap=lite()?120:320; n=Math.min(n,Math.max(0,cap-FX.parts.length));
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=2+Math.random()*6;
    FX.parts.push({x:wx,y:wy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:0,L:24+Math.random()*22,c:col,r:1.5+Math.random()*2.5,g:.22,add:1});}
  FX.rings.push({x:wx,y:wy,l:0,L:20,c:col});
}
function dust(wx,wy,n,col){
  for(let i=0;i<n&&FX.parts.length<320;i++)
    FX.parts.push({x:wx+(Math.random()-.5)*18,y:wy,vx:(Math.random()-.5)*3,vy:-Math.random()*1.6,l:0,L:20+Math.random()*14,c:col||'#d8cbb0',r:2+Math.random()*3,g:-.02,add:0});
}
function tick(dt){
  for(const p of FX.parts){p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.vx*=.985;}
  FX.parts=FX.parts.filter(p=>p.l<p.L);
  for(const g of FX.ghosts)g.l+=dt;FX.ghosts=FX.ghosts.filter(g=>g.l<g.L);
  FX.trauma=Math.max(0,FX.trauma-.022*dt);
  for(const r of FX.rings)r.l+=dt;
  FX.rings=FX.rings.filter(r=>r.l<r.L);
}
function drawParts(){
  CX.save();
  for(const p of FX.parts){const k=1-p.l/p.L;
    CX.globalCompositeOperation=p.add?'lighter':'source-over';
    CX.globalAlpha=(p.add?1:.5)*k;CX.fillStyle=p.c;
    CX.beginPath();CX.arc(p.x-camX,p.y,p.r*(p.add?k+.3:2-k),0,6.283);CX.fill();}
  CX.globalCompositeOperation='lighter';CX.lineWidth=3;
  for(const r of FX.rings){const k=r.l/r.L;CX.globalAlpha=1-k;CX.strokeStyle=r.c;
    CX.beginPath();CX.arc(r.x-camX,r.y,10+k*70,0,6.283);CX.stroke();}
  CX.restore();
}

/* ---------- postproceso ---------- */
const bc=document.createElement('canvas'),bx=bc.getContext('2d');
function bloom(){
  if(lite()||!('filter' in bx))return;
  FX._bf=(FX._bf||0)+1;
  if(FX._bf%2===0&&bc.width){CX.save();CX.globalCompositeOperation='lighter';CX.globalAlpha=.24;CX.drawImage(bc,0,0,W,H);CX.restore();return;}
  const w=Math.max(64,W>>2),h=Math.max(36,H>>2);
  if(bc.width!==w||bc.height!==h){bc.width=w;bc.height=h;}
  bx.filter='brightness(1.25) contrast(1.6) blur(4px)';bx.drawImage(CV,0,0,w,h);bx.filter='none';
  CX.save();CX.globalCompositeOperation='lighter';CX.globalAlpha=.24;CX.drawImage(bc,0,0,W,H);CX.restore();
}
const GRADE={prairie:'#ffb15a',night:'#4a3cff',ice:'#7fd0ff',desert:'#ff9a3c',jungle:'#3cff9a',water:'#3c9aff'};
let vig=null,vigW=0,vigH=0;
function vignette(){
  if(!vig||vigW!==W||vigH!==H){vigW=W;vigH=H;
    vig=CX.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.78);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,12,.55)');}
  CX.fillStyle=vig;CX.fillRect(0,0,W,H);
}
const FOGRGB={'#ffb15a':'255,177,90','#4a3cff':'74,60,255','#7fd0ff':'127,208,255','#ff9a3c':'255,154,60','#3cff9a':'60,255,154','#3c9aff':'60,154,255','#9fb8ff':'159,184,255'};
function fog(t,tint){
  const rgb=FOGRGB[tint]||'159,184,255';CX.save();CX.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){
    const x=(((i*W*.55-camX*(.5+i*.25)+t*.01*(i+1))%(W*1.6))+W*1.6)%(W*1.6)-W*.3,y=groundY()-30-i*26;
    glow(x,y,W*.2,rgb,.15,W*.34);}
  CX.restore();
}
function foreground(t){            /* hojas en primer plano con paralaje 1.5× → sensación de profundidad */
  const step=34,off=camX*1.5,i0=Math.floor(off/step),n=Math.ceil(W/step)+2;
  CX.save();CX.fillStyle='rgba(4,10,22,.72)';CX.beginPath();CX.moveTo(-step,H+2);
  for(let k=0;k<n;k++){const i=i0+k,x=i*step-off,h=14+hash(i)*26,sw=Math.sin(t*.0018+i)*6,d=hash(i+9)>.5?1:-1;
    CX.lineTo(x,H+2);CX.bezierCurveTo(x+step*.1,H-h*.9,x+step*.45+sw*d,H-h*1.05,x+step*.62+sw,H-h*.55);CX.bezierCurveTo(x+step*.78,H-h*.2,x+step*.9,H,x+step,H+2);}
  CX.lineTo(W+step,H+2);CX.closePath();CX.fill();CX.restore();
}
function speedLines(){
  CX.save();CX.globalCompositeOperation='lighter';CX.strokeStyle='rgba(255,255,255,.18)';CX.lineWidth=2;
  for(let i=0;i<14;i++){const y=hash(i+Math.floor(Date.now()/90))*H,x=hash(i*3)*W*.3,L=W*.12+hash(i*7)*W*.18;
    CX.beginPath();CX.moveTo(x,y);CX.lineTo(x+L,y);CX.stroke();CX.beginPath();CX.moveTo(W-x,y);CX.lineTo(W-x-L,y);CX.stroke();}
  CX.restore();
}
FX.q={rays:1,fog:1,ambient:1,fore:1,lights:1,bloom:1,grade:1,shadows:1,vig:1};   /* interruptores por efecto (los usa el control de calidad automático) */
function post(){
  if(!FX.post)return;const Q=FX.q;
  const t=Date.now(),lv=typeof curLV==='function'?curLV():null,bg=lv&&lv.bg;
  if(!lite()){if(Q.rays)rays(t,bg);if(Q.fog)fog(t,GRADE[bg]||'#9fb8ff');if(Q.ambient)ambient(t,bg);if(Q.fore)foreground(t);}
  if(Q.lights)lights(t);
  if(Q.bloom)bloom();
  if(Q.grade&&GRADE[bg]){CX.save();CX.globalCompositeOperation='soft-light';CX.globalAlpha=.16;CX.fillStyle=GRADE[bg];CX.fillRect(0,0,W,H);CX.restore();}
  if(Q.vig)vignette();
  if(GS.running&&GS.lives<=1){CX.save();CX.fillStyle='rgba(255,0,30,'+(.07+.07*Math.sin(t*.008)).toFixed(3)+')';CX.fillRect(0,0,W,H);CX.restore();}
  if(P&&(P.dashOn||P.speedBoost||P.rocketOn)&&!lite())speedLines();
  if(FX.bars>.02){const b=FX.bars*H*.075;CX.fillStyle='#000';CX.fillRect(0,0,W,b);CX.fillRect(0,H-b,W,b);}
}


/* ---------- fase 2: sensación de control (game feel) ---------- */
const FEEL=window.FX.feel={jumpCut:.5,fallMul:.38,apexHang:.45,turnBrake:.82,on:true};
let runT=0;
function feel(dt){
  if(!FEEL.on||!P||!P.alive||!GS.running||GS.dying)return;
  const jP=K['ArrowUp']||K[' ']||K['Space']||K['KeyW'];
  const bg=typeof curLV==='function'&&curLV()?curLV().bg:'';
  if(P.onGround){P._cut=false;}
  else if(!P.lowGrav&&!P.rocketOn){
    /* salto variable: soltar el botón corta la subida */
    if(P.vy<-3&&!jP&&P.jumping&&!P._cut){P.vy*=FEEL.jumpCut;P._cut=true;}
    /* caída más pesada y "colgado" en el punto más alto */
    if(P.vy>0)P.vy+=GRAV*FEEL.fallMul*dt;
    else if(Math.abs(P.vy)<1.6)P.vy-=GRAV*FEEL.apexHang*dt;
  }
  /* frenado al cambiar de dirección (más respuesta, sin tocar el hielo) */
  const L=K['ArrowLeft']||K['KeyA'],R=K['ArrowRight']||K['KeyD'];
  if(bg!=='ice'&&((L&&P.vx>1.5)||(R&&P.vx<-1.5))){
    P.vx*=Math.pow(FEEL.turnBrake,dt);
    if(P.onGround&&Math.random()<.5)dust(P.x+P.w/2,P.y+P.h,1);
  }
  /* polvo al correr */
  if(P.onGround&&Math.abs(P.vx)>P.spd*.7){runT+=dt;if(runT>7){runT=0;dust(P.x+P.w/2-P.facing*8,P.y+P.h,1);}}
}

/* ---------- mando (Gamepad API) y vibración ---------- */
const PAD={ArrowLeft:0,ArrowRight:0,ArrowUp:0,ArrowDown:0,KeyF:0,KeyX:0,KeyC:0};
function pollPad(){
  const gp=(navigator.getGamepads?navigator.getGamepads():[])[0]||null;
  const now={ArrowLeft:0,ArrowRight:0,ArrowUp:0,ArrowDown:0,KeyF:0,KeyX:0,KeyC:0};
  if(gp){const b=i=>gp.buttons[i]&&gp.buttons[i].pressed,ax=gp.axes[0]||0,ay=gp.axes[1]||0;
    now.ArrowLeft=(ax<-.35||b(14))?1:0;now.ArrowRight=(ax>.35||b(15))?1:0;
    now.ArrowUp=(b(0)||b(12)||ay<-.6)?1:0;now.ArrowDown=(b(13)||ay>.6)?1:0;
    now.KeyF=(b(2)||b(7))?1:0;now.KeyX=(b(1)||b(5))?1:0;now.KeyC=b(3)?1:0;}
  for(const k in now){if(now[k]!==PAD[k]){K[k]=now[k];if(k==='ArrowUp')K['Space']=now[k];PAD[k]=now[k];}}
}
function rumble(ms,str){
  try{if(navigator.vibrate)navigator.vibrate(ms);
    const gp=(navigator.getGamepads?navigator.getGamepads():[])[0];
    if(gp&&gp.vibrationActuator)gp.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:str,weakMagnitude:str/2});}catch(e){}
}
FX.rumble=rumble;


/* ---------- fase 3: sombras, luces, clima, dash, doble salto, trauma de cámara ---------- */
const GL={};
function glowSpr(rgb){let c=GL[rgb];if(c)return c;c=GL[rgb]=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba('+rgb+',1)');g.addColorStop(1,'rgba('+rgb+',0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return c;}
function glow(x,y,r,rgb,a,rx){const ry=r;rx=rx||r;CX.globalAlpha=a;CX.drawImage(glowSpr(rgb),x-rx,y-ry,rx*2,ry*2);CX.globalAlpha=1;}
function lights(t){
  CX.save();CX.globalCompositeOperation='lighter';let n=0;
  for(const c of coins){if(c.taken||n>24||(c.isSkyZone&&!_skyZone))continue;const x=c.x-camX+c.w/2;if(x<-40||x>W+40)continue;n++;
    glow(x,c.y+Math.sin(c.t||0)*6+c.h/2,30,'255,200,60',.2+.08*Math.sin(t*.006+c.x));}
  for(const b of bullets){const x=b.x-camX;if(x<-40||x>W+40)continue;glow(x,b.y,(b.r||10)*2.6,'120,200,255',.26);}
  if(P&&P.w)glow(P.x-camX+P.w/2,P.y+P.h/2,70,P.shieldOn?'80,160,255':P.starOn?'255,230,80':'255,210,160',(P.shieldOn||P.starOn)?.28:.09);
  CX.restore();
}
const WEATHER={ice:{c:'255,255,255',vy:.05,vx:-.01,s:2.2,n:46,sway:1},night:{c:'255,140,60',vy:-.04,vx:.01,s:1.8,n:30,add:1},
  desert:{c:'230,200,140',vy:.004,vx:-.12,s:1.6,n:34},jungle:{c:'190,255,120',vy:0,vx:0,s:2.2,n:22,add:1,fly:1},
  prairie:{c:'220,255,150',vy:0,vx:0,s:2,n:18,add:1,fly:1},water:{c:'200,235,255',vy:-.03,vx:0,s:2.6,n:26}};
function ambient(t,bg){
  const w=WEATHER[bg];if(!w)return;CX.save();if(w.add)CX.globalCompositeOperation='lighter';
  for(let i=0;i<w.n;i++){const d=.4+hash(i+7);
    let x=hash(i)*W*1.5-camX*d*.5+t*w.vx*d,y=hash(i+50)*H+t*w.vy*d;
    if(w.sway)x+=Math.sin(t*.001+i)*12;
    if(w.fly){x+=Math.sin(t*.001+i)*20;y+=Math.cos(t*.0013+i*2)*14;}
    x=((x%W)+W)%W;y=((y%H)+H)%H;
    CX.globalAlpha=w.fly?.25+.6*Math.abs(Math.sin(t*.002+i)):.25+.4*d/1.4;
    CX.fillStyle='rgb('+w.c+')';CX.beginPath();CX.arc(x,y,w.s*d,0,6.283);CX.fill();}
  CX.restore();
}
const RAYT={prairie:'190,200,255',jungle:'230,255,190',desert:'255,230,170'};
function rays(t,bg){
  const c=RAYT[bg];if(!c)return;CX.save();CX.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const x=((i*W*.33-camX*.12+t*.004)%(W*1.3)+W*1.3)%(W*1.3)-W*.15,w=W*.07;
    const g=CX.createLinearGradient(x,0,x-W*.25,H);g.addColorStop(0,'rgba('+c+',.07)');g.addColorStop(1,'rgba('+c+',0)');
    CX.fillStyle=g;CX.beginPath();CX.moveTo(x,0);CX.lineTo(x+w,0);CX.lineTo(x+w-W*.25,H);CX.lineTo(x-W*.25,H);CX.closePath();CX.fill();}
  CX.restore();
}
function shadowAt(cx,gy,feetY,w){
  const h=Math.max(0,gy-feetY),k=1/(1+h/160),rx=w*.5*k;
  CX.save();CX.fillStyle='rgba(0,0,0,'+(.34*k).toFixed(3)+')';CX.beginPath();CX.ellipse(cx,gy+2,rx,rx*.28,0,0,6.283);CX.fill();CX.restore();
}
function moves(dt){                       /* dash (Shift / V) y doble salto */
  if(!FEEL.on||!P||!P.alive||!GS.running||GS.dying)return;
  const aq=typeof AQ!=='undefined'&&AQ;
  const jP=K['ArrowUp']||K[' ']||K['Space']||K['KeyW'],dP=K['ShiftLeft']||K['ShiftRight']||K['KeyV'];
  if(P.onGround){P._dj=false;P._air=0;}else P._air=(P._air||0)+dt;
  FX._dcd=Math.max(0,(FX._dcd||0)-dt);
  if(dP&&!FX._dWas&&FX._dcd<=0&&!aq&&!P.crouching){
    P._dashT=12;FX._dcd=46;P.iframes=Math.max(P.iframes,18);FX.punch(1.035);rumble(40,.3);
    burst(P.x+P.w/2,P.y+P.h/2,12,'#7fd0ff');tone(500,'sawtooth',.14,.1);tone(900,'triangle',.1,.08,.04);}
  FX._dWas=!!dP;
  if(P._dashT>0){P._dashT-=dt;P.vy=0;FX._gt=(FX._gt||0)+dt;
    if(FX._gt>2){FX._gt=0;FX.ghosts.push({x:P.x,y:P.y,f:P.facing,l:0,L:16});}}
  const jE=jP&&!FX._jW;FX._jW=!!jP;
  if(jE&&!P.onGround&&P._air>10&&(P.coyote||0)<=0&&!P._dj&&!P.lowGrav&&!_skyZone&&!aq){
    P._dj=true;P.vy=P.jumpForce*.85;P.jumping=true;P.jumpHeld=6;P._cut=false;P._squashY=1.2;P._squashX=.85;
    FX.rings.push({x:P.x+P.w/2,y:P.y+P.h,l:0,L:16,c:'#ffffff'});dust(P.x+P.w/2,P.y+P.h,6);SFX.jump();}
}
function afterMoves(dt){
  if(P&&P.alive&&P._dashT>0)P.x=clamp(P.x+P.facing*9*dt,0,(typeof WORLD_W!=='undefined'?WORLD_W:1e9)-P.w);
}
document.addEventListener('keydown',e=>{if(e.key==='F8'){FX.post=!FX.post;e.preventDefault();}});

function duck(){                       /* amortigua el audio durante preguntas y cámara lenta */
  if(!FX._lp)return;const tgt=(typeof AQ!=='undefined'&&AQ)?3800:(FX.tsT<.7?1200:20000);
  if(FX._lpT!==tgt){FX._lpT=tgt;try{FX._lp.frequency.setTargetAtTime(tgt,AC.currentTime,.08);}catch(e){}}
}
/* ---------- fase 4: volumen en los sprites (luz + sombra + borde de luz) ---------- */
const SH=new Set(),SHC=new WeakMap(),NOSH=/fx|aura|burst|proj|dust|poof|bullet|spark|portal|petal|cloud|star|coin/i;
FX.light=true;
function collect(){
  const roots=[];
  for(const n of ['NJX','NJ','EN1','EN1B','EN2B','EN3','BOSS_BY_GOAL']){try{roots.push([n,eval(n)]);}catch(e){}}
  const seen=new Set();
  (function walk(o,d,path){
    if(!o||d>5||seen.has(o))return;
    if(o instanceof HTMLImageElement){if(!NOSH.test(path))SH.add(o);return;}
    if(typeof o!=='object')return;seen.add(o);
    for(const k in o){try{walk(o[k],d+1,path+'.'+k);}catch(e){}}
  })(roots,0,'');
}
function variant(img,mir){
  let m=SHC.get(img);if(!m){m={};SHC.set(img,m);}
  const key=mir?'r':'l';if(m[key])return m[key];
  const w=img.naturalWidth,h=img.naturalHeight;
  if(!w||!h||w>700||h>700||!img.complete)return img;
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.drawImage(img,0,0);
  x.globalCompositeOperation='source-atop';
  const litX=mir?w:0,darkX=mir?0:w;
  let g=x.createLinearGradient(0,0,0,h);                 /* luz desde arriba, sombra abajo */
  g.addColorStop(0,'rgba(255,246,232,.20)');g.addColorStop(.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(8,10,40,.30)');
  x.fillStyle=g;x.fillRect(0,0,w,h);
  g=x.createLinearGradient(darkX,0,litX,0);              /* curvatura: lado opuesto a la luz más oscuro */
  g.addColorStop(0,'rgba(10,10,50,.24)');g.addColorStop(.6,'rgba(10,10,50,0)');
  x.fillStyle=g;x.fillRect(0,0,w,h);
  const r=document.createElement('canvas');r.width=w;r.height=h;const rx=r.getContext('2d'),k=Math.max(1,Math.round(w/55));
  rx.drawImage(img,0,0);rx.globalCompositeOperation='destination-out';rx.drawImage(img,mir?-k:k,k);   /* queda solo el borde iluminado */
  rx.globalCompositeOperation='source-in';rx.fillStyle='rgb(175,218,255)';rx.fillRect(0,0,w,h);
  x.globalCompositeOperation='source-over';x.globalAlpha=.6;x.drawImage(r,0,0);
  return m[key]=c;
}
const _di=CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage=function(img){
  if(FX.post&&FX.light&&this===CX&&SH.has(img)){
    const t=CX.getTransform?CX.getTransform():null,v=variant(img,!!(t&&t.a<0));
    if(v!==img){const a=[].slice.call(arguments);a[0]=v;return _di.apply(this,a);}
  }
  return _di.apply(this,arguments);
};
collect();setTimeout(collect,1500);FX.collect=collect;

/* ---------- carrera: pasos con polvo, compresión por zancada, estela de velocidad ---------- */
function runFx(){
  if(!P||!P.alive||!GS.running||GS.dying)return;
  const run=P.onGround&&Math.abs(P.vx)>.5&&P._runPh!==undefined;
  if(!run){FX._st=undefined;return;}
  const ph=P._runPh,st=Math.floor(ph*2),bg=typeof curLV==='function'&&curLV()?curLV().bg:'';
  if(Math.abs((P._squashY||1)-1)<.03){const k=Math.cos(ph*Math.PI*4);P._squashY=1-.035*k;P._squashX=1+.025*k;}
  if(FX._st!==undefined&&st!==FX._st&&Math.abs(P.vx)>P.spd*.55){
    const col=bg==='ice'?'#e6f6ff':bg==='jungle'?'#8fcf6a':bg==='desert'?'#e3c283':'#d8cbb0';
    dust(P.x+P.w/2-P.facing*6,P.y+P.h,2,col);
    if(bg==='ice')burst(P.x+P.w/2,P.y+P.h,3,'#bfe6ff');
  }
  FX._st=st;
  if((P.speedBoost||P.rocketOn)&&(FX._tg=(FX._tg||0)+1)%3===0)FX.ghosts.push({x:P.x,y:P.y,f:P.facing,l:6,L:16});
}

/* ---------- ganchos sobre el juego original ---------- */
const _update=window.update,_render=window.render;
window.update=function(dt){
  if(FX.hold>0){FX.hold-=dt;return;}
  if(FX._slow>0){FX._slow-=dt;if(FX._slow<=0)FX.tsT=1;}
  if(FX._punch>0){FX._punch-=dt;if(FX._punch<=0)FX.zoomT=1;}
  FX.ts+=(FX.tsT-FX.ts)*clamp(.18*dt,0,1);
  FX.zoom+=(FX.zoomT-FX.zoom)*clamp(.2*dt,0,1);
  FX.bars+=((FX.tsT<.7?1:0)-FX.bars)*clamp(.1*dt,0,1);
  pollPad();feel(dt*FX.ts);moves(dt*FX.ts);duck();
  const wasG=P.onGround,vy0=P.vy;
  tick(dt*FX.ts);
  const r=_update(dt*FX.ts);
  afterMoves(dt*FX.ts);runFx();
  if(P.onGround&&!wasG&&vy0>5){P._squashY=Math.max(.74,1-vy0*.022);P._squashX=Math.min(1.28,1+vy0*.022);dust(P.x+P.w/2,P.y+P.h,Math.min(10,Math.round(vy0)));SFX.land();}
  return r;
};
window.render=function(){
  const z=FX.zoom,zoomed=z>1.002&&P&&P.w,tr=FX.trauma>.01&&!lite();
  if(tr){const m=FX.trauma*FX.trauma;CX.save();CX.translate(W/2,H/2);CX.rotate((Math.random()-.5)*.02*m);CX.scale(1.03,1.03);CX.translate(-W/2+(Math.random()-.5)*28*m,-H/2+(Math.random()-.5)*20*m);}
  if(zoomed){const px=P.x-camX+P.w/2,py=P.y+P.h/2;CX.save();CX.translate(px,py);CX.scale(z,z);CX.translate(-px,-py);}
  _render();drawParts();
  if(zoomed)CX.restore();
  if(tr)CX.restore();
  post();
};
function hook(name,fn){const o=window[name];if(typeof o!=='function')return;
  window[name]=function(){const r=o.apply(this,arguments);try{fn.apply(this,arguments);}catch(e){}return r;};}
hook('killEnemy',(e,sx,sy)=>{FX.freeze(4);FX.punch(1.05);burst(sx+camX,sy+(e?e.h/2:0),26,'#ffd35a');rumble(50,.4);});
hook('startLevel',()=>setTimeout(collect,300));
hook('doJump',()=>dust(P.x+P.w/2,P.y+P.h,6));
hook('flashRed',()=>{FX.freeze(5);FX.punch(1.04);rumble(180,.8);});
hook('gameOver',()=>{FX.slowmo(.25,80);FX.punch(1.12);});

const _dp=window.drawPlayer,_de=window.drawEnemy;let inGhost=false;
if(typeof _dp==='function')window.drawPlayer=function(x,y){
  if(!inGhost&&FX.post){try{
    if(FX.q.shadows)shadowAt(x+P.w/2,P.onGround?y+P.h:groundYAt(P.x+P.w/2),y+P.h,P.w*1.1);
    inGhost=true;
    for(const g of FX.ghosts){CX.save();CX.globalAlpha=.34*(1-g.l/g.L);_dp(g.x-camX,g.y,g.f,0,false,false);CX.restore();}
  }catch(e){}inGhost=false;}
  return _dp.apply(this,arguments);};
if(typeof _de==='function')window.drawEnemy=function(e,ex,ey){
  if(FX.post&&FX.q.shadows&&e&&e.alive!==false){try{shadowAt(ex+e.w/2,groundYAt(e.x+e.w/2),ey+e.h,e.w);}catch(x){}}
  return _de.apply(this,arguments);};
hook('screenShake',(a)=>{FX.trauma=Math.min(1,FX.trauma+(a||4)/12+.12);});
hook('showComboBanner',s=>{if(s>=5)FX.slowmo(.55,20);});

/* ---------- audio: bus maestro (compresor + reverb) y capas de ruido ---------- */
try{
  const dest=AC.destination,oc=AudioNode.prototype.connect;
  const bus=AC.createGain(),comp=AC.createDynamicsCompressor(),conv=AC.createConvolver(),wet=AC.createGain();
  comp.threshold.value=-18;comp.ratio.value=4;wet.gain.value=.16;
  const len=Math.floor(AC.sampleRate*1.4),ir=AC.createBuffer(2,len,AC.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  conv.buffer=ir;
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=20000;FX._lp=lp;
  oc.call(bus,lp);oc.call(lp,comp);oc.call(lp,conv);oc.call(conv,wet);oc.call(wet,comp);oc.call(comp,dest);
  AudioNode.prototype.connect=function(d){
    const a=[].slice.call(arguments);if(d===dest)a[0]=bus;return oc.apply(this,a);};
  const nb=AC.createBuffer(1,Math.floor(AC.sampleRate*.5),AC.sampleRate),nd=nb.getChannelData(0);
  for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const noise=(d,f0,f1,v,type)=>{if(_muted)return;try{
    const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(),n=AC.currentTime;
    s.buffer=nb;f.type=type||'bandpass';f.Q.value=1.2;
    f.frequency.setValueAtTime(f0,n);f.frequency.exponentialRampToValueAtTime(f1,n+d);
    g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);
    s.connect(f);f.connect(g);g.connect(dest);s.start(n);s.stop(n+d+.02);}catch(e){}};
  const layer=(k,fn)=>{const o=SFX[k];if(!o)return;SFX[k]=function(){o.apply(this,arguments);fn();};};
  layer('jump',()=>noise(.18,400,1800,.10));
  layer('land',()=>{tone(70,'sine',.12,.22);noise(.08,800,200,.08,'lowpass');});
  layer('attack',()=>noise(.12,3000,900,.12));
  layer('explode',()=>{noise(.35,1800,120,.22,'lowpass');tone(60,'sine',.3,.28);});
  layer('correct',()=>tone(1568,'sine',.4,.06,.2));
}catch(e){console.warn('[FX] audio no disponible',e);}
console.log('[FX] Motor FX v1 activo');
})();
