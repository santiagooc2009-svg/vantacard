/* ============================================================
   VantaCard — Catálogo
   Lo mínimo: la barra se vuelve sólida al salir de la apertura y las
   fichas entran al aparecer. Nada scrubbed, nada anclado al scroll —
   el catálogo es para ojear, y una página que se ojea no debe pelear
   con el dedo de quien la ojea. La luz de fondo la mueve tone.js,
   igual que en las otras dos páginas.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: ".catalog-hero",
    start: "bottom top+=80",
    onEnter: () => nav.classList.add("nav--solid"),
    onLeaveBack: () => nav.classList.remove("nav--solid"),
  });

  // filter:none al terminar, no clearProps: limpiar el estilo en línea
  // dejaría a la vista el blur del CSS otra vez. Y se quita porque
  // blur(0px) sigue siendo un filtro, y mantendría cada ficha en su
  // propia capa de compositor toda la visita.
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
