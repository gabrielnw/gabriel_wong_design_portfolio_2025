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
  let opener = null;

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      const thumb = link.querySelector("img");
      opener = link;
      img.src = link.href;
      img.alt = thumb ? thumb.alt : "";
      title.textContent = link.querySelector(".caption")?.textContent.replace(/(\d)([A-Z])/, "$1 · $2") || "";
      viewer.showModal();
      viewer.querySelector(".viewer-close").focus();
      document.documentElement.classList.add("viewer-open");
    });
  });

  viewer.querySelector(".viewer-close").addEventListener("click", () => viewer.close());

  // a click on the backdrop (the dialog itself, outside its content) closes it
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });

  viewer.addEventListener("close", () => {
    document.documentElement.classList.remove("viewer-open");
    img.removeAttribute("src");
    if (opener) opener.focus();
  });
})();
