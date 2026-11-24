/*****************************************************************************************
 *  NINJA MULTIPLICACIÓN — Servidor de cuentas y progreso (Google Apps Script)  ·  v3.0
 *
 *  Qué hace:
 *   · Guarda apodo + clave (con hash y sal) y el progreso del juego en la pestaña "Users".
 *   · Revisa si un apodo está libre, registra, inicia sesión, carga y guarda el progreso.
 *   · Clases con código, rankings (clase y todos) y reportes para docentes.
 *   · Registro de eventos, claves visibles para el administrador (opcional) y constancia de
 *     autorización de un adulto al crear la cuenta.
 *   · Agrega 2 menús a la hoja: "🥷 Ninja Admin" (administrar) y "❓ Ayuda".
 *
 *  Pestaña "Users" (fila 1 = encabezados):
 *   A nick | B nickLower | C salt | D hash | E token(s) | F progress | G updated | H rescueSalt | I rescueHash
 *   J clase | K puntaje | L ocultoRanking | M claveVisible | N consentimiento
 *  Otras pestañas (las crea el script cuando hacen falta): Clases · Registro · Reporte · Reporte alumno · Autorización
 *
 *  IMPORTANTE: después de cambiar este código hay que publicar una NUEVA VERSIÓN:
 *   Implementar > Administrar implementaciones > ✏️ > Versión: "Nueva versión" > Implementar.
 *****************************************************************************************/

const SHEET = 'Users';
const VERSION = '3.0';
const VERSION_LEGAL = '1.0';   // sube este número cuando cambies el aviso de privacidad o los términos
const HEADERS = ['nick', 'nickLower', 'salt', 'hash', 'token', 'progress', 'updated', 'rescueSalt', 'rescueHash', 'clase', 'puntaje', 'ocultoRanking', 'claveVisible', 'consentimiento'];
const COL = { NICK: 1, LOWER: 2, SALT: 3, HASH: 4, TOKEN: 5, PROGRESS: 6, UPDATED: 7, RSALT: 8, RHASH: 9, CLASE: 10, PUNTAJE: 11, OCULTO: 12, CLAVE: 13, CONSENT: 14 };
const NC = HEADERS.length;
const HOJA_CLASES = 'Clases';
const HEADERS_CLASES = ['codigo', 'nombre', 'creada', 'activa'];
const HOJA_REPORTE = 'Reporte';
const HOJA_REPORTE_ALUMNO = 'Reporte alumno';
const HOJA_REGISTRO = 'Registro';
const HEADERS_REGISTRO = ['fecha', 'evento', 'usuario', 'detalle'];
const HOJA_AUTORIZACION = 'Autorización';
const MAX_REGISTRO = 5000;   // filas del registro de eventos (al pasar, se borran las 1000 más antiguas)
const MAX_SESIONES = 5;      // dispositivos con sesión abierta a la vez por usuario
const MAX_PROGRESS = 45000;  // una celda de Google Sheets admite 50 000 caracteres

/* ════════════════════════════ SERVIDOR (lo que llama el juego) ════════════════════════════
 * Pensado para una clase completa entrando a la vez:
 *  · NO hay un bloqueo global: leer (revisar apodo, cargar, ranking) y guardar no hacen fila.
 *    Solo se bloquea el instante exacto en que se escribe algo que podría chocar (crear cuenta, abrir sesión…).
 *  · El cifrado de la clave —lo más lento— se hace ANTES de bloquear y en JavaScript puro (ver sha256Hex_).
 *  · Cada acción toca la hoja lo mínimo posible (se recuerda en caché dónde está cada usuario).
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

// Abrir la URL /exec en el navegador muestra este mensaje: sirve para comprobar que está publicado.
function doGet() {
  return out({ ok: true, servicio: 'ninja-nube', version: VERSION });
}

function doPost(e) {
  reiniciar_();
  try {
    if (!e || !e.postData) throw new Error('doPost lo llama el juego con datos. Para probar desde el editor ejecuta la función "probar".');
    const req = JSON.parse(e.postData.contents);
    const nick = String(req.nick || '').trim();
    const pass = String(req.pass || '');
    switch (req.action) {
      case 'check':    return out(checkNick(nick));
      case 'register': return out(register(nick, pass, req.progress, req.clase, req.consentimiento));
      case 'login':    return out(login(nick, pass));
      case 'load':     return out(load(nick, req.token));
      case 'save':     return out(save(nick, req.token, req.progress));
      case 'recover':  return out(recover(nick, req.codigo, String(req.newpass || '')));
      case 'changepass': return out(changePass(nick, req.token, pass, String(req.newpass || '')));
      case 'newrescue':  return out(newRescue(nick, req.token, pass));
      case 'checkclass': return out(checkClass(req.codigo));
      case 'joinclass':  return out(joinClass(nick, req.token, req.codigo));
      case 'setranking': return out(setRanking(nick, req.token, !!req.visible));
      case 'top':        return out(top(nick, req.token, req.ambito, req.limite));
      case 'config':     return out(getConfig());
      default:         return out({ ok: false, error: 'accion_invalida' });
    }
  } catch (err) {
    if (err && err.ocupado) return out({ ok: false, error: 'ocupado' });   // el juego reintenta solo
    // El detalle queda en Ejecuciones (menú izquierdo del editor de Apps Script)
    console.error(String((err && err.stack) || err));
    return out({ ok: false, error: 'error_servidor' });
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ── prueba desde el editor ──
   Elige "probar" en el selector de funciones y pulsa Ejecutar. Simula lo que hace el juego
   (revisar apodo, registrar, entrar, guardar y cargar) y deja el resultado en el Registro de ejecución.
   Crea un usuario de prueba "zz_prueba" y lo borra al terminar. */
function probar() {
  const llamar = function (obj) { return JSON.parse(doPost({ postData: { contents: JSON.stringify(obj) } }).getContent()); };
  const paso = function (nombre, r) { Logger.log(nombre + ' → ' + JSON.stringify(r)); return r; };
  paso('1. check', llamar({ action: 'check', nick: 'zz_prueba' }));
  const reg = paso('2. register', llamar({ action: 'register', nick: 'zz_prueba', pass: 'prueba1', progress: { v: 1, datos: { a: '1' } }, consentimiento: { aceptado: true, version: VERSION_LEGAL } }));
  const log = paso('3. login', llamar({ action: 'login', nick: 'zz_prueba', pass: 'prueba1' }));
  paso('4. save', llamar({ action: 'save', nick: 'zz_prueba', token: log.token, progress: { v: 1, datos: { a: '2' } } }));
  paso('5. load', llamar({ action: 'load', nick: 'zz_prueba', token: log.token }));
  const row = findRow('zz_prueba');
  if (row !== -1) sheet().deleteRow(row);
  Logger.log(reg.ok && log.ok ? '✅ TODO FUNCIONA. Si el juego aún falla, publica una NUEVA VERSIÓN de la implementación.' : '❌ Algo falló: revisa los pasos de arriba.');
}

/* ── estado de la ejecución (cada llamada empieza de cero) ── */
let hojaRevisada_ = false;
let hojaUsers_ = null;
let ajustes_ = null;
// forzar=true (menús de administración): vuelve a revisar que la hoja esté bien formada en vez de fiarse de la caché.
function reiniciar_(forzar) {
  hojaRevisada_ = false; hojaUsers_ = null; ajustes_ = null;
  if (forzar) { try { CacheService.getScriptCache().remove('hoja_ok'); } catch (e) {} }
}

/* ── bloqueo corto: solo para escribir lo que podría chocar con otra persona ── */
function conLock_(fn, ms) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(ms || 15000); }
  catch (e) { const err = new Error('ocupado'); err.ocupado = true; throw err; }
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ── ajustes del administrador (se guardan en las Propiedades del script, no en la hoja) ── */
function ajuste_(clave, defecto) {
  if (!ajustes_) { try { ajustes_ = PropertiesService.getScriptProperties().getProperties() || {}; } catch (e) { ajustes_ = {}; } }
  return ajustes_[clave] != null ? String(ajustes_[clave]) : defecto;
}
function fijarAjuste_(clave, valor) {
  PropertiesService.getScriptProperties().setProperty(clave, String(valor));
  ajustes_ = null;
}
function clavesVisibles_() { return ajuste_('CLAVES_VISIBLES', 'si') !== 'no'; }
function exigirConsentimiento_() { return ajuste_('EXIGIR_CONSENTIMIENTO', 'si') !== 'no'; }

/* Datos que el juego necesita para su aviso de privacidad (quién es el responsable y qué se guarda). */
function getConfig() {
  return {
    ok: true, versionLegal: VERSION_LEGAL, clavesVisibles: clavesVisibles_(), exigeConsentimiento: exigirConsentimiento_(),
    responsable: ajuste_('RESPONSABLE', ''), contacto: ajuste_('CONTACTO', '')
  };
}

/* ── hoja ── */
function sheet() {
  if (hojaUsers_) return hojaUsers_;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Este script no está dentro de una hoja de cálculo. Ábrelo desde la hoja: Extensiones > Apps Script.');
  let sh = ss.getSheetByName(SHEET);
  if (!sh) sh = ss.insertSheet(SHEET);
  // Revisar que la hoja esté bien formada cuesta 3 llamadas a Google: se hace como mucho cada 10 minutos, no en cada petición.
  const cache = CacheService.getScriptCache();
  if (cache.get('hoja_ok')) { hojaRevisada_ = true; hojaUsers_ = sh; return sh; }
  if (sh.getLastRow() === 0) prepararHoja_(sh);
  else if (!hojaRevisada_) asegurarColumnas_(sh);
  hojaRevisada_ = true;
  hojaUsers_ = sh;
  try { cache.put('hoja_ok', '1', 600); } catch (e) {}
  return sh;
}

// Hojas de versiones anteriores no tienen las columnas nuevas (rescate, clase, puntaje, ranking, clave visible…): se agregan solas.
function asegurarColumnas_(sh) {
  if (sh.getMaxColumns() < NC) sh.insertColumnsAfter(sh.getMaxColumns(), NC - sh.getMaxColumns());
  const h = sh.getRange(1, 1, 1, NC).getValues()[0];
  let cambio = false;
  for (let c = 0; c < NC; c++) {
    if (String(h[c]) !== HEADERS[c]) { sh.getRange(1, c + 1).setValue(HEADERS[c]).setFontWeight('bold').setBackground('#e8eaf6'); cambio = true; }
  }
  if (cambio) { formatoHoja_(sh); notasEncabezados_(sh); }
}

function formatoHoja_(sh) {
  const filas = Math.max(sh.getMaxRows() - 1, 1);
  // Texto plano en las columnas de texto: evita que Sheets convierta apodos como "12345" en números (y permita duplicados)
  sh.getRange(2, 1, filas, 6).setNumberFormat('@');
  sh.getRange(2, COL.UPDATED, filas, 1).setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange(2, COL.RSALT, filas, 2).setNumberFormat('@');
  sh.getRange(2, COL.CLASE, filas, 1).setNumberFormat('@');
  sh.getRange(2, COL.PUNTAJE, filas, 1).setNumberFormat('0');
  sh.getRange(2, COL.OCULTO, filas, 3).setNumberFormat('@');   // ocultoRanking, claveVisible, consentimiento
}
function notasEncabezados_(sh) {
  try {
    sh.getRange(1, COL.CLAVE).setNote('⚠️ Aquí se ve la clave de cada jugador para que puedas ayudarle si la olvida. NO compartas esta hoja con nadie. Se puede desactivar en Ninja Admin > Seguridad y legal > Claves visibles.');
    sh.getRange(1, COL.CONSENT).setNote('Constancia de que un adulto responsable autorizó la cuenta al crearla (versión del aviso y fecha).');
  } catch (e) {}
}

function prepararHoja_(sh) {
  if (sh.getMaxColumns() < NC) sh.insertColumnsAfter(sh.getMaxColumns(), NC - sh.getMaxColumns());
  sh.getRange(1, 1, 1, NC).setValues([HEADERS]).setFontWeight('bold').setBackground('#e8eaf6');
  formatoHoja_(sh);
  notasEncabezados_(sh);
  sh.setFrozenRows(1);
}

/* ── registro de eventos (pestaña "Registro") ── */
function hojaRegistro_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA_REGISTRO);
  if (!sh) {
    sh = ss.insertSheet(HOJA_REGISTRO);
    sh.getRange(1, 1, 1, HEADERS_REGISTRO.length).setValues([HEADERS_REGISTRO]).setFontWeight('bold').setBackground('#e8eaf6');
    const filas = Math.max(sh.getMaxRows() - 1, 1);
    sh.getRange(2, 1, filas, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sh.getRange(2, 2, filas, 3).setNumberFormat('@');
    sh.setFrozenRows(1);
    try { sh.setColumnWidth(1, 150); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 130); sh.setColumnWidth(4, 420); } catch (e) {}
  }
  return sh;
}
// Nunca guarda claves. Si falla o hay demasiados eventos por minuto (ataque), simplemente no anota: jamás rompe al juego.
function registrar_(evento, usuario, detalle) {
  try {
    const cache = CacheService.getScriptCache(), k = 'lg_' + Math.floor(new Date().getTime() / 60000);
    const n = Number(cache.get(k) || 0);
    if (n >= 120) return;
    cache.put(k, String(n + 1), 120);
    const sh = hojaRegistro_();
    sh.appendRow([new Date(), evento, usuario || '', detalle || '']);
    if (Math.random() < 0.02 && sh.getLastRow() > MAX_REGISTRO) sh.deleteRows(2, 1000);   // se comprueba de vez en cuando, no en cada evento
  } catch (e) { console.error('registro: ' + e); }
}

