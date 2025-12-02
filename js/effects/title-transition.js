// js/effects/title-transition.js
// Animación de títulos con máscara vertical:
// - Intro OUT: h1 y h2 se desplazan hacia abajo y salen por debajo de la máscara.
// - Foyer IN: h1 y h2 entran desde abajo y quedan visibles.
//
// Requiere en el HTML:
//   <div id="intro" class="centered">
//     <div class="intro-inner">
//       <div class="intro-line-mask">
//         <h1 class="intro-brand intro-line">...</h1>
//       </div>
//       <div class="intro-line-mask">
//         <h2 class="intro-presenta intro-line">...</h2>
//       </div>
//       <button id="startIntro">...</button>
//     </div>
//   </div>

import gsap from "gsap";

(() => {
  const intro      = document.getElementById("intro");
  const introInner = intro ? intro.querySelector(".intro-inner") : null;
  const cta        = document.getElementById("startIntro");

  if (!intro || !introInner || !cta) return;

  // Líneas a animar (títulos dentro de la máscara)
  const lines = intro.querySelectorAll(".intro-line");
  if (!lines.length) return;

  // Estado inicial: líneas visibles en su posición final
  gsap.set(lines, {
    yPercent: 0,
    autoAlpha: 1
  });

  // --------------------------------------------------
  // Intro OUT: las líneas descienden y salen de la máscara
  // --------------------------------------------------
  function introLinesOut(){
    const tl = gsap.timeline({
      defaults: {
        duration: 1.1,
        ease: "power4.inOut"
      }
    });

    tl.to(lines, {
      yPercent: 110,  // desplazamiento suficiente para salir del área visible
      autoAlpha: 1,
      stagger: 0
    });

    return tl;
  }

  // --------------------------------------------------
  // Foyer IN: las líneas entran desde abajo y quedan visibles
  // Se invoca cuando la cámara termina de entrar al foyer.
  // --------------------------------------------------
  function foyerLinesIn(){
    const tl = gsap.timeline({
      defaults: {
        duration: 1.1,
        ease: "power4.inOut"
      }
    });

    // Estado previo: ocultas por debajo de la máscara
    gsap.set(lines, {
      yPercent: 110,
      autoAlpha: 1
    });

    tl.to(lines, {
      yPercent: 0,
      autoAlpha: 1,
      stagger: 0
    });

    return tl;
  }

  // Click en el CTA: dispara la animación de salida de la intro
  cta.addEventListener("click", () => {
    const tl = introLinesOut();

    // Ejemplo de integración con main.js:
    // tl.eventCallback("onComplete", () => {
    //   document.dispatchEvent(new CustomEvent("introTitleOutDone"));
    // });
  });

  // Exporta la animación de entrada para ser usada desde el core 3D
  window.foyerTitleIn = foyerLinesIn;
})();
