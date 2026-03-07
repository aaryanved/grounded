# Grounded

Real-time panic intervention web app built for **Hack Canada 2026**.

Grounded uses your webcam to detect stress and emotional state via facial expression analysis, then responds with AI-generated calming instructions, therapeutic breathing guidance, and ElevenLabs voice output — all inside an immersive A-Frame WebXR environment.

---

## Features

- Real-time facial expression analysis via face-api.js (TinyFaceDetector)
- Three-tier intervention system triggered by stress thresholds
- AI-generated calming instructions via Gemini 2.5 Flash
- ElevenLabs neural TTS voice output (fallback: Web Speech API)
- Animated breathing sphere with phase-synced text labels
- Generative ambient soundscape (Web Audio API — no audio files needed)
- Calm/stress scale display — no clinical emotion labels shown to user
- Pure HTML/CSS/JS ES modules — no build step required

---

## Architecture

```
Browser
├── index.html          A-Frame scene + overlay UI
├── styles.css          Pastel glassmorphism theme
└── js/
    ├── main.js         Control loop, ambient audio, intervention orchestration
    ├── sensing.js      face-api.js integration, stress computation
    ├── ai.js           Gemini REST API — calming instruction generation
    ├── voice.js        ElevenLabs TTS REST API + Web Speech fallback
    └── breathing.js    A-Frame animation control + breathing label cycling
```

Data flow:

```
Camera → face-api.js → sensing.js (emotion + stress)
                              ↓
                         main.js (monitor loop, 1s)
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
| `styles.css` | Pastel glassmorphism theme, status panel, breathing label |
| `js/main.js` | Entry point, monitoring loop, ambient audio, intervention logic |
| `js/sensing.js` | face-api.js init, expression → stress computation, `getUserState()` |
| `js/ai.js` | Gemini API prompt building and response parsing |
| `js/voice.js` | ElevenLabs TTS, Web Speech fallback, shared AudioContext |
| `js/breathing.js` | Breathing sphere speed, color, and phase label cycling |
| `config.js` | API keys (gitignored — copy from `config.example.js`) |

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
export const GEMINI_MODEL       = "gemini-2.5-flash";
```

### 3. Serve locally

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

---

## Intervention Levels

| Level | Trigger | Response type |
|---|---|---|
| 1 | stress > 0.6 | Breathing instruction |
| 2 | stress > 0.75 | 5-4-3-2-1 grounding exercise |
| 3 | stress > 0.9 | Verbal reassurance |

A 15-second cooldown prevents repeated interventions. An `_interventionInProgress` flag prevents duplicate Gemini calls if the API response takes longer than the cooldown window.

---

## Calm/Stress Scale

| Stress range | Label shown |
|---|---|
| 0.00 – 0.20 | Very Calm |
| 0.20 – 0.40 | Calm |
| 0.40 – 0.65 | Mildly Stressed |
| 0.65 – 0.85 | Stressed |
| 0.85 – 1.00 | Very Stressed |

---

## Theme

Pastel calm palette across all UI elements and the A-Frame scene.

| Role | Color |
|---|---|
| Background | `#D4EEF2` (powder blue) |
| Primary accent / buttons | `#6BBCBE` (teal) |
| Calm indicator | `#88C65A` (green) |
| Moderate stress | `#FDEAAA` (pale yellow) |
| High stress | `#F5B87A` (peach) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| 3D environment | A-Frame 1.4.0 (WebXR) |
| Expression sensing | face-api.js (TinyFaceDetector) |
| AI instructions | Google Gemini 2.5 Flash |
| Voice output | ElevenLabs TTS / Web Speech API |
| Ambient audio | Web Audio API (generative, no files) |
| Frontend | Vanilla HTML/CSS/JS ES modules |
| Serving | Python `http.server` (any static server) |

---

## Recent Updates

- **Gemini 2.5 Flash** — upgraded from preview model; better free-tier quota and lower latency
- **Duplicate intervention guard** — `_interventionInProgress` flag prevents a second Gemini call when the API is slow and the cooldown window expires mid-response
- **Pastel theme** — full UI and A-Frame scene rethemed to powder blue, teal, peach, and sage green
- **Removed all source comments** — clean production-ready codebase
