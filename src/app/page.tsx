"use client";

import { useDecks } from "@/providers/decks-provider";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Flashcard } from "@/generated/prisma";
import { motion } from "motion/react";
import { Plus, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  return <DeckGrid />;
}

function DeckGrid() {
  const { state, isLoading } = useDecks();
  const router = useRouter();
  const { decks } = state;

  const globalStats = useMemo(() => {
    const allCards = decks.flatMap((d) => d.flashcards || []);
    const now = new Date();
    const due = allCards.filter((c) => c.nextReview && new Date(c.nextReview) <= now).length;
    const isNew = allCards.filter((c) => c.totalReviews === 0).length;
    const maxStreak = Math.max(0, ...allCards.map((c) => c.streak));
    return { due, new: isNew, maxStreak, total: allCards.length };
  }, [decks]);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-border">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Your Decks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {decks.length} {decks.length === 1 ? "deck" : "decks"} · {globalStats.total} cards
          </p>
        </div>
        <div className="flex items-center gap-4">
          {globalStats.due > 0 && (
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{globalStats.due}</span> due
            </span>
          )}
          {globalStats.maxStreak > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame size={12} className="text-warning" />
              <span className="text-foreground font-medium">{globalStats.maxStreak}</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-lg bg-background-2 animate-pulse" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onClick={() => router.push(`/decks/${deck.id}`)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

type Deck = ReturnType<typeof useDecks>["state"]["decks"][0];

function DeckCard({ deck, onClick }: { deck: Deck; onClick: () => void }) {
  const cards = deck.flashcards || [];
  const now = new Date();
  const due = cards.filter((c: Flashcard) => c.nextReview && new Date(c.nextReview) <= now).length;
  const newCards = cards.filter((c: Flashcard) => c.totalReviews === 0).length;
  const totalReviews = cards.reduce((s: number, c: Flashcard) => s + c.totalReviews, 0);
  const correct = cards.reduce((s: number, c: Flashcard) => s + c.correctReviews, 0);
  const accuracy = totalReviews > 0 ? Math.round((correct / totalReviews) * 100) : 0;

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className="group flex flex-col text-left rounded-lg bg-background-2 border border-border hover:bg-background-3 hover:border-border transition-colors overflow-hidden"
    >
      {/* Card visual area */}
      <div className="flex-1 p-5 min-h-[100px] flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
            {deck.title}
          </h3>
          {due > 0 && (
            <span className="shrink-0 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">
              {due} due
            </span>
          )}
        </div>

        {/* Difficulty distribution dots */}
        {cards.length > 0 && (
          <div className="flex gap-0.5 mt-3">
            {cards.slice(0, 20).map((c: Flashcard, i: number) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${c.difficulty >= 4
                    ? "bg-success/60"
                    : c.difficulty >= 2
                      ? "bg-muted-foreground/40"
                      : "bg-destructive/50"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{cards.length} cards</span>
          {newCards > 0 && <span>{newCards} new</span>}
        </div>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={accuracy} className="w-12 h-1" />
            <span className="text-[10px] text-muted-foreground">{accuracy}%</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-lg bg-background-2 border border-border flex items-center justify-center">
        <Plus size={20} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No decks yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first deck to get started</p>
      </div>
    </div>
  );
}
