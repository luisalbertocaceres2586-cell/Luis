/* Dispara la entrada coreografiada del menú cuando termina la intro (S0 recibe la clase n26In). Solo añade clases y capas temporales. */
(function(){
'use strict';
const S0=document.getElementById('S0');if(!S0||S0.dataset.c26)return;S0.dataset.c26='1';
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const P='assets/intro-2026/';let timers=[],tmp=[];
const img=(src,cls,par)=>{const i=new Image();i.src=P+src;i.className=cls;i.alt='';i.decoding='async';i.draggable=false;i.setAttribute('aria-hidden','true');par.appendChild(i);tmp.push(i);return i;};
function limpiar(){timers.forEach(clearTimeout);timers=[];tmp.forEach(n=>n.remove());tmp=[];S0.classList.remove('c26');}
function correr(){
  limpiar();const root=document.getElementById('m26');if(!root)return;
  const top=root.querySelector('.m26-top'),heroes=root.querySelectorAll('.m26-hero');
  if(top)img('transiciones/destello_central.png','c26-flash',top);
  heroes.forEach((h,i)=>img(i===0?'transiciones/rafaga_viento.png':'auras/humo_oscuro.png','c26-puff',h));
  S0.classList.add('c26');
  /* explosión de selección del ninja elegido justo cuando termina de entrar */
  timers.push(setTimeout(()=>{const b=root.querySelector('.m26-hero.on .fx-burst');if(b){b.classList.remove('go');void b.offsetWidth;b.classList.add('go');}},1750));
  timers.push(setTimeout(limpiar,3600));
}
let was=S0.classList.contains('n26In');
new MutationObserver(()=>{const now=S0.classList.contains('n26In');if(now&&!was)correr();was=now;}).observe(S0,{attributes:true,attributeFilter:['class']});
window.__coreografia26=correr;
})();
