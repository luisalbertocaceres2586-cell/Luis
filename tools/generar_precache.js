#!/usr/bin/env node
/**
 * Genera precache.json: la lista de archivos que el juego necesita para abrir SIN internet.
 * sw.js la usa cuando se le pide "precargar" (ver engine/core/sw-registro.js). Es determinista: no lleva fecha,
 * así que solo cambia cuando cambia la lista de verdad (y no ensucia el historial de git).
 *
 * Uso:   node tools/generar_precache.js           → escribe precache.json
 *        node tools/generar_precache.js --check   → falla si precache.json está desactualizado
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { RAIZ, referenciasServidas: referencias, tam } = require('./lib-referencias');

function generar() {
  const { activos, codigo } = referencias();
  const A = [...activos].sort(), C = [...codigo].sort();
  const bytes = A.reduce((s, f) => s + tam(f), 0) + C.reduce((s, f) => s + tam(f), 0);
  const huella = crypto.createHash('sha1').update(A.concat(C).map(f => f + ':' + tam(f)).join('\n')).digest('hex').slice(0, 10);
  return {
    _nota: 'Generado por tools/generar_precache.js (lo hace solo GitHub al publicar). No editar a mano.',
    v: huella,
    mb: +(bytes / 1048576).toFixed(1),
    codigo: C,
    activos: A,
  };
}

if (require.main === module) {
  const destino = path.join(RAIZ, 'precache.json');
  const nuevo = JSON.stringify(generar(), null, 1) + '\n';
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
    if (actual !== nuevo) { console.error('precache.json está desactualizado: ejecuta  node tools/generar_precache.js'); process.exit(1); }
    console.log('precache.json al día'); process.exit(0);
  }
  const previo = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
  if (previo === nuevo) console.log('precache.json sin cambios');
  else { fs.writeFileSync(destino, nuevo); console.log('precache.json actualizado'); }
  const j = JSON.parse(nuevo);
  console.log(`  ${j.codigo.length} archivos de código + ${j.activos.length} recursos ≈ ${j.mb} MB`);
}
module.exports = { generar };
