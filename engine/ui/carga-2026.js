/* Capas extra de la pantalla de carga (#n26ld la crea intro-2026.js cada vez que arranca o se repite la intro). */
(function(){
'use strict';
const P='assets/intro-2026/';
function mk(src,cls){const i=new Image();i.src=P+src;i.className=cls;i.alt='';i.decoding='async';i.draggable=false;i.setAttribute('aria-hidden','true');return i;}
function decorar(){
  const ld=document.getElementById('n26ld');if(!ld||ld.dataset.c26)return;
  const logo=ld.querySelector('.n26logo');if(!logo)return;ld.dataset.c26='1';
  const wrap=document.createElement('div');wrap.className='ld26-wrap';
  const glow=document.createElement('div');glow.className='ld26-glow';
  ld.insertBefore(wrap,logo);wrap.append(glow,mk('efectos/particulas.webp','ld26-spark'),logo,mk('identidad/divisor.webp','ld26-orn'));
}
decorar();
new MutationObserver(decorar).observe(document.documentElement,{childList:true,subtree:true});
})();