/* ── clases (pestaña "Clases") ── */
function hojaClases_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA_CLASES);
  if (!sh) {
    sh = ss.insertSheet(HOJA_CLASES);
    sh.getRange(1, 1, 1, HEADERS_CLASES.length).setValues([HEADERS_CLASES]).setFontWeight('bold').setBackground('#e8eaf6');
    sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), 2).setNumberFormat('@');
    sh.setFrozenRows(1);
  }
  return sh;
}
function normClase_(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
// La lista de clases casi no cambia: se recuerda 60 s para no leer la hoja en cada inicio de sesión.
function invalidarClases_() { try { CacheService.getScriptCache().remove('clases'); } catch (e) {} }
function listarClases_() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('clases');
  if (guardado) { try { return JSON.parse(guardado); } catch (e) {} }
  const sh = hojaClases_(), last = sh.getLastRow();
  let lista = [];
  if (last >= 2) {
    lista = sh.getRange(2, 1, last - 1, 4).getValues().map(function (f, i) {
      return { row: i + 2, codigo: normClase_(f[0]), nombre: String(f[1] || ''), activa: String(f[3]).toLowerCase() !== 'no' };
    }).filter(function (c) { return c.codigo; });
  }
  cache.put('clases', JSON.stringify(lista), 60);
  return lista;
}
function buscarClase_(codigo) {
  const n = normClase_(codigo);
  if (!n) return null;
  const l = listarClases_();
  for (let i = 0; i < l.length; i++) if (l[i].codigo === n) return l[i];
  return null;
}
// Código de clase: 6 caracteres sin letras confusas (se escribe con teclado, así que es corto)
function codigoClase_() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  invalidarClases_();
  for (let intento = 0; intento < 20; intento++) {
    const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + new Date().getTime(), Utilities.Charset.UTF_8);
    let c = '';
    for (let i = 0; i < 6; i++) c += abc.charAt((b[i] & 0xff) % abc.length);
    if (!buscarClase_(c)) return c;
  }
  throw new Error('No se pudo generar un código de clase único. Inténtalo otra vez.');
}
// Lo que el juego necesita saber de la cuenta (clase y si aparece en los rankings)
function cuentaDeCols_(clase, oculto) {
  const cod = normClase_(clase);
  const c = cod ? buscarClase_(cod) : null;
  return {
    clase: cod ? { codigo: cod, nombre: c ? c.nombre : '' } : null,
    ranking: String(oculto).toLowerCase() !== 'si'
  };
}
function cuentaDe_(fila) { return cuentaDeCols_(fila[COL.CLASE - 1], fila[COL.OCULTO - 1]); }

/* ── puntaje: puntos acumulados + récord del Mundo 2 + récord del Mundo 3 ── */
// El progreso que sube el juego trae un solo jugador (el de la cuenta) dentro de ninja_perfiles_v1.
function perfilDe_(progress) {
  try {
    const raw = progress && progress.datos && progress.datos.ninja_perfiles_v1;
    if (!raw) return null;
    const d = JSON.parse(raw), ids = Object.keys(d.perfiles || {});
    return ids.length ? d.perfiles[ids[0]] : null;
  } catch (e) { return null; }
}
function puntajeDe_(p) {
  if (!p) return 0;
  const n = function (x) { return Math.max(0, Number(x) || 0); };
  return Math.min(99999999, Math.round(n(p.progreso && p.progreso.puntos) + n(p.nivel2 && p.nivel2.mejor) + n(p.nivel3 && p.nivel3.mejor)));
}

/* ── utilidades ── */
function validNick(n) { return /^[A-Za-z0-9_]{3,16}$/.test(n); }
function validPass(p) { return p.length >= 4 && p.length <= 100; }

// Fila de un usuario. Recuerda en caché dónde estaba la última vez y solo lo comprueba (1 lectura) en vez de recorrer la columna.
function findRow(nick) {
  const sh = sheet(), lower = String(nick).toLowerCase();
  const cache = CacheService.getScriptCache(), clave = 'row_' + lower;
  const pista = Number(cache.get(clave)) || 0;
  if (pista >= 2 && String(sh.getRange(pista, COL.LOWER).getValue()).toLowerCase() === lower) return pista;
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const vals = sh.getRange(2, COL.LOWER, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).toLowerCase() === lower) { cache.put(clave, String(i + 2), 21600); return i + 2; }
  }
  return -1;
}

/* SHA-256 en JavaScript puro. Da EXACTAMENTE el mismo resultado que Utilities.computeDigest (así las claves ya guardadas
   siguen valiendo), pero sin las 1000 llamadas al servicio de Google que hacía cada cifrado (~1-2 s). Ahora tarda una fracción. */
const K256_ = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];
function utf8Bytes_(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {          // par sustituto (emoji, etc.)
      const d = str.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}
function sha256Hex_(bytes) {
  const m = bytes.slice(), l = bytes.length;
  m.push(0x80);
  while (m.length % 64 !== 56) m.push(0);
  const hi = Math.floor(l / 0x20000000), lo = (l << 3) >>> 0;       // longitud en bits (64 bits, big-endian)
  m.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], w = new Array(64);
  for (let off = 0; off < m.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = (m[off + 4 * i] << 24) | (m[off + 4 * i + 1] << 16) | (m[off + 4 * i + 2] << 8) | m[off + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K256_[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
}
// El algoritmo original (lento, usa el servicio de Google). Solo se usa si la autocomprobación del rápido fallara.
function hashLento_(pass, salt) {
  let h = salt + pass;
  for (let i = 0; i < 1000; i++) {
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8);
    h = bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  }
  return h;
}
let rapidoOk_ = null;
function hashRapidoValido_() {
  if (rapidoOk_ === null) {
    try {
      const prueba = 'ñandú €😀';
      const ref = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, prueba, Utilities.Charset.UTF_8)
        .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
      rapidoOk_ = sha256Hex_(utf8Bytes_(prueba)) === ref && sha256Hex_(utf8Bytes_('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    } catch (e) { rapidoOk_ = false; }
  }
  return rapidoOk_;
}
// Mismo algoritmo de siempre (sal + clave, SHA-256 repetido 1000 veces): los usuarios ya creados siguen funcionando.
function hash(pass, salt) {
  pass = String(pass); salt = String(salt);
  if (!hashRapidoValido_()) return hashLento_(pass, salt);
  let h = salt + pass;
  for (let i = 0; i < 1000; i++) h = sha256Hex_(utf8Bytes_(h));
  return h;
}

function newToken() { return Utilities.getUuid() + Utilities.getUuid(); }

// Límite de intentos fallidos: 5 cada 10 minutos por apodo y por tipo de operación
function bloqueado_(pref, nick) { return Number(CacheService.getScriptCache().get(pref + nick.toLowerCase()) || 0) >= 5; }
function fallo_(pref, nick) {
  const c = CacheService.getScriptCache(), k = pref + nick.toLowerCase();
  const n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 600);
  return n;
}
function limpiarFallos_(pref, nick) { CacheService.getScriptCache().remove(pref + nick.toLowerCase()); }

// Código de rescate: 12 caracteres sin letras confusas (XXXX-XXXX-XXXX). Se guarda solo su hash.
function codigoRescate_() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + new Date().getTime(), Utilities.Charset.UTF_8);
  let s = '';
  for (let i = 0; i < 12; i++) s += abc.charAt((b[i] & 0xff) % abc.length);
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
}
function normCodigo_(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
// Lo pesado (cifrar) se prepara ANTES de bloquear; después solo se escribe.
function prepararRescate_() { const codigo = codigoRescate_(), salt = Utilities.getUuid(); return { codigo: codigo, salt: salt, hash: hash(normCodigo_(codigo), salt) }; }
function prepararClave_(clave) { const salt = Utilities.getUuid(); return { salt: salt, hash: hash(clave, salt), clave: clave }; }
function escribirRescate_(sh, row, r) { sh.getRange(row, COL.RSALT, 1, 2).setValues([[r.salt, r.hash]]); }
function escribirClave_(sh, row, c) {
  sh.getRange(row, COL.SALT, 1, 2).setValues([[c.salt, c.hash]]);
  sh.getRange(row, COL.CLAVE).setValue(clavesVisibles_() ? c.clave : '');
}
function guardarRescate_(sh, row) { const r = prepararRescate_(); escribirRescate_(sh, row, r); return r.codigo; }
function guardarClave_(sh, row, clave) { escribirClave_(sh, row, prepararClave_(clave)); }

function leerTokens_(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
function agregarToken_(sh, row, token) {
  const t = leerTokens_(sh.getRange(row, COL.TOKEN).getValue());
  t.push(token);
  while (t.length > MAX_SESIONES) t.shift();
  sh.getRange(row, COL.TOKEN).setValue(t.join(','));
}
function parseProgress_(txt) {
  try { const p = JSON.parse(txt || '{}'); return p && typeof p === 'object' ? p : {}; } catch (e) { return {}; }
}
function textoConsentimiento_(c) {
  return 'v' + String((c && c.version) || VERSION_LEGAL) + ' · ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
}

/* ── acciones ── */
function checkNick(nick) {
  if (!validNick(nick)) return { ok: false, error: 'nick_invalido' };
  return { ok: true, available: findRow(nick) === -1 };
}

function register(nick, pass, progress, clase, consentimiento) {
  if (!validNick(nick)) return { ok: false, error: 'nick_invalido' };
  if (!validPass(pass)) return { ok: false, error: 'clave_corta' };
  if (exigirConsentimiento_() && !(consentimiento && consentimiento.aceptado === true)) return { ok: false, error: 'sin_consentimiento' };
  if (findRow(nick) !== -1) return { ok: false, error: 'nick_en_uso' };
  let cl = null;
  if (String(clase || '').trim()) {
    cl = buscarClase_(clase);
    if (!cl || !cl.activa) return { ok: false, error: 'clase_invalida' };
  }
  const json = JSON.stringify(progress || {});
  if (json.length > MAX_PROGRESS) return { ok: false, error: 'muy_grande' };
  // 1) Lo pesado, SIN bloquear a nadie: cifrar la clave y el código de rescate
  const c = prepararClave_(pass), r = prepararRescate_(), token = newToken();
  const consent = textoConsentimiento_(consentimiento);
  // 2) Solo escribir va dentro del bloqueo (una sola escritura)
  const res = conLock_(function () {
    if (findRow(nick) !== -1) return { ok: false, error: 'nick_en_uso' };
    const sh = sheet();
    const row = sh.getLastRow() + 1;
    if (row > sh.getMaxRows()) { sh.insertRowsAfter(sh.getMaxRows(), 50); formatoHoja_(sh); }
    sh.getRange(row, 1, 1, NC).setValues([[nick, nick.toLowerCase(), c.salt, c.hash, token, json, new Date(), r.salt, r.hash,
      cl ? cl.codigo : '', puntajeDe_(perfilDe_(progress)), '', clavesVisibles_() ? pass : '', consent]]);
    try { CacheService.getScriptCache().put('row_' + nick.toLowerCase(), String(row), 21600); } catch (e) {}
    return { ok: true };
  });
  if (!res.ok) return res;
  registrar_('cuenta_creada', nick, (cl ? 'clase ' + cl.codigo + ' · ' : '') + 'autorización de adulto ' + consent);
  return { ok: true, token: token, progress: progress || {}, rescate: r.codigo, tieneRescate: true,
           cuenta: { clase: cl ? { codigo: cl.codigo, nombre: cl.nombre } : null, ranking: true } };
}

function login(nick, pass) {
  if (bloqueado_('fail_', nick)) return { ok: false, error: 'demasiados_intentos' };
  const row = findRow(nick);
  if (row === -1) return { ok: false, error: 'credenciales' };
  const sh = sheet();
  const fila = sh.getRange(row, 1, 1, NC).getValues()[0];
  if (hash(pass, String(fila[2])) !== String(fila[3])) {            // el cifrado se hace sin bloquear
    const n = fallo_('fail_', nick);
    registrar_(n >= 5 ? 'bloqueo_por_intentos' : 'login_fallido', String(fila[0]), n >= 5 ? '5 intentos fallidos: bloqueado 10 minutos' : 'intento ' + n + ' de 5');
    return { ok: false, error: 'credenciales' };
  }
  limpiarFallos_('fail_', nick);
  const token = newToken();
  conLock_(function () { agregarToken_(sh, row, token); });          // solo esto va dentro del bloqueo
  if (clavesVisibles_() && !fila[COL.CLAVE - 1]) sh.getRange(row, COL.CLAVE).setValue(pass);   // cuentas anteriores: la clave se muestra tras su primer ingreso
  return { ok: true, token: token, nick: String(fila[0]), progress: parseProgress_(fila[5]), tieneRescate: !!(fila[7] && fila[8]), cuenta: cuentaDe_(fila) };
}

/* Recuperar la clave con el código de rescate: entra de inmediato y entrega un código NUEVO (el anterior deja de servir). */
function recover(nick, codigo, nueva) {
  if (!validNick(nick)) return { ok: false, error: 'nick_invalido' };
  if (!validPass(nueva)) return { ok: false, error: 'clave_corta' };
  if (bloqueado_('rec_', nick)) return { ok: false, error: 'demasiados_intentos' };
  const row = findRow(nick);
  if (row === -1) { fallo_('rec_', nick); return { ok: false, error: 'codigo_invalido' }; }
  const sh = sheet();
  const f = sh.getRange(row, 1, 1, NC).getValues()[0];
  if (!f[7] || !f[8]) return { ok: false, error: 'sin_codigo' };
  if (hash(normCodigo_(codigo), String(f[7])) !== String(f[8])) {
    const n = fallo_('rec_', nick);
    registrar_(n >= 5 ? 'bloqueo_por_intentos' : 'recuperacion_fallida', String(f[0]), n >= 5 ? 'código de rescate: bloqueado 10 minutos' : 'código de rescate incorrecto (' + n + ' de 5)');
    return { ok: false, error: 'codigo_invalido' };
  }
  const c = prepararClave_(nueva), r = prepararRescate_(), token = newToken();
  conLock_(function () {
    escribirClave_(sh, row, c);
    sh.getRange(row, COL.TOKEN).setValue(token);   // cierra las demás sesiones
    escribirRescate_(sh, row, r);
  });
  limpiarFallos_('rec_', nick); limpiarFallos_('fail_', nick);
  registrar_('clave_recuperada_con_codigo', String(f[0]), 'el jugador creó una clave nueva con su código de rescate');
  return { ok: true, token: token, nick: String(f[0]), progress: parseProgress_(f[5]), rescate: r.codigo, tieneRescate: true, cuenta: cuentaDe_(f) };
}

/* Cambiar la clave estando conectado (pide la clave actual). */
function changePass(nick, token, pass, nueva) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  if (!validPass(nueva)) return { ok: false, error: 'clave_corta' };
  if (bloqueado_('cp_', nick)) return { ok: false, error: 'demasiados_intentos' };
  const sh = sheet();
  const f = sh.getRange(row, 1, 1, 6).getValues()[0];
  if (hash(pass, String(f[2])) !== String(f[3])) {
    const n = fallo_('cp_', nick);
    registrar_('cambio_clave_fallido', String(f[0]), 'clave actual incorrecta (' + n + ' de 5)');
    return { ok: false, error: 'credenciales' };
  }
  limpiarFallos_('cp_', nick);
  const c = prepararClave_(nueva);
  conLock_(function () {
    escribirClave_(sh, row, c);
    sh.getRange(row, COL.TOKEN).setValue(String(token));   // solo queda abierta esta sesión
  });
  registrar_('clave_cambiada', String(f[0]), 'el jugador cambió su clave');
  return { ok: true };
}

/* Generar un código de rescate nuevo estando conectado (pide la clave actual). Reemplaza al anterior. */
function newRescue(nick, token, pass) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  if (bloqueado_('cp_', nick)) return { ok: false, error: 'demasiados_intentos' };
  const sh = sheet();
  const f = sh.getRange(row, 1, 1, 6).getValues()[0];
  if (hash(pass, String(f[2])) !== String(f[3])) { fallo_('cp_', nick); return { ok: false, error: 'credenciales' }; }
  limpiarFallos_('cp_', nick);
  const r = prepararRescate_();
  conLock_(function () { escribirRescate_(sh, row, r); });
  registrar_('codigo_rescate_generado', String(f[0]), 'generado por el jugador');
  return { ok: true, rescate: r.codigo };
}

// Fila de un usuario si el token es válido (si no, -1). Con la pista en caché es UNA sola lectura (apodo + sesiones).
function authRow(nick, token) {
  if (!token) return -1;
  const sh = sheet(), lower = String(nick).toLowerCase();
  const pista = Number(CacheService.getScriptCache().get('row_' + lower)) || 0;
  if (pista >= 2) {
    const f = sh.getRange(pista, COL.LOWER, 1, 4).getValues()[0];     // B..E: apodo, sal, hash, sesiones
    if (String(f[0]).toLowerCase() === lower) return leerTokens_(f[3]).indexOf(String(token)) !== -1 ? pista : -1;
  }
  const row = findRow(nick);
  if (row === -1) return -1;
  return leerTokens_(sh.getRange(row, COL.TOKEN).getValue()).indexOf(String(token)) !== -1 ? row : -1;
}

function load(nick, token) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  const f = sheet().getRange(row, 1, 1, NC).getValues()[0];
  return { ok: true, progress: parseProgress_(f[5]), cuenta: cuentaDe_(f) };
}

