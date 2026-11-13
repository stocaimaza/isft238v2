/* =========================================================
   ISFT N° 238 — Chatbot de la web
   ---------------------------------------------------------
   Arma la ventana del chat dentro de <div id="chatbot"> y
   le manda las preguntas al Worker de Cloudflare (la IA).
   Si la IA no responde, contesta con preguntas frecuentes
   guardadas acá mismo (respaldo).
   ========================================================= */

// ---------- 1. Configuración ----------
// Dirección del Worker publicado en Cloudflare.
// Si queda vacía, el chat funciona solo con las preguntas frecuentes.
const URL_CHATBOT = 'https://chatbot-isft238.swtocaimaza.workers.dev/';

const MAX_CARACTERES = 500;

// ---------- 2. Respuestas de respaldo (sin IA) ----------
// Cada una tiene palabras clave: si la pregunta contiene alguna, usamos esa respuesta.
const PREGUNTAS_FRECUENTES = [
  { claves: ['cuesta', 'costo', 'pagar', 'pago', 'gratis', 'gratuit', 'cuota', 'arancel', 'precio'],
    respuesta: 'Es educación superior pública y gratuita: no se paga matrícula ni cuota.' },
  { claves: ['carrera', 'tecnicatura', 'estudiar', 'ofrecen'],
    respuesta: 'Tenemos cinco tecnicaturas superiores de 3 años: Ciencia de Datos e IA, Enfermería, Gestión de Energías Renovables, Tiempo Libre y Recreación, y Guía de Turismo.' },
  { claves: ['dura', 'duracion', 'duración', 'años', 'cuanto tiempo'],
    respuesta: 'Todas las carreras duran 3 años y otorgan título oficial de técnico superior.' },
  { claves: ['donde', 'dónde', 'direccion', 'dirección', 'ubica', 'queda', 'llegar', 'mapa'],
    respuesta: 'Estamos en Luis Sáenz Peña 513, Camet Norte (Mar Chiquita), en el edificio de la EP N° 30, sobre la Ruta 11. En el inicio de la web tenés el mapa.' },
  { claves: ['inscrib', 'inscripci', 'anotar', 'anoto', 'requisito', 'ingres'],
    respuesta: 'Las inscripciones están abiertas. El requisito es tener el secundario completo; las personas mayores de 25 años sin secundario pueden ingresar según el art. 7 de la Ley 24.521.' },
  { claves: ['datos', 'inteligencia', ' ia ', 'program'],
    respuesta: 'Ciencia de Datos e IA dura 3 años: programación, bases de datos, estadística, Machine Learning e inteligencia artificial. En 1° año cada materia tiene un día presencial y otro virtual.' },
  { claves: ['enfermer', 'salud'],
    respuesta: 'Enfermería dura 3 años y otorga el título de Enfermero/a, con prácticas en instituciones de salud y en la comunidad.' },
  { claves: ['energ', 'solar', 'eolic', 'eólic', 'renovable'],
    respuesta: 'Gestión de Energías Renovables dura 3 años: instalaciones, mantenimiento y proyectos de energía solar, eólica y otras fuentes limpias.' },
  { claves: ['recrea', 'tiempo libre', 'juego', 'deporte'],
    respuesta: 'Tiempo Libre y Recreación dura 3 años: planificación de propuestas recreativas, coordinación de grupos y eventos para todas las edades.' },
  { claves: ['turismo', 'guia', 'guía', 'turista'],
    respuesta: 'Guía de Turismo dura 3 años: patrimonio natural y cultural, circuitos turísticos, coordinación de grupos e idiomas.' },
];
const RESPUESTA_POR_DEFECTO = 'No tengo ese dato ahora. Podés consultarlo en la secretaría del instituto.';

function respuestaDeRespaldo(pregunta) {
  // Pasamos a minúsculas, sacamos tildes y signos, y agregamos espacios en los bordes
  // (así la clave ' ia ' solo coincide con la palabra "IA" suelta, no con "materia")
  const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const texto = ' ' + sinTildes(pregunta).replace(/[¿?¡!.,;:]/g, ' ') + ' ';
  const encontrada = PREGUNTAS_FRECUENTES.find((item) =>
    item.claves.some((clave) => texto.includes(sinTildes(clave)))
  );
  return encontrada ? encontrada.respuesta : RESPUESTA_POR_DEFECTO;
}

// ---------- 3. Armado de la ventana ----------
const contenedor = document.getElementById('chatbot');

