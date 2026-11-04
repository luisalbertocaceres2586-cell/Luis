/* engine/poderes — Impacto al recoger + aura con tiempo
   Al activarse un poder (gigante, imán, escudo, velocidad): destello, pausa breve, letrero, onda de choque y vibración.
   Mientras dura, un anillo de color alrededor del héroe se va vaciando y parpadea cuando queda poco. */
(function(){
if(!window.NinjaMods)return;
const DEFS=[
  {on:'giantOn',t:'giantTimer',name:'🦍 ¡GIGANTE!',sub:'¡Aplasta todo a tu paso!',col:'#FF4D4D'},
  {on:'magnetOn',t:'magnetTimer',name:'🧲 ¡IMÁN!',sub:'Las monedas vienen a ti',col:'#FFC400'},
  {on:'shieldOn',t:'shieldTimer',name:'🛡️ ¡ESCUDO!',sub:'Un golpe no te hará daño',col:'#00E5FF'},
  {on:'speedBoost',t:'speedTimer',name:'💨 ¡VELOCIDAD!',sub:'¡Corre como el viento!',col:'#7CFF6B'}
];
NinjaMods.register({id:'impacto-poderes',carpeta:'poderes',nombre:'Impacto y aura de los poderes',
 desc:'Destello, pausa, letrero y onda al recoger un poder; un anillo de color muestra cuánto tiempo le queda y parpadea al acabarse.',
 init(){
  const st={};DEFS.forEach(d=>st[d.on]={on:false,max:1,last:0});
  NinjaMods.after('update',function(){
    if(typeof P==='undefined'||!P||typeof GS==='undefined'||!GS.running)return;
    DEFS.forEach(d=>{
      const s=st[d.on],now=!!P[d.on]&&(P[d.t]||0)>0,t=P[d.t]||0;
      if(now&&(!s.on||t>s.last+30)){                          // recién activado (o se recogió otro igual)
        s.max=Math.max(t,1);
        try{
          const h=NinjaMods.util.heroXY();
          NinjaMods.util.flash(d.col);NinjaMods.util.banner(d.name,d.sub,d.col);NinjaMods.util.vibrar(35);NinjaMods.util.congelar(8);
          spawnShockwave(h.x,h.y,d.col,95);spawnPfx(h.x,h.y,d.col,22);
          if(window.SFX&&SFX.life)SFX.life();
        }catch(e){}
      }
      if(now&&t>s.max)s.max=t;
      s.on=now;s.last=t;
    });
  });
  NinjaMods.after('render',function(){
    if(typeof P==='undefined'||!P||!GS.running)return;
    const act=DEFS.filter(d=>st[d.on].on&&P[d.on]);if(!act.length)return;
    const h=NinjaMods.util.heroXY(),base=Math.max(P.w,P.h)*0.78,now=Date.now();
    act.forEach((d,i)=>{
      const s=st[d.on],t=P[d.t]||0,fr=Math.max(0,Math.min(1,t/s.max)),low=t<170;
      if(low&&Math.floor(now/110)%2===0)return;                // parpadea al final
      const r=base+i*7;
      CX.save();CX.lineCap='round';
      CX.strokeStyle='rgba(0,0,0,.35)';CX.lineWidth=5;CX.beginPath();CX.arc(h.x,h.y,r,0,Math.PI*2);CX.stroke();
      CX.strokeStyle=d.col;CX.lineWidth=3.5;CX.shadowColor=d.col;CX.shadowBlur=12+Math.sin(now/180)*5;
      CX.beginPath();CX.arc(h.x,h.y,r,-Math.PI/2,-Math.PI/2+Math.PI*2*fr);CX.stroke();
      CX.restore();
    });
  });
 }});
})();
