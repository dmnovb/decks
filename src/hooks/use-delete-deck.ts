import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useDeleteDeck = () => {
  const { dispatch } = useDecks();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleDelete = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await fetch("/api/decks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete deck");
      });

      dispatch({ type: "DELETE", id });

      toast.success("Deck deleted.");
    } catch (error) {
      setError(error);
      toast.error("Failed to delete deck.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { handleDelete, isLoading, error };
};

export default useDeleteDeck;
