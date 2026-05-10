import { useDecks } from "@/providers/decks-provider";
import { useFolders } from "@/providers/folders-provider";
import { useMemo } from "react";

function useGetHome() {
    const { state, isLoading: decksLoading } = useDecks();
    const { state: foldersState, isLoading: foldersLoading } = useFolders();

    const { decks } = state;
    const { folders } = foldersState;

    const globalStats = useMemo(() => {
        const allCards = decks.flatMap((d) => d.flashcards || []);
        const now = new Date();
        const due = allCards.filter(
            (c) => c.nextReview && new Date(c.nextReview) <= now,
        ).length;
        const isNew = allCards.filter((c) => c.totalReviews === 0).length;
        const maxStreak = Math.max(0, ...allCards.map((c) => c.streak));
        return { due, new: isNew, maxStreak, total: allCards.length };
    }, [decks]);

    const deckCount = useMemo(() => decks.length, [decks]);
    const folderCount = useMemo(() => folders.length, [folders]);
    const cardCount = useMemo(() => globalStats.total, [globalStats]);

    const deckText = useMemo(() => deckCount === 1 ? "deck" : "decks", [deckCount]);
    const folderText = useMemo(() => folderCount === 1 ? "folder" : "folders", [folderCount]);
    const cardText = useMemo(() => cardCount === 1 ? "card" : "cards", [cardCount]);

    return {
        deckCount,
        folderCount,
        cardCount,
        deckText,
        folderText,
        cardText,
        decksLoading,
        foldersLoading,
    };
}

export default useGetHome;