// Guardar NO bloquea a nadie: escribe solo en la fila de quien guarda (2 escrituras).
function save(nick, token, progress) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  const json = JSON.stringify(progress || {});
  if (json.length > MAX_PROGRESS) return { ok: false, error: 'muy_grande' };
  const sh = sheet();
  sh.getRange(row, COL.PROGRESS, 1, 2).setValues([[json, new Date()]]);        // progreso + fecha en una sola escritura
  sh.getRange(row, COL.PUNTAJE).setValue(puntajeDe_(perfilDe_(progress)));      // alimenta el ranking
  return { ok: true };
}

/* ════════════ CLASES Y RANKING ════════════ */

/* ¿Existe este código de clase? Lo usa el formulario de registro para mostrar el nombre de la clase. */
function checkClass(codigo) {
  const c = buscarClase_(codigo);
  return { ok: true, valid: !!(c && c.activa), nombre: c && c.activa ? c.nombre : '' };
}

/* Unirse a una clase con su código (código vacío = salir de la clase). */
function joinClass(nick, token, codigo) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  const sh = sheet();
  if (!String(codigo || '').trim()) {
    sh.getRange(row, COL.CLASE).setValue('');
    registrar_('clase_salida', nick, 'el jugador salió de su clase');
  } else {
    if (bloqueado_('jc_', nick)) return { ok: false, error: 'demasiados_intentos' };
    const c = buscarClase_(codigo);
    if (!c || !c.activa) { fallo_('jc_', nick); return { ok: false, error: 'clase_invalida' }; }
    limpiarFallos_('jc_', nick);
    sh.getRange(row, COL.CLASE).setValue(c.codigo);
    registrar_('clase_unida', nick, 'se unió a la clase ' + c.codigo);
  }
  return { ok: true, cuenta: cuentaDe_(sh.getRange(row, 1, 1, NC).getValues()[0]) };
}

/* Aparecer o no en los rankings (por defecto sí aparece). */
function setRanking(nick, token, visible) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  const sh = sheet();
  sh.getRange(row, COL.OCULTO).setValue(visible ? '' : 'si');
  const c = sh.getRange(row, COL.CLASE, 1, 3).getValues()[0];               // J..L
  return { ok: true, cuenta: cuentaDeCols_(c[0], c[2]) };
}

// Lista [nick, puntaje] ordenada, de toda la hoja o de una clase. Se guarda 60 s en caché (el ranking no necesita ser instantáneo).
// Solo se leen 4 columnas (no la del progreso): así sigue siendo rápido con cientos de alumnos.
function listaRanking_(codigoClase) {
  const cache = CacheService.getScriptCache(), key = 'rk_' + (codigoClase || 'todos');
  const guardado = cache.get(key);
  if (guardado) { try { return JSON.parse(guardado); } catch (e) {} }
  const sh = sheet(), last = sh.getLastRow();
  let lista = [];
  if (last >= 2) {
    const nicks = sh.getRange(2, COL.NICK, last - 1, 1).getValues();
    const datos = sh.getRange(2, COL.CLASE, last - 1, 3).getValues();   // J, K, L
    for (let i = 0; i < nicks.length; i++) {
      const pts = Number(datos[i][1]) || 0;
      if (pts <= 0 || String(datos[i][2]).toLowerCase() === 'si') continue;
      if (codigoClase && normClase_(datos[i][0]) !== codigoClase) continue;
      lista.push([String(nicks[i][0]), pts]);
    }
    lista.sort(function (a, b) { return b[1] - a[1] || (a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1); });
  }
  const json = JSON.stringify(lista);
  if (json.length < 90000) cache.put(key, json, 60);
  return lista;
}

/* Ranking: ambito 'todos' o 'clase' (la clase de quien pregunta). Devuelve el Top y la posición de quien pregunta. */
function top(nick, token, ambito, limite) {
  const row = authRow(nick, token);
  if (row === -1) return { ok: false, error: 'sesion' };
  const c = sheet().getRange(row, COL.CLASE, 1, 3).getValues()[0];          // J..L: clase, puntaje, oculto (no se lee el progreso)
  const cuenta = cuentaDeCols_(c[0], c[2]);
  let codigo = '';
  if (ambito === 'clase') {
    if (!cuenta.clase) return { ok: false, error: 'sin_clase' };
    codigo = cuenta.clase.codigo;
  } else { ambito = 'todos'; }
  const lista = listaRanking_(codigo);
  const lim = Math.max(1, Math.min(Number(limite) || 10, 50));
  const mio = String(nick).toLowerCase();
  let pos = 0, ant = null, yo = null;
  const filas = lista.map(function (e, i) {
    if (e[1] !== ant) { pos = i + 1; ant = e[1]; }
    const esYo = e[0].toLowerCase() === mio;
    if (esYo) yo = { pos: pos, puntaje: e[1] };
    return { pos: pos, nick: e[0], puntaje: e[1], yo: esYo };
  });
  return {
    ok: true, ambito: ambito, clase: cuenta.clase, total: filas.length,
    top: filas.slice(0, lim),
    yo: cuenta.ranking ? (yo || { pos: null, puntaje: Number(c[1]) || 0 }) : null,
    oculto: !cuenta.ranking
  };
}

/* ════════════════════════════ MENÚS EN LA HOJA ════════════════════════════ */
// Los menús aparecen solos al abrir (o recargar) la hoja. No hace falta ejecutar onOpen a mano.

function onOpen() {
  let ui;
  try { ui = SpreadsheetApp.getUi(); }
  catch (e) {
    // Pasa si se ejecuta con el botón "Ejecutar" del editor: ahí no hay una hoja abierta donde mostrar el menú.
    Logger.log('ℹ️ Esto no es un error. onOpen se ejecuta sola al abrir la hoja: RECARGA la hoja de cálculo (F5) y verás los menús "🥷 Ninja Admin" y "❓ Ayuda".');
    return;
  }
  ui.createMenu('🥷 Ninja Admin')
    .addItem('📊 Resumen de usuarios', 'adminResumen')
    .addItem('🔎 Ver datos de un usuario', 'adminBuscar')
    .addSeparator()
    .addItem('🔑 Restablecer clave', 'adminRestablecerClave')
    .addItem('🆘 Generar código de rescate', 'adminNuevoRescate')
    .addItem('✏️ Cambiar apodo', 'adminRenombrar')
    .addItem('🚪 Cerrar sesiones de un usuario', 'adminCerrarSesiones')
    .addItem('🧹 Borrar progreso de un usuario', 'adminBorrarProgreso')
    .addItem('🗑️ Borrar usuario', 'adminBorrarUsuario')
    .addSeparator()
    .addSubMenu(ui.createMenu('🏫 Clases y reportes')
      .addItem('🏫 Crear clase', 'adminCrearClase')
      .addItem('📋 Ver clases', 'adminVerClases')
      .addItem('👥 Poner a un alumno en una clase', 'adminAsignarClase')
      .addItem('🔁 Cambiar el código de una clase', 'adminCambiarCodigoClase')
      .addItem('⏸️ Activar / desactivar una clase', 'adminAlternarClase')
      .addSeparator()
      .addItem('📈 Reporte de una clase', 'adminReporteClase')
      .addItem('📈 Reporte de todos los alumnos', 'adminReporteTodos')
      .addItem('👨‍👩‍👧 Reporte de un alumno', 'adminReporteAlumno'))
    .addSubMenu(ui.createMenu('🔐 Seguridad y legal')
      .addItem('📜 Ver el registro de eventos', 'adminVerRegistro')
      .addItem('🧹 Borrar eventos antiguos', 'adminLimpiarRegistro')
      .addSeparator()
      .addItem('👁️ Claves visibles: activar / desactivar', 'adminAlternarClaves')
      .addItem('⚙️ Datos del responsable (aviso de privacidad)', 'adminDatosResponsable')
      .addItem('📄 Formato de autorización para familias', 'adminFormatoAutorizacion')
      .addItem('📦 Exportar los datos de un usuario', 'adminExportarUsuario'))
    .addSubMenu(ui.createMenu('🛠️ Mantenimiento')
      .addItem('🩺 Probar el servidor y la velocidad', 'adminProbar')
      .addItem('🔧 Reparar hoja', 'adminReparar')
      .addItem('🔒 Cerrar TODAS las sesiones', 'adminCerrarTodasSesiones')
      .addItem('🧽 Borrar usuarios inactivos', 'adminBorrarInactivos'))
    .addToUi();
  ui.createMenu('❓ Ayuda')
    .addItem('📖 Cómo usar el menú Ninja Admin', 'ayudaUso')
    .addItem('🆘 Problemas comunes', 'ayudaProblemas')
    .addItem('🔗 Ver la URL de la aplicación', 'ayudaURL')
    .addItem('🔐 Privacidad y datos', 'ayudaPrivacidad')
    .addItem('⚖️ Cumplimiento legal (Colombia)', 'ayudaLegal')
    .addToUi();
}

