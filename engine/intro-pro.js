/* INTRO PRO — apertura cinematográfica: carga real → "toca para comenzar" → historia en 4 actos → título → transición al menú.
   · Usa las imágenes que el juego ya trae (fondo, logo, héroes, panel oscuro) y las animaciones nuevas de Sakura.
   · Arte opcional: assets/ui/intro/panel_1.jpg … panel_4.jpg (o .png) reemplazan los fondos de cada acto.
   · Jugadores con partida guardada ven una versión corta (carga + título). ?intro=full fuerza la historia · ?intro=0 la desactiva.
   · Botón "HISTORIA" en el menú (o IntroPro.replay()) la repite. */
(function(){
'use strict';
const Q=location.search;
if(/[?&]intro=0/.test(Q))return;
const S0=document.getElementById('S0');if(!S0)return;
let hasSave=false;try{hasSave=!!localStorage.getItem('mpl_v10_sv');}catch(e){}
const FORCE=/[?&]intro=full/.test(Q);
const old=document.getElementById('cineIntro');if(old)old.click();      /* cierra la intro anterior (cancela sus temporizadores) */

/* ---------- utilidades ---------- */
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ss=(a,b,x)=>{x=cl((x-a)/(b-a),0,1);return x*x*(3-2*x);};
const eo=x=>1-Math.pow(1-cl(x,0,1),3),rnd=(a,b)=>a+Math.random()*(b-a);
const mk=(tag,id,par,cls)=>{const e=document.createElement(tag);if(id)e.id=id;if(cls)e.className=cls;if(par)par.appendChild(e);return e;};
const img=src=>{const i=new Image();i.src=src;return i;};
const dom=(sel,i)=>{const e=document.querySelectorAll(sel)[i||0];return e?img(e.currentSrc||e.src):null;};
const ok=i=>i&&i.complete&&i.naturalWidth>0;
const IM={logo:dom('#cineLogo')||dom('#introTitle'),panel:dom('#cineBeat3 img'),dark:dom('#cineDarkPanel'),
  heroL:dom('#cineBeat4 img',0),heroR:dom('#cineBeat4 img',1),slash:dom('#cineSlash')};
(function(){const d=S0.querySelector('div[style*="background-image"]');
  const m=d&&/url\(["']?([^"')]+)["']?\)/.exec(d.style.backgroundImage);IM.bg=m?img(m[1]):null;})();
IM.villain=img('assets/characters/villain/portrait.png');
const SK=((window.SAKURA_MANIFEST&&SAKURA_MANIFEST.run)||[]).map(f=>({img:img('assets/characters/sakura/'+f.file),ax:f.ax,ay:f.ay}));
const KG=((window.KAGE_MANIFEST&&KAGE_MANIFEST.run)||[]).map(f=>({img:img('assets/characters/kage/'+f.file),ax:f.ax,ay:f.ay}));
const PAN=[null,null,null,null];
function tryPanel(n){return new Promise(res=>{const a=img('assets/ui/intro/panel_'+n+'.jpg');
  a.onload=()=>{PAN[n-1]=a;res();};
  a.onerror=()=>{const b=img('assets/ui/intro/panel_'+n+'.png');b.onload=()=>{PAN[n-1]=b;res();};b.onerror=()=>res();};});}

/* ---------- estilos ---------- */
if(!document.getElementById('ipCss')){const st=mk('style','ipCss',document.head);st.textContent=`
#ipRoot{position:fixed;inset:0;z-index:2100;background:#02000a;overflow:hidden;font-family:'Press Start 2P',monospace;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
#ipCv{position:absolute;inset:0;width:100%;height:100%}
.ipBar{position:absolute;left:0;right:0;height:0;background:#000;z-index:3;transition:height 1.2s cubic-bezier(.2,.8,.2,1)}
#ipBarT{top:0}#ipBarB{bottom:0}#ipRoot.cin .ipBar{height:12vh}
#ipCap{position:absolute;left:0;right:0;bottom:2.4vh;text-align:center;z-index:4;font-size:clamp(9px,1.9vw,16px);line-height:2.1;padding:0 6vw;opacity:0;transition:opacity .6s;text-shadow:0 0 16px rgba(0,170,255,.75),2px 2px 0 #000;pointer-events:none}
#ipLoad{position:absolute;left:50%;bottom:9vh;transform:translateX(-50%);width:min(72vw,560px);z-index:4;text-align:center;transition:opacity .6s}
#ipPct{font-size:clamp(10px,2vw,15px);color:#ffd36b;letter-spacing:3px;margin-bottom:34px;text-shadow:0 0 14px rgba(255,170,0,.7)}
#ipBar{position:relative;height:10px;border:1px solid rgba(255,211,107,.55);border-radius:8px;background:rgba(0,0,0,.55);box-shadow:0 0 18px rgba(255,150,0,.25)}
#ipFill{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#ff3b8d,#ffb347,#fff2a0);box-shadow:0 0 16px rgba(255,170,60,.9)}
#ipRun{position:absolute;bottom:6px;left:0;width:96px;height:96px;margin-left:-48px;pointer-events:none;filter:drop-shadow(0 0 10px rgba(255,80,160,.7))}
#ipTip{margin-top:20px;font-size:clamp(7px,1.35vw,10px);line-height:2;color:rgba(190,215,255,.85);min-height:3em;transition:opacity .4s}
#ipTap{position:absolute;left:0;right:0;bottom:12vh;text-align:center;z-index:4;font-size:clamp(10px,2.1vw,17px);color:#fff;letter-spacing:3px;opacity:0;text-shadow:0 0 18px rgba(255,200,80,.9),2px 2px 0 #000;pointer-events:none}
#ipTap.on{animation:ipBlink 1.3s ease-in-out infinite}
@keyframes ipBlink{0%,100%{opacity:.25}50%{opacity:1}}
#ipSkip{position:absolute;top:14px;right:14px;z-index:6;background:rgba(0,10,40,.65);border:1px solid rgba(0,200,255,.5);color:#8cf;font-family:inherit;font-size:clamp(7px,1.4vw,10px);padding:8px 12px;border-radius:20px;cursor:pointer;letter-spacing:1px;opacity:0;transition:opacity .5s}
#ipRing{position:absolute;left:50%;top:50%;border-radius:50%;border:4px solid rgba(255,214,120,.95);box-shadow:0 0 40px 8px rgba(255,170,60,.8),inset 0 0 40px rgba(255,170,60,.6);transform:translate(-50%,-50%);z-index:7;pointer-events:none;display:none}
@keyframes ipMenuIn{0%{opacity:0;transform:scale(1.12);filter:blur(10px) brightness(1.9)}100%{opacity:1;transform:none;filter:none}}
#S0.ipIn{animation:ipMenuIn 1.3s cubic-bezier(.2,.8,.2,1) both}
html.ipActive #tutorialModal{display:none!important}
#ipReplay{position:fixed;left:12px;bottom:12px;z-index:60;background:rgba(10,0,30,.6);border:1px solid rgba(255,211,107,.5);color:#ffd36b;font-family:'Press Start 2P',monospace;font-size:9px;padding:8px 11px;border-radius:16px;cursor:pointer;letter-spacing:1px}
`;}

/* ---------- audio (sintetizado, pasa por el bus con reverb del motor FX si está activo) ---------- */
let ac=null,out=null,s0=0,startT=0,nbuf=null;
function audioInit(viaUser){
  ac=null;if(typeof AC==='undefined'||(typeof _muted!=='undefined'&&_muted))return;
  try{AC.resume&&AC.resume();}catch(e){}
  if(!viaUser&&AC.state!=='running')return;
  ac=AC;out=ac.createGain();out.gain.value=.9;out.connect(ac.destination);
  nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
function osc(type,f,t,dur,vol,f1,att){
  if(!ac||t<startT)return;const T=s0+t,o=ac.createOscillator(),g=ac.createGain();att=att||.01;
  o.type=type;o.frequency.setValueAtTime(f,T);if(f1)o.frequency.exponentialRampToValueAtTime(f1,T+dur);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+att);g.gain.exponentialRampToValueAtTime(.0001,T+dur);
  o.connect(g);g.connect(out);o.start(T);o.stop(T+dur+.05);
}
function nz(t,dur,vol,ft,f0,f1,att){
  if(!ac||t<startT)return;const T=s0+t,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();att=att||.005;
  s.buffer=nbuf;s.loop=true;f.type=ft||'bandpass';f.Q.value=1.1;f.frequency.setValueAtTime(f0,T);f.frequency.exponentialRampToValueAtTime(f1,T+dur);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+att);g.gain.exponentialRampToValueAtTime(.0001,T+dur);
  s.connect(f);f.connect(g);g.connect(out);s.start(T);s.stop(T+dur+.05);
}
function pad(t,dur,f,vol){
  if(!ac||t+dur<startT)return;const T=s0+Math.max(t,startT),D=dur-Math.max(0,startT-t),lp=ac.createBiquadFilter(),g=ac.createGain();
  lp.type='lowpass';lp.frequency.setValueAtTime(180,T);lp.frequency.exponentialRampToValueAtTime(1100,T+D*.7);
  g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+D*.45);g.gain.linearRampToValueAtTime(0,T+D);
  [-6,6].forEach(c=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=c;o.connect(lp);o.start(T);o.stop(T+D+.1);});
  lp.connect(g);g.connect(out);
}
const boom=(t,v)=>{osc('sine',90,t,.9,v,28);nz(t,.5,v*.7,'lowpass',2200,120);};
const taiko=(t,v)=>{osc('sine',150,t,.35,v,55);nz(t,.12,v*.45,'bandpass',900,300);};
const bell=(t,f,v)=>{osc('sine',f,t,1.8,v||.07,null,.005);osc('sine',f*2.76,t,.9,(v||.07)*.35,null,.005);};
function score(){
  [3.4,4.2,5.0,5.9,6.6].forEach((t,i)=>bell(t,[660,784,988,880,1175][i],.06));
  pad(2.0,5.4,55,.2);pad(2.0,5.4,82.4,.12);
  osc('sawtooth',74,9.5,2.8,.12,34,.7);osc('square',37,9.5,2.8,.07,30,.9);nz(9.5,2.4,.12,'lowpass',500,90,.8);
  osc('sawtooth',233,9.7,1.6,.045,220,.5);osc('sawtooth',247,9.7,1.6,.045,233,.5);
  [8.7,8.85,9.0].forEach((t,i)=>{nz(t,.18,.18+i*.06,'highpass',2200,7000);osc('square',180-i*30,t,.08,.05,60);});nz(9.2,.8,.45,'bandpass',2000,180);
  [7.4,9.2,10.9,12.3].forEach((t,i)=>{boom(t,.5);if(i!==1)nz(t,.35,.35,'highpass',3000,9000);});
  pad(7.2,6.4,49,.2);pad(7.2,6.4,73.4,.1);
  for(let t=13.6,i=0;t<17.8;t+=.5,i++)taiko(t,i%4===0?.55:.3);
  nz(16.4,1.8,.28,'bandpass',300,6500,1.4);osc('sawtooth',110,16.4,1.8,.08,440,1.2);
  nz(18.2,.5,.5,'highpass',2500,9000);osc('sine',2200,18.2,.7,.12,1500);boom(18.2,.7);
  nz(19.0,1.0,.3,'bandpass',500,8000,.9);
  boom(20.0,.9);[110,165,220,261.6,330].forEach(f=>pad(20.0,4.4,f,.12));
  [20.5,20.85,21.2,21.55,21.9].forEach((t,i)=>bell(t,[880,1047,1319,1568,1760][i],.07));
  nz(25.0,.8,.3,'bandpass',400,5000,.2);
}

