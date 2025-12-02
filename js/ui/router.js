// js/ui/router.js
// Router del panel 2D: resuelve rutas por hash y monta las secciones HTML.

import * as Sections from './sections/index.js';
import { attachPanelFooter } from './panelFooter.js';
import { initSmoothScroll, destroySmoothScroll } from '../effects/smooth-scroll.js';

let current = null;
let panelEl = null;

// Mapa de rutas simples a módulos de sección
const routes = {
  agenda:   Sections.agenda,
  pasados:  Sections.pasados,
  ahora:    Sections.ahora,
  vision:   Sections.vision,
  contacto: Sections.contacto,
  // dinámico: 'evento/:slug'
};

export function initRouter() {
  panelEl = document.getElementById('panel');
  window.addEventListener('hashchange', onRoute);
  onRoute();
}

// Resuelve el hash actual y decide qué sección renderizar
async function onRoute() {
  const key = (location.hash.replace(/^#\/?/, '') || '').toLowerCase();

  // Si la intro está visible, no se abre el panel 2D
  const introVisible = !document.getElementById('intro')?.classList.contains('hidden');
  if (introVisible) return;

  let mod = null;
  let props = null;

  if (key.startsWith('evento/')) {
    mod = Sections.eventoDetalle;
    props = { slug: key.slice('evento/'.length) };
  } else {
    mod = routes[key] ?? null;
  }

  if (!mod) { 
    closePanel(); 
    return; 
  }

  renderSection(mod, props);
}

// Monta una sección en el panel, incluyendo footer y estados globales de UI
function renderSection(mod, props) {
  // Destruir la sección previa si define destroy()
  current?.destroy?.();

  // Mostrar panel
  panelEl.classList.remove('hidden');
  panelEl.innerHTML = '';
  current = mod;

  // Render específico de cada sección
  if (typeof current.render === 'function') current.render(panelEl, props ?? {});

  // Footer dinámico común
  attachPanelFooter(panelEl);

  // Asegurar UI visible
  document.getElementById('siteHeader')?.classList.remove('hidden');
  document.getElementById('bottomNav')?.classList.remove('hidden');
  document.getElementById('titles')?.classList.remove('hidden');

  // Limpiar estilos inline previos del panel
  panelEl.style.opacity = '';
  panelEl.style.transform = '';

  // Activar modo overlay (header blanco, 3D en pausa)
  document.body.classList.add('overlay-open');
  document.dispatchEvent(new CustomEvent('overlay:open'));

  // Activar smooth scroll solo en modo 2D
  initSmoothScroll();

  // Fade-out suave del overlay blanco de transición
  const overlay = document.getElementById('page-transition');
  if (overlay) {
    requestAnimationFrame(() => {
      overlay.classList.remove('pt-active');
    });
  }
}

// Cierra el panel 2D y restaura el estado base del entorno 3D
export function closePanel() {
  if (!panelEl) return;

  // Ocultar panel
  panelEl.classList.add('hidden');
  panelEl.innerHTML = '';
  current = null;

  // Restaurar UI base
  document.body.classList.remove('overlay-open');
  document.getElementById('titles')?.classList.remove('hidden');
  document.getElementById('bottomNav')?.classList.remove('hidden');
  document.getElementById('siteHeader')?.classList.remove('hidden');

  // Desactivar smooth scroll al volver al 3D
  destroySmoothScroll();

  // Avisar al core 3D que se cerró el overlay
  document.dispatchEvent(new CustomEvent('overlay:close'));
}
