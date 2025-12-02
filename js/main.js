// js/main.js
import { gsap } from "gsap";
import { initRouter, closePanel } from './ui/router.js';
import { initNav } from './ui/nav.js';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { setupSections } from './sections.js';
import { initGsapBase } from './gsap/gsap-setup.js';
import { initCustomCursor } from './ui/cursor.js';
import { createAudioController } from './audio/audio-controller.js';

import {
  setupLighting,
  boostLightsDown,
  boostLightsUp,
  addAmbientToSala,
  setRoomBoost,
  getRoomBoost
} from './scene/lighting.js';

// import { addGrainOverlay, updateGrain } from './effects/grain-overlay.js';
import { setupBirdsFlipbook, updateBirdsFlipbook } from './scene/pajaros.js';



// ======================================================
// Precalentamiento de la ruta de cámara (prewarm)
// Recorre el clip de cámara sin avanzar el tiempo "real"
// para forzar la compilación de shaders y caches.
// ======================================================
function prewarmCameraPath({
  mixer,
  clip,
  action,
  camera,
  scene,
  renderer,
  samples = 12
}) {
  if (!mixer || !clip || !action || !camera) return;

  console.log('[PERF] prewarmCameraPath: start');

  const originalTime      = action.time;
  const originalTimeScale = action.getEffectiveTimeScale
    ? action.getEffectiveTimeScale()
    : 0;

  // Se asegura de que la acción no avance automáticamente
  if (action.setEffectiveTimeScale) {
    action.setEffectiveTimeScale(0);
  }

  let i = 0;

  function step() {
    if (i >= samples) {
      // Restaurar el estado original
      action.time = originalTime;
      mixer.update(0);
      scene.updateMatrixWorld(true);

      if (action.setEffectiveTimeScale) {
        action.setEffectiveTimeScale(originalTimeScale);
      }

      console.log('[PERF] prewarmCameraPath: done');
      return;
    }

    const t = (clip.duration * i) / Math.max(1, samples - 1);
    action.time = t;
    mixer.update(0);
    scene.updateMatrixWorld(true);

    try {
      renderer.render(scene, camera);
    } catch (e) {
      console.warn('Prewarm render error:', e);
    }

    i += 1;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}


let overlayOpen = false;

// ============================================================
// Intro / preload: timeline único
// Maneja cursor, audio global y arranque de la experiencia.
// ============================================================
window.addEventListener('load', () => {
  // ------------------------------------------------------------
  // Inicialización del cursor personalizado (DOM listo)
  // ------------------------------------------------------------
  initCustomCursor();

  function setupCursorHoverStates() {
    const cursor = document.querySelector('.cursor');
    if (!cursor) return;

    const hoverables = document.querySelectorAll('[data-cursor="hover"]');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
    });

    const buttons = document.querySelectorAll('[data-cursor="button"]');
    buttons.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor--button'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--button'));
    });
  }
  setupCursorHoverStates();

  // ------------------------------------------------------------
  // Toggle de audio global (icono ON/OFF)
  // Controla el loop principal y respeta políticas del navegador.
  // ------------------------------------------------------------
  const audioBtn = document.getElementById('audioToggle');

  if (audioBtn) {
    // Estado visual inicial en ON
    audioBtn.classList.add('on');

    audioBtn.addEventListener('click', async () => {
      const isOn = audioBtn.classList.contains('on');

      if (isOn) {
        // Apagar audio global
        audioBtn.classList.remove('on');
        audioBtn.classList.add('off');

        if (window.audioCtl?.media) {
          try {
            window.audioCtl.media.pause();
          } catch (e) {
            console.warn('Error al pausar audio:', e);
          }
        }
      } else {
        // Encender audio global
        audioBtn.classList.remove('off');
        audioBtn.classList.add('on');

        if (window.audioCtl) {
          try {
            const { ctx, media } = window.audioCtl;

            if (ctx && ctx.state === 'suspended') {
              await ctx.resume();
            }
            if (media && media.paused) {
              await media.play();
            }
          } catch (e) {
            console.warn('Error al reanudar audio:', e);
          }
        }
      }
    });
  }
});


// --------------------------------------------------
// Renderer / Scene
// Configuración principal de WebGL y escena 3D.
// --------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  // logarithmicDepthBuffer: true,
});

// Exposición del renderer en window para depuración manual
window.renderer = renderer;

// Sombras desactivadas para reducir costo de render
renderer.shadowMap.enabled = false;
renderer.shadowMap.autoUpdate = false;

