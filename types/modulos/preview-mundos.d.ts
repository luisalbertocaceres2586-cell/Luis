/** engine/ui/preview-mundos.js — vistas previas vivas de las tarjetas del selector. */
export {};
declare global {
  var PreviewMundos: { montar(...a: any[]): any; crearMontaje(heroe: string): { imgs: string[]; dibujar(c: CanvasRenderingContext2D, W: number, H: number, ahora: number, prog: number): void } | null; precargar(lista: string[]): void; diagnostico(): any[] };
}
