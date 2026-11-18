#!/usr/bin/env python3
"""Recorta las hojas de sprites del Nivel 2 (Surf de Dunas) y deja todo organizado.

Uso:  python3 tools/recortar_nivel2.py [carpeta_con_las_hojas]
- Quita el fondo (blanco o magenta) si la hoja no trae transparencia.
- Separa cada sprite (por componentes, no por cuadrícula rígida) y lo recorta a su caja.
- Escribe assets/nivel2/<carpeta>/<id>.png, assets/nivel2/manifest.js,
  y actualiza assets/catalogo.json + assets/CATALOGO.md + assets/README.md (idempotente).
"""
import sys, os, re, json, shutil
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'assets', '_originales', 'nivel2')
OUT = os.path.join(RAIZ, 'assets', 'nivel2')
ORIGEN = 'Generado con ChatGPT a partir de prompts del proyecto (2026)'

# hoja -> (archivo, columnas, filas, fondo, [(id, carpeta), ...] en orden de lectura)
def L(carp, *ids): return [(i, carp) for i in ids]
HOJAS = {
 'hoja1_peligros.png': (5, 4, 'auto',
   L('obstaculos', 'cactus_saguaro', 'cactus_barril', 'roca_grande', 'rocas_pequenas', 'rueda_carreta') +
   L('enemigos', 'escorpion_walk_00', 'escorpion_walk_01', 'escorpion_walk_02', 'escorpion_walk_03', 'escorpion_golpe',
     'serpiente_slither_00', 'serpiente_slither_01', 'serpiente_slither_02', 'serpiente_slither_03', 'serpiente_alerta',
     'buitre_vuelo_00', 'buitre_vuelo_01', 'buitre_vuelo_02', 'buitre_picada', 'buitre_huida')),
 'hoja2_jefes.png': (5, 4, 'auto',
   L('jefes', *[f'jefe_{b}_{p}' for b in ('escorpion', 'gusano', 'esfinge', 'faraon') for p in ('idle', 'aviso', 'ataque', 'golpe', 'derrota')])),
 'hoja3_companero_vehiculos.png': (5, 4, 'blanco',
   L('companero', 'zorro_idle', 'zorro_run_00', 'zorro_run_01', 'zorro_run_02', 'zorro_alerta', 'zorro_celebra') +
   L('vehiculos', 'alfombra_sakura_planeo_00', 'alfombra_sakura_planeo_01', 'alfombra_sakura_sube', 'alfombra_sakura_baja',
     'alfombra_kage_planeo_00', 'alfombra_kage_planeo_01', 'alfombra_kage_sube', 'alfombra_kage_baja',
     'vagoneta_sakura_rueda_00', 'vagoneta_sakura_rueda_01', 'vagoneta_sakura_salto',
     'vagoneta_kage_rueda_00', 'vagoneta_kage_rueda_01', 'vagoneta_kage_salto')),
 'hoja4_poderes_tablas.png': (5, 4, 'auto',
   L('poderes', 'poder_escarabajo', 'poder_reloj', 'poder_iman', 'poder_comodin') +
   L('objetos', 'gota_agua', 'corazon_desierto', 'cofre_cerrado', 'cofre_entreabierto', 'cofre_abierto') +
   L('tablas', 'tabla_clasica', 'tabla_faraon', 'tabla_neon', 'tabla_dragon', 'tabla_cristal', 'tabla_cactus') +
   L('compuertas', 'compuerta_neutral', 'compuerta_correcta', 'compuerta_incorrecta', 'compuerta_usada') +
   L('objetos', 'trofeo_escorpion')),
 'hoja_plataformas_trampas.png': (5, 4, 'auto',
   L('extras', 'isla_hierba', 'isla_desierto', 'isla_hielo', 'isla_lava', 'isla_cristal',
     'puente_colgante', 'puente_piedra', 'escalera_madera', 'enredadera', 'vagoneta_oro',
     'cristales_azules', 'bandera_checkpoint', 'portal_piedra', 'teletransporte', 'trampolin',
     'cinta_transportadora', 'pinchos', 'sierra', 'canon', 'bandera_meta')),
 'hoja_ninja_extras.png': (5, 2, 'magenta',
   L('extras', 'pergamino', 'cofre_oscuro_cerrado', 'cofre_oscuro_abierto', 'onigiri', 'tambor_taiko',
     'piedra_agrietada', 'dragon_origami', 'oni_garrote_guardia', 'oni_garrote_ataque', 'bola_fuego')),
}

