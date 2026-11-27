# Perspectiva pseudo-3D del Nivel 1 (`engine/nivel1/perspectiva.js`, `window.N1persp`)

Complementa a `profundidad.js` (capas) y `camara.js` (zoom, roll, luces). Aquí la **perspectiva reacciona a las acciones**:

| Acción | Efecto |
|---|---|
| Correr / cambiar de dirección | Giro de cámara (keystone): el lado hacia donde avanzas queda más lejos y el suelo se inclina |
| Dash | Giro extra + desenfoque radial desde el héroe + onda de choque en el suelo |
| Apuntar con F | Enfoque tilt-shift (se desenfoca todo fuera de la altura del blanco) y giro hacia el blanco |
| Aterrizar fuerte / derrotar enemigo | Onda de choque elíptica en el suelo (suelo visto en perspectiva) |

- Ganchos en `motor.js`: `N1persp.suelo(cx)` (tras las sombras), `N1persp.encima(cx)` (tras `cx.restore()`, antes de `N1cam.encima`) e `N1persp.inv()` (el puntero deshace el giro al apuntar).
- Quieto cuesta 0. En móvil, con «reducir movimiento» o si el equipo va lento (<~38 fps sostenidos) solo quedan las ondas del suelo.
- URL: `?persp=0` lo apaga; `?persp=force` desactiva la red de seguridad de rendimiento (para pruebas).
- Ajustes en la cabecera del archivo: `YAW_MAX`, `PIVOTE`, `LONJAS`, y los coeficientes de `obj` en `encima()`.
