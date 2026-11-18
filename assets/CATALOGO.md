# 🗂️ Banco de imágenes — Ninja Multiplicación

Todas las imágenes del juego, organizadas y descritas para encontrarlas y reutilizarlas (también en otros proyectos).

**Dos formas de buscar:** (1) en este archivo, con Ctrl+F por una palabra (ej. `barra`, `fuego`, `héroe`); (2) en `catalogo.json`, que tiene lo mismo en formato para programas (ruta, descripción, uso, etiquetas, tamaño). Los 214 sprites de `environment/` tienen además su propio `catalog.json` con anclas y alturas de superficie.

## Cómo está organizado

| Carpeta | Qué hay |
|---|---|
| `ui/hud/` | Todo lo de la información en pantalla: marcos, barra de vida, retratos, iconos, animados, progreso, efectos del héroe, bordes de peligro |
| `ui/poderes/` | 29 iconos de poderes (insignias de 256 px) |
| `effects/` | Efectos de impacto del meteorito (explosiones, anillos, grietas, cráter, humo, rocas, haz de luz) en fuego, hielo y magia |
| `environment/` | **214 sprites de entornos** (plataformas por bioma, decorados, cielo, escenas, islas flotantes, arte del Nivel 1). Su detalle técnico está en `environment/catalog.json` y su guía en `README.md` |
| `characters/` | Fotogramas de animación: `sakura/`, `kage/`, `villain/` |
| `ui/select/`, `ui/intro/` | Ilustraciones grandes (selección de héroe, introducción) |
| `icons/` | Iconos de la app instalable |
| `_originales/hud/` | Los archivos TAL CUAL se recibieron (hojas y GIF) para volver a recortarlos si hace falta |

## Reglas de nombres

- Minúsculas, sin tildes ni espacios, con guion bajo: `categoria_nombre_variante.png`.
- Estados de personaje al final: `_radiante`, `_normal`, `_herido`, `_agotado`. Colores de efectos: `_fuego`, `_hielo`, `_magia`.
- **Tiras de animación**: todos los cuadros en una fila (misma anchura de celda). El número de cuadros y el tamaño de cada celda están en la tabla.
- **Todo con fondo transparente** (PNG con alfa). Lo que venía con cuadriculado pintado se limpió; si no se pudo, se explica en la columna "Nota".
- Cada carpeta de `hud/` tiene su propio `LEEME.md` con lo esencial.








<!-- NIVEL2:INICIO -->
## 🏜️ Nivel 2 — Surf de Dunas (`nivel2/`)

Arte del Nivel 2, recortado por `tools/recortar_nivel2.py` desde las hojas guardadas en `_originales/nivel2/`. Se carga con `nivel2/manifest.js` (`window.NIVEL2_ARTE`). Ancla: centro-abajo. Fondo transparente. Para volver a generar todo: `python3 tools/recortar_nivel2.py`.

### Obstáculos

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/obstaculos/cactus_saguaro.png` | **Cactus saguaro.** Cactus verde alto de dos brazos con espinas crema, sobre un montículo de arena. | Obstáculo alto (hay que saltarlo o cambiar de carril). | 183×260 |
| `nivel2/obstaculos/cactus_barril.png` | **Cactus barril con flor.** Cactus redondo y bajo con una flor rosada en la cima. | Obstáculo bajo, variante visual del cactus. | 202×209 |
| `nivel2/obstaculos/roca_grande.png` | **Roca grande.** Roca violeta de caras planas con arena y pasto seco en la base. | Obstáculo medio-alto del carril. | 279×199 |
| `nivel2/obstaculos/rocas_pequenas.png` | **Rocas pequeñas.** Grupo de tres piedras violetas con pasto seco. | Obstáculo bajo. | 244×131 |
| `nivel2/obstaculos/rueda_carreta.png` | **Rueda de carreta rota.** Rueda de madera con aro de hierro, medio enterrada en la arena. | Obstáculo decorativo/medio; ambientación de caravana. | 280×198 |

### Enemigos

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/enemigos/escorpion_walk_*.png` ×4 | **Escorpión rojo (caminar).** Escorpión rojo carmesí con cola en alto y pinzas abiertas; ciclo de 4 cuadros. | Enemigo pequeño del carril (se salta). | 232×202 |
| `nivel2/enemigos/escorpion_golpe.png` | **Escorpión golpeando.** Pose de picadura con marca de impacto amarilla. | Reacción cuando choca con el héroe o aviso de ataque. | 221×210 |
| `nivel2/enemigos/serpiente_slither_*.png` ×4 | **Serpiente (deslizarse).** Serpiente verde lima con rombos y lengua roja; ciclo de 4 cuadros en forma de S. | Enemigo que cambia de carril. | 277×106 |
| `nivel2/enemigos/serpiente_alerta.png` | **Serpiente enroscada.** Serpiente en espiral con la cabeza erguida y lengua afuera. | Pose de aviso antes de cambiar de carril. | 227×203 |
| `nivel2/enemigos/buitre_vuelo_*.png` ×3 | **Buitre ladrón (vuelo).** Buitre de plumas moradas oscuras, cuello rosado y pico dorado; 3 cuadros de aleteo. | Evento del buitre ladrón que sobrevuela. | 280×241 |
| `nivel2/enemigos/buitre_picada.png` | **Buitre en picada.** Buitre con alas atrás y garras al frente, lanzándose hacia abajo. | Ataque en picada sobre un carril. | 254×190 |
| `nivel2/enemigos/buitre_huida.png` | **Buitre huyendo con la bolsa.** Buitre con una bolsita dorada con gema azul entre las garras. | Final del evento: se escapa con lo robado. | 250×256 |

