/* =========================================================
   ISFT N° 238 — Chatbot (Cloudflare Worker + Workers AI)
   ---------------------------------------------------------
   Este archivo NO va en la web: se pega en Cloudflare.
   Funciona como un pequeño servidor:
     1. La web le manda la pregunta del visitante (POST).
     2. El Worker le pasa la pregunta a un modelo de IA,
        junto con toda la información del instituto.
     3. Devuelve la respuesta a la web.
   Como el modelo corre dentro de Cloudflare (binding "AI"),
   no hace falta ninguna clave de API.
   ========================================================= */

// ---------- 1. Configuración ----------

// Modelo principal y modelo de respaldo (si el primero falla).
const MODELO = '@cf/google/gemma-4-26b-a4b-it';
const MODELO_RESPALDO = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';

// Desde qué sitios se puede usar el chatbot.
// '*' = desde cualquiera (cómodo para probar).
// Cuando la web esté publicada, conviene limitarlo, por ejemplo:
// const ORIGENES_PERMITIDOS = ['https://isft238.com.ar', 'https://www.isft238.com.ar'];
const ORIGENES_PERMITIDOS = ['*'];

const MAX_CARACTERES = 500;     // largo máximo de cada pregunta
const MAX_HISTORIAL = 6;        // cuántos mensajes anteriores recordamos
const MAX_TOKENS_RESPUESTA = 400;

