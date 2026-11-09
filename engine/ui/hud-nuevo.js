/* engine/ui — HUD NUEVO (reemplaza el marco azul de arriba)
   · Arriba-izquierda, siempre: retrato del héroe + BARRA DE VIDA (cada golpe quita 1/8; cada vida extra suma 1/8) con color verde→amarillo→rojo,
     estela de daño, brillo, corazón que late más rápido con poca vida, y la insignia del nivel.
   · Fichas que aparecen SOLO cuando cambian (puntos y enemigos) y se esconden solas. Al tocar el retrato se muestran 3 s.
   · Arriba-centro: barra de progreso con el ninja, la bandera de meta y el punto de control.  Arriba-derecha: botón de pausa.
   · El estado de la barra cambia al héroe: ≥90 % radiante (aura dorada) · 50-89 % normal · 25-49 % herido · <25 % agotado (sudor, mareo y bordes rojos que laten).
   · Al recibir un golpe: tajo rojo + destello en los bordes; al curarse: anillo verde.
   Imágenes en assets/ui/hud/ (ver assets/CATALOGO.md). Nombre del jugador y vidas en corazones: eliminados. */
(function(){
if(!window.NinjaMods)return;
const B='assets/ui/hud/',MAXV=8;
NinjaMods.register({id:'hud-nuevo',carpeta:'ui',nombre:'HUD nuevo: retrato + barra de vida',
 desc:'Barra de vida con retrato que cambia según la salud, fichas de puntos/enemigos que aparecen solo al cambiar, progreso con ninja y bandera, y efectos de héroe radiante, herido o agotado.',
 init(){
  const el=(t,c,p)=>{const e=document.createElement(t);if(c)e.className=c;(p||document.body).appendChild(e);return e;};
  const css=document.createElement('style');css.textContent=`
  #hud,#pauseBtn,#progB{display:none!important}
  #hx{position:fixed;left:max(8px,calc(env(safe-area-inset-left) + 6px));top:max(4px,calc(env(safe-area-inset-top) + 3px));z-index:92;pointer-events:none;display:none;font-family:'Press Start 2P',monospace}
  #hx.on{display:block}
  .hx-vida{position:relative}
  .hx-vida>*{position:absolute}
  .hx-ret{border-radius:50%;overflow:hidden;z-index:1;pointer-events:auto}
  .hx-ret img{width:100%;height:100%;display:block;transform-origin:50% 60%}
  .hx-ret img.pop{animation:hxPop .4s cubic-bezier(.2,1.6,.4,1)}
  @keyframes hxPop{0%{transform:scale(.7)}100%{transform:scale(1)}}
  .hx-caja{overflow:hidden;z-index:1;border-radius:99px}
  .hx-caja i{position:absolute;left:0;top:0;bottom:0;display:block;border-radius:99px;background-size:100% 100%}
  .hx-trail{background:linear-gradient(#ffe2a8,#ff9d3c)}
  .hx-fill{background-color:#3ddc84;background-blend-mode:multiply;transition:background-color .2s;filter:brightness(1.45) saturate(1.25)}
  .hx-glint{position:absolute;inset:0;background-size:auto 100%;background-repeat:no-repeat;mix-blend-mode:screen;opacity:.7;animation:hxGl 3.2s linear infinite}
  @keyframes hxGl{0%{background-position:-120% 0}55%,100%{background-position:220% 0}}
  .hx-f{z-index:2;background-repeat:repeat-x}
  .hx-heart{z-index:3;background-repeat:no-repeat;animation:hxHeart 1.1s steps(6) infinite}
  @keyframes hxHeart{to{background-position-x:var(--hw)}}
  .hx-badge{z-index:4;display:flex;align-items:center;justify-content:center;background-size:contain;background-repeat:no-repeat;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
  .hx-vida.hit{animation:hxHit .38s}
  @keyframes hxHit{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}45%{transform:translateX(5px)}70%{transform:translateX(-3px)}}
  .hx-vida.heal .hx-caja{box-shadow:0 0 14px 4px #44ff88}
  .hx-vida.low .hx-caja{animation:hxLow .55s ease-in-out infinite alternate}
  @keyframes hxLow{to{box-shadow:0 0 10px 3px #ff3030}}
  #hxChips{margin-top:5px;display:flex;flex-direction:column;gap:4px;align-items:flex-start}
  .hx-chip{display:flex;align-items:center;gap:6px;height:24px;padding:0 10px 0 4px;border-radius:14px;color:#fff;font-size:10px;line-height:1;
    border:2px solid #F0A91E;background:linear-gradient(#1a3d78,#0a1c40);box-shadow:inset 0 0 0 1px #19b4e8,0 2px 5px rgba(0,0,0,.55);text-shadow:1px 1px 0 #000;
    opacity:0;transform:translateX(-18px);transition:opacity .25s,transform .25s;pointer-events:none}
  .hx-chip.on{opacity:1;transform:translateX(0)}
  .hx-chip .ic{width:20px;height:20px;background-repeat:no-repeat;flex:none}
  .hx-chip .ic.gira{animation:hxCoin .9s steps(6) infinite}
  @keyframes hxCoin{to{background-position-x:-120px}}
  .hx-chip b{color:#FFD54A;font-weight:400;margin-left:4px;animation:hxUp .9s ease-out both}
  @keyframes hxUp{0%{opacity:0;transform:translateY(6px)}20%{opacity:1}100%{opacity:1;transform:none}}
  #hxProg{position:fixed;top:max(5px,calc(env(safe-area-inset-top) + 4px));left:50%;transform:translateX(-50%);z-index:91;pointer-events:none;display:none}
  #hxProg.on{display:block}
  #hxProg .pf{position:absolute;inset:0;background-size:100% 100%;z-index:2}
  #hxProg .pc{position:absolute;overflow:hidden;border-radius:99px;z-index:1}
  #hxProg .pc i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#19d6ff,#7dff6a,#ffd54a);border-radius:99px}
  #hxProg img{position:absolute;z-index:3;transform:translate(-50%,-55%);filter:drop-shadow(0 1px 2px #000)}
  #hxPause{position:fixed;top:max(5px,calc(env(safe-area-inset-top) + 4px));right:max(8px,calc(env(safe-area-inset-right) + 6px));z-index:300;width:38px;height:38px;background:url(${B}marcos/boton_pausa.png) center/contain no-repeat;
    border:0;padding:0;cursor:pointer;display:none;-webkit-tap-highlight-color:transparent;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
  #hxPause.on{display:block}#hxPause:active{transform:scale(.9)}
  #hxCorn{position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0}
  #hxCorn img{position:absolute;width:clamp(170px,50vh,380px);height:auto}
  #rachaB{top:36px!important}#tring{top:46px!important}#powerPills{top:30px!important}
  `;document.head.appendChild(css);

  /* ---------- construcción ---------- */
  const root=el('div');root.id='hx';
  const vida=el('div','hx-vida',root);
  const ret=el('div','hx-ret',vida),retImg=el('img','',ret);retImg.draggable=false;
  const caja=el('div','hx-caja',vida),trail=el('i','hx-trail',caja),fill=el('i','hx-fill',caja),glint=el('div','hx-glint',caja);
  fill.style.backgroundImage='url('+B+'barra-vida/barra_relleno.png)';glint.style.backgroundImage='url('+B+'barra-vida/barra_brillo.png)';
  const fL=el('div','hx-f',vida),fM=el('div','hx-f',vida),fR=el('div','hx-f',vida);
  [fL,fM,fR].forEach(f=>f.style.backgroundImage='url('+B+'barra-vida/barra_marco.png)');
  const heart=el('div','hx-heart',vida);heart.style.backgroundImage='url('+B+'animados/corazon_latido.png)';
  const badge=el('div','hx-badge',vida);badge.style.backgroundImage='url('+B+'marcos/insignia_nivel.png)';
  const chips=el('div','',root);chips.id='hxChips';
  const chipP=el('div','hx-chip',chips),chipE=el('div','hx-chip',chips);
  chipP.innerHTML='<span class="ic gira"></span><span class="v">0</span>';chipE.innerHTML='<span class="ic"></span><span class="v">0/15</span>';
  chipP.firstChild.style.backgroundImage='url('+B+'animados/moneda_girando.png)';chipE.firstChild.style.backgroundImage='url('+B+'iconos/calavera.png)';chipE.firstChild.style.backgroundSize='contain';
  // progreso
  const prog=el('div');prog.id='hxProg';const pf=el('div','pf',prog),pc=el('div','pc',prog),pi=el('i','',pc);
  pf.style.backgroundImage='url('+B+'progreso/progreso_marco.png)';
  const mJ=el('img','',prog),mM=el('img','',prog),mC=el('img','',prog);mJ.src=B+'iconos/cabeza_ninja.png';mM.src=B+'iconos/bandera_meta.png';mC.src=B+'iconos/bandera_control.png';
  // pausa
  const pause=el('button');pause.id='hxPause';pause.setAttribute('aria-label','Pausa');
  pause.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const o=document.getElementById('pauseBtn');if(o)o.click();});
  // bordes de peligro
  const corn=el('div');corn.id='hxCorn';
  const CP={sup_izq:'left:0;top:0',sup_der:'right:0;top:0',inf_izq:'left:0;bottom:0',inf_der:'right:0;bottom:0'};
  Object.keys(CP).forEach(k=>{const i=el('img','',corn);i.src=B+'pantalla/esquina_roja_'+k+'.png';i.style.cssText=CP[k];});

  /* ---------- medidas (se recalculan al girar / redimensionar) ---------- */
  let hf=60,k=.28,Mw=120,totalW=240,Iw=158;
  function medir(){
    hf=Math.max(50,Math.min(66,.155*innerHeight));k=hf/214;Mw=Math.round(Math.max(90,Math.min(150,.14*innerWidth)));
    const pxL=300*k,pxR=110*k;totalW=Math.round(pxL+Mw+pxR);
    vida.style.width=totalW+'px';vida.style.height=hf+'px';
    const bs=(1400*k)+'px '+(214*k)+'px';
    const put=(e,l,w,off)=>{e.style.cssText+=`;left:${l}px;top:0;width:${w}px;height:${hf}px;background-size:${bs};background-position:${-off}px 0`};
    put(fL,0,pxL,0);put(fM,pxL,Mw,600*k);put(fR,pxL+Mw,pxR,1290*k);
    const ix=222*k,iy=60*k,ih=97*k;Iw=(300*k-ix)+Mw+(1348-1290)*k;
    caja.style.cssText=`left:${ix}px;top:${iy}px;width:${Iw}px;height:${ih}px`;
    const sd=141*k+6;ret.style.cssText=`left:${122.5*k-sd/2}px;top:${107*k-sd/2}px;width:${sd}px;height:${sd}px`;
    const hs=hf*.5,hw=hs*200/175;heart.style.cssText=`left:${totalW-hs*.9}px;top:${hf/2-hs/2}px;width:${hw}px;height:${hs}px;background-size:${hw*6}px ${hs}px;--hw:${-hw*6}px`;
    const bd=hf*.5;badge.style.cssText=`left:${hf*.62}px;top:${hf*.56}px;width:${bd}px;height:${bd}px;font-size:${Math.max(8,Math.round(bd*.42))}px;padding-bottom:${Math.round(bd*.05)}px`;
    glint.style.backgroundSize='auto 100%';
    const pw=Math.max(170,Math.min(330,innerWidth*.36)),ph=pw*53/1200;prog.style.width=pw+'px';prog.style.height=ph+'px';
    pc.style.cssText=`left:${pw*.026}px;top:${ph*.24}px;width:${pw*.948}px;height:${ph*.52}px`;
    [mJ,mC].forEach(i=>{i.style.width=ph*1.7+'px'});mM.style.width=ph*2.1+'px';mJ.style.top=mC.style.top=ph/2+'px';mM.style.top=ph/2+'px';mM.style.left=pw*.985+'px';
    const nc=document.getElementById('nmChips');if(nc)nc.style.top=(hf+78)+'px';
    pause.style.width=pause.style.height=Math.round(Math.max(34,Math.min(44,.1*innerHeight)))+'px';
    chipP.querySelector('.ic').style.backgroundSize='120px 20px';
  }
  medir();addEventListener('resize',()=>setTimeout(medir,60));

  /* ---------- visibilidad: sigue al HUD viejo ---------- */
  const old=document.getElementById('hud');
  const vis=()=>{const on=!!(old&&old.classList.contains('on'));root.classList.toggle('on',on);prog.classList.toggle('on',on);pause.classList.toggle('on',on);if(!on)corn.style.opacity=0;};
  if(old)new MutationObserver(vis).observe(old,{attributes:true,attributeFilter:['class']});vis();

  /* ---------- fichas temporales ---------- */
  const tmr=new WeakMap();
  function mostrar(c,ms){c.classList.add('on');clearTimeout(tmr.get(c));tmr.set(c,setTimeout(()=>c.classList.remove('on'),ms||2400));}
  ret.addEventListener('pointerdown',e=>{e.stopPropagation();mostrar(chipP,3000);mostrar(chipE,3000);});
  let lastScore=null,lastQ=null;
  setInterval(()=>{
    if(typeof GS==='undefined'||!root.classList.contains('on'))return;
    const sc=GS.score||0,q=(document.getElementById('hQ')||{}).textContent||'';
    if(lastScore===null){lastScore=sc;lastQ=q;chipP.querySelector('.v').textContent=sc;chipE.querySelector('.v').textContent=q;return;}
    if(sc!==lastScore){const d=sc-lastScore;lastScore=sc;const v=chipP.querySelector('.v');v.innerHTML=sc+(d>0?'<b>+'+d+'</b>':'');mostrar(chipP,2400);}
    if(q!==lastQ){lastQ=q;chipE.querySelector('.v').textContent=q;mostrar(chipE,2400);}
  },140);

  /* ---------- barra de vida, estados y efectos ---------- */
  const IMG={};const li=(n,f)=>{const i=new Image();i.src=B+'efectos-heroe/'+f;IMG[n]=i;};
  li('aura','aura_radiante.png');li('cura','curacion.png');li('golpe','golpe.png');li('sudor','sudor.png');li('mareo','mareo.png');
  const CELDA={aura:[235,264,6],cura:[205,264,6],golpe:[250,264,6],sudor:[264,102,4],mareo:[264,162,6]};
  const lisFx=[];                                           // efectos de un solo disparo: {k,t0,dur,w,dx,dy,mode}
  const ok=i=>i&&i.complete&&i.naturalWidth>0;
  let shown=null,tr=1,last=null,estado='',flash=0;
  const ST=['radiante','normal','herido','agotado'];
  function estadoDe(f){return f>=.9?0:f>=.5?1:f>=.25?2:3;}
  function colorDe(f){return f>=.6?'#3ddc84':f>=.3?'#ffc83d':'#ff4545';}
  function frame(){
    requestAnimationFrame(frame);
    if(typeof GS==='undefined'||!root.classList.contains('on'))return;
    const lives=Math.max(0,Math.min(GS.lives||0,MAXV)),f=lives/MAXV;
    if(shown===null){shown=tr=f;last=lives;}
    if(lives<last){mostrarGolpe();}
    if(lives>last){vida.classList.add('heal');setTimeout(()=>vida.classList.remove('heal'),700);lisFx.push({k:'cura',t0:Date.now(),dur:620,w:96,anc:'pies'});}
    last=lives;
    shown+=(f-shown)*.17;if(Math.abs(f-shown)<.002)shown=f;
    if(f>tr)tr=f;else tr=Math.max(shown,tr-.004);
    fill.style.width=(shown*100)+'%';trail.style.width=(tr*100)+'%';fill.style.backgroundColor=colorDe(shown);
    const e=estadoDe(f),clave=(GS.char==='peach'?'kage_':'sakura_')+ST[e];
    if(clave!==estado){estado=clave;retImg.src=B+'retratos/'+clave+'.png';retImg.classList.remove('pop');void retImg.offsetWidth;retImg.classList.add('pop');}
    heart.style.animationDuration=(f<.25?.42:f<.5?.75:1.15)+'s';vida.classList.toggle('low',f<.25);
    badge.textContent=(((document.getElementById('hLevel')||{}).textContent||'').match(/\d+/)||[''])[0];
    // progreso
    if(typeof flagX!=='undefined'&&flagX&&typeof P!=='undefined'){
      const p=Math.max(0,Math.min(1,P.x/flagX));pi.style.width=(p*100)+'%';
      const pw=parseFloat(prog.style.width)||200,x0=pw*.03,x1=pw*.96;
      mJ.style.left=(x0+(x1-x0)*p)+'px';
      const cx=GS._checkpointX;mC.style.display=cx?'block':'none';if(cx)mC.style.left=(x0+(x1-x0)*Math.min(1,cx/flagX))+'px';
    }
    // bordes rojos: laten con poca vida; destello al recibir un golpe
    flash=Math.max(0,flash-.035);
    const low=f<.3?(1-f/.3):0,beat=.55+.45*Math.sin(Date.now()/(f<.15?160:260));
    corn.style.opacity=Math.min(1,low*1.3*beat+flash).toFixed(2);
  }
  function mostrarGolpe(){
    flash=1;vida.classList.remove('hit');void vida.offsetWidth;vida.classList.add('hit');NinjaMods.util.vibrar(40);
    lisFx.push({k:'golpe',t0:Date.now(),dur:380,w:90,anc:'centro'});
  }
  requestAnimationFrame(frame);

  /* efectos dibujados sobre el héroe (encima del juego) */
  function tira(k,i,x,y,w,al){
    const im=IMG[k];if(!ok(im))return;const c=CELDA[k],cw=im.naturalWidth/c[2],ch=im.naturalHeight,dh=w*ch/cw;
    CX.globalAlpha=al;CX.drawImage(im,i*cw,0,cw,ch,x-w/2,y-dh/2,w,dh);
  }
  NinjaMods.after('render',function(){
    if(typeof GS==='undefined'||!GS.running||typeof P==='undefined'||!P||!P.alive||!root.classList.contains('on'))return;
    const h=NinjaMods.util.heroXY(),now=Date.now(),f=(GS.lives||0)/MAXV;
    CX.save();
    if(f>=.9){const i=Math.floor(now/110)%6;tira('aura',i,h.x,h.y,P.h*1.5,.5+.12*Math.sin(now/300));}
    if(f<.25){
      tira('mareo',Math.floor(now/130)%6,h.x,P.y-6,Math.max(54,P.w*1.5),.95);
      const ph=now%2600;if(ph<760)tira('sudor',Math.min(3,Math.floor(ph/190)),h.x+P.w*.55,P.y+14,Math.max(34,P.w*.9),.95);
    }
    for(let n=lisFx.length-1;n>=0;n--){
      const e=lisFx[n],t=now-e.t0;if(t>e.dur){lisFx.splice(n,1);continue;}
      const c=CELDA[e.k],i=Math.min(c[2]-1,Math.floor(t/e.dur*c[2]));
      const y=e.anc==='pies'?P.y+P.h-8:h.y;tira(e.k,i,h.x,y,e.w*(P.h/77),1);
    }
    CX.restore();
  });
 }});
})();