/* ── ayudas internas ── */
function seguro_(fn) {
  reiniciar_(true);
  try { fn(); } catch (err) {
    console.error(String((err && err.stack) || err));
    SpreadsheetApp.getUi().alert('⚠️ Algo salió mal', err && err.ocupado ? 'El servidor está ocupado atendiendo a muchos jugadores. Inténtalo de nuevo en unos segundos.' : String((err && err.message) || err), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
function fecha_(d) {
  return d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '—';
}
function nickSeleccionado_() {
  try {
    const sh = SpreadsheetApp.getActiveSheet();
    if (sh.getName() !== SHEET) return '';
    const r = sh.getActiveCell().getRow();
    if (r < 2 || r > sh.getLastRow()) return '';
    return String(sh.getRange(r, COL.NICK).getValue());
  } catch (e) { return ''; }
}
// Pide el apodo (o usa la fila seleccionada). Devuelve {row, nick} o null.
function pedirUsuario_(titulo) {
  const ui = SpreadsheetApp.getUi();
  const sel = nickSeleccionado_();
  const msg = sel
    ? 'Escribe el apodo del jugador.\nSi lo dejas vacío se usará el de la fila seleccionada: ' + sel
    : 'Escribe el apodo del jugador:';
  const r = ui.prompt(titulo, msg, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  const nick = r.getResponseText().trim() || sel;
  if (!nick) { ui.alert('No se indicó ningún apodo.'); return null; }
  const row = findRow(nick);
  if (row === -1) { ui.alert('No existe ningún usuario con el apodo "' + nick + '".'); return null; }
  return { row: row, nick: String(sheet().getRange(row, COL.NICK).getValue()) };
}
function confirmarEscribiendo_(titulo, detalle) {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt(titulo, detalle + '\n\nEsto NO se puede deshacer. Escribe BORRAR (en mayúsculas) para confirmar:', ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton() === ui.Button.OK && r.getResponseText().trim() === 'BORRAR';
}
function claveTemporal_() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin letras que se confunden (i, l, o, 0, 1)
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + new Date().getTime(), Utilities.Charset.UTF_8);
  let s = '';
  for (let i = 0; i < 6; i++) s += abc.charAt((b[i] & 0xff) % abc.length);
  return s;
}

/* ── 📊 Resumen ── */
function adminResumen() {
  seguro_(function () {
    const sh = sheet(), last = sh.getLastRow();
    const ui = SpreadsheetApp.getUi();
    if (last < 2) { ui.alert('📊 Resumen', 'Todavía no hay usuarios registrados.', ui.ButtonSet.OK); return; }
    const filas = sh.getRange(2, 1, last - 1, NC).getValues();
    const ahora = new Date().getTime(), DIA = 86400000;
    let hoy = 0, sem = 0, mes = 0, vacios = 0, bytes = 0, sinCodigo = 0;
    filas.forEach(function (f) {
      const t = f[6] instanceof Date ? f[6].getTime() : 0;
      if (t && ahora - t <= DIA) hoy++;
      if (t && ahora - t <= 7 * DIA) sem++;
      if (t && ahora - t <= 30 * DIA) mes++;
      const p = parseProgress_(f[5]);
      if (!p.datos || Object.keys(p.datos).length === 0) vacios++;
      bytes += String(f[5]).length;
      if (!f[7] || !f[8]) sinCodigo++;
    });
    ui.alert('📊 Resumen de usuarios',
      'Usuarios registrados: ' + filas.length + '\n' +
      'Activos en las últimas 24 h: ' + hoy + '\n' +
      'Activos en los últimos 7 días: ' + sem + '\n' +
      'Activos en los últimos 30 días: ' + mes + '\n' +
      'Sin progreso guardado: ' + vacios + '\n' +
      'Sin código de rescate: ' + sinCodigo + '\n\n' +
      'Espacio de progreso usado: ' + Math.round(bytes / 1024) + ' KB', ui.ButtonSet.OK);
  });
}

/* ── 🔎 Ver datos de un usuario ── */
function adminBuscar() {
  seguro_(function () {
    const u = pedirUsuario_('🔎 Ver datos de un usuario'); if (!u) return;
    const f = sheet().getRange(u.row, 1, 1, NC).getValues()[0];
    const p = parseProgress_(f[5]);
    const claves = p.datos ? Object.keys(p.datos).length : 0;
    SpreadsheetApp.getUi().alert('🔎 ' + u.nick,
      'Fila en la hoja: ' + u.row + '\n' +
      'Última actualización: ' + fecha_(f[6]) + '\n' +
      'Sesiones abiertas: ' + leerTokens_(f[4]).length + '\n' +
      'Código de rescate: ' + (f[7] && f[8] ? 'sí tiene' : 'NO tiene (usa "Generar código de rescate")') + '\n' +
      'Clase: ' + nombreClase_(f[COL.CLASE - 1]) + '\n' +
      'Autorización de un adulto: ' + (f[COL.CONSENT - 1] || 'sin constancia (cuenta creada antes de la versión 3.0)') + '\n' +
      'Clave visible para ti: ' + (f[COL.CLAVE - 1] ? 'sí (columna claveVisible)' : (clavesVisibles_() ? 'aún no (aparece cuando vuelva a entrar o la restablezcas)' : 'desactivado')) + '\n' +
      'Puntaje: ' + (Number(f[COL.PUNTAJE - 1]) || 0) + (String(f[COL.OCULTO - 1]).toLowerCase() === 'si' ? ' (oculto del ranking)' : '') + '\n' +
      'Progreso: ' + (claves ? claves + ' bloques de datos (' + String(f[5]).length + ' caracteres)' : 'vacío') + '\n\n' +
      '(La clave no se puede ver: se guarda cifrada. Si la olvidó, usa "Restablecer clave".)',
      SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

/* ── 🔑 Restablecer clave ── */
function adminRestablecerClave() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('🔑 Restablecer clave'); if (!u) return;
    const r = ui.prompt('🔑 Nueva clave para "' + u.nick + '"',
      'Escribe la nueva clave (mínimo 4 caracteres).\nSi la dejas vacía se genera una clave temporal al azar.', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    let nueva = r.getResponseText();
    const generada = !nueva;
    if (generada) nueva = claveTemporal_();
    if (!validPass(nueva)) { ui.alert('La clave debe tener entre 4 y 100 caracteres.'); return; }
    conLock_(function () {
      const sh = sheet();
      guardarClave_(sh, u.row, nueva);
      sh.getRange(u.row, COL.TOKEN).setValue('');   // cierra las sesiones abiertas
    });
    limpiarFallos_('fail_', u.nick); limpiarFallos_('rec_', u.nick); limpiarFallos_('cp_', u.nick);
    registrar_('admin_clave_restablecida', u.nick, generada ? 'clave temporal generada por el administrador' : 'clave fijada por el administrador');
    ui.alert('✅ Clave restablecida',
      'Usuario: ' + u.nick + '\nNueva clave: ' + nueva + '\n\n' +
      'Entrégasela al jugador. Sus sesiones abiertas se cerraron y su progreso se conserva.', ui.ButtonSet.OK);
  });
}

/* ── 🆘 Generar código de rescate ── */
function adminNuevoRescate() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('🆘 Código de rescate'); if (!u) return;
    let codigo = '';
    conLock_(function () { codigo = guardarRescate_(sheet(), u.row); });
    registrar_('admin_codigo_rescate', u.nick, 'código de rescate generado por el administrador');
    ui.alert('🆘 Código de rescate de "' + u.nick + '"',
      codigo + '\n\nEntrégaselo al jugador para que lo anote. Con este código puede crear una clave nueva desde el juego (Entrar > ¿Olvidaste tu clave?). ' +
      'Se muestra una sola vez, y el código anterior deja de servir.', ui.ButtonSet.OK);
  });
}

/* ── ✏️ Cambiar apodo ── */
function adminRenombrar() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('✏️ Cambiar apodo'); if (!u) return;
    const r = ui.prompt('✏️ Nuevo apodo para "' + u.nick + '"',
      '3 a 16 letras, números o guion bajo (_), sin espacios ni nombres reales.', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    const nuevo = r.getResponseText().trim();
    if (!validNick(nuevo)) { ui.alert('Apodo no válido. Usa 3 a 16 letras, números o _.'); return; }
    conLock_(function () {
      const otro = findRow(nuevo);
      if (otro !== -1 && otro !== u.row) { ui.alert('El apodo "' + nuevo + '" ya está en uso.'); return; }
      const sh = sheet();
      sh.getRange(u.row, COL.NICK).setValue(nuevo);
      sh.getRange(u.row, COL.LOWER).setValue(nuevo.toLowerCase());
      sh.getRange(u.row, COL.TOKEN).setValue('');   // el juego recuerda el apodo viejo: hay que volver a entrar
      registrar_('admin_apodo_cambiado', nuevo, 'antes: ' + u.nick);
      ui.alert('✅ Apodo cambiado', '"' + u.nick + '" ahora es "' + nuevo + '".\nEl jugador debe volver a iniciar sesión con el apodo nuevo.', ui.ButtonSet.OK);
    });
  });
}

/* ── 🚪 Cerrar sesiones de un usuario ── */
function adminCerrarSesiones() {
  seguro_(function () {
    const u = pedirUsuario_('🚪 Cerrar sesiones'); if (!u) return;
    conLock_(function () { sheet().getRange(u.row, COL.TOKEN).setValue(''); });
    registrar_('admin_sesiones_cerradas', u.nick, 'se cerraron todas sus sesiones');
    SpreadsheetApp.getUi().alert('✅ Listo', 'Se cerraron todas las sesiones de "' + u.nick + '". Tendrá que iniciar sesión otra vez en cada dispositivo.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

/* ── 🧹 Borrar progreso ── */
function adminBorrarProgreso() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('🧹 Borrar progreso'); if (!u) return;
    const r = ui.alert('🧹 Borrar progreso de "' + u.nick + '"',
      'Se borrará todo su avance (la cuenta y la clave se conservan). Esto no se puede deshacer.\n\n⚠️ Si el jugador tiene el juego abierto, puede volver a subir su avance al jugar. Ciérrale la sesión también para evitarlo.\n\n¿Continuar?', ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
    conLock_(function () {
      const sh = sheet();
      sh.getRange(u.row, COL.PROGRESS).setValue('{}');
      sh.getRange(u.row, COL.UPDATED).setValue(new Date());
      sh.getRange(u.row, COL.TOKEN).setValue('');
    });
    registrar_('admin_progreso_borrado', u.nick, 'progreso reiniciado por el administrador');
    ui.alert('✅ Progreso borrado', 'Las sesiones de "' + u.nick + '" también se cerraron.', ui.ButtonSet.OK);
  });
}

/* ── 🗑️ Borrar usuario ── */
function adminBorrarUsuario() {
  seguro_(function () {
    const u = pedirUsuario_('🗑️ Borrar usuario'); if (!u) return;
    if (!confirmarEscribiendo_('🗑️ Borrar a "' + u.nick + '"', 'Se eliminará la cuenta, la clave y TODO el progreso de "' + u.nick + '". El apodo quedará libre.')) {
      SpreadsheetApp.getUi().alert('Cancelado. No se borró nada.'); return;
    }
    conLock_(function () { sheet().deleteRow(u.row); });
    registrar_('admin_usuario_borrado', u.nick, 'cuenta y progreso eliminados');
    SpreadsheetApp.getUi().alert('✅ Usuario "' + u.nick + '" eliminado.');
  });
}

/* ── 🧽 Borrar usuarios inactivos ── */
function adminBorrarInactivos() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const r = ui.prompt('🧽 Borrar usuarios inactivos', '¿Cuántos días sin jugar? (mínimo 30)', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    const dias = parseInt(r.getResponseText(), 10);
    if (!(dias >= 30)) { ui.alert('Escribe un número de días de 30 o más.'); return; }
    const limite = new Date().getTime() - dias * 86400000;
    const sh = sheet(), last = sh.getLastRow();
    if (last < 2) { ui.alert('No hay usuarios.'); return; }
    const filas = sh.getRange(2, 1, last - 1, 7).getValues();
    const borrar = [];
    filas.forEach(function (f, i) {
      const t = f[6] instanceof Date ? f[6].getTime() : null;
      if (t !== null && t < limite) borrar.push({ row: i + 2, nick: String(f[0]) });
    });
    if (!borrar.length) { ui.alert('Ningún usuario lleva más de ' + dias + ' días sin jugar.'); return; }
    const lista = borrar.slice(0, 15).map(function (b) { return b.nick; }).join(', ') + (borrar.length > 15 ? '… y ' + (borrar.length - 15) + ' más' : '');
    if (!confirmarEscribiendo_('🧽 ' + borrar.length + ' usuario(s) inactivos', 'Llevan más de ' + dias + ' días sin jugar:\n' + lista)) { ui.alert('Cancelado. No se borró nada.'); return; }
    conLock_(function () {
      borrar.sort(function (a, b) { return b.row - a.row; }).forEach(function (b) { sh.deleteRow(b.row); });
    });
    registrar_('admin_inactivos_borrados', '', borrar.length + ' cuenta(s) sin jugar hace más de ' + dias + ' días');
    ui.alert('✅ Se eliminaron ' + borrar.length + ' usuario(s) inactivos.');
  });
}

