# Nivel 1 · Diseño v2 — "La Senda del Aprendiz Ninja" (rejugable, con decisiones)

Sustituye la parte de actos fijos de `DISENO_NIVEL1.md`. Se mantienen los actos y el arte; cambia **cómo se recorren** y **cómo se responde**.

## 1. Qué cambia respecto a la v1

| Antes (v1) | Ahora (v2) |
|---|---|
| 7 actos en orden fijo | **7 etapas con decisiones**: en cada una eliges entre 2 actos. Los actos disponibles, el jefe y los premios dependen de lo que elegiste |
| Misma partida cada vez | Cada intento sortea una **semilla**: cambia qué actos se ofrecen, su variante y sus parámetros. Misma semilla + mismas decisiones = mismo nivel (por eso se puede guardar y continuar) |
| Pregunta en cuadro con 4 opciones | **Acertijos del mundo**: romper el bloque correcto, empujar una carreta, encender un farol, lanzar el shuriken, saltar a la piedra que sigue la cuenta, girar ruedas, equilibrar una balanza, contar luciérnagas |
| Todos los estudiantes ven lo mismo | **Adaptativo**: se registra qué hechos (2×7…) falla cada estudiante y aparecen más seguido, sin repetir los que acaba de ver |
| Un solo guardado para todo el computador | **Perfiles**: nombre + avatar + dispositivo + progreso por jugador; exportar/importar con un código |
| Nivel de 3–5 min | **25–46 min** (≈ 35 de media) según el camino |

## 2. El árbol de decisiones

Etapa 1 es fija (Bosque de Bambú). Etapa 7 es fija (el jefe). En las etapas 2 a 6 se ofrecen 2 actos distintos, sacados de una lista por etapa y sin repetir los ya jugados:

| Etapa | Puede ofrecer |
|---|---|
| 2 | Cueva de las Luciérnagas · Dojo de las Pruebas · Jardín de los Zorros |
| 3 | Torre del Dojo · Mercado Nocturno · Jardín de los Zorros · Dojo de las Pruebas |
| 4 | Armería del Maestro (casi siempre) · Mercado · Dojo · Torre |
| 5 | Tejados al Atardecer · Vuelo del Dragón · Torre · Cueva |
| 6 | Dragón · Tejados · **Portal Azul** (solo si antes pasaste por el Dojo o el Jardín) · Jardín · Mercado |

Cada acto otorga una **bandera** (antorcha, armadura, aliado mercader, bendición del zorro, llave del portal…). El jefe se arma con esas banderas:
- con **armadura** puedes embestir; con **antorcha** la fase oscura es más fácil; con el **mercader** aparece un escudo aliado; con la **bendición** se perdona un error; con la **llave del portal** el jefe tiene una cuarta fase.
- el patrón de ataques (martillo, orbes u ondas) cambia según el camino.

Se probó con 300 semillas simuladas: siempre empieza en el bosque y termina en el jefe, nunca repite acto, cada decisión ofrece 2 actos distintos, y hay decenas de rutas diferentes.

## 3. Acertijos del mundo (cómo se responde sin cuadro de opciones)

| Mecánica | Qué hace el estudiante | Arte que usa |
|---|---|---|
| `romper_bloques` | Golpea el bloque con la respuesta; los demás explotan | `sello_piedra` |
| `empujar_carreta` | Empuja la carreta hasta la plataforma con el resultado | `carreta_madera` |
| `encender_farol` | Toca el farol correcto; si falla se apaga y la luz se encoge | `farol_papel_apagado/encendido`, `antorcha_*` |
| `diana` | Lanza el shuriken a la diana correcta | `shuriken_espiritual` |
| `piedras` | Salta a la piedra que sigue la cuenta de 2 en 2 (la otra se desmorona) | `plataforma_piedra_toro`, `roca_cueva_flotante` |
| `dial` | Gira ruedas hasta formar el número | `puerta_santuario_cerrada` |
| `balanza` | Arrastra pesas (cada una vale 2) hasta equilibrar: ¿cuántas hacen falta? | `tambor_taiko`, `cofre_*` |
| `luciernagas` | Cuenta los grupos de luciérnagas y toca el total (multiplicar como grupos) | `hongos_luminosos`, `espiritu_fuego_fatuo` |

Tipos de pregunta que se mezclan (todos refuerzan la tabla y matemáticas básicas): producto (2×7), factor que falta (2×?=14), sumar repetido (7 veces 2), mitad (la mitad de 14), secuencia (2, 4, 6, ?).
Cada pregunta guarda su "hecho" (por ejemplo `2x7`) y si se acertó, para el modo adaptativo y para un futuro reporte para el profesor.

## 4. Perfiles, avatar, dispositivo y guardado

- Al pulsar **JUGAR** aparece "¿Quién juega?": elegir jugador existente (CONTINUAR / NUEVA / borrar) o crear uno: nombre, avatar (Sakura o Kage) y **dispositivo** (💻 computador o 📱 teléfono/tablet).
- El dispositivo queda en `window.NINJA_DEVICE` y en `<html data-dispositivo>` para que el motor del Nivel 1 use teclado (flechas/WASD) o controles táctiles.
- El avance se guarda **por jugador** en `localStorage` cada vez que el juego guarda. Si hay varios estudiantes en el mismo computador, cada uno ve solo su partida.
- **Exportar / importar**: un código (`NINJA1.…`, con verificación de integridad) para llevar la partida a otro computador.
- Límite honesto: `localStorage` pertenece al navegador y al computador. Si borran los datos del navegador o cambian de equipo sin exportar, se pierde. Más adelante se puede añadir guardado en un archivo `.json` descargable o en un servidor.

## 5. Rendimiento (el `index.html` pesa 9.5 MB)

