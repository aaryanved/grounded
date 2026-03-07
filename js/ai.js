

function getInterventionLevel(userState) {
  const { heartRate, stressLevel } = userState;
  if (heartRate > 115 || stressLevel > 0.9) return 3;
  if (heartRate > 100 || stressLevel > 0.75) return 2;
  return 1;
}

function getCalmDescriptor(stressLevel) {
  if (stressLevel < 0.2)  return "Very Calm";
  if (stressLevel < 0.4)  return "Calm";
  if (stressLevel < 0.65) return "Mildly Stressed";
  if (stressLevel < 0.85) return "Stressed";
  return "Very Stressed";
}

function buildPrompt(userState, level) {
  const { heartRate, stressLevel, emotion } = userState;
  const stressPct = Math.round(stressLevel * 10);
  const calmLabel = getCalmDescriptor(stressLevel);

  return `You are a warm, compassionate grounding companion. A person is feeling ${emotion || "distressed"} right now.
Their stress level is ${calmLabel} (${stressPct}/10) and heart rate is around ${heartRate} BPM.
Give ONE short, comforting grounding or breathing cue (max 2 sentences). Keep it simple, warm, and actionable.
Vary your suggestions — try different techniques like slow breathing, body awareness, sensory focus, or reassurance.
Respond ONLY with the instruction text — no titles, no labels, plain calming words only.`;
}


export async function generateCalmingInstruction(userState) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    console.warn("[ai] Gemini API key appears unset (value=", GEMINI_API_KEY, ")");
  }

  const level = getInterventionLevel(userState);
  const prompt = buildPrompt(userState, level);
  console.log("[ai] calling Gemini model=", GEMINI_MODEL, "endpoint=", GEMINI_ENDPOINT);
  console.log("[ai] prompt=", prompt);

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Gemini proxy error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.text?.trim();

    if (!text) throw new Error("Empty response from Gemini");

    return text;
  } catch (err) {
    console.error("[ai] Failed to get Gemini instruction:", err);
    return _fallbackInstruction(userState);
  }
}

function _fallbackInstruction(userState) {
  const level = getInterventionLevel(userState);
  const fallbacks = {
    1: "You're doing well. Let's breathe together — slowly inhale for four counts, and gently exhale for four counts. You've got this.",
    2: "You are safe right now. Look around and notice five things you can see, then four things you can touch. Let's bring you back to this moment.",
    3: "You are safe. This feeling will pass — it always does. Take one slow breath with me now, in through the nose, and out through the mouth.",
  };
  return fallbacks[level];
}
