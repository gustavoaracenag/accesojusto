// ============================================================
// AccesoJusto · Pantallas (v5.2 · 23-10-2026)
// Lee el catálogo (data/fichas.json), usa el motor (js/motor.js) y dibuja.
// No guarda ni envía respuestas: todo ocurre en este navegador.
// ============================================================
(function () {
  "use strict";

  const CFG = window.AJ_CONFIG;
  const M = window.AJMotor;
  let CATALOGO = null, MOTOR = null, AREAS = {}, GLOSARIO = {}, RANGO = { min: 0, max: 0 };

  // Perfil del ejemplo de la portada (caso 4 de los tests): se calcula con el motor,
  // así el ejemplo siempre coincide con lo que la página entrega de verdad.
  const PERFIL_EJEMPLO = {
    quien: "propia", edad: "65a74", disc: "no", rshOK: "no", trabajo: "noFormal", cargas: "no",
    vivienda: "arriendo", quiereCasa: "no", vivAhorro: "no", estudios: "no", agua: "si", electro: "no",
    apoyoDiario: "no", viveSolo: "solo", pgu: "no", bodas: "no",
  };

  let STATE = estadoInicial();
  function estadoInicial() {
    return { pantalla: "inicio", respuestas: {}, camino: [], idx: 0, resultado: null, hechos: [],
             nota: null, verMotor: false, abiertas: {}, filtro: null, imprimiendo: false, ayudaImprimir: false };
  }

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function pesos(n) { return "$" + Number(n).toLocaleString("es-CL"); }
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function mesCorto(aaaamm) { const p = String(aaaamm).split("-"); return MESES[parseInt(p[1], 10) - 1].slice(0, 3) + " " + p[0]; }
  function mesLargo(aaaamm) { const p = String(aaaamm).split("-"); return MESES[parseInt(p[1], 10) - 1] + " de " + p[0]; }
  function fechaHoy() { const d = new Date(); return d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }

  // ---------- Íconos (trazos simples, sin emojis) ----------
  const ICONOS = {
    aviso: '<path d="M12 3 2 21h20L12 3z"></path><path d="M12 10v5"></path><path d="M12 18h.01"></path>',
    check: '<path d="M5 12l5 5L20 7"></path>',
    abajo: '<path d="M6 9l6 6 6-6"></path>',
    arriba: '<path d="M6 15l6-6 6 6"></path>',
    externo: '<path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path>',
  };
  function icono(nombre, tam) {
    const t = tam || 20;
    return '<svg class="icono" aria-hidden="true" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICONOS[nombre] + "</svg>";
  }

  // ---------- Contacto (Google Forms) ----------
  function formularioListo() { return !!CFG.FORMULARIO_URL; }
  function urlFormulario(tipo, beneficio) {
    const u = new URL(CFG.FORMULARIO_URL);
    u.search = "";
    u.searchParams.set("usp", "pp_url");
    if (tipo && CFG.FORMULARIO_CAMPO_TIPO && CFG.TIPOS_FORMULARIO[tipo]) u.searchParams.set(CFG.FORMULARIO_CAMPO_TIPO, CFG.TIPOS_FORMULARIO[tipo]);
    if (CFG.FORMULARIO_CAMPO_BENEFICIO && beneficio) u.searchParams.set(CFG.FORMULARIO_CAMPO_BENEFICIO, beneficio);
    return u.toString();
  }
  function linkContacto(tipo, beneficio, clase, texto) {
    if (!formularioListo()) {
      return '<span class="' + clase + ' btn-pendiente" aria-disabled="true" title="Formulario en preparación">' + esc(texto) + "</span>";
    }
    return '<a class="' + clase + '" href="' + esc(urlFormulario(tipo, beneficio)) + '" target="_blank" rel="noopener">' + esc(texto) +
      '<span class="sr-only"> (se abre en una pestaña nueva)</span></a>';
  }

  // ---------- Glosario de siglas ----------
  function glosarioDe(textos) {
    return M.siglasEn(textos.join(" \n "), GLOSARIO);
  }
  function glosarioCaja(siglas) {
    if (!siglas.length) return "";
    return '<div class="glosario">' + siglas.map(function (s) { return "<div><b>" + esc(s) + ":</b> " + esc(GLOSARIO[s]) + "</div>"; }).join("") + "</div>";
  }
  function glosarioDetalle(b) {
    const siglas = glosarioDe([b.nombre, b.desc, b.docs, b.convocatoria || "", b.motivo || ""].concat(b.ruta || []));
    if (!siglas.length) return "";
    return '<details class="glosario-det no-print"' + (STATE.imprimiendo ? " open" : "") + "><summary>¿Qué significan las siglas?</summary><dl>" +
      siglas.map(function (s) { return "<dt>" + esc(s) + "</dt><dd>" + esc(GLOSARIO[s]) + "</dd>"; }).join("") + "</dl></details>";
  }

  // ---------- Aviso de prototipo: compacto, en todas las pantallas y al imprimir ----------
  function avisoPrototipo(conLink) {
    return '<div class="aviso-proto" role="note"><div class="wrap aviso-inner">' + icono("aviso", 18) +
      '<p class="aviso-txt"><b>Prototipo en validación.</b> Confirma cada dato en la institución antes de hacer un trámite.' +
      (conLink ? ' <a href="#datos" class="no-print">Cómo revisamos</a>' : "") + "</p></div></div>";
  }

  // ---------- Navegación ----------
  function preguntaActual() { return M.preguntasVisibles(STATE.respuestas)[STATE.idx] || null; }

  window.empezar = function () {
    STATE.pantalla = "preguntas"; STATE.idx = 0; STATE.camino = []; STATE.nota = null;
    render(true);
  };
  window.responder = function (opV) {
    const q = preguntaActual();
    STATE.respuestas = Object.assign({}, STATE.respuestas);
    STATE.respuestas[q.id] = M.normalizarRespuesta(q.id, opV);
    STATE.nota = M.ACLARACIONES[q.id + "_" + opV] || null;
    STATE.camino.push(q.id);
    const vis = M.preguntasVisibles(STATE.respuestas);
    if (STATE.idx + 1 < vis.length) STATE.idx++;
    else { STATE.resultado = MOTOR.evaluar(STATE.respuestas); STATE.pantalla = "resultado"; }
    render(true);
  };
  window.atras = function () {
    STATE.nota = null;
    if (STATE.idx > 0) {
      STATE.idx--;
      const ultima = STATE.camino.pop();
      if (ultima) { const copia = Object.assign({}, STATE.respuestas); delete copia[ultima]; STATE.respuestas = copia; }
    } else STATE.pantalla = "inicio";
    render(true);
  };
  window.toggleFicha = function (id) { STATE.abiertas[id] = !STATE.abiertas[id]; render(false); };
  window.togglePaso = function (k) {
    const i = STATE.hechos.indexOf(k);
    if (i >= 0) STATE.hechos.splice(i, 1); else STATE.hechos.push(k);
    render(false);
  };
  window.filtrar = function (a) { STATE.filtro = (STATE.filtro === a) ? null : a; render(false); };
  window.reiniciar = function () { STATE = estadoInicial(); render(true); };
  window.toggleMotor = function () { STATE.verMotor = !STATE.verMotor; render(false); };

  // Impresión: el navegador avisa con 'beforeprint' justo antes de imprimir y con 'afterprint' al terminar.
  // La página solo se expande si la impresión de verdad ocurre: si el navegador la bloquea
  // (vista previa con restricciones, navegadores internos de algunas apps), nada queda a medias.
  function modoImpresion(on) {
    if (STATE.imprimiendo === on) return;
    STATE.imprimiendo = on;
    render(false);
  }
  window.imprimir = function () {
    STATE.ayudaImprimir = true; // por si la ventana no se abre, se muestra cómo hacerlo a mano
    render(false);
    window.print();
  };
  window.addEventListener("beforeprint", function () { modoImpresion(true); });
  window.addEventListener("afterprint", function () { modoImpresion(false); });

  // ---------- Fichas ----------
  function textoMonto(b) {
    if (!b.monto) return "";
    const v = pesos(b.montoAplicado || b.monto.valor);
    if (b.monto.tipo === "mensual") return v + " al mes" + (b.monto.por_carga ? " por carga" : "");
    return v + (b.monto.por_carga ? " por carga" : b.monto.por_persona ? " por persona" : "") + " una vez";
  }
  function estiloArea(area) {
    const ar = AREAS[area] || { color: "#5A5450", color_oscuro: "#C9BFB8" };
    return "--area:" + ar.color + ";--area-o:" + ar.color_oscuro;
  }

  function pasosHtml(b) {
    let html = "";
    (b.ruta || []).forEach(function (paso, i) {
      const k = b.id + ":" + i;
      const on = STATE.hechos.indexOf(k) >= 0;
      html += '<li class="ficha-paso' + (on ? " hecho" : "") + '"><label>' +
        '<input type="checkbox" ' + (on ? "checked" : "") + " onchange=\"togglePaso('" + esc(k) + "')\" />" +
        '<span><span class="num">' + (i + 1) + '</span><span class="txt">' + esc(paso) + "</span></span></label></li>";
    });
    return '<ol class="ficha-pasos">' + html + "</ol>";
  }

  function detalleFicha(b, opciones) {
    const op = opciones || {};
    const revision = b.fuente.verificada
      ? "revisada " + esc(mesCorto(b.fuente.verificada))
      : '<span class="sin-revisar">pendiente de revisión: confírmalo en la institución</span>';
    return (op.sinDesc ? "" : '<p class="ficha-desc">' + esc(b.desc) + "</p>") +
      (b.motivo && !op.sinMotivo ? '<p class="ficha-motivo">' + esc(b.motivo) + "</p>" : "") +
      '<div class="ficha-req"><b>Qué necesitas:</b> ' + esc(b.docs) +
        (b.convocatoria ? '<div class="conv"><b>Cuándo se postula:</b> ' + esc(b.convocatoria) + "</div>" : "") + "</div>" +
      (op.envolverPasos ? '<div class="pasos-caja">' + pasosHtml(b) + "</div>" : pasosHtml(b)) +
      (b.tramite && b.tramite.url ? '<a class="btn-tramite" href="' + esc(b.tramite.url) + '" target="_blank" rel="noopener noreferrer">' + esc(b.tramite.texto) +
        ' <span class="no-print">' + icono("externo", 18) + '</span><span class="sr-only"> (se abre en una pestaña nueva)</span></a>' : "") +
      glosarioDetalle(b) +
      '<div class="detalle-fuente">Fuente: ' + esc(b.fuente.texto) + " · " + revision +
        '<div class="no-print">' + linkContacto("error", b.nombre, "ficha-reporte", "¿Ves un dato malo en esta ficha? Avísanos") + "</div>" +
      "</div>";
  }

  function renderFicha(b, borde) {
    if (STATE.filtro && !STATE.imprimiendo && b.area !== STATE.filtro) return "";
    const total = (b.ruta || []).length;
    let hechos = 0;
    for (let i = 0; i < total; i++) { if (STATE.hechos.indexOf(b.id + ":" + i) >= 0) hechos++; }
    const completo = total > 0 && hechos === total;
    const abierta = !!STATE.abiertas[b.id] || STATE.imprimiendo;
    const montoTxt = textoMonto(b);
    return (
      '<div class="ficha' + (completo ? " completo" : "") + '" style="border-left:5px solid ' + (completo ? "var(--verde)" : borde) + "\">" +
        '<button class="ficha-cabecera" aria-expanded="' + abierta + "\" onclick=\"toggleFicha('" + esc(b.id) + "')\">" +
          "<span>" +
            '<span class="area-chip" style="' + estiloArea(b.area) + '">' + esc(b.area || "") + "</span>" +
            '<span class="ficha-nombre">' + esc(b.nombre) + "</span>" +
            (montoTxt ? '<span class="ficha-monto">' + esc(montoTxt) + "</span>" : "") +
            (hechos > 0 ? '<span class="ficha-progreso no-print">' + (completo ? "✓ Trámite completo" : hechos + " de " + total + " pasos marcados") + "</span>" : "") +
          "</span>" +
          '<span class="no-print">' + icono(abierta ? "arriba" : "abajo") + "</span>" +
        "</button>" +
        (abierta ? '<div class="ficha-cuerpo">' + detalleFicha(b) + "</div>" : "") +
      "</div>"
    );
  }

  // borde: color decorativo · texto: color con contraste para el subtítulo
  function renderBloque(id, eyebrow, titulo, colores, items, bajada) {
    let html = "";
    items.forEach(function (b) { html += renderFicha(b, colores.borde); });
    if (!html) return "";
    return '<section class="bloque" id="' + id + '">' +
      '<div class="eyebrow" style="color:' + colores.texto + '">' + esc(eyebrow) + "</div>" +
      "<h2>" + esc(titulo) + "</h2>" + (bajada ? '<p class="bajada">' + esc(bajada) + "</p>" : "") + html + "</section>";
  }

  // ---------- Marco común ----------
  function contarRevisadas() { return CATALOGO.fichas.filter(function (f) { return !!f.fuente.verificada; }).length; }
  function ultimaRevision() {
    return CATALOGO.fichas.map(function (f) { return f.fuente.verificada; }).filter(Boolean).sort().pop() || null;
  }

  function marco(innerHtml) {
    const n = CATALOGO.fichas.length, nAreas = Object.keys(AREAS).length;
    return (
      '<header class="topbar no-print"><div class="wrap topbar-inner">' +
        '<div><div class="brand">Acceso<span>Justo</span><span class="version-badge">v' + esc(CFG.VERSION) + '</span></div><div class="subbrand">Un solo diagnóstico · todos los beneficios</div></div>' +
        (STATE.pantalla !== "inicio" ? '<button class="btn-reset" onclick="reiniciar()">Empezar de nuevo</button>' : "") +
      "</div></header>" +
      avisoPrototipo(STATE.pantalla === "inicio") +
      "<main>" + innerHtml + "</main>" +
      '<footer><div class="wrap">' +
        "AccesoJusto es una iniciativa independiente. No es un organismo del Estado. La confirmación final de cada beneficio la entrega la institución que corresponde." +
        '<div class="no-print">¿Eres de una fundación u organización? ' + linkContacto("fundacion", "", "pie-link", "Conversemos") + "</div>" +
        '<div class="sub">Prototipo v' + esc(CFG.VERSION) + " · actualizado el " + esc(CFG.FECHA_TEXTO) + " · " + n + " beneficios en " + nAreas + " áreas</div>" +
      "</div></footer>"
    );
  }

  // ---------- Portada ----------
  function seccionEjemplo() {
    const res = MOTOR.evaluar(PERFIL_EJEMPLO);
    const primero = res.pasos[0];
    const conMonto = res.bloqueado.concat(res.hoy).filter(function (b) { return b.monto; })[0];
    const universal = res.universal[res.universal.length - 1];
    function item(b, conValor) {
      return '<div class="ejemplo-item"><div><span class="area-chip" style="' + estiloArea(b.area) + '">' + esc(b.area) + '</span><div class="nombre">' + esc(b.nombre) + "</div></div>" +
        (conValor && b.monto ? '<div class="monto">' + esc(pesos(b.montoAplicado) + (b.monto.tipo === "mensual" ? "/mes" : "")) + "</div>" : "") + "</div>";
    }
    return '<section class="seccion">' +
      '<div class="eyebrow">Así se ve tu plan</div>' +
      "<h2>Ordenado por lo que tienes que hacer primero</h2>" +
      '<div class="ejemplo" aria-label="Ejemplo de resultado">' +
        (primero ? '<div class="ejemplo-paso"><div class="eyebrow">Tu primer paso</div><div class="titulo">' + esc(primero.nombre) + '</div><div class="sub">Desbloquea ' + res.bloqueado.length + " beneficios más.</div></div>" : "") +
        (conMonto ? item(conMonto, true) : "") +
        (universal ? item(universal, false) : "") +
      "</div>" +
      '<p class="nota-chica">Ejemplo: mujer de 70 años que vive sola y arrienda.</p>' +
    "</section>";
  }

  function seccionQuien() {
    return '<section class="seccion"><div class="quien">' +
      '<div class="eyebrow">Quién está detrás</div>' +
      '<div class="quien-persona"><div class="quien-iniciales" aria-hidden="true">GA</div><div><div class="quien-nombre">Gustavo Aracena</div><div class="quien-rol">Creador de AccesoJusto</div></div></div>' +
      "<p>Creé AccesoJusto para que todas las personas puedan ver sus beneficios en un solo lugar. Hay ayudas del Estado que se pierden solo porque nadie sabe que existen.</p>" +
      '<ul class="checks">' +
        "<li>" + icono("check") + "<span>Gratis para las familias, siempre.</span></li>" +
        "<li>" + icono("check") + "<span>Independiente: no es un organismo del Estado.</span></li>" +
        "<li>" + icono("check") + "<span>Tus respuestas no salen de tu teléfono o computador.</span></li>" +
      "</ul>" +
      linkContacto("fundacion", "", "btn-borde", "¿Eres de una fundación? Conversemos") +
    "</div></section>";
  }

  function seccionDatos() {
    const n = CATALOGO.fichas.length, rev = contarRevisadas();
    const expertos = CATALOGO.fichas.filter(function (f) { return f.validacion_experta; }).length;
    const ultima = ultimaRevision();
    return '<section class="seccion" id="datos">' +
      '<div class="eyebrow">Cómo revisamos los datos</div>' +
      "<h2>Cada dato con su fuente</h2>" +
      "<p>Cada beneficio muestra su fuente oficial y el mes en que lo revisamos. Si todavía no lo hemos revisado, lo decimos.</p>" +
      '<div class="revision">' +
        '<div class="revision-fila"><b>Revisados contra la fuente oficial</b><span class="revision-num">' + rev + " de " + n + "</span></div>" +
        '<div class="barra" role="img" aria-label="' + rev + " de " + n + ' revisados"><div style="width:' + Math.round(100 * rev / n) + '%"></div></div>' +
        '<div class="nota-chica">' + (ultima ? "Última revisión: " + esc(mesLargo(ultima)) + ". " : "") +
          "Validación de expertos: " + (expertos ? expertos + " de " + n : "pendiente") + ".</div>" +
      "</div>" +
      linkContacto("error", "", "link-fuerte", "¿Viste un dato malo? Avísanos") +
    "</section>";
  }

  function renderInicio() {
    const n = CATALOGO.fichas.length, nAreas = Object.keys(AREAS).length;
    return marco(
      '<section class="hero">' +
        '<div class="eyebrow">Beneficios del Estado de Chile</div>' +
        '<h1>No tienes que saber qué buscar. <span class="accent">Responde y te decimos lo que te corresponde.</span></h1>' +
        "<p>Entre " + RANGO.min + " y " + RANGO.max + " preguntas según tu situación. Al final recibes tu plan con los pasos para conseguir cada beneficio. Gratis, sin registro y sin dejar tus datos.</p>" +
        '<button class="btn-hero" onclick="empezar()">Empezar el diagnóstico</button>' +
        '<div class="stats"><span><b>' + n + "</b>beneficios</span><span><b>" + nAreas + "</b>áreas</span></div>" +
      "</section>" +
      seccionEjemplo() + seccionQuien() + seccionDatos()
    );
  }

  // ---------- Preguntas ----------
  function renderPreguntas() {
    const q = preguntaActual();
    const vis = M.preguntasVisibles(STATE.respuestas);
    const pct = Math.round((STATE.idx / vis.length) * 100);
    let opcionesHtml = "";
    q.opciones.forEach(function (op) {
      opcionesHtml += "<button class=\"opcion-btn\" onclick=\"responder('" + esc(op.v) + "')\">" + esc(op.t) + "</button>";
    });
    return marco(
      '<div style="padding-top:24px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">' +
          '<div class="eyebrow" style="margin-bottom:0">Diagnóstico</div>' +
          '<span style="font-size:14px;color:var(--gris);font-weight:700">Pregunta ' + (STATE.idx + 1) + " de " + vis.length + "</span>" +
        "</div>" +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        (STATE.nota ? '<div class="nota-aclaracion">' + esc(STATE.nota) + "</div>" : "") +
        '<h1 class="pregunta-h1">' + esc(q.texto) + "</h1>" +
        (q.ayuda ? '<p class="pregunta-ayuda">' + esc(q.ayuda) + "</p>" : "") +
        glosarioCaja(glosarioDe([q.texto, q.ayuda || ""])) +
        '<div class="opciones">' + opcionesHtml + "</div>" +
        '<button class="btn-volver" onclick="atras()">← Volver a la pregunta anterior</button>' +
      "</div>"
    );
  }

  // ---------- Resultado ----------
  const COLORES = {
    pasos: { borde: "var(--ambar)", texto: "var(--ambar-texto)" },
    hoy: { borde: "var(--verde)", texto: "var(--verde-texto)" },
    automatico: { borde: "#6B4E9B", texto: "var(--morado-texto)" },
    universal: { borde: "#2A6F7D", texto: "var(--azul-texto)" },
    bloqueado: { borde: "var(--coral)", texto: "var(--coral-texto)" },
  };

  function areasDe(res) {
    const set = {};
    [].concat(res.pasos, res.hoy, res.automatico, res.universal, res.bloqueado).forEach(function (b) {
      if (b.area) set[b.area] = (set[b.area] || 0) + 1;
    });
    return set;
  }

  function primerPasoHtml(res) {
    const b = res.pasos[0];
    const n = res.bloqueado.length;
    const texto = res.pasos.length === 1
      ? (n ? "Cuando esté listo, se desbloquean " + n + (n === 1 ? " beneficio más." : " beneficios más.") : "")
      : "Es el primero de " + res.pasos.length + " pasos previos." + (n ? " Al completarlos, se desbloquean " + n + (n === 1 ? " beneficio más." : " beneficios más.") : "");
    return '<section class="primer-paso" id="b-primero">' +
      '<div class="eyebrow">Tu primer paso</div>' +
      "<h2>" + esc(b.nombre) + "</h2>" +
      "<p>" + esc(b.motivo || b.desc) + (texto ? " " + esc(texto) : "") + "</p>" +
      detalleFicha(b, { sinDesc: true, sinMotivo: true, envolverPasos: true }) +
    "</section>";
  }

  function renderResultado() {
    const res = STATE.resultado;
    const m = MOTOR.estimarMonto(res);
    const total = res.hoy.length + res.automatico.length + res.universal.length + res.bloqueado.length + res.pasos.length;
    const otrosPasos = res.pasos.slice(1);
    const areas = areasDe(res);

    // Resumen: un contador por bloque con contenido, que lleva a esa sección
    const resumenDatos = [
      ["b-pasos", otrosPasos.length, "Abre primero", COLORES.pasos.texto],
      ["b-hoy", res.hoy.length, "Puedes pedir hoy", COLORES.hoy.texto],
      ["b-solo", res.automatico.length, "Llega solo", COLORES.automatico.texto],
      ["b-todos", res.universal.length, "Para todos", COLORES.universal.texto],
      ["b-despues", res.bloqueado.length, "Se desbloquean después", COLORES.bloqueado.texto],
    ].filter(function (x) { return x[1] > 0; });
    const resumenHtml = '<nav class="resumen no-print" aria-label="Resumen del resultado">' + resumenDatos.map(function (x) {
      return '<a href="#' + x[0] + '"><b style="color:' + x[3] + '">' + x[1] + "</b><span>" + esc(x[2]) + "</span></a>";
    }).join("") + "</nav>";

    let montoHtml = "";
    if (m.mensual > 0 || m.unico > 0) {
      montoHtml = '<div class="monto-panel"><div class="eyebrow">Valor estimado</div><div class="monto-fila">' +
        (m.mensual > 0 ? '<div><div class="monto-num">' + pesos(m.mensual) + '</div><div class="monto-lbl">al mes</div></div>' : "") +
        (m.unico > 0 ? '<div><div class="monto-num">' + pesos(m.unico) + '</div><div class="monto-lbl">pagos de una vez al año</div></div>' : "") +
        '</div><p class="monto-nota">Estimación sobre ' + m.conMonto + " beneficios con monto fijo publicado, contando una carga familiar o una persona por beneficio. No incluye vivienda, ayudas técnicas, becas ni descuentos. El monto final lo determina cada institución.</p></div>";
    }

    let filtrosHtml = "";
    if (Object.keys(areas).length > 1) {
      filtrosHtml = '<div class="filtros no-print"><span class="filtros-lbl">Área:</span>' +
        '<button class="chip-filtro' + (STATE.filtro === null ? " activo" : "") + '" onclick="filtrar(null)">Todas</button>' +
        Object.keys(areas).sort().map(function (a) {
          return '<button class="chip-filtro' + (STATE.filtro === a ? " activo" : "") + "\" onclick=\"filtrar('" + esc(a) + "')\">" + esc(a) + " (" + areas[a] + ")</button>";
        }).join("") + "</div>";
    }

    let noAplicaHtml = "";
    if (res.noAplica.length > 0 && (!STATE.filtro || STATE.imprimiendo)) {
      const n = res.noAplica.length;
      noAplicaHtml = '<details class="no-aplica"' + (STATE.imprimiendo ? " open" : "") + "><summary><span><b>" + n + (n === 1 ? " beneficio no aplica" : " beneficios no aplican") + " por ahora.</b> Ver por qué</span></summary>" +
        res.noAplica.map(function (x) {
          return '<div class="noaplica-item"><div class="noaplica-nombre">' + esc(x.nombre) + '</div><div class="noaplica-motivo">' + esc(x.motivo) + "</div></div>";
        }).join("") + "</details>";
    }

    let reglasHtml = "";
    res.reglas.forEach(function (rg) {
      reglasHtml += '<div class="regla-row"><span class="' + (rg.cumple ? "ok" : "no") + '">' + (rg.cumple ? "✓" : "✕") + "</span>" +
        '<div><div class="regla-nombre">' + esc(rg.regla) + '</div><div class="regla-efecto">' + esc(rg.efecto) + "</div></div></div>";
    });
    let chipsHtml = "";
    Object.keys(STATE.respuestas).forEach(function (k) { chipsHtml += '<span class="chip">' + esc(k) + ": <b>" + esc(STATE.respuestas[k]) + "</b></span>"; });

    return marco(
      '<div style="padding-top:24px">' +
        '<div class="impresion-cabecera solo-impresion">AccesoJusto · Plan de beneficios · diagnóstico del ' + esc(fechaHoy()) + " · prototipo v" + esc(CFG.VERSION) + "</div>" +
        '<div class="eyebrow">Tu resultado</div>' +
        '<h1 class="resultado-h1">Encontramos <span>' + total + (total === 1 ? " beneficio" : " beneficios") + "</span> para tu situación.</h1>" +
        (res.pasos.length ? primerPasoHtml(res) : "") +
        resumenHtml + montoHtml + filtrosHtml +
        renderBloque("b-pasos", "Después del primer paso", "Abre estas puertas también", COLORES.pasos, otrosPasos) +
        renderBloque("b-hoy", "Sin esperar nada más", "Puedes pedir hoy", COLORES.hoy, res.hoy) +
        renderBloque("b-solo", "No hay que hacer ningún trámite", "Llega solo", COLORES.automatico, res.automatico) +
        renderBloque("b-todos", "No piden requisito socioeconómico", "Para todos, solo con la cédula", COLORES.universal, res.universal) +
        renderBloque("b-despues", "Al completar los pasos previos", "Se desbloquean después", COLORES.bloqueado, res.bloqueado,
          res.pasos.length ? "Cuando completes " + (res.pasos.length === 1 ? "el primer paso." : "los pasos previos.") : "") +
        noAplicaHtml +
        '<section class="acciones-finales no-print">' +
          "<h2>Guarda tu plan</h2>" +
          "<p>Imprímelo o guárdalo en PDF para llevarlo a la municipalidad o al consultorio. Sale completo, con los pasos, los documentos y las fuentes.</p>" +
          '<div class="acciones-botones">' +
            '<button class="btn-oscuro" onclick="imprimir()">Imprimir o guardar en PDF</button>' +
            '<button class="btn-borde" onclick="reiniciar()">Hacer otro diagnóstico</button>' +
          "</div>" +
          (STATE.ayudaImprimir ? '<p class="nota-imprimir" role="status"><b>¿No se abrió la ventana para imprimir?</b> ' +
            "Algunas apps, como WhatsApp o LinkedIn, abren los links en un navegador que no permite imprimir. " +
            "Abre esta página en Chrome o Safari (menú o compartir → «Abrir en el navegador») y vuelve a tocar el botón. " +
            "En el computador también puedes usar Ctrl+P (o Cmd+P en Mac).</p>" : "") +
          linkContacto(null, "", "link-fuerte", "¿Viste un dato malo o tienes una idea? Escríbenos") +
          (formularioListo() ? "" : '<span class="nota-pendiente">El formulario de contacto está en preparación.</span>') +
          '<div><button class="motor-toggle" onclick="toggleMotor()">' + (STATE.verMotor ? "Ocultar" : "Ver") + " las reglas que se aplicaron</button>" +
          (STATE.verMotor ? '<div class="motor-panel"><div class="motor-nota">El motor es determinista: mismas respuestas, mismo resultado. No hay generación de texto en esta capa.</div>' + reglasHtml + '<div class="chips">' + chipsHtml + "</div></div>" : "") +
          "</div>" +
        "</section>" +
      "</div>"
    );
  }

  function render(scrollTop) {
    const app = document.getElementById("app");
    if (STATE.pantalla === "inicio") app.innerHTML = renderInicio();
    else if (STATE.pantalla === "preguntas") app.innerHTML = renderPreguntas();
    else app.innerHTML = renderResultado();
    if (scrollTop && typeof window.scrollTo === "function") {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { /* entornos sin scroll */ }
    }
  }

  // ---------- Arranque ----------
  function iniciar(catalogo) {
    CATALOGO = catalogo;
    AREAS = catalogo.areas;
    GLOSARIO = catalogo.glosario || {};
    MOTOR = M.crearMotor(catalogo);
    RANGO = M.rangoPreguntas();
    render(false);
  }

  function errorCarga(e) {
    document.getElementById("app").innerHTML =
      '<main style="padding:60px 20px"><h1>No se pudo cargar el catálogo de beneficios.</h1>' +
      "<p>Recarga la página. Si estás abriendo el archivo directamente en tu computador, usa un servidor local (ver README).</p></main>";
    if (window.console) console.error(e);
  }

  // La versión de un solo archivo trae el catálogo incrustado; la web lo descarga.
  if (window.AJ_CATALOGO) iniciar(window.AJ_CATALOGO);
  else fetch("fichas.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(iniciar)
    .catch(errorCarga);
})();
