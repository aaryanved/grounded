# Grounded

Real-time panic intervention web app built for **Hack Canada 2026**.

Grounded uses your webcam to read biometrics in real time (heart rate, stress level) via the Presage SDK, then responds with AI-generated calming instructions, therapeutic breathing guidance, and ElevenLabs voice output — all inside an immersive A-Frame WebXR environment.

---

## Features

- Real-time heart rate and stress monitoring via Presage SDK (camera-based rPPG)
- Three-tier intervention system triggered by biometric thresholds
- AI-generated calming instructions via Gemini API
- ElevenLabs neural TTS voice output (fallback: Web Speech API)
- Animated breathing sphere with phase-synced text labels
- Generative ambient soundscape (Web Audio API — no audio files needed)
- Calm/stress scale display — no clinical emotion labels shown to user
- Demo mode: runs without Presage credentials using simulated biometrics
- Pure HTML/CSS/JS ES modules — no build step required

---

## Architecture

```
Browser
├── index.html          A-Frame scene + overlay UI
├── styles.css          Dark glassmorphism theme
└── js/
    ├── main.js         Control loop, ambient audio, intervention orchestration
    ├── sensing.js      Presage SDK integration + demo mode fallback
    ├── ai.js           Gemini REST API — calming instruction generation
    ├── voice.js        ElevenLabs TTS REST API + Web Speech fallback
    └── breathing.js    A-Frame animation control + breathing label cycling
```

Data flow:

```
Camera → Presage SDK → sensing.js (HR + stress)
                              ↓
                         main.js (monitor loop, 1.5s)
                              ↓
              ┌───────────────┴────────────────┐
         ai.js (Gemini)               breathing.js (sphere)
              ↓
         voice.js (ElevenLabs / Web Speech)
```

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | A-Frame 1.4.0 scene, overlay UI panels, start screen |
| `styles.css` | Dark glassmorphism theme, status panel, breathing label |
| `js/main.js` | Entry point, monitoring loop, ambient audio, intervention logic |
| `js/sensing.js` | Presage SDK init, demo mode simulation, `getUserState()` |
| `js/ai.js` | Gemini API prompt building and response parsing |
| `js/voice.js` | ElevenLabs TTS, Web Speech fallback, shared AudioContext |
| `js/breathing.js` | Breathing sphere speed, color, and phase label cycling |
| `config.example.js` | API key template — copy to `config.js` and fill in |

---

## Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd grounded
cp config.example.js config.js
```

### 2. Fill in API keys

Open `config.js` and replace the placeholder values:

```js
export const GEMINI_API_KEY     = "your-gemini-key";
export const ELEVENLABS_API_KEY = "your-elevenlabs-key";
export const PRESAGE_API_KEY    = "your-presage-key";
```

### 3. (Optional) Add Presage SDK

If you have Presage credentials, add the SDK script tag to `index.html`:

```html
<script src="https://sdk.presage.io/presage-sdk.js"></script>
```

Without this, the app automatically runs in **demo mode** with simulated biometrics.

### 4. Serve locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in Chrome and allow camera access.

> ES modules require a local server. Opening `index.html` directly via `file://` will not work.

---

## API Keys

| Service | Key variable | Where to get it |
|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| ElevenLabs | `ELEVENLABS_API_KEY` | [ElevenLabs dashboard](https://elevenlabs.io) |
| Presage | `PRESAGE_API_KEY` | [Presage developer portal](https://presage.io) |

---

## Demo Mode

If the Presage SDK script is not present, `sensing.js` automatically falls back to demo mode:

- Heart rate oscillates between ~46–90 BPM using a sine wave
- Emotions cycle through `neutral → neutral → fear → fear → sad → neutral → calm`
- Updates every **500ms** so stress bar and state badge respond quickly
- Stress thresholds are still evaluated, so interventions trigger normally

No configuration needed — demo mode activates automatically.

---

## Intervention Levels

| Level | Trigger | Response type |
|---|---|---|
| 1 | HR > 90 or stress > 0.6 | Box breathing instruction (4-4-4-4) |
| 2 | HR > 100 or stress > 0.75 | 5-4-3-2-1 grounding exercise |
| 3 | HR > 115 or stress > 0.9 | Verbal reassurance and stabilization |

A 30-second cooldown prevents repeated interventions. The breathing sphere color and speed also update to match the current stress level.

---

## Calm/Stress Scale

The status panel displays a calm/stress label derived from the computed stress value (0–1):

| Stress range | Label shown |
|---|---|
| 0.00 – 0.20 | Very Calm |
| 0.20 – 0.40 | Calm |
| 0.40 – 0.65 | Mildly Stressed |
| 0.65 – 0.85 | Stressed |
| 0.85 – 1.00 | Very Stressed |

Internal emotion labels (from the Presage SDK) are used only for stress computation — they are never displayed to the user.

---

## Tech Stack

| Layer | Technology |
|---|---|
| 3D environment | A-Frame 1.4.0 (WebXR) |
| Biometric sensing | Presage SDK (camera rPPG) |
| AI instructions | Google Gemini API (`gemini-pro`) |
| Voice output | ElevenLabs TTS (Rachel voice) / Web Speech API |
| Ambient audio | Web Audio API (generative, no files) |
| Frontend | Vanilla HTML/CSS/JS ES modules |
| Serving | Python `http.server` (any static server) |
