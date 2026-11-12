/* engine/ui — Selector de personaje (versión limpia)
   Dos TARJETAS VERTICALES (proporción 3:4) con el héroe de cuerpo completo; tocar una tarjeta la elige.
   Panel a la derecha con lo mínimo: nombre, rol, su ataque especial en una línea y el botón de JUGAR.
   Sigue usando selChar() del juego, así que "Continuar partida", "¿Quién juega?" y "Comenzar" funcionan igual. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'seleccion-personajes',carpeta:'ui',nombre:'Selector de personaje (tarjetas)',
 desc:'Dos tarjetas verticales con el héroe de cuerpo completo, nombre, ataque especial y botón de jugar; sin barras ni textos de más.',
 init(){
  const grid=document.getElementById('cgrid');if(!grid||!grid.parentNode)return;
  const CH={
    mario:{n:'SAKURA',rol:'NINJA DEL VIENTO',emoji:'🌸',c1:'#FF2E92',c2:'#7A0A4A',c3:'#FFB3DA',sk:'✨ X · Triple abanico',art:'sakura'},
    peach:{n:'KAGE',rol:'NINJA DE LA SOMBRA',emoji:'🔥',c1:'#FF3B44',c2:'#5A0006',c3:'#FFC2C5',sk:'✨ X · Disparo doble',art:'kage'}
  };
  const ORDER=['mario','peach'];
  const _m=/[?&]sel=(\d)/.exec(location.search),SEL=/^[123]$/.test(_m&&_m[1])?_m[1]:'3';
  const css=document.createElement('style');css.textContent=`
  #cgrid{display:none!important}
  .heroPick{max-width:min(96vw,880px)!important;display:flex!important;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 8px}
  .heroPick>.brow{display:contents!important}
  .heroPick .pbtn.sm{flex:0 0 auto!important;width:auto!important;min-width:0!important;margin:0!important;padding:7px 10px!important;font-size:clamp(6px,1.35vw,8px)!important;white-space:nowrap}
  #ipReplay{top:max(8px,env(safe-area-inset-top))!important;bottom:auto!important;left:max(10px,env(safe-area-inset-left))!important}
  #cpick{--c1:#FF2E92;--c2:#7A0A4A;--c3:#FFB3DA;flex:0 0 100%;font-family:'Press Start 2P',monospace;color:#fff}
  #cpick .cp-main{display:flex;align-items:center;justify-content:center;gap:clamp(14px,3.4vw,40px)}
  #cpick .cp-cards{display:flex;gap:clamp(8px,1.8vw,18px);flex:none}
  #cpick .cp-card{--ch:clamp(150px,58vh,360px);position:relative;height:var(--ch);aspect-ratio:3/4;border-radius:16px;padding:0;overflow:hidden;cursor:pointer;
    border:2px solid rgba(255,255,255,.18);background:radial-gradient(ellipse at 50% 78%,var(--k1) 0%,var(--k2) 52%,rgba(6,2,28,.96) 100%);
    opacity:.72;filter:saturate(.6);transform:scale(.95);transition:transform .25s,opacity .25s,filter .25s,border-color .25s,box-shadow .25s;-webkit-tap-highlight-color:transparent;font-family:inherit;color:#fff}
  #cpick .cp-card.on{opacity:1;filter:none;transform:scale(1.03);border-color:var(--k1);box-shadow:0 0 22px var(--k1),inset 0 0 26px rgba(0,0,0,.45)}
  #cpick .cp-card img{position:absolute;left:50%;top:5%;transform:translateX(-50%);height:82%;width:90%;object-fit:contain;object-position:50% 100%;pointer-events:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
  #cpick .cp-card.on img{animation:cpFloat 3.2s ease-in-out infinite}
  @keyframes cpFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-4px)}}
  #cpick .cp-card .nm{position:absolute;left:0;right:0;bottom:0;padding:8px 4px 9px;text-align:center;font-size:clamp(8px,1.9vh,12px);letter-spacing:2px;
    background:linear-gradient(transparent,rgba(0,0,0,.78));text-shadow:0 0 8px var(--k1),2px 2px 0 #000;color:var(--k3)}
  #cpick .cp-panel{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-width:0;max-width:300px;flex:1 1 auto}
  #cpick .cp-name{font-size:clamp(18px,5.4vh,34px);color:var(--c3);text-shadow:0 0 14px var(--c1),3px 3px 0 #000;letter-spacing:2px;line-height:1.1}
  #cpick .cp-role{font-size:clamp(6px,1.5vh,8px);letter-spacing:2px;color:rgba(255,255,255,.7)}
  #cpick .cp-sk{font-size:clamp(7px,1.7vh,9px);color:#FFE040;padding:7px 10px;border-radius:9px;background:rgba(0,0,30,.55);border:1px solid var(--c1);margin:2px 0 4px}
  #cpick .cp-play{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
  #cpPlay #btnStart{margin:2px 0 0!important}
  #cpPlay #btnStart img{width:auto!important;height:clamp(48px,12vh,84px)!important;max-width:100%}
  #cpPlay #btnCont{margin:0!important;font-size:clamp(7px,1.5vh,9px)!important;padding:8px 12px!important}
  #cpPlay #pfChip{margin:0!important;font-size:clamp(6px,1.5vh,8px)!important;padding:7px 10px!important}
  #introTitle{max-height:12vh!important;width:auto!important;max-width:60vw}
  @media (max-aspect-ratio:11/10),(max-width:600px){
    #cpick .cp-main{flex-direction:column;gap:10px}
    #cpick .cp-card{--ch:clamp(150px,34vh,300px)}
    #cpick .cp-panel{align-items:center;text-align:center;max-width:90vw}
    #cpick .cp-play{align-items:center}
  }`;document.head.appendChild(css);

  const box=document.createElement('div');box.id='cpick';
  box.innerHTML=`<div class="cp-main">
    <div class="cp-cards" id="cpCards"></div>
    <div class="cp-panel">
      <div class="cp-name" id="cpName"></div><div class="cp-role" id="cpRole"></div><div class="cp-sk" id="cpSk"></div>
      <div class="cp-play" id="cpPlay"></div>
    </div></div>`;
  grid.parentNode.insertBefore(box,grid);
  const cards=document.getElementById('cpCards');
  ORDER.forEach(c=>{const d=CH[c],b=document.createElement('button');b.type='button';b.className='cp-card';b.dataset.c=c;b.setAttribute('aria-label',d.n);
    b.style.cssText=`--k1:${d.c1};--k2:${d.c2};--k3:${d.c3}`;
    const im=new Image();im.alt='';im.draggable=false;im.src='assets/ui/select/'+d.art+'_'+SEL+'.png';im.onerror=()=>{im.style.display='none';b.insertAdjacentHTML('afterbegin','<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:56px">'+d.emoji+'</div>');};
    b.appendChild(im);const nm=document.createElement('div');nm.className='nm';nm.textContent=d.n;b.appendChild(nm);
    b.onclick=()=>window.selChar(c);cards.appendChild(b);});
  // botones de jugar (los mueve a la columna derecha conservando sus eventos)
  const play=document.getElementById('cpPlay');
  ['btnCont','pfChip','btnStart'].forEach(id=>{const e=document.getElementById(id);if(e)play.appendChild(e);});
  // si otro módulo crea la ficha "¿Quién juega?" después, que quede junto al botón de jugar
  new MutationObserver(()=>{const st=document.getElementById('btnStart'),pf=document.getElementById('pfChip');if(st&&pf&&pf.parentNode!==play)play.insertBefore(pf,st);}).observe(document.getElementById('S0')||document.body,{childList:true,subtree:true});

  let cur=(typeof _char!=='undefined'?_char:'mario');
  function show(c){
    if(!CH[c])c='mario';cur=c;const d=CH[c];
    box.style.setProperty('--c1',d.c1);box.style.setProperty('--c2',d.c2);box.style.setProperty('--c3',d.c3);
    document.getElementById('cpName').textContent=d.n;document.getElementById('cpRole').textContent=d.rol;document.getElementById('cpSk').textContent=d.sk;
    cards.querySelectorAll('.cp-card').forEach(b=>b.classList.toggle('on',b.dataset.c===c));
  }
  const orig=window.selChar;
  window.selChar=function(c){orig.apply(this,arguments);show(c);};
  show(cur);
 }});
})();
