#!/usr/bin/env python3
"""Genera los prompts de las 5 hojas EXTRA del Nivel 1 (8 piezas por hoja), los documentos y las carpetas."""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GENERAL = """INSTRUCCIONES GENERALES (válidas para TODAS las hojas — léelas completas antes de dibujar)

QUÉ ES: una HOJA DE SPRITES de 8 piezas para un videojuego 2D de plataformas de NINJAS en un Japón feudal fantástico. Vista LATERAL (de perfil, como un juego de scroll horizontal); los elementos de escenario (árboles, puertas, carteles) se ven de frente. Sin vista cenital.

FONDO TRANSPARENTE REAL (OBLIGATORIO, LO MÁS IMPORTANTE): entrega un PNG con CANAL ALFA, es decir, transparente de verdad. PROHIBIDO: fondo blanco, fondo gris, fondo negro, cuadros grises y blancos que simulan transparencia, degradados, texturas de fondo, suelo, sombras proyectadas, reflejos o resplandores difusos que se salgan de las piezas. Los brillos (luz de una antorcha, cristales, llamas) deben quedar DENTRO de la silueta de la pieza, con borde nítido. Si no puedes entregar transparencia real, dímelo en lugar de dibujar cuadros.

TAMAÑO Y ORDEN: usa la máxima resolución disponible. El formato exacto de la hoja se indica en cada hoja (cuadrícula de 8 celdas del mismo tamaño). Una sola pieza por celda, centrada, con al menos 30 px de espacio transparente alrededor; ninguna pieza toca o se mezcla con otra ni con el borde de la imagen. Las piezas van numeradas de izquierda a derecha y de arriba abajo, en el mismo orden de la lista. No recortes ninguna pieza. Mantén la misma escala relativa entre las piezas de la hoja (un árbol es más grande que una valla).

CALIDAD Y ESTILO: arte digital de altísima calidad, nivel estudio de animación profesional y juego móvil premium: pintura detallada hecha a mano, texturas ricas (madera, piedra, tela, metal, musgo, cristal), colores saturados y vivos, CONTORNO oscuro azul marino #1A1230 limpio y nítido de 2 a 3 px, luz principal desde arriba a la izquierda con luz de borde suave y sombras de forma coherentes. Los personajes son chibi-anime (cabeza grande, cuerpo compacto). Todas las piezas deben parecer del mismo juego. No imites ninguna marca ni personaje conocido.

PALETA (úsala como guía): bosque: verdes #2F9E44 #8FD14F #1F6B3A, musgo #5FAE3A, bambú #A6D13F, madera #8B5A2B #C77C2E, tierra #5A321C, piedra gris azulada #6B7390, rojo bermellón #D8321F, dorado #FFC93C, rosa sakura #FF8FB8. Cueva: roca #2B2F45 #4A4F6B, cristal cian #35D0F0, azul #3A8DFF, hongos turquesa #2FE3C0 y lima #B5F23D. Fuego y luz: naranja #FF8A1F, amarillo #FFD54A. Acentos: carmesí #C81E3C, azul marino #1A1230.

SIN TEXTO: ninguna letra, número, palabra, símbolo escrito, marca de agua, línea de cuadrícula ni etiqueta. Si hace falta un emblema, dibuja un diseño abstracto (círculos, espirales, líneas), nunca letras.

ORIENTACIÓN: los personajes, criaturas y objetos direccionales miran a la DERECHA, salvo que la pieza diga otra cosa.
"""

TALL = "FORMATO DE ESTA HOJA: imagen HORIZONTAL de 1536 × 1024 px con una cuadrícula de 4 columnas × 2 filas (8 celdas verticales de unos 384 × 512 px). Fila 1 = piezas 1 a 4; fila 2 = piezas 5 a 8."
WIDE = "FORMATO DE ESTA HOJA: imagen VERTICAL de 1024 × 1536 px con una cuadrícula de 2 columnas × 4 filas (8 celdas horizontales de unos 512 × 384 px). Fila 1 = piezas 1 y 2; fila 2 = 3 y 4; fila 3 = 5 y 6; fila 4 = 7 y 8."

