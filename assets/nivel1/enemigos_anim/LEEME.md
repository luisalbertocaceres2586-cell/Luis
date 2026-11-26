# nivel1 / enemigos_anim

Animaciones de enemigos del Nivel 1. Cada archivo es una **tira horizontal de 8 cuadros iguales** (una sola fila, fondo transparente), creada a partir de hojas de sprites 4 × 2 y recortada, alineada y limpiada.

| Archivo | Enemigo | Cuándo se usa (engine/nivel1/elementos.js) |
|---|---|---|
| `ninja_caminar_8.png` | Ninja sombra | Patrulla (`ninja`) |
| `ninja_correr_8.png` | Ninja sombra | Patrulla del `ninjaAtk` |
| `ninja_ataque_8.png` | Ninja sombra | Aviso (cuadros 1-3), carga/tajo (4-8), enfriamiento (8) |
| `arana_reposo_8.png` | Araña colgante | `aranaTecho` en espera o subiendo |
| `arana_ataque_8.png` | Araña colgante | `aranaTecho` bajando o abajo |
| `fuego_flotar_8.png` | Espíritu de fuego fatuo | `fuego` lejos del héroe |
| `fuego_alerta_8.png` | Espíritu de fuego fatuo | `fuego` a menos de 300 px del héroe |
| `guardia_caminar_8.png` | Guardia de piedra | Aspecto "guardia" del `ninjaAtk` |

Se cargan en segundo plano (`IMGS_EXTRA` de `motor.js`). Si una tira no llega, el juego usa la imagen fija de `enemigos/`, así que nada se rompe.

Pendientes (aún sin hoja): tengu cuervo, murciélago y la segunda hoja del guardia (embestida).
