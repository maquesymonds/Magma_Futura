// js/gsap/evento-animations.js
// Animación sin ScrollTrigger para mejorar performance.

import { gsap } from "gsap";

/**
 * Revela los bloques del evento sin usar scroll,
 * sin triggers, sin loops y sin refresh.
 */
export function animateEventoBlocks(rootEl) {
  const page = rootEl || document.querySelector(".page.page-evento");
  if (!page) return;

  const blocks = page.querySelectorAll(".flow-block, .imgText");
  if (!blocks.length) return;

  // Estado inicial
  gsap.set(blocks, { opacity: 0, y: 40 });

  // Animación secuenciada
  blocks.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
      delay: i * 0.1,
      clearProps: "transform,opacity"
    });
  });

  console.log("Evento animations initialized (ScrollTrigger OFF)");
}
