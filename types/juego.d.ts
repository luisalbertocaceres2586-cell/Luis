/**
 * Tipos del dominio de "Ninja Multiplicación".
 * Aquí se describe UNA sola vez cómo son los datos del juego (perfil, mundo, maestría…).
 * Los archivos .js los usan con JSDoc, por ejemplo:   /** @param {Perfil} p *​/
 * Así, si alguien escribe `perfil.racha.dia` en vez de `perfil.racha.dias`, el editor y la verificación
 * (npm run typecheck) lo marcan ANTES de que lo vea un niño.
 */
export {};

declare global {
  /** Aciertos/errores de una operación ("7x8") y su "caja" de repaso (0-4). */
  interface Hecho { a: number; e: number; caja: number; t: number }
  type Maestria = Record<string, Hecho>;

  /** Días seguidos practicando. `ultimo` es AAAA-MM-DD en hora local. */
  interface Racha { ultimo: string; dias: number; mejor: number }

  interface ProgresoClasico { fase: string; nivel: number; puntos: number }

  interface Nivel1Datos { intentos?: number; completados?: number; plan?: unknown; estado?: unknown; semilla?: unknown }
  interface Nivel2Datos { plan?: unknown; semilla?: unknown; intentos?: number; completados?: number; estrellas?: number; mejor?: number; tutorial?: boolean; fallos?: Record<string, number> }
  interface Nivel4Datos { intentos?: number; completado?: boolean; estrellas?: number; mejor?: number; salaMax?: number; fallos?: Record<string, number> }
  interface Nivel3Datos { intentos?: number; completado?: boolean; estrellas?: number; mejor?: number; fallos?: Record<string, number> }

  type Avatar = 'sakura' | 'kage';

  interface Perfil {
    id: string;
    nombre: string;
    avatar: Avatar | string;
    dispositivo?: string | null;
    creado?: number;
    ultimo?: number;
    progreso: ProgresoClasico;
    nivel1?: Nivel1Datos;
    nivel2?: Nivel2Datos;
    nivel3?: Nivel3Datos;
    nivel4?: Nivel4Datos;
    maestria?: Maestria;
    racha?: Racha;
    mundos?: { ultimo?: string };
    tutoriales?: unknown;
    estadisticas?: { aciertos: number; errores: number; minutos: number };
  }

  // ---------- Mundos (selector) ----------
  type EstadoMundo = 'nuevo' | 'en_curso' | 'completado' | 'bloqueado';
  interface ProgresoMundo { estado: EstadoMundo; estrellas?: number; mejor?: number; veces?: number }

  interface PropDecorado { img: string; x: number; h: number; capa: 'medio' | 'cerca'; alto?: boolean; y?: number }
  interface FaseMundo { nombre: string; far: string; suelo: [string, string]; completo?: boolean; props?: PropDecorado[] }
  interface ExtraMundo { img?: string; frames?: string[]; lado: 'izq' | 'der'; h: number; y?: number; fps?: number }
  type TipoParticulas = 'luciernagas' | 'arena' | 'cristales' | 'petalos' | 'farolillos' | 'brasas';

  /** Mini-partida en bucle que se dibuja dentro de la tarjeta (engine/ui/preview-mundos.js). */
  interface DemoMundo { tipo: 'lateral' | 'vuelo' | 'carril'; ruta?: [string, string]; [opcion: string]: unknown }

  interface Mundo {
    id: string;
    nombre: string;
    nivel: string;
    lema: string;
    tablas: string;
    duracion: string;
    dificultad: number;
    acento: string;
    acento2: string;
    cielo: [string, string];
    fases: FaseMundo[];
    props?: PropDecorado[];
    flota?: string;
    extra?: ExtraMundo;
    heroe: 'corre' | 'vuela';
    demo?: DemoMundo;
    particulas?: TipoParticulas;
    bloqueado?: boolean;
    fueraDeProgreso?: boolean;
    visible?: (perfil: Perfil | null) => boolean;
    progreso: (perfil: Perfil | null) => ProgresoMundo;
    url?: (perfil: Perfil | null) => string;
  }

  interface MundosRegistroAPI {
    lista: Mundo[];
    obtener(id: string): Mundo | null;
    imagenes(): string[];
  }

  type LanzadoresMundos = Record<string, (perfil: Perfil | null, mundo: Mundo) => void>;
  interface OpcionesSelector {
    perfil?: Perfil | null;
    heroe?: string;
    lanzar?: LanzadoresMundos;
    cerrable?: boolean;
    onCerrar?: () => void;
    onCerrarSesion?: (perfil: Perfil | null) => void;
    /** uso interno: ya se precargaron las imágenes */
    _pre?: boolean;
  }

  interface ResumenTabla { t: number; a: number; e: number; n: number; vistos: number; acc: number; estado: 'sin_datos' | 'practicar' | 'casi' | 'dominada' }
  interface EstadoRacha { dias: number; activa: boolean; enPeligro: boolean; mejor: number }

  interface SelectorMundosAPI {
    abrir(opts?: OpcionesSelector): void;
    cerrar(silencioso?: boolean): void;
    estado(perfil: Perfil | null): { mundo: Mundo; prog: ProgresoMundo }[];
    siguiente(perfil: Perfil | null): string | null;
    estadoRacha(perfil: Perfil | null): EstadoRacha;
    resumenTablas(perfil: Perfil | null): ResumenTabla[];
    tablaDebil(perfil: Perfil | null): ResumenTabla | null;
    textoResumen(perfil: Perfil | null): string;
  }

  // ---------- Perfiles ----------
  interface PerfilesAPI {
    crear(o: { nombre: string; avatar?: string; dispositivo?: string | null }): { ok: boolean; error?: string; perfil?: Perfil };
    paraCuenta(nick: string, avatar?: string, dispositivo?: string | null): Perfil | null;
    idDe(nombre: string): string;
    listar(): Perfil[];
    obtener(id: string): Perfil | null;
    activo(): Perfil | null;
    elegir(id: string): Perfil | null;
    cerrarSesion(): unknown;
    registrarHechos(id: string, hechos: Record<string, { a: number; e: number }> | null | undefined): Perfil | null;
    actualizar(id: string, fn: (p: Perfil) => void): Perfil | null;
    actualizarActivo(fn: (p: Perfil) => void): Perfil | null;
    borrar(id: string): boolean;
    exportar(id: string): string | null;
    importar(codigo: string): { ok: boolean; error?: string; perfil?: Perfil };
    usarAlmacen(almacen: unknown): void;
    limpiarNombre(nombre: unknown): string;
    KEY: string;
  }

  interface Window {
    Perfiles: PerfilesAPI;
    MundosRegistro: MundosRegistroAPI;
    SelectorMundos: SelectorMundosAPI;
  }
}
