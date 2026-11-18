#!/usr/bin/env python3
"""Genera assets/characters/antarez/manifest.js (ANTAREZ_MANIFEST) a partir de anchors.json.
Cada animación lista los frames (prefijo_NN) que usa. Editar ANIMS para cambiar qué frame va en cada movimiento.
Uso: python3 tools/generar_manifest_antarez.py"""
import json
D='assets/characters/antarez'
A=json.load(open(f'{D}/anchors.json'))
def seq(p,*ns): return [f'{p}_{n:02d}' for n in ns]
R=lambda p,a,b: seq(p,*range(a,b+1))
# nombre: (frames, fps, bucle)
ANIMS={
 # --- en tierra ---
 'idle':(seq('mov',1,2),3,True),
 'idle_hono':(seq('hono',1),3,True),'idle_raiden':(seq('raiden',1),3,True),'idle_kaze':(seq('kazea',1)+seq('kazeb',1),2.5,True),
 'walk':(seq('mov',3,1,4,2),8,True),
 'run':(R('run',1,24),24,True),
 'sprint':(seq('mov',5,6,7,8),16,True),          # con turbo de velocidad
 'crouch_enter':(seq('mov2',4),12,False),'crouch':(seq('mov2',4),6,True),'crawl':(seq('mov2',4),8,True),
 'slide':(seq('mov2',5),14,False),
 'dash':(seq('mov2',5),12,False),'dash_hono':(seq('hono',8),12,False),'dash_raiden':(seq('raiden',8),12,False),'dash_kaze':(seq('kazea',8),12,False),
 # --- aire ---
 'jump':(seq('mov2',1,2)+seq('jump',4,13,15),12,False),   # secuencia corta (compatibilidad con el dibujo antiguo)
 'jump_up':(seq('mov2',1)+seq('jump',2,3,4,5,7,8,9,10),12,False),   # impulso → subida → cima (según la velocidad vertical)
 'jump_fall':(seq('jump',13,14,15,16,17),10,False),
 'fall_fast':(seq('jump',11,12),12,True),
 'dive':(seq('jump',1),10,True),
 'jump_up_A':(seq('mov2',1,2),10,False),'jump_fall_A':(seq('mov2',3),10,False),   # alternativa ?saltoA=1 (hoja 2)
 'jump_flip':(seq('mov2',2,7)+seq('jump',6),14,False),    # doble salto
 'land':(seq('jump',18,19,24),14,False),
 'land_hard':(seq('jump',19,20,21,22,23,24),14,False),
 'glide':(seq('kazea',5)+seq('kazeb',5,7),10,True),       # planeo con Kaze (viento)
 # --- pared ---
 'wall_grab':(seq('mov2',6),6,True),'wall_slide':(seq('mov2',6),8,True),'wall_climb':(seq('mov2',6),10,True),
 'wall_jump':(seq('mov2',6,7),12,False),
 # --- katanas ---
 'melee':(seq('hono',2,3,4,8,1),14,False),
 'melee_hono':(seq('hono',2,3,4,8,1),14,False),'melee_air_hono':(seq('hono',5,6),14,False),
 'melee_raiden':(seq('raiden',2,3,4,8,1),14,False),'melee_air_raiden':(seq('raiden',5,6),14,False),
 'melee_kaze':(seq('kazea',2,3,4)+seq('kazeb',2,3,4,8),14,False),
 'melee_air_kaze':(seq('kazea',5,6)+seq('kazeb',5,6),14,False),
 'special':(seq('hono',7,8),10,False),
 'special_hono':(seq('hono',7,8),10,False),'special_raiden':(seq('raiden',7,8),10,False),'special_kaze':(seq('kazea',7)+seq('kazeb',7)+seq('kazea',8),10,False),
 'kunai':(seq('kunai',1,2,3,4,5,6,7,8,9,11,12,13,14,16,17,18,19,20),12,False),
 # --- estados ---
 'hurt':(seq('mov2',8,3),10,False),
 'death':(seq('mov2',8,7,4)+seq('jump',23),8,False),
 'win':(seq('hono',7)+seq('raiden',7)+seq('kazea',7),6,False),
}
animations={}
for name,(frames,fps,loop) in ANIMS.items():
    fr=[]
    for f in frames:
        m=A[f+'.png'];fr.append({'file':f+'.png','ax':m['ax'],'ay':m['ay'],'w':m['w'],'h':m['h']})
    animations[name]={'fps':fps,'loop':loop,'frames':fr}
used={f['file'] for a in animations.values() for f in a['frames']}
proj={'kunai_10.png','kunai_15.png'}                        # proyectiles: se dibujan en las balas (hero-pro.js)
falta=sorted(set(A)-used-proj)
assert not falta,'frames sin usar: '+', '.join(falta)
js='''/* Antarez · manifiesto de animaciones (generado por tools/generar_manifest_antarez.py — no editar a mano).
   Frames normalizados (misma escala de cabeza) en assets/characters/antarez/. Mira a la DERECHA. */
(function(root){
'use strict';
const A=%s;
// ?saltoA=1 → el salto usa solo las poses de la hoja 2 (armadura plateada) en vez de la hoja 9 (armadura oscura)
if(/[?&]saltoA=1/.test(root.location.search)){A.jump_up=A.jump_up_A;A.jump_fall=A.jump_fall_A;}
root.ANTAREZ_MANIFEST={
  character:'Antarez',base:'assets/characters/antarez/',fluid:true,scale:0.34,
  kmul:{idle:1,walk:1,run:1,sprint:1,jump:1,crouch:1,atk:1,hurt:1},
  ppf:{walk:11,run:3.3,sprint:17},
  animations:A,
  jumpMap:[0,1,2,3,4],
  hitFrames:{melee:[2,3,4]},
  katanas:{
    hono:{name:'Honō (fuego)',icon:'🔥',colors:['#FF8A1F','#FFD34A','#FF3B1F']},
    raiden:{name:'Raiden (rayo)',icon:'⚡',colors:['#3DA9FF','#BFEFFF','#FFE24A']},
    kaze:{name:'Kaze (viento)',icon:'🌪️',colors:['#33E67A','#B8FFD2','#1FBF5A']}
  },
  projectiles:{twin:{file:'kunai_10.png',ax:%s,ay:%s,w:%s,h:%s},single:{file:'kunai_15.png',ax:%s,ay:%s,w:%s,h:%s}}
};
})(window);
''' % (json.dumps(animations,separators=(',',':'),ensure_ascii=False),
       A['kunai_10.png']['ax'],A['kunai_10.png']['ay'],A['kunai_10.png']['w'],A['kunai_10.png']['h'],
       A['kunai_15.png']['ax'],A['kunai_15.png']['ay'],A['kunai_15.png']['w'],A['kunai_15.png']['h'])
open(f'{D}/manifest.js','w',encoding='utf-8').write(js)
print(len(animations),'animaciones;',len(used)+len(proj),'/',len(A),'frames asignados')
