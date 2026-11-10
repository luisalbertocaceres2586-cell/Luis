# Nivel 1 · Prompts para ChatGPT (6 hojas × 10 imágenes)

Cada archivo de la carpeta `prompts/` ya trae TODO junto (instrucciones generales + la lista de las 10 piezas), listo para copiar y pegar en ChatGPT. Aquí está el resumen y la guía de uso.

## Cómo usarlos

1. Abre **un chat nuevo** en ChatGPT y genera las hojas **en ese mismo chat, una tras otra** (así mantiene el mismo estilo). Si ves que cambia de estilo, vuelve a pegar el bloque general.
2. Pega el contenido de `prompts/hoja1_terreno.txt`. Pide la imagen. Cuando salga bien, guárdala con el nombre `hoja1_terreno.png` (sin comprimir, descargada como PNG).
3. Repite con las hojas 2 a 6.
4. Súbeme las 6 hojas aquí en el chat. Yo las recorto, quito el fondo, las nombro y las ordeno en `assets/nivel1/`.

## Por qué fondo magenta y no "transparente"
Las imágenes con "fondo transparente" que genera ChatGPT a veces vienen con el cuadriculado PINTADO (ya pasó con el HUD). Un fondo **magenta plano #FF00FF** se elimina de forma limpia y exacta con código, incluso en bordes finos como hojas o cuerdas. Si ChatGPT te da un PNG con transparencia real, también sirve: súbelo tal cual.

## Qué revisar antes de aceptar una hoja
- Fondo magenta 100 % plano (sin degradado, sin suelo, sin sombra).
- 10 piezas separadas, con espacio entre ellas, sin letras ni números.
- Las piezas "gemelas" (apagado/encendido, cerrado/abierto, reposo/ataque) son el mismo diseño.
- Si ChatGPT entrega otro tamaño (por ejemplo 1024×1024), no pasa nada: dime qué tamaño te dio.
- Si una pieza sale mal, no rehagas toda la hoja: pídele solo esa pieza otra vez con el mismo estilo y fondo, y súbela aparte.

## Resumen de las 6 hojas

### Hoja 1 — Terreno y plataformas
Formato: 1024×1536 vertical · 2 col × 5 filas · archivo de prompt: `prompts/hoja1_terreno.txt` · carpeta destino: `assets/nivel1/terreno/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `suelo_bosque.png` | Suelo del bosque de bambú | Acto 1: suelo principal del bosque. |
| 2 | `suelo_cueva.png` | Suelo de la cueva | Acto 2: suelo de la cueva oscura. |
| 3 | `suelo_azotea.png` | Cumbrera de tejado japonés | Acto 5: tejados al atardecer. |
| 4 | `puente_cuerda.png` | Puente de cuerda y bambú | Acto 1: puentes sobre barrancos. |
| 5 | `plataforma_bambu.png` | Plataforma de bambú atado | Acto 1: plataformas flotantes de salto. |
| 6 | `plataforma_piedra_toro.png` | Plataforma de piedra con linterna | Acto 1 y 2: plataformas de descanso. |
| 7 | `roca_cueva_flotante.png` | Roca flotante de cueva | Acto 2: plataformas en la cueva. |
| 8 | `viga_torre.png` | Viga de madera de la torre | Acto 3: plataformas de la torre vertical. |
| 9 | `alero_tejas.png` | Alero de tejado | Actos 3 y 5: plataformas de tejado. |
| 10 | `kunai_trampa.png` | Trampa de kunai clavados | Trampa de suelo en todos los actos (reemplaza los pinchos). |

### Hoja 2 — Decorado, puertas y portales
Formato: 1536×1024 horizontal · 5 col × 2 filas · archivo de prompt: `prompts/hoja2_decorado.txt` · carpeta destino: `assets/nivel1/decorado/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `torii_inactivo.png` | Torii apagado (checkpoint inactivo) | Punto de control sin activar. |
| 2 | `torii_activo.png` | Torii encendido (checkpoint activo) | Punto de control activado. |
| 3 | `puerta_santuario_cerrada.png` | Portón del santuario cerrado | Meta del nivel: puerta cerrada (antes del jefe). |
| 4 | `puerta_santuario_abierta.png` | Portón del santuario abierto | Meta del nivel: puerta abierta. |
| 5 | `toro_piedra.png` | Linterna de piedra grande | Decorado en todos los actos. |
| 6 | `bambu_primer_plano.png` | Macizo de bambú | Acto 1: decorado en primer plano. |
| 7 | `estatua_kitsune.png` | Estatua de zorro kitsune | Decorado de santuario y checkpoint. |
| 8 | `pilar_rojo.png` | Pilar de templo | Acto 3: paredes y estructura de la torre. |
| 9 | `estandarte_colgante.png` | Estandarte colgante | Acto 3 y 7: decorado de la torre y del santuario. |
| 10 | `shoji.png` | Panel shoji | Acto 3: fondo de la torre y puertas de respuesta. |

