// Prueba en navegador real (física y dibujo) del director de eventos — Fase 2.
// Uso:  python3 -m http.server 8123   (en la raíz del repo)   y luego   node tests/navegador/director.mjs
// Guarda una captura de cada evento en /tmp/evento_<id>.png
import {open} from './lib.mjs';
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html',{wait:300});

const R=await page.evaluate(async()=>{
  const G=560, sleep=ms=>new Promise(r=>setTimeout(r,ms)), out={};
  const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  async function nuevo(op){
    document.getElementById('ini')&&document.getElementById('ini').remove();
    await Nivel1.iniciar(Object.assign({heroe:'sakura',semilla:7,director:false},op||{}));
    const S=Nivel1._estado(); return {S,K:Nivel1._debug.keys,paso:Nivel1._debug.paso,core:window.N1core,h:S.h,D:S.dir,N1dir:window.N1dir};
  }
  // Arena de prueba: el nivel es denso, así que se limpia un tramo largo (enemigos, trampas, muros, plataformas, módulos) y se le pone suelo continuo.
  // Devuelve la x donde colocar al héroe. En la cueva: un tramo corto de la cueva sin acertijos cerca.
  function libre(S,cueva){
    const N=S.N, d=window.N1dir, quita=(arr,f)=>{for(let i=arr.length-1;i>=0;i--) if(f(arr[i])) arr.splice(i,1);};
    const ini=cueva?N.cueva.x+800:2000, fin=cueva?N.ancho-4000:N.cueva.x-1500;
    for(let x=ini;x<fin;x+=100){
      if(S.est.some(e=>x>e.x0-700&&x<e.x0+e.ancho+300||(e.x0>x&&e.x0<x+2900))) continue;
      const a=x-900, b0=x+2900; quita(N.especiales,sp=>sp.x1>a&&sp.x0<b0);
      const bar=cueva?Infinity:d.barreraFuego(N,x); if(!cueva&&bar-x<2300) continue;
      const b=cueva?b0:Math.min(bar,x+9000);
      quita(N.enem,e=>e.x>a&&e.x<b); quita(N.haz,z=>z.x+z.w>a&&z.x<b); quita(N.muros,m=>m.x+m.w>a&&m.x<b); quita(N.tambores,t=>t.x>a&&t.x<b); quita(N.plat,p=>p.x+p.w>a&&p.x<b);
      quita(N.elem,t=>{const q=t.x!==undefined?t.x:t.x0, r=t.x1!==undefined?t.x1:q;return r>a&&q<b;}); N.suelo.push({x0:a,x1:b});
      return x;
    } throw new Error('sin tramo para la arena en la semilla '+S.params.semilla);
  }
  const colocar=(S,h,x)=>{h.x=x;h.y=G;h.vx=0;h.vy=0;h.suelo=true;S.cam=Math.max(0,x-430);};
  window.__libre=libre; window.__colocar=colocar;
  const neutro=m=>m.g===1&&m.gc===1&&m.jv===1&&m.ag===1&&m.fr===1&&m.vv===0&&m.noche===0;

  // ---------- 🌪️ VIENTO ----------
  { const t=await nuevo(); const {S,K,paso,h,D,N1dir}=t, x=libre(S)+400; colocar(S,h,x); paso(3); N1dir._lanzar('viento',true); const a=D.activo; a.amp=200;
    const fase=sg=>{let b=0,bf=0;for(let f=0;f<6.28;f+=.02){const v=sg*N1dir.ondaViento(3,f);if(v>b){b=v;bf=f;}}return [bf,b];};
    const [fp,vp]=fase(1); a.fase=fp; for(let i=0;i<120;i++){a.t=3;paso(1);} const vxPos=h.vx, xPos=h.x;
    const [fn,vn]=fase(-1); a.fase=fn; for(let i=0;i<120;i++){a.t=3;paso(1);} const vxNeg=h.vx;
    colocar(S,h,x); K.ArrowRight=1; for(let i=0;i<60;i++){a.t=3;paso(1);} const vxContra=h.vx; K.ArrowRight=0;
    out.viento={vxPos:Math.round(vxPos),vxNeg:Math.round(vxNeg),corriendoContraViento:Math.round(vxContra),derivaPx:Math.round(xPos-x),ondaMax:+vp.toFixed(2)}; }

  // ---------- 🧊 SUELO RESBALADIZO ----------
  async function patinar(ev){
    const t=await nuevo(); const {S,K,paso,h,D,N1dir}=t, x=libre(S)+300; colocar(S,h,x); paso(3); if(ev){N1dir._lanzar('resbala',true);}
    const fija=()=>{if(ev){D.activo.t=1;D.k=1;}}; K.ArrowRight=1; let v12=0; for(let i=0;i<60;i++){fija();paso(1);if(i===11)v12=h.vx;}
    const x0=h.x; K.ArrowRight=0; for(let i=0;i<120;i++){fija();paso(1);} return {v12:Math.round(v12),desliza:Math.round(h.x-x0)};
  }
  { const sin=await patinar(false), con=await patinar(true); out.resbala={sin,con}; }

  // ---------- 🌙 GRAVEDAD ----------
  async function saltar(ev){
    const t=await nuevo(); const {S,K,paso,core,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); if(ev) N1dir._lanzar('gravedad',true);
    const fija=()=>{if(ev){D.activo.t=1;D.k=1;}}; for(let i=0;i<110;i++){fija();paso(1);} // sube k
    colocar(S,h,x); paso(2); K.Space=1; core.pulsar('Space'); let min=h.y, aire=0; for(let i=0;i<260;i++){fija();paso(1);min=Math.min(min,h.y);if(!h.suelo)aire++;else if(i>5)break;} K.Space=0;
    return {alto:Math.round(G-min),aire};
  }
  { const sin=await saltar(false), con=await saltar(true); out.gravedad={sin,con}; }

  // ---------- 🌆 ANOCHECER ----------
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); const osc0=S.osc; N1dir._lanzar('noche',true); for(let i=0;i<160;i++) paso(1);
    const osc1=S.osc, tutoCueva=!!S.tutoVisto.oscuro; N1dir._salir(D.activo,'natural'); for(let i=0;i<160;i++) paso(1); out.noche={antes:+osc0.toFixed(2),durante:+osc1.toFixed(2),despues:+S.osc.toFixed(2),tutorialDeCuevaEnElBosque:tutoCueva,modNeutro:neutro(S.mod)}; }

  // ---------- 🪨 ROCAS ----------
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); N1dir._lanzar('rocas',true); const a=D.activo; a.sig=.05; const vistas=new Set(); let aviso=false;
    for(let i=0;i<720;i++){h.inv=10;h.x=x;h.y=G;h.vx=0;paso(1);D.rocas.forEach(r=>{vistas.add(r);if(r.estado==='aviso'&&r.tAv>0)aviso=true;});}
    const t2=await nuevo(); const v0=t2.h.vida; colocar(t2.S,t2.h,x); t2.paso(3); const mk=(dx,tAv)=>({x:t2.h.x+dx,y:G,tAv,caida:.55,estado:'aviso',r:34,ang:0,f:[1,1,1,1,1,1,1],yy:-120});
    t2.D.rocas.push(mk(700,.6)); for(let i=0;i<70;i++){t2.h.x=x;t2.paso(1);} const lejos=t2.h.vida; t2.D.rocas.push(mk(0,.6)); for(let i=0;i<70;i++){t2.h.x=x;t2.paso(1);}
    out.rocas={cayeron:vistas.size,conAvisoRojo:aviso,sinRocasAlFinal:true,danioLejos:v0-lejos,danioEncima:lejos-t2.h.vida,quedan:t2.D.rocas.length}; }

  // ---------- 🔥 FUEGO ----------
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); N1dir._lanzar('fuego',true); const f=D.fuego, x0f=f.x;
    for(let i=0;i<420;i++) paso(1); out.fuegoQuieto={arrancaDetras:Math.round(x-x0f),herido:h.vida<5,tocado:f.tocado}; }
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); const perg0=S.pergaminos; N1dir._lanzar('fuego',true); const f=D.fuego, barrera=f.barrera; let maxF=0, i=0, hx=x;
    for(;i<4000&&D.activo;i++){hx+=340/60;h.x=hx;h.y=G;h.vy=0;h.suelo=true;paso(1);maxF=Math.max(maxF,f.x);}
    out.fuegoCorriendo={terminó:!D.activo,fuegoTocoAlHeroe:f.tocado,pergaminos:S.pergaminos-perg0,fuegoMaxX:Math.round(maxF),barrera:Math.round(barrera),noPasaBarrera:maxF<=barrera+6,seg:+(i/60).toFixed(1),sinFuego:D.fuego===null}; }
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); h.vida=1; N1dir._lanzar('fuego',true); const a=D.activo; paso(3); out.fuegoPiedad={sale:a.sale,motivo:a.motivo}; }

  // ---------- el director sortea solo ----------
  async function simular(seed,frames,cueva){
    const t=await nuevo({director:true,directorRng:mulberry(seed)}); const {S,paso,h,D}=t, x=libre(S,cueva); colocar(S,h,x); S.t=100; D.espera=0; if(cueva) S.zonaVista='cueva';
    const vistos=new Set(); for(let i=0;i<frames;i++){h.inv=10;h.x=x;h.y=G;h.vx=0;h.vy=0;h.suelo=true;paso(1);if(D.activo)vistos.add(D.activo.id);}
    return {hist:D.hist.slice().reverse().join(','),n:D.contados,vistos:[...vistos]};
  }
  { const a=await simular(7,9000), a2=await simular(7,9000), b=await simular(8,9000); out.sorteo={a:a.hist,a2:a2.hist,b:b.hist,n:a.n}; }
  { const c=await simular(3,16000,true); out.cueva={n:c.n,vistos:c.vistos}; }

  // ---------- acertijos = zona de calma ----------
  { const t=await nuevo({director:true,directorRng:mulberry(4)}); const {S,paso,h,D}=t, e=S.est[0]; colocar(S,h,e.x0+60); h.y=G; S.t=100; D.espera=0; for(let i=0;i<3000;i++){h.inv=10;paso(1);} out.calma={eventosEnAcertijo:D.contados}; }
  { const t=await nuevo(); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); paso(3); N1dir._lanzar('viento',false); const a=D.activo; for(let i=0;i<120;i++) paso(1); const t0=a.t, k0=D.k;
    const e=S.est[0]; colocar(S,h,e.x0+60); for(let i=0;i<150;i++){h.inv=10;paso(1);} const congelado=Math.abs(a.t-t0)<.01, kBaja=D.k<.05, vv0=Math.abs(S.mod.vv)<1;
    colocar(S,h,x); for(let i=0;i<150;i++){h.inv=10;paso(1);} out.pausa={avanzabaAntes:t0>1,k0:+k0.toFixed(2),congelado,kBaja,vientoApagado:vv0,reanuda:a.t>t0+.5,kVuelve:D.k>.9}; }

  // ---------- ayuda al estudiante que anda mal ----------
  { const t=await nuevo({director:true,directorRng:mulberry(5)}); const {S,paso,h,D,N1dir}=t, x=libre(S); colocar(S,h,x); S.t=100; D.espera=0; S.errores=5; N1dir.alMuerte(); N1dir.alMuerte();
    for(let i=0;i<2400;i++){h.inv=10;h.vida=2;h.x=x;h.y=G;h.vx=0;h.suelo=true;paso(1);} out.apuros={eventos:D.contados,dominio:+D.dom.toFixed(2)}; }
  { const t=await nuevo({director:true,directorRng:mulberry(6)}); const {S,paso,h,D}=t, x=libre(S); colocar(S,h,x); S.t=100; h.vida=1; D.regaloT=-999; const n0=S.items.length; let r1=0;
    for(let i=0;i<3600;i++){h.inv=10;h.vida=1;h.x=x;h.y=G;h.vx=0;h.suelo=true;paso(1);} r1=S.items.filter(i=>i.regalo).length;
    const don=S.items.find(i=>i.regalo); const alc=don&&don.x>x+300&&don.x<x+1000&&window.N1dir.superficie(S.N,don.x)===G;
    for(let i=0;i<3600;i++){h.inv=10;h.vida=1;h.x=x;h.y=G;h.vx=0;h.suelo=true;paso(1);} out.regalo={alMinuto:r1,alMinuto2:S.items.filter(i=>i.regalo).length,sobreSuelo:!!alc,tipo:don&&don.tipo}; }

  // ---------- dibujo: cada evento con el bucle real, sin errores ----------
  { out.dibujo={}; for(const id of ['viento','resbala','gravedad','noche','rocas','fuego']){
      const t=await nuevo({evento:id}); const {S,h,D}=t, x=libre(S); colocar(S,h,x); S.t=3; h.inv=1e6; await sleep(2600); out.dibujo[id]={lanzado:D.contados,primero:D.hist[0]};
      window['__shot_'+id]=true; await sleep(150); } }
  return out;
});

