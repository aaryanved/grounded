
# Grounded — Development TODO Guide
### Step-by-Step Build Instructions for Claude Code

This document explains how to build the Grounded application step-by-step based on the Product Delivery Document.

---

# 1. Project Setup

## 1.1 Create Project Structure

Create the following directory structure:

grounded/
│
├── index.html
├── styles.css
├── main.js
├── ai.js
├── voice.js
├── sensing.js
├── breathing.js
│
├── assets/
│   ├── audio/
│   └── textures/
│
└── README.md

---

## 1.2 Initialize Git Repository

git init  
git add .  
git commit -m "Initial Grounded setup"

---

# 2. Basic Web App Setup

## 2.1 Create HTML Base

Create index.html.

The page should:

- Request camera access
- Load the 3D breathing environment
- Load JavaScript modules
- Display minimal UI

Requirements:

- Import A-Frame
- Import main JS logic
- Create a WebXR scene container

---

## 2.2 Add CSS

Create styles.css.

Goals:

- Dark calming theme
- Minimal interface
- Focus on the breathing sphere

Design rules:

- Background: dark gradient
- Smooth transitions
- No visual clutter

---

# 3. Implement WebXR Environment

## 3.1 Load A-Frame

Include:

<script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>

---

## 3.2 Create Breathing Sphere

Inside the A-Frame scene:

<a-scene>

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

</a-scene>

---

## 3.3 Add Ambient Lighting

Add:

- Ambient light
- Soft blue/purple colors
- Low brightness

Goal: calming immersive space.

---

# 4. Camera Access

## 4.1 Request Webcam Access

Create sensing.js.

Use WebRTC:

1. Ask for camera permission
2. Start video stream
3. Attach to hidden video element

---

# 5. Integrate Presage Human Sensing

Expected outputs:

- heartRate
- emotion
- stressLevel

Create function:

getUserState()

Return:

{
heartRate: number,
emotion: string,
stressLevel: number
}

Update every few seconds.

---

# 6. AI Intervention System

Create ai.js.

## 6.1 Connect to Gemini API

Steps:

1. Add Gemini API key
2. Create function to send prompt
3. Return calming instruction

Function:

generateCalmingInstruction(userState)

Prompt:

User is experiencing panic.
Heart rate: X
Emotion: Y

Generate one short calming breathing instruction.

---

# 7. Voice System

Create voice.js.

## 7.1 Integrate ElevenLabs

Steps:

1. Add API key
2. Select calming voice
3. Send text to ElevenLabs
4. Receive audio

Function:

speak(text)

---

# 8. Breathing Guidance System

Create breathing.js.

## 8.1 Sync Breathing Ball

Examples:

High stress:

4 second inhale  
4 second exhale

Moderate stress:

5 second inhale  
5 second exhale

Update animation speed dynamically.

---

# 9. Main Control Loop

Create main.js.

## 9.1 Initialize System

1. Start camera
2. Start sensing
3. Load 3D environment

## 9.2 Monitoring Loop

Every few seconds:

userState = getUserState()

If:

heartRate > threshold OR emotion == fear

Trigger intervention.

## 9.3 Intervention Flow

1 detect panic  
2 send state to Gemini  
3 receive calming instruction  
4 send to ElevenLabs  
5 play voice guidance  
6 adjust breathing sphere

---

# 10. Ambient Audio

Add background sound:

- ocean waves
- soft pads
- wind

Use Web Audio API.

Ensure:

- low volume
- looping

---

# 11. Privacy Safeguards

Ensure:

- No webcam recordings stored
- Data processed locally when possible
- Session cleared on refresh

---

# 12. Performance Optimization

Goals:

- Load < 2 seconds
- Smooth rendering
- Low CPU usage

Strategies:

- lightweight 3D scene
- optimized loops

---

# 13. Testing

Test panic scenario:

- high heart rate
- fearful expression

Expected:

- breathing sphere activates
- calming voice plays

---

# 14. Demo Flow

1. Open Grounded
2. Allow camera access
3. WebXR environment loads
4. Panic detected
5. Voice guidance begins
6. Breathing sphere guides user

---

# End Goal

A working prototype of Grounded that provides:

- Real-time emotional sensing
- AI-driven calming intervention
- Immersive breathing guidance
- Voice-based support
