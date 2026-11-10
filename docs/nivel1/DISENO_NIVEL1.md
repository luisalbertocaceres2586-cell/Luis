# Rediseño del Nivel 1 — "La Senda del Aprendiz Ninja"

Documento de diseño. Tabla que se practica en este nivel: **la del 2** (se mantiene el objetivo educativo; cambia por completo la forma de jugarlo).

---

## 1. Diagnóstico: qué hay hoy y por qué se siente monótono

Esto es lo que encontré al leer el repositorio (`index.html` + `engine/` + `assets/`):

- **Un solo molde para todo.** Los 10 niveles usan el mismo motor: caminar a la derecha, saltar, tocar un enemigo, resolver una pregunta y llegar a la puerta. Lo único que cambia entre niveles es el fondo, algo de física (hielo, agua, selva) y la lista de plataformas.
- **El Nivel 1 mide 5600 px** y su suelo es una repetición de 3 alturas de "mesa" más 7 tiras de pinchos y 5 plataformas sueltas. 15 preguntas. Un estudiante rápido lo termina en pocos minutos.
- **Lo que aún se siente a Mario:** tuberías (`pipes`, y el módulo `engine/secretos/tuberia-secreta.js`), monedas y enemigos que se pisan, el héroe interno llamado `mario` con un sprite incrustado, el texto "GEOMARIO DASH" y la pradera verde.
- **Ya existe algo valioso para reutilizar:** un modo tipo Geometry Dash con carriles de respuesta (`gdInit`, `_gdLanes`), preguntas de varios formatos (clásica, secuencia, encuentra el error, el mayor), checkpoints a mitad de nivel, mini-jefe, jefe con cinemática, poderes y un HUD ninja ya rediseñado. Los héroes Sakura y Kage ya son ninjas con animaciones completas.
- **Peso:** `index.html` pesa 9.5 MB y cerca del **75 %** (≈ 7.1 MB) son imágenes incrustadas en texto (base64). Esa es la razón del peso, no la lógica del juego.

## 2. Concepto

El Nivel 1 deja de ser "un pasillo" y pasa a ser **un viaje de siete actos** por un mundo ninja. En cada acto cambia **la cámara, la dirección, la visibilidad o las reglas**, de modo que el jugador nunca pueda "ponerse en piloto automático". Duración objetivo: **15 a 20 minutos** (hoy: unos 3 a 5).

La historia, en una línea: *el aprendiz sube por el bosque, la cueva y la torre hasta el santuario, recoge una armadura legendaria, huye por los tejados, vuela en un dragón de papel y se enfrenta al Oni Guardián para abrir el portón.*

## 3. Los 7 actos

| # | Acto | Dirección / cámara | Qué cambia (la dinámica) | Preguntas |
|---|---|---|---|---|
| 1 | **Bosque de Bambú al Amanecer** | → horizontal | Aprendizaje. Puentes de cuerda, plataformas de bambú, tambor taiko-trampolín, trampas de kunai, ninjas sombra que patrullan. Al final, la boca de la cueva. | 5 |
| 2 | **Cueva de las Luciérnagas** | → horizontal, **a oscuras** | Solo se ve un círculo alrededor de la antorcha del héroe. Murciélagos, arañas y espíritus solo aparecen dentro de la luz (sus ojos brillan antes). Hay que **encender los faroles** con la respuesta correcta para revelar el camino. Fallar apaga el farol y **encoge la luz** (no quita vida directamente). | 6 |
| 3 | **Torre del Dojo** | **↑ vertical** | La cámara sube. Saltos de pared entre muros, una ola de sombra que sube desde abajo (presión de tiempo). En cada rellano hay 3 puertas shoji con una respuesta cada una: la correcta abre un atajo, la incorrecta suelta una trampa. | 5 |
| 4 | **Armería del Maestro** | → corto, **cambio de ropa** | El héroe abre un cofre y se pone la **Armadura Samurái Dorada** (cambia su sprite). Habilidades: absorbe 2 golpes, **embestida** que rompe sellos de piedra y escudos; a cambio es más lento y salta menos. Guardias de piedra solo caen con la embestida. | 4 |
| 5 | **Tejados al Atardecer** | **← de derecha a izquierda** | El nivel se recorre al revés. Una **roca gigante / sombra perseguidora** entra por la derecha y empuja al jugador (auto-avance). Se corre por cumbreras, aleros y saltos sobre abismos; las respuestas son tejas con número en distintas alturas. | 5 |
| 6 | **Vuelo del Dragón de Papel** | → auto-scroll, **estilo Geometry Dash (modo nave)** | La armadura queda atrás (el dragón no soporta el peso) y se monta un dragón de papel: **mantener = subir, soltar = bajar**. Esquivar estalactitas, bambúes y cuervos; pasar por el **farol con la respuesta correcta** (3 alturas). Checkpoints por tramo, no desde cero. | 6 |
| 7 | **Santuario del Oni Guardián** | Arena de jefe | Jefe de 3 fases que lanza **orbes con multiplicaciones**: golpear el orbe con la respuesta correcta lo devuelve al jefe. Fase 2: luces intermitentes. Fase 3: el suelo se rompe en islas. Al vencerlo se abre el portón → Nivel 2. | 5 |

