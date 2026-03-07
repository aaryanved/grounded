const _state = { emotion: "neutral", stressLevel: 0, ready: false };

const EMOTION_STRESS_MAP = {
  fearful:   1.0,
  angry:     0.85,
  disgusted: 0.7,
  sad:       0.6,
  surprised: 0.5,
  neutral:   0.2,
  happy:     0.1,
};

function computeStressLevel(emotion) {
  return EMOTION_STRESS_MAP[emotion] ?? 0.2;
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
    if (result) {
      const dominant = Object.entries(result.expressions)
        .sort(([, a], [, b]) => b - a)[0][0];
      _state.emotion     = dominant;
      _state.stressLevel = computeStressLevel(dominant);
    }
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