# base (id sin _NN) -> (grupo, nombre, descripcion, uso, etiquetas)
G = 'Nivel 2 · '
META = {
 'cactus_saguaro': (G+'obstáculos', 'Cactus saguaro', 'Cactus verde alto de dos brazos con espinas crema, sobre un montículo de arena.', 'Obstáculo alto (hay que saltarlo o cambiar de carril).', ['obstáculo', 'cactus', 'desierto']),
 'cactus_barril': (G+'obstáculos', 'Cactus barril con flor', 'Cactus redondo y bajo con una flor rosada en la cima.', 'Obstáculo bajo, variante visual del cactus.', ['obstáculo', 'cactus', 'flor']),
 'roca_grande': (G+'obstáculos', 'Roca grande', 'Roca violeta de caras planas con arena y pasto seco en la base.', 'Obstáculo medio-alto del carril.', ['obstáculo', 'roca', 'violeta']),
 'rocas_pequenas': (G+'obstáculos', 'Rocas pequeñas', 'Grupo de tres piedras violetas con pasto seco.', 'Obstáculo bajo.', ['obstáculo', 'roca']),
 'rueda_carreta': (G+'obstáculos', 'Rueda de carreta rota', 'Rueda de madera con aro de hierro, medio enterrada en la arena.', 'Obstáculo decorativo/medio; ambientación de caravana.', ['obstáculo', 'madera', 'caravana']),
 'escorpion_walk': (G+'enemigos', 'Escorpión rojo (caminar)', 'Escorpión rojo carmesí con cola en alto y pinzas abiertas; ciclo de 4 cuadros.', 'Enemigo pequeño del carril (se salta).', ['enemigo', 'escorpión', 'animación']),
 'escorpion_golpe': (G+'enemigos', 'Escorpión golpeando', 'Pose de picadura con marca de impacto amarilla.', 'Reacción cuando choca con el héroe o aviso de ataque.', ['enemigo', 'escorpión']),
 'serpiente_slither': (G+'enemigos', 'Serpiente (deslizarse)', 'Serpiente verde lima con rombos y lengua roja; ciclo de 4 cuadros en forma de S.', 'Enemigo que cambia de carril.', ['enemigo', 'serpiente', 'animación']),
 'serpiente_alerta': (G+'enemigos', 'Serpiente enroscada', 'Serpiente en espiral con la cabeza erguida y lengua afuera.', 'Pose de aviso antes de cambiar de carril.', ['enemigo', 'serpiente']),
 'buitre_vuelo': (G+'enemigos', 'Buitre ladrón (vuelo)', 'Buitre de plumas moradas oscuras, cuello rosado y pico dorado; 3 cuadros de aleteo.', 'Evento del buitre ladrón que sobrevuela.', ['enemigo', 'buitre', 'animación']),
 'buitre_picada': (G+'enemigos', 'Buitre en picada', 'Buitre con alas atrás y garras al frente, lanzándose hacia abajo.', 'Ataque en picada sobre un carril.', ['enemigo', 'buitre']),
 'buitre_huida': (G+'enemigos', 'Buitre huyendo con la bolsa', 'Buitre con una bolsita dorada con gema azul entre las garras.', 'Final del evento: se escapa con lo robado.', ['enemigo', 'buitre', 'bolsa']),
 'jefe_escorpion': (G+'jefes', 'Escorpión Colosal', 'Escorpión gigante carmesí con aguijón dorado; poses: idle, aviso (brillo rojo), ataque (cola clavada), golpe (mareado) y derrota (bandera blanca).', 'Jefe perseguidor del final del recorrido.', ['jefe', 'escorpión']),
 'jefe_gusano': (G+'jefes', 'Gusano de arena gigante', 'Gusano violeta con vientre arena y boca circular con dientes redondeados; poses: idle, aviso (asomando), ataque, golpe y derrota (inflado y mareado).', 'Jefe que emerge por un carril.', ['jefe', 'gusano']),
 'jefe_esfinge': (G+'jefes', 'Esfinge guardiana', 'Esfinge de arenisca con tocado dorado y azul y ojos cian; poses: idle, aviso (runas flotando), ataque (rayo con anillos), golpe (grietas) y derrota (pila de rocas).', 'Jefe de adivinanzas con rayo por el carril.', ['jefe', 'esfinge']),
 'jefe_faraon': (G+'jefes', 'Faraón momia', 'Momia con máscara dorada y azul, ojos cian, cayado y mayal; poses: idle, aviso (vendas flotando), ataque (látigo de venda), golpe y derrota (montón de vendas).', 'Jefe que lanza vendas por el carril.', ['jefe', 'momia']),
 'zorro_idle': (G+'compañero', 'Zorro fénec (reposo)', 'Zorro fénec naranja de orejas enormes con pañuelo cian, sentado.', 'Compañero del héroe; pantalla de inicio.', ['compañero', 'zorro']),
 'zorro_run': (G+'compañero', 'Zorro fénec (correr)', 'Ciclo de carrera de 3 cuadros hacia la derecha.', 'Compañero que corre junto al héroe.', ['compañero', 'zorro', 'animación']),
 'zorro_alerta': (G+'compañero', 'Zorro fénec alerta', 'Erguido sobre las patas traseras con signo de exclamación dorado.', 'Aviso de peligro cercano.', ['compañero', 'zorro', 'aviso']),
 'zorro_celebra': (G+'compañero', 'Zorro fénec celebrando', 'Salta con los brazos arriba y ojos cerrados de alegría.', 'Reacción a un acierto o a la victoria.', ['compañero', 'zorro', 'celebración']),
 'alfombra_sakura_planeo': (G+'vehículos', 'Sakura en alfombra (planeo)', 'Sakura agachada sobre una alfombra mágica violeta con flecos dorados; 2 cuadros.', 'Zona de cielo (alfombra voladora).', ['héroe', 'sakura', 'alfombra', 'animación']),
 'alfombra_sakura_sube': (G+'vehículos', 'Sakura en alfombra (subiendo)', 'Alfombra inclinada hacia arriba.', 'Subir de carril en la zona de cielo.', ['héroe', 'sakura', 'alfombra']),
 'alfombra_sakura_baja': (G+'vehículos', 'Sakura en alfombra (bajando)', 'Alfombra inclinada hacia abajo.', 'Bajar de carril en la zona de cielo.', ['héroe', 'sakura', 'alfombra']),
 'alfombra_kage_planeo': (G+'vehículos', 'Kage en alfombra (planeo)', 'Kage sobre una alfombra azul con flecos dorados; 2 cuadros.', 'Zona de cielo (alfombra voladora).', ['héroe', 'kage', 'alfombra', 'animación']),
 'alfombra_kage_sube': (G+'vehículos', 'Kage en alfombra (subiendo)', 'Alfombra azul inclinada hacia arriba.', 'Subir de carril en la zona de cielo.', ['héroe', 'kage', 'alfombra']),
 'alfombra_kage_baja': (G+'vehículos', 'Kage en alfombra (bajando)', 'Alfombra azul inclinada hacia abajo.', 'Bajar de carril en la zona de cielo.', ['héroe', 'kage', 'alfombra']),
 'vagoneta_sakura_rueda': (G+'vehículos', 'Sakura en vagoneta (rodar)', 'Vagoneta minera de madera con chispas en las ruedas; 2 cuadros.', 'Zona del cañón minero.', ['héroe', 'sakura', 'vagoneta', 'animación']),
 'vagoneta_sakura_salto': (G+'vehículos', 'Sakura en vagoneta (salto)', 'Vagoneta en el aire con Sakura agarrada.', 'Salto en la zona del cañón minero.', ['héroe', 'sakura', 'vagoneta']),
 'vagoneta_kage_rueda': (G+'vehículos', 'Kage en vagoneta (rodar)', 'Vagoneta minera con Kage y chispas; 2 cuadros.', 'Zona del cañón minero.', ['héroe', 'kage', 'vagoneta', 'animación']),
 'vagoneta_kage_salto': (G+'vehículos', 'Kage en vagoneta (salto)', 'Vagoneta en el aire con Kage.', 'Salto en la zona del cañón minero.', ['héroe', 'kage', 'vagoneta']),
 'poder_escarabajo': (G+'poderes', 'Escarabajo escudo', 'Escarabajo egipcio dorado con alas abiertas y gema cian.', 'Poder: absorbe un golpe.', ['poder', 'escudo', 'ícono']),
 'poder_reloj': (G+'poderes', 'Reloj de arena', 'Reloj de arena con marco dorado y arena cayendo.', 'Poder: ralentiza el tiempo.', ['poder', 'tiempo', 'ícono']),
 'poder_iman': (G+'poderes', 'Imán de gotas', 'Imán de herradura rojo con tres gotas cian atraídas.', 'Poder: atrae las gotas de agua.', ['poder', 'imán', 'ícono']),
 'poder_comodin': (G+'poderes', 'Comodín 50/50', 'Medallón dorado partido en dos mitades, sin números.', 'Poder: elimina una respuesta incorrecta.', ['poder', 'comodín', 'ícono']),
 'gota_agua': (G+'objetos', 'Gota de agua', 'Gota cian brillante con contorno oscuro.', 'Coleccionable (impulso y puntos).', ['coleccionable', 'agua']),
 'corazon_desierto': (G+'objetos', 'Corazón del desierto', 'Corazón rojo facetado con gema dorada al centro.', 'Vidas en el HUD o recompensa de vida.', ['vida', 'hud', 'corazón']),
 'cofre_cerrado': (G+'objetos', 'Cofre cerrado', 'Cofre de madera con bandas doradas y gema cian.', 'Premio misterioso.', ['cofre', 'premio']),
 'cofre_entreabierto': (G+'objetos', 'Cofre entreabierto', 'Cofre con la tapa a medias y una moneda saltando.', 'Animación de apertura.', ['cofre', 'premio']),
 'cofre_abierto': (G+'objetos', 'Cofre abierto', 'Cofre con monedas, gemas y una estrella dorada.', 'Pantalla de recompensa.', ['cofre', 'premio']),
 'trofeo_escorpion': (G+'objetos', 'Trofeo del escorpión', 'Copa dorada con asas en forma de pinzas de escorpión y gema cian.', 'Premio por vencer al jefe.', ['trofeo', 'jefe', 'premio']),
 'tabla_clasica': (G+'tablas de surf', 'Tabla clásica', 'Tabla de madera con vetas y correa de cuero.', 'Skin inicial del héroe.', ['tabla', 'skin']),
 'tabla_faraon': (G+'tablas de surf', 'Tabla del faraón', 'Tabla dorada con ojo egipcio y franjas azules.', 'Skin desbloqueable.', ['tabla', 'skin']),
 'tabla_neon': (G+'tablas de surf', 'Tabla azul neón', 'Tabla azul con líneas cian brillantes.', 'Skin desbloqueable.', ['tabla', 'skin']),
 'tabla_dragon': (G+'tablas de surf', 'Tabla dragón rojo', 'Tabla roja con un dragón dorado.', 'Skin desbloqueable.', ['tabla', 'skin']),
 'tabla_cristal': (G+'tablas de surf', 'Tabla de cristal', 'Tabla translúcida de hielo con facetas.', 'Skin desbloqueable.', ['tabla', 'skin']),
 'tabla_cactus': (G+'tablas de surf', 'Tabla cactus', 'Tabla verde con espinas y una flor rosada.', 'Skin desbloqueable.', ['tabla', 'skin']),
 'compuerta_neutral': (G+'compuertas', 'Compuerta neutral', 'Arco de piedra con bordes dorados y panel crema vacío (el número se escribe por código).', 'Compuerta de respuesta aún sin cruzar.', ['compuerta', 'respuesta']),
 'compuerta_correcta': (G+'compuertas', 'Compuerta correcta', 'Arco con panel verde y marca de visto.', 'Resultado de acierto.', ['compuerta', 'acierto']),
 'compuerta_incorrecta': (G+'compuertas', 'Compuerta incorrecta', 'Arco con panel rojo y cruz.', 'Resultado de error.', ['compuerta', 'error']),
 'compuerta_usada': (G+'compuertas', 'Compuerta usada', 'Arco apagado en gris violeta.', 'Compuertas no elegidas ya resueltas.', ['compuerta']),
 'isla_hierba': (G+'extras generales', 'Isla flotante de pasto', 'Isla de tierra con pasto y piedritas.', 'Plataforma flotante.', ['plataforma', 'isla']),
 'isla_desierto': (G+'extras generales', 'Isla flotante de desierto', 'Isla de arena con un cactus.', 'Plataforma flotante de tema desierto.', ['plataforma', 'isla', 'desierto']),
 'isla_hielo': (G+'extras generales', 'Isla flotante de hielo', 'Isla de hielo con carámbanos.', 'Plataforma flotante de tema hielo.', ['plataforma', 'isla', 'hielo']),
 'isla_lava': (G+'extras generales', 'Isla flotante de lava', 'Isla de roca oscura con grietas de lava.', 'Plataforma flotante de tema lava.', ['plataforma', 'isla', 'lava']),
 'isla_cristal': (G+'extras generales', 'Isla flotante de cristal', 'Isla morada con cristales violetas.', 'Plataforma flotante de tema cristal.', ['plataforma', 'isla', 'cristal']),
 'puente_colgante': (G+'extras generales', 'Puente colgante', 'Puente de tablas y cuerdas.', 'Pasarela.', ['puente', 'madera']),
 'puente_piedra': (G+'extras generales', 'Puente de piedra', 'Arco de piedra con musgo.', 'Pasarela.', ['puente', 'piedra']),
 'escalera_madera': (G+'extras generales', 'Escalera de madera', 'Escalera vertical con clavos metálicos.', 'Trepar.', ['escalera']),
 'enredadera': (G+'extras generales', 'Enredadera', 'Rama con hojas verdes colgante.', 'Agarre o decoración.', ['enredadera', 'selva']),
 'vagoneta_oro': (G+'extras generales', 'Vagoneta con oro', 'Vagoneta minera llena de pepitas doradas.', 'Decoración del cañón o premio.', ['vagoneta', 'oro']),
 'cristales_azules': (G+'extras generales', 'Cristales azules', 'Racimo de cristales cian con rocas y hojas.', 'Decoración.', ['cristal', 'decoración']),
 'bandera_checkpoint': (G+'extras generales', 'Bandera de punto de control', 'Bandera roja con aro dorado en el suelo.', 'Checkpoint.', ['checkpoint', 'bandera']),
 'portal_piedra': (G+'extras generales', 'Portal de piedra', 'Arco de piedra con un vórtice azul y cristales.', 'Cambio de zona.', ['portal']),
 'teletransporte': (G+'extras generales', 'Teletransportador', 'Plataforma con columna de luz azul y anillos.', 'Cambio de zona.', ['portal', 'luz']),
 'trampolin': (G+'extras generales', 'Trampolín', 'Resorte con plataforma amarilla y negra y flecha arriba.', 'Rampa que impulsa el salto.', ['trampolín', 'salto']),
 'cinta_transportadora': (G+'extras generales', 'Cinta transportadora', 'Cinta con flechas amarillas.', 'Empuja al héroe.', ['cinta']),
 'pinchos': (G+'extras generales', 'Pinchos', 'Cuatro pinchos metálicos sobre una base de madera.', 'Obstáculo bajo.', ['trampa', 'pinchos']),
 'sierra': (G+'extras generales', 'Sierra circular', 'Sierra con centro rojo sobre base metálica.', 'Obstáculo peligroso.', ['trampa', 'sierra']),
 'canon': (G+'extras generales', 'Cañón', 'Cañón negro con mecha encendida.', 'Dispara proyectiles.', ['trampa', 'cañón']),
 'bandera_meta': (G+'extras generales', 'Bandera de meta', 'Bandera de cuadros blanca y negra.', 'Final del recorrido.', ['meta', 'bandera']),
 'pergamino': (G+'extras ninja', 'Pergamino', 'Pergamino con cuerda y borla rojas.', 'Objeto coleccionable.', ['ninja', 'pergamino']),
 'cofre_oscuro_cerrado': (G+'extras ninja', 'Cofre oscuro cerrado', 'Cofre de madera oscura con remaches dorados y gema roja.', 'Premio.', ['cofre', 'ninja']),
 'cofre_oscuro_abierto': (G+'extras ninja', 'Cofre oscuro abierto', 'Cofre con monedas y gemas.', 'Premio abierto.', ['cofre', 'ninja']),
 'onigiri': (G+'extras ninja', 'Onigiri sonriente', 'Triángulo de arroz con alga y carita feliz.', 'Recuperar energía.', ['comida', 'ninja']),
 'tambor_taiko': (G+'extras ninja', 'Tambor taiko', 'Tambor rojo con cuerdas doradas y baquetas.', 'Decoración o ritmo.', ['tambor', 'ninja']),
 'piedra_agrietada': (G+'extras ninja', 'Piedra agrietada', 'Bloque de piedra con grietas y musgo.', 'Obstáculo rompible.', ['piedra', 'obstáculo']),
 'dragon_origami': (G+'extras ninja', 'Dragón de origami', 'Dragón rojo y dorado estilo papel plegado.', 'Enemigo o decoración.', ['dragón', 'origami']),
 'oni_garrote_guardia': (G+'extras ninja', 'Oni con garrote (guardia)', 'Ogro azul con cuernos dorados y garrote con púas, en guardia.', 'Enemigo fuerte.', ['oni', 'enemigo']),
 'oni_garrote_ataque': (G+'extras ninja', 'Oni con garrote (ataque)', 'El mismo oni alzando el garrote para golpear.', 'Pose de ataque del oni.', ['oni', 'enemigo']),
 'bola_fuego': (G+'extras ninja', 'Bola de fuego', 'Remolino de fuego naranja y amarillo.', 'Proyectil o efecto.', ['fuego', 'efecto']),
}

