import { useFolders } from "@/providers/folders-provider";
import { Folder } from "@/types/deck";
import { useCallback } from "react";
import { toast } from "sonner";

const useUpdateFolder = () => {
  const { dispatch } = useFolders();

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Pick<Folder, "title" | "description" | "tags">>) => {
      try {
        const res = await fetch("/api/folders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, ...data }),
        });

        if (!res.ok) throw new Error("Failed to update folder");

        const updated: Folder = await res.json();
        dispatch({ type: "UPDATE_FOLDER", folder: updated });
      } catch (err) {
        toast.error("Failed to update folder.");
        console.error(err);
      }
    },
    [dispatch],
  );

  return { handleUpdate };
};

export default useUpdateFolder;
