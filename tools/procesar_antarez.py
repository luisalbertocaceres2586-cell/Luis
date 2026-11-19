#!/usr/bin/env python3
"""Normaliza los frames de Antarez (hojas 1-6, 8, 9 y 13) a una escala común y calcula el ancla (pies/centro del cuerpo).
Salida: assets/characters/antarez/<corto>_NN.png + anchors.json
Uso: python3 tools/procesar_antarez.py"""
import json, glob, os
import numpy as np
from PIL import Image
GLOBAL=0.5   # resolución final: la mitad (se dibuja a ~80 px; sobra nitidez)
SRC='assets/characters/antarez_sprites_procesados/frames'
DST='assets/characters/antarez'
# hoja -> (prefijo corto, factor de escala para igualar el tamaño de la cabeza con la hoja 1)
SHEETS={'hoja1_movimiento_A':('mov',1.00),'hoja2_movimiento_B':('mov2',1.00),
 'hoja3_katana_hono_fuego':('hono',1.15),'hoja4_katana_raiden_rayo':('raiden',1.10),
 'hoja5_katana_kaze_viento_A':('kazea',1.05),'hoja6_katana_kaze_viento_B':('kazeb',1.08),
 'hoja8_correr_24':('run',1.85),'hoja9_salto_24':('jump',1.95),'hoja13_kunai_shuriken':('kunai',1.80)}
def anchor(im):
    a=np.array(im).astype(int);al=a[...,3];r,g,b=a[...,0],a[...,1],a[...,2]
    navy=(al>200)&(r<85)&(g<95)&(b<150)&(b>=r)
    ys,xs=np.where(navy)
    H,W=al.shape
    if len(ys)<40:
        ys2,xs2=np.where(al>10)
        if len(ys2)==0:return al.shape[1]/2,float(al.shape[0])
        return float(xs2.mean()),float(ys2.max())
    return float(np.median(xs)),float(np.percentile(ys,99.5))
out={}
for sheet,(short,k) in SHEETS.items():
    for f in sorted(glob.glob(f'{SRC}/{sheet}/*_f*.png')):
        n=int(f[-6:-4]);im=Image.open(f).convert('RGBA')
        kk=k*GLOBAL; im=im.resize((max(1,round(im.width*kk)),max(1,round(im.height*kk))),Image.LANCZOS)
        ax,ay=anchor(im);name=f'{short}_{n:02d}.png';im.save(f'{DST}/{name}',optimize=True)
        out[name]={'w':im.width,'h':im.height,'ax':round(ax,1),'ay':round(ay,1)}
json.dump(out,open(f'{DST}/anchors.json','w'),indent=1)
print(len(out),'frames ->',DST)
