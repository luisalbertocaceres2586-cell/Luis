/* engine/ui — Botones táctiles extra + tamaño ajustable
   En celular faltaban acciones que en teclado sí existen: ESQUIVAR (dash), AGACHARSE/BAJAR (⬇), DISPARO ESPECIAL (X)
   y TAJO (C). Se añaden como botones pequeños. Además, un control para cambiar el tamaño de TODOS los botones. */
(function(){
if(!window.NinjaMods)return;
const SK='ninja_btn_size_v1';
function applySize(v){
  const m=document.getElementById('mctl');if(m)m.style.setProperty('--mbs',v+'px');
  document.documentElement.style.setProperty('--mbx',Math.round(v*.78)+'px');
  window.dispatchEvent(new Event('resize'));
}
NinjaMods.register({id:'botones-extra',carpeta:'ui',nombre:'Botones táctiles extra',
 desc:'Añade ESQUIVAR (dash), AGACHARSE/BAJAR, ESPECIAL (X) y TAJO (C) en celular, y un control de tamaño de botones.',
 init(){
  const m=document.getElementById('mctl');if(!m)return;
  const st=document.createElement('style');st.textContent=`
  .mbx{position:absolute;width:var(--mbx,44px);height:var(--mbx,44px);border-radius:50%;border:2px solid rgba(255,255,255,.55);
    background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.32),rgba(20,30,90,.55));color:#fff;font-size:calc(var(--mbx,44px)*.42);
    display:flex;align-items:center;justify-content:center;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none;
    box-shadow:0 0 12px rgba(120,180,255,.5);pointer-events:auto;z-index:96}
  .mbx.on{transform:scale(.9);background:radial-gradient(circle,rgba(255,255,255,.55),rgba(0,120,255,.7))}
  .mbx small{position:absolute;bottom:-11px;font-size:7px;font-family:'Press Start 2P',monospace;color:rgba(255,255,255,.75);text-shadow:0 1px 2px #000;white-space:nowrap}`;
  document.head.appendChild(st);
  const B=[['⬇','KeyS','BAJAR',.27,.84],['💨','ShiftLeft','ESQUIVA',.78,.86],['✨','KeyX','ESPECIAL',.78,.58],['🗡','KeyC','TAJO',.94,.50]];
  B.forEach(([ico,code,lab,fx,fy])=>{
    const b=document.createElement('div');b.className='mbx';b.innerHTML=ico+'<small>'+lab+'</small>';
    const place=()=>{const w=b.offsetWidth||44;b.style.left=Math.round(innerWidth*fx-w/2)+'px';b.style.top=Math.round(innerHeight*fy-w/2)+'px';};
    const hold=code==='KeyS';
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.classList.add('on');if(hold){K['KeyS']=1;K['ArrowDown']=1;}else NinjaMods.tap(code,110);});
    const up=()=>{b.classList.remove('on');if(hold){K['KeyS']=0;K['ArrowDown']=0;}};
    b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
    m.appendChild(b);place();window.addEventListener('resize',place);
  });
  let v=parseInt(localStorage.getItem(SK)||'0',10);
  if(v>=36&&v<=110)applySize(v);else document.documentElement.style.setProperty('--mbx','44px');
 },
 panel(el){
  const cur=parseInt(localStorage.getItem(SK)||'0',10)||58;
  el.innerHTML='<span>Tamaño de los botones: <b id="bsv" style="display:inline;color:#00E5FF">'+cur+' px</b></span><input type="range" id="bsr" min="36" max="100" value="'+cur+'">';
  document.getElementById('bsr').oninput=e=>{const v=+e.target.value;document.getElementById('bsv').textContent=v+' px';try{localStorage.setItem(SK,v);}catch(_){}applySize(v);};
 }});
})();
