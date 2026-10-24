// Formato y coherencia del catálogo de fichas (data/fichas.json).
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const catalogo = require(path.join(__dirname, "..", "data", "fichas.json"));
const M = require(path.join(__dirname, "..", "js", "motor.js"));
const { perfilesAlAzar } = require("./ayuda.js");

const fichas = catalogo.fichas;

test("el catálogo tiene metadatos de versión y fecha", () => {
  assert.match(catalogo.meta.version, /^\d+\.\d+$/);
  assert.match(catalogo.meta.actualizado, /^\d{4}-\d{2}-\d{2}$/);
});

test("los ids de las fichas son únicos y sin espacios", () => {
  const ids = fichas.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "hay ids repetidos");
  ids.forEach((id) => assert.match(id, /^[A-Za-z0-9]+$/, "id inválido: " + id));
});

test("cada ficha tiene todos los campos obligatorios", () => {
  fichas.forEach((f) => {
    const donde = "ficha " + f.id;
    ["nombre", "area", "desc", "docs"].forEach((k) => {
      assert.equal(typeof f[k], "string", donde + ": falta " + k);
      assert.ok(f[k].trim().length > 0, donde + ": " + k + " vacío");
    });
    assert.ok(Array.isArray(f.ruta) && f.ruta.length > 0, donde + ": ruta vacía");
    f.ruta.forEach((p) => assert.ok(typeof p === "string" && p.trim().length > 0, donde + ": paso vacío"));
    assert.equal(typeof f.fuente.texto, "string", donde + ": falta fuente.texto");
    assert.ok(f.fuente.verificada === null || /^\d{4}-\d{2}$/.test(f.fuente.verificada), donde + ": fuente.verificada debe ser AAAA-MM o null");
    assert.ok(f.convocatoria === null || typeof f.convocatoria === "string", donde + ": convocatoria debe ser texto o null");
    assert.equal(typeof f.validacion_experta, "boolean", donde + ": falta validacion_experta");
    assert.ok(Array.isArray(f.observaciones), donde + ": observaciones debe ser lista");
  });
});

test("cada ficha pertenece a un área definida", () => {
  fichas.forEach((f) => assert.ok(catalogo.areas[f.area], "ficha " + f.id + ": área desconocida '" + f.area + "'"));
});

test("cada área tiene al menos una ficha", () => {
  Object.keys(catalogo.areas).forEach((a) => assert.ok(fichas.some((f) => f.area === a), "área sin fichas: " + a));
});

test("los links son https y los sitios .gob.cl usan www.", () => {
  fichas.forEach((f) => {
    const url = f.tramite.url;
    assert.match(url, /^https:\/\//, "ficha " + f.id + ": el link debe ser https");
    assert.ok(f.tramite.texto && f.tramite.texto.length > 0, "ficha " + f.id + ": falta texto del botón");
    const host = new URL(url).hostname;
    if (host.endsWith(".gob.cl")) assert.match(host, /^www\./, "ficha " + f.id + ": los sitios del Estado requieren www. (" + host + ")");
  });
});

test("el link de Doctorado ANID ya no apunta a la página de Magíster", () => {
  const f = fichas.find((x) => x.id === "doctoradoANID");
  assert.doesNotMatch(f.tramite.url, /magister/i);
});

function formatoCLP(n) { return "$" + n.toLocaleString("es-CL"); }

test("los montos tienen formato válido y coinciden con lo escrito en la descripción", () => {
  fichas.filter((f) => f.monto).forEach((f) => {
    assert.ok(["mensual", "unico"].includes(f.monto.tipo), "ficha " + f.id + ": tipo de monto inválido");
    assert.ok(Number.isInteger(f.monto.valor) && f.monto.valor > 0, "ficha " + f.id + ": valor inválido");
    // Si alguien actualiza el número pero no el texto (o al revés), este test falla.
    assert.ok(f.desc.includes(formatoCLP(f.monto.valor)), "ficha " + f.id + ": la descripción no menciona " + formatoCLP(f.monto.valor));
    (f.monto.variantes || []).forEach((v) => {
      assert.ok(M.CONDICIONES_MONTO[v.condicion], "ficha " + f.id + ": condición desconocida " + v.condicion);
      assert.ok(f.desc.includes(formatoCLP(v.valor)), "ficha " + f.id + ": la descripción no menciona " + formatoCLP(v.valor));
    });
  });
});

test("todas las fichas del catálogo aparecen en algún resultado, y el motor no usa fichas inexistentes", () => {
  const motor = M.crearMotor(catalogo);
  const vistas = new Set();
  perfilesAlAzar(20000, 7).forEach((r) => {
    const res = motor.evaluar(r); // lanza error si una regla usa una ficha que no existe
    ["hoy", "automatico", "universal", "bloqueado", "pasos"].forEach((k) => res[k].forEach((b) => vistas.add(b.id)));
  });
  const nunca = fichas.map((f) => f.id).filter((id) => !vistas.has(id));
  assert.deepEqual(nunca, [], "fichas que ningún perfil puede ver: " + nunca.join(", "));
});
