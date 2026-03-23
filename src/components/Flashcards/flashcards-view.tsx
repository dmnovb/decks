"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Flashcard } from "@/generated/prisma";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useStudySession } from "@/hooks/use-study-session";
import { SessionSetup } from "./study-session/session-setup";
import { SessionCard } from "./study-session/session-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Clock, Target, TrendingUp } from "lucide-react";
import { SessionConfig } from "@/utils/card-filters";
import { toast } from "sonner";

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FlashcardsView() {
  const { id } = useParams();
  const [showSetup, setShowSetup] = useState(false);

  const {
    data: flashcards = [],
    error,
    isLoading: isLoadingCards,
  } = useSWR<Flashcard[]>(`/api/flashcards?deckId=${id}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  const {
    sessionState,
    currentCard,
    startSession,
    flipCard,
    rateCard,
    endSession,
    isLoading,
    accuracy,
    progress,
    elapsedTime,
  } = useStudySession();

  // Auto-open setup dialog on mount
  useEffect(() => {
    if (flashcards.length > 0 && !sessionState.isActive) {
      setShowSetup(true);
    }
  }, [flashcards.length, sessionState.isActive]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!sessionState.isActive || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (!sessionState.showBack) {
            flipCard();
          }
          break;
        case "1":
          e.preventDefault();
          if (sessionState.showBack) rateCard(0); // Again
          break;
        case "2":
          e.preventDefault();
          if (sessionState.showBack) rateCard(2); // Hard
          break;
        case "3":
        case "Enter":
          e.preventDefault();
          if (sessionState.showBack) rateCard(4); // Good
          break;
        case "4":
          e.preventDefault();
          if (sessionState.showBack) rateCard(5); // Easy
          break;
        case "Escape":
          e.preventDefault();
          if (confirm("End study session?")) {
            endSession();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState, currentCard, flipCard, rateCard, endSession]);

  const handleStartSession = useCallback(
    (config: SessionConfig) => {
      startSession(flashcards, config, id as string);
    },
    [flashcards, id, startSession],
  );

  // Loading state
  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading flashcards</p>
      </div>
    );
  }

  // Empty state
  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground text-sm">
          No flashcards in this deck
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Session completed
  if (sessionState.isCompleted) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <h2 className="text-3xl font-bold">Session Complete!</h2>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">
                {sessionState.completedCards}
              </div>
              <div className="text-sm text-muted-foreground">
                Cards Reviewed
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{Math.round(accuracy)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>
          <div className="pt-8 space-x-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Deck
            </Button>
            <Button onClick={() => setShowSetup(true)}>Study More</Button>
          </div>
        </div>

        <SessionSetup
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onStart={handleStartSession}
          allCards={flashcards}
        />
      </div>
    );
  }

  // Active session
  if (sessionState.isActive && currentCard) {
    return (
      <div className="flex flex-col h-full -m-4 sm:m-0 sm:space-y-6">
        {/* ── Progress header ─────────────────────────────────── */}
        <div className="shrink-0 sm:space-y-4">
          {/* Full-bleed progress bar on mobile */}
          <div className="h-[2px] bg-background-2 sm:hidden overflow-hidden">
            <motion.div
              className="h-full bg-foreground/25 origin-left"
              animate={{ scaleX: progress / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* Desktop-style progress bar */}
          <Progress value={progress} className="h-1.5 hidden sm:block" />

          <div className="flex items-center justify-between px-4 py-2.5 sm:px-0 sm:py-0">
            {/* Compact stats — mobile */}
            <div className="flex items-center gap-2.5 sm:hidden">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {sessionState.completedCards}
                <span className="text-muted-foreground/35 font-normal">
                  /{sessionState.cards.length}
                </span>
              </span>
              <span className="text-muted-foreground/25 text-xs">·</span>
              <span className="font-mono text-xs text-muted-foreground/60 tabular-nums">
                {Math.round(accuracy)}%
              </span>
              {sessionState.currentStreak > 1 && (
                <>
                  <span className="text-muted-foreground/25 text-xs">·</span>
                  <span className="text-xs">🔥 {sessionState.currentStreak}</span>
                </>
              )}
            </div>

            {/* Full stats — desktop */}
            <div className="hidden sm:flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {sessionState.completedCards}/{sessionState.cards.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{Math.round(accuracy)}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{formatTime(elapsedTime)}</span>
              </div>
              {sessionState.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <span>🔥</span>
                  <span className="font-medium">{sessionState.currentStreak}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => { if (confirm("End study session?")) endSession(); }}
              className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground active:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Card — fills remaining height on mobile ────────── */}
        <div className="flex-1 min-h-0 sm:flex-none">
          <SessionCard
            card={currentCard}
            showBack={sessionState.showBack}
            onFlip={flipCard}
            onRate={rateCard}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  // Show setup dialog (default state)
  return (
    <>
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground text-sm">
          Ready to start studying?
        </p>
        <Button onClick={() => setShowSetup(true)}>Configure Session</Button>
      </div>

      <SessionSetup
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onStart={handleStartSession}
        allCards={flashcards}
      />
    </>
  );
}
