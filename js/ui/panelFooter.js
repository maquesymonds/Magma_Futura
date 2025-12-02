// js/ui/panelFooter.js
// Inserta el footer estándar dentro de un panel si no existe.

export function attachPanelFooter(panelEl){
  if (panelEl.querySelector('.panel-footer')) return;

  const footer = document.createElement('footer');
  footer.className = 'panel-footer';

  footer.innerHTML = `
    <div class="pf-wrap">

      <div class="pf-col pf-left">
        <div class="pf-powered">Impulsado por Espacio Magma.</div>
        <a href="mailto:futura@espaciomagma.com" class="pf-link">futura@espaciomagma.com</a><br>
        <a href="tel:+59898000000" class="pf-link">+598 980 00 00</a>
        <div class="pf-address">
          Dr. Pablo de María 1011<br>
          Montevideo, Uruguay
        </div>
      </div>

      <div class="pf-col pf-center">
        <a href="#" class="pf-terms">Términos y Condiciones</a>
      </div>

      <div class="pf-col pf-right">
        <div class="pf-social-title">Nuestras redes</div>
        <nav class="pf-social-links">
          <a class="pf-social-item" 
             href="https://www.instagram.com/magmafutura/?hl=en"
             target="_blank"
             aria-label="Instagram">
            <span class="pf-star">✺</span> IG
          </a>
          <a class="pf-social-item" 
             href="https://www.linkedin.com/company/magma-futura/"
             target="_blank"
             aria-label="LinkedIn">
            <span class="pf-star">✺</span> LN
          </a>
        </nav>
      </div>

    </div>
  `;

  panelEl.appendChild(footer);
}
