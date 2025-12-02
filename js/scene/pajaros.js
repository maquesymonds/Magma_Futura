// js/scene/pajaros.js
// Sistema de flipbook para animar pájaros mediante cambio de textura.

import * as THREE from 'three';

const birds = [];
const flapFrames = [];

let flapIndex = 0;
let flapAccumulator = 0;
let flapFrameTime = 1 / 12;

let isReady = false;
let _logOnce = false;

export function setupBirdsFlipbook(
  root,
  {
    frameCount = 10,
    makeUrl = (i) => `/assets/textures/pajaros/${i + 1}.png`,
    fps = 12,
    matchNames = ['pajaro', 'pájaro', 'bird'],
  } = {}
) {
  if (!root) return;

  const textureLoader = new THREE.TextureLoader();
  birds.length = 0;
  flapFrames.length = 0;
  isReady = false;

  flapIndex = 0;
  flapAccumulator = 0;
  flapFrameTime = 1 / Math.max(fps, 1);

  // Buscar meshes de pájaros por nombre
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const name = (obj.name || '').toLowerCase();
    const isBird = matchNames.some((key) => name.includes(key));
    if (isBird) birds.push(obj);
  });

  if (!birds.length) {
    if (!_logOnce) {
      console.warn(
        '[birds] No se encontraron meshes de pájaros. Revisá los nombres o matchNames en setupBirdsFlipbook.'
      );
      _logOnce = true;
    }
    return;
  }

  console.log('[birds] Pájaros encontrados:', birds.map((b) => b.name));

  // Cargar frames de la animación
  for (let i = 0; i < frameCount; i++) {
    const url = makeUrl(i);
    const tex = textureLoader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    flapFrames.push(tex);
  }

  if (!flapFrames.length) {
    console.warn('[birds] No se cargaron texturas para el flipbook.');
    return;
  }

  // Asignar primer frame y parámetros de transparencia
  birds.forEach((bird) => {
    const applyToMat = (m) => {
      if (!m) return;
      m.map = flapFrames[0];
      m.transparent = true;
      m.alphaTest = 0.5;
      m.depthWrite = false;
      m.needsUpdate = true;
    };

    if (Array.isArray(bird.material)) {
      bird.material.forEach(applyToMat);
    } else {
      applyToMat(bird.material);
    }
  });

  isReady = true;
  console.log('[birds] Flipbook inicializado con', flapFrames.length, 'frames a', fps, 'fps.');
}

// Actualiza el frame actual del flipbook según delta de tiempo
export function updateBirdsFlipbook(delta) {
  if (!isReady || !birds.length || !flapFrames.length) return;
  if (delta <= 0) return;

  flapAccumulator += delta;

  while (flapAccumulator >= flapFrameTime) {
    flapAccumulator -= flapFrameTime;
    flapIndex = (flapIndex + 1) % flapFrames.length;

    const tex = flapFrames[flapIndex];

    birds.forEach((bird) => {
      const applyToMat = (m) => {
        if (!m) return;
        m.map = tex;
      };

      if (Array.isArray(bird.material)) {
        bird.material.forEach(applyToMat);
      } else {
        applyToMat(bird.material);
      }
    });
  }
}
