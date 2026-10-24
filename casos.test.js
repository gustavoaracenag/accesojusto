// Casos tipo: personas concretas con el resultado que esperamos.
// Si un cambio en las fichas o en las reglas altera uno de estos resultados,
// el test falla y obliga a revisar si el cambio era intencional.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const catalogo = require(path.join(__dirname, "..", "data", "fichas.json"));
const M = require(path.join(__dirname, "..", "js", "motor.js"));
const motor = M.crearMotor(catalogo);

// Respuestas base: una persona adulta sin situaciones especiales. Cada caso cambia lo necesario.
const BASE = {
  quien: "propia", edad: "20a59", disc: "no", rshOK: "si", trabajo: "contrato", cargas: "no",
  vivienda: "propia", estudios: "no", agua: "no", electro: "no",
};

function perfil(cambios) {
  // Deja solo las respuestas a preguntas que la persona realmente vería.
  const r = Object.assign({}, BASE, cambios);
  const visibles = new Set(M.preguntasVisibles(r).map((q) => q.id));
  Object.keys(r).forEach((k) => { if (!visibles.has(k)) delete r[k]; });
  return r;
}

function ids(lista) { return lista.map((b) => b.id); }
function noAplica(res) { return res.noAplica.map((n) => n.nombre); }

function esperar(res, bloque, idsEsperados) {
  idsEsperados.forEach((id) => assert.ok(ids(res[bloque]).includes(id), "se esperaba '" + id + "' en " + bloque + "; hay: " + ids(res[bloque]).join(", ")));
}
function ausente(res, id) {
  ["hoy", "automatico", "universal", "bloqueado", "pasos"].forEach((k) =>
    assert.ok(!ids(res[k]).includes(id), "'" + id + "' no debería aparecer (está en " + k + ")"));
}

test("1. Niña de 8 años con discapacidad, sin credencial ni RSH, la cuida su mamá", () => {
  const res = motor.evaluar(perfil({
    quien: "cuidador", edad: "menor10", disc: "si", credencial: "no", rshOK: "no", trabajo: "noFormal",
    vivienda: "allegado", quiereCasa: "no", estudios: "escolar", promedio: "medio", indigena: "no",
    programaSO: "no", ayudaTecnica: "si", apoyoDiario: "alto",
  }));
  assert.deepEqual(ids(res.pasos), ["rnd", "rsh"], "primero credencial y RSH");
  esperar(res, "bloqueado", ["subsidio18"]);
  esperar(res, "hoy", ["pie", "chilecuida", "ricarteSoto", "tne"]);
  esperar(res, "automatico", ["junaebEscolar"]);
  ausente(res, "ayudastec"); // las ayudas técnicas del programa regular son desde los 10 años
  ausente(res, "pbsi");
});

test("2. Adulto de 45 con discapacidad, credencial y RSH, arrienda", () => {
  const res = motor.evaluar(perfil({
    disc: "si", credencial: "si", trabajo: "noFormal", vivienda: "arriendo", quiereCasa: "no", vivAhorro: "no",
    agua: "si", programaSO: "no", ayudaTecnica: "si", apoyoDiario: "no",
  }));
  assert.deepEqual(ids(res.pasos), []);
  esperar(res, "hoy", ["pbsi", "ayudastec", "formate", "franquiciaDisc", "permisoCirculacion", "arriendoEspecial", "sap", "subsidioElectrico"]);
  assert.ok(noAplica(res).includes("Subsidio de Arriendo DS 52 (regular)"), "el llamado especial reemplaza al DS 52");
  assert.equal(catalogo.fichas.find((f) => f.id === "formate").area, "Discapacidad");
});

test("3. Mismo adulto sin RSH: la PBSI queda bloqueada hasta tener el RSH (cambio v5.0)", () => {
  const res = motor.evaluar(perfil({
    disc: "si", credencial: "si", rshOK: "no", trabajo: "noFormal", programaSO: "no", ayudaTecnica: "no", apoyoDiario: "no",
  }));
  assert.deepEqual(ids(res.pasos), ["rsh"]);
  esperar(res, "bloqueado", ["pbsi"]);
  assert.ok(!ids(res.hoy).includes("pbsi"));
});

test("4. Mujer de 70, vive sola, arrienda, sin PGU, sin RSH y sin pensión", () => {
  const res = motor.evaluar(perfil({
    edad: "65a74", rshOK: "no", trabajo: "noFormal", vivienda: "arriendo", quiereCasa: "no", vivAhorro: "no",
    agua: "si", apoyoDiario: "no", viveSolo: "solo", pgu: "no", bodas: "no",
  }));
  assert.deepEqual(ids(res.pasos), ["rsh"]);
  esperar(res, "bloqueado", ["pgu", "vinculos", "arriendoEspecial", "sap", "subsidioElectrico"]);
  esperar(res, "universal", ["vacacionesTE", "culturaAM", "tarifaAM"]);
  esperar(res, "hoy", ["pacam", "ricarteSoto"]);
  ausente(res, "bonoInvierno");
  assert.ok(noAplica(res).includes("Bono de Invierno"), "sin pensión, el Bono de Invierno va a 'no aplica'");
});

test("5. Hombre de 66 que trabaja con contrato, sin pensión ni PGU: no recibe Bono de Invierno (cambio v5.0)", () => {
  const res = motor.evaluar(perfil({ edad: "65a74", trabajo: "contrato", pgu: "no", apoyoDiario: "no", viveSolo: "familia", bodas: "no" }));
  esperar(res, "hoy", ["pgu"]);
  ausente(res, "bonoInvierno");
  assert.ok(noAplica(res).includes("Bono de Invierno"));
});

