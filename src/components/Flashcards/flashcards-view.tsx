'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { Flashcard } from "@/generated/prisma";
import { useParams } from "next/navigation";
import useSWR from "swr";
import DifficultyBadge from "../difficulty-badge";
import { sm2 } from "@/utils/sm2";
import { useDecks } from "@/providers/decks-provider";

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

const difficultyMap = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export function FlashcardsView() {
  const { id } = useParams();
  const { dispatch, selectedDeck } = useDecks();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());

  const {
    data: flashcards = [],
    error,
    isLoading,
    mutate  // Add mutate here
  } = useSWR<Flashcard[]>(`/api/flashcards?deckId=${id}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60000,
  });

  if (isLoading) return <div>Loading flashcards...</div>;
  if (error) return <div>Error loading flashcards</div>;
  if (!flashcards.length) return <div className="text-muted text-sm">No flashcards in this deck</div>;

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

  const handlePrevCard = () => {
    setShowBack(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleAnswer = (difficulty: "again" | "hard" | "good" | "easy") => {
    setStudiedCards((prev) => new Set([...prev, currentCard.id]));
    handleNextCard(difficultyMap[difficulty]);
  };

  const handleNextCard = (quality: number) => {
    const { interval, repetitions, easeFactor } = sm2(
      quality,
      currentCard.repetitions,
      currentCard.interval,
      currentCard.easeFactor
    );

    const data: Flashcard = {
      ...currentCard,
      difficulty: quality,
      interval,
      repetitions,
      easeFactor,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
    };

    dispatch({
      type: "UPDATE_FLASHCARD",
      flashcard: data,
      deckId: id as string
    });

    setShowBack(false);
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <Card className="bg-background-1 border border-divider-1 p-8">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={currentCard.difficulty} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Due: {new Date(currentCard.nextReview!).toLocaleDateString()}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBack(!showBack)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showBack ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showBack ? "Hide Answer" : "Show Answer"}
          </Button>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Question
              </p>
              <h2 className="text-2xl font-semibold text-foreground leading-relaxed">
                {currentCard.front}
              </h2>
            </div>

            {showBack && (
              <div className="space-y-4 pt-6 border-t border-border/30">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-lg text-foreground leading-relaxed max-w-2xl mx-auto">
                  {currentCard.back}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started</span>
            <span>{Math.round(progress)}% Complete</span>
            <span>Finished</span>
          </div>
        </div>
      </Card>

      {/* Answer Buttons - Main Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Optional Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevCard}
          disabled={currentCardIndex === 0}
          className="sm:w-auto text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {/* Answer Buttons - Primary Navigation */}
        <div className="flex gap-2 flex-1 justify-center sm:justify-end">
          <Button
            variant="outline"
            onClick={() => handleAnswer("again")}
            className="flex-1 sm:flex-none bg-rose-500/10 border-rose-400/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-200"
          >
            Again
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer("hard")}
            className="flex-1 sm:flex-none bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200"
          >
            Hard
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer("good")}
            className="flex-1 sm:flex-none bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-200"
          >
            Good
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAnswer("easy")}
            className="flex-1 sm:flex-none bg-sky-500/10 border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400/50 hover:text-sky-200"
          >
            Easy
          </Button>
        </div>
      </div>
    </div>
  );
}
