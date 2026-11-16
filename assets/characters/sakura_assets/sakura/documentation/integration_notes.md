# Notas de integración

## Canvas / JavaScript genérico
```js
const cfg = await (await fetch('assets/characters/sakura/animations/animation_config.json')).json();
const man = await (await fetch('assets/characters/sakura/manifest.json')).json();
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
Los frames están a tamaño original de generación (~230–260 px de alto el cuerpo). Ajusta la escala de dibujo para que Sakura mida lo mismo que el personaje anterior.

## Pendiente de integrar en el repositorio
No se ha modificado el código del juego: ver el informe de entrega.