### Jefes

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/jefes/jefe_escorpion_*.png` ×5 | **Escorpión Colosal.** Escorpión gigante carmesí con aguijón dorado; poses: idle, aviso (brillo rojo), ataque (cola clavada), golpe (mareado) y derrota (bandera blanca). | Jefe perseguidor del final del recorrido. | 301×179 |
| `nivel2/jefes/jefe_gusano_*.png` ×5 | **Gusano de arena gigante.** Gusano violeta con vientre arena y boca circular con dientes redondeados; poses: idle, aviso (asomando), ataque, golpe y derrota (inflado y mareado). | Jefe que emerge por un carril. | 305×216 |
| `nivel2/jefes/jefe_esfinge_*.png` ×5 | **Esfinge guardiana.** Esfinge de arenisca con tocado dorado y azul y ojos cian; poses: idle, aviso (runas flotando), ataque (rayo con anillos), golpe (grietas) y derrota (pila de rocas). | Jefe de adivinanzas con rayo por el carril. | 348×220 |
| `nivel2/jefes/jefe_faraon_*.png` ×5 | **Faraón momia.** Momia con máscara dorada y azul, ojos cian, cayado y mayal; poses: idle, aviso (vendas flotando), ataque (látigo de venda), golpe y derrota (montón de vendas). | Jefe que lanza vendas por el carril. | 353×239 |

### Compañero

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/companero/zorro_idle.png` | **Zorro fénec (reposo).** Zorro fénec naranja de orejas enormes con pañuelo cian, sentado. | Compañero del héroe; pantalla de inicio. | 218×213 |
| `nivel2/companero/zorro_run_*.png` ×3 | **Zorro fénec (correr).** Ciclo de carrera de 3 cuadros hacia la derecha. | Compañero que corre junto al héroe. | 263×192 |
| `nivel2/companero/zorro_alerta.png` | **Zorro fénec alerta.** Erguido sobre las patas traseras con signo de exclamación dorado. | Aviso de peligro cercano. | 234×237 |
| `nivel2/companero/zorro_celebra.png` | **Zorro fénec celebrando.** Salta con los brazos arriba y ojos cerrados de alegría. | Reacción a un acierto o a la victoria. | 259×233 |

### Vehículos

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/vehiculos/alfombra_sakura_planeo_*.png` ×2 | **Sakura en alfombra (planeo).** Sakura agachada sobre una alfombra mágica violeta con flecos dorados; 2 cuadros. | Zona de cielo (alfombra voladora). | 289×219 |
| `nivel2/vehiculos/alfombra_sakura_sube.png` | **Sakura en alfombra (subiendo).** Alfombra inclinada hacia arriba. | Subir de carril en la zona de cielo. | 274×222 |
| `nivel2/vehiculos/alfombra_sakura_baja.png` | **Sakura en alfombra (bajando).** Alfombra inclinada hacia abajo. | Bajar de carril en la zona de cielo. | 278×220 |
| `nivel2/vehiculos/alfombra_kage_planeo_*.png` ×2 | **Kage en alfombra (planeo).** Kage sobre una alfombra azul con flecos dorados; 2 cuadros. | Zona de cielo (alfombra voladora). | 276×213 |
| `nivel2/vehiculos/alfombra_kage_sube.png` | **Kage en alfombra (subiendo).** Alfombra azul inclinada hacia arriba. | Subir de carril en la zona de cielo. | 267×214 |
| `nivel2/vehiculos/alfombra_kage_baja.png` | **Kage en alfombra (bajando).** Alfombra azul inclinada hacia abajo. | Bajar de carril en la zona de cielo. | 271×210 |
| `nivel2/vehiculos/vagoneta_sakura_rueda_*.png` ×2 | **Sakura en vagoneta (rodar).** Vagoneta minera de madera con chispas en las ruedas; 2 cuadros. | Zona del cañón minero. | 238×222 |
| `nivel2/vehiculos/vagoneta_sakura_salto.png` | **Sakura en vagoneta (salto).** Vagoneta en el aire con Sakura agarrada. | Salto en la zona del cañón minero. | 235×245 |
| `nivel2/vehiculos/vagoneta_kage_rueda_*.png` ×2 | **Kage en vagoneta (rodar).** Vagoneta minera con Kage y chispas; 2 cuadros. | Zona del cañón minero. | 238×258 |
| `nivel2/vehiculos/vagoneta_kage_salto.png` | **Kage en vagoneta (salto).** Vagoneta en el aire con Kage. | Salto en la zona del cañón minero. | 235×207 |

### Poderes

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/poderes/poder_escarabajo.png` | **Escarabajo escudo.** Escarabajo egipcio dorado con alas abiertas y gema cian. | Poder: absorbe un golpe. | 305×243 |
| `nivel2/poderes/poder_reloj.png` | **Reloj de arena.** Reloj de arena con marco dorado y arena cayendo. | Poder: ralentiza el tiempo. | 181×251 |
| `nivel2/poderes/poder_iman.png` | **Imán de gotas.** Imán de herradura rojo con tres gotas cian atraídas. | Poder: atrae las gotas de agua. | 231×250 |
| `nivel2/poderes/poder_comodin.png` | **Comodín 50/50.** Medallón dorado partido en dos mitades, sin números. | Poder: elimina una respuesta incorrecta. | 254×251 |

### Objetos

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/objetos/gota_agua.png` | **Gota de agua.** Gota cian brillante con contorno oscuro. | Coleccionable (impulso y puntos). | 169×245 |
| `nivel2/objetos/corazon_desierto.png` | **Corazón del desierto.** Corazón rojo facetado con gema dorada al centro. | Vidas en el HUD o recompensa de vida. | 272×231 |
| `nivel2/objetos/cofre_cerrado.png` | **Cofre cerrado.** Cofre de madera con bandas doradas y gema cian. | Premio misterioso. | 270×218 |
| `nivel2/objetos/cofre_entreabierto.png` | **Cofre entreabierto.** Cofre con la tapa a medias y una moneda saltando. | Animación de apertura. | 248×233 |
| `nivel2/objetos/cofre_abierto.png` | **Cofre abierto.** Cofre con monedas, gemas y una estrella dorada. | Pantalla de recompensa. | 272×262 |
| `nivel2/objetos/trofeo_escorpion.png` | **Trofeo del escorpión.** Copa dorada con asas en forma de pinzas de escorpión y gema cian. | Premio por vencer al jefe. | 289×280 |

### Tablas de surf

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/tablas/tabla_clasica.png` | **Tabla clásica.** Tabla de madera con vetas y correa de cuero. | Skin inicial del héroe. | 294×218 |
| `nivel2/tablas/tabla_faraon.png` | **Tabla del faraón.** Tabla dorada con ojo egipcio y franjas azules. | Skin desbloqueable. | 289×213 |
| `nivel2/tablas/tabla_neon.png` | **Tabla azul neón.** Tabla azul con líneas cian brillantes. | Skin desbloqueable. | 286×211 |
| `nivel2/tablas/tabla_dragon.png` | **Tabla dragón rojo.** Tabla roja con un dragón dorado. | Skin desbloqueable. | 288×208 |
| `nivel2/tablas/tabla_cristal.png` | **Tabla de cristal.** Tabla translúcida de hielo con facetas. | Skin desbloqueable. | 280×201 |
| `nivel2/tablas/tabla_cactus.png` | **Tabla cactus.** Tabla verde con espinas y una flor rosada. | Skin desbloqueable. | 285×207 |

