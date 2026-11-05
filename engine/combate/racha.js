/* engine/combate — Racha de aciertos
   Indicador 🔥 RACHA que crece con cada respuesta correcta seguida, y premio cada 5 aciertos seguidos. */
(function(){
if(!window.NinjaMods)return;
NinjaMods.register({id:'racha',carpeta:'combate',nombre:'Racha de aciertos 🔥',
 desc:'Muestra tu racha de respuestas correctas seguidas y da +100 puntos y efectos cada 5 aciertos.',
 init(){
  const st=document.createElement('style');st.textContent=`
  #rachaB{position:fixed;left:50%;top:86px;transform:translateX(-50%) scale(.8);z-index:60;pointer-events:none;opacity:0;transition:opacity .25s,transform .25s;
    font-family:'Press Start 2P',monospace;font-size:clamp(8px,1.8vw,11px);color:#fff;padding:6px 12px;border-radius:20px;
    background:linear-gradient(90deg,#FF6A00,#FF2E2E);border:2px solid #FFD54A;box-shadow:0 0 16px #FF7A00;text-shadow:1px 1px 0 #000}
  #rachaB.on{opacity:1;transform:translateX(-50%) scale(1)}
  #rachaB.pop{animation:rachaPop .35s ease-out}@keyframes rachaPop{0%{transform:translateX(-50%) scale(1.5)}100%{transform:translateX(-50%) scale(1)}}`;
  document.head.appendChild(st);
  const b=document.createElement('div');b.id='rachaB';document.body.appendChild(b);
  let last=0;
  NinjaMods.after('update',function(){
    if(typeof GS==='undefined'||!GS.running){b.classList.remove('on');last=0;return;}
    const s=GS.streak||0;
    if(s!==last){
      if(s>=2){b.textContent='🔥 RACHA x'+s;b.classList.add('on');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
      else b.classList.remove('on');
      if(s>last&&s>0&&s%5===0){
        GS.score+=100;GS.totalScore+=100;
        try{SFX.combo();spawnTfx(P.x-camX,P.y-40,'🔥 ¡RACHA '+s+'! +100','#FFD54A');
            spawnShockwave(P.x-camX+P.w/2,P.y+P.h/2,'#FF8800',70);if(window.FX&&FX.punch)FX.punch(1.05);updHUD();}catch(e){}
      }
      last=s;
    }
  });
 }});
})();
