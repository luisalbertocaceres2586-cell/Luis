/* INTRO 2026 — carga limpia + historia animada + paso suave al menú.
   Todo se arma con el arte que ya vive en el repositorio (fondo nocturno, islas flotantes, villano, sprites de Sakura y Kage,
   efectos mágicos y el logo). Nada de paneles ni textos de más: logo, barra fina con Sakura corriendo y listo.
   · Primera vez: carga → "toca para comenzar" → historia de ~17 s (se puede saltar) → título → menú.
   · Jugadores con partida guardada: carga → título → menú (sin historia).
   · ?intro=full fuerza la historia · ?intro=0 la desactiva · IntroPro.replay() la repite (botón 🎬 del menú). */
(function(){
'use strict';
const Q=location.search;
const boot=()=>{const b=document.getElementById('bootSplash');if(b){b.classList.add('off');setTimeout(()=>b.remove(),500);}};
const S0=document.getElementById('S0');
const oldCine=document.getElementById('cineIntro');if(oldCine)oldCine.click();      /* cierra la intro antigua (cancela sus temporizadores) */
let volviendo=false;try{volviendo=sessionStorage.getItem('ninja_abrir_mundos')==='1';}catch(e){}
if(!S0||/[?&]intro=0/.test(Q)||/[?&]mundos=1/.test(Q)||volviendo){boot();window.__introDone=true;window.IntroPro={replay(){},skip(){}};return;}
let hasSave=false;try{hasSave=!!(localStorage.getItem('mpl_v10_sv')||localStorage.getItem('ninja_perfiles_v1'));}catch(e){}
const FORCE=/[?&]intro=full/.test(Q);
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- utilidades ---------- */
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ss=(a,b,x)=>{x=cl((x-a)/(b-a),0,1);return x*x*(3-2*x);};
const eo=x=>1-Math.pow(1-cl(x,0,1),3),rnd=(a,b)=>a+Math.random()*(b-a);
const mk=(tag,id,par,cls)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(par)par.appendChild(e);return e;};
const img=src=>{const i=new Image();i.decoding='async';i.src=src;return i;};
const ok=i=>i&&i.complete&&i.naturalWidth>0;

/* ---------- arte del repositorio ---------- */
const IM={bg:img('assets/embebidas/f6bc290b80.jpg'),logo:img('assets/embebidas/67423bd03d.png'),
  isl:img('assets/environment/backgrounds/scenery/floating_islands_sakura.png'),vil:img('assets/characters/villain/portrait.png'),
  boom:img('assets/effects/explosion_magia_a.png'),crack:img('assets/effects/fx_grieta_cielo_magia.png'),petal:img('assets/intro-premium/petalo_sakura.png')};
const CLOUDS=['c01','d01','d02','d03'].map(n=>img('assets/environment/sky/clouds/cloud_'+n+'.png'));
const EVE=window.SAKURA_EVE_MANIFEST||window.SAKURA_MANIFEST;
const ebase=(EVE&&EVE.base)||'assets/characters/sakura/';
const KM=window.ANTAREZ_MANIFEST,kbase=(KM&&KM.base)||'assets/characters/antarez/',KA=n=>((KM&&KM.animations&&KM.animations[n]&&KM.animations[n].frames)||[]),slow=(l,k)=>[].concat(...l.map(f=>Array(k).fill(f)));
const frames=(base,list)=>((list)||[]).map(f=>({img:img(base+f.file),ax:f.ax,ay:f.ay}));
const SK=frames(ebase,EVE&&EVE.run),SKI=frames(ebase,EVE&&EVE.idle),SKA=frames(ebase,EVE&&EVE.atk);
const KG=frames(kbase,KA('run')),KGI=frames(kbase,slow(KA('idle'),4)),KGA=frames(kbase,KA('melee'));
const nom=a=>a.reduce((m,f)=>Math.max(m,f.ay||0),1);
const NSK=nom(SK),NKG=nom(KG);

/* ---------- estilos ---------- */
if(!document.getElementById('n26Css')){const st=mk('style','n26Css',document.head);st.textContent=`
html.ipActive #tutorialModal{display:none!important}
#n26{position:fixed;inset:0;z-index:2100;background:#050817;overflow:hidden;color:#f4f6fc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none;
 transition:opacity .75s ease,transform .9s cubic-bezier(.2,.8,.2,1),filter .75s ease}
#n26.out{opacity:0;transform:scale(1.07);filter:blur(10px);pointer-events:none}
#n26cv{position:absolute;inset:0;width:100%;height:100%}
.n26bars i{position:absolute;left:0;right:0;height:0;background:#02030b;z-index:3;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
.n26bars i:first-child{top:0}.n26bars i:last-child{bottom:0}#n26.cin .n26bars i{height:9vh}
#n26ld{position:absolute;left:0;right:0;top:0;bottom:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(18px,4vh,34px);transition:opacity .6s,transform .8s;padding-bottom:4vh}
#n26ld.gone{opacity:0;transform:translateY(-12px) scale(.98);pointer-events:none}
.n26logo{width:min(66vw,540px);max-height:34vh;object-fit:contain;filter:drop-shadow(0 0 28px rgba(255,150,30,.5)) drop-shadow(0 8px 14px rgba(0,0,0,.65));animation:n26float 5s ease-in-out infinite}
@keyframes n26float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.n26bar{position:relative;width:min(56vw,360px);height:4px;border-radius:9px;background:rgba(160,190,255,.16);overflow:visible}
.n26fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:9px;background:linear-gradient(90deg,#8b5cf6,#3fa7ff 55%,#ffd36b);box-shadow:0 0 14px rgba(80,170,255,.7)}
.n26run{position:absolute;bottom:3px;left:0;width:92px;height:92px;margin-left:-46px;pointer-events:none;filter:drop-shadow(0 0 10px rgba(110,200,255,.55))}
.n26pct{font:700 11px/1 Inter,system-ui,sans-serif;letter-spacing:.22em;color:rgba(200,220,255,.62);font-variant-numeric:tabular-nums;margin-top:-4px}
#n26tap{position:absolute;left:50%;bottom:max(8vh,calc(env(safe-area-inset-bottom) + 30px));transform:translateX(-50%);z-index:5;opacity:0;pointer-events:none;transition:opacity .6s;
 padding:13px 26px;border-radius:99px;border:1px solid rgba(255,214,120,.5);background:rgba(8,12,30,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
 font:800 12px/1 Inter,system-ui,sans-serif;letter-spacing:.24em;color:#ffe9b0;white-space:nowrap;cursor:pointer}
#n26tap.on{opacity:1;pointer-events:auto;animation:n26pulse 1.8s ease-in-out infinite}
@keyframes n26pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,200,90,.35)}50%{box-shadow:0 0 0 14px rgba(255,200,90,0)}}
#n26cap{position:absolute;left:0;right:0;bottom:calc(9vh + 18px);z-index:5;text-align:center;padding:0 6vw;text-wrap:balance;font:700 clamp(16px,2.3vw,28px)/1.4 Inter,system-ui,sans-serif;letter-spacing:.01em;text-shadow:0 3px 22px rgba(0,0,0,.95),0 0 28px rgba(60,160,255,.35);pointer-events:none}
#n26cap span{display:inline-block;margin:0 .14em;opacity:0;animation:n26w .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*80ms)}
#n26cap.hide span{animation:n26wo .45s ease both;animation-delay:0s}
@keyframes n26w{from{opacity:0;transform:translateY(14px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes n26wo{to{opacity:0;transform:translateY(-8px);filter:blur(4px)}}
#n26skip{position:absolute;top:max(14px,env(safe-area-inset-top));right:max(14px,env(safe-area-inset-right));z-index:6;opacity:0;pointer-events:none;transition:opacity .5s;
 background:rgba(8,12,30,.5);border:1px solid rgba(200,220,255,.3);color:#dbe8ff;font:700 11px/1 Inter,system-ui,sans-serif;letter-spacing:.16em;padding:10px 15px;border-radius:99px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
#n26skip.on{opacity:.85;pointer-events:auto}#n26skip:hover{opacity:1;background:rgba(80,140,255,.2)}
@media(max-height:480px){.n26logo{max-height:30vh;width:min(48vw,380px)}.n26run{width:70px;height:70px;margin-left:-35px}#n26ld{gap:14px}}
@media(prefers-reduced-motion:reduce){.n26logo,#n26tap.on{animation:none}}
`;}

/* ---------- audio sintetizado (sin archivos; solo suena tras un toque) ---------- */
let ac=null,out=null,s0=0,nbuf=null;
function audioInit(){
  ac=null;if(typeof AC==='undefined'||(typeof _muted!=='undefined'&&_muted))return;
  try{AC.resume&&AC.resume();}catch(e){}
  try{ac=AC;out=ac.createGain();out.gain.value=.85;out.connect(ac.destination);
    nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){ac=null;}
}
function osc(type,f,t,dur,vol,f1,att){if(!ac)return;const T=s0+t,o=ac.createOscillator(),g=ac.createGain();att=att||.01;
  o.type=type;o.frequency.setValueAtTime(f,T);if(f1)o.frequency.exponentialRampToValueAtTime(f1,T+dur);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+att);g.gain.exponentialRampToValueAtTime(.0001,T+dur);
  o.connect(g);g.connect(out);o.start(T);o.stop(T+dur+.05);}