if (contenedor) {
  contenedor.innerHTML = `
    <section class="chat" id="chat-ventana" aria-label="Asistente del ISFT 238" hidden>
      <header class="chat__cabecera">
        <div class="chat__titulo">
          <span class="chat__avatar" aria-hidden="true">238</span>
          <div>
            <strong>Asistente del 238</strong>
            <span>Respondo dudas sobre las carreras</span>
          </div>
        </div>
        <button class="chat__cerrar" type="button" aria-label="Cerrar el chat">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>
      <div class="chat__mensajes" aria-live="polite"></div>
      <div class="chat__sugerencias">
        <button type="button">¿Qué carreras hay?</button>
        <button type="button">¿Tiene costo?</button>
        <button type="button">¿Cómo me inscribo?</button>
        <button type="button">¿Dónde queda?</button>
      </div>
      <form class="chat__formulario">
        <label class="solo-lectores" for="chat-pregunta">Escribí tu pregunta</label>
        <input id="chat-pregunta" type="text" maxlength="${MAX_CARACTERES}" placeholder="Escribí tu pregunta…" autocomplete="off">
        <button class="chat__enviar" type="submit" aria-label="Enviar">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </form>
      <p class="chat__aviso">Respuestas generadas con IA. Ante cualquier duda, confirmá en secretaría.</p>
    </section>
    <button class="chat-boton" type="button" aria-expanded="false" aria-controls="chat-ventana">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
      <span>¿Dudas? Preguntame</span>
    </button>
  `;

  const ventana = contenedor.querySelector('.chat');
  const botonAbrir = contenedor.querySelector('.chat-boton');
  const botonCerrar = contenedor.querySelector('.chat__cerrar');
  const zonaMensajes = contenedor.querySelector('.chat__mensajes');
  const formulario = contenedor.querySelector('.chat__formulario');
  const campo = contenedor.querySelector('#chat-pregunta');
  const sugerencias = contenedor.querySelector('.chat__sugerencias');

  // Historial que le mandamos a la IA para que recuerde la charla
  const historial = [];
  let esperando = false;

  // ---------- 4. Mostrar mensajes ----------
  function agregarMensaje(texto, quien) {
    const burbuja = document.createElement('p');
    burbuja.className = `chat__mensaje chat__mensaje--${quien}`;
    burbuja.textContent = texto;          // textContent (no innerHTML): evita inyectar HTML
    zonaMensajes.appendChild(burbuja);
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
    return burbuja;
  }

  function mostrarEscribiendo() {
    const burbuja = agregarMensaje('', 'bot');
    burbuja.classList.add('chat__mensaje--escribiendo');
    burbuja.setAttribute('aria-label', 'El asistente está escribiendo');
    burbuja.innerHTML = '<span></span><span></span><span></span>';
    return burbuja;
  }

  agregarMensaje('¡Hola! Soy el asistente del ISFT 238. ¿Qué te gustaría saber sobre las carreras?', 'bot');

  // ---------- 5. Abrir y cerrar ----------
  function cambiarChat(abrir) {
    ventana.hidden = !abrir;
    botonAbrir.setAttribute('aria-expanded', String(abrir));
    contenedor.classList.toggle('chat-abierto', abrir);
    if (abrir) campo.focus();
    else botonAbrir.focus();
  }
  botonAbrir.addEventListener('click', () => cambiarChat(ventana.hidden));
  botonCerrar.addEventListener('click', () => cambiarChat(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ventana.hidden) cambiarChat(false);
  });

  // ---------- 6. Preguntar ----------
  async function pedirRespuesta(pregunta) {
    if (!URL_CHATBOT) return respuestaDeRespaldo(pregunta);
    try {
      const respuesta = await fetch(URL_CHATBOT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta, historial: historial.slice(-6) }),
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const datos = await respuesta.json();
      if (!datos.respuesta) throw new Error('Respuesta vacía');
      return datos.respuesta;
    } catch (error) {
      console.warn('Chatbot: uso respuestas de respaldo.', error);
      return respuestaDeRespaldo(pregunta);
    }
  }

  async function enviar(pregunta) {
    pregunta = pregunta.trim();
    if (!pregunta || esperando) return;
    esperando = true;
    campo.value = '';
    agregarMensaje(pregunta, 'usuario');
    const escribiendo = mostrarEscribiendo();

    const respuesta = await pedirRespuesta(pregunta);

    escribiendo.remove();
    agregarMensaje(respuesta, 'bot');
    historial.push({ role: 'user', content: pregunta }, { role: 'assistant', content: respuesta });
    esperando = false;
    campo.focus();
  }

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();               // evita que la página se recargue
    enviar(campo.value);
  });
  sugerencias.querySelectorAll('button').forEach((boton) => {
    boton.addEventListener('click', () => enviar(boton.textContent));
  });
}
