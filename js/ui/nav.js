// js/ui/nav.js
// Manejo de navegación con transición blanca antes del cambio de ruta.

export function initNav() {
  const nav = document.querySelector('.menu');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a,button');
    if (!a) return;

    const key = a.getAttribute('data-link');
    if (!key) return;

    e.preventDefault();

    const overlay = document.getElementById('page-transition');
    if (!overlay) return;

    // Activa la transición blanca
    overlay.classList.add('pt-active');

    // Cambio de ruta tras el retardo de transición
    setTimeout(() => {
      location.hash = `/${key}`;
    }, 800);
  });
}

