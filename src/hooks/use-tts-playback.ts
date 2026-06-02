"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const TTS_VOICE_PRESETS = [
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "Default" },
  // Korean-specific Voice Library voices are not available via the ElevenLabs API on free-tier accounts.
  // Keep these disabled until the app has a paid API key or account-specific voice IDs confirmed as available.
  // { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel" },
  // { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella" },
  // { id: "ErXwobaYiN019PkySvjV", label: "Antoni" },
  // { id: "ZJCNdZEjYwkOElxugmW2", label: "Korean" },
] as const;

const TTS_VOICE_STORAGE_KEY = "study-tts-voice-id:v1";
const DEFAULT_VOICE_ID = TTS_VOICE_PRESETS[0].id;

type TtsSide = "front" | "back";

interface PlayTtsParams {
  text: string;
  cardId?: string;
  side: TtsSide;
}

export function useTtsPlayback() {
  const [voiceId, setVoiceIdState] = useState<string>(DEFAULT_VOICE_ID);
  const [activeSide, setActiveSide] = useState<TtsSide | null>(null);
  const activeSideRef = useRef<TtsSide | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const storedVoiceId = window.localStorage.getItem(TTS_VOICE_STORAGE_KEY);
    if (storedVoiceId && TTS_VOICE_PRESETS.some((voice) => voice.id === storedVoiceId)) {
      setVoiceIdState(storedVoiceId);
    }
  }, []);

  const selectedVoice = useMemo(
    () => TTS_VOICE_PRESETS.find((voice) => voice.id === voiceId) ?? TTS_VOICE_PRESETS[0],
    [voiceId],
  );

  const setVoiceId = useCallback((nextVoiceId: string) => {
    setVoiceIdState(nextVoiceId);
    window.localStorage.setItem(TTS_VOICE_STORAGE_KEY, nextVoiceId);
  }, []);

  const setPlaybackSide = useCallback((side: TtsSide | null) => {
    activeSideRef.current = side;
    setActiveSide(side);
  }, []);

  const cleanupAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => cleanupAudio, [cleanupAudio]);

  const stop = useCallback(() => {
    cleanupAudio();
    setPlaybackSide(null);
  }, [cleanupAudio, setPlaybackSide]);

  const play = useCallback(
    async ({ text, cardId, side }: PlayTtsParams) => {
      const trimmedText = text.trim();
      if (!trimmedText || activeSideRef.current) return;

      setPlaybackSide(side);
      cleanupAudio();

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: trimmedText, voiceId, cardId }),
        });

        if (response.status === 402) {
          toast.error("Out of credits", {
            action: {
              label: "Pricing",
              onClick: () => {
                window.location.href = "/pricing";
              },
            },
          });
          setPlaybackSide(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Speech playback failed");
        }

        const audioBlob = await response.blob();
        const objectUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(objectUrl);

        audioRef.current = audio;
        objectUrlRef.current = objectUrl;

        audio.addEventListener("ended", () => {
          cleanupAudio();
          setPlaybackSide(null);
        });
        audio.addEventListener("error", () => {
          cleanupAudio();
          setPlaybackSide(null);
          toast.error("Speech playback failed.");
        });

        await audio.play();
      } catch (error) {
        cleanupAudio();
        setPlaybackSide(null);
        toast.error(error instanceof Error ? error.message : "Speech playback failed");
      }
    },
    [cleanupAudio, setPlaybackSide, voiceId],
  );

  return {
    activeSide,
    isPlaying: activeSide !== null,
    selectedVoice,
    setVoiceId,
    voiceId,
    voicePresets: TTS_VOICE_PRESETS,
    play,
    stop,
  };
}