Medido: cerca del 75 % del `index.html` (≈ 7.1 MB) son imágenes incrustadas como texto base64. Plan, en este orden y sin tocar otros niveles hasta validarlo:
1. Todo lo nuevo del Nivel 1 va en archivos (`assets/nivel1/`, `engine/nivel1/`) y se carga **por acto**: ya hecho para el arte nuevo.
2. Extraer a archivos las imágenes base64 viejas (portales, sprites, HUD, paneles) y cargarlas bajo demanda con caché del navegador.
3. Tiras de animación (spritesheets) en vez de un archivo por cuadro, y descargar las del acto anterior.
4. Dibujar solo lo que se ve (descartar objetos fuera de cámara) y reutilizar capas estáticas en un canvas aparte.

## 6. Estado de la construcción

| Pieza | Estado |
|---|---|
| Arte (66 piezas + 6 animaciones recortadas, `tools/procesar_hojas.py`) | ✅ en `assets/nivel1/` |
| Perfiles, guardado, exportar/importar (`engine/nivel1/perfiles.js`) | ✅ probado |
| Pantalla "¿Quién juega?" conectada al menú (`perfil-ui.js`) | ✅ probada en navegador |
| Árbol de decisiones y semillas (`ruta.js`) | ✅ probado con 300 semillas |
| Generador de acertijos y maestría (`acertijos.js`) | ✅ probado |
| Generador del Acto 1 (`gen-bosque.js`): bosques distintos por semilla | ✅ 300 semillas verificadas |
| Motor del Nivel 1 (`motor.js`): física, enemigos, trampas, tambores, acertijos en el mundo, decisión final | ✅ Acto 1 jugable |
| Conexión con el menú: JUGAR abre el Nivel 1 nuevo; al terminar se puede seguir al Nivel 2 del juego anterior | ✅ probado de punta a punta |
| Actos 2–7, jefe y controles táctiles probados en teléfono real | ⏳ siguientes |

Pruebas: `node tests/nivel1.test.js` (19 pruebas) · navegador: `tests/navegador/`.


---

## 7. Actualización: Nivel 1 largo con cueva a oscuras (v3)

Respuesta a las pruebas con estudiantes: el nivel se pasaba en menos de un minuto, apuntar el shuriken a respuestas "una detrás de otra" fallaba y no se veía la cueva.

**Cómo se responde ahora (sin errores por tocar sin querer)**
- **Mantén F** para apuntar (el tiempo se vuelve lento), **← →** eligen la respuesta, **suelta F** y el shuriken va directo a la elegida, sin chocar con las demás. También se puede tocar/clicar la respuesta.
- El **tajo (C)** golpea solo UNA respuesta: la más cercana al héroe.
- Los faroles ya no se activan al rozarlos.
- **Tutoriales**: la primera vez que aparece cada cosa sale un cartel con las teclas dibujadas (mover, saltar, tajo, apuntar, tambor, carreta, palanca, viento, emboscada, roca, ritmo, cueva, antorchas, jefe, telarañas, sellos). Se guardan por jugador.

**El nivel**: 68–73 mil px, 16 acertijos y **unos 24–26 minutos estimados** (estimación por tipo de reto; falta medirla con estudiantes). Bosque de Bambú → Oni rojo (jefe) → Cueva de las Luciérnagas.
- **Retos del bosque (todos aparecen en cada partida):** tambores que lanzan en cadena, plataformas que se mueven, puentes de tablones que se caen, carreta que se empuja contra un muro, palanca que abre una reja, emboscada de 3 oleadas, roca gigante que persigue, kunai que suben y bajan a ritmo, sierras de shuriken, corriente de viento, pared de sellos con tesoro, ninjas que embisten, cuervos tengu.
- **Cueva:** oscuridad con tu antorcha (la luz se encoge con el tiempo y con cada error; se recarga en los puntos de control), murciélagos, arañas que caen del techo, fuegos fatuos que te siguen, estalactitas que se desploman, telarañas que frenan, hongos trampolín, y la **estación final: enciende 4 antorchas en el orden de la cuenta (2, 4, 6, 8…)**.
- **Acertijos (5 + 1):** faroles, sellos, dianas, piedras que se rompen, **carreta hasta la plataforma con el resultado** y las antorchas en orden.

**Qué se probó**: 22 pruebas automáticas (400 semillas válidas, todos los enemigos y retos presentes en cada nivel) y un robot jugador que completó 8 de 8 niveles de punta a punta, incluidos la emboscada y el jefe, y la ruta desde el menú real.

**Pendiente**: medir duración real con estudiantes, probar controles táctiles en un teléfono, afinar dificultad, y construir los actos siguientes.


---

## 8. Aligerar el `index.html` (hecho)

`tools/aligerar_index.py` sacó las 381 imágenes que estaban incrustadas como texto dentro de `index.html` y las guardó como archivos en `assets/embebidas/` (nombre = huella del contenido, sin duplicados). La función `_img()` ahora acepta una ruta de archivo además de base64.

| | Antes | Ahora |
|---|---|---|
| Tamaño de `index.html` | 9.3 MB | 0.47 MB |
| Tiempo hasta que la página es interactiva (equipo de pruebas) | 13.4 s | 0.7 s |
| Tiempo total de carga (equipo de pruebas) | 15.1 s | 7.6 s |

Verificado: las 374 imágenes extraídas son válidas, todas las rutas existen, los 21 portales, el marco del HUD y las tarjetas de héroe cargan, y no hay errores en la consola. **No se pudo comprobar** el arranque de los niveles 2 a 10 con capturas (el navegador de pruebas se cierra al iniciarlos, también con el archivo original), así que conviene jugar unos segundos de cada nivel. Si algo se ve mal, el cambio está en un solo commit y se puede revertir sin perder lo demás.
