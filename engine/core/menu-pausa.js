/* engine/core — MENÚ DE PAUSA: ▶ Seguir · 💾 Guardar y salir · 🚪 Cerrar sesión
   Se carga en index.html (juego clásico + Nivel 1), nivel2.html y nivel3.html. No modifica los motores de los niveles: se conecta
   con lo que ya exponen (Nivel1._estado(), Nivel2._estado(), el panel de pausa del Nivel 3 y saveG() del juego clásico).

   QUÉ HAY (y qué NO): en este juego no existen cuentas en línea ni servidor. Una "sesión" es un PERFIL guardado en este teléfono
   o computador. "Cerrar sesión" deja que otra persona juegue (el avance de cada perfil NO se borra). Para llevar el avance a otro
   aparato existe el botón 💾 Progreso (código para copiar y pegar).

   GUARDADO AUTOMÁTICO
   · Juego clásico: se guarda al abrir la pausa, al irse a segundo plano (otra app, llamada, bloqueo) y al pulsar Guardar y salir.
   · Nivel 1 / 2 / 3: cada uno ya guarda sus cosas (perfil, checkpoints, monedas); "Guardar y salir" ejecuta su salida normal. */
(function(){
'use strict';
if(/[?&]pausa=0/.test(location.search))return;

var ruta=location.pathname||'';
var esN2=/nivel2\.html/.test(ruta),esN3=/nivel3\.html/.test(ruta),esIndex=!esN2&&!esN3&&!/nivel1\.html/.test(ruta);

/* ---------- limpieza: una bandera vieja no debe reabrir el selector si se cerró la sesión ---------- */
try{
  if(sessionStorage.getItem('ninja_abrir_mundos')==='1'){
    var dd=JSON.parse(localStorage.getItem('ninja_perfiles_v1')||'null');
    if(!dd||!dd.activo)sessionStorage.removeItem('ninja_abrir_mundos');
  }
}catch(e){}

function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function perfil(){try{return (window.Perfiles&&Perfiles.activo&&Perfiles.activo())||null;}catch(e){return null;}}
function nombre(){var p=perfil();return p&&p.nombre?p.nombre:'';}
function cerrarSesionDatos(){
  try{if(window.Perfiles&&Perfiles.cerrarSesion)Perfiles.cerrarSesion();}catch(e){}
  try{sessionStorage.removeItem('ninja_abrir_mundos');}catch(e){}
}
function aIndice(){try{location.replace('index.html');}catch(e){location.href='index.html';}}

/* ---------- estilos ---------- */
var css=document.createElement('style');
css.id='njMenuPausaCss';
css.textContent=
/* tarjeta de salida (reutilizada en la pausa clásica y en el panel de los niveles) */
'.njSalir{width:min(92vw,520px);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;align-items:stretch;font-family:Inter,-apple-system,system-ui,sans-serif;-webkit-user-select:none;user-select:none}'+
'.njSalir .qn{text-align:center;font-size:13px;color:#cfe3ff}.njSalir .qn b{color:#ffd36b}'+
'.njSalir .par{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
'.njSalir button{min-height:54px;padding:8px 10px;border-radius:12px;border:2px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;touch-action:manipulation;font-family:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.15}'+
'.njSalir button b{font-size:14px;font-weight:800}.njSalir button small{font-size:11px;font-weight:600;opacity:.85}'+
'.njSalir button[data-a=salir]{border-color:#ffe27a;background:linear-gradient(#ffe27a,#ffad58);color:#281532}'+
'.njSalir button[data-a=sesion]{border-color:rgba(255,140,140,.75);background:linear-gradient(#5a2438,#3a1428)}'+
'.njSalir button:active{transform:scale(.98)}.njSalir button[disabled]{opacity:.55;pointer-events:none}'+
'.njSalir .msg{min-height:20px;text-align:center;font-size:14px;font-weight:800}.njSalir .ok{color:#7dff9a}.njSalir .mal{color:#ffb0b0}'+
'.njSalir .uno{grid-template-columns:1fr}'+
/* pausa clásica: el menú va justo después de CONTINUAR y los ajustes (sonido, música, vibración…) debajo */
'#pauseOverlay .pause-title{order:0}#pauseOverlay .pause-sub{order:1}#pauseOverlay .njResume{order:2}#pauseOverlay .njSalir{order:3}'+
'#pauseOverlay>*:not(.pause-title):not(.pause-sub):not(.njResume):not(.njSalir){order:4}'+
'#pauseOverlay{overflow-y:auto;-webkit-overflow-scrolling:touch}'+
/* teléfono horizontal (pantalla baja): todo en 2 columnas para que NADA quede fuera de la pantalla */
'@media (max-height:520px) and (orientation:landscape){'+
 '#pauseOverlay.on{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));align-content:center;justify-items:stretch;gap:6px 12px;box-sizing:border-box;'+
   'padding:max(6px,env(safe-area-inset-top)) max(28px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(28px,env(safe-area-inset-left))}'+
 '#pauseOverlay>*{margin:0!important;min-width:0}'+
 '#pauseOverlay .pause-title,#pauseOverlay .pause-sub,#pauseOverlay .njResume,#pauseOverlay .njSalir{grid-column:1/-1;justify-self:center}'+
 '#pauseOverlay .pause-title{font-size:clamp(16px,3.6vw,22px)!important;line-height:1.1}'+
 '#pauseOverlay .pause-sub,#pauseOverlay>div:last-child{display:none!important}'+      // "TOCA CONTINUAR…" y "ESC = MENÚ": no aportan en pantalla táctil baja
 '#pauseOverlay .njSalir{gap:4px}#pauseOverlay .njSalir .qn{font-size:12px}#pauseOverlay .njSalir .msg{min-height:0;font-size:13px}'+
 '#pauseOverlay .njResume{min-height:44px;padding:8px 18px}'+
 '#pauseOverlay .njSalir{width:min(86vw,560px)}#pauseOverlay .njSalir button{min-height:46px}'+
 '#pauseOverlay>button,#pauseOverlay #fxVolumeControl{min-height:42px;justify-content:center}'+
'}'+
'@media (max-height:360px) and (orientation:landscape){#pauseOverlay.on{align-content:start!important}}'+
/* panel independiente (niveles 1 y 2) */
'#njSalida{position:fixed;inset:0;z-index:95000;display:flex;align-items:center;justify-content:center;background:rgba(4,2,20,.82);'+
 'padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}'+
'#njSalida .c{width:min(92vw,520px);max-height:100%;overflow:auto;box-sizing:border-box;background:linear-gradient(170deg,#161a46,#0d1030);border:2px solid #f0a91e;border-radius:16px;padding:14px 16px;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:10px;text-align:center}'+
'#njSalida h2{margin:0;font:800 20px/1.2 Inter,-apple-system,system-ui,sans-serif;color:#ffd36b;letter-spacing:.04em}'+
'#njSalida .aviso{font-size:12.5px;color:#cfe3ff;line-height:1.35}#njSalida .njSalir{width:100%}'+
'#njSalida .seg{min-height:52px;border-radius:12px;border:2px solid #7dff9a;background:linear-gradient(#1f9d4c,#0f6b33);color:#fff;font:800 15px/1.2 Inter,-apple-system,system-ui,sans-serif;cursor:pointer;touch-action:manipulation}'+
'#njSalida .seg:active{transform:scale(.98)}'+
'.njPausaBtn{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:6;width:46px;height:46px;border-radius:50%;border:2px solid #ffb82f;background:radial-gradient(circle,#1a1450,#080d2c);color:#fff;font-size:18px;line-height:1;cursor:pointer;touch-action:manipulation;box-shadow:0 3px 8px rgba(0,0,0,.5);padding:0}'+
'.njPausaBtn:active{transform:scale(.94)}';
(document.head||document.documentElement).appendChild(css);

/* ---------- acciones con confirmación visible ---------- */
function bloqueSalida(o){
  /* o: {sesion:bool, salirTxt, guardar(), salir(), cerrarSesion(), okMsg} → devuelve el elemento .njSalir */
  var w=document.createElement('div');w.className='njSalir';
  w.innerHTML=
    '<div class="qn"></div>'+
    '<div class="par">'+
      '<button type="button" data-a="salir"><b>💾 GUARDAR Y SALIR</b><small>'+esc(o.salirTxt||'Vuelve a elegir mundo')+'</small></button>'+
      '<button type="button" data-a="sesion"><b>🚪 CERRAR SESIÓN</b><small>Para que juegue otra persona</small></button>'+
    '</div><div class="msg" aria-live="polite"></div>';
  /* el jugador se elige DESPUÉS de cargar la página: cada vez que se muestra se decide si hay sesión que cerrar */
  w._ref=function(extra){
    var q=nombre(),qn=w.querySelector('.qn'),bs=w.querySelector('button[data-a=sesion]'),par=w.querySelector('.par');
    qn.innerHTML=q?'Jugando como <b>'+esc(q)+'</b>'+(extra||''):'';qn.style.display=q?'':'none';
    bs.style.display=q?'':'none';par.className='par'+(q?'':' uno');
    w.querySelector('button[data-a=salir] small').textContent=q?(o.salirTxt||'Vuelve a elegir mundo'):(o.salirSinPerfil||'Vuelve al menú');
  };
  w._ref();
  var msg=w.querySelector('.msg'),ocupado=false;
  function dec(t,ok){msg.textContent=t;msg.className='msg '+(ok?'ok':'mal');}
  w.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('button[data-a]'):null;if(!b||ocupado)return;
    e.stopPropagation();
    var a=b.getAttribute('data-a');ocupado=true;
    [].forEach.call(w.querySelectorAll('button'),function(x){x.disabled=true;});
    dec('💾 Guardando tu avance…',true);
    setTimeout(function(){
      var ok=true;try{if(o.guardar)o.guardar();}catch(err){ok=false;}
      dec(ok?(o.okMsg||'✔ ¡Progreso guardado!'):'⚠ No se pudo guardar del todo, pero tu perfil sigue a salvo.',ok);
      setTimeout(function(){
        try{
          if(a==='sesion'){cerrarSesionDatos();if(o.cerrarSesion)o.cerrarSesion();}
          else if(o.salir)o.salir();
        }catch(err){}
        ocupado=false;[].forEach.call(w.querySelectorAll('button'),function(x){x.disabled=false;});dec('',true);
      },750);
    },250);
  });
  return w;
}

