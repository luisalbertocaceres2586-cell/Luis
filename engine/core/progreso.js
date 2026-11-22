/* engine/core — Proteger el progreso del jugador (iPhone y Android)
   PROBLEMA: Safari de iPhone borra todo lo que una página guardó (localStorage) si no se abre en 7 días, salvo que esté
   instalada en la pantalla de inicio. En Android el sistema también puede limpiar datos si falta espacio. Para un juego con
   perfiles, logros y avance eso sería perder todo.

   SOLUCIÓN:
   1) Se pide al navegador que marque los datos como "persistentes" (navigator.storage.persist()).
   2) "💾 Progreso": un CÓDIGO que se copia / comparte (WhatsApp, notas…) y se pega para recuperar el avance en este u otro teléfono.
      Lleva comprobación de integridad (si se copió cortado, avisa) y antes de recuperar se guarda una copia por si hubo error (↩ Deshacer).
   3) Botón en el menú principal (junto a Historia) y en el menú de pausa.

   Solo se guardan datos de progreso (ninja_*, mpl_*, n2_*). NO se guardan cosas propias del aparato: posición de botones,
   vibración, avisos, modo diagnóstico, volumen. */
(function(){
'use strict';
var INCLUIR=/^(ninja_|mpl_|n2_|n2cfg)/;
var EXCLUIR=/^(ninja_debug|ninja_ios_hint_v1|ninja_btn_pos_|ninja_ctl_cfg|ninja_haptics|ninja_abrir_mundos|ninja_prev_backup|ninja_fx_volume|ninja_mult_muted)/;
var PREV='ninja_prev_backup';
var LIMITE=2*1024*1024;

function ls(){try{return window.localStorage;}catch(e){return null;}}
function esProgreso(k){return INCLUIR.test(k)&&!EXCLUIR.test(k);}

/* ---------- 1) Almacenamiento persistente ---------- */
var estado={persistido:null,disponible:!!(navigator.storage&&navigator.storage.persist)};
function pedirPersistencia(){
  try{
    if(!estado.disponible)return;
    navigator.storage.persisted().then(function(ya){
      if(ya){estado.persistido=true;return;}
      return navigator.storage.persist().then(function(ok){estado.persistido=!!ok;});
    }).catch(function(){});
  }catch(e){}
}
['touchend','pointerup','click'].forEach(function(ev){
  document.addEventListener(ev,function once(){document.removeEventListener(ev,once,true);pedirPersistencia();},{capture:true,passive:true});
});

/* ---------- 2) Código de guardado ---------- */
function recolectar(){
  var s=ls(),d={},n=0;if(!s)return {d:d,n:0};
  for(var i=0;i<s.length;i++){var k=s.key(i);if(k&&esProgreso(k)){var v=s.getItem(k);if(typeof v==='string'){d[k]=v;n++;}}}
  return {d:d,n:n};
}
function hash(str){var h=0x811c9dc5;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0;}return ('00000000'+h.toString(16)).slice(-8);}
function aB64(bytes){var s='',CH=0x8000;for(var i=0;i<bytes.length;i+=CH)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+CH));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function deB64(t){t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';var s=atob(t),b=new Uint8Array(s.length);for(var i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
var puedeGzip=typeof CompressionStream==='function'&&typeof DecompressionStream==='function'&&typeof Response==='function';
function gz(bytes,comprimir){
  var T=comprimir?new CompressionStream('gzip'):new DecompressionStream('gzip');
  var w=T.writable.getWriter();w.write(bytes);w.close();
  return new Response(T.readable).arrayBuffer().then(function(b){return new Uint8Array(b);});
}
function exportar(){
  var r=recolectar();
  var json=JSON.stringify({v:1,t:Date.now(),d:r.d});
  var bytes=new TextEncoder().encode(json);
  var armar=function(pref,b){var p=aB64(b);return Promise.resolve({codigo:'NINJA-'+pref+'.'+p+'.'+hash(p),claves:r.n,bytes:json.length});};
  if(puedeGzip)return gz(bytes,true).then(function(c){return armar('2',c);},function(){return armar('1',bytes);});
  return armar('1',bytes);
}
function leer(codigo){
  var m=/^\s*NINJA-([12])\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})\s*$/.exec(String(codigo||'').replace(/\s+/g,''));
  if(!m)return Promise.reject(new Error('El código no tiene el formato correcto. Revisa que lo copiaste completo.'));
  if(hash(m[2])!==m[3])return Promise.reject(new Error('El código está incompleto o cambió al copiarlo. Cópialo otra vez completo.'));
  var bytes;try{bytes=deB64(m[2]);}catch(e){return Promise.reject(new Error('El código no se pudo leer.'));}
  var p=m[1]==='2'?(puedeGzip?gz(bytes,false):Promise.reject(new Error('Este código está comprimido y este teléfono es muy antiguo para leerlo. Genera el código en un teléfono más nuevo o usa otro.'))):Promise.resolve(bytes);
  return p.then(function(b){
    var o=JSON.parse(new TextDecoder().decode(b));
    if(!o||o.v!==1||!o.d||typeof o.d!=='object')throw new Error('El código no tiene datos de progreso.');
    var limpio={},n=0,tam=0;
    Object.keys(o.d).forEach(function(k){if(esProgreso(k)&&typeof o.d[k]==='string'){tam+=o.d[k].length;if(tam<=LIMITE){limpio[k]=o.d[k];n++;}}});
    if(!n)throw new Error('El código no trae progreso para recuperar.');
    return {d:limpio,n:n,t:o.t};
  });
}
function aplicar(info){
  var s=ls();if(!s)throw new Error('Este navegador no permite guardar datos.');
  return exportar().then(function(prev){
    try{s.setItem(PREV,prev.codigo);}catch(e){}                      // copia de seguridad antes de tocar nada
    Object.keys(info.d).forEach(function(k){s.setItem(k,info.d[k]);});
    return info.n;
  });
}
function deshacer(){
  var s=ls(),c=s&&s.getItem(PREV);if(!c)return Promise.reject(new Error('No hay copia anterior.'));
  return leer(c).then(function(info){Object.keys(info.d).forEach(function(k){s.setItem(k,info.d[k]);});s.removeItem(PREV);return info.n;});
}
function resumen(){
  var r=recolectar(),perfiles=0;
  try{var p=JSON.parse(r.d['ninja_perfiles_v1']||'null');if(Array.isArray(p))perfiles=p.length;else if(p&&typeof p==='object'){perfiles=Array.isArray(p.perfiles)?p.perfiles.length:(p.lista&&p.lista.length)||Object.keys(p).filter(function(k){return k!=='activo'&&k!=='v';}).length;}}catch(e){}
  return {claves:r.n,perfiles:perfiles};
}

