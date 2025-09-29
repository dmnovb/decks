"use client";

import View from "@/components/view";

import { useDecks } from "@/providers/decks-provider";
import { useParams } from "next/navigation";
import { FlashcardsView, Title, FlashCard } from "@/components/Flashcards";
import { useState } from "react";
import { Flashcard as FlashCardType } from "@/generated/prisma";

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
        <div className="flex gap-4 flex-wrap">
          {currentDeck?.flashcards?.map((card: FlashCardType) => <FlashCard key={card.id} card={card} />)}
        </div>
      )}
    </View>
  );
};

export default Dashboard;