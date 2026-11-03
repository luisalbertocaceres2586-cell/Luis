/* engine/educativo — Repaso de errores
   Guarda las multiplicaciones que fallaste y, al terminar o perder un nivel, te muestra cuáles repasar.
   También acumula cuántas veces falló cada operación (localStorage) por si el profe quiere revisarlo. */
(function(){
if(!window.NinjaMods)return;
const KEY='ninja_repaso_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return{};}}
NinjaMods.register({id:'repaso-errores',carpeta:'educativo',nombre:'Repaso de errores',
 desc:'Al terminar un nivel muestra las multiplicaciones que fallaste para repasarlas (y las guarda para el profe).',
 init(){
  let nivel=[],lastWrong=0;
  const box=(id)=>{let d=document.getElementById(id);if(!d){d=document.createElement('div');d.id=id;
    d.style.cssText="margin:8px 0;padding:8px 10px;border-radius:9px;background:rgba(255,120,0,.14);border:1px solid rgba(255,170,60,.5);font-family:'Press Start 2P',monospace;font-size:clamp(6px,1.3vw,8px);color:#FFE0B0;line-height:1.9;text-align:center";}return d;};
  NinjaMods.after('startLevel',function(){nivel=[];lastWrong=(typeof GS!=='undefined'?GS.wrong:0)||0;});
  NinjaMods.after('update',function(){
    if(typeof GS==='undefined'||!GS.running)return;
    if(GS.wrong>lastWrong){lastWrong=GS.wrong;
      try{if(curQ&&curQ.mode==='classic'){const f=curQ.a+' × '+curQ.b+' = '+curQ.ans;
        if(!nivel.includes(f))nivel.push(f);const db=load();db[f]=(db[f]||0)+1;localStorage.setItem(KEY,JSON.stringify(db));}}catch(e){}
    }else if(GS.wrong<lastWrong)lastWrong=GS.wrong;
  });
  NinjaMods.after('showS',function(n){
    if(n!==3&&n!==4)return;
    const scr=document.getElementById('S'+n);if(!scr)return;const brow=scr.querySelector('.brow');if(!brow)return;
    const d=box('repasoBox'+n);
    if(nivel.length){d.innerHTML='📚 REPASA ESTAS:<br>'+nivel.slice(0,6).join('&nbsp;&nbsp;·&nbsp;&nbsp;');brow.parentNode.insertBefore(d,brow);}
    else if(d.parentNode)d.parentNode.removeChild(d);
  });
 }});
})();
