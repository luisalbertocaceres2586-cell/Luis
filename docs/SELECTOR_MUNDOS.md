# 🌍 Selector de Mundos — diseño, prompt y plan de trabajo

## 1. ¿Es buena idea? Sí. Por qué

Cada nivel del juego es en realidad **un juego distinto** (Senda ninja con decisiones, Surf de dunas con 4 paisajes, Carrera vertical de farolillos). Obligar a seguir una ruta fija esconde ese valor. Un selector:

| Ventaja | Detalle |
|---|---|
| **Libertad** | El niño elige lo que le apetece hoy; no se frustra con el modo que menos le gusta. |
| **Rejugabilidad** | Los mundos terminados siguen disponibles, marcados con sello y estrellas. |
| **Progreso visible** | "1 de 3 mundos" + sello + estrellas = motivación sin bloquear nada. |
| **Escalable** | Agregar un mundo = agregar **un objeto** en `mundos-registro.js`. |
| **Barato de integrar** | Los niveles ya guardan su avance en el perfil (`nivel1.completados`, `nivel2.completados`, `nivel3.completado`); el selector **lee** eso y no obliga a tocar los niveles. |

**Decisiones de diseño**
- **Nada se bloquea.** Se sugiere un "★ SIGUIENTE" (el primer mundo sin terminar) pero se puede elegir cualquiera.
- **El Nivel 2 es una sola tarjeta** que muestra sus 4 paisajes (dunas → mina de cristal → islas del cielo → templo) en secuencia, porque el nivel los recorre en un único viaje (`directo` solo sirve para practicar jefes).
- **Slot "Próximamente"** al final: anticipa nuevos mundos sin inventar contenido.
- Al terminar un mundo (o salir) se vuelve al selector, donde el mundo recién completado **recibe su sello con animación**.

## 2. Especificación visual (la parte importante)

### Tarjeta de mundo (retrato 5:7, 3 estados de vida)
Cada tarjeta es una **mini-escena viva** hecha con las imágenes del repositorio, en capas con parallax:

```
z6  viñeta + brillo que sigue al puntero
z5  partículas (luciérnagas / arena / cristales / pétalos / farolillos)
z4  héroe del jugador (idle ↔ correr) + compañero/enemigo del mundo
z3  primer plano (props rápidos)
z2  suelo
z1  props medios (bambú, torii, cactus, faroles…)  ← parallax medio
z0  fondo lejano (montañas / mina / cielo / templo) ← parallax lento
    cielo en degradado de la paleta del mundo
```

**Comportamiento (la "pequeña animación del mundo")**
- **En reposo:** el fondo se desliza muy lento, el héroe respira (idle), partículas flotan.
- **Hover / foco / toque:** `playbackRate` ×4 en las capas (se aceleran suavemente), el héroe **corre**, la tarjeta se eleva, inclina en 3D según el puntero y se enciende un halo del color del mundo.
- **Nivel 2:** los 4 paisajes se funden cada ~3 s; puntos indicadores y rótulo ("Dunas · Mina · Cielo · Templo").
- **Al elegir:** las demás tarjetas se apagan, la elegida se agranda y un iris dorado cierra la pantalla con el nombre del mundo; entonces arranca el nivel.
- `prefers-reduced-motion`: todo queda estático (solo se ve el arte).

**Estados**
| Estado | Marca visual |
|---|---|
| Nuevo | Etiqueta "NUEVO" |
| En curso | Etiqueta "EN CURSO" |
| **Terminado** | **Sello rojo "TERMINADO ✔" (hanko) + estrellas + borde dorado + botón ↻ REPETIR** |
| Siguiente sugerido | Anillo pulsante "★ SIGUIENTE" |
| Próximamente | Escala de grises, candado, "???" |

**Pantalla**: fondo borroso que cambia al color/arte de la tarjeta enfocada · barra "🏯 N de M mundos" · carrusel con *scroll-snap* (móvil horizontal) · teclado ← → Enter Esc · tipografía y dorado/violeta iguales al resto del juego.

## 3. Prompt del motor de selección (para regenerar o ampliar)

> Eres un desarrollador senior de juegos HTML5 sin dependencias. Construye `SelectorMundos`, un módulo UMD (`window.SelectorMundos`) que muestra una pantalla de selección de mundos para un juego educativo de tablas de multiplicar con estética ninja.
>
> **Datos:** un registro `MundosRegistro.lista` con objetos `{id, nombre, nivel, lema, tablas, duracion, dificultad, acento, cielo[], fases[{nombre, far, suelo}], props[{img, x, h, vel}], extra, heroe:'corre'|'vuela', particulas, bloqueado, visible(perfil), estado(perfil), url(perfil)}`. Agregar un mundo no debe exigir tocar el motor.
> **API:** `abrir({perfil, lanzar:{id:fn}, cerrable, onCerrar})`, `cerrar()`, `estado(perfil)`.
> **Estado** se *deriva* del perfil (nunca se duplica): `nuevo | en_curso | completado`, con `estrellas`. "Siguiente" = primer mundo no completado.
> **Visual:** tarjetas retrato 5:7 con escena en capas y parallax usando Web Animations API (`updatePlaybackRate` para acelerar en hover), héroe con frames PNG (idle/correr o alfombra voladora) precargados, partículas CSS, inclinación 3D con puntero, brillo especular, sello hanko animado al completar por primera vez, transición de iris al lanzar. Debe verse bien en landscape móvil (altura ~360 px) y escritorio.
> **Rendimiento:** solo anima tarjetas visibles (`IntersectionObserver`), animaciones en `transform`/`opacity`, frames con un único `requestAnimationFrame`.
> **Accesibilidad:** roles `listbox/option`, foco visible, teclado completo, `prefers-reduced-motion`.
> **Aislamiento:** el overlay detiene la propagación del teclado (el juego escucha todo el documento) y no depende de variables globales del juego.

## 4. Plan de trabajo

| Fase | Entregable | Estado |
|---|---|---|
| 0 | Auditoría del repo: niveles, perfiles, banderas de "completado", arte reutilizable | ✅ |
| 1 | Registro de mundos (`engine/ui/mundos-registro.js`) | ✅ |
| 2 | Motor + estilos del selector (`selector-mundos.js/.css`) | ✅ |
| 3 | Página de pruebas `mundos.html` (sin tocar el juego) | ✅ |
| 4 | Integración: `perfil-ui.js` abre el selector; Nivel 2/3 y fin del Nivel 1 vuelven a él | ✅ |
| 5 | Pruebas visuales en escritorio y móvil horizontal | ✅ |
| 6 | Pulido: sonidos de UI, tarjetas con vista previa de jefe, 4.º mundo real, "último jugado" | ⏳ siguiente |

## 5. Cómo agregar un mundo nuevo
1. Agrega un objeto a `MundosRegistro.lista` (copia uno existente).
2. Haz que su nivel guarde `perfil.<id>.completado = true` (o define `estado(p)` en el registro).
3. Define su `url(p)` o pásalo en `lanzar`.
Listo: aparece en el selector con su tarjeta animada.
