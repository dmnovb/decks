import { useDecks } from "@/providers/decks-provider";
import { useFolders } from "@/providers/folders-provider";
import { Flame } from "lucide-react";
import { useMemo } from "react";

function Header() {
    const { state } = useDecks();
    const { state: foldersState } = useFolders();

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

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-border">
                <div>
                    <h1 className="text-sm font-semibold text-foreground">Your Library</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {decks.length} {decks.length === 1 ? "deck" : "decks"}
                        {folders.length > 0 && ` · ${folders.length} ${folders.length === 1 ? "folder" : "folders"}`}
                        {globalStats.total > 0 && ` · ${globalStats.total} cards`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {globalStats.due > 0 && (
                        <span className="text-xs text-muted-foreground">
                            <span className="text-foreground font-medium">{globalStats.due}</span> due
                        </span>
                    )}
                    {globalStats.maxStreak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Flame size={12} className="text-warning" />
                            <span className="text-foreground font-medium">{globalStats.maxStreak}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Header;