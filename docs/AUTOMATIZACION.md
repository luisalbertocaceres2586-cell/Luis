# Automatización: peso, rendimiento y modo sin internet

Todo esto corre solo en GitHub (pestaña **Actions**). Resumen de qué hace cada pieza y cómo ajustarla.

| Pieza | Cuándo corre | Qué hace |
|---|---|---|
| `rendimiento.yml` → **Presupuesto de peso** | cada PR y cada fusión a `main` | Falla si `index.html`, el motor o los recursos pasan los límites de `tools/presupuesto.json`, o si el PR añade una imagen de más de 1,5 MB. |
| `rendimiento.yml` → **FPS y sin internet** | cada PR y cada fusión a `main` | Abre el juego en un Chromium sin pantalla: mide FPS (por la mediana) y tiempo de carga (`fps.mjs`), comprueba que tras precargar y **apagar el servidor** el juego abre igual (`offline.mjs`), que el dibujo interpolado a 120 Hz no altera la física (`interp.mjs`) y que WebP descarga menos sin imágenes rotas (`webp.mjs`). Guarda capturas como artefacto. **El FPS bajo solo avisa** (⚠️) hasta calibrarlo con datos reales de GitHub: mira la tabla del primer PR y, si quieres exigirlo, pon `FPS_ESTRICTO=1` y ajusta `fps_min` en `tools/presupuesto.json`. |
| `optimizar-imagenes.yml` | PR que toca `assets/**/*.png`, o a mano | Comprime los PNG **sin pérdida** (mismo aspecto, mismo nombre) y lo guarda en la rama del PR. A mano permite `usados`/`todo` y, opcionalmente, reducción de colores con calidad mínima 85. |
| `publicar-version.yml` (ya existía) | al fusionar a `main` | Además de `version.json`, ahora regenera `precache.json` (lista de archivos para jugar sin internet). |
| `codeql.yml` | PR, `main` y cada lunes | Busca vulnerabilidades de JavaScript. |
| `dependabot.yml` | mensual | Abre PR para actualizar acciones de GitHub y TypeScript. |

## Jugar sin internet (opcional)
El juego completo pesa ~72 MB (con WebP), así que **no se descarga solo con datos móviles**. Para activarlo en un teléfono, abre el juego **una vez** con Wi‑Fi y la dirección terminada en `?offline=1` (por ejemplo `.../Luis/?offline=1`). Aparece «✅ Listo: el juego ya funciona sin internet».
- Se recuerda en ese teléfono. Después se mantiene al día solo, **nunca con datos móviles ni con ahorro de datos**.
- `?offline=0` lo olvida. `?sw=0` apaga todo el sistema de caché (interruptor de emergencia que ya existía).
- Si falta espacio en el teléfono, no descarga nada y lo avisa.
- Solo baja lo que falta: lo que ya estaba guardado no se vuelve a descargar.

### Si una imagen no aparece sin internet
Algunas imágenes se nombran con código (`'coin_'+i+'.png'`) y el escáner no las ve. Agrega su carpeta en `tools/precache-extra.json` → `carpetas`, y ejecuta `npm run precache`. La prueba `offline.mjs` te dice cuál falla.

## Comandos locales
```
npm run precache       # regenera precache.json
npm run presupuesto    # mide el peso contra los límites
npm run optimizar -- --usados --dry   # cuánto ahorraría comprimir (necesita: sudo apt install optipng pngquant)
```

## Subir un límite a propósito
Si el juego crece de verdad (más niveles, más arte), edita `tools/presupuesto.json` **en el mismo PR**, para que quede explicado.

## WebP
Ya está hecho (ver `docs/CALIDAD-INTERPOLACION-WEBP.md`). La lista de precarga y el presupuesto de peso cuentan el `.webp` cuando existe, porque es lo que el jugador descarga.
