// Pruebas de la luz dinámica (engine/luz-dinamica.js): funciones puras. Ejecutar: node tests/luz-dinamica.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../engine/luz-dinamica.js');
const src = fs.readFileSync(path.join(__dirname, '../engine/juego-principal.js'), 'utf8');

// 1) Todo bioma que usa algún nivel tiene configuración de luz
const usados = new Set([...src.matchAll(/bg:'([a-z_]+)'/g)].map(m => m[1]));
for (const bg of usados) assert(L.BIOMAS[bg], 'Falta configurar luz para el bioma: ' + bg);
for (const [bg, c] of Object.entries(L.BIOMAS)) {
  assert(c.amb.length === 3 && c.amb.every(v => v >= 80 && v <= 255), bg + ': la luz ambiente no debe ser casi negra (legibilidad para niños)');
  assert(c.heroR >= 120 && c.sombra >= 0 && c.sombra <= 1, bg + ': radio/sombra fuera de rango');
}

// 2) Cable trampa: la fórmula con que el juego coloca el decorado debe seguir igual a la que replica el módulo
for (const frag of ['2654435761', '>=58', 'SLOT*s', '0.9+((h>>>4)%25)/100']) {
  const limpio = src.replace(/\s+/g, '');
  assert(limpio.includes(frag.replace(/\s+/g, '')) || frag === 'SLOT*s', 'La colocación del decorado cambió (' + frag + '): actualiza decorEmisores en luz-dinamica.js');
}
assert(/const SLOT=230/.test(src.replace(/\s+/g, ' ').replace(/const SLOT = 230/, 'const SLOT=230')), 'SLOT del decorado ya no es 230');

// 3) Sombras: nunca se proyecta la arista que mira a la luz (esa cara queda iluminada); sí las de silueta y la de atrás
const plat = { x: 100, y: 100, w: 80, h: 20 };
const aristas = q => q.map(c => (c[0][0] === c[1][0] ? (c[0][0] === 100 ? 'izq' : 'der') : (c[0][1] === 100 ? 'arriba' : 'abajo')));
let q = L.sombraQuads(140, 0, plat, 500);   // luz arriba
assert(!aristas(q).includes('arriba') && aristas(q).includes('abajo'), 'luz arriba: la sombra sale por abajo, la cara de arriba queda iluminada');
assert(q.every(c => Math.hypot(c[2][0] - c[1][0], c[2][1] - c[1][1]) > 400), 'la sombra se estira lejos de la luz');
const bajo = q.find(c => c[0][1] === 120 && c[1][1] === 120);
assert(bajo[2][1] > 120 && bajo[3][1] > 120, 'la arista de abajo se proyecta hacia abajo');
q = L.sombraQuads(0, 110, plat, 500);        // luz a la izquierda
assert(!aristas(q).includes('izq') && aristas(q).includes('der'), 'luz a la izquierda: sombra hacia la derecha, cara izquierda iluminada');
q = L.sombraQuads(0, 0, plat, 500);          // luz arriba-izquierda
assert.deepStrictEqual(aristas(q).sort(), ['abajo', 'der']);
assert.deepStrictEqual(L.sombraQuads(140, 110, plat, 500), [], 'luz dentro del rectángulo: sin sombra');

// 4) Decorado: determinista, sobre el suelo, con luz solo de objetos emisores
const suelo = [{ x: 0, y: 500, w: 20000, h: 80, type: 'ground' }];
const lista = ['torch', 'rock', 'lamp', 'bush'];
const alt = { torch: 90, lamp: 130, rock: 40, bush: 40 };
const a = L.decorEmisores('castle', 1000, 960, suelo, 15000, lista, alt, null);
const b = L.decorEmisores('castle', 1000, 960, suelo, 15000, lista, alt, null);
assert.deepStrictEqual(a, b, 'mismas entradas → mismas luces');
assert(a.length > 0, 'en 960 px de pantalla debe haber alguna luz de decorado');
for (const d of a) { assert(d.y < 505 && d.y > 300, 'la luz queda sobre el suelo'); assert(L.EMISOR[d.key], 'solo objetos emisores'); }
assert.deepStrictEqual(L.decorEmisores('castle', 1000, 960, [], 15000, lista, alt), [], 'sin suelo no hay luces');
const cerca = L.decorEmisores('castle', 14800, 960, suelo, 15000, lista, alt, null);
assert(cerca.every(d => Math.abs(d.x - 15000) >= 190), 'sin luces pegadas a la meta');

// 5) Ambiente: intensidad 0 = sin oscurecer, 1 = valor del bioma
assert.deepStrictEqual(L.ambiente(L.BIOMAS.crypt, 0), [255, 255, 255]);
assert.deepStrictEqual(L.ambiente(L.BIOMAS.crypt, 1), L.BIOMAS.crypt.amb);
console.log('luz-dinamica: OK');
