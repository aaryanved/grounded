let _labelEl = null;

let _phaseTimer = null;
let _isRunning  = false;

let _inhaleMs = 4000;
let _exhaleMs = 4000;

export function initBreathing() {
  _labelEl = document.getElementById("breathing-text");
}

export function setBreathingSpeed(stressLevel) {
  if (stressLevel > 0.7) {
    _inhaleMs = 4000;
    _exhaleMs = 4000;
  } else if (stressLevel > 0.4) {
    _inhaleMs = 5000;
    _exhaleMs = 5000;
  } else {
    _inhaleMs = 6000;
    _exhaleMs = 6000;
  }

}

export function startBreathingGuide() {
  if (_isRunning) return;
  _isRunning = true;
  _runPhase("in");
}

export function stopBreathingGuide() {
  _isRunning = false;
  clearTimeout(_phaseTimer);
  if (_labelEl) {
    _labelEl.classList.remove("visible");
    _labelEl.textContent = "";
  }
}

export function updateBreathingLabel(phase) {
  if (!_labelEl) return;
  const text = phase === "in"  ? "Breathe in..."
             : phase === "out" ? "Breathe out..."
             : phase;
  _labelEl.textContent = text;
  _labelEl.classList.add("visible");
}

function _runPhase(phase) {
  if (!_isRunning) return;

  updateBreathingLabel(phase);

  const duration  = phase === "in" ? _inhaleMs : _exhaleMs;
  const nextPhase = phase === "in" ? "out" : "in";

  _phaseTimer = setTimeout(() => {
    if (_isRunning) _runPhase(nextPhase);
  }, duration);
}
