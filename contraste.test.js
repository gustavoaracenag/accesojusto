// Accesibilidad: los colores de TEXTO deben tener contraste ≥ 4,5:1 (WCAG AA)
// sobre los fondos donde aparecen, en modo claro y en modo oscuro.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const catalogo = require(path.join(__dirname, "..", "data", "fichas.json"));
const css = fs.readFileSync(path.join(__dirname, "..", "css", "estilos.css"), "utf8");

function luminancia(hex) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const la = luminancia(a), lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Lee las variables de un bloque del CSS (:root claro, o el primer bloque oscuro)
function variables(bloque) {
  const v = {};
  bloque.replace(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g, (_, k, val) => { v[k] = val; });
  return v;
}
const claro = variables(css.slice(css.indexOf(":root{"), css.indexOf("}", css.indexOf(":root{"))));
const iOscuro = css.indexOf(':root[data-theme="dark"]{');
const oscuro = Object.assign({}, claro, variables(css.slice(iOscuro, css.indexOf("}", iOscuro))));

const MINIMO = 4.5;
const TEXTOS = ["texto", "texto2", "gris", "coral-texto", "ambar-texto", "verde-texto", "morado-texto", "azul-texto"];
const FONDOS = ["fondo", "papel", "crema-profunda"];

for (const [modo, v] of [["claro", claro], ["oscuro", oscuro]]) {
  test("colores de texto con contraste suficiente en modo " + modo, () => {
    TEXTOS.forEach((t) => FONDOS.forEach((f) => {
      const r = contraste(v[t], v[f]);
      assert.ok(r >= MINIMO, "--" + t + " (" + v[t] + ") sobre --" + f + " (" + v[f] + ") en modo " + modo + ": " + r.toFixed(2));
    }));
  });
}

test("el botón principal tiene texto blanco legible", () => {
  assert.ok(contraste("#FFFFFF", claro.boton) >= MINIMO, "blanco sobre " + claro.boton);
  assert.ok(contraste("#FFFFFF", claro["boton-hover"]) >= MINIMO, "blanco sobre " + claro["boton-hover"]);
});

test("los colores de cada área se leen sobre las tarjetas, en claro y en oscuro", () => {
  Object.entries(catalogo.areas).forEach(([nombre, a]) => {
    ["papel", "fondo"].forEach((f) => {
      assert.ok(contraste(a.color, claro[f]) >= MINIMO, nombre + " claro sobre " + f + ": " + contraste(a.color, claro[f]).toFixed(2));
      assert.ok(contraste(a.color_oscuro, oscuro[f]) >= MINIMO, nombre + " oscuro sobre " + f + ": " + contraste(a.color_oscuro, oscuro[f]).toFixed(2));
    });
  });
});