function nz(t,dur,vol,ft,f0,f1,att){if(!ac)return;const T=s0+t,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();att=att||.005;
  s.buffer=nbuf;s.loop=true;f.type=ft||'bandpass';f.Q.value=1.1;f.frequency.setValueAtTime(f0,T);f.frequency.exponentialRampToValueAtTime(f1,T+dur);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+att);g.gain.exponentialRampToValueAtTime(.0001,T+dur);
  s.connect(f);f.connect(g);g.connect(out);s.start(T);s.stop(T+dur+.05);}
function pad(t,dur,f,vol){if(!ac)return;const T=s0+t,lp=ac.createBiquadFilter(),g=ac.createGain();
  lp.type='lowpass';lp.frequency.setValueAtTime(220,T);lp.frequency.exponentialRampToValueAtTime(1200,T+dur*.7);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+dur*.45);g.gain.linearRampToValueAtTime(0,T+dur);
  [-6,6].forEach(c=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=c;o.connect(lp);o.start(T);o.stop(T+dur+.1);});lp.connect(g);g.connect(out);}
const boom=(t,v)=>{osc('sine',90,t,.9,v,28);nz(t,.5,v*.7,'lowpass',2200,120);};
const taiko=(t,v)=>{osc('sine',150,t,.35,v,55);nz(t,.12,v*.45,'bandpass',900,300);};
const bell=(t,f,v)=>{osc('sine',f,t,1.8,v||.07,null,.005);osc('sine',f*2.76,t,.9,(v||.07)*.35,null,.005);};
function score(){
  pad(0,5.4,55,.18);pad(0,5.4,82.4,.1);
  [.9,1.7,2.5,3.4].forEach((t,i)=>bell(t,[660,784,988,880][i],.055));
  pad(5,6,49,.2);pad(5,6,73.4,.1);boom(5.6,.5);nz(5.6,.3,.3,'highpass',3000,9000);
  boom(8.2,.8);nz(8.2,.6,.4,'bandpass',2000,180);
  for(let t=11,i=0;t<14.6;t+=.5,i++)taiko(t,i%4===0?.5:.28);
  nz(13.4,1.4,.25,'bandpass',300,6500,1.2);osc('sawtooth',110,13.4,1.4,.07,440,1);
  boom(15,.85);nz(15,.5,.5,'highpass',2500,9000);osc('sine',2200,15,.7,.1,1500);
  [110,165,220,262,330].forEach(f=>pad(15,3.2,f,.1));[15.3,15.6,15.9,16.2].forEach((t,i)=>bell(t,[880,1047,1319,1568][i],.065));
}

