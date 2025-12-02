// js/effects/smooth-scroll.js
//No lo estoy usando por ahora

let scrollEl = null;   // el <div id="panel">
let animEl   = null;   // el <div class="panel-scroll">
let current  = 0;
let target   = 0;
let velocity = 0;

let raf = null;
let enabled = false;

// parámetros de "peso"
const strength = 0.22;   // qué tan fuerte responde al scroll
const damping  = 0.08;   // cuánto tarda en frenar (más bajo = más inercia)
const inertia  = 0.18;   // cuánto sigue moviéndose después

export function initSmoothScroll(panelEl, wrapperEl) {
  // si ya está activo, no hacer nada
  if (enabled) return;

  if (!panelEl || !wrapperEl) {
    console.warn('smooth-scroll: faltan elementos', panelEl, wrapperEl);
    return;
  }

  enabled = true;

  scrollEl = panelEl;
  animEl   = wrapperEl;

  animEl.style.willChange = 'transform';

  current = target = scrollEl.scrollTop;
  velocity = 0;

  scrollEl.addEventListener('scroll', onScroll, { passive: true });

  loop();
}

function onScroll() {
  // objetivo = scroll real del panel
  target = scrollEl.scrollTop;
}

function loop() {
  if (!enabled || !scrollEl || !animEl) return;

  const diff = target - current;

  // simulamos "peso"
  velocity += diff * strength;
  velocity *= (1 - damping);
  current  += velocity * (1 + inertia);

  animEl.style.transform = `translateY(${-current}px)`;

  raf = requestAnimationFrame(loop);
}

export function destroySmoothScroll() {
  if (!enabled) return;
  enabled = false;

  if (raf) cancelAnimationFrame(raf);
  raf = null;

  if (animEl) {
    animEl.style.transform = '';
    animEl.style.willChange = '';
  }

  if (scrollEl) {
    scrollEl.removeEventListener('scroll', onScroll);
  }

  scrollEl = null;
  animEl   = null;
  current  = 0;
  target   = 0;
  velocity = 0;
}
