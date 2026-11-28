/* Registro de mundos — Ninja Multiplicación
 * Solo DATOS. Para agregar un mundo, copia un objeto de `lista` y cambia sus valores; el motor
 * (selector-mundos.js) no se toca.
 *
 * Campos
 *   id, nombre, nivel (rótulo), lema, tablas, duracion, dificultad(1-3)
 *   acento / acento2     colores de halo, botón y sello
 *   cielo                degradado del cielo [arriba, abajo]
 *   fases[]              paisajes de fondo: {nombre, far (imagen), suelo:[color1,color2]}. Con >1 se funden en bucle.
 *   props[]              decorados que se desplazan: {img, x (% del ancho), h (% del alto de la escena), capa:'medio'|'cerca'}
 *   extra                {img|frames, lado:'izq'|'der', h, y, fps?}  compañero/enemigo
 *   flota                imagen que "respira" en el cielo (opcional)
 *   heroe                'corre' (idle↔correr) | 'vuela' (alfombra)
 *   particulas           'luciernagas' | 'arena' | 'cristales' | 'petalos' | 'farolillos' | 'brasas'
 *   progreso(perfil)     → {estado:'nuevo'|'en_curso'|'completado', estrellas, mejor}  (se DERIVA del perfil)
 *   url(perfil)          página que abre el nivel si el integrador no pasa su propio lanzador
 *   bloqueado            true = tarjeta "Próximamente"
 *   visible(perfil)      false = no se muestra (opcional)
 */
