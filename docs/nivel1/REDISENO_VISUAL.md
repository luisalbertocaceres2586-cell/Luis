# Rediseño visual del Nivel 1 (bosque)

## Qué cambió
- **Fondo** (`motor.js`, `fondoBosque`): capas de bambú pre-dibujadas una sola vez (antes ~60 barras planas por cuadro). Usa las ilustraciones nuevas; si no cargan, cae al dibujo procedural.
- **Decorado** (`gen-nivel.js`, `repartirDeco`): separación mínima, máx. 3 piezas / 2 grandes por 1280 px, zonas reservadas (puertas, acertijos, ckp, NPC, muros, tambores, estacas, arenas), todo sobre suelo firme, sin repetir tipo. No altera la forma del nivel (usa `rng.derivar('deco')`).
- **Error corregido:** el corredor de murciélagos (`pasillo`) ya no sale en el bosque.
- **Interactividad** (`ambiente.js`): decorado que se mece y reacciona (pasar / tajo), objetos con ✦ que esconden premio, carteles que avisan lo que viene.
- **Rejas, muros, paredes y puertas de acertijo** con sprites (antes rectángulos dibujados).
- Pruebas nuevas en `tests/nivel1.test.js` (150 semillas).

## Imágenes nuevas (reutilizables en otros niveles)
Originales sin tocar: `assets/_originales/nivel1_arte2/` (hoja12_muros, fondo_lejos_a/b, fondo_medio_a/b/c).

| Archivo | Uso |
|---|---|
| `assets/nivel1/muros/reja_bambu.png` | reja y puerta de acertijo (se usa una franja central) |
| `assets/nivel1/muros/pared_bambu.png` | pared escalable de la chimenea |
| `assets/nivel1/muros/muro_piedra.png` | muro de la carreta |
| `assets/environment/levels/nivel1/n1_bg_bambu_lejos_a/b.png` | capa lejana de bambú (azulada), repite sin costura |
| `assets/environment/levels/nivel1/n1_bg_bambu_medio_a/b/c.png` | capa media de bambú (verde), repite sin costura |

Los fondos están reducidos a 1024×683 y cuantizados a 256 colores (~110–160 KB c/u).
