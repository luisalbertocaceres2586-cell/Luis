/* engine/core — Tamaño y transparencia de los botones táctiles
   Cada jugador tiene manos distintas (los niños, por ejemplo, necesitan botones más grandes o más pequeños).
   Se ajusta en el modo  ✥ MOVER  (que ya existía para cambiar de sitio los botones): aparecen dos deslizadores.
   No toca la lógica de los botones: solo CSS (propiedades scale / translate / opacity). Se recuerda en el teléfono.
   ↺ (restablecer) también devuelve tamaño y transparencia a lo normal. Solo en pantallas táctiles. */
(function(){
'use strict';
var UA=navigator.userAgent||'';
var tactil=/iP(hone|ad|od)|Android/i.test(UA)||(navigator.maxTouchPoints>1&&window.matchMedia&&matchMedia('(pointer:coarse)').matches)||/[?&]movil=1/.test(location.search);
if(!tactil||/[?&]movil=0/.test(location.search))return;

var KEY='ninja_ctl_cfg_v1';
var S={min:80,max:120,def:100},O={min:35,max:100,def:100};
var cfg={s:S.def,o:O.def};
try{var g=JSON.parse(localStorage.getItem(KEY)||'null');if(g){cfg.s=Math.max(S.min,Math.min(S.max,+g.s||S.def));cfg.o=Math.max(O.min,Math.min(O.max,+g.o||O.def));}}catch(e){}

var root=document.documentElement;
function aplicar(){
  root.style.setProperty('--ctl-s',String(cfg.s/100));
  root.style.setProperty('--ctl-o',String(cfg.o/100));
}
function guardar(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}
aplicar();

var css=document.createElement('style');
css.textContent=
/* scale/translate individuales: no pisan el transform propio de cada botón. El translate compensa para que el centro del botón
   no se mueva al cambiar de tamaño (el scale se aplica antes del translate(-50%,-50%) del botón) */
'html.movil #mctl .mbt{scale:var(--ctl-s,1);translate:calc((var(--ctl-s,1) - 1)*50%) calc((var(--ctl-s,1) - 1)*50%)}'+
/* los botones extra (.mbx) se centran de otra forma (sin transform): solo escala, sin compensación */
'html.movil #mctl .mbx{scale:var(--ctl-s,1)}'+
'html.movil #mctl{opacity:var(--ctl-o,1)}'+
'html.movil #mctl.edit{opacity:1}'+
'#mctl .njCfg{display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:max(64px,calc(env(safe-area-inset-bottom,0px) + 58px));z-index:6;pointer-events:auto;'+
 'flex-direction:column;gap:4px;width:min(54vw,340px);box-sizing:border-box;padding:7px 12px;border-radius:14px;background:rgba(8,14,44,.93);border:2px solid #f0a91e;'+
 'color:#fff;font:700 12px/1.2 Inter,-apple-system,system-ui,sans-serif;touch-action:manipulation;-webkit-user-select:none;user-select:none}'+
'#mctl.edit .njCfg{display:flex}'+
'#mctl .njCfg label{display:flex;align-items:center;gap:8px;min-height:34px}'+
'#mctl .njCfg label span{flex:0 0 74px}'+
'#mctl .njCfg input[type=range]{flex:1;min-width:0;height:30px;margin:0;touch-action:pan-x}'+
'#mctl .njCfg b{flex:0 0 38px;text-align:right;color:#ffd36b}';
(document.head||root).appendChild(css);

function montar(){
  var box=document.getElementById('mctl');
  if(!box||box.querySelector('.njCfg'))return;
  var p=document.createElement('div');p.className='njCfg';
  p.innerHTML=
   '<label><span>🔘 Tamaño</span><input type="range" id="njCtlS" min="'+S.min+'" max="'+S.max+'" step="5" aria-label="Tamaño de los botones"><b id="njCtlSv"></b></label>'+
   '<label><span>👻 Visible</span><input type="range" id="njCtlO" min="'+O.min+'" max="'+O.max+'" step="5" aria-label="Qué tan visibles son los botones"><b id="njCtlOv"></b></label>';
  box.appendChild(p);
  var rs=document.getElementById('njCtlS'),ro=document.getElementById('njCtlO'),vs=document.getElementById('njCtlSv'),vo=document.getElementById('njCtlOv');
  function pintar(){rs.value=cfg.s;ro.value=cfg.o;vs.textContent=cfg.s+'%';vo.textContent=cfg.o+'%';}
  pintar();
  rs.addEventListener('input',function(){cfg.s=+rs.value;vs.textContent=cfg.s+'%';aplicar();});
  ro.addEventListener('input',function(){cfg.o=+ro.value;vo.textContent=cfg.o+'%';aplicar();});
  ['change','pointerup','touchend'].forEach(function(ev){p.addEventListener(ev,guardar,{passive:true});});
  /* ↺ restablecer */
  var rb=document.getElementById('mbReset');
  if(rb)rb.addEventListener('click',function(){cfg.s=S.def;cfg.o=O.def;aplicar();guardar();pintar();});
  /* que los toques sobre el panel no lleguen a los botones ni al juego */
  ['pointerdown','touchstart'].forEach(function(ev){p.addEventListener(ev,function(e){e.stopPropagation();},{passive:true});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',montar);else montar();

window.NinjaControles={cfg:cfg,aplicar:aplicar,reset:function(){cfg.s=S.def;cfg.o=O.def;aplicar();guardar();}};
})();