/* ---------- estado ---------- */
let root,cv,cx,VW=0,VH=0,DPR=1,raf=0,dead=true,phase='load',last=0,dt=.016;
let loadStart=0,real=0,shown=0,T=0,t0=0,story=false,capTimer=0,ci=0,cues=[],tapT0=0,skipT=0,outAt=0;
let flash=0,shake=0,bolt=null,boltT=-9,shattered=false,holdT=null;
const DIG=[],MOT=[],PET=[],SHARD=[],RING=[],CLD=[];
const STR=['7×8','6×9','9×9','12×4','8×7','×','5×5','3×4','÷','4×6','7×7','2×9','56','54','81'];
let vig=null,tabC=null,tabW=0;

function resize(){DPR=Math.min(devicePixelRatio||1,2);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR|0;cv.height=VH*DPR|0;cx.setTransform(DPR,0,0,DPR,0,0);vig=null;tabC=null;}
function cover(im,a,z,px,py){if(!ok(im)||a<=0)return;const s=Math.max(VW/im.naturalWidth,VH/im.naturalHeight)*z,w=im.naturalWidth*s,h=im.naturalHeight*s;
  cx.globalAlpha=cl(a,0,1);cx.drawImage(im,(VW-w)/2+px*VW,(VH-h)/2+py*VH,w,h);cx.globalAlpha=1;}
function glow(x,y,r,c0){const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c0);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);}
function vignette(a){if(!vig){vig=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.32,VW/2,VH/2,Math.max(VW,VH)*.78);vig.addColorStop(0,'rgba(0,0,10,0)');vig.addColorStop(1,'rgba(0,0,12,.82)');}
  cx.globalAlpha=a;cx.fillStyle=vig;cx.fillRect(0,0,VW,VH);cx.globalAlpha=1;}
function rays(t,a){cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const x=((i*VW*.33+t*14)%(VW*1.3))-VW*.15,w=VW*.07,g=cx.createLinearGradient(x,0,x-VW*.25,VH);
    g.addColorStop(0,'rgba(170,190,255,'+(.08*a)+')');g.addColorStop(1,'rgba(170,190,255,0)');cx.fillStyle=g;
    cx.beginPath();cx.moveTo(x,0);cx.lineTo(x+w,0);cx.lineTo(x+w-VW*.25,VH);cx.lineTo(x-VW*.25,VH);cx.closePath();cx.fill();}cx.restore();}
function sprite(fr,nm,x,gy,h,al,flip){if(!fr||!ok(fr.img))return;const s=h/nm;cx.save();cx.globalAlpha=al==null?1:al;
  if(flip){cx.translate(x,0);cx.scale(-1,1);cx.drawImage(fr.img,-fr.ax*s,gy-fr.ay*s,fr.img.naturalWidth*s,fr.img.naturalHeight*s);}
  else cx.drawImage(fr.img,x-fr.ax*s,gy-fr.ay*s,fr.img.naturalWidth*s,fr.img.naturalHeight*s);cx.restore();}
const fr=(a,t,fps)=>a.length?a[Math.floor(t*fps)%a.length]:null;
/* recorte de las hojas de efectos (3 columnas × 2 filas) */
function cell(im,c,r,cols,rows,x,y,w,al,rot){if(!ok(im))return;const sw=im.naturalWidth/cols,sh=im.naturalHeight/rows,h=w*sh/sw;
  cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=cl(al,0,1);cx.translate(x,y);if(rot)cx.rotate(rot);cx.drawImage(im,c*sw,r*sh,sw,sh,-w/2,-h/2,w,h);cx.restore();}

/* ---------- partículas ---------- */
function spawnDig(up){const s=STR[Math.random()*STR.length|0];
  DIG.push(up?{s,sz:rnd(14,30),x:rnd(0,VW),y:VH+30,vx:rnd(-8,8),vy:-rnd(22,60),l:0,L:rnd(5,9),col:'255,214,120'}
    :{s,sz:rnd(14,30),x:rnd(0,VW),y:-30,vx:rnd(-30,30),vy:rnd(120,300),l:0,L:rnd(2,4),col:Math.random()<.75?'255,70,110':'255,255,255'});}
