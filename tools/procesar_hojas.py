#!/usr/bin/env python3
"""
Recorta las hojas de sprites del Nivel 1 y convierte los GIF en tiras de animación.

Uso:  python3 tools/procesar_hojas.py  <carpeta_con_las_hojas>
Salida: assets/nivel1/<carpeta>/<pieza>.png  +  assets/nivel1/manifest.json

- Hojas con fondo MAGENTA (#FF00FF): se quita el color con desmezclado de bordes.
- Hojas con transparencia real: se usan tal cual.
- Las piezas se separan por agrupación (no depende de que la cuadrícula sea exacta).
- Los GIF se convierten en una tira horizontal (todos los cuadros del mismo tamaño y misma base).
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageSequence
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'nivel1')


def key_color(rgb, M, lo=55.0, hi=125.0):
    """Quita el color de fondo M. Devuelve RGBA con bordes desmezclados."""
    a = rgb.astype(np.float32)
    M = np.array(M, np.float32)
    d = np.sqrt(((a - M) ** 2).sum(-1))
    alpha = np.clip((d - lo) / (hi - lo), 0, 1)
    out = a.copy()
    part = (alpha > 0) & (alpha < 1)
    al = alpha[..., None]
    with np.errstate(divide='ignore', invalid='ignore'):
        unm = (a - (1 - al) * M) / np.maximum(al, 1e-3)
    out[part] = np.clip(unm[part], 0, 255)
    res = np.dstack([out, alpha * 255]).astype(np.uint8)
    res[alpha == 0, :3] = 0
    return res


def load_rgba(path):
    im = Image.open(path)
    if im.mode == 'RGBA':
        return np.array(im)
    rgb = np.array(im.convert('RGB'))
    M = rgb[2, 2]                      # esquina = color de fondo
    return key_color(rgb, M)


def split_pieces(arr, expected, mode):
    """Reparte lo dibujado en las 10 celdas de la cuadrícula.
    - Manchas grandes: van a la celda donde está casi toda su área (si unen dos poses, se separan por píxel).
    - Manchas pequeñas (hilos de telaraña, chispas): se pegan a la pieza grande más cercana."""
    from scipy.spatial import cKDTree
    mask = arr[..., 3] > 12
    H, W = mask.shape
    cols, rows = (5, 2) if mode == 'tall' else (2, 5)
    lab, n = ndi.label(ndi.binary_dilation(mask, iterations=2))
    big, small = [], []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = (lab[sl] == i) & mask[sl]
        if m.sum() < 40:
            continue
        ys, xs = np.where(m)
        ys = ys + sl[0].start
        xs = xs + sl[1].start
        (big if m.sum() >= 2500 else small).append((ys, xs))
    cells = {}

    def put(key, ys, xs):
        cells.setdefault(key, np.zeros_like(mask))
        cells[key][ys, xs] = True

    for ys, xs in big:
        gy = np.minimum(rows - 1, (ys / (H / rows)).astype(int))
        gx = np.minimum(cols - 1, (xs / (W / cols)).astype(int))
        code = gy * cols + gx
        vals, cnt = np.unique(code, return_counts=True)
        parts = [v for v, c in zip(vals, cnt) if c > 0.25 * len(ys)]
        if len(parts) > 1:                       # dos poses unidas: separar por píxel
            for v in parts:
                sel = code == v
                put((int(v // cols), int(v % cols)), ys[sel], xs[sel])
        else:
            v = vals[cnt.argmax()]
            put((int(v // cols), int(v % cols)), ys, xs)
    # pequeñas -> pieza grande más cercana
    keys = list(cells)
    trees = []
    for k in keys:
        yy, xx = np.where(cells[k])
        trees.append(cKDTree(np.c_[yy[::4], xx[::4]]))
    for ys, xs in small:
        pt = np.array([[ys.mean(), xs.mean()]])
        best = min(range(len(keys)), key=lambda j: trees[j].query(pt)[0][0])
        put(keys[best], ys, xs)
    if len(cells) != expected:
        print(f'  ! se esperaban {expected} piezas y salieron {len(cells)}')
    out = []
    for key in sorted(cells):
        m = cells[key]
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        sub = arr[y0:y1, x0:x1].copy()
        sub[~m[y0:y1, x0:x1]] = 0
        out.append(sub)
    return out


def save_png(arr, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(arr, 'RGBA').save(path, optimize=True)


SHEETS = [
    # (archivo de entrada, carpeta, modo, nombres en orden)
    ('hoja1_terreno', 'terreno', 'wide',
     ['suelo_bosque', 'suelo_cueva', 'suelo_azotea', 'puente_cuerda', 'plataforma_bambu',
      'plataforma_piedra_toro', 'roca_cueva_flotante', 'viga_torre', 'alero_tejas', 'kunai_trampa']),
    ('hoja2_decorado', 'decorado', 'tall',
     ['torii_inactivo', 'torii_activo', 'puerta_santuario_cerrada', 'puerta_santuario_abierta', 'toro_piedra',
      'bambu_primer_plano', 'estatua_kitsune', 'pilar_rojo', 'estandarte_colgante', 'shoji']),
    ('hoja3_cueva', 'cueva', 'tall',
     ['antorcha_pared_apagada', 'antorcha_pared_encendida', 'antorcha_mano', 'estalactita_grande', 'cristales_azules',
      'hongos_luminosos', 'farol_papel_apagado', 'farol_papel_encendido', 'telarana', 'boca_cueva']),
    ('hoja4_enemigos', 'enemigos', 'tall',
     ['ninja_sombra', 'ninja_sombra_ataque', 'murcielago', 'arana_colgante', 'guardia_piedra', 'tengu_cuervo',
      'espiritu_fuego_fatuo', 'roca_gigante', 'sombra_perseguidora', 'oni_rojo_minijefe']),
    ('hoja5_heroe_armadura', 'heroe_armadura', 'tall',
     ['armadura_idle', 'armadura_run_1', 'armadura_run_2', 'armadura_run_3', 'armadura_run_4', 'armadura_salto',
      'armadura_caida', 'armadura_embestida', 'armadura_golpe', 'armadura_casco_icono']),
    ('hoja6_items_jefe', 'items_jefe', 'tall',
     ['pergamino', 'cofre_cerrado', 'cofre_abierto', 'onigiri_curacion', 'tambor_taiko', 'sello_piedra',
      'dragon_papel', 'oni_guardian_reposo', 'oni_guardian_ataque', 'orbe_energia']),
]

GIFS = [
    # (archivo, carpeta, nombre, tipo)  tipo: 'tira' = animación | 'piezas:<nombres>' = cuadros que son piezas distintas
    ('Antorcha_medieval_animada_en_llamas.gif', 'animados', 'antorcha_llama', 'tira'),
    ('Shuriken_dorado_en_remolino_animado.gif', 'animados', 'shuriken_espiritual', 'tira'),
    ('Hoja_animada_de_ninja_samurái_chibi-1.gif', 'heroe_armadura', 'armadura_poses', 'tira'),
    ('Oni_samurái_en_ataque_animado.gif', 'jefe', 'oni_ataque', 'tira'),
    ('Sprite_animado_del_guerrero_oni.gif', 'jefe', 'oni_caminar', 'tira'),
    ('Ninja_en_acción__seis_poses_animadas-3.gif', 'heroes_extra', 'ninja_poses', 'tira'),
    ('Animación_de_activos_japoneses_coloridos-2.gif', 'decorado',
     None, 'piezas:farol_templo,estandarte_emblema,santuario_jizo,portal_azul,carreta_madera,bambu_roca'),
]


def gif_frames(path):
    im = Image.open(path)
    durs, frs = [], []
    for fr in ImageSequence.Iterator(im):
        durs.append(fr.info.get('duration', 100))
        rgba = np.array(fr.convert('RGBA'))
        if rgba[..., 3].min() == 255:                 # sin transparencia: el fondo es magenta
            rgba = key_color(rgba[..., :3], rgba[2, 2, :3])
        frs.append(rgba)
    return frs, int(round(sum(durs) / len(durs)))


def bbox_union(frs):
    m = np.zeros(frs[0].shape[:2], bool)
    for f in frs:
        m |= f[..., 3] > 12
    ys, xs = np.where(m)
    return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1


def main(src):
    manifest = {'version': 1, 'piezas': {}, 'animaciones': {}}
    for fname, folder, mode, names in SHEETS:
        cand = [os.path.join(src, f) for f in os.listdir(src) if f.startswith(fname)]
        if not cand:
            print('falta', fname); continue
        arr = load_rgba(cand[0])
        print(fname, arr.shape)
        for nm, p in zip(names, split_pieces(arr, 10, mode)):
            path = f'{folder}/{nm}.png'
            save_png(p, os.path.join(OUT, path))
            manifest['piezas'][nm] = {'ruta': f'assets/nivel1/{path}', 'w': int(p.shape[1]), 'h': int(p.shape[0])}
    for fn, folder, nm, tipo in GIFS:
        p = os.path.join(src, fn)
        if not os.path.exists(p):
            print('falta', fn); continue
        frs, dur = gif_frames(p)
        if tipo == 'tira':
            y0, y1, x0, x1 = bbox_union(frs)
            cw, ch = x1 - x0, y1 - y0
            strip = np.zeros((ch, cw * len(frs), 4), np.uint8)
            for i, f in enumerate(frs):
                strip[:, i * cw:(i + 1) * cw] = f[y0:y1, x0:x1]
            path = f'{folder}/{nm}_{len(frs)}.png'
            save_png(strip, os.path.join(OUT, path))
            manifest['animaciones'][nm] = {'ruta': f'assets/nivel1/{path}', 'cuadros': len(frs), 'w': int(cw), 'h': int(ch), 'ms': dur}
        else:
            names = tipo.split(':')[1].split(',')
            for i, (n2, f) in enumerate(zip(names, frs)):
                y0, y1, x0, x1 = bbox_union([f])
                path = f'{folder}/{n2}.png'
                save_png(f[y0:y1, x0:x1], os.path.join(OUT, path))
                manifest['piezas'][n2] = {'ruta': f'assets/nivel1/{path}', 'w': int(x1 - x0), 'h': int(y1 - y0)}
        os.makedirs(os.path.join(OUT, '_originales'), exist_ok=True)
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print('piezas:', len(manifest['piezas']), 'animaciones:', len(manifest['animaciones']))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