### Hoja 3 — Cueva oscura y luz
Formato: 1536×1024 horizontal · 5 col × 2 filas · archivo de prompt: `prompts/hoja3_cueva.txt` · carpeta destino: `assets/nivel1/cueva/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `antorcha_pared_apagada.png` | Antorcha de pared apagada | Acto 2: antorchas que el jugador enciende. |
| 2 | `antorcha_pared_encendida.png` | Antorcha de pared encendida | Acto 2: antorcha encendida. |
| 3 | `antorcha_mano.png` | Antorcha de mano | Acto 2: la antorcha que lleva el héroe. |
| 4 | `estalactita_grande.png` | Estalactitas grandes | Acto 2 y 6: techo de la cueva y obstáculo del dragón. |
| 5 | `cristales_azules.png` | Cristales azules luminosos | Acto 2: pequeñas fuentes de luz. |
| 6 | `hongos_luminosos.png` | Hongos luminosos | Acto 2: fuentes de luz y decorado. |
| 7 | `farol_papel_apagado.png` | Farol de papel apagado | Acto 2 y 6: farol con la respuesta, apagado. |
| 8 | `farol_papel_encendido.png` | Farol de papel encendido | Acto 2 y 6: farol con la respuesta correcta. |
| 9 | `telarana.png` | Telaraña de esquina | Acto 2: obstáculo que frena al héroe. |
| 10 | `boca_cueva.png` | Boca de cueva | Transición del acto 1 al acto 2. |

### Hoja 4 — Enemigos y perseguidores
Formato: 1536×1024 horizontal · 5 col × 2 filas · archivo de prompt: `prompts/hoja4_enemigos.txt` · carpeta destino: `assets/nivel1/enemigos/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `ninja_sombra.png` | Ninja sombra (enemigo básico) | Acto 1: enemigo común que patrulla. |
| 2 | `ninja_sombra_ataque.png` | Ninja sombra atacando | Animación de ataque del enemigo común. |
| 3 | `murcielago.png` | Murciélago de cueva | Acto 2: vuela a oscuras, solo se ve cerca de la luz. |
| 4 | `arana_colgante.png` | Araña colgante | Acto 2: cuelga del techo y cae al acercarte. |
| 5 | `guardia_piedra.png` | Guardia de piedra | Acto 4: enemigo con escudo que solo cae con la embestida. |
| 6 | `tengu_cuervo.png` | Cuervo tengu | Actos 3, 5 y 6: enemigo volador y obstáculo del dragón. |
| 7 | `espiritu_fuego_fatuo.png` | Espíritu de fuego fatuo | Acto 2: espíritu que sigue la luz. |
| 8 | `roca_gigante.png` | Roca gigante rodante | Acto 5: persigue al héroe. |
| 9 | `sombra_perseguidora.png` | Sombra perseguidora | Acto 5: persigue desde la derecha mientras el héroe corre a la izquierda. |
| 10 | `oni_rojo_minijefe.png` | Oni rojo (mini jefe) | Mini jefe a mitad del nivel. |

### Hoja 5 — Héroe con Armadura Samurái Dorada
Formato: 1536×1024 horizontal · 5 col × 2 filas · archivo de prompt: `prompts/hoja5_heroe_armadura.txt` · carpeta destino: `assets/nivel1/heroe_armadura/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `armadura_idle.png` | En guardia (quieto) | Animación de reposo. |
| 2 | `armadura_run_1.png` | Correr 1 | Animación de correr (4 fotogramas). |
| 3 | `armadura_run_2.png` | Correr 2 | Animación de correr. |
| 4 | `armadura_run_3.png` | Correr 3 | Animación de correr. |
| 5 | `armadura_run_4.png` | Correr 4 | Animación de correr. |
| 6 | `armadura_salto.png` | Salto (subiendo) | Animación de salto. |
| 7 | `armadura_caida.png` | Caída | Animación de caída. |
| 8 | `armadura_embestida.png` | Embestida con el hombro | Habilidad principal de la armadura: rompe sellos y escudos. |
| 9 | `armadura_golpe.png` | Golpe recibido | Animación de daño. |
| 10 | `armadura_casco_icono.png` | Icono del casco | Icono de HUD: indica que la armadura está puesta. |

### Hoja 6 — Objetos, jefe final y dragón de papel
Formato: 1536×1024 horizontal · 5 col × 2 filas · archivo de prompt: `prompts/hoja6_items_jefe.txt` · carpeta destino: `assets/nivel1/items_jefe/`

| # | Archivo final | Qué es | Para qué sirve |
|---|---|---|---|
| 1 | `pergamino.png` | Pergamino ninja | Objeto coleccionable de todo el nivel. |
| 2 | `cofre_cerrado.png` | Cofre del maestro cerrado | Acto 4: cofre donde está la armadura. |
| 3 | `cofre_abierto.png` | Cofre del maestro abierto | Acto 4: cofre abierto. |
| 4 | `onigiri_curacion.png` | Onigiri de curación | Objeto que recupera vida. |
| 5 | `tambor_taiko.png` | Tambor taiko | Trampolín que lanza al héroe hacia arriba. |
| 6 | `sello_piedra.png` | Sello de piedra rompible | Bloquea el paso hasta que la armadura lo rompe. |
| 7 | `dragon_papel.png` | Dragón de papel | Acto 6: la montura del tramo de vuelo. |
| 8 | `oni_guardian_reposo.png` | Oni Guardián (reposo) | Acto 7: jefe final, esperando. |
| 9 | `oni_guardian_ataque.png` | Oni Guardián (ataque) | Acto 7: animación de ataque del jefe. |
| 10 | `orbe_energia.png` | Orbe de energía | Acto 7: proyectil del jefe con una multiplicación. |
