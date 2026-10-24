// ============================================================
// AccesoJusto · Motor de elegibilidad (v5.0 · 23-10-2026)
// Determinista: mismas respuestas, mismo resultado. Sin IA, sin red.
// Funciona en el navegador (window.AJMotor) y en Node (require) para los tests.
// El contenido de cada beneficio vive en data/fichas.json; aquí solo
// están las preguntas y las reglas que deciden en qué bloque cae cada uno.
// ============================================================
(function (raiz) {
  "use strict";

  // ---------- Grupos de edad ----------
  const EDADES_MAYOR = ["60a64", "65a74", "75a81", "82mas"];
  const EDADES_65 = ["65a74", "75a81", "82mas"];
  const EDADES_75 = ["75a81", "82mas"];

  function mayor(r) { return EDADES_MAYOR.indexOf(r.edad) >= 0; }
  function de65(r) { return EDADES_65.indexOf(r.edad) >= 0; }
  function tieneDisc(r) { return r.disc === "si"; }

  // ---------- Cuestionario único adaptativo ----------
  // Una pregunta con `si` solo se muestra cuando esa función devuelve true.
  const PREGUNTAS = [
    { id: "quien", texto: "¿La consulta es para ti o para alguien que cuidas?",
      opciones: [{ v: "propia", t: "Para mí" }, { v: "cuidador", t: "Para alguien que cuido" }] },

    { id: "edad", texto: "¿Qué edad tiene la persona?",
      opciones: [{ v: "menor10", t: "Menos de 10" }, { v: "10a17", t: "10 a 17" }, { v: "18a19", t: "18 o 19" },
                 { v: "20a59", t: "20 a 59" }, { v: "60a64", t: "60 a 64" }, { v: "65a74", t: "65 a 74" },
                 { v: "75a81", t: "75 a 81" }, { v: "82mas", t: "82 o más" }] },

    { id: "disc", texto: "¿Tiene alguna discapacidad o condición de salud permanente?",
      ayuda: "Física, sensorial, mental o intelectual. También cuenta si está en proceso de diagnóstico.",
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },

    { id: "credencial", texto: "¿Tiene credencial de discapacidad?",
      ayuda: "Es la del Registro Nacional de la Discapacidad (RND), que se obtiene después de la evaluación en COMPIN.",
      si: tieneDisc,
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "rshOK", texto: "¿Su hogar tiene el Registro Social de Hogares al día?",
      ayuda: "Está al día si no ha cambiado la dirección, los integrantes ni los ingresos desde la última actualización.",
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "trabajo", texto: "¿Cómo se sostiene económicamente hoy?",
      ayuda: "Esto decide, por ejemplo, si corresponde el Subsidio Familiar o la Asignación Familiar: no se pueden tener los dos.",
      opciones: [{ v: "contrato", t: "Trabajo con contrato" }, { v: "honorarios", t: "A honorarios o por mi cuenta" },
                 { v: "pensionado", t: "Pensión o jubilación" }, { v: "noFormal", t: "Sin trabajo formal" }] },

    { id: "cargas", texto: "¿Hay hijos u otras personas a su cargo?",
      ayuda: "Cuentan hijos, cónyuge o conviviente, y otras personas que viven a sus expensas.",
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },

    { id: "cargaDisc", texto: "¿Alguna de esas personas tiene alguna discapacidad?",
      si: function (r) { return r.cargas === "si"; },
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },

    { id: "vivienda", texto: "¿Dónde vive hoy?",
      opciones: [{ v: "arriendo", t: "En una vivienda arrendada" }, { v: "propia", t: "En vivienda propia" },
                 { v: "allegado", t: "En casa de familiares o allegado" }] },

    { id: "quiereCasa", texto: "¿Quiere comprar o construir una vivienda?",
      si: function (r) { return r.vivienda !== "propia"; },
      opciones: [{ v: "comprar", t: "Sí, comprar" }, { v: "construir", t: "Sí, construir en un terreno" }, { v: "no", t: "No por ahora" }] },

    { id: "vivAhorro", texto: "¿Tiene cuenta de ahorro para la vivienda?",
      ayuda: "Es una cuenta especial en BancoEstado u otra institución. Casi todos los subsidios de vivienda la exigen.",
      si: function (r) { return r.vivienda === "arriendo" || (r.quiereCasa && r.quiereCasa !== "no"); },
      opciones: [{ v: "no", t: "No tengo" }, { v: "menos4", t: "Sí, con menos de 4 UF" },
                 { v: "entre", t: "Sí, entre 4 y 30 UF" }, { v: "mas30", t: "Sí, más de 30 UF" }] },

    { id: "estudios", texto: "¿Alguien del grupo familiar estudia o quiere estudiar?",
      opciones: [{ v: "escolar", t: "Sí, en básica o media" }, { v: "entra", t: "Sí, va a entrar a educación superior" },
                 { v: "cursando", t: "Sí, cursando educación superior" }, { v: "terminada", t: "Ya terminó una carrera" },
                 { v: "no", t: "No" }] },

    { id: "seguir", texto: "¿Quiere seguir estudiando?",
      ayuda: "La gratuidad ya no aplica después de un título, pero sí existen becas de postgrado y crédito para una segunda carrera.",
      si: function (r) { return r.estudios === "terminada"; },
      opciones: [{ v: "postgrado", t: "Sí, un magíster o doctorado" }, { v: "otraCarrera", t: "Sí, otra carrera de pregrado" }, { v: "no", t: "No por ahora" }] },

    { id: "promedio", texto: "¿Cómo es su promedio de notas?",
      si: function (r) { return r.estudios === "escolar"; },
      opciones: [{ v: "alto", t: "6.0 o más" }, { v: "medio", t: "Entre 5.0 y 5.9" }, { v: "bajo", t: "Menos de 5.0" }] },

    { id: "indigena", texto: "¿Tiene ascendencia indígena?",
      ayuda: "Acreditada o acreditable en CONADI. Con apellido indígena el certificado es directo.",
      si: function (r) { return !!r.estudios && r.estudios !== "no" && r.estudios !== "terminada"; },
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "agua", texto: "¿La cuenta del agua está a su nombre, o puede acreditar que la paga?",
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },

    { id: "electro", texto: "¿Vive en la casa alguna persona electrodependiente?",
      ayuda: "Es quien necesita electricidad para un equipo médico: ventilador, concentrador de oxígeno, bomba de alimentación u otro.",
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "programaSO", texto: "¿Participa en Chile Seguridades y Oportunidades?",
      ayuda: "Son los programas Familias, Vínculos o Calle. Si tiene un gestor o gestora asignada, participa.",
      si: tieneDisc,
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "ayudaTecnica", texto: "¿Necesita algún elemento de apoyo?",
      ayuda: "Silla de ruedas, audífono, catre clínico, bastón, notebook con software de accesibilidad, entre otros.",
      si: tieneDisc,
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },

    { id: "apoyoDiario", texto: "¿Necesita apoyo en las actividades del día a día?",
      ayuda: "Vestirse, cocinar, moverse dentro de la casa, recordar los medicamentos.",
      si: function (r) { return mayor(r) || tieneDisc(r); },
      opciones: [{ v: "leve", t: "Sí, algo de apoyo" }, { v: "alto", t: "Sí, bastante apoyo" }, { v: "no", t: "No" }] },

    { id: "viveSolo", texto: "¿Con quién vive?",
      si: mayor,
      opciones: [{ v: "solo", t: "Sola o solo" }, { v: "unaPersona", t: "Solo con otra persona" }, { v: "familia", t: "Con su familia o más personas" }] },

    { id: "pgu", texto: "¿Recibe actualmente la Pensión Garantizada Universal?",
      ayuda: "La PGU es el pago mensual del IPS para mayores de 65 años. Llega aunque también reciba pensión de AFP.",
      si: de65,
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }, { v: "nose", t: "No sé" }] },

    { id: "bodas", texto: "¿Cumple o cumplió 50 años de matrimonio este año?",
      ayuda: "Si fue hace menos de un año, todavía alcanza a pedir el bono.",
      si: mayor,
      opciones: [{ v: "si", t: "Sí" }, { v: "no", t: "No" }] },
  ];

  // Las únicas respuestas que abren o cierran otras preguntas.
  // tests/preguntas.test.js comprueba que ninguna otra respuesta cambia lo que se muestra.
  const RAMIFICAN = ["edad", "disc", "cargas", "vivienda", "quiereCasa", "estudios"];

  const ACLARACIONES = {
    credencial_nose: "Lo revisas con el RUN y la ClaveÚnica en Mi ChileAtiende. Mientras tanto asumimos que no la tiene, así te mostramos la ruta completa.",
    rshOK_nose: "Se revisa con RUN y ClaveÚnica en registrosocial.gob.cl. Mientras tanto asumimos que falta actualizarlo, para mostrarte todos los pasos.",
    programaSO_nose: "Lo confirmas en tu municipalidad. Asumimos que no participa; si resulta que sí, se abren más beneficios.",
    pgu_nose: "Se consulta en ChileAtiende con el RUN y la fecha de nacimiento. Asumimos que no la recibe, para mostrarte cómo solicitarla.",
    indigena_nose: "El certificado se pide en CONADI. Incluimos la beca en el resultado para que veas la ruta completa.",
    electro_nose: "La persona debe estar inscrita en el Registro de Pacientes Electrodependientes. Si crees que podría corresponder, pregunta en tu consultorio: abre el Subsidio Eléctrico sin importar el tramo.",
  };

  // "No sé" se trata como "no", salvo en ascendencia indígena, donde se muestra la ruta igual.
  function normalizarRespuesta(preguntaId, valor) {
    if (valor !== "nose") return valor;
    return preguntaId === "indigena" ? "nose" : "no";
  }

  function preguntasVisibles(r) {
    return PREGUNTAS.filter(function (q) { return !q.si || q.si(r); });
  }

  // Mínimo y máximo de preguntas que puede responder una persona.
  function rangoPreguntas() {
    const opcionesDe = {};
    PREGUNTAS.forEach(function (q) { opcionesDe[q.id] = q.opciones.map(function (o) { return o.v; }); });
    let min = Infinity, max = 0;
    (function recorrer(i, r) {
      if (i === RAMIFICAN.length) {
        const n = preguntasVisibles(r).length;
        if (n < min) min = n;
        if (n > max) max = n;
        return;
      }
      opcionesDe[RAMIFICAN[i]].forEach(function (v) {
        const r2 = Object.assign({}, r); r2[RAMIFICAN[i]] = v;
        recorrer(i + 1, r2);
      });
    })(0, {});
    return { min: min, max: max };
  }

  // Condiciones con nombre que puede usar un monto variable en fichas.json.
  const CONDICIONES_MONTO = {
    edad75mas: function (r) { return EDADES_75.indexOf(r.edad) >= 0; },
    cargaDisc: function (r) { return r.cargaDisc === "si"; },
  };

  function montoAplicado(ficha, r) {
    if (!ficha.monto) return 0;
    let valor = ficha.monto.valor;
    (ficha.monto.variantes || []).forEach(function (v) {
      const cond = CONDICIONES_MONTO[v.condicion];
      if (!cond) throw new Error("Condición de monto desconocida: " + v.condicion + " (ficha " + ficha.id + ")");
      if (cond(r)) valor = v.valor;
    });
    return valor;
  }

  // ============================================================
  // crearMotor(catalogo): catalogo = contenido de data/fichas.json
  // ============================================================
  function crearMotor(catalogo) {
    const porId = {};
    catalogo.fichas.forEach(function (f) { porId[f.id] = f; });

    function byId(id) {
      if (!porId[id]) throw new Error("La regla usa una ficha que no existe en el catálogo: " + id);
      return Object.assign({}, porId[id]);
    }

    function evaluar(r) {
      const hoy = [], automatico = [], universal = [], bloqueado = [], pasos = [], noAplica = [], reglas = [];
      const vistos = {};
      function conMonto(b) { b.montoAplicado = montoAplicado(b, r); return b; }
      function add(lista, id, motivo) {
        if (vistos[id]) return;
        vistos[id] = true;
        const b = conMonto(byId(id));
        if (motivo) b.motivo = motivo;
        lista.push(b);
      }
      function paso(id, motivo) {
        if (vistos[id]) return;
        vistos[id] = true;
        pasos.push(Object.assign(conMonto(byId(id)), { motivo: motivo }));
      }
      function regla(nombre, cumple, efecto) { reglas.push({ regla: nombre, cumple: cumple, efecto: efecto }); }

      const tieneRSH = r.rshOK === "si";
      const disc = r.disc === "si";
      const tieneRND = disc && r.credencial === "si";
      const esMayor = mayor(r);
      const es65 = de65(r);
      const menor18 = r.edad === "menor10" || r.edad === "10a17";
      const adulto = !menor18;
      const escolarEd = r.estudios === "escolar";
      const superior = r.estudios === "entra" || r.estudios === "cursando";
      const arrienda = r.vivienda === "arriendo";
      const quiereCasa = r.quiereCasa === "comprar" || r.quiereCasa === "construir";
      const propietario = r.vivienda === "propia";
      const formal = r.trabajo === "contrato" || r.trabajo === "honorarios";
      const recibePension = r.trabajo === "pensionado" || r.pgu === "si";
      const arriendoEsp = arrienda && (esMayor || (tieneRND && adulto));

      // ---------- Llaves del sistema ----------
      if (disc) {
        regla("Credencial de discapacidad vigente", tieneRND, tieneRND ? "Habilita el catálogo completo de discapacidad" : "Sin credencial, varios beneficios quedan bloqueados");
        if (!tieneRND) paso("rnd", "Es la puerta de entrada: sin ella, la mayoría de los beneficios de discapacidad se rechazan.");
      }
      regla("RSH al día", tieneRSH, tieneRSH ? "Cumple el requisito socioeconómico" : "Paso previo: la mayoría de los programas se asignan por tramo del RSH");
      if (!tieneRSH) paso("rsh", "Lo exigen casi todos los programas. Es el trámite que más desbloquea.");

      const D = tieneRSH ? hoy : bloqueado;                 // depende del RSH
      const DR = (tieneRSH && tieneRND) ? hoy : bloqueado;  // depende del RSH y de la credencial

      // ---------- Salud ----------
      regla("Ley Ricarte Soto: sin requisito socioeconómico", true, "Cubre el 100% de tratamientos de alto costo de la lista oficial; la postulación la hace el médico");
      add(hoy, "ricarteSoto");

      // ---------- Discapacidad ----------
      if (disc) {
        if (menor18) { regla("Menor de 18 con discapacidad", true, "Activa el Subsidio de discapacidad para menores de 18 (mental, o física/sensorial de 50% o más)"); add(DR, "subsidio18"); }
        else noAplica.push({ nombre: "Subsidio de discapacidad para menores de 18", motivo: "Es solo para menores de 18 años." });

        if (r.edad !== "menor10") {
          if (r.programaSO === "si") { regla("Participa en Seguridades y Oportunidades", true, "Vía preferente: hasta 3 ayudas técnicas con costo total cubierto"); if (r.ayudaTecnica === "si") add(DR, "ayudastecSO"); }
          else if (r.ayudaTecnica === "si") { regla("Necesita elemento de apoyo y tiene 10 años o más", true, "Activa Ayudas Técnicas del Programa Regular"); add(DR, "ayudastec"); }
        }
        // v5.0: la PBSI exige el 80% según el puntaje de focalización, que usa datos del RSH.
        // Se trata igual que la PGU: bloqueada mientras falte el RSH. Pendiente validación experta.
        if (adulto && !es65) { regla("Adulto de 18 a 64 con discapacidad", true, "Activa la Pensión Básica Solidaria de Invalidez. Requiere estar en el Registro Social de Hogares (desde los 65 la reemplaza la PGU)"); add(D, "pbsi"); }
        else if (es65) noAplica.push({ nombre: "Pensión Básica Solidaria de Invalidez", motivo: "Es para personas de 18 a 64 años. Desde los 65 el beneficio equivalente es la PGU, y no son acumulables." });
        if (adulto) { add(DR, "formate"); add(DR, "franquiciaDisc"); add(DR, "permisoCirculacion"); }
        if (menor18 || escolarEd) { regla("Estudiante con discapacidad en etapa escolar", true, "Activa el Programa de Integración Escolar (PIE) en el colegio"); add(hoy, "pie"); }
        if (superior) { regla("Estudiante con discapacidad en educación superior", true, "Activa la Beca SENADIS (primera carrera, requiere credencial)"); add(DR, "becaSenadis"); }
        if (r.estudios === "terminada") noAplica.push({ nombre: "Beca SENADIS educación superior", motivo: "Solo financia la primera carrera. Quien ya se tituló queda fuera." });
      }

      // ---------- Cuidados ----------
      if (r.quien === "cuidador" || r.apoyoDiario === "alto" || r.cargaDisc === "si") {
        regla("Hay una situación de cuidado en el hogar", true, "Activa Chile Cuida y la Credencial de Persona Cuidadora");
        add(hoy, "chilecuida");
      }
      if (r.apoyoDiario === "leve" && esMayor) { regla("Necesita algo de apoyo diario y tiene 60+", true, "Perfil de Centros Diurnos (dependencia leve)"); add(D, "centrosDiurnos"); }
      if (r.apoyoDiario === "alto" && esMayor) { regla("Necesita bastante apoyo diario", true, "Perfil de Cuidados Domiciliarios (dependencia moderada o severa)"); add(D, "cuidadosDom"); }

      // ---------- Adulto Mayor ----------
      if (esMayor) {
        regla("Tiene 60 años o más", true, "Abre los beneficios universales de persona mayor, sin requisito socioeconómico");
        add(universal, "vacacionesTE");
        add(universal, "culturaAM");
      }
      if (es65) {
        add(universal, "tarifaAM");
        if (r.pgu !== "si") { regla("65+ y aún no recibe la PGU", true, "El beneficio más importante y menos cobrado del sistema. Requiere estar en el Registro Social de Hogares"); add(D, "pgu"); }
        else noAplica.push({ nombre: "Pensión Garantizada Universal", motivo: "Ya la recibe. Desde septiembre de 2026 el monto máximo es $250.275 para quienes tienen 75 años o más, y el aumento es automático." });
        // v5.0: el Bono de Invierno exige recibir una pensión (también sirve solo la PGU). Fuente: ChileAtiende, ficha 39484.
        if (recibePension) {
          regla("65+ y recibe una pensión (incluida la PGU)", true, "El Bono de Invierno llega solo con la pensión de mayo");
          add(automatico, "bonoInvierno");
        } else {
          regla("65+ y recibe una pensión (incluida la PGU)", false, "Sin pensión no llega el Bono de Invierno");
          noAplica.push({ nombre: "Bono de Invierno", motivo: "Llega solo a quienes reciben una pensión, y también a quienes reciben solo la PGU. Si obtienes la PGU, te puede corresponder en mayo." });
        }
        add(hoy, "pacam");
      }
      if (es65 && (r.viveSolo === "solo" || r.viveSolo === "unaPersona")) {
        regla("65+ y vive sola o solo", true, "Perfil del Programa Vínculos (se accede por invitación municipal)");
        add(D, "vinculos");
      }
      if (r.bodas === "si") { regla("50 años de matrimonio", true, "Activa el Bono Bodas de Oro; hay un año de plazo para pedirlo"); add(hoy, "bodasOro"); }

      // ---------- Familia y Hogar ----------
      if (r.cargas === "si") {
        if (formal) {
          regla("Trabaja formalmente o cotiza", true, "Le corresponde Asignación Familiar, no SUF: son incompatibles");
          add(hoy, "asignacionFamiliar");
          noAplica.push({ nombre: "Subsidio Único Familiar (SUF)", motivo: "No se puede tener junto con la Asignación Familiar por la misma persona." });
        } else {
          regla("Tiene personas a cargo y no trabaja formalmente", true, r.cargaDisc === "si" ? "Activa el SUF al doble ($45.202) por la carga con discapacidad" : "Activa el SUF: automático en el 40%, postulable en el municipio hasta el 60%");
          add(D, "suf");
          noAplica.push({ nombre: "Asignación Familiar", motivo: "Requiere trabajo formal o cotizaciones al día. Es la alternativa al SUF." });
        }
        regla("Recibe pago por carga familiar", true, "El Aporte Familiar Permanente llega solo entre febrero y marzo");
        add(automatico, "afper");
      }
      if (r.agua === "si") { regla("La cuenta del agua está a su nombre", true, "Activa el Subsidio de Agua Potable (se pide en el municipio todo el año)"); add(D, "sap"); }
      else noAplica.push({ nombre: "Subsidio de Agua Potable", motivo: "Debe postular quien es jefe o jefa de hogar y puede acreditar el pago del servicio." });

      if (r.electro === "si") { regla("Hay una persona electrodependiente en el hogar", true, "Abre el Subsidio Eléctrico sin importar el tramo del RSH"); add(hoy, "subsidioElectrico"); }
      else add(D, "subsidioElectrico");

      // ---------- Vivienda ----------
      if (propietario) {
        noAplica.push({ nombre: "Subsidios de vivienda (DS 1, DS 49, DS 52)", motivo: "Están dirigidos a personas que no son dueñas de una vivienda." });
      } else {
        if (arriendoEsp) {
          regla("Arrienda y tiene 60+ o credencial de discapacidad", true, "Va al llamado especial de arriendo: cubre hasta 90%, sin ahorro y se puede postular solo");
          add(D, "arriendoEspecial");
          noAplica.push({ nombre: "Subsidio de Arriendo DS 52 (regular)", motivo: "El llamado especial le conviene más: cubre más, no pide ahorro y permite postular sin grupo familiar." });
        } else if (arrienda) {
          regla("Arrienda, sin condición preferente", true, "Corresponde el DS 52 regular: exige 4 UF de ahorro");
          if (r.vivAhorro === "no" || r.vivAhorro === "menos4") paso("ds52", "Primero hay que abrir la cuenta de ahorro y juntar las 4 UF. Sin ese ahorro la postulación se rechaza.");
          else add(D, "ds52");
        }
        if (quiereCasa) {
          regla("Quiere comprar o construir", true, "Se evalúan dos caminos: DS 49 (sin crédito) y DS 1 (con ahorro y crédito)");
          add(D, "ds49");
          if (r.vivAhorro === "mas30") add(D, "ds1");
          else { regla("Ahorro sobre 30 UF para el DS 1", false, "El DS 1 exige al menos 30 UF en el Tramo I"); add(bloqueado, "ds1"); }
        }
      }

      // ---------- Educación ----------
      if (escolarEd) {
        regla("Hay estudiantes en básica o media", true, "Activa los beneficios JUNAEB escolares y la TNE");
        add(automatico, "junaebEscolar");
        add(hoy, "tne");
        if (r.promedio === "alto") { regla("Promedio 6.0 o más", true, "Perfil de la Beca Presidente de la República"); add(D, "becaPresidente"); }
        if (r.promedio === "alto" && tieneRSH) { regla("Buen rendimiento y RSH bajo", true, "Perfil del Bono Logro Escolar: llega solo, sin postular"); add(automatico, "bonoLogroEscolar"); }
        if (r.promedio === "bajo") noAplica.push({ nombre: "Beca Presidente de la República", motivo: "Requiere promedio 6.0 o superior." });
      }
      if (superior) {
        regla("Hay alguien en educación superior", true, "Activa el FUAS: gratuidad, becas de arancel y BAES");
        add(D, "fuas");
        add(tieneRSH ? automatico : bloqueado, "baes");
        add(hoy, "tne");
      }
      if (r.estudios === "terminada") {
        regla("Ya cuenta con un título o licenciatura", false, "La gratuidad y las becas de arancel se asignan una sola vez");
        noAplica.push({ nombre: "Gratuidad y becas de arancel (FUAS)", motivo: "Un requisito es no tener licenciatura ni título profesional previo. Dos excepciones: quien tiene título técnico y se matricula en una carrera profesional, y quien cursa formación pedagógica (hasta 4 semestres)." });
        if (r.seguir === "postgrado") {
          regla("Quiere cursar un postgrado", true, "Las becas ANID no piden RSH: son concursos por mérito académico");
          add(hoy, "postgradoANID");
          add(hoy, "doctoradoANID");
          if (disc) regla("Postula a ANID con discapacidad", true, "La postulación bonifica puntaje por situación de discapacidad, ascendencia indígena y estudios fuera de la Región Metropolitana");
        }
        if (r.seguir === "otraCarrera") {
          regla("Quiere cursar otra carrera de pregrado", true, "Sin gratuidad, el camino disponible es el crédito con aval del Estado");
          add(hoy, "caeContinuidad");
        }
      }
      if (r.indigena === "si" || r.indigena === "nose") {
        const cumpleNota = r.promedio !== "bajo";
        regla("Ascendencia indígena y promedio mínimo", cumpleNota, cumpleNota ? "Activa la Beca Indígena JUNAEB" : "La Beca Indígena requiere subir el promedio a 5.0");
        if (cumpleNota) add(D, "becaIndigena");
        else noAplica.push({ nombre: "Beca Indígena", motivo: "Requiere promedio mínimo 5.0. Se puede retomar al subir las notas." });
      }
      if (r.edad === "18a19") {
        regla("Tiene 18 o 19 años", true, "Activa el Pase Cultural ($50.000). Hay que activarlo: no llega solo");
        add(D, "paseCultural");
      }

      return { hoy: hoy, automatico: automatico, universal: universal, bloqueado: bloqueado, pasos: pasos, noAplica: noAplica, reglas: reglas };
    }

    // Suma lo que se puede pedir hoy, lo que llega solo y lo universal (no lo bloqueado).
    function estimarMonto(res) {
      let mensual = 0, unico = 0, conMonto = 0;
      [].concat(res.hoy, res.automatico, res.universal).forEach(function (b) {
        if (!b.monto) return;
        conMonto++;
        if (b.monto.tipo === "mensual") mensual += b.montoAplicado;
        else unico += b.montoAplicado;
      });
      return { mensual: mensual, unico: unico, conMonto: conMonto };
    }

    return { evaluar: evaluar, estimarMonto: estimarMonto, byId: byId };
  }

  // Siglas del glosario que aparecen en un texto, en el orden del glosario.
  // Solo palabras completas en mayúscula: "CAE" no coincide con "CAER".
  function siglasEn(texto, glosario) {
    const t = String(texto || "");
    return Object.keys(glosario || {}).filter(function (sigla) {
      return new RegExp("(^|[^A-Za-zÁÉÍÓÚÑáéíóúñ])" + sigla + "(?![A-Za-zÁÉÍÓÚÑáéíóúñ])").test(t);
    });
  }

  const api = {
    siglasEn: siglasEn,
    PREGUNTAS: PREGUNTAS,
    RAMIFICAN: RAMIFICAN,
    ACLARACIONES: ACLARACIONES,
    CONDICIONES_MONTO: CONDICIONES_MONTO,
    preguntasVisibles: preguntasVisibles,
    rangoPreguntas: rangoPreguntas,
    normalizarRespuesta: normalizarRespuesta,
    montoAplicado: montoAplicado,
    crearMotor: crearMotor,
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.AJMotor = api;
})(typeof window !== "undefined" ? window : globalThis);
