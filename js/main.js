import { initCamera, loadModels, getUserState }  from "./sensing.js";
import { generateCalmingInstruction }           from "./ai.js";
import { speak, getAudioContext }               from "./voice.js";
import {
  initBreathing,
  setBreathingSpeed,
  startBreathingGuide,
  stopBreathingGuide,
} from "./breathing.js";

const MONITOR_INTERVAL_MS      = 1000;  // check every second for faster detection
const INTERVENTION_COOLDOWN_MS = 15000; // allow intervention every 15 seconds (was 30)
// thresholds used to decide when to trigger an intervention.  Previously only
// fearful/angry/disgusted states would fire even if they weren't the dominant
// face expression; we now also consider *sad*, *surprised* and make the list easier to
// maintain.
const PANIC_THRESHOLDS = {
  stressLevel: 0.45,  // lowered from 0.6 for faster triggering
  // any of these emotions (dominant or not) will immediately count as panic
  emotions:    ["fearful", "angry", "disgusted", "sad", "surprised"],
};

let monitorIntervalId    = null;
let lastInterventionTime = 0;
let ambientStarted       = false;
let ambientNodes         = [];
let calmStreakStart      = null;
let _calmPromptShown     = false;
const CALM_EXIT_MS       = 15000;

const videoEl          = document.getElementById("webcam");
const startScreen      = document.getElementById("start-screen");
const startBtn         = document.getElementById("start-btn");
const homeBtn          = document.getElementById("home-btn");
const sessionDot       = document.getElementById("session-dot");
const sessionLabel     = document.getElementById("session-label");
const emotionBadge     = document.getElementById("emotion-badge");
const stressBar        = document.getElementById("stress-bar");
const interventionText = document.getElementById("intervention-text");
const calmExitModal    = document.getElementById("calm-exit-modal");

startBtn.addEventListener("click", async () => {
  startScreen.classList.add("hidden");
  await init();
});

homeBtn.addEventListener("click", () => stopSession());

document.getElementById("calm-exit-yes").addEventListener("click", () => stopSession());
document.getElementById("calm-exit-no").addEventListener("click", () => hideCalmExitPrompt());

async function init() {
  updateSessionStatus("Requesting camera...", false);
  try {
    await initCamera(videoEl);
  } catch (err) {
    console.error("[main] Camera access failed:", err);
    updateSessionStatus("Camera access denied", false);
    return;
  }

  updateSessionStatus("Loading models...", false);
  try {
    await loadModels(videoEl);
  } catch (err) {
    console.error("[main] Model load failed:", err);
    updateSessionStatus("Model load failed", false);
    return;
  }

  initBreathing();
  startBreathingGuide();
  setBreathingSpeed(0.2);
  updateSessionStatus("Monitoring active", true);
  startAmbientAudio();
  monitorIntervalId = setInterval(monitorLoop, MONITOR_INTERVAL_MS);
  monitorLoop();
  homeBtn.style.display = "block";
}

function stopSession() {
  clearInterval(monitorIntervalId);
  monitorIntervalId = null;

  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  }

  stopAmbientAudio();
  stopBreathingGuide();

  calmStreakStart  = null;
  _calmPromptShown = false;
  lastInterventionTime = 0;

  hideInterventionText();
  hideCalmExitPrompt();

  homeBtn.style.display = "none";
  startScreen.classList.remove("hidden");
  updateSessionStatus("Starting camera...", false);
}

function monitorLoop() {
  const state = getUserState();

  updateOverlay(state);

  const isPanic =
    state.stressLevel > PANIC_THRESHOLDS.stressLevel ||
    PANIC_THRESHOLDS.emotions.includes(state.emotion);

  if (isPanic) {
    calmStreakStart = null;
    if (_calmPromptShown) hideCalmExitPrompt();
    const now = Date.now();
    if (now - lastInterventionTime > INTERVENTION_COOLDOWN_MS) {
      lastInterventionTime = now;
      triggerIntervention(state);
    }
  } else {
    calmStreakStart = calmStreakStart ?? Date.now();
    if (!_calmPromptShown && Date.now() - calmStreakStart >= CALM_EXIT_MS) {
      showCalmExitPrompt();
    }
  }
}

