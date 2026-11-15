// Prueba en navegador real (física del juego) de las habilidades ninja de la Fase 1.
// Uso:  python3 -m http.server 8123   (en la raíz del repo)   y luego   node tests/navegador/habilidades.mjs
import {open} from './lib.mjs';
const {browser,page,logs}=await open('http://localhost:8123/nivel1.html',{wait:300});

const R=await page.evaluate(async()=>{
  const G=560, sleep=ms=>new Promise(r=>setTimeout(r,ms)), out={};
  async function nuevo(hab,semilla){
    document.getElementById('ini')&&document.getElementById('ini').remove();
    await Nivel1.iniciar({heroe:'sakura',semilla:semilla||1,habilidades:hab});
    const S=Nivel1._estado();
    return {S,K:Nivel1._debug.keys,paso:Nivel1._debug.paso,core:window.N1core,h:S.h};
  }
  const llano=(S,h,dx)=>{h.x=S.N.inicio.x+(dx||150);h.y=G;h.vx=0;h.vy=0;};

  // ---------- 💨 DASH ----------
  { const {S,K,paso,core,h}=await nuevo(['dash']); llano(S,h); paso(5); const x0=h.x; core.pulsar('ShiftLeft'); paso(10);
    const dist=Math.round(h.x-x0), v0=h.vida; core.danio('prueba',1,1); const protegido=h.vida===v0; paso(40); core.danio('prueba',1,1); const luego=h.vida===v0-1;
    // en el aire solo uno hasta tocar suelo
    llano(S,h,300); paso(2); K.Space=1; core.pulsar('Space'); paso(8); K.Space=0; const u0=S.hab.dash.usos; core.pulsar('ShiftLeft'); paso(24); core.pulsar('ShiftLeft'); paso(3);
    out.dash={dist,protegido,danioDespues:luego,unoEnElAire:S.hab.dash.usos===u0+1}; }

  // ---------- 🌀 DOBLE SALTO ----------
  async function altura(hab,segundo,tercero){
    const {S,K,paso,core,h}=await nuevo(hab); llano(S,h,200); paso(5); const y0=h.y; let min=h.y; K.Space=1; core.pulsar('Space');
    for(let i=0;i<80;i++){ paso(1); min=Math.min(min,h.y); if(segundo&&i===25){K.Space=0;paso(1);K.Space=1;core.pulsar('Space');} if(tercero&&i===50){K.Space=0;paso(1);K.Space=1;core.pulsar('Space');} }
    K.Space=0; return {alto:Math.round(y0-min),usos:S.hab.doble.usos};
  }
  { const a=await altura([],false), b=await altura(['doble'],true), c=await altura(['doble'],true,true); out.doble={simple:a.alto,doble:b.alto,usosConTercero:c.usos}; }

  // ---------- 🪂 PLANEO ----------
  async function caida(hab,mantener){ const {S,K,paso,h}=await nuevo(hab); llano(S,h,300); h.y=G-420; h.suelo=false; h.vy=0; K.Space=mantener?1:0; paso(40); K.Space=0; return {baja:Math.round(h.y-(G-420)),vy:Math.round(h.vy)}; }
  { const sin=await caida([],true), con=await caida(['planeo'],true), noMantiene=await caida(['planeo'],false); out.planeo={sinHabilidad:sin.baja,planeando:con.baja,vyPlaneando:con.vy,sinMantener:noMantiene.baja}; }

  // ---------- 🧗 PARED (chimenea de bambú) ----------
  async function escalar(hab){
    const {S,K,paso,core,h}=await nuevo(hab,2); const izq=S.N.muros.find(m=>m.tipo==='escalada'&&m.lado==='izq'), der=S.N.muros.find(m=>m.par===izq.par&&m.lado==='der');
    const repisa=izq.y+70; h.x=(izq.x+izq.w+der.x)/2; h.y=G; h.vx=0; h.vy=0; paso(5); let lado=-1, llego=false, saltosPared=0;
    for(let i=0;i<60*10&&!llego;i++){
      K.Space=1; if(h.suelo) core.pulsar('Space');
      K.ArrowLeft=lado<0?1:0; K.ArrowRight=lado>0?1:0;
      const A=S.hab; if(A.pared.cling){ core.pulsar('Space'); lado=-A.pared.lado; }
      paso(1); if(h.suelo&&h.y<=repisa+6) llego=true;
    }
    K.Space=0;K.ArrowLeft=0;K.ArrowRight=0; return {llego,saltosPared:S.hab.pared.usos,repisa:Math.round(repisa),y:Math.round(h.y)};
  }
  { const con=await escalar(['pared']), sin=await escalar([]); out.pared={conHabilidad:con,sinHabilidad:sin}; }

  // ---------- ⚔️ TAJO AÉREO ----------
  async function pogoEnemigo(hab){
    const {S,K,paso,h}=await nuevo(hab); llano(S,h,400); paso(3); const x=h.x; const e={kind:'ninja',x,y:G,min:x-5,max:x+5,vx:0,vivo:true,hp:1,dir:1}; S.enemigos.push(e);
    h.y=G-100; h.suelo=false; h.vy=0; K.ArrowDown=1; K.KeyC=1; paso(2); const r={mato:!e.vivo,vy:Math.round(h.vy),pogos:S.hab?S.hab.pogos:0}; K.ArrowDown=0;K.KeyC=0; return r;
  }
  async function pogoKunai(hab){
    const {S,K,paso,h}=await nuevo(hab); llano(S,h,400); paso(3); S.N.haz.push({x:h.x-60,y:G-46,w:120,h:46,tipo:'kunai'}); const v0=h.vida;
    h.y=G-190; h.suelo=false; h.vy=250; K.ArrowDown=1; K.KeyC=1; paso(1); K.KeyC=0; paso(40); K.ArrowDown=0; return {vida:h.vida-v0,pogos:S.hab?S.hab.pogos:0};
  }
  { out.tajo={enemigoCon:await pogoEnemigo(['tajoAereo']),enemigoSin:await pogoEnemigo([]),kunaiCon:await pogoKunai(['tajoAereo']),kunaiSin:await pogoKunai([])}; }

  // ---------- 🪝 GANCHO ----------
  { const {S,K,paso,core,h}=await nuevo(['gancho']); const a=S.hab.anclas[0]; h.x=a.x-250; h.y=G-120; h.vx=0; h.vy=0; h.suelo=false; h.dir=1; paso(1);
    K.KeyG=1; core.pulsar('KeyG'); const agarro=S.hab.gancho.on, L=S.hab.gancho.L; let maxDist=0, cruzo=false, minY=1e9;
    for(let i=0;i<60*3;i++){ K.ArrowRight=(i%90<45)?1:0; K.ArrowLeft=(i%90<45)?0:1; paso(1); if(!S.hab.gancho.on) break; maxDist=Math.max(maxDist,Math.hypot(h.x-a.x,(h.y-70)-a.y)); if(h.x>a.x+60) cruzo=true; minY=Math.min(minY,h.y); }
    const sigueAgarrado=S.hab.gancho.on; K.KeyG=0; core.soltar('KeyG'); paso(1); const vx=Math.round(h.vx);
    out.gancho={agarro,largo:Math.round(L),maxDist:Math.round(maxDist),cuerdaCorta:maxDist<=L+3,cruzoLaArgolla:cruzo,sigueAgarrado,soltado:!S.hab.gancho.on,vxAlSoltar:vx,anclas:S.hab.anclas.length}; }
  { const {S,K,paso,core,h}=await nuevo(['gancho']); llano(S,h,100); paso(3); K.KeyG=1; core.pulsar('KeyG'); out.ganchoSinArgolla={agarro:S.hab.gancho.on}; K.KeyG=0; }

  // ---------- panel para elegir (desbloqueo con pergaminos) ----------
  { const {S,K,paso,core,h}=await nuevo(undefined); llano(S,h); paso(3); const a0=S.hab.orden.length;
    S.pergaminos=7; paso(2); const antes=!S.eligiendo; S.pergaminos=8; paso(2); const abre=!!S.eligiendo, tarjetas=document.querySelectorAll('.n1HabCard').length;
    const t0=S.t; await sleep(350); const congelado=S.t===t0; await sleep(300);
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit3',bubbles:true})); await sleep(30);
    const eligio=S.hab.tiene.planeo&&!S.eligiendo&&!document.getElementById('n1HabPanel');
    S.pergaminos=26; paso(2); const segundo=!!S.eligiendo&&document.querySelectorAll('.n1HabCard').length; await sleep(600);
    document.querySelectorAll('.n1HabCard')[0].click(); await sleep(30);
    out.panel={empezoSin:a0===0,noAbreAntes:antes,abreAlOcho:abre,tarjetas,juegoCongelado:congelado,eligioConNumero:eligio,segundaVez:segundo,eligioConToque:S.hab.orden.length===2&&!S.eligiendo,orden:S.hab.orden.join(',')}; }

  // ---------- todas juntas: nada se rompe ----------
  { document.getElementById('ini')&&document.getElementById('ini').remove(); await Nivel1.iniciar({heroe:'kage',semilla:5,habilidades:['todas']}); const S=Nivel1._estado(); out.todas={habilidades:S.hab.orden.length}; for(let i=0;i<600;i++) Nivel1._debug.paso(1); out.todas.vivo=S.h.vida>0; }
  return out;
});