function spawnMote(col){MOT.push({x:rnd(0,VW),y:VH+8,vx:rnd(-14,14),vy:-rnd(30,110),r:rnd(1,3),l:0,L:rnd(3,7),ph:rnd(0,6),col:col||(Math.random()<.5?'120,200,255':'255,200,110')});}
function spawnPetal(){PET.push({x:rnd(-40,VW),y:-20,vx:rnd(18,60),vy:rnd(30,70),s:rnd(8,18),r:rnd(0,6),vr:rnd(-2,2),l:0,L:rnd(8,13),ph:rnd(0,6)});}
function ring(x,y,dur,max,col){RING.push({x,y,t:0,dur,max,col});}
function drawParticles(a,digA){
  for(let i=DIG.length-1;i>=0;i--){const p=DIG[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.l>p.L||p.y<-60||p.y>VH+60){DIG.splice(i,1);continue;}
    cx.globalAlpha=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*digA;cx.fillStyle='rgb('+p.col+')';cx.font='800 '+p.sz+'px Inter,system-ui,sans-serif';cx.fillText(p.s,p.x,p.y);}
  cx.globalAlpha=1;cx.save();cx.globalCompositeOperation='lighter';
  for(let i=MOT.length-1;i>=0;i--){const p=MOT[i];p.l+=dt;p.ph+=dt*2;p.x+=(p.vx+Math.sin(p.ph)*16)*dt;p.y+=p.vy*dt;if(p.l>p.L||p.y<-20){MOT.splice(i,1);continue;}
    const al=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*a;cx.fillStyle='rgba('+p.col+','+al*.9+')';cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();
    cx.fillStyle='rgba('+p.col+','+al*.18+')';cx.beginPath();cx.arc(p.x,p.y,p.r*3.4,0,6.283);cx.fill();}
  cx.restore();
  if(ok(IM.petal))for(let i=PET.length-1;i>=0;i--){const p=PET[i];p.l+=dt;p.ph+=dt*1.6;p.r+=p.vr*dt;p.x+=(p.vx+Math.sin(p.ph)*22)*dt;p.y+=p.vy*dt;if(p.l>p.L||p.y>VH+30){PET.splice(i,1);continue;}
    cx.save();cx.globalAlpha=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*.8*a;cx.translate(p.x,p.y);cx.rotate(p.r);cx.drawImage(IM.petal,-p.s/2,-p.s/2,p.s,p.s);cx.restore();}
  cx.globalAlpha=1;
}
function drawRings(){cx.save();cx.globalCompositeOperation='lighter';
  for(let i=RING.length-1;i>=0;i--){const r=RING[i];r.t+=dt;const u=r.t/r.dur;if(u>=1){RING.splice(i,1);continue;}
    cx.globalAlpha=(1-u)*.85;cx.strokeStyle=r.col;cx.lineWidth=1.5+9*(1-u);cx.beginPath();cx.arc(r.x,r.y,r.max*eo(u),0,6.283);cx.stroke();}cx.restore();cx.globalAlpha=1;}
function lightning(){boltT=T;flash=.8;shake=Math.max(shake,.6);const pts=[];let x=rnd(VW*.2,VW*.8),y=0;while(y<VH*.6){pts.push([x,y]);x+=rnd(-50,50);y+=rnd(25,60);}bolt=pts;}

/* ---------- la Tabla de Multiplicar (se agrieta y estalla) ---------- */
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function makeTablet(){const w=Math.round(Math.min(VW*.2,230)),h=Math.round(w*1.28);if(tabC&&tabW===w)return;tabW=w;tabC=document.createElement('canvas');tabC.width=w;tabC.height=h;const x=tabC.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#5d6384');g.addColorStop(.5,'#8a91b8');g.addColorStop(1,'#444868');
  rr(x,4,4,w-8,h-8,w*.08);x.fillStyle=g;x.fill();x.lineWidth=4;x.strokeStyle='#23263a';x.stroke();
  rr(x,w*.08,w*.08,w-w*.16,h-w*.16,w*.05);x.lineWidth=1.5;x.strokeStyle='rgba(120,210,255,.75)';x.stroke();
  x.textAlign='center';x.fillStyle='#bfeaff';x.shadowColor='#39b8ff';x.shadowBlur=10;x.font='900 '+(w*.11)+'px Inter,system-ui,sans-serif';x.fillText('TABLA DEL 7',w/2,h*.2);
  x.font='800 '+(w*.1)+'px Inter,system-ui,sans-serif';for(let i=1;i<=6;i++)x.fillText('7×'+i+' = '+(7*i),w/2,h*.36+(i-1)*w*.15);}
function shatter(cxp,cyp){makeTablet();const w=tabC.width,h=tabC.height,gx=4,gy=5,cw=w/gx,ch=h/gy;SHARD.length=0;
  for(let i=0;i<gx;i++)for(let j=0;j<gy;j++){const x=i*cw-w/2+cw/2,y=j*ch-h/2+ch/2;
    SHARD.push({sx:i*cw,sy:j*ch,cw,ch,x:cxp+x,y:cyp+y,vx:x*rnd(2.2,5)+rnd(-40,40),vy:y*rnd(2,4)-rnd(80,240),r:0,vr:rnd(-7,7),l:0,L:rnd(1.4,2.4)});}
  ring(cxp,cyp,.8,VW*.45,'rgba(255,80,110,1)');shattered=true;}
