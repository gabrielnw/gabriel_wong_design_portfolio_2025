document.addEventListener("DOMContentLoaded", () => {
  // The setup demo loops on its own unless reduced motion is on; a button pauses and plays it.
  const demo = document.querySelector('.hs-demo video[data-autoplay]');
  const demoToggle = document.querySelector('.hs-demo-toggle');
  if (demo && demoToggle) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const label = () => {
      demoToggle.textContent = demo.paused ? 'Play video' : 'Pause video';
      demoToggle.setAttribute('aria-pressed', String(demo.paused));
    };
    demo.addEventListener('play', label);
    demo.addEventListener('pause', label);
    demoToggle.addEventListener('click', () => (demo.paused ? demo.play().catch(() => {}) : demo.pause()));
    if (!reduce.matches) demo.play().catch(() => {});
    label();
  }

  // Slider and knob: both follow the finger 1:1, resist past their ends and spring back on release.
  const sliderHandle = document.querySelector('.slider-handle');
  const sliderTrack = document.querySelector('.slider-track');
  const knobDial = document.querySelector('.knob-dial');
  const knobBase = document.querySelector('.knob-base');

  // Guard clause if elements are not found (e.g. if script loads on a page without the UI)
  if (!sliderHandle || !sliderTrack) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The further past the bound, the less the control follows.
  function rubberband(overshoot, dimension, constant = 0.55) {
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  }

  // Critically damped spring (no overshoot), response in seconds. Starts from the current value.
  function springTo(from, to, onFrame, response = 0.4) {
    if (reduceMotion.matches) {
      onFrame(to);
      return () => {};
    }
    const omega = (2 * Math.PI) / response;
    const t0 = performance.now();
    let frame;
    const step = (now) => {
      const t = (now - t0) / 1000;
      const value = to + (from - to) * (1 + omega * t) * Math.exp(-omega * t);
      if (Math.abs(value - to) < 0.01) {
        onFrame(to);
        return;
      }
      onFrame(value);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }

  // --- Slider: the track is rotated 45deg, so its "down" points down-left on screen ---
  const SLIDER_MIN = 10;
  const SLIDER_MAX = 90;
  const AXIS = { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
  let sliderPos = 50; // logical position in % of the track (10 = top, 90 = bottom)
  let sliderDrag = null;
  let stopSliderSpring = () => {};

  const showSlider = (pos) => (sliderHandle.style.top = pos + '%');

  // on-screen length of the track, including any scale on the device (e.g. 0.85 on phones)
  function trackLength() {
    const box = sliderTrack.getBoundingClientRect();
    const scale = box.width / ((sliderTrack.offsetWidth + sliderTrack.offsetHeight) * Math.SQRT1_2);
    return sliderTrack.offsetHeight * scale;
  }

  sliderHandle.addEventListener('pointerdown', (e) => {
    stopSliderSpring();
    sliderHandle.setPointerCapture(e.pointerId);
    const shown = parseFloat(sliderHandle.style.top) || sliderPos; // start from where it is on screen
    sliderDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: shown, length: trackLength() };
    e.preventDefault();
  });

  sliderHandle.addEventListener('pointermove', (e) => {
    if (!sliderDrag || e.pointerId !== sliderDrag.id) return;
    const along = (e.clientX - sliderDrag.x) * AXIS.x + (e.clientY - sliderDrag.y) * AXIS.y;
    const raw = sliderDrag.from + (along / sliderDrag.length) * 100;
    const bound = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, raw));
    sliderPos = bound;
    showSlider(bound + rubberband(raw - bound, 20)); // a short track gives way only a little
    updateImmersionUI(sliderPos);
  });

  const endSlider = (e) => {
    if (!sliderDrag || e.pointerId !== sliderDrag.id) return;
    sliderDrag = null;
    const shown = parseFloat(sliderHandle.style.top);
    if (shown !== sliderPos) stopSliderSpring = springTo(shown, sliderPos, showSlider);
  };
  sliderHandle.addEventListener('pointerup', endSlider);
  sliderHandle.addEventListener('pointercancel', endSlider);

  // --- Knob: follows the angle of the finger around its centre, 0 to 360deg ---
  let currentRotation = 0; // logical rotation, clamped
  let knobDrag = null;
  let stopKnobSpring = () => {};

  const showKnob = (deg) => (knobDial.style.transform = 'rotate(' + deg + 'deg)');
  const angleOf = (e, c) => (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI;

  if (knobDial && knobBase) {
    knobDial.addEventListener('pointerdown', (e) => {
      stopKnobSpring();
      knobDial.setPointerCapture(e.pointerId);
      const rect = knobBase.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      knobDrag = { id: e.pointerId, center, last: angleOf(e, center), raw: currentRotation };
      e.preventDefault();
    });

    knobDial.addEventListener('pointermove', (e) => {
      if (!knobDrag || e.pointerId !== knobDrag.id) return;
      const angle = angleOf(e, knobDrag.center);
      let delta = angle - knobDrag.last;
      if (delta > 180) delta -= 360; // unwrap across the -180/180 seam
      if (delta < -180) delta += 360;
      knobDrag.last = angle;
      knobDrag.raw += delta;
      const bound = Math.min(360, Math.max(0, knobDrag.raw));
      currentRotation = bound;
      showKnob(bound + rubberband(knobDrag.raw - bound, 45));
      updateHapticUI(currentRotation);
    });

    const endKnob = (e) => {
      if (!knobDrag || e.pointerId !== knobDrag.id) return;
      knobDrag = null;
      const match = /rotate\(([-\d.]+)deg\)/.exec(knobDial.style.transform);
      const shown = match ? parseFloat(match[1]) : currentRotation;
      if (shown !== currentRotation) stopKnobSpring = springTo(shown, currentRotation, showKnob);
    };
    knobDial.addEventListener('pointerup', endKnob);
    knobDial.addEventListener('pointercancel', endKnob);
  }

  // --- Keyboard: both controls are sliders to assistive tech. Arrows move 10%,
  // Page Up/Down 25%, Home and End go to the ends; the control springs to its new value. ---
  const immersionOf = (pos) => Math.round(((SLIDER_MAX - pos) / (SLIDER_MAX - SLIDER_MIN)) * 100);
  const intensityOf = (deg) => Math.round((deg / 360) * 100);

  function makeSlider(el, label, value) {
    el.tabIndex = 0;
    el.setAttribute('role', 'slider');
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');
    el.setAttribute('aria-valuenow', String(value));
    el.setAttribute('aria-valuetext', value + '%');
  }
  function announce(el, value) {
    el.setAttribute('aria-valuenow', String(value));
    el.setAttribute('aria-valuetext', value + '%');
  }
  // the percentage a key moves to, or null for keys the control doesn't handle
  function keyTarget(key, now) {
    const steps = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10, PageUp: 25, PageDown: -25 };
    if (key in steps) return Math.max(0, Math.min(100, now + steps[key]));
    if (key === 'Home') return 0;
    if (key === 'End') return 100;
    return null;
  }

  makeSlider(sliderHandle, 'Immersion level', immersionOf(sliderPos));
  sliderHandle.addEventListener('keydown', (e) => {
    const target = keyTarget(e.key, immersionOf(sliderPos));
    if (target === null) return;
    e.preventDefault();
    const shown = parseFloat(sliderHandle.style.top) || sliderPos;
    sliderPos = SLIDER_MAX - (target / 100) * (SLIDER_MAX - SLIDER_MIN);
    stopSliderSpring();
    stopSliderSpring = springTo(shown, sliderPos, showSlider);
    updateImmersionUI(sliderPos);
    announce(sliderHandle, target);
  });
  sliderHandle.addEventListener('pointermove', () => announce(sliderHandle, immersionOf(sliderPos)));

  if (knobDial) {
    makeSlider(knobDial, 'Haptic intensity', intensityOf(currentRotation));
    knobDial.addEventListener('keydown', (e) => {
      const target = keyTarget(e.key, intensityOf(currentRotation));
      if (target === null) return;
      e.preventDefault();
      const match = /rotate\(([-\d.]+)deg\)/.exec(knobDial.style.transform);
      const shown = match ? parseFloat(match[1]) : currentRotation;
      currentRotation = (target / 100) * 360;
      stopKnobSpring();
      stopKnobSpring = springTo(shown, currentRotation, showKnob);
      updateHapticUI(currentRotation);
      announce(knobDial, target);
    });
    knobDial.addEventListener('pointermove', () => announce(knobDial, intensityOf(currentRotation)));
  }

    // UI Flow Logic
    const steps = {
        welcome: document.getElementById('step-welcome'),
        calibration: document.getElementById('step-calibration'),
        test: document.getElementById('step-test'),
        recalibrating: document.getElementById('step-recalibrating'),
        complete: document.getElementById('step-complete'),
        visor: document.getElementById('step-visor'),
        haptic: document.getElementById('step-haptic'),
        immersion: document.getElementById('step-immersion'),
        finished: document.getElementById('step-finished')
    };

    let currentStep = 'welcome';
    let useVisor = false;

    function showStep(stepName) {
        if (!steps[stepName]) return;
        Object.values(steps).forEach(el => {
            if (el) el.classList.remove('active');
        });
        steps[stepName].classList.add('active');
        currentStep = stepName;
        
        // Reset controls visual state if needed when entering specific steps
        if (stepName === 'haptic') {
            // Ensure UI matches current knob state
            updateHapticUI(currentRotation);
            
            // Update button text based on flow
            const nextBtn = document.getElementById('btn-haptic-next');
            if (nextBtn) {
                if (useVisor) {
                    nextBtn.textContent = "Next";
                } else {
                    nextBtn.textContent = "Finish";
                }
            }
        }
        if (stepName === 'immersion') {
             // Ensure UI matches current slider state
             updateImmersionUI(sliderPos);
        }
    }

    // Buttons
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.addEventListener('click', () => showStep('calibration'));

    const btnCalNext = document.getElementById('btn-cal-next');
    if (btnCalNext) btnCalNext.addEventListener('click', () => showStep('test'));

    const btnTestNo = document.getElementById('btn-test-no');
    if (btnTestNo) btnTestNo.addEventListener('click', () => {
        showStep('recalibrating');
        setTimeout(() => {
            showStep('calibration');
        }, 2000);
    });

    const btnTestYes = document.getElementById('btn-test-yes');
    if (btnTestYes) btnTestYes.addEventListener('click', () => showStep('complete'));

    const btnCompleteNext = document.getElementById('btn-complete-next');
    if (btnCompleteNext) btnCompleteNext.addEventListener('click', () => showStep('visor'));

    const btnVisorSkip = document.getElementById('btn-visor-skip');
    if (btnVisorSkip) btnVisorSkip.addEventListener('click', () => {
        useVisor = false;
        showStep('haptic');
    });

    const btnVisorUse = document.getElementById('btn-visor-use');
    if (btnVisorUse) btnVisorUse.addEventListener('click', () => {
        useVisor = true;
        showStep('haptic');
    });

    const btnHapticNext = document.getElementById('btn-haptic-next');
    if (btnHapticNext) btnHapticNext.addEventListener('click', () => {
        if (useVisor) {
            showStep('immersion');
        } else {
            showStep('finished');
        }
    });

    const btnFinish = document.getElementById('btn-finish');
    if (btnFinish) btnFinish.addEventListener('click', () => showStep('finished'));
    
    const btnReady = document.getElementById('btn-ready');
    if (btnReady) btnReady.addEventListener('click', () => showStep('welcome'));

    // Link Controls to UI
    function updateHapticUI(rotation) {
        if (currentStep !== 'haptic') return;
        
        // Map 0-360 deg to 0-100%
        let val = (rotation / 360) * 100;
        
        // Clamp visual
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        
        const bar = document.getElementById('intensity-bar');
        const valText = document.getElementById('intensity-val');
        
        if (bar) bar.style.width = `${val}%`;
        if (valText) valText.textContent = `${Math.round(val)}%`;
    }

    function updateImmersionUI(sliderPos) {
        if (currentStep !== 'immersion') return;
        // sliderPos is 10 (top/high) to 90 (bottom/low)
        // We want 10 -> 100% immersion, 90 -> 0% immersion
        
        // Invert mapping
        const normalized = 1 - ((sliderPos - 10) / 80); // 1 at top, 0 at bottom
        
        // Clamp just in case
        const clamped = Math.max(0, Math.min(1, normalized));
        
        const circle = document.getElementById('immersion-circle');
        if (circle) {
            const size = 5 + (clamped * 35); // 5px to 40px (fits in 40px container)
            const opacity = 0.2 + (clamped * 0.8);
            
            circle.style.width = `${size}px`;
            circle.style.height = `${size}px`;
            circle.style.opacity = opacity;
        }
    }

});
