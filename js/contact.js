// Header Email link: mailto does nothing when the visitor has no mail app set up
// (common on a Mac that uses webmail), so also copy the address and say so.
(function () {
  const link = document.querySelector(".site-header .contact");
  if (!link || !navigator.clipboard) return;

  const address = link.href.replace(/^mailto:/, "");
  const label = link.firstChild;
  const status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  link.after(status);
  let timer;

  link.addEventListener("click", () => {
    navigator.clipboard.writeText(address).then(() => {
      label.textContent = "Copied";
      status.textContent = "Email address copied";
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = "Email";
        status.textContent = "";
      }, 2000);
    }, () => {});
  });
})();
