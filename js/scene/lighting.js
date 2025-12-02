// js/scene/lighting.js
// Sistema de iluminación: normaliza luces importadas y aplica animaciones por sala.

import * as THREE from 'three';
import gsap from "gsap";

let importedLights = [];
let LIGHT_BOOST = 0.5;

// Límites y parámetros globales de boost
const MIN_BOOST  = 0.001;
const MAX_BOOST  = 50;
const STEP_DEC   = 2.0;   // factor de bajada con '['
const STEP_INC   = 1.25;  // factor de subida con ']'
const TARGET_MAX = 3.0;   // intensidad máxima objetivo tras normalizar

// Factores de intensidad por sala
const ROOM_BOOSTS = {
  default: 1.0,
  sala1:   1,
  sala2:   2,
  sala3:   1.0,
  foyer:   1.0,
};

// --------------------------------------------------
// Helpers de detección de sala por nombre
// --------------------------------------------------
function getRoomId(obj) {
  let current = obj;
  while (current) {
    const name = (current.name || '').toLowerCase();

    if (name.includes('sala') && name.includes('1')) return 'sala1';
    if (name.includes('sala') && name.includes('2')) return 'sala2';
    if (name.includes('sala') && name.includes('3')) return 'sala3';
    if (name.includes('foyer') || name.includes('hall')) return 'foyer';

    current = current.parent;
  }
  return 'default';
}

function isInSala2(obj) {
  return getRoomId(obj) === 'sala2';
}

// --------------------------------------------------
// Reaplicar intensidades con el boost global + por sala
// --------------------------------------------------
function recomputeLightIntensities() {
  importedLights.forEach(l => {
    const base   = l.userData._baseIntensity ?? 1;
    const roomId = l.userData._roomId || 'default';
    const roomBoost = ROOM_BOOSTS[roomId] ?? ROOM_BOOSTS.default;

    l.intensity = base * LIGHT_BOOST * roomBoost;
  });

  console.log(
    'light boost =', LIGHT_BOOST.toFixed(3),
    '| room boosts =',
    Object.entries(ROOM_BOOSTS)
      .map(([k, v]) => `${k}:${v.toFixed(2)}`)
      .join(', ')
  );
}

function applyBoostInternal(f) {
  LIGHT_BOOST = THREE.MathUtils.clamp(f, MIN_BOOST, MAX_BOOST);
  recomputeLightIntensities();
}

// --------------------------------------------------
// Animación simple de encendido (una vez)
// --------------------------------------------------
function animateLightOn(light, targetIntensity, duration = 1.5) {
  if (!light) return;

  const target = (typeof targetIntensity === 'number')
    ? targetIntensity
    : (light.intensity || 2);

  light.intensity = 0;

  gsap.to(light, {
    intensity: target,
    duration,
    ease: 'sine.inOut',
    repeat: 0
  });
}

// --------------------------------------------------
// Flicker para una luz (tubo que parpadea al azar)
// --------------------------------------------------
function setupFlickerLight(
  light,
  {
    offFactor = 0.02,
    minWait  = 1.5,
    maxWait  = 5.0,
    minBursts = 2,
    maxBursts = 5
  } = {}
) {
  if (!light) return;

  const base = light.intensity || light.userData._baseIntensity || 1;

  function scheduleNext() {
    const delay = THREE.MathUtils.randFloat(minWait, maxWait);
    gsap.delayedCall(delay, flicker);
  }

  function flicker() {
    const bursts = Math.floor(
      THREE.MathUtils.randFloat(minBursts, maxBursts + 1)
    );

    gsap.to(light, {
      intensity: base * offFactor,
      duration: 0.06,
      ease: 'power2.in',
      yoyo: true,
      repeat: bursts * 2 - 1,
      repeatDelay: 0.03,
      onComplete: () => {
        light.intensity = base;
        scheduleNext();
      }
    });
  }

  // Arranca el primer ciclo de flicker
  scheduleNext();
}