/* =====================================================================================
   1) JUEGO CLÁSICO (index.html): botones dentro de #pauseOverlay + guardado automático
   ===================================================================================== */
function clasicoDetener(){
  /* misma secuencia que la tecla ESC del juego */
  try{
    if(typeof _paused!=='undefined'&&_paused&&typeof togglePause==='function')togglePause();
    if(typeof bgStop==='function')bgStop();
    if(typeof stopTimer==='function')stopTimer();
    if(typeof closeQ==='function')closeQ();
    GS.running=false;
    if(typeof RAF!=='undefined'&&RAF){cancelAnimationFrame(RAF);RAF=null;}
    if(typeof showS==='function')showS(0);
  }catch(e){}
}
function clasicoGuardar(){try{if(typeof saveG==='function'&&typeof GS!=='undefined'&&GS&&GS.running)saveG();}catch(e){}}
function montarClasico(){
  var ov=$('pauseOverlay');if(!ov||ov.querySelector('.njSalir'))return;
  var b=bloqueSalida({
    salirTxt:'Vuelve a elegir mundo',salirSinPerfil:'Vuelve al menú',
    okMsg:'✔ ¡Progreso guardado!',
    guardar:function(){try{if(typeof saveG==='function')saveG();}catch(e){throw e;}},
    salir:function(){
      clasicoDetener();
      var p=perfil();
      if(p&&window.PerfilUI&&PerfilUI.abrirMundos)setTimeout(function(){PerfilUI.abrirMundos(p);},60);
    },
    cerrarSesion:function(){clasicoDetener();setTimeout(aIndice,60);}   // arranque limpio: JUGAR vuelve a pedir "¿Quién juega?"
  });
  var ref=ov.querySelector('.njResume')||ov.querySelector('.pause-sub');
  if(ref&&ref.after)ref.after(b);else ov.appendChild(b);
  /* al abrir la pausa: se guarda solo y se refresca "Jugando como …" */
  if(typeof MutationObserver==='function'){
    var antes=false;
    new MutationObserver(function(){
      var on=ov.classList.contains('on');
      if(on&&!antes){
        clasicoGuardar();
        b._ref(' · 💾 guardado');
      }
      antes=on;
    }).observe(ov,{attributes:true,attributeFilter:['class']});
  }
}
if(esIndex){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montarClasico);else montarClasico();
  /* guardado al salir de la app (llamada, otra app, bloqueo de pantalla) */
  document.addEventListener('visibilitychange',function(){if(document.hidden)clasicoGuardar();});
  window.addEventListener('pagehide',clasicoGuardar);
}