renderer.physicallyCorrectLights = true;
renderer.setSize(innerWidth, innerHeight);

// Pixel ratio fijo en 1.5: balancea nitidez y rendimiento en la mayoría de GPUs modernas.
renderer.setPixelRatio(1.5);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7; // exposición global

renderer.setClearColor(0x202020, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121216);

// Exposición de la escena para depuración desde consola
window.scene = scene;

const clock = new THREE.Clock();

// Cámara de respaldo por si el GLB no trae cámaras embebidas
let activeCamera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1e6);

// --------------------------------------------------
// Referencias de UI HTML que interactúan con la escena
// --------------------------------------------------

const loaderEl   = document.getElementById('loader');
const loaderText = loaderEl?.querySelector('.loader-text');
const loaderFill = loaderEl?.querySelector('.loader-bar-fill');

const startBtn   = document.getElementById('start');
const hint       = document.getElementById('hint');
const titlesEls  = Array.from(document.querySelectorAll('.title-set'));
let currentTitle = null;
const intro      = document.getElementById('intro');
const startIntro = document.getElementById('startIntro');
const header     = document.getElementById('siteHeader');
const bottomNav  = document.getElementById('bottomNav');
const heroEl     = document.getElementById('hero');


// --------------------------------------------------
// Intro -> arranque de la experiencia 3D
// Se limita a ocultar la capa de intro y delega al
// controlador de secciones mostrar el header y la UI.
// --------------------------------------------------
startIntro?.addEventListener('click', () => {
  console.log('[PERF] startIntro clicked at', performance.now().toFixed(1), 'ms');

  // 1) Agrega la clase de fade-out al overlay de intro
  intro?.classList.add('fade-out');

  // 2) Una vez terminado el fade, se oculta la intro
  //    y se dispara el inicio del controlador de secciones.
  setTimeout(() => {
    intro?.classList.add('hidden');

    if (sectionsCtl?.start) {
      console.log('[PERF] sectionsCtl.start called from intro timeout');
      sectionsCtl.start({ showUIAfter: true });
    } else {
      console.log('[PERF] sectionsCtl NOT READY, queueing start');
      queuedStart = true;
    }
  }, 850); // sincronizado con la animación CSS (~0.8s)
});




// --------------------------------------------------
// Audio controller (loop principal + whoosh de transiciones)
// --------------------------------------------------
const audioCtl = createAudioController({
  baseURL: '/audio/main-loop.mp3?v=2',
  whooshURL: '/audio/whoosh.mp3?v=2',
  startBtn: startIntro,
});
window.audioCtl = audioCtl;

// --------------------------------------------------
// Router + navegación 2D
// --------------------------------------------------
initNav();
initRouter();

// Eventos globales para pausar/reanudar 3D cuando hay overlays 2D
document.addEventListener('overlay:open', () => {
  overlayOpen = true;
  console.log('Overlay opened - 3D paused (render loop ligero)');
});
document.addEventListener('overlay:close', () => {
  overlayOpen = false;
  console.log('Overlay closed - 3D resumed');
});

// --------------------------------------------------
// Botón externo hacia la tienda de Magma Futura
// --------------------------------------------------
const shopBtn = document.querySelector('.shop-btn');
if (shopBtn) {
  shopBtn.addEventListener('click', () => {
    window.open('https://www.espaciomagma.com/magma-futura', '_blank', 'noopener');
  });
}

// --------------------------------------------------
// Títulos por sección (foyer / futuro / pasado / presente)
// Controla entrada y salida de la tipografía en la máscara.
// --------------------------------------------------

// Sale el título actual hacia abajo a través de la máscara
function animateSectionTitleOut() {
  if (!currentTitle) return null;

  const lines = currentTitle.querySelectorAll('.title-line');

  const tl = gsap.timeline({
    defaults: {
      duration: 0.9,
      ease: 'power4.inOut'
    }
  });

  tl.to(lines, {
    yPercent: 110,
    stagger: 0.03
  });

  tl.add(() => {
    currentTitle.classList.add('hidden');
    currentTitle.classList.remove('show');
  }, '>-0.05');

  return tl;
}