/* ---------- estado y escena ---------- */
let root,cv,cx,VW=0,VH=0,DPR=1,raf=0,dead=false,phase='load',last=0;
let holdT=null,t0=0,T=0,wipeT0=0,wipeDur=1,ci=0,cues=[],shake=0,flash=0,glitchK=0,bolt=null,boltT=-9,loadShown=0,loadStart=0,minLoad=2.4,real=0,tapT0=0,tapWait=7,full=true,capTimer=0;
const DIG=[],EMB=[],RING=[],SPK=[];const glyphs={};
const STR=['7×8','6×9=54','9×9','12×4','8×7=56','×','5×5','3×4=12','÷','4×6','7×7=49','2×9'];
let grain=null,vig=null;
const TIPS=['MANTÉN ↑ MÁS TIEMPO PARA SALTAR MÁS ALTO','SHIFT O V = DASH. ¡TE VUELVE INVULNERABLE UN INSTANTE!','PUEDES SALTAR DE NUEVO EN EL AIRE CON ↑','RESPONDE BIEN SEGUIDO Y ACTIVA COMBOS DE PUNTOS','F8 APAGA LOS EFECTOS SI TU COMPUTADOR VA LENTO'];

function resize(){DPR=Math.min(window.devicePixelRatio||1,1.25);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR|0;cv.height=VH*DPR|0;cx.setTransform(DPR,0,0,DPR,0,0);vig=null;}
function glyph(s,col,size){const k=s+col+size;if(glyphs[k])return glyphs[k];const c=document.createElement('canvas'),x=c.getContext('2d');
  x.font=size+'px "Press Start 2P",monospace';const w=Math.ceil(x.measureText(s).width)+30;c.width=w;c.height=size+30;
  x.font=size+'px "Press Start 2P",monospace';x.textBaseline='middle';x.fillStyle=col;x.shadowColor=col;x.shadowBlur=14;x.fillText(s,15,c.height/2);return glyphs[k]=c;}
