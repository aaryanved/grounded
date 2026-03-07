const _state = { emotion: "neutral", stressLevel: 0, expressions: {}, ready: false };

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
    const result = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions();

    if (!result) {
      console.log("[sensing] No face detected");
      return;
    }

    const expressions = result.expressions;
  // start with the naturally dominant emotion reported by face-api
  const dominant = Object.entries(expressions)
      .sort(([, a], [, b]) => b - a)[0][0];

  // if any of the 'panic' emotions exceed a reasonable threshold we want
  // the user state to reflect that even when they're not the absolute
  // winner, otherwise main.js never triggers an intervention.
  const PANIC_OVERRIDE_THRESHOLD = 0.4;  // lowered from 0.6 for faster sensitivity
  const PANIC_EMOTIONS = ["disgusted", "angry", "fearful", "sad", "surprised"];
  let finalEmotion = dominant;
  for (const em of PANIC_EMOTIONS) {
    if ((expressions[em] ?? 0) > PANIC_OVERRIDE_THRESHOLD) {
      finalEmotion = em;
      break;
    }
  }

  const stress = computeStressFromExpressions(expressions);

  console.log(`[sensing] emotion=${finalEmotion} stress=${stress.toFixed(3)}`, expressions);

  _state.emotion     = finalEmotion;
  _state.stressLevel = stress;
  _state.expressions = expressions;
  }, 3000);  // detect every 3 seconds instead of every 1 second for smoother, more stable emotion detection


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
