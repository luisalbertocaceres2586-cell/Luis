# Guía visual del Nivel 1 — "Primeros minutos del jugador"

Las ayudas del Nivel 1 ya no son tarjetas con frases: se **dibujan** y solo salen **cuando hacen falta**.
Código: `engine/nivel1/guia.js` (`N1guia`). `motor.js` solo llama a `N1guia.iniciar / actualizar / hud`; si la guía fallara, el motor vuelve solo a la tarjeta de texto de siempre.

## Qué ve el jugador
* **Burbuja con la tecla dibujada** que se "pulsa" sola, sobre el objeto que hay que usar (enemigo, tambor, palanca…) o sobre la cabeza del héroe. Como mucho 1-3 palabras ("Golpea", "Salta").
* **Flecha y resplandor** sobre el objetivo; flechas ››› delante del héroe al caminar o correr.
* **Celular:** el botón táctil de verdad (◀ ▶ ⤒ 🗡 ✦ 💬) late en dorado.
* **Pasos del aprendiz:** 👣 ⤒ 🗡 ✦ abajo al centro; se encienden al caminar, saltar, pegar y lanzar el shuriken, y desaparecen al terminar. Solo para quien aún no los ha visto.
* **Al lograrlo:** destello ✓ con chispas y la ayuda se va al instante.

## Cuándo aparece (solo si hace falta)
1. Si el jugador **ya hizo la acción solo**, no se muestra nada.
2. Espera unos segundos antes de ayudar (`ESPERA` en guia.js; 0 s en peligros como arquero, emboscada o jefe).
3. No sale durante el título del nivel, al apuntar ni al elegir habilidad. Una sola ayuda a la vez.
4. Se esconde sola al salir de la situación o a los 10 s.
5. **Si se atora** (2 golpes o respuestas incorrectas en 30 s) junto a algo que ya había visto y no logra, la ayuda **vuelve** una vez por cosa (con 30 s de descanso).

## Agregar una ayuda nueva
1. Crea el tutorial como siempre (`TUTOS` con `id`, `cuando`, `ok`) en motor.js, habilidades.js o director.js.
2. Agrega su entrada en `ESPEC` (teclas, etiqueta de ≤3 palabras, `obj` si apunta a algo) y su tiempo en `ESPERA`.
`tests/guia.test.js` falla si un tutorial no tiene su entrada.

## Pruebas
* `npm test` → `tests/guia.test.js` (decisión, objetivos y que todo se pueda dibujar).
* Navegador real: `node tests/navegador/guia.mjs` (capturas del lienzo en `/tmp/guia_*.png`).
