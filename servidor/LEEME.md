# Servidor de cuentas (Google Apps Script)

`Code.gs` es el servidor que guarda las cuentas, el progreso, las clases y los rankings en una **hoja de Google**.
Aquí está solo como **respaldo y para llevar el historial de cambios**: el que realmente funciona es el que pegaste en tu hoja
(**Extensiones → Apps Script**). Si lo cambias aquí, pega el archivo completo allá y publica una versión nueva
(**Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar**; la URL `/exec` no cambia).

## Instalación desde cero
1. Crea una hoja de Google y abre **Extensiones → Apps Script**.
2. Pega todo `Code.gs` y guarda.
3. **Implementar → Nueva implementación → Aplicación web**: ejecutar como **Yo**, acceso **Cualquier persona**. Copia la URL que termina en `/exec`.
4. Pon esa URL en `engine/nube.js` (constante `API_URL`).
5. Recarga la hoja (F5): aparecen los menús **🥷 Ninja Admin** y **❓ Ayuda**. Ahí tienes todo: clases, reportes, registro de eventos, claves visibles, formato de autorización…
6. Configura **Ninja Admin → Seguridad y legal → Datos del responsable** (nombre y contacto): salen en el aviso de privacidad del juego.

## Qué vigilan las pruebas
`npm test` ejecuta `tests/servidor.test.js`, que prueba este archivo con una simulación de Google Sheets: el cifrado de claves (debe dar
**exactamente** el mismo resultado de siempre, o las cuentas existentes dejarían de entrar), cuántas veces bloquea y toca la hoja cada
acción, el registro de eventos, las claves visibles, el consentimiento, las clases, el ranking y los reportes.
`tests/legal.test.js` comprueba que el aviso de privacidad del juego diga lo mismo que hace el servidor y que la versión del aviso
(`engine/legal.js` ↔ `VERSION_LEGAL` en `Code.gs`) coincida.

## Legal
El aviso de privacidad, los términos y los créditos están en `engine/legal.js`. Son una **plantilla**: revísala con tu colegio o con un abogado
y completa los créditos de terceros (arte, música, sonidos) antes de publicar.
