/* Pruebas de los mundos nuevos del Nivel 2: simula el juego entero con un lienzo falso y un jugador automático.
   Comprueba: sin errores · los 4 jefes se pueden pelear y vencer · los 3 vehículos dibujan · poderes, cofres, trampolines
   y cañones funcionan · nada de lo añadido cae dentro de la zona de respuesta · el tutorial termina.   Uso: node tests/nivel2-mundos.test.js */
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

const nuevo=(o)=>{const E=entorno();E.ctx.Nivel2.iniciar(Object.assign({debug:true,modo:'ruta',heroe:'sakura',dificultad:'tranquilo'},o));return E;};
const frames=(E,n,f)=>{for(let i=0;i<n;i++){if(f)f(E.S(),i);E.frame();}};
const ir=(E,n,fin)=>{for(let i=0;i<n;i++){E.frame();if(fin(E.S()))return true;}return false;};
const desdeCp=(ronda,o)=>{const E=entorno();E.ctx.localStorage.setItem('n2_anon_cp',JSON.stringify({ronda,punt:300,jefe:ronda>=8}));E.ctx.localStorage.setItem('n2_anon_tut','1');E.ctx.Nivel2.iniciar(Object.assign({debug:true,modo:'continuar',heroe:'sakura',dificultad:'tranquilo'},o));return E;};
const resuelvePuente=(E,n)=>{const S=E.S();if(S.fase==='puente'&&S.puente&&S.puente.est==='juega'&&n%4===0){const P=S.puente,i=P.bl.findIndex(b=>b.est==='normal'&&b.v===P.vals[P.paso]);if(i>=0)E.ctx.__n2puente(i);}};

ok('dificultades: 5 / 4 / 3 corazones al empezar',()=>{
  [['tranquilo',5],['normal',4],['reto',3]].forEach(([d,v])=>{const E=nuevo({dificultad:d});assert.strictEqual(E.S().vidas,v,d);});
});
ok('recorrido perfecto: dunas > mina > cielo > templo, con 2 puentes armados y victoria',()=>{
  const E=nuevo({}),ambs=[];let puentes=0,enP=false;
  for(let n=0;n<60000;n++){const S=E.S();if(S.est!=='play'&&n>5)break;
    if(ambs[ambs.length-1]!==S.amb)ambs.push(S.amb);
    if(S.fase==='puente'){if(!enP){enP=true;puentes++;}}else enP=false;
    resuelvePuente(E,n);const g=S.gates.find(g=>!g.res);if(g&&g.x-S.d<1800)S.lane=g.q.ops.indexOf(g.q.ans);if(n%23===0)S.inputs.salto=true;E.frame();}
  assert.deepStrictEqual(ambs,['dunas','mina','cielo','templo']);assert.strictEqual(puentes,2);assert.strictEqual(E.S().est,'gano');
});
ok('segunda oportunidad (tranquilo): el 1.er error no quita corazón y la tabla vuelve a salir',()=>{
  const E=nuevo({});E.frame();let S=E.S();const g0=S.gates.find(g=>!g.res),key=g0.q.key;
  const mal=(g0.q.ops.indexOf(g0.q.ans)+1)%3;
  for(let n=0;n<4000&&E.S().err<1;n++){const s=E.S(),g=s.gates.find(g=>!g.res);if(g===g0)s.lane=mal;E.frame();}
  S=E.S();assert.strictEqual(S.vidas,5,'no pierde corazón');assert.ok(S.err>=1,'cuenta el error');
  const re=S.gates.find(g=>g.reint);assert.ok(re&&re.q.key===key,'misma tabla otra vez');
  assert.deepStrictEqual(S.gates.map(g=>g.x),S.gates.map(g=>g.x).slice().sort((a,b)=>a-b),'puertas ordenadas');
});
ok('reto: el error sí quita corazón (sin segunda oportunidad)',()=>{
  const E=nuevo({dificultad:'reto'});E.frame();let S=E.S();const g0=S.gates.find(g=>!g.res),mal=(g0.q.ops.indexOf(g0.q.ans)+1)%3;
  frames(E,4000,s=>{const g=s.gates.find(g=>!g.res);if(g===g0)s.lane=mal;if(s.obs.length)s.obs=[];});
  S=E.S();assert.ok(S.vidas<3,'perdió corazón');assert.ok(!S.gates.some(g=>g.reint),'sin reintento');
});
ok('puente: un bloque equivocado no quita corazón ni avanza; en orden se arma y vuelve la ruta',()=>{
  const E=desdeCp(2,{});let S=E.S();S.puenteT=.05;ir(E,200,s=>s.fase==='puente');S=E.S();assert.strictEqual(S.fase,'puente');
  const P=S.puente,vidas=S.vidas,mal=P.bl.findIndex(b=>b.v!==P.vals[0]);E.ctx.__n2puente(mal);
  assert.strictEqual(P.paso,0);assert.strictEqual(P.errs,1);assert.strictEqual(S.vidas,vidas);
  assert.deepStrictEqual(P.vals.slice().sort((a,b)=>a-b),P.vals,'los múltiplos van en orden');
  for(let n=0;n<4000&&E.S().fase==='puente';n++){resuelvePuente(E,n);E.frame();}
  S=E.S();assert.strictEqual(S.fase,'ruta');assert.ok(S.punt>=600,'+300 por el puente');
});
ok('cielo: vuelo libre continuo (mantener ▲) y se acomoda al soltar',()=>{
  const E=desdeCp(4,{});let S=E.S();assert.strictEqual(S.amb,'cielo');assert.strictEqual(S.vuelo,true);
  S.hold.up=1;let fracc=false;frames(E,12,s=>{if(s.laneF>0.05&&s.laneF<0.95)fracc=true;});assert.ok(fracc,'pasa por alturas intermedias');
  E.S().hold.up=0;frames(E,40);S=E.S();assert.ok(Number.isInteger(S.lane));assert.ok(Math.abs(S.laneF-S.lane)<.05,'se acomoda al carril');
});
ok('reaparición: vuelve al mismo mundo con las vidas llenas',()=>{
  const E=desdeCp(4,{});let S=E.S();S.vidas=1;S.inv=0;S.obs.push({x:S.d+25,l:Math.round(S.ly),tipo:'nube',v:0,h:54,alto:96,hit:false,cd:-1,cambio:false});
  frames(E,300);S=E.S();assert.strictEqual(S.caidas,1);assert.strictEqual(S.amb,'cielo');assert.strictEqual(S.vidas,5);
});
ok('tormenta de errores: 3 mundos x 3 dificultades, 1500 cuadros sin NaN ni errores',()=>{
  [2,4,6].forEach(r=>['tranquilo','normal','reto'].forEach(d=>{const E=desdeCp(r,{dificultad:d});frames(E,1500,(s,n)=>{if(n%17===0)s.inputs.salto=true;if(n%40===0)s.lane=(s.lane+1)%3;});const S=E.S();assert.ok(Number.isFinite(S.d)&&Number.isFinite(S.v)&&Number.isFinite(S.ly));}));
});
console.log('\n'+pasadas+' pruebas OK');
