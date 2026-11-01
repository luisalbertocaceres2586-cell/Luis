/* NINJA MULTIPLICACIÓN — Motor FX v1
   Capa independiente: postproceso (bloom, viñeta, gradación de color), profundidad (niebla + primer plano
   con paralaje), cámara cinematográfica (zoom de impacto, cámara lenta, hit-stop, barras), partículas
   aditivas y audio con compresor + reverb. Desactivar: añade ?fx=0 a la URL. */
(function(){
'use strict';
if(/[?&]fx=0/.test(location.search))return;
if(typeof render!=='function'||typeof update!=='function'||typeof CX==='undefined')return;
const FX=window.FX={ts:1,tsT:1,hold:0,zoom:1,zoomT:1,bars:0,parts:[],rings:[],_slow:0,_punch:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lite=()=>typeof _perfMode!=='undefined'&&_perfMode==='lite';
const hash=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};
FX.slowmo=(k,f)=>{FX.tsT=k;FX._slow=f;};
FX.punch=z=>{FX.zoomT=z;FX._punch=10;};
FX.freeze=f=>{FX.hold=Math.max(FX.hold,f);};

/* ---------- partículas (coordenadas de mundo, mezcla aditiva) ---------- */
function burst(wx,wy,n,col){
  const cap=lite()?120:320; n=Math.min(n,Math.max(0,cap-FX.parts.length));
  for(let i=0;i<n;i++){const a=Math.random()*6.283,s=2+Math.random()*6;
    FX.parts.push({x:wx,y:wy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,l:0,L:24+Math.random()*22,c:col,r:1.5+Math.random()*2.5,g:.22,add:1});}
  FX.rings.push({x:wx,y:wy,l:0,L:20,c:col});
}
function dust(wx,wy,n){
  for(let i=0;i<n&&FX.parts.length<320;i++)
    FX.parts.push({x:wx+(Math.random()-.5)*18,y:wy,vx:(Math.random()-.5)*3,vy:-Math.random()*1.6,l:0,L:20+Math.random()*14,c:'#d8cbb0',r:2+Math.random()*3,g:-.02,add:0});
}
function tick(dt){
  for(const p of FX.parts){p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.vx*=.985;}
  FX.parts=FX.parts.filter(p=>p.l<p.L);
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
function fog(t,tint){
  CX.save();CX.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){
    const x=(((i*W*.55-camX*(.5+i*.25)+t*.01*(i+1))%(W*1.6))+W*1.6)%(W*1.6)-W*.3,y=groundY()-30-i*26;
    const g=CX.createRadialGradient(x,y,0,x,y,W*.34);
    g.addColorStop(0,tint+'26');g.addColorStop(1,tint+'00');
    CX.fillStyle=g;CX.fillRect(x-W*.34,y-W*.2,W*.68,W*.4);}
  CX.restore();
}
function foreground(t){            /* siluetas en primer plano con paralaje 1.5× → sensación de profundidad */
  const step=26,off=camX*1.5,i0=Math.floor(off/step),n=Math.ceil(W/step)+2;
  CX.save();CX.fillStyle='rgba(3,6,18,.88)';CX.beginPath();CX.moveTo(-step,H+2);
  for(let k=0;k<n;k++){const i=i0+k,x=i*step-off,h=26+hash(i)*54,sw=Math.sin(t*.002+i)*5;
    CX.lineTo(x,H+2);CX.quadraticCurveTo(x+step*.35,H-h*.6,x+step*.5+sw,H-h);CX.lineTo(x+step,H+2);}
  CX.lineTo(W+step,H+2);CX.closePath();CX.fill();CX.restore();
}
function speedLines(){
  CX.save();CX.globalCompositeOperation='lighter';CX.strokeStyle='rgba(255,255,255,.18)';CX.lineWidth=2;
  for(let i=0;i<14;i++){const y=hash(i+Math.floor(Date.now()/90))*H,x=hash(i*3)*W*.3,L=W*.12+hash(i*7)*W*.18;
    CX.beginPath();CX.moveTo(x,y);CX.lineTo(x+L,y);CX.stroke();CX.beginPath();CX.moveTo(W-x,y);CX.lineTo(W-x-L,y);CX.stroke();}
  CX.restore();
}
function post(){
  const t=Date.now(),lv=typeof curLV==='function'?curLV():null,bg=lv&&lv.bg;
  if(!lite()){fog(t,GRADE[bg]||'#9fb8ff');foreground(t);}
  bloom();
  if(GRADE[bg]){CX.save();CX.globalCompositeOperation='soft-light';CX.globalAlpha=.16;CX.fillStyle=GRADE[bg];CX.fillRect(0,0,W,H);CX.restore();}
  vignette();
  if(P&&(P.dashOn||P.speedBoost||P.rocketOn)&&!lite())speedLines();
  if(FX.bars>.02){const b=FX.bars*H*.075;CX.fillStyle='#000';CX.fillRect(0,0,W,b);CX.fillRect(0,H-b,W,b);}
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
  const wasG=P.onGround,vy0=P.vy;
  tick(dt*FX.ts);
  const r=_update(dt*FX.ts);
  if(P.onGround&&!wasG&&vy0>5){dust(P.x+P.w/2,P.y+P.h,Math.min(10,Math.round(vy0)));SFX.land();}
  return r;
};
window.render=function(){
  const z=FX.zoom,zoomed=z>1.002&&P&&P.w;
  if(zoomed){const px=P.x-camX+P.w/2,py=P.y+P.h/2;CX.save();CX.translate(px,py);CX.scale(z,z);CX.translate(-px,-py);}
  _render();drawParts();
  if(zoomed)CX.restore();
  post();
};
function hook(name,fn){const o=window[name];if(typeof o!=='function')return;
  window[name]=function(){const r=o.apply(this,arguments);try{fn.apply(this,arguments);}catch(e){}return r;};}
hook('killEnemy',(e,sx,sy)=>{FX.freeze(4);FX.punch(1.05);burst(sx+camX,sy+(e?e.h/2:0),26,'#ffd35a');});
hook('doJump',()=>dust(P.x+P.w/2,P.y+P.h,6));
hook('flashRed',()=>{FX.freeze(5);FX.punch(1.04);});
hook('gameOver',()=>{FX.slowmo(.25,80);FX.punch(1.12);});
hook('showComboBanner',s=>{if(s>=5)FX.slowmo(.55,20);});

/* ---------- audio: bus maestro (compresor + reverb) y capas de ruido ---------- */
try{
  const dest=AC.destination,oc=AudioNode.prototype.connect;
  const bus=AC.createGain(),comp=AC.createDynamicsCompressor(),conv=AC.createConvolver(),wet=AC.createGain();
  comp.threshold.value=-18;comp.ratio.value=4;wet.gain.value=.16;
  const len=Math.floor(AC.sampleRate*1.4),ir=AC.createBuffer(2,len,AC.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
  conv.buffer=ir;
  oc.call(bus,comp);oc.call(bus,conv);oc.call(conv,wet);oc.call(wet,comp);oc.call(comp,dest);
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