### Compuertas

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/compuertas/compuerta_neutral.png` | **Compuerta neutral.** Arco de piedra con bordes dorados y panel crema vacío (el número se escribe por código). | Compuerta de respuesta aún sin cruzar. | 271×286 |
| `nivel2/compuertas/compuerta_correcta.png` | **Compuerta correcta.** Arco con panel verde y marca de visto. | Resultado de acierto. | 270×286 |
| `nivel2/compuertas/compuerta_incorrecta.png` | **Compuerta incorrecta.** Arco con panel rojo y cruz. | Resultado de error. | 270×286 |
| `nivel2/compuertas/compuerta_usada.png` | **Compuerta usada.** Arco apagado en gris violeta. | Compuertas no elegidas ya resueltas. | 269×286 |

### Extras generales

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/extras/isla_hierba.png` | **Isla flotante de pasto.** Isla de tierra con pasto y piedritas. | Plataforma flotante. | 269×206 |
| `nivel2/extras/isla_desierto.png` | **Isla flotante de desierto.** Isla de arena con un cactus. | Plataforma flotante de tema desierto. | 265×218 |
| `nivel2/extras/isla_hielo.png` | **Isla flotante de hielo.** Isla de hielo con carámbanos. | Plataforma flotante de tema hielo. | 268×168 |
| `nivel2/extras/isla_lava.png` | **Isla flotante de lava.** Isla de roca oscura con grietas de lava. | Plataforma flotante de tema lava. | 267×165 |
| `nivel2/extras/isla_cristal.png` | **Isla flotante de cristal.** Isla morada con cristales violetas. | Plataforma flotante de tema cristal. | 266×221 |
| `nivel2/extras/puente_colgante.png` | **Puente colgante.** Puente de tablas y cuerdas. | Pasarela. | 288×161 |
| `nivel2/extras/puente_piedra.png` | **Puente de piedra.** Arco de piedra con musgo. | Pasarela. | 303×168 |
| `nivel2/extras/escalera_madera.png` | **Escalera de madera.** Escalera vertical con clavos metálicos. | Trepar. | 140×230 |
| `nivel2/extras/enredadera.png` | **Enredadera.** Rama con hojas verdes colgante. | Agarre o decoración. | 282×205 |
| `nivel2/extras/vagoneta_oro.png` | **Vagoneta con oro.** Vagoneta minera llena de pepitas doradas. | Decoración del cañón o premio. | 229×202 |
| `nivel2/extras/cristales_azules.png` | **Cristales azules.** Racimo de cristales cian con rocas y hojas. | Decoración. | 218×260 |
| `nivel2/extras/bandera_checkpoint.png` | **Bandera de punto de control.** Bandera roja con aro dorado en el suelo. | Checkpoint. | 268×253 |
| `nivel2/extras/portal_piedra.png` | **Portal de piedra.** Arco de piedra con un vórtice azul y cristales. | Cambio de zona. | 276×246 |
| `nivel2/extras/teletransporte.png` | **Teletransportador.** Plataforma con columna de luz azul y anillos. | Cambio de zona. | 253×256 |
| `nivel2/extras/trampolin.png` | **Trampolín.** Resorte con plataforma amarilla y negra y flecha arriba. | Rampa que impulsa el salto. | 201×230 |
| `nivel2/extras/cinta_transportadora.png` | **Cinta transportadora.** Cinta con flechas amarillas. | Empuja al héroe. | 288×170 |
| `nivel2/extras/pinchos.png` | **Pinchos.** Cuatro pinchos metálicos sobre una base de madera. | Obstáculo bajo. | 281×194 |
| `nivel2/extras/sierra.png` | **Sierra circular.** Sierra con centro rojo sobre base metálica. | Obstáculo peligroso. | 261×220 |
| `nivel2/extras/canon.png` | **Cañón.** Cañón negro con mecha encendida. | Dispara proyectiles. | 271×209 |
| `nivel2/extras/bandera_meta.png` | **Bandera de meta.** Bandera de cuadros blanca y negra. | Final del recorrido. | 242×241 |

### Extras ninja

| Imagen | Qué es | Uso | Tamaño |
|---|---|---|---|
| `nivel2/extras/pergamino.png` | **Pergamino.** Pergamino con cuerda y borla rojas. | Objeto coleccionable. | 255×297 |
| `nivel2/extras/cofre_oscuro_cerrado.png` | **Cofre oscuro cerrado.** Cofre de madera oscura con remaches dorados y gema roja. | Premio. | 265×236 |
| `nivel2/extras/cofre_oscuro_abierto.png` | **Cofre oscuro abierto.** Cofre con monedas y gemas. | Premio abierto. | 251×307 |
| `nivel2/extras/onigiri.png` | **Onigiri sonriente.** Triángulo de arroz con alga y carita feliz. | Recuperar energía. | 262×237 |
| `nivel2/extras/tambor_taiko.png` | **Tambor taiko.** Tambor rojo con cuerdas doradas y baquetas. | Decoración o ritmo. | 268×335 |
| `nivel2/extras/piedra_agrietada.png` | **Piedra agrietada.** Bloque de piedra con grietas y musgo. | Obstáculo rompible. | 276×308 |
| `nivel2/extras/dragon_origami.png` | **Dragón de origami.** Dragón rojo y dorado estilo papel plegado. | Enemigo o decoración. | 305×327 |
| `nivel2/extras/oni_garrote_guardia.png` | **Oni con garrote (guardia).** Ogro azul con cuernos dorados y garrote con púas, en guardia. | Enemigo fuerte. | 276×406 |
| `nivel2/extras/oni_garrote_ataque.png` | **Oni con garrote (ataque).** El mismo oni alzando el garrote para golpear. | Pose de ataque del oni. | 297×424 |
| `nivel2/extras/bola_fuego.png` | **Bola de fuego.** Remolino de fuego naranja y amarillo. | Proyectil o efecto. | 244×260 |

