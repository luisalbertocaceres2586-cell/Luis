/* engine/ui — Menú 2026 (reemplaza al selector de tarjetas y a la intro premium anteriores).
   · Dos ninjas de cuerpo completo ANIMADOS con los sprites del repositorio (reposo en bucle; al elegir, hace su ataque).
   · Se elige tocando al ninja, deslizando el dedo o con ← →. Un solo botón grande: JUGAR.
   · Ranking, logros, reporte, sonido, historia y créditos pasan a un dock de iconos (sin pared de botones).
   · Sigue usando selChar() del juego: "¿Quién juega?", "Continuar" y el guardado funcionan igual. */
(function(){
'use strict';
const S0=document.getElementById('S0');if(!S0||document.getElementById('m26'))return;
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const EVE=window.SAKURA_EVE_MANIFEST||window.SAKURA_MANIFEST,KM=window.KAGE_MANIFEST;
const mk=(tag,cls,par,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(par)par.appendChild(e);return e;};
const frames=(base,list)=>(list||[]).map(f=>{const i=new Image();i.decoding='async';i.src=base+f.file;return{img:i,ax:f.ax,ay:f.ay};});
const nomOf=a=>a.reduce((m,f)=>Math.max(m,f.ay||0),1);
const ebase=(EVE&&EVE.base)||'assets/characters/sakura/',kbase='assets/characters/kage/';

const HEROES=[
 {id:'mario',nm:'SAKURA EVE',tag:'Viento · Velocidad',a:'#ff5fa8',a2:'#ffc2e0',idle:frames(ebase,EVE&&EVE.idle),atk:frames(ebase,EVE&&EVE.atk),ifps:9,afps:20},
 {id:'peach',nm:'KAGE',tag:'Sombra · Potencia',a:'#ff5a4a',a2:'#ffc4b0',idle:frames(kbase,KM&&KM.idle),atk:frames(kbase,KM&&KM.atk),ifps:8,afps:18}
];
HEROES.forEach(h=>{h.nom=nomOf(h.idle);h.atkT=null;h.t0=Math.random()*3;});

/* ---------- ambiente ---------- */
const bg=mk('div',null,document.body);bg.id='m26bg';S0.insertBefore(bg,S0.firstChild);
mk('div','gl p',bg);mk('div','gl k',bg);mk('div','isl',bg);mk('div','cl a',bg);mk('div','cl b',bg);
for(let i=0;i<16;i++){const m=mk('i','mt'+(i%3===0?' g':''),bg);m.style.left=(Math.random()*100)+'%';m.style.setProperty('--d',(8+Math.random()*9)+'s');m.style.setProperty('--x',((Math.random()-.5)*120)+'px');m.style.animationDelay=(-Math.random()*14)+'s';}
mk('div','vg',bg);

/* ---------- estructura ---------- */
const root=mk('div',null,S0);root.id='m26';
const top=mk('div','m26-top',root);
const logo=document.getElementById('introTitle');if(logo)top.appendChild(logo);
mk('div','m26-kick',top,'Elige tu ninja');
const stage=mk('div','m26-stage',root);stage.setAttribute('role','radiogroup');stage.setAttribute('aria-label','Elige tu ninja');
HEROES.forEach(h=>{
  const b=mk('button','m26-hero',stage);b.type='button';b.dataset.hero=h.id;b.setAttribute('role','radio');b.setAttribute('aria-checked','false');b.setAttribute('aria-label',h.nm+' · '+h.tag);
  b.style.setProperty('--a',h.a);b.style.setProperty('--a2',h.a2);
  mk('span','m26-aura',b);mk('span','m26-floor',b);mk('span','m26-ring',b);
  h.cv=mk('canvas',null,b);h.cx=h.cv.getContext('2d');
  const inf=mk('span','m26-info',b);mk('span','m26-nm',inf).textContent=h.nm;mk('span','m26-tg',inf).textContent=h.tag;
  h.el=b;b.addEventListener('click',()=>pick(h.id));
});
const bottom=mk('div','m26-bottom',root);
const play=mk('div','m26-play',bottom);play.id='m26Play';
const dock=mk('div','m26-dock',bottom);

/* botón JUGAR: se conserva el elemento (y sus eventos), solo cambia su cara */
const start=document.getElementById('btnStart');
if(start){start.removeAttribute('style');start.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg><span class="lb">JUGAR</span>';start.setAttribute('aria-label','Jugar');play.appendChild(start);}
['btnCont','pfChip'].forEach(id=>{const e=document.getElementById(id);if(e)play.insertBefore(e,start||null);});
/* si "¿Quién juega?" crea su ficha después, que quede junto al botón */
new MutationObserver(()=>{const pf=document.getElementById('pfChip');if(pf&&start&&pf.parentNode!==play)play.insertBefore(pf,start);}).observe(S0,{childList:true,subtree:true});

/* dock de iconos con los botones originales (conservan sus eventos) */
const DOCK=[['btnLb','🏆','Ranking'],['achievementsButton','🏅','Logros'],['[onclick="showReport()"]','📊','Reporte'],['btnMuteMenu','🔊','Sonido'],['[onclick="showS(5)"]','ℹ️','Créditos']];
const dockBtns=[];
function iconize(b,ico,label){if(b.querySelector('.m26-i'))return;const t=(b.textContent||'').trim().split(/\s+/)[0];const e=/[A-Za-z0-9]/.test(t)?ico:(t||ico);
  b.className='m26-d';b.removeAttribute('style');b.innerHTML='<i class="m26-i">'+e+'</i><span class="m26-l">'+label+'</span>';b.title=label;b.setAttribute('aria-label',label);}
DOCK.forEach(([sel,ico,label])=>{const b=sel[0]==='['?S0.querySelector('button'+sel):document.getElementById(sel);if(!b)return;iconize(b,ico,label);dock.appendChild(b);dockBtns.push([b,ico,label]);});
/* historia (repetir la intro) */
const hist=mk('button','m26-d',dock,'<i class="m26-i">🎬</i><span class="m26-l">Historia</span>');hist.type='button';hist.title='Ver la historia';hist.setAttribute('aria-label','Ver la historia');
hist.addEventListener('click',()=>{if(window.IntroPro&&IntroPro.replay)IntroPro.replay();});
dock.insertBefore(hist,dock.lastElementChild);
/* si el juego reescribe el texto de un botón (p. ej. 🔊 → 🔇), se vuelve a poner su cara de icono */
new MutationObserver(()=>dockBtns.forEach(([b,ico,l])=>iconize(b,ico,l))).observe(dock,{childList:true,subtree:true});

/* el contenedor original queda oculto por CSS (conserva las tarjetas ocultas que otros módulos leen) */

/* ---------- selección ---------- */
function paintSel(c){
  if(c!=='mario'&&c!=='peach')c='mario';S0.dataset.sel=c;
  HEROES.forEach(h=>{const on=h.id===c;h.el.classList.toggle('on',on);h.el.setAttribute('aria-checked',String(on));});
}
function pick(c){
  const h=HEROES.find(x=>x.id===c);if(!h)return;
  const was=(typeof _char!=='undefined')?_char:null;
  if(typeof window.selChar==='function')window.selChar(c);else paintSel(c);
  paintSel(c);
  if(was!==c||true){h.atkT=performance.now();}            // al elegir (o volver a tocar) hace su ataque
}
const orig=window.selChar;
if(typeof orig==='function')window.selChar=function(c){const r=orig.apply(this,arguments);paintSel(c);return r;};
paintSel(typeof _char!=='undefined'?_char:'mario');

/* si ya hay un jugador activo, su ninja sale elegido (sin sonido ni ataque) */
function syncActivo(){
  try{if(window.Perfiles){const a=Perfiles.activo();if(a){const c=a.avatar==='kage'?'peach':'mario';_char=c;paintSel(c);}}}catch(e){}
}
syncActivo();addEventListener('introdone',syncActivo);

/* teclado y deslizar con el dedo */
function menuLibre(){return S0.classList.contains('on')&&!document.getElementById('n26')&&!document.getElementById('pfOverlay')&&!document.getElementById('tutorialModal')?.style.display.includes('flex');}
addEventListener('keydown',e=>{
  if(!menuLibre())return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();pick(e.key==='ArrowLeft'?'mario':'peach');}
  else if((e.key==='Enter')&&start&&!(e.target&&/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName))){e.preventDefault();start.click();}
});
let sx=null;
stage.addEventListener('pointerdown',e=>{sx=e.clientX;});
addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;
  if(Math.abs(dx)>50&&menuLibre()){const cur=S0.dataset.sel;pick(dx<0?'peach':'mario');if(cur===S0.dataset.sel)return;}});