/* =====================================================================================
   2) PANEL para Nivel 1 y Nivel 2 (su pausa se dibuja en el canvas y no tiene botones)
   ===================================================================================== */
var panel=null,panelDe='';
function cerrarPanel(){if(panel){panel.remove();panel=null;panelDe='';}}
function abrirPanel(de,o){
  if(panel)return;
  panelDe=de;
  var d=document.createElement('div');d.id='njSalida';d.setAttribute('role','dialog');d.setAttribute('aria-label','Menú de pausa');
  var c=document.createElement('div');c.className='c';
  c.innerHTML='<h2>⏸ PAUSA</h2><div class="aviso">'+esc(o.aviso||'💾 Tu avance se guarda solo.')+'</div>'+
    '<button type="button" class="seg">▶ SEGUIR JUGANDO</button>';
  c.appendChild(bloqueSalida(o));
  d.appendChild(c);document.body.appendChild(d);panel=d;
  c.querySelector('.seg').addEventListener('click',function(){cerrarPanel();if(o.seguir)o.seguir();});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'){cerrarPanel();if(o.seguir)o.seguir();}});
}

/* ---- Nivel 1 (dentro de index.html) ---- */
function n1(){return (window.Nivel1&&Nivel1._estado&&Nivel1._estado())||null;}
function montarN1(s){
  var root=$('n1Root');if(!root||root.querySelector('.njPausaBtn')||!s||!s.movil)return;
  var b=document.createElement('button');b.type='button';b.className='njPausaBtn';b.textContent='⏸';b.setAttribute('aria-label','Pausa');
  ['pointerdown','touchstart'].forEach(function(ev){b.addEventListener(ev,function(e){e.stopPropagation();},{passive:true});});
  b.addEventListener('click',function(e){e.stopPropagation();var st=n1();if(st&&!st.fin&&!st.eligiendo)st.pausa=true;});
  root.appendChild(b);
}
function opcionesN1(){
  return {
    aviso:'💾 Tu perfil y tu avance quedan guardados. Al volver, el nivel empieza de nuevo.',
    salirTxt:'Vuelve a elegir mundo',okMsg:'✔ Tu perfil está guardado',
    seguir:function(){var s=n1();if(s)s.pausa=false;},
    guardar:function(){},                                               // el Nivel 1 registra sus hechos en el perfil al jugar
    salir:function(){try{if(window.Nivel1)Nivel1.cerrar();}catch(e){}},  // su salida normal → vuelve al selector de mundos
    cerrarSesion:function(){try{if(window.Nivel1)Nivel1.cerrar(true);}catch(e){}setTimeout(aIndice,60);}
  };
}

