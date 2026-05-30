import { Flashcard } from "@/generated/prisma";
import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UpdateFlashcardParams {
  flashcard: Flashcard;
  sessionId: string;
  quality: number;
  timeSpent: number;
}

const useUpdateFlashcard = () => {
  const { dispatch } = useDecks();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const updateFlashcard = useCallback(
    async ({ flashcard, sessionId, quality, timeSpent }: UpdateFlashcardParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/study-sessions/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            flashcardId: flashcard.id,
            quality,
            timeSpent,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update flashcard");
        }

        const { flashcard: updatedFlashcard } = await res.json();

        dispatch({
          type: "UPDATE_FLASHCARD",
          flashcard: updatedFlashcard,
          deckId: flashcard.deckId,
        });

        if (updatedFlashcard.streak > 0 && updatedFlashcard.streak % 5 === 0) {
          toast.success(`Streak: ${updatedFlashcard.streak}!`, { duration: 2000 });
        }

        return {
          success: true,
          flashcard: updatedFlashcard,
          streak: updatedFlashcard.streak,
          totalReviews: updatedFlashcard.totalReviews,
          correctReviews: updatedFlashcard.correctReviews,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save card";
        setError(err);
        console.error("Error updating flashcard:", err);

        // Show error toast with retry option
        toast.error("Failed to save card", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => updateFlashcard({ flashcard, sessionId, quality, timeSpent }),
          },
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  return { updateFlashcard, isLoading, error };
};

export default useUpdateFlashcard;
