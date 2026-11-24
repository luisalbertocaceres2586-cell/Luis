/* Generador/verificador de salas del Mundo 4: crea mapas al azar (con semilla) y se queda con los que
   tienen solución de longitud razonable. Uso: node tools/n4-generar.js <sala 1-4> [semilla] */
global.cnt=0;
const L = require('../engine/nivel4/logica.js');
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const PERFIL={1:{min:8,max:16,paredes:[10,16],f:0,retos:['mult']},2:{min:14,max:26,paredes:[10,15],f:[5,8],retos:['mult','sec']},3:{min:14,max:28,paredes:[9,14],f:[4,7],retos:['mult','sombra']},4:{min:18,max:34,paredes:[8,13],f:[6,9],retos:['mult','sec','sombra']}};
const n=+process.argv[2]||1, seed0=+process.argv[3]||1, P=PERFIL[n];
function gen(rnd){
  const R=(a,b)=>a+Math.floor(rnd()*(b-a+1));
  const m=[];for(let y=0;y<9;y++){m.push([]);for(let x=0;x<9;x++)m[y].push(x==0||y==0||x==8||y==8?'#':'.');}
  const libre=()=>{for(;;){const x=R(1,7),y=R(1,7);if(m[y][x]==='.')return[x,y]}};
  const nw=R(P.paredes[0],P.paredes[1]);
  for(let i=0;i<nw;i++){ // trozos de pared de 1 a 3
    let [x,y]=libre(),dx=rnd()<.5,len=R(1,3);for(let k=0;k<len;k++){const xx=x+(dx?k:0),yy=y+(dx?0:k);if(xx>7||yy>7)break;m[yy][xx]='#';}}
  const put=c=>{const [x,y]=libre();m[y][x]=c;};
  put('H');put('X');
  const retos=[];let cr=1;
  if(P.retos.includes('mult')){put('a');put('b');put('c');retos.push({tipo:'mult',cristal:cr++,pads:{a:{ok:1},b:{},c:{}}});}
  if(P.retos.includes('sec')){put('p');put('q');put('r');retos.push({tipo:'sec',cristal:cr++,orden:['q','p','r'],pads:{}});}
  if(P.retos.includes('sombra')){put('E');put('S');retos.push({tipo:'sombra',cristal:cr++});}
  if(P.f){const k=R(P.f[0],P.f[1]);for(let i=0;i<k;i++){const [x,y]=libre();m[y][x]=String(R(1,retos.length));}}
  if(n>=3&&rnd()<.7){const [x,y]=libre();m[y][x]='^';}
  return {mapa:m.map(r=>r.join('')),retos};
}
let mejor=null;
for(let s=seed0;s<seed0+40000;s++){
  const sala=gen(mulberry(s));
  const E=L.crear(sala);
  // sin pinchos ni pads justo al lado de la salida: comprobación básica
  const sol=L.resolver(E,60000); if(!sol)continue;
  if(sol.length<P.min||sol.length>P.max)continue;
  const soloAndar=!sol.some(a=>a==='CW'||a==='CCW'); if(soloAndar)continue;
  const giros=sol.filter(a=>a==='CW'||a==='CCW').length; if(giros<(n===1?2:3))continue;
  console.log('SEMILLA',s,'pasos',sol.length,'giros',giros);console.log(sala.mapa.join('\n'));console.log(sol.join(' '));
  if(++global.cnt>=4)break;
}
