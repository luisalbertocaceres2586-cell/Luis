#!/usr/bin/env python3
"""Recorta las 3 hojas de objetos y optimiza los 3 fondos de los ambientes del Nivel 2.
Uso: python3 tools/recortar_ambientes.py   (lee assets/_originales/nivel2_ambientes/)
Escribe assets/nivel2/ambientes/*.png|jpg y assets/nivel2/manifest_amb.js
"""
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, 'assets', '_originales', 'nivel2_ambientes')
OUT = os.path.join(RAIZ, 'assets', 'nivel2', 'ambientes')
os.makedirs(OUT, exist_ok=True)
HOJAS = {
  'hoja_mina_rieles.png': ['riel_recto', 'riel_rampa_sube', 'riel_rampa_baja', 'caballete_madera', 'palanca_verde', 'palanca_roja', 'tunel_mina'],
  'hoja_puente_bloques.png': ['bloque_normal', 'bloque_activo', 'bloque_correcto', 'bloque_error', 'puente_losa', 'acantilado'],
  'hoja_cielo_aros.png': ['anillo_neutro', 'anillo_ok', 'anillo_mal', 'nube_tormenta', 'nube_a', 'nube_b'],
}
arte = {}
for arch, ids in HOJAS.items():
    im = Image.open(os.path.join(SRC, arch)).convert('RGBA'); a = np.array(im)[:, :, 3]
    m = a > 24
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=6))
    cajas = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        area = int(((lab[sl] == i + 1) & m[sl]).sum())
        if area > 4000: cajas.append((sl, area))
    assert len(cajas) == len(ids), (arch, len(cajas), len(ids))
    # orden de lectura: filas por centro vertical, luego x
    cen = [((s[0].start + s[0].stop) / 2, (s[1].start + s[1].stop) / 2, s) for s, _ in cajas]
    fila_h = 512
    cen.sort(key=lambda c: (int(c[0] // fila_h), c[1]))
    for (cy, cxx, s), id_ in zip(cen, ids):
        y0, y1, x0, x1 = max(0, s[0].start - 2), min(im.height, s[0].stop + 2), max(0, s[1].start - 2), min(im.width, s[1].stop + 2)
        sub = im.crop((x0, y0, x1, y1))
        # recorte fino a lo realmente visible (alpha > 6)
        b = sub.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        if b: sub = sub.crop(b)
        f = id_ + '.png'; sub.save(os.path.join(OUT, f), optimize=True)
        arte[id_] = {'carpeta': 'ambientes', 'frames': [{'f': 'ambientes/' + f, 'w': sub.width, 'h': sub.height}]}
        print(id_, sub.size)
FONDOS = {'1795055783890_image.png': 'fondo_mina', '1795055845172_image.png': 'fondo_cielo', '1795056032450_image.png': 'fondo_templo'}
for src, id_ in FONDOS.items():
    p = os.path.join('/mnt/user-data/uploads', src)
    if not os.path.exists(p): p = os.path.join(SRC, id_ + '_original.png')
    im = Image.open(p).convert('RGB'); im.save(os.path.join(SRC, id_ + '_original.png')) if p.startswith('/mnt') else None
    im.save(os.path.join(OUT, id_ + '.jpg'), quality=84, optimize=True, progressive=True)
    arte[id_] = {'carpeta': 'ambientes', 'frames': [{'f': 'ambientes/' + id_ + '.jpg', 'w': im.width, 'h': im.height}]}
    print(id_, im.size, os.path.getsize(os.path.join(OUT, id_ + '.jpg')) // 1024, 'KB')
with open(os.path.join(RAIZ, 'assets', 'nivel2', 'manifest_amb.js'), 'w', encoding='utf-8') as f:
    f.write('/* Generado por tools/recortar_ambientes.py — arte de los ambientes del Nivel 2 (mina, cielo, templo, puente). Se suma a NIVEL2_ARTE. */\n')
    f.write('window.NIVEL2_ARTE=Object.assign(window.NIVEL2_ARTE||{},' + json.dumps(arte, ensure_ascii=False, separators=(',', ':')) + ');\n')
