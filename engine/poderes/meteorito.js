/* engine/poderes — Poderes que caen como METEORITOS ☄️
   Antes los poderes bajaban despacio y de lado a lado. Ahora cada uno entra en diagonal y rápido dentro de una bola de fuego
   (assets/efectos/meteoro_cabeza.png + meteoro_estela.png) con su icono al centro. Antes de caer se marca en el suelo dónde
   va a golpear. Al impactar: onda de choque, chispas, sacudida y un cráter brillante; el poder queda flotando sobre el cráter
   unos 12 segundos (parpadea al final) para que lo recojas, en vez de pasar de largo. */
(function(){
if(!window.NinjaMods)return;
const IMG={};
function img(k,f){if(!IMG[k]){IMG[k]=new Image();IMG[k].src='assets/efectos/'+f;}return IMG[k];}
const HEAD={w:560,h:380,ax:189,ay:258,r:114},TRAIL={w:1100,h:352,ax:1050,ay:183};
const HEAD_DIR=Math.atan2(0.52,-0.85);             // hacia dónde "viaja" el dibujo original (abajo-izquierda)
const LIFE=720;                                    // ≈12 s a 60 pasos por segundo
const ok=i=>i&&i.complete&&i.naturalWidth>0;
/* Explosión de impacto: 6 cuadros (hoja 3×2 de 384×329) en 3 colores × 2 diseños (assets/efectos/explosion_<color>_<a|b>.png) */
const EXP={},CW=384,CH=329,DUR=[70,90,110,120,130,150];
const TOT=DUR.reduce((a,b)=>a+b,0);
['fuego','hielo','magia'].forEach(v=>['a','b'].forEach(n=>{const i=new Image();i.src='assets/efectos/explosion_'+v+'_'+n+'.png';EXP[v+n]=i;}));
let booms=[];
function variante(){try{const b=String((curLV()||{}).bg||'');if(/ice|snow|water|ocean/.test(b))return'hielo';if(/night|space|galaxy|crypt|boss|neon|storm/.test(b))return'magia';}catch(e){}return'fuego';}
NinjaMods.register({id:'meteorito-poderes',carpeta:'poderes',nombre:'Poderes que caen como meteoritos ☄️',
 desc:'Los poderes entran en diagonal dentro de una bola de fuego con estela, marcan dónde caerán, golpean con onda y cráter, y esperan unos segundos para ser recogidos.',
 init(){
  img('cab','meteoro_cabeza.png');img('est','meteoro_estela.png');
  /* 1) al aparecer un poder nuevo se convierte en meteorito */
  const spawn0=window.spawnSkyItem;
  if(typeof spawn0!=='function')return;
  window.spawnSkyItem=function(){
    const n=skyItems.length;spawn0.apply(this,arguments);
    if(skyItems.length>n){
      const s=skyItems[skyItems.length-1];
      try{
        const GY=groundY();let tx=s.wx,gt=groundYAt(tx);
        for(let k=0;k<8&&gt>GY+8;k++){tx+=110;gt=groundYAt(tx);}          // si cae sobre un foso, se corre hacia suelo firme
        const landY=gt-64,vy=11.5,vx=-6.2,y0=-70,frames=(landY-y0)/vy;
        s._met={fase:'cae',vx,vy,tx,landY,gt,life:LIFE};
        s.wx=tx-vx*frames;s.y=y0;s.vy=0;s._hide=true;
        s.x=tx;
      }catch(e){}
    }
  };
  /* 2) movimiento: ANTES del update normal (que ya no mueve estos objetos porque vy=0) */
  NinjaMods.before('updateSkyItems',function(dt){
    dt=dt||1;
    for(const s of skyItems){
      const m=s._met;if(!m||s.taken)continue;
      if(m.fase==='cae'){
        s.wx+=m.vx*dt;s.y+=m.vy*dt;
        if(s.y>=m.landY){impacto(s,m);}
      }else{
        m.life-=dt;
        s._hide=m.life<150&&Math.floor(m.life/7)%2===0;          // parpadea los últimos 2.5 s
        if(m.life<=0){s.taken=true;try{spawnPfx(s.wx-camX+16,s.y+16,s.color,6);}catch(e){}}
      }
    }
  });
  function impacto(s,m){
    s.y=m.landY;s.wx=m.tx;m.fase='reposo';s._hide=false;s.vy=0;m.golpe=Date.now();
    try{
      const sx=s.wx-camX+16,gy=m.gt;
      const im=EXP[variante()+(Math.random()<.5?'a':'b')];
      if(ok(im))booms.push({x:s.wx+16,gt:gy,t0:Date.now(),img:im});
      else{spawnShockwave(sx,gy,'#FF8A00',130);spawnShockwave(sx,gy,'#FFD27A',80);}
      spawnPfx(sx,gy-8,'#FFD54A',8);
      screenShake(5,230);if(window.SFX&&SFX.explode)SFX.explode();
      if(navigator.vibrate)navigator.vibrate(30);
    }catch(e){}
  }
  /* 3) dibujo: bola de fuego, aviso en el suelo y cráter */
  NinjaMods.after('render',function(){
    if(!skyItems||!skyItems.length)return;
    const now=Date.now(),cab=IMG.cab,est=IMG.est,good=ok(cab)&&ok(est);
    for(const s of skyItems){
      const m=s._met;if(!m||s.taken)continue;
      const sx=s.wx-camX+16,tx=m.tx-camX+16;
      if(m.fase==='cae'){
        // aviso en el suelo: un anillo que se cierra a medida que se acerca
        const prog=Math.max(0,Math.min(1,(s.y+70)/(m.landY+70)));
        if(tx>-40&&tx<W+40){
          CX.save();CX.globalAlpha=.25+.5*prog;CX.strokeStyle='#FF6A00';CX.lineWidth=3;CX.shadowColor='#FF6A00';CX.shadowBlur=8;
          const rw=26+(1-prog)*46,rh=6+(1-prog)*10;
          CX.beginPath();CX.ellipse(tx,m.gt,rw,rh,0,0,7);CX.stroke();
          CX.globalAlpha=.18*prog+.1;CX.fillStyle='#FF8A00';CX.fill();CX.restore();
        }
        if(sx<-200||sx>W+200||!good)continue;
        const sy=s.y+16,ang=Math.atan2(m.vy,m.vx);
        CX.save();CX.translate(sx,sy);
        // estela larga, detrás
        CX.save();CX.rotate(ang);const sc=230/TRAIL.w;CX.globalAlpha=.85;
        CX.drawImage(est,-TRAIL.ax*sc,-TRAIL.ay*sc,TRAIL.w*sc,TRAIL.h*sc);CX.restore();
        // cabeza (bola de fuego con su propia cola), girada hacia donde va
        CX.save();CX.rotate(ang-HEAD_DIR);const hs=74/(HEAD.r*2);
        CX.drawImage(cab,-HEAD.ax*hs,-HEAD.ay*hs,HEAD.w*hs,HEAD.h*hs);CX.restore();
        // icono del poder dentro de la bola de fuego
        const ic=(typeof POWER_ICONS!=='undefined')?POWER_ICONS[s.type]:null;
        if(ic&&ic.naturalWidth){CX.drawImage(ic,0,0,ic.naturalWidth,ic.naturalHeight,-21,-21,42,42);}
        else{CX.font='26px serif';CX.textAlign='center';CX.textBaseline='middle';CX.fillText(s.emoji||'⭐',0,1);}
        CX.restore();
      }else{
        // cráter brillante bajo el poder que espera
        if(tx<-60||tx>W+60)continue;
        const t=(now-m.golpe)/1000,pul=.5+Math.sin(now/260)*.5,fade=Math.min(1,m.life/150);
        CX.save();CX.globalAlpha=fade;
        const g=CX.createRadialGradient(tx,m.gt,2,tx,m.gt,46);g.addColorStop(0,'rgba(255,170,40,'+(.55+pul*.25)+')');g.addColorStop(1,'rgba(255,90,0,0)');
        CX.fillStyle=g;CX.beginPath();CX.ellipse(tx,m.gt,50,13,0,0,7);CX.fill();
        CX.fillStyle='rgba(30,12,6,.75)';CX.beginPath();CX.ellipse(tx,m.gt+1,30,6,0,0,7);CX.fill();
        CX.strokeStyle='rgba(255,140,30,'+(.5+pul*.4)+')';CX.lineWidth=2;CX.beginPath();CX.ellipse(tx,m.gt+1,30,6,0,0,7);CX.stroke();
        if(Math.floor(now/90)%4===0){CX.fillStyle='#FFB84A';CX.fillRect(tx+(Math.random()-.5)*44,m.gt-4-Math.random()*26,2,2);}   // brasas
        CX.restore();
      }
    }
    // explosiones de impacto (por encima de todo lo demás del mundo)
    if(booms.length){
      const t=Date.now();
      booms=booms.filter(b=>t-b.t0<TOT);
      for(const b of booms){
        const e=t-b.t0;let f=0,acc=0;for(let i=0;i<6;i++){if(e<acc+DUR[i]){f=i;break;}acc+=DUR[i];f=i;}
        const sx=b.x-camX;if(sx<-220||sx>W+220)continue;
        const dw=300,dh=dw*CH/CW,al=f===5?Math.max(0,1-(e-(TOT-DUR[5]))/DUR[5]):1;
        CX.save();
        if(f===0){const g=CX.createRadialGradient(sx,b.gt-dh*.35,4,sx,b.gt-dh*.35,150);g.addColorStop(0,'rgba(255,240,200,.65)');g.addColorStop(1,'rgba(255,160,40,0)');
          CX.globalCompositeOperation='lighter';CX.fillStyle=g;CX.fillRect(sx-160,b.gt-dh*.35-160,320,320);CX.globalCompositeOperation='source-over';}
        CX.globalAlpha=al;
        CX.drawImage(b.img,(f%3)*CW,Math.floor(f/3)*CH,CW,CH,sx-dw/2,b.gt+10-dh,dw,dh);
        CX.restore();
      }
    }
  });
 }});
})();
