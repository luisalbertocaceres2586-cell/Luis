/* Legal — Ninja Multiplicación
 * Créditos, aviso de privacidad, términos de uso y una sección para familias y docentes, dentro del propio juego (botón ⚖️ Legal del menú).
 *
 * ⚠️ PLANTILLA: está redactada pensando en la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015)
 *    y la Ley 1098 de 2006 (Colombia), pero NO es asesoría legal. Revísala con tu colegio o un abogado antes de publicarla.
 *
 * Qué debes completar tú:
 *  1) En la hoja de Google: menú 🥷 Ninja Admin > 🔐 Seguridad y legal > ⚙️ Datos del responsable (nombre y contacto).
 *     Salen solos en el aviso de privacidad. Sin un canal de contacto las familias no pueden ejercer sus derechos.
 *  2) Aquí abajo, en CONFIG.creditos: agrega el arte, la música o los sonidos de terceros que uses, con su licencia.
 *     (No se pudo verificar de dónde salió el arte del juego: confírmalo tú y acredítalo si hace falta.)
 *  3) Si cambias el texto, sube CONFIG.version aquí y VERSION_LEGAL en Code.gs (deben coincidir).
 *
 * El contenido de cada sección es un dato puro (Legal.secciones(cfg)) para poder comprobarlo con pruebas automáticas. */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Legal = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const root = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : {};

  const CONFIG = {
    juego: 'NINJA X: Guardianes de las Tablas',
    version: '1.0',                         // debe coincidir con VERSION_LEGAL de Code.gs
    actualizado: '23 de noviembre de 2026',
    anio: 2026,
    creditos: [
      // { rol: 'Música', nombre: 'Nombre del autor o de la pista', licencia: 'CC BY 4.0', enlace: 'https://…' },
      { rol: 'Tipografías', nombre: 'Inter (Rasmus Andersson) y Press Start 2P (CodeMan38)', licencia: 'SIL Open Font License 1.1', nota: 'cargadas desde Google Fonts' },
      { rol: 'Programación', nombre: 'Desarrollada con la ayuda de Claude, un asistente de inteligencia artificial de Anthropic' }
    ]
  };

  /** Datos que vienen del servidor (hoja de Google): responsable, contacto y si el administrador puede ver las claves. */
  function normalizar(cfg) {
    cfg = cfg || {};
    return {
      responsable: String(cfg.responsable || '').trim(),
      contacto: String(cfg.contacto || '').trim(),
      clavesVisibles: cfg.clavesVisibles !== false          // si no se sabe, se informa lo más estricto: que sí se pueden ver
    };
  }

  /** Secciones del aviso legal como datos: [{ id, titulo, bloques: [['h',t] | ['p',t] | ['ul',[t…]]] }] */
  function secciones(cfgServidor) {
    const c = normalizar(cfgServidor), J = CONFIG.juego;
    const quien = c.responsable || 'la persona o institución que administra el juego';
    const contacto = c.contacto
      ? 'Puedes escribir a: ' + c.contacto + '.'
      : 'Pregúntale a tu docente o a quien te dio este juego cómo contactar al responsable.';
    const pie = ['p', 'Versión ' + CONFIG.version + ' · Actualizado el ' + CONFIG.actualizado + '.'];

    const creditos = {
      id: 'creditos', titulo: '📜 Créditos', bloques: [
        ['h', J],
        ['p', 'Un juego educativo para practicar las tablas de multiplicar y divertirte mientras aprendes.'],
        ['p', 'Creado por ' + (c.responsable || 'su autor') + '.'],
        ['h', 'Materiales y herramientas de terceros'],
        ['ul', CONFIG.creditos.map(function (x) {
          return x.rol + ': ' + x.nombre + (x.licencia ? ' — licencia ' + x.licencia : '') + (x.nota ? ' (' + x.nota + ')' : '');
        })],
        ['h', 'Tecnología'],
        ['p', 'Las cuentas y el progreso se guardan con Google Sheets y Google Apps Script.'],
        ['p', '© ' + CONFIG.anio + ' ' + (c.responsable || 'Autor del juego') + '. Todos los derechos reservados, salvo los materiales de terceros indicados arriba, que conservan su propia licencia.'],
        pie
      ]
    };

    const privacidad = {
      id: 'privacidad', titulo: '🔐 Privacidad', bloques: [
        ['h', 'Aviso de privacidad'],
        ['p', 'Este aviso explica, en palabras sencillas, qué datos usa ' + J + ', para qué y cuáles son tus derechos. Se redactó teniendo en cuenta la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015), sobre protección de datos personales en Colombia, y la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia).'],
        ['h', '1. Quién es el responsable'],
        ['p', 'El responsable del tratamiento de los datos es ' + quien + '. ' + contacto],
        ['h', '2. Qué NO pedimos'],
        ['p', 'No pedimos ni guardamos nombres reales, apellidos, documentos, correo, teléfono, dirección, fotos, voz, ubicación ni datos sensibles. Por favor, no los escribas en ningún lugar del juego: usa solo un apodo inventado.'],
        ['h', '3. Qué datos se guardan'],
        ['ul', [
          'Tu apodo (inventado, no tu nombre real).',
          c.clavesVisibles
            ? 'Tu clave. Se guarda cifrada y, además, el administrador del juego puede verla para ayudarte si la olvidas. Por eso usa una clave que NO utilices en ningún otro sitio.'
            : 'Tu clave. Se guarda cifrada: nadie puede verla, ni siquiera el administrador.',
          'Tu progreso en el juego: puntos, niveles, estrellas, aciertos, errores y minutos jugados.',
          'El código de tu clase, si te unes a una, y si prefieres aparecer o no en los rankings.',
          'La fecha de tu última conexión.',
          'La constancia de que un adulto autorizó la cuenta (la versión de este aviso y la fecha).'
        ]],
        ['h', '4. Para qué se usan'],
        ['ul', [
          'Guardar tu avance para que puedas seguir jugando desde otro dispositivo.',
          'Mostrar rankings con tu apodo y tu puntaje.',
          'Que tu docente, si te unes a una clase, vea el avance del grupo y las tablas de multiplicar que más cuestan, con fines pedagógicos.',
          'Mantener el juego seguro (por ejemplo, anotar intentos fallidos de entrada).'
        ]],
        ['p', 'No vendemos tus datos, no los usamos para publicidad ni para crear perfiles comerciales.'],
        ['h', '5. Niños, niñas y adolescentes'],
        ['p', 'Los datos de menores de edad se tratan solo con la autorización de su padre, madre, acudiente o representante legal, respetando el interés superior del menor y sus derechos. Por eso, para crear una cuenta, un adulto responsable debe leer este aviso y autorizarla. Si no hay autorización, el niño puede jugar sin cuenta (su avance quedará solo en su dispositivo).'],
        ['h', '6. Con quién se comparten'],
        ['ul', [
          'Con el docente o la institución a cargo de tu clase: ven apodos y progreso, no datos reales (no los tenemos).',
          'Con Google, que presta la infraestructura (Google Sheets, Apps Script y Google Fonts). Al usar sus servicios, Google puede recibir datos técnicos como tu dirección IP, según su propia política de privacidad. Sus servidores pueden estar fuera de Colombia.',
          'Con nadie más, salvo que una autoridad competente lo exija conforme a la ley.'
        ]],
        ['h', '7. Datos en tu dispositivo'],
        ['p', 'El juego usa el almacenamiento de tu navegador para guardar tu avance y tu sesión. No usamos cookies de seguimiento ni de publicidad. Si usas un equipo compartido, al cerrar sesión puedes elegir borrar también el progreso de ese equipo.'],
        ['h', '8. Seguridad y conservación'],
        ['p', 'La comunicación es cifrada y las claves se guardan cifradas. Ningún sistema es 100 % infalible, pero tomamos medidas razonables. Guardamos los datos mientras la cuenta exista; se borran cuando se solicita, y las cuentas que llevan mucho tiempo sin usarse pueden eliminarse.'],
        ['h', '9. Tus derechos'],
        ['p', 'Tú, o tu padre, madre o representante legal, pueden en cualquier momento:'],
        ['ul', [
          'Conocer qué datos se guardan y pedir una copia, sin costo.',
          'Actualizar o corregir los datos.',
          'Pedir que se borren o revocar la autorización.',
          'Presentar una queja ante la Superintendencia de Industria y Comercio (sic.gov.co), que es la autoridad de protección de datos en Colombia.'
        ]],
        ['p', contacto],
        ['h', '10. Cambios'],
        ['p', 'Si este aviso cambia, se publicará aquí con una nueva versión y fecha.'],
        pie
      ]
    };

    const terminos = {
      id: 'terminos', titulo: '📄 Términos', bloques: [
        ['h', 'Términos de uso'],
        ['p', 'Al jugar ' + J + ' aceptas estas reglas sencillas. Si eres menor de edad, un adulto responsable debe leerlas contigo.'],
        ['ul', [
          'Es un juego educativo para uso personal y escolar, sin fines comerciales.',
          'Usa solo un apodo inventado. No escribas tu nombre real, ni datos de otras personas, ni palabras ofensivas. El administrador puede cambiar un apodo o eliminar una cuenta si hace falta.',
          'No hagas trampa ni intentes dañar, saturar o entrar sin permiso al juego o a las cuentas de otros. Eso puede causar la suspensión de la cuenta.',
          'Cuida tu clave y no la compartas con tus compañeros. Si la olvidas, pídele ayuda a tu docente o usa tu código de rescate.',
          'Los rankings son solo para divertirse; los puntajes pueden no ser exactos.',
          'El juego se ofrece «tal como está», sin garantía de que funcione siempre ni de que tu progreso nunca se pierda. Haremos lo posible por mantenerlo disponible. Esto no limita los derechos que la ley te reconoce.',
          'El nombre, los personajes, los gráficos y el código del juego están protegidos por derechos de autor y por las licencias de sus autores (ver Créditos). No los copies ni los uses fuera del juego sin permiso.',
          'Estos términos pueden cambiar; la versión vigente estará siempre aquí. Se rigen por las leyes de Colombia.'
        ]],
        pie
      ]
    };

    const familias = {
      id: 'familias', titulo: '👨‍👩‍👧 Familias y docentes', bloques: [
        ['h', 'Para familias y docentes'],
        ['p', J + ' no pide datos personales: cada niño juega con un apodo inventado. Estas son las cosas más importantes:'],
        ['ul', [
          'Ayuda al niño a elegir un apodo que NO sea su nombre real ni se parezca a él.',
          c.clavesVisibles
            ? 'La clave se guarda cifrada y el administrador del juego puede verla para ayudar si se olvida. Recomienda una clave que no use en ningún otro sitio.'
            : 'La clave se guarda cifrada y nadie puede verla. Si el niño la olvida, puede recuperarla con su código de rescate.',
          'Al crear la cuenta se genera un código de rescate: anótenlo en un lugar seguro. Con él, el niño puede crear una clave nueva sin ayuda.',
          'La cuenta necesita la autorización de un adulto responsable. Si la institución lo pide, firmen además el formato de autorización.',
          'Si un niño se une a una clase con el código de su docente, el docente puede ver su apodo, su avance y las tablas que más le cuestan. No ve datos reales.',
          'En ☁️ Cuenta > 🏆 Ranking, el niño puede dejar de aparecer en los rankings en cualquier momento.',
          'En un equipo compartido, al cerrar sesión elijan borrar también el progreso de ese equipo.'
        ]],
        ['h', 'Ver, corregir o borrar los datos de un niño'],
        ['p', 'Pueden pedirlo en cualquier momento y sin costo. ' + contacto + ' Si el docente anotó qué apodo corresponde a cada estudiante, esa lista es del docente o del colegio: no se guarda dentro del juego.'],
        pie
      ]
    };

    return [creditos, privacidad, terminos, familias];
  }

  const api = { CONFIG: CONFIG, secciones: secciones, normalizar: normalizar, abrir: function () {} };

  /* ═════════════ Navegador: ventana con pestañas y botón en el menú ═════════════ */
  function iniciarNavegador() {
    const doc = document;
    const el = function (tag, props, hijos) {
      const e = doc.createElement(tag);
      Object.keys(props || {}).forEach(function (k) { e[k] = props[k]; });
      (hijos || []).forEach(function (h) { e.appendChild(typeof h === 'string' ? doc.createTextNode(h) : h); });
      return e;
    };
    const st = el('style', {});
    st.textContent =
      '.lg-ov{position:fixed;inset:0;z-index:2147483500;background:rgba(3,5,20,.82);display:flex;align-items:center;justify-content:center;padding:10px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.lg-box{width:min(560px,100%);height:min(640px,94vh);display:flex;flex-direction:column;background:#12163a;color:#eef;border:2px solid #5b6cff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.6)}' +
      '.lg-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 0}.lg-top h2{margin:0;font-size:19px}' +
      '.lg-x{background:none;border:0;color:#aab;font-size:26px;cursor:pointer;line-height:1}' +
      '.lg-tabs{display:flex;gap:6px;padding:10px 12px;overflow-x:auto}.lg-tabs button{flex:0 0 auto;padding:8px 11px;border-radius:10px;border:1px solid #444b9a;background:#1b2050;color:#cfd4ff;font-size:13px;cursor:pointer;white-space:nowrap}.lg-tabs button.on{background:#5b6cff;color:#fff;border-color:#5b6cff}' +
      '.lg-body{flex:1;overflow:auto;padding:4px 16px 18px;font-size:14px;line-height:1.5;color:#dfe3ff}' +
      '.lg-body h3{margin:16px 0 4px;font-size:15px;color:#ffe27a}.lg-body h3:first-child{margin-top:6px;font-size:17px}.lg-body p{margin:6px 0}.lg-body ul{margin:6px 0;padding-left:20px}.lg-body li{margin:4px 0}' +
      '.m26-d[data-legal] .m26-i{font-style:normal}' +
      '.lg-fab{position:fixed;right:10px;bottom:10px;z-index:99990;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(20,24,60,.8);color:#cfd4ff;font-size:12px;cursor:pointer}';
    doc.head.appendChild(st);

    function abrir(seccion) {
      if (doc.querySelector('.lg-ov')) return;
      const ov = el('div', { className: 'lg-ov' }), box = el('div', { className: 'lg-box', role: 'dialog' });
      ov.appendChild(box); doc.body.appendChild(ov);
      let actual = seccion || 'creditos';
      const cerrar = function () { ov.remove(); };
      ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
      const body = el('div', { className: 'lg-body' }), tabs = el('div', { className: 'lg-tabs' });
      box.appendChild(el('div', { className: 'lg-top' }, [el('h2', { textContent: '⚖️ ' + CONFIG.juego + ' · Legal' }), el('button', { className: 'lg-x', type: 'button', textContent: '×', onclick: cerrar })]));
      box.appendChild(tabs); box.appendChild(body);
      let cfg = (root.Nube && root.Nube.config && root.Nube.config()) || {};
      function pintar() {
        const lista = secciones(cfg);
        tabs.textContent = ''; body.textContent = '';
        lista.forEach(function (s) {
          tabs.appendChild(el('button', { type: 'button', textContent: s.titulo, className: s.id === actual ? 'on' : '', onclick: function () { actual = s.id; pintar(); body.scrollTop = 0; } }));
        });
        const s = lista.filter(function (x) { return x.id === actual; })[0] || lista[0];
        s.bloques.forEach(function (b) {
          if (b[0] === 'h') body.appendChild(el('h3', { textContent: b[1] }));
          else if (b[0] === 'p') body.appendChild(el('p', { textContent: b[1] }));
          else body.appendChild(el('ul', {}, /** @type {string[]} */ (b[1]).map(function (t) { return el('li', { textContent: t }); })));
        });
      }
      pintar();
      // trae los datos más recientes del responsable (si hay conexión) y vuelve a dibujar
      if (root.Nube && root.Nube.cargarConfig) root.Nube.cargarConfig().then(function (c) { if (c && doc.body.contains(ov)) { cfg = c; pintar(); } }).catch(function () {});
    }
    api.abrir = abrir;

    // botón en el dock del menú principal (como ☁️ Cuenta); si no hay dock, un enlace pequeño abajo a la derecha
    const btn = el('button', { type: 'button', title: 'Legal: créditos, privacidad y términos' });
    btn.dataset.legal = '1';
    btn.addEventListener('click', function () { abrir(); });
    let intentos = 0;
    (function buscar() {
      const dock = doc.querySelector('.m26-dock');
      if (dock) { btn.className = 'm26-d'; btn.innerHTML = '<i class="m26-i">⚖️</i><span class="m26-l">Legal</span>'; dock.insertBefore(btn, dock.lastElementChild); return; }
      if (++intentos > 12) { btn.className = 'lg-fab'; btn.textContent = '⚖️ Legal'; doc.body.appendChild(btn); return; }
      setTimeout(buscar, 400);
    })();
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.LEGAL_SIN_UI) {
    const arrancar = function () { try { iniciarNavegador(); } catch (e) { if (window.console) console.warn('Legal: no se pudo iniciar', e); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  }
  return api;
});
