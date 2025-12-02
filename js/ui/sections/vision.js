// js/pages/vision.js

import img1 from '../../../assets/vision/vision1.webp?url';
import img2 from '../../../assets/vision/vision2.webp?url';
import img3 from '../../../assets/vision/vision3.webp?url';
import img4 from '../../../assets/vision/vision4.webp?url';
import img5 from '../../../assets/vision/vision5.webp?url';
import img6 from '../../../assets/vision/vision6.webp?url';

import teamImg from '../../../assets/equipo.jpg?url';

// Cada imagen con su “preset” de tamaño
const SLIDES = [
  { src: img1, size: 'sq' },
  { src: img2, size: 'wide' },
  { src: img3, size: 'tall' },
  { src: img4, size: 'wide' },
  { src: img5, size: 'tall' },
  { src: img6, size: 'wide' },
];

// Logos de clientes: import automatico de todas las imágenes de la carpeta 
const CLIENT_LOGOS = import.meta.glob(
  '../../../assets/vision/clientes/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
);

const LOGO_LIST = Object.values(CLIENT_LOGOS);

function build () {
  const el = document.createElement('section');
  el.className = 'page page-vision';

  el.innerHTML = `
    <!-- HERO VISIÓN -->
    <div class="vision-hero">
      <div class="vision-hero-inner">

        <div class="vision-hero-left">
          <div class="vision-title-wrap">
            <span class="vision-icon" aria-hidden="true"></span>
            <h1 class="page-title">VISIÓN</h1>
          </div>
        </div>

        <div class="vision-hero-right">
          <p class="vision-text-intro">
            Magma Futura es un laboratorio donde arte, tecnología y diseño se encuentran
            para producir experiencias que expanden la percepción y difuminan los
            límites entre lo físico y lo digital.
            <br><br>
            Somos un espacio phygital: una galería, una sala inmersiva y un lugar 
            de investigación donde experimentamos con nuevos lenguajes sensoriales,
            visuales y conceptuales.
            <br><br>
            Exploramos futuros posibles a través de la creación, la interdisciplina 
            y la tecnología como herramienta poética.
          </p>
        </div>

      </div>
    </div>

    <!-- MARQUEE -->
    <div class="vc-marquee full-bleed" data-speed="32">
      <div class="vc-track">
        ${[...SLIDES, ...SLIDES].map(({ src, size }, i) => `
          <figure class="vc-item is-${size}" aria-hidden="${i >= SLIDES.length}">
            <img src="${src}" alt="Visión ${i + 1}">
          </figure>
        `).join('')}
      </div>
    </div>

    <!-- CÓMO TRABAJAMOS -->
    <section class="vf-section vf-row">
      <div class="vf-col-left">
        <h2 class="vf-title">¿CÓMO TRABAJAMOS?</h2>
      </div>

      <div class="vf-col-right">
        <p>
          En Magma Futura trabajamos desde la investigación, la experimentación 
          y la interdisciplina. Exploramos cómo el arte, la tecnología y los 
          lenguajes digitales pueden expandir la forma en que habitamos el mundo. <br>
        </p>
        <p>
          Cada proyecto comienza con una instancia de escucha y de conceptualización 
          conjunta. Acompañamos procesos creativos desde la idea hasta la producción 
          técnica: instalaciones inmersivas, piezas audiovisuales, diseño de experiencias, 
          workshops, performances y nuevas materialidades. <br>
        </p>
        <p>
          Nuestro enfoque es phygital: articulamos lo físico y lo digital para construir 
          experiencias sensibles, críticas y memorables. Creamos prototipos, cuestionamos 
          las reglas tradicionales del retail cultural y exploramos futuros posibles junto 
          a artistas, instituciones y marcas.
        </p>
      </div>
    </section>

    <hr class="vf-divider">

    <!-- QUIÉNES SOMOS -->
    <section class="vf-section vf-row">
      <div class="vf-col-left">
        <h2 class="vf-title">¿QUIÉNES SOMOS?</h2>
      </div>

      <div class="vf-col-right vf-team">
        <div class="vf-team-text">
          <p>
            Magma Futura está conformado por un equipo multidisciplinario dedicado 
            al cruce entre arte, diseño, tecnología y producción cultural. <br>
          </p>
          <p>
            <strong>Sabrina Srur</strong>: Fotógrafa y Lic. en Comunicación Audiovisual.<br>
            <strong>Luisa Leborgne</strong>: Artista Visual y Lic. en Diseño, Arte y Tecnología.<br>
            <strong>Sofía Ruiz</strong>: Artista Plástica (FARTES). <br>
          </p>
          <p>
            Las tres integran la gestión, producción y curaduría del espacio, adaptando 
            sus roles según la naturaleza de cada proyecto. Planificamos cada instancia 
            con reuniones iniciales, acuerdos formales, desarrollo conceptual, diseño 
            visual, difusión y ensayos técnicos.
          </p>
        </div>

        <img src="${teamImg}" class="vf-team-img" alt="Equipo de Magma Futura">
      </div>
    </section>

    <hr class="vf-divider">

    <!-- CLIENTES (con logos slider) -->
    <section class="vf-section">
  
  <div class="vf-col-left">
    <h2 class="vf-title">CLIENTES</h2>
  </div>

  <div class="vf-logos-full">
    <div class="vf-logos-track">
      ${LOGO_LIST.map(src => `
        <div class="vf-logo-item">
          <img src="${src}" alt="Cliente">
        </div>
      `).join('')}
    </div>
  </div>

</section>

  `;

  return el;
}

export default {
  id: 'vision',
  title: 'Nuestra visión',
  render (target) {
    target.appendChild(build());
  },
  destroy () {}
};
