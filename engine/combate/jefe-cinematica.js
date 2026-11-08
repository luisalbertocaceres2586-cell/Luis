/* engine/combate — Cinemática del jefe final (Rey del Caos, nivel "El Trono del Caos Final")
   · Entrada: al acercarte por primera vez el mundo se congela, aparecen barras de cine, el jefe emerge con aura y ojos brillantes,
     placa con su nombre y sonido. Se puede saltar con un toque o tecla. Si repites el nivel dura la mitad.
   · Golpe (cada vida que pierde): aturdimiento breve, destello morado y chispas.
   · Derrota: cámara lenta, destello y el jefe se desintegra de arriba hacia abajo; el juego sigue su flujo normal (pasa de nivel).
   No cambia ninguna regla del combate. Se apaga desde 🧩 MEJORAS. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'jefe-cine',carpeta:'combate',nombre:'Cinemática del jefe final 🎬',
 desc:'Entrada dramática del Rey del Caos al acercarte, aturdimiento al golpearlo y desintegración al derrotarlo.',
 init(){
  const NAME=window.VILLAIN_NAME||'REY DEL CAOS',VB=()=>window.VillainBoss&&VillainBoss.last;
  let seen=0,cine=null,dis=null,ref=null,pEnc=false,pHp=0;
  const final=()=>typeof curLV==='function'&&curLV()&&curLV().goalType==='throne'&&typeof bossFight!=='undefined'&&bossFight;
  /* ---------- estilos y DOM ---------- */
  const st=document.createElement('style');st.textContent=`
  #bcRoot{position:fixed;inset:0;z-index:400;font-family:'Press Start 2P',monospace;color:#fff;cursor:pointer;opacity:1;transition:opacity .45s}
  #bcRoot.out{opacity:0}
  .bcDim{position:absolute;inset:0;background:radial-gradient(ellipse at 62% 55%,rgba(60,10,90,.55),rgba(4,0,14,.88));opacity:0;transition:opacity .5s}
  #bcRoot.on .bcDim{opacity:1}
  .bcBar{position:absolute;left:0;right:0;height:0;background:#000;transition:height .8s cubic-bezier(.2,.8,.2,1)}
  .bcBar.t{top:0}.bcBar.b{bottom:0}#bcRoot.on .bcBar{height:11vh}
  .bcStage{position:absolute;right:7vw;bottom:5vh;height:80vh;opacity:0;transform:translateY(8vh) scale(.92);transition:opacity .8s ease-out,transform .9s cubic-bezier(.2,.8,.2,1)}
  #bcRoot.show .bcStage{opacity:1;transform:none;animation:bcFloat 3s ease-in-out .9s infinite}
  @keyframes bcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2vh)}}
  .bcAura{position:absolute;left:50%;top:50%;width:150%;height:130%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(160,50,255,.55),rgba(160,50,255,0) 65%);animation:bcPulse 1.6s ease-in-out infinite}
  @keyframes bcPulse{0%,100%{opacity:.7}50%{opacity:1}}
  .bcWrap{position:relative;height:100%}.bcWrap img{height:100%;display:block;filter:drop-shadow(0 0 22px rgba(170,60,255,.8))}
  .bcEye{position:absolute;width:9%;height:6%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff6c0 0,#ff3828 35%,rgba(255,40,30,0) 70%);animation:bcEye .55s ease-in-out infinite alternate}
  @keyframes bcEye{0%{opacity:.55;transform:translate(-50%,-50%) scale(.85)}100%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}
  .bcPlate{position:absolute;left:6vw;top:44%;padding:1.4vh 3vw 1.4vh 2.4vw;transform:translateX(-120%) skewX(-12deg);opacity:0;transition:transform .55s cubic-bezier(.2,.9,.2,1),opacity .4s;
    background:linear-gradient(90deg,rgba(5,0,25,.94),rgba(170,70,255,.38));border-top:3px solid #b45cff;border-bottom:3px solid #b45cff;border-left:7px solid #b45cff}
  #bcRoot.plate .bcPlate{transform:translateX(0) skewX(-12deg);opacity:1}
  .bcPlate b{display:block;font-size:clamp(13px,3vw,26px);text-shadow:0 0 16px #b45cff,3px 3px 0 #000;white-space:nowrap}
  .bcPlate small{display:block;margin-top:1.2vh;font-size:clamp(7px,1.3vw,11px);color:#e8d4ff;letter-spacing:2px}
  .bcHint{position:absolute;left:0;right:0;bottom:2.2vh;text-align:center;font-size:clamp(8px,1.5vw,12px);color:#ffd36b;text-shadow:2px 2px 0 #000;opacity:0;transition:opacity .6s}
  #bcRoot.plate .bcHint{opacity:1}`;
  document.head.appendChild(st);
  /* ---------- sonido (usa el bus del motor FX si existe) ---------- */
  function snd(kind){
    try{
      if(typeof AC==='undefined'||(typeof _muted!=='undefined'&&_muted))return;
      const T=AC.currentTime,out=AC.destination;
      const o=(type,f,t,d,v,f1)=>{const x=AC.createOscillator(),g=AC.createGain();x.type=type;x.frequency.setValueAtTime(f,T+t);if(f1)x.frequency.exponentialRampToValueAtTime(f1,T+t+d);
        g.gain.setValueAtTime(0,T+t);g.gain.linearRampToValueAtTime(v,T+t+.03);g.gain.exponentialRampToValueAtTime(.0001,T+t+d);x.connect(g);g.connect(out);x.start(T+t);x.stop(T+t+d+.05);};
      const n=(t,d,v,ft,f0,f1)=>{const len=AC.sampleRate*d|0,b=AC.createBuffer(1,len,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<len;i++)a[i]=Math.random()*2-1;
        const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type=ft;f.frequency.setValueAtTime(f0,T+t);f.frequency.exponentialRampToValueAtTime(f1,T+t+d);
        g.gain.setValueAtTime(v,T+t);g.gain.exponentialRampToValueAtTime(.0001,T+t+d);s.connect(f);f.connect(g);g.connect(out);s.start(T+t);};
      if(kind==='intro'){o('sine',90,0,.9,.5,28);n(0,.5,.4,'lowpass',2200,120);o('sawtooth',74,.35,1.4,.13,34);o('square',37,.35,1.4,.07,30);
        o('sawtooth',233,.9,.9,.05,220);o('sawtooth',247,.9,.9,.05,233);n(1.0,.3,.25,'highpass',3000,9000);}
      else if(kind==='hit'){o('sawtooth',160,0,.5,.12,50);n(0,.25,.3,'bandpass',1800,200);o('sine',70,0,.4,.3,30);}
      else if(kind==='die'){o('sine',100,0,1.2,.55,24);n(0,.9,.45,'lowpass',2600,90);o('sawtooth',130,.1,1.7,.14,28);
        [0,1,2,3,4].forEach(i=>o('triangle',[523,659,784,988,1319][i],.8+i*.18,1.2,.07));}
    }catch(e){}
  }
  /* ---------- entrada ---------- */
  function intro(){
    if(cine)return;const f=seen++>0?.5:1,root=document.createElement('div');root.id='bcRoot';
    root.innerHTML='<div class="bcDim"></div><div class="bcBar t"></div><div class="bcBar b"></div>'+
      '<div class="bcStage"><div class="bcAura"></div><div class="bcWrap"><img src="assets/characters/villain/portrait.png" alt=""><i class="bcEye" style="left:51.56%;top:14.3%"></i><i class="bcEye" style="left:60%;top:15.96%"></i></div></div>'+
      '<div class="bcPlate"><b>'+NAME+'</b><small>EL LADRÓN DE TABLAS</small></div><div class="bcHint">RESPONDE BIEN PARA ROMPER SU PODER</div>';
    document.body.appendChild(root);cine={freeze:true,t0:performance.now(),timers:[]};
    const at=(ms,fn)=>cine.timers.push(setTimeout(fn,ms*f));
    requestAnimationFrame(()=>root.classList.add('on'));
    at(350,()=>root.classList.add('show'));at(1000,()=>root.classList.add('plate'));
    at(3000,end);snd('intro');try{NinjaMods.util.flash('#b45cff');NinjaMods.util.vibrar(60);}catch(e){}
    const skip=()=>{if(performance.now()-cine.t0>700*f)end();};
    root.addEventListener('pointerdown',skip);cine.key=e=>{e.stopImmediatePropagation();skip();};addEventListener('keydown',cine.key,true);
  }
  function end(){
    if(!cine)return;const r=document.getElementById('bcRoot');cine.timers.forEach(clearTimeout);removeEventListener('keydown',cine.key,true);
    if(r){r.classList.add('out');setTimeout(()=>r.remove(),480);}cine=null;
  }
  /* ---------- golpe y derrota ---------- */
  function pos(){const L=VB();if(L&&performance.now()-L.t<4000)return L;
    return{x:(typeof flagX!=='undefined'?flagX-camX:innerWidth*.7),feet:(typeof groundY==='function'?groundY():400),dh:190,s:1,dir:-1,f:null,t:0};}
  function hit(){
    const p=pos();snd('hit');
    if(window.FX){FX.freeze(8);FX.punch(1.05);FX.burst(p.x+camX,p.feet-p.dh*.5,22,'#b45cff');FX.burst(p.x+camX,p.feet-p.dh*.6,10,'#ffd36b');}
    try{NinjaMods.util.flash('#b45cff');NinjaMods.util.vibrar(40);}catch(e){}
  }
  function defeat(){
    const p=pos();snd('die');
    const n=Math.ceil(((p.f&&p.f.img.naturalHeight)||190)/3),noise=[];for(let i=0;i<n;i++)noise.push(Math.random());
    dis={t0:performance.now(),p:Object.assign({},p),wx:p.x+camX,noise:noise,burst2:false};   /* wx = posición en el mundo: la cámara puede moverse */
    if(window.FX){FX.slowmo(.2,100);FX.punch(1.12);FX.burst(p.x+camX,p.feet-p.dh*.5,40,'#b45cff');FX.burst(p.x+camX,p.feet-p.dh*.6,28,'#ffd36b');}
    try{NinjaMods.util.flash('#ffffff');NinjaMods.util.vibrar(160);}catch(e){}
  }
  function drawDis(){
    if(!dis)return;const u=(performance.now()-dis.t0)/1450;if(u>=1){dis=null;return;}
    const p=dis.p,f=p.f;if(!f)return;const im=f.img,s=p.s,w=im.naturalWidth,n=dis.noise.length;
    if(!dis.burst2&&u>.5&&window.FX){dis.burst2=true;FX.burst(dis.wx,p.feet-p.dh*.4,30,'#ffffff');}
    const sx=dis.wx-camX;   /* posición actual en pantalla */
    CX.save();
    if(window.FX&&FX.zoom>1.002&&typeof P!=='undefined'&&P.w){const zx=P.x-camX+P.w/2,zy=P.y+P.h/2;CX.translate(zx,zy);CX.scale(FX.zoom,FX.zoom);CX.translate(-zx,-zy);}   /* mismo zoom de impacto que la escena */
    CX.translate(sx,0);if(p.dir<0)CX.scale(-1,1);
    for(let i=0;i<n;i++){
      const rn=dis.noise[i],pr=Math.max(0,Math.min(1,(u*1.7-(i/n)*.7-rn*.25)/.4));if(pr>=1)continue;
      const sy=i*3,dx=(rn-.5)*pr*40*s,dy=-pr*60*s,x0=-f.ax*s+dx,y0=p.feet-f.ay*s+sy*s+dy;
      CX.globalAlpha=1-pr;CX.drawImage(im,0,sy,w,3,x0,y0,w*s,3*s);
      if(pr>0){CX.globalCompositeOperation='lighter';CX.globalAlpha=(1-pr)*.6;CX.fillStyle='#b45cff';CX.fillRect(x0,y0,w*s,3*s);CX.globalCompositeOperation='source-over';}
    }
    CX.restore();
  }
  window.JefeCine={estado:()=>({vistas:seen,activa:!!cine,ref:!!ref,pEnc:pEnc,pHp:pHp,final:!!final(),dis:!!dis,disInfo:dis?{u:(performance.now()-dis.t0)/1450,x:Math.round(dis.p.x),feet:Math.round(dis.p.feet),dh:Math.round(dis.p.dh),tieneF:!!dis.p.f,n:dis.noise.length}:null,vb:(function(){const L=VB();return L?{x:Math.round(L.x),feet:Math.round(L.feet),edad:Math.round(performance.now()-L.t)}:null;})()}),probarEntrada:intro};   /* diagnóstico */
  /* ---------- enganches ---------- */
  const _r=window.render;if(typeof _r==='function')window.render=function(){const r=_r.apply(this,arguments);try{drawDis();}catch(e){}return r;};
  /* Reacciona en el mismo instante en que una respuesta correcta baja la vida del jefe (el juego pasa de nivel 1.5 s después) */
  const _oa=window.onAns;
  if(typeof _oa==='function')window.onAns=function(){
    const b=final(),hp0=b?b.hp:0,r=_oa.apply(this,arguments);
    try{if(b&&b.hp<hp0){pHp=b.hp;if(b.hp<=0)defeat();else hit();}}catch(e){}
    return r;
  };
  /* checkFlagBoss completa el nivel apenas el jefe muere (antes del temporizador de 1.5 s que el juego había previsto para los efectos):
     se pospone para que se vea la desintegración completa. Solo afecta al jefe final mientras dura su derrota. */
  const _ld=window.levelDone;
  if(typeof _ld==='function')window.levelDone=function(){
    const args=arguments;
    const d=dis;                                       /* referencia local: dis puede ponerse en null antes de que venza el temporizador */
    if(d&&!d.liberado){
      const falta=1500-(performance.now()-d.t0);
      if(falta>30){
        if(!d.pend){d.pend=true;setTimeout(()=>{d.liberado=true;if(!(typeof GS!=='undefined'&&GS.doneFired))_ld.apply(null,args);},falta);}
        return;
      }
    }
    return _ld.apply(this,args);
  };
  const _u=window.update;
  window.update=function(){
    if(cine&&cine.freeze)return;                       /* mundo congelado durante la entrada */
    const r=_u.apply(this,arguments);
    try{const b=final();
      if(!b){ref=null;return r;}
      if(b!==ref){ref=b;pEnc=false;pHp=b.hp;}
      if(b.encountered&&!pEnc){pEnc=true;intro();}
      if(b.hp<pHp){if(b.hp<=0)defeat();else hit();}
      pHp=b.hp;
    }catch(e){}
    return r;
  };
 }});
})();
