#!/usr/bin/env python3
"""Recorta las 6 hojas de puzzles del Nivel 1 en piezas sueltas (PNG con alfa) en assets/nivel1/puzzles/.
Uso: python3 tools/procesar_puzzles.py hoja12.png hoja13.png hoja14.png hoja15.png hoja16.png hoja17.png"""
import sys, os
from collections import deque
from PIL import Image
import numpy as np
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'nivel1', 'puzzles')
os.makedirs(OUT, exist_ok=True)

def quitar_fondo_claro(im):
    """Hoja con 'transparencia' pintada (cuadriculado blanco/gris): lo claro conectado al borde, y los huecos claros grandes, pasan a alfa 0."""
    a = np.array(im.convert('RGB')).astype(int); h, w, _ = a.shape
    claro = (a.min(axis=2) >= 225) & ((a.max(axis=2) - a.min(axis=2)) <= 14)
    vis = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if claro[y, x]: vis[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if claro[y, x] and not vis[y, x]: vis[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and claro[ny, nx] and not vis[ny, nx]: vis[ny, nx] = True; q.append((ny, nx))
    # huecos claros internos grandes (el hueco de la puerta abierta)
    rest = claro & ~vis; seen = np.zeros((h, w), bool)
    for y0 in range(h):
        for x0 in range(w):
            if rest[y0, x0] and not seen[y0, x0]:
                comp = [(y0, x0)]; seen[y0, x0] = True; i = 0
                while i < len(comp):
                    y, x = comp[i]; i += 1
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and rest[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; comp.append((ny, nx))
                if len(comp) > 1500:
                    for y, x in comp: vis[y, x] = True
    # vacío negro del hueco mientras la losa sube (gris casi puro y muy oscuro): también transparente
    oscuro = (a.max(axis=2) <= 40) & ((a.max(axis=2) - a.min(axis=2)) <= 12); seen2 = np.zeros((h, w), bool)
    for y0 in range(h):
        for x0 in range(w):
            if oscuro[y0, x0] and not seen2[y0, x0]:
                comp = [(y0, x0)]; seen2[y0, x0] = True; i = 0
                while i < len(comp):
                    y, x = comp[i]; i += 1
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and oscuro[ny, nx] and not seen2[ny, nx]: seen2[ny, nx] = True; comp.append((ny, nx))
                if len(comp) > 3000:
                    for y, x in comp: vis[y, x] = True
    out = np.array(im.convert('RGBA')); out[vis, 3] = 0
    return Image.fromarray(out)

def celdas(im, cols, rows):
    W, H = im.size; cw, ch = W // cols, H // rows
    for r in range(rows):
        for c in range(cols):
            yield r * cols + c, im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))

def recortar(c, umbral=24):
    al = np.array(c)[:, :, 3]; ys, xs = np.where(al > umbral)
    if not len(xs): return c
    return c.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

NOMBRES = {
 12: ['caja_madera','caja_piedra','bloque_runico','placa_off','placa_on','pedestal_off','pedestal_on','caja_rota'],
 13: ['compuerta_madera_off','compuerta_madera_on','reja_cadena_off','reja_cadena_on','barrera_on','barrera_off','porton_off','porton_on'],
 14: ['pilar_rojo_off','pilar_rojo_on','pilar_azul_off','pilar_azul_on','pilar_dorado_off','pilar_dorado_on','pilar_verde_off','pilar_verde_on'],
 15: ['seg_madera','seg_piedra','seg_bambu','soporte_izq','soporte_der','puente_armado','tablero_vacio','tablero_ejemplo'],
 16: ['fx_anillo','fx_chispas','fx_error','fx_polvo','fx_aterriza','fx_motas','fx_humo','fx_estrella'],
}
def main(args):
    hojas = {12: args[0], 13: args[1], 14: args[2], 15: args[3], 16: args[4]}
    for n, f in hojas.items():
        im = Image.open(f).convert('RGBA'); cols, rows = (2, 4) if n == 15 else (4, 2)
        for i, c in celdas(im, cols, rows):
            p = recortar(c, 10 if n == 16 else 24); p.save(os.path.join(OUT, NOMBRES[n][i] + '.png')); print(NOMBRES[n][i], p.size)
    # hoja 17: animación de la compuerta → tira de 8 cuadros del mismo tamaño
    im = quitar_fondo_claro(Image.open(args[5])); cuadros = [c for _, c in celdas(im, 4, 2)]
    cajas = [recortar(c).getbbox() and None for c in cuadros]
    al = [np.array(c)[:, :, 3] for c in cuadros]; ys = np.concatenate([np.where(a > 24)[0] for a in al]); xs = np.concatenate([np.where(a > 24)[1] for a in al])
    # recorte común (misma caja para los 8 cuadros: la puerta no "salta")
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    tira = Image.new('RGBA', ((x1 - x0) * 8, y1 - y0), (0, 0, 0, 0))
    for i, c in enumerate(cuadros): tira.paste(c.crop((x0, y0, x1, y1)), (i * (x1 - x0), 0))
    tira.save(os.path.join(OUT, 'compuerta_abre_8.png')); print('compuerta_abre_8', tira.size)
if __name__ == '__main__': main(sys.argv[1:])