// capturas de cada evento: arena de prueba, héroe quieto e invulnerable, y la simulación avanza hasta que el evento está en plena intensidad
const shots=[]; for(const id of ['viento','resbala','gravedad','noche','rocas','fuego']){
  await page.evaluate(async(id)=>{
    await Nivel1.iniciar({heroe:'kage',semilla:7,director:false}); const S=Nivel1._estado(), h=S.h, D=S.dir, d=window.N1dir, paso=Nivel1._debug.paso;
    const x=window.__libre(S)+300; window.__colocar(S,h,x); h.inv=1e6; S.t=3; paso(8); d._lanzar(id,true); const a=D.activo;
    if(id==='viento'){let b=0,bf=0;for(let f=0;f<6.28;f+=.02){const v=d.ondaViento(3,f);if(v>b){b=v;bf=f;}} a.fase=bf; a.amp=210; for(let i=0;i<130;i++){a.t=3;paso(1);}}
    else if(id==='fuego') paso(150); else if(id==='rocas'){a.sig=.05; paso(100);} else paso(130);
  },id);
  await new Promise(r=>setTimeout(r,id==='rocas'?150:350)); await page.screenshot({path:'/tmp/evento_'+id+'.png'}); shots.push(id); }

const ok=[],mal=[]; const chk=(n,c,det)=>{(c?ok:mal).push(n+(det!==undefined?'  '+JSON.stringify(det):''));};
const v=R.viento; chk('viento: quieto, te arrastra en la dirección del viento (ambos sentidos)',v.vxPos>100&&v.vxNeg<-100,v); chk('viento: corriendo contra el viento avanzas bastante menos que 340',v.corriendoContraViento<230,v.corriendoContraViento);
const rs=R.resbala; chk('resbala: arrancas más despacio',rs.con.v12<rs.sin.v12*.6,rs); chk('resbala: al soltar las flechas patinas mucho más',rs.con.desliza>rs.sin.desliza*3+30,rs);
const g=R.gravedad; chk('gravedad lunar: saltas más alto',g.con.alto>=g.sin.alto*1.2,g); chk('gravedad lunar: pasas mucho más tiempo en el aire',g.con.aire>=g.sin.aire*1.3,g);
const nc=R.noche; chk('anochecer: oscurece el bosque y luego vuelve',nc.antes<.05&&nc.durante>.7&&nc.despues<.05,nc); chk('anochecer: no muestra el consejo de "la cueva"',!nc.tutorialDeCuevaEnElBosque); chk('anochecer: al terminar los modificadores quedan neutros',nc.modNeutro);
const rc=R.rocas; chk('rocas: caen varias y avisan con sombra roja',rc.cayeron>=4&&rc.conAvisoRojo,rc); chk('rocas: una lejos no hiere',rc.danioLejos===0,rc.danioLejos); chk('rocas: una encima sí hiere (1 corazón)',rc.danioEncima===1,rc.danioEncima); chk('rocas: se deshacen al caer',rc.quedan===0,rc.quedan);
const fq=R.fuegoQuieto; chk('fuego: arranca ~650 px detrás',fq.arrancaDetras>=600&&fq.arrancaDetras<=700,fq.arrancaDetras); chk('fuego: si te quedas quieto te alcanza y te quema',fq.herido&&fq.tocado,fq);
const fc=R.fuegoCorriendo; chk('fuego: corriendo escapas (el fuego nunca te toca) y ganas +5 pergaminos',fc.terminó&&!fc.fuegoTocoAlHeroe&&fc.pergaminos>=5,fc); chk('fuego: nunca pasa de su barrera',fc.noPasaBarrera,fc); chk('fuego: al final no queda llama',fc.sinFuego);
chk('fuego: si andas con 1 corazón se corta por piedad',R.fuegoPiedad.sale===true&&R.fuegoPiedad.motivo==='piedad',R.fuegoPiedad);
const so=R.sorteo; chk('sorteo: el director lanza varios eventos solo',so.n>=3,so.n); chk('sorteo: misma semilla del azar = misma secuencia',so.a===so.a2,so); chk('sorteo: otra semilla del azar = otra secuencia',so.a!==so.b,so);
chk('cueva: solo eventos de su repertorio (nunca fuego ni anochecer)',R.cueva.n>=2&&R.cueva.vistos.every(e=>['viento','gravedad','resbala','rocas'].indexOf(e)>=0),R.cueva);
chk('acertijo: zona de calma, no se lanza nada',R.calma.eventosEnAcertijo===0,R.calma); const p=R.pausa; chk('acertijo: el evento en curso se congela y se apaga, y se reanuda al salir',p.avanzabaAntes&&p.congelado&&p.kBaja&&p.vientoApagado&&p.reanuda&&p.kVuelve,p);
chk('apuros: con muy poca vida y errores el director se calla',R.apuros.eventos===0&&R.apuros.dominio<.28,R.apuros); const rg=R.regalo; chk('apuros: con 1 corazón regala UN onigiri por delante, sobre suelo, y otro recién pasado 75 s',rg.alMinuto===1&&rg.sobreSuelo&&rg.tipo==='onigiri'&&rg.alMinuto2===2,rg);
chk('dibujo: los 6 eventos se lanzan y se dibujan con el bucle real (la consola queda limpia)',Object.keys(R.dibujo).length===6&&Object.entries(R.dibujo).every(([id,e])=>e.lanzado===1&&e.primero===id),R.dibujo);
const errs=logs.filter(l=>/PAGEERROR|error:/i.test(l)&&!/favicon|ERR_FILE|Failed to load resource/i.test(l)); chk('sin errores en la consola',errs.length===0,errs.slice(0,3));
ok.forEach(x=>console.log('  ✓ '+x)); mal.forEach(x=>console.log('  ✗ '+x)); console.log('\n'+ok.length+' bien · '+mal.length+' mal · capturas: '+shots.join(', '));
await browser.close(); process.exit(mal.length?1:0);
