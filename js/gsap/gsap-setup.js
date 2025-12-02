// js/gsap/gsap-setup.js
// Configuración base de GSAP: fade-in inicial de la web.

import { gsap } from 'gsap';

console.log('gsap-setup.js cargado');

export function initGsapBase() {
  console.log('initGsapBase() llamado');

  gsap.set('body', { opacity: 0 });
  gsap.to('body', { opacity: 1, duration: 0.6, ease: 'power2.out' });

  console.log('GSAP listo');
}
