/* engine/escenario — FONDOS POR TEMA (cielo, astros, nubes, montañas y partículas)
   Reemplaza el fondo dibujado con código de 10 temas de nivel por escenas hechas con la biblioteca de arte (assets/environment/):
     hielo · noche · desierto · selva · agua · nubes · espacio · galaxia · lava/infierno · tormenta
   Cada escena = degradado de cielo + astro (sol, luna o vórtice) + capas de nubes que se mueven solas a distinta velocidad
   + dos capas de montañas con parallax (recoloreadas por tema) + partículas (nieve, brasas, luciérnagas, lluvia, estrellas…).
   Si una imagen aún no cargó, o el tema no está aquí (castillo, cripta, ciudad neón, jefe), se usa el fondo original. */
(function(){
if(!window.NinjaMods)return;
const E='assets/environment/',SK=E+'sky/',BG=E+'backgrounds/';
const IMG={};
function img(p){let i=IMG[p];if(!i){i=IMG[p]=new Image();i.src=p;}return i;}
const ok=i=>i&&i.complete&&i.naturalWidth>0;
const CL=['cloud_h02','cloud_h03','cloud_h04','cloud_h05','cloud_h06','cloud_h07','cloud_h08','cloud_h09','cloud_h10','cloud_h11','cloud_h12'].map(i=>SK+'clouds/'+i+'.png');
const CLB=['cloud_c01','cloud_d02','cloud_i01','cloud_i02','cloud_i03','cloud_i04','cloud_i05'].map(i=>SK+'clouds/'+i+'.png');
const BIG=[SK+'clouds/cloud_group_h01.png'];
const WARM=['cloud_warm_i01','cloud_warm_i02','cloud_warm_i03'].map(i=>SK+'clouds_warm/'+i+'.png');
const STORM=['storm_h01','storm_h02','storm_h03','storm_h04','storm_i01','storm_i02','storm_i03'].map(i=>SK+'storm/'+i+'.png');
const WIND=['wind_i01','wind_i02','wind_i03','wind_i04'].map(i=>SK+'wind/'+i+'.png');
const MT=t=>BG+'themes/montanas_'+t+'.png';
const SUN=SK+'sun_moon/sun.png',MOON=SK+'sun_moon/moon_full.png',CRES=SK+'sun_moon/moon_crescent.png',VX1=SK+'vortex/vortex_h01.png',VX2=SK+'vortex/vortex_h02.png',VX3=SK+'vortex/vortex_c01.png',LIGHT=SK+'fx/lightning_h01.png';
/* c: capas de nubes {l:lista, z:0 detrás de las montañas|2 delante, n, sc:[ancho relativo al alto], al, sp:[px/s], y:[fracción del cielo], tint, par}  */
const TH={
 ice:{sky:['#4C8FE0','#8EC2FA','#E6F4FF'],far:{p:MT('ice'),par:.05,hf:.30,al:.7},near:{p:BG+'scenery/mountains_ice.png',par:.10,hf:.46,al:1,espejo:1},
   c:[{l:WIND,z:0,n:3,sc:[.5,.8],al:[.5,.75],sp:[3,8],y:[.04,.4]},{l:CL,z:2,n:3,sc:[.45,.7],al:[.6,.85],sp:[5,11],y:[.0,.35]}],part:'nieve'},
 night:{sky:['#04061C','#141A55','#3C3A86'],stars:100,astro:[{p:MOON,x:.78,y:.2,w:.3,glow:'#cfe0ff',par:.004}],far:{p:MT('night'),par:.05,hf:.34,al:.85},near:{p:MT('night'),par:.11,hf:.46,al:1},
   c:[{l:[STORM[1],STORM[2],STORM[6]],z:0,n:4,sc:[.7,1.1],al:[.35,.55],sp:[2,6],y:[.05,.5]}],part:'luciernagas'},
 desert:{sky:['#FF8F3F','#FFC070','#FFE8B2'],astro:[{p:SUN,x:.72,y:.4,w:.42,glow:'#ffd890',par:.003}],far:{p:MT('desert'),par:.05,hf:.30,al:.75},near:{p:MT('desert'),par:.11,hf:.42,al:1},
   c:[{l:WARM,z:0,n:3,sc:[.8,1.3],al:[.65,.9],sp:[2,6],y:[.04,.4]},{l:WARM,z:2,n:2,sc:[.9,1.4],al:[.55,.8],sp:[6,12],y:[.0,.25]}],part:'polvo'},
 jungle:{sky:['#2E8A63','#7FCB92','#DDF5CC'],far:{p:MT('jungle'),par:.05,hf:.32,al:.75},near:{p:MT('jungle'),par:.11,hf:.44,al:1},
   c:[{l:CL,z:0,n:3,sc:[.5,.8],al:[.45,.7],sp:[2,6],y:[.04,.4]}],part:'luciernagas'},
 water:{sky:['#1B86CC','#69C5F0','#D6F3FF'],astro:[{p:SUN,x:.22,y:.28,w:.22,glow:'#fff3b0',par:.003}],far:{p:MT('water'),par:.05,hf:.30,al:.75},near:{p:MT('water'),par:.11,hf:.42,al:1},
   c:[{l:WIND,z:0,n:3,sc:[.5,.8],al:[.5,.7],sp:[3,8],y:[.05,.4]},{l:CL,z:2,n:3,sc:[.45,.7],al:[.6,.85],sp:[5,11],y:[.0,.3]}],part:'burbujas'},
 clouds:{sky:['#5AA9FF','#A9D5FF','#F0F8FF'],astro:[{p:SUN,x:.8,y:.24,w:.24,glow:'#fff6c8',par:.003}],
   c:[{l:BIG.concat(CLB),z:0,n:4,sc:[.7,1.1],al:[.7,.9],sp:[2,5],y:[.1,.6]},{l:CL,z:0,n:5,sc:[.5,.8],al:[.7,.9],sp:[4,9],y:[0,.5]},{l:CL,z:2,n:4,sc:[.7,1.1],al:[.75,.95],sp:[8,16],y:[.15,.7]}]},
 space:{sky:['#000008','#05061C','#14103A'],stars:170,astro:[{p:CRES,x:.18,y:.24,w:.16,glow:'#b8c8ff',par:.003},{p:VX1,x:.7,y:.34,w:.42,glow:'#4aa0ff',par:.006,spin:7}],c:[]},
 galaxy:{sky:['#05000F','#220848','#5A1068'],stars:140,nebula:1,astro:[{p:VX2,x:.66,y:.36,w:.6,glow:'#c050ff',par:.006,spin:4},{p:VX3,x:.2,y:.5,w:.26,glow:'#7a6aff',par:.01,spin:-6}],c:[]},
 lava:{sky:['#1A0404','#5A140A','#B03A12'],horizonte:'#ff6a1a',far:{p:MT('lava'),par:.05,hf:.34,al:.9},near:{p:MT('lava'),par:.11,hf:.46,al:1},
   c:[{l:STORM,z:0,n:4,sc:[.7,1.1],al:[.4,.6],sp:[3,8],y:[.04,.45],tint:'#ff5a1e'}],part:'brasas'},
 storm:{sky:['#070B1A','#1C2547','#3F4C70'],far:{p:MT('storm'),par:.05,hf:.32,al:.8},near:{p:MT('storm'),par:.11,hf:.42,al:1},rayos:1,
   c:[{l:STORM,z:0,n:4,sc:[.8,1.3],al:[.7,.95],sp:[4,10],y:[.0,.45]},{l:STORM,z:2,n:3,sc:[.9,1.4],al:[.55,.8],sp:[10,18],y:[.0,.3]}],part:'lluvia'}
};
TH.hell=TH.lava;
const rnd=(s=>()=>{s=(s*16807)%2147483647;return s/2147483647;});
const prep={};      // instancias por tema (deterministas, no saltan)
function preparar(bg,T){
  if(prep[bg])return prep[bg];
  const r=rnd(7919+bg.length*131+bg.charCodeAt(0)),ins=[];
  (T.c||[]).forEach(c=>{for(let k=0;k<c.n;k++){const R=a=>a[0]+r()*(a[1]-a[0]);
    ins.push({z:c.z,p:c.l[Math.floor(r()*c.l.length)],sc:R(c.sc),al:R(c.al),sp:R(c.sp),par:c.z===2?.14+r()*.08:.025+r()*.05,y:R(c.y),flip:r()<.5,x0:r(),bob:r()*6.28,tint:c.tint});}});
  const st=[];for(let i=0;i<(T.stars||0);i++)st.push([r(),r()*.7,r()*1.6+.6,r()*6.28]);
  const pt=[];for(let i=0;i<110;i++)pt.push([r(),r(),r(),r()]);
  return prep[bg]={ins,st,pt};
}
function todas(T){const L=[];['far','near'].forEach(k=>T[k]&&L.push(T[k].p));(T.astro||[]).forEach(a=>L.push(a.p));(T.c||[]).forEach(c=>c.l.forEach(p=>L.push(p)));if(T.rayos)L.push(LIGHT);return L;}
const tint={};
function teñida(i,col){const k=i.src+col;if(tint[k])return tint[k];const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');
  x.drawImage(i,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.55;x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return tint[k]=c;}
function listo(T){return todas(T).slice(0,3).every(p=>ok(img(p)));}
NinjaMods.register({id:'fondos-tema',carpeta:'escenario',nombre:'Fondos de nivel por tema',
 desc:'Cielo, sol o luna, nubes con movimiento propio, montañas con parallax y partículas para los niveles de hielo, noche, desierto, selva, agua, nubes, espacio, galaxia, lava y tormenta.',
 init(){
  const o=window.renderBg;if(typeof o!=='function'||typeof zoneBgFor!=='function')return;
  // precarga escalonada (no bloquea el arranque)
  Object.keys(TH).forEach((k,n)=>setTimeout(()=>todas(TH[k]).forEach(img),1200+n*350));
  function montes(m,GYv){
    const im=img(m.p);if(!ok(im))return;const ratio=im.naturalWidth/im.naturalHeight;
    const mh=Math.min(GYv*m.hf+30,360),mw=mh*ratio,off=camX*m.par,i0=Math.floor(off/mw),o0=off-i0*mw;
    CX.save();CX.globalAlpha=m.al;
    for(let k=0,x=-o0;x<W;k++,x+=mw){
      if(m.espejo&&((i0+k)%2+2)%2===1){CX.save();CX.translate(x+mw,GYv-mh+16);CX.scale(-1,1);CX.drawImage(im,0,0,mw+1,mh);CX.restore();}
      else CX.drawImage(im,x,GYv-mh+16,mw+1,mh);
    }
    CX.restore();
  }
  function nubes(P,z,t,GYv){
    const per0=W+260;
    for(const n of P.ins){if(n.z!==z)continue;const im=img(n.p);if(!ok(im))continue;
      const cw=H*n.sc*.62,ch=cw*im.naturalHeight/im.naturalWidth,per=per0+cw;
      const x=(((n.x0*per-(t/1000)*n.sp-camX*n.par)%per)+per)%per-cw,y=GYv*n.y+Math.sin(t*.0005+n.bob)*4;
      CX.globalAlpha=n.al;const src=n.tint?teñida(im,n.tint):im;
      if(n.flip){CX.save();CX.translate(x+cw,y);CX.scale(-1,1);CX.drawImage(src,0,0,cw,ch);CX.restore();}else CX.drawImage(src,x,y,cw,ch);
    }
    CX.globalAlpha=1;
  }
  function particulas(T,P,t,GYv,lite){
    const n=lite?.45:1;
    CX.save();
    if(T.part==='nieve'){CX.fillStyle='#fff';for(let i=0;i<Math.floor(80*n);i++){const q=P.pt[i];const x=((q[0]*W+Math.sin(t/900+q[2]*9)*14-(t/1000)*(6+q[1]*10)-camX*.3)%W+W)%W,y=((q[1]*H+(t/1000)*(18+q[2]*30))%H);CX.globalAlpha=.55+q[3]*.4;CX.fillRect(x,y,1.5+q[2]*2,1.5+q[2]*2);}}
    else if(T.part==='brasas'){for(let i=0;i<Math.floor(70*n);i++){const q=P.pt[i];const x=((q[0]*W+Math.sin(t/700+q[3]*9)*18-camX*.2)%W+W)%W,y=GYv-(((q[1]*GYv+(t/1000)*(25+q[2]*45))%GYv));
      CX.globalAlpha=Math.min(1,y/GYv*1.6)*(.5+.5*Math.sin(t/180+q[3]*20));CX.fillStyle=q[2]>.6?'#ffd27a':'#ff7a22';CX.fillRect(x,y,2+q[2]*2,2+q[2]*2);}}
    else if(T.part==='luciernagas'){for(let i=0;i<Math.floor(28*n);i++){const q=P.pt[i];const x=((q[0]*W+Math.sin(t/1300+q[2]*9)*30-camX*.25)%W+W)%W,y=GYv*(.45+q[1]*.5)+Math.cos(t/1100+q[3]*9)*14;
      const a=.35+.65*Math.max(0,Math.sin(t/500+q[3]*30));const g=CX.createRadialGradient(x,y,0,x,y,9);g.addColorStop(0,'rgba(220,255,140,'+a+')');g.addColorStop(1,'rgba(220,255,140,0)');CX.fillStyle=g;CX.fillRect(x-9,y-9,18,18);}}
    else if(T.part==='polvo'){CX.fillStyle='#fff1c8';for(let i=0;i<Math.floor(45*n);i++){const q=P.pt[i];const x=((q[0]*W-(t/1000)*(25+q[2]*40)-camX*.6)%W+W)%W,y=GYv*(.55+q[1]*.45)+Math.sin(t/800+q[3]*9)*6;CX.globalAlpha=.25+q[2]*.35;CX.fillRect(x,y,2+q[2]*3,1.2);}}
    else if(T.part==='burbujas'){CX.strokeStyle='rgba(255,255,255,.7)';CX.lineWidth=1;for(let i=0;i<Math.floor(34*n);i++){const q=P.pt[i];const x=((q[0]*W+Math.sin(t/600+q[3]*9)*8-camX*.3)%W+W)%W,y=GYv-(((q[1]*GYv+(t/1000)*(14+q[2]*26))%GYv));CX.globalAlpha=.3+q[2]*.4;CX.beginPath();CX.arc(x,y,2+q[2]*4,0,7);CX.stroke();}}
    else if(T.part==='lluvia'){CX.strokeStyle='rgba(190,210,255,.55)';CX.lineWidth=1.2;for(let i=0;i<Math.floor(90*n);i++){const q=P.pt[i];const x=((q[0]*W-(t/1000)*60-camX*.5)%W+W)%W,y=((q[1]*H+(t/1000)*(520+q[2]*260))%H);CX.globalAlpha=.25+q[2]*.35;CX.beginPath();CX.moveTo(x,y);CX.lineTo(x-5,y+16);CX.stroke();}}
    CX.restore();
  }
  window.renderBg=function(lv){
    let bg;try{bg=zoneBgFor(lv);}catch(e){return o.apply(this,arguments);}
    const T=TH[bg];if(!T||!listo(T))return o.apply(this,arguments);
    const t=Date.now(),GYv=groundY(),P=preparar(bg,T),lite=(typeof _perfMode!=='undefined'&&_perfMode==='lite');
    // 1) cielo
    const g=CX.createLinearGradient(0,0,0,GYv);g.addColorStop(0,T.sky[0]);g.addColorStop(.55,T.sky[1]);g.addColorStop(1,T.sky[2]);
    CX.fillStyle=g;CX.fillRect(0,0,W,H);
    if(T.nebula){[['#ff4fd8',.18,.3,.5],['#5a6bff',.16,.7,.4],['#b052ff',.15,.5,.7]].forEach(([c,a,fx,fy],i)=>{const x=W*fx+Math.sin(t/6000+i*2)*40,y=H*fy*.7;const r=Math.max(W,H)*.45;const gg=CX.createRadialGradient(x,y,0,x,y,r);gg.addColorStop(0,c+'55');gg.addColorStop(1,c+'00');CX.fillStyle=gg;CX.fillRect(0,0,W,H);});}
    if(T.horizonte){const gg=CX.createLinearGradient(0,GYv*.55,0,GYv);gg.addColorStop(0,'rgba(255,100,20,0)');gg.addColorStop(1,T.horizonte+'88');CX.fillStyle=gg;CX.fillRect(0,GYv*.55,W,GYv*.45);}
    // 2) estrellas
    if(T.stars){CX.fillStyle='#fff';const n=lite?Math.floor(T.stars*.5):T.stars;for(let i=0;i<n;i++){const s=P.st[i%P.st.length];if(!s)continue;CX.globalAlpha=.35+.65*Math.abs(Math.sin(t/900+s[3]*5));CX.fillRect(((s[0]*W-camX*.01)%W+W)%W,s[1]*GYv,s[2],s[2]);}CX.globalAlpha=1;}
    // 3) astros (sol, luna, vórtices)
    (T.astro||[]).forEach(a=>{const im=img(a.p);if(!ok(im))return;const w=H*a.w,h=w*im.naturalHeight/im.naturalWidth,x=W*a.x-camX*a.par,y=GYv*a.y;
      if(a.glow){const gg=CX.createRadialGradient(x,y,w*.2,x,y,w*1.1);gg.addColorStop(0,a.glow+'88');gg.addColorStop(1,a.glow+'00');CX.fillStyle=gg;CX.fillRect(x-w*1.2,y-w*1.2,w*2.4,w*2.4);}
      CX.save();CX.translate(x,y);if(a.spin)CX.rotate(t/1000*a.spin*Math.PI/180);CX.drawImage(im,-w/2,-h/2,w,h);CX.restore();});
    // 4-6) nubes lejanas → montañas → nubes cercanas
    nubes(P,0,t,GYv);
    if(T.far)montes(T.far,GYv);if(T.near)montes(T.near,GYv);
    nubes(P,2,t,GYv);
    // 7) partículas y relámpagos
    particulas(T,P,t,GYv,lite);
    if(T.rayos){const cyc=7300,ph=t%cyc;if(ph<260){const a=(1-ph/260);CX.save();CX.globalAlpha=a*.45;CX.fillStyle='#dfe8ff';CX.fillRect(0,0,W,H);const li=img(LIGHT);if(ok(li)){const k=Math.floor(t/cyc),x=((k*7919)%100)/100*W*.8+W*.1,w=H*.5,h=w*li.naturalHeight/li.naturalWidth;CX.globalAlpha=Math.min(1,a*1.6);CX.drawImage(li,x-w/2,GYv*.02,w,Math.min(h,GYv*.8));}CX.restore();}}
  };
 }});
})();