HOJAS = [
 dict(n=7, carpeta='decorado_extra', titulo='Decorado del bosque (variedad)', fmt=TALL, modo='tall8', archivo='hoja7_decorado_extra',
  intro='Esta hoja son PIEZAS DE DECORADO del bosque para que los paisajes no se repitan. Cada pieza se ve de frente, con la base cortada recta o apoyada en una base pequeña (para pegarla al suelo). Ocupan entre el 70 % y el 90 % del alto de su celda, salvo las pequeñas (valla, cartel, rocas), que ocupan alrededor del 55 %.',
  items=[
  ('cerezo_sakura','Cerezo en flor','Árbol de cerezo japonés en flor, completo: tronco oscuro retorcido con nudos, copa grande y redondeada cubierta de flores rosa sakura #FF8FB8 con algunas flores más claras, y 6 o 7 pétalos cayendo cerca de la copa (dentro de la silueta, sin halo). Base del tronco con unas pocas raíces y hierba corta.','Decorado de paisaje.'),
  ('pino_bonsai','Pino bonsái grande','Pino japonés grande y retorcido, estilo bonsái: tronco grueso con nudos y corteza detallada, tres "nubes" de agujas verde oscuro #1F6B3A con luz en la parte superior, apoyado en una base pequeña de tierra con tres piedras.','Decorado de paisaje.'),
  ('rocas_musgo','Grupo de rocas con musgo','Grupo de 3 o 4 rocas grandes gris azulado #6B7390 apiladas de forma natural, con musgo verde #5FAE3A en la parte superior y florecitas blancas y amarillas. Base irregular pero plana abajo.','Decorado y obstáculo visual.'),
  ('valla_madera','Valla de madera','Tramo de valla de madera de 5 postes con dos travesaños atados con cuerda de cáñamo, madera desgastada con vetas, un poco de musgo en la base. Vista de frente, extremos cortados rectos para poder repetirla.','Decorado de caminos y puentes.'),
  ('fuente_bambu','Fuente de bambú','Fuente japonesa shishi-odoshi: caño de bambú verde inclinado apoyado en un soporte de madera, un chorro de agua cayendo a una pequeña pila de piedra con agua azul clara y gotas brillantes. El agua y las gotas quedan dentro de la silueta.','Decorado animable.'),
  ('farolitos_cuerda','Farolitos colgantes','Tres farolitos de papel (rojo #D8321F, crema y rojo) colgando a distintas alturas de una cuerda corta con dos ganchos de metal arriba, encendidos con luz cálida suave dentro del papel. Sin letras ni símbolos en el papel.','Decorado de santuarios.'),
  ('cartel_flecha','Cartel de flecha','Poste de madera con una tabla en forma de flecha que apunta a la DERECHA, madera con vetas y cuerda, una enredadera verde enrollada en el poste, base clavada en un pequeño montículo de tierra. SIN ningún texto ni símbolo en la tabla.','Indica el camino.'),
  ('helechos_luciernagas','Helechos con luciérnagas','Matorral denso de helechos verdes y flores azules pequeñas, con 6 luciérnagas brillantes amarillo verdoso #B5F23D flotando cerca (puntos de luz pequeños dentro de la silueta, sin halo grande). Base recta abajo.','Decorado del bosque nocturno.'),
 ]),
 dict(n=8, carpeta='terreno_extra', titulo='Suelos y plataformas (variedad)', fmt=WIDE, modo='wide8', archivo='hoja8_terreno_extra',
  intro='Esta hoja son SUELOS Y PLATAFORMAS vistos de lado, cada uno una franja horizontal ancha que llena casi todo el ancho de su celda. La superficie de arriba (donde se camina) debe ser clara y casi plana. Los suelos 1, 2 y 7 deben tener los extremos izquierdo y derecho cortados rectos y sin elementos grandes pegados al borde, para repetirlos en mosaico.',
  items=[
  ('suelo_bosque_lajas','Suelo con camino de lajas','Franja de suelo de bosque vista de lado: arriba, hierba verde brillante a los lados y un camino de lajas de piedra planas y claras en la superficie; debajo, tierra marrón rojiza #5A321C con piedras y capas, corte frontal profundo (60 % del alto de la celda). Extremos rectos, repetible.','Suelo principal alternativo del bosque.'),
  ('suelo_otonal','Suelo otoñal','Franja de suelo con hojas caídas rojas, naranjas y doradas sobre hierba seca amarillenta, tierra rojiza debajo con raíces y piedras; corte frontal profundo. Extremos rectos, repetible.','Variante de suelo (atardecer).'),
  ('tronco_caido','Tronco caído','Tronco grueso caído en horizontal, corteza marrón con grietas, cubierto de musgo verde y con 3 o 4 hongos pequeños y marrones en la parte superior; extremos con el corte de los anillos visible. Superficie superior bien definida.','Plataforma natural.'),
  ('plataforma_flores','Plataforma de madera con flores','Plataforma flotante de tablones de madera clara atados con cuerda roja, con pequeñas macetas de flores rosas y blancas en los dos extremos y una enredadera colgando por debajo. Superficie central despejada.','Plataforma decorativa.'),
  ('losa_runas','Losa de piedra con runas','Losa de piedra gris azulada rectangular y gruesa, flotante, con símbolos geométricos simples grabados (círculos, espirales y líneas; NO letras), bordes con musgo y raíces finas colgando por debajo.','Plataforma de santuario.'),
  ('hoja_loto','Hoja de loto gigante','Hoja de loto gigante y redonda vista de lado como plataforma, verde con nervaduras claras, con una flor de loto rosa en un extremo y una pequeña rana verde simpática sentada en el otro; un poco de agua azul debajo de la hoja (dentro de la silueta).','Plataforma de estanque.'),
  ('plataforma_cristal','Plataforma de cristales','Plataforma de roca oscura #2B2F45 con cristales cian #35D0F0 y azules brotando de la superficie y colgando debajo, con un brillo interno suave dentro de cada cristal. Superficie de caminar plana y rugosa.','Plataforma de la cueva.'),
  ('hongo_plataforma','Hongo gigante plataforma','Hongo gigante visto de lado: sombrero ancho y plano turquesa #2FE3C0 con puntos luminosos lima #B5F23D y tallo corto y grueso color crema, con pequeños hongos y hierba en la base. La parte superior del sombrero es una superficie ancha y casi plana.','Plataforma de la cueva.'),
 ]),
 dict(n=9, carpeta='cueva_extra', titulo='Cueva: más variedad', fmt=TALL, modo='tall8', archivo='hoja9_cueva_extra',
  intro='Esta hoja son PIEZAS DE LA CUEVA para que cada zona oscura se vea distinta. Las piezas que cuelgan del techo (2 y 4) deben tener el borde superior cortado recto. Las demás se apoyan abajo en una base recta o pequeña.',
  items=[
  ('estalagmita_columna','Columna de roca','Columna de roca formada por una estalactita y una estalagmita unidas en el centro, gris azulado #4A4F6B, con goteo y brillos de humedad en la superficie, y un poco de musgo azul en la base. Alta y estrecha.','Obstáculo visual de la cueva.'),
  ('cristales_techo','Cristales colgantes','Racimo de cristales cian #35D0F0 y azules colgando del techo con las puntas hacia abajo, con una base de roca oscura en la parte superior cortada recta; brillo interno dentro de los cristales, sin halo.','Decorado del techo y luz.'),
  ('hongo_gigante','Hongo luminoso alto','Un hongo luminoso alto: sombrero turquesa #2FE3C0 con puntos de luz lima, tallo largo claro, apoyado en una piedra pequeña con musgo; dos hongos pequeños a su lado.','Decorado con luz.'),
  ('raices_colgantes','Raíces y lianas colgantes','Raíces gruesas y lianas finas que cuelgan del techo de la cueva, marrón oscuro con hojitas verdes, con gotas de agua brillantes en las puntas; borde superior cortado recto.','Decorado del techo.'),
  ('pared_mineral','Pared de mineral','Panel de pared de roca irregular con vetas de gemas azules y doradas incrustadas, con facetas brillantes; contorno irregular (no rectangular) y vertical.','Decorado de fondo.'),
  ('arco_ruinas','Arco de ruinas','Arco de piedra antiguo en ruinas con musgo azul y raíces, dos columnas desgastadas y bloques caídos en la base; sin letras ni símbolos. El hueco del arco queda TRANSPARENTE.','Decorado de entrada y fondo.'),
  ('flores_luminosas','Flores bioluminiscentes','Grupo de flores azul eléctrico #3A8DFF con pétalos que parecen brillar, hojas oscuras y 5 esporas luminosas flotando cerca (puntos de luz pequeños dentro de la silueta).','Decorado con luz.'),
  ('altar_vela','Altar con vela','Pequeño altar de rocas apiladas con una vela encendida de llama cálida pequeña y un cuenco de ofrenda de madera con frutas; cera blanca derretida. Luz de la llama solo dentro de la silueta.','Decorado de punto de control.'),
 ]),
 dict(n=10, carpeta='enemigos_extra', titulo='Enemigos nuevos', fmt=TALL, modo='tall8', archivo='hoja10_enemigos_extra',
  intro='Esta hoja son ENEMIGOS NUEVOS, de cuerpo completo, mirando a la DERECHA. Estilo chibi-anime (cabeza grande), amenazantes pero simpáticos para niños de 8 a 10 años (sin sangre, sin gore). Cada criatura ocupa entre el 75 % y el 90 % del alto de su celda, con los pies o la base en la misma línea inferior.',
  items=[
  ('ninja_arquero','Ninja arquero','Ninja enemigo arquero, de pie con las piernas separadas y un arco largo tensado hacia la derecha con una flecha lista, traje gris carbón con bufanda y vendas rojas, capucha, ojos rojos brillantes.','Enemigo que dispara.'),
  ('ninja_lancero','Ninja lancero','Ninja enemigo con una lanza larga sostenida con ambas manos en posición de ataque hacia la derecha, traje verde muy oscuro con bandas carmesí, capucha y máscara, ojos rojos brillantes.','Enemigo de ataque frontal.'),
  ('samurai_fantasma','Samurái fantasma','Samurái espectral azulado semitransparente con armadura antigua rota y casco con cuernos, una katana en la mano, ojos cian brillantes y la parte inferior del cuerpo deshaciéndose en humo azul. El borde superior debe ser nítido; el humo, dentro de la silueta.','Enemigo flotante de la cueva.'),
  ('serpiente_cueva','Serpiente de cueva','Serpiente verde azulada #2FA89A enroscada en forma de S lista para atacar, mirando a la derecha, con ojos amarillos, vientre claro y escamas con brillo; expresión feroz pero caricaturesca.','Enemigo de suelo.'),
  ('escarabajo_cristal','Escarabajo de cristal','Escarabajo gigante con el caparazón hecho de cristal cian #35D0F0 con facetas y brillo interno, dos cuernos pequeños, seis patas oscuras, mirando a la derecha.','Enemigo de la cueva.'),
  ('kappa','Kappa','Kappa (criatura acuática del folclor japonés) verde, con caparazón en la espalda, un plato con agua en la cabeza, pico amarillo y expresión traviesa, en postura de ataque con los brazos hacia adelante, mirando a la derecha.','Enemigo del estanque.'),
  ('zorro_fuego','Zorro de fuego','Zorro kitsune de fuego con tres colas terminadas en llamas naranjas y azules, pelaje naranja y crema, ojos dorados, en postura de salto hacia la derecha. Las llamas quedan dentro de la silueta con borde nítido.','Enemigo veloz.'),
  ('rana_gigante','Rana gigante','Rana verde gigante agachada lista para saltar hacia la derecha, ojos saltones, piel con manchas oscuras y vientre claro, patas traseras grandes; expresión simpática y torpe.','Enemigo saltarín del bosque.'),
 ]),
 dict(n=11, carpeta='objetos_extra', titulo='Personajes, objetos y mecanismos', fmt=TALL, modo='tall8', archivo='hoja11_objetos_extra',
  intro='Esta hoja mezcla DOS PERSONAJES AMIGOS (piezas 1 y 2: chibi-anime, de cuerpo completo, mirando a la derecha, que ocupan el 85 % del alto de la celda) y OBJETOS y MECANISMOS (piezas 3 a 8, que ocupan alrededor del 55 % del alto de la celda). Las piezas 3 y 4 son la MISMA palanca en dos estados y deben tener exactamente el mismo diseño y tamaño.',
  items=[
  ('maestro_sensei','Maestro Sensei','Anciano maestro ninja amable: barba y cejas blancas largas, kimono azul oscuro con detalles dorados y cinturón rojo, bastón de madera en una mano, sombrero pequeño, sonrisa tranquila, de pie, proporciones chibi.','Personaje guía para dar consejos.'),
  ('mercader_tanuki','Mercader tanuki','Tanuki (mapache japonés) mercader amistoso: sombrero de paja, una bolsa grande a la espalda, delantal marrón, panza redonda, sonrisa amplia y una mano levantada saludando, proporciones chibi.','Personaje aliado.'),
  ('palanca_apagada','Palanca apagada','Palanca de hierro oscuro y madera sobre una base de piedra, con el mango inclinado hacia ABAJO a la izquierda y el pomo ROJO #D8321F. Vista de frente.','Mecanismo (estado inicial).'),
  ('palanca_encendida','Palanca encendida','LA MISMA palanca de la pieza 3 (mismo diseño, tamaño y base), pero con el mango inclinado hacia ARRIBA a la derecha y el pomo VERDE brillante #4ADE6B.','Mecanismo (activada).'),
  ('frasco_luz','Frasco de luz','Frasco de vidrio redondo con cuello angosto y tapón de corcho, lleno de un líquido dorado luminoso #FFD54A con pequeñas chispas dentro, con un cordel rojo en el cuello. El brillo queda dentro del vidrio.','Objeto que recarga la luz de la antorcha.'),
  ('llave_dorada','Llave dorada','Llave dorada ornamental japonesa: anillo con forma de flor, vástago con detalles grabados, dientes sencillos y una borla roja colgando del anillo; metal con brillo cálido.','Objeto para abrir puertas.'),
  ('campana_templo','Campana de templo','Campana de bronce de templo colgando de un pequeño marco de madera con una cuerda gruesa y un mazo de madera al lado; metal verdoso con reflejos dorados.','Punto de control.'),
  ('corazon_jade','Corazón de jade','Corazón de jade verde brillante tallado, con un marco dorado fino y un pequeño destello; superficie pulida con reflejos. Sin halo fuera de la silueta.','Objeto de vida extra.'),
 ]),
]

