"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ELEVENLABS_DEFAULT_VOICE_ID } from "@/lib/elevenlabs-constants";

export const TTS_VOICE_PRESETS = [
  { id: ELEVENLABS_DEFAULT_VOICE_ID, label: "Default" },
  // Korean-specific Voice Library voices are not available via the ElevenLabs API on free-tier accounts.
  // Keep these disabled until the app has a paid API key or account-specific voice IDs confirmed as available.
  // { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel" },
  // { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella" },
  // { id: "ErXwobaYiN019PkySvjV", label: "Antoni" },
  // { id: "ZJCNdZEjYwkOElxugmW2", label: "Korean" },
] as const;

const TTS_VOICE_STORAGE_KEY = "study-tts-voice-id:v1";
const DEFAULT_VOICE_ID = TTS_VOICE_PRESETS[0].id;

export type TtsSide = "front" | "back";

export interface PlayTtsParams {
  text: string;
  cardId?: string;
  side: TtsSide;
}

export interface TtsVoicePreset {
  id: string;
  label: string;
}

export interface TtsPlaybackController {
  activeSide: TtsSide | null;
  setVoiceId: (nextVoiceId: string) => void;
  voiceId: string;
  voicePresets: readonly TtsVoicePreset[];
  play: (params: PlayTtsParams) => Promise<void>;
}

interface UseTtsPlaybackReturn extends TtsPlaybackController {
  isPlaying: boolean;
  selectedVoice: TtsVoicePreset;
  stop: () => void;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useTtsPlayback(): UseTtsPlaybackReturn {
  const [voiceId, setVoiceIdState] = useState<string>(DEFAULT_VOICE_ID);
  const [activeSide, setActiveSide] = useState<TtsSide | null>(null);
  const activeSideRef = useRef<TtsSide | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const playbackRunIdRef = useRef(0);

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
    playbackRunIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cleanupAudio();
    setPlaybackSide(null);
  }, [cleanupAudio, setPlaybackSide]);

  const play = useCallback(
    async ({ text, cardId, side }: PlayTtsParams) => {
      const trimmedText = text.trim();
      if (!trimmedText || activeSideRef.current) return;

      const runId = playbackRunIdRef.current + 1;
      playbackRunIdRef.current = runId;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setPlaybackSide(side);
      cleanupAudio();

      let didReportPlaybackFailure = false;
      const reportPlaybackFailure = (message = "Speech playback failed") => {
        if (didReportPlaybackFailure) return;
        didReportPlaybackFailure = true;
        cleanupAudio();
        setPlaybackSide(null);
        toast.error(message);
      };

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ text: trimmedText, voiceId, cardId }),
          signal: abortController.signal,
        });

        if (
          abortController.signal.aborted ||
          playbackRunIdRef.current !== runId ||
          activeSideRef.current !== side
        ) {
          return;
        }

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
        if (
          abortController.signal.aborted ||
          playbackRunIdRef.current !== runId ||
          activeSideRef.current !== side
        ) {
          return;
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(objectUrl);

        audioRef.current = audio;
        objectUrlRef.current = objectUrl;

        audio.addEventListener("ended", () => {
          cleanupAudio();
          setPlaybackSide(null);
        });
        audio.addEventListener("error", () => {
          reportPlaybackFailure("Speech playback failed.");
        });

        await audio.play();
      } catch (error) {
        if (!isAbortError(error)) {
          reportPlaybackFailure(error instanceof Error ? error.message : "Speech playback failed");
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
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
