/* ============================================================
   VantaCard — Nuestro compromiso page
   Deliberately small. The page is a long read, so the only motion it
   carries is what helps you read it: the nav going solid, a progress
   hairline, and content fading up as it arrives.

   It used to also run a pinned sticky-stack for "Nuestra solución"
   and a scrubbed parallax on the impact numerals. Both are gone —
   the stack took the scroll away from the reader and pushed the
   section heading off screen, and the parallax made numbers drift
   out of line with the text they belonged to. The heading now stays
   put through CSS (.chapter__aside is sticky), which needs no
   JavaScript at all.
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

  // Fade, rise and pull into focus. The blur start state lives in CSS
  // under prefers-reduced-motion: no-preference, so the property is
  // only tweened when it is actually there to tween.
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

  // Heading blocks stagger their own children — same mechanic as
  // index.html, so both pages reveal section heads identically.
  ScrollTrigger.batch(".reveal-group", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => batch.forEach((el) => gsap.to(el.children, arrive({ stagger: 0.06 }))),
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
