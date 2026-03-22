import { useDecks } from "@/providers/decks-provider";
import { Deck } from "@/types/deck";
import { useCallback } from "react";
import { toast } from "sonner";

const useUpdateDeck = () => {
  const { dispatch } = useDecks();

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Pick<Deck, "title" | "description">>) => {
      try {
        const res = await fetch("/api/decks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, ...data }),
        });

        if (!res.ok) throw new Error("Failed to update deck");

        const updated: Deck = await res.json();
        dispatch({ type: "UPDATE", deck: updated });
      } catch (err) {
        toast.error("Failed to update deck.");
        console.error(err);
      }
    },
    [dispatch],
  );

  return { handleUpdate };
};

export default useUpdateDeck;
