/* Generador del Nivel 1 largo: Bosque de Bambú + Cueva de las Luciérnagas (a oscuras).
 * Junta "módulos" (cada uno es un reto distinto) y 16 estaciones de acertijo. Todo son datos; el motor
 * los dibuja y simula. Se puede probar en Node. */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./ruta.js'), require('./acertijos.js'));
  else root.GenNivel = factory(root.Ruta, root.Acertijos);
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function (Ruta, Ac) {
  const G = 560;

  // segundos que tarda, de media, un estudiante en cada cosa (para estimar la duración)
  const COSTO = { llano: 6, patrulla: 16, puente: 8, barranco: 12, estacas: 9, escalera: 12, taikos: 16, moviles: 18, fragil: 12, carreta: 26, palanca: 20, emboscada: 32, roca: 24, kunaiR: 15, sierras: 16, viento: 14, ruptura: 12, chimenea: 12,
    patrullaB: 24, patrullaC: 26, llave: 20, bestias: 24, pasillo: 18, estalactitas: 14, hongos: 14, telaranas: 14, arana: 16, fuegos: 18, estacion: 42, jefe: 60, final: 50 };

  function generar(params, maestria) {
    const rng = Ruta.crearRng(params.semilla, 'nivel1');
    const tablas = Array.isArray(params.tablas) && params.tablas.length ? params.tablas : [params.tabla || 2];
    const tablaPara = i => tablas[i % tablas.length] || params.tabla || 2;
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
      const tipos = zona === 'bosque' ? ['bambu', 'bambu', 'cerezo', 'pino', 'rocas', 'valla', 'fuente', 'farolitos', 'cartel', 'helechos', 'toro', 'kitsune', 'estandarte'] : ['cristal', 'cristal', 'hongo', 'hongoGigante', 'columna', 'floresLuz', 'altar', 'arco', 'paredMineral', 'toro'];
      const n = Math.floor((x1 - x0) / 240);
      for (let i = 0; i < n; i++) { const t = rng.pick(tipos); N.deco.push({ x: x0 + 100 + i * 240 + rng.int(-50, 50), tipo: t, capa: (t === 'bambu' || t === 'helechos') && rng.chance(.3) ? 'frente' : 'atras', zona }); }
      if (zona === 'cueva' && n >= 2 && rng.chance(.8)) N.deco.push({ x: x0 + rng.int(120, Math.max(130, x1 - x0 - 120)), tipo: rng.pick(['cristalesTecho', 'raices']), capa: 'atras', techo: true, zona });
    };
    const pl = () => zona === 'bosque' ? rng.pick(['bambu', 'bambu', 'tronco', 'flores', 'losa', 'loto']) : rng.pick(['roca', 'roca', 'cristal', 'hongoPlat']);
    const frasco = px => N.items.push({ x: px, y: G - 70, tipo: 'frasco' });
    const npc = (who, px) => { const n = N.elem.filter(q => q.t === 'npc' && q.who === who).length; N.elem.push({ t: 'npc', who, x: px, n, zona, usos: 0 }); };
    const especial = (tipo, x0, x1) => N.especiales.push({ tipo, x0, x1 });

    // ---------------- MÓDULOS (cada uno es un reto distinto) ----------------
    const MOD = {
      llano() { const w = rng.int(420, 640); suelo(x, x + w); decorar(x, x + w); arco(x + 80, x + w - 80, G - 30, rng.int(3, 5)); x += w; },
      patrulla() {
        const w = rng.int(760, 980); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'ninja', x: x + 280, min: x + 150, max: x + 420, vx: 55 + dif * 10 });
        enem({ kind: dif > 1 || (usados.bosquepatrulla || 0) >= 2 ? 'ninjaAtk' : 'ninja', x: x + 600, min: x + 480, max: x + w - 80, vx: 60 + dif * 10, t: rng.next() * 3 });
        if (zona === 'bosque' && (dif >= 3 || (usados.bosquepatrulla || 0) >= 3)) enem({ kind: 'tengu', x: x + 450, y: G - 210, min: x + 200, max: x + w - 100, vx: 90, base: G - 210, amp: 50 });
        x += w;
      },
      puente() { const g = rng.int(280, 420), a = 150, b = 140; suelo(x, x + a); hueco(x + a, x + a + g); plat(x + a - 20, G, g + 40, 'puente'); suelo(x + a + g, x + a + g + b); arco(x + a + 40, x + a + g - 40, G - 40, 4); x += a + g + b; },
      barranco() {
        const a = 130, b = 140, pasos = rng.int(2, 3); suelo(x, x + a); let px = x + a + 40; const ini = x + a;
        for (let i = 0; i < pasos; i++) { const py = G - rng.int(45, 95) - (i % 2 ? 0 : 20); plat(px, py, 150, pl()); perg(px + 75, py - 70); px += 150 + rng.int(60, 120); }
        const fin = px - 60 + 40; hueco(ini, fin); suelo(fin, fin + b); x = fin + b;
      },
      estacas() { const w = rng.int(130, 200), a = 220, b = 220; suelo(x, x + a + w + b); N.haz.push({ x: x + a, y: G - 46, w, h: 46, tipo: 'kunai' }); if (rng.chance(.7)) { plat(x + a - 10, G - 120, w + 20, pl()); perg(x + a + w / 2, G - 190); } x += a + w + b; },
      escalera() {
        const base = x, w = 960; suelo(x, x + w); decorar(x, x + w);
        [0, 190, 380, 570, 760].forEach((dx, i) => { const y = G + [-90, -170, -250, -170, -90][i]; plat(base + 80 + dx, y, 150, pl()); if (i === 2) { perg(base + 80 + dx + 50, y - 70); perg(base + 80 + dx + 100, y - 70); } });
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
        for (let i = 0; i < n; i++) { plat(px, G - (i % 2) * 30, 110, pl(), { fragil: true, estado: 'firme' }); px += 150; }
        hueco(x + a, px - 20); suelo(px - 20, px + 140); x = px + 140; especial('fragil', x - 1000, x);
      },
      carreta() {  // un muro alto: hay que empujar la carreta hasta él y subirse
        const a = 600; suelo(x, x + a + 560); decorar(x, x + 300);
        const mx = x + a; N.muros.push({ x: mx, y: G - 250, w: 80, h: 250, tipo: 'muro', zona });
        elem({ t: 'carreta', x: x + 230, y: G, w: 150, h: 104, min: x + 80, max: mx - 160 });
        if (zona === 'bosque') perg(mx + 40, G - 330);
        x += a + 560; especial('carreta', x - 1160, x);
      },
      chimenea() {  // dos paredes de bambú que flotan: por debajo se pasa caminando; arriba hay un tesoro (agarre de pared, o gancho / doble salto)
        const w = 760, px = x + 250, ancho = 56, sep = 230, y0 = G - 170 - 330, id = 'ch' + N.muros.length;
        suelo(x, x + w); decorar(x, x + w); arco(x + 60, x + 200, G - 30, 3); arco(x + 640, x + 720, G - 30, 2);
        N.muros.push({ x: px, y: y0, w: ancho, h: 330, tipo: 'escalada', lado: 'izq', par: id, zona }, { x: px + ancho + sep, y: y0, w: ancho, h: 330, tipo: 'escalada', lado: 'der', par: id, zona });
        plat(px + ancho + 10, y0 + 70, sep - 20, zona === 'bosque' ? 'bambu' : 'roca');
        for (let i = 0; i < 6; i++) perg(px + ancho + 36 + i * (sep - 72) / 5, y0 + 10);
        onigiri(px + ancho + sep / 2, y0 - 20);
        x += w; especial('chimenea', x - w, x);
      },
      palanca() {  // una palanca en alto abre la reja
        suelo(x, x + 1000); decorar(x, x + 400);
        const id = 'p' + N.elem.length; plat(x + 180, G - 160, 160, pl());
        elem({ t: 'palanca', x: x + 260, y: G - 160, id, on: false });
        N.muros.push({ x: x + 700, y: G - 520, w: 36, h: 520, tipo: 'reja', id, abierta: false, zona });
        x += 1000; especial('palanca', x - 1000, x);
      },
      emboscada() {  // se cierra la arena y salen oleadas de ninjas
        const w = 1100, k = N.elem.length; suelo(x, x + w); const olas = [2 + (dif > 2 ? 1 : 0), 3, dif > 1 ? 4 : 3];
        elem({ t: 'emb', x0: x + 80, x1: x + w - 80, estado: 0, olas, ola: 0, idL: 'eL' + k, idR: 'eR' + k });
        N.muros.push({ x: x + 60, y: G - 520, w: 30, h: 520, tipo: 'reja', id: 'eL' + k, abierta: true, zona }, { x: x + w - 90, y: G - 520, w: 30, h: 520, tipo: 'reja', id: 'eR' + k, abierta: true, zona });
        onigiri(x + w / 2, G - 120); x += w; especial('emboscada', x - w, x);
      },
      roca() {  // roca gigante persecución
        const w = 2000; suelo(x, x + w);
        elem({ t: 'roca', x: x - 200, y: G, x0: x + 250, x1: x + w - 120, activa: false, r: 120 });
        N.haz.push({ x: x + 700, y: G - 46, w: 130, h: 46, tipo: 'kunai' }); N.haz.push({ x: x + 1250, y: G - 46, w: 130, h: 46, tipo: 'kunai' });
        plat(x + 1000, G - 130, 140, pl()); arco(x + 400, x + 1700, G - 30, 8);
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
        plat(x + 330, G - 480, 260, 'piedra'); [0, 60, 120, 180].forEach(d => perg(x + 360 + d, G - 560)); onigiri(x + 560, G - 540); N.items.push({ x: x + 480, y: G - 560, tipo: 'corazon' }); x += 760;
      },
      ruptura() {  // pared de sellos que esconde un tesoro (bonus)
        suelo(x, x + 760); decorar(x, x + 200);
        [0, 1].forEach(i => N.muros.push({ x: x + 420, y: G - 90 * (i + 1), w: 90, h: 90, tipo: 'sello', rompible: true, zona }));
        [0, 1, 2].forEach(i => perg(x + 560 + i * 50, G - 50)); onigiri(x + 690, G - 60); N.items.push({ x: x + 620, y: G - 120, tipo: 'corazon' }); x += 760;
      },
      patrullaB() {   // arquero (flechas que se esquivan saltando) + lancero
        const w = rng.int(900, 1100); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'arquero', x: x + w - 240, y: G, vx: 0, cd: 1 }); enem({ kind: 'lancero', x: x + 380, min: x + 200, max: x + 620, vx: 55 + dif * 8, t: 0 }); if (zona === 'bosque') enem({ kind: 'tengu', x: x + 520, y: G - 210, base: G - 210, amp: 50, min: x + 250, max: x + w - 140, vx: 90 }); arco(x + 150, x + w - 350, G - 40, 4); x += w;
      },
      patrullaC() {   // rana, kappa y zorro de fuego
        const w = rng.int(1000, 1200); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'rana', x: x + 300, min: x + 150, max: x + 520, vx: 0, z: 0, vz: 0, t: rng.next() * 2 }); enem({ kind: 'kappa', x: x + 700, min: x + 520, max: x + 940, vx: 0, z: 0, vz: 0, t: rng.next() * 2 });
        enem({ kind: 'zorro', x: x + w - 250, min: x + w - 560, max: x + w - 100, vx: 190 }); arco(x + 120, x + w - 120, G - 40, 5); x += w;
      },
      llave() {   // una llave dorada abre la reja
        const w = 1150; suelo(x, x + w); decorar(x, x + 300); const id = 'k' + N.muros.length + '_' + N.elem.length;
        plat(x + 230, G - 150, 170, pl()); N.items.push({ x: x + 315, y: G - 225, tipo: 'llave', id });
        enem({ kind: zona === 'cueva' ? 'serpiente' : 'ninja', x: x + 520, min: x + 380, max: x + 700, vx: 55 });
        N.muros.push({ x: x + 880, y: G - 520, w: 36, h: 520, tipo: 'reja', id, abierta: false, zona }); x += w; especial('llave', x - w, x);   // 520: no se salta con doble salto, planeo ni gancho
      },
      // ---- cueva ----
      bestias() {   // serpiente + escarabajo de cristal
        const w = rng.int(1000, 1200); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'serpiente', x: x + 330, min: x + 200, max: x + 540, vx: 45 }); enem({ kind: 'escarabajo', x: x + 800, min: x + 640, max: x + w - 90, vx: 50 });
        frasco(x + w - 220); arco(x + 120, x + w - 120, G - 40, 5); x += w;
      },
      pasillo() {
        const w = rng.int(900, 1100); suelo(x, x + w); decorar(x, x + w);
        enem({ kind: 'murcielago', x: x + 380, y: G - 180, base: G - 180, amp: 60, min: x + 200, max: x + 600, vx: 100 });
        enem({ kind: 'murcielago', x: x + 760, y: G - 150, base: G - 150, amp: 50, min: x + 580, max: x + w - 80, vx: -110 });
        N.deco.push({ x: x + 250, tipo: 'cristal', capa: 'atras', zona }, { x: x + 700, tipo: 'hongo', capa: 'atras', zona }); arco(x + 120, x + w - 120, G - 40, 6); frasco(x + w - 160); x += w;
      },
      estalactitas() {
        const w = 1000; suelo(x, x + w);
        [300, 520, 740].forEach(dx => elem({ t: 'estal', x: x + dx, y0: 60, estado: 'colgada', t0: 0 }));
        arco(x + 150, x + w - 100, G - 50, 5); onigiri(x + 880, G - 60); frasco(x + 460); x += w; especial('estalactitas', x - w, x);
      },
      hongos() {  // hongos que rebotan sobre un pozo
        const a = 150, g = 720; suelo(x, x + a); hueco(x + a, x + a + g);
        [0, 1].forEach(i => { const px = x + a + 120 + i * 330; plat(px, G - 10, 120, 'roca', { tambor: true }); N.tambores.push({ x: px + 60, y: G - 10, zona, hongo: true }); });
        suelo(x + a + g, x + a + g + 160); [0, 1, 2].forEach(i => perg(x + a + 200 + i * 150, G - 360)); x += a + g + 160; especial('hongos', x - g - 310, x);
      },
      telaranas() {
        const w = 1000; suelo(x, x + w); [260, 560, 800].forEach(dx => elem({ t: 'tela', x: x + dx, y: G - 120, w: 120, h: 120, roto: false }));
        enem({ kind: 'arana', x: x + 520, y: G, min: x + 380, max: x + 700, vx: 40, colgada: false }); arco(x + 100, x + w - 100, G - 40, 5); frasco(x + w - 120); x += w; especial('telaranas', x - w, x);
      },
      arana() {
        const w = 900; suelo(x, x + w); [300, 600].forEach(dx => enem({ kind: 'aranaTecho', x: x + dx, y: 120, base: 120, estado: 'espera', vivo: true }));
        arco(x + 100, x + w - 100, G - 40, 5); frasco(x + 450); x += w;
      },
      fuegos() {
        const w = 1000; suelo(x, x + w); [350, 700].forEach(dx => enem({ kind: 'fuego', x: x + dx, y: G - 140, base: G - 140, amp: 40, min: x + 250, max: x + 880, vx: 0, sigue: true }));
        enem({ kind: 'fantasma', x: x + 560, y: G - 120, base: G - 120, amp: 30, min: x + 250, max: x + w - 100, vx: 0, hp: 2 }); N.deco.push({ x: x + 100, tipo: 'cristal', capa: 'atras', zona }); arco(x + 150, x + w - 100, G - 50, 6); frasco(x + w - 140); x += w;
      }
    };
    const SEGUROS = { bosque: ['llano', 'patrulla', 'patrullaB', 'patrullaC', 'llave', 'puente', 'barranco', 'estacas', 'escalera', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'emboscada', 'roca', 'kunaiR', 'sierras', 'viento', 'ruptura', 'chimenea'], cueva: ['pasillo', 'bestias', 'llave', 'estalactitas', 'hongos', 'telaranas', 'arana', 'fuegos', 'barranco', 'estacas', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'emboscada', 'kunaiR', 'sierras', 'ruptura', 'puente'] };
    const FACIL = ['llano', 'puente', 'patrulla', 'escalera', 'pasillo'];
    const LIMITE = { chimenea: 2, patrullaB: 3, patrullaC: 3, llave: 3, bestias: 3, roca: 2, emboscada: 3, carreta: 2, palanca: 2, viento: 2, ruptura: 2, taikos: 3, sierras: 3, kunaiR: 3, moviles: 3, fragil: 3, hongos: 2, telaranas: 2, estalactitas: 2 };
    const usados = {};
    // cada zona incluye SIEMPRE todos estos retos y enemigos (el resto se sortea)
    const MUST = {
      bosque: ['patrulla', 'patrulla', 'patrullaB', 'patrullaC', 'llave', 'emboscada', 'roca', 'taikos', 'moviles', 'fragil', 'carreta', 'palanca', 'kunaiR', 'sierras', 'viento', 'ruptura', 'chimenea'],
      cueva: ['pasillo', 'pasillo', 'bestias', 'llave', 'ruptura', 'estalactitas', 'telaranas', 'fuegos', 'hongos', 'arana', 'emboscada', 'carreta', 'palanca', 'kunaiR', 'sierras', 'moviles', 'fragil', 'taikos']
    };

    // ---------------- ESTACIONES ----------------
    const MECS = ['encender_farol', 'romper_bloques', 'diana', 'piedras', 'empujar_carreta'];
    let mecAnt = null, nEst = 0;
    function estacion(mecOpc) {
      const i = nEst++;
      const tabla = tablaPara(N.est.length);
      const mec = mecOpc || (i === 0 ? 'encender_farol' : rng.pick(MECS.filter(m => m !== mecAnt && (zona === 'bosque' || m !== 'empujar_carreta' || true))));
      mecAnt = mec;
      const mecAc = mec === 'empujar_carreta' ? 'encender_farol' : mec;
      const ac = Ac.crear({ rng: rng.derivar('est' + i), tabla, mecanica: mecAc, maestria });
      ac.mecanica = mec; if (mec === 'empujar_carreta') ac.enunciado = ac.enunciado.replace(/Enciende el farol con (la respuesta|el número que sigue):/, 'Empuja la carreta al número correcto:');
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
      const i = nEst++, t = tablaPara(N.est.length), s = rng.int(1, 6);
      const vals = [0, 1, 2, 3].map(k => t * (s + k)); const W = 1300; suelo(x, x + W);
      const ac = { mecanica: 'antorchas', tipo: 'salto', hecho: t + 'x' + (s + 3), enunciado: 'Enciende las antorchas del número más pequeño al más grande (se cuenta de ' + t + ' en ' + t + ')', objetos: vals.map(v => ({ valor: v, correcto: true })), secuencia: vals };
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
            do { m = (e === 0 && k === 0 ? rng.pick(FACIL) : rng.pick(SEGUROS[nombre])); if (nombre === 'bosque' && m === 'pasillo') m = 'llano'; tries++; }   // 'pasillo' es de la cueva: en el bosque se cambia por un llano
            while ((ant.length && ant[ant.length - 1] === m) || (LIMITE[m] && (usados[nombre + m] || 0) >= LIMITE[m]) || (e === 0 && ['emboscada', 'roca', 'sierras', 'fragil', 'moviles', 'taikos', 'barranco', 'estacas'].indexOf(m) >= 0 && tries < 40));
          }
          quedan--; usados[nombre + m] = (usados[nombre + m] || 0) + 1; ant.push(m); MOD[m](); N.costo += COSTO[m] || 10;
        }
        if (e === nEstaciones - 1) while (must.length) { const m = must.shift(); usados[nombre + m] = (usados[nombre + m] || 0) + 1; MOD[m](); N.costo += COSTO[m] || 10; }   // lo que no salió por sorteo se añade antes del final
        if (nombre === 'cueva' && e === nEstaciones - 1) estacionAntorchas(); else estacion();
        // bosque: un punto de control cada dos acertijos; cueva (oscura y más difícil): tras CADA acertijo, y comida en la mitad de esos tramos
        if ((nombre === 'cueva' ? true : e % 2 === 1) && e < nEstaciones - 1) { suelo(x, x + 220); N.ckp.push({ x: x + 110, activo: false, zona }); if (nombre === 'cueva' && e % 2 === 0) onigiri(x + 40, G - 60); if (e % 2 === 1) npc(e === 1 ? 'tanuki' : 'sensei', x + 185); x += 220; }
      }
      return z0;
    }

    N.inicio = { x: 120 };
    suelo(x, x + 700); zona = 'bosque'; decorar(x, x + 700); arco(x + 200, x + 580, G - 30, 4); npc('sensei', x + 380); x += 700;
    const z1 = x;
    zonaNueva('bosque', 8, 3);
    // jefe del bosque: arena con el Oni rojo
    suelo(x, x + 300); N.ckp.push({ x: x + 100, activo: false, zona }); npc('sensei', x + 230); x += 300;
    { const w = 1400; suelo(x, x + w); N.muros.push({ x: x + 40, y: G - 520, w: 30, h: 520, tipo: 'reja', id: 'jL', abierta: true, zona, auto: true }, { x: x + w - 70, y: G - 520, w: 30, h: 520, tipo: 'reja', id: 'jR', abierta: true, zona, auto: true });
      elem({ t: 'jefe', x0: x + 70, x1: x + w - 70, estado: 0, id: 'jefe' }); N.enem.push({ kind: 'oni', x: x + w - 400, min: x + 100, max: x + w - 100, y: G, vivo: true, hp: 8, hpMax: 8, vx: 0, boss: true, estado: 'quieto', t: 0 }); x += w; N.costo += COSTO.jefe; }
    suelo(x, x + 400); N.zonas.push({ tipo: 'bosque', x0: 0, x1: x }); x += 400;
    // entrada a la cueva
    N.cueva = { x: x - 200 }; const z2 = x;
    suelo(x, x + 500); zona = 'cueva'; npc('sensei', x + 380); x += 500;
    zonaNueva('cueva', 8, 3);
    suelo(x, x + 300); N.zonas.push({ tipo: 'cueva', x0: z2, x1: x + 300 }); x += 300;
    N.meta = { x: x - 150 };
    N.ancho = x; N.params = params; N.costoMin = Math.round(N.costo / 60 * 10) / 10;
    N.decoInfo = repartirDeco(N, rng.derivar('deco'));
    return N;
  }


  // ---------------- REPARTO DEL DECORADO (rediseño visual) ----------------
  // Antes el decorado se tiraba cada ~240 px con azar: podía quedar encima de puertas, faroles de acertijo, muros o huecos,
  // y a veces 3-4 cosas grandes en la misma pantalla. Ahora, ya generado el nivel, se reparte con reglas:
  //   · separación mínima entre bordes · máximo 2 piezas grandes y 3 en total por pantalla (1280 px)
  //   · nada sobre zonas reservadas (puertas, objetos de acertijo, puntos de control, NPC, muros, tambores, estacas, arenas)
  //   · todo apoyado en suelo firme (nunca flotando sobre un hueco) · sin repetir el mismo tipo seguido
  // Usa su propio azar derivado: NO cambia la forma del nivel (enemigos, retos y suelo salen igual que antes).
  // Los anchos deben coincidir con la tabla DECO de motor.js.
  const ANCHO = { bambu: 130, toro: 110, kitsune: 110, estandarte: 100, cristal: 110, hongo: 100, cerezo: 330, pino: 250, rocas: 180, valla: 210, fuente: 150, farolitos: 190, cartel: 115, helechos: 200,
    columna: 140, hongoGigante: 150, floresLuz: 120, altar: 130, arco: 270, paredMineral: 150, cristalesTecho: 150, raices: 170 };
  const GRANDE = { cerezo: 1, pino: 1, valla: 1, farolitos: 1, rocas: 1, helechos: 1, arco: 1 };
  const POOL = { bosque: { grande: ['cerezo', 'pino', 'valla', 'rocas', 'helechos', 'farolitos'], medio: ['bambu', 'toro', 'kitsune', 'estandarte', 'fuente', 'cartel'] },
    cueva: { grande: ['arco'], medio: ['cristal', 'hongo', 'hongoGigante', 'columna', 'floresLuz', 'altar', 'paredMineral'] } };
  const PREMIABLE = { cerezo: 'pergaminos', helechos: 'pergaminos', rocas: 'pergaminos', toro: 'pergaminos', fuente: 'cura' };   // se abren de un tajo (solo bosque)
  const AVISO_ENEM = { arquero: '¡Un arquero! Salta sus flechas', lancero: '¡Un lancero embiste!', tengu: '¡Cuervos tengu en el aire!', rana: '¡Ranas que saltan!', kappa: '¡Un kappa!', zorro: '¡Un zorro veloz!', ninjaAtk: '¡Ninjas que embisten!', ninja: 'Hay ninjas adelante' };
  const AVISO_ELEM = { roca: '¡Una roca gigante te perseguirá! Corre', emb: '¡Emboscada! Prepárate', sierra: 'Sierras de shuriken: mira el ritmo', kunaiR: 'Kunai a ritmo: espera y pasa', viento: 'Una corriente de viento te sube', carreta: 'Empuja la carreta contra el muro', palanca: 'Busca la palanca para abrir la reja', jefe: '¡El Oni rojo te espera!' };
  function repartirDeco(N, rng) {
    const R = [], res = (a, b) => R.push([a, b]);
    N.est.forEach(e => {
      if (e.puertaX != null) res(e.puertaX - 140, e.puertaX + 140);
      if (e.mecanica !== 'piedras') (e.objetos || []).forEach(o => { if (o.x != null) res(o.x - 120, o.x + 120); });
      if (e.mecanica === 'empujar_carreta') res(e.x0, e.x0 + e.ancho);   // zona de empuje y casillas: sin nada detrás
    });
    N.ckp.forEach(c => res(c.x - 150, c.x + 150));
    N.tambores.forEach(t => res(t.x - 130, t.x + 130));
    N.muros.forEach(m => res(m.x - 70, m.x + m.w + 70));
    N.haz.forEach(z => res(z.x - 40, z.x + z.w + 40));
    N.elem.forEach(e => {
      if (e.t === 'npc') res(e.x - 120, e.x + 120);
      else if (e.t === 'emb' || e.t === 'jefe') res(e.x0 - 60, e.x1 + 60);
      else if (e.t === 'carreta') res(e.min - 40, e.max + e.w + 40);
      else if (e.x != null && e.t !== 'roca') res(e.x - 120, e.x + (e.w || 0) + 120);
    });
    res(0, 300); res(N.meta.x - 230, N.meta.x + 230); res(N.cueva.x - 110, N.cueva.x + 530);
    const libre = (x0, x1) => !R.some(r => x1 > r[0] && x0 < r[1]);
    const sobreSuelo = (x0, x1, zona) => N.suelo.some(s => s.zona === zona && x0 >= s.x0 + 24 && x1 <= s.x1 - 24);
    const peligros = [];
    N.haz.forEach(z => peligros.push({ x: z.x, msg: 'Estacas adelante: ¡salta!' }));
    N.gaps.forEach(g => peligros.push({ x: g.x0, msg: 'El camino se corta: salta o usa las plataformas' }));
    N.enem.forEach(e => { if (AVISO_ENEM[e.kind]) peligros.push({ x: e.x, msg: AVISO_ENEM[e.kind] }); });
    N.elem.forEach(e => { const k = e.t, m = AVISO_ELEM[k]; if (m) peligros.push({ x: e.x0 !== undefined ? e.x0 : e.x, msg: m }); });
    N.est.forEach(e => peligros.push({ x: e.x0, msg: 'Un acertijo: resuelve la cuenta para abrir la puerta' }));
    const aviso = x => { let mejor = null; peligros.forEach(p => { if (p.x > x + 260 && p.x < x + 1400 && (!mejor || p.x < mejor.x)) mejor = p; }); return mejor ? mejor.msg : null; };

    const techos = N.deco.filter(d => d.techo), base = N.deco.filter(d => !d.techo).sort((a, b) => a.x - b.x), ok = [];
    base.forEach(d => {
      const zona = d.zona || 'bosque', pool = POOL[zona] || POOL.bosque;
      if (!ANCHO[d.tipo]) return;
      let alt;   // tipo de reemplazo (se elige una sola vez, solo si hace falta)
      for (const off of [0, 40, -40, 80, -80, 120, -120, 170, -170, 230, -230]) {
        const x = d.x + off, prev = ok[ok.length - 1], ante = ok[ok.length - 2];
        let tipo = d.tipo;
        if (prev && prev.zona === zona && prev.tipo === tipo && x - prev.x < 900) {   // sin repetir el mismo tipo seguido
          if (alt === undefined) { const cat = (GRANDE[tipo] ? pool.grande : pool.medio).filter(t => t !== prev.tipo && (!ante || t !== ante.tipo)); alt = cat.length ? rng.pick(cat) : null; }
          if (!alt) continue; tipo = alt;
        }
        const w = ANCHO[tipo], grande = !!GRANDE[tipo], x0 = x - w * .42, x1 = x + w * .42;
        if (!libre(x0, x1) || !sobreSuelo(x - w / 2, x + w / 2, zona)) continue;
        if (prev && prev.zona === zona) { const sep = (grande || GRANDE[prev.tipo]) ? 150 : 90; if (x - w * .45 - (prev.x + ANCHO[prev.tipo] * .45) < sep) continue; }
        const rec = ok.filter(o => o.zona === zona), gr = rec.filter(o => GRANDE[o.tipo]);     // máx. 3 piezas (y 2 grandes) en cualquier tramo de 1280 px
        if (rec.length >= 3 && x - rec[rec.length - 3].x < 1280) continue; if (grande && gr.length >= 2 && x - gr[gr.length - 2].x < 1280) continue;
        if (tipo === 'farolitos' && ok.some(o => o.tipo === 'farolitos' && x - o.x < 1800)) continue;
        if (tipo === 'cartel' && ok.some(o => o.tipo === 'cartel' && x - o.x < 1500)) continue;
        ok.push(Object.assign(d, { x, tipo, zona })); break;
      }
    });
    // 'frente' (bambú delante del héroe): solo en tramos despejados y como mucho uno cada 1800 px
    let ultFrente = -1e9;
    ok.forEach(d => {
      if (d.capa !== 'frente') return;
      const estorba = !libre(d.x - 260, d.x + 260) || N.enem.some(e => Math.abs(e.x - d.x) < 260) || N.items.some(i => Math.abs(i.x - d.x) < 120) || d.x - ultFrente < 1800;
      if (estorba) d.capa = 'atras'; else ultFrente = d.x;
    });
    // objetos que reaccionan (se mecen al pasar y al tajo); algunos esconden un premio (a lo sumo uno cada ~1500 px)
    let ultPremio = -1e9;
    ok.forEach(d => {
      d.w = ANCHO[d.tipo];
      if (d.zona === 'bosque' && PREMIABLE[d.tipo] && d.x - ultPremio > 1500 && d.x > 900 && rng.chance(.7)) { d.premio = PREMIABLE[d.tipo]; ultPremio = d.x; }
      if (d.tipo === 'cartel') d.msg = aviso(d.x) || 'Sigue el camino, aprendiz';
    });
    N.deco = techos.concat(ok).sort((a, b) => a.x - b.x);
    return { reservadas: R };
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
    // las rejas se abren al resolver su reto y se hacen altas a propósito (con doble salto, planeo o gancho no se pueden saltar);
    // las paredes de chimenea flotan: por debajo se camina, así que no deben bajar de G-150
    N.muros.forEach(m => {
      if (m.tipo === 'escalada') { if (m.y + m.h > G - 150) f.push('chimenea bloquea el paso'); }
      else if (m.tipo !== 'reja' && m.h > 320) f.push('muro alto');
    });
    return f;
  }
  return { generar, validar, G, COSTO, ANCHO_DECO: ANCHO };
});
