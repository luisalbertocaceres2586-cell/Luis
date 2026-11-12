/* Generador del Nivel 1 largo: Bosque de Bambú + Cueva de las Luciérnagas (a oscuras).
 * Junta "módulos" (cada uno es un reto distinto) y 16 estaciones de acertijo. Todo son datos; el motor
 * los dibuja y simula. Se puede probar en Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ruta.js'), require('./acertijos.js'));
  else root.GenNivel = factory(root.Ruta, root.Acertijos);
})(typeof self !== 'undefined' ? self : this, function (Ruta, Ac) {
  const G = 560;

  // segundos que tarda, de media, un estudiante en cada cosa (para estimar la duración)
  const COSTO = { llano: 6, patrulla: 16, puente: 8, barranco: 12, estacas: 9, escalera: 12, taikos: 16, moviles: 18, fragil: 12, carreta: 26, palanca: 20, emboscada: 32, roca: 24, kunaiR: 15, sierras: 16, viento: 14, ruptura: 12,
    pasillo: 18, estalactitas: 14, hongos: 14, telaranas: 14, arana: 16, fuegos: 18, estacion: 42, jefe: 60, final: 50 };

  function generar(params, maestria) {
    const rng = Ruta.crearRng(params.semilla, 'nivel1');
    const N = { suelo: [], plat: [], muros: [], haz: [], enem: [], items: [], deco: [], est: [], ckp: [], tambores: [], elem: [], gaps: [], zonas: [], especiales: [], costo: 0 };
    let x = 0, ult = null, zona = 'bosque', dif = 1;

    const suelo = (x0, x1) => { if (ult && ult.x1 === x0 && ult.zona === zona) { ult.x1 = x1; return; } ult = { x0, x1, y: G, zona }; N.suelo.push(ult); };
    const hueco = (x0, x1) => N.gaps.push({ x0, x1 });
    const plat = (px, py, w, tipo, ex) => { const p = Object.assign({ x: px, y: py, w, tipo, zona }, ex || {}); N.plat.push(p); return p; };
    const perg = (px, py) => N.items.push({ x: px, y: py, tipo: 'pergamino' });
    const arco = (x0, x1, y, n) => { for (let i = 0; i < n; i++) perg(x0 + (x1 - x0) * (i + .5) / n, y - Math.sin((i + .5) / n * Math.PI) * 50); };
    const onigiri = (px, py) => N.items.push({ x: px, y: py, tipo: 'onigiri' });
    const enem = (o) => { N.enem.push(Object.assign({ y: G, vivo: true, hp: 1 }, o)); };
    const elem = (o) => { o.zona = zona; N.elem.push(o); return o; };
    const decorar = (x0, x1) => {
      const tipos = zona === 'bosque' ? ['bambu', 'bambu', 'bambu', 'toro', 'kitsune', 'estandarte'] : ['cristal', 'cristal', 'hongo', 'hongo', 'toro'];
      const n = Math.floor((x1 - x0) / 240);
      for (let i = 0; i < n; i++) N.deco.push({ x: x0 + 100 + i * 240 + rng.int(-50, 50), tipo: rng.pick(tipos), capa: rng.chance(zona === 'bosque' ? .25 : .1) ? 'frente' : 'atras', zona });
    };
    const especial = (tipo, x0, x1) => N.especiales.push({ tipo, x0, x1 });

    // ---------------- MÓDULOS (cada uno es un reto distinto) ----------------
    const MOD = {
      llano() { const w = rng.int(420, 640); suelo(x, x + w); decorar(x, x + w); arco(x + 80, x + w - 80, G - 30, rng.int(3, 5)); x += w; },
      patrulla() {
        const w = rng.int(760, 980); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'ninja', x: x + 280, min: x + 150, max: x + 420, vx: 55 + dif * 10 });
        enem({ kind: dif > 1 ? 'ninjaAtk' : 'ninja', x: x + 600, min: x + 480, max: x + w - 80, vx: 60 + dif * 10, t: rng.next() * 3 });
        if (zona === 'bosque' && (dif >= 3 || (usados.bosquepatrulla || 0) >= 3)) enem({ kind: 'tengu', x: x + 450, y: G - 210, min: x + 200, max: x + w - 100, vx: 90, base: G - 210, amp: 50 });
        x += w;
      },
      puente() { const g = rng.int(280, 420), a = 150, b = 140; suelo(x, x + a); hueco(x + a, x + a + g); plat(x + a - 20, G, g + 40, 'puente'); suelo(x + a + g, x + a + g + b); arco(x + a + 40, x + a + g - 40, G - 40, 4); x += a + g + b; },
      barranco() {
        const a = 130, b = 140, pasos = rng.int(2, 3); suelo(x, x + a); let px = x + a + 40; const ini = x + a;
        for (let i = 0; i < pasos; i++) { const py = G - rng.int(45, 95) - (i % 2 ? 0 : 20); plat(px, py, 150, zona === 'bosque' ? 'bambu' : 'roca'); perg(px + 75, py - 70); px += 150 + rng.int(60, 120); }
        const fin = px - 60 + 40; hueco(ini, fin); suelo(fin, fin + b); x = fin + b;
      },
      estacas() { const w = rng.int(130, 200), a = 220, b = 220; suelo(x, x + a + w + b); N.haz.push({ x: x + a, y: G - 46, w, h: 46, tipo: 'kunai' }); if (rng.chance(.7)) { plat(x + a - 10, G - 120, w + 20, zona === 'bosque' ? 'bambu' : 'roca'); perg(x + a + w / 2, G - 190); } x += a + w + b; },
      escalera() {
        const base = x, w = 960; suelo(x, x + w); decorar(x, x + w);
        [0, 190, 380, 570, 760].forEach((dx, i) => { const y = G + [-90, -170, -250, -170, -90][i]; plat(base + 80 + dx, y, 150, zona === 'bosque' ? 'bambu' : 'roca'); if (i === 2) { perg(base + 80 + dx + 50, y - 70); perg(base + 80 + dx + 100, y - 70); } });
        if (rng.chance(.5)) onigiri(base + 80 + 380 + 75, G - 330); x += w;
      },
      taikos() {  // cadena de tambores: cada uno lanza hasta la isla siguiente
        const a = 150, n = rng.int(2, 3), sep = 330; suelo(x, x + a); const ini = x + a; let px = ini + 40;
        for (let i = 0; i < n; i++) { plat(px, G - 10, 150, zona === 'bosque' ? 'bambu' : 'roca', { tambor: true }); N.tambores.push({ x: px + 75, y: G - 10, zona }); perg(px + 75 + sep / 2, G - 330); px += sep; }
        const fin = px - 30; hueco(ini, fin); suelo(fin, fin + 160); x = fin + 160;
        especial('taikos', ini - 100, fin + 100);
      },
      moviles() {
        const a = 140, g = 640; suelo(x, x + a); hueco(x + a, x + a + g);
        plat(x + a + 30, G - 30, 130, 'viga', { mov: { rx: 90, ry: 0, v: 1.1, f: 0 } });
        plat(x + a + 330, G - 120, 130, 'viga', { mov: { rx: 0, ry: 80, v: 1.3, f: 1 } });
        plat(x + a + g - 170, G - 30, 130, 'viga', { mov: { rx: 90, ry: 0, v: 1, f: 2 } });
        suelo(x + a + g, x + a + g + 150); perg(x + a + 330, G - 260); x += a + g + 150; especial('moviles', x - g - 300, x);
      },
      fragil() {
        const a = 140, n = 5; suelo(x, x + a); let px = x + a + 20;
        for (let i = 0; i < n; i++) { plat(px, G - (i % 2) * 30, 110, zona === 'bosque' ? 'bambu' : 'roca', { fragil: true, estado: 'firme' }); px += 150; }
        hueco(x + a, px - 20); suelo(px - 20, px + 140); x = px + 140; especial('fragil', x - 1000, x);
      },
      carreta() {  // un muro alto: hay que empujar la carreta hasta él y subirse
        const a = 600; suelo(x, x + a + 560); decorar(x, x + 300);
        const mx = x + a; N.muros.push({ x: mx, y: G - 250, w: 80, h: 250, tipo: 'muro', zona });
        elem({ t: 'carreta', x: x + 230, y: G, w: 150, h: 104, min: x + 80, max: mx - 160 });
        if (zona === 'bosque') perg(mx + 40, G - 330);
        x += a + 560; especial('carreta', x - 1160, x);
      },
      palanca() {  // una palanca en alto abre la reja
        suelo(x, x + 1000); decorar(x, x + 400);
        const id = 'p' + N.elem.length; plat(x + 180, G - 160, 160, zona === 'bosque' ? 'bambu' : 'roca');
        elem({ t: 'palanca', x: x + 260, y: G - 160, id, on: false });
        N.muros.push({ x: x + 700, y: G - 300, w: 36, h: 300, tipo: 'reja', id, abierta: false, zona });
        x += 1000; especial('palanca', x - 1000, x);
      },
      emboscada() {  // se cierra la arena y salen oleadas de ninjas
        const w = 1100, k = N.elem.length; suelo(x, x + w); const olas = [2 + (dif > 2 ? 1 : 0), 3, dif > 1 ? 4 : 3];
        elem({ t: 'emb', x0: x + 80, x1: x + w - 80, estado: 0, olas, ola: 0, idL: 'eL' + k, idR: 'eR' + k });
        N.muros.push({ x: x + 60, y: G - 300, w: 30, h: 300, tipo: 'reja', id: 'eL' + k, abierta: true, zona }, { x: x + w - 90, y: G - 300, w: 30, h: 300, tipo: 'reja', id: 'eR' + k, abierta: true, zona });
        onigiri(x + w / 2, G - 120); x += w; especial('emboscada', x - w, x);
      },
      roca() {  // roca gigante persecución
        const w = 2000; suelo(x, x + w);
        elem({ t: 'roca', x: x - 200, y: G, x0: x + 250, x1: x + w - 120, activa: false, r: 120 });
        N.haz.push({ x: x + 700, y: G - 46, w: 130, h: 46, tipo: 'kunai' }); N.haz.push({ x: x + 1250, y: G - 46, w: 130, h: 46, tipo: 'kunai' });
        plat(x + 1000, G - 130, 140, zona === 'bosque' ? 'bambu' : 'roca'); arco(x + 400, x + 1700, G - 30, 8);
        x += w; especial('roca', x - w, x);
      },
      kunaiR() {  // kunai que suben y bajan a ritmo
        suelo(x, x + 1050); const per = 2.6;
        [200, 470, 740].forEach((dx, i) => N.elem.push({ t: 'kunaiR', x: x + dx, w: 140, per, f: i * .45, zona }));
        arco(x + 150, x + 900, G - 120, 5); x += 1050; especial('kunaiR', x - 1050, x);
      },
      sierras() {  // sierras de shuriken que suben y bajan
        suelo(x, x + 1000);
        [250, 520, 790].forEach((dx, i) => N.elem.push({ t: 'sierra', x: x + dx, y0: G - 250, y1: G - 70, per: 2.2 + i * .2, f: i * .9, zona }));
        arco(x + 120, x + 920, G - 40, 6); x += 1000; especial('sierras', x - 1000, x);
      },
      viento() {  // corriente de viento hacia un mirador alto (bonus)
        suelo(x, x + 760); decorar(x, x + 300);
        N.elem.push({ t: 'viento', x: x + 250, y: G - 520, w: 190, h: 520, zona });
        plat(x + 330, G - 480, 260, 'piedra'); [0, 60, 120, 180].forEach(d => perg(x + 360 + d, G - 560)); onigiri(x + 560, G - 540); x += 760;
      },
      ruptura() {  // pared de sellos que esconde un tesoro (bonus)
        suelo(x, x + 760); decorar(x, x + 200);
        [0, 1].forEach(i => N.muros.push({ x: x + 420, y: G - 90 * (i + 1), w: 90, h: 90, tipo: 'sello', rompible: true, zona }));
        [0, 1, 2].forEach(i => perg(x + 560 + i * 50, G - 50)); onigiri(x + 690, G - 60); x += 760;
      },
      // ---- cueva ----
      pasillo() {
        const w = rng.int(900, 1100); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'murcielago', x: x + 380, y: G - 180, base: G - 180, amp: 60, min: x + 200, max: x + 600, vx: 100 });
        enem({ kind: 'murcielago', x: x + 760, y: G - 150, base: G - 150, amp: 50, min: x + 580, max: x + w - 80, vx: -110 });
        N.deco.push({ x: x + 250, tipo: 'cristal', capa: 'atras', zona }, { x: x + 700, tipo: 'hongo', capa: 'atras', zona }); arco(x + 120, x + w - 120, G - 40, 6); x += w;
      },
      estalactitas() {
        const w = 1000; suelo(x, x + w);
        [300, 520, 740].forEach(dx => elem({ t: 'estal', x: x + dx, y0: 60, estado: 'colgada', t0: 0 }));
        arco(x + 150, x + w - 100, G - 50, 5); onigiri(x + 880, G - 60); x += w; especial('estalactitas', x - w, x);
      },
      hongos() {  // hongos que rebotan sobre un pozo
        const a = 150, g = 720; suelo(x, x + a); hueco(x + a, x + a + g);
        [0, 1].forEach(i => { const px = x + a + 120 + i * 330; plat(px, G - 10, 120, 'roca', { tambor: true }); N.tambores.push({ x: px + 60, y: G - 10, zona, hongo: true }); });
        suelo(x + a + g, x + a + g + 160); [0, 1, 2].forEach(i => perg(x + a + 200 + i * 150, G - 360)); x += a + g + 160; especial('hongos', x - g - 310, x);
      },
      telaranas() {
        const w = 1000; suelo(x, x + w); [260, 560, 800].forEach(dx => elem({ t: 'tela', x: x + dx, y: G - 120, w: 120, h: 120, roto: false }));
        enem({ kind: 'arana', x: x + 520, y: G, min: x + 380, max: x + 700, vx: 40, colgada: false }); arco(x + 100, x + w - 100, G - 40, 5); x += w; especial('telaranas', x - w, x);
      },
      arana() {
        const w = 900; suelo(x, x + w); [300, 600].forEach(dx => enem({ kind: 'aranaTecho', x: x + dx, y: 120, base: 120, estado: 'espera', vivo: true }));
        arco(x + 100, x + w - 100, G - 40, 5); x += w;
      },
      fuegos() {
        const w = 1000; suelo(x, x + w); [350, 700].forEach(dx => enem({ kind: 'fuego', x: x + dx, y: G - 140, base: G - 140, amp: 40, min: x + 250, max: x + 880, vx: 0, sigue: true }));
        N.deco.push({ x: x + 100, tipo: 'cristal', capa: 'atras', zona }); arco(x + 150, x + w - 100, G - 50, 6); x += w;
      }
    };
    const SEGUROS = { bosque: ['llano', 'patrulla', 'puente', 'barranco', 'estacas', 'escalera', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'emboscada', 'roca', 'kunaiR', 'sierras', 'viento', 'ruptura'], cueva: ['pasillo', 'estalactitas', 'hongos', 'telaranas', 'arana', 'fuegos', 'barranco', 'estacas', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'emboscada', 'kunaiR', 'sierras', 'ruptura', 'puente'] };
    const FACIL = ['llano', 'puente', 'patrulla', 'escalera', 'pasillo'];
    const LIMITE = { roca: 2, emboscada: 3, carreta: 2, palanca: 2, viento: 2, ruptura: 2, taikos: 3, sierras: 3, kunaiR: 3, moviles: 3, fragil: 3, hongos: 2, telaranas: 2, estalactitas: 2 };
    const usados = {};
    // cada zona incluye SIEMPRE todos estos retos y enemigos (el resto se sortea)
    const MUST = {
      bosque: ['patrulla', 'patrulla', 'patrulla', 'emboscada', 'roca', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'kunaiR', 'sierras', 'viento', 'ruptura'],
      cueva: ['pasillo', 'pasillo', 'estalactitas', 'telaranas', 'fuegos', 'hongos', 'arana', 'emboscada', 'carreta', 'palanca', 'kunaiR', 'sierras', 'moviles', 'fragil', 'taikos']
    };

    // ---------------- ESTACIONES ----------------
    const MECS = ['encender_farol', 'romper_bloques', 'diana', 'piedras', 'empujar_carreta'];
    let mecAnt = null, nEst = 0;
    function estacion(mecOpc) {
      const i = nEst++;
      const mec = mecOpc || (i === 0 ? 'encender_farol' : rng.pick(MECS.filter(m => m !== mecAnt && (zona === 'bosque' || m !== 'empujar_carreta' || true))));
      mecAnt = mec;
      const mecAc = mec === 'empujar_carreta' ? 'encender_farol' : mec;
      const ac = Ac.crear({ rng: rng.derivar('est' + i), tabla: params.tabla || 2, mecanica: mecAc, maestria });
      ac.mecanica = mec; if (mec === 'empujar_carreta') ac.enunciado = ac.enunciado.replace('Enciende el farol de', 'Empuja la carreta hasta la plataforma de');
      const e = { i: N.est.length, zona, mecanica: mec, ac, x0: x, objetos: [], resuelta: false, errores: 0, puertaX: null, ancho: 0 };
      if (mec === 'piedras') {
        const W = 1220; suelo(x, x + 280); hueco(x + 280, x + W - 150); suelo(x + W - 150, x + W);
        plat(x + 330, G - 40, 120, 'piedra_num', { valor: ac.secuencia[0], fija: true });
        plat(x + 500, G - 80, 120, 'piedra_num', { valor: ac.secuencia[1], fija: true });
        ac.objetos.forEach((o, k) => e.objetos.push(plat(x + 700 + k * 62, G - 30 - k * 78, 110, 'piedra_num', { valor: o.valor, correcta: o.correcto, estado: 'firme', t: 0 })));
        plat(x + 990, G - 80, 120, 'piedra_num', { fija: true, valor: null }); e.ancho = W; x += W;
      } else if (mec === 'empujar_carreta') {
        const W = 1500; suelo(x, x + W); const cart = elem({ t: 'carreta', x: x + 220, y: G, w: 150, h: 104, min: x + 100, max: x + W - 200, est: e.i });
        const corr = ac.objetos.find(o => o.correcto), otros = ac.objetos.filter(o => !o.correcto).slice(0, 2), pads = rng.shuffle([corr].concat(otros)); e.pads = pads.map((o, k) => ({ x: x + 640 + k * 290, valor: o.valor, correcto: o.correcto, estado: 'listo' }));
        e.objetos = e.pads; e.cart = cart; e.puertaX = x + W - 90; e.ancho = W; x += W; decorar(x - W, x - W + 300);
      } else {
        const W = 1150; suelo(x, x + W); decorar(x, x + 160);
        const alt = { encender_farol: [G - 235, G - 285, G - 255, G - 300], romper_bloques: [G - 210, G - 270, G - 235, G - 290], diana: [G - 120, G - 250, G - 180, G - 300] }[mec];
        ac.objetos.forEach((o, k) => e.objetos.push({ x: x + 250 + k * 215, y: alt[(k + rng.int(0, 3)) % alt.length], valor: o.valor, correcto: o.correcto, estado: 'listo' }));
        e.puertaX = x + W - 90; e.ancho = W; x += W;
      }
      N.est.push(e); N.costo += COSTO.estacion; return e;
    }
    function estacionAntorchas() {  // cueva: enciende las antorchas en orden de la cuenta
      const i = nEst++; const t = params.tabla || 2, s = rng.int(1, 6);
      const vals = [0, 1, 2, 3].map(k => t * (s + k)); const W = 1300; suelo(x, x + W);
      const ac = { mecanica: 'antorchas', tipo: 'salto', hecho: t + 'x' + (s + 3), enunciado: 'Enciende las antorchas en orden: de ' + t + ' en ' + t, objetos: vals.map(v => ({ valor: v, correcto: true })), secuencia: vals };
      const orden = rng.shuffle([0, 1, 2, 3]);
      const e = { i: N.est.length, zona, mecanica: 'antorchas', ac, x0: x, objetos: [], resuelta: false, errores: 0, puertaX: x + W - 90, ancho: W, sig: 0 };
      orden.forEach((k, pos) => e.objetos.push({ x: x + 260 + pos * 240, y: G - 210 - (pos % 2) * 50, valor: vals[k], idx: k, estado: 'apagada' }));
      N.est.push(e); x += W; N.costo += COSTO.estacion; return e;
    }

    // ---------------- ARMADO ----------------
    function zonaNueva(nombre, nEstaciones, modsPorEst) {
      zona = nombre; const z0 = x; mecAnt = null; nEst = 0;
      const ant = []; const must = rng.shuffle(MUST[nombre].slice()); let quedan = nEstaciones * modsPorEst - 1;
      for (let e = 0; e < nEstaciones; e++) {
        dif = Math.min(5, 1 + Math.floor(e / 2) + (nombre === 'cueva' ? 1 : 0));
        const cuantos = e === 0 ? modsPorEst - 1 : modsPorEst;
        for (let k = 0; k < cuantos; k++) {
          let m, tries = 0;
          if (e > 0 && must.length && (quedan <= must.length || rng.chance(must.length / quedan * 1.15)) && ant[ant.length - 1] !== must[0]) m = must.shift();
          else {
            do { m = (e === 0 && k === 0 ? rng.pick(FACIL) : rng.pick(SEGUROS[nombre])); tries++; }
            while ((ant.length && ant[ant.length - 1] === m) || (LIMITE[m] && (usados[nombre + m] || 0) >= LIMITE[m]) || (e === 0 && ['emboscada', 'roca', 'sierras', 'fragil', 'moviles', 'taikos', 'barranco', 'estacas'].indexOf(m) >= 0 && tries < 40));
          }
          quedan--; usados[nombre + m] = (usados[nombre + m] || 0) + 1; ant.push(m); MOD[m](); N.costo += COSTO[m] || 10;
        }
        if (e === nEstaciones - 1) while (must.length) { const m = must.shift(); usados[nombre + m] = (usados[nombre + m] || 0) + 1; MOD[m](); N.costo += COSTO[m] || 10; }   // lo que no salió por sorteo se añade antes del final
        if (nombre === 'cueva' && e === nEstaciones - 1) estacionAntorchas(); else estacion();
        if (e % 2 === 1 && e < nEstaciones - 1) { suelo(x, x + 220); N.ckp.push({ x: x + 110, activo: false, zona }); x += 220; }
      }
      return z0;
    }

    N.inicio = { x: 120 };
    suelo(x, x + 700); zona = 'bosque'; decorar(x, x + 700); arco(x + 200, x + 580, G - 30, 4); x += 700;
    const z1 = x;
    zonaNueva('bosque', 8, 3);
    // jefe del bosque: arena con el Oni rojo
    suelo(x, x + 300); N.ckp.push({ x: x + 150, activo: false, zona }); x += 300;
    { const w = 1400; suelo(x, x + w); N.muros.push({ x: x + 40, y: G - 320, w: 30, h: 320, tipo: 'reja', id: 'jL', abierta: true, zona, auto: true }, { x: x + w - 70, y: G - 320, w: 30, h: 320, tipo: 'reja', id: 'jR', abierta: true, zona, auto: true });
      elem({ t: 'jefe', x0: x + 70, x1: x + w - 70, estado: 0, id: 'jefe' }); N.enem.push({ kind: 'oni', x: x + w - 400, min: x + 100, max: x + w - 100, y: G, vivo: true, hp: 8, hpMax: 8, vx: 0, boss: true, estado: 'quieto', t: 0 }); x += w; N.costo += COSTO.jefe; }
    suelo(x, x + 400); N.zonas.push({ tipo: 'bosque', x0: 0, x1: x }); x += 400;
    // entrada a la cueva
    N.cueva = { x: x - 200 }; const z2 = x;
    suelo(x, x + 500); zona = 'cueva'; x += 500;
    zonaNueva('cueva', 8, 3);
    suelo(x, x + 300); N.zonas.push({ tipo: 'cueva', x0: z2, x1: x + 300 }); x += 300;
    N.meta = { x: x - 150 };
    N.ancho = x; N.params = params; N.costoMin = Math.round(N.costo / 60 * 10) / 10;
    return N;
  }

  function validar(N) {
    const f = [];
    N.gaps.forEach(g => {
      const ps = N.plat.filter(p => p.x - (p.mov ? p.mov.rx : 0) < g.x1 + 60 && p.x + p.w + (p.mov ? p.mov.rx : 0) > g.x0 - 60).sort((a, b) => a.x - b.x);
      let borde = g.x0, y = G, ok = true, sepMax = 170, prevTambor = false;
      ps.forEach(p => {
        const ext0 = p.x - (p.mov ? p.mov.rx : 0), ext1 = p.x + p.w + (p.mov ? p.mov.rx : 0);
        const sep = prevTambor ? 340 : (p.mov ? 260 : 170);
        if (ext0 - borde <= sep && Math.abs(p.y - y) <= (p.mov ? 170 : 130) + (prevTambor ? 330 : 0)) { if (ext1 > borde) { borde = ext1; y = p.y; prevTambor = !!p.tambor; } }
      });
      if (g.x1 - borde > (prevTambor ? 340 : 170)) f.push('hueco sin cruzar ' + g.x0 + '-' + g.x1);
    });
    N.haz.forEach(h => { if (h.w > 210) f.push('estacas anchas'); });
    N.est.forEach(e => {
      if (e.mecanica !== 'antorchas' && e.ac.objetos.filter(o => o.correcto).length !== 1) f.push('estación sin una correcta');
      if (e.mecanica === 'antorchas' && e.objetos.length !== 4) f.push('antorchas mal');
      if (e.mecanica === 'empujar_carreta' && e.pads.filter(p => p.correcto).length !== 1) f.push('carreta sin pad correcto');
    });
    for (let i = 1; i < N.suelo.length; i++) if (N.suelo[i].x0 < N.suelo[i - 1].x1) f.push('suelos solapados');
    if (N.est.length !== 16) f.push('faltan estaciones: ' + N.est.length);
    N.muros.forEach(m => { if (m.h > 320) f.push('muro alto'); });
    return f;
  }
  return { generar, validar, G, COSTO };
});
