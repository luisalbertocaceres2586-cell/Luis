/* INTRO CINEMÁTICA — capas independientes para el menú y selector */
(function(){
'use strict';
const S0=document.getElementById('S0'); if(!S0 || document.getElementById('ninjaIntroLayers')) return;
const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const layers=document.createElement('div'); layers.id='ninjaIntroLayers'; layers.setAttribute('aria-hidden','true');
layers.innerHTML='<div class="ni-stars"></div><div class="ni-moon"></div><div class="ni-mountains"></div><div class="ni-pagoda"><svg viewBox="0 0 420 360" role="presentation"><defs><linearGradient id="niRoof" x2="0" y2="1"><stop stop-color="#f9a8ff"/><stop offset="1" stop-color="#552b9c"/></linearGradient><linearGradient id="niWall" x2="0" y2="1"><stop stop-color="#394b8b"/><stop offset="1" stop-color="#111a3c"/></linearGradient></defs><path d="M205 30L395 92 420 110 205 78 0 110 22 92Z" fill="url(#niRoof)" stroke="#f5c8ff" stroke-width="5"/><path d="M205 45L205 330M65 116H345V330H65Z" fill="url(#niWall)" stroke="#a78bfa" stroke-width="4"/><path d="M35 142L205 105 385 142 405 159 205 128 15 159Z" fill="url(#niRoof)" stroke="#f5c8ff" stroke-width="4"/><path d="M80 160H330V330H80Z" fill="#101a3b"/><path d="M105 178H150V250H105ZM180 178H225V250H180ZM255 178H300V250H255Z" fill="#ffb0ef" opacity=".8"/><path d="M15 330H405" stroke="#ffc247" stroke-width="8"/><path d="M150 330V270Q205 210 260 270V330" fill="#080e26" stroke="#ffc247" stroke-width="5"/></svg></div><div class="ni-torii"></div><div class="ni-petals"></div><div class="ni-vignette"></div>';
S0.insertBefore(layers,S0.firstChild);
const style=document.createElement('style'); style.id='ninjaIntroLayerCss'; style.textContent=`
#S0{isolation:isolate!important;position:fixed!important;background:#090b25!important}
#ninjaIntroLayers{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;background:radial-gradient(ellipse at 50% 38%,rgba(55,35,119,.25),transparent 58%)}
#ninjaIntroLayers>div{position:absolute;pointer-events:none}
.ni-stars{inset:0;background-image:radial-gradient(2px 2px at 12% 22%,#fff 60%,transparent 100%),radial-gradient(1px 1px at 74% 18%,#ffd8ff 60%,transparent 100%),radial-gradient(2px 2px at 88% 42%,#fff 60%,transparent 100%),radial-gradient(1px 1px at 35% 16%,#c4b5fd 60%,transparent 100%);background-size:370px 260px;opacity:.7;animation:niStars 22s linear infinite}
.ni-moon{width:clamp(180px,30vw,430px);aspect-ratio:1;right:10%;top:4%;border-radius:50%;background:radial-gradient(circle at 38% 35%,#fff9ff 0 5%,#f7d9ff 24%,#b9a8ff 54%,rgba(117,89,203,.12) 72%,transparent 74%);filter:drop-shadow(0 0 42px rgba(206,160,255,.65));opacity:.82;animation:niMoon 9s ease-in-out infinite}
.ni-mountains{left:-8%;right:-8%;bottom:0;height:56%;background:linear-gradient(155deg,transparent 0 24%,rgba(26,34,81,.92) 24.2% 44%,transparent 44.2%),linear-gradient(25deg,transparent 0 25%,rgba(42,28,91,.95) 25.2% 55%,transparent 55.2%),linear-gradient(180deg,transparent 0%,#0b102b 70%);clip-path:polygon(0 50%,12% 20%,23% 55%,39% 10%,55% 58%,72% 15%,88% 52%,100% 28%,100% 100%,0 100%);opacity:.82;animation:niMount 18s ease-in-out infinite alternate}
.ni-pagoda{position:absolute!important;width:clamp(180px,26vw,390px);right:4%;bottom:7%;opacity:.58;filter:drop-shadow(0 0 24px rgba(185,111,255,.4));transform-origin:bottom center;animation:niPagoda 8s ease-in-out infinite}
.ni-pagoda svg{display:block;width:100%;height:auto}
.ni-torii{width:clamp(150px,22vw,320px);height:clamp(115px,18vw,230px);left:2%;bottom:7%;opacity:.44;filter:drop-shadow(0 0 14px #f0abff);background:linear-gradient(#e85bb5,#a02c8d);clip-path:polygon(0 0,100% 0,96% 12%,82% 12%,82% 100%,70% 100%,70% 22%,30% 22%,30% 100%,18% 100%,18% 12%,4% 12%)}
.ni-petals{inset:-10%;opacity:.8;background-image:radial-gradient(ellipse 7px 4px at 12% 20%,#ff9de2 0 70%,transparent 72%),radial-gradient(ellipse 6px 4px at 45% 72%,#ffd0f2 0 70%,transparent 72%),radial-gradient(ellipse 7px 4px at 83% 35%,#e879d0 0 70%,transparent 72%),radial-gradient(ellipse 5px 3px at 65% 12%,#ffd0f2 0 70%,transparent 72%);background-size:260px 230px;animation:niPetals 18s linear infinite}
.ni-vignette{inset:0;background:linear-gradient(90deg,rgba(4,6,22,.25),transparent 38%,rgba(4,6,22,.12)),linear-gradient(180deg,rgba(4,5,20,.06),rgba(5,7,24,.58) 75%,rgba(4,5,18,.9))}
#S0>div[style*="z-index:2"]{z-index:3!important}
#S0 #introBg{z-index:2!important}
#S0 #introTitle{max-width:min(78vw,610px)!important;max-height:19vh!important;filter:drop-shadow(0 0 26px rgba(236,93,255,.5)) drop-shadow(0 7px 15px rgba(0,0,0,.8))!important}
#S0 #menuTypewriter{font-family:Inter,system-ui,sans-serif!important;font-size:clamp(10px,1.5vw,14px)!important;font-weight:900;letter-spacing:.18em!important;color:#ffd5f5!important;text-shadow:0 0 18px #d946ef,0 3px 12px #000!important}
#S0 .heroPick{width:min(96vw,1120px)!important;max-width:1120px!important;margin:clamp(4px,1vh,12px) auto 0!important}
#S0 #cpick{--c1:#ec4899;--c2:#4c1d65;--c3:#ffd1f2;color:#fff}
#S0 #cpick .cp-kicker{color:#f0abfc!important;letter-spacing:.24em!important}
#S0 #cpick .cp-heading{font-size:clamp(17px,2.6vw,25px)!important;text-shadow:0 0 22px rgba(217,70,239,.55),0 4px 16px #000!important}
#S0 #cpick .cp-sub{color:#e3d7f6!important}
#S0 #cpick .cp-main{display:grid!important;grid-template-columns:minmax(220px, .9fr) minmax(350px,1.2fr)!important;gap:clamp(12px,2vw,28px)!important;align-items:stretch!important}
#S0 #niHeroStage{position:relative;min-height:clamp(260px,43vh,470px);display:flex;align-items:flex-end;justify-content:center;overflow:visible;border:1px solid rgba(244,114,182,.24);border-radius:26px;background:radial-gradient(ellipse at 50% 62%,rgba(217,70,239,.26),transparent 62%),linear-gradient(145deg,rgba(20,12,48,.5),rgba(8,12,34,.32));box-shadow:inset 0 1px rgba(255,255,255,.08),0 18px 48px rgba(0,0,0,.22)}
#S0 #niHeroStage:before{content:"";position:absolute;width:75%;height:14%;bottom:7%;border-radius:50%;background:rgba(236,72,153,.28);filter:blur(22px)}
#S0 #niHeroStage img{position:relative;z-index:1;height:94%;max-width:96%;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 10px 24px rgba(0,0,0,.65)) drop-shadow(0 0 22px rgba(232,121,249,.35));animation:niHeroFloat 4.5s ease-in-out infinite;transform-origin:50% 85%}
#S0 #niHeroStage .ni-hero-caption{position:absolute;left:14px;bottom:12px;z-index:2;font:900 10px Inter,sans-serif;letter-spacing:.2em;color:#fbcfe8;text-shadow:0 2px 8px #000}
#S0 #niSelectColumn{display:flex;flex-direction:column;justify-content:center;gap:12px;min-width:0}
#S0 #cpick .cp-cards{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(10px,1.6vw,18px)!important;width:100%}
#S0 #cpick .cp-card{--ch:clamp(165px,27vh,260px)!important;width:100%!important;height:var(--ch)!important;border-radius:20px!important;border:1px solid rgba(255,255,255,.22)!important;background:radial-gradient(ellipse at 50% 36%,var(--k1),var(--k2) 64%,#10152b 100%)!important;box-shadow:0 16px 34px rgba(0,0,0,.32)!important;overflow:hidden}
#S0 #cpick .cp-card:after{inset:7px!important;border:1px solid color-mix(in srgb,var(--k3) 45%,transparent)!important;border-radius:14px!important}
#S0 #cpick .cp-card img{height:79%!important;width:94%!important;top:0!important;object-position:50% 100%!important;filter:drop-shadow(0 8px 16px rgba(0,0,0,.5))!important}
#S0 #cpick .cp-card.on{transform:translateY(-7px) scale(1.025)!important;border:2px solid var(--k3)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--k3) 22%,transparent),0 0 34px color-mix(in srgb,var(--k1) 45%,transparent),0 20px 42px rgba(0,0,0,.42)!important}
#S0 #cpick .cp-panel{max-width:none!important;width:100%!important;flex:1 1 auto!important;display:grid!important;grid-template-columns:1fr auto;align-items:center!important;gap:8px 14px!important;padding:16px 18px!important;border-radius:20px!important;border:1px solid rgba(244,114,182,.32)!important;background:linear-gradient(145deg,rgba(37,18,64,.9),rgba(10,15,37,.92))!important;box-shadow:0 18px 44px rgba(0,0,0,.3),inset 0 1px rgba(255,255,255,.08)!important}
#S0 #cpick .cp-label,#S0 #cpick .cp-role,#S0 #cpick .cp-desc,#S0 #cpick .cp-skill,#S0 #cpick .cp-hint{grid-column:1/-1}
#S0 #cpick .cp-name{font-size:clamp(24px,3vw,38px)!important;color:#f9a8d4!important;text-shadow:0 0 24px rgba(236,72,153,.45)!important}
#S0 #cpick .cp-label{color:#f0abfc!important}
#S0 #cpick .cp-skill{background:rgba(217,70,239,.12)!important;border-color:rgba(232,121,249,.38)!important}
#S0 #cpick .cp-skill b{color:#f9a8d4!important}
#S0 #cpPlay{grid-column:1/-1!important;align-items:stretch!important}
#S0 #cpPlay #btnStart{width:100%!important;max-width:340px!important;margin:4px auto!important;padding:8px 18px!important;border-radius:16px!important;background:linear-gradient(135deg,#ffe08a,#f59e0b 45%,#e85d04)!important;border:1px solid #ffe7a3!important;box-shadow:0 5px 0 #8a3d08,0 0 30px rgba(251,146,60,.38)!important;animation:niStartPulse 2.1s ease-in-out infinite!important}
#S0 #cpPlay #btnStart img{height:clamp(36px,6vh,52px)!important;max-width:92%!important;filter:brightness(.25) sepia(1) saturate(3) hue-rotate(350deg)!important}
#S0 #cpPlay #btnCont{width:100%!important}
@keyframes niStars{to{background-position:370px 260px}}
@keyframes niMoon{50%{transform:translateY(-9px) scale(1.025)}}
@keyframes niMount{to{transform:translateX(2%) translateY(-1%)}}
@keyframes niPagoda{50%{transform:translateY(-6px)}}
@keyframes niPetals{to{background-position:260px 460px}}
@keyframes niHeroFloat{50%{transform:translateY(-10px) scale(1.012)}}
@keyframes niStartPulse{50%{filter:brightness(1.12);box-shadow:0 5px 0 #8a3d08,0 0 42px rgba(251,146,60,.62)}}
@media(max-width:760px){#S0 #cpick .cp-main{grid-template-columns:1fr!important;gap:10px!important}#S0 #niHeroStage{min-height:clamp(185px,28vh,260px);max-height:260px}#S0 #niHeroStage img{height:96%}#S0 #cpick .cp-card{--ch:clamp(145px,23vh,205px)!important}#S0 #cpick .cp-panel{padding:12px!important;gap:6px!important}}
@media(max-height:620px) and (orientation:landscape){#S0 #cpick .cp-main{grid-template-columns:minmax(180px,.75fr) minmax(340px,1.25fr)!important}#S0 #niHeroStage{min-height:220px}#S0 #cpick .cp-card{--ch:clamp(130px,34vh,190px)!important}}
@media(prefers-reduced-motion:reduce){#ninjaIntroLayers *{animation:none!important}#S0 #niHeroStage img{animation:none!important}#S0 #cpPlay #btnStart{animation:none!important}}
`;document.head.appendChild(style);
const artStyle=document.createElement('style');artStyle.id='ninjaIntroAssetLayers';artStyle.textContent=`
.ni-moon{background:url('assets/ui/intro/layers/moon.svg') center/contain no-repeat!important}
.ni-mountains{background:url('assets/ui/intro/layers/mountains.svg') center bottom/100% 100% no-repeat!important;clip-path:none!important}
.ni-pagoda{background:url('assets/ui/intro/layers/pagoda.svg') center bottom/contain no-repeat!important}
.ni-pagoda svg{display:none!important}
.ni-torii{background:url('assets/ui/intro/layers/torii.svg') center/contain no-repeat!important;clip-path:none!important}
.ni-petals{background:url('assets/ui/intro/layers/petals.svg') center/300px 250px repeat!important}
`;document.head.appendChild(artStyle);
function mountStage(){
 const pick=document.getElementById('cpick'),main=pick&&pick.querySelector('.cp-main'),cards=pick&&pick.querySelector('.cp-cards'),panel=pick&&pick.querySelector('.cp-panel');
 if(!main||!cards||!panel||document.getElementById('niHeroStage'))return false;
 const stage=document.createElement('div');stage.id='niHeroStage';stage.innerHTML='<img src="assets/characters/sakura_assets/sakura/frames/idle/sakura_idle_01.png" alt="Sakura Eve, ninja protagonista" draggable="false"><span class="ni-hero-caption">HÉROE DESTACADA · SAKURA EVE</span>';
 const col=document.createElement('div');col.id='niSelectColumn';main.append(stage,col);col.append(cards,panel);
 const update=()=>{const chosen=cards.querySelector('.cp-card.on');const im=stage.querySelector('img');if(chosen&&chosen.dataset.c==='peach'){im.src='assets/characters/kage/idle_00.png';stage.querySelector('.ni-hero-caption').textContent='HÉROE DESTACADO · KAGE';}else{im.src='assets/characters/sakura_assets/sakura/frames/idle/sakura_idle_01.png';stage.querySelector('.ni-hero-caption').textContent='HÉROE DESTACADA · SAKURA EVE';}};
 cards.addEventListener('click',()=>requestAnimationFrame(update));update();return true;
}
if(!mountStage()){const mo=new MutationObserver(()=>{if(mountStage())mo.disconnect();});mo.observe(S0,{childList:true,subtree:true});}
})();