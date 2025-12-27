(function () {
  const control = document.querySelector(".back-to-top");
  if (!control) return;

  const threshold = 320;
  const toggleVisibility = () => {
    if (window.scrollY > threshold) {
      control.classList.add("is-visible");
    } else {
      control.classList.remove("is-visible");
    }
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();
})();
