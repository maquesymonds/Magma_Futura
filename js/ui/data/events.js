// js/ui/data/events.js
// Datos de eventos pasados: portadas, galerías y contenido de detalle.
// Solo hay 2 eventos completos, el primero y el segundo.

// Portadas
import pasados1  from '../../../assets/pasados/detalle/cohen/cohen1.jpg?url';
import pasados2  from '../../../assets/pasados/pasados2.jpeg?url';
import pasados3  from '../../../assets/pasados/pasados3.jpeg?url';
import pasados4  from '../../../assets/pasados/pasados4.jpeg?url';
import pasados5  from '../../../assets/pasados/pasados5.jpeg?url';
import pasados6  from '../../../assets/pasados/pasados6.jpeg?url';
import pasados7  from '../../../assets/pasados/pasados7.jpeg?url';
import pasados8  from '../../../assets/pasados/pasados8.jpeg?url';
import pasados9  from '../../../assets/pasados/pasados9.jpeg?url';
import pasados10 from '../../../assets/pasados/pasados10.jpeg?url';
import pasados11 from '../../../assets/pasados/pasados11.jpeg?url';
import pasados12 from '../../../assets/pasados/pasados12.jpeg?url';

// Evento 1 – Cohen
import cohen1 from '../../../assets/pasados/detalle/cohen/cohen1.jpg?url';
import cohen2 from '../../../assets/pasados/detalle/cohen/cohen2.jpg?url';
import cohen3 from '../../../assets/pasados/detalle/cohen/cohen3.jpg?url';

// Evento 2 – Carrau
import carrau1 from '../../../assets/pasados/detalle/carrau/carrau1.jpg?url';
import carrau2 from '../../../assets/pasados/detalle/carrau/carrau2.jpg?url';
import carrau3 from '../../../assets/pasados/detalle/carrau/carrau3.jpg?url';
import carrau4 from '../../../assets/pasados/detalle/carrau/carrau4.jpg?url';

// Helper para generar slugs desde títulos
const slug = s => s
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