**Total: 36 preguntas** de la tabla del 2 (hoy 15), con los 4 formatos de pregunta que ya existen repartidos según el acto (clásica en el 1 y el 7; secuencia en la cueva; "encuentra el error" en la torre; "el mayor" en el dragón).

### Qué otras cosas se vuelven "retos" (no solo caminar y saltar)

- **Objeto que cambia las reglas:** la armadura (acto 4). Y la antorcha en el acto 2, que es a la vez herramienta y recurso limitado.
- **Mini-jefe a mitad del nivel:** Oni rojo, entre el acto 3 y 4 (ya existe el mecanismo de mini-jefe; solo se reviste).
- **Secretos:** reemplazar la tubería secreta por una **puerta shoji secreta** o un **tronco hueco** (misma sala del tesoro).
- **Puntuación de dominio:** estrellas por acto según vidas perdidas y respuestas sin error; el que quiera puede repetir un acto suelto.

## 4. Cómo se programa (para que el juego no se ponga lento)

Principios: **no tocar el motor de los otros 9 niveles** y **no engordar `index.html`**.

1. **Un "director de actos"** nuevo en `engine/nivel1/` (archivos separados, cargados con `<script>` como ya se hace con los módulos de `engine/`). Es una pequeña máquina de estados: sabe en qué acto está, carga lo que ese acto necesita, lo descarga al terminar y hace una transición (pincelada de tinta) entre actos.
2. **Cada acto = un "modo"** con su propia lógica de actualización y dibujo:
   - `horizontal` (actos 1, 4): reutiliza el motor actual con plataformas nuevas.
   - `oscuro` (acto 2): se dibuja el mundo y encima una capa de oscuridad con un recorte circular de luz alrededor del héroe; el radio de luz baja cuando se falla.
   - `vertical` (acto 3): cámara en Y, saltos de pared (con "coyote time" y "jump buffer" para que se sienta preciso), ola de sombra ascendente.
   - `reversa` (acto 5): cámara y HUD invertidos, perseguidor entrando por la derecha.
   - `dragon` (acto 6): se reutiliza y se amplía el modo Geometry Dash existente (`gdInit`, carriles de respuesta) con control de nave.
   - `jefe` (acto 7): reutiliza el sistema de jefe y su cinemática.
3. **Cambio de ropa:** un componente `armadura` que sustituye los fotogramas del héroe por los de `assets/nivel1/heroe_armadura/` mientras esté puesta y añade sus habilidades. Sakura y Kage comparten el disfraz (el casco y la máscara cubren la cara).
4. **Imágenes fuera del `index.html`:** todo el arte nuevo va en `assets/nivel1/<carpeta>/` y se carga **por acto** (precarga del siguiente mientras se juega el actual). Así el nivel puede ser larguísimo sin aumentar la descarga inicial.
5. **Rendimiento:** el nivel 1 se define con datos (listas de plataformas, enemigos y preguntas por acto), no con código repetido. Se respetan los interruptores de rendimiento que ya existen (`_perfMode`, `FX.q`).
6. **Fase aparte, opcional y con cuidado:** mover del `index.html` las imágenes base64 viejas (≈ 7 MB) a archivos para que el juego cargue mucho más rápido. No lo haré sin avisarte, porque toca todos los niveles.

