// Cuestionario: rango de preguntas y ramificación.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const M = require(path.join(__dirname, "..", "js", "motor.js"));
const { perfilesAlAzar } = require("./ayuda.js");

test("rango de preguntas: entre 10 y 22 según la situación", () => {
  // Si cambian las preguntas, este número cambia y la portada lo toma solo.
  // Este test obliga a revisar conscientemente el cambio.
  assert.deepEqual(M.rangoPreguntas(), { min: 10, max: 22 });
});

test("solo las respuestas declaradas en RAMIFICAN abren o cierran preguntas", () => {
  perfilesAlAzar(5000, 11).forEach((r) => {
    const soloRamas = {};
    M.RAMIFICAN.forEach((k) => { if (k in r) soloRamas[k] = r[k]; });
    const completo = M.preguntasVisibles(r).map((q) => q.id).join(",");
    const reducido = M.preguntasVisibles(soloRamas).map((q) => q.id).join(",");
    assert.equal(completo, reducido, "una respuesta fuera de RAMIFICAN cambió las preguntas visibles: " + JSON.stringify(r));
  });
});

test("cada perfil responde una cantidad de preguntas dentro del rango", () => {
  const { min, max } = M.rangoPreguntas();
  perfilesAlAzar(5000, 13).forEach((r) => {
    const n = Object.keys(r).length;
    assert.ok(n >= min && n <= max, "perfil con " + n + " preguntas");
  });
});

test("'No sé' se trata como 'no', salvo en ascendencia indígena", () => {
  assert.equal(M.normalizarRespuesta("rshOK", "nose"), "no");
  assert.equal(M.normalizarRespuesta("pgu", "nose"), "no");
  assert.equal(M.normalizarRespuesta("indigena", "nose"), "nose");
  assert.equal(M.normalizarRespuesta("rshOK", "si"), "si");
});

test("cada aclaración corresponde a una pregunta con opción 'No sé'", () => {
  Object.keys(M.ACLARACIONES).forEach((clave) => {
    const [id, op] = clave.split("_");
    const q = M.PREGUNTAS.find((x) => x.id === id);
    assert.ok(q, "aclaración para pregunta inexistente: " + id);
    assert.ok(q.opciones.some((o) => o.v === op), "la pregunta " + id + " no tiene la opción " + op);
  });
});
