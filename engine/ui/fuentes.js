/* Pide las fuentes del juego al arrancar para que el texto dibujado en <canvas> (HUD, preguntas, carteles)
   no salga primero con una letra genérica. Es inocuo si el navegador no soporta document.fonts. */
(function () {
  if (!document.fonts || !document.fonts.load) return;
  ['16px "Lilita One"', '16px "NJ Display"', '400 16px Inter', '700 16px Inter', '800 16px Inter']
    .forEach(function (f) { try { document.fonts.load(f, 'ÁÉÍÓÚÑ¿¡×÷0123456789'); } catch (e) {} });
})();
