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
  // ---------- estado principal del juego (definido en index.html) ----------
  interface EstadoJuego {
    phase: string; level: number; totalScore: number; name: string; char: string;
    [campo: string]: any; // TODO: describir el resto de campos
  }
  /** Jugador (posición, velocidad, vidas, poderes…). */
  interface Jugador {
    x: number; y: number; vx: number; vy: number; w: number; h: number;
    [campo: string]: any; // TODO
  }

  var GS: EstadoJuego;
  var P: Jugador;
  var CX: CanvasRenderingContext2D;
  var CV: HTMLCanvasElement;
  var W: number;
  var H: number;
  var camX: number;
  var AC: AudioContext;
  /** Teclas pulsadas, por nombre. */
  var K: Record<string, boolean | number>; // el teclado guarda true/false y el mando 0/1
  var _muted: boolean;
  var _paused: boolean;
  var _char: string;
  var _perfMode: string | number | boolean;

  // ---------- funciones sueltas del juego ----------
  var SFX: Record<string, any>;
  var FX: any; // TODO
  /** Sonido sintetizado. ¡Ojo con el orden!: frecuencia, TIPO de onda, duración, volumen, retraso. */
  function tone(freq: number, tipo?: OscillatorType | string, dur?: number, vol?: number, retraso?: number): void;
  function render(...args: any[]): void;
  function uAC(): void;
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

  // ---------- mundo y nivel (TODO: tipar) ----------
  /** Altura del suelo en píxeles (función, no variable). */
  function groundY(): number;
  /** Jefe del nivel actual (objeto con hp, encountered…) o false. */
  var bossFight: any;
  var curLV: any; var curQ: any; var AQ: any; var AQbonus: any;
  var platforms: any[]; var pipes: any[]; var skyItems: any[]; var coins: any[]; var bullets: any[];
  var flagX: number; var tiLeft: number; var WORLD_W: number; var GRAV: number; var MELEE_DUR: number;
  var _skyZone: any; var _spreadCooldown: number;
  var POWER_ICONS: any; var THEMED_POWERS: any; var ISLAS_META: any; var SPR: any;
  var ANTAREZ: any; var ANTAREZ_MANIFEST: any; var VILLAIN_MANIFEST: any;

  // ---------- módulos de engine/ ----------
  var Perfiles: PerfilesAPI;
  var Nube: any;   // engine/nube.js (cuentas y guardado en la nube); puede no estar cargado
  var SelectorMundos: SelectorMundosAPI;
  var MundosRegistro: MundosRegistroAPI;
  var NinjaMods: any; var NinjaOrient: any; var NinjaCompat: any; var NinjaDevice: any; var NJ: any; var NJX: any;
  var IntroPro: any; var VillainBoss: any;
  var Nivel1: any; var N1hab: any; var N1elem: any; var N1dir: any; var Ruta: any; var Acertijos: any; var GenNivel: any;

  // ---------- cosas que los scripts cuelgan de `window` / APIs no estándar del navegador ----------
  interface Window {
    N1core?: any; NinjaHaptics?: any; NinjaMods?: any; NinjaOrient?: any; NinjaCompat?: any; NinjaDevice?: any; NJ?: any; NJX?: any;
    render?: (...args: any[]) => void; renderBg?: (...args: any[]) => void; levelDone?: (...args: any[]) => void;
    saveG?: (...args: any[]) => void; spawnSkyItem?: (...args: any[]) => void; njLayout?: (...args: any[]) => void;
    __introDone?: boolean; NJ_BUILD?: string; NJ_ZOOM?: number;
    VILLAIN_NAME?: string; SAKURA_MANIFEST?: any; SAKURA_EVE_MANIFEST?: any;
    IntroPro?: any; VillainBoss?: any; Nivel1?: any; Nivel2?: any; Nivel3?: any;
    webkitAudioContext?: typeof AudioContext;
    [extra: string]: any; // los mods dejan banderas sueltas en window (p. ej. __mod_xyz)
  }
  interface Navigator { standalone?: boolean; audioSession?: { type: string } }
  interface ScreenOrientation { lock?(orientation: string): Promise<void> }
}
