/* engine/secretos — Tubería secreta del Nivel 1 🟢
   Hay una tubería distinta a las demás: de vez en cuando suelta una chispa dorada. Párate junto a ella y mantén ⬇
   (S o el botón BAJAR) un momento: te lleva a una SALA SECRETA con lluvia de monedas, +1 vida y puntos.
   Solo se puede usar una vez por partida. */
(function(){
if(!window.NinjaMods)return;
const U=()=>NinjaMods.util;
const TUBO=5;                       // número de tubería (la 6.ª de izquierda a derecha)
NinjaMods.register({id:'tuberia-secreta',carpeta:'secretos',nombre:'Tubería secreta (Nivel 1)',
 desc:'Secreto: una tubería escondida suelta chispas doradas. Mantén ⬇ junto a ella para entrar a una sala de tesoros.',
 init(){
  let hold=0,usada=false,sala=null,chispa=0;
  const MAX=70;
  NinjaMods._tubo=()=>({hold,usada,ok:typeof pipes!=='undefined'&&!!pipes[TUBO]});
  const st=document.createElement('style');st.textContent=`
  #salaSec{position:fixed;inset:0;z-index:10050;display:none;background:radial-gradient(ellipse at 50% 30%,#5A1A00 0%,#240800 55%,#0a0200 100%);overflow:hidden;touch-action:none}
  #salaSec.on{display:block}
  #salaSec .ss-t{z-index:5;position:absolute;top:10px;left:0;right:0;text-align:center;font-family:'Press Start 2P',monospace;color:#FFD54A;font-size:clamp(11px,2.6vw,20px);text-shadow:0 0 14px #FF8A00,3px 3px 0 #000}
  #salaSec .ss-s{z-index:5;position:absolute;top:calc(10px + clamp(24px,5vw,38px));left:0;right:0;text-align:center;font-family:'Press Start 2P',monospace;color:#FFE9B8;font-size:clamp(7px,1.5vw,10px)}
  #salaSec .ss-c{position:absolute;font-size:clamp(28px,6vw,44px);cursor:pointer;user-select:none;filter:drop-shadow(0 0 8px #FFB300);will-change:transform}
  #salaSec .ss-l{position:absolute;top:-10px;font-size:34px;animation:ssSw 2.4s ease-in-out infinite alternate}
  @keyframes ssSw{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
  #salaSec .ss-b{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);font-family:'Press Start 2P',monospace;font-size:clamp(9px,2vw,13px);padding:12px 20px;border-radius:12px;border:2px solid #FFD54A;background:#7A2A00;color:#fff;display:none;cursor:pointer}`;
  document.head.appendChild(st);
  const el=document.createElement('div');el.id='salaSec';
  el.innerHTML='<div class="ss-l" style="left:12%">🏮</div><div class="ss-l" style="left:50%;animation-delay:.6s">🏮</div><div class="ss-l" style="left:86%;animation-delay:1.1s">🏮</div><div class="ss-t">⛩️ SALA SECRETA ⛩️</div><div class="ss-s" id="ssS">¡Toca las monedas!</div><button class="ss-b" id="ssB">VOLVER</button>';
  document.body.appendChild(el);
  document.getElementById('ssB').onclick=salir;

  function entrar(){
    usada=true;hold=0;sala={pts:0,t0:performance.now(),monedas:0,fin:false};
    NinjaMods.pausaMundo=true;
    el.classList.add('on');document.getElementById('ssB').style.display='none';
    document.getElementById('ssS').textContent='¡Toca las monedas!  0 pts';
    try{U().vibrar(60);if(window.SFX&&SFX.life)SFX.life();}catch(e){}
    let n=0;const id=setInterval(()=>{
      if(!sala||sala.fin){clearInterval(id);return;}
      if(performance.now()-sala.t0>9000){clearInterval(id);cerrar();return;}
      moneda(++n);
    },260);
  }
  function moneda(n){
    const c=document.createElement('div');c.className='ss-c';c.textContent=n%7===0?'💎':'🪙';
    const val=n%7===0?150:30;
    c.style.left=(6+Math.random()*86)+'%';c.style.top='-50px';
    let y=-50;const vel=2.2+Math.random()*2.4;
    c.onpointerdown=e=>{e.preventDefault();if(!sala||sala.fin||c._x)return;c._x=1;sala.pts+=val;sala.monedas++;
      document.getElementById('ssS').textContent='¡Toca las monedas!  '+sala.pts+' pts';c.style.transition='transform .25s,opacity .25s';c.style.transform='scale(1.8)';c.style.opacity='0';
      U().vibrar(12);setTimeout(()=>c.remove(),260);};
    el.appendChild(c);
    (function caer(){if(!c.isConnected||c._x)return;y+=vel;c.style.top=y+'px';if(y>innerHeight+60){c.remove();return;}requestAnimationFrame(caer);})();
  }
  function cerrar(){
    if(!sala||sala.fin)return;sala.fin=true;
    const pts=sala.pts+300,vida=GS.lives<8?1:0;
    GS.lives+=vida;GS.score+=pts;GS.totalScore+=pts;
    document.getElementById('ssS').innerHTML='🪙 '+sala.monedas+' monedas · +'+pts+' puntos'+(vida?' · +1 ❤️ VIDA':' · ¡vidas al máximo!');
    document.getElementById('ssB').style.display='block';
    try{updHUD();U().vibrar(80);}catch(e){}
  }
  function salir(){
    el.classList.remove('on');el.querySelectorAll('.ss-c').forEach(c=>c.remove());sala=null;NinjaMods.pausaMundo=false;hold=0;
    try{U().banner('⛩️ ¡SECRETO ENCONTRADO!','Guárdalo para ti, ninja','#FFD54A');}catch(e){}
  }

  NinjaMods.after('update',function(){
    if(typeof P==='undefined'||!P||!GS.running||GS.level!==0||usada||typeof pipes==='undefined'||!pipes[TUBO]||!P.alive)return;
    const pp=pipes[TUBO],cx=P.x+P.w/2,junto=cx>pp.x-16&&cx<pp.x+pp.w+16&&P.onGround;
    // chispa dorada de vez en cuando (la pista para encontrarla)
    if(++chispa>150){chispa=0;const sx=pp.x-camX+pp.w/2;if(sx>-40&&sx<W+40){try{spawnPfx(sx,pp.y-2,'#FFD54A',3);}catch(e){}}}
    const abajo=K['ArrowDown']||K['KeyS'];
    if(junto&&abajo&&Math.abs(P.vx||0)<.6){hold++;if(hold>=MAX)entrar();}
    else hold=Math.max(0,hold-3);
  });
  NinjaMods.after('render',function(){
    if(typeof P==='undefined'||!GS.running||hold<=4||usada)return;
    const h=U().heroXY(),fr=Math.min(1,hold/MAX);
    CX.save();CX.strokeStyle='#FFD54A';CX.lineWidth=4;CX.shadowColor='#FF9A00';CX.shadowBlur=12;CX.lineCap='round';
    CX.beginPath();CX.arc(h.x,h.y-P.h*.75,14,-Math.PI/2,-Math.PI/2+Math.PI*2*fr);CX.stroke();CX.restore();
  });
 }});
})();
