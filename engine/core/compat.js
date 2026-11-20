/* engine/core — Compatibilidad con Safari / iPhone antiguos (y cualquier navegador al que le falte algo)
   Se carga PRIMERO. Todo se activa solo si el navegador no lo trae (detección de función, no por modelo de teléfono),
   así que en un navegador moderno no hace nada. Forzar para pruebas: ?compat=1 (no cambia nada visible en un navegador moderno).

   ⚠ Este archivo debe poder ejecutarse en el Safari más viejo: nada de lookbehind en regex, ni ?., ??, clases con #privados, etc.

   Qué cubre (lo que la auditoría encontró que falla o se ve distinto en iPhone):
   1) CSS  backdrop-filter / mask-image sin prefijo → Safari < 18 los ignora y los paneles de "cristal" pierden el desenfoque.
           Se reescriben los <style> (también los que el juego crea después) y los style="" añadiendo la versión -webkit-.
   2) Canvas  roundRect → no existe en iOS ≤ 15 (varios cuadros del HUD no se dibujaban).
   3) Canvas  filter   → Safari lo ignora: el destello de daño (brightness) no se veía. Se imita con un repintado aditivo.
              (No se define la propiedad 'filter' a propósito: el motor de efectos usa  'filter' in ctx  para saltarse el bloom
               cuando no hay filtros; si lo definiéramos, activaría un bloom sin desenfoque que se ve mal.)
   4) APIs modernas por si algún día se usan: Array.at, findLast, Object.hasOwn, structuredClone, randomUUID, toSorted,
      requestIdleCallback (Safari no la tiene), MediaQueryList.addEventListener (Safari < 14). */
