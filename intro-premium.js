/* NINJA MULTIPLICACIÓN — Intro Premium v1, integrado con #cpick */
(function(){
'use strict';
const menu=document.getElementById('S0');
if(!menu||menu.dataset.premiumIntro==='ready')return;
menu.dataset.premiumIntro='ready';
const heroPick=menu.querySelector('.heroPick');
if(!heroPick)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene=document.createElement('div');scene.className='intro-premium-scene';scene.setAttribute('aria-hidden','true');
scene.innerHTML='<i class="ip-moon"></i><i class="ip-mountains"></i><i class="ip-pagoda"></i><i class="ip-torii"></i><i class="ip-petals"></i>';
menu.insertBefore(scene,menu.firstChild);
const particleLayer=document.createElement('div');particleLayer.className='intro-premium-particles';particleLayer.setAttribute('aria-hidden','true');menu.appendChild(particleLayer);
const palette=['','gold','violet'];
for(let i=0;i<28;i++){const p=document.createElement('i');p.className='intro-premium-particle '+palette[i%palette.length];p.style.left=(Math.random()*100)+'%';p.style.setProperty('--dur',(7+Math.random()*9)+'s');p.style.setProperty('--drift',((Math.random()-.5)*130)+'px');p.style.animationDelay=(-Math.random()*14)+'s';p.style.opacity=(.25+Math.random()*.45).toFixed(2);particleLayer.appendChild(p);}
const cpick=menu.querySelector('#cpick');
const cards=cpick?[...cpick.querySelectorAll('.cp-card[data-c]')]:[];
const hint=document.createElement('p');hint.className='np-selection-hint';hint.textContent='Selecciona tu ninja y prepárate para la aventura';
const start=menu.querySelector('#btnStart');if(start)start.insertAdjacentElement('beforebegin',hint);
const labels={mario:'SAKURA EVE · NINJA DEL VIENTO',peach:'KAGE · NINJA DE LA SOMBRA'};
function reflectSelection(id){const name=labels[id]||labels.mario;hint.textContent=name+'  ·  ¡LISTO PARA JUGAR!';cards.forEach(card=>{const selected=card.dataset.c===id;card.setAttribute('aria-checked',String(selected));card.setAttribute('tabindex','0');});}
function sync(){const active=cards.find(c=>c.classList.contains('on'));if(active)reflectSelection(active.dataset.c);}
cards.forEach(card=>{card.addEventListener('click',()=>requestAnimationFrame(sync));card.addEventListener('keydown',(/** @type {KeyboardEvent} */ ev)=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();/** @type {HTMLElement} */ (card).click();}});});
sync();
if(!reduced&&window.matchMedia('(pointer:fine)').matches){let raf=0;menu.addEventListener('pointermove',ev=>{if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const r=menu.getBoundingClientRect();const x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;heroPick.style.transform='translateZ(24px) rotateY('+(x*5).toFixed(2)+'deg) rotateX('+(y*-4).toFixed(2)+'deg)';});});menu.addEventListener('pointerleave',()=>{heroPick.style.transform='translateZ(24px) rotateY(0) rotateX(0)';});}
menu.querySelectorAll('button').forEach(btn=>btn.addEventListener('pointerdown',()=>{btn.classList.add('np-pressed');window.setTimeout(()=>btn.classList.remove('np-pressed'),180);},{passive:true}));
if(start)start.addEventListener('click',()=>{const flash=document.createElement('div');flash.className='np-start-flash';menu.appendChild(flash);window.setTimeout(()=>flash.remove(),520);});
const originalShowS=window.showS;if(typeof originalShowS==='function'&&!originalShowS.__premiumWrapped){const wrapped=function(n){const result=originalShowS.apply(this,arguments);if(n===0)sync();return result;};wrapped.__premiumWrapped=true;window.showS=wrapped;}
const observer=new MutationObserver(()=>{const now=[...menu.querySelectorAll('#cpick .cp-card[data-c]')];if(now.length&&now.length!==cards.length){cards.splice(0,cards.length,...now);cards.forEach(card=>card.addEventListener('click',()=>requestAnimationFrame(sync)));sync();}});observer.observe(menu,{childList:true,subtree:true});
})();