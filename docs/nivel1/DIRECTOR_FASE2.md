# Nivel 1 · Fase 2 "Un mundo vivo e impredecible" (director de eventos)

Un **director** mira cómo juega el estudiante y, **mientras juega**, sortea eventos que cambian el mundo. No se deciden al generar el nivel:
dos partidas con la misma semilla no son iguales (el nivel es igual, lo que pasa en él no).

## Los 6 eventos

| | Evento | Dificultad | Dónde | Qué pasa |
|---|---|---|---|---|
| 🌪️ | Tormenta de viento | 1 | bosque y cueva | Ráfagas que empujan de lado (hasta ~200 px/s) y cambian de dirección, con calmas. Correr contra el viento cuesta. |
| 🌙 | Gravedad lunar | 1 | bosque y cueva | Gravedad al 45 %: saltos ~35 % más altos y mucho más tiempo en el aire. |
| 🧊 | Suelo resbaladizo | 2 | bosque y cueva | Arrancas y frenas despacio: patinas ~160 px al soltar. |
| 🌆 | Anochecer | 2 | solo bosque | Oscurece; solo ves lo que alumbra la antorcha. Luciérnagas. |
| 🪨 | Lluvia de rocas | 2 | bosque y cueva | Sombra roja con "!" avisa ~1 s antes; la roca hiere 1 corazón. |
| 🔥 | Bosque en llamas | 3 | solo bosque | Un muro de fuego arranca 650 px detrás y avanza a ~190–240 px/s (el héroe corre a 340). Te quema si te alcanza. |

## Cómo decide

**Mira:** vida, errores (últimos 60 s), racha de acertijos a la primera, ritmo de avance (px/s), muertes (últimos 120 s) y daño (últimos 30 s).
Con eso calcula un **dominio** de 0 a 1 (`evaluar`).

* **Quien va muy bien** (dominio alto): eventos más difíciles y más seguidos (cada ~22–30 s de calma).
* **Quien va justo**: eventos suaves y espaciados (hasta ~56 s).
* **Quien anda mal** (dominio < 0,28, o 1 corazón): el director **se calla**, y si tiene 1 corazón (o 2 muertes seguidas) le **regala un onigiri** por delante (máx. 1 cada 75 s).
* En la **cueva** los eventos son más espaciados (×1,35), más suaves, y solo del repertorio sin fuego ni anochecer.
* No repite el mismo evento seguido y penaliza los recientes.

## Juego limpio (reglas que el director respeta siempre)

* **Los acertijos son zona de calma:** no se lanza nada frente a uno; un evento en curso se congela y se apaga, y se reanuda al salir.
* **El fuego nunca te encierra:** se apaga **antes** del próximo acertijo (a 200 px), del jefe (450 px) o de una carreta/palanca/emboscada/roca gigante, y solo sale si hay ≥ 1.800 px de carrera libre. Llegar a salvo da **+5 📜**.
* Nada durante el jefe, una emboscada o la roca gigante, ni en los primeros ~25 s / 1.400 px, ni cerca de la meta.
* Si el estudiante queda con 1 corazón, la lluvia de rocas y el fuego se cortan "por piedad".

## Cómo probarlo

* `nivel1.html?auto=1&evento=fuego` — fuerza un evento a los ~1,5 s (`viento`, `gravedad`, `resbala`, `noche`, `rocas`, `fuego`).
* `&director=0` — sin director (las pruebas automáticas lo apagan para medir física determinista).
* `&dirdebug=1` — muestra abajo a la izquierda lo que "piensa" el director: dominio, espera, métricas y últimos eventos.

## Cambios en el generador (cueva)

La cueva (oscura y más difícil) tenía solo 3 puntos de control y ~3,8 onigiris. Ahora: **un punto de control tras cada acertijo (7)** y **~7,7 onigiris**.

## Dónde está el código

* `engine/nivel1/director.js` — decisión, efectos y dibujo. La parte pura (`evaluar`, `intervalo`, `pesos`, `elegir`, `barreraFuego`, `superficie`) no usa el navegador.
* `engine/nivel1/motor.js` — ganchos: `N1dir.paso / fondo / mundo / encima / hud / luces / alDanio / alMuerte / alReaparecer` y los modificadores `S.mod`
  (`g` gravedad, `gc` tope de caída, `jv` salto, `ag` agarre del suelo, `fr` fricción, `vv` viento, `noche`) que leen la física y la oscuridad.
* `engine/nivel1/gen-nivel.js` — puntos de control y comida de la cueva.

## Pruebas

* `node tests/director.test.js` (13) — evaluación, sorteo, fuego, cueva (100 semillas).
* `node tests/navegador/director.mjs` (29) — física real de cada evento, sorteo con azar sembrado, calma en acertijos, regalo, dibujo, y capturas en `/tmp/evento_*.png`.
  Construye una "arena" limpia dentro del nivel para medir el evento sin interferencias.

## Siguiente: Fase 4 — enemigos y elementos que interactúan

Los eventos ya existen como sistema; la Fase 4 los hará interactuar con el resto: ninjas que se agrupan y rodean, viento que desvía el shuriken,
fuego que enciende antorchas, la roca gigante (y las rocas del director) que rompen muros y enemigos.
