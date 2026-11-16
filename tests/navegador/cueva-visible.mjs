// Prueba en navegador real: en la CUEVA (oscura) todo lo que el estudiante necesita leer de un acertijo debe verse.
// Para cada mecánica (farol, piedras, diana, bloques, antorchas, carreta) se coloca al héroe en 3 puntos de la estación y se cuenta,
// leyendo los píxeles del canvas, cuántas etiquetas (los números) que están en pantalla son legibles.
// Uso:  python3 -m http.server 8123   (en la raíz del repo)   y luego   node tests/navegador/cueva-visible.mjs [prefijo-capturas]
// Guarda capturas en /tmp/<prefijo>_<mecanica>.png (por defecto "cueva")
import {open} from './lib.mjs';
const pref=process.argv[2]||'cueva';
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html',{wait:300});
// Se recorren TODAS las estaciones de la cueva de varias semillas (así salen las 6 mecánicas) y se mide dentro del navegador, que es donde se generan de verdad.
const SEMILLAS=[1,2,3]; const agg={}, malas=[], capt={};
for(const semilla of SEMILLAS){
  const info=await page.evaluate(async(semilla)=>{ await Nivel1.iniciar({heroe:'sakura',semilla,director:false}); const S=Nivel1._estado(); return S.est.map((e,i)=>({i,mec:e.mecanica,zona:e.zona,x0:e.x0,ancho:e.ancho})).filter(e=>e.zona==='cueva'); },semilla);
  for(const e of info){
    const puntos=[e.x0+120,e.x0+e.ancho/2,e.x0+e.ancho-260];
    for(let k=0;k<puntos.length;k++){
      const r=await page.evaluate(async(idx,hx)=>{
        const S=Nivel1._estado(), h=S.h, e=S.est[idx], G=560; h.x=hx; h.y=G; h.vx=0; h.vy=0; h.suelo=true; h.inv=0; S.cam=Math.max(0,hx-430);
        for(let i=0;i<120;i++){ h.x=hx; h.y=G; Nivel1._debug.paso(1); h.inv=0; }
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        const et=[]; const plataforma=p=>p.Y+(p.cy||0);
        if(e.mecanica==='piedras'){ S.N.plat.forEach(p=>{ if(p.tipo==='piedra_num'&&p.valor!==null&&p.valor!==undefined&&p.X>e.x0-50&&p.X<e.x0+e.ancho+50) et.push({x:p.X+p.w/2,y:plataforma(p)-14,t:'piedra '+p.valor}); }); }
        else if(e.mecanica==='empujar_carreta') e.pads.forEach(p=>et.push({x:p.x,y:G-40,t:'plataforma '+p.valor}));
        else e.objetos.forEach(o=>{ if(o.estado==='roto'||o.estado==='fallada') return;
          if(e.mecanica==='encender_farol') et.push({x:o.x,y:o.y-4,t:'farol '+o.valor}); else if(e.mecanica==='romper_bloques') et.push({x:o.x,y:o.y,t:'bloque '+o.valor});
          else if(e.mecanica==='diana') et.push({x:o.x,y:o.y+62,t:'diana '+o.valor}); else if(e.mecanica==='antorchas') et.push({x:o.x,y:o.y+70,t:'antorcha '+o.valor}); });
        const cv=[...document.querySelectorAll('#n1Root canvas')].sort((a,b)=>b.width*b.height-a.width*a.height)[0], c=cv.getContext('2d'), esc=cv.width/1280;
        const lista=et.map(q=>{ const sx=q.x-S.cam; if(sx<60||sx>1220||q.y<90||q.y>640) return null; const bx=Math.round((sx-32)*esc), by=Math.round((q.y-18)*esc), bw=Math.round(64*esc), bh=Math.round(36*esc);
          const d=c.getImageData(Math.max(0,bx),Math.max(0,by),bw,bh).data; let claros=0; for(let i=0;i<d.length;i+=4){ if(.3*d[i]+.59*d[i+1]+.11*d[i+2]>185) claros++; } return {t:q.t,sx:Math.round(sx),y:Math.round(q.y),claros}; }).filter(Boolean);
        return {mec:e.mecanica,osc:S.osc,lista};
      },e.i,puntos[k]);
      const A=agg[r.mec]=agg[r.mec]||{vistas:0,legibles:0,osc:1,estaciones:new Set(),peor:1e9};
      A.estaciones.add(semilla+':'+e.i); A.osc=Math.min(A.osc,r.osc); r.lista.forEach(q=>{ A.vistas++; A.peor=Math.min(A.peor,q.claros); if(q.claros>=35) A.legibles++; else malas.push({mec:r.mec,semilla,est:e.i,punto:k,...q}); });
      if(k===1&&!capt[r.mec]){ capt[r.mec]=1; await page.screenshot({path:'/tmp/'+pref+'_'+r.mec+'.png'}); }
    }
  }
}
const res=Object.entries(agg).map(([mec,A])=>({mec,estaciones:A.estaciones.size,osc:+A.osc.toFixed(2),vistas:A.vistas,legibles:A.legibles,peor:A.peor}));
const ok=[],mal=[]; const chk=(n,c,det)=>{(c?ok:mal).push(n+(det!==undefined?'  '+JSON.stringify(det):''));};
chk('se probaron las 6 mecánicas en la cueva',res.length===6,res.map(r=>r.mec)); res.forEach(r=>{ chk('cueva · '+r.mec+': todas las etiquetas en pantalla se pueden leer ('+r.estaciones+' estaciones, oscuridad '+r.osc+')',r.osc>.8&&r.vistas>=6&&r.legibles===r.vistas,r); });
if(malas.length) console.log('  ilegibles:',JSON.stringify(malas.slice(0,8)));
const errs=logs.filter(l=>/PAGEERROR|error:/i.test(l)&&!/favicon|ERR_FILE|Failed to load resource/i.test(l)); chk('sin errores en la consola',errs.length===0,errs.slice(0,3));
ok.forEach(x=>console.log('  ✓ '+x)); mal.forEach(x=>console.log('  ✗ '+x)); console.log('\n'+ok.length+' bien · '+mal.length+' mal');
await browser.close(); process.exit(mal.length?1:0);