<!-- NIVEL2:FIN -->

## Cómo agregar algo nuevo

1. Pon el PNG en la carpeta que corresponda (o crea una nueva con nombre claro).
2. Guarda el original recibido en `_originales/`.
3. Añade una entrada en `catalogo.json` y una fila aquí (qué es, para qué sirve, etiquetas).

---

## HUD · marcos

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/marcos/medallon_marco.png` | Aro de acero azul con borde dorado, brillo cian por dentro, seis pinchos plateados y un shuriken dorado en la esquina superior izquierda. El centro está vacío y transparente. | Marco para retratos o logros: pantalla de pausa, perfil, ranking, selección de personaje, diálogos. · Usado en: Banco (aún sin usar en el juego) | 320×320 | marco, medallón, retrato, ui, dorado, shuriken |  |
| `ui/hud/marcos/insignia_nivel.png` | Placa hexagonal dorada con interior de acero azul cepillado, línea cian y un shuriken dorado abajo. Interior vacío para escribir un número. | Número de nivel, rango, grado escolar, cantidad de algo. Escribe el número encima con texto (blanco con borde negro). · Usado en: HUD nuevo (insignia del nivel junto al retrato; hoy solo se ve el número) | 320×320 | insignia, hexágono, nivel, ui, número |  |
| `ui/hud/marcos/boton_pausa.png` | Botón redondo azul marino con borde dorado y dos barras doradas de pausa, con brillo arriba a la izquierda. | Botón táctil de pausa (≈ 36-44 px). Se puede reutilizar como botón redondo para cualquier acción cambiando el símbolo. · Usado en: HUD nuevo (arriba a la derecha) | 320×320 | botón, pausa, ui, redondo, dorado |  |

## HUD · barra de vida

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/barra-vida/barra_marco.png` | Cápsula larga de acero azul y dorado con luz cian por dentro y una casilla redonda a la izquierda para el retrato. Los dos huecos (casilla e interior de la barra) son transparentes. | Barra de vida/energía con retrato. Se corta en 3 partes (izquierda 0-300 px, centro 600-700 px que se repite, derecha 1290-1400 px) para hacerla tan larga como se necesite. El relleno va DETRÁS del marco. · Usado en: HUD nuevo (barra de vida) | 1400×214 | barra, vida, marco, retrato, hp, capsula, ui | Hueco de la casilla: x52-193, y39-175 · hueco de la barra: x222-1348, y60-157 (en píxeles del archivo de 1400×214). |
| `ui/hud/barra-vida/barra_relleno.png` | Franja brillante tipo líquido en blanco y grises, con olas suaves y burbujas. Sin color a propósito. | Se estira dentro del hueco de la barra y se tiñe con color (verde, amarillo, rojo) usando fondo de color + multiplicar y un poco de brillo. Sirve para cualquier barra: energía, maná, carga. · Usado en: HUD nuevo (se tiñe verde → amarillo → rojo) | 1400×105 | barra, relleno, líquido, tintable, gris, ui |  |
| `ui/hud/barra-vida/barra_brillo.png` | Franja suave con destellos diagonales blancos y azul claro, que se desvanece en los bordes. | Pasarlo de izquierda a derecha sobre la barra con mezcla "pantalla" (screen) y opacidad ~0,7 para dar brillo. · Usado en: HUD nuevo (barrido de brillo cada ~3 s) | 1400×86 | brillo, destello, barra, ui, efecto |  |

