"use client";

import { Flashcard } from "@/generated/prisma";
import { useTouchDevice } from "@/hooks/use-touch-device";
import { useTtsPlayback } from "@/hooks/use-tts-playback";
import { useEffect } from "react";
import { DesktopSessionCard } from "./desktop-session-card";
import { TouchSessionCard } from "./touch-session-card";

interface SessionCardProps {
  card: Flashcard;
  showBack: boolean;
  onFlip: () => void;
  onRate: (quality: number) => void;
  isLoading: boolean;
}

export function SessionCard(props: SessionCardProps) {
  const isTouch = useTouchDevice();
  const ttsPlayback = useTtsPlayback();
  const { stop } = ttsPlayback;

  useEffect(() => {
    stop();
  }, [props.card.id, stop]);

  if (isTouch) {
    return <TouchSessionCard {...props} ttsPlayback={ttsPlayback} />;
  }

  return <DesktopSessionCard {...props} ttsPlayback={ttsPlayback} />;
}
