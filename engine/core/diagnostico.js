/* engine/core — Diagnóstico y arranque seguro
   Se carga lo primero de todo (antes de cualquier otro script) para poder ver los fallos de los demás.

   1) SIEMPRE (invisible): guarda los últimos errores en memoria.
   2) Si un archivo del juego NO carga (internet cortado, caché vieja de Safari…), o el juego entra en un bucle de errores,
      o la carga tarda demasiado → en vez de una pantalla en blanco sale un aviso claro con "Reintentar".
   3) Con  ?debug=1  se muestra el panel 🐞: errores, tamaño de pantalla, zona segura, FPS, versión y botón "Copiar informe"
      (para pegarlo en el chat y poder arreglar lo que falle en tu teléfono). Se recuerda en el teléfono. Apagar: ?debug=0 */
(function(){
'use strict';
var Q=location.search||'';
var KEY='ninja_debug',debug=false;
try{
  if(/[?&]debug=1/.test(Q))localStorage.setItem(KEY,'1');
  if(/[?&]debug=0/.test(Q))localStorage.removeItem(KEY);
  debug=localStorage.getItem(KEY)==='1';
}catch(e){debug=/[?&]debug=1/.test(Q);}

var errores=[],tiempos=[],avisoMostrado=false,silenciarHasta=0;
function hora(){var d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);}
function corto(s,n){s=String(s==null?'':s);return s.length>n?s.slice(0,n-1)+'…':s;}

function registrar(tipo,msg,donde){
  errores.push({h:hora(),tipo:tipo,msg:corto(msg,220),donde:corto(donde,120)});
  if(errores.length>80)errores.shift();
  if(tipo==='error'||tipo==='promesa'){
    var ahora=Date.now();tiempos.push(ahora);
    while(tiempos.length&&ahora-tiempos[0]>5000)tiempos.shift();
    if(tiempos.length>=30&&ahora>silenciarHasta)aviso('El juego tuvo un problema',
      'Se repitió un error muchas veces seguidas ('+corto(msg,90)+').','Seguir jugando',function(){silenciarHasta=Date.now()+60000;tiempos.length=0;});
  }
  pintarPildora();
}

window.addEventListener('error',function(e){
  var t=e.target;
  if(t&&t!==window&&t.tagName){                                   // un recurso no cargó (script, imagen, hoja de estilos)
    var url=t.src||t.href||'';
    /* fuentes de Google / hojas de estilo sin internet: se anotan como "aviso" y no cuentan como error */
    registrar((t.tagName==='LINK'||t.tagName==='STYLE')?'aviso':'recurso',t.tagName+' no cargó',url.split('?')[0].split('/').slice(-2).join('/'));
    if(t.tagName==='SCRIPT'&&url&&url.indexOf(location.origin)===0)
      aviso('No se pudo cargar una parte del juego','Falta o no llegó: '+url.split('?')[0].split('/').slice(-2).join('/')+'. Revisa tu internet y vuelve a intentar.','Cerrar');
    return;
  }
  registrar('error',e.message||'error',String(e.filename||'').split('/').pop()+':'+(e.lineno||0)+':'+(e.colno||0));
},true);
window.addEventListener('unhandledrejection',function(e){
  var r=e.reason;registrar('promesa',(r&&r.message)||r,'');
});
try{
  var ce=console.error;
  console.error=function(){try{registrar('console',Array.prototype.slice.call(arguments).join(' '),'');}catch(_){}return ce.apply(console,arguments);};
}catch(e){}

/* si la carga tarda demasiado */
setTimeout(function(){
  if(document.readyState!=='complete')aviso('La carga está tardando','Puede ser tu conexión. Puedes esperar un poco más o volver a intentar.','Esperar');
},30000);

/* ---------- Aviso con botón Reintentar ---------- */
function recargar(){
  try{
    var u=new URL(location.href);u.searchParams.set('r',String(Date.now()));location.replace(u.toString());
  }catch(e){location.reload();}
}
function aviso(titulo,detalle,textoCerrar,alCerrar){
  if(avisoMostrado)return;avisoMostrado=true;
  function montar(){
    var d=document.createElement('div');d.id='njAviso';d.setAttribute('role','alertdialog');
    d.style.cssText='position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:rgba(4,2,20,.92);font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;-webkit-user-select:none;user-select:none';
    var c=document.createElement('div');
    c.style.cssText='max-width:min(92vw,440px);max-height:92vh;overflow:auto;background:#12163a;border:2px solid #f0a91e;border-radius:16px;padding:18px 18px 14px;text-align:center;color:#fff;box-shadow:0 10px 40px rgba(0,0,0,.6)';
    var h=document.createElement('div');h.textContent='⚠️ '+titulo;h.style.cssText='font-weight:800;font-size:18px;color:#ffd36b;margin-bottom:8px';
    var p=document.createElement('div');p.textContent=detalle;p.style.cssText='font-size:14px;line-height:1.45;color:#dcd8f2;margin-bottom:14px';
    var fila=document.createElement('div');fila.style.cssText='display:flex;gap:10px;justify-content:center;flex-wrap:wrap';
    function boton(txt,primario,fn){
      var b=document.createElement('button');b.type='button';b.textContent=txt;
      b.style.cssText='min-height:46px;min-width:130px;padding:10px 18px;border-radius:12px;font:800 15px/1.2 -apple-system,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;'+
        (primario?'border:2px solid #ffe27a;background:linear-gradient(#ffe27a,#ffad58);color:#281532':'border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);color:#fff');
      b.addEventListener('click',fn);return b;
    }
    fila.appendChild(boton('↻ Reintentar',true,recargar));
    fila.appendChild(boton(textoCerrar||'Cerrar',false,function(){d.remove();avisoMostrado=false;if(alCerrar)alCerrar();}));
    c.appendChild(h);c.appendChild(p);c.appendChild(fila);d.appendChild(c);
    (document.body||document.documentElement).appendChild(d);
  }
  if(document.body)montar();else document.addEventListener('DOMContentLoaded',montar);
}

/* ---------- Panel de diagnóstico (?debug=1) ---------- */
var fps=0;
function medirFPS(){
  var n=0,t0=performance.now();
  (function bucle(t){n++;if(t-t0>=1000){fps=Math.round(n*1000/(t-t0));n=0;t0=t;}requestAnimationFrame(bucle);})(t0);
}
function zonaSegura(){
  try{
    var d=document.createElement('div');
    d.style.cssText='position:fixed;visibility:hidden;pointer-events:none;top:env(safe-area-inset-top);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left)';
    document.body.appendChild(d);var s=getComputedStyle(d);
    var r='arriba '+s.top+' · der '+s.right+' · abajo '+s.bottom+' · izq '+s.left;d.remove();return r;
  }catch(e){return '?';}
}
function version(){
  var ua=navigator.userAgent||'',m=/OS (\d+)[_.](\d+)/.exec(ua)||/Android (\d+(\.\d+)?)/.exec(ua)||/Version\/(\d+(\.\d+)?)/.exec(ua);
  return m?m[0]:'?';
}
function informe(){
  var vv=window.visualViewport,L=[];
  L.push('NINJA · INFORME');
  L.push('versión: '+(window.NJ_BUILD||'?'));
  L.push('sistema: '+version()+' | '+corto(navigator.userAgent,110));
  L.push('ventana: '+innerWidth+'×'+innerHeight+' | visualViewport: '+(vv?Math.round(vv.width)+'×'+Math.round(vv.height)+' esc '+vv.scale:'n/d')+' | pantalla: '+screen.width+'×'+screen.height+' | DPR '+devicePixelRatio);
  L.push('zona segura: '+zonaSegura());
  L.push('modo app (pantalla de inicio): '+((navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches))?'sí':'no')+' | orientación: '+(innerWidth>innerHeight?'horizontal':'vertical'));
  L.push('FPS: '+fps+' | táctil: '+(navigator.maxTouchPoints||0)+' puntos | vibración: '+(navigator.vibrate?'sí':'no')+' | wakeLock: '+(('wakeLock' in navigator)?'sí':'no'));
  L.push('compat activos: '+((window.NinjaCompat&&NinjaCompat.activos.length)?NinjaCompat.activos.join(', '):'ninguno (navegador moderno)'));
  L.push('clases <html>: '+document.documentElement.className);
  try{
    var rs=/** @type {PerformanceResourceTiming[]} */ (performance.getEntriesByType('resource')),tot=0,cach=0,n=0;
    rs.forEach(function(e){if(e.name.indexOf(location.origin)===0){n++;tot+=(e.encodedBodySize||0);if(e.transferSize===0&&(e.encodedBodySize||0)>0)cach++;}});
    L.push('carga: '+n+' archivos del juego · '+(tot/1048576).toFixed(1)+' MB · '+cach+' salieron de la caché sin descargar');
  }catch(e){}
  L.push('sin internet (service worker): '+((navigator.serviceWorker&&navigator.serviceWorker.controller)?'ACTIVO ✔':'inactivo')+(window.NinjaSWdatos?' · '+window.NinjaSWdatos:''));
  L.push('errores ('+contar()+'):');
  for(var i=Math.max(0,errores.length-25);i<errores.length;i++){var e=errores[i];L.push(' '+e.h+' ['+e.tipo+'] '+e.msg+(e.donde?'  @ '+e.donde:''));}
  if(!errores.length)L.push(' ninguno ✔');
  return L.join('\n');
}
var pildora=null,panel=null;
function datosSW(){
  try{
    if(!window.caches)return;
    Promise.all([caches.has('ninja-assets-v1').then(function(h){return h?caches.open('ninja-assets-v1').then(function(c){return c.keys();}):[];}),
                 (navigator.storage&&navigator.storage.estimate)?navigator.storage.estimate():Promise.resolve({})]).then(function(r){
      /** @type {{usage?: number, quota?: number}} */
      var q=r[1]||{};
      window.NinjaSWdatos=r[0].length+' archivos guardados'+(q.usage?(' · '+(q.usage/1048576).toFixed(0)+' MB usados de '+((q.quota||0)/1048576).toFixed(0)+' MB'):'');
    }).catch(function(){});
  }catch(e){}
}
function contar(){var n=0;for(var i=0;i<errores.length;i++)if(errores[i].tipo!=='aviso')n++;return n;}
function pintarPildora(){if(pildora)pildora.textContent='🐞 '+contar();}
function copiar(txt,ta){
  function plan_b(){try{ta.focus();ta.select();ta.setSelectionRange(0,999999);document.execCommand('copy');}catch(e){}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).catch(plan_b);return;}}catch(e){}
  plan_b();
}
function montarPanel(){
  pildora=document.createElement('button');pildora.type='button';pildora.id='njDbgPill';
  pildora.style.cssText='position:fixed;left:max(4px,env(safe-area-inset-left));top:50%;transform:translateY(-50%);z-index:2147483500;min-width:46px;min-height:46px;border-radius:23px;border:2px solid #7fd0ff;background:rgba(5,10,40,.82);color:#fff;font:700 13px/1 -apple-system,system-ui,sans-serif;padding:0 8px;touch-action:manipulation';
  pintarPildora();
  pildora.addEventListener('click',function(){
    if(panel){panel.remove();panel=null;return;}
    panel=document.createElement('div');panel.id='njDbgPanel';
    panel.style.cssText='position:fixed;left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483400;background:rgba(4,6,28,.96);border:2px solid #7fd0ff;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;color:#d8f1ff;-webkit-user-select:text;user-select:text';
    datosSW();
    var ta=document.createElement('textarea');ta.readOnly=true;ta.value=informe();
    setTimeout(function(){if(panel&&ta)ta.value=informe();},700);
    ta.style.cssText='flex:1;min-height:0;width:100%;box-sizing:border-box;background:#02041a;color:#bfe9ff;border:1px solid #3a5b8c;border-radius:8px;padding:8px;font:11px/1.35 ui-monospace,Menlo,monospace;resize:none;-webkit-user-select:text;user-select:text';
    var fila=document.createElement('div');fila.style.cssText='display:flex;gap:8px';
    function b(t,fn){var x=document.createElement('button');x.type='button';x.textContent=t;x.style.cssText='flex:1;min-height:44px;border-radius:10px;border:2px solid #7fd0ff;background:#10205a;color:#fff;font:700 14px/1 -apple-system,system-ui,sans-serif;touch-action:manipulation';x.addEventListener('click',fn);return x;}
    var okMsg=null;
    fila.appendChild(b('📋 Copiar informe',function(ev){ta.value=informe();copiar(ta.value,ta);ev.target.textContent='✔ Copiado';setTimeout(function(){ev.target.textContent='📋 Copiar informe';},1500);}));
    fila.appendChild(b('↻ Actualizar',function(){ta.value=informe();}));
    fila.appendChild(b('🗑 Limpiar',function(){errores.length=0;tiempos.length=0;pintarPildora();ta.value=informe();}));
    fila.appendChild(b('✕',function(){panel.remove();panel=null;}));
    fila.lastChild.style.flex='0 0 54px';
    panel.appendChild(ta);panel.appendChild(fila);document.body.appendChild(panel);
  });
  document.body.appendChild(pildora);
}
if(debug){
  medirFPS();
  if(document.body)montarPanel();else document.addEventListener('DOMContentLoaded',montarPanel);
}

window.NinjaDiag={errores:errores,informe:informe,aviso:aviso,registrar:registrar,activo:debug};
})();
