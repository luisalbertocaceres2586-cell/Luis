# Plan · Antarez con movimiento fluido (116 frames de personaje)

## Preparación (tools/procesar_antarez.py → assets/characters/antarez/)
Cada hoja venía a una escala distinta (la cabeza de la hoja 8 medía la mitad que la de la hoja 1). Se normalizó la escala, se calculó el punto de apoyo (pies + centro del cuerpo) y se redujo a la mitad de resolución: 23 MB → 6,9 MB.

## Animaciones (tools/generar_manifest_antarez.py → manifest.js)
| Movimiento | Frames |
|---|---|
| Reposo / caminar | hoja 1 (1-4) · caminar por distancia |
| Correr / turbo | hoja 8 (24 frames) · turbo (con poder de velocidad) hoja 1 (5-8) |
| Salto | impulso → subida → cima (hoja 2 f1 + hoja 9 2-10) según velocidad vertical |
| Caída / caída rápida / picada (⬇) | hoja 9: 13-17 · 11-12 · 1 |
| Doble salto | voltereta: hoja 2 f2, f7 + hoja 9 f6 |
| Aterrizaje suave / fuerte | hoja 9: 18, 19, 24 / 19-24 |
| Agachado, deslizar, dash | hoja 2 (4, 5) · dash propio de cada katana (f8 de cada hoja) |
| Pared (agarrar, resbalar, trepar, salto) | hoja 2 f6, f7 |
| Katanas Honō / Raiden / Kaze | tajos en tierra y aire por katana (hojas 3-6), poder al cambiar de katana (f7-f8), postura de guardia tras atacar |
| Planeo | con la katana Kaze: doble salto + mantener salto |
| Kunai | lanzamiento hoja 13 (18 frames) + proyectiles reales (f10 doble, f15 con estela) |
| Daño / muerte / victoria | hoja 2 f8, f3 · f8, f7, f4 + hoja 9 f23 · poderes f7 de las tres katanas |

## Opciones por URL
`?saltoA=1` (salto con armadura plateada de la hoja 2) · `?paredes=0` · `?planeo=0` · `?antarez=0` (arte antiguo).
Consola: `ANTAREZ_USO()` / `SAKURA_USO()`.
