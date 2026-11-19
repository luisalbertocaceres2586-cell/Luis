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
    mario:{n:'SAKURA EVE',rol:'NINJA DEL VIENTO',emoji:'🌸',c1:'#FF2E92',c2:'#4B174A',c3:'#FFB3DA',sk:'X  ·  TRIPLE ABANICO',desc:'Ágil y precisa. Domina el viento para abrirte camino entre los enemigos.',tag:'VELOCIDAD  ·  TÉCNICA',art:'sakura'},
    peach:{n:'KAGE',rol:'NINJA DE LA SOMBRA',emoji:'🔥',c1:'#FF654F',c2:'#4A1C2A',c3:'#FFC2A8',sk:'X  ·  DISPARO DOBLE',desc:'Fuerte y decidido. Su energía oscura golpea con potencia a los rivales.',tag:'POTENCIA  ·  ENERGÍA',art:'kage'}
  };
  const ORDER=['mario','peach'];
  const _m=/[?&]sel=(\d)/.exec(location.search),SEL=/^[123]$/.test(_m&&_m[1])?_m[1]:'3';
  const css=document.createElement('style');css.textContent=`
  #cgrid{display:none!important}
  .heroPick{width:min(96vw,980px)!important;max-width:980px!important;display:flex!important;flex-direction:column;align-items:center;gap:clamp(10px,2vh,18px);margin:0 auto}
  .heroPick>.brow{display:contents!important}
  .heroPick .pbtn.sm{flex:0 0 auto!important;width:auto!important;min-width:0!important;margin:0!important;padding:9px 13px!important;font:800 11px Inter,ui-sans-serif,sans-serif!important;white-space:nowrap;border-radius:999px!important}
  #ipReplay{top:max(10px,env(safe-area-inset-top))!important;bottom:auto!important;left:max(10px,env(safe-area-inset-left))!important}
  #cpick{--c1:#16C8E8;--c2:#7667E8;--c3:#FFC247;flex:0 0 100%;width:100%;font-family:Inter,ui-sans-serif,sans-serif;color:#F4F6FC}
  #cpick .cp-kicker{font:800 10px/1.4 Inter,ui-sans-serif,sans-serif;letter-spacing:.2em;color:#16C8E8;text-transform:uppercase;text-align:center;margin-bottom:5px}
  #cpick .cp-heading{font:900 clamp(16px,2.5vw,22px)/1.25 Inter,ui-sans-serif,sans-serif;letter-spacing:.015em;text-align:center;color:#F4F6FC;margin:0 0 5px;text-shadow:0 4px 18px rgba(0,0,0,.55)}
  #cpick .cp-sub{font:500 clamp(11px,1.3vw,13px)/1.5 Inter,ui-sans-serif,sans-serif;color:#B7C3DF;text-align:center;margin-bottom:clamp(8px,1.4vh,14px)}
  #cpick .cp-main{display:flex;align-items:center;justify-content:center;gap:clamp(18px,4vw,46px);width:100%}
  #cpick .cp-cards{display:flex;gap:clamp(10px,2vw,20px);flex:none;align-items:stretch}
  #cpick .cp-card{--ch:clamp(180px,43vh,330px);position:relative;display:flex;flex-direction:column;justify-content:flex-end;height:var(--ch);width:clamp(138px,19vw,220px);border-radius:20px;padding:0;overflow:hidden;cursor:pointer;
    border:1px solid rgba(185,202,240,.24);background:radial-gradient(ellipse at 50% 76%,var(--k1) 0%,var(--k2) 48%,#10152B 100%);
    opacity:.84;filter:saturate(.82);transform:translateY(0) scale(.97);transition:transform .24s ease,opacity .24s ease,filter .24s ease,border-color .24s ease,box-shadow .24s ease;-webkit-tap-highlight-color:transparent;color:#fff;text-align:center;box-shadow:0 14px 35px rgba(0,0,0,.28)}
  #cpick .cp-card::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08),transparent 35%,rgba(5,9,23,.08) 60%,rgba(5,9,23,.92));z-index:1;pointer-events:none}
  #cpick .cp-card::after{content:"";position:absolute;inset:8px;border:1px solid rgba(255,255,255,.13);border-radius:14px;pointer-events:none;z-index:2}
  #cpick .cp-card:hover{opacity:1;filter:none;transform:translateY(-4px) scale(1);border-color:rgba(22,200,232,.65)}
  #cpick .cp-card.on{opacity:1;filter:none;transform:translateY(-5px) scale(1.025);border:2px solid var(--k3);box-shadow:0 0 0 4px rgba(255,255,255,.06),0 16px 38px color-mix(in srgb,var(--k1) 35%,transparent),0 20px 42px rgba(0,0,0,.4)}
  #cpick .cp-card img{position:absolute;left:50%;top:2%;transform:translateX(-50%);height:82%;width:94%;object-fit:contain;object-position:50% 100%;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.45));z-index:0}
  #cpick .cp-card img.sakuraArt{top:-6%;height:94.5%;width:105%}
  #cpick .cp-card.on img{animation:cpFloat 3.4s ease-in-out infinite}
  @keyframes cpFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-5px)}}
  #cpick .cp-card .nm{position:relative;z-index:3;padding:15px 8px 8px;text-align:center;font:900 clamp(12px,1.7vw,16px)/1.2 Inter,ui-sans-serif,sans-serif;letter-spacing:.1em;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.8)}
  #cpick .cp-card .tag{position:relative;z-index:3;padding:0 8px 13px;font:700 9px/1.4 Inter,ui-sans-serif,sans-serif;letter-spacing:.1em;color:var(--k3);text-transform:uppercase}
  #cpick .cp-check{position:absolute;top:14px;right:14px;z-index:4;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:var(--k3);color:#111827;font:900 14px Inter,sans-serif;opacity:0;transform:scale(.7);transition:opacity .2s,transform .2s;box-shadow:0 4px 15px rgba(0,0,0,.35)}
  #cpick .cp-card.on .cp-check{opacity:1;transform:scale(1)}
  #cpick .cp-panel{display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0;max-width:300px;flex:0 1 290px;padding:clamp(14px,2.2vw,22px);border:1px solid rgba(150,175,225,.23);border-radius:18px;background:linear-gradient(145deg,rgba(20,29,56,.88),rgba(10,17,36,.9));box-shadow:0 16px 38px rgba(0,0,0,.3);backdrop-filter:blur(14px);text-align:left}
  #cpick .cp-label{font:800 9px Inter,ui-sans-serif,sans-serif;letter-spacing:.18em;color:#16C8E8;text-transform:uppercase}
  #cpick .cp-name{font:900 clamp(23px,4vh,34px)/1.1 Inter,ui-sans-serif,sans-serif;color:var(--c3);letter-spacing:.04em;text-shadow:0 4px 18px color-mix(in srgb,var(--c1) 35%,transparent)}
  #cpick .cp-role{font:800 10px/1.5 Inter,ui-sans-serif,sans-serif;letter-spacing:.12em;color:#C4CEE4}
  #cpick .cp-desc{font:500 12px/1.55 Inter,ui-sans-serif,sans-serif;color:#AAB8D4}
  #cpick .cp-skill{display:flex;align-items:center;gap:9px;width:100%;padding:11px 12px;border:1px solid color-mix(in srgb,var(--c1) 48%,transparent);border-radius:12px;background:color-mix(in srgb,var(--c1) 10%,rgba(6,12,28,.8));font:700 11px/1.4 Inter,ui-sans-serif,sans-serif;color:#F4F6FC}
  #cpick .cp-skill b{color:var(--c3);font-size:10px;letter-spacing:.08em}
  #cpick .cp-hint{font:500 10px/1.5 Inter,ui-sans-serif,sans-serif;color:#8796B8}
  #cpick .cp-play{display:flex;flex-direction:column;align-items:flex-start;gap:9px;width:100%;margin-top:2px}
  #cpPlay #btnStart{margin:0!important;animation:none!important;filter:drop-shadow(0 8px 18px rgba(22,200,232,.2))}
  #cpPlay #btnStart img{width:auto!important;height:clamp(48px,10vh,76px)!important;max-width:100%;transition:transform .2s,filter .2s}
  #cpPlay #btnStart:hover img{transform:translateY(-2px);filter:brightness(1.12)}
  #cpPlay #btnCont{margin:0!important;font:800 11px Inter,ui-sans-serif,sans-serif!important;padding:10px 14px!important}
  #cpPlay #pfChip{margin:0!important;font:700 10px Inter,ui-sans-serif,sans-serif!important;padding:8px 11px!important}
  #introTitle{max-height:12vh!important;width:auto!important;max-width:min(58vw,480px)}
  @media(max-width:760px){
    .heroPick{gap:9px}
    #cpick .cp-main{flex-direction:column;gap:10px}
    #cpick .cp-cards{gap:10px}
    #cpick .cp-card{--ch:clamp(148px,31vh,235px);width:clamp(125px,37vw,190px)}
    #cpick .cp-panel{align-items:center;text-align:center;max-width:min(94vw,520px);width:100%;padding:12px 14px;gap:7px}
    #cpick .cp-skill{justify-content:center}
    #cpick .cp-play{align-items:center}
    #cpick .cp-desc{max-width:420px}
    #introTitle{max-height:10vh!important;max-width:58vw}
  }
  @media(max-height:620px) and (orientation:landscape){
    #cpick .cp-main{flex-direction:row;gap:14px}
    #cpick .cp-card{--ch:clamp(145px,43vh,230px);width:clamp(112px,18vw,165px)}
    #cpick .cp-panel{max-width:250px;padding:10px;gap:6px}
    #cpick .cp-name{font-size:22px}
    #cpick .cp-desc{font-size:10px}
    #cpick .cp-skill{padding:7px 9px}
    #introTitle{max-height:8vh!important}
  }
  @media(prefers-reduced-motion:reduce){#cpick .cp-card,#cpick .cp-card img{animation:none!important;transition:none!important}}
`;document.head.appendChild(css);

  const box=document.createElement('div');box.id='cpick';
  box.innerHTML=`<div class="cp-kicker">ELIGE TU CAMINO</div>
    <div class="cp-heading">¿CON QUÉ NINJA JUGARÁS?</div>
    <div class="cp-sub">Selecciona tu héroe y prepárate para recuperar las tablas</div>
    <div class="cp-main">
      <div class="cp-cards" id="cpCards" role="radiogroup" aria-label="Selecciona tu personaje"></div>
      <div class="cp-panel">
        <div class="cp-label">PERSONAJE SELECCIONADO</div>
        <div class="cp-name" id="cpName"></div><div class="cp-role" id="cpRole"></div>
        <div class="cp-desc" id="cpDesc"></div>
        <div class="cp-skill"><b>HABILIDAD</b><span id="cpSk"></span></div>
        <div class="cp-hint">Tu aventura comienza aquí. ¡Demuestra lo que sabes!</div>
        <div class="cp-play" id="cpPlay"></div>
      </div></div>`;
  grid.parentNode.insertBefore(box,grid);
  const cards=document.getElementById('cpCards');
  ORDER.forEach(c=>{const d=CH[c],b=document.createElement('button');b.type='button';b.className='cp-card';b.dataset.c=c;b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.setAttribute('aria-label',d.n+' · '+d.rol);
    b.style.cssText=`--k1:${d.c1};--k2:${d.c2};--k3:${d.c3}`;
  const im=new Image();im.alt='';im.draggable=false;im.decoding='async';if(c==='mario')im.className='sakuraArt';im.src=c==='mario'?'assets/characters/sakura_assets/sakura/frames/idle/sakura_idle_01.png':'assets/ui/select/'+d.art+'_'+SEL+'.png';im.onerror=()=>{im.style.display='none';if(!b.querySelector('.cp-fallback')){const f=document.createElement('span');f.className='cp-fallback';f.textContent=d.emoji;f.style.cssText='position:absolute;inset:12% 0 20%;display:grid;place-items:center;font-size:clamp(48px,8vw,82px);z-index:0';b.insertBefore(f,b.firstChild);}};
  b.appendChild(im);const ck=document.createElement('span');ck.className='cp-check';ck.textContent='✓';ck.setAttribute('aria-hidden','true');b.appendChild(ck);
    const nm=document.createElement('div');nm.className='nm';nm.textContent=d.n;b.appendChild(nm);
    const tag=document.createElement('div');tag.className='tag';tag.textContent=d.tag;b.appendChild(tag);
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
    document.getElementById('cpName').textContent=d.n;document.getElementById('cpRole').textContent=d.rol;document.getElementById('cpSk').textContent=d.sk;document.getElementById('cpDesc').textContent=d.desc;
    cards.querySelectorAll('.cp-card').forEach(b=>{const active=b.dataset.c===c;b.classList.toggle('on',active);b.setAttribute('aria-checked',String(active));});
  }
  const orig=window.selChar;
  window.selChar=function(c){orig.apply(this,arguments);show(c);};
  show(cur);
 }});
})();
