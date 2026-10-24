// Utilidades compartidas por los tests.
const path = require("path");
const M = require(path.join(__dirname, "..", "js", "motor.js"));

// Genera perfiles como lo haría una persona: responde solo las preguntas visibles, en orden.
// Semilla fija para que los tests den siempre el mismo resultado.
function perfilesAlAzar(cantidad, semilla) {
  let s = semilla || 1;
  function azar() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
  const perfiles = [];
  for (let i = 0; i < cantidad; i++) {
    const r = {};
    for (let paso = 0; paso < 40; paso++) {
      const q = M.preguntasVisibles(r).find((x) => !(x.id in r));
      if (!q) break;
      const op = q.opciones[Math.floor(azar() * q.opciones.length)].v;
      r[q.id] = M.normalizarRespuesta(q.id, op);
    }
    perfiles.push(r);
  }
  return perfiles;
}

module.exports = { perfilesAlAzar };
