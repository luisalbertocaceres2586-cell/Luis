# Pruebas en navegador real

Usan un Chromium sin pantalla (`npm i puppeteer-core @sparticuz/chromium`) y el juego servido en `http://localhost:8123` (`python3 -m http.server 8123` en la raíz del repositorio).

- `bot-nivel1.mjs 1,2,3` — un "robot jugador" recorre el Nivel 1 completo de esas semillas con la física real: salta huecos y trampas, ataca enemigos, resuelve los acertijos, vence la emboscada y al Oni rojo. Los retos que exigen habilidad fina (tambores, plataformas móviles, sierras...) los salta con un atajo. Imprime si terminó, vidas y dónde se atascó.
- `habilidades.mjs` — física real de las 6 habilidades ninja (Fase 1): dash e invulnerabilidad, doble salto, planeo, escalada de la chimenea (con y sin la habilidad), tajo aéreo con rebote, gancho con cuerda de largo fijo, y el panel para elegir habilidad (teclado y toque). 31 comprobaciones, con controles negativos.
- `director.mjs` — director de eventos (Fase 2): física real de los 6 eventos (viento, hielo, gravedad lunar, anochecer, rocas, fuego), sorteo con azar sembrado, calma en acertijos, regalo de onigiri al que anda mal y capturas de cada evento en `/tmp/evento_*.png`. 29 comprobaciones. Usa una arena limpia dentro del nivel.
- `cueva-visible.mjs` — en la CUEVA (oscura) todo lo que hay que leer de un acertijo debe verse: recorre todas las estaciones de la cueva de 3 semillas (las 6 mecánicas), coloca al héroe en 3 puntos y cuenta con los píxeles del canvas cuántos números en pantalla son legibles. Guarda capturas en `/tmp/<prefijo>_<mecánica>.png`.
- `apuntado.mjs` — prueba con eventos de teclado reales: mantener F, elegir con las flechas y soltar para lanzar el shuriken a una diana, un sello y un farol; y que un tajo golpee una sola respuesta.
- `nivel3.mjs` — Nivel 3 (Carrera de los Farolillos) v10: 22 escenarios deterministas (viga, muro con hueco, valla, barra, shuriken con dash, nube-plataforma, viento, carriles invertidos, portal de poder, combo ×5, y que la ninja se dibuje UNA sola vez, con estela de 3 solo en el dash) y luego un "robot jugador" que recorre el nivel hasta vencer al Rey del Caos (con `errores=1` responde mal a propósito). `SOLO_ESCENARIOS=1` corre solo los escenarios. Capturas en `/tmp/n3_<hito>.png`.


Nota: las pruebas de física (`habilidades.mjs`, `apuntado.mjs`, `bot-nivel1.mjs`) arrancan con `director:false` para que un evento sorteado no las altere.