function spawnDig(kind){
  const s=STR[Math.random()*STR.length|0],size=[12,16,22,30][Math.random()*4|0];
  if(kind==='up')DIG.push({s,size,x:rnd(0,VW),y:VH+30,vx:rnd(-8,8),vy:-rnd(25,70),l:0,L:rnd(5,9),col:'#ffd36b'});
  else DIG.push({s,size,x:rnd(0,VW),y:-30,vx:rnd(-30,30),vy:rnd(120,320),l:0,L:rnd(2,4),col:Math.random()<.8?'#ff3b5c':'#ffffff'});
}
function spawnEmb(kind){
  if(kind==='magic')EMB.push({k:0,x:rnd(VW*.35,VW*.95),y:rnd(VH*.5,VH*.95),vx:rnd(-15,15),vy:-rnd(60,170),r:rnd(1.5,4),l:0,L:rnd(2,4),ph:rnd(0,6),col:Math.random()<.5?'#b45cff':'#e6a0ff'});
  else if(kind==='petal')EMB.push({k:1,x:rnd(-40,VW),y:-20,vx:rnd(20,60),vy:rnd(30,70),r:rnd(2,5),l:0,L:rnd(7,12),ph:rnd(0,6),col:'#ffb7d5'});
  else EMB.push({k:0,x:rnd(0,VW),y:VH+10,vx:rnd(-20,20),vy:-rnd(40,130),r:rnd(1,3),l:0,L:rnd(3,6),ph:rnd(0,6),col:Math.random()<.5?'#ffb347':'#ff6a3d'});
}
function cover(im,a,z,px,py){if(!ok(im)||a<=0)return;const s=Math.max(VW/im.naturalWidth,VH/im.naturalHeight)*z,w=im.naturalWidth*s,h=im.naturalHeight*s;
  cx.globalAlpha=cl(a,0,1);cx.drawImage(im,(VW-w)/2+px*VW,(VH-h)/2+py*VH,w,h);cx.globalAlpha=1;}
function rays(t,a){cx.save();cx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){const x=((i*VW*.33+t*14)%(VW*1.3))-VW*.15,w=VW*.07,g=cx.createLinearGradient(x,0,x-VW*.25,VH);
    g.addColorStop(0,'rgba(190,200,255,'+(.09*a)+')');g.addColorStop(1,'rgba(190,200,255,0)');cx.fillStyle=g;
    cx.beginPath();cx.moveTo(x,0);cx.lineTo(x+w,0);cx.lineTo(x+w-VW*.25,VH);cx.lineTo(x-VW*.25,VH);cx.closePath();cx.fill();}cx.restore();}
function finishFx(a){
  if(!vig){vig=cx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.3,VW/2,VH/2,Math.max(VW,VH)*.75);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,12,.8)');}
  cx.fillStyle=vig;cx.fillRect(0,0,VW,VH);
  if(!grain){grain=document.createElement('canvas');grain.width=grain.height=128;const g=grain.getContext('2d'),d=g.createImageData(128,128);
    for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}g.putImageData(d,0,0);}
  cx.save();cx.globalAlpha=.07*a;cx.globalCompositeOperation='overlay';cx.translate(rnd(-60,0),rnd(-60,0));
  cx.fillStyle=cx.createPattern(grain,'repeat');cx.fillRect(0,0,VW+128,VH+128);cx.restore();
}
function drawLogo(cxp,cyp,wmax,sc,al,glow){
  const im=IM.logo;if(!ok(im))return null;const ar=im.naturalHeight/im.naturalWidth,w=Math.min(wmax,VH*.5/ar),h=w*ar;
  cx.save();cx.translate(cxp,cyp);cx.scale(sc,sc);cx.globalAlpha=cl(al,0,1);
  if(glow){cx.shadowColor='rgba(255,150,0,'+glow+')';cx.shadowBlur=50;}
  cx.drawImage(im,-w/2,-h/2,w,h);cx.restore();return {w:w*sc,h:h*sc,x:cxp,y:cyp};
}
const shine=document.createElement('canvas'),slashC=document.createElement('canvas');
function drawShine(b,pos){
  const im=IM.logo;if(!b||!ok(im))return;shine.width=Math.max(2,b.w|0);shine.height=Math.max(2,b.h|0);const x=shine.getContext('2d');
  x.drawImage(im,0,0,shine.width,shine.height);x.globalCompositeOperation='source-in';
  const g=x.createLinearGradient(shine.width*(pos-.25),0,shine.width*(pos+.1),shine.height*.6);
  g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,shine.width,shine.height);
  cx.save();cx.globalCompositeOperation='lighter';cx.drawImage(shine,b.x-b.w/2,b.y-b.h/2);cx.restore();
}
function ring(x,y,dur,max,col){RING.push({x,y,t:0,dur,max,col});}
function sparks(x,y,n){for(let i=0;i<n;i++){const a=rnd(0,6.283),s=rnd(120,620);SPK.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:0,L:rnd(.4,1.1)});}}
function lightning(){boltT=T;flash=.85;shake=Math.max(shake,.7);
  const pts=[];let x=rnd(VW*.2,VW*.8),y=0;while(y<VH*.62){pts.push([x,y]);x+=rnd(-50,50);y+=rnd(25,60);}bolt=pts;}
function skFrame(t,fps){return SK.length?SK[Math.floor(t*fps)%SK.length]:null;}
function sprite(fr,x,gy,h,al,nom){if(!fr||!ok(fr.img))return;const s=h/(nom||200);cx.globalAlpha=al==null?1:al;
  cx.drawImage(fr.img,x-fr.ax*s,gy-fr.ay*s,fr.img.naturalWidth*s,fr.img.naturalHeight*s);cx.globalAlpha=1;}
