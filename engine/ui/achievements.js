/* Logros locales de Ninja Multiplicación: ocho insignias, guardadas por navegador. */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.NinjaAchievements = api; api.attach(root); }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const KEY = 'ninja_achievements_v1';
  const DEFINITIONS = [
    { id: 'first-correct', title: 'Primer acierto', text: 'Resuelve correctamente tu primera pregunta.' },
    { id: 'ten-correct', title: 'Mente veloz', text: 'Resuelve diez preguntas correctamente.' },
    { id: 'combo-five', title: 'Racha ninja', text: 'Alcanza una racha de cinco respuestas correctas.' },
    { id: 'combo-ten', title: 'Maestro de las tablas', text: 'Alcanza una racha de diez respuestas correctas.' },
    { id: 'level-clear', title: 'Primer nivel', text: 'Completa tu primer nivel.' },
    { id: 'three-stars', title: 'Perfección', text: 'Completa un nivel con tres estrellas.' },
    { id: 'flawless', title: 'Intocable', text: 'Completa un nivel sin perder vidas.' },
    { id: 'campaign-clear', title: 'Campeón de la sesión', text: 'Completa todos los niveles de la Sesión 1.' }
  ];

  function create(store, notify) {
    let storage = store;
    if (!storage && typeof localStorage !== 'undefined') {
      try { storage = localStorage; } catch (e) { storage = null; }
    }
    const state = { v: 1, correct: 0, levels: 0, maxStreak: 0, unlocked: {} };
    try {
      const saved = storage && JSON.parse(storage.getItem(KEY) || 'null');
      if (saved && saved.v === 1) {
        state.correct = Math.max(0, +saved.correct || 0);
        state.levels = Math.max(0, +saved.levels || 0);
        state.maxStreak = Math.max(0, +saved.maxStreak || 0);
        if (saved.unlocked && typeof saved.unlocked === 'object') state.unlocked = saved.unlocked;
      }
    } catch (e) {}

    function unlock(id) {
      if (state.unlocked[id]) return;
      const achievement = DEFINITIONS.find(item => item.id === id);
      if (!achievement) return;
      state.unlocked[id] = Date.now();
      if (notify) notify(achievement);
    }
    function save() {
      try { if (storage) storage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function record(event, data) {
      data = data || {};
      if (event === 'correct') {
        state.correct++;
        state.maxStreak = Math.max(state.maxStreak, +data.streak || 0);
        if (state.correct >= 1) unlock('first-correct');
        if (state.correct >= 10) unlock('ten-correct');
        if (state.maxStreak >= 5) unlock('combo-five');
        if (state.maxStreak >= 10) unlock('combo-ten');
      } else if (event === 'level-complete') {
        state.levels++;
        unlock('level-clear');
        if (+data.stars >= 3) unlock('three-stars');
        if (data.damageFree) unlock('flawless');
        if (data.phase === 'easy' && data.campaignComplete) unlock('campaign-clear');
      } else {
        return false;
      }
      save();
      return true;
    }
    function summary() {
      return { unlocked: Object.keys(state.unlocked).length, total: DEFINITIONS.length };
    }
    return { record, summary, state, definitions: DEFINITIONS };
  }

  let attached = null;
  function attach(root) {
    if (attached || !root.document) return attached;
    const style = root.document.createElement('style');
    style.textContent = `
      #achievementToast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:15000;display:flex;align-items:center;gap:12px;
        width:min(440px,92vw);padding:12px 16px;border:2px solid #ffd700;border-radius:12px;background:linear-gradient(145deg,rgba(26,12,56,.98),rgba(4,8,36,.98));
        box-shadow:0 0 30px rgba(255,215,0,.45);color:#fff;font-family:'Press Start 2P',monospace;opacity:0;transform:translate(-50%,20px) scale(.92);pointer-events:none}
      #achievementToast.on{animation:achievementPop 3.2s ease forwards}
      #achievementToast .at-icon{font-size:28px}#achievementToast b{display:block;color:#ffd700;font-size:9px;margin-bottom:6px}
      #achievementToast span{display:block;font-size:7px;line-height:1.6;color:#dbe7ff}
      .achievement-overlay{position:fixed;inset:0;z-index:15001;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,15,.88);font-family:'Press Start 2P',monospace;color:#fff}
      .achievement-card{width:min(560px,96vw);max-height:88vh;overflow:auto;padding:16px;border:2px solid rgba(255,215,0,.55);border-radius:14px;background:linear-gradient(155deg,#120b38,#050b22);box-shadow:0 0 42px rgba(0,170,255,.25)}
      .achievement-card h2{text-align:center;color:#ffd700;font-size:clamp(11px,2.4vw,16px);margin:2px 0 8px}
      .achievement-progress{text-align:center;color:#9bdfff;font-size:8px;margin-bottom:12px}
      .achievement-row{display:flex;align-items:center;gap:10px;padding:10px;margin:6px 0;border:1px solid rgba(120,160,255,.2);border-radius:8px;background:rgba(0,0,35,.6)}
      .achievement-row.locked{opacity:.48;filter:grayscale(1)}.achievement-row .badge{font-size:22px}
      .achievement-row b{display:block;color:#ffe27a;font-size:8px;margin-bottom:5px}.achievement-row span{font-size:6px;line-height:1.6;color:#d5e0ff}
      .achievement-card button{display:block;margin:12px auto 0;padding:10px 14px;border:1px solid #00cfff;border-radius:8px;background:#082a72;color:#fff;font:8px 'Press Start 2P',monospace}
      @keyframes achievementPop{0%{opacity:0;transform:translate(-50%,20px) scale(.92)}12%,78%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-12px) scale(.98)}}
      @media(prefers-reduced-motion:reduce){#achievementToast.on{animation:none;opacity:1;transform:translate(-50%,0)}}
    `;
    root.document.head.appendChild(style);
    const toast = root.document.createElement('div');
    toast.id = 'achievementToast';toast.setAttribute('role', 'status');toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<div class="at-icon" aria-hidden="true">🏅</div><div><b></b><span></span></div>';
    root.document.body.appendChild(toast);
    let timer = null;
    attached = create(null, achievement => {
      const title = toast.querySelector('b'), text = toast.querySelector('span');
      title.textContent = '¡LOGRO DESBLOQUEADO! · ' + achievement.title;
      text.textContent = achievement.text;
      toast.classList.remove('on');void toast.offsetWidth;toast.classList.add('on');
      clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('on'),3300);
      const button=root.document.getElementById('achievementsButton');
      if(button){const count=attached.summary();button.textContent='🏅 LOGROS ('+count.unlocked+'/'+count.total+')';}
    });
    root.NinjaAchievements=attached;
    attached.open = function () {
      const old=root.document.querySelector('.achievement-overlay');if(old)old.remove();
      const overlay=root.document.createElement('div');overlay.className='achievement-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
      const card=root.document.createElement('div');card.className='achievement-card';
      const heading=root.document.createElement('h2');heading.textContent='🏅 LOGROS NINJA';
      const count=attached.summary(),progress=root.document.createElement('div');progress.className='achievement-progress';progress.textContent=count.unlocked+' de '+count.total+' insignias desbloqueadas';
      card.append(heading,progress);
      DEFINITIONS.forEach(item=>{
        const row=root.document.createElement('div'),icon=root.document.createElement('div'),copy=root.document.createElement('div'),title=root.document.createElement('b'),desc=root.document.createElement('span'),unlocked=!!attached.state.unlocked[item.id];
        row.className='achievement-row'+(unlocked?'':' locked');icon.className='badge';icon.textContent=unlocked?'🏅':'🔒';title.textContent=item.title;desc.textContent=item.text;
        copy.append(title,desc);row.append(icon,copy);card.appendChild(row);
      });
      const close=root.document.createElement('button');close.type='button';close.textContent='CERRAR';close.addEventListener('click',()=>overlay.remove());card.appendChild(close);
      overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});overlay.appendChild(card);root.document.body.appendChild(overlay);close.focus();
    };
    const button=root.document.getElementById('achievementsButton');
    if(button){const count=attached.summary();button.textContent='🏅 LOGROS ('+count.unlocked+'/'+count.total+')';}
    return attached;
  }
  return { KEY, DEFINITIONS, create, attach };
});