# ids que el juego ya usa (se actualiza en cada parte de la integración)
USADO = {'cactus_saguaro', 'cactus_barril', 'roca_grande', 'rocas_pequenas', 'rueda_carreta', 'escorpion_walk', 'serpiente_slither',
         'serpiente_alerta', 'buitre_vuelo', 'buitre_picada', 'buitre_huida', 'gota_agua', 'corazon_desierto',
         'compuerta_neutral', 'compuerta_correcta', 'compuerta_incorrecta', 'compuerta_usada'}

def quitar_fondo(a, modo):
    """a: RGBA uint8. Devuelve RGBA con el fondo en alfa 0 (solo componentes conectados al borde)."""
    rgb = a[..., :3].astype(int)
    if modo == 'auto':
        modo = 'alfa' if (a[..., 3] == 0).mean() > .05 else 'blanco'
    if modo == 'alfa':
        return a
    if modo == 'blanco':
        cand = rgb.min(axis=2) >= 236
    else:  # magenta
        cand = (rgb[..., 0] > 165) & (rgb[..., 2] > 165) & (rgb[..., 1] < 125)
    lab, n = ndi.label(cand)
    borde = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(borde))
    cerca = ndi.binary_dilation(bg, iterations=2) & ~bg
    if modo == 'blanco':
        halo = cerca & (rgb.min(axis=2) >= 205)
    else:
        halo = cerca & (rgb[..., 0] > rgb[..., 1] + 60) & (rgb[..., 2] > rgb[..., 1] + 60)
    out = a.copy(); out[bg | halo, 3] = 0
    return out

