# 🧭 Cómo trabajar en varias pestañas a la vez sin pisarse

## La idea en una frase
**Una pestaña = una rama = una tarea.** Cada pestaña (o persona) trabaja en su propia copia, y se junta con `main` por pasos
pequeños y frecuentes. Los conflictos no se evitan del todo, pero se vuelven **pocos, pequeños y fáciles**.

## Por qué chocaban los cambios (datos reales de este repo)
En los últimos 120 commits de `main`:

| Archivo | Veces que cambió | Por qué chocaba | Qué se hizo |
|---|---|---|---|
| `version.json` | **40** (1 de cada 3 commits) | cada pestaña lo cambiaba a mano | **Ahora lo escribe GitHub solo.** Nadie lo toca |
| `nivel3.html` / `engine/nivel3/corredor.js` | 26 / 24 | varias pestañas mejorando el Nivel 3 a la vez | regla: **una sola pestaña** en el Nivel 3 a la vez (ver abajo) |
| `index.html` | 20 | cada módulo nuevo agrega su `<script>` en la misma zona | agrega tu línea y sincroniza seguido |
| `types/globales.d.ts` | varios | todos declaraban sus módulos en el mismo archivo | **un archivo por módulo** en `types/modulos/` |

## 5 reglas de oro
1. **Nunca edites `main` directo.** Cada tarea en su rama: `npm run rama -- nombre-de-la-tarea`.
2. **Sube tu rama a GitHub desde el primer día** (`git push -u origin tu-rama`) y cada vez que termines algo. Así nada se pierde aunque se dañe tu computador.
3. **Sincroniza seguido** (`npm run sincronizar`), mejor cada vez que vuelvas a la pestaña. Un conflicto de 1 día es chico; uno de 1 semana es una pesadilla.
4. **Mira el radar antes de empezar a editar un archivo grande**: `npm run radar` te dice si otra pestaña ya lo tocó.
5. **Tareas chicas, Pull Requests chicos.** Mientras menos archivos toque tu rama, menos puede chocar.

## Los comandos (copia y pega)
| Quiero… | Comando |
|---|---|
| Empezar una tarea nueva | `npm run rama -- arreglar-nivel-3` |
| Ver dónde estoy (rama, cambios sin guardar, qué me falta de main) | `npm run estado` |
| Saber si habrá conflicto **antes** de que pase | `npm run radar` |
| Traer lo último de main a mi rama | `npm run sincronizar` |
| Comprobar que todo funciona (tipos + pruebas) | `npm run verify` |
| Ajustes de git que ayudan con conflictos (una sola vez) | `npm run configurar` |

`npm run sincronizar` resuelve solo lo que se puede (por ejemplo `version.json`). Si queda un conflicto real, te dice **qué archivos** y qué hacer; si algo sale mal, `git merge --abort` deja todo como estaba.

## 📋 Texto para pegar al empezar CADA pestaña de Claude
```
Trabaja SOLO en una rama propia llamada "<nombre-de-la-tarea>" creada desde el main más reciente
(npm run rama -- <nombre-de-la-tarea>). No edites main. No toques version.json (se genera solo).
Antes de empezar y antes de terminar ejecuta: npm run radar y npm run sincronizar.
Sube la rama con git push -u origin <nombre-de-la-tarea> y ábreme el Pull Request.
Esta pestaña SOLO se ocupa de: <describe la tarea>. No cambies archivos que no tengan que ver.
```

## Cuando dos tareas SÍ necesitan el mismo archivo
- **Nivel 3** (`nivel3.html`, `corredor.js`): una sola pestaña a la vez. Termina y fusiona la primera antes de abrir la segunda.
- **`index.html`**: agrega tu `<script>` y fusiona rápido; es una línea, el conflicto se arregla en segundos.
- **`engine/juego-principal.js`** (8 700 líneas): si dos pestañas lo editan, deben tocar **funciones distintas**. Pregunta antes con `npm run radar`.
- **Tipos** (`types/`): agrega tu módulo con un archivo **nuevo** en `types/modulos/`, no edites `globales.d.ts`.

## Ajustes de GitHub (una sola vez, 3 minutos, desde la web)
Repositorio → **Settings**:
1. **General → Pull Requests**: activa **"Always suggest updating pull request branches"** y **"Automatically delete head branches"**.
2. **Actions → General → Workflow permissions**: elige **"Read and write permissions"** (lo necesita la versión automática).
3. **Branches → Add rule** para `main`: activa **"Require status checks to pass"** y marca **"Verificar"** (así nada con errores entra a `main`).
   - ⚠️ No actives "Require a pull request before merging" para el administrador si quieres que el robot de versión pueda escribir; o permite que `github-actions` se salte la regla.

## La versión ahora es automática
Cuando algo se fusiona en `main`, la acción **Publicar versión** escribe `AAAA-MM-DD-<commit>` en `version.json` **y** en `window.NJ_BUILD`
de `index.html` (antes podían quedar distintos, y el juego se recargaba solo una vez por sesión). **No edites `version.json` en tu rama**:
si lo haces, el Pull Request muestra un aviso amarillo. Si necesitas forzarla a mano: `npm run publicar`.

## Si crees que perdiste trabajo
Casi nunca se pierde. En orden:
1. `git status` y `git stash list` (cambios guardados temporalmente).
2. `git reflog` muestra **todo** lo que hiciste en los últimos días, incluso tras errores; recupera con `git switch -c rescate <código>`.
3. Mira tu rama en GitHub: si hiciste `push`, está ahí.
4. **Nunca uses `git push --force`** ni `git reset --hard` sin pedir ayuda primero.

## Ideas para más adelante (cambian la forma del código, por eso no se hicieron aún)
- Partir `juego-principal.js` y `corredor.js` en archivos por tema (física, dibujo, jefes…): archivos más chicos = menos choques.
- Un solo archivo con la lista de scripts que carga el juego, en vez de editar `index.html` a mano.