## HUD · retratos

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/retratos/sakura_radiante.png` | Sakura: ninja joven, pelo negro recogido con flor de cerezo rosa y mechas magenta, máscara negra y armadura oscura. Expresión "radiante", fondo amarillo con destellos. Recorte circular. | Vida llena (≥ 90 %): sonriente, confiado, con chispas. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, sakura, radiante, personaje, expresión, círculo |  |
| `ui/hud/retratos/sakura_normal.png` | Sakura: ninja joven, pelo negro recogido con flor de cerezo rosa y mechas magenta, máscara negra y armadura oscura. Expresión "normal", fondo morado. Recorte circular. | Vida entre 50 % y 89 %: determinado, tranquilo. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, sakura, normal, personaje, expresión, círculo |  |
| `ui/hud/retratos/sakura_herido.png` | Sakura: ninja joven, pelo negro recogido con flor de cerezo rosa y mechas magenta, máscara negra y armadura oscura. Expresión "herido", fondo rojo. Recorte circular. | Vida entre 25 % y 49 %: preocupado, con un rasguño. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, sakura, herido, personaje, expresión, círculo |  |
| `ui/hud/retratos/sakura_agotado.png` | Sakura: ninja joven, pelo negro recogido con flor de cerezo rosa y mechas magenta, máscara negra y armadura oscura. Expresión "agotado", fondo azul. Recorte circular. | Vida menor a 25 %: ojos cerrados o casi, sudor, colores apagados. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, sakura, agotado, personaje, expresión, círculo |  |
| `ui/hud/retratos/kage_radiante.png` | Kage: ninja joven, pelo negro de puntas, máscara negra, bufanda roja y armadura negra con detalles rojos. Expresión "radiante", fondo amarillo con destellos. Recorte circular. | Vida llena (≥ 90 %): sonriente, confiado, con chispas. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, kage, radiante, personaje, expresión, círculo |  |
| `ui/hud/retratos/kage_normal.png` | Kage: ninja joven, pelo negro de puntas, máscara negra, bufanda roja y armadura negra con detalles rojos. Expresión "normal", fondo morado. Recorte circular. | Vida entre 50 % y 89 %: determinado, tranquilo. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, kage, normal, personaje, expresión, círculo |  |
| `ui/hud/retratos/kage_herido.png` | Kage: ninja joven, pelo negro de puntas, máscara negra, bufanda roja y armadura negra con detalles rojos. Expresión "herido", fondo rojo. Recorte circular. | Vida entre 25 % y 49 %: preocupado, con un rasguño. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, kage, herido, personaje, expresión, círculo |  |
| `ui/hud/retratos/kage_agotado.png` | Kage: ninja joven, pelo negro de puntas, máscara negra, bufanda roja y armadura negra con detalles rojos. Expresión "agotado", fondo azul. Recorte circular. | Vida menor a 25 %: ojos cerrados o casi, sudor, colores apagados. Se cambia solo según la barra de vida. También sirve para ranking, perfiles y diálogos. · Usado en: HUD nuevo (según la salud) | 256×256 | retrato, kage, agotado, personaje, expresión, círculo |  |

## HUD · iconos

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/iconos/moneda.png` | Moneda dorada brillante con una estrella grabada. | Icono de puntos o monedas, fijo. Para la versión que gira usa animados/moneda_girando.png. | 256×256 | moneda, puntos, icono, dorado |  |
| `ui/hud/iconos/calavera.png` | Calavera blanca con banda ninja roja y ojos rojos brillantes. | Icono de enemigos derrotados / enemigos restantes. · Usado en: HUD nuevo (ficha de enemigos) | 256×256 | calavera, enemigos, icono, rojo |  |
| `ui/hud/iconos/bandera_meta.png` | Bandera roja con un shuriken negro sobre un asta de madera con puntas doradas. | Marca de llegada o meta (barra de progreso, mapa). · Usado en: HUD nuevo (final de la barra de progreso) | 256×256 | bandera, meta, icono, rojo |  |
| `ui/hud/iconos/bandera_control.png` | Bandera verde con un farol dibujado, sobre un asta de madera. | Punto de control / guardado. · Usado en: HUD nuevo (marca en la barra de progreso) | 256×256 | bandera, checkpoint, punto de control, icono, verde |  |
| `ui/hud/iconos/cabeza_ninja.png` | Cabeza de ninja con banda azul y máscara negra. | Marcador del jugador sobre una barra de progreso o mapa. · Usado en: HUD nuevo (se mueve por la barra de progreso) | 256×256 | ninja, marcador, jugador, icono |  |
| `ui/hud/iconos/ficha_contador_parcial.png` | Cápsula azul y dorada con una casilla redonda a la izquierda. LA IMAGEN ORIGINAL VENÍA CORTADA a la derecha. | Solo de referencia de estilo. En el juego las fichas se arman con CSS imitando esta forma. | 256×256 | ficha, contador, referencia, cortada | Si se necesita completa, pedir de nuevo con la cápsula entera visible. |

## HUD · animados

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/animados/corazon_latido.png` | Corazón rojo brillante con un shuriken dorado. Late: crece con un resplandor y vuelve a su tamaño. | Tira horizontal de 6 cuadros. Se reproduce con CSS (steps(6)); más rápido cuando hay poca vida. · Usado en: HUD nuevo (extremo de la barra de vida) | 1200×175 · 6 cuadros de 200×175 | corazón, latido, vida, animación, tira |  |
| `ui/hud/animados/moneda_girando.png` | Moneda dorada con estrella girando sobre su eje vertical, con un destello al final. | Tira horizontal de 6 cuadros. · Usado en: HUD nuevo (ficha de puntos) | 960×160 · 6 cuadros de 160×160 | moneda, giro, animación, tira, puntos |  |

## HUD · progreso

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/progreso/progreso_marco.png` | Cápsula delgada azul marino con borde dorado y un shuriken ornamental en cada extremo. | Barra de progreso del nivel o cualquier barra larga y fina. Interior oscuro y sólido (no transparente): rellenar con una capa encima. · Usado en: HUD nuevo (arriba al centro) | 1200×53 | progreso, barra, marco, nivel, ui | Interior aprox. de x28 a x1171 (en el archivo de 1200 px de ancho). |

