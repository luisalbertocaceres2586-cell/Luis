#!/usr/bin/env bash
# Asistente de avances: para cada rama (una por una, nunca en paralelo)
#   1. abre su solicitud de extracción (PR) si no existe
#   2. la pone al día con main y resuelve los choques tontos (tools/resolver-conflictos.js)
#   3. corre los chequeos (tools/revisar-avance.sh)
#   4. si todo está bien la acepta (squash) y borra la rama; si no, deja un comentario y una etiqueta en el PR
# Pausar una rama: etiqueta "no-automerge" en su PR, o nombre que empiece por wip/ o borrador/.
# Uso:  bash tools/asistente-prs.sh [rama ...]      (sin argumentos procesa todos los PR abiertos, el más antiguo primero)
set -uo pipefail
# Al cambiar de rama, git reemplaza los archivos de tools/: se trabaja con una COPIA para que nada cambie mientras corre.
if [ -z "${ASISTENTE_COPIA:-}" ]; then d=$(mktemp -d); cp -r "$(dirname "$0")/." "$d/"; ASISTENTE_COPIA=1 HERR="$d" exec bash "$d/asistente-prs.sh" "$@"; fi
BASE="${BASE:-main}"; REMOTO="${REMOTO:-origin}"; GH="${GH:-gh}"; HERR="${HERR:-tools}"
RESUMEN="${GITHUB_STEP_SUMMARY:-/dev/null}"; FUSIONADAS=0; FALLOS=0
log()   { echo "▶ $*"; }
nota()  { echo "- $*" >> "$RESUMEN"; }
comentar() { $GH pr comment "$1" --body "$2" >/dev/null 2>&1 || true; }
etiquetar() { $GH label create "$2" --color "$3" --description "$4" >/dev/null 2>&1 || true; $GH pr edit "$1" --add-label "$2" >/dev/null 2>&1 || true; }
quitar()    { $GH pr edit "$1" --remove-label "$2" >/dev/null 2>&1 || true; }
bloque()    { printf '```\n%s\n```' "$(tail -c 3500 "$1")"; }

procesar() {
  local rama="$1" num titulo adelante
  if [[ "$rama" == "$BASE" || "$rama" =~ ^(wip|borrador|dependabot|gh-pages)(/|$) ]]; then log "$rama: se omite (rama especial)"; return 0; fi
  git fetch -q "$REMOTO" "$rama" 2>/dev/null || { log "$rama: ya no existe"; return 0; }
  git fetch -q "$REMOTO" "$BASE"
  adelante=$(git rev-list --count "$REMOTO/$BASE..$REMOTO/$rama"); [ "$adelante" = "0" ] && { log "$rama: no trae nada nuevo"; return 0; }
  titulo=$(git log -1 --format=%s "$REMOTO/$rama")

  num=$($GH pr list --head "$rama" --base "$BASE" --state open --json number --jq '.[0].number // empty' 2>/dev/null)
  if [ -z "$num" ]; then
    log "$rama: se abre la solicitud"
    $GH pr create --base "$BASE" --head "$rama" --title "$titulo" --body "Solicitud abierta automáticamente por el asistente de avances. Se pone al día con \`$BASE\`, pasa los chequeos y se acepta sola." >/dev/null 2>/tmp/pr-create.err \
      || { echo "✘ $rama: no se pudo abrir la solicitud: $(cat /tmp/pr-create.err)"; echo "   → Activa «Permitir que GitHub Actions cree y apruebe solicitudes» (Settings → Actions → General)."; nota "✘ \`$rama\`: no se pudo abrir la solicitud"; return 1; }
    num=$($GH pr list --head "$rama" --base "$BASE" --state open --json number --jq '.[0].number // empty' 2>/dev/null)
    [ -z "$num" ] && { echo "✘ $rama: la solicitud no aparece"; return 1; }
  fi
  if $GH pr view "$num" --json labels --jq '.labels[].name' 2>/dev/null | grep -qx 'no-automerge'; then log "#$num $rama: en pausa (etiqueta no-automerge)"; nota "⏸ #$num \`$rama\` en pausa"; return 0; fi

  git checkout -q -B "$rama" "$REMOTO/$rama" || return 1
  # ── 1) ponerla al día con main ──
  if ! git -c merge.conflictStyle=diff3 merge --no-edit -m "Poner al día con $BASE (asistente)" "$REMOTO/$BASE" >/tmp/merge.log 2>&1; then
    if node "$HERR/resolver-conflictos.js" >/tmp/resolver.log 2>&1 && git -c core.editor=true commit -q --no-edit; then log "#$num: choques tontos resueltos solos"; cat /tmp/resolver.log
    else
      git merge --abort 2>/dev/null; cat /tmp/resolver.log
      etiquetar "$num" conflicto-manual B60205 "Choque que el asistente no puede resolver solo"
      comentar "$num" "🤖 Esta rama choca con \`$BASE\` en algo que no puedo resolver sola (cambios reales de las dos partes):"$'\n\n'"$(bloque /tmp/resolver.log)"$'\n\n'"Resuélvelo con \`npm run sincronizar\` y vuelve a subir la rama; el asistente seguirá solo."
      nota "⚠️ #$num \`$rama\`: choque manual"; return 1
    fi
  fi
  quitar "$num" conflicto-manual
  # ── 2) chequeos ──
  if ! bash "$HERR/revisar-avance.sh" >/tmp/chequeos.log 2>&1; then
    cat /tmp/chequeos.log
    etiquetar "$num" revisar-pruebas D93F0B "Los chequeos del asistente fallaron"
    comentar "$num" "🤖 No la acepté: fallaron los chequeos."$'\n\n'"$(bloque /tmp/chequeos.log)"$'\n\n'"Cuando lo arregles y subas la rama, vuelvo a intentarlo sola."
    nota "❌ #$num \`$rama\`: fallaron los chequeos"; return 1
  fi
  quitar "$num" revisar-pruebas
  # ── 3) subir y aceptar ──
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse "$REMOTO/$rama")" ]; then git push -q "$REMOTO" "HEAD:$rama" || { echo "✘ $rama: no se pudo subir"; return 1; }; fi
  local intento=0
  until $GH pr merge "$num" --squash --delete-branch --subject "$titulo (#$num)" >/tmp/merge-pr.log 2>&1; do
    intento=$((intento+1)); cat /tmp/merge-pr.log
    [ "$intento" -ge 3 ] && { comentar "$num" "🤖 Pasó los chequeos pero GitHub no me dejó aceptarla:"$'\n\n'"$(bloque /tmp/merge-pr.log)"; nota "❌ #$num \`$rama\`: GitHub rechazó la fusión"; return 1; }
    sleep 8
  done
  log "#$num $rama: aceptada ✔"; nota "✅ #$num \`$rama\` aceptada"; FUSIONADAS=$((FUSIONADAS+1)); git fetch -q "$REMOTO" "$BASE"
}

