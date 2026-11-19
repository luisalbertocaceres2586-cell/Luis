# Plan de trabajo · Sakura con movimiento fluido (usa los 100 fotogramas)

**Objetivo:** que cada sprite de `assets/characters/sakura_assets/sakura/frames/` se dibuje de verdad en el juego, con una transición natural entre movimientos. Después se repite el proceso con Antarez (`antarez_sprites_procesados`).

## Diagnóstico (antes)
- Sin usar: `jump` 1, 2 y 10; `glide_start`; `fall` (planeo 9-10); toda la hoja `wall` (10 frames). El salto usaba 3 poses.
- Caminar/correr avanzaba por tiempo → los pies patinaban sobre el suelo.

## Cambios (engine/hero-pro.js + manifest de Sakura con `fluid:true`)
1. **Caminar/correr** por distancia recorrida (pies pegados al suelo). Si aterriza corriendo no frena.
2. **Salto**: preparación (salto 1-2) → subida según la velocidad vertical (3-6) → caída (7-9) → caída libre (planeo 9-10). El doble salto reinicia la subida. Aterrizaje suave/fuerte.
3. **Planeo**: doble salto y mantener la tecla de salto → capa (planeo 1-3), vuelo (4-8, hasta 1,4 s), al soltar pliega la capa (9-10).
4. **Pared**: agarrarse (1-3), resbalar despacio (4-5), trepar (6-8) y **salto de pared** (9-10).
5. Combate, agachado, daño, muerte, victoria: sin cambios (ya usaban sus frames).

## Mecánicas nuevas (se pueden apagar)
- `?paredes=0` desactiva resbalar y salto de pared.
- `?planeo=0` desactiva el planeo con la tecla de salto.

## Verificación
- `node tests/sakura-uso-frames.test.js` simula todos los movimientos y exige 100/100 fotogramas.
- En el navegador: jugar y escribir `SAKURA_USO()` en la consola para ver cuántos se han dibujado.
