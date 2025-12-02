// js/ui/page-transition.js
// Transitions del panel 2D + whoosh

function getAudioCtl() {
  return window.audioCtl || null;
}

export function transitionTo(hash) {
  const overlay = document.getElementById('page-transition');

  // Whoosh GENERAL para navegación 2D del header
  try {
    const ctl = getAudioCtl();
    // usamos whoosh de foyer como genérico (índice 1)
    ctl?.playWhoosh(1, { vol: 0.8 });
  } catch (e) {
    console.warn('Whoosh error:', e);
  }

  // Si no existe overlay, cambiamos de ruta directo
  if (!overlay) {
    location.hash = hash;
    return;
  }

  // Encender overlay (fade a blanco)
  overlay.classList.add('pt-active');

  // Cambiar de ruta luego del fade-in
  setTimeout(() => {
    location.hash = hash;
  }, 400);
}

export function finishTransition() {
  const overlay = document.getElementById('page-transition');
  if (!overlay) return;

  // Fade-out del overlay
  requestAnimationFrame(() => {
    overlay.classList.remove('pt-active');
  });
}
