/* engine/secretos — Las 5 flores doradas del Nivel 1 🌸
   Cinco flores escondidas en el aire. Casi no se ven: solo brillan un poquito de lejos y aparecen cuando te acercas.
   Si juntas las cinco: +5 VIDAS de golpe (hasta el máximo de 8; lo que no quepa se cambia por puntos).
   Se cobra una sola vez por partida. */
(function(){
if(!window.NinjaMods)return;
const U=()=>NinjaMods.util;
NinjaMods.register({id:'flores-doradas',carpeta:'secretos',nombre:'Las 5 flores doradas (Nivel 1)',
 desc:'Secreto: 5 flores casi invisibles escondidas en el Nivel 1. Si las juntas todas ganas +5 vidas.',
 init(){
  let flores=[],cobrado=false,hecho=false;
  const OFF=[[0,-88],[0,-104],[0,-84],[0,-108],[0,-94]];   // altura sobre la plataforma (alcanzable con salto)
  NinjaMods._flores=()=>flores;
  function chip(){const n=flores.filter(f=>f.tomada).length;U().chip('flores',n&&!cobrado?'🌸 FLORES '+n+'/5':'','#FFD54A');}
  function crear(){
    flores=[];const f=U().fijas();
    if(!f.length)return;
    // una por plataforma fija (de izquierda a derecha); si hay menos de 5, se reparten en altura/anchura
    for(let i=0;i<5;i++){
      const pl=f[Math.min(f.length-1,Math.floor((i+.5)*f.length/5))];   // repartidas a lo largo del nivel
      flores.push({x:pl.x+pl.w*(i<f.length?.5:.25),y:Math.max(52,pl.y+OFF[i][1]),tomada:false,ph:i*1.3});
    }
  }
  NinjaMods.after('startLevel',function(){
    if(typeof GS==='undefined')return;
    if(GS.level!==0){flores=[];hecho=false;chip();return;}
    if(!hecho)flores=[];          // se crean en el primer cuadro con plataformas (ver update)
    chip();
  });
  NinjaMods.after('update',function(){
    if(typeof P==='undefined'||!P||!GS.running||GS.level!==0||cobrado)return;
    if(!hecho&&!flores.length){crear();if(flores.length){hecho=true;chip();}}
    if(!flores.length)return;
    flores.forEach(fl=>{
      if(fl.tomada)return;
      const sx=fl.x-camX,sy=fl.y;
      if(Math.abs(P.x+P.w/2-fl.x)<30&&Math.abs(P.y+P.h/2-sy)<38){
        fl.tomada=true;const n=flores.filter(q=>q.tomada).length;chip();
        try{
          U().flash('#FFD54A');U().vibrar(40);spawnPfx(sx,sy,'#FFD54A',20);spawnShockwave(sx,sy,'#FFD54A',70);
          if(window.SFX&&SFX.life)SFX.life();
          if(n<5)U().banner('🌸 ¡FLOR DORADA!',n+' de 5 encontradas','#FFD54A');
        }catch(e){}
        if(n===5)premio();
      }
    });
  });
  function premio(){
    cobrado=true;
    const cabe=Math.max(0,8-GS.lives),vidas=Math.min(5,cabe),resto=5-vidas;
    GS.lives+=vidas;
    if(resto>0){GS.score+=resto*500;GS.totalScore+=resto*500;}
    try{
      updHUD();flashGreen();U().congelar(14);U().vibrar(120);
      U().banner('🌸 ¡LAS 5 FLORES DORADAS!','+'+vidas+' VIDAS'+(resto?'  ·  +'+resto*500+' PUNTOS':''),'#FFD54A');
      const h=U().heroXY();for(let i=0;i<4;i++)setTimeout(()=>{spawnPfx(h.x+(Math.random()-.5)*160,h.y-Math.random()*90,'#FFD54A',18);spawnShockwave(h.x,h.y,'#FFE066',110+i*30);},i*180);
    }catch(e){}
    chip();
  }
  NinjaMods.after('render',function(){
    if(typeof P==='undefined'||!GS.running||GS.level!==0||cobrado)return;
    const now=Date.now(),px=P.x+P.w/2;
    flores.forEach(fl=>{
      if(fl.tomada)return;const sx=fl.x-camX;if(sx<-60||sx>W+60)return;
      const dist=Math.abs(px-fl.x);
      // lejos: apenas un destello ocasional; cerca: aparece (así hay que explorar)
      const cerca=Math.max(0,Math.min(1,(330-dist)/200));
      const destello=Math.max(0,Math.sin(now/520+fl.ph*3))>.93?0.35:0;
      const a=Math.max(cerca,destello);if(a<.02)return;
      const y=fl.y+Math.sin(now/420+fl.ph)*4;
      CX.save();CX.globalAlpha=a;CX.translate(sx,y);CX.rotate(now/2400+fl.ph);
      const g=CX.createRadialGradient(0,0,2,0,0,30);g.addColorStop(0,'rgba(255,225,110,.85)');g.addColorStop(1,'rgba(255,200,60,0)');
      CX.fillStyle=g;CX.beginPath();CX.arc(0,0,30,0,7);CX.fill();
      for(let i=0;i<6;i++){CX.rotate(Math.PI/3);CX.fillStyle='#FFD54A';CX.strokeStyle='#B8860B';CX.lineWidth=1.5;
        CX.beginPath();CX.ellipse(0,-9,5.5,9,0,0,7);CX.fill();CX.stroke();}
      CX.fillStyle='#FFF4B0';CX.beginPath();CX.arc(0,0,4.5,0,7);CX.fill();
      CX.restore();
    });
  });
 }});
})();
