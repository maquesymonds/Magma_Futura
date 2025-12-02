// js/ui/cursor.js
// Cursor personalizado con seguimiento suavizado.

import { gsap } from 'gsap';

export function initCustomCursor() {
  // Elemento base del cursor
  const cursor = document.createElement('div');
  cursor.classList.add('cursor');
  document.body.appendChild(cursor);

  // Posición real e interpolada
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let posX = mouseX;
  let posY = mouseY;

  // Factor de suavizado del seguimiento
  const smoothing = 0.18;

  // Interpolación por frame
  gsap.ticker.add(() => {
    posX += (mouseX - posX) * smoothing;
    posY += (mouseY - posY) * smoothing;
    gsap.set(cursor, { x: posX, y: posY });
  });

  // Actualización de la posición real del puntero
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  console.log('Custom cursor initialized');
}
