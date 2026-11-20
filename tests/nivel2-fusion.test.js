/* Prueba de humo del Nivel 2 (surf.js): simula el juego entero con un lienzo falso y un jugador automático.
   Comprueba: sin errores · los 4 jefes se pueden pelear y vencer · los 3 vehículos dibujan · poderes, cofres, trampolines
   y cañones funcionan · nada de lo añadido cae dentro de la zona de respuesta · el tutorial termina.   Uso: node tests/nivel2-fusion.test.js */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
let pasadas=0;const ok=(n,f)=>{try{f();pasadas++;console.log('  ✓ '+n);}catch(e){console.log('  ✗ '+n+'\n    '+(e.stack||e).split('\n').slice(0,4).join('\n    '));process.exitCode=1;}};

function entorno(){
  const ctx={console,Math:Object.create(Math),setTimeout:(f)=>0,clearTimeout(){},performance:{now:()=>0}};
  let sem=12345;ctx.Math.random=()=>{sem=(sem*1664525+1013904223)%4294967296;return sem/4294967296;};
  ctx.window=ctx;ctx.location={search:'',href:''};ctx.matchMedia=()=>({matches:false});
  const mem={};ctx.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);},removeItem:k=>{delete mem[k];}};
  const el=()=>{const e={style:{},children:[],appendChild(c){e.children.push(c);return c;},remove(){},addEventListener(){},removeEventListener(){},querySelector:()=>el(),querySelectorAll:()=>[],
    getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),getContext:()=>lienzo,set innerHTML(v){},set textContent(v){},click(){}};return e;};
  const grad={addColorStop(){}};
  const lienzo=new Proxy({},{get:(t,p)=>p==='createLinearGradient'||p==='createRadialGradient'?()=>grad:(p in t?t[p]:()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
  ctx.document={createElement:el,body:el(),addEventListener(){},removeEventListener(){},hidden:false};
  ctx.addEventListener=()=>{};ctx.removeEventListener=()=>{};
  ctx.Image=class{constructor(){this.complete=true;this.naturalWidth=100;this.naturalHeight=100;}set src(v){this._s=v;}get src(){return this._s;}};
  let cb=null;ctx.requestAnimationFrame=f=>{cb=f;return 1;};ctx.cancelAnimationFrame=()=>{cb=null;};
  ctx.AudioContext=undefined;ctx.ontouchstart=undefined;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/nivel2/manifest.js'),'utf8'),ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'engine/nivel2/surf.js'),'utf8'),ctx);
  let ts=0;return{ctx,frame:()=>{ts+=33;const f=cb;if(f)f(ts);},S:()=>ctx.__n2()};
}
// jugador automático: siempre elige la respuesta correcta y salta a menudo
function jugar(E,max,hasta){let n=0;for(;n<max;n++){const S=E.S();if(S.est!=='play'&&n>5)break;
  if(S.fase==='puente'&&S.puente&&S.puente.est==='juega'&&n%4===0){const P=S.puente,i=P.bl.findIndex(b=>b.est==='normal'&&b.v===P.vals[P.paso]);if(i>=0)E.ctx.__n2puente(i);}
  const g=S.gates.find(g=>!g.res);if(g&&g.x-S.d<1800)S.lane=g.q.ops.indexOf(g.q.ans);if(n%23===0)S.inputs.salto=true;E.frame();if(hasta&&hasta(S))return n;}return n;}
const nuevo=(o)=>{const E=entorno();E.ctx.Nivel2.iniciar(Object.assign({debug:true,modo:'ruta',heroe:'sakura'},o));return E;};

console.log('Nivel 2 · fusión');
ok('recorrido completo con jugador perfecto: llega al jefe y lo vence',()=>{const E=nuevo({jefe:'escorpion'});let vioJefe=false;
  jugar(E,40000,S=>{if(S.fase==='jefe')vioJefe=true;return S.est==='gano';});assert(vioJefe,'no llegó al jefe');assert.strictEqual(E.S().est,'gano');});
['escorpion','gusano','esfinge','faraon'].forEach(id=>ok('jefe '+id+' (práctica directa): ataca y se vence',()=>{
  const E=nuevo({jefe:id,directo:'1'});assert.strictEqual(E.S().jefeInfo.id,id);assert.strictEqual(E.S().fase,'jefe');
  let atac=0,prev=null;jugar(E,20000,S=>{if(S.jefe&&S.jefe.atq&&S.jefe.atq!==prev){atac++;prev=S.jefe.atq;if(id==='faraon')assert.strictEqual(S.jefe.atq.lanes.length,2,'el faraón ataca 2 carriles');else assert.strictEqual(S.jefe.atq.lanes.length,1);}return S.est==='gano';});
  assert.strictEqual(E.S().est,'gano','no se pudo vencer');assert(atac>0,'el jefe nunca atacó');}));
ok('los jefes rotan por victoria (según jefes vencidos en el perfil)',()=>{
  const ids=[0,1,2,3,4].map(c=>{const E=entorno();E.ctx.Nivel2.iniciar({debug:true,modo:'ruta',perfil:{id:'t',nivel2:{completados:c}}});return E.S().jefeInfo.id;});
  assert.deepStrictEqual(ids,['escorpion','gusano','esfinge','faraon','escorpion']);});
['alfombra','vagoneta','tabla'].forEach(v=>ok('vehículo '+v+': 2500 cuadros sin errores',()=>{const E=nuevo({vehiculo:v,tabla:'tabla_neon'});jugar(E,2500);assert(isFinite(E.S().d)&&E.S().d>500);}));
ok('héroe kage con tabla dibuja sin errores',()=>{const E=nuevo({vehiculo:'tabla',heroe:'kage'});jugar(E,800);});
ok('extras (poderes, cofres, trampolines, gotas) nunca caen en la zona de respuesta (750 px antes de la puerta)',()=>{
  const E=nuevo({});let max=0;jugar(E,6000,S=>{S.pows.concat(S.cofres,S.pads).forEach(p=>{const g=S.gates.filter(g=>g.x>p.x).sort((a,b)=>a.x-b.x)[0];if(g){max++;assert(g.x-p.x>=750,'extra a '+(g.x-p.x)+' px de la puerta ('+(p.tipo||'cofre')+')');}});return false;});assert(max>0,'no se generó ningún extra');});
ok('obstáculos difíciles (pinchos, sierra, cañón, oni) solo aparecen en rondas avanzadas',()=>{
  const E=nuevo({});const vistos={};jugar(E,30000,S=>{S.obs.forEach(ob=>{vistos[ob.tipo]=Math.max(vistos[ob.tipo]||0,S.respondidas);});return S.fase==='jefe';});
  ['pin','sie'].forEach(t=>assert(!(t in vistos)||vistos[t]>=2,t+' demasiado pronto'));['can','oni'].forEach(t=>assert(!(t in vistos)||vistos[t]>=4,t+' demasiado pronto'));});
ok('poderes: escarabajo=escudo, reloj, imán, comodín (tacha una mala y se gasta), onigiri=+1 corazón',()=>{
  const E=nuevo({});jugar(E,30);const S=E.S();S.vidas=2;
  const dar=tipo=>{S.pows.push({x:S.d+5,l:Math.round(S.ly),tipo,ok:false});E.frame();E.frame();};
  dar('poder_escarabajo');assert.strictEqual(S.escudo,true);dar('poder_reloj');assert(S.lento>0);dar('poder_iman');assert(S.iman>0);
  dar('onigiri');assert.strictEqual(S.vidas,3);
  dar('poder_comodin');assert.strictEqual(S.comodin,1);let g=null;for(let i=0;i<900&&!(g=S.gates.find(g=>!g.res&&g.tach!==undefined));i++){S.lane=1;E.frame();}   // actúa cuando la puerta está a <1900 px
  assert(g&&g.q.ops[g.tach]!==g.q.ans,'el comodín debe tachar una respuesta MALA');
  S.d=g.x-1;S.lane=g.q.ops.indexOf(g.q.ans);E.frame();E.frame();assert.strictEqual(S.comodin,0,'el comodín se gasta al responder');});
ok('trampolín lanza al héroe; cofre da puntos; cinta da turbo',()=>{
  const E=nuevo({});jugar(E,30);const S=E.S(),l=Math.round(S.ly);
  S.pads.push({x:S.d+4,l,tipo:'trampolin',ok:false,t:0});E.frame();assert(S.vz>=700||S.z>0,'el trampolín no impulsó');
  const E2=nuevo({});jugar(E2,30);const S2=E2.S(),p0=S2.punt;S2.cofres.push({x:S2.d+4,l:Math.round(S2.ly),oscuro:false,est:0,t:0});E2.frame();assert(S2.punt>=p0+150);
  const E3=nuevo({});jugar(E3,30);const S3=E3.S();S3.pads.push({x:S3.d+4,l:Math.round(S3.ly),tipo:'cinta_transportadora',ok:false,t:0});E3.frame();assert(S3.boost>0);});
ok('cañón dispara una bola de fuego que quita un corazón (y el escudo la bloquea)',()=>{
  const E=nuevo({});jugar(E,30);const S=E.S(),l=Math.round(S.ly);S.obs.push({x:S.d+500,l:(l+1)%3,tipo:'can',v:0,h:44,alto:76,hit:false,cd:-1,cambio:false});E.frame();assert(S.balas.length===1,'no disparó');
  S.balas[0].l=l;S.balas[0].x=S.d+10;S.inv=0;S.caido=0;S.escudo=true;const v0=S.vidas;E.frame();E.frame();assert.strictEqual(S.vidas,v0,'el escudo debía bloquear');assert.strictEqual(S.escudo,false);});
ok('tutorial: se completa y pasa al recorrido',()=>{
  const E=entorno();E.ctx.Nivel2.iniciar({debug:true,modo:'tut',heroe:'sakura'});let n=0;
  for(;n<30000&&E.S().fase==='tut';n++){const S=E.S();S.lane=(Math.floor(n/40))%3;const g=S.gates.find(g=>!g.res);if(g)S.lane=g.q.ops.indexOf(g.q.ans);
    const mx=S.tut&&S.tut.muroX;if(mx&&mx-S.d>0&&mx-S.d<150&&S.z===0)S.inputs.salto=true;   // salta justo antes de la roca
    E.frame();}
  assert.strictEqual(E.S().fase,'ruta','el tutorial no terminó en '+n+' cuadros');});
ok('sin NaN tras una partida larga con errores y reapariciones',()=>{
  const E=nuevo({});let n=0;for(;n<12000;n++){const S=E.S();if(S.est!=='play')break;S.lane=Math.floor(n/37)%3;if(n%11===0)S.inputs.salto=true;E.frame();}
  const S=E.S();['d','v','z','ly','fly','vidas','punt'].forEach(k=>assert(Number.isFinite(S[k]),k+' = '+S[k]));});
console.log('\n'+pasadas+' pruebas OK');
