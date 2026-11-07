/* engine/ui — Pantalla del teléfono: horizontal, completa y con más espacio vertical
   1) Si el teléfono está en vertical: aviso grande "GIRA TU TELÉFONO" y el juego espera.
   2) Al primer toque: pantalla completa + bloqueo horizontal (Android/Chrome). En iPhone no existe esa función del navegador:
      se muestra el consejo de "Añadir a pantalla de inicio" (con el manifest.json el juego se abre a pantalla completa).
   3) ZOOM DE TELÉFONO: en pantallas bajas (≈360–430 px de alto) el mundo se dibuja en un lienzo virtual más grande
      (≈500 px de alto), así el héroe ocupa menos pantalla, hay más cielo para saltar y más mundo a los lados.
      Los efectos hechos con elementos de la página (partículas, ondas, textos) se corrigen para que sigan en su sitio.
   4) El marco de información de arriba se encoge mientras llega el diseño nuevo. */
(function(){
if(!window.NinjaMods)return;
const touch=('ontouchstart' in window)||navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches;
const OBJ_ALTO=500;                                        // alto virtual deseado (px del lienzo)
NinjaMods.register({id:'pantalla-movil',carpeta:'ui',nombre:'Pantalla de teléfono (horizontal + más espacio)',
 desc:'Aviso para girar el teléfono, pantalla completa al tocar, zoom para tener más espacio vertical y HUD compacto.',
 init(){
  /* ---------- ZOOM ---------- */
  function k(){const h=innerHeight;return(touch&&h<560&&!/[?&]zoom=0/.test(location.search))?Math.max(1,Math.min(1.4,OBJ_ALTO/h)):1;}
  window.NJ_ZOOM=k();
  function aplicar(){
    const z=k();window.NJ_ZOOM=z;
    W=CV.width=Math.round(innerWidth*z);H=CV.height=Math.round(innerHeight*z);
    CV.style.width=innerWidth+'px';CV.style.height=innerHeight+'px';
    CV.style.imageRendering=z>1?'auto':'pixelated';
    try{if(GS&&GS.running)layoutLevel();}catch(e){}
  }
  window.resizeCanvas=aplicar;                               // las llamadas por nombre (iniciar nivel, pantalla completa…) usan esta
  window.addEventListener('resize',()=>setTimeout(aplicar,0));
  window.addEventListener('orientationchange',()=>setTimeout(aplicar,300));
  aplicar();
  /* efectos que usan elementos de la página con coordenadas del lienzo → dividir por el zoom */
  ['spawnPfx','spawnTfx','spawnLeafBurst'].forEach(n=>{const o=window[n];if(typeof o!=='function')return;
    window[n]=function(x,y){const z=window.NJ_ZOOM||1,a=[].slice.call(arguments);a[0]=x/z;a[1]=y/z;return o.apply(this,a);};});
  {const o=window.spawnShockwave;if(typeof o==='function')window.spawnShockwave=function(x,y,c,s){const z=window.NJ_ZOOM||1;return o.call(this,x/z,y/z,c,(s||70)/z);};}

  /* ---------- HUD compacto (interino) ---------- */
  const css=document.createElement('style');css.textContent=`
  @media (max-height:520px){
    #hud{width:min(50vw,400px)!important;top:max(2px,env(safe-area-inset-top))!important}
    #tring{top:44px!important}
  }
  #rotarAviso{position:fixed;inset:0;z-index:20000;display:none;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center;padding:24px;
    background:radial-gradient(ellipse at 50% 40%,#2a0f5e 0%,#0b0426 60%,#04010f 100%);font-family:'Press Start 2P',monospace;color:#fff}
  #rotarAviso.on{display:flex}
  #rotarAviso .ra-tel{width:78px;height:132px;border:6px solid #FFE08A;border-radius:16px;position:relative;box-shadow:0 0 28px rgba(255,200,80,.6),inset 0 0 18px rgba(120,80,255,.5);
    background:linear-gradient(160deg,#35208f,#120a3a);animation:raGira 2.6s ease-in-out infinite}
  #rotarAviso .ra-tel::before{content:'';position:absolute;left:50%;top:7px;width:22px;height:4px;border-radius:2px;background:#FFE08A;transform:translateX(-50%)}
  #rotarAviso .ra-tel::after{content:'🥷';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px}
  @keyframes raGira{0%,18%{transform:rotate(0)}55%,82%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
  #rotarAviso .ra-flecha{font-size:34px;animation:raFl 1.3s ease-in-out infinite;color:#FFE08A}
  @keyframes raFl{0%,100%{transform:translateX(0) rotate(0)}50%{transform:translateX(10px) rotate(8deg)}}
  #rotarAviso h2{font-size:clamp(13px,4.6vw,22px);color:#FFD54A;text-shadow:0 0 14px #FF9A00,3px 3px 0 #000;margin:0;line-height:1.5}
  #rotarAviso p{font-size:clamp(7px,2.4vw,11px);color:#DCE3FF;line-height:1.9;margin:0;max-width:340px}
  #rotarAviso .ra-ios{font-size:clamp(6px,2vw,9px);color:#9fb0ff;display:none}
  `;document.head.appendChild(css);

  /* ---------- AVISO "GIRA EL TELÉFONO" ---------- */
  const av=document.createElement('div');av.id='rotarAviso';
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  av.innerHTML='<div style="display:flex;align-items:center;gap:18px"><div class="ra-tel"></div><div class="ra-flecha">⟳</div></div><h2>GIRA TU TELÉFONO</h2><p>Ninja Multiplicación se juega en horizontal para que tengas más espacio y mejores botones.</p>'+
    (ios?'<p class="ra-ios" style="display:block">En iPhone: toca Compartir ⬆ y “Añadir a pantalla de inicio” para jugar a pantalla completa.</p>':'');
  document.body.appendChild(av);
  function vigilar(){
    const vertical=touch&&innerHeight>innerWidth&&innerWidth<900;
    av.classList.toggle('on',vertical);
    NinjaMods.pausaMundo=vertical;
  }
  vigilar();window.addEventListener('resize',vigilar);window.addEventListener('orientationchange',()=>setTimeout(vigilar,250));
  try{matchMedia('(orientation:portrait)').addEventListener('change',vigilar);}catch(e){}

  /* ---------- PANTALLA COMPLETA + BLOQUEO HORIZONTAL (primer toque) ---------- */
  if(touch){
    let hecho=false;
    const intentar=()=>{
      if(hecho)return;hecho=true;
      const el=document.documentElement,rf=el.requestFullscreen||el.webkitRequestFullscreen;
      const lock=()=>{try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(()=>{});}catch(e){}};
      if(rf&&!document.fullscreenElement){try{const p=rf.call(el,{navigationUI:'hide'});if(p&&p.then)p.then(lock).catch(lock);else lock();}catch(e){lock();}}
      else lock();
      setTimeout(aplicar,350);
    };
    window.addEventListener('pointerdown',intentar,{once:true,capture:true});
    window.addEventListener('keydown',intentar,{once:true,capture:true});
    document.addEventListener('fullscreenchange',()=>setTimeout(()=>{aplicar();vigilar();},200));
  }
 }});
})();
