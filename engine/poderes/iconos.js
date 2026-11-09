/* engine/poderes — Iconos nuevos de los poderes (assets/ui/poderes/*.png, 256×256 con transparencia)
   Reemplaza el arte viejo de POWER_ICONS por las ilustraciones nuevas. Si un PNG falta o no carga, el juego sigue usando
   el icono anterior de ese poder (así se puede ir entregando por tandas). Se muestran en:
     · los objetos que caen del cielo,  · el selector "ELIGE TU PODER",  · la barra de poderes activos de arriba.
   Para agregar un icono nuevo: copia su PNG a assets/ui/poderes/ y añade la clave a LISTA. */
(function(){
if(!window.NinjaMods)return;
const LISTA=['life','star','speed','shield','magnet','giant','gun','dualshot','clone','rocket','bounce','meteor',
  'timefreeze','timewarp','freeze','mirror','ghost','phantom','lightning_storm','rainbowstorm','berserker','aura','crown','dash',
  'superjump','superjump3x','float','gravity','turbo'];
const BASE='assets/ui/poderes/';
const listo={};                                   // clave -> Image cargada
NinjaMods.register({id:'iconos-poderes',carpeta:'poderes',nombre:'Iconos nuevos de los poderes',
 desc:'Ilustraciones nuevas para los poderes que caen del cielo, el selector de poder y la barra de poderes activos.',
 init(){
  LISTA.forEach(k=>{
    const im=new Image();
    im.onload=()=>{listo[k]=im;try{if(typeof POWER_ICONS!=='undefined')POWER_ICONS[k]=im;}catch(e){}};
    im.src=BASE+k+'.png';
  });
  const src=k=>listo[k]?BASE+k+'.png':null;
  const iconoHTML=(k,px)=>'<img src="'+BASE+k+'.png" alt="" draggable="false" style="width:'+px+'px;height:'+px+'px;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))">';

  /* ---- selector "ELIGE TU PODER": el emoji se cambia por el icono ---- */
  const SEGUROS={'+1 VIDA EXTRA':'life','ESCUDO PROTECTOR 5s':'shield','IMÁN DE MONEDAS 15s':'magnet','INVENCIBLE 6s':'star'};
  function descATipo(){
    const m=Object.assign({},SEGUROS);
    try{Object.values(THEMED_POWERS).forEach(l=>l.forEach(t=>{m[t.desc]=t.type;}));}catch(e){}
    return m;
  }
  NinjaMods.after('showPowerChooser',function(){
    const m=descATipo();
    document.querySelectorAll('#pcGrid .pc-btn').forEach(b=>{
      const d=b.querySelector('.pc-desc'),e=b.querySelector('.pc-emoji');if(!d||!e)return;
      const k=m[d.textContent.trim()];
      if(k&&src(k)){e.innerHTML=iconoHTML(k,46);e.style.fontSize='0';e.style.lineHeight='0';}
    });
  });

  /* ---- barra de poderes activos (arriba): cambia el emoji inicial por el icono ---- */
  const EMO={'🌟':'star','💢':'berserker','🦘':'superjump3x','🌀':'phantom','⚡':'lightning_storm','🛡️':'shield','👻':'ghost','👑':'crown',
    '🧲':'magnet','🔥':'aura','🐒':'superjump','🔵':'clone','🔫':'gun','🔁':'dualshot','⭐':'turbo','⏱️':'timefreeze','🌈':'rainbowstorm',
    '🪞':'mirror','👊':'giant','🕰️':'timewarp','💨':'dash'};
  const pills=document.getElementById('powerPills');
  if(pills){
    const pintar=()=>{
      pills.querySelectorAll('.ppill').forEach(el=>{
        if(el.dataset.ico)return;
        const t=el.firstChild;if(!t||t.nodeType!==3)return;
        const txt=t.textContent.trim();
        let k=EMO[txt];
        if(txt==='🚀')k=(el.style.color||'').includes('255, 68, 255')||/ff44ff/i.test(el.style.color)?'rocket':'gravity';
        if(k&&src(k)){el.dataset.ico='1';t.textContent=' ';el.insertAdjacentHTML('afterbegin',iconoHTML(k,22));}
      });
    };
    new MutationObserver(pintar).observe(pills,{childList:true});
  }
 }});
})();
