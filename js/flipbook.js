(function () {
  document.querySelectorAll(".flipbook").forEach(init);

  function init(root) {
    const total = Number(root.dataset.pages);
    const src = (n) => root.dataset.src.replace("{n}", String(n).padStart(2, "0"));
    const book = root.querySelector(".mag-book");
    const left = root.querySelector(".mag-left");
    const right = root.querySelector(".mag-right");
    const prevBtn = root.querySelector(".mag-prev");
    const nextBtn = root.querySelector(".mag-next");
    const count = root.querySelector(".mag-count");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const TURN_MS = 600;

    // shadow the turning leaf casts on the page beneath it
    const castL = document.createElement("div");
    const castR = document.createElement("div");
    castL.className = castR.className = "mag-cast";
    left.append(castL);
    right.append(castR);

    // spread 0 is the cover alone on the right; spread s shows pages 2s and 2s+1
    const lastSpread = Math.floor(total / 2);
    let spread = 0;
    let page = 1;
    let single = false;
    let busy = false;

    const pagesOf = (s) => [s === 0 ? null : 2 * s, 2 * s + 1 <= total ? 2 * s + 1 : null];

    function setPage(el, n) {
      const img = el.querySelector("img");
      el.classList.toggle("is-blank", !n);
      if (!n) return;
      img.src = src(n);
      img.alt = "Page " + n;
    }

    function preload(n) {
      if (n >= 1 && n <= total) new Image().src = src(n);
    }

    function atState(s) {
      if (single) return "";
      if (s === 0) return "cover";
      return pagesOf(s)[1] === null ? "end" : "";
    }

    function render() {
      if (single) {
        setPage(right, page);
        count.textContent = page + " / " + total;
        prevBtn.disabled = page === 1;
        nextBtn.disabled = page === total;
        preload(page + 1);
        preload(page - 1);
      } else {
        const [l, r] = pagesOf(spread);
        setPage(left, l);
        setPage(right, r);
        count.textContent = (l && r ? l + "–" + r : l || r) + " / " + total;
        prevBtn.disabled = spread === 0;
        nextBtn.disabled = spread === lastSpread;
        for (let n = 2 * spread - 2; n <= 2 * spread + 3; n++) preload(n);
      }
      root.dataset.at = atState(spread);
    }

    function go(dir) {
      if (busy) return;

      if (single) {
        const next = page + dir;
        if (next < 1 || next > total) return;
        page = next;
        render();
        return;
      }

      const target = spread + dir;
      if (target < 0 || target > lastSpread) return;

      if (reduceMotion.matches) {
        spread = target;
        render();
        return;
      }

      const [curL, curR] = pagesOf(spread);
      const [newL, newR] = pagesOf(target);

      // the turning leaf shows the current page on its front and the new page on its back
      const leaf = document.createElement("div");
      leaf.className = "mag-leaf " + (dir > 0 ? "to-next" : "to-prev");
      leaf.innerHTML =
        '<div class="mag-face front"><img alt=""><div class="mag-shade"></div></div>' +
        '<div class="mag-face back"><img alt=""><div class="mag-shade"></div></div>';
      leaf.querySelector(".front img").src = src(dir > 0 ? curR : curL);
      leaf.querySelector(".back img").src = src(dir > 0 ? newL : newR);
      const shades = leaf.querySelectorAll(".mag-shade");

      // reveal the page underneath the leaf
      if (dir > 0) setPage(right, newR);
      else setPage(left, newL);

      book.append(leaf);
      busy = true;
      root.dataset.at = atState(target);

      // the side the leaf starts over, and the side it lands on
      const [fromCast, toCast] = dir > 0 ? [castR, castL] : [castL, castR];

      // drive the turn frame by frame so the shading follows the angle
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min((now - t0) / TURN_MS, 1);
        const eased = (1 - Math.cos(Math.PI * t)) / 2;
        const angle = eased * 180;
        const rad = (angle * Math.PI) / 180;
        const lift = Math.sin(rad); // 0 flat, 1 standing up at the spine
        const reach = Math.abs(Math.cos(rad)) * 100; // how far the leaf's edge sits from the spine, in %

        leaf.style.transform = "perspective(2400px) rotateY(" + -dir * angle + "deg)";
        shades.forEach((el) => (el.style.opacity = lift));

        const over = angle < 90 ? fromCast : toCast;
        const under = over === fromCast ? toCast : fromCast;
        over.style.setProperty("--edge", reach + "%");
        over.style.setProperty("--soft", 3 + 14 * lift + "%");
        over.style.opacity = 0.2 + 0.8 * lift;
        under.style.opacity = 0;

        if (t < 1) requestAnimationFrame(step);
        else finish();
      };

      const finish = () => {
        spread = target;
        render();
        leaf.remove();
        castL.style.opacity = castR.style.opacity = 0;
        busy = false;
      };
      requestAnimationFrame(step);
    }

    function setMode() {
      const nextSingle = root.clientWidth < 560;
      if (nextSingle === single) return;
      if (nextSingle) {
        const [l, r] = pagesOf(spread);
        page = r || l;
      } else {
        spread = Math.floor(page / 2);
      }
      single = nextSingle;
      root.classList.toggle("is-single", single);
      render();
    }

    prevBtn.addEventListener("click", () => go(-1));
    nextBtn.addEventListener("click", () => go(1));

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });

    // click a side to turn that way; swipe on touch screens
    const stage = root.querySelector(".mag-stage");
    let startX = null;
    stage.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
    });
    stage.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) {
        go(dx < 0 ? 1 : -1);
        return;
      }
      const box = stage.getBoundingClientRect();
      let dir = e.clientX - box.left < box.width / 2 ? -1 : 1;
      if (!single && spread === 0) dir = 1;
      if (!single && spread === lastSpread) dir = -1;
      go(dir);
    });

    new ResizeObserver(setMode).observe(root);
    render();
  }
})();
