/* ============================================================
   VantaCard — Menú de teléfono
   Compartido por las tres páginas.

   Arriba de 720px no hay nada que hacer: los enlaces del menú viven
   en la barra y el botón está en display:none. Abajo de 720px la barra
   no tenía enlaces en absoluto — desde un teléfono no había forma de
   llegar al catálogo ni a "Nuestro compromiso" — y esto los pone en
   una hoja a pantalla completa.

   Sin dependencias: no usa GSAP, así que el menú funciona aunque el
   CDN local falle. La transición la hace el CSS.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("navMenu");
  const sheet = document.getElementById("navSheet");
  if (!btn || !sheet) return;

  let lastFocus = null;

  const setOpen = (open) => {
    document.body.classList.toggle("is-menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    sheet.setAttribute("aria-hidden", String(!open));
    // inert saca toda la hoja del orden de tabulación y del árbol de
    // accesibilidad mientras está cerrada, que es lo correcto aunque el
    // CSS ya la esconda: visibility:hidden y display:none dependen de
    // la consulta de medios, y el atributo no.
    sheet.toggleAttribute("inert", !open);

    if (open) {
      lastFocus = document.activeElement;
      // El primer enlace, no la hoja: quien abre el menú con teclado
      // quiere estar ya dentro de la lista.
      sheet.querySelector("a")?.focus();
    } else if (lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  };

  const isOpen = () => document.body.classList.contains("is-menu-open");

  btn.addEventListener("click", () => setOpen(!isOpen()));

  // Tocar un enlace cierra la hoja. Los anclas de la misma página no
  // recargan nada, así que sin esto el menú se quedaría encima del
  // sitio al que acaba de llevarte.
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) setOpen(false);
  });

  // Si la ventana crece hasta el ancho de escritorio con el menú
  // abierto, la hoja desaparece por CSS pero el scroll del body
  // seguiría bloqueado.
  window.matchMedia("(min-width: 721px)").addEventListener("change", (e) => {
    if (e.matches && isOpen()) setOpen(false);
  });
});
