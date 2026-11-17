# Notas de integración

## Canvas / JavaScript genérico
```js
const cfg = await (await fetch('assets/characters/sakura_assets/sakura/animations/animation_config.json')).json();
const man = await (await fetch('assets/characters/sakura_assets/sakura/manifest.json')).json();
function playFrame(name, t) {            // t = segundos desde que empezó
  const a = cfg.animations[name];
  let i = Math.floor(t * a.fps);
  i = a.loop ? i % a.files.length : Math.min(i, a.files.length - 1);
  return a.files[i];                      // ruta del PNG del frame actual
}
```
Dibuja la imagen con el **pivote centro-inferior** sobre la posición de los pies del personaje; voltea con `ctx.scale(-1,1)` al mirar a la izquierda.

## Hitboxes
La caja de colisión NO debe seguir el tamaño del frame (hay estelas y pétalos que lo ensanchan). Usa una caja fija para el cuerpo y cajas de ataque temporales en los `hit_frames` de `animation_config.json`.

## Escala
Los frames tienen entre 374 y 530 px de alto e incluyen espacio transparente. El juego usa una escala de dibujo de 0,155 en el juego principal y ajusta Nivel 1/2 a 110 px de alto; la hitbox sigue siendo independiente de estas medidas.

## Integración en el juego
`manifest.js` expone las secuencias y pivotes para `hero-pro.js` y el motor de Nivel 1/2. Las rutas de imagen parten de la raíz del repositorio; no se necesita cargar los JSON mediante `fetch`.
