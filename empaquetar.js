// Genera una versión de AccesoJusto en un solo archivo HTML (dist/AccesoJusto_vX.html).
// Sirve para abrirla con doble clic, revisarla sin servidor o compartirla sin internet.
// Uso: npm run empaquetar
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const leer = (p) => fs.readFileSync(path.join(raiz, p), "utf8");

const catalogo = JSON.parse(leer("data/fichas.json"));
const version = catalogo.meta.version;
let html = leer("index.html");

// Evita que un "</script>" dentro de un texto cierre el bloque antes de tiempo.
const seguro = (s) => s.replace(/<\/script/gi, "<\\/script");

html = html.replace('<link rel="stylesheet" href="css/estilos.css">', "<style>\n" + leer("css/estilos.css") + "</style>");
html = html.replace('<script src="js/config.js"></script>',
  "<script>\n" + seguro(leer("js/config.js")) + "\nwindow.AJ_CATALOGO = " + seguro(JSON.stringify(catalogo)) + ";\n</script>");
html = html.replace('<script src="js/motor.js"></script>', "<script>\n" + seguro(leer("js/motor.js")) + "</script>");
html = html.replace('<script src="js/app.js"></script>', "<script>\n" + seguro(leer("js/app.js")) + "</script>");

// Íconos incrustados, para que la versión de un solo archivo los muestre sin la carpeta img/
["favicon-32.png", "apple-touch-icon.png"].forEach((f) => {
  const datos = fs.readFileSync(path.join(raiz, "img", f)).toString("base64");
  html = html.replace('href="img/' + f + '"', 'href="data:image/png;base64,' + datos + '"');
});

if (/src="js\/|href="css\/|href="img\//.test(html)) { console.error("Quedó un archivo sin incrustar."); process.exit(1); }

const destino = path.join(raiz, "dist", "AccesoJusto_v" + version + ".html");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, html);
console.log("Listo:", path.relative(raiz, destino), "(" + Math.round(html.length / 1024) + " KB)");
