// js/audio/audio-controller.js
// Controlador de audio para la experiencia:
// - Gestiona un loop base con filtros por sala (Web Audio API).
// - Dispara whooshes de transición precargados en memoria.

export function createAudioController({
  baseURL   = '/audio/main-loop.mp3',
  whooshURL = null,         // se mantiene por compatibilidad
  startBtn  = null,
} = {}) {
  // --------------------------------------------------
  // Contexto de audio
  // --------------------------------------------------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  let started = false;

  // --------------------------------------------------
  // Fuente principal (loop) vía <audio>
  // --------------------------------------------------
  const media = new Audio(baseURL);
  media.loop = true;
  media.preload = 'auto';
  media.crossOrigin = 'anonymous';

  const src      = ctx.createMediaElementSource(media);
  const gainMain = ctx.createGain();
  const hp       = ctx.createBiquadFilter();  hp.type = 'highpass';
  const lp       = ctx.createBiquadFilter();  lp.type = 'lowpass';

  // Cadena de procesamiento: src -> HP -> LP -> Gain -> out
  src.connect(hp);
  hp.connect(lp);
  lp.connect(gainMain);
  gainMain.connect(ctx.destination);

  // Estado inicial (loop preparado pero en silencio)
  gainMain.gain.value = 0.0;
  hp.frequency.value  = 40;
  lp.frequency.value  = 16000;

  // Helper de rampa suave para parámetros de Web Audio
  function ramp(param, v, t = 0.8) {
    const now = ctx.currentTime;
    try {
      param.cancelScheduledValues(now);
      param.setTargetAtTime(v, now, Math.max(0.05, t * 0.25));
    } catch (e) {
      console.warn('[audio] ramp error:', e);
    }
  }

  // ============================================================
  // Whooshes por escena
  // ============================================================
  const WHOOSH_URLS = {
    1: '/audio/Whoosh-Foyer.mp3',
    2: '/audio/Whoosh-Sala1.mp3',
    3: '/audio/Whoosh-Sala2.mp3',
    4: '/audio/Whoosh-Sala3.mp3',
  };

  const whooshBufs = {};   // idx -> AudioBuffer

  async function loadWhoosh(url) {
    const res = await fetch(url, { cache: 'force-cache' });
    const arr = await res.arrayBuffer();
    return await ctx.decodeAudioData(arr);
  }

  // Precarga de todos los whooshes en segundo plano
  (async () => {
    for (const [idx, url] of Object.entries(WHOOSH_URLS)) {
      try {
        whooshBufs[idx] = await loadWhoosh(url);
        console.log(`[audio] Whoosh escena ${idx} cargado (${url})`);
      } catch (e) {
        console.warn('[audio] Error cargando whoosh', idx, url, e);
      }
    }
  })();

  let lastWhooshT = 0;

  // Reproduce un whoosh asociado a una escena (1–4)
  function playWhoosh(idx, { vol = 0.7, delay = 0.0, minGap = 0.35 } = {}) {
    const buf = whooshBufs[idx];
    if (!buf) return;

    const now = ctx.currentTime;
    if (now - lastWhooshT < minGap) return;
    lastWhooshT = now;

    const srcB = ctx.createBufferSource();
    srcB.buffer = buf;

    const g = ctx.createGain();
    g.gain.value = 0;

    srcB.connect(g);
    g.connect(ctx.destination);

    const t0  = now + delay;
    const dur = buf.duration || 0.6;

    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.setValueAtTime(vol, t0 + Math.max(0, dur - 0.12));
    g.gain.linearRampToValueAtTime(0, t0 + dur);

    srcB.start(t0);
  }

  // ============================================================
  // LFO opcional (modulación suave para Sala 1)
  // ============================================================
  let lfoOn  = false;
  let lfoReq = 0;
  let lpBase = lp.frequency.value; // valor base de LP según escena

  function tickLFO() {
    if (!lfoOn) return;
    const t = ctx.currentTime;
    const mult = 1 + 0.10 * Math.sin(t * 0.314); // ~0.05 Hz
    const target = Math.max(200, lpBase * mult);
    lp.frequency.setValueAtTime(target, t);
    lfoReq = requestAnimationFrame(tickLFO);
  }

  function enableLFO(on = true) {
    if (on === lfoOn) return;
    lfoOn = on;
    if (!on && lfoReq) cancelAnimationFrame(lfoReq);
    if (on) tickLFO();
  }

  // ============================================================
  // Presets por sala (EQ y nivel de mezcla)
  // ============================================================
  let firstScene = true;

  function setScene(idx) {
    // Whoosh sincronizado con el cambio de sala
    playWhoosh(idx, { vol: 0.9, delay: 0.0 });

    switch (idx) {
      case 1: // Foyer
        ramp(hp.frequency, 40);
        ramp(lp.frequency, 16000); lpBase = 16000;

        if (firstScene) {
          // Primer ingreso: fade-in más largo
          ramp(gainMain.gain, 0.70, 1.5);
          firstScene = false;
        } else {
          ramp(gainMain.gain, 0.70, 0.8);
        }
        break;

      case 2: // Sala 1 — tratamiento tipo “bajo el agua”
        ramp(hp.frequency, 150);
        ramp(lp.frequency, 900);   lpBase = 900;
        ramp(gainMain.gain, 0.62);
        break;

      case 3: // Sala 2 — sonido más seco
        ramp(hp.frequency, 220);
        ramp(lp.frequency, 8000);  lpBase = 8000;
        ramp(gainMain.gain, 0.58);
        break;

      case 4: // Sala 3 — presente
        ramp(hp.frequency, 60);
        ramp(lp.frequency, 14000); lpBase = 14000;
        ramp(gainMain.gain, 0.72);
        break;

      default: // Estado de intro / mute
        ramp(gainMain.gain, 0.0);
        lpBase = lp.frequency.value;
    }
  }

  // ============================================================
  // Arranque (requiere gesto de usuario)
  // ============================================================
  async function start() {
    if (started) return;

    await ctx.resume();

    media.currentTime = 0;

    const now = ctx.currentTime;
    gainMain.gain.setValueAtTime(0, now);

    try {
      await media.play();
    } catch (e) {
      console.warn('[audio] Loop main no se pudo reproducir:', e);
    }

    started = true;
    // El fade-in real se controla con setScene(1) cuando la cámara entra al foyer
  }

  // Vincular botón de inicio si existe
  if (startBtn) {
    startBtn.addEventListener('click', () => start(), { once: true });
  }

  // API pública del controlador
  return {
    start,
    setScene,
    enableLFO,
    playWhoosh,
    ctx,
    media,
    nodes: { gainMain, hp, lp },
  };
}
