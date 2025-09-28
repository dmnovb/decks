import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useDeleteCard = () => {
    const { dispatch } = useDecks();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const handleDelete = useCallback(async (flashcardId: string, deckId: string) => {
        setIsLoading(true);
        try {
            await fetch("/api/flashcards", {
                method: "DELETE",
                body: JSON.stringify({ id: flashcardId, deckId }),
            });

            dispatch({ type: "DELETE_FLASHCARD", flashcardId, deckId });

            toast.success('Card deleted.')
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { handleDelete, isLoading, error };
};

export default useDeleteCard;
