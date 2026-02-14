'use client'

import { useState, useEffect, useCallback } from "react";
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
    [flashcards, id, startSession]
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
          <h2 className="text-3xl font-bold">Session Complete! 🎉</h2>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{sessionState.completedCards}</div>
              <div className="text-sm text-muted-foreground">Cards Reviewed</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{Math.round(accuracy)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>
          <div className="pt-8 space-x-3">
            <Button onClick={() => setShowSetup(true)}>Study More</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Deck
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active session
  if (sessionState.isActive && currentCard) {
    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {sessionState.completedCards}/{sessionState.cards.length}
                </span>
                <span className="text-muted-foreground">cards</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{Math.round(accuracy)}%</span>
                <span className="text-muted-foreground">accuracy</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("End study session?")) {
                  endSession();
                }
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Card */}
        <SessionCard
          card={currentCard}
          showBack={sessionState.showBack}
          onFlip={flipCard}
          onRate={rateCard}
          isLoading={isLoading}
        />
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