/* ---------- 3) Interfaz ---------- */
var css=document.createElement('style');
css.textContent=
'#njProg{position:fixed;inset:0;z-index:19600;display:flex;align-items:center;justify-content:center;background:rgba(3,2,18,.86);'+
 'padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));font-family:Inter,-apple-system,system-ui,sans-serif;-webkit-user-select:none;user-select:none}'+
'#njProg .c{width:min(94vw,560px);max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;background:linear-gradient(170deg,#161a46,#0d1030);border:2px solid #f0a91e;border-radius:16px;padding:14px 16px 12px;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.6)}'+
'#njProg h2{margin:0 0 4px;font:800 18px/1.2 -apple-system,system-ui,sans-serif;color:#ffd36b}'+
'#njProg p{margin:4px 0 8px;font-size:13px;line-height:1.4;color:#d9d6f0}'+
'#njProg .sec{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14)}'+
'#njProg textarea{width:100%;box-sizing:border-box;height:64px;resize:none;border-radius:10px;border:1px solid #4b5aa8;background:#070a26;color:#cfe6ff;padding:8px;font:11px/1.3 ui-monospace,Menlo,monospace;-webkit-user-select:text;user-select:text}'+
'#njProg .fila{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}'+
'#njProg button{flex:1 1 140px;min-height:46px;border-radius:12px;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);color:#fff;font:800 14px/1.2 -apple-system,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;padding:8px 12px}'+
'#njProg button.pri{border-color:#ffe27a;background:linear-gradient(#ffe27a,#ffad58);color:#281532}'+
'#njProg button.cer{flex:0 0 auto;min-width:46px;position:sticky;float:right;margin:-4px -6px 0 0;padding:0 14px}'+
'#njProg .msg{min-height:18px;margin-top:6px;font-size:13px;font-weight:700}'+
'#njProg .ok{color:#7dff9a}#njProg .mal{color:#ff9a9a}'+
'#njProg small{display:block;color:#a9a6c8;font-size:11.5px;line-height:1.35;margin-top:6px}'+
'.m26-d.njProgBtn .m26-i{font-style:normal}'+
/* mismo aspecto que el botón de Sonido del dock premium (círculo oscuro con borde dorado), sin imagen nueva */
'html body #m26 .m26-dock .m26-d.njProgBtn .m26-i{width:42px;height:42px;font-size:20px;border-radius:50%;border:2px solid #ffb82f;box-sizing:border-box;background:radial-gradient(circle,#1a1450,#080d2c);box-shadow:0 3px 5px rgba(0,0,0,.45);filter:none}'+
'html body #m26 .m26-dock .m26-d.njProgBtn:hover .m26-i{transform:translateY(-2px) scale(1.1);filter:drop-shadow(0 5px 10px rgba(255,190,70,.5)) brightness(1.12)}'+
'@media (max-width:700px){html body #m26 .m26-dock{gap:6px}html body #m26 .m26-dock .m26-d.njProgBtn .m26-i{width:36px;height:36px;font-size:17px}}'+
/* con 7 botones, en teléfonos estrechos (iPhone SE 1.ª gen, 568 px) el dock se salía de la pantalla: se compacta un poco */
'@media (max-width:600px){html body #m26 .m26-dock{gap:2px}html body #m26 .m26-dock .m26-d .m26-i,html body #m26 .m26-dock .m26-d.njProgBtn .m26-i{width:34px;height:34px;font-size:15px}}';
(document.head||document.documentElement).appendChild(css);

