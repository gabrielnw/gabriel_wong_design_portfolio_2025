document.addEventListener("DOMContentLoaded", () => {
  // Slider Logic
  const sliderHandle = document.querySelector('.slider-handle');
  const sliderTrack = document.querySelector('.slider-track');
  
  // Guard clause if elements are not found (e.g. if script loads on a page without the UI)
  if (!sliderHandle || !sliderTrack) return;

  let isDraggingSlider = false;
  let sliderStartY = 0;
  let sliderStartTop = 0;

  // Get track dimensions to constrain movement
  // The track is rotated 45deg, so we need to be careful with coordinate systems.
  // For simplicity in this visual demo, we'll just move the handle along the Y axis of the track container's local space
  // since the handle is a child of the track.
  
  sliderHandle.addEventListener('mousedown', (e) => {
      isDraggingSlider = true;
      sliderHandle.style.cursor = 'grabbing';
      sliderStartY = e.clientY;
      // Get current top value (parsing '50%' or pixels)
      const computedStyle = window.getComputedStyle(sliderHandle);
      // We need to handle the initial '50%' or pixel values
      // Let's rely on offsetTop for initial position if needed, but here we are modifying style.top
      // If style.top is empty (CSS class), it defaults to 50%.
      // Let's assume the track height is fixed at 90px (from CSS).
      // 50% is 45px.
      
      // Let's store the current percentage or pixel value
      // A simpler way for a rotated element: calculate the delta in mouse movement, project it onto the slider's axis.
      // The slider is rotated 45deg.
      // Moving mouse DOWN (positive Y) and LEFT (negative X) corresponds to moving along the track?
      // 45deg means top-right to bottom-left.
      // So -X and +Y are both "down" the track.
      
      e.preventDefault();
  });

    // Knob Logic
    const knobDial = document.querySelector('.knob-dial');
    const knobBase = document.querySelector('.knob-base');
    let isRotatingKnob = false;
    let currentRotation = 0;
    let startAngle = 0;
    let center = { x: 0, y: 0 };

    if (knobDial && knobBase) {
        knobDial.addEventListener('mousedown', (e) => {
            isRotatingKnob = true;
            knobDial.style.cursor = 'grabbing';
            
            const rect = knobBase.getBoundingClientRect();
            center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            
            const dx = e.clientX - center.x;
            const dy = e.clientY - center.y;
            startAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Adjust for current rotation to prevent jumping
            // We want the mouse angle to align with the current rotation offset
            // But simpler: just track delta from startAngle
            
            e.preventDefault();
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (isDraggingSlider) {
            // Calculate delta
            const deltaY = e.clientY - sliderStartY;
            
            if (!sliderHandle.dataset.pos) sliderHandle.dataset.pos = "50"; // Start at 50%
            
            let currentPos = parseFloat(sliderHandle.dataset.pos);
            
            // Sensitivity
            currentPos += deltaY * 0.2; 
            
            // Clamp
            if (currentPos < 10) currentPos = 10;
            if (currentPos > 90) currentPos = 90;
            
            sliderHandle.dataset.pos = currentPos;
            sliderHandle.style.top = `${currentPos}%`;
            
            sliderStartY = e.clientY;

            // Update UI if in Immersion step
            if (typeof updateImmersionUI === 'function') {
                updateImmersionUI(currentPos);
            }
        }

        if (isRotatingKnob) {
            const dx = e.clientX - center.x;
            const dy = e.clientY - center.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Calculate delta angle
            let deltaAngle = angle - startAngle;
            
            // Handle wrapping for delta calculation
            if (deltaAngle > 180) deltaAngle -= 360;
            if (deltaAngle < -180) deltaAngle += 360;

            // Apply delta
            let newRotation = currentRotation + deltaAngle;
            
            // Clamp rotation (0 to 360 degrees)
            // This prevents wrapping and ensures min/max limits
            // This prevents wrapping and ensures min/max limits
            if (newRotation < 0) newRotation = 0;
            if (newRotation > 360) newRotation = 360;
            
            currentRotation = newRotation;
            knobDial.style.transform = `rotate(${currentRotation}deg)`;
            
            startAngle = angle; // Update start angle for next frame

            // Update UI if in Haptic step
            if (typeof updateHapticUI === 'function') {
                updateHapticUI(currentRotation);
            }
        }
    });

    document.addEventListener('mouseup', () => {
        isDraggingSlider = false;
        isRotatingKnob = false;
        if (sliderHandle) sliderHandle.style.cursor = 'grab';
        if (knobDial) knobDial.style.cursor = 'grab';
    });

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
             let sliderPos = parseFloat(sliderHandle.dataset.pos || 50);
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