// ---------- 2. Información del instituto ----------
// Todo lo que el chatbot "sabe". Si cambia algo, se edita acá.
// Los datos de las carreras salen de sus resoluciones.
const INFO_INSTITUTO = `
INSTITUTO: Instituto Superior de Formación Técnica N° 238 (ISFT 238).
Educación superior pública y gratuita de la Provincia de Buenos Aires: no se paga matrícula ni cuota.
Dirección: Luis Sáenz Peña 513, Camet Norte, partido de Mar Chiquita, provincia de Buenos Aires. Funciona en el edificio de la Escuela Primaria N° 30 (EP 30). Se llega por la Ruta 11, entre Mar del Plata y Santa Clara del Mar.
Inscripciones: están abiertas. Fecha de cierre: todavía no publicada.
Requisito general de ingreso: secundario completo. Las personas mayores de 25 años sin secundario pueden ingresar según el artículo 7 de la Ley 24.521 (Ley de Educación Superior). Para Enfermería, los requisitos se informan en secretaría.
Todas las carreras duran 3 años y otorgan título oficial.

DATOS QUE TODAVÍA NO TENEMOS (no inventarlos): fecha de cierre de inscripción, documentación a presentar, días y horarios de secretaría, días y horarios de cursada (salvo lo indicado), teléfono, email, nombres de docentes (salvo el indicado), fechas del calendario académico.

CARRERA 1: Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial (Res. 2730/22).
Título: Técnico/a Superior en Ciencia de Datos e Inteligencia Artificial. 3 años (6 cuatrimestres), 1408 horas reloj.
Modalidad: en 1° año, cada materia se cursa un día presencial y otro virtual.
Qué se aprende: preparar, explorar y analizar datos; estadística; modelos de Machine Learning (predicciones, sistemas de recomendación, segmentación); redes neuronales, visión por computadora, procesamiento de audio y texto (chatbots, reconocimiento del habla, traducción); visualización de datos.
Dónde trabajar: organizaciones o clientes propios, en captura y análisis de datos y en desarrollo y mantenimiento de soluciones de IA.
1° año: Lógica Computacional; Administración y Gestión de Bases de Datos; Elementos de Análisis Matemático; Estadística y Probabilidades para Gestión de Datos; Inglés para Ciencia de Datos e IA 1 y 2; Técnicas de Programación; Práctica Profesionalizante: Aproximación al Campo Laboral.
2° año: Desarrollo de Sistemas de IA; Modelizado de Minería de Datos; Técnicas de Procesamiento del Habla; Procesamiento de Aprendizaje Automático; Ciencia de Datos; Práctica Profesionalizante: Análisis y Exploración de Datos.
3° año: Gestión de Proyectos; Taller de Comunicación; Seminario de Actualización; Técnicas de Procesamiento Digital de Imágenes; Prácticas Profesionalizantes (Modelizado de Sistemas de IA y Proyecto Integrador); Tecnología y Ambiente; Trabajo, Tecnología y Sociedad.
Docente: Samuel Tocaimaza (Lógica Computacional y Técnicas de Programación).

CARRERA 2: Enfermería (Res. 854/16).
Título: Enfermero/a. 3 años, 2148 horas. Presencial.
Qué se aprende: brindar y gestionar cuidados de enfermería para promover la salud, prevenir enfermedades y acompañar la recuperación de personas, familias y comunidades, hasta cuidados intermedios. Foco en Atención Primaria de la Salud y trabajo comunitario.
Dónde trabajar: hospitales, clínicas, sanatorios, centros de salud, domicilios, instituciones educativas, equipos interdisciplinarios.
1° año: Psicología; Teorías Socioculturales de la Salud; Condiciones y Medio Ambiente del Trabajo; Salud Pública I; Biología Humana; Fundamentos del Cuidado; Cuidados de la Salud Centrados en la Comunidad y la Familia; Práctica Profesionalizante I.
2° año: Comunicación en Ciencias de la Salud; Inglés; Introducción a la Metodología de Investigación en Salud; Nutrición y Dietoterapia; Salud Pública II; Farmacología en Enfermería; Enfermería Materno Infantil; Enfermería del Adulto y del Adulto Mayor I; Práctica Profesionalizante II.
3° año: Organización y Gestión de Servicios de Enfermería; Aspectos Bioéticos y Legales de la Profesión; Enfermería en Salud Mental; Enfermería del Adulto y del Adulto Mayor II; Enfermería Comunitaria y Práctica Educativa en Salud; Enfermería en Emergencias y Catástrofes; Práctica Profesionalizante III.

CARRERA 3: Tecnicatura Superior en Gestión de Energías Renovables (Res. 2729/22, rectificada por Res. 6185/25).
Título: Técnico/a Superior en Gestión de Energías Renovables. 3 años, 1600 horas reloj. Presencial.
Qué se aprende: analizar recursos energéticos renovables (solar, eólica, etc.), proponer sistemas para aprovecharlos, evaluar su viabilidad, diseñar proyectos e instalaciones, desarrollar prototipos, interpretar ensayos, eficiencia energética, normas de calidad, seguridad y ambiente.
Dónde trabajar: producción, laboratorios, investigación, instalación y mantenimiento de equipos, gestión, comercialización, asesoramiento y peritajes.
1° año: Tecnología de los Materiales; Procesos Productivos Industriales; Gestión de la Energía; Circuitos y Mediciones Eléctricas; Comunicación; Introducción a las Prácticas Profesionalizantes; Prácticas Profesionalizantes para Aprovechamientos de Pequeña Envergadura.
2° año: Interpretación y Representación Gráfica; Control de Equipos e Instalaciones de Energías Renovables; Instalaciones Térmicas y de Fluidos; Instalaciones Sanitarias; Instalaciones Eléctricas; Laboratorio de Ensayos y Mediciones; Prácticas Profesionalizantes (Instalaciones de Baja Complejidad y Aprovechamientos de Mediana y Gran Envergadura).
3° año: Instalaciones de Energías Renovables; Gestión de Mantenimiento de Instalaciones y Equipos; Aprovechamiento de Energías Renovables; Gestión de Proyectos de Aprovechamientos; Prácticas Profesionalizantes (Gestión de Proyectos y Gestión de Mantenimiento); Trabajo, Tecnología y Sociedad.

CARRERA 4: Tecnicatura Superior en Tiempo Libre y Recreación (Res. 3783/22).
Título: Técnica/o Superior en Tiempo Libre y Recreación. 3 años, 1472 horas reloj. Presencial.
Qué se aprende: planificar, desarrollar y evaluar propuestas recreativas, coordinar grupos, organizar eventos lúdicos, actividades en la naturaleza; mirada inclusiva y de derechos.
Dónde trabajar: clubes, polideportivos, centros de jubilados, emprendimientos turísticos, hospitales, asociaciones de fomento, sindicatos, obras sociales, espacios comunitarios o de forma autónoma. El título NO habilita para ejercer como docente.
1° año: Taller de Abordaje de la ESI; Tiempo Libre y Recreación; Sujetos de la Recreación; Taller de Juegos y Actividades Recreativas; Taller de Artes Visuales; Taller de Expresión Corporal; Prácticas Profesionalizantes I.
2° año: Educación Ambiental; Historia Política; Coordinación de Grupos; Taller de Actividades Recreativas en Ambientes Naturales; Taller de Artes Musicales; Prácticas Profesionalizantes II.
3° año: Taller de Herramientas de Información y Comunicación; Organizaciones e Instituciones Recreativas; Diseño de Proyectos; Juegos y Deportes Alternativos; Taller Optativo (Teatro o Medios Audiovisuales); Taller de Prácticas Corporales Emergentes; Prácticas Profesionalizantes III.

CARRERA 5: Tecnicatura Superior en Guía de Turismo (Res. 2684/20).
Título: Técnico Superior en Guía de Turismo. 3 años, 1952 horas reloj. Presencial.
Qué se aprende: interpretar y transmitir el patrimonio natural y cultural, armar itinerarios y excursiones, coordinar grupos, asistir a turistas nacionales y extranjeros; inglés los 3 años más un idioma adicional; sostenibilidad y accesibilidad.
Dónde trabajar: organismos de turismo, oficinas de información turística, prestadores de servicios turísticos y de transporte, organizaciones culturales y deportivas, áreas protegidas, museos y sitios patrimoniales.
1° año: Inglés 1; Introducción al Turismo; Metodología de la Investigación y Técnicas de Relevamiento; Psicología de los Sujetos en Contexto; Interpretación del Espacio Turístico Ambiental de la Argentina; Interpretación del Patrimonio Turístico de la Argentina; Interpretación de las Transformaciones Sociales de la Argentina; Prácticas Profesionales.
2° año: Inglés 2; Idioma Adicional; TIC Aplicadas; Recreación y Animación Sociocultural; Interpretación del Espacio Turístico Local; Gestión de Circuitos Turísticos; Interpretación de las Manifestaciones Artísticas y Culturales; Prácticas Profesionales.
3° año: Inglés 3; Idioma Adicional; Legislación Turística; Interpretación del Espacio Turístico Ambiental Internacional; Interpretación del Patrimonio Turístico Internacional; Prácticas Profesionales.
`;

