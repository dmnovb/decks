'use client'

import { Flashcard } from "@/generated/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, ThumbsDown, ThumbsUp, Zap } from "lucide-react";

interface SessionCardProps {
  card: Flashcard;
  showBack: boolean;
  onFlip: () => void;
  onRate: (quality: number) => void;
  isLoading: boolean;
}

const difficultyButtons = [
  {
    key: "again",
    label: "Again",
    sublabel: "<1m",
    quality: 0,
    icon: RotateCcw,
    colorClass:
      "bg-rose-500/10 border-rose-400/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/50 hover:text-rose-200",
  },
  {
    key: "hard",
    label: "Hard",
    sublabel: "10m",
    quality: 2,
    icon: ThumbsDown,
    colorClass:
      "bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200",
  },
  {
    key: "good",
    label: "Good",
    sublabel: "4d",
    quality: 4,
    icon: ThumbsUp,
    colorClass:
      "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-200",
  },
  {
    key: "easy",
    label: "Easy",
    sublabel: "10d",
    quality: 5,
    icon: Zap,
    colorClass:
      "bg-sky-500/10 border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400/50 hover:text-sky-200",
  },
];

export function SessionCard({
  card,
  showBack,
  onFlip,
  onRate,
  isLoading,
}: SessionCardProps) {
  return (
    <div className="space-y-6">
      {/* Card Display */}
      <Card className="bg-background-1 border border-divider-1 p-8 min-h-[400px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={showBack ? "back" : "front"}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-center space-y-6 w-full"
          >
            {/* Front */}
            {!showBack && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Question
                </p>
                <h2 className="text-3xl font-semibold text-foreground leading-relaxed">
                  {card.front}
                </h2>
                <Button
                  onClick={onFlip}
                  variant="outline"
                  className="mt-8"
                  disabled={isLoading}
                >
                  Show Answer
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Space)
                  </span>
                </Button>
              </div>
            )}

            {/* Back */}
            {showBack && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Question
                  </p>
                  <h3 className="text-xl font-medium text-foreground/80">
                    {card.front}
                  </h3>
                </div>

                <div className="h-px bg-border/30" />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">
                    Answer
                  </p>
                  <p className="text-2xl text-foreground font-semibold leading-relaxed">
                    {card.back}
                  </p>
                </div>

                {card.notes && (
                  <div className="pt-4 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Rating Buttons (only show when back is visible) */}
      {showBack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          {difficultyButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.key}
                variant="outline"
                onClick={() => onRate(button.quality)}
                disabled={isLoading}
                className={`flex flex-col gap-2 h-auto py-4 ${button.colorClass} disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105`}
              >
                <Icon className="w-5 h-5" />
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium">{button.label}</span>
                  <span className="text-xs opacity-70">{button.sublabel}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {index + 1}
                  </span>
                </div>
              </Button>
            );
          })}
        </motion.div>
      )}

      {/* Keyboard Hints (only show when front is visible) */}
      {!showBack && (
        <div className="text-center text-xs text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to flip
          card, or <kbd className="px-2 py-1 bg-muted rounded">?</kbd> for help
        </div>
      )}
    </div>
  );
}