# Si GitHub no lanza solo «publicar-version» (las fusiones hechas con el token por defecto no disparan flujos), se publica aquí.
publicar_version() {
  [ "$FUSIONADAS" -gt 0 ] || return 0; [ -n "${BOT_TOKEN_PRESENTE:-}" ] && return 0; [ -f tools/publicar-version.js ] || return 0   # (esta sí se lee de main, ya con la rama base en pie)
  git checkout -q -B "$BASE" "$REMOTO/$BASE" || return 0
  node tools/publicar-version.js --sha "$(git rev-parse HEAD)" || return 0
  git add version.json 2>/dev/null; git add index.html 2>/dev/null; git diff --cached --quiet && return 0
  git commit -q -m "Versión automática $(git rev-parse --short HEAD) [skip ci]"
  git pull -q --rebase "$REMOTO" "$BASE" && git push -q "$REMOTO" "HEAD:$BASE" && log "versión publicada"
}

git config user.name  "asistente-de-avances[bot]" 2>/dev/null; git config user.email "asistente-de-avances@users.noreply.github.com" 2>/dev/null
RAMAS=("$@"); if [ ${#RAMAS[@]} -eq 0 ] || [ -z "${RAMAS[0]}" ]; then   # barrido: primero las solicitudes abiertas (la más antigua primero) y luego las ramas sueltas que van por delante de main
  mapfile -t RAMAS < <($GH pr list --state open --base "$BASE" --json number,headRefName --jq 'sort_by(.number)[].headRefName' 2>/dev/null)
  git fetch -q "$REMOTO" 2>/dev/null; while read -r r; do [[ " ${RAMAS[*]} " == *" $r "* ]] || RAMAS+=("$r"); done < <(git for-each-ref --format='%(refname:short)' "refs/remotes/$REMOTO" | sed "s#^$REMOTO/##" | grep -vE "^(HEAD|$BASE|$REMOTO)$" | sort)
fi
[ ${#RAMAS[@]} -eq 0 ] && { log "No hay avances pendientes."; exit 0; }
log "Avances a procesar (en orden): ${RAMAS[*]}"
for r in "${RAMAS[@]}"; do [ -z "$r" ] && continue; procesar "$r" || FALLOS=$((FALLOS+1)); done
publicar_version
log "Listo: $FUSIONADAS aceptada(s), $FALLOS con problemas."
[ "$FALLOS" -eq 0 ]
