const _state = { emotion: "neutral", stressLevel: 0, ready: false };

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

    const dominant = Object.entries(result.expressions)
      .sort(([, a], [, b]) => b - a)[0][0];
    const stress = computeStressFromExpressions(result.expressions);

    console.log(`[sensing] emotion=${dominant} stress=${stress.toFixed(3)}`, result.expressions);

    _state.emotion     = dominant;
    _state.stressLevel = stress;
  }, 1000);

  _state.ready = true;
}

export function getUserState() {
  return {
    emotion:     _state.emotion,
    stressLevel: parseFloat(_state.stressLevel.toFixed(3)),
  };
}

export function isSensingReady() {
  return _state.ready;
}
