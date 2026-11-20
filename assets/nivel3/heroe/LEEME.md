# Nivel 3 · Sakura de espalda

Cuadros recortados (fondo transparente, 60 % del tamaño original) de las 6 hojas de `assets/_originales/nivel3/`.

| Hoja | Animación | Uso en el juego |
|---|---|---|
| hoja1_correr | `run` (8) | correr |
| hoja2_correr_b | `run_b` (8) | variante de correr (sin usar todavía; salió como otro ciclo de carrera, no como cambio de carril) |
| hoja3_salto | `jump` (8) | saltar barriles |
| hoja4_rodar | `roll` (8) | agacharse y rodar bajo arcos |
| hoja5_caida | `hurt` (8) | tropiezo y caída al chocar |
| hoja6_patineta | `skate` (8) | modo patineta (potenciador) |
| hoja2b_cambio_carril | `carril` (8) | inclinación al cambiar de carril: se usan los cuadros 2, 3, 3, 4. Las dos mitades salieron inclinadas hacia la derecha; para la izquierda se voltea el dibujo (la katana cambia de lado ~0,3 s) |
| hoja5b_celebracion | `celebra` (8) | victoria al final del nivel: salta, gira hacia la cámara, guiño y V (cuadros 7 y 8, de espaldas, quedan libres para una pose de espera) |

`manifest.js` define `window.NIVEL3_SAKURA_ESPALDA` con `file, w, h, ax, ay` de cada cuadro.
