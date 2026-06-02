export const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";
export const ELEVENLABS_DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
export const ELEVENLABS_TTS_MODEL_ID = "eleven_multilingual_v2";

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
