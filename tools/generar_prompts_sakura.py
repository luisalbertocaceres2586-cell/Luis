#!/usr/bin/env python3
"""Genera el paquete de prompts de la NUEVA SAKURA: prompt general, hoja modelo, 13 hojas de movimientos,
el JSON de animaciones (para recortar y conectar al motor) y el plan de diseño."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{R}/docs/nivel1/sakura'; os.makedirs(OUT, exist_ok=True)

GENERAL = """PROMPT GENERAL · NUEVA SAKURA (válido para TODAS las hojas — léelo completo antes de dibujar)

PERSONAJE (debe ser IDÉNTICA en todas las hojas): Sakura, ninja chibi-anime de un videojuego 2D de plataformas. Proporciones chibi: cabeza grande (≈ 40 % de su altura), cuerpo compacto y ágil. Cabello negro brillante, voluminoso, recogido en una coleta alta y larga cuyas puntas se degradan a magenta; una flor rosa de 5 pétalos (centro amarillo) sujeta el cabello sobre la sien derecha. Ojos grandes y expresivos magenta/rosa con reflejos blancos. Máscara negra que cubre nariz y boca, con costura fina magenta. Piel clara cálida. Armadura ninja negra, brillante y segmentada (peto, hombreras, brazales, rodilleras, botas) con líneas luminosas magenta y detalles de metal gris plata para que se lea bien sobre fondos oscuros. Bufanda magenta larga de dos puntas que ondea siempre con retraso respecto al cuerpo, y un cinturón (obi) magenta. Arma: una katana de hoja con brillo de energía rosa, enfundada en la espalda cuando no la usa; shuriken grande de acero con filo plateado y centro magenta.

LEGIBILIDAD: contorno exterior azul marino #1A1230 limpio de 2 a 3 px y una fina luz de borde rosa claro #FFB3E6 en los bordes que miran arriba a la izquierda, para que la silueta se separe de fondos oscuros (cueva) y claros (bosque). Luz principal desde arriba a la izquierda.

PALETA: armadura #14101C y #2A2236; magenta #E8238F y #FF3DB8; rosa claro #FFB3E6; plata #B8BFD0; piel #F2C9A8; flor #FF7AC8 con centro #FFD54A; bufanda degradado #D81B8A → #FF5FC8; energía de la espada #FF6AD5; contorno #1A1230.

ESTILO: arte digital de altísima calidad, pintado a mano, nivel estudio de animación y juego móvil premium, coherente con un mundo de bosque de bambú, templos y cuevas con cristales. Siluetas claras, poses expresivas y ágiles. Nada de caricatura plana. No imites ninguna marca ni personaje conocido.

FONDO TRANSPARENTE REAL (OBLIGATORIO): entrega un PNG con canal alfa, transparente de verdad. PROHIBIDO fondo blanco, gris o negro, cuadros que simulan transparencia, degradados, suelo, sombras proyectadas, brillos o humo difuso que se salgan de la silueta. Si no puedes entregar transparencia real, avísame en lugar de dibujar cuadros.

FORMATO (CRÍTICO PARA QUE SE ANIME BIEN): imagen horizontal de 1536 × 1024 px (máxima resolución disponible en esa proporción), cuadrícula invisible de 5 columnas × 2 filas = 10 celdas del mismo tamaño (≈ 307 × 512 px), numeradas de izquierda a derecha y de arriba abajo. UN fotograma por celda.
· ESCALA IDÉNTICA en los 10 fotogramas: en pie, Sakura mide unos 330 px de alto (≈ 65 % de la celda). Deja aire a los lados para brazos, espada, cabello y bufanda. Nunca cambies el tamaño del personaje entre fotogramas.
· LÍNEA BASE: en los fotogramas con los pies en el suelo, las suelas tocan siempre la misma línea horizontal, a 440 px desde el borde superior de la celda (≈ 86 % del alto). El centro del cuerpo (la cadera) queda en el centro horizontal de la celda. En los fotogramas aéreos, conserva la misma escala y mantén el centro del cuerpo cerca del centro de la celda.
· Deja al menos 25 px libres a cada lado dentro de la celda; ningún fotograma toca el borde ni a otro fotograma. No recortes ninguna parte.
· Todos los fotogramas miran a la DERECHA, de perfil (como un juego de scroll lateral).
· Los fotogramas de una misma animación deben ser una secuencia fluida: cada uno es el paso natural entre el anterior y el siguiente (anticipación, acción, continuación, recuperación; cabello y bufanda con retraso). No repitas el mismo dibujo.
· NO dibujes en estas hojas las estelas de velocidad, arcos de corte, polvo ni destellos de impacto (van en las hojas de efectos). Solo el personaje, con el brillo suave de su espada dentro de la silueta.