/* ── 🔒 Cerrar TODAS las sesiones ── */
function adminCerrarTodasSesiones() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const r = ui.alert('🔒 Cerrar todas las sesiones', 'Todos los jugadores tendrán que volver a iniciar sesión (su progreso no se pierde). Útil si sospechas que alguien usa cuentas ajenas.\n\n¿Continuar?', ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
    conLock_(function () {
      const sh = sheet(), last = sh.getLastRow();
      if (last >= 2) sh.getRange(2, COL.TOKEN, last - 1, 1).setValue('');
    });
    registrar_('admin_todas_sesiones_cerradas', '', 'se cerraron las sesiones de todos los jugadores');
    ui.alert('✅ Todas las sesiones fueron cerradas.');
  });
}

/* ── 🔧 Reparar hoja ── */
function adminReparar() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET), avisos = [];
    if (!sh) { sh = ss.insertSheet(SHEET); avisos.push('Se creó la pestaña "' + SHEET + '".'); }
    conLock_(function () {
      if (sh.getMaxColumns() < NC) sh.insertColumnsAfter(sh.getMaxColumns(), NC - sh.getMaxColumns());
      sh.getRange(1, 1, 1, NC).setValues([HEADERS]).setFontWeight('bold').setBackground('#e8eaf6');
      formatoHoja_(sh);
      notasEncabezados_(sh);
      sh.setFrozenRows(1);
      hojaClases_(); hojaRegistro_(); invalidarClases_();
      const last = sh.getLastRow();
      if (last >= 2) {
        const nicks = sh.getRange(2, COL.NICK, last - 1, 1).getValues();
        const lowers = nicks.map(function (n) { return [String(n[0]).trim().toLowerCase()]; });
        sh.getRange(2, COL.LOWER, last - 1, 1).setValues(lowers);   // vuelve a sincronizar nickLower con nick
        const vistos = {}, repetidos = [];
        lowers.forEach(function (l, i) {
          if (!l[0]) return;
          if (vistos[l[0]]) repetidos.push(String(nicks[i][0]) + ' (fila ' + (i + 2) + ')'); else vistos[l[0]] = true;
        });
        // vuelve a calcular el puntaje de todos desde su progreso (para el ranking)
        const progs = sh.getRange(2, COL.PROGRESS, last - 1, 1).getValues();
        sh.getRange(2, COL.PUNTAJE, last - 1, 1).setValues(progs.map(function (r) { return [puntajeDe_(perfilDe_(parseProgress_(r[0])))]; }));
        avisos.push('Se revisaron ' + (last - 1) + ' usuario(s): se sincronizó nickLower y se recalculó el puntaje del ranking.');
        if (repetidos.length) avisos.push('⚠️ Apodos repetidos (borra o renombra uno): ' + repetidos.join(', '));
      }
    });
    if (!avisos.length) avisos.push('La hoja está en orden.');
    ui.alert('🔧 Reparar hoja', avisos.join('\n\n'), ui.ButtonSet.OK);
  });
}

/* ── 🩺 Probar el servidor ── */
function adminProbar() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const medir = function (fn) { const t = new Date().getTime(); const r = fn(); return { ms: new Date().getTime() - t, r: r }; };
    const total = medir(function () { return 0; });
    const inicio = new Date().getTime();
    const sh = sheet();
    const leer = medir(function () { const l = sh.getLastRow(); return l >= 2 ? sh.getRange(2, COL.LOWER, l - 1, 1).getValues().length : 0; });
    const clases = medir(function () { invalidarClases_(); return listarClases_().length; });
    const rapido = medir(function () { return hash('prueba', 'sal'); });
    const lento = medir(function () { return hashLento_('prueba', 'sal'); });
    const igual = rapido.r === lento.r;
    const c = checkNick('prueba_servidor');
    let url = '';
    try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
    ui.alert('🩺 Prueba del servidor y de la velocidad',
      (c.ok ? '✅ El código funciona: pestaña "' + SHEET + '" encontrada y consulta de apodos correcta.' : '❌ Falló la consulta: ' + c.error) + '\n\n' +
      'Usuarios registrados: ' + Math.max(sh.getLastRow() - 1, 0) + '\n' +
      'Cifrar una clave (lo más pesado de entrar): ' + rapido.ms + ' ms   [método anterior: ' + lento.ms + ' ms]\n' +
      (igual ? '✅ El método rápido da el mismo resultado: las claves de siempre siguen funcionando.\n' : '⚠️ El método rápido NO coincide; el servidor usa el anterior automáticamente.\n') +
      'Leer la lista de apodos: ' + leer.ms + ' ms\n' +
      'Leer la lista de clases: ' + clases.ms + ' ms\n' +
      'Duración total de la prueba: ' + (new Date().getTime() - inicio) + ' ms\n\n' +
      (url ? 'URL publicada:\n' + url + '\n\n' : '') +
      'Recuerda: si cambiaste el código, publica una NUEVA VERSIÓN (Implementar > Administrar implementaciones) para que el juego vea los cambios.',
      ui.ButtonSet.OK);
  });
}

/* ════════════════════════════ CLASES Y REPORTES ════════════════════════════ */

function nombreClase_(codigo) {
  const cod = normClase_(codigo);
  if (!cod) return 'sin clase';
  const c = buscarClase_(cod);
  return c ? c.nombre + ' (' + c.codigo + ')' + (c.activa ? '' : ' — desactivada') : cod + ' (clase borrada)';
}
// Pide una clase por su código o por su nombre. Devuelve la clase o null.
function pedirClase_(titulo) {
  const ui = SpreadsheetApp.getUi();
  const clases = listarClases_();
  if (!clases.length) { ui.alert('Todavía no hay clases. Crea una en Ninja Admin > Clases y reportes > Crear clase.'); return null; }
  const lista = clases.map(function (c) { return '• ' + c.nombre + '  →  ' + c.codigo + (c.activa ? '' : '  (desactivada)'); }).join('\n');
  const r = ui.prompt(titulo, 'Escribe el código o el nombre de la clase:\n\n' + lista, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  const t = r.getResponseText().trim();
  if (!t) return null;
  const n = normClase_(t);
  const c = clases.filter(function (x) { return x.codigo === n || x.nombre.toLowerCase() === t.toLowerCase(); })[0];
  if (!c) ui.alert('No encontré la clase "' + t + '".');
  return c || null;
}
function contarPorClase_() {
  const sh = sheet(), last = sh.getLastRow(), cuenta = {};
  if (last >= 2) sh.getRange(2, COL.CLASE, last - 1, 1).getValues().forEach(function (r) { const c = normClase_(r[0]); if (c) cuenta[c] = (cuenta[c] || 0) + 1; });
  return cuenta;
}

/* ── 🏫 Crear clase ── */
function adminCrearClase() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const r = ui.prompt('🏫 Crear clase', 'Nombre de la clase (por ejemplo "3° A - 2026").\n⚠️ No uses nombres de niños: este nombre lo ven los alumnos de la clase.', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    const nombre = r.getResponseText().trim().slice(0, 40);
    if (!nombre) { ui.alert('Escribe un nombre para la clase.'); return; }
    if (listarClases_().some(function (c) { return c.nombre.toLowerCase() === nombre.toLowerCase(); })) { ui.alert('Ya existe una clase con ese nombre.'); return; }
    let codigo = '';
    conLock_(function () {
      codigo = codigoClase_();
      const sh = hojaClases_(), fila = Math.max(sh.getLastRow(), 1) + 1;
      sh.getRange(fila, 1, 1, 2).setNumberFormat('@');
      sh.getRange(fila, 1, 1, 4).setValues([[codigo, nombre, new Date(), 'si']]);
      invalidarClases_();
    });
    registrar_('admin_clase_creada', '', nombre + ' (' + codigo + ')');
    ui.alert('✅ Clase creada',
      'Clase: ' + nombre + '\nCódigo: ' + codigo + '\n\n' +
      'Entrega el código a los alumnos. Lo escriben al crear su cuenta, o después en ☁️ Cuenta > Unirme a una clase. ' +
      'Así compiten en el ranking de su clase y aparecen en tus reportes.', ui.ButtonSet.OK);
  });
}

/* ── 📋 Ver clases ── */
function adminVerClases() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const clases = listarClases_();
    if (!clases.length) { ui.alert('📋 Clases', 'Todavía no hay clases. Crea una en Ninja Admin > Clases y reportes > Crear clase.', ui.ButtonSet.OK); return; }
    const n = contarPorClase_();
    ui.alert('📋 Clases', clases.map(function (c) {
      return c.nombre + '\n   Código: ' + c.codigo + '   ·   Alumnos: ' + (n[c.codigo] || 0) + (c.activa ? '' : '   ·   ⏸️ desactivada');
    }).join('\n\n'), ui.ButtonSet.OK);
  });
}

/* ── 👥 Poner a un alumno en una clase ── */
function adminAsignarClase() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('👥 Poner a un alumno en una clase'); if (!u) return;
    const c = pedirClase_('👥 ¿A qué clase va "' + u.nick + '"?'); if (!c) return;
    conLock_(function () { sheet().getRange(u.row, COL.CLASE).setNumberFormat('@').setValue(c.codigo); });
    registrar_('admin_alumno_asignado', u.nick, 'clase ' + c.codigo);
    ui.alert('✅ Listo', '"' + u.nick + '" ahora está en la clase "' + c.nombre + '".', ui.ButtonSet.OK);
  });
}

/* ── 🔁 Cambiar el código de una clase ── */
function adminCambiarCodigoClase() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const c = pedirClase_('🔁 Cambiar el código de una clase'); if (!c) return;
    if (ui.alert('🔁 Cambiar código de "' + c.nombre + '"', 'Úsalo si el código se filtró y entraron personas que no son de la clase.\n\nLos alumnos que ya están en la clase se quedan en ella. Quien aún no se haya unido necesitará el código nuevo.\n\n¿Continuar?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    let nuevo = '';
    conLock_(function () {
      nuevo = codigoClase_();
      const hojaC = hojaClases_();
      hojaC.getRange(c.row, 1).setNumberFormat('@').setValue(nuevo);
      const sh = sheet(), last = sh.getLastRow();
      if (last >= 2) {
        const rango = sh.getRange(2, COL.CLASE, last - 1, 1);
        rango.setValues(rango.getValues().map(function (r) { return [normClase_(r[0]) === c.codigo ? nuevo : r[0]]; }));
      }
    });
    invalidarClases_();
    registrar_('admin_clase_codigo_cambiado', '', c.nombre + ': ' + c.codigo + ' → ' + nuevo);
    ui.alert('✅ Código cambiado', 'Clase: ' + c.nombre + '\nCódigo nuevo: ' + nuevo + '\n\nEl código anterior ya no sirve.', ui.ButtonSet.OK);
  });
}

/* ── ⏸️ Activar / desactivar una clase ── */
function adminAlternarClase() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const c = pedirClase_('⏸️ Activar / desactivar una clase'); if (!c) return;
    const activa = !c.activa;
    conLock_(function () { hojaClases_().getRange(c.row, 4).setValue(activa ? 'si' : 'no'); });
    invalidarClases_();
    registrar_(activa ? 'admin_clase_activada' : 'admin_clase_desactivada', '', c.nombre + ' (' + c.codigo + ')');
    ui.alert(activa ? '▶️ Clase activada' : '⏸️ Clase desactivada',
      activa ? 'La clase "' + c.nombre + '" vuelve a aceptar alumnos nuevos.'
             : 'Nadie nuevo podrá unirse a "' + c.nombre + '". Los alumnos que ya están siguen en ella y en su ranking. Útil al terminar el año.', ui.ButtonSet.OK);
  });
}

/* ── Métricas de un alumno a partir de su fila ── */
function metricasAlumno_(fila, ahora) {
  const p = perfilDe_(parseProgress_(fila[COL.PROGRESS - 1])) || {};
  const upd = fila[COL.UPDATED - 1] instanceof Date ? fila[COL.UPDATED - 1] : null;
  const dias = upd ? Math.max(0, Math.floor((ahora - upd.getTime()) / 86400000)) : null;
  const est = p.estadisticas || {}, n1 = p.nivel1 || {}, n2 = p.nivel2 || {}, n3 = p.nivel3 || {}, prog = p.progreso || {};
  const aciertos = Number(est.aciertos) || 0, errores = Number(est.errores) || 0;
  const maestria = p.maestria || {};
  const dificiles = Object.keys(maestria).filter(function (k) { return /^\d+x\d+$/.test(k); }).map(function (k) {
    const m = maestria[k] || {}, a = m.a | 0, e = m.e | 0, t = a + e;
    return { op: k.replace('x', '×'), a: a, e: e, t: t, tasa: t ? e / t : 0 };
  }).filter(function (o) { return o.t >= 3 && o.e > 0; })
    .sort(function (x, y) { return y.tasa - x.tasa || y.e - x.e; });
  return {
    nick: String(fila[0]), clase: normClase_(fila[COL.CLASE - 1]), ultima: upd, dias: dias,
    estado: dias === null ? '—' : dias <= 2 ? '🟢 Activo' : dias <= 6 ? '🟡 Poco' : '🔴 Sin jugar',
    puntaje: puntajeDe_(p), nivelClasico: (Number(prog.nivel) || 0) + 1,
    m1: Number(n1.completados) || 0, m2: Number(n2.mejor) || 0, m2e: Number(n2.estrellas) || 0, m3: Number(n3.mejor) || 0, m3e: Number(n3.estrellas) || 0,
    minutos: Math.round(Number(est.minutos) || 0), aciertos: aciertos, errores: errores,
    precision: aciertos + errores ? aciertos / (aciertos + errores) : null,
    dificiles: dificiles
  };
}
function textoDificiles_(lista, max) {
  return lista.slice(0, max).map(function (o) { return o.op + ' (' + Math.round(o.tasa * 100) + '%)'; }).join(', ');
}
function hojaLimpia_(nombre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  else {
    try { const f = sh.getFilter(); if (f) f.remove(); } catch (e) {}
    sh.clear();
  }
  return sh;
}

