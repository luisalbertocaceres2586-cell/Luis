# Sakura — personaje principal

Kunoichi de cabello rosa/violeta con banda frontal, bufanda, katana a la espalda y bolsa de kunais.
Todos los sprites miran a la **derecha** (para la izquierda, voltear horizontalmente en el motor).

## Estructura
```
sakura/
├── manifest.json            # rutas, tamaños, pivotes
├── animations/animation_config.json   # animaciones, frames, FPS, bucles
├── spritesheets/            # 10 hojas normalizadas (5 columnas x 2 filas)
├── frames/<hoja>/           # 100 frames sueltos PNG RGBA
├── documentation/
└── preview.html             # visor de todas las animaciones
```

## Hojas (10 hojas × 10 frames = 100 frames)
| N.º | Hoja | Tamaño de frame | Tamaño de hoja | Frames |
|---|---|---|---|---|
| 01 | sakura_idle | 292×525 | 1460×1050 | 10 |
| 02 | sakura_walk | 296×508 | 1480×1016 | 10 |
| 03 | sakura_run | 340×506 | 1700×1012 | 10 |
| 04 | sakura_jump | 342×530 | 1710×1060 | 10 |
| 05 | sakura_glide_fall | 352×485 | 1760×970 | 10 |
| 06 | sakura_crouch_slide_dash | 339×406 | 1695×812 | 10 |
| 07 | sakura_wall | 318×483 | 1590×966 | 10 |
| 08 | sakura_melee | 483×483 | 2415×966 | 10 |
| 09 | sakura_special | 402×374 | 2010×748 | 10 |
| 10 | sakura_hurt_death_win | 382×455 | 1910×910 | 10 |

Orden de lectura: izquierda→derecha, arriba→abajo. Cada hoja tiene su propio tamaño de celda uniforme (sin escalar los dibujos).

## Transparencia
PNG RGBA con canal alfa real (verificado sobre fondo oscuro, sin halos). Los efectos (estela de katana, pétalos, polvo, kunais) conservan su semitransparencia.

## Pivote y anclaje
- Hojas terrestres (idle, walk, run, crouch/slide/dash, melee, special, hurt/death/win): los pies quedan en la misma línea base (8 px sobre el borde inferior de la celda). Pivote: **centro-inferior**.
- Hojas aéreas (jump, glide_fall, wall): se conserva la posición vertical original dentro de la celda para no perder el movimiento. Mismo pivote horizontal.
- `manifest.json → pivot_px` da el punto exacto (x,y) por hoja.

## Animaciones
| Animación | Hoja | Frames | FPS | Reproducción | Nota |
|---|---|---|---:|---|---|
| `idle` | idle | 1–10 (10) | 8 | Bucle | Respiración y parpadeo |
| `walk` | walk | 1–10 (10) | 10 | Bucle |  |
| `run` | run | 1–10 (10) | 14 | Bucle |  |
| `jump` | jump | 1–10 (10) | 12 | Una vez | Salto completo: preparación, subida, apogeo, caída, aterrizaje |
| `jump_rise` | jump | 3–6 (4) | 12 | Una vez | Despegue y subida |
| `jump_fall` | jump | 7–9 (3) | 10 | Bucle | Caída con brazos abiertos |
| `land` | jump | 9–10 (2) | 14 | Una vez | Aterrizaje |
| `glide_full` | glide_fall | 1–10 (10) | 8 | Una vez | Secuencia completa |
| `glide_start` | glide_fall | 1–3 (3) | 10 | Una vez | Agarra la bufanda y despliega la capa |
| `glide` | glide_fall | 4–8 (5) | 8 | Bucle | Planeo con capa abierta |
| `fall` | glide_fall | 9–10 (2) | 8 | Bucle | Caída libre tras plegar la capa |
| `crouch_enter` | crouch_slide_dash | 1–2 (2) | 12 | Una vez |  |
| `crouch` | crouch_slide_dash | 3–4 (2) | 6 | Bucle | Agachada quieta |
| `crawl` | crouch_slide_dash | 5–6 (2) | 8 | Bucle | Arrastrarse agachada |
| `slide` | crouch_slide_dash | 7–9 (3) | 14 | Una vez | Deslizamiento con polvo |
| `dash` | crouch_slide_dash | 10–10 (1) | 12 | Una vez | Esquiva/embestida; 1 frame, mantener ~0.15 s |
| `crouch_sheet_full` | crouch_slide_dash | 1–10 (10) | 12 | Una vez | Los 10 frames en orden (referencia) |
| `wall_grab` | wall | 1–3 (3) | 6 | Bucle | Agarrada a la pared |
| `wall_slide` | wall | 4–5 (2) | 8 | Bucle | Resbalar por la pared |
| `wall_climb` | wall | 6–8 (3) | 10 | Bucle | Trepar |
| `wall_jump` | wall | 9–10 (2) | 12 | Una vez | Salto de pared |
| `melee` | melee | 1–10 (10) | 14 | Una vez | Combo de katana; frames con golpe: 3,4,6,8,9 |
| `kunai` | special | 1–4 (4) | 12 | Una vez | Lanzar kunais; el proyectil sale en los frames 2 y 3 |
| `special` | special | 5–10 (6) | 10 | Una vez | Técnica de pétalos; liberación en frames 7-8 |
| `special_full` | special | 1–10 (10) | 11 | Una vez | Kunai + técnica completa |
| `hurt` | hurt_death_win | 1–4 (4) | 12 | Una vez |  |
| `death` | hurt_death_win | 5–8 (4) | 8 | Una vez | Mantener el último frame; no vuelve a idle |
| `win` | hurt_death_win | 9–10 (2) | 8 | Una vez | Mantener el último frame (o bucle suave) |

Los 10 frames de cada hoja están usados: las animaciones de varias partes comparten frames de la misma hoja.

## Agregar una animación nueva
1. Generar una hoja 5×2 con fondo transparente y misma escala.
2. Recortar a `frames/<nombre>/sakura_<nombre>_NN.png`.
3. Registrar la hoja en `manifest.json` y la animación en `animation_config.json`.
