# Web del ISFT N° 238 — Camet Norte

Sitio institucional hecho con HTML, CSS y JavaScript (sin librerías ni frameworks).
Se adapta a celulares, tablets y computadoras.

## Cómo verlo

Abrir `index.html` con doble clic en cualquier navegador. Para el mapa y las tipografías hace falta internet.

## Estructura

```
isft238-web/
├── index.html                 Página de inicio
├── carreras/                  Una página por carrera
│   ├── ciencia-de-datos.html
│   ├── enfermeria.html
│   ├── energias-renovables.html
│   ├── tiempo-libre-y-recreacion.html
│   └── guia-de-turismo.html
├── css/estilos.css            Todos los estilos (mobile first)
├── js/main.js                 Menú para celulares, sombra del encabezado, año del pie
└── img/                       Fotos
```

## Cómo se adapta a cada pantalla

- **Mobile first:** los estilos base son para celular. Con `@media (min-width: 600px)` y `@media (min-width: 960px)` se agregan los cambios para tablet y escritorio.
- **Grillas automáticas:** `.grilla` usa `repeat(auto-fit, minmax(...))`, así las tarjetas se acomodan solas según el ancho.
- **Tamaños fluidos:** los títulos usan `clamp()`, crecen con la pantalla sin pasarse.
- **Menú:** en pantallas de menos de 960px se muestra el botón hamburguesa.

## Para completar

Buscar los textos entre corchetes, por ejemplo `[FECHA DE CIERRE]`, `[EMAIL]`, `[NOMBRE Y APELLIDO]`:

- Fecha de cierre de inscripción y documentación requerida
- Mail, teléfono y horario de secretaría
- Docentes de cada carrera
- Imagen del calendario académico (instrucciones en un comentario en `index.html`)
- Noticias
- Requisitos de ingreso de Enfermería (no figuran en la Res. 854/16)
- Enlaces de "Completar el formulario" y "Descargar el diseño curricular"

## Chatbot

Tiene dos partes:

- **`js/chatbot.js`** (en la web): arma la ventana del chat y le manda las preguntas al Worker.
  Si el Worker no responde, contesta con preguntas frecuentes guardadas en el mismo archivo.
- **`worker/worker.js`** (en Cloudflare, no se sube con la web): recibe la pregunta y se la pasa a la IA
  (modelo Gemma 4 de Workers AI) junto con la información del instituto.

Datos del Worker publicado:

- Dirección: `https://chatbot-isft238.swtocaimaza.workers.dev/`
- Panel: Cloudflare → Workers & Pages → `chatbot-isft238`
- Binding: `AI` (Workers AI)
- Cupo gratuito: 10.000 "neuronas" por día (unos cientos de preguntas). Si se agota, la IA deja de
  responder hasta las 21:00 hora argentina y el chat usa las respuestas de respaldo. No cobra nada.

**Para cambiar lo que sabe el chatbot** (fechas, teléfono, docentes): editar `INFO_INSTITUTO` en
`worker/worker.js`, pegarlo en el editor del Worker en Cloudflare ("Edit code") y tocar **Deploy**.

**Cuando la web esté publicada**, conviene limitar quién puede usar el Worker cambiando
`ORIGENES_PERMITIDOS` por el dominio real, por ejemplo `['https://isft238.com.ar']`.

## Fuentes de la información

Los datos de cada carrera salen de sus diseños curriculares: Res. 2730/22 (Ciencia de Datos e IA),
Res. 854/16 (Enfermería), Res. 2729/22 y 6185/25 (Gestión de Energías Renovables),
Res. 3783/22 (Tiempo Libre y Recreación) y Res. 2684/20 (Guía de Turismo).
