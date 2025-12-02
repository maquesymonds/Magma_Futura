// js/ui/sections/contacto.js
// Sección "Contacto": formulario y datos de contacto de Magma Futura.

import imgContacto from '../../../assets/contacto/contacto.png?url';

// Construye el layout base de la página de contacto
function build () {
  const el = document.createElement('section');
  el.className = 'page page-contacto';

  el.innerHTML = `
    <div class="contacto-wrap">
      <div class="ct-info">
        <p class="ct-line">+598 000 000 000</p>
        <p class="ct-line">+598 000 000 000</p>
        <p class="ct-line">
          <a href="mailto:futura@espaciomagma.com">futura@espaciomagma.com</a>
        </p>
      </div>

      <div class="contacto-main">
        <figure class="ct-media">
          <img src="${imgContacto}" alt="Magma Futura — contacto">
        </figure>

        <div class="ct-formcol">
          <p class="ct-intro">
            Escribinos por cualquier evento que quieras llevar a cabo en nuestro local
          </p>

          <form class="ct-form" action="#" method="post" novalidate>
            <label class="ct-label" for="c-nombre">NOMBRE</label>
            <input class="ct-input" id="c-nombre" type="text"
                   placeholder="Joaquín Rodríguez" required>

            <label class="ct-label" for="c-email">EMAIL</label>
            <input class="ct-input" id="c-email" type="email"
                   placeholder="federicarodriguez@gmail.com" required>

            <label class="ct-label" for="c-msg">MENSAJE</label>
            <textarea class="ct-textarea" id="c-msg"
                      placeholder="Escribir algo..." rows="5"></textarea>

            <button class="ct-submit" type="submit">ENVIAR MENSAJE</button>
          </form>
        </div>
      </div>

      <div class="ct-social-row">
        <div class="ct-social">
          <div class="ct-social-title">Seguinos</div>
          <div class="ct-social-links">
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="LinkedIn">LN</a>
            <a href="#" aria-label="TikTok">TK</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Estrella + título abajo izquierda -->
    <div class="ct-title-bottom-wrap">
      <span class="ct-star"></span>
      <h1 class="ct-title-bottom page-title">CONTACTANOS</h1>
    </div>
  `;

  return el;
}

export default {
  id: 'contacto',
  title: 'Contacto',

  render (target) {
    // Panel de contacto con padding específico
    target.classList.add('page-contacto-panel');

    // Oculta el footer global mientras contacto está abierto
    document.body.classList.add('contacto-open');

    const section = build();
    target.appendChild(section);

    // Efecto flotante en la imagen principal
    const img = target.querySelector('.ct-media img');
    if (img) {
      img.classList.add('floating');
    }
  },

  destroy (target) {
    if (target) {
      target.classList.remove('page-contacto-panel');
    }
    document.body.classList.remove('contacto-open');
  }
};
