# Nivel 1 · Fase 1 "Sentirse ninja" (movimiento)

Objetivo: que el jugador sea el protagonista y tenga **control** sobre lo que pasa. Seis habilidades que se ganan con pergaminos y que
**el jugador elige en el orden que quiera**. Ninguna es obligatoria: el nivel se puede terminar sin ellas.

## Las habilidades

| | Habilidad | Control | Qué hace |
|---|---|---|---|
| 💨 | Dash ninja | `SHIFT` (o `V` / `L`) · botón 💨 | Impulso de ~160 px, sin gravedad, **invulnerable** mientras dura (+0,12 s). En el aire, uno solo hasta tocar suelo, pared, soltar el gancho o rebotar. Recarga 0,5 s. |
| 🌀 | Doble salto | `ESPACIO` en el aire | Segundo salto. Si caes y estás a menos de 40 px del suelo no se gasta (así el salto "adelantado" sigue sirviendo al aterrizar). |
| 🪂 | Planeo | mantener `ESPACIO` al caer | Velocidad de caída máx. 150 px/s y algo más de velocidad horizontal. |
| 🧗 | Agarre de pared | empujar contra la pared al caer · `ESPACIO` | Te agarras y resbalas despacio; `ESPACIO` salta de la pared (impulso 440 px/s, 0,2 s sin control para no volver a pegarte). Funciona en las **chimeneas de bambú** y en los muros de piedra, **no** en rejas ni sellos. |
| ⚔️ | Tajo aéreo | en el aire `↓` + `C` · botón ⬇ | Tajo hacia abajo. **Rebota** (y recarga dash y doble salto) al golpear a cualquier enemigo, al jefe o una trampa de kunai. |
| 🪝 | Gancho | mantener `G` (o `E`) · botón 🪝 | Se engancha a la argolla ◎ más cercana por encima (alcance 560 px, mejor si está hacia donde miras). `← →` impulsan el balanceo; al soltar o saltar sales con la velocidad. Recarga dash y doble salto. |

## Cómo se desbloquean

Los **pergaminos** que ya se recogían (116–153 fijos por nivel, más los que sueltan los enemigos) ahora también abren habilidades:
a los **8, 26, 44, 62, 80 y 98**. El juego se detiene, aparece el panel *¡NUEVA HABILIDAD NINJA!* con las que faltan y el jugador toca una
o usa `← →` + `ENTER` / el número (la primera medio segundo está bloqueada para que no se elija sin querer). Así cada partida es una "build"
distinta. Las habilidades se reinician en cada partida. El HUD (arriba a la izquierda) muestra el avance a la siguiente y las ya ganadas.

Para probar sin jugar: `nivel1.html?auto=1&hab=todas` (o `&hab=dash,gancho`), y `&movil=1` para ver los botones táctiles.

## Qué se añadió al nivel para que sirvan

* **Chimeneas de bambú** (módulo nuevo `chimenea`, al menos una por nivel): dos paredes flotantes enfrentadas; **por debajo se camina** (no bloquean),
  y arriba hay una repisa con 6 pergaminos y un onigiri que solo se alcanza saltando de pared en pared (o con otras habilidades).
* **Argollas del gancho**: se calculan al empezar el nivel (no están en el generador): una en medio de cada hueco ancho y "ramas" cada ~1.100 px.
* **No se pueden esquivar retos.** Con doble salto, planeo o gancho las rejas de 300 px se habrían saltado, así que ahora las rejas del jefe, la emboscada y la palanca
  miden **520 px**, las puertas de los acertijos **480 px**, y no hay argollas dentro de la arena del jefe, las emboscadas ni las puertas de acertijo.

## Dónde está el código

* `engine/nivel1/habilidades.js` — toda la lógica y el dibujo. Los números para ajustar el "feeling" están en el objeto `P` (arriba) y `UMBRALES`.
  La parte pura (umbrales, argollas, física de la cuerda) no usa el navegador.
* `engine/nivel1/motor.js` — solo ganchos pequeños: `N1hab.antes / despuesGravedad / alTajo / rectTajo / despuesTajo / invulnerable / revisar`, más dibujo y HUD.
* `engine/nivel1/elementos.js` — `core.alGolpear` (rebote del tajo aéreo).
* `engine/nivel1/gen-nivel.js` — módulo `chimenea`, rejas altas y su validación.

## Pruebas

* `node tests/habilidades.test.js` (12) — lógica pura + generador (100 semillas: chimenea completa, argollas válidas, rejas de 520).
* `node tests/navegador/habilidades.mjs` (31) — física real en Chromium, con controles negativos (sin la habilidad no se sube la chimenea, no se mata al enemigo, la trampa hiere).
* `node tests/nivel1.test.js` (22) — las de siempre, siguen pasando.

**Nota sobre el robot jugador** (`bot-nivel1.mjs`): no es fiable como prueba de "se puede terminar". Sobre las semillas 1–31 el robot completa ~2 de cada 3 niveles
**tanto en la versión original como en esta**, porque a veces muere (murciélagos, que ignora), reaparece antes de un módulo que ya dio por "saltado" y se atasca contra el muro de la carreta. No es una regresión de esta fase.

## Siguientes pasos (Fase 2 en adelante)

Director de eventos (viento, tormenta, gravedad baja, anochecer...) que cambie el mundo en tiempo real según cómo juega el estudiante; tablas de multiplicar como "verbos"
del mundo (plataformas en múltiplos); enemigos que reaccionan entre sí y al jugador.
