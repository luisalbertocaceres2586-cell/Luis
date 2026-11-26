#!/usr/bin/env python3
"""Convierte a WebP los PNG que usa el juego y deja el juego listo para usarlos.  (npm run webp)

Qué hace:
  1. Toma los PNG que el juego usa de verdad (tools/lib-referencias.js: lee el código, no el disco; ignora _originales, docs, etc.).
  2. Crea  imagen.webp  JUNTO a  imagen.png  (el PNG se queda: es el original y el respaldo si un navegador viejo no lee WebP).
     Elige solo con una garantía de calidad medida (PSNR sobre color con alfa premultiplicado):
        · con pérdida (calidad 88, luego 94) si el resultado es casi idéntico (PSNR ≥ 40 dB)  → ahorro típico 60-80 %
        · si no, WebP SIN pérdida (píxeles idénticos)
        · si no ahorra al menos 20 %, se deja el PNG y no se crea WebP.
     La transparencia se guarda sin pérdida (alpha_quality=100).
  3. Genera engine/core/webp-mapa.js (qué PNG tienen WebP) que usa engine/core/webp.js para cargar el WebP automáticamente
     desde el código JS (new Image().src = '….png' → se pide el .webp).
  4. Cambia, en los .html y engine/ui/*.css, las rutas «assets/….png» que tengan WebP por «….webp» (el navegador las lee antes de que corra cualquier JS).
Es REANUDABLE (salta lo ya convertido) y se puede repetir cuando se agreguen imágenes nuevas.
Uso:  python3 tools/convertir_webp.py [--solo-mapa] [--umbral 40] [--lista archivo.txt]
Requiere: Pillow y numpy (pip install pillow numpy) y Node.
"""
import hashlib, io, json, math, os, re, subprocess, sys, glob
import numpy as np
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
UMBRAL = float(sys.argv[sys.argv.index('--umbral') + 1]) if '--umbral' in sys.argv else 40.0
AHORRO_MIN = 0.20

def lista_png():
    if '--lista' in sys.argv:
        return [l.strip() for l in open(sys.argv[sys.argv.index('--lista') + 1], encoding='utf8') if l.strip()]
    js = "const {referencias}=require('./tools/lib-referencias');console.log(JSON.stringify([...referencias().activos].filter(f=>/\\.png$/i.test(f))))"
    out = subprocess.run(['node', '-e', js], cwd=RAIZ, capture_output=True, text=True, check=True).stdout
    return sorted(json.loads(out))

def cargar(p):
    im = Image.open(p); im.load()
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    return im

def premult(im):
    a = np.asarray(im.convert('RGBA'), dtype=np.float32)
    a[..., :3] *= a[..., 3:4] / 255.0
    return a

def psnr(ref, im2):
    mse = float(np.mean((ref - premult(im2)) ** 2))
    return 99.0 if mse == 0 else 10 * math.log10(255.0 * 255.0 / mse)

def codificar(im, **kw):
    b = io.BytesIO(); im.save(b, 'WEBP', method=4, **kw); return b.getvalue()

def convertir(rel):
    png = os.path.join(RAIZ, rel); webp = png[:-4] + '.webp'
    if os.path.exists(webp) and os.path.getmtime(webp) >= os.path.getmtime(png):
        return 'ya', os.path.getsize(png), os.path.getsize(webp)
    o = os.path.getsize(png)
    im = cargar(png); ref = premult(im); mejor = None; modo = ''
    for q in (88, 94):
        d = codificar(im, quality=q, alpha_quality=100)
        if psnr(ref, Image.open(io.BytesIO(d))) >= UMBRAL: mejor, modo = d, 'pérdida'; break
    if mejor is None:
        d = codificar(im, lossless=True)
        mejor, modo = d, 'sin pérdida'
    if len(mejor) > o * (1 - AHORRO_MIN):
        if os.path.exists(webp): os.remove(webp)
        return 'descartado', o, o
    open(webp, 'wb').write(mejor)
    return modo, o, len(mejor)

def mapa(pngs):
    por_dir = {}
    for rel in pngs:
        if os.path.exists(os.path.join(RAIZ, rel[:-4] + '.webp')):
            d, n = rel.rsplit('/', 1); por_dir.setdefault(d + '/', []).append(n[:-4])
    for v in por_dir.values(): v.sort()
    cuerpo = json.dumps(dict(sorted(por_dir.items())), ensure_ascii=False, separators=(',', ':'))
    texto = ('/* GENERADO por tools/convertir_webp.py — no editar a mano. PNG que tienen un .webp al lado (carpeta → nombres sin extensión). */\n'
             'window.NJ_WEBP_MAPA=' + cuerpo + ';\n')
    open(os.path.join(RAIZ, 'engine/core/webp-mapa.js'), 'w', encoding='utf8').write(texto)
    version = hashlib.md5(texto.encode('utf8')).hexdigest()[:8]            # cambia solo si cambia el mapa → rompe la caché a tiempo
    for f in glob.glob(os.path.join(RAIZ, '*.html')):
        h = open(f, encoding='utf8').read()
        n = re.sub(r'(engine/core/webp-mapa\.js\?v=)[\w]+', r'\g<1>' + version, h)
        if n != h: open(f, 'w', encoding='utf8').write(n)
    return {d + n + '.png' for d, ns in por_dir.items() for n in ns}

def reescribir(conjunto):
    patron = re.compile(r'assets/[^"\'()\s?#<>]*?\.png', re.I)
    cambios = 0
    for f in sorted(glob.glob(os.path.join(RAIZ, '*.html')) + glob.glob(os.path.join(RAIZ, 'engine/ui/*.css'))):
        s = open(f, encoding='utf8').read()
        def sub(m):
            nonlocal cambios
            if m.group(0) in conjunto: cambios += 1; return m.group(0)[:-4] + '.webp'
            return m.group(0)
        n = patron.sub(sub, s)
        if n != s: open(f, 'w', encoding='utf8').write(n)
    return cambios

if __name__ == '__main__':
    pngs = lista_png()
    print(f'{len(pngs)} PNG usados por el juego')
    tot = {'pérdida': 0, 'sin pérdida': 0, 'descartado': 0, 'ya': 0}; ob = wb = 0
    if '--solo-mapa' not in sys.argv:
        for i, rel in enumerate(pngs, 1):
            try: modo, o, w = convertir(rel)
            except Exception as e: modo, o, w = 'descartado', 0, 0; print('  ✗', rel, e)
            tot[modo] += 1; ob += o; wb += (w if modo != 'descartado' else o)
            if i % 100 == 0: print(f'  {i}/{len(pngs)}  PNG {ob/1048576:.1f} MB → {wb/1048576:.1f} MB', flush=True)
        print('Resultado:', tot, f'| PNG {ob/1048576:.1f} MB → {wb/1048576:.1f} MB ({100 - 100*wb/max(ob,1):.0f}% menos)')
    conjunto = mapa(pngs)
    print(f'webp-mapa.js: {len(conjunto)} imágenes con WebP · rutas reescritas en html/css: {reescribir(conjunto)}')
