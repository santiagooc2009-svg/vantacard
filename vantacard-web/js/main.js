/* ============================================================
   VantaCard — Hero scene animation
   El teléfono viaja hacia la tarjeta; la tarjeta permanece
   verdaderamente fija (misma posición, rotación y Z durante toda
   la escena). Dos reglas duras, verificadas con un repro aislado
   en Playwright:

   1. La tarjeta nunca cambia de translateZ y nunca gira: un objeto
      3D rotado tiene un rango de profundidad (sus esquinas quedan
      más cerca/lejos que su centro). Si dos planos rotados se
      acercan en Z, sus rangos pueden cruzarse aunque el centro de
      uno esté siempre "delante" del otro — eso es lo que causaba
      que el teléfono se viera encima de la tarjeta a media
      animación, sin importar que Z(tarjeta) > Z(teléfono).
   2. El teléfono se "achata" (rotateX/rotateY -> 0) mientras
      todavía está muy lejos en Z, y solo después recorre el resto
      del camino ya plano. Así, en la zona donde su Z se acerca a
      la de la tarjeta, ambos son planos paralelos a la cámara y
      no hay rango de profundidad que se pueda cruzar.

   #heroCopy vive DENTRO del stage pineado (no después, en el flujo
   normal del documento) y se revela ahí mismo durante el zoom. Si
   viviera después de #heroScene, el fade-in terminaría antes de
   que el usuario llegara a hacer scroll hasta él, dejando una
   franja de scroll "muerta" en negro entre el fin del pin y la
   aparición real del contenido.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const heroScene = document.getElementById("heroScene");
  const stage = document.getElementById("stage");
  const world = document.getElementById("world");
  const card = document.getElementById("card3d");
  const phone = document.getElementById("phone3d");
  const orbsBack = document.getElementById("orbsBack");
  const orbsMid = document.getElementById("orbsMid");
  const orbsFront = document.getElementById("orbsFront");
  const ripple = document.getElementById("nfcRipple");
  const glow = document.getElementById("screenGlow");
  const contactShadow = document.getElementById("contactShadow");
  const heroCopy = document.getElementById("heroCopy");

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  gsap.registerPlugin(ScrollTrigger);

  // Nav gets a solid background once we've scrolled past the hero.
  // A plain "scroll" listener re-runs on every frame; ScrollTrigger
  // batches this into the same rAF pass as everything else on the
  // page instead. This toggle is a state change, not motion, so it
  // runs the same way regardless of prefers-reduced-motion.
  ScrollTrigger.create({
    trigger: heroScene,
    start: "bottom top+=80",
    onEnter: () => nav.classList.add("nav--solid"),
    onLeaveBack: () => nav.classList.remove("nav--solid"),
  });

  // "Cómo funciona": each step pins in place and shrinks/fades as the
  // next one arrives, so the page reads as one sequence instead of a
  // static three-card row.
  const steps = gsap.utils.toArray(".how__step");
  if (!prefersReduced && steps.length > 1) {
    steps.forEach((step, i) => {
      if (i === steps.length - 1) return;
      ScrollTrigger.create({
        trigger: step,
        start: "top top+=64",
        endTrigger: steps[steps.length - 1],
        end: "top top+=64",
        pin: true,
        pinSpacing: false,
      });
      gsap.to(step, {
        scale: 0.86,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: steps[i + 1],
          start: "top bottom",
          end: "top top+=64",
          scrub: true,
        },
      });
    });
  }

  // Fade + rise-in for section headings, plan cards, and footer
  // columns as they enter the viewport. Runs even under reduced
  // motion (that just makes the CSS transition instant, per the
  // global @media rule in styles.css) so content never gets stuck
  // invisible for a user who can't trigger the animated version.
  ScrollTrigger.batch(".reveal-up", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }),
  });

  // Spotlight border on plan cards: track the cursor into CSS custom
  // properties the ::before ring reads. Plain pointermove on two
  // small cards, not a scroll-frame cost, so it's fine outside the
  // ScrollTrigger/ban-on-scroll-listeners rule (that rule targets
  // window-level scroll polling, not local pointer tracking).
  document.querySelectorAll(".plan").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Final settled positions. The card's Z (60) never changes anywhere
  // in the timeline — it truly stays put. The phone's settled Z (28)
  // stays well below it with a comfortable margin. Y values place the
  // card's bottom edge flush against the phone's top edge (both are
  // flat rectangles by the time they're this close, so the touch
  // point is exact, not just "close enough").
  const CARD_Z = 60;
  const CARD_SETTLED = { x: 0, y: -135, z: CARD_Z, rotateX: 0, rotateY: 0, scale: 1 };
  const PHONE_SETTLED = { x: 0, y: 196, z: 28, rotateX: 0, rotateY: 0, scale: 1 };
  const SHADOW_Y = 432;
  const TAP_Y = 60;

  gsap.set([card, phone], { xPercent: -50, yPercent: -50 });
  gsap.set([ripple, glow, contactShadow], { xPercent: -50, yPercent: -50 });

  if (prefersReduced || typeof gsap === "undefined") {
    // Static, already-settled composition. No scroll-jacking.
    gsap.set(card, CARD_SETTLED);
    gsap.set(phone, PHONE_SETTLED);
    gsap.set(contactShadow, { y: SHADOW_Y, opacity: 0.5, scale: 1 });
    gsap.set(heroScene, { height: "100vh" });
    gsap.set(heroCopy, { opacity: 1, y: 0, pointerEvents: "auto" });
    return;
  }

  // Card: fully static from the very first frame. It never moves,
  // rotates, or changes depth for the rest of the scene.
  gsap.set(card, CARD_SETTLED);

  // Phone: starts small and far away, tilted as if just glanced at.
  gsap.set(phone, {
    x: 30,
    y: 260,
    z: -1600,
    rotateX: -8,
    rotateY: 20,
    scale: 0.4,
  });
  gsap.set(contactShadow, { y: SHADOW_Y, opacity: 0, scale: 0.55 });
  gsap.set(glow, { y: TAP_Y, opacity: 0, scale: 0.3 });
  gsap.set(ripple, { y: TAP_Y, opacity: 0, scale: 0.2 });
  gsap.set(heroCopy, { opacity: 0, y: 30, pointerEvents: "none" });
  gsap.set(world, { scale: 1, opacity: 1 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: heroScene,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      pin: stage,
      anticipatePin: 1,
    },
  });

  // ---- Phase 1a: de-tilt while still far away (0 -> 0.22) ----
  // The phone straightens out to face the camera square-on well
  // before its depth gets anywhere near the card's.
  tl.to(
    phone,
    { rotateX: 0, rotateY: 0, z: -650, x: 12, y: 150, scale: 0.62, duration: 0.22, ease: "power1.inOut" },
    0
  )
    .to(orbsBack, { yPercent: -5, duration: 0.5, ease: "none" }, 0)
    .to(orbsMid, { yPercent: -9, duration: 0.5, ease: "none" }, 0)
    .to(orbsFront, { yPercent: -14, duration: 0.5, ease: "none" }, 0)

    // ---- Phase 1b: approach, already flat (0.22 -> 0.5) ----
    // Both card and phone are now unrotated rectangles, so however
    // close their Z values get, neither can poke through the other.
    .to(phone, { z: -70, x: 0, y: 205, scale: 0.9, duration: 0.28, ease: "power2.inOut" }, 0.22)
    .to(orbsBack, { yPercent: -10, duration: 0.5, ease: "none" }, 0.5)
    .to(orbsMid, { yPercent: -20, duration: 0.5, ease: "none" }, 0.5)
    .to(orbsFront, { yPercent: -32, duration: 0.5, ease: "none" }, 0.5)

    // ---- Phase 2: two-stage settle (0.5 -> 0.66) ----
    // A fast, weighty deceleration (power4.out) into place, then a
    // small secondary settle (back.out) for the premium "landed"
    // feel. Only the phone moves here — the card was already home.
    .to(phone, { ...PHONE_SETTLED, scale: 0.96, duration: 0.11, ease: "power4.out" }, 0.5)
    .to(phone, { ...PHONE_SETTLED, duration: 0.05, ease: "back.out(2.2)" }, 0.61)
    .to(contactShadow, { opacity: 0.55, scale: 1, duration: 0.14, ease: "power2.out" }, 0.55)

    // ---- NFC tap (~0.63) ----
    .to(ripple, { opacity: 1, scale: 1.7, duration: 0.09, ease: "power1.out" }, 0.63)
    .to(ripple, { opacity: 0, scale: 2.3, duration: 0.11, ease: "power1.out" }, 0.72)
    .to(glow, { opacity: 0.9, scale: 1, duration: 0.07, ease: "power1.out" }, 0.65)

    // ---- Phase 3: zoom through the screen (0.72 -> 1) ----
    // The scene (not the whole stage — heroCopy lives in the stage
    // too and must stay unaffected) zooms in and dissolves into the
    // glow, which blooms to fill the frame and then fades away as
    // heroCopy fades in on top of it. The pin releases with heroCopy
    // already fully shown, so there is nothing left to scroll to.
    .to(world, { scale: 7, opacity: 0, duration: 0.26, ease: "power2.in" }, 0.72)
    .to(glow, { opacity: 1, scale: 16, duration: 0.26, ease: "power2.in" }, 0.72)
    .to([orbsBack, orbsMid, orbsFront], { opacity: 0, duration: 0.14 }, 0.72)
    .to(glow, { opacity: 0, duration: 0.16, ease: "power1.out" }, 0.86)
    .to(heroCopy, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, 0.86)
    .set(heroCopy, { pointerEvents: "auto" }, 0.98);
});
