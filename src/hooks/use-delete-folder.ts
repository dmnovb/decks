import { useFolders } from "@/providers/folders-provider";
import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useDeleteFolder = () => {
  const { dispatch } = useFolders();
  const { refreshDecks } = useDecks();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleDelete = useCallback(
    async (id: string, mode: "cascade" | "orphan" = "orphan") => {
      setIsLoading(true);
      try {
        await fetch("/api/folders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, mode }),
        });

        dispatch({ type: "DELETE_FOLDER", id });

        // Refresh decks since folderId may have changed (orphan) or decks may be deleted (cascade)
        await refreshDecks();

        toast.success("Folder deleted.");
      } catch (err) {
        setError(err);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, refreshDecks],
  );

  return { handleDelete, isLoading, error };
};

export default useDeleteFolder;