## 5. Lo que se elimina o reemplaza en el Nivel 1

| Hoy | Nuevo (tema ninja) |
|---|---|
| Tuberías verdes | Torii, linternas de piedra, pilares de templo, troncos de bambú |
| Pinchos de suelo | Franjas de kunai clavados |
| Pradera verde | Bosque de bambú al amanecer |
| Plataformas de césped | Puentes de cuerda, bambú atado, piedra con linterna, aleros de tejado |
| Tubería secreta | Puerta shoji secreta |
| Texto "GEOMARIO DASH" (en este nivel) | "Vuelo del Dragón de Papel" |
| Sprite `mario` | Los héroes ninja (Sakura / Kage) + Armadura Samurái |

## 6. Arte nuevo que se necesita (6 hojas × 10 piezas)

Se genera en ChatGPT con los prompts de `docs/nivel1/prompts/` (ver `PROMPTS_HOJAS.md`). Lo que ya existe y se reutiliza: héroes y villano, HUD completo, poderes, efectos de impacto, nubes y sol del cielo, montañas del Nivel 1.

| Hoja | Contenido | Carpeta destino |
|---|---|---|
| 1 | Terreno y plataformas (10 piezas anchas) | `assets/nivel1/terreno/` |
| 2 | Decorado, puertas y portales | `assets/nivel1/decorado/` |
| 3 | Cueva oscura y luz | `assets/nivel1/cueva/` |
| 4 | Enemigos y perseguidores | `assets/nivel1/enemigos/` |
| 5 | Héroe con Armadura Samurái Dorada (10 poses) | `assets/nivel1/heroe_armadura/` |
| 6 | Objetos, jefe final y dragón de papel | `assets/nivel1/items_jefe/` |

Los fondos grandes (panorámicas) no van en hojas porque en una hoja de 10 quedarían pequeños y borrosos: las capas de fondo se componen con degradados dibujados por código, el cielo, sol, nubes y montañas que ya existen, y las piezas de las hojas. Si al verlo en pantalla hace falta una panorámica grande, se pide aparte.

## 7. Plan de trabajo por fases

| Fase | Qué se hace | Necesita imágenes |
|---|---|---|
| 0 | Carpetas, catálogo y prompts (hecho en esta rama) | No |
| 1 | Director de actos, transiciones, carga por acto, nivel definido con datos | No (se prueba con recuadros de color) |
| 2 | Acto 1 (bosque) y retirar tuberías del Nivel 1 | Hojas 1 y 2 |
| 3 | Acto 2 (cueva a oscuras) | Hoja 3 y enemigos de la hoja 4 |
| 4 | Acto 3 (torre vertical) | Hojas 1, 2 y 4 |
| 5 | Acto 4 (armadura) y mini-jefe | Hojas 5 y 6 |
| 6 | Acto 5 (tejados en reversa) | Hojas 1 y 4 |
| 7 | Acto 6 (dragón) | Hoja 6 |
| 8 | Acto 7 (jefe) y cierre del nivel | Hoja 6 |
| 9 | Equilibrio de dificultad, pulido, rendimiento | — |

Las fases 1 y las partes de lógica de cada acto se pueden avanzar **mientras generas las imágenes**, usando recuadros de color como relleno y sustituyéndolos después por el arte final.

## 8. Decisiones que me ayudan a afinar

1. ¿Los estudiantes juegan sobre todo en **computador (teclado)** o en **teléfono/tablet (táctil)**? El vuelo del dragón y la embestida se diseñan distinto para cada uno.
2. ¿Quieres que los **actos se puedan repetir por separado** desde el selector de niveles (útil para practicar)?
3. ¿Preferirías que **fallar una pregunta** quite vida (como ahora) o que tenga consecuencias propias de cada acto (apagar luz, caer un piso, etc.)? La propuesta usa lo segundo en la cueva y la torre.
4. ¿El Nivel 1 debe seguir siendo "fácil" para introducir el juego, o ya lo quieres retador desde el primer acto? La propuesta: acto 1 suave, subida de dificultad progresiva hasta el jefe.
