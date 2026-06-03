"use client";

import View from "@/components/view";

import { useDecks } from "@/providers/decks-provider";
import { useParams } from "next/navigation";
import { FlashcardsView, Title, FlashCard, FlashCardRow } from "@/components/Flashcards";
import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { Flashcard as FlashCardType } from "@/generated/prisma";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookOpen, Folder, Plus } from "lucide-react";
import useCreateFlashcard from "@/hooks/use-create-flashcard";
import { useIris } from "@/hooks/use-iris";
import type { IrisConfig } from "@/hooks/use-iris";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { irisInputClass, irisLabelClass, irisPrimaryButtonClass } from "@/lib/iris-styles";

export type Mode = "study" | "normal";
export type ViewMode = "grid" | "list";

const Dashboard = () => {
  const { state, isLoading } = useDecks();
  const { id } = useParams<{ id: string }>();
  const { handleCreate, isLoading: isCreatingCard } = useCreateFlashcard();

  const [mode, setMode] = useState<Mode>("normal");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cardValues, setCardValues] = useState({ front: "", back: "", notes: "" });

  const currentDeck = state.decks.find((deck) => deck.id === id);
  const flashcards = currentDeck?.flashcards ?? [];
  const currentDeckId = currentDeck?.id ?? "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "study") setMode("study");
  }, [id]);

  const handleCreateCard = useCallback(
    async (event: FormEvent<HTMLFormElement>, close: () => void) => {
      event.preventDefault();
      if (!currentDeckId || !cardValues.front.trim() || !cardValues.back.trim()) return;

      await handleCreate({
        ...cardValues,
        front: cardValues.front.trim(),
        back: cardValues.back.trim(),
        notes: cardValues.notes.trim() || null,
        deckId: currentDeckId,
      } as unknown as FlashCardType);

      setCardValues({ front: "", back: "", notes: "" });
      close();
    },
    [cardValues, currentDeckId, handleCreate],
  );

  const irisConfig = useMemo<IrisConfig>(
    () => ({
      title: "New flashcard",
      label: "Add flashcard",
      icon: Plus,
      disabled: !currentDeckId,
      content: ({ close }) => (
        <form onSubmit={(event) => handleCreateCard(event, close)} className="space-y-4">
          <div className="space-y-2">
            <Label className={irisLabelClass}>Front</Label>
            <Input
              className={irisInputClass}
              placeholder="Question..."
              value={cardValues.front}
              onChange={(event) =>
                setCardValues((current) => ({ ...current, front: event.target.value }))
              }
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className={irisLabelClass}>Back</Label>
            <Input
              className={irisInputClass}
              placeholder="Answer..."
              value={cardValues.back}
              onChange={(event) =>
                setCardValues((current) => ({ ...current, back: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label className={irisLabelClass}>Notes</Label>
            <Input
              className={irisInputClass}
              placeholder="Extra context"
              value={cardValues.notes}
              onChange={(event) =>
                setCardValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
          <Button
            type="submit"
            disabled={isCreatingCard || !cardValues.front.trim() || !cardValues.back.trim()}
            className={irisPrimaryButtonClass}
          >
            {isCreatingCard ? "Creating..." : "Create card"}
          </Button>
        </form>
      ),
    }),
    [cardValues, currentDeckId, handleCreateCard, isCreatingCard],
  );

  useIris(irisConfig);

  const title = (
    <Title
      mode={mode}
      onModeChange={setMode}
      title={currentDeck?.title ?? "Deck"}
      deckId={currentDeckId}
      amount={flashcards.length}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  );

  return (
    <View title={title} subTitle={currentDeck?.description} isLoading={isLoading}>
      {mode === "normal" && (
        <div className="mb-4 md:hidden">
          <Button
            onClick={() => setMode("study")}
            disabled={flashcards.length === 0}
            className="h-12 w-full justify-between rounded-xl px-4"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              Study
            </span>
            <span className="font-mono text-xs text-background/65 tabular-nums">
              {flashcards.length === 0 ? "No cards" : `${flashcards.length} cards`}
            </span>
          </Button>
        </div>
      )}
      {mode === "study" && <FlashcardsView />}
      {mode === "normal" && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((card: FlashCardType) => (
            <FlashCard key={card.id} card={card} />
          ))}
        </div>
      )}
      {mode === "normal" && viewMode === "list" && (
        <div className="border border-divider-1 rounded-md overflow-hidden">
          {flashcards.map((card: FlashCardType, i: number) => (
            <FlashCardRow key={card.id} card={card} index={i} />
          ))}
        </div>
      )}
      {mode === "normal" && flashcards.length === 0 && <EmptyView />}
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
      <p className="text-xs text-muted-foreground">Add the first card when you are ready.</p>
    </EmptyContent>
  </Empty>
);