var panel=null;
function cerrar(){if(panel){panel.remove();panel=null;}}
function copiar(txt,ta){
  function b(){try{ta.focus();ta.select();ta.setSelectionRange(0,999999);return document.execCommand('copy');}catch(e){return false;}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(txt).then(function(){return true;},function(){return b();});}catch(e){}
  return Promise.resolve(b());
}
function abrir(){
  if(panel)return;
  panel=document.createElement('div');panel.id='njProg';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Mi progreso');
  var res=resumen();
  var prevHay=false;try{prevHay=!!(ls()&&ls().getItem(PREV));}catch(e){}
  var protegido=estado.persistido===true?'✔ El navegador marcó tus datos como protegidos.':(estado.disponible?'El navegador aún no protege tus datos de forma permanente.':'');
  var iosSafari=/iP(hone|ad|od)/.test(navigator.userAgent||'')&&!(navigator.standalone===true);
  panel.innerHTML=
   '<div class="c"><button class="cer" type="button" aria-label="Cerrar">✕</button><h2>💾 Mi progreso</h2>'+
   '<p>Tu avance (perfiles, logros, repaso…) se guarda en <b>este teléfono</b>. '+(iosSafari?'En iPhone, Safari puede borrarlo si no abres el juego en 7 días.':'Si se limpian los datos del navegador, se pierde.')+' Guarda tu código para no perderlo.</p>'+
   '<div class="sec"><b>1 · Guardar</b> <span style="opacity:.8">('+res.claves+' datos'+(res.perfiles?' · '+res.perfiles+' perfil(es)':'')+')</span>'+
   '<textarea id="njProgOut" readonly placeholder="Generando código…"></textarea>'+
   '<div class="fila"><button class="pri" id="njProgCopy" type="button">📋 Copiar código</button><button id="njProgShare" type="button">📤 Compartir</button></div>'+
   '<div class="msg" id="njProgMsg1"></div></div>'+
   '<div class="sec"><b>2 · Recuperar</b><p style="margin:2px 0 0">Pega aquí un código guardado antes (de este u otro teléfono).</p>'+
   '<textarea id="njProgIn" placeholder="NINJA-2.…"></textarea>'+
   '<div class="fila"><button class="pri" id="njProgGo" type="button">⬇ Recuperar progreso</button>'+(prevHay?'<button id="njProgUndo" type="button">↩ Deshacer la última recuperación</button>':'')+'</div>'+
   '<div class="msg" id="njProgMsg2"></div></div>'+
   (protegido?'<small>'+protegido+'</small>':'')+
   (iosSafari?'<small>📲 Truco: “Compartir → Añadir a pantalla de inicio” protege el progreso del borrado automático de Safari.</small>':'')+
   '</div>';
  document.body.appendChild(panel);
  var $=function(id){return document.getElementById(id);};
  var out=$('njProgOut'),m1=$('njProgMsg1'),m2=$('njProgMsg2'),codigo='';
  function msg(el,t,ok){el.textContent=t;el.className='msg '+(ok?'ok':'mal');}
  panel.querySelector('.cer').addEventListener('click',cerrar);
  panel.addEventListener('click',function(e){if(e.target===panel)cerrar();});
  exportar().then(function(r){codigo=r.codigo;out.value=codigo;}).catch(function(e){msg(m1,'No se pudo generar el código.',false);});
  $('njProgCopy').addEventListener('click',function(){
    if(!codigo)return;copiar(codigo,out).then(function(ok){msg(m1,ok?'✔ Copiado. Pégalo en un mensaje o nota para guardarlo.':'No se pudo copiar solo: mantén pulsado el texto y elige Copiar.',ok);});
  });
  $('njProgShare').addEventListener('click',function(){
    if(!codigo)return;
    if(navigator.share){navigator.share({title:'Mi progreso · Ninja Multiplicación',text:codigo}).catch(function(){});}
    else copiar(codigo,out).then(function(ok){msg(m1,ok?'✔ Copiado (este navegador no tiene “Compartir”).':'Mantén pulsado el texto para copiarlo.',ok);});
  });
  $('njProgGo').addEventListener('click',function(){
    var txt=$('njProgIn').value;
    if(!txt.trim()){msg(m2,'Pega primero el código.',false);return;}
    leer(txt).then(function(info){
      var fecha='';try{fecha=new Date(info.t).toLocaleString();}catch(e){}
      if(!window.confirm('Se va a reemplazar el progreso de este teléfono por el del código ('+info.n+' datos'+(fecha?', guardado el '+fecha:'')+').\n\nTu progreso actual se guarda por si quieres deshacerlo.\n\n¿Continuar?'))return;
      return aplicar(info).then(function(){msg(m2,'✔ Listo. Reiniciando el juego…',true);setTimeout(function(){try{location.replace(location.pathname);}catch(e){location.reload();}},900);});
    }).catch(function(e){msg(m2,e.message||'No se pudo recuperar.',false);});
  });
  var u=$('njProgUndo');
  if(u)u.addEventListener('click',function(){
    if(!window.confirm('Volver al progreso que tenías justo antes de la última recuperación. ¿Continuar?'))return;
    deshacer().then(function(){msg(m2,'✔ Listo. Reiniciando el juego…',true);setTimeout(function(){location.replace(location.pathname);},900);}).catch(function(e){msg(m2,e.message,false);});
  });
}

