/* =========================================================
   ISFT N° 238 — Comportamiento del sitio
   ---------------------------------------------------------
   JavaScript "vanilla" (sin librerías). Se carga con "defer",
   así que corre cuando el HTML ya está listo.
   ========================================================= */

// ---------- 1. Menú para celulares (botón hamburguesa) ----------
const botonMenu = document.querySelector('.menu-boton');
const menu = document.querySelector('#menu-principal');

if (botonMenu && menu) {
  // Abre o cierra el menú y avisa el estado a lectores de pantalla (aria-expanded)
  const cambiarMenu = (abrir) => {
    menu.classList.toggle('abierto', abrir);
    botonMenu.setAttribute('aria-expanded', String(abrir));
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  };

  botonMenu.addEventListener('click', () => {
    const estaAbierto = botonMenu.getAttribute('aria-expanded') === 'true';
    cambiarMenu(!estaAbierto);
  });

  // Al tocar un enlace del menú, lo cerramos (si no, tapa la sección destino)
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => cambiarMenu(false));
  });

  // La tecla Escape también cierra el menú
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
      cambiarMenu(false);
      botonMenu.focus();
    }
  });

  // Si la ventana se agranda a tamaño escritorio, reseteamos el estado
  const escritorio = window.matchMedia('(min-width: 960px)');
  escritorio.addEventListener('change', (e) => { if (e.matches) cambiarMenu(false); });
}

// ---------- 2. Sombra en el encabezado al hacer scroll ----------
const encabezado = document.querySelector('.encabezado');
if (encabezado) {
  const actualizarSombra = () => {
    encabezado.classList.toggle('con-sombra', window.scrollY > 8);
  };
  window.addEventListener('scroll', actualizarSombra, { passive: true });
  actualizarSombra();
}

// ---------- 3. Año actual en el pie de página ----------
document.querySelectorAll('[data-anio]').forEach((elemento) => {
  elemento.textContent = new Date().getFullYear();
});

// ---------- 4. Chatbot ----------
// El chatbot está en su propio archivo: js/chatbot.js
// (la IA corre en Cloudflare: ver la carpeta worker/)
