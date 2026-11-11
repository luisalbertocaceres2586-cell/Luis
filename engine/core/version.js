/* engine/core — Versión del juego y aviso de actualización
   index.html declara window.NJ_BUILD; version.json (siempre se pide sin caché) trae la versión publicada.
   · En el menú principal se ve la versión abajo, para saber qué copia estás viendo.
   · Si hay una versión más nueva en el servidor: en el menú se recarga sola; durante una partida sale un aviso "ACTUALIZAR". */
(function(){
const MIA=window.NJ_BUILD||'?';
const css=document.createElement('style');css.textContent=`
#njVer{position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:101;font:7px 'Press Start 2P',monospace;color:rgba(190,205,255,.55);pointer-events:none;letter-spacing:1px}
#njUpd{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:30000;display:none;align-items:center;gap:10px;padding:8px 14px;border-radius:14px;background:#0a1c40;border:2px solid #F0A91E;color:#fff;font:9px 'Press Start 2P',monospace;box-shadow:0 4px 14px rgba(0,0,0,.6)}
#njUpd.on{display:flex}#njUpd button{font:inherit;padding:6px 10px;border-radius:8px;border:2px solid #7CFF6B;background:#0f5a2a;color:#fff;cursor:pointer}`;
document.head.appendChild(css);
const s0=document.getElementById('S0');
if(s0){const t=document.createElement('div');t.id='njVer';t.textContent='v '+MIA;s0.appendChild(t);}
const ban=document.createElement('div');ban.id='njUpd';ban.innerHTML='<span>🔄 Hay una versión nueva</span><button>ACTUALIZAR</button>';document.body.appendChild(ban);
function recargar(v){try{sessionStorage.setItem('njRecarga',v);}catch(e){}location.replace(location.pathname+'?v='+encodeURIComponent(v)+location.hash);}
function revisar(){
  if(document.hidden)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{
    if(!j||!j.v||j.v===MIA||MIA==='?')return;
    ban.querySelector('button').onclick=()=>recargar(j.v);
    let ya='';try{ya=sessionStorage.getItem('njRecarga')||'';}catch(e){}
    const menu=s0&&s0.classList.contains('on')&&ya!==j.v;     // protección: nunca recarga dos veces por la misma versión
    if(menu){setTimeout(()=>recargar(j.v),1200);}else ban.classList.add('on');
  }).catch(()=>{});
}
setTimeout(revisar,2500);setInterval(revisar,90000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(revisar,800);});
})();
