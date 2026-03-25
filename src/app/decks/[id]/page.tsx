"use client";

import View from "@/components/view";

import { useDecks } from "@/providers/decks-provider";
import { useParams } from "next/navigation";
import { FlashcardsView, Title, FlashCard, FlashCardRow } from "@/components/Flashcards";
import { useState } from "react";
import { Flashcard as FlashCardType } from "@/generated/prisma";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Folder } from "lucide-react";

export type Mode = "study" | "normal";
export type ViewMode = "grid" | "list";

const Dashboard = () => {
  const { state, isLoading } = useDecks();
  const { id } = useParams();

  const [mode, setMode] = useState<Mode>("normal");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const currentDeck = state.decks.find((deck) => deck.id === id);

  const title = (
    <Title
      mode={mode}
      onModeChange={setMode}
      title={currentDeck?.title!}
      deckId={currentDeck?.id!}
      amount={currentDeck?.flashcards?.length}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );

  return (
    <View title={title} subTitle={currentDeck?.description!} isLoading={isLoading}>
      {mode === "study" && <FlashcardsView />}
      {mode === "normal" && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDeck?.flashcards?.map((card: FlashCardType) => (
            <FlashCard key={card.id} card={card} />
          ))}
        </div>
      )}
      {mode === "normal" && viewMode === "list" && (
        <div className="border border-divider-1 rounded-md overflow-hidden">
          {currentDeck?.flashcards?.map((card: FlashCardType, i: number) => (
            <FlashCardRow key={card.id} card={card} index={i} />
          ))}
        </div>
      )}
      {!currentDeck?.flashcards?.length && <EmptyView />}
    </View>
  );
};

export default Dashboard;

const EmptyView = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia className="text-primary bg-primary/10" variant="icon">
        <Folder />
      </EmptyMedia>
      <EmptyTitle>No flashcards yet</EmptyTitle>
      <EmptyDescription>
        You haven&apos;t created any flashcards yet. Get started by creating your first flashcard.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <p className="text-xs text-muted-foreground">Use the + button above to add your first card.</p>
    </EmptyContent>
  </Empty>
);
