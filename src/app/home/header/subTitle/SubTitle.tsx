'use client';
import useGetHome from "./hooks/useGetHome";

function Subtitle() {
    const { deckCount, folderCount, cardCount, deckText, folderText, cardText } = useGetHome();

    return (
        <span className="text-xs text-muted-foreground">
            {deckCount} {deckText} {folderCount > 0 ? `· ${folderCount} ${folderText}` : ""} {cardCount > 0 ? `· ${cardCount} ${cardText}` : ""}
        </span>
    );
}

export default Subtitle;