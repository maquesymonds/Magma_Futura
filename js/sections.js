// js/sections.js
// Controlador de secciones 3D: traduce el timeline de cámara en salas navegables
import * as THREE from 'three';
import flechaURL from '../assets/flecha.png?url';

export function setupSections(mixer, clip, ui = {}, opts = {}) {
  const {
    startBtn = null,
    hint     = null,
    onSectionChange     = () => {},
    onSectionWillChange = () => {},
  } = ui || {};

  const action = opts.action ?? null;

  // Si falta mixer o clip, se devuelve un stub sin navegación para evitar errores en runtime
  if (!mixer || !clip) {
    console.warn('[setupSections] Falta mixer/clip. Se retorna stub sin navegación.');
    return {
      goTo(){},
      start(){},
      get current(){ return 0; },
      get tweening(){ return false; }
    };
  }

  const bottomNav = document.getElementById('bottomNav');
  const navPrev   = document.getElementById('navPrev');
  const navNext   = document.getElementById('navNext');

  // --------------------------------------------------
  // Definición de secciones 3D y etiquetas de navegación inferior
  // Cada entrada corresponde a un segmento del timeline de cámara.
  // --------------------------------------------------
  const SECTIONS = [
    null,

    {
      name: 'CASA FUTURA',
      left:  { label:`<img class="flecha flecha-left" src="${flechaURL}"> PRESENTE`, to:4 },
      right: { label:`AGENDA <img class="flecha flecha-right" src="${flechaURL}">`,   to:2 }
    },

    {
      name: 'NUESTRA AGENDA',
      left:  { label:`<img class="flecha flecha-left" src="${flechaURL}"> INICIO`, to:1 },
      right: { label:`PASADOS <img class="flecha flecha-right" src="${flechaURL}">`, to:3 }
    },

    {
      name: 'EVENTOS PASADOS',
      left:  { label:`<img class="flecha flecha-left" src="${flechaURL}"> AGENDA`, to:2 },
      right: { label:`ACTUALMENTE <img class="flecha flecha-right" src="${flechaURL}">`, to:4 }
    },

    {
      name: 'EXPUESTO ACTUALMENTE',
      left:  { label:`<img class="flecha flecha-left" src="${flechaURL}"> PASADOS`, to:3 },
      right: { label:`INICIO <img class="flecha flecha-right" src="${flechaURL}">`,  to:5 }
    },

    {
      name: 'CASA FUTURA',
      left:  { label:`<img class="flecha flecha-left" src="${flechaURL}"> ACTUALMENTE`, to:4 },
      right: { label:`AGENDA <img class="flecha flecha-right" src="${flechaURL}">`,      to:2 }
    },
  ];

  // Construye el HTML del botón de navegación, generando un aria-label accesible
  function buildNavButton(label) {
    // Elimina las etiquetas HTML para construir un aria-label accesible
    const ariaLabel = label.replace(/<[^>]*>/g, '').trim();

    return `
      <button class="nav-btn" type="button" aria-label="Ir a ${ariaLabel}">
        <span class="nav-label">${label}</span>
      </button>
    `;
  }

  // Actualiza el contenido y el comportamiento de la navegación inferior según la sección activa
  function updateBottomNav(idx){
    if (!bottomNav || !navPrev || !navNext) return;
    const def = SECTIONS[idx];

    // Si no hay definición para la sección, se oculta la navegación inferior
    if (!def) {
      bottomNav.classList.add('hidden');
      return;
    }
    bottomNav.classList.remove('hidden');

    navPrev.innerHTML = buildNavButton(def.left.label);
    navNext.innerHTML = buildNavButton(def.right.label);

    // La navegación sólo responde si no hay tween en curso
    navPrev.onclick = () => { if (!tweening) goTo(def.left.to); };
    navNext.onclick = () => { if (!tweening) goTo(def.right.to); };
  }

  // --------------------------------------------------
  // Mapeo de frames a tiempo en segundos dentro del clip de cámara
  // Permite navegar usando marcas discretas del timeline.
  // --------------------------------------------------
  const fps         = opts.fps ?? 24;
  const startFrame  = opts.startFrame ?? 1;
  const marksFrames = [0, 100, 200, 300, 400, 500, 600];

  let marks         = [];
  let indexReady    = false;

  function buildIndex() {
    if (indexReady) return;

    // Conversión de frames a segundos de clip, compensando el frame de inicio
    marks = marksFrames.map(f => Math.max(0, (f - startFrame) / fps));

    indexReady = true;
  }

  // Construcción inicial del índice de marcas de tiempo
  buildIndex();

  // --------------------------------------------------
  // Estado de navegación sobre el timeline 3D
  // current: índice de sección actual
  // tweening: indica si hay una interpolación en curso
  // hasStarted: bloquea volver al estado "exterior" una vez iniciada la experiencia
  // --------------------------------------------------
  let current    = 0;
  let tweening   = false;
  let hasStarted = false;

  // Posiciona el tiempo de la animación en un valor clamped
  function setTime(val) {
    const clamped = THREE.MathUtils.clamp(val, 0, clip.duration - 1e-4);
    if (action) {
      action.time = clamped;
    } else {
      mixer.setTime(clamped);
    }
    mixer.update(0);
    mixer.getRoot().updateMatrixWorld(true);
  }

  // Interpola el tiempo de animación entre dos marcas con easing cúbico
  function tweenTime(from, to, dur = 1.3) {
    tweening = true;
    const t0 = performance.now();
    const ease = x => (x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2);

    function step(now) {
      const k   = Math.min(1, (now - t0) / (dur * 1000));
      const val = THREE.MathUtils.lerp(from, to, ease(k));
      setTime(val);

      if (k < 1) {
        requestAnimationFrame(step);
      } else {
        tweening = false;
        updateBottomNav(current);
        onSectionChange(current);
      }
    }

    requestAnimationFrame(step);
  }

  // --------------------------------------------------
  // goTo(index): navega a la sección indicada en base al índice de marcas
  // Incluye reglas especiales para el primer ingreso y el loop 5 → 2.
  // --------------------------------------------------
  function goTo(index) {
    if (!clip || (!index && index !== 0)) return;

    // Asegura que el índice de marcas esté disponible antes de navegar
    buildIndex();

    let targetIdx = THREE.MathUtils.clamp(index, 0, marks.length - 1);

    // Una vez iniciada la experiencia no se vuelve al índice 0 (vista exterior)
    if (hasStarted && targetIdx === 0) {
      targetIdx = 1;
    }

    if (targetIdx === current || tweening) return;

    const from = action ? action.time : (mixer.time % clip.duration);
    const to   = marks[targetIdx];

    // Caso especial: desde la vuelta del foyer (5) se engancha con Sala 2 (2) manteniendo continuidad
    const isLoopForward = (current === 5 && targetIdx === 2);

    // Primer movimiento 0 → 1 (entrada inicial a la casa) con una velocidad diferenciada
    const isFirstIntro = (current === 0 && targetIdx === 1);

    const startTween = () => {
      current = targetIdx;

      if (isLoopForward) {
        // Se utiliza el foyer de ida (frame 100) como punto de enganche
        const foyerTime = marks[1]; // idx 1 → frame 100
        const sala2Time = marks[2]; // idx 2 → frame 200

        // Salto no visible 500 → 100 para mantener la continuidad de pose
        setTime(foyerTime);

        // Transición normal foyer → Sala 2 (100 → 200) siempre hacia adelante
        tweenTime(foyerTime, sala2Time);
      } else if (isFirstIntro) {
        // Primer viaje de introducción con duración mayor para enfatizar el ingreso
        tweenTime(from, to, 2.6);
      } else {
        // Resto de los casos: interpolación estándar entre marcas
        tweenTime(from, to);
      }
    };

    let tl = null;
    try {
      tl = onSectionWillChange(targetIdx) || null;
    } catch (err) {
      console.warn('[setupSections] onSectionWillChange error:', err);
    }

    // Si el callback devuelve un timeline GSAP, se espera a su finalización antes de mover la cámara
    if (tl && typeof tl.eventCallback === 'function') {
      tweening = true;
      tl.eventCallback('onComplete', () => {
        tweening = false;
        startTween();
      });
    } else {
      startTween();
    }
  }

  // --------------------------------------------------
  // start(): inicia la experiencia y lanza la primera transición de cámara
  // Gestiona el estado inicial de la UI y bloquea el retorno al exterior.
  // --------------------------------------------------
  function start({ showUIAfter = false } = {}) {
    buildIndex();

    document.getElementById('hero')?.classList.add('hidden');
    hint?.classList.add('hidden');

    // A partir de este momento no se vuelve al índice 0 (estado exterior)
    hasStarted = true;
    goTo(1);

    // Opcionalmente se espera a que termine el primer tween para mostrar la interfaz completa
    if (showUIAfter) {
      const poll = setInterval(() => {
        if (!tweening) {
          clearInterval(poll);

          document.getElementById('siteHeader')?.classList.remove('hidden');
          document.getElementById('bottomNav')?.classList.remove('hidden');
          document.getElementById('titles')?.classList.remove('hidden');
          updateBottomNav(current);
        }
      }, 50);
    }
  }

  // Botón de inicio anterior (se conserva por compatibilidad si existiera en el DOM)
  // startBtn?.addEventListener('click', () => start());

  // Helper para consultar si hay un overlay 2D activo
  const isOverlayOpen = () => document.body.classList.contains('overlay-open');

  // --------------------------------------------------
  // Navegación por scroll: avance y retroceso por pasos discretos
  // El scroll acumula movimiento hasta un umbral antes de cambiar de sección.
  // --------------------------------------------------
  let acc = 0;
  const threshold = 60;

  window.addEventListener('wheel', (e) => {
    if (isOverlayOpen() || tweening) return;

    acc += e.deltaY;

    if (acc > threshold) {
      acc = 0;

      // Al avanzar desde la sección 5 se fuerza el enganche con la sección 2 (loop continuo)
      if (current === 5) {
        // goTo ya incorpora la lógica de enganche 5 → 2
        goTo(2);
      } else {
        goTo(current + 1);
      }

    } else if (acc < -threshold) {
      acc = 0;

      // Hacia atrás se recorre la secuencia normal (5 → 4 → 3 → 2 → 1)
      goTo(current - 1);
    }
  }, { passive: true });

  // --------------------------------------------------
  // Interfaz pública del controlador de secciones 3D
  // Permite integrarse con otros módulos sin exponer detalles internos.
  // --------------------------------------------------
  return {
    goTo,
    start,
    get current(){ return current; },
    get tweening(){ return tweening; }
  };
}
