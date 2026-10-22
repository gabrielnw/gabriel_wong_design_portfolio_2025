(function () {
  document.querySelectorAll(".flipbook").forEach(init);

  function init(root) {
    const total = Number(root.dataset.pages);
    const src = (n) => root.dataset.src.replace("{n}", String(n).padStart(2, "0"));
    const book = root.querySelector(".fb-book");
    const left = root.querySelector(".fb-left");
    const right = root.querySelector(".fb-right");
    const prevBtn = root.querySelector(".fb-prev");
    const nextBtn = root.querySelector(".fb-next");
    const count = root.querySelector(".fb-count");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
      leaf.className = "fb-leaf " + (dir > 0 ? "to-next" : "to-prev");
      leaf.innerHTML =
        '<div class="fb-face front"><img alt=""></div><div class="fb-face back"><img alt=""></div>';
      leaf.querySelector(".front img").src = src(dir > 0 ? curR : curL);
      leaf.querySelector(".back img").src = src(dir > 0 ? newL : newR);

      // reveal the page underneath the leaf
      if (dir > 0) setPage(right, newR);
      else setPage(left, newL);

      book.append(leaf);
      busy = true;
      root.dataset.at = atState(target);

      leaf.getBoundingClientRect(); // apply the start state before turning
      leaf.style.transform = dir > 0 ? "rotateY(-180deg)" : "rotateY(180deg)";

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        spread = target;
        render();
        leaf.remove();
        busy = false;
      };
      leaf.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 900);
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
    const stage = root.querySelector(".fb-stage");
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