async function triggerIntervention(state) {
  console.log("[main] Triggering intervention:", state);

  sessionDot.className     = "session-dot intervening";
  sessionLabel.textContent = "Intervention active";

  setBreathingSpeed(state.stressLevel);

  let instruction;
  try {
    instruction = await generateCalmingInstruction(state);
  } catch (err) {
    console.error("[main] AI generation failed:", err);
    instruction = "You are safe. Take a slow breath in, and let it go.";
  }

  showInterventionText(instruction);

  try {
    await speak(instruction, state.stressLevel);
  } catch (err) {
    console.error("[main] Speech failed:", err);
  }

  // Hide text immediately when voice finishes (speak() waits for audio to end)
  hideInterventionText();

  sessionDot.className     = "session-dot active";
  sessionLabel.textContent = "Monitoring active";
}


function _stressClass(stressLevel) {
  if (stressLevel >= 0.65) return "high";
  if (stressLevel >= 0.4)  return "moderate";
  return "calm";
}

function updateOverlay(state) {
  emotionBadge.textContent = `${state.emotion} · ${Math.round(state.stressLevel * 100)}%`;
  emotionBadge.className   = "status-badge " + _stressClass(state.stressLevel);
  stressBar.style.width    = `${Math.round(state.stressLevel * 100)}%`;
}

function updateSessionStatus(label, active) {
  sessionLabel.textContent = label;
  sessionDot.className = active ? "session-dot active" : "session-dot";
}

function showInterventionText(text) {
  interventionText.textContent = text;
  interventionText.classList.add("visible");
}

function hideInterventionText() {
  interventionText.classList.remove("visible");
}

function showCalmExitPrompt() {
  _calmPromptShown = true;
  calmExitModal.classList.add("visible");
}

function hideCalmExitPrompt() {
  _calmPromptShown = false;
  calmStreakStart  = null;
  calmExitModal.classList.remove("visible");
}

function startAmbientAudio() {
  if (ambientStarted) return;
  ambientStarted = true;

  try {
    const ctx = getAudioContext();

    const bufferSize  = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data        = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop   = true;

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type            = "lowpass";
    lpFilter.frequency.value = 400;
    lpFilter.Q.value         = 0.5;

    const bpFilter = ctx.createBiquadFilter();
    bpFilter.type            = "bandpass";
    bpFilter.frequency.value = 800;
    bpFilter.Q.value         = 0.3;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.045;

    noiseSource.connect(lpFilter);
    lpFilter.connect(bpFilter);
    bpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(0);

    const osc = ctx.createOscillator();
    osc.type            = "sine";
    osc.frequency.value = 55;

    const padGain = ctx.createGain();
    padGain.gain.value = 0.04;

    const lfo = ctx.createOscillator();
    lfo.type            = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;

    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);

    osc.connect(padGain);
    padGain.connect(ctx.destination);

    osc.start(0);
    lfo.start(0);

    const osc2 = ctx.createOscillator();
    osc2.type            = "sine";
    osc2.frequency.value = 82.4;

    const padGain2 = ctx.createGain();
    padGain2.gain.value = 0.025;

    osc2.connect(padGain2);
    padGain2.connect(ctx.destination);
    osc2.start(0);

    ambientNodes = [noiseSource, osc, lfo, osc2];

    console.log("[main] Ambient audio started.");
  } catch (err) {
    console.warn("[main] Ambient audio failed to start:", err);
  }
}

function stopAmbientAudio() {
  ambientNodes.forEach((node) => {
    try { node.stop(); } catch (_) {}
  });
  ambientNodes = [];
  ambientStarted = false;
}