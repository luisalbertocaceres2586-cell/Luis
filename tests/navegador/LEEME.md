# Pruebas en navegador real

Usan un Chromium sin pantalla (`npm i puppeteer-core @sparticuz/chromium`) y el juego servido en `http://localhost:8123` (`python3 -m http.server 8123` en la raíz del repositorio).

- `bot-nivel1.mjs 1,2,3` — un "robot jugador" recorre el Nivel 1 completo de esas semillas con la física real: salta huecos y trampas, ataca enemigos, resuelve los acertijos, vence la emboscada y al Oni rojo. Los retos que exigen habilidad fina (tambores, plataformas móviles, sierras...) los salta con un atajo. Imprime si terminó, vidas y dónde se atascó.
- `habilidades.mjs` — física real de las 6 habilidades ninja (Fase 1): dash e invulnerabilidad, doble salto, planeo, escalada de la chimenea (con y sin la habilidad), tajo aéreo con rebote, gancho con cuerda de largo fijo, y el panel para elegir habilidad (teclado y toque). 31 comprobaciones, con controles negativos.
- `director.mjs` — director de eventos (Fase 2): física real de los 6 eventos (viento, hielo, gravedad lunar, anochecer, rocas, fuego), sorteo con azar sembrado, calma en acertijos, regalo de onigiri al que anda mal y capturas de cada evento en `/tmp/evento_*.png`. 29 comprobaciones. Usa una arena limpia dentro del nivel.
- `apuntado.mjs` — prueba con eventos de teclado reales: mantener F, elegir con las flechas y soltar para lanzar el shuriken a una diana, un sello y un farol; y que un tajo golpee una sola respuesta.


Nota: las pruebas de física (`habilidades.mjs`, `apuntado.mjs`, `bot-nivel1.mjs`) arrancan con `director:false` para que un evento sorteado no las altere.
