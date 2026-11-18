# ANTAREZ_ANIMATION_COVERAGE

Estado actual: **integrados en el juego los 116 frames de personaje** (hojas 1-6, 8, 9 y 13) mediante `assets/characters/antarez/manifest.js` (generado por `tools/generar_manifest_antarez.py`). Verificado con `node tests/sakura-uso-frames.test.js`. Pendiente: hojas 7, 10 y 11 (iconos y efectos sueltos, 148 piezas).

| Hoja | Carpeta | Frames recortados | Frames integrados | Acción prevista |
|---|---|---|---|---|
| 1 | hoja1_movimiento_A | 8 | 0 | idle (2), walk (2), run (4) |
| 2 | hoja2_movimiento_B | 8 | 0 | jump, fall, land, slide, wall, flip, hurt |
| 3 | hoja3_katana_hono_fuego | 8 | 0 | Honō: desenvainar, guardia, tajos, aéreo, carga, poder |
| 4 | hoja4_katana_raiden_rayo | 8 | 0 | Raiden: combo y dash relámpago |
| 5 | hoja5_katana_kaze_viento_A | 8 | 0 | Kaze A: tajos, giro, planeo, ráfaga |
| 6 | hoja6_katana_kaze_viento_B | 8 | 0 | Kaze B: combos y giros extra |
| 7 | hoja7_katanas_vainas_tajos | 12 | 0 | Iconos de katanas, vainas y arcos de tajo |
| 8 | hoja8_correr_24 | 24 | 0 | run (24 frames completos) |
| 9 | hoja9_salto_24 | 24 | 0 | jump/aéreo (24 frames completos) |
| 10 | hoja10_efectos_B | 86 | 0 | Efectos: tajos, rayos, destellos, orbes, impactos |
| 11 | hoja11_efectos_A_croma | 50 | 0 | Efectos: aros, explosiones, suelo, humo, rocas |
| 13 | hoja13_kunai_shuriken | 20 | 0 | Kunai/shuriken: lanzamiento y proyectiles |

Total de piezas recortadas: **264**.