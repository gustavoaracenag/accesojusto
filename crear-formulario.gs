/**
 * AccesoJusto · Crea el formulario de contacto en Google Forms
 * ------------------------------------------------------------
 * Cómo usarlo (una sola vez):
 * 1. Entra a https://script.google.com con tu cuenta de Google → "Nuevo proyecto".
 * 2. Borra lo que aparece, pega TODO este archivo y guarda (ícono de disquete).
 * 3. Arriba, elige la función "crearFormularioAccesoJusto" y presiona "Ejecutar".
 * 4. Google pedirá permisos: "Revisar permisos" → tu cuenta → "Configuración avanzada"
 *    → "Ir a ... (no seguro)" → "Permitir". Es normal en scripts propios.
 * 5. Abajo, en "Registro de ejecución", aparecen las 3 líneas para js/config.js.
 *
 * Crea: el formulario, una planilla de respuestas y lo deja publicado.
 */
function crearFormularioAccesoJusto() {
  // Estos textos deben ser idénticos a TIPOS_FORMULARIO en js/config.js
  var TIPOS = ["Reportar un error", "Comentario o sugerencia", "Soy de una fundación u organización"];

  var form = FormApp.create("AccesoJusto · Contacto");
  form.setDescription(
    "Gracias por ayudarnos a mejorar AccesoJusto.\n" +
    "Cuéntanos si encontraste un dato que no coincide con lo que dice la institución, " +
    "si tienes una idea o si eres de una fundación u organización que quiere sumarse.\n" +
    "No necesitas dejar tus datos personales."
  );
  form.setCollectEmail(false);          // no pide correo automáticamente
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(true);
  form.setProgressBar(false);
  form.setConfirmationMessage("¡Gracias! Lo revisaremos con cuidado. Si dejaste tu correo, te responderemos.");

  // 1. Tipo
  var tipo = form.addMultipleChoiceItem()
    .setTitle("Tipo")
    .setChoiceValues(TIPOS)
    .setRequired(true);

  // 2. Beneficio (la web lo completa sola cuando vienes desde una ficha)
  var beneficio = form.addTextItem()
    .setTitle("Beneficio")
    .setHelpText("Si vienes desde una ficha, ya aparece escrito. Si no, déjalo en blanco.")
    .setRequired(false);

  // 3. Mensaje
  form.addParagraphTextItem()
    .setTitle("¿Qué dato está mal o qué nos quieres contar?")
    .setHelpText("Si es un error, cuéntanos qué dice la página y qué debería decir.")
    .setRequired(true);

  // 4. Fuente del dato correcto
  form.addTextItem()
    .setTitle("¿Dónde viste el dato correcto?")
    .setHelpText("Opcional. Por ejemplo: un link de ChileAtiende, o lo que te dijeron en la municipalidad.")
    .setRequired(false);

  // 5. Correo opcional
  form.addTextItem()
    .setTitle("Correo, solo si quieres respuesta")
    .setHelpText("Opcional. Solo lo usamos para responderte.")
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build())
    .setRequired(false);

  // Planilla donde llegan las respuestas
  var planilla = SpreadsheetApp.create("AccesoJusto · Respuestas del formulario");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilla.getId());

  // Publicar (los formularios creados por código desde julio de 2026 nacen sin publicar)
  if (typeof form.setPublished === "function") form.setPublished(true);
  form.setAcceptingResponses(true);

  // Códigos entry.NÚMERO de las preguntas Tipo y Beneficio, sacados de un link prellenado
  var prellenado = form.createResponse()
    .withItemResponse(tipo.createResponse(TIPOS[0]))
    .withItemResponse(beneficio.createResponse("prueba"))
    .toPrefilledUrl();
  var entradas = prellenado.match(/entry\.\d+/g) || [];
  var urlFormulario = form.getPublishedUrl().split("?")[0];

  Logger.log("✓ Formulario creado y publicado.");
  Logger.log("Editar el formulario: " + form.getEditUrl());
  Logger.log("Ver las respuestas: " + planilla.getUrl());
  Logger.log("");
  Logger.log("Copia estas 3 líneas en js/config.js (reemplazan las que están vacías):");
  Logger.log('  FORMULARIO_URL: "' + urlFormulario + '",');
  Logger.log('  FORMULARIO_CAMPO_TIPO: "' + (entradas[0] || "NO ENCONTRADO") + '",');
  Logger.log('  FORMULARIO_CAMPO_BENEFICIO: "' + (entradas[1] || "NO ENCONTRADO") + '",');
  Logger.log("");
  Logger.log("Último paso: abre el formulario, presiona 'Publicar' y revisa que diga que");
  Logger.log("cualquier persona con el link puede responder. Prueba el link en una ventana de incógnito.");
}
