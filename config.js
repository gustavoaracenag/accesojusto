// ============================================================
// AccesoJusto · Configuración (lo único que se edita a mano antes de publicar)
// ============================================================
window.AJ_CONFIG = {
  VERSION: "5.2",
  FECHA_TEXTO: "23 de octubre de 2026",

  // ---------- Formulario de contacto (Google Forms) ----------
  // 1. Pega aquí el link del formulario que termina en /viewform
  //    Ejemplo: "https://docs.google.com/forms/d/e/1FAIpQL.../viewform"
  FORMULARIO_URL: "https://docs.google.com/forms/d/e/1FAIpQLScJUe2IVo91c37rGZdlGzdtzJ8FRSumqvGKGQM7WbQEBapyFg/viewform",

  // 2. Códigos de dos preguntas del formulario, para que lleguen ya completas.
  //    Se obtienen en Google Forms → menú ⋮ → "Obtener vínculo previamente rellenado":
  //    completa las dos preguntas, copia el link y busca las partes "entry.NÚMERO".
  FORMULARIO_CAMPO_TIPO: "",        // Ejemplo: "entry.1234567890"  (pregunta "Tipo")
  FORMULARIO_CAMPO_BENEFICIO: "",   // Ejemplo: "entry.9876543210"  (pregunta "Beneficio")

  // 3. Estos textos deben ser idénticos a las opciones de la pregunta "Tipo" del formulario.
  TIPOS_FORMULARIO: {
    error: "Reportar un error",
    comentario: "Comentario o sugerencia",
    fundacion: "Soy de una fundación u organización",
  },
};