export const EVENTS = [
  {
    id: 1,
    title: '5Ritmos®️ Inmersivos',
    subtitle: 'Brenda Cohen',
    year: 2025,
    date: '11.10.25',
    desc: 'Disciplina y libertad pueden parecer antagónicos, pero no lo son.',
    cover: pasados1,
    showCoverInDetail: false,
    gallery: [pasados1],
    blocks: [
      // Foto grande centrada
      { type: 'img', src: cohen1, alt: 'Brenda Cohen — imagen 1', class: 'img full' },

      // Imagen izquierda + texto derecha
      {
        type: 'imgText',
        src: cohen2,
        alt: 'Brenda Cohen — imagen 2',
        class: 'pair-40-60 bleed-l',
        html: `
          <p>Disciplina y libertad pueden parecer conceptos antagónicos, pero no lo son. Así como entrenamos tantas cosas con disciplina, la libertad también necesita un espacio de entrenamiento diario. La práctica de los 5Ritmos transformó mi vida y despertó una pasión: la de crear espacios donde las personas puedan expresarse auténticamente.</p>
        `
      },

      // Texto izquierda + imagen derecha (invertido)
      {
        type: 'imgText',
        src: cohen3,
        alt: 'Brenda Cohen— imagen 3',
        class: 'pair-60-40 reverse bleed-r',
        html: `
          <p>En este encuentro especial te invitamos viaje de auto exploración donde los 5Ritmos®️ nos guían junto a las visuales desarrolladas por Fabiana Gallegos, @mardeformas (Martin E. Kaplan) y @lennyforster. En este espacio, la música y el arte se unen para despertar tus sentidos y liberar tu expresión más auténtica.</p>
        `
      },
    ]
  },
  {
    id: 2,
    title: 'ES LO QUE VES',
    subtitle: 'Antonio Carrau',
    year: 2025,
    date: '16.01.25',
    desc: 'Una experiencia y recorrido inmersivo con el artista por sus obras: estimulo, exploración y resultado, en la nave de Magma Futura.',
    cover: pasados2,
    showCoverInDetail: false,
    gallery: [pasados2],
    blocks: [
      // Foto grande centrada
      { type: 'img', src: carrau1, alt: 'ES LO QUE VES — imagen 1', class: 'img full' },

      // Imagen izquierda + texto derecha
      {
        type: 'imgText',
        src: carrau2,
        alt: 'ES LO QUE VES — imagen 2',
        class: 'pair-40-60 bleed-l',
        html: `
          <p><strong>Un recorrido virtual</strong> por sus collages en la nave de Magma Futura.</p>
          <p>Carrau toma elementos del mundo digital que lleva a lo analógico y luego vuelve a digitalizar utilizando un escáner. Su trabajo es fruto de la combinación de estos dos mundos.</p>
          <p>Esta selección de trabajos —o partes de trabajos— muestra las inquietudes actuales del artista e invita a visualizar de forma inmersiva estas experimentaciones.</p>
          <p>El brindis de cierre incluirá un recorrido inmersivo por sus tres procesos creativos: <em>estímulo, exploración y resultado</em>, interpretado por la artista visual Luisa Leborgne.</p>
        `
      },

      // Texto izquierda + imagen derecha (invertido)
      {
        type: 'imgText',
        src: carrau4,
        alt: 'ES LO QUE VES — imagen 3',
        class: 'pair-60-40 reverse bleed-r',
        html: `
          <h3>BIO</h3>
          <p>Papel glacé, pegamento, tijera, perforadora e intuición: estas son las herramientas de trabajo preferidas de Antonio Carrau (Montevideo, 1988).</p>
          <p>Diseñador gráfico de formación y artista plástico autodidacta, utiliza como medio habitual el collage, técnica que más lo identifica y su carta de presentación estética dentro del panorama artístico internacional.</p>
          <p>Sus creaciones se caracterizan por formas y colores que pueden partir de un boceto, pero luego van mutando siguiendo el pulso creativo del autor, donde nada queda librado al azar.</p>
          <p>Utilizando recortes y varias capas de papel, sus collages son una amalgama de formas y contraformas inesperadas que comparten un mismo lenguaje y son cortadas con una intención que va dejando rastros en su obra.Estas limitaciones en el método no lo condicionan, sino todo lo contrario: lo potencian. Una mesa de trabajo hecha un caos, café y música.</p>
        `
      },

      // Foto grande final
      { type: 'img', src: carrau3, alt: 'ES LO QUE VES — imagen 4', class: 'img full' },
    ]
  },
  {
    id: 3,
    title: 'CICLO DE ESCUCHAS SILENCIOSAS',
    subtitle: 'Andrés Torrón',
    year: 2024,
    date: '14.08.25',
    desc: 'Tercer ciclo de las Escuchas Silenciosas. Viaje sensorial guiado por Andrés Torrón.',
    cover: pasados3,
    gallery: [pasados3],
    blocks: []
  },
  {
    id: 4,
    title: 'NATURALEZA REMEZCLA',
    subtitle: 'Carlos Casacubierta · Nicolás Demczylo',
    year: 2023,
    date: '10.08.23',
    desc: 'El disco Naturaleza (2013) reinterpretado visualmente por Nicolás Demczylo.',
    cover: pasados4,
    gallery: [pasados4],
    blocks: []
  },
  {
    id: 5,
    title: 'PROCESOS ALEATORIOS COMO MÉTODO DE COMPOSICIÓN',
    subtitle: '',
    year: 2023,
    date: '09.08.23',
    desc: 'Métodos aleatorios como herramientas teóricas y prácticas para composición musical.',
    cover: pasados5,
    gallery: [pasados5],
    blocks: []
  },
  {
    id: 6,
    title: 'CICLO DE ESCUCHAS SILENCIOSAS – Edición especial',
    subtitle: '',
    year: 2024,
    date: '03.08.24',
    desc: 'Experiencia sonora inmersiva con visuales de Clara Bonavita y auriculares Domo Silent.',
    cover: pasados6,
    gallery: [pasados6],
    blocks: []
  },
  {
    id: 7,
    title: 'PROCESOS ALEATORIOS AVANZADOS',
    subtitle: '',
    year: 2023,
    date: '21.07.23',
    desc: 'Integrar aleatoriedad y control en la creación sonora contemporánea.',
    cover: pasados7,
    gallery: [pasados7],
    blocks: []
  },
  {
    id: 8,
    title: 'CICLO DE ESCUCHAS SILENCIOSAS – Vol. II',
    subtitle: '',
    year: 2024,
    date: '02.08.24',
    desc: 'Viaje inmersivo por tres etapas: estímulo, exploración y resultado.',
    cover: pasados8,
    gallery: [pasados8],
    blocks: []
  },
  {
    id: 9,
    title: 'PROCESOS ALEATORIOS COMO PERFORMANCE',
    subtitle: '',
    year: 2023,
    date: '07.04.23',
    desc: 'Experimentación en vivo sobre algoritmos, improvisación y música generativa.',
    cover: pasados9,
    gallery: [pasados9],
    blocks: []
  },
  {
    id: 10,
    title: 'CICLO DE ESCUCHAS SILENCIOSAS – Vol. III',
    subtitle: '',
    year: 2022,
    date: '01.07.22',
    desc: 'Sesión de escucha guiada con proyecciones envolventes en la nave.',
    cover: pasados10,
    gallery: [pasados10],
    blocks: []
  },
  {
    id: 11,
    title: 'NATURALEZA REMEZCLA – Remix Visual',
    subtitle: '',
    year: 2023,
    date: '10.08.23',
    desc: 'Edición expandida combinando proyección 3D y ambientación sonora.',
    cover: pasados11,
    gallery: [pasados11],
    blocks: []
  },
  {
    id: 12,
    title: 'DRAMAMUSA – Cierre de temporada',
    subtitle: '',
    year: 2025,
    date: '27.02.25',
    desc: 'Brindis final y recorrido inmersivo por su obra virtual.',
    cover: pasados12,
    gallery: [pasados12],
    blocks: []
  },
].map(ev => ({ ...ev, slug: slug(ev.title) }));

// Helpers de consulta
export const byYear = y =>
  (y === 'all') ? EVENTS : EVENTS.filter(e => e.year === +y);

export const bySlug = s =>
  EVENTS.find(e => e.slug === s);
