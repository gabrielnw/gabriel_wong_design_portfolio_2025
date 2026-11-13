// Experiments: open each study in an in-page viewer instead of the raw image.
// The links still point at the full-size files, so this is an enhancement.
(function () {
  const links = document.querySelectorAll(".experiments a");
  if (!links.length || typeof HTMLDialogElement !== "function") return;

  const viewer = document.createElement("dialog");
  viewer.className = "viewer";
  viewer.setAttribute("aria-labelledby", "viewer-title");
  viewer.innerHTML =
    '<div class="viewer-bar ui">' +
    '<span id="viewer-title"></span>' +
    '<button type="button" class="viewer-close">Close<span aria-hidden="true"> ×</span></button>' +
    "</div>" +
    '<img class="viewer-img" alt="" />';
  document.body.append(viewer);

  const title = viewer.querySelector("#viewer-title");
  const img = viewer.querySelector(".viewer-img");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let opener = null;
  let thumb = null;

  // where supported, the thumbnail grows into the full image and shrinks back into place on close
  const canMorph = () => typeof document.startViewTransition === "function" && !reduceMotion.matches;
  const MORPH = "experiment-image";
  const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function open(link) {
    opener = link;
    thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb ? thumb.alt : "";
    title.textContent = img.alt;
    // light plots sit straight on the paper; the one drawn on black keeps its ground
    viewer.classList.toggle("on-black", Boolean(link.closest(".on-black")));

    const show = (morph) => {
      if (thumb) thumb.style.viewTransitionName = "";
      img.style.viewTransitionName = morph ? MORPH : "";
      viewer.showModal();
      viewer.querySelector(".viewer-close").focus();
      document.documentElement.classList.add("viewer-open");
    };

    if (!canMorph() || !thumb) {
      viewer.classList.remove("is-morphing");
      show(false);
      return;
    }
    // wait briefly for the full image, so the morph lands on a real picture rather than a blank box
    await Promise.race([img.decode().catch(() => {}), settle(300)]);
    viewer.classList.add("is-morphing");
    thumb.style.viewTransitionName = MORPH;
    document.startViewTransition(() => show(true));
  }

  function close() {
    if (!viewer.open) return;
    const morph = canMorph() && thumb;
    const hide = () => {
      img.style.viewTransitionName = "";
      if (morph) thumb.style.viewTransitionName = MORPH;
      viewer.close();
    };
    if (!morph) {
      hide();
      return;
    }
    // the same path in reverse: the image shrinks back into its thumbnail
    document.startViewTransition(hide).finished.finally(() => {
      if (thumb) thumb.style.viewTransitionName = "";
    });
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      open(link);
    });
  });

  viewer.querySelector(".viewer-close").addEventListener("click", close);

  // Escape closes along the same path as the button
  viewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  // a click on the backdrop (the dialog itself, outside its content) closes it
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) close();
  });

  viewer.addEventListener("close", () => {
    document.documentElement.classList.remove("viewer-open");
    img.removeAttribute("src");
    if (opener) opener.focus();
  });
})();