def prompt_hoja(h):
    L = [GENERAL, '', h['fmt'], '', f"HOJA {h['n']} — {h['titulo'].upper()}", h['intro'], '', 'LAS 8 PIEZAS, EN ORDEN:']
    for i, (slug, nombre, desc, uso) in enumerate(h['items'], 1):
        L.append(f"{i}. {nombre}. {desc}")
    L += ['', 'RECUERDA: fondo TRANSPARENTE REAL (PNG con canal alfa), exactamente 8 piezas separadas, ninguna con texto, letras ni números, brillos solo dentro de la silueta, contorno azul marino #1A1230 en todas.']
    return '\n'.join(L)

os.makedirs(f'{R}/docs/nivel1/prompts', exist_ok=True)
for h in HOJAS:
    open(f"{R}/docs/nivel1/prompts/{h['archivo']}.txt", 'w', encoding='utf-8').write(prompt_hoja(h) + '\n')

md = ['# Nivel 1 · 5 hojas EXTRA de imágenes (8 piezas por hoja)', '',
      'Sirven para dar variedad a los paisajes, los suelos y la cueva, y para tener enemigos, personajes y mecanismos nuevos. Cada archivo de `prompts/` trae TODO junto (instrucciones generales + las 8 piezas), listo para pegar en ChatGPT.', '',
      '## Cómo usarlos', '',
      '1. Abre un chat nuevo en ChatGPT y genera las 5 hojas en ese mismo chat, una tras otra (así mantiene el estilo).',
      '2. Pega el contenido de `prompts/hoja7_decorado_extra.txt` y pide la imagen. Descárgala como PNG sin comprimir y guárdala como `hoja7_decorado_extra.png`.',
      '3. Repite con las hojas 8, 9, 10 y 11.',
      '4. Súbeme las 5 hojas aquí. Yo las recorto, las nombro, las ordeno en `assets/nivel1/` y las pongo en los niveles.', '',
      '## Si sale con cuadros grises o fondo blanco',
      'Las pantallas de ChatGPT muestran la transparencia como cuadros, pero el archivo descargado debe ser transparente de verdad. Si al abrir el PNG ves los cuadros dibujados o un fondo blanco/gris, escribe: *"Repite la misma imagen y entrégala como PNG con canal alfa transparente real, sin cuadros ni fondo."* No hace falta rehacer toda la hoja si solo falla una pieza: pídele esa pieza sola con el mismo estilo.', '',
      '## Resumen', '']