/* botón en el dock del menú principal (mismo molde que los demás) */
function ponerEnDock(dock){
  if(!dock||dock.querySelector('.njProgBtn'))return;
  var b=document.createElement('button');b.type='button';b.className='m26-d njProgBtn';
  b.innerHTML='<i class="m26-i">💾</i><span class="m26-l">Progreso</span>';b.title='Guardar o recuperar mi progreso';b.setAttribute('aria-label','Guardar o recuperar mi progreso');
  b.addEventListener('click',abrir);dock.appendChild(b);
}
/* botón en el menú de pausa */
function ponerEnPausa(){
  var ov=document.getElementById('pauseOverlay');
  if(!ov||document.getElementById('njProgPausa'))return;
  var b=document.createElement('button');b.id='njProgPausa';b.type='button';b.textContent='💾 MI PROGRESO';
  b.style.cssText="margin-top:10px;background:linear-gradient(160deg,rgba(0,20,60,.9),rgba(0,10,42,.95));border:2px solid rgba(0,180,255,.5);border-radius:8px;padding:10px 16px;min-height:44px;color:#FFF;font-family:'Press Start 2P';font-size:clamp(9px,1.6vw,12px);cursor:pointer;touch-action:manipulation";
  b.addEventListener('click',function(e){e.stopPropagation();abrir();});
  var ref=document.getElementById('njHapBtn')||document.getElementById('btnMutePause');
  if(ref)ref.after(b);else ov.appendChild(b);
}
function vigilar(){
  var d=document.querySelector('.m26-dock');if(d)ponerEnDock(d);
  ponerEnPausa();
}
function iniciar(){
  vigilar();
  if(typeof MutationObserver==='function'){
    var pend=false;                                           // el juego toca el DOM muchas veces por segundo: se revisa como mucho 2 veces/s
    try{new MutationObserver(function(){if(pend)return;pend=true;setTimeout(function(){pend=false;vigilar();},500);}).observe(document.body,{childList:true,subtree:true});}catch(e){}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();

window.NinjaProgreso={abrir:abrir,cerrar:cerrar,exportar:exportar,leer:leer,aplicar:aplicar,deshacer:deshacer,resumen:resumen,estado:estado};
})();
