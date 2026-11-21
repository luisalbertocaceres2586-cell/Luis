/* Efectos hover y click del menú, de la ventana ¿Quién juega? y de los controles principales (sprites de assets/intro-2026/iconos). */
(function(){
'use strict';
if(window.__fx26)return;window.__fx26=1;
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const P='assets/intro-2026/iconos/';
const SEL='#m26 button,#pfOverlay button,#btnStart';
const mk=(src,cls)=>{const i=new Image();i.src=P+src;i.className=cls;i.alt='';i.decoding='async';i.draggable=false;i.setAttribute('aria-hidden','true');return i;};
/* precarga para que el primer efecto no parpadee */
mk('fx_click.webp','');mk('fx_hover.webp','');
/* click: explosión de partículas en el punto pulsado */
addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest(SEL);if(!b||b.disabled)return;
  const f=mk('fx_click.webp','fx26-click');const s=Math.max(70,Math.min(150,Math.min(b.offsetWidth,b.offsetHeight)*2.1));
  f.style.width=s+'px';f.style.left=e.clientX+'px';f.style.top=e.clientY+'px';
  f.addEventListener('animationend',()=>f.remove());document.body.appendChild(f);setTimeout(()=>f.remove(),900);
},{capture:true,passive:true});
/* hover: destello horizontal sobre el botón (solo con mouse) */
if(matchMedia('(pointer:fine)').matches){
  let fx=null,cur=null;
  const quitar=()=>{if(fx){const x=fx;x.classList.remove('on');setTimeout(()=>x.remove(),300);fx=null;}cur=null;};
  document.addEventListener('pointerover',e=>{
    const b=e.target.closest&&e.target.closest(SEL);if(b===cur)return;
    quitar();if(!b||b.disabled||b.classList.contains('m26-hero'))return;cur=b;
    const r=b.getBoundingClientRect();if(!r.width)return;
    fx=mk('fx_hover.webp','fx26-hover');const w=Math.max(110,r.width*1.05),h=w*273/440;fx.style.width=w+'px';
    fx.style.left=(r.left+r.width/2)+'px';fx.style.top=(r.bottom+h/2-h*.22)+'px';   /* resplandor bajo el botón: no tapa su texto */document.body.appendChild(fx);
    requestAnimationFrame(()=>fx&&fx.classList.add('on'));
  },true);
  document.addEventListener('pointerout',e=>{if(cur&&(!e.relatedTarget||!cur.contains(e.relatedTarget)))quitar();},true);
  addEventListener('scroll',quitar,true);
}
})();
