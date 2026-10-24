// Glosario de siglas: definiciones presentes y detección correcta en los textos.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const catalogo = require(path.join(__dirname, "..", "data", "fichas.json"));
const M = require(path.join(__dirname, "..", "js", "motor.js"));
const G = catalogo.glosario;

test("cada sigla del glosario tiene una definición en lenguaje simple", () => {
  Object.entries(G).forEach(([sigla, def]) => {
    assert.match(sigla, /^[A-ZÁÉÍÓÚÑ]{2,8}$/, "sigla inválida: " + sigla);
    assert.ok(def.length > 10 && def.length <= 200, sigla + ": la definición debe ser corta y existir");
  });
});

test("detecta siglas como palabras completas, sin confundirlas dentro de otras palabras", () => {
  assert.deepEqual(M.siglasEn("Postula al CAE en marzo", G), ["CAE"]);
  assert.deepEqual(M.siglasEn("Si te CAES o al CAER", G), []);
  assert.deepEqual(M.siglasEn("ahorro de 4 UF.", G), ["UF"]);
  assert.deepEqual(M.siglasEn("RSH al día y credencial RND", G).sort(), ["RND", "RSH"]);
});

test("la pregunta de la credencial explica RND y COMPIN", () => {
  const q = M.PREGUNTAS.find((x) => x.id === "credencial");
  const s = M.siglasEn(q.texto + " " + q.ayuda, G);
  assert.ok(s.includes("RND") && s.includes("COMPIN"), "se encontró: " + s.join(", "));
});

test("las siglas más usadas en las fichas tienen definición", () => {
  // Busca palabras en mayúscula de 3 a 6 letras que se repiten en 3 o más fichas.
  const conteo = {};
  catalogo.fichas.forEach((f) => {
    const texto = [f.desc, f.docs, f.convocatoria || ""].concat(f.ruta).join(" ");
    new Set(texto.match(/\b[A-Z]{3,6}\b/g) || []).forEach((s) => { conteo[s] = (conteo[s] || 0) + 1; });
  });
  const frecuentes = Object.keys(conteo).filter((s) => conteo[s] >= 3);
  const sinDefinir = frecuentes.filter((s) => !G[s]);
  assert.deepEqual(sinDefinir, [], "siglas frecuentes sin definición: " + sinDefinir.join(", "));
});