// Entra el título de la sección destino desde abajo de la máscara
function animateSectionTitleIn(index) {
  const titlesRoot = document.getElementById('titles');
  if (titlesRoot) titlesRoot.classList.remove('hidden');

  // Se mapea el índice 5 a 1 para reutilizar "Casa Futura"
  const mappedIndex = (index === 5 ? 1 : index);

  const next = document.querySelector(`[data-sec="${mappedIndex}"]`);
  if (!next) return null;
  if (currentTitle === next) return null;

  // Se ocultan los demás títulos
  titlesEls.forEach(el => {
    if (el !== next) {
      el.classList.add('hidden');
      el.classList.remove('show');
      el.onclick = null;
    }
  });

  const lines = next.querySelectorAll('h1, h2');

  next.classList.remove('hidden');

  gsap.set(lines, {
    yPercent: 110,
    autoAlpha: 1
  });

  const tl = gsap.timeline({
    defaults: {
      duration: 0.9,
      ease: 'power4.inOut'
    }
  });

  tl.to(lines, {
    yPercent: 0,
    stagger: 0.03
  });

  next.classList.add('show');
  currentTitle = next;

  // Click en el título: abre el panel 2D correspondiente
  next.style.cursor = 'pointer';
  next.onclick = null;

  const route = TITLE_ROUTES[mappedIndex];
  if (route) {
    next.onclick = (e) => {
      e.preventDefault();
      location.hash = route;
    };
  } else {
    next.style.cursor = 'default';
  }

  return tl;
}

// Mapa de secciones 3D -> rutas 2D
const TITLE_ROUTES = {
  2: '#/agenda',   // Nuestra agenda
  3: '#/pasados',  // Eventos pasados
  4: '#/ahora',    // Expuesto actualmente
  // 1: foyer (sin ruta asociada)
};

// Estado inicial de la UI: solo loader visible
header?.classList.add('hidden');
bottomNav?.classList.add('hidden');
heroEl?.classList.add('hidden');
// Intro arranca oculta; se muestra cuando termina la carga del GLB
intro?.classList.add('hidden');

// --------------------------------------------------
// Utilidades de depuración 3D
// --------------------------------------------------
const DEBUG_HELPERS = false;   // Activar únicamente cuando se debugea la escena

let useDebugCam = false;
let overrideOn  = false;
scene.overrideMaterial = null;

let debugCam = null;
let boxHelper = null, axes = null, camHelper = null, camProbe = null;

// Se llama en el loop principal.
// Si DEBUG_HELPERS es false, no realiza ninguna operación.
function _updateDebug() {
  if (!DEBUG_HELPERS) return;
  if (!activeCamera) return;

  // Actualiza helpers de cámara
  if (camHelper) {
    camHelper.update();
  }

  activeCamera.updateMatrixWorld();

  if (camProbe) {
    camProbe.position.copy(
      activeCamera.getWorldPosition(new THREE.Vector3())
    );
  }
}


// --------------------------------------------------
// Paths de recursos estáticos (Vite sirve /public)
// --------------------------------------------------
const BASE       = import.meta.env.BASE_URL || '/';
const DRACO_PATH = `${BASE}draco/`;
const MODEL_URL  = `${BASE}models/draco3.glb`;
// const HDRI_URL   = `${BASE}hdr/sky.hdr`; // HDR desactivado

console.log('[paths]', { BASE, DRACO_PATH, MODEL_URL /*, HDRI_URL */ });


// --------------------------------------------------
// Loading manager (solo para carga de 3D)
// Actualiza el loader visual y registra errores de assets.
// --------------------------------------------------
const manager = new THREE.LoadingManager(() => {
  console.log("✅ All 3D assets loaded");
});

manager.onProgress = (url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;

  if (loaderText) {
    loaderText.textContent = `CARGANDO CASA FUTURA… ${pct}%`;
  }
  if (loaderFill) {
    loaderFill.style.transform = `scaleX(${pct / 100})`;
  }
};

manager.onError = (url) => {
  console.warn("⚠️ Error loading:", url);
};


// --------------------------------------------------
// HDRI / environment (desactivado en esta versión)
// Bloque preparado por si en el futuro se reactiva el HDRI.
// --------------------------------------------------
// function loadHDRI(url) {
//   if (!url) return;
//
//   const rgbeLoader = new RGBELoader(manager);
//   const pmrem = new THREE.PMREMGenerator(renderer);
//   pmrem.compileEquirectangularShader();
//
//   rgbeLoader.load(
//     url,
//     (texture) => {
//       const envMap = pmrem.fromEquirectangular(texture).texture;
//       scene.environment = envMap;
//
//       texture.dispose();
//       pmrem.dispose();
//       console.log('HDRI loaded as environment');
//     },
//     undefined,
//     (err) => {
//       console.warn('HDRI could not be loaded:', err);
//     }
//   );
// }
//
// loadHDRI(HDRI_URL);