test("6. Pensionado de 78 con PGU y 50 años de matrimonio", () => {
  const res = motor.evaluar(perfil({
    edad: "75a81", trabajo: "pensionado", agua: "si", apoyoDiario: "no", viveSolo: "unaPersona", pgu: "si", bodas: "si",
  }));
  esperar(res, "automatico", ["bonoInvierno"]);
  esperar(res, "hoy", ["bodasOro", "vinculos", "sap", "subsidioElectrico", "pacam"]);
  ausente(res, "pgu");
  assert.ok(noAplica(res).includes("Pensión Garantizada Universal"), "ya la recibe");
  const m = motor.estimarMonto(res);
  assert.equal(m.mensual, 0);
  assert.equal(m.unico, 81257 + 231583);
});

test("7. Persona de 65+ que solo recibe la PGU también recibe el Bono de Invierno", () => {
  const res = motor.evaluar(perfil({ edad: "82mas", trabajo: "noFormal", pgu: "si", apoyoDiario: "no", viveSolo: "familia", bodas: "no" }));
  esperar(res, "automatico", ["bonoInvierno"]);
});

test("8. Mujer de 76 sin PGU y con RSH: el valor estimado usa $250.275 (cambio v5.0)", () => {
  const res = motor.evaluar(perfil({ edad: "75a81", trabajo: "noFormal", pgu: "no", apoyoDiario: "no", viveSolo: "familia", bodas: "no" }));
  esperar(res, "hoy", ["pgu"]);
  assert.equal(res.hoy.find((b) => b.id === "pgu").montoAplicado, 250275);
  assert.equal(motor.estimarMonto(res).mensual, 250275);
});

test("9. Persona de 66 sin PGU y con RSH: el valor estimado usa $231.732", () => {
  const res = motor.evaluar(perfil({ edad: "65a74", trabajo: "noFormal", pgu: "no", apoyoDiario: "no", viveSolo: "familia", bodas: "no" }));
  assert.equal(motor.estimarMonto(res).mensual, 231732);
});

test("10. Jefa de hogar sin trabajo formal, con un hijo con discapacidad: SUF al doble (cambio v5.0)", () => {
  const res = motor.evaluar(perfil({ trabajo: "noFormal", cargas: "si", cargaDisc: "si" }));
  esperar(res, "hoy", ["suf", "chilecuida"]);
  esperar(res, "automatico", ["afper"]);
  assert.equal(res.hoy.find((b) => b.id === "suf").montoAplicado, 45202);
  assert.ok(noAplica(res).includes("Asignación Familiar"));
});

test("11. Trabajador con contrato y cargas: Asignación Familiar, no SUF", () => {
  const res = motor.evaluar(perfil({ cargas: "si", cargaDisc: "no" }));
  esperar(res, "hoy", ["asignacionFamiliar"]);
  ausente(res, "suf");
  assert.ok(noAplica(res).includes("Subsidio Único Familiar (SUF)"));
});

test("12. Joven de 18 que entra a la educación superior, con ascendencia indígena y RSH", () => {
  const res = motor.evaluar(perfil({ edad: "18a19", trabajo: "noFormal", estudios: "entra", indigena: "si" }));
  esperar(res, "hoy", ["fuas", "tne", "becaIndigena", "paseCultural"]);
  esperar(res, "automatico", ["baes"]);
});

test("13. Estudiante escolar con promedio 6.0 o más y RSH", () => {
  const res = motor.evaluar(perfil({ edad: "10a17", trabajo: "noFormal", estudios: "escolar", promedio: "alto", indigena: "no" }));
  esperar(res, "hoy", ["becaPresidente", "tne"]);
  esperar(res, "automatico", ["junaebEscolar", "bonoLogroEscolar"]);
});

test("14. Profesional de 30 que quiere un postgrado", () => {
  const res = motor.evaluar(perfil({ estudios: "terminada", seguir: "postgrado" }));
  esperar(res, "hoy", ["postgradoANID", "doctoradoANID"]);
  assert.ok(noAplica(res).includes("Gratuidad y becas de arancel (FUAS)"));
});

test("15. Arrendatario de 40 sin ahorro: el DS 52 es un paso previo", () => {
  const res = motor.evaluar(perfil({ vivienda: "arriendo", quiereCasa: "no", vivAhorro: "no" }));
  esperar(res, "pasos", ["ds52"]);
});

test("16. Familia que quiere comprar con más de 30 UF de ahorro", () => {
  const res = motor.evaluar(perfil({ vivienda: "allegado", quiereCasa: "comprar", vivAhorro: "mas30" }));
  esperar(res, "hoy", ["ds49", "ds1"]);
});

test("17. Hogar con persona electrodependiente y sin RSH: el Subsidio Eléctrico se puede pedir igual", () => {
  const res = motor.evaluar(perfil({ rshOK: "no", electro: "si" }));
  esperar(res, "hoy", ["subsidioElectrico"]);
});

test("18. Persona de 70 con discapacidad: la PBSI no aplica (desde los 65 corresponde la PGU)", () => {
  const res = motor.evaluar(perfil({
    edad: "65a74", disc: "si", credencial: "si", trabajo: "noFormal", programaSO: "no", ayudaTecnica: "no",
    apoyoDiario: "no", viveSolo: "familia", pgu: "no", bodas: "no",
  }));
  ausente(res, "pbsi");
  assert.ok(noAplica(res).includes("Pensión Básica Solidaria de Invalidez"));
});

test("el motor es determinista: mismas respuestas, mismo resultado", () => {
  const r = perfil({ edad: "65a74", trabajo: "pensionado", pgu: "no", apoyoDiario: "leve", viveSolo: "solo", bodas: "no" });
  assert.deepEqual(motor.evaluar(r), motor.evaluar(r));
});
