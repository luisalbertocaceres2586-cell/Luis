/* Efectos al cambiar de ninja (el 'on' pasa de un botón .m26-hero al otro). No se muestran al cargar, solo tras una interacción del jugador. */
(function(){
'use strict';
const root=document.getElementById('m26');if(!root||root.dataset.cb==='1')return;root.dataset.cb='1';
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const P='assets/intro-2026/transiciones/',stage=root.querySelector('.m26-stage'),heroes=[...root.querySelectorAll('.m26-hero')];
if(!stage||heroes.length<2)return;
let activo=false;const act=()=>{activo=true;};
root.addEventListener('pointerdown',act,{passive:true,capture:true});root.addEventListener('keydown',act,{capture:true});
const mk=(f,cls,par)=>{const i=new Image();i.src=P+f+'.webp';i.className=cls;i.alt='';i.decoding='async';i.draggable=false;i.setAttribute('aria-hidden','true');par.appendChild(i);setTimeout(()=>i.remove(),1300);return i;};
heroes.forEach((h,idx)=>{
  let was=h.classList.contains('on');
  new MutationObserver(()=>{
    const on=h.classList.contains('on');
    if(on&&!was&&activo&&!document.documentElement.classList.contains('fx-low')){
      mk('anillo_aparicion','cb26-ring',h);mk('humo_magico','cb26-smoke',h);
      const c=mk('cortina_energia','cb26-curtain'+(idx===0?' izq':''),stage);c.style.setProperty('--d',idx===0?'-1':'1');   /* barre hacia el lado del ninja elegido */
    }
    was=on;
  }).observe(h,{attributes:true,attributeFilter:['class']});
});
})();
