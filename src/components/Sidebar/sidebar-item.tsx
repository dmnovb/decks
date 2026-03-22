"use client";

import { GripVertical, Layers, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useDecks } from "@/providers/decks-provider";
import { Badge } from "../ui/badge";
import { truncate } from "lodash";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/deck";

export function isDeckCompleted(deck: Deck): boolean {
  if (!deck.flashcards || deck.flashcards.length === 0) return false;
  return deck.flashcards.every((card: any) => card.difficulty > 4);
}

interface Props {
  title: string;
  id: string;
  description?: string;
  tags?: string[];
  depth?: number;
  onEvent?: (...params: any[]) => void;
}

export function SidebarItem({ onEvent, title, description, tags, id, depth = 0 }: Props) {
  const { selectDeck, selectedDeck, state } = useDecks();
  const deck = state.decks.find((d) => d.id === id);
  const isCompleted = deck ? isDeckCompleted(deck) : false;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "deck", deckId: id },
  });

  const isSelected = selectedDeck?.id === id;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} className={cn("relative group", isDragging && "opacity-30")}>
          <Link href={`/decks/${id}`} onClick={() => selectDeck(id)} className="block">
            <div
              className={cn(
                "flex items-center gap-1.5 py-1.5 rounded-sm text-sm transition-colors duration-100 cursor-pointer",
                "hover:bg-background-2",
                isSelected && "bg-background-2",
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "8px" }}
            >
              {/* Drag handle — only on hover */}
              <span
                {...attributes}
                {...listeners}
                onClick={(e) => e.preventDefault()}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground -ml-1"
              >
                <GripVertical className="w-3 h-3" />
              </span>

              <Layers className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />

              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] leading-tight">{title}</div>
                {description && (
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
                    {truncate(description, { length: 42 })}
                  </div>
                )}
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        +{tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {isCompleted && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
              )}
            </div>
          </Link>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-background-2">
        <ContextMenuItem onSelect={onEvent}>
          <Trash className="w-3.5 h-3.5" /> Delete
        </ContextMenuItem>
        <ContextMenuItem>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
