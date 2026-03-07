import { GEMINI_API_KEY } from "../config.js";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

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
  const { heartRate, stressLevel } = userState;
  const stressPct   = Math.round(stressLevel * 10);
  const calmLabel   = getCalmDescriptor(stressLevel);

  const levelDescriptions = {
    1: `Generate one short, warm breathing instruction (max 2 sentences).
        Focus on box breathing: breathe in for 4 counts, hold, breathe out for 4 counts.
        Use gentle, reassuring language.`,
    2: `Generate a 5-4-3-2-1 grounding exercise prompt (max 3 sentences).
        Ask the user to notice 5 things they can see, 4 they can touch, etc.
        Keep it concise and grounding.`,
    3: `Generate a short, deeply reassuring verbal stabilization message (max 2 sentences).
        Tell the user they are safe, they will get through this, and guide them toward slower breathing.
        Be warm, human, and calming.`,
  };

  return `You are a compassionate real-time panic intervention assistant.
A user is currently experiencing distress with the following biometrics:
- Heart rate: ${heartRate} BPM
- Calm level: ${calmLabel} (${stressPct}/10 stress)

${levelDescriptions[level]}
Respond ONLY with the instruction text — no titles, no labels, no quotes. Plain calming text only.`;
}

export async function generateCalmingInstruction(userState) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    console.warn("[ai] Gemini API key not set. Using fallback instruction.");
    return _fallbackInstruction(userState);
  }

  const level  = getInterventionLevel(userState);
  const prompt = buildPrompt(userState, level);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

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
