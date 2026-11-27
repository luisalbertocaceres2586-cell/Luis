// Interpolación (engine/core/interpolacion.js): suaviza lo dibujado SIN alterar nunca el estado real de la física.
const assert = require('assert');
const NI = require('../engine/core/interpolacion.js');
const close = (a, b) => assert(Math.abs(a - b) < 1e-9, a + ' ≠ ' + b);

const I = NI.crear({ salto: 100 });
const a = { x: 0, y: 0 }, b = { x: 500, y: 40 }, nueva = { x: 7, y: 7 };
I.marcar([a, b]);                 // antes del paso: a=(0,0) b=(500,40)
a.x = 10; a.y = -4; b.x = 506; b.y = 40;     // el paso de física los movió
const lista = [a, b, nueva, null];
I.aplicar(lista, 0.5);
close(a.x, 5); close(a.y, -2); close(b.x, 503); close(nueva.x, 7, 'un objeto nuevo (sin posición previa) no se interpola');
I.restaurar();
close(a.x, 10); close(a.y, -4); close(b.x, 506); close(nueva.x, 7);   // la física recupera sus valores EXACTOS
// alpha fuera de rango se limita
I.aplicar([a], 7); close(a.x, 10); I.restaurar(); I.aplicar([a], -3); close(a.x, 0); I.restaurar(); close(a.x, 10);
// teletransporte (más de "salto" px): no se interpola
const t = { x: 0, y: 0 }; I.marcar([t]); t.x = 3000; I.aplicar([t], 0.5); close(t.x, 3000); I.restaurar(); close(t.x, 3000);
// escalar suelto (cámara)
close(I.esc(100, 110, 0.25), 102.5); close(I.esc(undefined, 110, 0.25), 110); close(I.esc(0, 5000, 0.5), 5000);
// restaurar dos veces seguidas no rompe nada
I.restaurar();
// simulación: movimiento a 60 pasos/s mostrado a 120 cuadros/s → posiciones dibujadas uniformes
const p = { x: 0, y: 0 }; const dib = []; let acc = 0;
for (let f = 0; f < 40; f++) {
  acc += 0.5;
  while (acc >= 0.999) { I.marcar([p]); p.x += 6; acc -= 1; }
  I.aplicar([p], acc); dib.push(+p.x.toFixed(6)); I.restaurar();
}
const pasos = dib.slice(3).map((v, i) => +(v - dib.slice(3)[i - 1 < 0 ? 0 : i - 1]).toFixed(6)).slice(1);
assert(pasos.every(d => Math.abs(d - 3) < 1e-6), 'a 120 Hz cada cuadro avanza 3 px (la mitad de un paso de 6): ' + pasos.slice(0, 6));
console.log('interpolacion OK');
