/** engine/nivel4/* — Mundo 4 · El Mundo Negativo (lógica pura, salas y motor visual). */
export {};
declare global {
  var Nivel4Logica: any;
  var Nivel4Salas: any;
  var Nivel4: { iniciar(o?: any): any };
  interface Window { Nivel4Logica: any; Nivel4Salas: any; Nivel4: { iniciar(o?: any): any } }
}