for h in HOJAS:
    md += [f"### Hoja {h['n']} — {h['titulo']}", f"Formato: {'1536×1024 horizontal · 4 col × 2 filas' if h['modo']=='tall8' else '1024×1536 vertical · 2 col × 4 filas'} · prompt: `prompts/{h['archivo']}.txt` · destino: `assets/nivel1/{h['carpeta']}/`", '',
           '| # | Archivo final | Qué es | Para qué sirve |', '|---|---|---|---|']
    for i, (slug, nombre, desc, uso) in enumerate(h['items'], 1):
        md.append(f"| {i} | `{slug}.png` | {nombre} | {uso} |")
    md.append('')
open(f'{R}/docs/nivel1/PROMPTS_HOJAS_EXTRA.md', 'w', encoding='utf-8').write('\n'.join(md))

for h in HOJAS:
    d = f"{R}/assets/nivel1/{h['carpeta']}"; os.makedirs(d, exist_ok=True)
    t = [f"# nivel1 / {h['carpeta']}", '', f"Salen de la **hoja {h['n']} — {h['titulo']}**.", '',
         '| Archivo | Qué es | Uso |', '|---|---|---|'] + [f"| `{s}.png` | {n} | {u} |" for s, n, dsc, u in h['items']] + ['', 'Estado: **pendiente de recibir la hoja**.']
    open(f"{d}/LEEME.md", 'w', encoding='utf-8').write('\n'.join(t) + '\n')
print('ok', sum(len(h['items']) for h in HOJAS), 'piezas en', len(HOJAS), 'hojas')
