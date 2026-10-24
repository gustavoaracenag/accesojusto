# AccesoJusto · Registro de cambios

## v5.2 · 23 de octubre de 2026 · Diseño para la web

Basado en el boceto aprobado (Prioridades 1 y 2). El contador de preguntas no cambia.

**Confianza y vista previa**
- Imagen para compartir el link (1200×630) e ícono de la pestaña y del celular (`img/`).
- Portada con tres secciones nuevas: "Así se ve tu plan" (ejemplo calculado con el motor real), "Quién está detrás" (con el texto de Gustavo) y "Cómo revisamos los datos" (fichas revisadas, última revisión y validación de expertos, calculadas desde el catálogo).

**Celular**
- Resultado compacto: "Tu primer paso" arriba con sus pasos y el link al trámite; resumen con contadores que llevan a cada sección; tarjetas que muestran solo área, nombre y monto, con el detalle al abrirlas; "No aplica" plegado. En el caso de prueba, la página pasó de unos 6.400 px de alto a 3.200 px.
- Aviso de prototipo en una línea; el link "Cómo revisamos" solo en la portada.
- Un solo enlace de contacto en el resultado (más el de cada ficha, con el beneficio ya escrito).
- Casillas, botones y enlaces de 44 px o más para tocar.

**Accesibilidad**
- Colores de texto con contraste de 4,5:1 o más en modo claro y oscuro. Un test nuevo lo revisa.
- Íconos simples en vez de emojis.
- Glosario de 23 siglas (RSH, RND, COMPIN, UF, SERVIU…): se explican en las preguntas y en cada ficha. Un test revisa que las siglas frecuentes tengan definición.

**Pendiente**
- Cuando exista la dirección de la web, poner la URL completa de la imagen en `index.html` (og:image y og:url). `npm run verificar` lo recuerda.
- La imagen para compartir usa tipografías parecidas a las de la web (Charter e Inter), porque las originales no se pudieron descargar en el entorno donde se generó.

## v5.1 · 23 de octubre de 2026

- **Imprimir o guardar en PDF:** si el navegador bloquea la impresión (vista previa de Claude, navegadores internos de WhatsApp o LinkedIn), la página ya no queda con todas las fichas abiertas y sin filtros. Ahora se expande solo cuando la impresión de verdad ocurre.
- Si la ventana de impresión no se abre, aparece una ayuda: abrir la página en Chrome o Safari, o usar Ctrl+P / Cmd+P.
- **Publicación en Vercel** en vez de GitHub Pages (preset "Other", sin compilación). README e instrucciones actualizados.

## v5.0 · 23 de octubre de 2026

**Base:** Web v4 (14 de octubre de 2026), 43 fichas.
**Estado:** prototipo, pendiente validación experta. Aún no publicado: falta configurar el Google Form.

### Nueva organización (Etapas 1 y 2 del plan)
- El catálogo de beneficios sale del código y queda en `data/fichas.json`. Cada ficha guarda su fuente, el mes en que se revisó contra la fuente oficial (`null` = sin revisar), el monto como dato, el estado de validación experta y observaciones internas para quien valide.
- El motor de elegibilidad queda en `js/motor.js`, separado de las pantallas (`js/app.js`). Funciona igual en el navegador y en los tests.
- 33 tests automáticos: formato del catálogo, cuestionario y 18 casos tipo con el resultado esperado. GitHub los corre en cada cambio.
- Comparación v4 vs v5 sobre 50.000 perfiles al azar: los resultados son idénticos salvo los dos cambios de regla de abajo.
- `npm run empaquetar` genera una versión de un solo archivo (`dist/`), para revisarla sin servidor.
- `npm run verificar` impide publicar si falta el formulario, si las versiones no coinciden o si hay un correo personal en el código.

### Cambios de reglas
| Beneficio | v4 | v5.0 | Fuente |
|---|---|---|---|
| Bono de Invierno | Llegaba a toda persona de 65+ | Solo si recibe una pensión, incluida la PGU sola. Si no, aparece en "No aplica" con la explicación | ChileAtiende, ficha 39484 (act. 14-04-2026) |
| PBSI | "Puede pedir hoy" aunque faltara el RSH | Bloqueada hasta tener el RSH, igual que la PGU. Pendiente validación experta | Puntaje de focalización usa datos del RSH (prensa); ChileAtiende no lo dice explícito |

### Correcciones
- **Aviso de prototipo** ahora aparece en todas las pantallas y al imprimir (antes solo en la portada).
- **Imprimir** sale completo: todas las fichas abiertas, sin filtro, con fecha del diagnóstico, versión y el link de cada trámite escrito.
- **Valor estimado:** la PGU usa $250.275 para personas de 75 o más; el SUF usa $45.202 si la carga tiene discapacidad.
- **Portada:** el rango de preguntas se calcula solo (10 a 22; antes decía 8 a 18). Los contadores de fichas y áreas también.
- **"Revisada en 2026"** ya no aparece en fichas sin revisar: ahora dicen "pendiente de revisión: confírmalo en la institución" (24 fichas).
- **Doctorado ANID:** el link apuntaba a Magíster. Ahora va a la ficha de ChileAtiende. La convocatoria dice que la anterior cerró el 11-11-2025 y que la próxima no está confirmada.
- **PBSI:** el link iba a la portada de ChileAtiende; ahora va a su ficha.
- **Fórmate (SENCE):** pasa del área Trabajo a Discapacidad. El área Trabajo sale del alcance → 8 áreas.
- **Contacto:** se quitó el correo personal del código. Los botones abren un Google Form con el tipo y el beneficio ya completos. Hay un tercer botón: "Soy de una fundación u organización".

### Pendiente
- Crear el Google Form y pegar los 3 datos en `js/config.js`.
- Revisar las 24 fichas pendientes y la validación experta de las 43.
- Etapa 3: revisión mensual automática de links y vigencia.
- Etapa 4: compartir por WhatsApp y métricas anónimas (antes del post en LinkedIn).
