// js/ui/sections/pasados.js
// Sección "Eventos pasados": lista filtrable de eventos por año.

import { EVENTS, byYear } from '../data/events.js';

const YEARS = [2025, 2024, 2023, 2022];

// Sanitiza strings para uso en atributos HTML
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

// Construcción del layout base de la sección
function build(){
  const root = document.createElement('section');
  root.className = 'page page-pasados';

  root.innerHTML = `
    <div class="pasados-hero">
      <div class="pasados-hero-inner">
        <div class="pasados-title-wrap">
          <span class="pasados-icon"></span>
          <h1 class="page-title">EVENTOS PASADOS</h1>
        </div>
      </div>
    </div>

    <div class="page pasados-inner">
      <div class="page-tools" style="margin-bottom:18px;">
        <div class="year-dd">
          <button class="year-btn" id="yearBtn">Todos ▾</button>
          <div class="year-list" id="yearList">
            ${YEARS.map(y => `<button data-y="${y}">${y}</button>`).join('')}
          </div>
        </div>
      </div>

      <hr style="border:none;margin:0 0 24px;" />
      <div class="cards" id="cards"></div>
    </div>
  `;
  return root;
}

// Lógica dinámica de filtros y pintado de tarjetas
function enhance(section){
  const cardsEl  = section.querySelector('#cards');
  const btn      = section.querySelector('#yearBtn');
  const list     = section.querySelector('#yearList');

  let filter = 'all';

  btn.addEventListener('click', () => {
    list.classList.toggle('show');
  });

  list.addEventListener('click', (e) => {
    const y = e.target.closest('button')?.dataset.y;
    if (!y) return;

    filter = y;
    btn.textContent = `${y} ▾`;
    list.classList.remove('show');
    paint();
  });

  // HTML individual de cada tarjeta de evento
  function cardHTML(ev){
    return `
      <article class="card">
        <a class="card-link" href="#/evento/${ev.slug}" aria-label="${escapeHtml(ev.title)}">
          <div class="card-meta">(${ev.date})</div>
          <div class="card-media">
            <img src="${ev.cover}" alt="${escapeHtml(ev.title)}" loading="lazy"
              onerror="this.style.display='none'; this.nextElementSibling?.classList.add('ph')" />
            <div></div>
          </div>
          <h3 class="card-title">${ev.title}</h3>
          <p class="card-desc">${ev.desc ?? ''}</p>
        </a>
      </article>
    `;
  }

  // Render según filtro actual
  function paint(){
    const data = byYear(filter);
    cardsEl.innerHTML = data.map(cardHTML).join('');
  }

  paint();
}

// API para el router
export default {
  id: 'pasados',
  title: 'Eventos pasados',

  render(target){
    document.body.classList.add('overlay-open');
    target.classList.add('page-pasados');

    const section = build();
    target.appendChild(section);
    enhance(section);
  },

  destroy(target){
    document.body.classList.remove('overlay-open');
    if (target) target.classList.remove('page-pasados');
  }
};