function glitchPass(k){
  const b=document.createElement('canvas');b.width=cv.width;b.height=cv.height;const bx=b.getContext('2d');bx.drawImage(cv,0,0);
  cx.save();cx.setTransform(1,0,0,1,0,0);
  for(let i=0;i<6+(k*12|0);i++){const y=rnd(0,cv.height)|0,h=(rnd(6,50)*DPR)|0;cx.drawImage(b,0,y,cv.width,h,rnd(-60,60)*k*DPR,y,cv.width,h);}
  cx.globalCompositeOperation='screen';cx.globalAlpha=.5*k;
  const t=document.createElement('canvas');t.width=b.width;t.height=b.height;const tx=t.getContext('2d');
  tx.drawImage(b,0,0);tx.globalCompositeOperation='multiply';tx.fillStyle='#ff1040';tx.fillRect(0,0,t.width,t.height);cx.drawImage(t,-7*k*DPR,0);
  tx.globalCompositeOperation='source-over';tx.drawImage(b,0,0);tx.globalCompositeOperation='multiply';tx.fillStyle='#00d0ff';tx.fillRect(0,0,t.width,t.height);cx.drawImage(t,7*k*DPR,0);
  cx.restore();
}


/* ---------- la Tabla de Multiplicar (se agrieta y estalla) ---------- */
const tabC=document.createElement('canvas'),SHARDS=[];let tabG=null,CRACKS=[];
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();}
function makeTablet(){
  const w=Math.round(Math.min(VW*.2,250)),h=Math.round(w*1.3);if(tabG&&tabG.w===w)return;tabG={w,h};tabC.width=w;tabC.height=h;const x=tabC.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#6b6f85');g.addColorStop(.5,'#8d92ad');g.addColorStop(1,'#4d5068');
  rr(x,5,5,w-10,h-10,w*.07);x.fillStyle=g;x.fill();x.lineWidth=5;x.strokeStyle='#2c2e3f';x.stroke();
  rr(x,w*.09,w*.09,w-w*.18,h-w*.18,w*.04);x.lineWidth=2;x.strokeStyle='rgba(255,211,107,.8)';x.stroke();
  x.textAlign='center';x.fillStyle='#ffd36b';x.shadowColor='#ff9a00';x.shadowBlur=12;
  x.font=(w*.1)+'px "Press Start 2P",monospace';x.fillText('TABLA',w/2,h*.17);x.fillText('DEL 7',w/2,h*.17+w*.14);
  x.font=(w*.088)+'px "Press Start 2P",monospace';
  for(let i=1;i<=6;i++)x.fillText('7×'+i+'='+(7*i),w/2,h*.42+(i-1)*w*.14);
  CRACKS=[];for(let k=0;k<5;k++){let px=w/2,py=h/2,a=k*1.25+rnd(-.3,.3);const pts=[[px,py]];for(let i=0;i<7;i++){a+=rnd(-.5,.5);px+=Math.cos(a)*w*.13;py+=Math.sin(a)*w*.13;pts.push([px,py]);}CRACKS.push(pts);}
}
function shatter(){
  makeTablet();const {w,h}=tabG,gx=5,gy=6,cw=w/gx,ch=h/gy;SHARDS.length=0;
  for(let i=0;i<gx;i++)for(let j=0;j<gy;j++){
    const x0=i*cw-w/2,y0=j*ch-h/2,P=[[x0,y0],[x0+cw,y0],[x0+cw,y0+ch],[x0,y0+ch]],tris=Math.random()<.5?[[P[0],P[1],P[2]],[P[0],P[2],P[3]]]:[[P[0],P[1],P[3]],[P[1],P[2],P[3]]];
    tris.forEach(tr=>{const c=[(tr[0][0]+tr[1][0]+tr[2][0])/3,(tr[0][1]+tr[1][1]+tr[2][1])/3];
      SHARDS.push({tr,c,x:0,y:0,r:0,vx:c[0]*rnd(2.2,5),vy:c[1]*rnd(2,4)-rnd(80,260),vr:rnd(-7,7),l:0,L:rnd(1.6,2.6)});});}
  shatterAt={x:VW/2,y:VH*.4};ring(VW/2,VH*.4,.8,VW*.5,'#ff3b5c');sparks(VW/2,VH*.4,90);
}
let shatterAt={x:0,y:0};
function drawTablet(t,dt){
  makeTablet();const {w,h}=tabG;
  if(t>=7.9&&t<9.2){
    const a=ss(7.9,8.6,t),tr=ss(8.4,9.2,t)*4,k=ss(8.6,9.15,t);
    cx.save();cx.translate(VW/2+rnd(-tr,tr),VH*.4+Math.sin(t*2)*6+rnd(-tr,tr));cx.globalAlpha=a;
    cx.shadowColor='rgba('+(255-k*60|0)+','+(170-k*130|0)+',40,.9)';cx.shadowBlur=30+k*30;cx.drawImage(tabC,-w/2,-h/2);cx.shadowBlur=0;
    if(k>0){cx.translate(-w/2,-h/2);cx.lineCap='round';
      CRACKS.forEach(pts=>{const n=Math.max(1,Math.floor(pts.length*k));cx.beginPath();pts.slice(0,n+1).forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));
        cx.strokeStyle='#120410';cx.lineWidth=4;cx.stroke();cx.strokeStyle='rgba(255,70,90,'+(.4+k*.6)+')';cx.lineWidth=1.5;cx.stroke();});}
    cx.restore();
  }
  for(let i=SHARDS.length-1;i>=0;i--){const p=SHARDS[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=760*dt;p.r+=p.vr*dt;
    if(p.l>p.L){SHARDS.splice(i,1);continue;}
    cx.save();cx.globalAlpha=1-ss(.6,1,p.l/p.L);cx.translate(shatterAt.x+p.c[0]+p.x,shatterAt.y+p.c[1]+p.y);cx.rotate(p.r);cx.translate(-p.c[0],-p.c[1]);
    cx.beginPath();cx.moveTo(p.tr[0][0],p.tr[0][1]);cx.lineTo(p.tr[1][0],p.tr[1][1]);cx.lineTo(p.tr[2][0],p.tr[2][1]);cx.closePath();cx.clip();
    cx.drawImage(tabC,-w/2,-h/2);cx.fillStyle='rgba(255,50,70,.25)';cx.fillRect(-w/2,-h/2,w,h);cx.restore();}
}

