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
  const heroPayoff = document.getElementById("heroPayoff");
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

  // "Cómo funciona" and "Así se ve" used to pin: each step took over
  // the whole viewport and the next one crossfaded in. Two problems
  // with that, both reported by real readers — it took the scroll away
  // from them, and it pushed the section heading off the top of the
  // screen, so they were left reading a lone paragraph with nothing on
  // screen saying what it was about. Both sections are now plain
  // chapter grids: the heading is sticky in CSS beside its content,
  // and the steps just fade up like everything else on the page. No
  // ScrollTrigger needed here at all.

  // Fade + rise-in for section headings, plan cards, and footer
  // columns as they enter the viewport. Runs even under reduced
  // motion (that just makes the CSS transition instant, per the
  // global @media rule in styles.css) so content never gets stuck
  // invisible for a user who can't trigger the animated version.
  //
  // The blur is the other half of it: the element doesn't appear, it
  // comes into focus. CSS sets the 5px start state (under
  // no-preference only), so a reduced-motion visitor gets a plain fade
  // and no filter work at all — which is why the property is added to
  // the tween conditionally rather than always.
  //
  // filter:none on completion, not clearProps: clearing the inline
  // style would expose the CSS blur underneath again. Dropping the
  // filter matters because blur(0px) is still a filter — it holds every
  // revealed element on its own compositor layer for the rest of the
  // visit, and there are dozens of them.
  const releaseFilter = function () {
    gsap.set(this.targets(), { filter: "none" });
  };
  const arrive = (extra) =>
    Object.assign(
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      prefersReduced ? {} : { filter: "blur(0px)", onComplete: releaseFilter },
      extra
    );

  ScrollTrigger.batch(".reveal-up", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, arrive({ stagger: 0.08 })),
  });

  // Section heading blocks (eyebrow + h2 + lede) used to arrive as one
  // flat slab. Staggering their own children instead lets the eye read
  // them in the order they're meant to be read. 60ms is enough to be
  // felt as a sequence without becoming a queue the reader waits on.
  ScrollTrigger.batch(".reveal-group", {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      batch.forEach((el) =>
        gsap.to(el.children, arrive({ stagger: 0.06 }))
      ),
  });

  // FAQ: a native <details> snaps open, so the answer teleports in and
  // shoves everything below it down the page. We drive `open` ourselves
  // so the panel can animate in both directions, measuring the target
  // height rather than animating to `auto` (which doesn't interpolate).
  // <summary> keeps its native keyboard and screen-reader behaviour.
  document.querySelectorAll(".faq__item").forEach((item) => {
    const summary = item.querySelector("summary");
    const panel = item.querySelector(".faq__panel");
    if (!summary || !panel) return;

    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.dataset.animating) return;

      if (prefersReduced) {
        item.open = !item.open;
        return;
      }

      item.dataset.animating = "1";

      if (!item.open) {
        // Put the content in the layout first — its natural height can't
        // be measured while the element is still closed.
        item.open = true;
        gsap.fromTo(
          panel,
          { height: 0, opacity: 0 },
          {
            height: panel.scrollHeight,
            opacity: 1,
            duration: 0.2,
            ease: "power4.out",
            onComplete: () => {
              // Back to auto so the panel reflows if the text wraps
              // differently later (resize, font swap).
              gsap.set(panel, { height: "auto" });
              delete item.dataset.animating;
            },
          }
        );
      } else {
        item.classList.add("is-closing");
        gsap.to(panel, {
          height: 0,
          opacity: 0,
          duration: 0.2,
          ease: "power4.out",
          onComplete: () => {
            item.open = false;
            item.classList.remove("is-closing");
            gsap.set(panel, { clearProps: "height,opacity" });
            delete item.dataset.animating;
          },
        });
      }
    });
  });

  // Spotlight border on plan cards and offering tiles: track the
  // cursor into CSS custom properties the ::before ring reads. Plain
  // pointermove on a handful of small cards, not a scroll-frame
  // cost, so it's fine outside the ScrollTrigger/ban-on-scroll-
  // listeners rule (that rule targets window-level scroll polling,
  // not local pointer tracking).
  document.querySelectorAll(".plan, .offerings__media").forEach((el) => {
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

  // Press feedback. Driven through GSAP rather than a CSS :active rule
  // because the magnetic pull below writes an inline transform, which a
  // CSS transform would just lose to. Runs for everyone, including
  // reduced-motion and touch: on a phone there is no hover, so without
  // this the primary CTA answers a tap with nothing at all.
  document.querySelectorAll(".btn").forEach((btn) => {
    const press = (scale) => gsap.to(btn, { scale, duration: 0.16, ease: "power3.out", overwrite: "auto" });
    btn.addEventListener("pointerdown", () => press(0.97));
    btn.addEventListener("pointerup", () => press(1));
    btn.addEventListener("pointerleave", () => press(1));
    btn.addEventListener("pointercancel", () => press(1));
  });

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
    gsap.set(heroScene, { height: "100vh" });
    // Collapsing the hero from its full scroll-jack height to 100vh
    // removes several thousand pixels from the page, but the reveal
    // ScrollTriggers above were measured against the tall layout and
    // don't re-measure on their own — so their start points sat far
    // below where their elements actually ended up, and most of the
    // page stayed at opacity 0 for the whole visit. Reveal those
    // elements outright instead: no scroll dependency to get stale,
    // and no movement, which is the point of reduced motion.
    gsap.set([".reveal-up", ".reveal-group > *"], { opacity: 1, y: 0, filter: "none" });
    // The payoff line is copy, not decoration, and its only reveal is
    // inside the scroll timeline — so a reduced-motion visitor never
    // read it at all. Parked above the card rather than at its animated
    // position, which is dead centre, exactly where the card sits in
    // this static composition.
    gsap.set(heroPayoff, { opacity: 1, top: "16%" });
    return;
  }

  // Card: fully static from the very first frame. It never moves,
  // rotates, or changes depth for the rest of the scene.
  gsap.set(card, CARD_SETTLED);

  // ---- One card, top to bottom ----
  // The hero card and the scene card are different elements in different
  // stacking contexts, so they can't be one node. Left alone they read as a
  // cut: scroll carries the hero card off the top while the scene card
  // rises independently, and for a stretch both are on screen at once.
  // Instead, hold the hero card back so it lands exactly on the scene card,
  // at the same size, and cross-fade them there. Only one card is ever
  // visible, so it reads as a single object that never left. The words are
  // what leave.
  // Measured rather than computed: both rects are real by this point, so
  // there are no constants here to fall out of sync with the scene.
  const heroSection = document.querySelector(".identity");
  const heroCard = document.querySelector(".identity__card");

  if (heroSection && heroCard) {
    // Measured lazily, not once at build time. main.js runs on
    // DOMContentLoaded, which can fire before the webfonts land — and when
    // it does the headline rewraps and drags the card ~270px, so a value
    // captured then is simply wrong. Whether it was wrong depended on
    // whether the fonts happened to be cached, which is the worst kind of
    // bug to chase. Function values + invalidateOnRefresh let ScrollTrigger
    // re-measure on every refresh (fonts, resize, orientation).
    const naturalCentre = () => {
      const applied = Number(gsap.getProperty(heroCard, "y")) || 0;
      const r = heroCard.getBoundingClientRect();
      // Centred scaling leaves the centre where it is, so this is the
      // card's untransformed position once the applied offset is removed.
      return r.top + window.scrollY + r.height / 2 - applied;
    };

    // Where the scene card sits the instant the stage pins. Measured, not
    // derived from CARD_SETTLED: the scene centres that card with
    // yPercent:-50, which GSAP resolves against the height it read at setup,
    // landing ~5px off what the arithmetic predicts. Reading the real rect
    // makes the two agree exactly rather than almost.
    // Taken relative to the stage, so it holds at any scroll position — the
    // stage fills the viewport once pinned, so the card's offset inside it
    // is its on-screen position at the seam. An earlier version measured
    // against window.scrollY and quietly fell back to the arithmetic,
    // because ScrollTrigger evaluates this mid-refresh at a scroll position
    // of its own choosing.
    const seamCentre = () => {
      const stageRect = stage.getBoundingClientRect();
      const r = card.getBoundingClientRect();
      return r.top - stageRect.top + r.height / 2;
    };

    const drift = () => seamCentre() - (naturalCentre() - heroScene.offsetTop);
    const matchScale = () => {
      const applied = Number(gsap.getProperty(heroCard, "scale")) || 1;
      return card.getBoundingClientRect().width / (heroCard.getBoundingClientRect().width / applied);
    };

    // fromTo, not to: an inferred start reads the element's live computed
    // style, which is only safe while nothing else is touching it.
    gsap.fromTo(
      heroCard,
      { y: 0, scale: 1 },
      {
        y: drift,
        scale: matchScale,
        ease: "none", // scrubbed — the user drives this, an ease would fight them
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          // Lands on the seam at 88%, where the crossfade below BEGINS,
          // not where it ends. Running the drift to 100% meant the two
          // cards swapped opacity while they were still up to 85px
          // apart, which you saw as one card doubled. Arriving first and
          // then holding costs nothing — the tween is done, so the card
          // simply scrolls with the document from there, exactly as the
          // scene card does, and the gap stays closed for the whole
          // exchange.
          end: "88% top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );

    // The text pulls away faster than the page scrolls, so the card is
    // visibly left behind rather than merely lingering.
    //
    // fromTo, not to, for the same reason as everywhere else on this
    // page: an implicit "to" adopts whatever the element happens to
    // measure at tween-creation time as its resting state. These
    // elements are mid-CSS-entrance at that moment (.hero-enter), so a
    // "to" could bake in opacity:0 and translateY(20px) — the entrance
    // animation's FIRST keyframe — and the sub-headline, the CTA and
    // the note under it would then sit invisible for the whole visit.
    gsap.fromTo(
      ".identity__inner > h1, .identity__inner > p",
      { y: 0, opacity: 1 },
      {
        y: -80,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: heroSection, start: "top top", end: "70% top", scrub: true },
      }
    );

    // Opacity only on the CTA: the magnetic-pull handler owns its x/y, and
    // two tweens writing one transform would fight.
    gsap.fromTo(
      ".identity__inner > .btn",
      { opacity: 1 },
      {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: heroSection, start: "top top", end: "70% top", scrub: true },
      }
    );

    // The scene card stays hidden until the two have nearly converged —
    // otherwise it drifts up into frame alongside the hero card and you see
    // the same card twice. They swap over the last stretch, a few tens of
    // pixels apart, which is why the exchange doesn't register as a cut.
    gsap.fromTo(
      card,
      { opacity: 0 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: heroSection, start: "88% top", end: "bottom top", scrub: true },
      }
    );

    gsap.fromTo(
      heroCard,
      { opacity: 1 },
      {
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: heroSection, start: "88% top", end: "bottom top", scrub: true },
      }
    );

    // Belt and braces: ScrollTrigger refreshes on window load, but fonts can
    // still settle after that on a cold cache.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

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
  // separately, in the showcase mockups below.
  // 720px, the same line the CSS uses for every other phone rule. It
  // was 700 here and 720 there, so 700-719px got the wide scene with
  // the phone layout — one of those two numbers had to go.
  const isWideStage = window.matchMedia("(min-width: 721px)").matches;
  const CARD_Y = CARD_SETTLED.y;
  // Mobile gets the same zigzag, just scaled down to fit: 300px card
  // on a ~360-390px screen has very little room either side before
  // it clips, so the drift is small but still a real, visible move —
  // not disabled the way it was before (SIDE 0 = the card just sat
  // still on phones, which is where most of this audience is).
  const SIDE = 210;
  const PANEL_SIDE = 240;
  // One shared dip depth for every step, not a different Y per
  // profile — that inconsistency read as three unrelated animations
  // instead of one uniform motion repeated three times.
  const ZIGZAG_Y = CARD_Y + 100;
  const STEP_DURATION = 0.22;
  const STEP_GAP = 0.34; // spacing between the start of each step
  const PANEL_SWITCH_DELAY = 0.08; // when the panel jumps to the opposite side, mid fade-out
  // Background parallax during the zigzag: each orb layer drifts a
  // little against the card's direction, back layer least and front
  // layer most, so the side-to-side motion reads as real depth
  // instead of a flat card sliding over a static backdrop.
  const ORB_DRIFT = [2, 4, 7];

  // One line each, and each one has to be a scene the reader has
  // actually lived, not a benefit. "Listos para la siguiente gran
  // alianza" and "a la altura de cada reunión" were the old lines:
  // they could sit under any profession, any product, and so they
  // landed on nobody. The test for a replacement is whether the
  // wrong audience would recognise it — a lawyer has dictated their
  // cédula and had it written down wrong, a founder has said "ahorita
  // te paso el link" and never sent it, an owner has thrown out a box
  // of cards over one changed line.
  //
  // NOTE: the first profile is also written into index.html so the
  // panel is not blank before this file runs. Change one, change both.
  const PROFILES = [
    {
      label: "Profesionistas",
      dir: 1, // right
      benefit: "Tu cédula, tu especialidad y la cita, sin dictar nada.",
      icon: "assets/badge-profesionista.webp",
    },
    {
      label: "Pymes",
      dir: -1, // left
      benefit: "Tu catálogo y tu agenda en su teléfono, no en un folleto.",
      icon: "assets/badge-pyme.webp",
    },
    {
      label: "Empresarios",
      dir: 1, // right
      benefit: "Cambias un puesto una vez, no reimprimes 500 tarjetas.",
      icon: "assets/badge-empresario.webp",
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
  const PROFILE_ZONES = PROFILES.map((_, i) => (i === 0 ? 0 : i * STEP_GAP + PANEL_SWITCH_DELAY));
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
  syncProfile(); // set the initial "Profesionistas" state before any scrolling happens

  // One uniform step, repeated identically for every profile: card
  // dips to ZIGZAG_Y and slides toward `dir`, the panel fades out,
  // jumps to the opposite side, and fades back in, and the three orb
  // layers drift a little against the card for parallax depth. Same
  // duration, same ease, same shape every time — alternating only the
  // sign of the direction is what turns it into a zigzag (right,
  // left, right) instead of three different-looking animations.
  //
  // Phones skip it entirely. A 300px card has 34px of room either side
  // before it clips, so the zigzag was a twitch, and a panel that
  // swaps in place is a carousel — the one pattern a phone reader
  // cannot scan. The same three profiles are a plain list under the
  // scene instead (section.audience, mobile-only), which is both
  // easier to read and one less thing the pinned scene has to hold.
  if (isWideStage) PROFILES.forEach((p, i) => {
    const start = i * STEP_GAP;
    const cardX = SIDE * p.dir;
    const panelX = -PANEL_SIDE * p.dir;
    const orbDir = -p.dir; // background drifts opposite the card

    if (i > 0) {
      tl.to(profilePanel, { opacity: 0, duration: 0.08 }, start)
        .set(profilePanel, { x: panelX }, start + PANEL_SWITCH_DELAY)
        .to(profilePanel, { opacity: 1, duration: 0.14, ease: "power1.out" }, start + PANEL_SWITCH_DELAY);
    } else {
      tl.set(profilePanel, { x: panelX }, start).to(
        profilePanel,
        { opacity: 1, duration: STEP_DURATION, ease: "power1.out" },
        start
      );
    }

    tl.to(card, { x: cardX, y: ZIGZAG_Y, scale: 0.94, duration: STEP_DURATION, ease: "power1.inOut" }, start)
      .to(orbsBack, { xPercent: orbDir * ORB_DRIFT[0], duration: STEP_DURATION, ease: "power1.inOut" }, start)
      .to(orbsMid, { xPercent: orbDir * ORB_DRIFT[1], duration: STEP_DURATION, ease: "power1.inOut" }, start)
      .to(orbsFront, { xPercent: orbDir * ORB_DRIFT[2], duration: STEP_DURATION, ease: "power1.inOut" }, start);
    // dwell until the next step's `start`, or (for the last step) until the return-to-center below.
  });

  // Return to center: its own clean, deliberate move, card and orbs
  // together — the card by itself heading home, background settling
  // back to neutral, before the NFC/phone phases take over. The card
  // stays generic (just the VantaCard mark) through this whole
  // sequence — no client name/role revealed here, so the NFC demo
  // that follows reads as a plain, universal card.
  // No profile steps on a phone, so there is nothing to return from:
  // the card is already home and the approach starts immediately,
  // which is also what makes the pinned scene shorter there.
  const returnStart = isWideStage ? PROFILES.length * STEP_GAP : 0;
  tl.to(profilePanel, { opacity: 0, duration: 0.08 }, returnStart)
    .to(card, { x: 0, y: CARD_Y, scale: 1, duration: 0.24, ease: "power2.inOut" }, returnStart)
    .to([orbsBack, orbsMid, orbsFront], { xPercent: 0, duration: 0.24, ease: "power2.inOut" }, returnStart);

  tl.addLabel("approach", returnStart + 0.3);

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
    // fill the frame and then fades away. The identity headline fades
    // in right on top of that fade-out, finishing exactly as the pin
    // releases, so the payoff is already on screen the instant the
    // scene goes dark — no stretch of empty black waiting for the
    // next section to scroll up from below.
    .to(world, { scale: 7, opacity: 0, duration: 0.26, ease: "power2.in" }, "approach+=0.72")
    .to(glow, { opacity: 1, scale: 16, duration: 0.26, ease: "power2.in" }, "approach+=0.72")
    .to([orbsBack, orbsMid, orbsFront], { opacity: 0, duration: 0.14 }, "approach+=0.72")
    .to(glow, { opacity: 0, duration: 0.16, ease: "power1.out" }, "approach+=0.86")
    .to(heroPayoff, { opacity: 1, duration: 0.16, ease: "power2.out" }, "approach+=0.86");
});