## HUD · efectos del héroe

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/efectos-heroe/aura_radiante.png` | Anillo de destellos dorados que gira alrededor de un centro vacío, con estrellitas. | Héroe con la vida llena: dibujarla centrada en el personaje con transparencia ~0,5. Tira horizontal de 6 cuadros. · Usado en: HUD nuevo (Salud ≥ 90 %) | 1410×264 · 6 cuadros de 235×264 | efecto, héroe, animación, tira, aura radiante |  |
| `ui/hud/efectos-heroe/curacion.png` | Anillo verde que se expande con signos de más (+) que suben y se desvanecen. | Al recuperar vida o recoger una vida extra: dibujarlo a los pies del héroe. Tira horizontal de 6 cuadros. · Usado en: HUD nuevo (Al curarse) | 1230×264 · 6 cuadros de 205×264 | efecto, héroe, animación, tira, curacion |  |
| `ui/hud/efectos-heroe/golpe.png` | Cortes rojos y blancos en diagonal con chispas. | Al recibir daño: dibujarlo sobre el héroe unos 0,4 s. Tira horizontal de 6 cuadros. · Usado en: HUD nuevo (Al recibir un golpe) | 1500×264 · 6 cuadros de 250×264 | efecto, héroe, animación, tira, golpe |  |
| `ui/hud/efectos-heroe/sudor.png` | Tres gotas azules claras que salen disparadas hacia un lado. | Héroe cansado: junto a la cabeza, de vez en cuando. Tira horizontal de 4 cuadros. · Usado en: HUD nuevo (Salud < 25 %) | 1056×102 · 4 cuadros de 264×102 | efecto, héroe, animación, tira, sudor |  |
| `ui/hud/efectos-heroe/mareo.png` | Anillo de estrellitas amarillas que gira (para ponerlo sobre la cabeza). | Héroe agotado, aturdido o noqueado. Tira horizontal de 6 cuadros. · Usado en: HUD nuevo (Salud < 25 %) | 1584×162 · 6 cuadros de 264×162 | efecto, héroe, animación, tira, mareo |  |

## HUD · pantalla

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/pantalla/esquina_roja_sup_izq.png` | Esquina con roca roja agrietada y vetas brillantes, el resto transparente. | Cuatro esquinas juntas forman el borde de peligro de la pantalla. Se pone cada una en su esquina y se hace latir su opacidad. · Usado en: HUD nuevo (peligro con vida baja y destello al golpe) | 512×512 | peligro, vida baja, esquina, rojo, borde, pantalla, viñeta |  |
| `ui/hud/pantalla/esquina_roja_sup_der.png` | Esquina con roca roja agrietada y vetas brillantes, el resto transparente. | Cuatro esquinas juntas forman el borde de peligro de la pantalla. Se pone cada una en su esquina y se hace latir su opacidad. · Usado en: HUD nuevo (peligro con vida baja y destello al golpe) | 512×512 | peligro, vida baja, esquina, rojo, borde, pantalla, viñeta |  |
| `ui/hud/pantalla/esquina_roja_inf_izq.png` | Esquina con roca roja agrietada y vetas brillantes, el resto transparente. | Cuatro esquinas juntas forman el borde de peligro de la pantalla. Se pone cada una en su esquina y se hace latir su opacidad. · Usado en: HUD nuevo (peligro con vida baja y destello al golpe) | 512×512 | peligro, vida baja, esquina, rojo, borde, pantalla, viñeta |  |
| `ui/hud/pantalla/esquina_roja_inf_der.png` | Esquina con roca roja agrietada y vetas brillantes, el resto transparente. | Cuatro esquinas juntas forman el borde de peligro de la pantalla. Se pone cada una en su esquina y se hace latir su opacidad. · Usado en: HUD nuevo (peligro con vida baja y destello al golpe) | 512×512 | peligro, vida baja, esquina, rojo, borde, pantalla, viñeta |  |
| `ui/hud/pantalla/vineta_peligro_izquierda_1920x1080.png` | Borde rojo agrietado de pantalla completa 1920×1080. SOLO TIENE el lado izquierdo (y algo de arriba); el centro y la derecha están vacíos. | Se puede reflejar horizontalmente para cubrir el lado derecho. Alternativa a las esquinas. | 1920×1080 | viñeta, peligro, pantalla, rojo | Salió incompleta; las esquinas rojas la reemplazan. |

