# Grounded: Real-Time Panic Intervention
### Hack Canada 2026 – Product Delivery Document

---

# 1. Overview

**Grounded** is an AI-powered real-time panic attack intervention system designed to provide immediate grounding and calming assistance to individuals experiencing acute anxiety or panic attacks.

Unlike traditional mental health apps that rely on static videos or written instructions, Grounded actively **observes, interprets, and responds** to a user's physiological and emotional state in real time using computer vision and AI.

The system integrates:

- Emotion detection and heart-rate estimation via webcam
- AI-generated therapeutic instructions
- Immersive 3D visual grounding environments
- Realistic calming voice guidance

This allows Grounded to act as a **digital grounding companion** that helps guide users safely through a panic episode.

---

# 2. Problem Statement

Panic attacks affect millions of people worldwide and often occur suddenly without access to immediate support.

During a panic attack:

- Cognitive load becomes extremely high
- Reading instructions becomes difficult
- Users feel isolated and overwhelmed
- Breathing and heart rate become dysregulated

Existing solutions such as meditation apps or videos do not adapt to the user's **real-time emotional state**.

Therefore, there is a need for a **responsive, AI-driven intervention system** that can:

- Detect panic symptoms
- Provide adaptive calming guidance
- Deliver grounding experiences through voice and visual cues

---

# 3. Solution

Grounded is a **web-based AI intervention platform** that detects signs of panic and dynamically guides users through grounding exercises.

### Key Innovations

1. Real-time emotional sensing  
2. AI-driven therapeutic response  
3. Immersive WebXR calming environment  
4. Human-like calming voice guidance  

The system monitors physiological and emotional indicators and adapts its response accordingly.

Example interaction:

1. User opens Grounded during a panic attack  
2. Webcam detects elevated heart rate and fearful expression  
3. AI generates a calming intervention  
4. Voice guidance speaks the instruction  
5. A breathing sphere expands and contracts to guide breathing  

---

# 4. Target Users

Primary users include:

- Individuals experiencing panic attacks
- People with generalized anxiety disorder
- Students and young professionals
- Individuals without immediate access to mental health care

Secondary users:

- Telehealth platforms
- Mental health support services
- Universities and workplaces

---

# 5. Core Features

## 5.1 Real-Time Panic Detection

Using webcam analysis, Grounded detects:

- Facial expressions indicating fear or distress
- Elevated heart rate (remote photoplethysmography)
- Rapid breathing patterns
- Shoulder movement indicating hyperventilation

Technology used:

- Presage Human Sensing SDK

---

## 5.2 Adaptive AI Guidance

AI processes biometric data and emotional signals to generate calming instructions.

Example prompt:

User heart rate: 110 BPM  
Detected emotion: fear  
Breathing pattern: rapid  

Generate a one-sentence calming instruction to guide the user through breathing.

Example output:

"You're safe right now. Let's breathe together — slow inhale for four seconds, and a gentle exhale."

---

## 5.3 Immersive WebXR Safe Space

A calming 3D environment provides visual grounding.

Features include:

- Pulsing breathing sphere
- Soft ambient colors
- Minimalist immersive environments (forest, ocean, sky)

The breathing sphere expands and contracts to guide user breathing.

---

## 5.4 Calming Voice Companion

Instead of robotic narration, Grounded uses a realistic calming voice.

Features:

- Emotionally expressive AI voice
- Soft pacing
- Adaptive tone depending on stress level

Technology used:

- ElevenLabs Voice AI

---

## 5.5 Adaptive Intervention Levels

Grounded escalates intervention depending on user stress signals.

### Level 1 — Breathing Regulation

Guided box breathing.

### Level 2 — Grounding Exercise

5-4-3-2-1 sensory grounding.

### Level 3 — Stabilization

Verbal reassurance and slower breathing patterns.

---

# 6. System Architecture

User Webcam + Microphone  
↓  
Emotion & Heart Rate Detection  
↓  
AI Processing (Calming Response Generation)  
↓  
Voice Synthesis  
↓  
WebXR Environment (Visual Breathing Guidance)

---

# 7. Technology Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- A-Frame (WebXR)
- Three.js

## AI & Machine Learning

- Gemini API (context-aware intervention generation)

## Human Sensing

- Presage SDK  
  - Emotion detection  
  - Facial expression analysis  
  - Remote heart-rate estimation  

## Voice & Audio

- ElevenLabs Voice AI (realistic calming narration)
- Web Audio API (ambient sound generation)

## Browser APIs

- WebRTC (camera access)
- WebGL (3D rendering)
- WebXR (immersive environment support)

## Hosting & Deployment

- Vercel / Netlify (frontend hosting)
- GitHub (version control)

---

# 8. Core Logic Flow

### Step 1 — User Opens Grounded

User accesses the platform during anxiety or panic.

### Step 2 — Environment Loads

A calming WebXR environment appears instantly.

### Step 3 — Emotional Detection

Computer vision analyzes:

- Facial expressions
- Heart rate
- Stress signals

### Step 4 — AI Decision

The AI determines the best intervention strategy.

### Step 5 — Voice Guidance

The voice assistant speaks calming instructions.

### Step 6 — Visual Breathing Guide

The breathing sphere expands and contracts to regulate breathing.

---

# 9. Example Core Code Concept

## Breathing Sphere (A-Frame)

```html
<a-sphere id="breathing-ball"
          position="0 1.25 -5"
          radius="1.25"
          color="#EF2D5E">
  <a-animation
    attribute="scale"
    dur="4000"
    from="1 1 1"
    to="2 2 2"
    direction="alternate"
    repeat="indefinite">
  </a-animation>
</a-sphere>