// --------------------------------------------------
// Configuración de DRACO + GLTFLoader
// DRACO se usa para descomprimir la geometría comprimida.
// --------------------------------------------------
const draco = new DRACOLoader(manager);
draco.setDecoderPath(DRACO_PATH);
draco.setDecoderConfig({ type: 'wasm' });
draco.preload();

const loader = new GLTFLoader(manager);
loader.setDRACOLoader(draco);

let sectionsCtl = null;
let mixer = null, action = null;
let cameraNodes = [];
// let grainOverlay = null;
let sectionsReady = false;   // Control interno para el estado de secciones

// --------------------------------------------------
// Post-procesado de imagen (bloom)
// Configuración de EffectComposer y UnrealBloomPass.
// --------------------------------------------------
let composer = null;
let renderPass = null;
let bloomPass  = null;

function initPostFX() {
  const size = new THREE.Vector2(innerWidth, innerHeight);

  renderPass = new RenderPass(scene, activeCamera);

  bloomPass = new UnrealBloomPass(
    size,
    0.7,   // intensidad
    0.8,   // radio
    0.2    // umbral
  );

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  composer.setSize(innerWidth, innerHeight);
  console.log('PostFX (Bloom) initialized');
}

// --------------------------------------------------
// Ocultado de helpers booleanos
// Permite dejar en el GLB las geometrías "cutter" pero
// ocultarlas en tiempo de ejecución para limpiar la escena.
// --------------------------------------------------
const BOOL_NAME_PATTERNS = [
  /\.bool/i,
  /boolean/i,
  /_bool/i,
  /_Boolean/i,
  /_cutter/i,
];

function hideBooleanHelpers(root) {
  const hidden = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const n = o.name || '';
    const hide = BOOL_NAME_PATTERNS.some(rx => rx.test(n));
    if (hide) {
      o.visible = false;
      o.castShadow = false;
      o.receiveShadow = false;
      o.userData._hiddenBool = true;
      hidden.push(n);
    }
  });
  if (hidden.length) {
    console.log('Boolean helpers hidden:', hidden);
  }
}

// --------------------------------------------------
// Ajustes de materiales (tiling, espacio de color, etc.)
// Corrige materiales específicos y aplica reglas generales.
// --------------------------------------------------
function fixMaterials(root) {
  const seen = new Set();

  root.traverse(obj => {
    if (!obj.isMesh) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    mats.forEach(mat => {
      if (!mat) return;

      // Pared roja de Sala 2: se ajusta el tiling de texturas
      if (mat.name === 'Material.002') {
        const scale = 4;
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(key => {
          const tex = mat[key];
          if (!tex) return;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(scale, scale);
          tex.offset.set(0, 0);
          tex.needsUpdate = true;
        });
      }

      // Almohadón de Sala 2: tiling más denso
      if (mat.name === 'Material_almohadon2') {
        const scale = 3;
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(key => {
          const tex = mat[key];
          if (!tex) return;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(scale, scale);
          tex.offset.set(0, 0);
          tex.needsUpdate = true;
        });
      }

      // Regla general para mapas más comunes
      const maps = ['map', 'emissiveMap', 'normalMap', 'metalnessMap', 'roughnessMap', 'aoMap'];

      maps.forEach(key => {
        const tex = mat[key];
        if (!tex || seen.has(tex)) return;
        seen.add(tex);

        if (key === 'map' || key === 'emissiveMap') {
          tex.colorSpace = THREE.SRGBColorSpace;
        }

        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.needsUpdate = true;
      });
    });
  });
}

// --------------------------------------------------
// Suavizado de shading
// Ajusta parámetros para evitar brillos excesivos y contrastes
// muy marcados en materiales metálicos o con AO intenso.
// --------------------------------------------------
function softenShading(root) {
  root.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    mats.forEach(mat => {
      if (mat.roughness !== undefined && mat.roughness < 0.35) {
        mat.roughness = 0.45;
      }

      if (mat.envMapIntensity !== undefined) {
        mat.envMapIntensity *= 0.5;
      }

      if (mat.aoMap && mat.aoMapIntensity !== undefined) {
        mat.aoMapIntensity = Math.min(mat.aoMapIntensity, 0.6);
      }

      if (mat.metalness !== undefined && mat.metalness > 0.2) {
        mat.metalness *= 0.5;
      }
    });
  });
}

