const _state = { emotion: "neutral", stressLevel: 0, expressions: {}, ready: false, paused: false, calmCount: 0 };

function computeStressFromExpressions(expr) {
  const score =
    (expr.fearful   ?? 0) * 1.0 +
    (expr.angry     ?? 0) * 0.85 +
    (expr.disgusted ?? 0) * 0.7 +
    (expr.sad       ?? 0) * 0.5 +
    (expr.surprised ?? 0) * 0.35 -
    (expr.happy     ?? 0) * 0.3;
  return Math.min(Math.max(score * 3.0, 0), 1);
}

export async function initCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export async function loadModels(videoEl) {
  const MODEL_URL = "/models";
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  setInterval(async () => {
    if (_state.paused) return;

    const result = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions();

    if (!result) {
      console.log("[sensing] No face detected");
      return;
    }

    const expressions = result.expressions;
    const dominant = Object.entries(expressions).sort(([, a], [, b]) => b - a)[0][0];

    const PANIC_OVERRIDE_THRESHOLD = 0.65;
    const PANIC_EMOTIONS = ["fearful", "angry", "disgusted", "sad", "surprised"];
    let finalEmotion = dominant;
    for (const em of PANIC_EMOTIONS) {
      if ((expressions[em] ?? 0) > PANIC_OVERRIDE_THRESHOLD) {
        finalEmotion = em;
        break;
      }
    }

    const stress = computeStressFromExpressions(expressions);
    const isCalm = !PANIC_EMOTIONS.includes(finalEmotion) && stress < 0.45;
    _state.calmCount = isCalm ? _state.calmCount + 1 : 0;

    console.log(`[sensing] emotion=${finalEmotion} stress=${stress.toFixed(3)} calmStreak=${_state.calmCount}`, expressions);

    _state.emotion     = finalEmotion;
    _state.stressLevel = stress;
    _state.expressions = expressions;
  }, 3000);


  _state.ready = true;
}

export function getUserState() {
  return {
    emotion:     _state.emotion,
    stressLevel: parseFloat(_state.stressLevel.toFixed(3)),
    // expose raw expression scores for advanced logic if needed
    expressions: { ..._state.expressions },
  };
}

export function isSensingReady() {
  return _state.ready;
}

export function pauseScanning()  { _state.paused = true; }
export function resumeScanning() { _state.paused = false; }
export function getCalmCount()   { return _state.calmCount; }
export function resetCalmCount() { _state.calmCount = 0; }
