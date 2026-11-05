/* engine/poderes — Pista del sensei 💡 y Reloj de arena ⏳ (pensados para aprender las tablas)
   En cada nivel hay una de cada una flotando. Se guardan y se usan SOLAS en la siguiente pregunta:
     💡 Pista del sensei: tacha 2 respuestas incorrectas.
     ⏳ Reloj de arena: congela el cronómetro de la pregunta hasta 12 segundos para pensar con calma. */
(function(){
if(!window.NinjaMods)return;
const U=()=>NinjaMods.util;
NinjaMods.register({id:'pista-reloj',carpeta:'poderes',nombre:'Pista del sensei 💡 y Reloj de arena ⏳',
 desc:'Objetos flotantes que ayudan a responder: la pista tacha 2 respuestas malas y el reloj congela el tiempo de la pregunta.',
 init(){
  const inv={pista:0,reloj:0};let items=[],nivelVisto=-1,freezeId=null,colocado=false;
  const ICON={pista:'💡',reloj:'⏳'},COL={pista:'#FFE066',reloj:'#7FD7FF'};
  NinjaMods._items=()=>items;NinjaMods._inv=inv;
  function chips(){
    U().chip('pista',inv.pista?'💡 PISTA ×'+inv.pista:'',COL.pista);
    U().chip('reloj',inv.reloj?'⏳ RELOJ ×'+inv.reloj:'',COL.reloj);
  }
  function colocar(){
    items=[];const f=U().fijas();
    const fx=(typeof flagX!=='undefined'&&flagX)?flagX:5000;
    [['pista',.30],['reloj',.62]].forEach(([tipo,frac],i)=>{
      // a nivel del suelo y entre plataformas, para no chocar con las flores secretas que flotan sobre ellas
      const x=fx*frac,y=(typeof groundYAt==='function'?groundYAt(x):groundY())-58;
      items.push({tipo,x,y,taken:false,ph:i*1.7});
    });
  }
  NinjaMods.after('startLevel',function(){
    if(typeof GS==='undefined')return;
    const clave=GS.level+'|'+(GS.phase||'');
    if(clave!==nivelVisto){nivelVisto=clave;items=[];colocado=false;}   // nivel nuevo; si solo reinicias tras perder una vida, no reaparecen los ya recogidos
    chips();
  });
  NinjaMods.after('update',function(){
    if(typeof P==='undefined'||!P||!GS.running||!P.alive)return;
    if(!colocado&&NinjaMods.util.fijas().length){colocar();colocado=true;}   // las plataformas se crean un instante después de startLevel
    items.forEach(it=>{
      if(it.taken)return;
      const sx=it.x-camX,sy=it.y+Math.sin(Date.now()/380+it.ph)*5;
      if(P.x-camX<sx+22&&P.x-camX+P.w>sx-22&&P.y<sy+22&&P.y+P.h>sy-22){
        it.taken=true;inv[it.tipo]++;chips();
        try{
          U().flash(COL[it.tipo]);U().vibrar(25);
          spawnPfx(sx,sy,COL[it.tipo],16);spawnShockwave(sx,sy,COL[it.tipo],60);
          U().banner(it.tipo==='pista'?'💡 ¡PISTA DEL SENSEI!':'⏳ ¡RELOJ DE ARENA!',
            it.tipo==='pista'?'Tachará 2 respuestas malas':'Congelará el tiempo de la pregunta',COL[it.tipo]);
          if(window.SFX&&SFX.life)SFX.life();
        }catch(e){}
      }
    });
  });
  NinjaMods.after('render',function(){
    if(typeof P==='undefined'||!GS.running)return;
    const now=Date.now();
    items.forEach(it=>{
      if(it.taken)return;const sx=it.x-camX;if(sx<-40||sx>W+40)return;
      const sy=it.y+Math.sin(now/380+it.ph)*5;
      CX.save();
      const g=CX.createRadialGradient(sx,sy,2,sx,sy,32);g.addColorStop(0,COL[it.tipo]+'cc');g.addColorStop(1,COL[it.tipo]+'00');
      CX.fillStyle=g;CX.beginPath();CX.arc(sx,sy,32+Math.sin(now/260+it.ph)*3,0,7);CX.fill();
      CX.font='26px serif';CX.textAlign='center';CX.textBaseline='middle';CX.fillText(ICON[it.tipo],sx,sy+1);
      CX.restore();
    });
  });
  /* usar la PISTA al abrir la pregunta */
  NinjaMods.after('buildQDom',function(bonus){
    if(!inv.pista||bonus||typeof curQ==='undefined'||!curQ)return;
    const btns=[...document.querySelectorAll('#agrid .ans')];
    if(btns.length<3)return;
    const malas=btns.filter(b=>+b.dataset.v!==curQ.ans);
    if(malas.length<2)return;
    malas.sort(()=>Math.random()-.5).slice(0,Math.min(2,malas.length-1)).forEach(b=>{
      b.disabled=true;b.style.opacity='.22';b.style.textDecoration='line-through';b.style.filter='grayscale(1)';b.style.pointerEvents='none';
    });
    inv.pista--;chips();
    try{U().banner('💡 PISTA','Dos respuestas tachadas','#FFE066');}catch(e){}
  });
  /* usar el RELOJ al arrancar el cronómetro */
  NinjaMods.after('startTimer',function(){
    if(!inv.reloj||typeof AQbonus!=='undefined'&&AQbonus)return;
    inv.reloj--;chips();
    const tope=tiLeft;let n=0;clearInterval(freezeId);
    const tag=document.getElementById('nmFrz')||(()=>{const d=document.createElement('div');d.id='nmFrz';
      d.style.cssText="position:fixed;left:50%;transform:translateX(-50%);top:6px;z-index:9001;font-family:'Press Start 2P',monospace;font-size:9px;color:#BFEFFF;background:rgba(0,40,90,.85);border:2px solid #7FD7FF;border-radius:14px;padding:6px 12px;pointer-events:none";
      document.body.appendChild(d);return d;})();
    tag.style.display='block';
    freezeId=setInterval(()=>{
      n+=25;
      if(typeof AQ==='undefined'||!AQ||n>12000){clearInterval(freezeId);tag.style.display='none';return;}
      tiLeft=tope;                                   // fijo: el cronómetro del juego resta 100 ms cada 100 ms y aquí se vuelve a poner
      tag.textContent='⏳ TIEMPO CONGELADO '+Math.max(0,Math.ceil((12000-n)/1000))+'s';
    },25);
  });
 }});
})();