## HUD · extras

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/hud/extras/barra_ornamental_azul_dorada.png` | Barra de cristal azul brillante con extremos dorados ornamentados (estilo fantasía). Fondo limpiado a partir de un original con cuadriculado pintado. | Título, barra de carga, banner o cabecera de menú. Estilo distinto al HUD ninja: sirve para otros juegos o pantallas de fantasía. · Usado en: Banco (aún sin usar) | 1400×250 | barra, banner, dorado, azul, ornamental, fantasía, extra |  |

## Poderes · iconos

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/poderes/life.png` | Hongo verde con corazón (vida extra). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, life, power-up |  |
| `ui/poderes/star.png` | Estrella dorada con estela arcoíris (invencible). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, star, power-up |  |
| `ui/poderes/speed.png` | Bota azul con alas (velocidad). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, speed, power-up |  |
| `ui/poderes/shield.png` | Escudo verde jade con shuriken (escudo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, shield, power-up |  |
| `ui/poderes/magnet.png` | Imán rojo atrayendo monedas (imán). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, magnet, power-up |  |
| `ui/poderes/giant.png` | Puño naranja con ondas (gigante). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, giant, power-up |  |
| `ui/poderes/gun.png` | Pistola láser naranja (disparo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, gun, power-up |  |
| `ui/poderes/dualshot.png` | Dos pistolas magenta cruzadas (doble disparo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, dualshot, power-up |  |
| `ui/poderes/clone.png` | Dos ninjas azules, uno translúcido (clon). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, clone, power-up |  |
| `ui/poderes/rocket.png` | Cohete magenta (cohete). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, rocket, power-up |  |
| `ui/poderes/bounce.png` | Pelota dorada rebotando (rebote). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, bounce, power-up |  |
| `ui/poderes/meteor.png` | Meteorito en llamas (lluvia de meteoros). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, meteor, power-up |  |
| `ui/poderes/timefreeze.png` | Reloj de arena entre cristales de hielo (congelar tiempo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, timefreeze, power-up |  |
| `ui/poderes/timewarp.png` | Reloj de bolsillo morado con flechas (tiempo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, timewarp, power-up |  |
| `ui/poderes/freeze.png` | Flor de cerezo congelada (congelar enemigos). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, freeze, power-up |  |
| `ui/poderes/mirror.png` | Espejo con silueta de ninja (espejo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, mirror, power-up |  |
| `ui/poderes/ghost.png` | Fantasma lavanda (fantasma). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, ghost, power-up |  |
| `ui/poderes/phantom.png` | Vórtice morado con ninja (fantasma/portal). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, phantom, power-up |  |
| `ui/poderes/lightning_storm.png` | Rayo amarillo en nube de tormenta (tormenta). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, lightning_storm, power-up |  |
| `ui/poderes/rainbowstorm.png` | Arcoíris con monedas (tormenta arcoíris). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, rainbowstorm, power-up |  |
| `ui/poderes/berserker.png` | Máscara ninja furiosa en llamas (berserker). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, berserker, power-up |  |
| `ui/poderes/aura.png` | Ninja envuelto en llamas (aura). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, aura, power-up |  |
| `ui/poderes/crown.png` | Corona dorada con rubíes (puntos dobles). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, crown, power-up |  |
| `ui/poderes/dash.png` | Pez azul veloz con agua (dash marino). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, dash, power-up |  |
| `ui/poderes/superjump.png` | Resorte verde con flecha (supersalto). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, superjump, power-up |  |
| `ui/poderes/superjump3x.png` | Huella verde con tres flechas (triple salto). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, superjump3x, power-up |  |
| `ui/poderes/float.png` | Ninja sobre una nube (flotar). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, float, power-up |  |
| `ui/poderes/gravity.png` | Planeta morado con pluma (baja gravedad). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, gravity, power-up |  |
| `ui/poderes/turbo.png` | Bota dorada con alas (turbo). Insignia redonda o silueta con contorno azul marino grueso, estilo brillante. | Objeto que cae del cielo, selector "Elige tu poder" y barra de poderes activos (el juego los carga solo). · Usado en: Juego (objetos que caen, selector y poderes activos) | 256×256 | poder, icono, turbo, power-up |  |

## Efectos · impacto

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `effects/explosion_fuego_a.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, fuego, animación, hoja |  |
| `effects/explosion_fuego_b.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, fuego, animación, hoja |  |
| `effects/explosion_fuego_c.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×726 · 6 cuadros | explosión, impacto, meteorito, fuego, animación, hoja |  |
| `effects/fx_anillos_fuego.png` | Anillos de energía que se expanden en el suelo, con rocas. | Hoja de animación (cuadros iguales en rejilla). Versión fuego. · Usado en: Juego (impacto del meteorito) | 1020×364 | efecto, anillos, fuego, animación, hoja |  |
| `effects/fx_brasas_fuego.png` | Brasas, chispas y estrellitas que salen despedidas. | Hoja de animación (cuadros iguales en rejilla). Versión fuego. · Usado en: Juego (impacto del meteorito) | 900×592 | efecto, brasas, fuego, animación, hoja |  |
| `effects/fx_crater_fuego.png` | Cráter ardiente: fuego y rocas al inicio, termina en brasas y humo. | Hoja de animación (cuadros iguales en rejilla). Versión fuego. · Usado en: Juego (impacto del meteorito) | 990×686 | efecto, crater, fuego, animación, hoja |  |
| `effects/fx_grietas_fuego.png` | Grietas doradas de energía en el suelo con una columna de luz. | Hoja de animación (cuadros iguales en rejilla). Versión fuego. · Usado en: Juego (impacto del meteorito) | 840×432 | efecto, grietas, fuego, animación, hoja |  |
| `effects/fx_grieta_cielo_fuego.png` | Grieta de luz que se abre en el cielo (4 cuadros). | Hoja de animación (cuadros iguales en rejilla). Versión fuego. · Usado en: Juego (impacto del meteorito) | 800×534 | efecto, grieta cielo, fuego, animación, hoja |  |
| `effects/explosion_hielo_a.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, hielo, animación, hoja |  |
| `effects/explosion_hielo_b.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, hielo, animación, hoja |  |
| `effects/explosion_hielo_c.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×726 · 6 cuadros | explosión, impacto, meteorito, hielo, animación, hoja |  |
| `effects/fx_anillos_hielo.png` | Anillos de energía que se expanden en el suelo, con rocas. | Hoja de animación (cuadros iguales en rejilla). Versión hielo. · Usado en: Juego (impacto del meteorito) | 1020×364 | efecto, anillos, hielo, animación, hoja |  |
| `effects/fx_brasas_hielo.png` | Brasas, chispas y estrellitas que salen despedidas. | Hoja de animación (cuadros iguales en rejilla). Versión hielo. · Usado en: Juego (impacto del meteorito) | 900×592 | efecto, brasas, hielo, animación, hoja |  |
| `effects/fx_crater_hielo.png` | Cráter ardiente: fuego y rocas al inicio, termina en brasas y humo. | Hoja de animación (cuadros iguales en rejilla). Versión hielo. · Usado en: Juego (impacto del meteorito) | 990×686 | efecto, crater, hielo, animación, hoja |  |
| `effects/fx_grietas_hielo.png` | Grietas doradas de energía en el suelo con una columna de luz. | Hoja de animación (cuadros iguales en rejilla). Versión hielo. · Usado en: Juego (impacto del meteorito) | 840×432 | efecto, grietas, hielo, animación, hoja |  |
| `effects/fx_grieta_cielo_hielo.png` | Grieta de luz que se abre en el cielo (4 cuadros). | Hoja de animación (cuadros iguales en rejilla). Versión hielo. · Usado en: Juego (impacto del meteorito) | 800×534 | efecto, grieta cielo, hielo, animación, hoja |  |
| `effects/explosion_magia_a.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, magia, animación, hoja |  |
| `effects/explosion_magia_b.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×658 · 6 cuadros | explosión, impacto, meteorito, magia, animación, hoja |  |
| `effects/explosion_magia_c.png` | Explosión cartoon de 6 cuadros: destello, anillo con polvo, estallido con rocas, humo y polvo que se disipa. | Hoja 3×2 (6 cuadros). Se reproduce al caer un poder. Fuego = original; hielo y magia son versiones recoloreadas por código. · Usado en: Juego (impacto del meteorito) | 1152×726 · 6 cuadros | explosión, impacto, meteorito, magia, animación, hoja |  |
| `effects/fx_anillos_magia.png` | Anillos de energía que se expanden en el suelo, con rocas. | Hoja de animación (cuadros iguales en rejilla). Versión magia. · Usado en: Juego (impacto del meteorito) | 1020×364 | efecto, anillos, magia, animación, hoja |  |
| `effects/fx_brasas_magia.png` | Brasas, chispas y estrellitas que salen despedidas. | Hoja de animación (cuadros iguales en rejilla). Versión magia. · Usado en: Juego (impacto del meteorito) | 900×592 | efecto, brasas, magia, animación, hoja |  |
| `effects/fx_crater_magia.png` | Cráter ardiente: fuego y rocas al inicio, termina en brasas y humo. | Hoja de animación (cuadros iguales en rejilla). Versión magia. · Usado en: Juego (impacto del meteorito) | 990×686 | efecto, crater, magia, animación, hoja |  |
| `effects/fx_grietas_magia.png` | Grietas doradas de energía en el suelo con una columna de luz. | Hoja de animación (cuadros iguales en rejilla). Versión magia. · Usado en: Juego (impacto del meteorito) | 840×432 | efecto, grietas, magia, animación, hoja |  |
| `effects/fx_grieta_cielo_magia.png` | Grieta de luz que se abre en el cielo (4 cuadros). | Hoja de animación (cuadros iguales en rejilla). Versión magia. · Usado en: Juego (impacto del meteorito) | 800×534 | efecto, grieta cielo, magia, animación, hoja |  |
| `effects/fx_haz.png` | Columna de luz que sube con salpicaduras en la base y se disuelve en volutas. En grises. | Se tiñe con el color del poder y se mezcla con "lighter". Al aterrizar y al recoger. · Usado en: Juego (poderes) | 780×934 | haz, luz, columna, tintable, animación |  |
| `effects/fx_humo.png` | Nube de humo gris oscuro que sube y se deshace (6 cuadros). | Humo de impactos, explosiones, cráteres. · Usado en: Juego (impacto del meteorito) | 900×726 | humo, efecto, animación |  |
| `effects/fx_rocas.png` | Rocas oscuras con vetas naranjas que se separan (6 cuadros; halo blanco original eliminado). | Escombros de explosiones. · Usado en: Juego (impacto del meteorito) | 900×552 | rocas, escombros, efecto, animación |  |
| `effects/meteoro_cabeza.png` | Roca incandescente envuelta en llamas con su cola, vista de lado, avanzando abajo-izquierda. | Cuerpo del meteorito; se gira hacia donde se mueve. · Usado en: Juego (poderes que caen) | 560×380 | meteorito, fuego, roca |  |
| `effects/meteoro_estela.png` | Cola de fuego horizontal con cabeza blanco-amarilla a la derecha. | Estela detrás del meteorito (cabeza a la derecha). · Usado en: Juego (poderes que caen) | 1100×352 | estela, fuego, cometa |  |

## Escenario · islas flotantes

Islas `isla_101` a `isla_115` (hoja 1) e `isla_201` a `isla_215` (hoja 2). Cada una es una isla flotante con contorno oscuro y fondo transparente. `environment/platforms/islands/islas.js` guarda la fila de la superficie de cada una. Etiquetas: isla, plataforma, escenario.

## Escenario · Nivel 1

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `environment/levels/nivel1/n1_bg_montanas_lejos.png` | Cordillera azul y lila con pinos verdes y niebla; repetible sin costura; base difuminada. | Fondo con parallax del Nivel 1 (dos capas). · Usado en: Juego (Nivel 1) | 2141×401 | montañas, fondo, parallax, nivel 1 |  |
| `environment/levels/nivel1/nubes/nube_01.png` | Gran nube rosa, amarilla y morada con contorno fino. | Nubes con movimiento independiente (se añaden más en nubes.js). · Usado en: Juego (Nivel 1) | 1100×378 | nube, cielo, nivel 1 |  |

## Escenario · fondos por tema

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `environment/backgrounds/themes/montanas_desert.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: dunas y picos en naranja, arena y crema. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema desierto. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, desert, repetible |  |
| `environment/backgrounds/themes/montanas_night.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: siluetas azul marino y violeta con niebla clara. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema noche. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, night, repetible |  |
| `environment/backgrounds/themes/montanas_jungle.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: cerros verdes con neblina verde claro. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema selva. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, jungle, repetible |  |
| `environment/backgrounds/themes/montanas_water.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: picos azul profundo y turquesa con bruma celeste. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema agua. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, water, repetible |  |
| `environment/backgrounds/themes/montanas_lava.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: roca casi negra con vetas rojas y cumbres naranjas. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema lava / infierno. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, lava, repetible |  |
| `environment/backgrounds/themes/montanas_storm.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: gris azulado oscuro, picos grises claros. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema tormenta. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, storm, repetible |  |
| `environment/backgrounds/themes/montanas_ice.png` | Cordillera repetible sin costura (misma silueta del Nivel 1) recoloreada: azul real y celeste con cumbres blancas. Fondo transparente, base difuminada en niebla. | Capa de montañas con parallax (dos capas a distinta velocidad) del tema hielo. Se tiñe por mapeo de luminosidad a una paleta de 3 colores. · Usado en: Juego (fondos por tema: engine/escenario/fondos-tema.js) | 2141×401 | montañas, fondo, parallax, tema, ice, repetible |  |

## Personajes · sprites

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `characters/sakura/` | Carpeta con las animaciones de Sakura: idle (6), run (14), run2 (8), sprint (5), jump (4), atk (7), hurt (5), death (6), crouch, extra. manifest.js trae anclas y escalas. | Animación del héroe en el juego. · Usado en: Juego (hero-pro.js) | — | sakura, héroe, sprites, animación |  |
| `characters/kage/` | Carpeta con las animaciones de Kage: idle (6), run (15), atk (6), hurt (6), death (6). manifest.js trae anclas y escalas. | Animación del héroe en el juego. · Usado en: Juego (hero-pro.js) | — | kage, héroe, sprites, animación |  |
| `characters/villain/` | Jefe final: ciclo de caminar de 25 cuadros con manifest.js. | Jefe del juego. · Usado en: Juego (jefe final) | — | jefe, villano, sprites |  |

## Personajes · ilustraciones

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `ui/select/sakura_3.png` | Ilustración de cuerpo completo en pose de combate: select/sakura_1-3.png y select/kage_1-3.png. | Pantalla de elegir personaje (se elige con ?sel=1|2|3). · Usado en: Juego (selección de personaje) | 398×560 | sakura, kage, ilustración, selección |  |
| `ui/intro/villain.png` | Ilustración del villano para la introducción (acto 2). | Introducción del juego. · Usado en: Juego (intro) | — | villano, intro, ilustración |  |

## App

| Archivo | Qué es | Para qué sirve | Tamaño | Etiquetas | Nota |
|---|---|---|---|---|---|
| `icons/icon-512.png` | Busto de Sakura sobre fondo morado oscuro, para instalar el juego en el teléfono. | manifest.json (instalar en pantalla de inicio). · Usado en: manifest.json | 512×512 | icono, app, manifest |  |
