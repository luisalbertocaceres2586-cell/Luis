/* NINJA MULTIPLICACIÓN — Núcleo de mejoras (engine/core)
   Cada carpeta de engine/ agrupa un "motor" de mejoras independiente:
     ui/          pantallas y elementos de interfaz
     movimiento/  sensación de movimiento y control
     combate/     combos, rachas y recompensas
     educativo/   seguimiento del aprendizaje de las tablas
   Cada mejora se registra con NinjaMods.register({...}) y se puede apagar desde el botón "🧩 MEJORAS" del menú
   (o todas a la vez con ?mods=0 en la URL). Si una mejora falla, el juego sigue funcionando sin ella. */
(function(){
'use strict';
if(window.NinjaMods)return;
const KEY='ninja_mods_v1';
let off={};try{off=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
const master=!/[?&]mods=0/.test(location.search);
const M=window.NinjaMods={list:[],changed:false,
  enabled(id){return master&&off[id]!==false;},
  register(m){this.list.push(m);
    if(this.enabled(m.id)){try{if(m.init)m.init();m._on=true;}catch(e){console.warn('[Mejoras] '+m.id+' no se pudo iniciar:',e);}}},
  set(id,on){off[id]=!!on;this.changed=true;try{localStorage.setItem(KEY,JSON.stringify(off));}catch(e){}},
  /* envolver una función global: antes / después de ejecutarla */
  after(name,fn){const o=window[name];if(typeof o!=='function')return false;
    window[name]=function(){const r=o.apply(this,arguments);try{fn.apply(this,arguments);}catch(e){}return r;};return true;},
  before(name,fn){const o=window[name];if(typeof o!=='function')return false;
    window[name]=function(){try{fn.apply(this,arguments);}catch(e){}return o.apply(this,arguments);};return true;},
  /* toque corto de una tecla virtual (el juego detecta pulsaciones por cuadro, así que se mantiene ~90 ms) */
  tap(code,ms){K[code]=1;setTimeout(()=>{K[code]=0;},ms||90);}
};


/* ---------- utilidades compartidas por las mejoras (banner, destello, chips, posiciones) ---------- */
(function(){
  const st=document.createElement('style');st.textContent=`
  #nmBanner{position:fixed;left:50%;top:30%;transform:translate(-50%,-50%) scale(.6);z-index:9000;pointer-events:none;opacity:0;text-align:center;
    font-family:'Press Start 2P',monospace;font-size:clamp(14px,3.6vw,28px);color:#fff;text-shadow:0 0 14px var(--nb,#fff),3px 3px 0 #000;white-space:nowrap}
  #nmBanner small{display:block;margin-top:8px;font-size:.42em;color:#FFE9A8;text-shadow:2px 2px 0 #000}
  #nmBanner.on{animation:nmBan 1.7s cubic-bezier(.2,1.2,.3,1) forwards}
  @keyframes nmBan{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}22%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}
  #nmFlash{position:fixed;inset:0;z-index:8999;pointer-events:none;opacity:0;background:radial-gradient(circle,var(--nf,#fff) 0%,transparent 70%)}
  #nmFlash.on{animation:nmFl .38s ease-out}@keyframes nmFl{0%{opacity:.85}100%{opacity:0}}
  #nmChips{position:fixed;left:8px;top:92px;z-index:60;display:flex;flex-direction:column;gap:4px;pointer-events:none;font-family:'Press Start 2P',monospace}
  #nmChips div{font-size:clamp(6px,1.2vw,8px);color:#fff;padding:4px 8px;border-radius:14px;background:rgba(0,0,40,.72);border:1px solid var(--c,#8cf);text-shadow:1px 1px 0 #000;animation:pillPop .25s cubic-bezier(.34,1.56,.64,1)}`;
  document.head.appendChild(st);
  const ban=document.createElement('div');ban.id='nmBanner';document.body.appendChild(ban);
  const fl=document.createElement('div');fl.id='nmFlash';document.body.appendChild(fl);
  const chips=document.createElement('div');chips.id='nmChips';document.body.appendChild(chips);
  const U=M.util={
    banner(t,sub,col){ban.style.setProperty('--nb',col||'#fff');ban.innerHTML=t+(sub?'<small>'+sub+'</small>':'');ban.classList.remove('on');void ban.offsetWidth;ban.classList.add('on');},
    flash(col){fl.style.setProperty('--nf',col||'#fff');fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');},
    chip(id,html,col){let e=document.getElementById('nmc-'+id);
      if(!html){if(e)e.remove();return;}
      if(!e){e=document.createElement('div');e.id='nmc-'+id;chips.appendChild(e);}
      e.style.setProperty('--c',col||'#8cf');e.innerHTML=html;},
    vibrar(ms){try{if(navigator.vibrate)navigator.vibrate(ms||25);}catch(e){}},
    /* plataformas fijas (no suelo, no móviles, no del cielo), ordenadas de izquierda a derecha */
    /* alcanzables: a una altura que se puede saltar desde el suelo (sin las del cielo) */
    fijas(){const gy=(typeof groundY==='function')?groundY():320;
      return (typeof platforms!=='undefined'?platforms:[]).filter(p=>p.type!=='ground'&&!p.moving&&!p.mvType&&!p.isSkyZone&&!p.isSkyPortal&&p.w>=60&&p.y>gy-175&&p.y<gy-30).sort((a,b)=>a.x-b.x);},
    /* pantalla del héroe */
    heroXY(){return{x:P.x-camX+P.w/2,y:P.y+P.h/2};},
    /* congelar el mundo unos cuadros (impacto al recoger un poder, sala secreta...) */
    congelar(n){M._frz=Math.max(M._frz||0,n);}
  };
  /* "update" con congelación: se envuelve UNA vez aquí para todas las mejoras */
  const o=window.update;
  if(typeof o==='function')window.update=function(dt){if(M._frz>0){M._frz--;return;}if(M.pausaMundo)return;return o.apply(this,arguments);};
})();

/* ---------- panel "🧩 MEJORAS" ---------- */
const css=document.createElement('style');css.textContent=`
#modsPanel{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;background:rgba(2,0,20,.86);padding:12px}
#modsPanel.on{display:flex}
#modsPanel .mp-card{width:min(560px,96vw);max-height:92vh;overflow:auto;background:linear-gradient(160deg,rgba(2,4,60,.98),rgba(0,2,38,.99));
  border:2px solid rgba(80,140,255,.5);border-radius:12px;padding:16px;font-family:'Press Start 2P',monospace;color:#fff;box-shadow:0 0 60px rgba(0,60,200,.5)}
#modsPanel h2{font-size:clamp(11px,2.6vw,16px);color:#FFD700;text-align:center;margin:0 0 4px}
#modsPanel .mp-sub{font-size:7px;color:rgba(150,180,230,.8);text-align:center;margin-bottom:12px;line-height:1.6}
#modsPanel .mp-folder{font-size:8px;color:#00D4FF;margin:12px 0 6px;letter-spacing:2px}
#modsPanel .mp-row{display:flex;gap:10px;align-items:flex-start;background:rgba(0,0,40,.7);border:1px solid rgba(80,120,255,.3);border-radius:8px;padding:9px;margin-bottom:6px}
#modsPanel .mp-row b{display:block;font-size:8px;color:#FFE040;margin-bottom:4px;font-weight:400}
#modsPanel .mp-row span{display:block;font-size:6.5px;color:rgba(190,205,240,.8);line-height:1.7}
#modsPanel .mp-extra{margin-top:7px}
#modsPanel input[type=checkbox]{width:22px;height:22px;accent-color:#00E5FF;flex:none;margin-top:1px}
#modsPanel input[type=range]{width:100%;accent-color:#00E5FF}
#modsPanel .mp-btns{display:flex;gap:8px;justify-content:center;margin-top:14px}
#modsPanel button{font-family:inherit;font-size:9px;padding:11px 14px;border-radius:9px;border:2px solid #00AAFF;background:#0030A0;color:#fff;cursor:pointer}
#modsPanel button.gh{background:rgba(0,0,40,.8);border-color:rgba(120,150,255,.4)}
`;document.head.appendChild(css);

function build(){
  let p=document.getElementById('modsPanel');if(p)p.remove();
  p=document.createElement('div');p.id='modsPanel';
  const groups={};M.list.forEach(m=>{(groups[m.carpeta]=groups[m.carpeta]||[]).push(m);});
  let h='<div class="mp-card"><h2>🧩 MEJORAS DEL JUEGO</h2><div class="mp-sub">Cada carpeta de <i>engine/</i> es un motor de mejoras.<br>Apaga lo que no te guste; si algo falla, el juego sigue sin ello.</div>';
  Object.keys(groups).forEach(f=>{h+=`<div class="mp-folder">📁 engine/${f}/</div>`;
    groups[f].forEach(m=>{h+=`<div class="mp-row"><input type="checkbox" data-id="${m.id}" ${M.enabled(m.id)?'checked':''}><div style="flex:1"><b>${m.nombre}</b><span>${m.desc}</span><div class="mp-extra" id="mpx-${m.id}"></div></div></div>`;});});
  h+='<div class="mp-btns"><button id="mpApply" class="gh" style="display:none">↻ APLICAR</button><button id="mpClose">CERRAR</button></div></div>';
  p.innerHTML=h;document.body.appendChild(p);
  p.querySelectorAll('input[type=checkbox]').forEach(c=>c.addEventListener('change',()=>{M.set(c.dataset.id,c.checked);document.getElementById('mpApply').style.display='inline-block';}));
  document.getElementById('mpClose').onclick=()=>{if(M.changed)location.reload();else p.classList.remove('on');};
  document.getElementById('mpApply').onclick=()=>location.reload();
  M.list.forEach(m=>{if(m.panel&&M.enabled(m.id)){const el=document.getElementById('mpx-'+m.id);try{m.panel(el);}catch(e){}}});
  return p;
}
M.abrir=function(){const p=build();p.classList.add('on');};
const mute=document.getElementById('btnMuteMenu');
if(mute&&mute.parentNode){const b=document.createElement('button');b.className='pbtn sm gh';b.id='btnMods';b.textContent='🧩 MEJORAS';
  b.onclick=()=>{try{uAC();}catch(e){}M.abrir();};mute.parentNode.appendChild(b);}
})();
