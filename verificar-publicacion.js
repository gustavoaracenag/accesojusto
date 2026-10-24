// Revisa que el sitio esté listo para publicarse. Uso: npm run verificar
// Termina con error si falta algo, para que no se publique por descuido.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.join(__dirname, "..");
const leer = (p) => fs.readFileSync(path.join(raiz, p), "utf8");
const problemas = [];
const avisos = [];

// 1. Configuración del formulario
const ctx = { window: {} };
vm.runInNewContext(leer("js/config.js"), ctx);
const cfg = ctx.window.AJ_CONFIG;
if (!cfg.FORMULARIO_URL) problemas.push("Falta el link del Google Form (FORMULARIO_URL en js/config.js).");
else if (!/^https:\/\/docs\.google\.com\/forms\/.+\/viewform$/.test(cfg.FORMULARIO_URL)) problemas.push("FORMULARIO_URL debe ser el link de Google Forms que termina en /viewform.");
// Los códigos de las preguntas son opcionales: sin ellos el formulario funciona igual,
// solo que la persona elige el tipo y escribe el beneficio a mano.
if (!/^entry\.\d+$/.test(cfg.FORMULARIO_CAMPO_TIPO)) avisos.push("Sin el código de la pregunta 'Tipo', el formulario abre sin el tipo marcado (funciona igual).");
if (!/^entry\.\d+$/.test(cfg.FORMULARIO_CAMPO_BENEFICIO)) avisos.push("Sin el código de la pregunta 'Beneficio', el nombre del beneficio no llega escrito (funciona igual).");

// 2. Versión coherente en todos lados
const catalogo = JSON.parse(leer("data/fichas.json"));
const pkg = JSON.parse(leer("package.json"));
if (catalogo.meta.version !== cfg.VERSION) problemas.push("La versión del catálogo (" + catalogo.meta.version + ") no coincide con config.js (" + cfg.VERSION + ").");
if (!pkg.version.startsWith(cfg.VERSION)) problemas.push("La versión de package.json (" + pkg.version + ") no coincide con config.js (" + cfg.VERSION + ").");

// 3. Ningún correo personal en el código publicado
["index.html", "js/app.js", "js/config.js", "js/motor.js", "data/fichas.json"].forEach((f) => {
  if (/[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.com/i.test(leer(f))) problemas.push("Hay un correo personal escrito en " + f + ".");
});

// 4. Imagen para compartir: las redes sociales necesitan la dirección completa (aviso, no bloquea:
//    la dirección de Vercel se conoce recién después de la primera publicación)
const indexHtml = leer("index.html");
["img/compartir.png", "img/favicon-32.png", "img/apple-touch-icon.png"].forEach((f) => {
  if (!fs.existsSync(path.join(raiz, f))) problemas.push("Falta el archivo " + f + ".");
});
const ogImage = (indexHtml.match(/property="og:image" content="([^"]+)"/) || [])[1] || "";
if (!/^https:\/\//.test(ogImage)) avisos.push("La imagen para compartir usa una ruta relativa (" + ogImage + "). Cuando tengas la dirección de la web, cámbiala en index.html por la URL completa (og:image y og:url), o LinkedIn y WhatsApp no mostrarán la imagen.");

// 5. Estado de revisión del catálogo (aviso, no bloquea)
const sinRevisar = catalogo.fichas.filter((f) => !f.fuente.verificada).map((f) => f.id);
if (sinRevisar.length) avisos.push(sinRevisar.length + " fichas sin revisar contra la fuente oficial (se muestran como 'pendiente de revisión'): " + sinRevisar.join(", "));
const conValidacion = catalogo.fichas.filter((f) => f.validacion_experta).length;
avisos.push(conValidacion + " de " + catalogo.fichas.length + " fichas con validación experta.");

avisos.forEach((a) => console.log("Aviso: " + a));
if (problemas.length) {
  console.error("\nNo está listo para publicar:");
  problemas.forEach((p) => console.error(" ✕ " + p));
  process.exit(1);
}
console.log("\n✓ Listo para publicar la versión " + cfg.VERSION + ".");
