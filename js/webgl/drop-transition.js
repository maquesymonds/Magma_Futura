// js/webgl/drop-transition.js
import * as THREE from 'three';
import gsap from 'gsap';

let _gl = null;

function makeOverlayCanvas() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'fx-drop-canvas';
  Object.assign(renderer.domElement.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '9999',
    pointerEvents: 'none',
  });
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  camera.position.z = 1;

  const geo = new THREE.PlaneGeometry(2, 2);

  const vert = /* glsl */`
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const frag = /* glsl */`
    precision highp float;
    varying vec2 vUv;

    uniform sampler2D uTexA;
    uniform sampler2D uTexB;
    uniform vec2  uTexASize;
    uniform vec2  uTexBSize;
    uniform vec2  uResolution;   // viewport (px)
    uniform vec2  uOrigin;       // 0..1 en viewport
    uniform float uProgress;
    uniform float uTime;

    // convierte uv NDC a uv "cover" según aspect ratio
    vec2 coverUV(vec2 uv, vec2 texSize, vec2 res){
      float texR = texSize.x / texSize.y;
      float resR = res.x / res.y;
      vec2 st = uv;
      if (resR > texR){
        // pantalla más ancha: escalar Y
        float scale = resR / texR;
        st.y = (st.y - 0.5) * scale + 0.5;
      } else {
        // pantalla más alta: escalar X
        float scale = texR / resR;
        st.x = (st.x - 0.5) * scale + 0.5;
      }
      return st;
    }

    // hash & value noise
    float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
    float vnoise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=h(i), b=h(i+vec2(1,0)), c=h(i+vec2(0,1)), d=h(i+vec2(1,1));
      vec2 u=f*f*(3.-2.*f);
      return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
    }

    void main(){
      // uv en viewport
      vec2 uv = vUv;

      // centro y origen del clic (en coords con aspect)
      vec2 res = uResolution;
      vec2 p = uv - uOrigin;
      p.x *= res.x / res.y;

      float prog = smoothstep(0.0, 1.0, uProgress);
      float dist = length(p);

      // ripple + ruido
      float ripple = 0.015 * sin(40.0*dist - uTime*3.0);
      float n = vnoise(uv*8.0 + uTime*0.2);
      vec2 disp = normalize(p) * ripple * prog + (n - 0.5) * 0.03 * prog;

      // mapeo cover para cada textura (respeta aspecto)
      vec2 uvA = coverUV(uv + disp * (1.0 - prog), uTexASize, uResolution);
      vec2 uvB = coverUV(uv - disp * prog,        uTexBSize, uResolution);

      // sample
      vec4 colA = texture2D(uTexA, uvA);
      vec4 colB = texture2D(uTexB, uvB);

      // máscara circular que ABRE desde el origen
      float radius = mix(0.0, 0.75, prog); // radio crece con progreso
      float edge = 0.02;
      float mask = smoothstep(radius - edge, radius + edge, dist);

      // blur leve para look líquido
      vec2 off = vec2(0.002,0.0);
      vec4 blurA = (colA + texture2D(uTexA, uvA+off) + texture2D(uTexA, uvA-off)
                         + texture2D(uTexA, uvA+off.yx) + texture2D(uTexA, uvA-off.yx)) * 0.2;
      vec4 blurB = (colB + texture2D(uTexB, uvB+off) + texture2D(uTexB, uvB-off)
                         + texture2D(uTexB, uvB+off.yx) + texture2D(uTexB, uvB-off.yx)) * 0.2;

      // al inicio: A, al final: B
      vec4 mixed = mix(blurA, blurB, mask);
      gl_FragColor = mixed;
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTexA:       { value: null },
      uTexB:       { value: null },
      uTexASize:   { value: new THREE.Vector2(1,1) },
      uTexBSize:   { value: new THREE.Vector2(1,1) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uOrigin:     { value: new THREE.Vector2(0.5, 0.5) },
      uProgress:   { value: 0 },
      uTime:       { value: 0 },
    },
    transparent: true
  });

  const mesh = new THREE.Mesh(geo, material);
  scene.add(mesh);

  let rafId;
  const clock = new THREE.Clock();

  function render(){
    material.uniforms.uTime.value += clock.getDelta();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(render);
  }

  function resize(){
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  function destroy(){
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    mesh.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { renderer, scene, camera, mesh, material, render, destroy };
}

function makeColorTexture(color = '#ffffff'){
  const c = new THREE.Color(color);
  const data = new Uint8Array([Math.round(c.r*255), Math.round(c.g*255), Math.round(c.b*255)]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBFormat);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function loadTexture(url){
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      resolve(tex);
    }, undefined, reject);
  });
}

/**
 * Dispara la transición
 * @param {Object} opts
 * @param {string} opts.from       URL imagen de origen (la card)
 * @param {string} opts.to         URL destino o color CSS (ej "#fff")
 * @param {number} opts.duration   segundos (1.1 por defecto)
 * @param {Array}  opts.originXY   [clientX, clientY] del click (opcional)
 * @param {Function} opts.onComplete
 */
export async function playDropTransition({ from, to = '#ffffff', duration = 1.1, originXY = null, onComplete = () => {} }){
  if (_gl) _gl.destroy();
  _gl = makeOverlayCanvas();

  const texA = await loadTexture(from);
  const texB = (typeof to === 'string' && to.startsWith('#'))
    ? makeColorTexture(to)
    : await loadTexture(to);

  _gl.material.uniforms.uTexA.value = texA;
  _gl.material.uniforms.uTexB.value = texB;
  _gl.material.uniforms.uTexASize.value.set(texA.image.width || 1, texA.image.height || 1);
  _gl.material.uniforms.uTexBSize.value.set(
    texB.image?.width ? texB.image.width : 1,
    texB.image?.height ? texB.image.height : 1
  );

  // origen del ripple: punto de clic normalizado 0..1
  if (originXY){
    const x = originXY[0] / window.innerWidth;
    const y = originXY[1] / window.innerHeight;
    _gl.material.uniforms.uOrigin.value.set(x, 1.0 - y); // invertir Y para coords UV
  } else {
    _gl.material.uniforms.uOrigin.value.set(0.5, 0.5);
  }

  _gl.render();

  gsap.fromTo(_gl.material.uniforms.uProgress, { value: 0 }, {
    value: 1,
    duration,
    ease: 'power2.inOut',
    onComplete: () => {
      try { onComplete(); } finally {
        _gl.destroy();
        _gl = null;
      }
    }
  });
}
