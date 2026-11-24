# Asistente de avances (aceptación automática de solicitudes)

Un robot de GitHub que se encarga de **recibir, ordenar y aceptar** tus avances para que no se pisen entre sí.
Funciona solo: subes una rama y listo.

## Qué hace, paso a paso (una rama a la vez, nunca en paralelo)
1. **Abre la solicitud de extracción** (PR) de la rama si no existe.
2. **La pone al día con `main`.** Si hay choques *tontos* los resuelve solo:
   - `version.json` y `window.NJ_BUILD` → gana el de `main` (los escribe GitHub solo al fusionar).
   - Números de caché `?v=N` → si dos ramas subieron el mismo número, usa el mayor **+1** (ningún celular se queda con la copia vieja).
   - Listas de `<script>` / `<link>` → si las dos ramas solo **añadieron** etiquetas, conserva las de las dos.
3. **Corre los chequeos:** tipos (`npm run typecheck`), pruebas (`npm test`) y, **solo de los niveles que tocaste**, las pruebas en un navegador real (robot del Nivel 1 + habilidades, o Nivel 3).
4. **Si todo pasa:** la acepta (*squash*), borra la rama y publica el número de versión.
   **Si algo falla:** NO la acepta; deja un comentario en la solicitud con el motivo y una etiqueta:
   - `conflicto-manual` → choque real; resuélvelo con `npm run sincronizar` y vuelve a subir.
   - `revisar-pruebas` → fallaron los chequeos; arréglalo y vuelve a subir, el asistente reintenta solo.

Se activa **al subir una rama**, cada **2 horas** (por si algo quedó pendiente) y a mano desde *Actions → Asistente de avances → Run workflow*.

## Instalación (una sola vez, 3 clics en GitHub)
1. **Settings → Actions → General → Workflow permissions**
   - marca **Read and write permissions**
   - marca **Allow GitHub Actions to create and approve pull requests** → *Save*.
2. Si `main` tiene una **regla de protección** que exige revisión o chequeos obligatorios, el robot no podrá aceptar. Opciones: quitar esa exigencia, o crear un token propio (ver «Opcional» abajo).
3. Fusiona este avance a `main`. Desde ese momento las ramas **nuevas** ya lo usan; las ramas **viejas** (creadas antes) las recoge el barrido de cada 2 horas, o ejecútalo a mano.

## Cómo pausarlo
- Etiqueta **`no-automerge`** en la solicitud → la deja quieta.
- Ramas que empiezan por **`wip/`** o **`borrador/`** → las ignora siempre.
- Navegador: en *Settings → Secrets and variables → Actions → Variables* crea `PRUEBAS_NAVEGADOR` = `0` para apagar solo esas pruebas (más rápido, menos seguro).

## Opcional: que el robot use un token tuyo
Por defecto usa el token de GitHub Actions, que **no dispara otros flujos**; por eso el asistente publica él mismo la versión.
Si prefieres que cada fusión dispare todo lo demás (`verificar`, `publicar-version`, etc.): crea un token personal **nuevo** (solo este repositorio, permisos *Contents* y *Pull requests* en *Read and write*), guárdalo en *Settings → Secrets → Actions* con el nombre **`BOT_TOKEN`**. Nunca lo pegues en un chat.

## Archivos
| Archivo | Para qué |
|---|---|
| `.github/workflows/asistente-prs.yml` | cuándo se despierta el robot |
| `tools/asistente-prs.sh` | el flujo de cada rama |
| `tools/resolver-conflictos.js` | resuelve los choques tontos (probado en `tests/resolver-conflictos.test.js`) |
| `tools/revisar-avance.sh`, `tools/revisar-navegador.sh` | los chequeos antes de aceptar |
