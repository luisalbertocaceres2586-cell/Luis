/* Mundo 4 · salas (solo DATOS). Cada mapa fue creado con tools/n4-generar.js y verificado con el solucionador
   (tests/nivel4.test.js comprueba que TODAS tienen solución).
   Leyenda: # pared · . aire · H héroe · X portal de salida · ^ pinchos · E sombra de piedra · S interruptor
            1 2 3 casillas fantasma (se vuelven sólidas al restaurar ese cristal) · a b c losas de respuesta · p q r losas de secuencia */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Nivel4Salas = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const mult = c => ({ tipo: 'mult', cristal: c, pads: { a: { ok: 1 }, b: {}, c: {} } });
  const sec = c => ({ tipo: 'sec', cristal: c, orden: ['q', 'p', 'r'], pads: {} });
  const sombra = c => ({ tipo: 'sombra', cristal: c });
  const salas = [
    { id: 1, nombre: 'Aprende a girar', tinte0: 0, tablas: [2, 3, 4, 5],
      aviso: 'Gira la sala con ⟲ ⟳ y camina con ← →. Pisa la losa con la respuesta correcta.',
      mapa: ['#########', '#H..###.#', '#.c###..#', '#..##..##', '##....###', '##a...b##', '##.######', '#X.######', '#########'],
      retos: [mult(1)] },
    { id: 2, nombre: 'Casillas fantasma', tinte0: 0.25, tablas: [3, 4, 6],
      aviso: 'Lo gris es un fantasma: lo atraviesas. Restaura un cristal y sus casillas se vuelven sólidas.',
      mapa: ['#########', '##H.p2b##', '##.######', '##.....##', '#.a##2###', '##.###..#', '#c2#2.2.#', '#q.r..X.#', '#########'],
      retos: [mult(1), sec(2)] },
    { id: 3, nombre: 'La sombra cae', tinte0: 0.5, tablas: [6, 7, 8],
      aviso: 'La sombra de piedra también cae con la gravedad. Déjala caer sobre el interruptor ◎. Cuidado con los pinchos.',
      mapa: ['#########', '##E....X#', '##..a22.#', '######..#', '###.21H##', '####..S1#', '##c#^..##', '##.##b###', '#########'],
      retos: [mult(1), sombra(2)] },
    { id: 4, nombre: 'El Guardián del Color', tinte0: 0.7, tablas: [6, 7, 8, 9],
      aviso: 'Tres cristales: una respuesta, una secuencia y una sombra. ¡Devuélvele el color al mundo!',
      mapa: ['#########', '#.###.cS#', '#..p#^..#', '#.3##.13#', '#.####b1#', '#X2.#.H##', '#a.....##', '#qrE3.###', '#########'],
      retos: [mult(1), sec(2), sombra(3)] }
  ];
  /** copia fresca de una sala (los retos se modifican al rellenar números) */
  function copia(i) { return JSON.parse(JSON.stringify(salas[i])); }
  return { salas, copia };
});
