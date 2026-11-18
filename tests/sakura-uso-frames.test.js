/* Simula los movimientos de Sakura y comprueba que se dibujan los 100 fotogramas de sus 10 hojas.
   Uso: node tests/sakura-uso-frames.test.js */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');
const ctx={console,performance:{now:()=>0},location:{search:''},setInterval(){},document:{addEventListener(){},body:null}};
ctx.window=ctx;
class Img{constructor(){this.complete=true;this.naturalWidth=100;this.naturalHeight=100;this._s='';}set src(v){this._s=v;}get src(){return this._s;}addEventListener(){}}
ctx.Image=Img;
ctx.CX={drawImage(){},imageSmoothingEnabled:true,imageSmoothingQuality:'low'};
ctx.NJX={pink:{refH:46,k:{},run:[],jump:[]},black:{refH:46,k:{}}};ctx.NJ={};
ctx.P={x:100,y:100,w:22,h:46,vx:0,vy:0,facing:1,onGround:true,iframes:0,jumpForce:-13,spd:5,alive:true,_baseH:46};
ctx.GS={running:true,dying:false,doneFired:false,char:'mario'};
ctx.K={};ctx.camX=0;ctx.MELEE_DUR=22;ctx.platforms=[];ctx._prev=null;
ctx.FX={collect(){}};ctx._drawNinjaX=()=>false;ctx.update=()=>{};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/characters/sakura_assets/sakura/manifest.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'engine/hero-pro.js'),'utf8'),ctx);
const T=ctx.__HERO_PRO_TEST;assert(T,'hero-pro no exportó el modo de prueba');
const d=T.act.pink;d.on=true;
const P=ctx.P;let t=0;
function frame(onGround,dx){t+=1/60;const[n,p,i]=T.sakuraState(d,onGround,t,dx||0);const f=T.selectFrame(d,n,p,t,i);assert(f,'sin frame para '+n);return n;}
function reset(){Object.assign(P,{vx:0,vy:0,onGround:true,iframes:0,crouching:false,_meleeT:0,_kunaiT:0,_specialT:0,_dashT:0,lowGrav:false,_dj:false});d.glideOn=false;d.wall=0;}
function run(n,fn){for(let k=0;k<n;k++){fn&&fn(k);}}
// idle / walk / run
reset();run(120,()=>frame(true));
P.vx=2;run(80,()=>frame(true,2));P.vx=5;run(80,()=>frame(true,5));
// salto completo + caída libre + aterrizaje fuerte
reset();frame(true);P.onGround=false;P.vy=-13;
for(let k=0;k<90;k++){P.vy+=.68;frame(false);}
for(let k=0;k<40;k++){P.vy=Math.min(18,P.vy+.68);frame(false);}
P.onGround=true;P.vy=0;run(30,()=>frame(true));
// doble salto → planeo → plegar capa
reset();frame(true);P.onGround=false;P.vy=-13;for(let k=0;k<12;k++){P.vy+=.68;frame(false);}
P._dj=true;P.vy=-11;for(let k=0;k<20;k++){P.vy+=.68;frame(false);}
P.vy=1.5;d.glideOn=true;for(let k=0;k<80;k++)frame(false);
d.glideOn=false;for(let k=0;k<30;k++)frame(false);
P.onGround=true;P.vy=0;P._dj=false;run(30,()=>frame(true));
// pared: agarrarse, resbalar, trepar, salto de pared
reset();P.onGround=false;P.vy=0;frame(false);P.vy=-.5;d.wall=1;run(40,()=>frame(false));
P.vy=3;run(40,()=>frame(false));P.vy=-4;run(40,()=>frame(false));
d.wall=0;d.wallJumpUntil=t+.22;run(20,()=>{frame(false);});
// combate
reset();P._meleeT=22;for(let k=0;k<22;k++){P._meleeT--;frame(true);}
P._kunaiT=24;for(let k=0;k<24;k++){P._kunaiT--;frame(true);}
P._specialT=36;for(let k=0;k<36;k++){P._specialT--;frame(true);}
P._dashT=12;run(12,()=>frame(true));P._dashT=0;
// agachado: entrar, quieta, arrastrarse, deslizar
P.crouching=true;P.vx=0;run(40,()=>frame(true));P.vx=2;run(40,()=>frame(true));P.vx=5;run(40,()=>frame(true));P.crouching=false;P.vx=0;
// daño, muerte, victoria
P.iframes=90;run(50,()=>frame(true));P.iframes=0;
ctx.GS.dying=true;run(60,()=>frame(true));ctx.GS.dying=false;
ctx.GS.doneFired=true;run(60,()=>frame(true));ctx.GS.doneFired=false;
// resultado
const all=new Set();Object.keys(d.animations).forEach(n=>d.animations[n].frames.forEach(f=>all.add(f.file)));
const miss=[...all].filter(f=>!d.used.has(f)).sort();
console.log('Fotogramas usados: '+d.used.size+' / '+all.size);
if(miss.length){console.log('FALTAN:\n'+miss.join('\n'));process.exit(1);}
assert.strictEqual(all.size,100);console.log('OK ✔ los 100 fotogramas de Sakura se usan en el juego');