/* ---------- animación de los sprites ---------- */
function fit(h){const r=h.cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(2,Math.round(r.width*d)),ht=Math.max(2,Math.round(r.height*d));
  if(h.cv.width!==w||h.cv.height!==ht){h.cv.width=w;h.cv.height=ht;}}
function paint(h,now){
  fit(h);const c=h.cv,x=h.cx,W=c.width,H=c.height;x.clearRect(0,0,W,H);
  let seq=h.idle,idx;
  if(h.atkT!=null){const k=Math.floor((now-h.atkT)/1000*h.afps);if(k>=h.atk.length)h.atkT=null;else{seq=h.atk;idx=k;}}
  if(idx==null)idx=Math.floor((now/1000+h.t0)*h.ifps)%Math.max(1,seq.length);
  const f=seq[idx];if(!f||!f.img.complete||!f.img.naturalWidth)return;
  const s=(H*.96)/h.nom;x.imageSmoothingQuality='high';
  x.drawImage(f.img,W/2-f.ax*s,H*.985-f.ay*s,f.img.naturalWidth*s,f.img.naturalHeight*s);
}
let lastDraw=0;
function tick(now){
  requestAnimationFrame(tick);
  if(document.hidden||!S0.classList.contains('on'))return;
  if(now-lastDraw<(REDUCED?200:30))return;lastDraw=now;
  HEROES.forEach(h=>paint(h,now));
}
requestAnimationFrame(tick);
window.Menu2026={pick};
})();
