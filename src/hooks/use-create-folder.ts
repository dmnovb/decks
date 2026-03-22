import { useFolders } from "@/providers/folders-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface Param {
  title: string;
  description?: string;
  parentId?: string | null;
}

const useCreateFolder = () => {
  const { dispatch } = useFolders();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleCreate = useCallback(async ({ title, description, parentId }: Param) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, parentId }),
      });

      const folder = await res.json();
      dispatch({ type: "ADD_FOLDER", folder });

      toast.success("Folder created.");
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return { handleCreate, isLoading, error };
};

export default useCreateFolder;
