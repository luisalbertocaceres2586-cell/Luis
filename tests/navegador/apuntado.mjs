import {open} from './lib.mjs';
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html?auto=1&semilla=3&heroe=sakura',{wait:1500});
const r=await page.evaluate(async ()=>{
  const S=Nivel1._estado(),N=S.N,h=S.h,out={};
  const key=(t,c)=>window.dispatchEvent(new KeyboardEvent(t,{code:c,key:c,bubbles:true,cancelable:true}));
  const paso=n=>Nivel1._debug.paso(n);
  for(const mec of ['diana','romper_bloques','encender_farol']){
    const e=N.est.find(q=>q.mecanica===mec&&q.zona==='bosque'); if(!e){out[mec]='sin estación';continue;}
    h.x=e.x0+200;h.y=560;h.vy=0;h.vx=0;S.cam=h.x-430;paso(3);
    // 1) apuntar a la respuesta CORRECTA aunque haya otras delante
    const lst=e.objetos.slice().sort((a,b)=>a.x-b.x), idxC=lst.findIndex(o=>o.correcto);
    key('keydown','KeyF'); paso(2);
    const ap=S.apunta; if(!ap){out[mec]='no entró en modo apuntar';continue;}
    let n=0; while(ap.sel!==idxC&&n++<8){ key('keydown','ArrowRight'); key('keyup','ArrowRight'); paso(1); }
    const sel=ap.sel; key('keyup','KeyF'); paso(150);
    out[mec]={objetivos:lst.length,elegida:sel,correcta:idxC,resuelta:e.resuelta,errores:e.errores,vida:h.vida,estados:e.objetos.map(o=>o.estado).join(',')};
  }
  // tajo: un solo objetivo aunque haya dos en el arco
  const e2=N.est.find(q=>q.mecanica==='romper_bloques'&&!q.resuelta); if(e2){ h.x=e2.x0+200;h.y=360;h.vy=0;S.estSel=e2; const a=e2.objetos[0],b=e2.objetos[1]; b.x=a.x+30; b.y=a.y; h.x=a.x-60; h.dir=1; h.atk=.28; paso(2); out.tajo={rotos:e2.objetos.filter(o=>o.estado==='roto').length}; }
  return out;
});
console.log(JSON.stringify(r,null,1));
console.log(logs.filter(l=>/PAGEERROR/.test(l)).join('\n')||'sin errores de JS');
await browser.close();
