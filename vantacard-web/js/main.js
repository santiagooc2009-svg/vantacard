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
  const trustStrip = document.getElementById("trustStrip");
  const cardName = card.querySelector(".card-3d__name");
  const cardRole = card.querySelector(".card-3d__role");
  const profilePanel = document.getElementById("profilePanel");
  const profileLabel = document.getElementById("profileLabel");
  const profileIcon = document.getElementById("profileIcon");
  const profileBenefit = document.getElementById("profileBenefit");
  const profileDots = gsap.utils.toArray(".profile-panel__dot");

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

  // Tilt on the showcase screenshots: the image leans toward the
  // cursor, like a physical card being turned to catch the light.
  // Plain gsap.to (not quickTo — quickTo silently no-ops on rotateX/
  // rotateY in this GSAP version, verified with an isolated repro:
  // it logs "rotateX not eligible for reset" and never touches the
  // transform) with overwrite:"auto" still redirects smoothly when a
  // new pointermove arrives before the previous tween finishes.
  if (!prefersReduced) {
    document.querySelectorAll(".showcase__item img").forEach((img) => {
      img.parentElement.addEventListener("pointermove", (e) => {
        const r = img.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(img, { rotateX: py * -10, rotateY: px * 10, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      });
      img.parentElement.addEventListener("pointerleave", () => {
        gsap.to(img, { rotateX: 0, rotateY: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      });
    });
  }

  // Depth parallax on the showcase pair: the two screenshots drift at
  // different rates as the section scrolls past, so they separate
  // instead of moving as one flat block — reads as actual depth, not
  // just a decoration. Independent of the pointer-tilt above (touches
  // yPercent, tilt touches rotateX/rotateY — different properties on
  // the same element, so neither tween's overwrite:"auto" affects
  // the other).
  if (!prefersReduced) {
    gsap.to(".showcase__item--main img", {
      yPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: ".showcase__gallery",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
    gsap.to(".showcase__item--secondary img", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: {
        trigger: ".showcase__gallery",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // Magnetic pull on buttons: they nudge toward the cursor within a
  // small radius, then spring back on leave.
  if (!prefersReduced) {
    document.querySelectorAll(".btn").forEach((btn) => {
      const moveX = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
      const moveY = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        moveX((e.clientX - r.left - r.width / 2) * 0.25);
        moveY((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener("pointerleave", () => {
        moveX(0);
        moveY(0);
      });
    });
  }

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
    gsap.set([cardName, cardRole], { opacity: 0 }); // generic card, same as the animated path
    gsap.set(phone, PHONE_SETTLED);
    gsap.set(contactShadow, { y: SHADOW_Y, opacity: 0.5, scale: 1 });
    gsap.set(trustStrip, { opacity: 1 });
    gsap.set(heroScene, { height: "100vh" });
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
  gsap.set(world, { scale: 1, opacity: 1 });

  // ---- Profile parallax intro: the card dips down and turns to each
  // side, showing who it's for, before settling back to center ----
  // This is scroll-driven — part of the SAME scrubbed timeline as the
  // phone-approach phases below, not a separate autoplay one — because
  // the point is that scrolling down carries you through it. All the
  // phone-approach tweens further down are anchored to the "approach"
  // label instead of absolute positions, so this segment can grow or
  // shrink without hand-editing every number after it.
  // The card itself stays generic (just the VantaCard mark, no name
  // or role) through this whole sequence and into the NFC-tap demo
  // that follows — the real Sport Car Dreams case study is introduced
  // separately, in the trust strip and showcase mockups below.
  const isWideStage = window.matchMedia("(min-width: 700px)").matches;
  const CARD_Y = CARD_SETTLED.y;
  const SIDE = isWideStage ? 220 : 0; // how far the card drifts to either side
  const PANEL_SIDE = isWideStage ? 250 : 0; // how far the panel sits opposite it
  const LOW_Y = CARD_Y + 105; // noticeably lower than the resting position — the "baja"

  const PROFILES = [
    {
      label: "Abogado",
      benefit: "Comparte tu cédula, tu especialidad y agenda una consulta antes de despedirte.",
      icon: "assets/badge-abogado.png",
    },
    {
      label: "Emprendedor",
      benefit: "Comparte tu pitch, tus redes y tu contacto sin repartir una sola tarjeta de papel.",
      icon: "assets/badge-emprendedor.png",
    },
    {
      label: "Empresario",
      benefit: "Muestra tu catálogo, tu inventario y agenda citas directo desde la tarjeta.",
      icon: "assets/badge-empresario.png",
    },
  ];

  const swapProfile = (i) => {
    const p = PROFILES[i];
    profileLabel.textContent = p.label;
    profileBenefit.textContent = p.benefit;
    profileIcon.src = p.icon;
    profileDots.forEach((dot, di) => dot.classList.toggle("profile-panel__dot--active", di === i));
  };

  gsap.set(profilePanel, { xPercent: -50, yPercent: -50, x: 0 });
  gsap.set([cardName, cardRole], { opacity: 0 });

  // Which profile is "current" is derived from the timeline's time on
  // every update, not from one-time triggers — a scrubbed timeline can
  // jump straight to any position (fast scrolling, scrolling back up
  // past several zones at once), and GSAP's .call() only reliably
  // fires when the playhead sweeps forward across it, not when a jump
  // lands beyond it or crosses it going backward. Deriving the index
  // from the current time works no matter how the position was reached.
  const PROFILE_ZONES = [0, 0.42, 0.76]; // matching the transition midpoints below
  let currentProfileIndex = -1;
  let tl; // declared before syncProfile so the closure below never hits a TDZ error
  const syncProfile = () => {
    if (!tl) return;
    const t = tl.time();
    let idx = -1;
    for (let z = 0; z < PROFILE_ZONES.length; z++) {
      if (t >= PROFILE_ZONES[z]) idx = z;
    }
    if (idx !== -1 && idx !== currentProfileIndex) {
      swapProfile(idx);
      currentProfileIndex = idx;
    }
  };

  tl = gsap.timeline({
    onUpdate: syncProfile, // the timeline's own onUpdate — fires on every render
    // tick as the scrub:1 easing plays out, unlike scrollTrigger's
    // onUpdate (tried first), which only fires once per raw scroll
    // event and not on the ticks in between, so it could catch tl
    // mid-ease or miss the settled value entirely.
    scrollTrigger: {
      trigger: heroScene,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      pin: stage,
      anticipatePin: 1,
    },
  });
  syncProfile(); // set the initial "Abogado" state before any scrolling happens

  // Abogado: dips down-left, panel appears opposite it on the right.
  // No rotation anywhere in this sequence — the card only ever
  // translates and scales, so it stays flat and readable in transit
  // instead of tilting through a 3D turn.
  tl.to(card, { x: -SIDE, y: LOW_Y, scale: 0.94, duration: 0.22, ease: "power1.inOut" }, 0)
    .to(profilePanel, { x: PANEL_SIDE, opacity: 1, duration: 0.22, ease: "power1.out" }, 0)
    // 0.22 -> 0.34: dwell — nothing scheduled, so it just holds while scrolling continues.
    // (Kept short on purpose: a long stretch of scrolling with nothing
    // changing reads as the page being stuck, not as a pause.)

    // Emprendedor: moves to the other side, panel follows to the left.
    .to(profilePanel, { opacity: 0, duration: 0.08 }, 0.34)
    .set(profilePanel, { x: -PANEL_SIDE }, 0.42)
    .to(card, { x: SIDE, y: LOW_Y - 5, scale: 0.94, duration: 0.22, ease: "power1.inOut" }, 0.34)
    .to(profilePanel, { opacity: 1, duration: 0.14, ease: "power1.out" }, 0.42)
    // 0.56 -> 0.68: dwell.

    // Empresario: stays fully committed to the right, but still makes
    // a real, fluid move there (a further dip down) rather than
    // sitting frozen while only the text changes — every step gets
    // actual motion, not just a content swap in place.
    .to(profilePanel, { opacity: 0, duration: 0.08 }, 0.68)
    .to(card, { x: SIDE, y: LOW_Y + 15, scale: 0.94, duration: 0.22, ease: "power1.inOut" }, 0.68)
    .to(profilePanel, { opacity: 1, duration: 0.14, ease: "power1.out" }, 0.76)
    // 0.90 -> 1.02: dwell.

    // Return to center: its own clean, deliberate move (not folded
    // into the Empresario step) — panel is already gone, so this is
    // the card by itself heading home before the NFC/phone phases.
    // The card stays generic (just the VantaCard mark) through this
    // whole sequence — no client name/role revealed here, so the NFC
    // demo that follows reads as a plain, universal card.
    .to(profilePanel, { opacity: 0, duration: 0.08 }, 1.02)
    .to(card, { x: 0, y: CARD_Y, scale: 1, duration: 0.24, ease: "power2.inOut" }, 1.02);

  tl.addLabel("approach", 1.32);

  // ---- Phase 1a: de-tilt while still far away ----
  // The phone straightens out to face the camera square-on well
  // before its depth gets anywhere near the card's.
  tl.to(
    phone,
    { rotateX: 0, rotateY: 0, z: -650, x: 12, y: 150, scale: 0.62, duration: 0.22, ease: "power1.inOut" },
    "approach"
  )
    .to(orbsBack, { yPercent: -5, duration: 0.5, ease: "none" }, "approach")
    .to(orbsMid, { yPercent: -9, duration: 0.5, ease: "none" }, "approach")
    .to(orbsFront, { yPercent: -14, duration: 0.5, ease: "none" }, "approach")

    // ---- Phase 1b: approach, already flat ----
    // Both card and phone are now unrotated rectangles, so however
    // close their Z values get, neither can poke through the other.
    .to(phone, { z: -70, x: 0, y: 205, scale: 0.9, duration: 0.28, ease: "power2.inOut" }, "approach+=0.22")
    .to(orbsBack, { yPercent: -10, duration: 0.5, ease: "none" }, "approach+=0.5")
    .to(orbsMid, { yPercent: -20, duration: 0.5, ease: "none" }, "approach+=0.5")
    .to(orbsFront, { yPercent: -32, duration: 0.5, ease: "none" }, "approach+=0.5")

    // ---- Phase 2: two-stage settle ----
    // A fast, weighty deceleration (power4.out) into place, then a
    // small secondary settle (back.out) for the premium "landed"
    // feel. Only the phone moves here — the card was already home.
    .to(phone, { ...PHONE_SETTLED, scale: 0.96, duration: 0.11, ease: "power4.out" }, "approach+=0.5")
    .to(phone, { ...PHONE_SETTLED, duration: 0.05, ease: "back.out(2.2)" }, "approach+=0.61")
    .to(contactShadow, { opacity: 0.55, scale: 1, duration: 0.14, ease: "power2.out" }, "approach+=0.55")

    // ---- NFC tap ----
    .to(ripple, { opacity: 1, scale: 1.7, duration: 0.09, ease: "power1.out" }, "approach+=0.63")
    .to(ripple, { opacity: 0, scale: 2.3, duration: 0.11, ease: "power1.out" }, "approach+=0.72")
    .to(glow, { opacity: 0.9, scale: 1, duration: 0.07, ease: "power1.out" }, "approach+=0.65")

    // ---- Phase 3: zoom through the screen ----
    // The scene zooms in and dissolves into the glow, which blooms to
    // fill the frame and then fades away — the pin releases right as
    // it fades, straight into the next section, so there's no dead
    // scroll gap waiting for anything else to appear.
    .to(world, { scale: 7, opacity: 0, duration: 0.26, ease: "power2.in" }, "approach+=0.72")
    .to(glow, { opacity: 1, scale: 16, duration: 0.26, ease: "power2.in" }, "approach+=0.72")
    .to([orbsBack, orbsMid, orbsFront], { opacity: 0, duration: 0.14 }, "approach+=0.72")
    .to(glow, { opacity: 0, duration: 0.16, ease: "power1.out" }, "approach+=0.86")
    .to(trustStrip, { opacity: 1, duration: 0.18, ease: "power2.out" }, "approach+=0.86");
});