function drawTablet(t){
  if(t<5.9||t>10.9)return;makeTablet();const w=tabC.width,h=tabC.height,cxp=VW*.32,cyp=VH*.46;
  if(t<8.2){const a=ss(5.9,6.7,t),k=ss(7.3,8.15,t),tr=k*3;
    cx.save();cx.translate(cxp+rnd(-tr,tr),cyp+Math.sin(t*2)*7+rnd(-tr,tr));cx.globalAlpha=a;
    glow(0,0,w*.9,'rgba(60,170,255,'+(.35-k*.2)+')');cx.drawImage(tabC,-w/2,-h/2);
    if(k>0){cx.translate(-w/2,-h/2);cx.lineCap='round';cx.strokeStyle='rgba(255,70,100,'+(.4+k*.6)+')';cx.lineWidth=2.2;
      for(let c=0;c<5;c++){let px=w/2,py=h/2,ang=c*1.25+.4;cx.beginPath();cx.moveTo(px,py);const n=Math.max(1,Math.floor(7*k));for(let i=0;i<n;i++){ang+=Math.sin(c*7+i*3)*.5;px+=Math.cos(ang)*w*.13;py+=Math.sin(ang)*w*.13;cx.lineTo(px,py);}cx.stroke();}}
    cx.restore();}
  else{if(!shattered)shatter(cxp,cyp);}
  for(let i=SHARD.length-1;i>=0;i--){const p=SHARD[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=760*dt;p.r+=p.vr*dt;if(p.l>p.L){SHARD.splice(i,1);continue;}
    cx.save();cx.globalAlpha=1-ss(.55,1,p.l/p.L);cx.translate(p.x,p.y);cx.rotate(p.r);cx.drawImage(tabC,p.sx,p.sy,p.cw,p.ch,-p.cw/2,-p.ch/2,p.cw,p.ch);cx.restore();}
}

/* ---------- el villano ---------- */
const EYES=[[.5156,.1431],[.6001,.1596]],BOOK=[.825,.303];
function drawVillain(t){const im=IM.vil;if(!ok(im))return;const a=ss(5.6,7.0,t)*(1-ss(10.0,10.9,t));if(a<=.01)return;
  const rise=eo((t-5.6)/2),h=VH*.8*(.92+.08*rise)+Math.sin(t*1.4)*4,w=h*im.naturalWidth/im.naturalHeight,x=VW*.7,base=VH*.97+(1-rise)*VH*.2+Math.sin(t*1.5)*5,tx=x-w/2,ty=base-h;
  cx.save();cx.globalCompositeOperation='lighter';glow(x,base-h*.5,h*.8,'rgba(150,50,255,'+(.5*a)+')');cx.globalCompositeOperation='source-over';
  cx.globalAlpha=a;cx.drawImage(im,tx,ty,w,h);cx.globalCompositeOperation='lighter';
  const pul=.65+.35*Math.sin(t*7)+(Math.random()<.04?.5:0);
  EYES.forEach(e=>{const ex=tx+e[0]*w,ey=ty+e[1]*h;glow(ex,ey,h*.07,'rgba(255,50,40,'+Math.min(1,.9*pul)*a+')');glow(ex,ey,h*.022,'rgba(255,235,170,'+a+')');});
  glow(tx+BOOK[0]*w,ty+BOOK[1]*h,h*.12,'rgba(190,110,255,'+(.45+.25*Math.sin(t*4))*a+')');cx.restore();}

/* ---------- subtítulos ---------- */
function say(txt){const c=document.getElementById('n26cap');if(!c)return;c.classList.remove('hide');
  c.innerHTML=txt.split(' ').map((w,i)=>'<span style="--i:'+i+'">'+w+'</span>').join(' ');}
function hideCap(){const c=document.getElementById('n26cap');if(c)c.classList.add('hide');}
function plate(txt,sub,x,y,col,al){if(al<=.01)return;cx.save();cx.globalAlpha=al;cx.textAlign='center';
  cx.fillStyle='#fff';cx.font='900 '+Math.max(14,VW*.02)+'px Inter,system-ui,sans-serif';cx.fillText(txt,x,y);
  cx.fillStyle=col;cx.fillRect(x-VW*.035,y+8,VW*.07,2);cx.fillStyle='rgba(215,228,255,.8)';cx.font='700 '+Math.max(9,VW*.009)+'px Inter,system-ui,sans-serif';
  cx.fillText(sub,x,y+8+Math.max(14,VW*.014));cx.restore();}

/* ---------- guion ---------- */
function buildCues(){cues=[
 {t:.2,f:()=>root.classList.add('cin')},
 {t:.7,f:()=>say('Hace mucho tiempo, el Reino de los Números vivía en paz…')},{t:4.5,f:hideCap},
 {t:5.4,f:lightning},{t:5.9,f:()=>say('…hasta que el Rey del Caos robó las Tablas de Multiplicar.')},
 {t:8.2,f:()=>{lightning();flash=1;}},{t:10.2,f:hideCap},
 {t:11.2,f:()=>say('Solo dos ninjas pueden recuperarlas…')},{t:13.6,f:()=>say('¡y necesitan tu ayuda!')},
 {t:14.7,f:hideCap},{t:15.0,f:()=>{flash=1;shake=1;ring(VW/2,VH*.46,1.1,VW*.7,'rgba(255,214,120,1)');ring(VW/2,VH*.46,1.5,VW*.95,'rgba(120,190,255,1)');root.classList.remove('cin');}},
 {t:18.4,f:()=>startOut()}];}

function drawStory(){
  const t=T;cx.save();const sh=shake*shake*12;if(sh>.1)cx.translate(rnd(-sh,sh),rnd(-sh,sh));
  cx.fillStyle='#04050f';cx.fillRect(-20,-20,VW+40,VH+40);
  const A=1-ss(4.9,5.8,t),B=ss(4.9,5.8,t)*(1-ss(10.6,11.3,t)),C=ss(10.6,11.3,t)*(1-ss(14.8,15.1,t)),D=ss(14.9,15.2,t);
  /* Acto 1 · el reino en paz */
  if(A>0){cover(IM.bg,A,1.08+t*.008,-.01*t,0);
    if(ok(IM.isl)){const w=VW*(.62+.025*t/5),h=w*IM.isl.naturalHeight/IM.isl.naturalWidth;cx.save();cx.globalAlpha=A*ss(.1,1.6,t);
      glow(VW/2,VH*.3,w*.5,'rgba(190,150,255,.25)');cx.drawImage(IM.isl,VW/2-w/2,VH*.34-h/2+Math.sin(t*.9)*8,w,h);cx.restore();}
    cx.fillStyle='rgba(8,10,40,'+(.25*A)+')';cx.fillRect(0,0,VW,VH);
    CLD.forEach((c,i)=>{const im=CLOUDS[i%CLOUDS.length];if(!ok(im))return;const sp=14+i*9,w=VW*(.22+i*.05),x=((c.x+t*sp)%(VW+w*2))-w;cx.globalAlpha=A*(.28+i*.06);cx.drawImage(im,x,VH*(.12+i*.17),w,w*im.naturalHeight/im.naturalWidth);});cx.globalAlpha=1;}
  /* Acto 2 · el caos */
  if(B>0){cover(IM.bg,B*.9,1.1,0,0);cx.fillStyle='rgba(60,0,40,'+(.55*B)+')';cx.fillRect(0,0,VW,VH);
    const k=ss(5.4,8,t);cx.fillStyle='rgba(150,10,40,'+(.22*k*B)+')';cx.fillRect(0,0,VW,VH);
    cell(IM.crack,2,0,3,2,VW*.5,VH*.2,VW*.7,B*(.45+.25*Math.sin(t*5)),-.1);}
  /* Acto 3 · los héroes */
  if(C>0){cover(IM.bg,C*.55,1.12,.02,0);cx.fillStyle='rgba(2,4,22,'+(.55*C)+')';cx.fillRect(0,0,VW,VH);
    const gy=VH*.7,hh=VH*.44,u=eo((t-11.2)/2.6),run=u<.97,xl=-VW*.25+(VW*.38+VW*.25)*u,xr=VW*1.25-(VW*1.25-VW*.62)*u;
    cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle='rgba(170,215,255,.2)';cx.lineWidth=2;
    for(let i=0;i<14;i++){const y=rnd(VH*.15,VH*.85),x=rnd(0,VW),L=rnd(80,300)*(run?1:.2);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+L,y);cx.stroke();}cx.restore();
    const g=cx.createLinearGradient(0,gy-4,0,gy+VH*.2);g.addColorStop(0,'rgba(120,190,255,.28)');g.addColorStop(1,'rgba(120,190,255,0)');cx.globalAlpha=C;cx.fillStyle=g;cx.fillRect(0,gy-2,VW,VH*.2);cx.globalAlpha=1;
    glow(xl,gy-hh*.4,hh*.8,'rgba(255,60,150,'+.2*C+')');glow(xr,gy-hh*.4,hh*.8,'rgba(255,70,50,'+.2*C+')');
    sprite(run?fr(SK,t,16):fr(SKI,t,10),NSK,xl,gy,hh,C);sprite(run?fr(KG,t,18):fr(KGI,t,10),NKG,xr,gy,hh,C,true);
    const pa=ss(13.4,14,t)*C;plate('SAKURA EVE','NINJA DEL VIENTO',VW*.38,gy+VH*.065,'#ff5fa8',pa);plate('ANTAREZ','NINJA DE LA KATANA',VW*.62,gy+VH*.065,'#ff5a4a',pa);}
  rays(t,t<5?.5:t<11?.3:.7);
  drawTablet(t);drawVillain(t);
  /* Acto 4 · título */
  if(D>0){const g=cx.createRadialGradient(VW/2,VH*.46,0,VW/2,VH*.46,Math.max(VW,VH)*.7);g.addColorStop(0,'rgba(120,60,20,'+.7*D+')');g.addColorStop(.5,'rgba(25,8,50,'+.82*D+')');g.addColorStop(1,'rgba(2,2,12,'+D+')');cx.fillStyle=g;cx.fillRect(0,0,VW,VH);
    cell(IM.boom,0,0,3,2,VW/2,VH*.46,VW*.55*(.4+eo((t-15)/.6)),1-ss(15.2,16.6,t));
    const u=cl((t-15.1)/.55,0,1),sc=1+1.6*Math.pow(1-u,3),w=Math.min(VW*.74,640,VH*1.5),h=w*IM.logo.naturalHeight/(IM.logo.naturalWidth||1);
    if(ok(IM.logo)){cx.save();cx.translate(VW/2,VH*.44+Math.sin(t*1.6)*4);cx.scale(sc,sc);cx.globalAlpha=cl(u*2.5,0,1);glow(0,0,w*.6,'rgba(255,150,30,.35)');cx.drawImage(IM.logo,-w/2,-h/2,w,h);cx.restore();
      const ta=ss(16.2,17.2,t);if(ta>0){cx.save();cx.globalAlpha=ta*.9;cx.textAlign='center';cx.fillStyle='#ffe3a0';cx.font='800 '+Math.max(11,Math.min(VW*.014,16))+'px Inter,system-ui,sans-serif';
        const txt='A V E N T U R A   M A T E M Á T I C A';cx.fillText(txt,VW/2,VH*.44+h/2+VH*.07);cx.restore();}}}
  drawRings();
  /* partículas y rayos */
  if(t>.8&&t<5&&Math.random()<dt*7)spawnDig(true);if(t>=5.4&&t<10.5&&Math.random()<dt*(10+(t-5.4)*3))spawnDig(false);
  if(t>.6&&t<5&&Math.random()<dt*6)spawnPetal();if(Math.random()<dt*(t>=15?60:t>=11?5:12))spawnMote(t>=5.4&&t<11?'190,110,255':null);
  drawParticles(1,.55);
  if(bolt&&t-boltT<.28){cx.save();cx.globalCompositeOperation='lighter';const a=1-(t-boltT)/.28;
    [['rgba(120,170,255,'+a*.6+')',9],['rgba(255,255,255,'+a+')',3]].forEach(([c,w])=>{cx.strokeStyle=c;cx.lineWidth=w;cx.beginPath();bolt.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();});cx.restore();}
  vignette(1);cx.restore();
  if(flash>.01){cx.fillStyle='rgba(255,255,255,'+cl(flash,0,1)+')';cx.fillRect(0,0,VW,VH);}
}