/* ---------- el villano: Mago del Caos ---------- */
const EYES=[[.5156,.1431],[.6001,.1596]],BOOK=[.825,.303];
function glowAt(x,y,r,rgba0){const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba0);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);}
function drawVillain(t){
  const im=IM.villain;if(!ok(im))return;const a=ss(9.5,11.0,t)*(1-ss(12.9,13.6,t));if(a<=.01)return;
  const rise=eo((t-9.5)/2.0),h=VH*.78*(.9+.1*rise)+Math.sin(t*1.4)*4,w=h*im.naturalWidth/im.naturalHeight;
  const x=VW*.66,base=VH*.9+(1-rise)*VH*.2+Math.sin(t*1.5)*5,tx=x-w/2,ty=base-h,sh=shake*5;
  cx.save();cx.translate(rnd(-sh,sh),rnd(-sh,sh));
  cx.globalCompositeOperation='lighter';glowAt(x,base-h*.5,h*.75,'rgba(150,40,255,'+(.5*a)+')');cx.globalCompositeOperation='source-over';
  cx.globalAlpha=a;cx.drawImage(im,tx,ty,w,h);cx.globalAlpha=1;
  cx.globalCompositeOperation='lighter';
  const pul=.65+.35*Math.sin(t*7)+(Math.random()<.04?.5:0);
  EYES.forEach(e=>{const ex=tx+e[0]*w,ey=ty+e[1]*h;glowAt(ex,ey,h*.07,'rgba(255,40,30,'+Math.min(1,.9*pul)*a+')');glowAt(ex,ey,h*.022,'rgba(255,230,160,'+a+')');});
  glowAt(tx+BOOK[0]*w,ty+BOOK[1]*h,h*.12,'rgba(190,110,255,'+(.45+.25*Math.sin(t*4))*a+')');
  cx.restore();
}
/* ---------- placas de nombre de los héroes ---------- */
function plate(txt,sub,x,y,col,a,off){
  if(a<=0)return;const fs=Math.max(11,VW*.019);cx.save();cx.globalAlpha=a;cx.translate(x+off,y);cx.transform(1,0,-.22,1,0,0);
  const w=Math.max(txt.length*fs*1.05,VW*.14)+fs,h=fs*3;const g=cx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'rgba(5,0,25,.92)');g.addColorStop(1,col.replace('1)','.35)'));
  cx.fillStyle=g;cx.fillRect(-w/2,-h/2,w,h);cx.fillStyle=col;cx.fillRect(-w/2,-h/2,w,3);cx.fillRect(-w/2,h/2-3,w,3);cx.fillRect(-w/2,-h/2,6,h);
  cx.textAlign='center';cx.shadowColor=col;cx.shadowBlur=14;cx.fillStyle='#fff';cx.font=fs+'px "Press Start 2P",monospace';cx.fillText(txt,0,fs*.1);
  cx.shadowBlur=0;cx.fillStyle='rgba(210,225,255,.85)';cx.font=(fs*.55)+'px "Press Start 2P",monospace';cx.fillText(sub,0,fs*1.1);cx.restore();
}

/* ---------- subtítulos con efecto de escritura ---------- */
function say(txt){const cap=document.getElementById('ipCap');if(!cap)return;clearInterval(capTimer);cap.textContent='';cap.style.opacity=1;let i=0;
  capTimer=setInterval(()=>{cap.textContent=txt.slice(0,++i);if(i>=txt.length)clearInterval(capTimer);},34);}
function hideCap(){const cap=document.getElementById('ipCap');if(cap)cap.style.opacity=0;}

/* ---------- guion (tiempos en segundos de historia) ---------- */
function buildCues(){cues=[
 {t:2.6,f:()=>root.classList.add('cin')},
 {t:3.0,f:()=>say('Hace mucho tiempo, el Reino de los Números vivía en armonía…')},{t:6.6,f:hideCap},
 {t:7.4,f:lightning},{t:7.8,f:()=>say('…hasta que el CAOS robó todas las Tablas de Multiplicar.')},
 {t:9.2,f:()=>{lightning();shatter();}},{t:12.3,f:lightning},{t:12.8,f:hideCap},
 {t:14.6,f:()=>say('Solo dos ninjas pueden recuperarlas…')},{t:17.5,f:()=>say('¡y necesitan TU ayuda!')},
 {t:18.2,f:()=>{flash=1;shake=1;ring(VW/2,VH*.6,.9,VW*.7,'#fff');ring(VW/2,VH*.6,1.3,VW*.9,'#ffb347');sparks(VW/2,VH*.6,70);}},
 {t:19.7,f:hideCap},{t:19.85,f:()=>flash=1},
 {t:20.0,f:()=>{root.classList.remove('cin');shake=1;ring(VW/2,VH*.46,1.1,VW*.8,'#ffd36b');sparks(VW/2,VH*.46,60);}},
 {t:25.0,f:startWipe}];}