// --------------------------------------------------
// Ajustes específicos para BackWall_Sala1 / BackWall_Sala2
// Controla color, intensidad de environment map y sombra.
// --------------------------------------------------
function tuneBackWalls(root) {
  let back1 = null;
  let back2 = null;

  root.traverse(o => {
    if (!o.isMesh || !o.material) return;
    const n = (o.name || "").toLowerCase();
    if (n.includes("backwall_sala1")) back1 = o;
    if (n.includes("backwall_sala2")) back2 = o;
  });

  /* // Sala 1 (actualmente desactivado)
  if (back1) {
    back1.material = Array.isArray(back1.material)
      ? back1.material.map(m => m.clone())
      : back1.material.clone();

    const mats1 = Array.isArray(back1.material) ? back1.material : [back1.material];

    mats1.forEach(mat => {
      mat.emissive = mat.color.clone();
      mat.emissiveIntensity = 0.08;

      if (mat.envMapIntensity !== undefined) mat.envMapIntensity *= 0.5;
      if (mat.aoMapIntensity  !== undefined) mat.aoMapIntensity  *= 0.7;

      mat.needsUpdate = true;
    });

    back1.receiveShadow = false;
    back1.castShadow    = false;
  } */

  // Sala 2: se oscurece la pared y se reduce envMap
  if (back2) {
    back2.material = Array.isArray(back2.material)
      ? back2.material.map(m => m.clone())
      : back2.material.clone();

    const mats2 = Array.isArray(back2.material) ? back2.material : [back2.material];

    mats2.forEach(mat => {
      mat.userData._origColor = mat.color.clone();
      mat.color.multiplyScalar(0.3);

      if (mat.envMapIntensity !== undefined) mat.envMapIntensity *= 0.7;

      mat.emissiveIntensity = 0.0;
      mat.needsUpdate = true;
    });

    back2.receiveShadow = false;
    back2.castShadow    = false;
  }
}

// --------------------------------------------------
// Selección del clip principal de cámara
// Identifica la animación de cámara más relevante entre
// todos los clips del GLB.
// --------------------------------------------------
function findMainCameraClip(clips, cameraNodes, preferredCamera) {
  if (!clips?.length) return null;
  const camNames = new Set(cameraNodes.map(c => c.name));
  const preferredName = preferredCamera?.name;

  // Intento directo por nombre estándar
  let byName = THREE.AnimationClip.findByName(clips, 'Main_CameraAction');
  if (byName) return byName;

  // Heurística de puntaje por coincidencia con nodos de cámara
  let best = null;
  let bestScore = -1;

  for (const clip of clips) {
    let score = 0;

    for (const track of clip.tracks) {
      const nodeName = track.name.split('.')[0];
      if (camNames.has(nodeName)) {
        score += 10;
        if (nodeName === preferredName) score += 5;
      }
    }

    if (/main/i.test(clip.name) || /camera/i.test(clip.name)) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = clip;
    }
  }

  return best || clips[0];
}


// --------------------------------------------------
// Navegación "Home" mediante el logo de marca
// Lleva al foyer, cierra overlays y restablece la UI base.
// --------------------------------------------------
const brandBtn = document.getElementById('brandBtn');
let queuedHome = false;
let queuedStart = false;

function goHome() {
  if (document.body.classList.contains('overlay-open')) closePanel();
  location.hash = '';

  if (sectionsCtl?.goTo) {
    sectionsCtl.goTo(1);
  }

  document.getElementById('siteHeader')?.classList.remove('hidden');
  document.getElementById('bottomNav')?.classList.remove('hidden');
  document.getElementById('titles')?.classList.remove('hidden');
}

brandBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!sectionsCtl) { queuedHome = true; return; }
  goHome();
});

// --------------------------------------------------
// Carga del GLB principal
// Incluye: optimizaciones de materiales, iluminación,
// cámaras, animaciones y precalentamiento del renderer.
// --------------------------------------------------

// Medición de tiempo total de carga del GLB (red + DRACO + parseo)
console.time('[PERF] GLB total load');

