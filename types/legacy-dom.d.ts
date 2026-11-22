/**
 * TOLERANCIA PARA CÓDIGO LEGADO — solo la usa tsconfig.basico.json (NO la revisión estricta).
 *
 * El código viejo de engine/ asume cosas que TypeScript no puede comprobar, por ejemplo:
 *   e.target.closest(...)          (e.target es un EventTarget genérico)
 *   document.querySelector(...).style   (querySelector devuelve Element, no HTMLElement)
 *   el.webkitRequestFullscreen     (API de Safari con prefijo)
 * En vez de ensuciar 30 archivos con conversiones, se declaran aquí como opcionales.
 * REGLA: el código NUEVO no debe apoyarse en esto; usa conversiones o `instanceof`.
 * Cada línea que se limpie en un archivo hace que ese archivo pueda pasar al nivel estricto.
 */
export {};
declare global {
  interface EventTarget {
    tagName?: string; id?: string; type?: string; value?: string; src?: string; href?: string;
    closest?(selector: string): any;
  }
  interface Node { tagName?: string; querySelectorAll?: ParentNode['querySelectorAll']; }
  interface ParentNode { tagName?: string; }
  interface ChildNode { style?: CSSStyleDeclaration; }
  interface Element {
    style?: CSSStyleDeclaration; dataset?: DOMStringMap; onclick?: ((this: GlobalEventHandlers, ev: MouseEvent) => any) | null;
    disabled?: boolean; checked?: boolean; type?: string; content?: string; src?: string; href?: string; value?: string;
    offsetWidth?: number; getContext?(id: string, ...args: any[]): any; width?: number; height?: number;
    webkitRequestFullscreen?(): Promise<void>;
  }
  interface HTMLElement { getContext?(id: string, ...args: any[]): any; width?: number; height?: number; _x?: any; }
  interface Document { webkitFullscreenElement?: Element | null; webkitExitFullscreen?(): Promise<void> }
  interface Navigator { connection?: any; deviceMemory?: number }
  interface HTMLImageElement { _ax?: number; _ay?: number }
  interface Nivel3Datos { monedas?: number }
}
