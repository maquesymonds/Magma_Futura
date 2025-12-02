// js/ui/sections/ahora.js

import imgNave      from '../../../assets/ahora/nave.png?url';
import imgPecera    from '../../../assets/ahora/pecera.png?url';
import imgVideoWall from '../../../assets/ahora/videowall.png?url';
import artistImg    from '../../../assets/ahora/brianmackern.jpg?url';

function build() {
  const CONT = document.createElement('section');
  CONT.className = 'page page-ahora';

  CONT.innerHTML = `
    <!-- HERO -->
    <div class="ahora-hero">
      <div class="ahora-hero-inner">
        <div class="ahora-title-wrap">
          <span class="ahora-icon"></span>
          <h1 class="page-title">ACTUALMENTE</h1>
        </div>
      </div>
    </div>

    <!-- GRID SALAS -->
    <div class="ahora-grid">
      <article class="ah-card">
        <h2 class="ah-loc">NAVE</h2>
        <img class="ah-media" src="${imgNave}" alt="Nave" />
        <h3 class="ah-title">mundo[>.<]interior// backup! v.4</h3>
        <p class="ah-meta">
          Artista: Brian Mackern<br>
          Curadora: Valentina Montero
        </p>
      </article>

      <article class="ah-card">
        <h2 class="ah-loc">PECERA</h2>
        <img class="ah-media" src="${imgPecera}" alt="Pecera" />
        <h3 class="ah-title">mundo[>.<]interior// backup! v.4</h3>
        <p class="ah-meta">
          Artista: Brian Mackern<br>
          Curadora: Valentina Montero
        </p>
      </article>

      <article class="ah-card">
        <h2 class="ah-loc">VIDEOWALL</h2>
        <img class="ah-media" src="${imgVideoWall}" alt="Video wall" />
        <h3 class="ah-title">mundo[>.<]interior// backup! v.4</h3>
        <p class="ah-meta">
          Artista: Brian Mackern<br>
          Curadora: Valentina Montero
        </p>
      </article>
    </div>

    <!-- DETALLE OBRA / ARTISTA -->
    <div class="ah-detail">

      <!-- OBRA -->
      <section class="vf-section vf-row">
        <div class="vf-col-left">
          <h2 class="vf-title">OBRA</h2>
        </div>

        <div class="vf-col-right">
          <p>
            <em>mundo[>.<]interior// backup! v.4</em> es una obra que trabaja
            con archivos, memoria y residuo digital, reconfigurando materiales
            de la cultura de red en un entorno audiovisual inmersivo.
          </p>
          <p>
            La instalación despliega capas de imagen y sonido que funcionan
            como un “backup” afectivo: fragmentos de interfaces, glitches,
            textos y rastros de navegación que se remezclan para construir
            una experiencia entre la arqueología de Internet y la poesía
            electrónica.
          </p>
        </div>
      </section>

      <hr class="vf-divider">

      <!-- ARTISTA -->
      <section class="vf-section vf-row">
        <div class="vf-col-left">
          <h2 class="vf-title">ARTISTA</h2>
        </div>

        <div class="vf-col-right vf-team">
          <div class="vf-team-text">
            <p>
              Brian Mackern es un artista uruguayo que ha desarrollado la mayor
              parte de su producción en el área de la net.art y el sound art.
            </p>
            <p>
              Desde 1999 realiza trabajos como video-data jockey, explorando
              experimentos musicales con proyecciones y datos, y colaborando con
              artistas sonoros y músicos. Ha compuesto música para teatro, video
              y cine, y ha diseñado entornos sonoros para performances.
            </p>
            <p>
              Es docente en la Escuela de Bellas Artes de la Universidad de la
              República. Ha recibido premios como el primer premio en el
              50º Salón Nacional de Artes Visuales (Montevideo, 2002), el premio
              “Best Multimedia Author” en el XI Canarias Mediafest (Las Palmas
              de Gran Canaria, 2004) y el premio “Apoyo a la Producción Artística”
              MAD03 (Madrid, 2003), entre otros.
            </p>
          </div>

          <img
            src="${artistImg}"
            alt="Brian Mackern"
            class="vf-team-img ah-artist-img"
          />
        </div>
      </section>

    </div>
  `;

  return CONT;
}

export default {
  id: 'ahora',
  title: 'Expuesto actualmente',
  render(target) {
    document.body.classList.add('overlay-open');
    target.classList.add('page-ahora');

    const section = build();
    target.appendChild(section);
  },
  destroy() {
    document.body.classList.remove('overlay-open');
  }
};
