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
/* EFECTOS DE IMPACTO (assets/efectos/): hojas de animación con transparencia. Cada una se reproduce con retraso propio:
     grietas · anillos de onda · explosión (3 diseños) · rocas · brasas · cráter que se queda · haz de luz teñido · humo */
const FX={};
const cargar=(k,f)=>{const i=new Image();i.src='assets/efectos/'+f;FX[k]=i;};
['fuego','hielo','magia'].forEach(v=>{
  ['a','b','c'].forEach(n=>cargar('exp_'+v+n,'explosion_'+v+'_'+n+'.png'));
  ['crater','brasas','anillos','grietas'].forEach(e=>cargar(e+v,'fx_'+e+'_'+v+'.png'));
});
cargar('humo','fx_humo.png');cargar('haz','fx_haz.png');cargar('rocas','fx_rocas.png');
const rep=(n,ms)=>Array(n).fill(ms);
const EXPDUR=[70,90,110,120,130,150];
let anims=[];                                      // animaciones en curso
const tintCache={};
function teñido(img,color){                        // haz de luz en grises → del color del poder (se guarda una vez por color)
  const k=img.src+color;if(tintCache[k])return tintCache[k];
  const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');
  x.drawImage(img,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.7;x.fillStyle=color;x.fillRect(0,0,c.width,c.height);
  return tintCache[k]=c;
}
/* a = {img,cols,n,durs,w,anc:'b'|'c',x(mundo),y(suelo),oy,delay,alpha,blend,tint,hold,ref} */
NinjaMods._anims=()=>anims.map(a=>(a.tint?'haz':'x')+':'+(a.hold?'h':'')).join(',');
function anim(a){a.t0=Date.now();a.tot=a.durs.reduce((p,q)=>p+q,0);anims.push(a);return a;}
function dibujarAnims(){
  if(!anims.length)return;
  const now=Date.now();
  anims=anims.filter(a=>{
    if(a.hold){if(a.ref&&a.ref.taken&&!a.fin)a.fin=now;if(a.fin&&now-a.fin>700)return false;return true;}
    return now-a.t0<a.delay+a.tot;});
  for(const a of anims){
    const e=now-a.t0-a.delay;if(e<0)continue;
    const im=a.img;if(!ok(im))continue;
    let f=0,acc=0;for(let i=0;i<a.n;i++){f=i;if(e<acc+a.durs[i])break;acc+=a.durs[i];}
    if(a.hold&&e>=a.tot)f=a.n-1;
    const sx=a.x-camX;if(sx<-260||sx>W+260)continue;
    const rows=Math.ceil(a.n/a.cols),cw=im.naturalWidth/a.cols,ch=im.naturalHeight/rows,dw=a.w,dh=dw*ch/cw;
    let al=a.alpha==null?1:a.alpha;
    if(a.fin)al*=Math.max(0,1-(now-a.fin)/700);
    else if(!a.hold&&f===a.n-1)al*=Math.max(0,1-(e-(a.tot-a.durs[a.n-1]))/a.durs[a.n-1]);
    CX.save();CX.globalAlpha=al;if(a.blend)CX.globalCompositeOperation=a.blend;
    const src=a.tint?teñido(im,a.tint):im;
    const top=a.anc==='b'?a.y+a.oy-dh:a.y+a.oy-dh/2;
    CX.drawImage(src,(f%a.cols)*cw,Math.floor(f/a.cols)*ch,cw,ch,sx-dw/2,top,dw,dh);
    CX.restore();
  }
}
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
        s._hide=true;m.parp=m.life<150&&Math.floor(m.life/7)%2===0;   // parpadea los últimos 2.5 s
        if(m.life<=0){s.taken=true;try{spawnPfx(s.wx-camX+16,s.y+16,s.color,6);anim({img:FX.humo,cols:3,n:6,durs:rep(6,120),w:130,anc:'b',x:s.wx+16,y:m.gt,oy:-4,delay:0,alpha:.55});}catch(e){}}
      }
    }
  });
  function impacto(s,m){
    s.y=m.landY;s.wx=m.tx;m.fase='reposo';s._hide=true;s.vy=0;m.golpe=Date.now();
    try{
      const sx=s.wx-camX+16,gy=m.gt;
      const v=variante(),lite=(typeof _perfMode!=='undefined'&&_perfMode==='lite'),X=s.wx+16,G=gy;
      const col=s.color||'#FFD54A',ex=['a','b','c'][Math.floor(Math.random()*3)];
      anim({img:FX['grietas'+v],cols:2,n:4,durs:rep(4,150),w:330,anc:'c',x:X,y:G,oy:2,delay:0});
      anim({img:FX['anillos'+v],cols:3,n:6,durs:rep(6,100),w:340,anc:'c',x:X,y:G,oy:0,delay:0,alpha:.95});
      anim({img:FX['exp_'+v+ex],cols:3,n:6,durs:EXPDUR,w:300,anc:'b',x:X,y:G,oy:10,delay:0});
      if(!lite){
        anim({img:FX.rocas,cols:3,n:6,durs:rep(6,130),w:240,anc:'c',x:X,y:G,oy:-95,delay:30,alpha:.95});
        anim({img:FX['brasas'+v],cols:3,n:6,durs:rep(6,180),w:260,anc:'c',x:X,y:G,oy:-85,delay:60});
        anim({img:FX.humo,cols:3,n:6,durs:rep(6,200),w:190,anc:'b',x:X,y:G,oy:-6,delay:700,alpha:.5});
      }
      anim({img:FX.haz,cols:3,n:6,durs:rep(6,130),w:150,anc:'b',x:X,y:G,oy:6,delay:480,alpha:.85,blend:'lighter',tint:col});
      anim({img:FX['crater'+v],cols:3,n:6,durs:[150,170,190,200,220,260],w:170,anc:'b',x:X,y:G,oy:8,delay:380,hold:true,ref:s});
      m.cratera=true;
      spawnPfx(sx,gy-8,'#FFD54A',8);
      screenShake(5,230);if(window.SFX&&SFX.explode)SFX.explode();
      if(navigator.vibrate)navigator.vibrate(30);
    }catch(e){}
  }
  /* al recoger: columna de luz del color del poder + chispas */
  NinjaMods.after('collectSkyItem',function(it,sx,sy){
    const X=sx+camX+16,G=it._met?it._met.gt:Math.min(groundY(),sy+90),v=variante();
    anim({img:FX.haz,cols:3,n:6,durs:rep(6,95),w:160,anc:'b',x:X,y:G,oy:6,delay:0,alpha:.9,blend:'lighter',tint:it.color||'#FFD54A'});
    if(!(typeof _perfMode!=='undefined'&&_perfMode==='lite'))
      anim({img:FX['brasas'+v],cols:3,n:6,durs:rep(6,90),w:200,anc:'c',x:X,y:sy+16,oy:0,delay:0,alpha:.9});
  });
  /* poder que espera sobre el cráter: anillos pulsantes + icono + nombre (encima de los efectos para que siempre se lea) */
  function reposo(it){
    const sx=(it.wx-camX)+Math.sin(it.t*2)*8+16,sy=it.y+16;if(sx<-60||sx>W+60)return;
    const now=Date.now(),pul=.5+Math.sin(now/260)*.5,col=it.color||'#FFD54A';
    CX.save();CX.strokeStyle=col;CX.lineWidth=3;CX.globalAlpha=.35+pul*.3;CX.beginPath();CX.arc(sx,sy,24+pul*9,0,7);CX.stroke();
    CX.lineWidth=2;CX.globalAlpha=.6+pul*.3;CX.beginPath();CX.arc(sx,sy,18,0,7);CX.stroke();CX.globalAlpha=1;
    const ic=(typeof POWER_ICONS!=='undefined')?POWER_ICONS[it.type]:null;
    if(ic&&ic.naturalWidth)CX.drawImage(ic,0,0,ic.naturalWidth,ic.naturalHeight,sx-27,sy-27,54,54);
    else{CX.font='24px serif';CX.textAlign='center';CX.textBaseline='middle';CX.fillText(it.emoji||'⭐',sx,sy+1);}
    const txt=String(it.desc||it.type).replace(/[!¡]/g,'').toUpperCase().slice(0,22);
    CX.font="bold 9px 'Press Start 2P',monospace";CX.textAlign='center';CX.textBaseline='middle';
    const tw=CX.measureText(txt).width+14;
    CX.fillStyle='rgba(0,0,20,.82)';CX.strokeStyle=col;CX.lineWidth=1.5;
    CX.beginPath();if(CX.roundRect)CX.roundRect(sx-tw/2,sy+31,tw,16,8);else CX.rect(sx-tw/2,sy+31,tw,16);CX.fill();CX.stroke();
    CX.fillStyle='#fff';CX.fillText(txt,sx,sy+39.5);
    CX.restore();
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
        // cráter brillante bajo el poder que espera (respaldo si no cargó la imagen del cráter)
        if(tx<-60||tx>W+60||m.cratera)continue;
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
    dibujarAnims();
    for(const it of skyItems){const m=it._met;if(!m||it.taken||m.fase!=='reposo'||m.parp)continue;reposo(it);}
  });
 }});
})();
