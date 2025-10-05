import { FoldersIcon, Pencil, Trash } from "lucide-react";

import Link from "next/link";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useDecks } from "@/providers/decks-provider";

interface Props {
  title: string;
  id: string;
  description?: string;
  onEvent?: (...params: any[]) => void;
}

export function SidebarItem({ onEvent, title, description, id }: Props) {
  const { selectDeck, selectedDeck } = useDecks();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link href={`/decks/${id}`} onClick={() => selectDeck(id)}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className={`cursor-pointer h-full flex items-center ${selectedDeck?.id === id ? "bg-background-2" : ""}`}>
                <FoldersIcon className="text-primary bg-primary/10 p-2 rounded-sm box-content" />
                <div className="flex flex-col">
                  <span>{title}</span>
                  {description && (
                    <span className="text-[12px] antialiased text-muted">
                      {description}
                    </span>
                  )}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-background-2">
        <ContextMenuItem onSelect={onEvent}>
          <Trash /> Delete
        </ContextMenuItem>
        <ContextMenuItem>
          <Pencil /> Edit
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};