/* ---------- fondo de la carga y del título ---------- */
/* Montaje de la carga: Sakura recorre los 3 mundos (corre, salta, pelea, dispara, cruza portales) según avanza el %.
   Usa las mismas escenas de las tarjetas (engine/ui/preview-mundos.js). Si no está disponible, o si se apagaron las animaciones con el botón 🎞, queda el fondo de siempre. */
let MON=null,MONno=false;
function monJ(){if(MON||MONno)return MON;
  try{if(!window.PreviewMundos||!PreviewMundos.crearMontaje||!window.MundosRegistro)return null;
    if(localStorage.getItem('ninja_mundos_anim_v1')==='0'){MONno=true;return null;}
    MON=PreviewMundos.crearMontaje('sakura');if(!MON){MONno=true;return null;}PreviewMundos.precargar(MON.imgs);}catch(e){MONno=true;MON=null;}
  return MON;}
function drawLoadBG(){const el=(performance.now()-loadStart)/1000;
  cx.fillStyle='#050817';cx.fillRect(0,0,VW,VH);
  const mon=monJ();
  if(mon){try{mon.dibujar(cx,VW,VH,el,shown);}catch(e){MONno=true;MON=null;}}
  if(!mon){
  cover(IM.bg,ss(0,.8,el),1.06+Math.sin(el*.25)*.012,Math.sin(el*.2)*.008,0);
  const g=cx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'rgba(4,6,24,.35)');g.addColorStop(.55,'rgba(4,6,24,.25)');g.addColorStop(1,'rgba(3,4,16,.82)');cx.fillStyle=g;cx.fillRect(0,0,VW,VH);
  rays(el,.45);}
  if(Math.random()<dt*5)spawnMote();if(Math.random()<dt*2.4)spawnPetal();if(!REDUCED&&Math.random()<dt*2.2)spawnDig(true);
  drawParticles(1,.4);vignette(1);}

