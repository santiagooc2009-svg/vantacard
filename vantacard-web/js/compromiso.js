/* ============================================================
   VantaCard — Nuestro compromiso page
   No 3D hero here, so this is a light subset of main.js: nav-solid
   on scroll, fade-up reveals, and magnetic buttons — plus the
   pinned sticky-stack for "Nuestra solución", reusing the exact
   mechanic index.html's "Cómo funciona" uses (own selectors, same
   logic). Kept separate from main.js instead of guarding every
   hero-specific selector there with null checks.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: ".sustain-hero",
    start: "bottom top+=80",
    onEnter: () => nav.classList.add("nav--solid"),
    onLeaveBack: () => nav.classList.remove("nav--solid"),
  });

  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => gsap.set(progressBar, { scaleX: self.progress }),
    });
  }

  ScrollTrigger.batch(".reveal-up", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }),
  });

  // Heading blocks stagger their own children — same mechanic as
  // index.html, so both pages reveal section heads identically.
  ScrollTrigger.batch(".reveal-group", {
    start: "top 88%",
    once: true,
    onEnter: (batch) =>
      batch.forEach((el) =>
        gsap.to(el.children, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 })
      ),
  });

  // "Nuestra solución": each step pins in place and shrinks/fades out
  // as the next one rises in — identical logic to index.html's "Cómo
  // funciona" (see that file's comments for why fromTo, not to, and
  // why endTrigger is steps[i+1] not the last step).
  const steps = gsap.utils.toArray(".sustain-step");
  if (!prefersReduced && steps.length > 1) {
    gsap.set(steps.slice(1), { opacity: 0, scale: 0.94 });

    steps.forEach((step, i) => {
      if (i > 0) {
        gsap.fromTo(
          step,
          { opacity: 0, scale: 0.94 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: step,
              start: "top bottom",
              end: "top top+=64",
              scrub: true,
            },
          }
        );
      }

      if (i === steps.length - 1) return;
      ScrollTrigger.create({
        trigger: step,
        start: "top top+=64",
        endTrigger: steps[i + 1],
        end: "top top+=64",
        pin: true,
        pinSpacing: false,
      });
      gsap.fromTo(
        step,
        { opacity: 1, scale: 1 },
        {
          scale: 0.86,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: steps[i + 1],
            start: "top bottom",
            end: "top top+=64",
            scrub: true,
          },
        }
      );
    });
  }

  // Subtle parallax on the big timeline numbers ("01/02/03" in
  // Nuestro impacto): they drift slightly slower than the page
  // scrolls, so the section has real depth instead of static text.
  if (!prefersReduced) {
    document.querySelectorAll(".sustain-timeline__num").forEach((num) => {
      gsap.to(num, {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: num,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }

  // Spotlight border on the ODS row items — same mechanic as .plan
  // and .offerings__media on index.html, so this page's interactive
  // surfaces feel like the same system, not a one-off.
  document.querySelectorAll(".sustain-ods").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

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
});
