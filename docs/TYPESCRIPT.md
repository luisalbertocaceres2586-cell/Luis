# 🟦 TypeScript en Ninja Multiplicación — guía de migración gradual

## Idea central
El juego **sigue publicándose igual**: archivos `.js` que carga el navegador, sin paso de compilación.
TypeScript trabaja como **revisor**: lee los `.js` (con anotaciones JSDoc donde ayudan) y avisa de errores
**antes de publicar**. Si no falla nada, los jugadores no notan ningún cambio.

```
npm run verify      # tipos (2 niveles) + pruebas   ← lo mismo que corre GitHub en cada Pull Request
npm run typecheck   # solo tipos
npm test            # solo pruebas (tests/*.test.js)
```

## Dos niveles de revisión
| Nivel | Config | Qué cubre | Reglas |
|---|---|---|---|
| **1 · Estricto** | `tsconfig.json` | **14 archivos** de lógica (ver lista) | `strict: true`: también marca `null`/`undefined` sin comprobar |
| **2 · Básico** | `tsconfig.basico.json` | **todo `engine/`** (57 archivos) + `intro-premium.js` | detecta nombres/propiedades inexistentes, argumentos mal puestos, tipos incompatibles |

**Estado actual: ambos niveles pasan con 0 errores.**

Archivos en nivel 1 (estricto): `perfiles`, `ruta`, `acertijos`, `director`, `elementos`, `mundos-registro`, `selector-mundos`,
`achievements`, `racha`, `dispositivo`, `version`, `repaso-errores`.

### Dónde están los tipos
| Archivo | Contenido |
|---|---|
| `types/juego.d.ts` | **Dominio**: `Perfil`, `Maestria`, `Racha`, `Mundo`, `PerfilesAPI`, `SelectorMundosAPI`… |
| `types/globales.d.ts` | Variables globales que comparten los scripts (`GS`, `P`, `CX`, `W`, `H`, `tone`, `groundY`, `bossFight`…) y extras de `window` |
| `types/legacy-dom.d.ts` | **Tolerancia solo para el nivel 2** (`e.target.closest`, `el.style`, APIs de Safari). El código nuevo **no** debe apoyarse en esto |
| `types/node-minimo.d.ts` | Lo mínimo de CommonJS para los módulos que también se cargan en Node (pruebas) |

## Lo que encontró la primera pasada (ejemplos reales)
- Mis propias declaraciones estaban mal en 3 sitios (`tone(freq, tipo, dur…)` con otro orden de parámetros, `groundY()` es función,
  `bossFight` es un objeto): TypeScript lo delató al cruzarlo con el código real.
- Referencias sin comprobar `null` (`brow.parentNode`, `ban.querySelector('button')`, `e.pool`) que podían romper en casos raros.
- `startOut(true)` llamado con un argumento que la función ignora; `localStorage.setItem(clave, número)`; `style.opacity = 0`.
- Contratos reales de `Perfiles` que no estaban escritos (`borrar`, `exportar`, `importar`, `registrarHechos`).

## Cómo subir un archivo de nivel
1. Agrégalo a `include` de `tsconfig.json` y ejecuta `npm run typecheck:estricto`.
2. Para cada aviso:
   - dato conocido → anota con JSDoc: `/** @param {Perfil} p @returns {boolean} */`
   - elemento del DOM → conversión: `/** @type {HTMLInputElement|null} */ (document.getElementById('x'))`
   - algo realmente dinámico → `/** @type {any} */` **con un comentario `TODO`** que diga por qué.
3. Repite hasta 0 errores y haz commit. CI vigila que no retroceda.

## Deuda conocida (lo que NO está cubierto todavía)
| Pendiente | Detalle |
|---|---|
| **`index.html` (≈9 700 líneas de JS inline)** | Es el corazón del juego (estado `GS`, `render`, `update`…) y TypeScript **no puede revisarlo** mientras viva dentro del HTML. Siguiente gran paso: extraerlo a `engine/*.js` por partes. |
| `noImplicitAny` | Está en `false` en ambos niveles. Activarlo exige tipar cada parámetro: hacerlo archivo por archivo, empezando por los del nivel 1. |
| Objetos "bolsa" tipados como `any` | `FX` (fx-engine), `NinjaMods` (modulos), `cine` (jefe-cinematica), `P`/`GS` parcialmente. Buscar `TODO` en el código. |
| ~45 archivos solo en nivel 2 (incluye `nube.js`, `preview-mundos.js`) | `surf.js`, `corredor.js`, `motor.js`, `fx-engine.js`, `hero-pro.js`, … |
| `sw.js` (service worker) | Vive en otro entorno (`WorkerGlobalScope`); necesitaría su propio `tsconfig` con `lib: ["WebWorker"]`. |
| Conversión a `.ts` real | Solo cuando el equipo crezca; requeriría un paso de compilación (esbuild) que genere los `.js`. |

## Convenciones
- Los tipos del dominio se declaran en `types/`, **no** se repiten en cada archivo.
- Evita `any`. Si es inevitable: comentario `TODO` + por qué.
- Todo cambio de lógica de negocio lleva su prueba en `tests/`.
- No agregues cosas a `legacy-dom.d.ts` para "hacer pasar" código nuevo.
