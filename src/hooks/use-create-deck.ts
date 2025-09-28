import { useDecks } from "@/providers/decks-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface Param {
  title: string;
  description: string;
}

const useCreateDeck = () => {
  const { dispatch } = useDecks();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleCreate = useCallback(async ({ title, description }: Param) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      dispatch({ type: "ADD", deck: await res.json() });

      toast.success('Deck created.')
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { handleCreate, isLoading, error };
};

export default useCreateDeck;
