#!/usr/bin/env bash
# Pruebas en un Chromium real (las de tests/navegador), SOLO de los niveles que tocó el avance. Recibe la lista de archivos cambiados.
# Si no se puede instalar el navegador, no bloquea (avisa y sigue).
set -uo pipefail
cambios="${1:-}"; fallo=0; PUERTO=8123
npm i --no-save --no-audit --no-fund puppeteer-core @sparticuz/chromium >/dev/null 2>&1 || { echo "(no se pudo instalar el navegador de pruebas: se omite)"; exit 0; }
(python3 -m http.server "$PUERTO" >/dev/null 2>&1 & echo $! > /tmp/servidor-pruebas.pid); sleep 2
correr() {   # nombre, comando...
  local nombre="$1"; shift; local salida; salida=$(timeout 1200 "$@" 2>&1); local cod=$?
  if [ $cod -ne 0 ] || echo "$salida" | grep -qE '✗|"ok":false|[1-9][0-9]* mal( |$)'; then
    echo "✘ navegador · $nombre"; echo "$salida" | grep -E '✗|"ok":false|[1-9][0-9]* mal|Error' | head -n 8; fallo=1
  else echo "✔ navegador · $nombre"; fi
}
if echo "$cambios" | grep -qE '^(engine/nivel1/|nivel1\.html|engine/core/fisica-visual\.js)'; then
  correr "robot del Nivel 1 (semillas 1 y 3)" node tests/navegador/bot-nivel1.mjs 1,3
  correr "habilidades del Nivel 1" node tests/navegador/habilidades.mjs
fi
if echo "$cambios" | grep -qE '^(engine/nivel3/|nivel3\.html|assets/nivel3/)'; then
  correr "Nivel 3 (escenarios + 1 partida)" node tests/navegador/nivel3.mjs "http://localhost:$PUERTO" 1 0
fi
kill "$(cat /tmp/servidor-pruebas.pid 2>/dev/null)" 2>/dev/null || true
exit $fallo
