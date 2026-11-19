/* Simula los movimientos de Sakura y de Antarez y comprueba que TODOS sus fotogramas se dibujan en el juego.
   Sakura: 100 frames (10 hojas) · Antarez: 116 frames (hojas 1-6, 8, 9 y 13).   Uso: node tests/sakura-uso-frames.test.js */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
const ctx={console,performance:{now:()=>0},location:{search:''},setInterval(){},document:{addEventListener(){},body:null}};
ctx.window=ctx;
class Img{constructor(){this.complete=true;this.naturalWidth=100;this.naturalHeight=100;this._s='';}set src(v){this._s=v;}get src(){return this._s;}addEventListener(){}}
ctx.Image=Img;
ctx.CX={drawImage(){},save(){},restore(){},translate(){},scale(){},imageSmoothingEnabled:true,imageSmoothingQuality:'low'};
ctx.NJX={pink:{refH:46,k:{},run:[],jump:[]},black:{refH:46,k:{},run:[],jump:[]}};ctx.NJ={};
ctx.P={x:100,y:100,w:22,h:46,vx:0,vy:0,facing:1,onGround:true,iframes:0,jumpForce:-13,spd:5,alive:true,_baseH:46};
ctx.GS={running:true,dying:false,doneFired:false,char:'mario'};
ctx.K={};ctx.camX=0;ctx.MELEE_DUR=22;ctx.platforms=[];ctx._prev=null;
ctx.FX={collect(){}};ctx._drawNinjaX=()=>false;ctx.update=()=>{};ctx._drawBulletSpr=()=>false;
vm.createContext(ctx);
const load=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
load('assets/characters/sakura_assets/sakura/manifest.js');
load('assets/characters/antarez/manifest.js');
load('engine/hero-pro.js');
const T=ctx.__HERO_PRO_TEST;assert(T,'hero-pro no exportó el modo de prueba');
const P=ctx.P;let t=0;

function sim(d){
  function frame(onGround,dx){t+=1/60;const[n,p,i]=T.sakuraState(d,onGround,t,dx||0);const f=T.selectFrame(d,n,p,t,i);assert(f,'sin frame para '+n);return n;}
  const reset=()=>{Object.assign(P,{vx:0,vy:0,onGround:true,iframes:0,crouching:false,_meleeT:0,_kunaiT:0,_specialT:0,_dashT:0,lowGrav:false,_dj:false,speedBoost:false});ctx.K.ArrowDown=0;d.glideOn=false;d.wall=0;};
  const run=(n,fn)=>{for(let k=0;k<n;k++)fn();};
  // reposo, caminar, correr, turbo
  reset();run(120,()=>frame(true));
  P.vx=2;run(80,()=>frame(true,2));P.vx=5;run(120,()=>frame(true,5));P.speedBoost=true;run(80,()=>frame(true,7));P.speedBoost=false;
  // salto completo, caída libre, aterrizaje fuerte
  reset();frame(true);P.onGround=false;P.vy=-13;
  for(let k=0;k<90;k++){P.vy+=.68;frame(false);}
  for(let k=0;k<40;k++){P.vy=Math.min(18,P.vy+.68);frame(false);}
  ctx.K.ArrowDown=1;P.vy=6;run(10,()=>frame(false));ctx.K.ArrowDown=0;   // picada (⬇ en el aire)
  P.vy=16;run(10,()=>frame(false));
  P.onGround=true;P.vy=0;run(40,()=>frame(true));
  // aterrizaje suave
  P.onGround=false;P.vy=2;run(5,()=>frame(false));P.onGround=true;P.vy=0;run(30,()=>frame(true));
  // doble salto → planeo → plegar capa
  reset();frame(true);P.onGround=false;P.vy=-13;for(let k=0;k<12;k++){P.vy+=.68;frame(false);}
  P._dj=true;P.vy=-11;for(let k=0;k<20;k++){P.vy+=.68;frame(false);}
  P.vy=1.5;d.glideOn=true;for(let k=0;k<80;k++)frame(false);
  d.glideOn=false;for(let k=0;k<30;k++)frame(false);
  P.onGround=true;P.vy=0;P._dj=false;run(30,()=>frame(true));
  // pared: agarrarse, resbalar, trepar, salto de pared
  reset();P.onGround=false;P.vy=0;frame(false);P.vy=-.5;d.wall=1;run(40,()=>frame(false));
  P.vy=3;run(40,()=>frame(false));P.vy=-4;run(40,()=>frame(false));
  d.wall=0;d.wallJumpUntil=t+.22;run(20,()=>frame(false));
  // combate (tierra y aire), kunai, especial, dash
  reset();P._meleeT=22;for(let k=0;k<22;k++){P._meleeT--;frame(true);}
  P.onGround=false;P._meleeT=22;for(let k=0;k<22;k++){P._meleeT--;frame(false);}P.onGround=true;
  P._kunaiT=24;for(let k=0;k<24;k++){P._kunaiT--;frame(true);}
  P._specialT=36;for(let k=0;k<36;k++){P._specialT--;frame(true);}
  P._dashT=12;run(12,()=>frame(true));P._dashT=0;
  run(200,()=>frame(true));                                              // idle de combate → idle normal
  // agachado: entrar, quieta, arrastrarse, deslizar
  P.crouching=true;P.vx=0;run(40,()=>frame(true));P.vx=2;run(40,()=>frame(true));P.vx=5;run(40,()=>frame(true));P.crouching=false;P.vx=0;
  // daño, muerte, victoria
  P.iframes=90;run(50,()=>frame(true));P.iframes=0;
  ctx.GS.dying=true;run(60,()=>frame(true));ctx.GS.dying=false;
  ctx.GS.doneFired=true;run(60,()=>frame(true));ctx.GS.doneFired=false;
}
function informe(nombre,d,esperado){
  const r=T.usoDe(d,nombre);
  if(r.faltan.length){console.log('FALTAN en '+nombre+':\n'+r.faltan.join('\n'));process.exit(1);}
  assert.strictEqual(r.total,esperado,nombre+': total inesperado');
  console.log('OK ✔ '+nombre+': '+r.usados+' / '+r.total+' fotogramas usados');
}
// ── Sakura ──
sim(T.act.pink);informe('Sakura',T.act.pink,100);
// ── Antarez: se repite todo con cada katana ──
const A=T.act.black,AZ=ctx.ANTAREZ;assert(AZ,'Antarez no inicializó las katanas');
ctx.GS.char='peach';
['hono','raiden','kaze'].forEach(k=>{AZ.set(k);t+=1;sim(A);t+=1;run3();});
function run3(){for(let i=0;i<40;i++){t+=1/60;const r=T.sakuraState(A,true,t,0);T.selectFrame(A,r[0],r[1],t,r[2]);}}   // destello al cambiar de katana
// kunais: sprites reales (twin hacia delante, single hacia atrás)
P.facing=1;ctx._drawBulletSpr('kunai',{vx:12,r:13,y:0,char:'peach'},0);ctx._drawBulletSpr('kunai',{vx:-12,r:13,y:0,char:'peach'},0);
informe('Antarez',A,116);
console.log('Todas las pruebas de fotogramas OK');