/* ── 📈 Reporte de una clase / de todos ── */
function adminReporteClase() {
  seguro_(function () {
    const c = pedirClase_('📈 Reporte de una clase'); if (!c) return;
    generarReporte_(c);
  });
}
function adminReporteTodos() { seguro_(function () { generarReporte_(null); }); }

function generarReporte_(clase) {
  const ui = SpreadsheetApp.getUi();
  const sh = sheet(), last = sh.getLastRow();
  const todas = last >= 2 ? sh.getRange(2, 1, last - 1, NC).getValues() : [];
  const filas = todas.filter(function (f) { return !clase || normClase_(f[COL.CLASE - 1]) === clase.codigo; });
  if (!filas.length) { ui.alert('📈 Reporte', clase ? 'La clase "' + clase.nombre + '" todavía no tiene alumnos.' : 'Todavía no hay usuarios.', ui.ButtonSet.OK); return; }
  const ahora = new Date().getTime();
  const ms = filas.map(function (f) { return metricasAlumno_(f, ahora); }).sort(function (a, b) { return b.puntaje - a.puntaje; });
  const nombres = {};
  listarClases_().forEach(function (c) { nombres[c.codigo] = c.nombre; });

  // resumen del grupo
  const n = ms.length;
  const activos = ms.filter(function (m) { return m.dias !== null && m.dias <= 6; }).length;
  const inactivos = ms.filter(function (m) { return m.dias === null || m.dias >= 7; }).length;
  const sumPts = ms.reduce(function (t, m) { return t + m.puntaje; }, 0);
  const sumA = ms.reduce(function (t, m) { return t + m.aciertos; }, 0), sumE = ms.reduce(function (t, m) { return t + m.errores; }, 0);
  const sumMin = ms.reduce(function (t, m) { return t + m.minutos; }, 0);

  // tablas que más cuestan al grupo (se suman las operaciones de todos)
  const ops = {};
  filas.forEach(function (f) {
    const maes = (perfilDe_(parseProgress_(f[COL.PROGRESS - 1])) || {}).maestria || {};
    Object.keys(maes).forEach(function (k) {
      if (!/^\d+x\d+$/.test(k)) return;
      const m = maes[k] || {}, o = ops[k] || (ops[k] = { op: k.replace('x', '×'), a: 0, e: 0, alumnos: 0 });
      o.a += m.a | 0; o.e += m.e | 0;
      if ((m.e | 0) > (m.a | 0)) o.alumnos++;
    });
  });
  const dificilesGrupo = Object.keys(ops).map(function (k) { const o = ops[k]; o.t = o.a + o.e; o.tasa = o.t ? o.e / o.t : 0; return o; })
    .filter(function (o) { return o.t >= 5 && o.e > 0; }).sort(function (x, y) { return y.tasa - x.tasa || y.e - x.e; }).slice(0, 8);

  const ANCHO = 17;
  const filasHoja = [], pad = function (a) { while (a.length < ANCHO) a.push(''); return a; };
  const add = function (a) { filasHoja.push(pad(a)); return filasHoja.length; };
  const titulo = clase ? clase.nombre : 'Todos los alumnos';
  add(['📈 Reporte — ' + titulo]);
  add(['Generado el ' + fecha_(new Date()) + '  ·  Solo se muestran apodos (sin datos personales)']);
  add([]);
  const rResumen = add(['RESUMEN DEL GRUPO']);
  add(['Alumnos', n]);
  add(['Activos en los últimos 7 días', activos]);
  add(['Sin jugar hace 7 días o más', inactivos]);
  add(['Puntaje promedio', Math.round(sumPts / n)]);
  add(['Aciertos del grupo', sumA + sumE ? sumA / (sumA + sumE) : '']);
  const rAcierto = filasHoja.length;
  add(['Minutos jugados (total)', sumMin]);
  add([]);
  const rDif = add(['TABLAS QUE MÁS CUESTAN AL GRUPO']);
  const rDifH = add(['Operación', 'Intentos', 'Errores', '% de error', 'Alumnos que fallan más de lo que aciertan']);
  if (dificilesGrupo.length) dificilesGrupo.forEach(function (o) { add([o.op, o.t, o.e, o.tasa, o.alumnos]); });
  else add(['Todavía no hay suficientes datos (se necesitan al menos 5 intentos por operación).']);
  const rDifFin = filasHoja.length;
  add([]);
  const rAl = add(['ALUMNOS (ordenados por puntaje; puedes filtrar y ordenar con las flechas de la cabecera)']);
  const rCab = add(['Apodo', 'Clase', 'Estado', 'Última vez', 'Días sin jugar', 'Puntaje', 'Clásico (nivel)', 'Mundo 1 (niveles)', 'Mundo 2 récord', 'Mundo 2 ⭐', 'Mundo 3 récord', 'Mundo 3 ⭐', 'Minutos', 'Aciertos', 'Errores', '% acierto', 'Tablas a reforzar']);
  ms.forEach(function (m) {
    add([m.nick, nombres[m.clase] || (m.clase ? m.clase : '—'), m.estado, m.ultima || '', m.dias === null ? '' : m.dias, m.puntaje, m.nivelClasico, m.m1, m.m2, m.m2e, m.m3, m.m3e, m.minutos, m.aciertos, m.errores, m.precision === null ? '' : m.precision, textoDificiles_(m.dificiles, 3)]);
  });
  const rFin = filasHoja.length;

  const rep = hojaLimpia_(HOJA_REPORTE);
  if (rep.getMaxColumns() < ANCHO) rep.insertColumnsAfter(rep.getMaxColumns(), ANCHO - rep.getMaxColumns());
  if (rep.getMaxRows() < filasHoja.length) rep.insertRowsAfter(rep.getMaxRows(), filasHoja.length - rep.getMaxRows());
  rep.getRange(1, 1, filasHoja.length, ANCHO).setValues(filasHoja);
  // formato
  rep.getRange(1, 1).setFontWeight('bold').setFontSize(16);
  rep.getRange(2, 1).setFontColor('#666666');
  [rResumen, rDif, rAl].forEach(function (r) { rep.getRange(r, 1, 1, ANCHO).setBackground('#3f51b5').setFontColor('#ffffff').setFontWeight('bold'); });
  rep.getRange(rResumen + 1, 1, 6, 1).setFontWeight('bold');
  rep.getRange(rAcierto, 2).setNumberFormat('0%');
  rep.getRange(rDifH, 1, 1, 5).setFontWeight('bold').setBackground('#e8eaf6');
  if (rDifFin > rDifH + 0) rep.getRange(rDifH + 1, 4, Math.max(rDifFin - rDifH, 1), 1).setNumberFormat('0%');
  rep.getRange(rCab, 1, 1, ANCHO).setFontWeight('bold').setBackground('#e8eaf6');
  const nAl = rFin - rCab;
  rep.getRange(rCab + 1, 4, nAl, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  rep.getRange(rCab + 1, 16, nAl, 1).setNumberFormat('0%');
  rep.getRange(rCab + 1, 3, nAl, 1).setBackgrounds(ms.map(function (m) { return [m.dias === null ? '#ffffff' : m.dias <= 2 ? '#d9f2dd' : m.dias <= 6 ? '#fff3c4' : '#f8d4d4']; }));
  try { rep.getRange(rCab, 1, nAl + 1, ANCHO).createFilter(); } catch (e) {}
  try { rep.autoResizeColumns(1, ANCHO); } catch (e) {}
  try { rep.setColumnWidth(1, 150); rep.setColumnWidth(17, 280); } catch (e) {}
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(rep);
  ui.alert('✅ Reporte listo', 'Lo encuentras en la pestaña "' + HOJA_REPORTE + '".\n\n' + n + ' alumno(s) · ' + activos + ' activo(s) esta semana · ' + inactivos + ' sin jugar hace 7 días o más.\n\nCada vez que lo generas se reemplaza el anterior.', ui.ButtonSet.OK);
}

/* ── 👨‍👩‍👧 Reporte de un alumno (para entregar a las familias) ── */
function adminReporteAlumno() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const u = pedirUsuario_('👨‍👩‍👧 Reporte de un alumno'); if (!u) return;
    const fila = sheet().getRange(u.row, 1, 1, NC).getValues()[0];
    const m = metricasAlumno_(fila, new Date().getTime());
    const cl = normClase_(fila[COL.CLASE - 1]);
    const rep = hojaLimpia_(HOJA_REPORTE_ALUMNO);
    const f = [];
    const add = function (a) { while (a.length < 5) a.push(''); f.push(a); return f.length; };
    add(['📘 Reporte de práctica — ' + m.nick]);
    add(['Generado el ' + fecha_(new Date()) + (cl ? '  ·  Clase: ' + nombreClase_(cl) : '')]);
    add([]);
    const rA = add(['¿CÓMO VA?']);
    add(['Última vez que jugó', m.ultima ? fecha_(m.ultima) : '—']);
    add(['Puntaje total', m.puntaje]);
    add(['Minutos de práctica', m.minutos]);
    add(['Operaciones resueltas', m.aciertos + m.errores]);
    const rP = add(['Porcentaje de aciertos', m.precision === null ? '' : m.precision]);
    add(['Mundo 1 · niveles completados', m.m1]);
    add(['Mundo 2 · récord / estrellas', m.m2 + '  /  ' + m.m2e + ' ⭐']);
    add(['Mundo 3 · récord / estrellas', m.m3 + '  /  ' + m.m3e + ' ⭐']);
    add([]);
    const rT = add(['TABLAS PARA REFORZAR']);
    const rTH = add(['Operación', 'Intentos', 'Errores', '% de error']);
    const dif = m.dificiles.slice(0, 8);
    if (dif.length) dif.forEach(function (o) { add([o.op, o.t, o.e, o.tasa]); });
    else add(['Todavía no hay suficientes datos: con unas cuantas partidas más aparecerán aquí.']);
    const rTF = f.length;
    add([]);
    const rC = add(['CÓMO AYUDAR EN CASA']);
    if (dif.length) {
      const cuenta = {};
      dif.slice(0, 5).forEach(function (o) { o.op.split('×').forEach(function (x) { cuenta[x] = (cuenta[x] || 0) + 1; }); });
      const tablas = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).slice(0, 2);
      add(['• Practicar ' + (tablas.length > 1 ? 'las tablas del ' + tablas.join(' y del ') : 'la tabla del ' + tablas[0]) + ', empezando por: ' + dif.slice(0, 3).map(function (o) { return o.op; }).join(', ') + '.']);
    }
    add(['• Mejor 10 minutos al día que una hora de golpe: la práctica corta y frecuente funciona mejor.']);
    add(['• Si se equivoca, pedirle que explique cómo lo pensó antes de darle la respuesta.']);
    add(['• Celebrar el esfuerzo y las mejoras, no solo los aciertos.']);
    rep.getRange(1, 1, f.length, 5).setValues(f);
    rep.getRange(1, 1).setFontWeight('bold').setFontSize(16);
    rep.getRange(2, 1).setFontColor('#666666');
    [rA, rT, rC].forEach(function (r) { rep.getRange(r, 1, 1, 5).setBackground('#3f51b5').setFontColor('#ffffff').setFontWeight('bold'); });
    rep.getRange(rA + 1, 1, 8, 1).setFontWeight('bold');
    rep.getRange(rP, 2).setNumberFormat('0%');
    rep.getRange(rTH, 1, 1, 4).setFontWeight('bold').setBackground('#e8eaf6');
    if (dif.length) rep.getRange(rTH + 1, 4, rTF - rTH, 1).setNumberFormat('0%');
    rep.getRange(rA + 1, 2, 8, 1).setHorizontalAlignment('left');
    try { rep.setColumnWidth(1, 260); rep.setColumnWidth(2, 160); } catch (e) {}
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(rep);
    ui.alert('✅ Reporte listo', 'Está en la pestaña "' + HOJA_REPORTE_ALUMNO + '". Para entregarlo: Archivo > Imprimir (o Descargar > PDF) estando en esa pestaña.\n\nSolo contiene el apodo y el progreso, sin datos personales.', ui.ButtonSet.OK);
  });
}

/* ════════════════════════════ SEGURIDAD Y LEGAL ════════════════════════════ */

function esc_(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

/* ── 📜 Ver el registro de eventos ── */
function adminVerRegistro() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const sh = hojaRegistro_(), last = sh.getLastRow();
    const n = Math.max(last - 1, 0);
    let resumen = '';
    if (n) {
      const desde = Math.max(2, last - 1999);
      const filas = sh.getRange(desde, 1, last - desde + 1, 2).getValues();
      const limite = new Date().getTime() - 86400000;
      let fallos = 0, bloqueos = 0, creadas = 0, claves = 0;
      filas.forEach(function (f) {
        if (!(f[0] instanceof Date) || f[0].getTime() < limite) return;
        const e = String(f[1]);
        if (e === 'login_fallido' || e === 'recuperacion_fallida' || e === 'cambio_clave_fallido') fallos++;
        else if (e === 'bloqueo_por_intentos') bloqueos++;
        else if (e === 'cuenta_creada') creadas++;
        else if (e.indexOf('clave') !== -1) claves++;
      });
      resumen = '\n\nÚltimas 24 horas:\n• Intentos fallidos: ' + fallos + '\n• Bloqueos por demasiados intentos: ' + bloqueos + '\n• Cuentas creadas: ' + creadas + '\n• Claves cambiadas, recuperadas o restablecidas: ' + claves;
    }
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sh);
    ui.alert('📜 Registro de eventos', (n ? 'Hay ' + n + ' evento(s) en la pestaña "' + HOJA_REGISTRO + '" (los más nuevos al final).' : 'Todavía no hay eventos: se irán anotando solos.') + resumen +
      '\n\nSe anotan: cuentas creadas, intentos de entrada fallidos y bloqueos, claves cambiadas o recuperadas, y todo lo que haces desde este menú. Nunca se guardan claves.', ui.ButtonSet.OK);
  });
}