SIN TEXTO: ninguna letra, número, palabra, símbolo escrito, marca de agua, línea de cuadrícula ni etiqueta.

REFERENCIAS: adjunta la HOJA MODELO de Sakura (hoja 0) y, si ya existen, las hojas anteriores. Copia exactamente su diseño, colores y proporciones.
"""

MODELO = """HOJA 0 — HOJA MODELO DE SAKURA (referencia; NO se recorta, solo sirve para que todas las demás hojas sean idénticas)

Imagen horizontal de 1536 × 1024 px con FONDO TRANSPARENTE REAL (PNG con canal alfa, sin cuadros, sin blanco). Una hoja de diseño de personaje de Sakura con 6 elementos bien separados:
1. Sakura de cuerpo completo VISTA DE FRENTE, de pie, relajada, brazos a los lados (altura ≈ 560 px).
2. Sakura de cuerpo completo DE PERFIL mirando a la DERECHA, de pie (misma altura): es la pose de referencia para todas las animaciones.
3. Sakura de cuerpo completo VISTA DE ESPALDA con la katana enfundada en la espalda y la coleta visible.
4. Busto (cabeza y hombros) en tres cuartos, con expresión valiente y ojos grandes.
5. La katana desenvainada con el brillo de energía rosa, y el shuriken grande, objetos sueltos.
6. Seis cuadrados de color (sin texto) con la paleta: negro armadura, magenta, rosa claro, plata, piel, rosa de la flor.
Mismo estilo, paleta y detalles que el PROMPT GENERAL. Sin texto ni letras.
"""

# (slug, descripción)
H = []
def hoja(n, slug, titulo, intro, frames, formato='grid', carpeta='sakura2', esencial=True):
    H.append(dict(n=n, slug=slug, titulo=titulo, intro=intro, frames=frames, formato=formato, esencial=esencial))

hoja(1, 'reposo', 'Reposo (idle)', 'Dos animaciones: el reposo que respira (1 a 6, en bucle) y gestos de impaciencia (7 a 10) que se activan si el jugador no toca nada. El fotograma 6 debe casi coincidir con el 1 para que el bucle cierre sin saltos.', [
 ('idle_01', 'Respirando: de pie, peso repartido, pies a la anchura de los hombros, brazos relajados, pecho en posición baja; cabello y bufanda caen en posición neutra hacia atrás.'),
 ('idle_02', 'Inspira 1: el pecho sube un poco, los hombros suben unos 3 px, la coleta se eleva suavemente.'),
 ('idle_03', 'Inspira 2 (punto alto): pecho más alto, cabeza levemente levantada, la bufanda se levanta con un pequeño retraso.'),
 ('idle_04', 'Exhala 1: el pecho baja, el cabello empieza a caer, hombros relajados.'),
 ('idle_05', 'Exhala 2: cabello y bufanda siguen cayendo (continuación del movimiento), rodillas apenas flexionadas.'),
 ('idle_06', 'Vuelta al reposo: casi igual al fotograma 1 para cerrar el ciclo.'),
 ('idle_imp_01', 'Impaciente 1: se inclina un poco hacia adelante y apoya una mano en el cinturón; mirada hacia el frente.'),
 ('idle_imp_02', 'Impaciente 2: golpea el suelo con la punta del pie derecho, mirada hacia arriba, brazos cruzados atrás.'),
 ('idle_imp_03', 'Impaciente 3: se ajusta la máscara con una mano, ojos entrecerrados.'),
 ('idle_imp_04', 'Impaciente 4: cruza los brazos con una sonrisa confiada (ojos curvos felices), cabeza ladeada.'),
])
hoja(2, 'correr', 'Correr (ciclo completo)', 'UN ciclo de carrera de 10 fotogramas, en bucle: el fotograma 10 lleva al 1 sin saltos. Torso inclinado unos 15° hacia adelante, brazos alternados, la coleta y la bufanda ondean hacia atrás con retraso y cambian de forma en cada fotograma. Los pies tocan la línea base solo en los fotogramas de contacto.', [
 ('run_01', 'Contacto derecho: pierna derecha adelante con el talón apenas tocando el suelo, pierna izquierda atrás estirada, brazo izquierdo adelante y derecho atrás.'),
 ('run_02', 'Descenso derecho: la rodilla derecha se flexiona, el cuerpo baja a su punto más bajo, la pierna izquierda se recoge.'),
 ('run_03', 'Paso derecho: la pierna izquierda pasa junto a la derecha con la rodilla alta, el cuerpo empieza a subir, brazos casi cruzados.'),
 ('run_04', 'Impulso derecho: la pierna derecha empuja, el cuerpo sube, la punta del pie derecho deja el suelo.'),
 ('run_05', 'Vuelo A: ambos pies en el aire, cuerpo en el punto más alto, pierna izquierda extendiéndose hacia adelante.'),
 ('run_06', 'Contacto izquierdo: espejo del fotograma 1 (pierna izquierda adelante, brazos invertidos).'),
 ('run_07', 'Descenso izquierdo: espejo del fotograma 2.'),
 ('run_08', 'Paso izquierdo: espejo del fotograma 3.'),
 ('run_09', 'Impulso izquierdo: espejo del fotograma 4.'),
 ('run_10', 'Vuelo B: espejo del fotograma 5; el siguiente fotograma del ciclo es el 1.'),
])
hoja(3, 'salto', 'Salto y caída', 'Secuencia completa de salto: anticipación, despegue, subida, cima, caída (2 fotogramas en bucle) y aterrizaje. Los fotogramas 7 y 8 se alternan mientras cae. Los fotogramas 9 y 10 son el aterrizaje y la recuperación; en el 9 los pies tocan la línea base.', [
 ('salto_01_antic', 'Anticipación: se agacha, rodillas flexionadas, brazos hacia atrás, mirada hacia arriba; el cabello sube un poco.'),
 ('salto_02_despegue', 'Despegue: piernas estiradas empujando, brazos hacia arriba, solo la punta de los pies toca la línea base.'),
 ('salto_03_subida', 'Subida: en el aire, cuerpo estirado, un brazo arriba, rodillas empezando a doblarse, bufanda hacia abajo.'),
 ('salto_04_subida_alta', 'Subida alta: rodillas recogidas, cuerpo compacto, brazos junto al pecho, cabello hacia abajo.'),
 ('salto_05_cima', 'Cima: cuerpo recogido en el punto más alto, casi flotando, cabello y bufanda suspendidos.'),
 ('salto_06_caida_ini', 'Inicio de caída: el cuerpo se estira, piernas hacia abajo, brazos hacia los lados, cabello empieza a subir.'),
 ('salto_07_caida_a', 'Caída A (bucle): piernas ligeramente abiertas estiradas hacia abajo, brazos arriba para equilibrio, bufanda y coleta hacia arriba.'),
 ('salto_08_caida_b', 'Caída B (bucle): igual a la A pero con la coleta y la bufanda en otra posición (más abiertas) y los brazos algo más abajo.'),
 ('salto_09_aterrizaje', 'Aterrizaje: impacto, rodillas muy flexionadas, cuerpo agachado, una mano casi tocando el suelo, pies en la línea base; cabello continúa hacia abajo.'),
 ('salto_10_recuperacion', 'Recuperación: se levanta, rodillas medio flexionadas, brazos bajando, vuelve a la postura de pie.'),
])
hoja(4, 'agachar_empujar', 'Agacharse y empujar', 'Agacharse (fotogramas 1 a 6) y empujar la carreta (7 a 10, bucle). La agachada baja la altura de Sakura a ≈ 55 % de la normal. Para empujar: manos extendidas al frente sobre un objeto invisible (NO dibujes la carreta), cuerpo muy inclinado.', [
 ('agachar_01', 'Bajando 1: flexiona las rodillas, el torso baja un poco, brazos hacia adelante para equilibrio.'),
 ('agachar_02', 'Bajando 2: casi agachada del todo, una mano cerca del suelo.'),
 ('agachada_a', 'Agachada A (bucle): en cuclillas, torso inclinado hacia adelante, mirada atenta al frente, bufanda caída.'),
 ('agachada_b', 'Agachada B (bucle): igual pero respirando, hombros y cabello algo más altos.'),
 ('levantar_01', 'Levantándose 1: empuja con las piernas, torso sube, brazos relajándose.'),
 ('levantar_02', 'Levantándose 2: casi de pie, rodillas medio flexionadas, cabello y bufanda continúan el movimiento.'),
 ('empujar_01', 'Empujar 1: cuerpo muy inclinado hacia adelante (≈ 35°), brazos extendidos al frente empujando, pierna derecha atrás, pie derecho apoyado.'),
 ('empujar_02', 'Empujar 2: el cuerpo avanza un poco, pierna derecha pasa adelante, esfuerzo en la cara (ojos cerrados con fuerza).'),
 ('empujar_03', 'Empujar 3: pierna izquierda atrás empujando, rodilla derecha flexionada, brazos tensos.'),
 ('empujar_04', 'Empujar 4: transición al fotograma 1; cuerpo ligeramente más alto, la bufanda cae hacia atrás.'),
])
hoja(5, 'tajo_a', 'Tajo en el suelo: golpes 1 y 2', 'Dos golpes de espada encadenados de 5 fotogramas cada uno. En el golpe 1 (fotogramas 1 a 5) el corte va de arriba-atrás hacia adelante. En el golpe 2 (6 a 10) es un revés que vuelve hacia atrás. La espada se desenvaina de la espalda. NO dibujes el arco de corte (va en la hoja de efectos); solo el brillo suave de la hoja.', [
 ('tajo1_01', 'Golpe 1 · anticipación: se agacha levemente, la mano derecha saca la katana sobre el hombro hacia atrás, mirada fija.'),
 ('tajo1_02', 'Golpe 1 · inicio: gira el torso, el brazo comienza a bajar, peso hacia el pie delantero.'),
 ('tajo1_03', 'Golpe 1 · impacto: brazo extendido al frente, la espada horizontal hacia adelante, cuerpo estirado, cabello y bufanda hacia atrás.'),
 ('tajo1_04', 'Golpe 1 · continuación: la espada baja hacia el costado, el cuerpo se adelanta, bufanda aún en alto.'),
 ('tajo1_05', 'Golpe 1 · recuperación: vuelve a la posición de guardia, espada al frente baja, rodillas flexionadas.'),
 ('tajo2_01', 'Golpe 2 · anticipación: lleva la espada hacia adelante-derecha con la mano girada (revés), torso rotado.'),
 ('tajo2_02', 'Golpe 2 · inicio: rota la cadera, la espada comienza a barrer hacia atrás cruzando el cuerpo.'),
 ('tajo2_03', 'Golpe 2 · impacto: espada extendida hacia el frente-arriba tras el barrido, cuerpo girado, una pierna muy adelantada.'),
 ('tajo2_04', 'Golpe 2 · continuación: el cuerpo termina el giro, espada alta, cabello y bufanda giran con retraso.'),
 ('tajo2_05', 'Golpe 2 · recuperación: vuelve a la guardia, espada baja al frente.'),
])
hoja(6, 'tajo_b_shuriken', 'Golpe final y shuriken', 'Golpe 3 (final) de 5 fotogramas: salto corto con corte descendente fuerte. Luego el shuriken: 1 fotograma de apuntar (para mantener mientras se elige el blanco) y 4 de lanzar. NO dibujes el shuriken en el aire ni estelas; en el apuntado SÍ sostiene un shuriken en la mano.', [
 ('tajo3_01', 'Golpe 3 · anticipación: agachada profunda, espada levantada con ambas manos hacia atrás, preparando el salto.'),
 ('tajo3_02', 'Golpe 3 · salto: pequeño salto hacia adelante, espada sobre la cabeza con ambas manos, cuerpo arqueado.'),
 ('tajo3_03', 'Golpe 3 · corte: la espada desciende fuerte hacia adelante-abajo, cuerpo en picada suave, piernas recogidas.'),
 ('tajo3_04', 'Golpe 3 · impacto: aterriza con una rodilla muy flexionada, espada apuntando al suelo al frente, bufanda en alto.'),
 ('tajo3_05', 'Golpe 3 · recuperación: se levanta, espada al costado, respiración fuerte.'),
 ('shuriken_apuntar', 'Apuntar: pie derecho atrás, cuerpo ligeramente agachado y concentrado, brazo derecho atrás sosteniendo un shuriken grande, brazo izquierdo extendido al frente como mira, ojos fijos.'),
 ('shuriken_lanzar_01', 'Lanzar 1: el brazo derecho se carga hacia atrás y arriba, el torso gira hacia atrás.'),
 ('shuriken_lanzar_02', 'Lanzar 2: el brazo derecho sale disparado hacia adelante, la mano abierta soltando el shuriken (sin dibujarlo), cuerpo adelantado.'),
 ('shuriken_lanzar_03', 'Lanzar 3: brazo extendido al frente, cuerpo estirado, bufanda y cabello hacia atrás.'),
 ('shuriken_lanzar_04', 'Lanzar 4: recuperación, brazo baja, vuelve a la postura de guardia.'),
])
hoja(7, 'aereo', 'Tajo aéreo, estocada y rebote', 'Combate en el aire. Tajo aéreo (1 a 4); estocada hacia abajo (5 y 6): cae con la espada apuntando abajo para rebotar sobre un enemigo; rebote (7 y 8): se impulsa hacia arriba después de golpear; y tajo agachada (9 y 10). Todos los fotogramas aéreos con la misma escala.', [
 ('aereo_01', 'Tajo aéreo · anticipación: en el aire, cuerpo recogido, espada llevada atrás por encima del hombro.'),
 ('aereo_02', 'Tajo aéreo · giro: el cuerpo gira casi horizontal, espada empezando a barrer hacia adelante.'),
 ('aereo_03', 'Tajo aéreo · impacto: cuerpo estirado casi horizontal, espada extendida al frente, cabello y bufanda hacia atrás.'),
 ('aereo_04', 'Tajo aéreo · continuación: el cuerpo se endereza, espada baja, piernas recogiéndose.'),
 ('estocada_01', 'Estocada abajo 1: cuerpo casi vertical con la cabeza arriba, ambas manos sujetando la espada apuntando hacia abajo, piernas juntas.'),
 ('estocada_02', 'Estocada abajo 2: más estirada y rápida, el cabello y la bufanda se elevan hacia arriba por la caída.'),
 ('rebote_01', 'Rebote 1: se impulsa con las botas sobre un punto bajo (sin dibujar enemigo), piernas muy flexionadas y empujando, espada hacia atrás.'),
 ('rebote_02', 'Rebote 2: sube con un giro en el aire, brazos abiertos, sonrisa de emoción, bufanda en espiral.'),
 ('tajo_bajo_01', 'Tajo agachada 1: agachada, la espada llevada atrás con una mano, cuerpo bajo.'),
 ('tajo_bajo_02', 'Tajo agachada 2: corte bajo hacia adelante, espada extendida a ras del suelo, cuerpo estirado hacia adelante.'),
])
hoja(8, 'dash_doble_planeo', 'Dash, doble salto y planeo', 'Habilidades de movimiento. Dash con invulnerabilidad (1 a 4): sin estelas dibujadas. Doble salto (5 a 8): voltereta en el aire. Planeo (9 y 10): la bufanda magenta se extiende como un planeador mágico (bufanda ancha, plana, con borde de energía rosa) y Sakura se sostiene de ella.', [
 ('dash_01', 'Dash · preparación: se inclina hacia atrás un instante, una pierna flexionada, brazos hacia atrás.'),
 ('dash_02', 'Dash A: cuerpo casi horizontal lanzado hacia adelante, brazos hacia atrás, piernas estiradas, cabello y bufanda totalmente hacia atrás.'),
 ('dash_03', 'Dash B: igual, ligeramente más estirada y compacta, expresión concentrada (ojos casi cerrados).'),
 ('dash_04', 'Dash · frenado: levanta el torso, un pie adelante frenando, brazos al frente para equilibrio.'),
 ('doble_01', 'Doble salto 1: en el aire, se encoge en una bola con rodillas al pecho, a punto de girar.'),
 ('doble_02', 'Doble salto 2: giro boca abajo, cuerpo recogido, cabello y bufanda dibujando un arco.'),
 ('doble_03', 'Doble salto 3: la voltereta continúa, de espaldas, cuerpo extendiéndose.'),
 ('doble_04', 'Doble salto 4: termina la voltereta, se abre con brazos y piernas extendidas, mirando al frente.'),
 ('planeo_abrir', 'Planeo · abrir: sostiene la bufanda con ambas manos sobre la cabeza y esta empieza a abrirse como un planeador.'),
 ('planeo_loop', 'Planeo (bucle): bufanda completamente abierta como un planeador ancho sobre la cabeza, Sakura colgando de ella con piernas estiradas y ligeramente atrás, relajada y sonriente.'),
])
hoja(9, 'pared_gancho', 'Pared y gancho', 'Agarre y salto de pared (1 a 5): la pared está a la DERECHA de Sakura; ella la mira (NO dibujes la pared). Gancho (6 a 10): lanza una cuerda con kunai hacia arriba-derecha y se balancea colgada de una mano (NO dibujes cuerda ni kunai; solo la mano levantada sujetando algo invisible).', [
 ('pared_deslizar_a', 'Deslizar A: pegada a la pared de la derecha, manos en la pared, cuerpo erguido deslizándose, pies rozando, cabello hacia arriba.'),
 ('pared_deslizar_b', 'Deslizar B: igual pero con el cuerpo un poco más abajo, bufanda y coleta en otra posición (más abiertas).'),
 ('pared_agarre', 'Agarre: una mano agarrada a lo alto de la pared, el cuerpo colgando junto a ella, piernas flexionadas apoyadas en la pared.'),
 ('pared_salto_01', 'Salto de pared 1: empuja con ambas piernas contra la pared, cuerpo estirándose hacia la izquierda y arriba.'),
 ('pared_salto_02', 'Salto de pared 2: en el aire alejándose de la pared, medio giro, mirada hacia atrás, bufanda hacia la pared.'),
 ('gancho_lanzar_01', 'Lanzar gancho 1: brazo derecho extendido hacia arriba-derecha en diagonal, mano cerrada, el cuerpo estirado.'),
 ('gancho_lanzar_02', 'Lanzar gancho 2: sigue el movimiento, brazo aún arriba, cuerpo tensándose para ser jalada.'),
 ('gancho_colgar_a', 'Colgar: balanceo hacia ADELANTE — colgada de una mano levantada, cuerpo en diagonal, piernas adelante y arriba, cabello y bufanda hacia atrás.'),
 ('gancho_colgar_b', 'Colgar: punto más bajo — cuerpo vertical colgando de una mano, piernas rectas hacia abajo, cabello hacia arriba.'),
 ('gancho_colgar_c', 'Colgar: balanceo hacia ATRÁS — cuerpo en diagonal hacia atrás, piernas atrás y arriba, bufanda hacia adelante.'),
])
hoja(10, 'dano_victoria', 'Daño, derrota y victoria', 'Reacciones: daño (1 y 2), empujón por golpe (3), derrota (4 a 7, apta para niños de 8 a 10 años: sin sangre ni gore; se marea y se sienta con estrellitas girando sobre la cabeza) y victoria (8 a 10).', [
 ('dano_01', 'Daño 1: golpe recibido, el cuerpo se encoge, ojos cerrados con fuerza, cabeza hacia atrás, destello rojo SOLO en la expresión (sin efectos).'),
 ('dano_02', 'Daño 2: se tambalea hacia atrás, brazos hacia delante, expresión de dolor, cabello y bufanda hacia adelante.'),
 ('empujon', 'Empujón: lanzada hacia atrás en el aire, cuerpo inclinado, ojos cerrados, cabello hacia adelante.'),
 ('derrota_01', 'Derrota 1: se tambalea mareada, ojos en espiral, tres estrellitas amarillas pequeñas sobre la cabeza.'),
 ('derrota_02', 'Derrota 2: cae sentada al suelo, manos atrás, ojos en espiral.'),
 ('derrota_03', 'Derrota 3: se inclina hacia atrás, a punto de acostarse, estrellitas girando.'),
 ('derrota_04', 'Derrota 4: queda sentada, derrotada, cabeza caída, estrellitas sobre ella; pose final que se puede mantener.'),
 ('victoria_01', 'Victoria 1: salta con un puño en alto, boca abierta de alegría, ojos brillantes.'),
 ('victoria_02', 'Victoria 2: pose heroica con la katana levantada, pie adelante, bufanda al viento.'),
 ('victoria_03', 'Victoria 3: guiña un ojo con la señal de la victoria (dos dedos), sonrisa, cadera ladeada.'),
])
hoja(11, 'retratos', 'Retratos e iconos (opcional)', 'Para pantallas y menús. Piezas 1 a 5 son retratos de BUSTO (cabeza y hombros) en tres cuartos mirando a la derecha, que llenan casi toda la celda (≈ 90 % del alto). Pieza 6 y 7: iconos de la cabeza para el marcador, cada uno dibujado para verse bien a 64 px. Piezas 8 y 9: Sakura de cuerpo completo en pose de selección de personaje. Pieza 10: Sakura de cuerpo completo en pose de portada, dinámica. Aquí la regla de línea base no aplica.', [
 ('retrato_neutral', 'Retrato neutral: mirada decidida al frente, ligera sonrisa.'),
 ('retrato_feliz', 'Retrato feliz: sonrisa grande (ojos curvos), mejillas sonrosadas.'),
 ('retrato_sorpresa', 'Retrato sorprendida: ojos muy abiertos, boca pequeña abierta (la máscara baja un poco).'),
 ('retrato_decidida', 'Retrato decidida: ceño fruncido, mirada intensa, flor y cabello ondeando.'),
 ('retrato_herida', 'Retrato herida: ojos cerrados con fuerza, expresión de dolor, una gota pequeña de sudor.'),
 ('icono_a', 'Icono de la cabeza A: cabeza grande y simple, vista de frente-tres cuartos, contorno grueso, muy legible a tamaño pequeño.'),
 ('icono_b', 'Icono de la cabeza B: igual que A pero con los ojos cerrados (guiño) y la lengua fuera juguetona (para el estado "herida").'),
 ('seleccion_a', 'Selección A: cuerpo completo, de pie, mano en la cadera, mirando al frente, sonrisa segura.'),
 ('seleccion_b', 'Selección B: cuerpo completo, saludando con una mano, guiño.'),
 ('portada', 'Portada: cuerpo completo, pose dinámica de salto con la katana desenvainada y la bufanda en espiral; sin efectos.'),
], formato='libre', esencial=False)
hoja(12, 'fx_combate', 'Efectos de combate y polvo (opcional)', 'SOLO efectos, sin personaje. Brillantes y limpios, con borde nítido, dentro de su celda, en tonos blanco, rosa claro #FFB3E6, magenta #FF3DB8 (los de energía) y marrón claro (los de polvo). Cada efecto lo bastante grande para llenar ≈ 85 % de su celda.', [
 ('fx_arco_horizontal', 'Arco de tajo horizontal: media luna fina y afilada, núcleo blanco, borde magenta, extremos que se adelgazan.'),
 ('fx_arco_reves', 'Arco de tajo de revés: media luna más abierta y curva, orientada al contrario, mismos colores.'),
 ('fx_arco_vertical', 'Arco de tajo descendente: media luna casi vertical, más gruesa en el centro.'),
 ('fx_arco_aereo', 'Arco de tajo aéreo: círculo casi completo con huecos, giro rápido, mismos colores.'),
 ('fx_chispa_impacto', 'Destello de impacto: estrella de 8 puntas blanca con núcleo rosa y chispas.'),
 ('fx_chispas', 'Chispas de golpe: seis partículas pequeñas en abanico, blancas y rosadas.'),
 ('fx_polvo_aterrizaje', 'Polvo de aterrizaje: dos nubes de polvo marrón claro saliendo a los lados de un punto central, con volutas.'),
 ('fx_polvo_salto', 'Polvo de salto: una nube pequeña y redonda que se desvanece hacia arriba.'),
 ('fx_onda_rebote', 'Onda de rebote: anillo de choque ovalado blanco-rosa con rayitas hacia afuera.'),
 ('fx_derrape', 'Polvo de derrape: nubes alargadas arrastradas hacia la derecha, marrón claro.'),
], formato='libre', esencial=False)
hoja(13, 'fx_habilidades', 'Efectos de habilidades y objetos del gancho (opcional)', 'SOLO efectos y objetos, sin personaje. Piezas 1 a 3: dash e invulnerabilidad. 4 y 5: doble salto y planeo. 6 a 10: gancho y desbloqueo. Colores: rosa claro #FFB3E6, magenta #FF3DB8, azul claro #9FD8FF para la invulnerabilidad, dorado #FFC93C para el desbloqueo. Bordes nítidos, sin halos.', [
 ('fx_dash_silueta', 'Silueta de estela del dash: silueta rosa translúcida (sin detalles) de Sakura en pose de carrera horizontal, estirada, como imagen residual.'),
 ('fx_dash_lineas', 'Líneas de velocidad del dash: cuatro franjas horizontales alargadas, rosas y blancas, que se adelgazan hacia la izquierda.'),
 ('fx_invulnerable', 'Aura de invulnerabilidad: anillo ovalado azul claro y blanco, brillante, con destellos, que rodea a un personaje (centro vacío transparente).'),
 ('fx_doble_salto', 'Anillo de doble salto: anillo elíptico de energía rosa y blanca con plumas de luz, visto de lado.'),
 ('fx_planeo_viento', 'Corrientes de viento del planeo: tres curvas de viento turquesa claro y blanco, onduladas.'),
 ('gancho_cabeza', 'Cabeza del gancho: un kunai de acero con anillo y cuerda corta enrollada, mirando a la derecha, plateado con detalles magenta.'),
 ('gancho_cuerda', 'Segmento de cuerda: tramo horizontal de cuerda trenzada de 400 px de largo, con extremos iguales para poder repetirse en fila sin cortes visibles, color cáñamo con hilo magenta.'),
 ('gancho_ancla', 'Anillo ancla: argolla de hierro grande colgada de una viga corta de madera con tornillos; objeto del nivel al que se engancha el gancho; vista de frente.'),
 ('gancho_impacto', 'Impacto del gancho: destello pequeño en forma de estrella blanca y rosa con chispas, para el punto donde el kunai se clava.'),
 ('fx_desbloqueo', 'Estallido de desbloqueo: explosión de luz dorada y rosa con un pergamino enrollado brillante al centro, rayos y destellos; se ve cuando se aprende una habilidad.'),
], formato='libre', esencial=False)

def prompt(h):
    if h['formato'] == 'libre':
        fmt = 'FORMATO DE ESTA HOJA: imagen horizontal de 1536 × 1024 px con cuadrícula de 5 columnas × 2 filas (10 celdas ≈ 307 × 512 px), una pieza por celda, centrada, con 25 px libres. En esta hoja la línea base NO aplica.'
    else:
        fmt = 'FORMATO DE ESTA HOJA: el definido en el PROMPT GENERAL: 1536 × 1024 px, 5 columnas × 2 filas, 10 fotogramas con ESCALA IDÉNTICA, línea base a 440 px del borde superior de cada celda y centro del cuerpo en el centro horizontal de la celda.'
    L = [GENERAL, '', fmt, '', f"HOJA {h['n']} — {h['titulo'].upper()}", h['intro'], '', 'LOS 10 FOTOGRAMAS, EN ORDEN:']
    for i, (slug, d) in enumerate(h['frames'], 1):
        L.append(f"{i}. {d}")
    L += ['', 'RECUERDA: Sakura idéntica a la hoja modelo, fondo TRANSPARENTE REAL (PNG con canal alfa), misma escala en los 10 fotogramas, mirando a la derecha, sin texto, sin arcos de corte ni polvo ni estelas dibujados, 25 px de aire en cada celda.' if h['formato'] != 'libre' else '', ]
    return '\n'.join(L)

open(f'{OUT}/00_PROMPT_GENERAL.txt', 'w', encoding='utf-8').write(GENERAL)
open(f'{OUT}/hoja00_modelo.txt', 'w', encoding='utf-8').write(GENERAL + '\n' + MODELO)
for h in H:
    open(f"{OUT}/hoja{h['n']:02d}_{h['slug']}.txt", 'w', encoding='utf-8').write(prompt(h) + '\n')

# animaciones para el motor
ANIM = {
 'idle': ('idle_01 idle_02 idle_03 idle_04 idle_05 idle_06', 8, True), 'idle_impaciente': ('idle_imp_01 idle_imp_02 idle_imp_03 idle_imp_04', 6, False),
 'run': ('run_01 run_02 run_03 run_04 run_05 run_06 run_07 run_08 run_09 run_10', 24, True),
 'jump_antic': ('salto_01_antic', 1, False), 'jump_up': ('salto_02_despegue salto_03_subida salto_04_subida_alta salto_05_cima', 12, False), 'fall': ('salto_06_caida_ini salto_07_caida_a salto_08_caida_b', 10, True), 'land': ('salto_09_aterrizaje salto_10_recuperacion', 14, False),
 'crouch_down': ('agachar_01 agachar_02', 16, False), 'crouch': ('agachada_a agachada_b', 4, True), 'crouch_up': ('levantar_01 levantar_02', 16, False), 'push': ('empujar_01 empujar_02 empujar_03 empujar_04', 8, True),
 'slash1': ('tajo1_01 tajo1_02 tajo1_03 tajo1_04 tajo1_05', 20, False), 'slash2': ('tajo2_01 tajo2_02 tajo2_03 tajo2_04 tajo2_05', 20, False), 'slash3': ('tajo3_01 tajo3_02 tajo3_03 tajo3_04 tajo3_05', 16, False),
 'aim': ('shuriken_apuntar', 1, True), 'throw': ('shuriken_lanzar_01 shuriken_lanzar_02 shuriken_lanzar_03 shuriken_lanzar_04', 20, False),
 'air_slash': ('aereo_01 aereo_02 aereo_03 aereo_04', 20, False), 'plunge': ('estocada_01 estocada_02', 10, True), 'bounce': ('rebote_01 rebote_02', 12, False), 'low_slash': ('tajo_bajo_01 tajo_bajo_02', 16, False),
 'dash': ('dash_01 dash_02 dash_03 dash_04', 18, False), 'double_jump': ('doble_01 doble_02 doble_03 doble_04', 16, False), 'glide_open': ('planeo_abrir', 8, False), 'glide': ('planeo_loop', 1, True),
 'wall_slide': ('pared_deslizar_a pared_deslizar_b', 8, True), 'wall_grab': ('pared_agarre', 1, True), 'wall_jump': ('pared_salto_01 pared_salto_02', 14, False),
 'hook_throw': ('gancho_lanzar_01 gancho_lanzar_02', 14, False), 'hook_swing': ('gancho_colgar_a gancho_colgar_b gancho_colgar_c', 1, True),
 'hurt': ('dano_01 dano_02', 10, False), 'knockback': ('empujon', 1, True), 'death': ('derrota_01 derrota_02 derrota_03 derrota_04', 6, False), 'victory': ('victoria_01 victoria_02 victoria_03', 5, False),
}
hojas_json = [dict(n=h['n'], archivo=f"hoja{h['n']:02d}_{h['slug']}", carpeta='sakura2', formato=h['formato'], esencial=h['esencial'], frames=[s for s, d in h['frames']]) for h in H]
json.dump({'baseline': 440, 'celda': [307, 512], 'hojas': hojas_json, 'animaciones': {k: {'frames': v[0].split(), 'fps': v[1], 'loop': v[2]} for k, v in ANIM.items()}}, open(f'{OUT}/animaciones.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
tot = sum(len(h['frames']) for h in H)
print('ok', len(H), 'hojas', tot, 'piezas')
