/* Nivel 2 · Surf de Dunas (motor propio, independiente del Nivel 1)
   Desliza por dunas con 3 carriles, salta obstáculos y cruza la compuerta con la respuesta correcta.
   Tablas 4, 5 y 6 con modo adaptativo. Final: Escorpión Colosal. */
(function () {
  'use strict';
  const W = 960, H = 540, GR = 1500, CARR = 42, X_H = 230;
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hY = x => 372 + Math.sin(x / 420) * 46 + Math.sin(x / 190 + 1.3) * 15;
  const laneY = (x, l) => hY(x) + (l - 1) * CARR;
  const mez = a => { for (let i = a.length - 1; i > 0; i--) { const j = RI(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function pregunta(fallos) {
    const pool = [];
    [4, 5, 6].forEach(t => { for (let n = 2; n <= 10; n++) { const w = 1 + 3 * (fallos[t + 'x' + n] || 0); for (let i = 0; i < w; i++) pool.push([t, n]); } });
    const [t, n] = pool[RI(0, pool.length - 1)], r = t * n, tipo = RI(0, 2);
    let txt, ans = r, cand;
    if (tipo === 0) txt = t + ' × ' + n + ' = ?';
    else if (tipo === 1) { txt = t + ' × ? = ' + r; ans = n; }
    else txt = n + ' veces ' + t + ' = ?';
    cand = tipo === 1 ? [n - 1, n + 1, n + 2, n - 2] : [r - t, r + t, r + 1, r - 1, r + 2 * t];
    const ops = mez([...new Set(cand.filter(x => x > 0 && x !== ans))]).slice(0, 2);
    ops.push(ans); mez(ops);
    return { txt, ans, ops, key: t + 'x' + n };
  }

  function iniciar(o) {
    o = o || {};
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;z-index:50;background:#060818;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;font-family:ui-monospace,monospace';
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = 'width:min(100vw,177.7vh);height:auto;max-height:100vh;background:#0a0c26';
    root.appendChild(cv); document.body.appendChild(root);
    const cx = cv.getContext('2d');
    const kage = o.heroe === 'kage', colH = kage ? '#4aa3ff' : '#ff6fa8';
    const fallosPrev = (o.perfil && o.perfil.nivel2 && o.perfil.nivel2.fallos) || {};
    const estrellas = Array.from({ length: 70 }, () => ({ x: R(0, W), y: R(0, 230), r: R(.4, 1.6), f: R(0, 6) }));
    let S, raf = 0, ult = 0, ac = null;

    const beep = (f, d, tipo) => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const os = ac.createOscillator(), g = ac.createGain(); os.type = tipo || 'square'; os.frequency.value = f; g.gain.value = .05; os.connect(g); g.connect(ac.destination); os.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); os.stop(ac.currentTime + d); } catch (e) {} };

    function nuevo() {
      S = { est: 'play', t: 0, d: 0, v: 300, lane: 1, ly: 1, z: 0, vz: 0, vidas: 3, punt: 0, racha: 0, aci: 0, err: 0, inv: 0, boost: 0, flash: 0, shake: 0,
        obs: [], gates: [], gotas: [], gen: 900, fallos: Object.assign({}, fallosPrev), fase: 'ruta', respondidas: 0, jefe: null, msg: { t: 3, s: 'SURF DE DUNAS · ¡cruza la compuerta correcta!' }, part: [], inputs: {} };
    }

    function generar() {
      while (S.gen < S.d + 3000) {
        const g0 = S.gen, jefe = S.fase === 'jefe', n = jefe ? RI(1, 2) : RI(3, 5);
        for (let i = 0; i < n; i++) {
          const x = g0 + 250 + i * RI(260, 380), tipo = ['cac', 'esc', 'roca'][RI(0, 2)];
          S.obs.push({ x, l: RI(0, 2), tipo, h: tipo === 'cac' ? 56 : tipo === 'roca' ? 40 : 28 });
          if (Math.random() < .7) for (let k = 0; k < 3; k++) S.gotas.push({ x: x - 120 + k * 36, l: RI(0, 2), y: 60 + Math.sin(k) * 20, ok: false });
        }
        const q = pregunta(S.fallos); S.gates.push({ x: g0 + 2000, q, res: false, lane: -1, ok: false });
        S.gen += 2500;
      }
    }

    function responder(g) {
      const l = clamp(Math.round(S.ly), 0, 2), ok = g.q.ops[l] === g.q.ans;
      g.res = true; g.lane = l; g.ok = ok; S.respondidas++;
      if (ok) {
        S.aci++; S.racha++; S.punt += 100 + Math.min(S.racha, 6) * 25; S.boost = 1.4; S.flash = .25; beep(660, .12); setTimeout(() => beep(880, .15), 90);
        S.msg = { t: 1.3, s: S.racha >= 3 ? '¡RACHA ×' + S.racha + '!' : '¡CORRECTO! ' + g.q.txt.replace('?', g.q.ans) };
        if (S.jefe) { S.jefe.hp--; S.jefe.gap = Math.min(S.jefe.gap + 55, 340); S.shake = .5; if (S.jefe.hp <= 0) return terminar(true); }
      } else {
        S.err++; S.racha = 0; S.fallos[g.q.key] = (S.fallos[g.q.key] || 0) + 1; daño('¡Era ' + g.q.ans + '!');
        if (S.jefe) S.jefe.gap = Math.max(S.jefe.gap - 40, 150);
      }
      if (!S.jefe && S.respondidas >= 8 && S.fase === 'ruta') {
        S.fase = 'jefe'; S.jefe = { hp: 5, max: 5, gap: 300, atq: null, cd: 2.5 };
        S.msg = { t: 3.5, s: '¡ESCORPIÓN COLOSAL! Acierta 5 compuertas' }; S.obs = S.obs.filter(ob => ob.x < S.d + 900);
      }
    }

    function daño(txt) {
      if (S.inv > 0) return; S.vidas--; S.inv = 1.5; S.v = Math.min(S.v, 260); S.shake = .35; beep(150, .3, 'sawtooth');
      if (txt) S.msg = { t: 1.6, s: txt }; if (S.vidas <= 0) terminar(false);
    }

    function actualizar(dt) {
      S.t += dt; const k = S.inputs;
      if (S.msg.t > 0) S.msg.t -= dt; S.inv = Math.max(0, S.inv - dt); S.boost = Math.max(0, S.boost - dt); S.flash = Math.max(0, S.flash - dt); S.shake = Math.max(0, S.shake - dt);
      S.ly += (S.lane - S.ly) * Math.min(1, dt * 10);
      if (k.salto && S.z === 0) { S.vz = 560; k.salto = false; beep(420, .08, 'triangle'); }
      S.vz -= GR * dt; S.z = Math.max(0, S.z + S.vz * dt); if (S.z === 0 && S.vz < 0) S.vz = 0;
      const objetivo = S.boost > 0 ? 560 : 360, pend = (hY(S.d + 6) - hY(S.d - 6)) / 12;
      S.v += (objetivo - S.v) * dt * 1.2 + pend * 520 * dt; S.v = clamp(S.v, 240, 640);
      S.d += S.v * dt;
      generar();
      const lh = clamp(Math.round(S.ly), 0, 2);
      S.obs.forEach(ob => { if (!ob.hit && ob.l === lh && Math.abs(ob.x - S.d) < 30 && S.z < ob.h - 8) { ob.hit = true; daño(); } });
      S.gotas.forEach(g => { if (!g.ok && g.l === lh && Math.abs(g.x - S.d) < 28 && S.z > g.y - 55 && S.z < g.y + 40) { g.ok = true; S.punt += 10; S.boost = Math.max(S.boost, .5); beep(980, .05, 'sine'); } });
      S.gates.forEach(g => { if (!g.res && S.d >= g.x) responder(g); });
      if (S.jefe) {
        const j = S.jefe; j.cd -= dt;
        if (!j.atq && j.cd <= 0) { j.atq = { l: RI(0, 2), t: 0 }; }
        if (j.atq) { j.atq.t += dt; if (j.atq.t > .9 && !j.atq.golpe) { j.atq.golpe = true; if (clamp(Math.round(S.ly), 0, 2) === j.atq.l && S.z < 50) daño('¡Aguijón!'); S.shake = .3; }
          if (j.atq.t > 1.2) { j.atq = null; j.cd = R(1.6, 2.6); } }
      }
      if (S.est === 'play' && Math.random() < dt * 20) S.part.push({ x: S.d - 20, l: S.ly, z: S.z, vx: -R(60, 160), vz: R(30, 120), t: .5 });
      S.part.forEach(p => { p.t -= dt; p.x += p.vx * dt; p.z += p.vz * dt; }); S.part = S.part.filter(p => p.t > 0);
      S.obs = S.obs.filter(ob => ob.x > S.d - 400); S.gotas = S.gotas.filter(g => g.x > S.d - 400); S.gates = S.gates.filter(g => !g.res || g.x > S.d - 500);
    }

    function dibujar() {
      const cam = S.d - X_H; cx.save();
      if (S.shake > 0) cx.translate(R(-5, 5) * S.shake * 2, R(-5, 5) * S.shake * 2);
      const cie = cx.createLinearGradient(0, 0, 0, 330); cie.addColorStop(0, '#05061a'); cie.addColorStop(.6, '#2a1f55'); cie.addColorStop(1, '#a4506a');
      cx.fillStyle = cie; cx.fillRect(-10, -10, W + 20, H + 20);
      estrellas.forEach(s => { cx.globalAlpha = .4 + .6 * Math.abs(Math.sin(S.t + s.f)); cx.fillStyle = '#fff'; cx.fillRect(s.x, s.y, s.r, s.r); }); cx.globalAlpha = 1;
      cx.fillStyle = '#ffe9a8'; cx.beginPath(); cx.arc(780, 90, 38, 0, 7); cx.fill(); cx.fillStyle = '#2a1f55'; cx.beginPath(); cx.arc(795, 82, 34, 0, 7); cx.fill();
      [[.12, 280, '#3a2a63', 90], [.28, 320, '#5b3a6e', 60]].forEach(([p, b, c, a]) => { cx.fillStyle = c; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W; x += 16) cx.lineTo(x, b + Math.sin((x + cam * p) / 230) * a * .5); cx.lineTo(W, H); cx.fill(); });
      cx.fillStyle = '#3a2a63'; const pc = -cam * .08 % 700; for (let i = -1; i < 3; i++) { const px = pc + i * 700 + 300; cx.beginPath(); cx.moveTo(px - 70, 285); cx.lineTo(px, 205); cx.lineTo(px + 70, 285); cx.fill(); }
      const cols = ['#b9764f', '#cf8a58', '#e3a066'];
      for (let l = 0; l < 3; l++) { cx.fillStyle = cols[l]; cx.beginPath(); cx.moveTo(0, H); for (let x = 0; x <= W + 12; x += 12) cx.lineTo(x, laneY(cam + x, l) - CARR / 2); cx.lineTo(W + 12, H); cx.fill();
        cx.strokeStyle = 'rgba(255,230,170,.35)'; cx.lineWidth = 2; cx.beginPath(); for (let x = 0; x <= W + 12; x += 12) { const y = laneY(cam + x, l) - CARR / 2; x ? cx.lineTo(x, y) : cx.moveTo(x, y); } cx.stroke();
        dibujarLane(l, cam); }
      cx.restore(); hud();
    }

    function dibujarLane(l, cam) {
      const sx = x => x - cam, sy = (x, z) => laneY(x, l) - (z || 0);
      if (S.jefe && S.jefe.atq && S.jefe.atq.l === l) { cx.fillStyle = 'rgba(255,40,40,' + (.25 + .2 * Math.sin(S.t * 30)) + ')'; cx.fillRect(X_H - 50, sy(S.d, 0) - 24, 120, 40); }
      S.gates.forEach(g => { const x = sx(g.x); if (x < -80 || x > W + 80) return; const y = sy(g.x, 0), col = !g.res ? '#ffd35a' : (g.lane === l ? (g.ok ? '#53e08a' : '#ff5a5a') : '#6b5a7a');
        cx.strokeStyle = col; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(x - 26, y); cx.lineTo(x - 26, y - 78); cx.moveTo(x + 26, y); cx.lineTo(x + 26, y - 78); cx.stroke();
        cx.fillStyle = col; cx.globalAlpha = .28; cx.fillRect(x - 24, y - 76, 48, 76); cx.globalAlpha = 1;
        cx.fillStyle = '#fff'; cx.font = 'bold 22px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(g.q.ops[l], x, y - 38); });
      S.obs.forEach(ob => { if (ob.l !== l) return; const x = sx(ob.x), y = sy(ob.x, 0); if (x < -60 || x > W + 60) return;
        if (ob.tipo === 'cac') { cx.fillStyle = '#2f9e5f'; cx.fillRect(x - 8, y - 56, 16, 56); cx.fillRect(x - 22, y - 38, 14, 8); cx.fillRect(x - 22, y - 46, 8, 16); cx.fillRect(x + 8, y - 30, 14, 8); cx.fillRect(x + 14, y - 40, 8, 16); }
        else if (ob.tipo === 'roca') { cx.fillStyle = '#6d5a73'; cx.beginPath(); cx.moveTo(x - 30, y); cx.lineTo(x - 18, y - 40); cx.lineTo(x + 14, y - 34); cx.lineTo(x + 30, y); cx.fill(); }
        else { const w = Math.sin(S.t * 14 + ob.x) * 3; cx.fillStyle = '#d9473f'; cx.beginPath(); cx.ellipse(x, y - 12, 20, 11, 0, 0, 7); cx.fill(); cx.strokeStyle = '#d9473f'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x + 14, y - 14); cx.quadraticCurveTo(x + 36, y - 30 + w, x + 22, y - 36); cx.stroke(); cx.fillRect(x - 28, y - 14 + w, 10, 4); } });
      S.gotas.forEach(g => { if (g.l !== l || g.ok) return; const x = sx(g.x), y = sy(g.x, g.y); if (x < -20 || x > W + 20) return; cx.fillStyle = '#6fd6ff'; cx.beginPath(); cx.moveTo(x, y - 12); cx.quadraticCurveTo(x + 9, y, x, y + 8); cx.quadraticCurveTo(x - 9, y, x, y - 12); cx.fill(); });
      if (l === clamp(Math.round(S.ly), 0, 2) || (l === 2 && false)) {}
      if (l === Math.round(clamp(S.ly, 0, 2))) { heroe(cam); jefeDib(cam); }
    }

    function heroe(cam) {
      const x = X_H, y = laneY(S.d, S.ly) - S.z, ang = Math.atan(-(hY(S.d + 6) - hY(S.d - 6)) / 12) * -1;
      if (S.inv > 0 && Math.floor(S.t * 14) % 2) return;
      S.part.forEach(p => { cx.globalAlpha = p.t; cx.fillStyle = '#ffe2a8'; cx.fillRect(p.x - cam, laneY(p.x, p.l) - p.z, 4, 3); }); cx.globalAlpha = 1;
      cx.save(); cx.translate(x, y); cx.rotate(ang * .8); cx.fillStyle = '#3a2547'; cx.beginPath(); cx.ellipse(0, 4, 38, 7, 0, 0, 7); cx.fill();
      cx.fillStyle = colH; cx.fillRect(-9, -40, 18, 30); cx.fillStyle = '#f2d1ad'; cx.beginPath(); cx.arc(0, -48, 10, 0, 7); cx.fill(); cx.fillStyle = '#222'; cx.fillRect(-10, -52, 20, 6);
      cx.fillStyle = '#fff'; cx.fillRect(2, -50, 4, 3);
      cx.strokeStyle = colH; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(-9, -48); cx.quadraticCurveTo(-34, -44 + Math.sin(S.t * 18) * 6, -52, -38 + Math.sin(S.t * 14) * 8); cx.stroke();
      if (S.boost > 0) { cx.strokeStyle = 'rgba(111,214,255,.8)'; cx.lineWidth = 3; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(-44 - i * 20, -10 + i * 6); cx.lineTo(-90 - i * 20, -10 + i * 6); cx.stroke(); } }
      cx.restore();
    }

    function jefeDib(cam) {
      const j = S.jefe; if (!j) return; const bx = X_H - j.gap - 40, by = laneY(S.d - j.gap, 1) + 20;
      cx.save(); cx.translate(bx, by); const s = 2.6; cx.scale(s, s); cx.fillStyle = '#9c2f3b'; cx.beginPath(); cx.ellipse(0, -20, 46, 24, 0, 0, 7); cx.fill();
      cx.strokeStyle = '#9c2f3b'; cx.lineWidth = 9; const atq = j.atq && j.atq.t > .5; cx.beginPath(); cx.moveTo(-30, -30); cx.quadraticCurveTo(-60, -90, atq ? 30 : -10, atq ? -20 : -86); cx.stroke();
      cx.fillStyle = '#ffd35a'; cx.beginPath(); cx.arc(atq ? 34 : -6, atq ? -18 : -88, 8, 0, 7); cx.fill();
      cx.strokeStyle = '#7a2230'; cx.lineWidth = 6; for (let i = 0; i < 3; i++) { cx.beginPath(); cx.moveTo(20, -14 + i * 6); cx.lineTo(54, 6 + Math.sin(S.t * 10 + i) * 4); cx.stroke(); }
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(38, -30, 5, 0, 7); cx.fill(); cx.fillStyle = '#000'; cx.beginPath(); cx.arc(39, -30, 2.4, 0, 7); cx.fill(); cx.restore();
    }

    function hud() {
      cx.textAlign = 'left'; cx.font = 'bold 20px ui-monospace,monospace';
      for (let i = 0; i < 3; i++) { cx.fillStyle = i < S.vidas ? '#ff4d6d' : '#4a3a5a'; cx.fillText('♥', 16 + i * 26, 34); }
      cx.fillStyle = '#ffe27a'; cx.fillText('★ ' + S.punt, 16, 62); cx.fillStyle = '#6fd6ff'; cx.fillText('⚡ ' + Math.round(S.v / 6) + ' km/h', 16, 88);
      const pr = S.jefe ? S.jefe.hp / S.jefe.max : clamp(S.respondidas / 8, 0, 1); cx.fillStyle = '#00000088'; cx.fillRect(W - 236, 16, 220, 16); cx.fillStyle = S.jefe ? '#ff4d4d' : '#ffe27a'; cx.fillRect(W - 236, 16, 220 * pr, 16);
      cx.fillStyle = '#fff'; cx.font = '12px ui-monospace,monospace'; cx.textAlign = 'right'; cx.fillText(S.jefe ? 'ESCORPIÓN COLOSAL' : 'RECORRIDO ' + S.respondidas + '/8', W - 16, 46);
      const g = S.gates.find(g => !g.res && g.x - S.d < 1900);
      if (g) { cx.fillStyle = '#000000aa'; cx.fillRect(W / 2 - 130, 12, 260, 52); cx.strokeStyle = '#ffe27a'; cx.strokeRect(W / 2 - 130, 12, 260, 52); cx.fillStyle = '#ffe27a'; cx.font = 'bold 30px ui-monospace,monospace'; cx.textAlign = 'center'; cx.fillText(g.q.txt, W / 2, 49); }
      if (S.msg.t > 0) { cx.fillStyle = '#fff'; cx.font = 'bold 24px ui-monospace,monospace'; cx.textAlign = 'center'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText(S.msg.s, W / 2, 130); cx.shadowBlur = 0; }
      if (S.flash > 0) { cx.fillStyle = 'rgba(111,214,255,' + S.flash + ')'; cx.fillRect(0, 0, W, H); }
      if (S.inv > 1.2) { cx.fillStyle = 'rgba(255,0,0,.25)'; cx.fillRect(0, 0, W, H); }
    }

    function terminar(gano) {
      if (S.est !== 'play') return; S.est = gano ? 'gano' : 'perdio'; beep(gano ? 988 : 120, .6, gano ? 'sine' : 'sawtooth');
      if (o.perfil && window.Perfiles) { try { Perfiles.actualizar(o.perfil.id, p => { p.nivel2 = p.nivel2 || {}; p.nivel2.fallos = S.fallos; p.nivel2.intentos = (p.nivel2.intentos || 0) + 1; if (gano) p.nivel2.completados = (p.nivel2.completados || 0) + 1; p.estadisticas = p.estadisticas || { aciertos: 0, errores: 0, minutos: 0 }; p.estadisticas.aciertos += S.aci; p.estadisticas.errores += S.err; p.estadisticas.minutos += Math.round(S.t / 6) / 10; }); } catch (e) {} }
      const p = document.createElement('div'); p.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#000000b0;color:#fff;text-align:center;padding:20px';
      p.innerHTML = '<h1 style="margin:0;color:' + (gano ? '#ffe27a' : '#ff6b6b') + '">' + (gano ? '¡DERROTASTE AL ESCORPIÓN!' : 'EL DESIERTO TE VENCIÓ') + '</h1><div>Aciertos ' + S.aci + ' · Errores ' + S.err + ' · Puntos ' + S.punt + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button id="r2">↻ REPETIR</button><button id="s2">VOLVER AL MENÚ</button></div>';
      p.querySelectorAll('button').forEach(b => b.style.cssText = 'font:inherit;font-weight:bold;padding:12px 18px;border:0;border-radius:8px;background:#ffc93c;cursor:pointer');
      root.appendChild(p); p.querySelector('#r2').onclick = () => { p.remove(); const f = S.fallos; nuevo(); S.fallos = f; ult = 0; };
      p.querySelector('#s2').onclick = salir;
    }

    function salir() { cancelAnimationFrame(raf); removeEventListener('keydown', kd); root.remove(); (o.onSalir || (() => { location.href = 'index.html'; }))(); }
    const kd = e => { if (!S || S.est !== 'play') return; const c = e.code;
      if (c === 'ArrowUp' || c === 'KeyW') S.lane = Math.max(0, S.lane - 1); else if (c === 'ArrowDown' || c === 'KeyS') S.lane = Math.min(2, S.lane + 1);
      else if (c === 'Space' || c === 'KeyJ' || c === 'ArrowRight') S.inputs.salto = true; if (['Space', 'ArrowUp', 'ArrowDown'].includes(c)) e.preventDefault(); };
    addEventListener('keydown', kd);
    // controles táctiles: toca arriba/abajo para cambiar de carril, o la mitad derecha para saltar
    const botones = [['▲', 'left:14px;bottom:96px', () => S && (S.lane = Math.max(0, S.lane - 1))], ['▼', 'left:14px;bottom:20px', () => S && (S.lane = Math.min(2, S.lane + 1))], ['SALTAR', 'right:14px;bottom:20px;width:130px', () => S && (S.inputs.salto = true)]];
    botones.forEach(([t, pos, fn]) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'position:absolute;' + pos + ';width:70px;height:70px;border-radius:50%;border:2px solid #ffe27a;background:#ffffff22;color:#fff;font:bold 18px ui-monospace,monospace;touch-action:none'; b.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); root.appendChild(b); });
    const sb = document.createElement('button'); sb.textContent = '✕'; sb.style.cssText = 'position:absolute;right:10px;top:10px;opacity:.5;border:0;border-radius:6px;padding:4px 8px'; sb.onclick = salir; root.appendChild(sb);

    function bucle(ts) { const dt = Math.min(.033, ((ts - (ult || ts)) / 1000) || 0); ult = ts; if (S.est === 'play') actualizar(dt); dibujar(); raf = requestAnimationFrame(bucle); }
    nuevo(); raf = requestAnimationFrame(bucle);
  }
  window.Nivel2 = { iniciar, _pregunta: pregunta };
})();
