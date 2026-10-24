# AccesoJusto

Asistente gratuito que diagnostica a qué beneficios sociales del Estado de Chile puede acceder una persona y le muestra los pasos para obtenerlos. Responde entre 10 y 22 preguntas y recibe su plan ordenado por lo que tiene que hacer primero.

**Estado:** prototipo v5.2 (23 de octubre de 2026) · 43 beneficios en 8 áreas · pendiente validación experta.
Las respuestas no salen del navegador: no hay servidor, cuentas ni base de datos.

## Cómo está organizado

| Carpeta / archivo | Qué contiene |
|---|---|
| `data/fichas.json` | El catálogo: cada beneficio con su descripción, requisitos, pasos, link, monto, fuente y fecha de revisión |
| `js/motor.js` | Las preguntas y las reglas que deciden en qué bloque cae cada beneficio. Determinista, sin IA |
| `js/app.js` | Las pantallas |
| `js/config.js` | Versión, fecha y datos del formulario de contacto |
| `css/estilos.css` | Estilos (paleta coral, ámbar, grafito, crema) |
| `tests/` | Tests automáticos |
| `scripts/` | Empaquetar en un solo archivo y verificar antes de publicar |

## Usarlo en tu computador

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm test              # corre los tests
npm run servir        # abre http://localhost:8000 (la web necesita un servidor para leer el catálogo)
npm run empaquetar    # crea dist/AccesoJusto_v5.0.html, que se abre con doble clic
npm run verificar     # revisa que todo esté listo para publicar
```

## Publicar en Vercel

El sitio no necesita compilación: Vercel sirve los archivos tal como están.

1. Crea el formulario en Google Forms (ver abajo) y completa `js/config.js`.
2. Corre `npm test` y `npm run verificar`: ambos deben terminar sin errores.
3. Sube los archivos a GitHub. Si usas la web de GitHub (**Add file → Upload files**), arrastra el **contenido** de la carpeta, no la carpeta: `index.html` tiene que quedar en la raíz del repositorio. Si queda dentro de una subcarpeta, Vercel muestra error 404.
4. En Vercel: **Add New → Project →** elige el repositorio.
5. En **Framework Preset** elige **Other**. En **Build Command** activa *Override* y deja el campo vacío. No cambies el **Output Directory**.
6. **Deploy.** Cada vez que subas un cambio a `main`, Vercel publica la nueva versión sola.
7. **Imagen al compartir:** copia la dirección que te dio Vercel (por ejemplo `https://accesojusto.vercel.app`) y en `index.html` cambia `og:image` a `https://.../img/compartir.png` y `og:url` a la dirección. Sin la URL completa, LinkedIn y WhatsApp no muestran la imagen.

Después de publicar, prueba el botón "Imprimir o guardar en PDF" desde la URL de Vercel en Chrome o Safari. La vista previa de Claude y algunos navegadores internos de apps bloquean la impresión; en ese caso la página muestra cómo abrirla en el navegador.

## Configurar el formulario de contacto

**Forma rápida:** usa `scripts/crear-formulario.gs` en [script.google.com](https://script.google.com). Crea el formulario con las preguntas de abajo, una planilla de respuestas y lo publica. Al terminar, muestra las 3 líneas para pegar en `js/config.js`. Las instrucciones están al inicio del archivo.

**Forma manual:**

Crea un Google Form con estas preguntas:

1. **Tipo** (opción múltiple), con estas tres opciones escritas exactamente así: `Reportar un error` · `Comentario o sugerencia` · `Soy de una fundación u organización`
2. **Beneficio** (respuesta corta)
3. **¿Qué dato está mal o qué nos quieres contar?** (párrafo)
4. **¿Dónde viste el dato correcto?** (respuesta corta, opcional)
5. **Correo, solo si quieres respuesta** (respuesta corta, opcional)

No actives "Recopilar correos electrónicos" en la configuración.

Luego, en el menú **⋮ → Obtener vínculo previamente rellenado**, completa Tipo y Beneficio con cualquier valor y copia el link. En él aparecen dos códigos `entry.NÚMERO`. Pega en `js/config.js`:
- `FORMULARIO_URL`: el link del formulario hasta `/viewform`
- `FORMULARIO_CAMPO_TIPO`: el `entry.NÚMERO` de la pregunta Tipo
- `FORMULARIO_CAMPO_BENEFICIO`: el `entry.NÚMERO` de la pregunta Beneficio

## Actualizar una ficha

1. Verifica el dato en la fuente oficial (ChileAtiende, IPS, SENADIS, SENAMA, MINVU, Mineduc, JUNAEB…).
2. Edita la ficha en `data/fichas.json` y cambia `fuente.verificada` al mes de la revisión (por ejemplo `"2026-11"`).
3. Si cambias un monto, cámbialo en `monto.valor` **y** en el texto de `desc`. Hay un test que revisa que coincidan.
4. Corre `npm test`.

## Licencias

- Código: MIT (ver `LICENSE`).
- Contenido de las fichas (`data/fichas.json`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.es). Se puede reutilizar citando a AccesoJusto.

AccesoJusto es una iniciativa independiente. No es un organismo del Estado. La confirmación final de cada beneficio la entrega la institución que corresponde.
