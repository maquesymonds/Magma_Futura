// js/ui/parallax-lite.js
// Parallax liviano basado en mousemove, sin interferir con scroll ni con sections.js.
//No esta funcionando mucho, me gustaria hacerlo funcionar mejor para la proxima entrega.

export function initParallaxLite({
  selector = '[data-parallax]',
  baseStrength = 20,
  onlyWhenOverlay = false,
} = {}) {
  const elems = Array.from(document.querySelectorAll(selector));
  if (!elems.length) return;

  let mouseX = 0;
  let mouseY = 0;
  let ticking = false;

  function applyParallax() {
    ticking = false;

    elems.forEach((el) => {
      const depth = parseFloat(el.dataset.parallaxDepth || '1');
      const strength = baseStrength * depth;

      const x = -mouseX * strength;
      const y = -mouseY * strength;

      el.style.willChange = 'transform';
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  function onMove(e) {
    if (onlyWhenOverlay) {
      const hasOverlay = document.body.classList.contains('overlay-open');
      if (!hasOverlay) return;
    }

    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;

    mouseX = nx;
    mouseY = ny;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }

  window.addEventListener('mousemove', onMove, { passive: true });

  console.log('[parallax-lite] inicializado sobre', elems.length, 'elementos.');
}
