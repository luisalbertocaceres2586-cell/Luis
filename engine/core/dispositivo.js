/* engine/core — Detección automática del dispositivo (PC o teléfono/tableta).
   Ya nadie tiene que elegirlo: se decide solo, cada vez que se abre el juego.
   · Teléfono/tableta: el puntero principal es el dedo, o el navegador es móvil y hay pantalla táctil.
   · Computador: hay mouse/trackpad (también laptops con pantalla táctil).
   · Para probar: ?movil=1 fuerza teléfono, ?pc=1 fuerza computador.
   Expone window.NinjaDevice.tipo() → 'pc' | 'movil' y marca <html data-dispositivo="…">. */
(function(){
'use strict';
const Q=location.search;
function mm(q){try{return matchMedia(q).matches;}catch(e){return false;}}
function detectar(){
  if(/[?&]movil=1/.test(Q)||/[?&]dispositivo=movil/.test(Q))return 'movil';
  if(/[?&]pc=1/.test(Q)||/[?&]dispositivo=pc/.test(Q))return 'pc';
  const touch=('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0;
  const uaMovil=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&(navigator.maxTouchPoints||0)>1);
  const dedo=mm('(pointer:coarse)'),raton=mm('(any-pointer:fine)'),hover=mm('(any-hover:hover)');
  if(dedo&&!raton)return 'movil';
  if(uaMovil&&touch)return 'movil';
  if(touch&&!raton&&!hover)return 'movil';
  return 'pc';
}
function marcar(){document.documentElement.setAttribute('data-dispositivo',detectar());}
marcar();
['pointer:coarse','any-pointer:fine'].forEach(q=>{try{matchMedia('('+q+')').addEventListener('change',marcar);}catch(e){}});
window.NinjaDevice={tipo:detectar,esMovil:()=>detectar()==='movil'};
})();
