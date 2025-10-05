"use client";

import View from "@/components/view";

import { useDecks } from "@/providers/decks-provider";
import { useParams } from "next/navigation";
import { FlashcardsView, Title, FlashCard } from "@/components/Flashcards";
import { useState } from "react";
import { Flashcard as FlashCardType } from "@/generated/prisma";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ArrowUpRightIcon, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Mode = 'study' | 'normal'

const Dashboard = () => {
  const { state, isLoading } = useDecks();
  const { id } = useParams();

  const [mode, setMode] = useState<Mode>('normal')

  const currentDeck = state.decks.find((deck) => deck.id === id);

  const title = (
    <Title
      mode={mode}
      onModeChange={setMode}
      title={currentDeck?.title!}
      deckId={currentDeck?.id!}
      amount={currentDeck?.flashcards?.length}
    />
  )

  return (
    <View title={title} subTitle={currentDeck?.description!} isLoading={isLoading}>
      {mode === 'study' && <FlashcardsView />}
      {mode === 'normal' && (
        <div className="flex gap-4 flex-wrap overflow-scroll">
          {currentDeck?.flashcards?.map((card: FlashCardType) => <FlashCard key={card.id} card={card} />)}
        </div>
      )}
      {!currentDeck?.flashcards?.length && <EmptyView />}
    </View>
  )
}

export default Dashboard

const EmptyView = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia className="text-primary bg-primary/10" variant="icon">
        <Folder />
      </EmptyMedia>
      <EmptyTitle>No flashcards yet</EmptyTitle>
      <EmptyDescription>
        You haven&apos;t created any flashcards yet. Get started by creating
        your first flashcard.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div className="flex gap-2">
        <Button variant="secondary">Create Flashcard</Button>
      </div>
    </EmptyContent>
  </Empty>
)