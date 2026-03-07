export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, stressLevel = 0.5 } = req.body;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "pHDas0XaKmHDkNMCKsnc";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: stressLevel > 0.7 ? 0.75 : 0.65,
            similarity_boost: 0.85,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(errText);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}