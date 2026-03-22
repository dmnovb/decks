import { useDecks } from "@/providers/decks-provider";
import { useCallback } from "react";
import { toast } from "sonner";

const useMoveDeck = () => {
  const { dispatch, refreshDecks } = useDecks();

  const handleMove = useCallback(
    async (id: string, folderId: string | null, previousFolderId: string | null | undefined) => {
      // Optimistic update
      dispatch({ type: "MOVE", id, folderId });

      try {
        const res = await fetch("/api/decks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, folderId }),
        });

        if (!res.ok) throw new Error("Failed to move deck");
      } catch (err) {
        // Revert
        dispatch({ type: "MOVE", id, folderId: previousFolderId ?? null });
        toast.error("Failed to move deck.");
        console.error(err);
      }
    },
    [dispatch],
  );

  return { handleMove };
};

export default useMoveDeck;
