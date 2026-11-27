# Calidad automática, dibujo interpolado y WebP

## Calidad automática (`engine/core/calidad.js`)
Un solo controlador (alta / media / baja) reemplaza a `_perfMode`, `fx26`, `E.lite` y `S.lite`.
Baja tras 3 s por debajo de ~45 FPS, sube tras 25 s por encima de ~56 FPS, con protección contra el vaivén. Lo que baja se recuerda 3 días.
Forzar: `?calidad=alta|media|baja|auto` (o `?fx=low|high`). Consola: `NinjaCalidad.info()`.

## Dibujo interpolado (`engine/core/interpolacion.js`)
En pantallas de ≥ 90 Hz se dibuja en cada cuadro la posición intermedia entre pasos de física (la física sigue a 60 pasos/s y nunca ve valores interpolados).
En 60 Hz, con calidad baja o con `?interp=0`, el juego funciona igual que antes. Prueba: `node tests/navegador/interp.mjs` (reloj virtual de 120 Hz).

## WebP (`tools/convertir_webp.py`, `engine/core/webp.js`)
`npm run webp` crea `imagen.webp` junto a cada `imagen.png` que usa el juego. Solo usa WebP con pérdida si queda casi idéntico (PSNR ≥ 35 dB); si no, sin pérdida; si no ahorra 20 %, deja el PNG.
El PNG se queda siempre: es el original y el respaldo automático. `?webp=0` apaga el uso de WebP.
**Cuando agregues imágenes nuevas:** ejecuta `npm run webp` y sube también los `.webp` y `engine/core/webp-mapa.js`.
Medido en navegador: menú 64,3 → 34,3 MB (−47 %), nivel 1 27,9 → 13,4 MB (−52 %). Prueba: `node tests/navegador/webp.mjs`.