loader.load(
  MODEL_URL,
  (gltf) => {
    console.timeEnd('[PERF] GLB total load');
    console.time('[PERF] GLB onLoad work');

    scene.add(gltf.scene);

    hideBooleanHelpers(gltf.scene);
    fixMaterials(gltf.scene);
    softenShading(gltf.scene);
    tuneBackWalls(gltf.scene);

    // Configuración de flipbook para pájaros animados
    setupBirdsFlipbook(gltf.scene, {
      frameCount: 10,
      makeUrl: (i) => `${BASE}assets/textures/pajaros/${i + 1}.png`,
      fps: 12,
      matchNames: ['pajaro', 'pájaro', 'bird'],
    });

    // Referencias a backwalls para control manual desde consola
    let backWall1 = null;
    let backWall2 = null;

    gltf.scene.traverse(o => {
      const n = (o.name || "").toLowerCase();
      if (n.includes("backwall_sala1")) backWall1 = o;
      if (n.includes("backwall_sala2")) backWall2 = o;
    });

    // API sencilla expuesta en window para adaptar backwalls por sala
    window.setBackWall = (roomId, mul = 1.0) => {
      const obj =
        roomId === "sala1" ? backWall1 :
        roomId === "sala2" ? backWall2 :
        null;

      if (!obj) {
        console.warn("BackWall not found for", roomId);
        return;
      }

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach(mat => {
        mat.color.multiplyScalar(mul);
        if (roomId === "sala1" && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity *= mul;
        }
        mat.needsUpdate = true;
      });

      console.log(`BackWall ${roomId} multiplicada por`, mul);
    };

    // Baseline global de envMapIntensity para evitar brillos excesivos
    gltf.scene.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => {
        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          mat.envMapIntensity = 0.1;
          mat.needsUpdate = true;
        }
      });
    });

    // Importación de la iluminación embebida en el GLB
    setupLighting(gltf.scene, scene);

    window.setRoomLight = setRoomBoost;
    window.getRoomLight = getRoomBoost;

    // Ajustes específicos para Sala 2
    let sala2 = null;
    gltf.scene.traverse(obj => {
      const name = (obj.name || "").toLowerCase();
      if (name.includes("sala") && name.includes("2") && !sala2) {
        sala2 = obj;
      }
    });

    if (!sala2) {
      console.warn("Sala 2 not found in GLB");
    } else {
      console.log("Sala 2 found:", sala2.name);

      sala2.traverse(o => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(mat => {
            if (mat.envMapIntensity !== undefined) {
              mat.envMapIntensity = 0.0;
            }
            if (mat.roughness !== undefined && mat.roughness < 0.8) {
              mat.roughness = 0.8;
            }
            mat.needsUpdate = true;
          });
        }
      });
    }

    // Ajustes específicos para Sala 1
    let sala1 = null;
    gltf.scene.traverse(obj => {
      const name = (obj.name || "").toLowerCase();
      if (name.includes("sala") && name.includes("1") && !sala1) {
        sala1 = obj;
      }
    });

    if (!sala1) {
      console.warn("Sala 1 not found in GLB");
    } else {
      console.log("Sala 1 found:", sala1.name);

      // Pequeña luz ambiental adicional para Sala 1
      addAmbientToSala(sala1, 0.005);

      sala1.traverse(o => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(mat => {
            if (mat.envMapIntensity !== undefined) {
              mat.envMapIntensity = 0.0;
            }
            if (mat.roughness !== undefined && mat.roughness < 0.8) {
              mat.roughness = 0.8;
            }
            mat.needsUpdate = true;
          });
        }
      });
    }

    // Bounding box global de la escena para obtener tamaño y centro
    const box    = new THREE.Box3().setFromObject(gltf.scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const diag   = Math.max(size.length(), 1);
    const nearSafe = Math.max(0.05, diag * 0.0015);
    const farSafe  = Math.min(1e6,  diag * 40);

    if (DEBUG_HELPERS) {
      boxHelper = new THREE.Box3Helper(box, 0xff00ff);
      axes      = new THREE.AxesHelper(Math.max(1, diag * 0.1));
      scene.add(boxHelper, axes);
    }

    // Cámara de depuración orbital
    debugCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, nearSafe, farSafe);
    debugCam.position.copy(center).add(new THREE.Vector3(0, diag * 0.4, diag * 1.8));
    debugCam.lookAt(center);

    // Extracción de cámaras embebidas en el GLB
    cameraNodes = [];
    gltf.scene.traverse(o => {
      if (o.isCamera) cameraNodes.push(o);
    });

    let camNode =
      cameraNodes.find(c => c.name === 'Main_Camera') ||
      cameraNodes[0] ||
      null;

    if (camNode) {
      activeCamera = camNode;
      activeCamera.near = nearSafe;
      activeCamera.far  = farSafe;

      // Ajuste de FOV para dar mayor profundidad a la cámara principal
      activeCamera.fov = 75;
      activeCamera.updateProjectionMatrix();

      console.log('Using camera:', activeCamera.name);
      window.cam = activeCamera;
    }

    if (DEBUG_HELPERS) {
      camHelper = new THREE.CameraHelper(activeCamera);
      scene.add(camHelper);

      camProbe = new THREE.Mesh(
        new THREE.SphereGeometry(diag * 0.02, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true })
      );
      scene.add(camProbe);
    }

    // initPostFX(); // opcional, se deja preparado para activar bloom

    // ------------------------------------------------
    // Animaciones (cámara principal + animaciones secundarias)
    // ------------------------------------------------
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      window.mixer = mixer;

      const clips = gltf.animations;

      console.log('GLB clips:',
        clips.map((c, i) => ({
          i,
          name: c.name,
          dur: c.duration.toFixed(2)
        }))
      );

      const mainClip = findMainCameraClip(clips, cameraNodes, activeCamera);

      console.log('Main camera clip:',
        mainClip?.name, mainClip?.duration?.toFixed(2)
      );

      const mainAction = mixer.clipAction(mainClip);
      action = mainAction;

      mainAction.reset();
      mainAction.enabled = true;
      mainAction.setLoop(THREE.LoopOnce, 0);
      mainAction.setEffectiveWeight(1);
      mainAction.setEffectiveTimeScale(0);
      mainAction.play();
      mainAction.time = 0.0001;

      mixer.update(0);
      gltf.scene.updateMatrixWorld(true);

      // Resto de clips secundarios en loop infinito
      clips.forEach((c) => {
        if (c === mainClip) return;
        const a = mixer.clipAction(c);
        a.reset();
        a.enabled = true;
        a.setLoop(THREE.LoopRepeat, Infinity);
        a.setEffectiveWeight(1);
        a.setEffectiveTimeScale(1);
        a.play();
      });

      // Depuración manual: scrubbing directo del timeline de cámara
      window.scrub = (t) => {
        const clamped = THREE.MathUtils.clamp(t, 0, mainClip.duration - 1e-4);
        mainAction.time = clamped;
        mixer.update(0);
        gltf.scene.updateMatrixWorld(true);
      };

      // Conexión con el controlador de secciones (camino de cámara)
      sectionsCtl = setupSections(mixer, mainClip, {
        startBtn,
        hint,

        // Antes de mover la cámara a la siguiente sección
        onSectionWillChange(idx) {
          // Audio por sala
          audioCtl.setScene(idx);
          audioCtl.enableLFO(idx === 2);

          if (idx === 0) return 0;

          const tl = animateSectionTitleOut();
          return tl ? tl.duration() : 0;
        },

        // Cuando la cámara llega a la sección destino
        onSectionChange(idx) {
          document.body.classList.toggle('ui-nav-ready', idx >= 1);

          if (idx !== 0) {
            animateSectionTitleIn(idx);
          }
        },

      }, { action: mainAction });

      console.log('[PERF] sectionsCtl ready at', performance.now().toFixed(1), 'ms');

      if (queuedHome)  { goHome(); queuedHome = false; }

      if (queuedStart) {
        console.log('[PERF] running queued start now');
        sectionsCtl.start?.({ showUIAfter: true });
        queuedStart = false;
      }

      // Precalentamiento de la ruta de cámara desactivado en esta versión.
      // Se deja comentado porque hacía que la cámara diera la vuelta completa antes de iniciar.
      // Si se reactiva, conviene bajar "samples" para reducir el coste inicial.
