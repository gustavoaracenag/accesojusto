# Instrucciones para Claude Code · AccesoJusto

AccesoJusto es un asistente gratuito que diagnostica a qué beneficios sociales del Estado de Chile puede acceder una persona y le muestra cómo obtenerlos. Proyecto social de Gustavo Aracena. Sitio estático publicado en Vercel (preset "Other", sin build): HTML, CSS y JavaScript sin frameworks ni compilación. Cada push a `main` publica.

## Principios que no se negocian
1. **Honestidad normativa.** Nunca inventar montos, requisitos ni fechas. Todo dato nuevo se verifica en una fuente oficial (ChileAtiende, IPS, SENADIS, SENAMA, MINVU, Mineduc, JUNAEB, Fonasa) y se registra en `fuente.texto`, `fuente.verificada` (AAAA-MM) y, si hace falta, en `observaciones`. Si no se puede confirmar, se dice y la ficha queda con `verificada: null`.
2. **Lenguaje simple** en todo texto para familias: frases cortas, sin tecnicismos, una acción por paso.
3. **Motor determinista.** Las reglas viven en `js/motor.js` como código, no en el JSON. Nada de IA generativa en el diagnóstico.
4. **Gratis y sin datos.** No agregar nada que guarde o envíe respuestas de las personas.
5. **Alcance congelado** (desde oct 2026): no agregar fichas, áreas ni preguntas nuevas. Sí se corrigen las existentes.

## Estructura
- `data/fichas.json`: catálogo (43 fichas, 8 áreas). Fuente de verdad del contenido.
- `js/motor.js`: preguntas (`PREGUNTAS`), reglas (`evaluar`), montos y rango de preguntas. Exporta para navegador (`window.AJMotor`) y Node (`require`).
- `js/app.js`: pantallas. `js/config.js`: versión, fecha y Google Form.
- `tests/*.test.js`: `node:test`, sin dependencias. `npm test`.
- `scripts/empaquetar.js`: genera `dist/AccesoJusto_vX.html` (un solo archivo). `scripts/verificar-publicacion.js`: revisión antes de publicar.

## Cómo trabajar
- Antes de terminar cualquier cambio: `npm test` debe pasar completo.
- Si un cambio altera un caso tipo de `tests/casos.test.js`, no ajustes el test para que pase: explica el cambio a Gustavo y espera su aprobación.
- Un cambio de regla lleva comentario en el código con la fuente y la fecha.
- Al publicar una versión: subir la versión en `js/config.js` (VERSION y FECHA_TEXTO), `data/fichas.json` (meta) y `package.json`; agregar la entrada en `CAMBIOS.md`; correr `npm run verificar`.
- Colores: el texto usa solo las variables `--texto`, `--texto2`, `--gris` y `--*-texto` de `css/estilos.css` (contraste ≥ 4,5:1 en claro y oscuro, revisado por `tests/contraste.test.js`). El coral y el ámbar originales son solo para bordes, fondos y títulos grandes. Sin emojis: íconos SVG de `app.js`.
- Siglas nuevas en fichas o preguntas: agregar su definición en `glosario` de `data/fichas.json`.
- Los sitios `.gob.cl` se escriben con `www.` (sin él, muchos no cargan). Hay un test para eso.
- Gustavo prefiere entender las opciones antes de aprobar: propone, explica y espera el visto bueno en cambios no triviales.

## Próximas etapas (plan acordado el 23-10-2026)
- **Etapa 3 · Mantenimiento automático:** GitHub Action mensual que revise links caídos o que redirigen a la portada, fichas con más de 90 días sin revisar y convocatorias vencidas, y abra un issue con el detalle. Debe dejar un registro en el repo (ej. `data/estado-revision.json`) para que GitHub no desactive la tarea tras 60 días sin actividad.
- **Etapa 4 · Antes del post en LinkedIn:** botón para compartir por WhatsApp (texto con los nombres de los beneficios y el link, nunca las respuestas) y métricas anónimas con GoatCounter (solo eventos agregados: diagnóstico iniciado/terminado, pregunta de abandono, clic a la institución, imprimir, compartir). Actualizar el texto de privacidad de la portada.
- **Modo asistido:** no se construye por ahora. Se diseñará con la primera fundación interesada.

## Pendientes conocidos
- Google Form sin configurar (bloquea la publicación).
- 24 fichas sin revisar contra la fuente; 0 con validación experta.
- PBSI: la regla "bloqueada sin RSH" debe confirmarla un experto (ver `observaciones` de la ficha).
