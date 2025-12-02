// js/ui/sections/agenda.js

//posters
import ag1 from '../../../assets/agenda/agenda1.png?url';
import ag2 from '../../../assets/agenda/agenda2.png?url';
import ag3 from '../../../assets/agenda/agenda3.png?url';
import ag4 from '../../../assets/agenda/agenda4.png?url';
import ag5 from '../../../assets/agenda/agenda5.png?url';
import ag6 from '../../../assets/agenda/agenda6.png?url';

// 🔌 animaciones GSAP (tarjetas)
import { animateAgendaCards } from '../../gsap/agenda-animations.js';


// data
const UPCOMING = [
  {
    id: 1,
    date: '07.04.25',
    title: 'CICLO DE ESCUCHAS SILENCIOSAS',
    img: ag1,
    longDesc: [
      'Tercer ciclo de las Escuchas Silenciosas. En la nave de Magma Futura viví un viaje sensorial guiado por Andrés Torrron, con los visuales inmersivos de Clara Bonavita y la gestión y los auriculares de Domo Silent.',
      'Tercer disco - Luciano Supervielle: Supervielle (2004). El primer disco de Supervielle realizado junto al colectivo Bajofondo, combinó electronica, hip hop, tango, música uruguaya y clasicismo, creando una de las obras más interesantes de la música rioplatense de los 2000.'
    ]
  },
  {
    id: 2,
    date: '07.04.25',
    title: 'PROCESOS ALEATORIOS COMO MÉTODO DE COMPOSICIÓN',
    img: ag2,
    longDesc: [
      'Los métodos aleatorios se han masificado en los últimos años y se proyectan como una herramienta muy atrayente para la composición musical.',
      'Este taller busca definir herramientas teóricas y prácticas para tener control sobre esta aleatoriedad y así enriquecer las elecciones estéticas del productor.',
      'Nivel principiante e intermedio. A cargo de: Matías Nario, aka MUTEN.'
    ]
  },
  {
    id: 3,
    date: '07.04.25',
    title: 'TALLER DE VIDEOPOESÍA INTERACTIVO',
    img: ag3,
    longDesc: [
      '¿Cómo diseñar VIDEOPOESÍA en poética visual y sonora? Comprensión abierta e interdisciplinaria sobre la creación audiovisual.',
      'Piezas y clips en Resolume Arena 7 con algoritmo FFT. Panel de controles para BPM. Opacidad en diseño AV.',
      'Docente: Lucía Jazmín Tarela (ARG) @video.poesia.'
    ]
  },
  {
    id: 4,
    date: '07.04.25',
    title: 'RITUAL DE ÚTERO — SANACIÓN DEL LINAJE FEMENINO',
    img: ag4,
    longDesc: [
      'Un viaje sensorial y profundo hacia el corazón del poder femenino. Imágenes envolventes, sonidos y guía meditativa.',
      'Un espacio para soltar, sanar y reconectar con tu energía creadora.',
      'Guiado por Cris Boccalato, especialista en Ayurveda.'
    ]
  },
  {
    id: 5,
    date: '07.04.25',
    title: 'DRIFT TEATRO AUMENTADO — IN+OUT',
    img: ag5,
    longDesc: [
      'DRIFT es una serie de obras de teatro aumentado especialmente creada para salas inmersivas.',
      'IN+OUT es su primera pieza diseñada para la sala de Magma Futura.'
    ]
  },
  {
    id: 6,
    date: '07.04.25',
    title: 'BALNEARIO — PREESTRENO + CONVERSATORIO',
    img: ag6,
    longDesc: [
      'Par lanza su nuevo disco Balneario, un viaje por la playa, donde el clima nostálgico y el pulso introspectivo permiten recorrer y conectar con el deterioro.',
      'Conversatorio sobre el proceso creativo, imágenes e ideas.'
    ]
  }
];

// helper para párrafos
const renderParagraphs = (arr = []) =>
  arr.map(p => `<p class="ag-desc">${p}</p>`).join('');

function build(){
  const root = document.createElement('section');
  root.className = 'page page-agenda';

  root.innerHTML = `
    <!-- HERO AGENDA -->
    <div class="agenda-hero">
      <div class="agenda-hero-inner">
        <div class="agenda-title-wrap">
          <span class="agenda-icon"></span>
          <h1 class="page-title">EVENTOS PRÓXIMOS</h1>
        </div>
      </div>
    </div>

    <!-- CONTENIDO -->
    <div class="page agenda-inner">
      <div class="agenda-grid">
        ${UPCOMING.map(ev => `
          <article class="ag-card" data-id="${ev.id}" tabindex="0" aria-expanded="false">
            <div class="ag-meta">(${ev.date})</div>

            <div class="ag-card__stage">
              <div class="ag-card__inner">

                <!-- Frente -->
                <div class="ag-face ag-face--front">
                  <div class="ag-media">
                    <img loading="lazy" src="${ev.img}" alt="${ev.title}">
                  </div>
                </div>

                <!-- Dorso -->
                <div class="ag-face ag-face--back">
                  <div class="ag-back">
                    <h3 class="ag-title">${ev.title}</h3>
                    ${renderParagraphs(ev.longDesc)}
                  </div>
                </div>

              </div>
            </div>

            <!-- CTA -->
            <a class="ag-card-cta"
               href="https://ticketfacil.uy/event/BIOPERA-3D-II/registerToEvent"
               target="_blank"
               data-cursor="button">
               TICKETS
            </a>

          </article>
        `).join('')}
      </div>
    </div>
  `;

  return root;
}

export default {
  id: "agenda",
  title: "Eventos próximos",
  render(target){
    document.body.classList.add("overlay-open");
    target.classList.add("page-agenda");

    const section = build();
    target.appendChild(section);

    setTimeout(() => {
      animateAgendaCards(section);
    }, 0);
  },
  destroy(){
    document.body.classList.remove("overlay-open");

    // Se busca el panel directamente en el DOM
    const panel = document.getElementById('panel') || document.querySelector('.panel');
    if (panel) {
      panel.classList.remove('page-agenda');
    }
  }
};