// --------------------------------------------------
// Configuración principal al cargar luces del GLB
// --------------------------------------------------
export function setupLighting(root, scene) {
  importedLights = [];
  root.traverse(o => {
    if (o.isLight) importedLights.push(o);
  });

  if (!importedLights.length) {
    console.warn('No lights found in GLB.');
    return;
  }

  // Guardar intensidades originales y ajustar parámetros físicos por tipo
  importedLights.forEach(l => {
    l.userData._origIntensity = l.intensity;

    if (l.isSpotLight) {
      l.angle    = Math.max(l.angle, Math.PI / 6);
      l.penumbra = Math.max(l.penumbra ?? 0, 0.3);
      l.decay    = 2;
    }
    if (l.isPointLight) {
      l.decay = 2;
    }
  });

  // Normalización global a TARGET_MAX, usando intensidades originales
  const nonZero = importedLights
    .map(l => l.userData._origIntensity)
    .filter(v => Number.isFinite(v) && v > 0);

  let normFactor = 1.0;
  if (nonZero.length) {
    const maxI = Math.max(...nonZero);
    normFactor = THREE.MathUtils.clamp(TARGET_MAX / maxI, MIN_BOOST, MAX_BOOST);
    console.log(
      'auto-normalized lights: max =',
      maxI.toFixed(2),
      '→ factor =',
      normFactor.toFixed(3)
    );
  }

  // Aplicar normalización y factor base por sala
  importedLights.forEach(l => {
    const roomId = getRoomId(l);
    l.userData._roomId = roomId;

    // Ajuste base específico para Sala 2
    const roomBase = roomId === 'sala2' ? 0.35 : 1.0;

    const base = (l.userData._origIntensity || 1) * normFactor * roomBase;
    l.userData._baseIntensity = base;
  });

  // Primer cálculo con boosts globales y por sala
  recomputeLightIntensities();

  // Luz ambiente global muy suave
  const ambient = new THREE.AmbientLight(0xffffff, 0.03);
  scene.add(ambient);

  console.log(
    'GLB lights:',
    importedLights.map(l => ({
      type: l.type,
      int: l.intensity.toFixed(2),
      name: l.name,
      room: l.userData._roomId,
      inSala2: isInSala2(l)
    }))
  );

  // Luz pulsante "Latencia" (Sala 3)
  const latencia = importedLights.find(l =>
    (l.name || '').toLowerCase().includes('latencia')
  );

  if (latencia) {
    console.log('[lighting] Pulsing point light:', latencia.name, 'intensity:', latencia.intensity);

    const base = latencia.intensity;

    const min = base * 0.45;
    const max = base * 1.4;

    latencia.intensity = min;

    gsap.to(latencia, {
      intensity: max,
      duration: 2.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  } else {
    console.warn('[lighting] No se encontró luz con "latencia" en el nombre');
  }

  // Ambient pulsante para toda Sala 3
  let sala3 = null;
  root.traverse(o => {
    const n = (o.name || '').toLowerCase();
    if (!sala3 && n.includes('sala') && n.includes('3')) {
      sala3 = o;
    }
  });

  if (sala3) {
    console.log('[lighting] Sala 3 encontrada para ambient pulsante:', sala3.name);

    const ambSala3 = new THREE.AmbientLight(0xffffff, 0.0);
    sala3.add(ambSala3);

    gsap.to(ambSala3, {
      intensity: 0.35,
      duration: 2.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  } else {
    console.warn('[lighting] No se encontró el grupo de "Sala 3"');
  }

  // Foyer: animar "LuzIzquierda" y "LuzDerecha"
  const luzIzquierda = importedLights.find(l =>
    (l.name || '').toLowerCase().includes('luzizquierda')
  );
  const luzDerecha = importedLights.find(l =>
    (l.name || '').toLowerCase().includes('luzderecha')
  );

  console.log('[lighting] foyer lights:', {
    left: luzIzquierda?.name,
    right: luzDerecha?.name,
    leftInt: luzIzquierda?.intensity,
    rightInt: luzDerecha?.intensity
  });

  if (luzIzquierda) animateLightOn(luzIzquierda, 1.5);
  if (luzDerecha)   animateLightOn(luzDerecha, 1.5);

  // Sala 2 – luz "Tintineo" con flicker aleatorio
  const tintineo = importedLights.find(l =>
    (l.name || '').toLowerCase().includes('tintineo')
  );

  if (tintineo) {
    console.log('[lighting] Tintineo encontrado:', tintineo.name, 'intensity:', tintineo.intensity);

    if (!tintineo.intensity && tintineo.userData._baseIntensity) {
      tintineo.intensity = tintineo.userData._baseIntensity;
    }

    setupFlickerLight(tintineo, {
      offFactor: 0.03,
      minWait:  1.8,
      maxWait:  6.0,
      minBursts: 2,
      maxBursts: 5
    });
  } else {
    console.warn('[lighting] No se encontró luz con "Tintineo" en el nombre');
  }
}

// --------------------------------------------------
// Helpers para debug mediante teclado ([ y ])
// --------------------------------------------------
export function boostLightsDown() {
  applyBoostInternal(LIGHT_BOOST / STEP_DEC);
}

export function boostLightsUp() {
  applyBoostInternal(LIGHT_BOOST * STEP_INC);
}

// --------------------------------------------------
// Ambient específico para una sala o grupo
// --------------------------------------------------
export function addAmbientToSala(obj, intensity = 0.02) {
  const amb = new THREE.AmbientLight(0xffffff, intensity);
  obj.add(amb);
}

// --------------------------------------------------
// API pública para controlar salas desde consola
// --------------------------------------------------
export function setRoomBoost(roomId, factor) {
  if (!ROOM_BOOSTS.hasOwnProperty(roomId)) {
    console.warn(`Unknown roomId "${roomId}"`);
    return;
  }
  ROOM_BOOSTS[roomId] = THREE.MathUtils.clamp(factor, 0.01, 10);
  recomputeLightIntensities();
}

export function getRoomBoost(roomId) {
  return ROOM_BOOSTS[roomId] ?? null;
}
