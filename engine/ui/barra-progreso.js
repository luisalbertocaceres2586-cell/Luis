/* engine/ui — Barra de progreso del nivel
   Una barra delgada arriba muestra cuánto has avanzado hasta la bandera y dónde está tu último punto de control. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'barra-progreso',carpeta:'ui',nombre:'Barra de progreso del nivel',
 desc:'Muestra en una barra cuánto falta para llegar a la meta y dónde está tu punto de control.',
 init(){
  const st=document.createElement('style');st.textContent=`
  #progB{position:fixed;left:50%;top:3px;transform:translateX(-50%);width:min(46vw,360px);height:7px;border-radius:5px;z-index:61;pointer-events:none;
    background:rgba(0,0,30,.55);border:1px solid rgba(255,255,255,.35);display:none}
  #progB i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:5px;background:linear-gradient(90deg,#00E5FF,#7CFF6B,#FFD54A)}
  #progB u{position:absolute;top:-4px;width:2px;height:13px;background:#fff;opacity:.7;text-decoration:none}
  #progB s{position:absolute;right:-5px;top:-9px;font-size:12px;text-decoration:none}
  #progB em{position:absolute;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#FF2E92;border:2px solid #fff;font-style:normal}`;
  document.head.appendChild(st);
  const b=document.createElement('div');b.id='progB';b.innerHTML='<i></i><u></u><s>🚩</s><em></em>';document.body.appendChild(b);
  const bar=b.querySelector('i'),cp=b.querySelector('u'),me=b.querySelector('em');
  NinjaMods.after('update',function(){
    if(typeof GS==='undefined'||!GS.running||typeof flagX==='undefined'||!flagX){b.style.display='none';return;}
    b.style.display='block';
    const p=Math.max(0,Math.min(1,P.x/flagX));bar.style.width=(p*100)+'%';me.style.left=(p*100)+'%';
    cp.style.left=Math.max(0,Math.min(100,(GS._checkpointX||0)/flagX*100))+'%';cp.style.display=GS._checkpointX?'block':'none';
  });
 }});
})();
