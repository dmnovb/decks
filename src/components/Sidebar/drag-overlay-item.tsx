import { Layers } from "lucide-react";
import { Deck } from "@/types/deck";

interface Props {
  deck: Deck;
}

export function DragOverlayItem({ deck }: Props) {
  return (
    <div className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm text-sm bg-background-2 border border-border shadow-md opacity-90 w-48 pointer-events-none">
      <Layers className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-[13px] leading-tight">{deck.title}</span>
    </div>
  );
}
