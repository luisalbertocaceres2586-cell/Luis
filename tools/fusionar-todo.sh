#!/usr/bin/env bash
# Robot de fusión: recorre los Pull Requests abiertos, los pone al día con main, los verifica y los fusiona si todo está bien.
# Lo llama .github/workflows/auto-fusionar.yml.   Uso:  tools/fusionar-todo.sh [numero_de_PR]   (sin número = todos los abiertos)
# Si algo no se puede resolver solo (choque real de código, pruebas rotas), NO se fusiona: se marca el PR con la etiqueta "necesita-revision" y se explica en un comentario.
set -u
SOLO="${1:-}"
ETQ="necesita-revision"
NODE_TEST="${FUSION_VERIFICAR:-npm run typecheck && npm test}"     # en las pruebas del robot se cambia por algo rápido
git config user.name "robot-fusion"; git config user.email "robot-fusion@users.noreply.github.com"

tiene_etiqueta() { gh pr view "$1" --json labels --jq '.labels[].name' 2>/dev/null | grep -qx "$2"; }
avisar() {   # numero, titulo, detalle
  local n="$1"
  tiene_etiqueta "$n" "$ETQ" && return 0
  gh label create "$ETQ" --color d93f0b --description "El robot no pudo fusionarlo solo" >/dev/null 2>&1 || true
  gh pr edit "$n" --add-label "$ETQ" >/dev/null 2>&1 || true
  gh pr comment "$n" --body "🤖 **No pude fusionar este PR solo.** $2

$3

Cuando lo arregles y subas tu rama, lo vuelvo a intentar automáticamente." >/dev/null 2>&1 || true
}

fusionar_uno() {
  local n="$1" rama
  rama=$(gh pr view "$n" --json headRefName --jq .headRefName)
  echo "━━ PR #$n ($rama)"
  git fetch -q origin "$rama" main || { echo "no se pudo traer la rama"; return 1; }
  git checkout -q -B "pr-$n" "origin/$rama" || return 1
  local salida; salida=$(node tools/fusionar-pr.js unir 2>&1); local cod=$?
  echo "$salida"
  if [ "$cod" -eq 2 ]; then
    avisar "$n" "Los dos lados cambiaron las mismas líneas." "$(echo "$salida" | grep 'CONFLICTO REAL' | sed 's/^/- /')

Para arreglarlo en tu computador:  \`npm run sincronizar\`  → resuelve los archivos marcados → \`git push\`."
    return 0
  fi
  [ "$cod" -ne 0 ] && { avisar "$n" "La unión con main falló." "$salida"; return 0; }
  local ver; ver=$(bash -c "$NODE_TEST" 2>&1); local cv=$?
  if [ "$cv" -ne 0 ]; then
    echo "$ver" | tail -25
    avisar "$n" "Las comprobaciones (tipos y pruebas) fallan después de unirlo con main." "\`\`\`
$(echo "$ver" | tail -25)
\`\`\`"
    return 0
  fi
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$rama")" ]; then
    git push -q origin "HEAD:$rama" || { avisar "$n" "No pude subir la rama puesta al día." ""; return 0; }
  fi
  local i
  for i in 1 2 3 4 5 6; do
    if gh pr merge "$n" --merge --delete-branch --match-head-commit "$(git rev-parse HEAD)" 2>&1; then
      tiene_etiqueta "$n" "$ETQ" && gh pr edit "$n" --remove-label "$ETQ" >/dev/null 2>&1
      echo "✔ PR #$n fusionado"; FUSIONADOS=$((FUSIONADOS+1)); return 0
    fi
    sleep "${FUSION_ESPERA:-10}"
  done
  avisar "$n" "GitHub no me dejó fusionarlo (revisa reglas de la rama o permisos)." ""
}

FUSIONADOS=0
if [ -n "$SOLO" ]; then
  gh pr edit "$SOLO" --remove-label "$ETQ" >/dev/null 2>&1 || true      # alguien subió algo nuevo: se evalúa de cero
  LISTA="$SOLO"
else
  LISTA=$(gh pr list --state open --base main --limit 50 --json number,isDraft,isCrossRepository,labels \
    --jq '[.[] | select(.isDraft|not) | select(.isCrossRepository|not) | select([.labels[].name] | (index("'"$ETQ"'")|not) and (index("no-fusionar")|not)) | .number] | sort | .[]')
fi
for n in $LISTA; do
  if [ -n "$SOLO" ]; then
    estado=$(gh pr view "$n" --json state,isDraft,isCrossRepository,baseRefName --jq '[.state,.isDraft,.isCrossRepository,.baseRefName]|join(" ")')
    [ "$estado" = "OPEN false false main" ] || { echo "PR #$n: se omite ($estado)"; continue; }
    tiene_etiqueta "$n" "no-fusionar" && { echo "PR #$n: tiene la etiqueta no-fusionar"; continue; }
  fi
  fusionar_uno "$n"
done
# GitHub no lanza otros flujos por lo que hace el robot con su llave normal: se pide a mano la publicación de la versión
if [ "$FUSIONADOS" -gt 0 ] && [ -z "${HAY_PAT:-}" ]; then gh workflow run publicar-version.yml --ref main >/dev/null 2>&1 || true; fi
echo "Listo: $FUSIONADOS PR fusionado(s)."