(function(){
'use strict';
var Q=location.search||'';
var FORZAR=/[?&]compat=1/.test(Q);
var activos=[];
function nota(n){activos.push(n);}

/* ---------- 1) CSS con prefijo ---------- */
function soporta(prop,val){try{return !!(window.CSS&&CSS.supports&&CSS.supports(prop,val));}catch(e){return false;}}
var necesitaBackdrop=FORZAR||(!soporta('backdrop-filter','blur(1px)')&&soporta('-webkit-backdrop-filter','blur(1px)'));
var necesitaMask=FORZAR||(!soporta('mask-image','none')&&soporta('-webkit-mask-image','none'));
if(necesitaBackdrop)nota('css:backdrop-filter');
if(necesitaMask)nota('css:mask-image');

var RE_BD=/(^|[^-\w])backdrop-filter(\s*:\s*)([^;}"'\n]+)/g;
var RE_MK=/(^|[^-\w])mask-image(\s*:\s*)([^;}"'\n]+)/g;
function prefijar(css){
  if(necesitaBackdrop)css=css.replace(RE_BD,function(m,pre,sep,val){return pre+'-webkit-backdrop-filter'+sep+val+';backdrop-filter'+sep+val;});
  if(necesitaMask)css=css.replace(RE_MK,function(m,pre,sep,val){return pre+'-webkit-mask-image'+sep+val+';mask-image'+sep+val;});
  return css;
}
var hechos=typeof WeakMap==='function'?new WeakMap():null;
function arreglarStyle(el){
  try{
    var txt=el.textContent;
    if(!txt||(txt.indexOf('backdrop-filter')<0&&txt.indexOf('mask-image')<0))return;
    if(hechos&&hechos.get(el)===txt)return;                 // ya procesado (evita bucles con el observador)
    var nuevo=prefijar(txt);
    if(nuevo!==txt){el.textContent=nuevo;}
    if(hechos)hechos.set(el,el.textContent);
  }catch(e){}
}
function arreglarAtributos(raiz){
  try{
    var lista=(raiz.querySelectorAll?raiz.querySelectorAll('[style*="backdrop-filter"],[style*="mask-image"]'):[]);
    for(var i=0;i<lista.length;i++){
      var s=lista[i].getAttribute('style')||'';
      var n=prefijar(s);
      if(n!==s)lista[i].setAttribute('style',n);
    }
  }catch(e){}
}
function arreglarTodo(){
  var st=document.getElementsByTagName('style');
  for(var i=0;i<st.length;i++)arreglarStyle(st[i]);
  arreglarAtributos(document);
}
if(necesitaBackdrop||necesitaMask){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arreglarTodo);else arreglarTodo();
  /* los módulos del juego inyectan sus propios <style> más tarde: se vigilan */
  if(typeof MutationObserver==='function'){
    try{
      new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          var m=muts[i],t=m.target;
          if(m.type==='childList'){
            for(var j=0;j<m.addedNodes.length;j++){
              var n=m.addedNodes[j];
              if(n.nodeType!==1)continue;
              if(n.tagName==='STYLE')arreglarStyle(n);
              else if(n.querySelectorAll){var ss=n.querySelectorAll('style');for(var k=0;k<ss.length;k++)arreglarStyle(ss[k]);arreglarAtributos(n);}
            }
            if(t&&t.tagName==='STYLE')arreglarStyle(t);
          }else if(m.type==='characterData'){
            var p=t.parentNode;if(p&&p.tagName==='STYLE')arreglarStyle(p);
          }
        }
      }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    }catch(e){}
  }
}

/* ---------- 2) Canvas: roundRect ---------- */
function radios(r){
  function num(v){return (typeof v==='object'&&v!==null)?(+v.x||0):(+v||0);}
  var a;
  if(r===undefined)return [0,0,0,0];
  if(Object.prototype.toString.call(r)==='[object Array]'){
    a=[];for(var i=0;i<r.length;i++)a.push(num(r[i]));
    if(a.length===1)return [a[0],a[0],a[0],a[0]];
    if(a.length===2)return [a[0],a[1],a[0],a[1]];
    if(a.length===3)return [a[0],a[1],a[2],a[1]];
    return [a[0]||0,a[1]||0,a[2]||0,a[3]||0];
  }
  var n=num(r);return [n,n,n,n];
}
function roundRectPoly(x,y,w,h,r){
  var q=radios(r),tl=q[0],tr=q[1],br=q[2],bl=q[3],t;
  x=+x;y=+y;w=+w;h=+h;
  if(w<0){x+=w;w=-w;t=tl;tl=tr;tr=t;t=bl;bl=br;br=t;}
  if(h<0){y+=h;h=-h;t=tl;tl=bl;bl=t;t=tr;tr=br;br=t;}
  var s=Math.min(1,w/Math.max(tl+tr,1e-9),w/Math.max(bl+br,1e-9),h/Math.max(tl+bl,1e-9),h/Math.max(tr+br,1e-9));
  if(s<1){tl*=s;tr*=s;br*=s;bl*=s;}
  this.moveTo(x+tl,y);
  this.lineTo(x+w-tr,y);   if(tr)this.arcTo(x+w,y,x+w,y+tr,tr);
  this.lineTo(x+w,y+h-br); if(br)this.arcTo(x+w,y+h,x+w-br,y+h,br);
  this.lineTo(x+bl,y+h);   if(bl)this.arcTo(x,y+h,x,y+h-bl,bl);
  this.lineTo(x,y+tl);     if(tl)this.arcTo(x,y,x+tl,y,tl);
  this.closePath();
}
function instalarRoundRect(proto,nombre){
  try{if(proto&&typeof proto.roundRect!=='function'){proto.roundRect=roundRectPoly;nota('canvas:roundRect('+nombre+')');}}catch(e){}
}
instalarRoundRect(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'2d');
instalarRoundRect(window.Path2D&&Path2D.prototype,'Path2D');
instalarRoundRect(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'offscreen');

/* ---------- 3) Canvas: filter (solo el brillo) ---------- */
try{
  var P2=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(P2&&!('filter' in P2)&&!P2.__njFiltroImitado){
    var dibujar=P2.drawImage;
    P2.drawImage=function(){
      var f=this.filter;                                         // propiedad "suelta": Safari la acepta pero no hace nada
      if(f===undefined||f===''||f==='none')return dibujar.apply(this,arguments);
      var r=dibujar.apply(this,arguments);
      var m=/brightness\(\s*([0-9.]+)/.exec(String(f));
      if(m){
        var b=parseFloat(m[1]);
        if(b>1.05){
          var ga=this.globalAlpha,go=this.globalCompositeOperation;
          this.globalCompositeOperation='lighter';
          this.globalAlpha=ga*Math.min(0.85,(b-1)*0.7);
          dibujar.apply(this,arguments);
          this.globalAlpha=ga;this.globalCompositeOperation=go;
        }
      }
      return r;
    };
    P2.__njFiltroImitado=true;nota('canvas:filter(brillo)');
  }
}catch(e){}

/* ---------- 4) APIs modernas ---------- */
function def(obj,nombre,fn,etiqueta){
  try{if(obj&&typeof obj[nombre]!=='function'){Object.defineProperty(obj,nombre,{value:fn,writable:true,configurable:true});nota(etiqueta||nombre);}}catch(e){}
}
def(Array.prototype,'at',function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return this[i];},'Array.at');
def(String.prototype,'at',function(i){i=Math.trunc(i)||0;if(i<0)i+=this.length;return i<0||i>=this.length?undefined:this.charAt(i);},'String.at');
def(Array.prototype,'findLast',function(f,t){for(var i=this.length-1;i>=0;i--){if(f.call(t,this[i],i,this))return this[i];}return undefined;},'Array.findLast');
def(Array.prototype,'findLastIndex',function(f,t){for(var i=this.length-1;i>=0;i--){if(f.call(t,this[i],i,this))return i;}return -1;},'Array.findLastIndex');
def(Array.prototype,'toSorted',function(f){return this.slice().sort(f);},'Array.toSorted');
def(Array.prototype,'toReversed',function(){return this.slice().reverse();},'Array.toReversed');
def(Object,'hasOwn',function(o,k){return Object.prototype.hasOwnProperty.call(o,k);},'Object.hasOwn');
def(String.prototype,'replaceAll',function(a,b){
  if(a instanceof RegExp){if(!a.global)throw new TypeError('replaceAll must be called with a global RegExp');return this.replace(a,b);}
  return this.split(String(a)).join(b);   // (aproximación: sin patrones $ en el reemplazo)
},'String.replaceAll');
if(typeof window.structuredClone!=='function'){
  window.structuredClone=function(v){return v===undefined?v:JSON.parse(JSON.stringify(v));};nota('structuredClone(aprox)');
}
try{
  if(window.crypto&&typeof crypto.randomUUID!=='function'&&typeof crypto.getRandomValues==='function'){
    crypto.randomUUID=function(){
      var b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
      var h=[],i;for(i=0;i<16;i++)h.push((b[i]+256).toString(16).slice(1));
      return h.slice(0,4).join('')+'-'+h.slice(4,6).join('')+'-'+h.slice(6,8).join('')+'-'+h.slice(8,10).join('')+'-'+h.slice(10).join('');
    };nota('randomUUID');
  }
}catch(e){}
if(typeof window.requestIdleCallback!=='function'){
  window.requestIdleCallback=function(cb){var t0=Date.now();return setTimeout(function(){cb({didTimeout:false,timeRemaining:function(){return Math.max(0,50-(Date.now()-t0));}});},1);};
  window.cancelIdleCallback=function(id){clearTimeout(id);};nota('requestIdleCallback');
}
try{
  if(window.MediaQueryList&&typeof MediaQueryList.prototype.addEventListener!=='function'&&typeof MediaQueryList.prototype.addListener==='function'){
    MediaQueryList.prototype.addEventListener=function(t,f){if(t==='change')this.addListener(f);};
    MediaQueryList.prototype.removeEventListener=function(t,f){if(t==='change')this.removeListener(f);};
    nota('MediaQueryList.addEventListener');
  }
}catch(e){}

window.NinjaCompat={activos:activos,forzado:FORZAR,prefijar:prefijar,arreglarTodo:arreglarTodo};
})();
