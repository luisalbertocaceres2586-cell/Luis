import {open} from './lib.mjs';
const seeds=(process.argv[2]||'1,2,3').split(',').map(Number);
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html',{wait:300});
const res=await page.evaluate(async (seeds)=>{
  const out=[];
  for(const seed of seeds){
    document.getElementById('ini')&&document.getElementById('ini').remove();
    await Nivel1.iniciar({heroe:seed%2?'sakura':'kage',semilla:seed});
    const S=Nivel1._estado(), K=Nivel1._debug.keys, N=S.N, h=S.h, core=window.N1core, G=560;
    const sueloEn=px=>N.suelo.some(s=>px>=s.x0-4&&px<=s.x1+4);
    const platEn=px=>N.plat.some(p=>px>=p.X&&px<=p.X+p.w&&p.estado!=='caida');
    let quieto=false; let pasos=0, ult=h.x, ultT=0, stuck=null; const hechos=new Set(); let jefeVisto=false, embVisto=false, rocaVisto=false;
    while(pasos<60*2400 && !S.fin){
      const x=h.x;
      quieto=false; K.ArrowRight=1;K.ArrowLeft=0;K.Space=0;K.KeyC=0;K.KeyF=0;
      // --- módulos especiales: se salta el contenido que requiere habilidad fina ---
      for(const sp of N.especiales){ if(hechos.has(sp)) continue; if(x>sp.x0+30&&x<sp.x1){
        if(sp.tipo==='emboscada') continue;
        hechos.add(sp);
        if(sp.tipo==='palanca'){ N.elem.filter(t=>t.t==='palanca'&&t.x>sp.x0&&t.x<sp.x1).forEach(t=>{t.on=true;N.muros.forEach(m=>{if(m.id===t.id)m.abierta=true;});}); }
        h.x=sp.x1+25; h.y=G-60; h.vy=0; }}
      // --- emboscada: se derrotan las oleadas ---
      const emb=N.elem.find(t=>t.t==='emb'&&t.estado===1); if(emb){ embVisto=true; if(pasos%40===0){ const v=S.enemigos.find(q=>q.emb===emb&&q.vivo); if(v) v.vivo=false; } }
      if(N.elem.some(t=>t.t==='emb'&&t.estado===2)) embVisto=true;
      // --- jefe ---
      const jefe=S.enemigos.find(q=>q.kind==='oni');
      if(jefe&&jefe.vivo&&window.N1core&&Math.abs(jefe.x-x)<700){ const el=N.elem.find(t=>t.t==='jefe'); if(el&&el.estado===1){ jefeVisto=true; jefe.inv=0; if(pasos%20===0){ h.x=jefe.x-100; h.dir=1; h.y=G; h.vy=0; } K.KeyC=1; } }
      // --- estaciones ---
      for(const e of S.est){ if(e.resuelta) continue; if(x>e.x0+80&&x<e.x0+e.ancho){
        const lst=e.objetos;
        if(e.mecanica==='encender_farol'||e.mecanica==='romper_bloques'||e.mecanica==='diana'){ const c=lst.find(o=>o.correcto); S.estSel=e; core.golpearObjetivo(e,c,'tajo'); }
        else if(e.mecanica==='antorchas'){ S.estSel=e; const o=lst.find(q=>q.idx===e.sig); core.golpearObjetivo(e,o,'tajo'); }
        else if(e.mecanica==='piedras'){ const c=lst.find(o=>o.correcta); h.x=c.x+c.w/2; h.y=c.Y; h.vy=0; }
        else if(e.mecanica==='empujar_carreta'){ const pad=e.pads.find(p=>p.correcto); e.cart.x=pad.x; e.cart.x0=e.cart.x0; if(h.x>pad.x-250) h.x=e.x0+120; quieto=true; }
      }}
      // --- saltos y ataques ---
      const huecoAd=!sueloEn(x+95)&&!platEn(x+95);
      const haz=N.haz.some(z=>z.x-x<175&&z.x-x>40);
      const en=S.enemigos.some(e=>e.vivo&&e.kind!=='oni'&&e.kind!=='tengu'&&e.kind!=='murcielago'&&e.kind!=='aranaTecho'&&e.x-x>20&&e.x-x<120);
      const cart=N.elem.some(t=>t.t==='carreta'&&t.x-x<170&&t.x-x>-30);
      if(h.suelo&&(huecoAd||haz||cart)){K.Space=1;h.buffer=.12;}
      if(!h.suelo&&h.vy<0)K.Space=1;
      if(en||N.muros.some(m=>m.rompible&&!m.roto&&m.x-x<110&&m.x-x>0))K.KeyC=1;
      if(h.suelo&&!sueloEn(x+60)&&!platEn(x+60)){K.Space=1;h.buffer=.12;}
      if(quieto){K.ArrowRight=0;K.Space=0;K.KeyC=0;}
      Nivel1._debug.paso(1); pasos++;
      if(S.rocaActivaFlag===undefined&&window.N1core&&N.elem.some(t=>t.t==='roca'&&t.activa)) rocaVisto=true;
      if(pasos%60===0){ if(h.x-ult<20&&h.suelo&&!S.pausa) ultT++; else ultT=0; ult=h.x; if(ultT>10){ stuck={x:Math.round(h.x),y:Math.round(h.y),vida:h.vida,estSel:S.estSel&&S.estSel.mecanica,muroCerca:N.muros.filter(m=>Math.abs(m.x-h.x)<200).map(m=>m.tipo+':'+(m.abierta?'A':'C'))}; break; } }
    }
    out.push({seed,ok:!!S.fin,min:Math.round(S.tiempo/6)/10,vida:h.vida,aciertos:S.aciertos+'/'+S.est.length,errores:S.errores,jefeVisto,embVisto,rocaVisto,stuck,x:Math.round(h.x),ancho:N.ancho});
    Nivel1.cerrar(true);
  }
  return out;
},seeds);
res.forEach(r=>console.log(JSON.stringify(r)));
console.log(logs.filter(l=>/PAGEERROR/.test(l)).slice(0,5).join('\n')||'sin errores de JS');
await browser.close();
