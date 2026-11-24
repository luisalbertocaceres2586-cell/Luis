#!/usr/bin/env bash
# Chequeos que debe pasar un avance antes de que el asistente lo acepte. Imprime qué falló y sale con código 1 si algo falla.
#   · tipos  (npm run typecheck)      · pruebas (npm test)      · pruebas en navegador solo de los niveles que tocó (si PRUEBAS_NAVEGADOR != 0)
set -uo pipefail
BASE="${BASE:-main}"; REMOTO="${REMOTO:-origin}"; fallo=0
if [ "${SIN_CHEQUEOS:-0}" = "1" ]; then echo "(chequeos omitidos por SIN_CHEQUEOS=1)"; exit 0; fi

echo "── tipos ──";   npm run -s typecheck 2>&1 | tail -n 30; [ "${PIPESTATUS[0]}" -eq 0 ] || { echo "✘ fallan los tipos"; fallo=1; }
echo "── pruebas ──"; npm test 2>&1 | tail -n 40;           [ "${PIPESTATUS[0]}" -eq 0 ] || { echo "✘ fallan las pruebas"; fallo=1; }

if [ "${PRUEBAS_NAVEGADOR:-1}" != "0" ] && [ "$fallo" -eq 0 ]; then
  cambios=$(git diff --name-only "$REMOTO/$BASE"...HEAD 2>/dev/null)
  if echo "$cambios" | grep -qE '^(engine/nivel[13]/|nivel[13]\.html|engine/core/fisica-visual\.js|assets/nivel3/)'; then
    echo "── navegador ──"; bash "$(dirname "$0")/revisar-navegador.sh" "$cambios" || fallo=1
  fi
fi
exit $fallo
