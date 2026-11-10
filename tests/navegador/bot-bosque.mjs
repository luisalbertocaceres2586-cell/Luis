import {open} from './lib.mjs';
const seeds=(process.argv[2]||'1,2,3,4,5').split(',').map(Number);
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html',{wait:300});
const res=await page.evaluate(async (seeds)=>{
  const out=[];
  for(const seed of seeds){
    document.getElementById('ini')&&document.getElementById('ini').remove();
    await Nivel1.iniciar({heroe:seed%2?'sakura':'kage',semilla:seed});
    const S=Nivel1._estado(), K=Nivel1._debug.keys, N=S.N, h=S.h;
    // detener el bucle de dibujo no es necesario: avanzamos la simulación a mano
    let pasos=0, ult=h.x, ultT=0, atascado=null, hecho=false;
    const sueloEn=px=>N.suelo.some(s=>px>=s.x0-4&&px<=s.x1+4), platEn=px=>N.plat.some(p=>px>=p.x&&px<=p.x+p.w&&p.estado!=='caida');
    while(pasos<60*900 && !S.fin){
      const x=h.x;
      K.ArrowRight=1; K.ArrowLeft=0; K.Space=0; K.KeyC=0;
      // acertijos: se resuelven al llegar a la estación
      for(const e of S.est){ if(e.resuelta) continue;
        if(x>e.x0+60 && x<e.x0+e.ancho){
          const c=e.objetos.find(o=>o.correcto||o.correcta);
          if(e.mecanica==='encender_farol'){ h.x=c.x; h.y=c.y+30; h.vy=0; }
          else if(e.mecanica==='romper_bloques'){ h.x=c.x-70; h.y=c.y+40; h.dir=1; h.atk=.28; }
          else if(e.mecanica==='diana'){ S.shur.push({x:c.x-5,y:c.y,vx:700,t:1,a:0}); }
          else if(e.mecanica==='piedras'){ h.x=c.x+c.w/2; h.y=c.y; h.vy=0; }
        } }
      // saltos: hueco adelante, trampas, enemigos
      const huecoAd=!sueloEn(x+95)&&!platEn(x+95);
      const haz=N.haz.some(z=>z.x-x<175&&z.x-x>40);
      const en=S.enemigos.some(e=>e.vivo&&e.x-x>20&&e.x-x<110);
      if(h.suelo&&(huecoAd||haz)){ K.Space=1; h.buffer=.12; }
      if(!h.suelo&&h.vy<0) K.Space=1;
      if(en){ K.KeyC=1; }
      // piedras: ya resuelta -> salta en los bordes
      if(h.suelo&&!sueloEn(x+60)&&!platEn(x+60)) { K.Space=1; h.buffer=.12; }
      Nivel1._debug.paso(1); pasos++;
      if(pasos%60===0){ if(h.x-ult<20 && h.suelo){ ultT++; } else ultT=0; ult=h.x; if(ultT>8){ atascado=[Math.round(h.x),Math.round(h.y)]; break; } }
    }
    const pend=S.est.filter(e=>!e.resuelta).map(e=>({m:e.mecanica,x0:e.x0,ancho:e.ancho,puerta:e.puertaX,obj:e.objetos.map(o=>[o.estado,o.correcto||o.correcta?1:0])}));
    out.push({seed, pend:pend.slice(0,1), hy:Math.round(h.y), hvy:Math.round(h.vy), suelo:h.suelo, ok: !!S.fin, tiempoSim:Math.round(S.tiempo), vidas:h.vida, aciertos:S.aciertos, errores:S.errores, atascado, x:Math.round(h.x), ancho:N.ancho});
    Nivel1.cerrar(true);
  }
  return out;
}, seeds);
res.forEach(r=>console.log(JSON.stringify(r)));
console.log(logs.filter(l=>/PAGEERROR/.test(l)).slice(0,5).join('\n')||'sin errores de JS');
await browser.close();
