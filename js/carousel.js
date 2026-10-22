(function () {
  const ring = document.querySelector(".carousel-ring");
  if (!ring) return;

  const cards = ring.querySelectorAll(".carousel-card");
  const count = cards.length;
  const angleStep = 360 / count;
  let angle = 0;

  function getRadius() {
    return window.innerWidth <= 768 ? 220 : 300;
  }

  function rotate(smooth) {
    if (smooth === false) {
      ring.style.transition = "none";
    } else {
      ring.style.transition = "";
    }
    const tz = getRadius();
    ring.style.transform = `translateZ(-${tz}px) rotateX(-12deg) rotateY(${angle}deg)`;

    // Fade cards based on how far they are from front-facing
    cards.forEach(function (card, i) {
      const cardAngle = i * angleStep;
      // How far this card's face is from the camera (0 = front, 180 = back)
      let diff = ((cardAngle + angle) % 360 + 360) % 360;
      if (diff > 180) diff = 360 - diff;
      // Front card = 1, side cards ~0.4, back card = 0
      const opacity = Math.max(0, 1 - (diff / 180) * 1.2);
      card.style.opacity = opacity;
    });
  }

  document.querySelectorAll(".carousel-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const dir = parseInt(this.dataset.dir);
      angle -= dir * angleStep;
      rotate();
    });
  });

  // Drag / swipe support with live rotation
  let startX = 0;
  let startAngle = 0;
  let dragging = false;
  let didDrag = false;
  const dragThreshold = 5;

  const scene = document.querySelector(".carousel-scene");

  let pointerId = null;

  scene.addEventListener("pointerdown", function (e) {
    startX = e.clientX;
    startAngle = angle;
    dragging = true;
    didDrag = false;
    pointerId = e.pointerId;
  });

  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!didDrag && Math.abs(dx) > dragThreshold) {
      didDrag = true;
      // Only capture pointer once we know it's a drag
      try { scene.setPointerCapture(pointerId); } catch (_) {}
    }
    if (didDrag) {
      e.preventDefault();
      const sensitivity = 0.3;
      angle = startAngle + dx * sensitivity;
      rotate(false);
    }
  });

  window.addEventListener("pointerup", function (e) {
    if (!dragging) return;
    dragging = false;

    if (didDrag) {
      // Snap to nearest card
      const snapped = Math.round(angle / angleStep) * angleStep;
      angle = snapped;
      rotate();
    }
    // If !didDrag, it was a click — let the browser handle the link navigation
  });

  // Prevent link navigation only when dragging
  scene.addEventListener("click", function (e) {
    if (didDrag) {
      e.preventDefault();
    }
  });

  // Keyboard support
  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      angle += angleStep;
      rotate();
    } else if (e.key === "ArrowRight") {
      angle -= angleStep;
      rotate();
    }
  });

  rotate();
})();
