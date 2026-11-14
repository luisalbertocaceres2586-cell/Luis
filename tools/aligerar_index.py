#!/usr/bin/env python3
"""Saca de index.html las imágenes incrustadas (base64) y las guarda como archivos en assets/embebidas/.
Sustituye cada una por la ruta del archivo. El navegador las descarga una sola vez y las guarda en caché,
y el index.html queda con solo código. Seguro de repetir: si ya no hay nada incrustado, no cambia nada."""
import base64, hashlib, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX = os.path.join(ROOT, 'index.html'); OUT = os.path.join(ROOT, 'assets', 'embebidas')
src = open(IDX, encoding='utf-8').read(); antes = len(src.encode('utf-8'))
os.makedirs(OUT, exist_ok=True); guardados = {}; cuenta = {'uri': 0, 'crudo': 0}

def guardar(b64, ext):
    raw = base64.b64decode(b64 + '=' * (-len(b64) % 4)); h = hashlib.sha1(raw).hexdigest()[:10]
    nombre = f'{h}.{ext}'; ruta = os.path.join(OUT, nombre)
    if not os.path.exists(ruta): open(ruta, 'wb').write(raw)
    guardados[nombre] = len(raw); return 'assets/embebidas/' + nombre

# 1) direcciones data:image/...;base64,XXXX (en HTML, CSS o JS)
def uri(m):
    ext = {'jpeg': 'jpg', 'jpg': 'jpg', 'png': 'png', 'webp': 'webp', 'gif': 'gif'}[m.group(1)]
    cuenta['uri'] += 1; return guardar(m.group(2), ext)
src = re.sub(r'data:image/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]{200,})', uri, src)

# 2) cadenas JS con base64 "crudo" (las usa _img(), que añade el prefijo data:)
def crudo(m):
    q, b = m.group(1), m.group(2); ext = 'png' if b.startswith('iVBOR') else 'jpg' if b.startswith('/9j/') else 'webp' if b.startswith('UklG') else None
    if not ext: return m.group(0)
    cuenta['crudo'] += 1; return q + guardar(b, ext) + q
src = re.sub(r'(["\'])([A-Za-z0-9+/]{2000,}={0,2})\1', crudo, src)

# 3) _img acepta tanto base64 como una ruta de archivo
vieja = "function _img(b64s){ const i=new Image(); i.src='data:image/png;base64,'+b64s; return i; }"
nueva = "function _img(b64s){ const i=new Image(); i.src=/^assets\\//.test(b64s)?b64s:'data:image/png;base64,'+b64s; return i; }"
if vieja in src: src = src.replace(vieja, nueva)
open(IDX, 'w', encoding='utf-8').write(src)
print('index.html:', antes, '->', len(src.encode('utf-8')), 'bytes')
print('data: sustituidos:', cuenta['uri'], '| cadenas crudas:', cuenta['crudo'], '| archivos nuevos:', len(guardados), '| peso de los archivos:', sum(guardados.values()))
resto = len(re.findall(r'base64,', src)); print('"base64," que quedan en el index:', resto)
