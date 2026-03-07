let _audioCtx = null;

function _getAudioContext() {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume();
  }
  return _audioCtx;
}

export async function speak(text, stressLevel = 0.5) {
  if (!text || text.trim().length === 0) return;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, stressLevel }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const arrayBuf  = await audioBlob.arrayBuffer();
    const ctx       = _getAudioContext();
    const decoded   = await ctx.decodeAudioData(arrayBuf);

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = decoded;

      const gain = ctx.createGain();
      gain.gain.value = 0.9;

      source.connect(gain);
      gain.connect(ctx.destination);

      source.onended = resolve;
      source.start(0);
    });
  } catch (err) {
    console.error("[voice] ElevenLabs TTS failed:", err);
    return _speakFallback(text, stressLevel);
  }
}

function _speakFallback(text, stressLevel) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("[voice] Web Speech API not available.");
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance    = new SpeechSynthesisUtterance(text);
    utterance.rate     = stressLevel > 0.7 ? 0.82 : 0.9;
    utterance.pitch    = 0.95;
    utterance.volume   = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.lang === "en-GB"
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend   = resolve;
    utterance.onerror = resolve;

    window.speechSynthesis.speak(utterance);
  });
}

export function getAudioContext() {
  return _getAudioContext();
}
