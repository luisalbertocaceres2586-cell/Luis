/* SELECT PRO — ilustraciones nuevas en el selector de personajes de la portada (assets/select/).
   Kage = asignado a la tarjeta "peach", Sakura = tarjeta "mario". Se pueden probar los 3 pares de arte con ?sel=1, ?sel=2 o ?sel=3 (por defecto 3).
   Si una imagen no carga, la tarjeta conserva su ilustración anterior. Desactivar: ?sel=0 */
(function(){
'use strict';
const m=/[?&]sel=(\d)/.exec(location.search),N=m?m[1]:'3';
if(N==='0'||!/^[123]$/.test(N))return;
const ART={mario:'assets/select/sakura_'+N+'.png',peach:'assets/select/kage_'+N+'.png'};
const st=document.createElement('style');
st.textContent=`
.hcardArtBig{width:auto!important;height:clamp(160px,33vh,250px)!important;max-width:100%!important;object-fit:contain;border-radius:0!important;
  transition:filter .3s ease,transform .3s ease!important}
.hcard:not(.on) .hcardArtBig{filter:brightness(.95) saturate(.85) drop-shadow(0 0 9px var(--hc1)) drop-shadow(0 8px 10px rgba(0,0,0,.65))!important;transform:scale(.96)}
.hcard.on .hcardArtBig{animation:selFloat 3.2s ease-in-out infinite}
@keyframes selFloat{0%,100%{transform:translateY(0) scale(1.02)}50%{transform:translateY(-5px) scale(1.04)}}
`;
document.head.appendChild(st);
document.querySelectorAll('.hcard').forEach(card=>{
  const img=card.querySelector('img.hcardArtBig'),src=ART[card.dataset.c];if(!img||!src)return;
  const old=img.src,pre=new Image();
  pre.onload=()=>{img.src=src;};pre.onerror=()=>{img.src=old;};pre.src=src;
});
})();
