// js/ui/sections/evento-detalle.js
// Sección de detalle de evento: muestra contenido largo por slug.

import { bySlug } from '../data/events.js';

// Construye el layout base del detalle
function build(ev) {
  const el = document.createElement('section');
  el.className = 'page page-evento';

  el.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/pasados">←</a>

      <header class="evento-head">
        <h1 class="evento-title italic">${ev.title}</h1>
        ${ev.subtitle ? `<h2 class="evento-sub">${ev.subtitle}</h2>` : ''}
      </header>

      <div class="evento-flow" id="flow"></div>
    </div>
  `;
  return el;
}

// Convierte bloques de contenido en HTML
function blockToHTML(b) {
  if (b.type === 'text') {
    return `<section class="flow-block text">${b.html}</section>`;
  }
  if (b.type === 'img') {
    return `
      <figure class="flow-block img">
        <img src="${b.src}" alt="${b.alt ?? ''}" loading="lazy"/>
        ${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}
      </figure>
    `;
  }
  if (b.type === 'imgText') {
    const extraClass = b.class ? ` ${b.class}` : '';
    return `
      <section class="flow-block imgText${extraClass}">
        <figure><img src="${b.src}" alt="${b.alt ?? ''}" loading="lazy"/></figure>
        <div class="copy">${b.html}</div>
      </section>
    `;
  }
  return '';
}

// Fade-in suave de bloques al hacer scroll
function initSmoothReveal(section) {
  const blocks = section.querySelectorAll('.flow-block, .imgText');
  if (!blocks.length) return;

  // Base visible para evitar pantallas en blanco
  blocks.forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
    el.style.transition = 'none';
  });

  // Aplicar transición sólo cuando los bloques entran en viewport
  window.addEventListener('scroll', () => {
    blocks.forEach(el => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = rect.top < vh * 0.95 && rect.bottom > 0;
      if (visible) {
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }
    });
  });
}

export default {
  id: 'evento',

  render(target, { slug } = {}) {
    const ev = bySlug(slug);
    const container = document.createElement('div');

    // Fallback si el slug no existe
    if (!ev) {
      container.innerHTML = `
        <section class="page page-evento">
          <div class="page">
            <a class="back-link" href="#/pasados">← Eventos pasados</a>
            <h1 class="evento-title italic">No encontrado</h1>
            <p>El evento que buscás no existe o fue renombrado.</p>
          </div>
        </section>`;
      target.appendChild(container.firstElementChild);
      return;
    }

    const section = build(ev);
    target.appendChild(section);

    const flow = section.querySelector('#flow');
    flow.innerHTML = (ev.blocks ?? []).map(blockToHTML).join('');

    // Inicializa la animación de entrada de bloques
    requestAnimationFrame(() => initSmoothReveal(section));
  },

  destroy() {}
};
