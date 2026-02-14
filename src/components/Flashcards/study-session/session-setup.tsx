'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Flashcard } from "@/generated/prisma";
import { SessionConfig } from "@/utils/card-filters";
import { isCardDue, isCardNew } from "@/utils/card-filters";

interface SessionSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: SessionConfig) => void;
  allCards: Flashcard[];
}

export function SessionSetup({
  isOpen,
  onClose,
  onStart,
  allCards,
}: SessionSetupProps) {
  const [maxCards, setMaxCards] = useState<number | undefined>(20);
  const [maxNewCards, setMaxNewCards] = useState<number | undefined>(5);
  const [dueOnly, setDueOnly] = useState(true);
  const [shuffled, setShuffled] = useState(false);

  // Calculate preview counts
  const dueCards = allCards.filter(isCardDue);
  const newCards = allCards.filter(isCardNew);
  const reviewCards = allCards.filter(
    (c) => !isCardNew(c) && (dueOnly ? isCardDue(c) : true)
  );

  const estimatedNewCards = Math.min(
    maxNewCards || newCards.length,
    newCards.length
  );
  const estimatedReviewCards = Math.min(
    (maxCards || allCards.length) - estimatedNewCards,
    reviewCards.length
  );
  const estimatedTotal = estimatedNewCards + estimatedReviewCards;

  const handleStart = () => {
    const config: SessionConfig = {
      maxCards,
      maxNewCards,
      dueOnly,
      shuffled,
      sortBy: shuffled ? "random" : "dueDate",
    };
    onStart(config);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Study Session</DialogTitle>
          <DialogDescription>
            Configure your study session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Preview */}
          <Card className="p-4 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total cards:</span>
                <span className="font-medium">{allCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due today:</span>
                <span className="font-medium">{dueCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New cards:</span>
                <span className="font-medium">{newCards.length}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-base">
                <span className="font-medium">Session preview:</span>
                <span className="font-bold text-primary">
                  {estimatedTotal} cards
                </span>
              </div>
              <div className="text-xs text-muted-foreground pl-4">
                {estimatedNewCards} new • {estimatedReviewCards} review
              </div>
            </div>
          </Card>

          {/* Card Limit */}
          <div className="space-y-2">
            <Label htmlFor="max-cards">Maximum cards per session</Label>
            <div className="flex gap-2">
              {[10, 20, 50].map((num) => (
                <Button
                  key={num}
                  variant={maxCards === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMaxCards(num)}
                  className="flex-1"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant={maxCards === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setMaxCards(undefined)}
                className="flex-1"
              >
                All
              </Button>
            </div>
          </div>

          {/* New Cards Limit */}
          <div className="space-y-2">
            <Label htmlFor="max-new-cards">Maximum new cards</Label>
            <div className="flex gap-2">
              {[5, 10, 20].map((num) => (
                <Button
                  key={num}
                  variant={maxNewCards === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMaxNewCards(num)}
                  className="flex-1"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant={maxNewCards === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setMaxNewCards(undefined)}
                className="flex-1"
              >
                All
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="due-only" className="cursor-pointer">
                Due cards only
              </Label>
              <button
                id="due-only"
                type="button"
                role="switch"
                aria-checked={dueOnly}
                onClick={() => setDueOnly(!dueOnly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dueOnly ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dueOnly ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="shuffle" className="cursor-pointer">
                Shuffle cards
              </Label>
              <button
                id="shuffle"
                type="button"
                role="switch"
                aria-checked={shuffled}
                onClick={() => setShuffled(!shuffled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  shuffled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    shuffled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="text-sm text-muted-foreground text-center">
            Estimated time: ~{Math.ceil(estimatedTotal * 0.5)} min
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            className="flex-1"
            disabled={estimatedTotal === 0}
          >
            Start Session ({estimatedTotal} cards)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
