// js/effects/grain-overlay.js
//No lo estoy usando por ahora
import * as THREE from 'three';

/**
 * Overlay de grano usando un VIDEO (VideoTexture)
 * pegado a la cámara.
 *
 * Devuelve { video, texture, material, mesh }
 */
export function addGrainOverlay(camera, options = {}) {
  const {
    url = '/video/grain.mp4',   // ✅ tu video en public/video/grain.mp4
    opacity = 0.40,             // intensidad del grano (bastante bajita)
    blending = THREE.AdditiveBlending
  } = options;

  // 1) <video>
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  // 2) VideoTexture
  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  // 3) Material
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthTest: false,
    depthWrite: false,
    blending,
    premultipliedAlpha: true   // ✅ evita los warnings de MultiplyBlending
  });

  // Debug desde consola
  window.grainMaterial = material;

  // 4) Plane pegado a la cámara
  const geom = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geom, material);
  mesh.name = 'GrainOverlay';

  camera.add(mesh);

  // Lo colocamos delante de la cámara y lo escalamos
  const distance = 0.9;
  mesh.position.set(0, 0, -distance);

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(fov / 2) * distance;
  const width  = height * camera.aspect;
  mesh.scale.set(width, height, 1);

  console.log('✔ Grain VIDEO overlay added');

  return { video, texture, material, mesh };
}

// Por ahora no hace nada, pero la dejamos por compatibilidad
export function updateGrain(delta) {
  // acá podrías hacer flicker si quisieras en el futuro
}
