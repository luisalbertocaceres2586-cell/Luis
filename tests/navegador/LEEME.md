# Pruebas en navegador real

Usan un Chromium sin pantalla (`npm i puppeteer-core @sparticuz/chromium`) y el juego servido en `http://localhost:8123` (`python3 -m http.server 8123` en la raíz del repositorio).

- `bot-nivel1.mjs 1,2,3` — un "robot jugador" recorre el Nivel 1 completo de esas semillas con la física real: salta huecos y trampas, ataca enemigos, resuelve los acertijos, vence la emboscada y al Oni rojo. Los retos que exigen habilidad fina (tambores, plataformas móviles, sierras...) los salta con un atajo. Imprime si terminó, vidas y dónde se atascó.
