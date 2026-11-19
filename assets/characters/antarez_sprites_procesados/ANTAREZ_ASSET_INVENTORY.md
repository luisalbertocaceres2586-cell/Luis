# ANTAREZ_ASSET_INVENTORY

Inventario de las 13 imágenes recibidas. Estado real: **recortadas y verificadas visualmente; ninguna integrada todavía en el repositorio** (no tengo acceso a su código).

| # | Archivo original | Tamaño | Alfa real | Contenido | Sprites recortados | Estado |
|---|---|---|---|---|---|---|
| 1 | 1794944808616_image.png | 1536×1024 | sí | Movimiento A (reposo, caminar, correr) | 8 | Recortado, pendiente de integrar |
| 2 | 1794945232772_image.png | 1536×1024 | sí | Movimiento B (salto, caída, deslizar, pared, voltereta, golpeado) | 8 | Recortado, pendiente de integrar |
| 3 | 1794945543686_image.png | 1536×1024 | sí | Katana Honō (fuego) – combate | 8 | Recortado, pendiente de integrar |
| 4 | 1794945659354_image.png | 1536×1024 | sí | Katana Raiden (rayo) – combate | 8 | Recortado, pendiente de integrar |
| 5 | 1794945895110_image.png | 1536×1024 | sí | Katana Kaze (viento) – combate A | 8 | Recortado, pendiente de integrar |
| 6 | 1794945913262_image.png | 1536×1024 | sí | Katana Kaze (viento) – combate B (variante) | 8 | Recortado, pendiente de integrar |
| 7 | 1794946119621_image.png | 1536×1024 | sí | Katanas, vainas y tajos (4 elementos: fuego, rayo, viento, morado) | 12 | Recortado, pendiente de integrar |
| 8 | 1794946203287_image.png | 1536×1024 | sí | Correr – ciclo de 24 frames | 24 | Recortado, pendiente de integrar |
| 9 | 1794946275432_image.png | 1536×1024 | sí | Salto/aéreo – secuencia de 24 frames | 24 | Recortado, pendiente de integrar |
| 10 | 1794946340461_image.png | 1536×1024 | sí | Efectos B (fondo transparente) | 86 | Recortado, pendiente de integrar |
| 11 | 1794946390430_image.png | 1536×1024 | NO (fondo verde) | Efectos A (fondo verde croma) | 50 | Recortado, pendiente de integrar |
| 12 | 1794946410446_image.png | 1756×1244 | sí | Efectos A ya recortado del verde (versión del usuario, con halos verdes) | — | Duplicado (ver notas) |
| 13 | 1794946441775_image.png | 1536×1024 | sí | Kunai y shuriken (lanzamientos y proyectiles) | 20 | Recortado, pendiente de integrar |

## Notas y excepciones (nada se descartó en silencio)
- **Imagen 12** es la imagen 11 con el verde ya quitado, pero con halos verdes en los bordes. Se conserva en `fuentes_originales/`; los recortes usan mi limpieza propia de la imagen 11 (despill del verde).
- **Imágenes 10 y 11** contienen elementos parecidos pero NO idénticos (la 10 tiene rayos, hilos de energía, destellos y orbes que la 11 no tiene, y viceversa: círculos mágicos, estelas horizontales, cruces). Se usan ambas.
- **Imagen 6** es una segunda hoja de Kaze con poses distintas a la 5 (más combos y giros). Se usa como "Kaze B".
- **Imagen 7** incluye un cuarto elemento morado (katana, vaina y tajo) y las imágenes 10-12 traen efectos morados. Ese elemento NO estaba en el diseño de 3 katanas: pendiente de tu decisión (ver informe).
- **Imagen 13**: la pieza 10 reúne dos kunais con su estela en un solo recorte y la pieza 9 une al personaje con su estela; se separan al integrarlos.
- Las hojas 10 y 11 incluyen partículas pequeñas (chispas, rocas, humo) como piezas sueltas.
- El alfa de bajo valor (<12) se puso a 0 para quitar la neblina; los bordes suaves se conservaron.