/**
 * Solo lo usa tsconfig.json (revisión ESTRICTA). Ese nivel todavía no incluye engine/juego-principal.js,
 * donde estas variables se definen de verdad; por eso aquí se declaran de forma mínima.
 * En el nivel básico NO se usan: allí TypeScript infiere sus tipos reales leyendo juego-principal.js.
 * Cuando juego-principal.js pase al nivel estricto, este archivo se borra.
 */
declare var GS: any;
declare var P: any;
declare var curQ: any;
declare var camX: number;
declare var SFX: Record<string, any>;
