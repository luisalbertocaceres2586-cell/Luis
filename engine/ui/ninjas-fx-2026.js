/* FX 2026: plataforma, aura y efecto de selección de cada ninja + divisor y destellos del logo. Solo añade capas; no toca la lógica de selección. */
(function(){
'use strict';
const root=document.getElementById('m26');if(!root||root.dataset.fx==='1')return;root.dataset.fx='1';
const P='assets/intro-2026/';
const mk=(src,cls,par,before)=>{const i=new Image();i.src=P+src;i.className=cls;i.alt='';i.decoding='async';i.draggable=false;i.setAttribute('aria-hidden','true');par.insertBefore(i,before||null);return i;};
const SET={mario:{plat:'auras/plataforma_rosa.webp',aura:'auras/aura_viento_rosa.webp',extra:'auras/espiral_sakura.webp',burst:'auras/explosion_seleccion.webp'},
          peach:{plat:'auras/plataforma_violeta.webp',aura:'auras/aura_sombra.webp',extra:'auras/humo_oscuro.webp',burst:'auras/explosion_seleccion.webp'}};
root.querySelectorAll('.m26-hero').forEach(b=>{
  const s=SET[b.dataset.hero];if(!s)return;const first=b.firstChild;
  mk(s.extra,'fx fx-extra',b,first);mk(s.aura,'fx fx-aura',b,first);mk(s.plat,'fx fx-plat',b,first);
  const burst=mk(s.burst,'fx fx-burst',b);
  let was=b.classList.contains('on');
  new MutationObserver(()=>{const on=b.classList.contains('on');if(on&&!was){burst.classList.remove('go');void burst.offsetWidth;burst.classList.add('go');}was=on;}).observe(b,{attributes:true,attributeFilter:['class']});
  b.addEventListener('click',()=>{burst.classList.remove('go');void burst.offsetWidth;burst.classList.add('go');});   /* también al volver a tocar al ya elegido */
});
const top=root.querySelector('.m26-top'),kick=top&&top.querySelector('.m26-kick');
if(top){mk('efectos/particulas.webp','m26-spark',top,top.firstChild);
  if(kick){const o=mk('identidad/divisor.webp','m26-orn',top);top.insertBefore(o,kick);}}
})();
