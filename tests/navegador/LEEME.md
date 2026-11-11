# Pruebas en navegador real

Usan un Chromium sin pantalla (`npm i puppeteer-core @sparticuz/chromium`) y el juego servido en `http://localhost:8123` (`python3 -m http.server 8123` en la raíz del repositorio).

- `bot-bosque.mjs 1,2,3` — un "robot jugador" recorre el Acto 1 de esas semillas con la física real (saltos, huecos, kunai, enemigos) y resuelve los acertijos. Imprime si terminó, vidas y dónde se atascó.
