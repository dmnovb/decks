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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: flashcardId, deckId }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete card");
      });

      dispatch({ type: "DELETE_FLASHCARD", flashcardId, deckId });

      toast.success("Card deleted.");
    } catch (error) {
      setError(error);
      toast.error("Failed to delete card.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { handleDelete, isLoading, error };
};

export default useDeleteCard;
