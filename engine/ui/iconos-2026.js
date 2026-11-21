/* Asigna a cada botón del dock su icono premium según su etiqueta y mantiene el estado "silenciado" del botón de sonido. */
(function(){
'use strict';
const P='assets/intro-2026/';
const MAP={Ranking:['interfaz/icono_estrella','estrella'],Logros:['interfaz/icono_escudo','escudo'],Reporte:['interfaz/icono_rayo','rayo'],
  Sonido:['iconos/icono_sonido','sonido'],'Créditos':['interfaz/icono_corazon','corazon'],Historia:['interfaz/icono_sakura','sakura']};
function marcar(i){
  const b=i.closest('.m26-d'),l=b&&b.querySelector('.m26-l');if(!l)return;
  const m=MAP[(l.textContent||'').trim()];if(!m)return;
  if(i.dataset.ic!==m[1]){i.dataset.ic=m[1];i.style.setProperty('--ic','url("'+new URL(P+m[0]+'.webp',document.baseURI).href+'")');   /* ruta absoluta: dentro de una variable CSS se resolvería desde la hoja de estilos */
    new MutationObserver(()=>estado(i)).observe(i,{childList:true,characterData:true,subtree:true});}
  estado(i);
}
function estado(i){if(i.dataset.ic==='sonido')i.dataset.mute=/🔇/.test(i.textContent)?'1':'0';}
function todo(){document.querySelectorAll('#m26 .m26-d .m26-i').forEach(marcar);}
todo();
/* el menú puede armarse después de este script: se vigila el documento (con rAF para no gastar de más) */
let pend=0;new MutationObserver(()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;todo();});}).observe(document.body,{childList:true,subtree:true});
})();