//    prewarmCameraPath({
//      mixer,
//      clip: mainClip,
//      action: mainAction,
//      camera: activeCamera,
//      scene,
//      renderer,
//      samples: 14,   // al reactivar, considerar valores 3–4 para reducir coste
//    });

    } else {
      // Caso sin animaciones: la experiencia arranca en modo "estático"
      console.warn('GLB has no animations.');
      startIntro?.addEventListener('click', () => {
        intro?.classList.add('hidden');
        header?.classList.remove('hidden');
        bottomNav?.classList.remove('hidden');
        heroEl?.classList.remove('hidden');
        hint?.classList.remove('hidden');
      }, { once: true });
    }

    // Precalentamiento del renderer WebGL:
    // compila shaders y hace uno o dos renders iniciales
    try {
      console.time('[PERF] prewarm');
      const cam = activeCamera || debugCam;
      if (cam) {
        renderer.compile(scene, cam);
        renderer.render(scene, cam);
        renderer.render(scene, cam);
        console.log('Renderer prewarmed after GLB load');
      }
      console.timeEnd('[PERF] prewarm');
    } catch (e) {
      console.warn('Error prewarming renderer:', e);
    }

    // Fin del trabajo asociado al GLB:
    // 1) Oculta el loader
    // 2) Muestra el overlay de intro con el botón de inicio
    if (loaderEl) {
      loaderEl.classList.add('hidden');  // fade-out loader
    }

    if (intro) {
      intro.classList.remove('hidden');
    }

    console.timeEnd('[PERF] GLB onLoad work');
  },
  (e) => {
    const p = e?.loaded && e?.total ? (100 * e.loaded / e.total).toFixed(1) : '';
    if (p) console.log(`GLB ${p}%`);
  },
  (err) => console.error('GLB load failed:', err)
);