function drawStory(){
  const t=T,gyH=VH*.78;
  cx.save();const sh=shake*shake*14;if(sh>.1)cx.translate(rnd(-sh,sh),rnd(-sh,sh));
  cx.fillStyle='#02000a';cx.fillRect(-20,-20,VW+40,VH+40);
  const bg0=PAN[0]||IM.bg,bg1=PAN[1]||IM.dark||IM.panel,bg2=PAN[2]||IM.bg;
  const c1=ss(7.3,8.6,t),c2=ss(13.3,14.2,t),c3=ss(19.6,20.0,t);
  /* Acto 1: el reino en paz */
  if(t<14.4){cover(bg0,ss(1.8,4.2,t)*(1-c1),1.06+t*.012,-.01*t/7,0);}
  /* Acto 2: la corrupción */
  if(t>=7.3&&t<14.4){cover(bg1,c1*(1-c2),1.05+(t-7.3)*.01,0,0);
    cx.fillStyle='rgba(150,0,30,'+(.38*c1*(1-c2))+')';cx.fillRect(0,0,VW,VH);}
  /* Acto 3: los héroes */
  if(t>=13.3&&t<20.4){cover(bg2,c2*(1-c3)*.55,1.1,-.02,0);cx.fillStyle='rgba(0,0,20,'+(.45*c2*(1-c3))+')';cx.fillRect(0,0,VW,VH);}
  /* Acto 4: título */
  if(t>=19.5){const a=c3;const g=cx.createRadialGradient(VW/2,VH*.46,0,VW/2,VH*.46,Math.max(VW,VH)*.7);
    g.addColorStop(0,'rgba(120,50,10,'+(.7*a)+')');g.addColorStop(.5,'rgba(30,5,40,'+(.8*a)+')');g.addColorStop(1,'rgba(2,0,10,'+a+')');cx.fillStyle=g;cx.fillRect(0,0,VW,VH);}
  rays(t,t<7.3?ss(3,6,t):t<13.4?.3:t<19.6?.6:1);
  if(t>=7.9&&t<13.5)drawTablet(t,dtG);
  if(t>=9.5&&t<13.7){drawVillain(t);plate('MAGO DEL CAOS','EL LADRÓN DE TABLAS',VW*.3,VH*.46,'rgba(170,70,255,1)',ss(10.6,11.1,t)*(1-ss(12.5,12.9,t)),-(1-ss(10.6,11.3,t))*150);}
  /* tarjeta del estudio */
  if(t<3.6){const a=ss(.3,1.1,t)*(1-ss(2.6,3.5,t));cx.save();cx.globalAlpha=a;cx.textAlign='center';cx.fillStyle='#9fc8ff';
    cx.font=Math.max(9,VW*.012)+'px "Press Start 2P",monospace';cx.fillText('I.E. SIMÓN BOLÍVAR — SEDE SAN MARTÍN',VW/2,VH*.46);
    cx.fillStyle='#ffd36b';cx.shadowColor='#ff9a00';cx.shadowBlur=18;cx.font=Math.max(12,VW*.019)+'px "Press Start 2P",monospace';cx.fillText('EL PROFE LUIS PRESENTA…',VW/2,VH*.46+VW*.035);cx.restore();}
  /* partículas: dígitos y pétalos/brasas */
  const dt=dtG;
  if(t>1.5&&t<7.3&&Math.random()<dt*9)spawnDig('up');
  if(t>=7.3&&t<13.6&&Math.random()<dt*(14+(t-7.3)*3))spawnDig('down');
  if(t>=9.6&&t<13.4&&Math.random()<dt*26)spawnEmb('magic');
  if(t>13.6&&t<19.5&&Math.random()<dt*3)spawnEmb('ember');
  if(t>=20&&Math.random()<dt*70)spawnEmb('ember');
  if(t>1.5&&t<7.3&&Math.random()<dt*7)spawnEmb('petal');
  /* velocidad (acto 3) */
  if(t>=13.6&&t<20){cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle='rgba(180,220,255,.22)';cx.lineWidth=2;
    const k=ss(13.6,14.6,t)*(1-ss(18.2,18.4,t)*.8);for(let i=0;i<18;i++){const y=rnd(VH*.1,VH*.9),x=rnd(0,VW),L=rnd(80,320)*k;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+L,y);cx.stroke();}cx.restore();}
  /* héroes */
  if(t>=13.4&&t<20.4){
    const u=ss(13.5,17.3,t),xL=-VW*.3+(VW*.36+VW*.3)*eo(u*1.0),xR=VW*1.25-(VW*1.25-VW*.66)*eo(u*1.0),hh=VH*.42,fade=1-ss(19.7,20,t);
    const run=u<.98&&t<18.2;
    if(SK.length&&ok(SK[0].img)){const fr=run?skFrame(t,18):SK[1%SK.length];sprite(fr,xL,gyH,hh,fade);}
    else if(ok(IM.heroL)){cx.save();cx.globalAlpha=fade;cx.translate(xL,gyH-hh*.5);cx.scale(-1,1);const ar=IM.heroL.naturalWidth/IM.heroL.naturalHeight;cx.drawImage(IM.heroL,-hh*ar/2,-hh/2,hh*ar,hh);cx.restore();}
    if(KG.length&&ok(KG[0].img)){const fr=run?KG[Math.floor(t*18)%KG.length]:KG[1%KG.length];
      cx.save();cx.translate(xR,0);cx.scale(-1,1);cx.shadowColor='rgba(255,40,40,.6)';cx.shadowBlur=24;sprite(fr,0,gyH,hh,fade,240);cx.restore();}
    else if(ok(IM.heroR)){const ar=IM.heroR.naturalWidth/IM.heroR.naturalHeight;cx.save();cx.globalAlpha=fade;cx.shadowColor='rgba(120,80,255,.8)';cx.shadowBlur=26;cx.drawImage(IM.heroR,xR-hh*ar/2,gyH-hh,hh*ar,hh);cx.restore();}
    if(run&&Math.random()<dt*28){sparks(xL-30,gyH-6,1);}
    const pa=ss(15.0,15.5,t)*(1-ss(17.7,18.1,t)),py=gyH-hh-VH*.03;
    plate('SAKURA','LA VELOZ',VW*.36,py,'rgba(255,60,150,1)',pa,-(1-ss(15.0,15.6,t))*140);
    plate('KAGE','LA SOMBRA',VW*.66,py,'rgba(130,100,255,1)',ss(15.4,15.9,t)*(1-ss(17.7,18.1,t)),(1-ss(15.4,16.0,t))*140);
    if(t>=18.2&&t<19.8&&ok(IM.slash)){const sc=.3+eo((t-18.2)/.5)*.9,al=1-ss(18.9,19.7,t);const ar=IM.slash.naturalHeight/IM.slash.naturalWidth,w=VW*.6*sc;
      const sw=Math.max(8,w|0),shh=Math.max(8,(w*ar)|0);slashC.width=sw;slashC.height=shh;const sx=slashC.getContext('2d');
      sx.clearRect(0,0,sw,shh);sx.drawImage(IM.slash,0,0,sw,shh);sx.globalCompositeOperation='destination-in';
      const mg=sx.createRadialGradient(sw/2,shh/2,Math.min(sw,shh)*.18,sw/2,shh/2,Math.max(sw,shh)*.5);mg.addColorStop(0,'rgba(0,0,0,1)');mg.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=mg;sx.fillRect(0,0,sw,shh);
      cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=al;cx.translate(VW/2,VH*.58);cx.rotate(-.14);cx.drawImage(slashC,-sw/2,-shh/2);cx.restore();}
  }
  /* actualizar y dibujar partículas */
  for(let i=DIG.length-1;i>=0;i--){const p=DIG[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(t>=7.3&&t<13.6)p.vy+=300*dt;
    const a=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*.8;if(p.l>p.L||p.y<-60||p.y>VH+60){DIG.splice(i,1);continue;}
    const g=glyph(p.s,p.col,p.size);cx.globalAlpha=a;cx.drawImage(g,p.x-g.width/2,p.y-g.height/2);}
  cx.globalAlpha=1;
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=EMB.length-1;i>=0;i--){const p=EMB[i];p.l+=dt;p.ph+=dt*2;p.x+=(p.vx+Math.sin(p.ph)*18)*dt;p.y+=p.vy*dt;
    if(p.l>p.L||p.y<-20||p.y>VH+20){EMB.splice(i,1);continue;}
    cx.globalAlpha=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*.9;cx.fillStyle=p.col;cx.beginPath();
    if(p.k)cx.ellipse(p.x,p.y,p.r*1.6,p.r*.8,p.ph,0,6.283);else cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();}
  for(let i=SPK.length-1;i>=0;i--){const p=SPK[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;if(p.l>p.L){SPK.splice(i,1);continue;}
    cx.globalAlpha=1-p.l/p.L;cx.fillStyle='#ffe9a8';cx.fillRect(p.x,p.y,3,3);}
  cx.restore();cx.globalAlpha=1;
  /* rayo */
  if(bolt&&t-boltT<.28){cx.save();cx.globalCompositeOperation='lighter';const a=1-(t-boltT)/.28;
    [['rgba(120,170,255,'+a*.6+')',9],['rgba(255,255,255,'+a+')',3]].forEach(([c,w])=>{cx.strokeStyle=c;cx.lineWidth=w;cx.beginPath();bolt.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();});cx.restore();}
  /* título */
  if(t>=19.9){const u=cl((t-20)/.5,0,1),sc=1+1.7*Math.pow(1-u,3),pulse=1+Math.sin(t*2.2)*.012,b=drawLogo(VW/2,VH*.43+Math.sin(t*1.6)*4,Math.min(VW*.86,680),sc*pulse,u*3,.8);
    if(u>=1&&b){const ph=((t-20.8)%3.2)/1.1;if(ph>=0&&ph<=1)drawShine(b,ph*1.3-.1);}
    const ta=ss(21.2,22.2,t);if(ta>0&&b){cx.save();cx.globalAlpha=ta;cx.textAlign='center';cx.fillStyle='#ffd36b';cx.shadowColor='#ff9a00';cx.shadowBlur=22;
      cx.font=Math.max(10,VW*.017)+'px "Press Start 2P",monospace';const sp=(1-ta)*14,txt='✖ TABLAS CON EL PROFE LUIS ✖';
      let x=VW/2-(txt.length*(VW*.017+sp))/2;txt.split('').forEach(ch=>{cx.fillText(ch,x,VH*.43+b.h/2+VH*.07);x+=VW*.017+sp;});cx.restore();}}
  /* ondas de choque */
  cx.save();cx.globalCompositeOperation='lighter';
  for(let i=RING.length-1;i>=0;i--){const r=RING[i];r.t+=dt;const u=r.t/r.dur;if(u>=1){RING.splice(i,1);continue;}
    cx.globalAlpha=(1-u)*.9;cx.strokeStyle=r.col;cx.lineWidth=2+10*(1-u);cx.beginPath();cx.arc(r.x,r.y,r.max*eo(u),0,6.283);cx.stroke();}
  cx.restore();cx.globalAlpha=1;
  finishFx(1);
  cx.restore();
  /* efectos de pantalla completa */
  if(glitchK>.02)glitchPass(glitchK);
  if(flash>.01){cx.fillStyle='rgba(255,255,255,'+cl(flash,0,1)+')';cx.fillRect(0,0,VW,VH);}
}
function drawTitleBackdrop(){
  cx.fillStyle='#02000a';cx.fillRect(0,0,VW,VH);
  cover(IM.bg,.38,1.05+Math.sin(T0s()*.2)*.01,0,0);
  const g=cx.createRadialGradient(VW/2,VH*.42,0,VW/2,VH*.42,Math.max(VW,VH)*.65);g.addColorStop(0,'rgba(90,30,120,.35)');g.addColorStop(1,'rgba(2,0,10,.85)');cx.fillStyle=g;cx.fillRect(0,0,VW,VH);
  rays(T0s(),.5);
  const dt=dtG;if(Math.random()<dt*6)spawnDig('up');if(Math.random()<dt*4)spawnEmb('ember');
  for(let i=DIG.length-1;i>=0;i--){const p=DIG[i];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const a=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*.55;
    if(p.l>p.L||p.y<-60){DIG.splice(i,1);continue;}const gl=glyph(p.s,p.col,p.size);cx.globalAlpha=a;cx.drawImage(gl,p.x-gl.width/2,p.y-gl.height/2);}
  cx.globalAlpha=1;cx.save();cx.globalCompositeOperation='lighter';
  for(let i=EMB.length-1;i>=0;i--){const p=EMB[i];p.l+=dt;p.ph+=dt*2;p.x+=(p.vx+Math.sin(p.ph)*18)*dt;p.y+=p.vy*dt;if(p.l>p.L||p.y<-20){EMB.splice(i,1);continue;}
    cx.globalAlpha=Math.sin(Math.min(1,p.l/p.L)*Math.PI)*.8;cx.fillStyle=p.col;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();}cx.restore();cx.globalAlpha=1;
  const u=ss(.2,1.4,T0s()),b=drawLogo(VW/2,VH*.4+Math.sin(T0s()*1.4)*5,Math.min(VW*.8,600),.9+u*.1,u,.55);
  if(phase==='tap'&&b){const ph=((T0s()-tapT0)%2.8)/1.0;if(ph<=1)drawShine(b,ph*1.3-.1);}
  finishFx(1);
}
let dtG=.016;const T0s=()=>(performance.now()-loadStart)/1000;

