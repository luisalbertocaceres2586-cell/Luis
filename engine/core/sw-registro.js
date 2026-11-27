/* engine/core — Registra sw.js (juego sin internet y apertura rápida). Ver las reglas en /sw.js.
   · Se registra DESPUÉS de que la página terminó de cargar, para no competir con la descarga inicial.
   · Solo en https (o localhost): es lo único que permiten los navegadores.
   · Interruptor de emergencia:  ?sw=0  → lo desactiva y borra lo guardado en este teléfono.   ?sw=1  → lo vuelve a activar. */
(function(){
'use strict';
if(!('serviceWorker' in navigator))return;
var Q=location.search||'',K='ninja_sw_off';
try{
  if(/[?&]sw=0/.test(Q))localStorage.setItem(K,'1');
  if(/[?&]sw=1/.test(Q))localStorage.removeItem(K);
}catch(e){}
var apagado=false;try{apagado=localStorage.getItem(K)==='1';}catch(e){}

function limpiar(){
  try{navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}catch(e){}
  try{if(window.caches)caches.keys().then(function(ks){ks.forEach(function(k){if(k.indexOf('ninja-')===0)caches.delete(k);});});}catch(e){}
}
if(apagado){limpiar();setTimeout(limpiar,3000);return;}      // 2.ª pasada: el SW viejo aún puede atender esta misma carga

var seguro=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
if(!seguro)return;

/* El SW se registra cuando la página ya terminó de cargar, así que lo que ya se descargó en esta visita no pasó por él.
   Para no obligar a abrir el juego dos veces, se le pide guardar esos mismos archivos SI el navegador aún los tiene en su caché
   (nunca se descarga nada de nuevo para esto). En grupos pequeños y como máximo cada 6 horas. */
function calentar(){
  try{
    var KW='ninja_sw_warm';
    if((Date.now()-(+localStorage.getItem(KW)||0))<6*3600*1000)return;
    if(navigator.connection&&navigator.connection.saveData)return;          // ahorro de datos activado: no se hace nada extra
    var vistos={},lista=[];
    performance.getEntriesByType('resource').forEach(function(e){
      try{
        var u=new URL(e.name);
        if(u.origin!==location.origin||/(version\.json|sw\.js)$/.test(u.pathname)||vistos[u.href])return;
        vistos[u.href]=1;lista.push(u.href);
      }catch(_){}
    });
    /* grupo de 8 descargas a la vez (cada una toma la siguiente al terminar: no espera al archivo más lento) */
    var i=0,vivos=0,total=lista.length;
    function tomar(){
      if(i>=total){
        if(vivos===0){try{localStorage.setItem(KW,String(Date.now()));}catch(_){}}
        return;
      }
      var u=lista[i++];vivos++;
      /* 'only-if-cached': solo toma lo que YA está en la caché del navegador y NUNCA va a la red → no gasta ni un dato.
         (Lo que no esté ahí se guarda solo la próxima vez que el juego lo pida.) */
      fetch(u,{cache:'only-if-cached',mode:'same-origin'}).then(function(r){return r.ok?r.blob():null;}).catch(function(){}).then(function(){vivos--;setTimeout(tomar,8);});
    }
    for(var k=0;k<8;k++)tomar();
  }catch(e){}
}

/* PRECARGA PARA JUGAR SIN INTERNET (opcional, son decenas de MB → solo si el jugador la pide):
     abrir el juego con  ?offline=1   (se recuerda en este teléfono),   ?offline=0  lo olvida.
   Una vez pedida, se mantiene al día sola en visitas siguientes, pero NUNCA con datos móviles ni con ahorro de datos.
   El SW baja solo lo que falta (ver precargar() en /sw.js). */
var KO='ninja_sw_offline',KV='ninja_sw_offline_v';
try{
  if(/[?&]offline=1/.test(Q))localStorage.setItem(KO,'1');
  if(/[?&]offline=0/.test(Q)){localStorage.removeItem(KO);localStorage.removeItem(KV);}
}catch(e){}
function aviso(txt){
  try{
    var d=document.createElement('div');
    d.textContent=txt;
    d.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;background:rgba(6,3,26,.92);color:#fff;font:600 13px system-ui,sans-serif;padding:8px 14px;border:1px solid #ffd54a;border-radius:10px;pointer-events:none;max-width:90vw;text-align:center';
    document.body.appendChild(d);setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},4000);
  }catch(e){}
}
function precargar(forzar){
  try{
    var c=navigator.connection||{};
    if(!forzar&&(c.saveData||c.type==='cellular'))return;
    navigator.serviceWorker.ready.then(function(reg){
      var w=reg.active||navigator.serviceWorker.controller;
      if(w)w.postMessage({tipo:'precargar'});
    });
  }catch(e){}
}
var pedida=false;try{pedida=localStorage.getItem(KO)==='1';}catch(e){}
navigator.serviceWorker.addEventListener('message',function(ev){
  var d=ev.data;if(!d||d.tipo!=='precarga')return;
  window.NinjaSW=window.NinjaSW||{};window.NinjaSW.precarga=d;
  try{window.dispatchEvent(new CustomEvent('ninja-precarga',{detail:d}));}catch(e){}
  if(d.estado==='listo'){try{localStorage.setItem(KV,d.v||'');}catch(e){}if(/[?&]offline=1/.test(Q))aviso('✅ Listo: el juego ya funciona sin internet');}
  else if(d.estado==='sin-espacio')aviso('⚠️ No hay espacio en el teléfono para el modo sin internet');
  else if(d.estado==='incompleto')aviso('⚠️ Faltaron algunos archivos; se completarán la próxima vez');
});
/* ¿hay que (re)precargar? → si la pidió y la lista cambió desde la última vez que quedó lista */
function revisarPrecarga(){
  if(!pedida)return;
  var explicita=/[?&]offline=1/.test(Q);
  fetch('precache.json',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(j){
    var v='';try{v=localStorage.getItem(KV)||'';}catch(e){}
    if(explicita||v!==j.v)precargar(explicita);
  }).catch(function(){});
}

function registrar(){
  navigator.serviceWorker.register('sw.js').then(function(reg){
    window.NinjaSW={registro:reg,limpiar:limpiar,calentar:calentar,precargar:function(){precargar(true);}};
    return navigator.serviceWorker.ready;
  }).then(function(){
    setTimeout(calentar,1500);
    setTimeout(revisarPrecarga,4000);
  }).catch(function(){});
}
if(document.readyState==='complete')setTimeout(registrar,2500);
else window.addEventListener('load',function(){setTimeout(registrar,2500);});
})();
