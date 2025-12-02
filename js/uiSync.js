// js/uisync.js
// Utilidades para convertir coordenadas 3D del mundo a posiciones 2D en pantalla.
// Permiten sincronizar overlays HTML con objetos dentro de la escena 3D.
// Lo voy a usar mas adeltante cuando haga el efecto de hover en los objetos. 

import * as THREE from 'three';

/**
 * Convierte una posición en coordenadas de mundo a coordenadas UV de pantalla.
 * El resultado es un Vector2 en el rango [0,1] x [0,1], relativo al viewport.
 *
 * @param {THREE.Vector3} worldPosition - Posición en el espacio 3D.
 * @param {THREE.Camera} camera - Cámara activa utilizada para la proyección.
 * @returns {THREE.Vector2} UV normalizado en pantalla.
 */
export function getScreenUVFromWorld(worldPosition, camera) {
  // Se proyecta la posición sobre el plano de pantalla usando la matriz de la cámara.
  const projected = worldPosition.clone().project(camera);

  // Conversión de espacio clip (-1..1) a UV (0..1).
  return new THREE.Vector2(
    (projected.x + 1) / 2,
    (1 - projected.y) / 2
  );
}

/**
 * Devuelve las coordenadas absolutas en pantalla (en píxeles)
 * correspondientes a una posición en el mundo 3D.
 * Es útil para posicionar elementos HTML sobre objetos 3D.
 *
 * @param {THREE.Vector3} worldPosition - Posición en el espacio 3D.
 * @param {THREE.Camera} camera - Cámara activa.
 * @param {THREE.WebGLRenderer} renderer - Renderer desde el cual se obtiene el rectángulo del canvas.
 * @returns {THREE.Vector2} Posición en píxeles dentro del viewport.
 */
export function getScreenPositionFromWorld(worldPosition, camera, renderer) {
  // Primero se obtiene la posición UV normalizada.
  const uv = getScreenUVFromWorld(worldPosition, camera);

  // Obtiene el tamaño y offset del canvas en la página.
  const rect = renderer.domElement.getBoundingClientRect();

  // Conversión UV → píxeles absolutos.
  return new THREE.Vector2(
    uv.x * rect.width + rect.left,
    uv.y * rect.height + rect.top
  );
}