/* ---------- carga real ---------- */
function runLoader(){
  const items=[];const add=p=>items.push(p);
  add(document.readyState==='complete'?Promise.resolve():new Promise(r=>addEventListener('load',r,{once:true})));
  add(document.fonts&&document.fonts.load?document.fonts.load('14px "Press Start 2P"').catch(()=>{}):Promise.resolve());
  [IM.logo,IM.bg,IM.dark,IM.heroL,IM.heroR,IM.slash,IM.villain].concat(SK.map(f=>f.img),KG.map(f=>f.img)).forEach(i=>{if(!i)return;add(ok(i)?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}));});
  [1,2,3,4].forEach(n=>add(tryPanel(n)));
  let done=0;items.forEach(p=>p.then(()=>{done++;real=done/items.length;}));real=0;
}

/* ---------- ciclo principal ---------- */
function startWipe(quick){if(phase==='wipe')return;phase='wipe';wipeT0=performance.now();wipeDur=(window.IntroPro&&IntroPro.wipeMs)||(quick?650:1000);S0.classList.add('ipIn');
  if(ac){out.gain.cancelScheduledValues(ac.currentTime);out.gain.linearRampToValueAtTime(0,ac.currentTime+(quick?.4:1.2));}
  document.getElementById('ipSkip').style.opacity=0;hideCap();}
