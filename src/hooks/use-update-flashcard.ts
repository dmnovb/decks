import { Flashcard } from "@/generated/prisma";
import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UpdateFlashcardParams {
    flashcard: Flashcard;
    quality: number;
}

const useUpdateFlashcard = () => {
    const { dispatch } = useDecks();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const updateFlashcard = useCallback(async ({ flashcard, quality }: UpdateFlashcardParams) => {
        setIsLoading(true);
        setError(null);

        try {
            // Calculate statistics
            const totalReviews = (flashcard.totalReviews || 0) + 1;
            const correctReviews = quality >= 3
                ? (flashcard.correctReviews || 0) + 1
                : (flashcard.correctReviews || 0);
            const streak = quality >= 3
                ? (flashcard.streak || 0) + 1
                : 0;

            // Prepare payload with all updated fields
            const payload = {
                id: flashcard.id,
                deckId: flashcard.deckId,
                difficulty: flashcard.difficulty,
                interval: flashcard.interval,
                repetitions: flashcard.repetitions,
                easeFactor: flashcard.easeFactor,
                lastReviewed: flashcard.lastReviewed,
                nextReview: flashcard.nextReview,
                streak,
                totalReviews,
                correctReviews,
            };

            // Call API to persist changes
            const res = await fetch(`/api/flashcards`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to update flashcard");
            }

            const updatedFlashcard = await res.json();

            // Update Redux state with complete flashcard data
            dispatch({
                type: "UPDATE_FLASHCARD",
                flashcard: {
                    ...flashcard,
                    ...updatedFlashcard,
                    streak,
                    totalReviews,
                    correctReviews,
                },
                deckId: flashcard.deckId
            });

            // Show success feedback
            toast.success("Card saved!", { duration: 1500 });

            // Show streak milestone notifications (every 5)
            if (streak > 0 && streak % 5 === 0) {
                toast.success(`🔥 Streak: ${streak}!`, { duration: 2000 });
            }

            return {
                success: true,
                flashcard: updatedFlashcard,
                streak,
                totalReviews,
                correctReviews,
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
                    onClick: () => updateFlashcard({ flashcard, quality }),
                },
            });

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    return { updateFlashcard, isLoading, error };
};

export default useUpdateFlashcard;
