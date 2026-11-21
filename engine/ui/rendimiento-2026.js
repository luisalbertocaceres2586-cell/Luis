/* Rendimiento 2026: apaga los efectos pesados en equipos modestos y pausa las animaciones con la pestaña oculta.
   Modo "fx-low" = clase en <html> (la leen los CSS *-2026). Decisión: pista del equipo → medición real de fotogramas (se recuerda en este navegador).
   Forzar a mano: ?fx=low | ?fx=high | ?fx=auto, o en consola fx26('low'|'high'|'auto'). */
(function(){
'use strict';
if(window.fx26)return;
const H=document.documentElement,KEY='ninja_fx_v1';
const set=m=>{H.classList.toggle('fx-low',m==='low');};
const get=()=>{try{return localStorage.getItem(KEY)||'';}catch(e){return '';}};
const save=v=>{try{v?localStorage.setItem(KEY,v):localStorage.removeItem(KEY);}catch(e){}};
const q=(location.search.match(/[?&]fx=(low|high|auto)/)||[])[1];
window.fx26=function(m){if(m==='low'||m==='high'){save(m);set(m);}else{save('');set(hint()?'low':'');medir();}return H.classList.contains('fx-low')?'low':'high';};
/* pista rápida por hardware o ahorro de datos */
function hint(){
  const n=navigator,c=n.connection||{};
  return (n.hardwareConcurrency&&n.hardwareConcurrency<=2)||(n.deviceMemory&&n.deviceMemory<=2)||c.saveData===true||/(2g)/.test(c.effectiveType||'');
}
/* medición real: promedio de duración de fotogramas con la escena ya armada */
let midiendo=false;
function medir(){
  if(midiendo||(get()&&!q))return;midiendo=true;
  const esperar=()=>{ if(document.hidden||(!window.__introDone&&performance.now()<20000)){return setTimeout(esperar,1000);} setTimeout(muestrear,4500); };
  function muestrear(){
    const dts=[];let last=0,t0=0;
    const f=t=>{ if(document.hidden){midiendo=false;return setTimeout(esperar,1000);} if(last){const d=t-last;if(d<250)dts.push(d);} last=t;t0=t0||t;
      if(t-t0<3000)return requestAnimationFrame(f);
      midiendo=false;if(dts.length<30)return;
      dts.sort((a,b)=>a-b);const med=dts[dts.length>>1],p90=dts[Math.floor(dts.length*.9)];
      const lento=med>26||p90>45;               /* < ~38 fps de mediana o tirones frecuentes */
      if(lento){set('low');save('low');} else save('high');
      window.__fx26info={medianaMs:Math.round(med*10)/10,p90Ms:Math.round(p90*10)/10,modo:lento?'low':'high'};
    };requestAnimationFrame(f);
  }
  esperar();
}
const ini=q==='low'||q==='high'?q:(q==='auto'?'':get());
if(q==='low'||q==='high')save(q);else if(q==='auto')save('');
set(ini||(hint()?'low':''));
if(!ini)document.addEventListener('DOMContentLoaded',medir),document.readyState!=='loading'&&medir();
/* pestaña oculta → pausar animaciones CSS */
document.addEventListener('visibilitychange',()=>H.classList.toggle('tab-hidden',document.hidden));
})();
