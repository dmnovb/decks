"use client";

import { Flashcard } from "@/generated/prisma";
import { useTouchDevice } from "@/hooks/use-touch-device";
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

  if (isTouch) {
    return <TouchSessionCard {...props} />;
  }

  return <DesktopSessionCard {...props} />;
}