const ok=[],mal=[]; const chk=(n,c,det)=>{(c?ok:mal).push(n+(det!==undefined?'  '+JSON.stringify(det):''));};
const d=R.dash; chk('dash: avanza ~160 px en 10 pasos',d.dist>=140&&d.dist<=200,d.dist); chk('dash: invulnerable mientras dura',d.protegido); chk('dash: después sí se recibe daño',d.danioDespues); chk('dash: solo uno en el aire',d.unoEnElAire);
const b=R.doble; chk('doble salto: sube mucho más que un salto',b.doble>=b.simple+100,b); chk('doble salto: no hay triple salto',b.usosConTercero===1,b.usosConTercero);
const p=R.planeo; chk('planeo: cae mucho menos que sin habilidad',p.planeando<p.sinHabilidad*.5,p); chk('planeo: velocidad de caída limitada',p.vyPlaneando<=155,p.vyPlaneando); chk('planeo: sin mantener ESPACIO no planea',R.planeo.sinMantener>=p.sinHabilidad*.9,p.sinMantener);
const w=R.pared; chk('pared: con la habilidad se sube la chimenea y se llega al tesoro',w.conHabilidad.llego,w.conHabilidad); chk('pared: se usó el salto de pared',w.conHabilidad.saltosPared>=2,w.conHabilidad.saltosPared); chk('pared: sin la habilidad NO se llega',!w.sinHabilidad.llego,w.sinHabilidad);
const t=R.tajo; chk('tajo aéreo: mata al enemigo de abajo y rebota',t.enemigoCon.mato&&t.enemigoCon.vy<-500&&t.enemigoCon.pogos===1,t.enemigoCon); chk('tajo aéreo: sin habilidad no',!t.enemigoSin.mato,t.enemigoSin);
chk('tajo aéreo: rebota en trampa de kunai sin daño',t.kunaiCon.vida===0&&t.kunaiCon.pogos===1,t.kunaiCon); chk('tajo aéreo: sin habilidad la trampa hiere',t.kunaiSin.vida<0,t.kunaiSin);
const g=R.gancho; chk('gancho: se agarra a una argolla cercana',g.agarro,{largo:g.largo}); chk('gancho: la cuerda nunca se alarga',g.cuerdaCorta,{maxDist:g.maxDist,largo:g.largo}); chk('gancho: balancea al héroe al otro lado',g.cruzoLaArgolla); chk('gancho: al soltar sale con velocidad',g.soltado&&Math.abs(g.vxAlSoltar)>100,g.vxAlSoltar); chk('gancho: sin argolla cerca no se agarra',!R.ganchoSinArgolla.agarro); chk('gancho: el nivel trae argollas',g.anclas>=10,g.anclas);
const pn=R.panel; chk('panel: empieza sin habilidades',pn.empezoSin); chk('panel: no se abre con 7 pergaminos',pn.noAbreAntes); chk('panel: se abre con 8 y muestra 6 tarjetas',pn.abreAlOcho&&pn.tarjetas===6,pn.tarjetas); chk('panel: el juego se congela mientras eliges',pn.juegoCongelado); chk('panel: se elige con el teclado (3 = planeo)',pn.eligioConNumero); chk('panel: la 2.ª habilidad sale a los 26 con 5 tarjetas',pn.segundaVez===5,pn.segundaVez); chk('panel: se elige tocando',pn.eligioConToque,pn.orden);
chk('todas las habilidades por URL/parámetro y 600 pasos sin morir ni fallar',R.todas.habilidades===6&&R.todas.vivo,R.todas);
const errs=logs.filter(l=>/PAGEERROR|error:/i.test(l)&&!/favicon|ERR_FILE|Failed to load resource/i.test(l)); chk('sin errores en la consola',errs.length===0,errs.slice(0,3));

ok.forEach(x=>console.log('  ✓ '+x)); mal.forEach(x=>console.log('  ✗ '+x)); console.log('\n'+ok.length+' bien · '+mal.length+' mal');
await browser.close(); process.exit(mal.length?1:0);
