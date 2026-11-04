# Biblioteca de arte — Ninja Multiplicación

Todo el arte ya está **recortado, con fondo transparente y ordenado**. Nada de esto se carga en el juego a menos que un módulo lo pida,
así que puedes agregar sprites sin hacerlo más pesado.

```
assets/
├── characters/          Personajes animados (cada carpeta trae su manifest.js con anclas y grupos)
│   ├── sakura/          carrera 14 · reposo · ataque · golpe · caída · sprint/salto/agachado (cuadros de carrera)
│   ├── kage/            carrera 15 · reposo · ataque · golpe · caída
│   └── villain/         Mago del Caos: caminata (25 cuadros) + portrait.png (ilustración grande)
├── ui/
│   ├── select/          retratos del selector de personajes (3 pares de arte: ?sel=1|2|3)
│   └── intro/           paneles opcionales de la intro (panel_1.jpg … panel_3.jpg)
├── environment/         187 sprites de entornos + catalog.json / catalog.js
│   ├── backgrounds/scenery/   escenas grandes (montañas de hielo, islas flotantes con pagoda)
│   ├── platforms/{grass,stone,ice,lava,wood,crystal,desert}/   plataformas por bioma (campo `top` = línea de la superficie)
│   ├── props/{nature,structures,water,bridges,lights,crystals,objects,islands,decor}/   decorados
│   └── sky/{sun_moon,clouds,clouds_warm,storm,wind,vortex,fx}/   cielo y efectos
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
