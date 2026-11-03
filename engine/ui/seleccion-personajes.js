/* engine/ui — Pantalla de elección de personaje 2.0
   Reemplaza las dos tarjetas pequeñas por un escenario grande con el ninja animado, flechas / deslizar para cambiar,
   barras con los valores REALES del juego (salto y velocidad) y la descripción de su ataque especial.
   Sigue usando selChar() del juego, así que "Continuar partida" y "Comenzar" funcionan igual. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'seleccion-personajes',carpeta:'ui',nombre:'Pantalla de personajes 2.0',
 desc:'Escenario grande con el ninja animado, flechas, deslizar y estadísticas reales de salto, velocidad y ataque especial.',
 init(){
  const grid=document.getElementById('cgrid');if(!grid||!grid.parentNode)return;
  const CH={
    mario:{n:'SAKURA',rol:'NINJA DEL VIENTO',emoji:'🌸',c1:'#FF2E92',c2:'#8A0057',c3:'#FFB3DA',
      desc:'Ágil y de gran salto. Alcanza las plataformas más altas y los atajos por el aire.',
      sk:'✨ X · TRIPLE ABANICO',skd:'Lanza 3 disparos en abanico hacia el frente. Si hay un enemigo cerca, abre su pregunta.',
      jump:()=>Math.abs(typeof JUMP_MARIO!=='undefined'?JUMP_MARIO:13.2)},
    peach:{n:'KAGE',rol:'NINJA DE LA SOMBRA',emoji:'🔥',c1:'#FF3B44',c2:'#5A0006',c3:'#FFC2C5',
      desc:'Silencioso y letal. Salta un poco menos, pero domina el combate a dos frentes.',
      sk:'✨ X · DOBLE DISPARO',skd:'Dispara hacia adelante Y hacia atrás al mismo tiempo: ideal cuando te rodean.',
      jump:()=>Math.abs(typeof JUMP_PEACH!=='undefined'?JUMP_PEACH:11.4)}
  };
  const ORDER=['mario','peach'];
  const css=document.createElement('style');css.textContent=`
  #cgrid{display:none!important}
  #cpick{--c1:#FF2E92;--c2:#8A0057;--c3:#FFB3DA;position:relative;width:100%;max-width:440px;margin:0 auto;font-family:'Press Start 2P',monospace;text-align:center;color:#fff}
  #cpick .cp-title{font-size:clamp(9px,2vw,12px);letter-spacing:3px;color:rgba(255,230,160,.9);margin-bottom:6px;text-shadow:0 0 10px var(--c1)}
  #cpick .cp-stage{position:relative;height:clamp(190px,40vh,270px);border-radius:16px;overflow:hidden;touch-action:pan-y;user-select:none;-webkit-user-select:none;
    background:radial-gradient(ellipse at 50% 85%,var(--c1) 0%,var(--c2) 38%,rgba(4,0,24,.96) 78%);
    border:2px solid var(--c1);box-shadow:0 0 28px var(--c1),inset 0 0 40px rgba(0,0,0,.55);transition:border-color .3s,box-shadow .3s,background .3s}
  #cpick .cp-stage::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.05) 0 2px,transparent 2px 22px);pointer-events:none}
  #cpick .cp-floor{position:absolute;left:12%;right:12%;bottom:8%;height:14px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.7),transparent 70%)}
  #cpick canvas{position:absolute;left:50%;bottom:0;transform:translateX(-50%);height:100%;width:auto;filter:drop-shadow(0 0 16px var(--c1))}
  #cpick .cp-stage.swap canvas{animation:cpIn .42s cubic-bezier(.2,1.3,.4,1)}
  #cpArt{position:absolute;left:50%;bottom:1%;height:97%;width:auto;max-width:78%;object-fit:contain;transform:translateX(-50%);pointer-events:none;
    filter:drop-shadow(0 0 16px var(--c1)) drop-shadow(0 8px 10px rgba(0,0,0,.6));animation:cpFloat 3.2s ease-in-out infinite}
  #cpick .cp-stage.swap #cpArt{animation:cpArtIn .45s cubic-bezier(.2,1.3,.4,1),cpFloat 3.2s .45s ease-in-out infinite}
  @keyframes cpFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-6px)}}
  @keyframes cpArtIn{0%{opacity:0;transform:translateX(-50%) scale(.85) translateY(14px);filter:blur(5px)}100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}}
  #cpick .cp-stage.swap .cp-emoji{animation:cpIn .6s ease-out}
  @keyframes cpIn{0%{opacity:0;transform:translateX(-50%) scale(.82) translateY(14px);filter:blur(5px) drop-shadow(0 0 30px var(--c1))}100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}}
  #cpick .cp-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:44px;height:58px;border:2px solid var(--c1);border-radius:12px;
    background:rgba(0,0,30,.62);color:#fff;font-size:20px;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;box-shadow:0 0 12px var(--c1)}
  #cpick .cp-arrow:active{transform:translateY(-50%) scale(.92);background:var(--c2)}
  #cpick .cp-arrow.l{left:8px}#cpick .cp-arrow.r{right:8px}
  #cpick .cp-emoji{position:absolute;right:62px;top:10px;font-size:22px;opacity:.9;filter:drop-shadow(0 0 8px var(--c1))}
  #cpick .cp-name{font-size:clamp(18px,4.6vw,28px);margin-top:10px;color:var(--c3);text-shadow:0 0 14px var(--c1),3px 3px 0 #000;letter-spacing:2px}
  #cpick .cp-role{font-size:clamp(6px,1.4vw,8px);color:rgba(255,255,255,.7);letter-spacing:2px;margin:5px 0 8px}
  #cpick .cp-desc{font-size:clamp(6px,1.35vw,8px);line-height:1.8;color:rgba(225,232,255,.85);margin:0 auto 8px;max-width:360px}
  #cpick .cp-stats{display:grid;grid-template-columns:auto 1fr;gap:7px 10px;align-items:center;text-align:left;max-width:340px;margin:0 auto 9px}
  #cpick .cp-stats label{font-size:clamp(6px,1.3vw,7.5px);color:rgba(255,255,255,.8)}
  #cpick .cp-bar{height:11px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;border:1px solid rgba(255,255,255,.18)}
  #cpick .cp-bar i{display:block;height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,var(--c2),var(--c1),var(--c3));box-shadow:0 0 10px var(--c1);transition:width .55s cubic-bezier(.2,1,.3,1)}
  #cpick .cp-skill{max-width:360px;margin:0 auto 9px;padding:9px 11px;border-radius:10px;background:rgba(0,0,30,.6);border:1px solid var(--c1);text-align:left}
  #cpick .cp-skill b{display:block;font-size:clamp(7px,1.5vw,9px);color:#FFE040;font-weight:400;margin-bottom:5px}
  #cpick .cp-skill span{font-size:clamp(6px,1.3vw,7.5px);line-height:1.8;color:rgba(225,232,255,.85)}
  #cpick .cp-chips{display:flex;gap:8px;justify-content:center}
  #cpick .cp-chip{font-family:inherit;font-size:clamp(7px,1.5vw,9px);padding:9px 12px;border-radius:20px;cursor:pointer;color:rgba(255,255,255,.7);
    background:rgba(0,0,30,.6);border:2px solid rgba(255,255,255,.2);-webkit-tap-highlight-color:transparent}
  #cpick .cp-chip.on{color:#fff;border-color:var(--c1);background:var(--c2);box-shadow:0 0 14px var(--c1)}

  .heroPick{max-width:min(96vw,860px)!important}
  #cpick{max-width:100%}
  #cpick .cp-grid{display:grid;grid-template-columns:1fr;gap:8px}
  #cpick .cp-stage{height:clamp(140px,27vh,250px)}
  #cpick .cp-name{font-size:clamp(15px,3.6vh,26px);margin-top:4px}
  #cpick .cp-desc{display:none}
  #cpick .cp-stats{margin-bottom:6px}#cpick .cp-skill{margin-bottom:6px;padding:7px 10px}
  #cpick .cp-play{margin-top:4px}
  #cpPlay #btnStart{margin:4px auto 0!important}
  #cpPlay #btnStart img{width:auto!important;height:clamp(50px,10vh,86px)!important;max-width:100%}
  #cpPlay #btnCont{margin:0 auto 4px!important;font-size:clamp(7px,1.4vw,9px)!important;padding:8px 12px!important}
  #introTitle{max-height:19vh!important;width:auto!important;max-width:88vw}
  /* PANTALLAS ANCHAS (computador, celular horizontal): dos columnas — personaje a la izquierda, información y JUGAR a la derecha */
  @media (min-width:600px) and (min-aspect-ratio:11/10){
    #cpick .cp-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:center}
    #cpick .cp-stage{height:clamp(150px,50vh,360px)}
    #cpick .cp-right{text-align:left}
    #cpick .cp-name,#cpick .cp-role{text-align:left}
    #cpick .cp-name{margin-top:0;font-size:clamp(16px,4.4vh,30px)}
    #cpick .cp-role{margin:3px 0 6px}
    #cpick .cp-desc{display:block;margin:0 0 7px;max-width:none;font-size:clamp(6px,1.9vh,8px)}
    #cpick .cp-stats,#cpick .cp-skill{margin-left:0;margin-right:0;max-width:none}
    #cpick .cp-chips{justify-content:flex-start}
    #cpPlay #btnStart{margin:6px 0 0!important}
    #cpPlay #btnCont{margin:0 0 4px!important}
    #introTitle{max-height:15vh!important}
  }
  @media (min-width:600px) and (min-aspect-ratio:11/10) and (max-height:520px){
    #cpick .cp-desc{display:none}#cpick .cp-title{margin-bottom:2px}
    #cpick .cp-stage{height:clamp(120px,46vh,200px)}
    #cpick .cp-skill{padding:5px 8px}#cpick .cp-skill span{font-size:6px}
    #cpick .cp-chip{padding:6px 10px}
    #cpPlay #btnStart img{height:clamp(42px,12vh,60px)!important}
    #introTitle{max-height:12vh!important}
  }
  `;document.head.appendChild(css);

  const box=document.createElement('div');box.id='cpick';
  box.innerHTML=`<div class="cp-title">ELIGE A TU NINJA</div>
   <div class="cp-grid">
    <div class="cp-left"><div class="cp-stage swap" id="cpStage"><div class="cp-floor"></div><img id="cpArt" alt="" draggable="false"><canvas id="cpCv" width="320" height="320" style="display:none"></canvas>
      <div class="cp-emoji" id="cpEmo"></div>
      <button class="cp-arrow l" id="cpL" aria-label="Anterior">◀</button><button class="cp-arrow r" id="cpR" aria-label="Siguiente">▶</button></div></div>
    <div class="cp-right">
     <div class="cp-name" id="cpName"></div><div class="cp-role" id="cpRole"></div><div class="cp-desc" id="cpDesc"></div>
     <div class="cp-stats">
       <label>SALTO</label><div class="cp-bar"><i id="cpJump"></i></div>
       <label>VELOCIDAD</label><div class="cp-bar"><i id="cpSpd"></i></div></div>
     <div class="cp-skill"><b id="cpSk"></b><span id="cpSkd"></span></div>
     <div class="cp-chips" id="cpChips"></div>
     <div class="cp-play" id="cpPlay"></div>
    </div>
   </div>`;
  grid.parentNode.insertBefore(box,grid);
  const play=document.getElementById('cpPlay');
  ['btnCont','btnStart'].forEach(id=>{const el=document.getElementById(id);if(el)play.appendChild(el);});
  const chips=document.getElementById('cpChips');
  ORDER.forEach(c=>{const b=document.createElement('button');b.className='cp-chip';b.dataset.c=c;b.textContent=CH[c].emoji+' '+CH[c].n;
    b.onclick=()=>window.selChar(c);chips.appendChild(b);});

  /* --- fotogramas de reposo (los mismos que usa el juego) --- */
  const cache={};
  function frames(c){
    if(cache[c])return cache[c];let list=[];
    try{
      const MAN=c==='mario'?window.SAKURA_MANIFEST:window.KAGE_MANIFEST,BASE=c==='mario'?'assets/sakura/':'assets/kage/';
      if(MAN&&MAN.idle){
        list=MAN.idle.map(f=>{const img=new Image();img.src=BASE+f.file;return{img,ax:f.ax,ay:f.ay};});
      }else if(typeof NJX!=='undefined'){
        const X=NJX[c==='peach'?'black':'pink'];if(X&&X.idle)list=X.idle;
      }
    }catch(e){}
    return cache[c]=list;
  }
  const cv=document.getElementById('cpCv'),cx=cv.getContext('2d'),art=document.getElementById('cpArt');
  const _m=/[?&]sel=(\d)/.exec(location.search),SEL=_m?_m[1]:'3';
  const ART={mario:'assets/select/sakura_'+SEL+'.png',peach:'assets/select/kage_'+SEL+'.png'};
  const useArt=/^[123]$/.test(SEL);
  function showArt(c){
    if(!useArt){art.style.display='none';cv.style.display='block';return;}
    art.onerror=()=>{art.style.display='none';cv.style.display='block';};
    art.onload=()=>{art.style.display='block';cv.style.display='none';};
    art.src=ART[c];
  }
  let cur=(typeof _char!=='undefined'?_char:'mario');
  function frame(){
    const t=Date.now();
    const s0=document.getElementById('S0');
    if(!s0||!s0.classList.contains('on')){setTimeout(frame,250);return;}
    requestAnimationFrame(frame);
    const L=frames(cur).filter(f=>f.img&&f.img.complete&&f.img.naturalWidth);
    cx.clearRect(0,0,cv.width,cv.height);
    if(!L.length)return;
    const n=L.length,per=Math.max(1,2*n-2),k=Math.floor(t/170)%per,fr=L[k<n?k:per-k];
    const avgH=L.reduce((a,f)=>a+f.img.naturalHeight,0)/n;
    const s=(cv.height*0.86)/avgH,bob=Math.sin(t/420)*3;
    cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';
    cx.drawImage(fr.img,cv.width/2-fr.ax*s,cv.height-14-fr.ay*s+bob,fr.img.naturalWidth*s,fr.img.naturalHeight*s);
  }
  function show(c,anim){
    if(!CH[c])c='mario';cur=c;const d=CH[c],st=document.getElementById('cpStage');
    box.style.setProperty('--c1',d.c1);box.style.setProperty('--c2',d.c2);box.style.setProperty('--c3',d.c3);
    document.getElementById('cpName').textContent=d.n;document.getElementById('cpRole').textContent=d.rol;
    document.getElementById('cpDesc').textContent=d.desc;document.getElementById('cpSk').textContent=d.sk;
    document.getElementById('cpSkd').textContent=d.skd;document.getElementById('cpEmo').textContent=d.emoji;
    const sp=(typeof SPD!=='undefined'?SPD:4.5);
    document.getElementById('cpJump').style.width=Math.round(d.jump()/13.5*100)+'%';
    document.getElementById('cpSpd').style.width=Math.round(sp/5.2*100)+'%';
    chips.querySelectorAll('.cp-chip').forEach(b=>b.classList.toggle('on',b.dataset.c===c));
    showArt(c);
    if(anim){st.classList.remove('swap');void st.offsetWidth;st.classList.add('swap');}
  }
  /* engancha selChar: cualquier cambio (flechas, chips, "Continuar") actualiza la pantalla */
  const orig=window.selChar;
  window.selChar=function(c){orig.apply(this,arguments);show(c,true);};
  const step=d=>{const i=ORDER.indexOf(cur);window.selChar(ORDER[(i+d+ORDER.length)%ORDER.length]);};
  document.getElementById('cpL').onclick=()=>step(-1);document.getElementById('cpR').onclick=()=>step(1);
  /* deslizar con el dedo */
  let sx=null;const stg=document.getElementById('cpStage');
  stg.addEventListener('pointerdown',e=>{sx=e.clientX;});
  stg.addEventListener('pointerup',e=>{if(sx===null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40)step(dx<0?1:-1);});
  stg.addEventListener('pointercancel',()=>{sx=null;});
  show(cur,false);frame();
 }});
})();
