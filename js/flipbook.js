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
    const CHAINED_TURN_MS = 350; // a turn queued during another one runs quicker
    const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

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
    let queued = 0; // turns asked for while another was still running (+ forward, - back)

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

    // single-page mode: ease the new page in, drifting slightly from the side it came from
    // after a drag the new page comes in from further out, continuing the finger's motion
    function arrive(dir, offset = 3) {
      const img = right.querySelector("img");
      img.getAnimations().forEach((a) => a.cancel());
      const from = reduceMotion.matches
        ? { opacity: 0.4 }
        : { opacity: 0.4, transform: "translateX(" + dir * offset + "%)" };
      const duration = offset > 3 ? 320 : 220;
      const play = () => img.animate([from, { opacity: 1, transform: "none" }], { duration, easing: EASE_OUT });
      img.decode().then(play, play);
    }

    // --- the turning leaf: shared by button/key turns and by dragging ---

    function startTurn(dir) {
      const target = spread + dir;
      if (target < 0 || target > lastSpread) return null;
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

      // reveal the page underneath the leaf
      if (dir > 0) setPage(right, newR);
      else setPage(left, newL);

      book.append(leaf);
      busy = true;
      root.dataset.at = atState(target);

      // the side the leaf starts over, and the side it lands on
      const [fromCast, toCast] = dir > 0 ? [castR, castL] : [castL, castR];
      return { dir, target, leaf, shades: leaf.querySelectorAll(".mag-shade"), fromCast, toCast, angle: 0 };
    }

    // draw the leaf at an angle from 0 (flat where it started) to 180 (landed); shading follows the angle
    function drawTurn(turn, angle) {
      angle = Math.max(0, Math.min(180, angle));
      turn.angle = angle;
      const rad = (angle * Math.PI) / 180;
      const lift = Math.sin(rad); // 0 flat, 1 standing up at the spine
      const reach = Math.abs(Math.cos(rad)) * 100; // how far the leaf's edge sits from the spine, in %

      turn.leaf.style.transform = "perspective(2400px) rotateY(" + -turn.dir * angle + "deg)";
      turn.shades.forEach((el) => (el.style.opacity = lift));

      const over = angle < 90 ? turn.fromCast : turn.toCast;
      const under = over === turn.fromCast ? turn.toCast : turn.fromCast;
      over.style.setProperty("--edge", reach + "%");
      over.style.setProperty("--soft", 3 + 14 * lift + "%");
      over.style.opacity = 0.2 + 0.8 * lift;
      under.style.opacity = 0;
    }

    // land the turn (committed) or lay the leaf back down where it started
    function endTurn(turn, committed) {
      if (committed) spread = turn.target;
      render();
      turn.leaf.remove();
      castL.style.opacity = castR.style.opacity = 0;
      busy = false;
      if (queued) {
        const next = Math.sign(queued);
        queued -= next;
        go(next, true);
      }
    }

    function go(dir, chained, offset) {
      if (busy) {
        queued = Math.max(-3, Math.min(3, queued + dir));
        return;
      }

      if (single) {
        const next = page + dir;
        if (next < 1 || next > total) return;
        page = next;
        render();
        arrive(dir, offset);
        return;
      }

      if (reduceMotion.matches) {
        const target = spread + dir;
        if (target < 0 || target > lastSpread) return;
        spread = target;
        render();
        return;
      }

      const turn = startTurn(dir);
      if (!turn) return;

      // a scripted turn: ease in and out over a fixed time
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min((now - t0) / (chained ? CHAINED_TURN_MS : TURN_MS), 1);
        drawTurn(turn, ((1 - Math.cos(Math.PI * t)) / 2) * 180);
        if (t < 1) requestAnimationFrame(step);
        else endTurn(turn, true);
      };
      requestAnimationFrame(step);
    }

    // critically damped spring from the current value and velocity (units per second) to a target
    function spring(from, to, velocity, onFrame, onDone, response = 0.35) {
      const omega = (2 * Math.PI) / response;
      const c1 = from - to;
      const c2 = velocity + omega * c1;
      const t0 = performance.now();
      const step = (now) => {
        const t = (now - t0) / 1000;
        const value = to + (c1 + c2 * t) * Math.exp(-omega * t);
        if (t > response * 3 || Math.abs(value - to) < 0.3) {
          onFrame(to);
          onDone();
          return;
        }
        onFrame(value);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // where a flick would come to rest (Apple's scroll-deceleration projection), in px
    const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

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

    // tap a side to turn that way; drag to turn the page with your finger
    const stage = root.querySelector(".mag-stage");
    const SLOP = 10; // px of movement before a press becomes a drag
    let press = null;

    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || press) return;
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: null, history: [] };
    });

    stage.addEventListener("pointermove", (e) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      press.history.push({ x: e.clientX, t: e.timeStamp });
      if (press.history.length > 6) press.history.shift();

      if (!press.drag) {
        if (Math.abs(dx) < SLOP || Math.abs(dx) < Math.abs(e.clientY - press.y)) return;
        if (busy || reduceMotion.matches) return; // a turn in flight, or no motion wanted: treat as a swipe on release
        const dir = dx < 0 ? 1 : -1;
        stage.setPointerCapture(e.pointerId);
        press.drag = single ? { dir, width: stage.clientWidth } : { dir, width: stage.clientWidth / 2, turn: startTurn(dir) };
        if (!single && !press.drag.turn) press.drag.edge = true; // nothing to turn to: just resist
        press.x = e.clientX - Math.sign(dx) * SLOP; // no jump when the drag kicks in
      }

      const drag = press.drag;
      const travel = -drag.dir * (e.clientX - press.x); // px moved in the turning direction
      if (single) {
        const img = right.querySelector("img");
        const atEnd = page + drag.dir < 1 || page + drag.dir > total;
        const moved = atEnd ? rubberband(travel, drag.width) : travel;
        img.style.transform = "translateX(" + -drag.dir * Math.max(-drag.width, moved) + "px)";
      } else if (drag.turn) {
        drawTurn(drag.turn, (travel / drag.width) * 180);
      }
    });

    // a mouse drag on a page image would otherwise start the browser's own image drag
    stage.addEventListener("dragstart", (e) => e.preventDefault());

    const release = (e) => {
      if (!press || e.pointerId !== press.id) return;
      const p = press;
      press = null;
      const dx = e.clientX - p.x;

      if (!p.drag) {
        if (e.type === "pointercancel") return;
        if (Math.abs(dx) > 40) return go(dx < 0 ? 1 : -1); // quick swipe without a tracked drag
        const box = stage.getBoundingClientRect();
        let dir = e.clientX - box.left < box.width / 2 ? -1 : 1;
        if (!single && spread === 0) dir = 1;
        if (!single && spread === lastSpread) dir = -1;
        return go(dir);
      }

      // release velocity in the turning direction, px/s, from moves in the last 100ms (a finger held still has none)
      const h = p.history.filter((m) => e.timeStamp - m.t < 100);
      let velocity = 0;
      if (h.length > 1) {
        const dt = Math.max(16, h[h.length - 1].t - h[0].t);
        velocity = (-p.drag.dir * (h[h.length - 1].x - h[0].x) * 1000) / dt;
      }
      const travel = -p.drag.dir * (e.clientX - p.x);
      // commit if the flick would carry it past halfway; a flick back the other way always cancels
      const commit = e.type !== "pointercancel" && velocity > -100 && travel + project(velocity) > p.drag.width / 2;

      if (single) {
        const img = right.querySelector("img");
        const atEnd = page + p.drag.dir < 1 || page + p.drag.dir > total;
        if (commit && !atEnd) {
          img.style.transform = "";
          go(p.drag.dir, false, 30);
        } else {
          const from = -p.drag.dir * (atEnd ? rubberband(travel, p.drag.width) : travel);
          spring(from, 0, 0, (x) => (img.style.transform = "translateX(" + x + "px)"), () => (img.style.transform = ""));
        }
        return;
      }

      const turn = p.drag.turn;
      if (!turn) return;
      const degPerPx = 180 / p.drag.width;
      spring(turn.angle, commit ? 180 : 0, velocity * degPerPx, (a) => drawTurn(turn, a), () => endTurn(turn, commit));
    };
    stage.addEventListener("pointerup", release);
    stage.addEventListener("pointercancel", release);

    // past the first or last page the page gives way less the further you pull
    function rubberband(overshoot, dimension, constant = 0.55) {
      return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
    }

    new ResizeObserver(setMode).observe(root);
    render();
  }
})();
