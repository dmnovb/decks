import { Flashcard } from "@/generated/prisma";
import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";

const useCreateFlashcard = () => {
    const { dispatch } = useDecks();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const handleCreate = useCallback(async ({ front, back, notes, deckId }: Flashcard) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/flashcards?deckId=${deckId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    front,
                    back,
                    notes,
                    deckId
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create flashcard");
            }

            dispatch({ type: "ADD_FLASHCARD", flashcard: await res.json(), deckId: deckId! });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { handleCreate, isLoading, error };
};

export default useCreateFlashcard;
