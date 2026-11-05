/* engine/escenario — Islas flotantes
   Sustituye el dibujo de las plataformas del aire por islas pintadas (assets/islas/, 30 sprites).
   La COLISIÓN no cambia: cada isla se escala al ancho de la plataforma y se alinea para que la "superficie"
   del dibujo quede justo donde se para el héroe. Cada nivel usa su propio set de islas según su tema.
   El suelo continuo y las plataformas de la zona del cielo se siguen dibujando como antes. */
(function(){
if(!window.NinjaMods||!window.ISLAS_META)return;
const SETS={
  prairie:['101','102','104','105','109','111','114','201','208','207','213'],
  night:['101','105','109','114','206','213','201','115'],
  ice:['202','112','211','201','210'],
  desert:['209','207','203','213'],
  jungle:['212','208','203','213','201','209'],
  water:['210','211','203','112'],
  neon_city:['214','108','113','206'],
  space:['215','205','214','206'],galaxy:['215','205','214','206'],
  lava:['204','110','215','203'],hell:['204','110','215'],
  castle:['203','209','108','215'],crypt:['203','209','215','206'],boss:['215','110','204','108'],
  storm:['214','206','210','113']
};
const MOVING=['107','213','207'];
/* PLATAFORMAS MÓVILES: UNA sola imagen fija por tipo, sin elegir nada al azar ni depender de la posición:
   las que suben y bajan (elevator) siempre usan el tablón 213; las que van de lado a lado (horizontal), el 107. */
const FIJA={elevator:'213',horizontal:'107'};
function islaDe(pl,list){
  if(pl.moving)return FIJA[pl.mvType]||'213';                 // móvil de diseño: siempre la misma
  if(pl._islK&&ISLAS_META[pl._islK])return pl._islK;          // las demás: se elige una vez y se recuerda
  return pl._islK=pick(list,pl);
}                 // plataformas móviles: tablones de madera
const imgs={};
function img(k){let i=imgs[k];if(!i){i=imgs[k]=new Image();i.src='assets/islas/isla_'+k+'.png';}return i;}
/* La isla de cada plataforma se elige UNA sola vez y se guarda en la plataforma (pl._islK):
   antes dependía de pl.x, y en las plataformas móviles cambiaba en cada cuadro, así que las islas se intercambiaban sin parar. */
function pick(list,pl){const h=Math.abs(Math.floor(pl.x*0.37+pl.y*1.31+(pl.w||0)*0.11));return list[h%list.length];}
NinjaMods.register({id:'islas-flotantes',carpeta:'escenario',nombre:'Islas flotantes pintadas',
 desc:'Las plataformas del aire se ven como islas con árboles, templos, cristales o hielo según el tema de cada nivel.',
 init(){
  /* precarga los sets del nivel 1 para que no parpadeen */
  SETS.prairie.concat(MOVING).forEach(img);
  const o=window.drawPlatform;if(typeof o!=='function')return;
  window.drawPlatform=function(pl,bg,style){
    if(pl.isSkyZone||pl.isSkyPortal||pl.type==='ground')return o.apply(this,arguments);
    const px=pl.x-camX;if(px+pl.w<-80||px>W+80)return;
    const list=pl.moving?MOVING:(SETS[bg]||SETS.prairie),k=islaDe(pl,list),m=ISLAS_META[k],im=img(k);
    if(!m||!im.complete||!im.naturalWidth)return o.apply(this,arguments);   // mientras carga, dibujo original
    // ancho: un poco más que la plataforma; alto limitado para que no tape el escenario
    let dw=Math.min(pl.w*1.1,200),sc=dw/m.w;const maxH=125;if(m.h*sc>maxH){sc=maxH/m.h;dw=m.w*sc;}
    const dh=m.h*sc,dx=px+pl.w/2-dw/2,dy=pl.y-m.s*sc+3;
    CX.save();
    if(pl.moving){const pulse=.5+Math.sin(Date.now()*.004)*.3;CX.shadowColor=pl.mvType==='elevator'?'#00FFAA':'#FFAA00';CX.shadowBlur=10+pulse*8;}
    CX.drawImage(im,dx,dy,dw,dh);
    CX.restore();
  };
 }});
})();
