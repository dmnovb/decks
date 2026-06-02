export const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

export function getElevenLabsApiKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  return apiKey;
}

export function getElevenLabsTextToSpeechStreamUrl(voiceId: string) {
  return `${ELEVENLABS_API_BASE_URL}/text-to-speech/${encodeURIComponent(
    voiceId,
  )}/stream?output_format=mp3_44100_128`;
}