function startStory(viaUser){
  phase='story';audioInit(viaUser===true);startT=(full||FORCE)?0:19.92;t0=performance.now()-startT*1000;if(ac)s0=ac.currentTime-startT+.12;
  if(ac)score();buildCues();ci=0;while(ci<cues.length&&cues[ci].t<startT)ci++;
  document.getElementById('ipLoad').style.opacity=0;document.getElementById('ipTap').style.opacity=0;document.getElementById('ipTap').classList.remove('on');
  setTimeout(()=>{const s=document.getElementById('ipSkip');if(s)s.style.opacity=1;},1200);
}
function finishAll(){dead=true;cancelAnimationFrame(raf);removeEventListener('keydown',onKey,true);
  if(ac){try{out.disconnect();}catch(e){}}root.remove();document.documentElement.classList.remove('ipActive');setTimeout(()=>S0.classList.remove('ipIn'),1400);
  window.__introDone=true;ensureReplay();}
function onKey(e){if(dead)return;e.stopImmediatePropagation();e.preventDefault();
  if(phase==='tap')startStory(true);else if(phase==='story'&&T>1&&(e.key==='Escape'||e.key===' '||e.key==='Enter'))startWipe(true);}
function onPointer(e){if(dead)return;if(phase==='tap')startStory(true);else if(phase==='story'&&T>1.2)startWipe(true);}

function loop(ts){
  if(dead)return;dtG=Math.min(.05,(ts-last)/1000||.016);last=ts;const dt=dtG;
  shake=Math.max(0,shake-dt*1.8);flash=Math.max(0,flash-dt*2.6);glitchK=Math.max(0,glitchK-dt*5);
  if(phase==='load'){
    const el=T0s();loadShown+=(Math.min(real,el/minLoad)-loadShown)*Math.min(1,dt*4);
    const pct=Math.min(100,Math.round(loadShown*100));document.getElementById('ipPct').textContent='CARGANDO… '+pct+'%';
    document.getElementById('ipFill').style.width=pct+'%';
    const run=document.getElementById('ipRun');run.style.left=pct+'%';
    const rx=run.getContext('2d');rx.clearRect(0,0,96,96);const fr=skFrame(el,16);if(fr&&ok(fr.img)){const s=84/200;rx.drawImage(fr.img,48-fr.ax*s,90-fr.ay*s,fr.img.naturalWidth*s,fr.img.naturalHeight*s);}
    const tip=document.getElementById('ipTip');const ti=Math.floor(el/2.6)%TIPS.length;if(tip.dataset.i!==String(ti)){tip.dataset.i=ti;tip.textContent='💡 '+TIPS[ti];}
    drawTitleBackdrop();
    if(loadShown>.995&&el>=minLoad){phase='tap';tapT0=T0s();document.getElementById('ipLoad').style.opacity=0;const tp=document.getElementById('ipTap');tp.classList.add('on');tp.textContent=full?'▶ TOCA O PRESIONA UNA TECLA PARA COMENZAR':'▶ TOCA O PRESIONA UNA TECLA';}
  } else if(phase==='tap'){
    drawTitleBackdrop();if(T0s()-tapT0>tapWait)startStory();
  } else if(phase==='story'){
    T=holdT!=null?holdT:startT+(performance.now()-t0)/1000;
    while(ci<cues.length&&cues[ci].t<=T){try{cues[ci].f();}catch(e){}ci++;}
    if([7.4,9.2,10.9,12.3].some(x=>T>=x&&T<x+.18))glitchK=Math.max(glitchK,.75);
    if(T>=7.3&&T<13.5&&Math.random()<dt*1.3)glitchK=Math.max(glitchK,.35);
    if(T>=18.2&&T<18.35)glitchK=.5;
    drawStory();
  } else if(phase==='wipe'){
    T=startT+(performance.now()-t0)/1000;drawStory();
    const u=cl((performance.now()-wipeT0)/wipeDur,0,1),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2,maxR=Math.hypot(VW,VH)/2*1.05,r=maxR*(1-e);
    root.style.clipPath='circle('+r+'px at 50% 50%)';const rg=document.getElementById('ipRing');rg.style.display=r>6?'block':'none';rg.style.width=rg.style.height=(2*r)+'px';
    if(u>=1){finishAll();return;}
  }
  raf=requestAnimationFrame(loop);
}

function build(opts){
  dead=false;phase='load';DIG.length=EMB.length=RING.length=SPK.length=SHARDS.length=0;shake=flash=glitchK=0;bolt=null;
  full=opts.full;
  document.documentElement.classList.add('ipActive');
  root=mk('div','ipRoot',document.body);cv=mk('canvas','ipCv',root);cx=cv.getContext('2d');
  mk('div','ipBarT',root,'ipBar');mk('div','ipBarB',root,'ipBar');mk('div','ipCap',root);
  const ld=mk('div','ipLoad',root);mk('div','ipPct',ld).textContent='CARGANDO… 0%';
  const bar=mk('div','ipBar2',ld);bar.id='ipBar';mk('i','ipFill',bar);const rc=mk('canvas','ipRun',bar);rc.width=rc.height=96;
  mk('div','ipTip',ld);mk('div','ipTap',root);
  const sk=mk('button','ipSkip',root);sk.textContent='SALTAR ⏭';sk.addEventListener('click',e=>{e.stopPropagation();if(phase==='story')startWipe(true);});
  mk('div','ipRing',root);
  resize();addEventListener('resize',()=>{if(!dead)resize();});
  addEventListener('keydown',onKey,true);root.addEventListener('pointerdown',onPointer);
  loadStart=performance.now();last=performance.now();loadShown=0;minLoad=opts.skipLoad?.1:(full?2.6:1.8);real=0;
  if(opts.skipLoad){real=1;loadShown=1;}else runLoader();
  tapWait=full?9:3.5;
  if(opts.skipLoad){startStory(true);}
  raf=requestAnimationFrame(loop);
}
function ensureReplay(){if(document.getElementById('ipReplay'))return;const b=mk('button','ipReplay',S0);b.textContent='🎬 HISTORIA';
  b.addEventListener('click',e=>{e.stopPropagation();replay();});}
function replay(){if(!dead&&root)return;full=true;PAN.length;build({full:true,skipLoad:true});}
window.IntroPro={hold:(x)=>{holdT=x;},replay,skip:()=>startWipe(true),jump:(s)=>{startT=s;t0=performance.now()-s*1000;ci=0;while(ci<cues.length&&cues[ci].t<s)ci++;}};

full=FORCE||!hasSave;
build({full});
})();
