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

## Viento común y luz de verdad (rama `viento-luz-nivel1`)
- **Viento** (`ambiente.js` → `A.viento(x, t)`, expuesto como `N1core.viento`): una brisa de fondo (~0.15–0.4) más ráfagas (~1.0–1.35) que **viajan** por el nivel cada ~11 s y soplan hacia la izquierda. Lo usan: decorado (bambú, cerezo, helechos, farolitos, estandartes), pétalos y luciérnagas, hojas que caen, nubes, bancos de niebla, motas, las capas de bambú y el primer plano. `S.vd` guarda el viento acumulado para que nubes/niebla/motas aceleren en ráfaga sin saltos.
- **Luz** (`A.luces()`, después de las partículas y antes del primer plano): brillos cálidos pre-dibujados en modo aditivo con parpadeo de llama, sin `shadowBlur`. Farolitos de cuerda (3 luces, siguen el balanceo), farol de piedra, faroles del torii (los del punto de control **se encienden al activarlo**) y la meta. Incluyen una mancha cálida sobre el piso (se omite si el equipo va lento).
- **Cueva**: el agujero de luz, el halo de los acertijos y la antorcha del héroe ahora titilan como llama (`A.parpadeo`).
- Prueba nueva en `tests/nivel1.test.js` (rango del viento, ráfagas, viaje por el nivel, parpadeo).