// ---------- 3. Instrucciones para la IA ----------
const INSTRUCCIONES = `Sos el asistente virtual del ISFT N° 238 de Camet Norte. Respondés dudas de futuros estudiantes.
Reglas:
- Respondé SOLO con la información de abajo. Si algo no está, decí que todavía no tenés ese dato y sugerí consultar en la secretaría del instituto. Nunca inventes fechas, horarios, teléfonos, nombres ni requisitos.
- Si preguntan algo que no tiene que ver con el instituto o sus carreras, explicá amablemente que solo podés ayudar con eso.
- Español rioplatense, con "vos", tono cálido y simple. Respuestas cortas: 2 a 5 oraciones, o una lista breve si enumerás materias.
- Texto plano, sin títulos ni negritas.
- Si alguien duda entre carreras, preguntale qué le interesa y orientalo.

INFORMACIÓN:
${INFO_INSTITUTO}`;

// ---------- 4. Funciones de ayuda ----------

// Encabezados CORS: le permiten a la web (otro dominio) hablar con el Worker
function encabezadosCors(origen) {
  const permitido = ORIGENES_PERMITIDOS.includes('*') || ORIGENES_PERMITIDOS.includes(origen);
  return {
    'Access-Control-Allow-Origin': permitido ? (ORIGENES_PERMITIDOS.includes('*') ? '*' : origen) : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function responderJson(datos, estado, origen) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...encabezadosCors(origen) },
  });
}

// Limpia el historial que manda la web: solo roles válidos, textos cortos, pocos mensajes
function limpiarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORIAL)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CARACTERES * 2) }));
}

// Los modelos devuelven la respuesta en formatos un poco distintos
function extraerTexto(resultado) {
  if (!resultado) return '';
  if (typeof resultado.response === 'string') return resultado.response;
  const choice = resultado.choices && resultado.choices[0];
  if (choice && choice.message && typeof choice.message.content === 'string') return choice.message.content;
  return '';
}

async function preguntarIA(env, modelo, mensajes) {
  const resultado = await env.AI.run(modelo, {
    messages: mensajes,
    max_tokens: MAX_TOKENS_RESPUESTA,
    temperature: 0.3,      // baja = respuestas más precisas, menos "creativas"
  });
  return extraerTexto(resultado).trim();
}

// ---------- 5. Punto de entrada del Worker ----------
export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';

    // El navegador primero pregunta "¿puedo?" con OPTIONS (preflight de CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: encabezadosCors(origen) });
    }
    if (request.method === 'GET') {
      return responderJson({ ok: true, mensaje: 'Chatbot del ISFT 238 funcionando.' }, 200, origen);
    }
    if (request.method !== 'POST') {
      return responderJson({ error: 'Método no permitido' }, 405, origen);
    }
    if (!ORIGENES_PERMITIDOS.includes('*') && !ORIGENES_PERMITIDOS.includes(origen)) {
      return responderJson({ error: 'Origen no permitido' }, 403, origen);
    }

    // Leemos la pregunta
    let datos;
    try {
      datos = await request.json();
    } catch {
      return responderJson({ error: 'JSON inválido' }, 400, origen);
    }
    const pregunta = typeof datos.pregunta === 'string' ? datos.pregunta.trim() : '';
    if (!pregunta) return responderJson({ error: 'Falta la pregunta' }, 400, origen);
    if (pregunta.length > MAX_CARACTERES) {
      return responderJson({ error: `La pregunta puede tener hasta ${MAX_CARACTERES} caracteres` }, 400, origen);
    }

    // Armamos la conversación: instrucciones + historial + pregunta nueva
    const mensajes = [
      { role: 'system', content: INSTRUCCIONES },
      ...limpiarHistorial(datos.historial),
      { role: 'user', content: pregunta },
    ];

    // Probamos con el modelo principal y, si falla, con el de respaldo
    for (const modelo of [MODELO, MODELO_RESPALDO]) {
      try {
        const respuesta = await preguntarIA(env, modelo, mensajes);
        if (respuesta) return responderJson({ respuesta }, 200, origen);
      } catch (error) {
        console.log(`Falló ${modelo}:`, error && error.message);
      }
    }
    // Si ninguno respondió (por ejemplo, se agotó el cupo gratuito del día)
    return responderJson({ error: 'La IA no está disponible en este momento' }, 503, origen);
  },
};
