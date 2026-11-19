# Nueva Sakura · plan de animaciones y habilidades

## Cuántas hojas hacen falta
**Hoja modelo (0) + 10 hojas esenciales + 3 opcionales = 130 piezas (100 de movimiento).** Cada hoja de movimiento lleva 10 fotogramas con la misma escala y la misma línea base, para que se animen sin saltos.

| Hoja | Contenido | Fotogramas | Para qué |
|---|---|---|---|
| 0 | **Hoja modelo** (frente, perfil, espalda, busto, armas, paleta) | referencia | Que Sakura sea idéntica en todas las hojas |
| 1 | Reposo + impaciencia | 6 + 4 | Quieta, respirando; gestos si el jugador no toca nada |
| 2 | **Correr** (ciclo completo) | 10 | Carrera fluida |
| 3 | Salto y caída | 10 | Anticipación, subida, cima, caída, aterrizaje |
| 4 | Agacharse y empujar | 6 + 4 | Agacharse; empujar la carreta |
| 5 | Tajo golpes 1 y 2 | 5 + 5 | Combo de espada |
| 6 | Golpe final + shuriken | 5 + 1 + 4 | Remate; apuntar y lanzar |
| 7 | Tajo aéreo, estocada y rebote | 4 + 2 + 2 + 2 | **Habilidad: tajo aéreo con rebote** |
| 8 | Dash, doble salto y planeo | 4 + 4 + 2 | **Habilidades: dash con invulnerabilidad, doble salto, planeo** |
| 9 | Pared y gancho | 5 + 5 | **Habilidades: agarre y salto de pared, gancho** |
| 10 | Daño, derrota y victoria | 3 + 4 + 3 | Reacciones (aptas para niños) |
| 11 · opcional | Retratos e iconos | 10 | Menús, HUD, selección de personaje |
| 12 · opcional | Efectos de combate y polvo | 10 | Arcos de tajo, chispas, polvo |
| 13 · opcional | Efectos de habilidades + objetos del gancho | 10 | Estela de dash, aura, doble salto, cuerda, anillo ancla, desbloqueo |

**Orden recomendado para generarlas:** 0 → 2 → 1 → 3 → 5 → 6 → 7 → 8 → 9 → 4 → 10 → (11, 12, 13). Si sale una hoja con la cara o el traje distintos, rehazla adjuntando la hoja modelo y la hoja 2.

Las hojas 12 y 13 las puedo suplir por código si prefieres no generarlas (arcos, polvo, estelas), pero con arte se verá mucho mejor. El **anillo ancla** (hoja 13, pieza 8) es necesario para el gancho.

## Habilidades "Sentirse ninja" (todo en `motor.js`)
Se desbloquean con **pergaminos** y el jugador elige cuál quiere primero (en un altar junto a cada campana/torii de punto de control). Por nivel hay unos 165 pergaminos, así que se pueden aprender 2 a 3 en el primer nivel.

| Habilidad | Control propuesto | Qué hace | Costo (pergaminos) | Animaciones |
|---|---|---|---|---|
| **Dash** | `Shift` o `L` | Impulso corto horizontal (suelo o aire) con invulnerabilidad de 0.25 s; enfriamiento 0.8 s | 30 | `dash`, hoja 13 (estela) |
| **Doble salto** | `Espacio` en el aire | Segundo salto con voltereta | 50 | `double_jump` |
| **Planeo** | Mantener `Espacio` al caer (tras el doble salto) | Cae despacio, la bufanda se abre como planeador | 70 | `glide_open`, `glide` |
| **Pared** | Empujar hacia la pared + `Espacio` | Se desliza por la pared; salta desde ella hacia el lado contrario | 90 | `wall_slide`, `wall_grab`, `wall_jump` |
| **Tajo aéreo + rebote** | `C` en el aire; `↓ + C` = estocada | Corta en el aire; la estocada sobre un enemigo rebota hacia arriba (y recarga el salto) | 110 | `air_slash`, `plunge`, `bounce` |
| **Gancho** | `Q` | Lanza una cuerda al **anillo ancla** más cercano a la vista y se balancea; suelta con `Espacio` para salir disparada | 130 | `hook_throw`, `hook_swing` |

El jugador elige el orden. El costo de cada habilidad crece con la cantidad que ya aprendió (30, 50, 70, 90, 110, 130). El **planeo** requiere el doble salto.

**Cambios de diseño de niveles que implican:** paredes escalables con salto de pared, anillos ancla colgando de vigas, y algunos tramos que se pasan más fácil con la habilidad pero no la exigen (los niveles no pueden bloquearse si el jugador aún no la tiene).

## Cómo se conecta
1. Subes las hojas y yo las recorto con `tools/procesar_heroe.py` (sin recortar el espacio: todas las celdas conservan la misma línea base) a `assets/characters/sakura2/` y genero `SAKURA2_MANIFEST` (archivo, ancla, tamaño) con los nombres de `animaciones.json`.
2. `motor.js` pasa a una máquina de estados del héroe (suelo, aire, pared, gancho, dash, daño) que elige la animación; si falta una animación usa la antigua de Sakura.
3. Se añaden el altar de habilidades y el guardado de lo aprendido en el perfil del jugador.
4. Pruebas: el robot jugador con cada habilidad y una prueba de que ningún tramo exige una habilidad no aprendida.

Kage (el otro héroe) se hace después con el mismo método; solo cambia la hoja modelo y los colores.
