// El aviso legal del juego (engine/legal.js) debe decir la verdad y coincidir con el servidor. Ejecutar: node tests/legal.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Legal = require('../engine/legal.js');

const texto = (secs, id) => {
  const s = secs.find(x => x.id === id);
  assert.ok(s, 'existe la sección ' + id);
  return s.bloques.map(b => (b[0] === 'ul' ? b[1].join('\n') : b[1])).join('\n');
};
const todo = secs => secs.map(s => texto(secs, s.id)).join('\n');

const completo = Legal.secciones({ responsable: 'Colegio San Luis', contacto: 'datos@colegio.edu.co', clavesVisibles: true });

// 1) las 4 secciones existen y no tienen huecos
assert.deepStrictEqual(completo.map(s => s.id), ['creditos', 'privacidad', 'terminos', 'familias']);
completo.forEach(s => {
  assert.ok(s.titulo && s.bloques.length >= 3, 'sección con contenido: ' + s.id);
  s.bloques.forEach(b => {
    assert.ok(['h', 'p', 'ul'].includes(b[0]), 'tipo de bloque válido');
    (Array.isArray(b[1]) ? b[1] : [b[1]]).forEach(t => assert.ok(typeof t === 'string' && t.trim().length > 3 && !/undefined|\[object/.test(t), 'texto sano: ' + t));
  });
});

// 2) responsable y contacto salen donde hacen falta
const priv = texto(completo, 'privacidad');
assert.ok(priv.includes('Colegio San Luis') && priv.includes('datos@colegio.edu.co'), 'el aviso nombra al responsable y su contacto');
assert.ok(texto(completo, 'familias').includes('datos@colegio.edu.co') && texto(completo, 'creditos').includes('Colegio San Luis'));
const sinConfig = Legal.secciones({});
assert.ok(!/undefined|null/.test(todo(sinConfig)), 'sin configurar no aparecen textos rotos');
assert.ok(/Pregúntale a tu docente/.test(texto(sinConfig, 'privacidad')), 'sin contacto se indica a quién preguntar');

// 3) dice la verdad sobre las claves: visibles o no
assert.ok(/administrador del juego puede verla/.test(priv) && /que NO utilices en ningún otro sitio/.test(priv));
const oculto = Legal.secciones({ responsable: 'X', contacto: 'a@b.co', clavesVisibles: false });
assert.ok(/nadie puede verla, ni siquiera el administrador/.test(texto(oculto, 'privacidad')) && !/administrador del juego puede verla/.test(todo(oculto)), 'si no son visibles, no se dice que lo son');
assert.ok(/administrador del juego puede verla/.test(texto(sinConfig, 'privacidad')), 'si no se sabe, se informa lo más estricto (que sí pueden verse)');

// 4) contenido legal imprescindible
['Ley 1581 de 2012', 'Decreto 1377 de 2013', 'Ley 1098 de 2006', 'Superintendencia de Industria y Comercio', 'interés superior'].forEach(t => assert.ok(priv.includes(t), 'el aviso cita: ' + t));
['Conocer', 'Actualizar', 'borren', 'revocar'].forEach(t => assert.ok(priv.includes(t), 'derechos del titular: ' + t));
assert.ok(/No pedimos ni guardamos nombres reales/.test(priv) && /datos sensibles/.test(priv), 'dice qué NO se pide');
assert.ok(/no los usamos para publicidad/.test(priv) && /no vendemos/i.test(priv));
assert.ok(/Google/.test(priv) && /fuera de Colombia/.test(priv), 'informa que Google presta la infraestructura y puede estar fuera del país');
assert.ok(/autorización de su padre, madre, acudiente o representante legal/.test(priv), 'menores: autorización del representante');
assert.ok(/jugar sin cuenta/.test(priv), 'quien no autoriza puede seguir jugando sin cuenta');
assert.ok(/cookies de seguimiento/.test(priv) || /No usamos cookies/.test(priv));

// 5) créditos de terceros: las fuentes que el juego incluye (autoalojadas: no se piden a Google Fonts)
const cred = texto(completo, 'creditos');
assert.ok(/Inter/.test(cred) && /Lilita One/.test(cred) && /Open Font License/.test(cred), 'créditos de las tipografías');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.ok(!/fonts\.googleapis\.com/.test(index) && /fuentes\.css/.test(index), 'las fuentes son locales: no se piden a Google Fonts');
['lilita-one-latin-400-normal.woff2', 'inter-latin-700-normal.woff2'].forEach(f => assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'fonts', f)), 'existe la fuente ' + f));

// 6) términos y familias
const ter = texto(completo, 'terminos');
assert.ok(/apodo inventado/.test(ter) && /No hagas trampa/.test(ter) && /leyes de Colombia/.test(ter));
assert.ok(/código de rescate/.test(texto(completo, 'familias')) && /rankings/.test(texto(completo, 'familias')));

// 7) la versión del aviso coincide con la del servidor (la constancia de autorización guarda esa versión)
const servidor = fs.readFileSync(path.join(__dirname, '..', 'servidor', 'Code.gs'), 'utf8');
const vServidor = /const VERSION_LEGAL = '([^']+)'/.exec(servidor);
assert.ok(vServidor, 'Code.gs declara VERSION_LEGAL');
assert.strictEqual(vServidor[1], Legal.CONFIG.version, 'engine/legal.js y servidor/Code.gs deben tener la misma versión del aviso');
assert.ok(completo.every(s => s.bloques[s.bloques.length - 1][1].includes('Versión ' + Legal.CONFIG.version)), 'cada sección muestra la versión');

console.log('legal: todo OK');