/* ---------- carga real ---------- */
const MINC=2.6; /* segundos mínimos de pantalla de carga (para que se vea el recorrido por los mundos) */
function runLoader(){const items=[];
  const wait=i=>new Promise(res=>{if(!i||(i.complete))return res();let d=false;const f=()=>{if(d)return;d=true;res();};i.addEventListener('load',f,{once:true});i.addEventListener('error',f,{once:true});setTimeout(f,9000);});
  const add=p=>items.push(Promise.resolve(p).catch(()=>null));
  Object.values(IM).forEach(i=>add(wait(i)));CLOUDS.forEach(i=>add(wait(i)));
  [SK,SKI,SKA,KG,KGI,KGA].forEach(a=>a.forEach(f=>add(wait(f.img))));
  ['assets/ui/select/sakura_3.png','assets/ui/select/antarez_3.png','assets/embebidas/ab8b337fd0.jpg'].forEach(s=>add(wait(img(s))));
  if(document.fonts&&document.fonts.load)add(document.fonts.load('800 14px Inter').catch(()=>{}));
  if(document.readyState!=='complete')add(new Promise(r=>addEventListener('load',r,{once:true})));
  let done=0;real=0;items.forEach(p=>p.then(()=>{done++;real=done/items.length;}));}

/* ---------- ciclo ---------- */
function startStory(viaUser){
  if(phase==='story')return;phase='story';audioInit();t0=performance.now();if(ac)s0=ac.currentTime+.1;if(ac)score();
  buildCues();ci=0;shattered=false;CLD.length=0;for(let i=0;i<4;i++)CLD.push({x:rnd(0,VW)});DIG.length=MOT.length=PET.length=0;
  const ld=document.getElementById('n26ld');ld.classList.add('gone');const tp=document.getElementById('n26tap');tp.classList.remove('on');
  skipT=performance.now()+1200;}
