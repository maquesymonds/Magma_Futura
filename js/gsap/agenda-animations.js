// js/gsap/agenda-animations.js
// Animaciones de la agenda: flip en hover y acento de color desde la imagen.

import { gsap } from 'gsap';

/* -------------------------------------------
   Flip en hover
------------------------------------------- */
function initAgendaCardFlips() {
  const cards = document.querySelectorAll('.page-agenda .ag-card');
  if (!cards.length) return;

  cards.forEach((card) => {
    const stage = card.querySelector('.ag-card__stage');
    if (!stage) return;

    stage.addEventListener('mouseenter', () => {
      card.classList.add('is-flipped');
      card.setAttribute('aria-expanded', 'true');
    });

    stage.addEventListener('mouseleave', () => {
      card.classList.remove('is-flipped');
      card.setAttribute('aria-expanded', 'false');
    });
  });
}

/* -------------------------------------------
   Color desde imagen (dorso de la card)
------------------------------------------- */
function initCardAccentColors() {
  const cards = document.querySelectorAll('.page-agenda .ag-card');
  if (!cards.length) return;

  const tmpCanvas = document.createElement('canvas');
  const ctx =
    tmpCanvas.getContext('2d', { willReadFrequently: true }) ||
    tmpCanvas.getContext('2d');

  // Conversión RGB → HSL
  const toHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, l };
  };

  // Selecciona un color acento “neón” desde la imagen
  const pickAccent = (imgEl) => {
    const nW = imgEl.naturalWidth || 0;
    const nH = imgEl.naturalHeight || 0;
    if (nW < 2 || nH < 2) return null;

    const w = Math.max(16, Math.min(64, nW));
    const h = Math.max(16, Math.min(64, nH));
    tmpCanvas.width = w;
    tmpCanvas.height = h;

    try {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(imgEl, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let bestScore = -1;
      let bestRGB = null;

      // Muestreo en rejilla
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 200) continue;

          const rn = r / 255;
          const gn = g / 255;
          const bn = b / 255;

          const vmax = Math.max(rn, gn, bn);
          const vmin = Math.min(rn, gn, bn);
          const v = vmax;
          const d = vmax - vmin;
          const s = vmax === 0 ? 0 : d / vmax;

          const score = s * v; // saturación * brillo

          if (score > bestScore) {
            bestScore = score;
            bestRGB = { r, g, b };
          }
        }
      }

      if (!bestRGB) return null;

      // Ajuste tipo “neón” en HSL
      const { h: H, s: S, l: L } = toHsl(bestRGB.r, bestRGB.g, bestRGB.b);
      const sBoost = Math.min(1, S * 1.3 + 0.2);
      const lClamp = Math.min(0.6, Math.max(0.35, L));
      const hDeg = Math.round((H || 0) * 360);

      return `hsl(${hDeg}deg ${Math.round(sBoost * 100)}% ${Math.round(
        lClamp * 100
      )}%)`;
    } catch (err) {
      // getImageData puede fallar si el canvas está tainted
      return null;
    }
  };

  const applyAccent = (card) => {
    const img = card.querySelector('.ag-face--front img');
    const back = card.querySelector('.ag-face--back');
    if (!img || !back) return;

    const apply = () => {
      const accent = pickAccent(img);
      if (!accent) return;

      back.style.background = accent;
      back.style.borderColor = 'rgba(255,255,255,.12)';
      back.style.color = '#fff';

      const title = back.querySelector('.ag-title');
      const desc = back.querySelector('.ag-desc');

      if (title) title.style.color = '#fff';
      if (desc) desc.style.color = 'rgba(255,255,255,.92)';
    };

    if (img.complete && img.naturalWidth > 0) {
      if (img.decode) {
        img.decode().then(apply).catch(apply);
      } else {
        apply();
      }
    } else {
      img.addEventListener(
        'load',
        () => {
          if (img.decode) img.decode().then(apply).catch(apply);
          else apply();
        },
        { once: true }
      );

      img.addEventListener(
        'error',
        () => {
          // sin tratamiento especial en error
        },
        { once: true }
      );
    }
  };

  cards.forEach(applyAccent);
}

/* -------------------------------------------
   Animación general de la grilla (sin ScrollTrigger)
------------------------------------------- */
export function animateAgendaCards() {
  const grid = document.querySelector('.agenda-grid');
  const cards = document.querySelectorAll('.ag-card');
  if (!grid || !cards.length) return;

  // Estado base visible
  gsap.set(cards, { opacity: 1, y: 0 });

  // Colores del dorso
  initCardAccentColors();

  // Efecto flip en hover
  initAgendaCardFlips();

  console.log('Agenda animations initialized (ScrollTrigger OFF)');
}
