// Pruebas de los detalles animados del Nivel 1 (engine/nivel1/detalles.js): separación por píxeles. Ejecutar: node tests/detalles-nivel1.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const D = require('../engine/nivel1/detalles.js');
const { RUEDA, FAROL, AGUA } = D;

// 1) Cable trampa: las medidas del módulo corresponden a los sprites actuales (si cambias el arte, hay que recalibrar)
const dims = f => { const b = fs.readFileSync(path.join(__dirname, '..', f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
assert.deepStrictEqual(dims('assets/nivel1/decorado/carreta_madera.png'), [RUEDA.w, RUEDA.h], 'carreta_madera.png cambió de tamaño: recalibra RUEDA/FAROL en detalles.js');
assert.deepStrictEqual(dims('assets/nivel1/decorado_extra/fuente_bambu.png'), [AGUA.w, AGUA.h], 'fuente_bambu.png cambió de tamaño: recalibra AGUA en detalles.js');

// 2) Radios: imagen sintética con 12 radios claros sobre fondo oscuro
const W = RUEDA.w, H = RUEDA.h, src = new Uint8ClampedArray(W * H * 4);
const idx = (x, y) => (y * W + x) * 4;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const u = x - RUEDA.cx, v = y - RUEDA.cy, r = Math.hypot(u, v), th = Math.atan2(v, u), paso = Math.PI / 6;
  const d = ((th + paso / 2) % paso + paso) % paso - paso / 2, enRadio = r * Math.abs(Math.sin(d)) < 4 && r > RUEDA.r0 && r < RUEDA.r1;
  const i = idx(x, y); src[i] = enRadio ? 220 : 40; src[i + 1] = enRadio ? 160 : 30; src[i + 2] = enRadio ? 80 : 25; src[i + 3] = 255;
}
const { base, radios } = D.separarRadios(src, W, H, 1);
let fuera = 0, dentro = 0, difCompuesta = 0, difBaseFuera = 0, n = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = idx(x, y), r = Math.hypot(x - RUEDA.cx, y - RUEDA.cy);
  if (r <= RUEDA.r0 || r >= RUEDA.r1) { if (radios[i + 3] !== 0) fuera++; if (base[i] !== src[i]) difBaseFuera++; continue; }
  if (radios[i + 3] > 0) dentro++;
  const a = radios[i + 3] / 255;   // a 0° la capa de radios sobre la fija debe reproducir el sprite original
  for (let c = 0; c < 3; c++) { difCompuesta += Math.abs(radios[i + c] * a + base[i + c] * (1 - a) - src[i + c]); n++; }
}
assert.strictEqual(fuera, 0, 'los radios no deben salirse del anillo (buje y aro quedan fijos)');
assert.strictEqual(difBaseFuera, 0, 'la capa fija no cambia fuera del anillo');
assert(dentro > 1500, 'hay radios que girar');
assert(difCompuesta / n < 2, 'a 0° la rueda se ve igual que el sprite original (error medio ' + (difCompuesta / n).toFixed(2) + ')');
// en la capa fija ya no quedan radios claros donde estaban (el hueco se rellenó con el vecino)
const i0 = idx(Math.round(RUEDA.cx + 60), Math.round(RUEDA.cy));   // sobre un radio (0°)
assert(base[i0] < 100 && src[i0] > 200, 'el radio original se quitó de la capa fija');

// 3) Farol: sale de la capa fija y queda en la suya
const b2 = new Uint8ClampedArray(src); const far = D.separarFarol(b2, W, H, 1), pf = idx(FAROL.x0 + 10, FAROL.y0 + 10);
assert(far[pf + 3] === 255 && b2[pf + 3] === 0, 'el farol se mueve a su propia capa');
const fuera2 = idx(FAROL.x1 + 20, FAROL.y0 + 10); assert(b2[fuera2 + 3] === 255 && far[fuera2 + 3] === 0, 'fuera del recorte no se toca nada');

// 4) Agua: azul = agua, piedra gris = no, espuma blanca solo si toca agua
const AW = AGUA.w, AH = AGUA.h, s2 = new Uint8ClampedArray(AW * AH * 4);
const put = (x, y, r, g, b) => { const i = (y * AW + x) * 4; s2[i] = r; s2[i + 1] = g; s2[i + 2] = b; s2[i + 3] = 255; };
for (let x = 220; x < 230; x++) for (let y = 150; y < 160; y++) put(x, y, 60, 190, 240);      // chorro
put(230, 155, 235, 248, 255);                                                                  // espuma pegada al agua
for (let x = 200; x < 210; x++) for (let y = 240; y < 246; y++) put(x, y, 20, 110, 170);        // pileta oscura
for (let x = 260; x < 270; x++) for (let y = 130; y < 140; y++) put(x, y, 125, 115, 150);       // piedra gris-violeta
put(280, 200, 235, 248, 255);                                                                  // blanco suelto, lejos del agua
const m = D.mascaraAgua(s2, AW, AH, 1), g = (x, y) => m[y * AW + x];
assert.strictEqual(g(225, 155), 1); assert.strictEqual(g(230, 155), 1, 'espuma junto al agua'); assert.strictEqual(g(205, 243), 1, 'pileta oscura');
assert.strictEqual(g(265, 135), 0, 'la piedra no es agua'); assert.strictEqual(g(280, 200), 0, 'blanco lejos del agua no es espuma');
console.log('detalles-nivel1: OK');
