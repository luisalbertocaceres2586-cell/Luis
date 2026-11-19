#!/usr/bin/env python3
"""Recorta las hojas de movimientos de un héroe (p. ej. la nueva Sakura) sin recortar el espacio: cada celda
conserva su tamaño y su línea base, para que las animaciones no "tiemblen". Las hojas libres (retratos y efectos)
sí se recortan al contenido.
Uso:  python3 tools/procesar_heroe.py <carpeta_con_las_hojas> [sakura2]
Salida: assets/characters/<heroe>/<fotograma>.png + manifest.js (window.SAKURA2_MANIFEST)"""
import json, os, sys
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import procesar_hojas as P

def main(src, heroe='sakura2'):
    cfg = json.load(open(os.path.join(ROOT, 'docs', 'nivel1', 'sakura', 'animaciones.json'), encoding='utf-8'))
    out = os.path.join(ROOT, 'assets', 'characters', heroe); os.makedirs(out, exist_ok=True)
    base = cfg['baseline']; hechos = {}
    for h in cfg['hojas']:
        cand = [f for f in os.listdir(src) if f.startswith(h['archivo'])]
        if not cand: print('falta', h['archivo']); continue
        arr = P.load_rgba(os.path.join(src, cand[0])); H, W = arr.shape[:2]; cw, ch = W // 5, H // 2
        if h['formato'] == 'libre':
            for nm, p in zip(h['frames'], P.split_pieces(arr, 10, 'tall')):
                P.save_png(p, os.path.join(out, 'fx', nm + '.png')); hechos[nm] = {'archivo': 'fx/' + nm + '.png', 'w': int(p.shape[1]), 'h': int(p.shape[0])}
            continue
        esc = 512 / ch   # se normaliza a celdas de 307x512 si la imagen llegó con otro tamaño
        for i, nm in enumerate(h['frames']):
            r, c = divmod(i, 5); cell = arr[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
            im = Image.fromarray(cell, 'RGBA')
            if abs(esc - 1) > .01: im = im.resize((round(cw * esc), 512), Image.LANCZOS)
            im.save(os.path.join(out, nm + '.png'), optimize=True); hechos[nm] = {'archivo': nm + '.png', 'w': im.width, 'h': im.height}
    man = {}
    for an, d in cfg['animaciones'].items():
        fr = [f for f in d['frames'] if f in hechos]
        if len(fr) != len(d['frames']): continue
        man[an] = {'fps': d['fps'], 'loop': d['loop'], 'frames': [{'file': hechos[f]['archivo'], 'ax': hechos[f]['w'] / 2, 'ay': base, 'w': hechos[f]['w'], 'h': hechos[f]['h']} for f in fr]}
    open(os.path.join(out, 'manifest.js'), 'w', encoding='utf-8').write('window.' + heroe.upper() + '_MANIFEST=' + json.dumps(man, indent=1) + ';\n')
    print('fotogramas:', len(hechos), '| animaciones completas:', len(man), 'de', len(cfg['animaciones']))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'sakura2')
