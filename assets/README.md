# Biblioteca de arte — Ninja Multiplicación

> **Índice maestro con la descripción, tamaño, uso y etiquetas de CADA imagen: [`CATALOGO.md`](CATALOGO.md) (para personas) y `catalogo.json` (para programas).**
> `environment/catalog.json` es el detalle técnico de los sprites de entornos (anclas y alturas de superficie).

Todo el arte ya está **recortado, con fondo transparente y ordenado**. Nada de esto se carga en el juego a menos que un módulo lo pida,
así que puedes agregar sprites sin hacerlo más pesado.

```
assets/
├── characters/          Personajes animados (cada carpeta trae su manifest.js con anclas y grupos)
│   ├── sakura/          carrera 14 · reposo · ataque · golpe · caída · sprint/salto/agachado (cuadros de carrera)
│   ├── kage/            carrera 15 · reposo · ataque · golpe · caída
│   └── villain/         Mago del Caos: caminata (25 cuadros) + portrait.png (ilustración grande)
├── ui/
│   ├── hud/             HUD nuevo: marcos, barra de vida, retratos (2 héroes × 4 estados), iconos, animados, progreso, efectos del héroe, bordes de peligro (cada subcarpeta trae su LEEME.md)
│   ├── poderes/         29 íconos de poderes (insignias de 256 px)
│   ├── select/          retratos del selector de personajes (3 pares de arte: ?sel=1|2|3)
│   └── intro/           paneles opcionales de la intro (panel_1.jpg … panel_3.jpg)
├── effects/             efectos de impacto del meteorito: explosiones, anillos, grietas, cráter, humo, rocas, haz de luz (fuego · hielo · magia)
├── environment/         214 sprites de entornos + catalog.json / catalog.js
│   ├── backgrounds/scenery/   escenas grandes (montañas de hielo, islas flotantes con pagoda)
│   ├── backgrounds/themes/    montañas recoloreadas por tema (desierto, noche, selva, agua, lava, tormenta, hielo) para fondos con parallax
│   ├── platforms/{grass,stone,ice,lava,wood,crystal,desert}/   plataformas anchas por bioma (campo `top` = línea de la superficie)
│   ├── platforms/islands/     30 islas flotantes compactas que usa el módulo de islas del juego (+ islas.js con la superficie de cada una)
│   ├── levels/nivel1/         arte exclusivo del nivel 1 (montañas lejanas y nubes) + nubes.js
│   ├── props/{nature,structures,water,bridges,lights,crystals,objects,islands,decor}/   decorados
│   └── sky/{sun_moon,clouds,clouds_warm,storm,wind,vortex,fx}/   cielo y efectos
├── _originales/hud/     archivos de arte tal como se recibieron (hojas y GIF) para volver a recortar
└── _previews/           hojas de contacto (JPG) para ver todo de un vistazo
```

## Convenciones
- **Nombres:** `objeto_variante_hoja` — el sufijo es la hoja de origen (`sakura_tree_a` … `sakura_tree_d` son cuatro versiones del mismo árbol).
  Plataformas: `platform_<bioma>_<hoja><nn>`.
- **catalog.json / catalog.js** (`window.ENV_CATALOG`): `id, file, cat, sub, w, h, anchor [x,y]`.
  `anchor` es el punto de apoyo (props y plataformas: centro-abajo `[0.5,1]`; cielo: centro `[0.5,0.5]`).
  Las plataformas traen `top` (0–1): altura aproximada de la superficie donde se pisa.
- Los personajes usan `ax, ay` en píxeles del PNG (centro de los pies y línea del suelo).

## Cosas a tener en cuenta
- `sky/clouds/cloud_group_*` es un grupo de varias nubes que venía pegado en la hoja original.
- Algunas clasificaciones por bioma de las plataformas se hicieron por color y se corrigieron a mano; si alguna está en la carpeta equivocada, solo hay que moverla y actualizar el catálogo.
- Peso total de `environment/`: unos 26 MB en PNG. Si hace falta, se puede convertir a WebP para reducirlo mucho.
