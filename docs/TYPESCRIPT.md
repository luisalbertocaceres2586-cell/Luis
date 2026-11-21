# 🟦 TypeScript en Ninja Multiplicación — guía de migración gradual

## Qué se hizo y por qué es seguro
El juego **sigue publicándose igual** (archivos `.js` que carga el navegador; no hay paso de compilación).
TypeScript se usa como **revisor**: lee los `.js` + anotaciones JSDoc (`/** @type {Perfil} */`) y avisa de errores
**antes de publicar**. Si nada falla, nada cambia para los jugadores.

| Pieza | Para qué sirve |
|---|---|
| `tsconfig.json` | Lista de archivos que se revisan (`include`) y qué tan estricta es la revisión. |
| `types/juego.d.ts` | Describe **una sola vez** cómo son `Perfil`, `Mundo`, `Maestria`, `Racha`… |
| `npm run typecheck` | Ejecuta la revisión. |
| `npm test` | Ejecuta todas las pruebas de Node (`tests/*.test.js`). |
| `npm run verify` | Las dos cosas. |
| `.github/workflows/verificar.yml` | Corre `verify` automáticamente en cada Pull Request. |

## Archivos ya migrados (estrictos: `strict: true`)
- `engine/nivel1/perfiles.js` · `engine/ui/mundos-registro.js` · `engine/ui/selector-mundos.js`

Resultado de la primera revisión: de **207 avisos** (código sin tipos) a **0**, tras describir los datos y corregir
19 puntos reales (por ejemplo, usos de `document`/`localStorage` sin comprobar que existan).

## Cómo sumar otro archivo (receta de 4 pasos)
1. Agrégalo a `"include"` en `tsconfig.json`.
2. `npm run typecheck` → verás una lista de avisos.
3. Anota con JSDoc los parámetros principales:
   ```js
   /** @param {Perfil} p  @param {string} id  @returns {boolean} */
   function guardar(p, id) { … }
   ```
4. Corrige lo que marque y vuelve a ejecutar hasta que quede limpio.

Consejo: empieza por los archivos **pequeños y con muchos datos** (`maestria`, `logros`, `ruta`) y deja para el final
los grandes (`motor.js`, `surf.js`, `corredor.js`).

## Hoja de ruta
1. ✅ Infraestructura + 3 archivos estrictos + CI + pruebas.
2. ⏳ Activar `"noImplicitAny": true` (hoy está en `false`): obliga a tipar cada parámetro. Se hace archivo por archivo.
3. ⏳ Sumar `acertijos.js`, `ruta.js`, `achievements.js`, `perfil-ui.js`.
4. ⏳ Cuando una parte esté 100 % tipada, convertirla a `.ts` real con un paso de compilación (esbuild) que genere el `.js`
   que carga el navegador. Solo vale la pena si el equipo crece.
5. ⏳ Typecheck de `surf.js` y `corredor.js` (los más grandes) en bloques.

## Convenciones
- Los datos del dominio se declaran en `types/juego.d.ts`, **no** se repiten en cada archivo.
- Evita `any`; si es inevitable, deja un comentario del porqué.
- Cada función nueva con lógica de negocio lleva su prueba en `tests/`.