(/** @param {any} root @param {(...deps: any[]) => any} factory */ function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MundosRegistro = factory();
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const A = 'assets/';
  const EN = A + 'environment/';
  const N1 = A + 'nivel1/';
  const N2 = A + 'nivel2/';

  function qs(p, extra) {
    const o = Object.assign({ heroe: (p && p.avatar) || 'sakura', perfil: (p && p.id) || '' }, extra || {});
    return Object.keys(o).filter(k => o[k] !== '' && o[k] != null).map(k => k + '=' + encodeURIComponent(o[k])).join('&');
  }
  function numero(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

  /** @type {Mundo[]} */
  const lista = [
    {
      id: 'senda',
      nombre: 'La Senda del Aprendiz',
      nivel: 'MUNDO 1',
      lema: 'Bosque de bambú, cuevas y dojos. Tú eliges el camino.',
      tablas: 'Entrenamiento mixto',
      duracion: '25–40 min',
      dificultad: 1,
      acento: '#3ee0a0', acento2: '#1f9d78',
      cielo: ['#17265a', '#5d9fd8'],
      fases: [{ nombre: 'Bosque de bambú', far: EN + 'levels/nivel1/n1_bg_montanas_lejos.png', suelo: ['#2f7a4a', '#16382a'] }],
      flota: EN + 'backgrounds/scenery/floating_islands_sakura.png',
      props: [
        { img: EN + 'props/nature/bamboo_a.png', x: 6, h: 62, capa: 'medio' },
        { img: N1 + 'decorado/torii_activo.png', x: 38, h: 58, capa: 'medio' },
        { img: EN + 'props/nature/bamboo_c.png', x: 64, h: 70, capa: 'medio' },
        { img: N1 + 'decorado/estatua_kitsune.png', x: 84, h: 40, capa: 'medio' },
        { img: N1 + 'decorado/bambu_primer_plano.png', x: 62, h: 70, capa: 'cerca' },
        { img: N1 + 'decorado/farol_templo.png', x: 88, h: 44, capa: 'cerca' }
      ],
      extra: { img: N1 + 'enemigos/ninja_sombra.png', lado: 'izq', h: 40, y: 0 },
      heroe: 'corre',
      demo: { tipo: 'lateral' },
      particulas: 'luciernagas',
      progreso: p => {
        const n = (p && p.nivel1) || {};
        const est = numero(n.completados) > 0 ? 'completado' : (numero(n.intentos) > 0 || n.plan ? 'en_curso' : 'nuevo');
        return { estado: est, estrellas: 0, veces: numero(n.completados) };
      }
    },
    {
      id: 'viaje',
      nombre: 'Viaje por 4 Mundos',
      nivel: 'MUNDO 2',
      lema: 'Vuela entre dunas, cristales, nubes y un templo. ¡Cruza la puerta correcta!',
      tablas: 'Tablas del 4, 5 y 6',
      duracion: '15–25 min',
      dificultad: 2,
      acento: '#ffb44a', acento2: '#e0752d',
      cielo: ['#3a1f6e', '#f59a52'],
      fases: [
        { nombre: 'Dunas', far: EN + 'backgrounds/themes/montanas_desert.png', suelo: ['#d9a35b', '#8a5a2b'],
          props: [{ img: N2 + 'obstaculos/cactus_saguaro.png', x: 14, h: 46, capa: 'medio' }, { img: N2 + 'obstaculos/roca_grande.png', x: 55, h: 26, capa: 'medio' }, { img: N2 + 'obstaculos/cactus_barril.png', x: 82, h: 24, capa: 'cerca' }] },
        { nombre: 'Mina de cristal', far: N2 + 'ambientes/fondo_mina.jpg', completo: true, suelo: ['#2a2f7a', '#0d0f33'],
          props: [{ img: EN + 'props/crystals/crystal_blue_d.png', x: 12, h: 40, capa: 'medio' }, { img: EN + 'props/crystals/crystal_purple_b.png', x: 58, h: 34, capa: 'medio' }, { img: EN + 'props/crystals/crystal_purple_a.png', x: 84, h: 30, capa: 'cerca' }] },
        { nombre: 'Islas del cielo', far: N2 + 'ambientes/fondo_cielo.jpg', completo: true, suelo: ['#6a3fa0', '#2c1a5c'],
          props: [{ img: N2 + 'ambientes/nube_a.png', x: 8, h: 22, capa: 'medio' }, { img: N2 + 'ambientes/nube_b.png', x: 60, h: 20, capa: 'medio' }] },
        { nombre: 'Templo del sol', far: N2 + 'ambientes/fondo_templo.jpg', completo: true, suelo: ['#c98445', '#6b3b1f'],
          props: [{ img: EN + 'props/lights/fire_brazier_c.png', x: 20, h: 34, capa: 'medio' }, { img: EN + 'props/structures/ruined_pillars_b.png', x: 66, h: 46, capa: 'medio' }] }
      ],
      extra: { frames: [0, 1, 2].map(i => N2 + 'companero/zorro_run_0' + i + '.png'), lado: 'der', h: 24, y: 0, fps: 9 },
      heroe: 'vuela',
      demo: { tipo: 'vuelo' },
      particulas: 'arena',
      progreso: p => {
        const n = (p && p.nivel2) || {};
        const est = numero(n.completados) > 0 ? 'completado' : (numero(n.intentos) > 0 || n.tutorial ? 'en_curso' : 'nuevo');
        return { estado: est, estrellas: numero(n.estrellas), mejor: numero(n.mejor), veces: numero(n.completados) };
      },
      url: p => 'nivel2.html?' + qs(p)
    },
    {
      id: 'farolillos',
      nombre: 'Carrera de los Farolillos',
      nivel: 'MUNDO 3',
      lema: 'Corre de noche, junta monedas, vuela en tabla de nube y elige con calma la respuesta.',
      tablas: 'Tablas del 7, 8 y 9',
      duracion: '8–12 min',
      dificultad: 2,
      acento: '#ffd24a', acento2: '#e8892b',
      cielo: ['#07041f', '#3b2a7a'],
      fases: [{ nombre: 'Noche de farolillos', far: EN + 'backgrounds/themes/montanas_night.png', suelo: ['#3b2f6b', '#120b2e'] }],
      props: [
        { img: EN + 'props/lights/stone_lantern_a.png', x: 10, h: 40, capa: 'medio' },
        { img: EN + 'props/lights/lantern_post_b.png', x: 48, h: 62, capa: 'medio' },
        { img: EN + 'props/lights/stone_lantern_c.png', x: 80, h: 38, capa: 'medio' },
        { img: EN + 'props/lights/hanging_lantern_c.png', x: 30, h: 52, capa: 'cerca', alto: true },
        { img: EN + 'props/lights/hanging_lantern_c.png', x: 70, h: 40, capa: 'cerca', alto: true }
      ],
      heroe: 'corre',
      demo: { tipo: 'carril', ruta: ['#4b3f7c', '#2b2152'], pano: 'assets/nivel3/arte/mundos/pano_aldea.jpg' },
      particulas: 'farolillos',
      progreso: p => {
        const n = (p && p.nivel3) || {};
        const est = n.completado ? 'completado' : (numero(n.intentos) > 0 ? 'en_curso' : 'nuevo');
        return { estado: est, estrellas: numero(n.estrellas), mejor: numero(n.mejor), veces: numero(n.intentos) };
      },
      url: p => 'nivel3.html?' + qs(p)
    },
    {
      id: 'clasico',
      nombre: 'Torneo Clásico',
      nivel: 'CLÁSICO',
      lema: 'Tu partida original por fases y niveles de tablas.',
      tablas: 'Todas las tablas', duracion: 'Libre', dificultad: 1,
      acento: '#ff7a4a', acento2: '#d4472a',
      cielo: ['#2a0c1e', '#c8552b'],
      fases: [{ nombre: 'Torneo', far: EN + 'backgrounds/themes/montanas_lava.png', suelo: ['#7a2f1c', '#2a0e0a'] }],
      props: [],
      heroe: 'corre',
      particulas: 'brasas',
      fueraDeProgreso: true,
      visible: p => !!(p && p.progreso && (p.progreso.nivel > 0 || p.progreso.puntos > 0)),
      progreso: () => ({ estado: 'en_curso', estrellas: 0 })
    },
    {
      id: 'negativo',
      nombre: 'El Mundo Negativo',
      nivel: 'MUNDO 4',
      lema: 'Gira la sala, cambia la gravedad y devuélvele el color al mundo.',
      tablas: 'Repaso de todas las tablas',
      duracion: '10–15 min',
      dificultad: 3,
      acento: '#9fb4d8', acento2: '#5a6f9c',
      cielo: ['#05060f', '#2b3550'],
      fases: [{ nombre: 'Mundo en negativo', far: EN + 'backgrounds/themes/montanas_ice.png', suelo: ['#44608f', '#16223f'] }],
      props: [
        { img: EN + 'props/crystals/crystal_blue_d.png', x: 12, h: 44, capa: 'medio' },
        { img: EN + 'props/crystals/crystal_purple_b.png', x: 70, h: 40, capa: 'medio' }
      ],
      extra: { img: N1 + 'enemigos/guardia_piedra.png', lado: 'der', h: 42, y: 0 },
      heroe: 'corre',
      demo: { tipo: 'lateral' },
      particulas: 'cristales',
      progreso: p => {
        const n = (p && p.nivel4) || {};
        const est = n.completado ? 'completado' : (numero(n.intentos) > 0 || numero(n.salaMax) > 0 ? 'en_curso' : 'nuevo');
        return { estado: est, estrellas: numero(n.estrellas), mejor: numero(n.mejor), veces: numero(n.intentos) };
      },
      url: p => 'nivel4.html?' + qs(p)
    }
  ];

  /** IDs de todas las imágenes que usa el registro (para precargar o verificar que existan). */
  function imagenes() {
    const s = new Set();
    lista.forEach(m => {
      (m.fases || []).forEach(f => s.add(f.far));
      (m.props || []).forEach(p => s.add(p.img));
      (m.fases || []).forEach(f => (f.props || []).forEach(p => s.add(p.img)));
      if (m.flota) s.add(m.flota);
      if (m.extra) (m.extra.frames || [m.extra.img]).forEach(i => i && s.add(i));
    });
    return Array.from(s);
  }
  function obtener(id) { return lista.find(m => m.id === id) || null; }

  /** Candados por progreso: DESACTIVADOS. Todos los mundos de la ruta están siempre abiertos para que
   *  el jugador elija el mundo que más le guste, en el orden que quiera. Se conserva la función (y su forma de
   *  respuesta) para que el selector y las pruebas sigan funcionando; si algún día se quiere volver a bloquear,
   *  basta con recuperar la regla "un mundo se abre al terminar el anterior" aquí.
   *  @returns {Record<string, {bloqueado: boolean, requiere: string|null, requiereNombre: string|null}>} */
  function candados(perfil) {
    /** @type {Record<string, {bloqueado: boolean, requiere: string|null, requiereNombre: string|null}>} */
    const out = {};
    lista.filter(m => !m.fueraDeProgreso && !m.bloqueado).forEach(m => { out[m.id] = { bloqueado: false, requiere: null, requiereNombre: null }; });
    return out;
  }

  return { lista, obtener, imagenes, candados };
});