function startOut(){if(phase==='out')return;phase='out';outAt=performance.now();
  if(ac&&out){try{out.gain.cancelScheduledValues(ac.currentTime);out.gain.linearRampToValueAtTime(0,ac.currentTime+.9);}catch(e){}}
  hideCap();document.getElementById('n26skip').classList.remove('on');S0.classList.add('n26In');
  root.classList.add('out');setTimeout(finish,950);}
function finish(){dead=true;cancelAnimationFrame(raf);removeEventListener('keydown',onKey,true);removeEventListener('resize',resize);
  root&&root.remove();document.documentElement.classList.remove('ipActive');window.__introDone=true;setTimeout(()=>S0.classList.remove('n26In'),1300);
  try{window.dispatchEvent(new Event('introdone'));}catch(e){}}
function onKey(e){if(dead)return;e.stopImmediatePropagation();if(['Enter',' ','Escape'].indexOf(e.key)<0)return;e.preventDefault();
  if(phase==='ready')startStory(true);else if(phase==='story'&&T>1)startOut();}
function onPointer(){if(dead)return;if(phase==='ready'&&story)startStory(true);else if(phase==='story'&&T>1.2)startOut();}

function loop(ts){
  if(dead)return;dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
  shake=Math.max(0,shake-dt*1.8);flash=Math.max(0,flash-dt*2.6);
  if(phase==='load'||phase==='ready'||phase==='out'&&!story){
    const el=(performance.now()-loadStart)/1000;
    if(phase==='load'){
      shown+=(Math.min(real,el/(MINC))-shown)*Math.min(1,dt*4);const pct=Math.min(100,Math.round(shown*100));
      document.getElementById('n26pct').textContent=pct+'%';document.getElementById('n26fill').style.width=pct+'%';
      const run=document.getElementById('n26run');run.style.left=pct+'%';run.style.display=MON?'none':'';const rx=run.getContext('2d');rx.clearRect(0,0,184,184);
      const f=fr(SK,el,16);if(f&&ok(f.img)){const s=150/NSK;rx.drawImage(f.img,92-f.ax*s,170-f.ay*s,f.img.naturalWidth*s,f.img.naturalHeight*s);}
      if(shown>.995&&el>=(MINC)){phase='ready';tapT0=performance.now();
        if(story){document.getElementById('n26tap').classList.add('on');}else{setTimeout(()=>{if(!dead&&phase==='ready')startOut();},700);}}}
    else if(phase==='ready'&&story&&performance.now()-tapT0>7000)startStory(false);
    drawLoadBG();
  }else if(phase==='story'||phase==='out'){
    T=holdT!=null?holdT:(performance.now()-t0)/1000;
    if(phase==='story'){while(ci<cues.length&&cues[ci].t<=T){try{cues[ci].f();}catch(e){}ci++;}}
    drawStory();
    if(performance.now()>skipT&&phase==='story')document.getElementById('n26skip').classList.add('on');
  }
  raf=requestAnimationFrame(loop);
}

function build(opts){
  if(root)root.remove();
  dead=false;phase='load';story=opts.story;flash=shake=0;bolt=null;shown=0;real=0;DIG.length=MOT.length=PET.length=SHARD.length=RING.length=0;
  document.documentElement.classList.add('ipActive');
  root=mk('div','n26',document.body);cv=mk('canvas','n26cv',root);cx=cv.getContext('2d');
  const bars=mk('div',null,root,'n26bars');mk('i',null,bars);mk('i',null,bars);
  mk('div','n26cap',root);
  const ld=mk('div','n26ld',root);const lg=mk('img',null,ld,'n26logo');lg.src='assets/embebidas/67423bd03d.png';lg.alt='Ninja Multiplicación';lg.draggable=false;
  const bar=mk('div',null,ld,'n26bar');mk('i','n26fill',bar,'n26fill');const rc=mk('canvas','n26run',bar,'n26run');rc.width=rc.height=184;
  mk('div','n26pct',ld,'n26pct').textContent='0%';
  const tp=mk('button','n26tap',root);tp.type='button';tp.textContent='TOCA PARA COMENZAR';tp.addEventListener('click',e=>{e.stopPropagation();if(phase==='ready')startStory(true);});
  const sk=mk('button','n26skip',root);sk.type='button';sk.textContent='SALTAR ›';sk.addEventListener('click',e=>{e.stopPropagation();if(phase==='story')startOut();});
  resize();addEventListener('resize',resize);addEventListener('keydown',onKey,true);root.addEventListener('pointerdown',onPointer);
  loadStart=performance.now();last=performance.now();
  if(opts.skipLoad){real=1;shown=1;}else runLoader();
  raf=requestAnimationFrame(loop);
  requestAnimationFrame(()=>requestAnimationFrame(boot));
  if(opts.skipLoad){phase='ready';document.getElementById('n26ld').classList.add('gone');setTimeout(()=>startStory(true),50);}
}
function replay(){if(!dead)return;build({story:true,skipLoad:true});}
window.IntroPro={replay,skip(){if(!dead)startOut();},hold(s){holdT=s;}};
build({story:!REDUCED&&(FORCE||!hasSave)});
})();
