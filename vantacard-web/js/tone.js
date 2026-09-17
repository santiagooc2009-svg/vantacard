/* ============================================================
   VantaCard — page-wide light field
   Shared by both pages. Drives the fixed .tone layer: a tall vertical
   wash of tone and two soft lights, all moved by the scroll.

   This replaced a per-section ambient glow, which is what made the
   pages read as a stack of slides — the light began and ended at every
   section boundary, so each section announced itself as a separate
   card. One light for the whole document has no boundaries to announce.

   Everything here is transform-only on a fixed layer, so it is
   compositor work: the page behind it never repaints. The scrub is
   smoothed rather than rigid, so the light lags the scroll by a beat
   and reads as lighting rather than as a thing bolted to the scrollbar.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const wash = document.getElementById("toneWash");
  if (!wash || typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  const glowA = document.getElementById("toneGlowA");
  const glowB = document.getElementById("toneGlowB");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Park the wash on a tone from the middle of the gradient so the
    // page is still lit, just not by anything that moves.
    gsap.set(wash, { yPercent: -34 });
    return;
  }

  // One shared scroll range: top of the document to the bottom of it.
  const range = () => ({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6,
    invalidateOnRefresh: true,
  });

  // The wash is 320vh tall and 100vh is visible, so its full travel is
  // 220vh — 68.75% of its own height.
  gsap.fromTo(wash, { yPercent: 0 }, { yPercent: -68.75, ease: "none", scrollTrigger: range() });

  // The two lights cross: one sinks and drifts right, the other rises
  // and drifts left. Different directions and rates, so the lit side of
  // the page keeps changing instead of one light simply sliding by.
  gsap.fromTo(
    glowA,
    { yPercent: 0, xPercent: 0 },
    { yPercent: 105, xPercent: 20, ease: "none", scrollTrigger: range() }
  );
  gsap.fromTo(
    glowB,
    { yPercent: 0, xPercent: 0 },
    { yPercent: -80, xPercent: -16, ease: "none", scrollTrigger: range() }
  );
});