/* ── 🧹 Borrar eventos antiguos ── */
function adminLimpiarRegistro() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const r = ui.prompt('🧹 Borrar eventos antiguos', '¿Cuántos días de historial quieres conservar? (mínimo 30)', ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK) return;
    const dias = parseInt(r.getResponseText(), 10);
    if (!(dias >= 30)) { ui.alert('Escribe un número de días de 30 o más.'); return; }
    const sh = hojaRegistro_(), last = sh.getLastRow();
    if (last < 2) { ui.alert('El registro está vacío.'); return; }
    const limite = new Date().getTime() - dias * 86400000;
    const fechas = sh.getRange(2, 1, last - 1, 1).getValues();
    let k = 0;
    while (k < fechas.length && fechas[k][0] instanceof Date && fechas[k][0].getTime() < limite) k++;
    if (!k) { ui.alert('No hay eventos con más de ' + dias + ' días.'); return; }
    if (ui.alert('🧹 Borrar ' + k + ' evento(s)', 'Se borrarán los eventos con más de ' + dias + ' días. No se puede deshacer.\n\n¿Continuar?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    conLock_(function () { sh.deleteRows(2, k); });
    registrar_('admin_registro_limpiado', '', k + ' evento(s) de más de ' + dias + ' días');
    ui.alert('✅ Se borraron ' + k + ' evento(s) antiguos.');
  });
}

/* ── 👁️ Claves visibles ── */
function adminAlternarClaves() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    if (clavesVisibles_()) {
      const r = ui.alert('👁️ Claves visibles: ACTIVADAS',
        'Ahora mismo la clave de cada jugador se ve en la columna "claveVisible" para que puedas ayudarle si la olvida.\n\n' +
        '¿Quieres DESACTIVAR esto? Se borrarán todas las claves visibles de la hoja. Los jugadores siguen entrando con las suyas; solo dejas de poder verlas (podrás restablecerlas desde el menú).', ui.ButtonSet.YES_NO);
      if (r !== ui.Button.YES) return;
      conLock_(function () {
        fijarAjuste_('CLAVES_VISIBLES', 'no');
        const sh = sheet(), last = sh.getLastRow();
        if (last >= 2) sh.getRange(2, COL.CLAVE, last - 1, 1).setValue('');
      });
      registrar_('admin_claves_visibles_desactivadas', '', 'se borraron las claves visibles de la hoja');
      ui.alert('✅ Claves visibles DESACTIVADAS', 'Se borró la columna "claveVisible". El aviso de privacidad del juego se actualiza solo.', ui.ButtonSet.OK);
    } else {
      const r = ui.alert('👁️ Activar claves visibles',
        'Si lo activas, la clave de cada jugador se guardará TAMBIÉN en texto legible en la columna "claveVisible", para que puedas dársela en persona si la olvida.\n\n' +
        '⚠️ Cualquiera con acceso a esta hoja podrá verlas (tú, otros editores, o quien reciba un enlace). Actívalo solo si NO compartes la hoja con nadie.\n' +
        '• El juego avisa a los niños y a las familias, en el aviso de privacidad y al crear la cuenta, que el administrador puede ver la clave.\n' +
        '• Las claves de cuentas que ya existen aparecen cuando el jugador vuelva a entrar o cuando las restablezcas.\n\n¿Activar?', ui.ButtonSet.YES_NO);
      if (r !== ui.Button.YES) return;
      fijarAjuste_('CLAVES_VISIBLES', 'si');
      registrar_('admin_claves_visibles_activadas', '', 'las claves se muestran en la columna claveVisible');
      ui.alert('✅ Claves visibles ACTIVADAS', 'Se irán mostrando en la columna "claveVisible". No compartas esta hoja.', ui.ButtonSet.OK);
    }
  });
}

/* ── ⚙️ Datos del responsable (salen en el aviso de privacidad del juego) ── */
function adminDatosResponsable() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const r1 = ui.prompt('⚙️ Responsable del juego (1 de 2)',
      'Nombre de la persona, docente o institución que administra el juego y responde por los datos.\nActual: ' + (ajuste_('RESPONSABLE', '') || '(sin configurar)') + '\n\nEscribe el nombre (deja vacío para conservar el actual):', ui.ButtonSet.OK_CANCEL);
    if (r1.getSelectedButton() !== ui.Button.OK) return;
    const r2 = ui.prompt('⚙️ Contacto del responsable (2 de 2)',
      'Correo (o canal) donde las familias pueden pedir ver, corregir o borrar los datos de su hijo(a).\nActual: ' + (ajuste_('CONTACTO', '') || '(sin configurar)') + '\n\nEscribe el contacto (deja vacío para conservar el actual):', ui.ButtonSet.OK_CANCEL);
    if (r2.getSelectedButton() !== ui.Button.OK) return;
    const nombre = r1.getResponseText().trim().slice(0, 80), contacto = r2.getResponseText().trim().slice(0, 80);
    if (nombre) fijarAjuste_('RESPONSABLE', nombre);
    if (contacto) fijarAjuste_('CONTACTO', contacto);
    registrar_('admin_responsable_configurado', '', 'datos del responsable actualizados');
    ui.alert('✅ Guardado', 'Responsable: ' + (ajuste_('RESPONSABLE', '') || '—') + '\nContacto: ' + (ajuste_('CONTACTO', '') || '—') +
      '\n\nEstos datos aparecen en ☰ Legal > Privacidad dentro del juego. Es obligatorio que haya un canal de contacto para que las familias puedan ejercer sus derechos.', ui.ButtonSet.OK);
  });
}

/* ── 📄 Formato de autorización para familias (hoja lista para imprimir) ── */
function adminFormatoAutorizacion() {
  seguro_(function () {
    const ui = SpreadsheetApp.getUi();
    const raya = '______________________________';
    const resp = ajuste_('RESPONSABLE', '') || raya, cont = ajuste_('CONTACTO', '') || raya;
    const L = [
      'AUTORIZACIÓN DE LA FAMILIA PARA USAR EL JUEGO EDUCATIVO «NINJA MULTIPLICACIÓN»',
      'Formato modelo: revísalo con tu institución o con un abogado antes de usarlo; no es asesoría legal. (Borra esta línea antes de imprimir.)',
      '',
      'Institución / docente responsable: ' + resp + '          Contacto: ' + cont + '          Fecha: ____ / ____ / ________',
      '',
      'Yo, ______________________________________, identificado(a) con documento No. ____________________, en calidad de padre / madre / acudiente / representante legal de (estudiante) ______________________________________, del grado ________, AUTORIZO de manera libre, voluntaria, previa e informada que mi hijo(a) use el juego educativo «Ninja Multiplicación» con una cuenta identificada ÚNICAMENTE por un apodo inventado (no su nombre real).',
      '',
      'Me han informado lo siguiente:',
      '• Qué se guarda: el apodo, una clave, el progreso en el juego (puntos, niveles, aciertos y errores), el código de la clase, la fecha de la última conexión y la constancia de esta autorización.',
      '• Qué NO se pide ni se guarda: nombres reales, apellidos, documentos, correo, teléfono, dirección, fotos, voz, ubicación ni datos sensibles.',
      '• Para qué se usa: guardar el avance entre dispositivos, mostrar rankings con el apodo y el puntaje, y que el docente conozca el avance y las tablas de multiplicar que más cuestan, con fines pedagógicos. No se vende, no se comparte con terceros ni se usa para publicidad.',
      clavesVisibles_()
        ? '• La clave: se guarda cifrada y, además, el administrador del juego puede verla para ayudar al estudiante si la olvida. Se recomienda usar una clave que no se utilice en ningún otro sitio.'
        : '• La clave: se guarda cifrada; nadie puede verla.',
      '• Los datos se almacenan en servicios de Google (Google Sheets / Apps Script), que pueden operar fuera de Colombia.',
      '• Mis derechos: conocer, actualizar y rectificar los datos; solicitar su supresión o revocar esta autorización en cualquier momento; y presentar quejas ante la Superintendencia de Industria y Comercio. Puedo ejercerlos escribiendo a: ' + cont,
      '• Esta autorización es voluntaria: si no la doy, mi hijo(a) puede seguir jugando sin cuenta (su avance solo quedará en su dispositivo).',
      '',
      'Apodo asignado (lo escribe el docente o la familia; NO debe contener el nombre real): ______________________________      Código de clase: ______________',
      '',
      '',
      'Firma: ______________________________      Nombre: ______________________________      C.C.: ______________________',
      '',
      'El docente puede conservar este formato en el archivo del curso. El apodo y el nombre real NO se guardan juntos dentro del juego.'
    ];
    const rep = hojaLimpia_(HOJA_AUTORIZACION);
    rep.getRange(1, 1, L.length, 1).setValues(L.map(function (x) { return [x]; }));
    rep.getRange(1, 1, L.length, 1).setWrap(true).setVerticalAlignment('top');
    rep.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    rep.getRange(2, 1).setFontColor('#b45309').setFontStyle('italic');
    try { rep.setColumnWidth(1, 760); } catch (e) {}
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(rep);
    registrar_('admin_formato_autorizacion', '', 'se generó el formato para familias');
    ui.alert('✅ Formato listo', 'Está en la pestaña "' + HOJA_AUTORIZACION + '". Para imprimirlo: Archivo > Imprimir.\n\n' +
      (ajuste_('CONTACTO', '') ? '' : '⚠️ Aún no configuraste el contacto del responsable: usa Seguridad y legal > Datos del responsable y vuelve a generarlo.\n\n') +
      'Recuerda: la casilla que marca el niño al crear la cuenta deja una constancia, pero la autorización real de las familias la recoge el docente o la institución con este formato.', ui.ButtonSet.OK);
  });
}

/* ── 📦 Exportar los datos de un usuario (derecho de acceso) ── */
function adminExportarUsuario() {
  seguro_(function () {
    const u = pedirUsuario_('📦 Exportar los datos de un usuario'); if (!u) return;
    const f = sheet().getRange(u.row, 1, 1, NC).getValues()[0];
    const datos = {
      apodo: String(f[0]), clase: nombreClase_(f[COL.CLASE - 1]), puntaje: Number(f[COL.PUNTAJE - 1]) || 0,
      ultimaActualizacion: fecha_(f[COL.UPDATED - 1]), autorizacionDeUnAdulto: f[COL.CONSENT - 1] || 'sin constancia',
      apareceEnRankings: String(f[COL.OCULTO - 1]).toLowerCase() !== 'si', progreso: parseProgress_(f[5])
    };
    registrar_('admin_exportacion', u.nick, 'se exportaron los datos del usuario');
    const html = '<style>body{font-family:Arial,sans-serif;font-size:13px}textarea{width:100%;height:330px;font-family:monospace;font-size:12px}</style>' +
      '<p>Estos son <b>todos</b> los datos que el juego guarda de <b>' + esc_(u.nick) + '</b> (sin la clave). Copia el texto para entregárselo a la familia si lo pide.</p>' +
      '<textarea readonly onclick="this.select()">' + esc_(JSON.stringify(datos, null, 2)) + '</textarea>';
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(560).setHeight(430), '📦 Datos de ' + u.nick);
  });
}

/* ════════════════════════════ AYUDA ════════════════════════════ */
function mostrarAyuda_(titulo, html, alto) {
  const estilo = '<style>body{font-family:Arial,sans-serif;font-size:14px;line-height:1.45;color:#222;padding:4px 8px}' +
    'h3{margin:14px 0 4px;color:#3f51b5}code{background:#eef;padding:1px 5px;border-radius:4px}' +
    'li{margin:4px 0}.aviso{background:#fff4e5;border-left:4px solid #fb923c;padding:8px 10px;margin:10px 0}</style>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(estilo + html).setWidth(560).setHeight(alto || 520), titulo);
}

