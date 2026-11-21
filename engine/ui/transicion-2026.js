/* Portal de transición al salir del menú principal hacia el juego (no se muestra para Ranking ni Reporte). */
(function(){
'use strict';
const S0=document.getElementById('S0');if(!S0||S0.dataset.t26)return;S0.dataset.t26='1';
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const SKIP=['S1','S6'];let was=S0.classList.contains('on');
function portal(){
  if(document.documentElement.classList.contains('fx-low')||document.getElementById('t26'))return;
  const d=document.createElement('div');d.id='t26';d.setAttribute('aria-hidden','true');
  for(const f of ['portal_violeta','destello_central']){const i=new Image();i.src='assets/intro-2026/transiciones/'+f+'.webp';i.alt='';i.draggable=false;d.appendChild(i);}
  document.body.appendChild(d);setTimeout(()=>d.remove(),1100);
}
new MutationObserver(()=>{
  const now=S0.classList.contains('on');
  if(was&&!now){const dest=document.querySelector('.scr.on');if(!dest||SKIP.indexOf(dest.id)<0)setTimeout(()=>{const d2=document.querySelector('.scr.on');if(d2&&d2!==S0&&SKIP.indexOf(d2.id)<0)portal();},30);}
  was=now;
}).observe(S0,{attributes:true,attributeFilter:['class']});
/* precarga para que el primer portal no parpadee */
['portal_violeta','destello_central'].forEach(f=>{const i=new Image();i.src='assets/intro-2026/transiciones/'+f+'.webp';});
window.__portal26=portal;
})();
