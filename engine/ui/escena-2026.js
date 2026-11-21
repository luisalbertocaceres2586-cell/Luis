/* Escena 2026 del menú: arma las capas con los sprites de assets/intro-2026 dentro de #m26bg (creado por menu-2026.js). */
(function(){
'use strict';
const bg=document.getElementById('m26bg');if(!bg||document.getElementById('n26scene'))return;
const A='assets/intro-2026/ambiente/';
const sc=document.createElement('div');sc.id='n26scene';sc.setAttribute('aria-hidden','true');
const add=(cls,file,par)=>{const i=new Image();i.className=cls;i.src=A+file+'.webp';i.alt='';i.decoding='async';i.draggable=false;(par||sc).appendChild(i);return i;};
add('moon','luna');
add('cloud c1','nube');add('cloud c2','nube');add('cloud c3','nube');
add('isle i1','isla_mediana');add('isle i2','isla_pequena');
add('temple','templo');
add('tree t1','sakura_grande');add('tree t2','sakura_pequeno');
add('lamp l1','farol');add('lamp l2','farol');
for(let i=0;i<14;i++){const p=add('petal','petalo');p.style.left=(Math.random()*100)+'%';
  p.style.setProperty('--s',(9+Math.random()*13)+'px');p.style.setProperty('--dur',(9+Math.random()*9)+'s');p.style.setProperty('--dl',(-Math.random()*16)+'s');
  p.style.setProperty('--dx',((Math.random()-.2)*220)+'px');p.style.setProperty('--rot',((Math.random()-.5)*900)+'deg');}
const vg=bg.querySelector('.vg');bg.insertBefore(sc,vg||null);
/* parallax suave con el puntero (solo en PC; en celular las capas se mueven por sus animaciones) */
if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&matchMedia('(pointer:fine)').matches){
  let raf=0;addEventListener('pointermove',e=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;sc.style.setProperty('--px',((e.clientX/innerWidth-.5)*2).toFixed(3));sc.style.setProperty('--py',((e.clientY/innerHeight-.5)*2).toFixed(3));});},{passive:true});
}
})();