function ayudaUso() {
  mostrarAyuda_('📖 Cómo usar el menú Ninja Admin',
    '<p>Casi todas las opciones piden un <b>apodo</b>. Puedes escribirlo o <b>dejar el cuadro vacío</b> para usar el de la fila que tengas seleccionada en la pestaña <code>Users</code>.</p>' +
    '<h3>Usuarios</h3><ul>' +
    '<li><b>📊 Resumen:</b> cuántos usuarios hay y cuántos jugaron hoy, esta semana o este mes.</li>' +
    '<li><b>🔎 Ver datos:</b> última vez que jugó, sesiones abiertas y tamaño de su progreso. La clave nunca se ve porque se guarda cifrada.</li>' +
    '<li><b>🔑 Restablecer clave:</b> pones una clave nueva (o se genera una temporal). Se muestra una sola vez: entrégasela al jugador. Su progreso se conserva.</li>' +
    '<li><b>🆘 Generar código de rescate:</b> crea un código nuevo para que el jugador pueda recuperar su clave solo (Entrar > ¿Olvidaste tu clave?). Úsalo con cuentas antiguas que no tienen código.</li>' +
    '<li><b>✏️ Cambiar apodo:</b> útil si eligió un apodo con su nombre real. Tendrá que iniciar sesión de nuevo.</li>' +
    '<li><b>🚪 Cerrar sesiones:</b> desconecta al jugador de todos sus dispositivos.</li>' +
    '<li><b>🧹 Borrar progreso:</b> reinicia su avance; la cuenta sigue existiendo.</li>' +
    '<li><b>🗑️ Borrar usuario:</b> elimina la cuenta completa y libera el apodo. Pide escribir BORRAR.</li></ul>' +
    '<h3>Clases y reportes</h3><ul>' +
    '<li><b>🏫 Crear clase:</b> genera un código de 6 letras/números para tus alumnos. Lo escriben al crear su cuenta (o en ☁️ Cuenta > Unirme a una clase) y así compiten en el ranking de su clase. No uses nombres de niños en el nombre de la clase.</li>' +
    '<li><b>📋 Ver clases</b> · <b>👥 Poner a un alumno en una clase</b> · <b>🔁 Cambiar el código</b> (si se filtró) · <b>⏸️ Activar/desactivar</b> (al terminar el año nadie nuevo puede entrar).</li>' +
    '<li><b>📈 Reporte de una clase / de todos:</b> crea la pestaña <code>Reporte</code> con el resumen del grupo, las tablas que más cuestan y una fila por alumno (🟢 activo, 🟡 poco, 🔴 sin jugar hace 7 días o más). Se reemplaza cada vez que lo generas.</li>' +
    '<li><b>👨‍👩‍👧 Reporte de un alumno:</b> una hoja limpia, lista para imprimir o guardar como PDF y entregar a la familia.</li></ul>' +
    '<h3>Seguridad y legal</h3><ul>' +
    '<li><b>📜 Registro de eventos:</b> la pestaña <code>Registro</code> anota cuentas creadas, intentos de entrada fallidos, bloqueos, claves cambiadas o recuperadas y todo lo que haces desde este menú. Nunca guarda claves.</li>' +
    '<li><b>👁️ Claves visibles:</b> muestra la clave de cada jugador en la columna <code>claveVisible</code> para que puedas dársela en persona si la olvida. <b>No compartas la hoja</b> si lo usas. Puedes desactivarlo cuando quieras (se borran).</li>' +
    '<li><b>⚙️ Datos del responsable:</b> tu nombre (o el de la institución) y un contacto: salen en el aviso de privacidad del juego. Es necesario que existan.</li>' +
    '<li><b>📄 Formato de autorización:</b> hoja lista para imprimir que firman las familias. <b>📦 Exportar datos:</b> entrega a la familia todo lo que se guarda de un jugador.</li></ul>' +
    '<h3>Mantenimiento</h3><ul>' +
    '<li><b>🩺 Probar el servidor y la velocidad:</b> comprueba que todo funciona y mide cuánto tarda cada paso.</li>' +
    '<li><b>🔧 Reparar hoja:</b> crea la pestaña y los encabezados si faltan, arregla el formato, detecta apodos repetidos y recalcula el puntaje del ranking. Úsala después de actualizar el código o si editaste apodos a mano.</li>' +
    '<li><b>🔒 Cerrar TODAS las sesiones:</b> todos deben volver a entrar.</li>' +
    '<li><b>🧽 Borrar inactivos:</b> elimina cuentas que llevan muchos días sin jugar (mínimo 30).</li></ul>' +
    '<div class="aviso"><b>Consejo:</b> no escribas ni borres datos a mano en las columnas <code>salt</code>, <code>hash</code> y <code>token</code>. Para eso están las opciones del menú.</div>', 640);
}

function ayudaProblemas() {
  mostrarAyuda_('🆘 Problemas comunes',
    '<h3>El juego dice "El servidor tuvo un problema"</h3><ul>' +
    '<li>Abre <b>Ejecuciones</b> (icono de lista, a la izquierda en el editor de Apps Script): ahí aparece el error real en rojo.</li>' +
    '<li>Usa <b>Ninja Admin > Mantenimiento > Probar el servidor</b>.</li>' +
    '<li>Comprueba que el script se abrió desde esta hoja (<b>Extensiones > Apps Script</b>) y no como proyecto aparte.</li></ul>' +
    '<h3>Cambié el código pero el juego sigue igual</h3>' +
    '<p>Hay que publicar una nueva versión: <b>Implementar > Administrar implementaciones > ✏️ > Versión: Nueva versión > Implementar</b>. La URL no cambia.</p>' +
    '<h3>El juego dice que no hay conexión</h3>' +
    '<p>La implementación debe estar así: <b>Ejecutar como: Yo</b> y <b>Quién tiene acceso: Cualquier persona</b>. Abre la URL en el navegador: debe mostrar <code>{"ok":true,"servicio":"ninja-nube"...}</code>.</p>' +
    '<h3>No aparecen los menús</h3><p>Recarga la hoja (F5) y espera unos segundos: aparecen a la derecha de "Ayuda". Si siguen sin salir, comprueba que abriste el script desde <b>esta</b> hoja (<b>Extensiones > Apps Script</b>) y no como proyecto aparte. Ejecutar <code>onOpen</code> desde el editor no sirve: ahí no hay hoja donde mostrarlos.</p>' +
    '<h3>Un niño olvidó su clave</h3><ul><li>Si anotó su <b>código de rescate</b>, lo escribe en el juego: <b>Entrar > ¿Olvidaste tu clave?</b>, y crea una clave nueva sin ayuda.</li>' +
    '<li>Si no lo tiene, usa <b>Restablecer clave</b> y entrégale la clave temporal. La clave antigua no se puede ver: se guarda cifrada.</li></ul>' +
    '<h3>"Código de rescate incorrecto"</h3><p>Revisa que no confunda letras parecidas. Tras 5 intentos fallidos se bloquea 10 minutos. Si lo perdió, genera uno con <b>🆘 Generar código de rescate</b>.</p>' +
    '<h3>"Tu sesión terminó"</h3><p>Pasa si le cerraste la sesión, le restableciste la clave o entró desde más de 5 dispositivos. Solo debe iniciar sesión otra vez; su progreso está a salvo.</p>' +
    '<h3>El juego dice "servidor ocupado"</h3><p>Es normal si muchos entran en el mismo segundo: el juego reintenta solo. Para el primer día de clase conviene que los niños no entren todos exactamente a la vez. Mide la velocidad con <b>Mantenimiento > Probar el servidor y la velocidad</b>.</p>' +
    '<h3>No veo la clave de un jugador</h3><p>Las cuentas anteriores a la versión 3.0 muestran su clave cuando el jugador vuelve a entrar, o al instante si usas <b>Restablecer clave</b>. Comprueba además que <b>Claves visibles</b> esté activado.</p>' +
    '<h3>El ranking aparece vacío</h3><p>El puntaje se calcula cuando el niño guarda su progreso (al jugar). Tras actualizar a esta versión, usa <b>Mantenimiento > Reparar hoja</b> una vez para calcular el puntaje de quienes ya tenían cuenta. El ranking se refresca cada minuto.</p>' +
    '<h3>"Ese código de clase no existe"</h3><p>Revisa que la clase esté activa (<b>Ver clases</b>) y que el niño escriba el código completo. Los 6 caracteres no incluyen 0, O, 1, I ni L.</p>' +
    '<h3>Límites de Google</h3><p>Apps Script tiene cuotas diarias: alcanza para cientos de alumnos, no para miles jugando a la vez. Cada llamada tarda alrededor de 1 segundo.</p>', 600);
}

function ayudaURL() {
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  mostrarAyuda_('🔗 URL de la aplicación',
    (url
      ? '<p>Esta es la URL publicada. Es la que va en <code>engine/nube.js</code> del juego (constante <code>API_URL</code>):</p><p><code style="word-break:break-all">' + url + '</code></p>' +
        '<p>Si termina en <code>/dev</code> es la versión de prueba. Para el juego necesitas la que termina en <code>/exec</code> (Implementar > Administrar implementaciones).</p>'
      : '<p>Todavía no hay una aplicación web publicada. Ve a <b>Implementar > Nueva implementación > Aplicación web</b>, ejecuta como <b>Yo</b> y acceso para <b>Cualquier persona</b>.</p>') +
    '<div class="aviso">Cualquiera que tenga la URL puede llamar al servidor, pero solo con apodo y clave válidos.</div>', 330);
}

function ayudaPrivacidad() {
  const vis = clavesVisibles_();
  mostrarAyuda_('🔐 Privacidad y datos',
    '<p>El juego solo guarda en esta hoja:</p><ul><li>un <b>apodo</b> inventado,</li><li>la <b>clave</b>, cifrada con hash y sal' + (vis ? ' <b>y además en texto legible en la columna <code>claveVisible</code>, para que tú puedas ayudar</b> (el juego se lo informa a las familias y a los niños)' : ' (nadie puede leerla, ni tú)') + ',</li>' +
    '<li>el <b>progreso del juego</b> y la fecha de la última actualización,</li><li>el <b>código de clase</b> (si el niño se une a una),</li><li>la <b>constancia de autorización</b> de un adulto, con la fecha.</li></ul>' +
    '<p>No se piden nombres, correos, edades, teléfonos ni ubicación.</p>' +
    '<p>Los <b>rankings</b> muestran solo el apodo y el puntaje. Cada jugador puede ocultarse desde ☁️ Cuenta > Ranking. Los reportes los ves solo tú, como dueño de la hoja.</p>' +
    '<ul><li>Si un niño usa su nombre real como apodo, cámbialo con <b>✏️ Cambiar apodo</b>.</li>' +
    '<li>Para borrar los datos de un niño (por ejemplo, a pedido de sus padres) usa <b>🗑️ Borrar usuario</b>. Para entregarle una copia, <b>📦 Exportar los datos de un usuario</b>.</li>' +
    '<li>No compartas esta hoja con nadie que no deba ver los datos: quien la abre ve apodos' + (vis ? ', claves' : '') + ' y progreso.</li></ul>' +
    '<div class="aviso">Esto es buena práctica de minimización de datos, pero no es asesoría legal. Mira también ❓ Ayuda > Cumplimiento legal.</div>', 520);
}

function ayudaLegal() {
  mostrarAyuda_('⚖️ Cumplimiento legal (Colombia)',
    '<div class="aviso"><b>Esto es una guía práctica, no asesoría legal.</b> Confírmalo con tu colegio o con un abogado, sobre todo si el juego lo van a usar muchos estudiantes o varias instituciones.</div>' +
    '<h3>Marco que aplica</h3><ul>' +
    '<li><b>Ley 1581 de 2012</b> (protección de datos personales) y su reglamento, el <b>Decreto 1377 de 2013</b> (hoy compilado en el Decreto 1074 de 2015).</li>' +
    '<li><b>Ley 1098 de 2006</b> (Código de la Infancia y la Adolescencia): prevalece el interés superior del menor.</li>' +
    '<li>La autoridad es la <b>Superintendencia de Industria y Comercio (SIC)</b>.</li></ul>' +
    '<h3>Lo que el juego ya hace por ti</h3><ul>' +
    '<li>No pide ningún dato real: solo un apodo, una clave y el progreso.</li>' +
    '<li>Muestra dentro del juego (☰ Legal) los <b>créditos</b>, el <b>aviso de privacidad</b>, los <b>términos de uso</b> y una sección para <b>familias y docentes</b>.</li>' +
    '<li>Al crear una cuenta exige marcar que un <b>adulto responsable</b> leyó el aviso y autoriza, y guarda la constancia (versión y fecha).</li>' +
    '<li>Informa claramente si el administrador puede ver las claves, y que se usan las fuentes de Google Fonts.</li>' +
    '<li>Claves cifradas, registro de eventos, y herramientas para <b>exportar</b> (derecho de acceso) y <b>borrar</b> (supresión) los datos de un jugador.</li></ul>' +
    '<h3>Lo que te toca a ti</h3><ul>' +
    '<li>Configurar <b>Seguridad y legal > Datos del responsable</b> (nombre y contacto): sin canal de contacto las familias no pueden ejercer sus derechos.</li>' +
    '<li>Recoger la <b>autorización de las familias</b> con el formato imprimible. La casilla del juego deja constancia, pero no reemplaza la firma del acudiente.</li>' +
    '<li>No anotes jamás el apodo junto al nombre real dentro de esta hoja ni del juego. Si necesitas esa lista, guárdala aparte, en papel o en un archivo del colegio.</li>' +
    '<li>Revisar con un abogado si debes tener una <b>política de tratamiento de datos</b> formal, si te aplica el <b>Registro Nacional de Bases de Datos</b> de la SIC, y el tema de que los datos están en servicios de Google (posible transferencia internacional).</li>' +
    '<li>Confirmar que tienes <b>derechos sobre las imágenes, la música y los sonidos</b> del juego y completar los créditos de terceros en <code>engine/legal.js</code>.</li>' +
    '<li>No compartir esta hoja y usar <b>Reparar hoja</b> y el <b>registro de eventos</b> para vigilar el uso.</li></ul>', 640);
}