# Retoques puntuales tras el recorte: id -> ('cian',) quita píxeles cian | ('corte', fracción) borra lo que quede por debajo
RETOQUES = {'jefe_gusano_aviso': ('cian',), 'vagoneta_sakura_rueda_00': ('corte', .87)}

def retocar(idn, im):
    r = RETOQUES.get(idn)
    if not r: return im
    a = np.array(im)
    if r[0] == 'cian':
        rgb = a[..., :3].astype(int)
        a[..., 3] = np.where((rgb[..., 2] > rgb[..., 0] + 20) & (rgb[..., 1] > rgb[..., 0] + 20), 0, a[..., 3])
    else:
        a[int(a.shape[0] * r[1]):, :, 3] = 0
    ys, xs = np.where(a[..., 3] > 10)
    return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])

def recortar_hoja(ruta, cols, rows, modo, items):
    a = np.array(Image.open(ruta).convert('RGBA'))
    a = quitar_fondo(a, modo)
    H, W = a.shape[:2]
    masc = a[..., 3] > 10
    lab, n = ndi.label(ndi.binary_dilation(masc, iterations=1), structure=np.ones((3, 3)))
    celda_px = (np.minimum(rows - 1, (np.arange(H) * rows // H))[:, None] * cols +
                np.minimum(cols - 1, (np.arange(W) * cols // W))[None, :])
    comps = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = lab[sl] == i
        comps.append({'i': i, 'sl': sl, 'area': int(m.sum())})
    grandes = [c for c in comps if c['area'] >= 2500]
    asign = {}                       # componente -> celda (o None si se reparte por píxel)
    ch, cw = H / rows, W / cols
    for c in grandes:
        cel = celda_px[c['sl']][lab[c['sl']] == c['i']]
        v, cnt = np.unique(cel, return_counts=True)
        ys, xs = c['sl']
        cabe = (ys.stop - ys.start) <= 1.25 * ch and (xs.stop - xs.start) <= 1.25 * cw   # un solo sprite
        asign[c['i']] = int(v[cnt.argmax()]) if (cabe or cnt.max() >= .85 * cnt.sum()) else None
    pequenas = [c for c in comps if 25 <= c['area'] < 2500]
    if pequenas and grandes:         # piezas pequeñas -> sprite grande más cercano (distancia real entre píxeles)
        dts = [(g['i'], ndi.distance_transform_edt(lab != g['i'])) for g in grandes]
        for c in pequenas:
            m = lab == c['i']
            d = [(dt[m].min(), gi) for gi, dt in dts]
            dm, gi = min(d)
            if dm < 60: asign[c['i']] = ('con', gi)
    por_celda = {}
    for c in grandes:
        k = asign[c['i']]
        if k is None:
            for cel in np.unique(celda_px[c['sl']][lab[c['sl']] == c['i']]):
                por_celda.setdefault(int(cel), []).append((c['i'], int(cel)))
        else: por_celda.setdefault(k, []).append((c['i'], None))
    for i, k in list(asign.items()):
        if isinstance(k, tuple):
            dest = asign[k[1]]
            if dest is None:
                ys, xs = [c for c in comps if c['i'] == i][0]['sl']
                dest = int(celda_px[(ys.start + ys.stop) // 2, (xs.start + xs.stop) // 2])
            por_celda.setdefault(dest, []).append((i, None))
    res = {}
    for k, (idn, carp) in enumerate(items):
        if k not in por_celda:
            print('  ! sin sprite en la celda', k, idn); continue
        m = np.zeros((H, W), bool)
        for i, solo in por_celda[k]:
            mm = lab == i
            if solo is not None:        # sprite repartido por píxel: quitar astillas pegadas al corte
                mm &= celda_px == solo
                l2, n2 = ndi.label(mm, structure=np.ones((3, 3)))
                if n2 > 1:
                    areas = ndi.sum(mm, l2, range(1, n2 + 1)); mayor = int(np.argmax(areas)) + 1
                    for j in range(1, n2 + 1):
                        pj = l2 == j
                        toca = (ndi.binary_dilation(pj) & (celda_px != solo) & (lab == i)).any()
                        if j != mayor and toca and areas[j - 1] < 1200: mm &= ~pj
            m |= mm
        # nada legítimo cuelga por debajo del sprite principal: fuera lo que sea resto de la fila de abajo
        l3, n3 = ndi.label(ndi.binary_dilation(m & (a[..., 3] > 10), iterations=2), structure=np.ones((3, 3)))
        if n3 > 1:
            ar = ndi.sum(np.ones_like(l3), l3, range(1, n3 + 1)); mj = int(np.argmax(ar)) + 1
            fin = ndi.find_objects(l3)[mj - 1][0].stop
            for j, sl3 in enumerate(ndi.find_objects(l3), 1):
                if j != mj and sl3[0].start >= fin - 2: m &= ~(l3 == j)
        sp = a.copy(); sp[..., 3] = np.where(m, a[..., 3], 0)
        ys, xs = np.where(sp[..., 3] > 10)
        res[idn] = (carp, retocar(idn, Image.fromarray(sp[ys.min():ys.max() + 1, xs.min():xs.max() + 1])))
    return res

def main():
    for ff in ('hojas',):
        pass
    todo = {}
    for archivo, (cols, rows, modo, items) in HOJAS.items():
        ruta = os.path.join(SRC, archivo)
        if not os.path.exists(ruta): print('falta', ruta); continue
        print(archivo); todo.update(recortar_hoja(ruta, cols, rows, modo, items))
    if os.path.isdir(OUT): shutil.rmtree(OUT)
    manifest, grupos = {}, {}
    for idn, (carp, im) in todo.items():
        os.makedirs(os.path.join(OUT, carp), exist_ok=True)
        im.save(os.path.join(OUT, carp, idn + '.png'), optimize=True)
        base = re.sub(r'_\d\d$', '', idn)
        grupos.setdefault((base, carp), []).append((idn, im.size))
        if base.startswith('jefe_'):
            grupos.setdefault((re.sub(r'_(idle|aviso|ataque|golpe|derrota)$', '', base), carp, 'cat'), []).append((idn, im.size))
    for (base, carp), fr in [(k[:2], v) for k, v in grupos.items() if len(k) == 2]:
        fr.sort()
        cuadros = [{'f': f'{carp}/{i}.png', 'w': s[0], 'h': s[1]} for i, s in fr]
        manifest[base] = {'carpeta': carp, 'frames': cuadros}
    with open(os.path.join(OUT, 'manifest.js'), 'w') as f:
        f.write('/* Generado por tools/recortar_nivel2.py — arte del Nivel 2 (Surf de Dunas).\n'
                '   window.NIVEL2_ARTE[id] = { carpeta, frames:[{f,w,h}] }  (f es relativo a assets/nivel2/; el ancla es centro-abajo). */\n'
                'window.NIVEL2_ARTE=' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n')
    # catálogo
    cat_path = os.path.join(RAIZ, 'assets', 'catalogo.json')
    cat = [c for c in json.load(open(cat_path)) if not c['ruta'].startswith('assets/nivel2/')]
    filas = {}
    cat_items = [(k[0], k[1], v) for k, v in grupos.items() if len(k) == 3 or not k[0].startswith('jefe_')]
    for base, carp, fr in sorted(cat_items, key=lambda t: list(META).index(t[0]) if t[0] in META else 999):
        fr.sort()
        if base not in META: print('sin META', base); continue
        g, nombre, desc, uso, tags = META[base]
        e = {'ruta': f'assets/nivel2/{carp}/{fr[0][0]}.png' if len(fr) == 1 else f'assets/nivel2/{carp}/{base}_*.png',
             'grupo': g, 'nombre': nombre, 'descripcion': desc, 'uso': uso, 'etiquetas': tags,
             'tamano_px': list(fr[0][1]), 'origen': ORIGEN, 'usado_en': 'engine/nivel2/surf.js' if base in USADO else 'pendiente de integrar'}
        if len(fr) > 1: e['cuadros'] = len(fr)
        cat.append(e); filas.setdefault(g, []).append(e)
    json.dump(cat, open(cat_path, 'w'), ensure_ascii=False, indent=1)
    md = ['<!-- NIVEL2:INICIO -->', '## 🏜️ Nivel 2 — Surf de Dunas (`nivel2/`)', '',
          'Arte del Nivel 2, recortado por `tools/recortar_nivel2.py` desde las hojas guardadas en `_originales/nivel2/`. '
          'Se carga con `nivel2/manifest.js` (`window.NIVEL2_ARTE`). Ancla: centro-abajo. Fondo transparente. '
          'Para volver a generar todo: `python3 tools/recortar_nivel2.py`.', '']
    for g, es in filas.items():
        md += [f'### {g.replace(G, "").capitalize()}', '', '| Imagen | Qué es | Uso | Tamaño |', '|---|---|---|---|']
        for e in es:
            r = e['ruta'].replace('assets/', '')
            md.append(f"| `{r}`{' ×' + str(e['cuadros']) if 'cuadros' in e else ''} | **{e['nombre']}.** {e['descripcion']} | {e['uso']} | {e['tamano_px'][0]}×{e['tamano_px'][1]} |")
        md.append('')
    md.append('<!-- NIVEL2:FIN -->')
    p = os.path.join(RAIZ, 'assets', 'CATALOGO.md'); t = open(p).read()
    t = re.sub(r'<!-- NIVEL2:INICIO -->.*?<!-- NIVEL2:FIN -->\n?', '', t, flags=re.S)
    k = t.find('## Cómo agregar algo nuevo')
    t = (t[:k] + '\n'.join(md) + '\n\n' + t[k:]) if k > 0 else t + '\n' + '\n'.join(md) + '\n'
    open(p, 'w').write(t)
    p = os.path.join(RAIZ, 'assets', 'README.md'); t = open(p).read()
    if 'nivel2/' not in t.split('## Convenciones')[0]:
        t = t.replace('├── _originales/hud/', '├── nivel2/              Arte del Nivel 2 «Surf de Dunas»: obstaculos, enemigos, jefes, companero, vehiculos, poderes, objetos, tablas, compuertas, extras (+ manifest.js, galeria.html)\n├── _originales/hud/', 1)
        open(p, 'w').write(t)
    print('listo:', len(todo), 'imágenes,', len(manifest), 'ids')

main()