/* ---- Nivel 2 (nivel2.html) ---- */
function n2(){return (window.Nivel2&&Nivel2._estado&&Nivel2._estado())||null;}
function clicSalirN2(){
  var bs=document.querySelectorAll('button');
  for(var i=bs.length-1;i>=0;i--)if((bs[i].textContent||'').trim()==='✕'){bs[i].click();return true;}
  return false;
}
function opcionesN2(){
  return {
    aviso:'💾 Se guarda en cada bandera. Si sales, vuelves a tu última bandera.',
    salirTxt:'Vuelve a elegir mundo',okMsg:'✔ Guardado hasta tu última bandera',
    seguir:function(){var s=n2();if(s)s.pausa=false;},
    guardar:function(){},                                               // los checkpoints del Nivel 2 se guardan solos al cruzar cada bandera
    salir:function(){clicSalirN2();},
    cerrarSesion:function(){clicSalirN2();}                             // su salida normal; la sesión ya quedó cerrada (cerrarSesionDatos) y index.html limpia la bandera
  };
}

/* ---- vigilante: abre/cierra el panel según el estado de pausa de cada nivel ---- */
setInterval(function(){
  try{
    if(esIndex){
      var s=n1();
      if(s){montarN1(s);
        if(s.pausa&&!s.fin&&!panel)abrirPanel('n1',opcionesN1());
        else if(!s.pausa&&panel&&panelDe==='n1')cerrarPanel();
      }else if(panel&&panelDe==='n1')cerrarPanel();
    }else if(esN2){
      var t=n2();
      if(t&&t.est==='play'){
        if(t.pausa&&!panel)abrirPanel('n2',opcionesN2());
        else if(!t.pausa&&panel&&panelDe==='n2')cerrarPanel();
      }else if(panel&&panelDe==='n2')cerrarPanel();
    }
  }catch(e){}
},150);

/* =====================================================================================
   3) NIVEL 3 (nivel3.html): su pausa ya es HTML con SEGUIR / SALIR → se añade Cerrar sesión
   ===================================================================================== */
if(esN3){
  setInterval(function(){
    try{
      var sal=$('sal');if(!sal||$('njSes'))return;
      sal.innerHTML='💾 GUARDAR Y SALIR';                                // su SALIR ya guardaba las monedas y el avance
      if(!nombre())return;
      var b=document.createElement('button');b.type='button';b.id='njSes';b.className=sal.className;b.innerHTML='🚪 CERRAR SESIÓN';
      b.addEventListener('click',function(){cerrarSesionDatos();sal.click();});   // guarda (su salir) y deja la sesión cerrada
      sal.after(b);
    }catch(e){}
  },200);
}

window.NinjaPausa={abrirPanel:abrirPanel,cerrarPanel:cerrarPanel,bloqueSalida:bloqueSalida,cerrarSesionDatos:cerrarSesionDatos};
})();