// --------------------------------------------------
// Controles de teclado para depuración en tiempo real
// --------------------------------------------------
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (k === 'c') {
    useDebugCam = !useDebugCam;
    console.log('debugCam:', useDebugCam ? 'ON' : 'OFF');
  }

  if (k === 'm') {
    overrideOn = !overrideOn;
    scene.overrideMaterial = overrideOn
      ? new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
      : null;
    console.log('override material:', overrideOn ? 'ON' : 'OFF');
  }

  if (e.key === '[') boostLightsDown();
  if (e.key === ']') boostLightsUp();
});

// --------------------------------------------------
// Métricas de performance
// Registra tiempos promedio y máximos de mixer, pájaros y render.
// --------------------------------------------------
const PERF = {
  frames: 0,
  mixer:  { total: 0, max: 0 },
  birds:  { total: 0, max: 0 },
  render: { total: 0, max: 0 },
};

function _accum(label, dt) {
  const slot = PERF[label];
  slot.total += dt;
  if (dt > slot.max) slot.max = dt;
}

// --------------------------------------------------
// Loop de render principal
// Controla animaciones, pájaros y renderizado con o sin postFX.
// --------------------------------------------------
function render() {
  requestAnimationFrame(render);

  const delta = clock.getDelta();
  PERF.frames++;

  // Si hay panel 2D abierto, se pausa el render 3D para ahorrar recursos
  if (overlayOpen) {
    return;
  }

  // Mixer de animaciones (cámara + animaciones secundarias)
  const m0 = performance.now();
  if (mixer) mixer.update(delta);
  _accum('mixer', performance.now() - m0);

  // Actualización de flipbook de pájaros
  const b0 = performance.now();
  updateBirdsFlipbook(delta);
  _accum('birds', performance.now() - b0);

  _updateDebug();

  // Render 3D con o sin compositor de postFX
  const r0 = performance.now();
  const currentCamera = (useDebugCam && debugCam) ? debugCam : activeCamera;

  if (composer && !useDebugCam) {
    renderPass.camera = currentCamera;
    composer.render();
  } else {
    renderer.render(scene, currentCamera);
  }
  _accum('render', performance.now() - r0);

  // Reporte de métricas cada 120 frames (~2 segundos en dev)
  if (import.meta.env.DEV && PERF.frames % 120 === 0) {
    const f = PERF.frames;
    console.table({
      mixer_avg:  (PERF.mixer.total  / f).toFixed(3),
      mixer_max:  PERF.mixer.max.toFixed(3),
      birds_avg:  (PERF.birds.total  / f).toFixed(3),
      birds_max:  PERF.birds.max.toFixed(3),
      render_avg: (PERF.render.total / f).toFixed(3),
      render_max: PERF.render.max.toFixed(3),
    });
  }
}


// Lanzar el loop de render principal
render();


// --------------------------------------------------
// Resize handler optimizado
// Evita recomputar si el tamaño no ha cambiado realmente.
// --------------------------------------------------
let _lastW = innerWidth;
let _lastH = innerHeight;

function handleResize(force = false) {
  const w = window.innerWidth  || 1;
  const h = window.innerHeight || 1;

  // Si no cambió el tamaño y no es forzado, no se realizan ajustes
  if (!force && w === _lastW && h === _lastH) return;

  _lastW = w;
  _lastH = h;

  renderer.setSize(w, h);

  const aspect = w / h;

  if (activeCamera) {
    activeCamera.aspect = aspect;
    activeCamera.updateProjectionMatrix();
  }

  if (debugCam) {
    debugCam.aspect = aspect;
    debugCam.updateProjectionMatrix();
  }

  if (composer) {
    composer.setSize(w, h);
  }
}

// Listener de resize con comportamiento pasivo
window.addEventListener('resize', () => handleResize(false), { passive: true });

// Llamada inicial de seguridad por si hubo cambios antes
handleResize(true);



// --------------------------------------------------
// Inicialización base de GSAP (tweens globales de UI)
// --------------------------------------------------
initGsapBase();
