'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  RotateCcw,
  Eye,
  EyeOff,
  Clock,
  Zap,
  Brain,
  Target,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Flashcard } from "@/generated/prisma";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Badge } from "../ui/badge";
import DifficultyBadge from "../difficulty-badge";

// SM-2 difficulty/quality levels (0-5)
const difficultyColors = {
  0: "bg-red-500/20 text-red-400 border-red-500/30",      // Blackout
  1: "bg-orange-500/20 text-orange-400 border-orange-500/30", // Incorrect
  2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", // Incorrect but recalled
  3: "bg-blue-500/20 text-blue-400 border-blue-500/30",    // Correct with difficulty
  4: "bg-green-500/20 text-green-400 border-green-500/30", // Correct with hesitation
  5: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", // Perfect
};

const difficultyLabels = {
  0: "Blackout",
  1: "Incorrect",
  2: "Hard Recall",
  3: "Correct",
  4: "Easy",
  5: "Perfect",
};

const difficultyIcons: Record<number, LucideIcon> = {
  0: RotateCcw,
  1: Target,
  2: Brain,
  3: Zap,
  4: Zap,
  5: Zap,
};

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

export function FlashcardsView() {
  const { id } = useParams();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());

  const {
    data: flashcards = [],
    error,
    isLoading
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

  const handleNextCard = () => {
    setShowBack(false);
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    setShowBack(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleAnswer = (difficulty: "again" | "hard" | "good" | "easy") => {
    setStudiedCards((prev) => new Set([...prev, currentCard.id]));
    // In a real app, this would update the card's scheduling
    handleNextCard();
  };

  const DifficultyIcon = difficultyIcons[currentCard.difficulty];

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
              Due: {currentCard.nextReview?.toLocaleDateString()}
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

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-border/30">
          {/* <div className="flex gap-2">
            {currentCard.tags.map((tag) => (
              <Badge key={tag} className="text-xs">
                {tag}
              </Badge>
            ))}
          </div> */}
          {/* <div className="text-xs text-muted-foreground space-y-1">
            <p>Interval: {currentCard.interval} days</p>
            <p>Ease: {currentCard.easeFactor}</p>
          </div> */}
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
