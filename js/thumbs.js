// Homepage thumbnails: each project plays a short muted loop while it is on screen.
// The poster image stays put for reduced motion, data saver, or when a clip can't play.
(function () {
  const clips = document.querySelectorAll(".work video[data-src]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!clips.length || saveData || !("IntersectionObserver" in window)) return;

  const onScreen = new Set();

  function update(video) {
    if (onScreen.has(video) && !reduceMotion.matches) {
      if (!video.src) video.src = video.dataset.src; // load only once it is near the viewport
      video.play().catch(() => {});
    } else {
      video.pause();
      if (reduceMotion.matches) video.classList.remove("is-playing");
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) onScreen.add(e.target);
        else onScreen.delete(e.target);
        update(e.target);
      });
    },
    { rootMargin: "100px 0px" }
  );

  // wait for the page itself to finish loading before fetching any clip
  function start() {
    clips.forEach((video) => {
      video.addEventListener("playing", () => video.classList.add("is-playing"));
      observer.observe(video);
    });
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });

  reduceMotion.addEventListener("change", () => clips.forEach(update));
})();
