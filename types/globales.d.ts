/**
 * Variables y módulos GLOBALES que comparten los scripts del juego.
 * El `index.html` (script principal) define el estado del juego y los "mods" de engine/ lo leen.
 * Declararlos aquí le dice a TypeScript que existen, para que no marque falsos errores
 * y sí marque los verdaderos (typos, argumentos mal puestos…).
 *
 * Convención:  tipado de verdad  → se describe la forma.
 *              `any` + "TODO"     → existe, pero todavía no se ha descrito (deuda a pagar poco a poco).
 */
export {};

declare global {
  // ---------- estado principal del juego ----------
  // GS, P, CX, CV, W, H, K… ya NO se declaran aquí: se definen de verdad en engine/juego-principal.js y TypeScript
  // usa los tipos que infiere de ese código.

  /** Teclas pulsadas, por nombre. */

  // ---------- funciones sueltas del juego ----------
  var FX: any; // TODO
  var LuzDin: any; // engine/luz-dinamica.js (luz dinámica; opcional)
  /** Sonido sintetizado. ¡Ojo con el orden!: frecuencia, TIPO de onda, duración, volumen, retraso. */
  function tone(freq: number, tipo?: OscillatorType | string, dur?: number, vol?: number, retraso?: number): void;
  function render(...args: any[]): void;
  /** Se asigna como window.startIntroAnimation en juego-principal.js (después de usarse en un setTimeout). */
  function startIntroAnimation(): void;
  function startLevel(nivel: number, fase: string): void;
  function togglePause(...args: any[]): void;
  function updHUD(...args: any[]): void;
  function update(...args: any[]): void;
  function screenShake(...args: any[]): void;
  function flashGreen(...args: any[]): void;
  function layoutLevel(...args: any[]): void;
  function doJump(...args: any[]): void;
  function selChar(...args: any[]): void;
  function spawnPfx(...args: any[]): void;
  function spawnTfx(...args: any[]): void;
  function spawnShockwave(...args: any[]): void;
  function zoneBgFor(...args: any[]): any;
  function groundYAt(x: number): number;

  /** Plataforma del nivel (suelo, flotante, móvil o portal del cielo). */
  interface Plataforma { x: number; y: number; w: number; h: number; type: string; moving?: boolean; isSkyPortal?: boolean; portalActive?: boolean; [extra: string]: any }

  // ---------- mundo y nivel (TODO: tipar) ----------
  /** Altura del suelo en píxeles (función, no variable). */
  function groundY(): number;
  /** Jefe del nivel actual (objeto con hp, encountered…) o false. */
  var ISLAS_META: any;
  var ANTAREZ: any; var ANTAREZ_MANIFEST: any; var VILLAIN_MANIFEST: any;

  // ---------- módulos de engine/ ----------
  // Los módulos con tipo propio viven en types/modulos/<modulo>.d.ts (un archivo por módulo, para no chocar con otras pestañas).
  var Perfiles: PerfilesAPI;
  var SelectorMundos: SelectorMundosAPI;
  var MundosRegistro: MundosRegistroAPI;

  // ---------- cosas que los scripts cuelgan de `window` / APIs no estándar del navegador ----------
  interface Window {
    N1core?: any; N1puz?: any; NinjaHaptics?: any; NinjaMods?: any; NinjaOrient?: any; NinjaCompat?: any; NinjaDevice?: any; NinjaTouch?: any; NinjaTouchCore?: any; NinjaTouchJump?: any; NinjaCalidad?: any; NinjaCalidadCore?: any; NinjaInterp?: any; NJ?: any; NJX?: any;
    render?: (...args: any[]) => void; renderBg?: (...args: any[]) => void; levelDone?: (...args: any[]) => void;
    saveG?: (...args: any[]) => void; spawnSkyItem?: (...args: any[]) => void; njLayout?: (...args: any[]) => void;
    __introDone?: boolean; NJ_BUILD?: string; NJ_ZOOM?: number;
    VILLAIN_NAME?: string; SAKURA_MANIFEST?: any; SAKURA_EVE_MANIFEST?: any;
    IntroPro?: any; VillainBoss?: any; Nivel1?: any; Nivel2?: any; Nivel3?: any; PerfilUI?: any;
    webkitAudioContext?: typeof AudioContext;
    [extra: string]: any; // los mods dejan banderas sueltas en window (p. ej. __mod_xyz)
  }
  interface Navigator { standalone?: boolean; audioSession?: { type: string } }
  interface ScreenOrientation { lock?(orientation: string): Promise<void> }
}
