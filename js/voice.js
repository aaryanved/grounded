import { ELEVENLABS_API_KEY } from "../config.js";

const VOICE_ID = "pHDas0XaKmHDkNMCKsnc";

const ELEVENLABS_ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

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

  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === "YOUR_ELEVENLABS_API_KEY") {
    console.warn("[voice] ElevenLabs key not set. Falling back to Web Speech API.");
    return _speakFallback(text, stressLevel);
  }

  try {
    const response = await fetch(ELEVENLABS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability:        stressLevel > 0.7 ? 0.75 : 0.65,
          similarity_boost: 0.85,
          style:            0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
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
