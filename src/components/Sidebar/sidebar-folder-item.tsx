"use client";

import { useState } from "react";
import { ChevronRight, FolderIcon, FolderOpen, Pencil, Trash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDroppable } from "@dnd-kit/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { SidebarItem, isDeckCompleted } from "./sidebar-item";
import { FolderDeleteDialog } from "./folder-delete-dialog";
import { Folder, Deck } from "@/types/deck";

function isFolderCompleted(folder: Folder, allFolders: Folder[], allDecks: Deck[]): boolean {
  const childDecks = allDecks.filter((d) => d.folderId === folder.id);
  const childFolders = allFolders.filter((f) => f.parentId === folder.id);
  if (childDecks.length === 0 && childFolders.length === 0) return false;
  return (
    childDecks.every((d) => isDeckCompleted(d)) &&
    childFolders.every((f) => isFolderCompleted(f, allFolders, allDecks))
  );
}
import { cn } from "@/lib/utils";

interface Props {
  folder: Folder;
  allFolders: Folder[];
  allDecks: Deck[];
  depth?: number;
  onDeleteFolder: (id: string, mode: "cascade" | "orphan") => void;
  onDeleteDeck: (id: string) => void;
}

export function SidebarFolderItem({
  folder,
  allFolders,
  allDecks,
  depth = 0,
  onDeleteFolder,
  onDeleteDeck,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: { type: "folder", folderId: folder.id },
  });

  const childFolders = allFolders.filter((f) => f.parentId === folder.id);
  const childDecks = allDecks.filter((d) => d.folderId === folder.id);
  const hasChildren = childFolders.length > 0 || childDecks.length > 0;
  const childCount = childFolders.length + childDecks.length;
  const isCompleted = isFolderCompleted(folder, allFolders, allDecks);

  const handleDelete = (mode: "cascade" | "orphan") => {
    onDeleteFolder(folder.id, mode);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div ref={setNodeRef}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-full flex items-center gap-1.5 py-1.5 rounded-sm text-sm",
                "hover:bg-background-2 transition-colors duration-100 cursor-pointer text-left select-none group",
                isOver && "bg-primary/5 ring-1 ring-inset ring-primary/25",
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "8px" }}
            >
              {/* Expand chevron */}
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={cn(
                  "shrink-0 text-muted-foreground",
                  !hasChildren && "opacity-0 pointer-events-none",
                )}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.span>

              {/* Folder icon */}
              <span className="shrink-0 text-muted-foreground">
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen ? (
                    <motion.span
                      key="open"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="closed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <FolderIcon className="w-3.5 h-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {/* Title */}
              <span className="flex-1 truncate text-[13px] leading-tight font-medium">
                {folder.title}
              </span>

              {isCompleted && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
              )}

              {/* Item count badge — visible on hover */}
              {hasChildren && (
                <span className="text-[11px] text-muted-foreground tabular-nums opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
                  {childCount}
                </span>
              )}
            </button>
          </ContextMenuTrigger>

          <ContextMenuContent className="bg-background-2">
            <ContextMenuItem onSelect={() => setDeleteDialogOpen(true)}>
              <Trash className="w-3.5 h-3.5" /> Delete
            </ContextMenuItem>
            <ContextMenuItem>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Children with AnimatePresence */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              {/* Connector line */}
              <div
                className="relative"
                style={{ borderLeft: "1px solid var(--border)", marginLeft: `${depth * 16 + 14}px` }}
              >
                {childFolders.map((child) => (
                  <SidebarFolderItem
                    key={child.id}
                    folder={child}
                    allFolders={allFolders}
                    allDecks={allDecks}
                    depth={depth + 1}
                    onDeleteFolder={onDeleteFolder}
                    onDeleteDeck={onDeleteDeck}
                  />
                ))}

                {childDecks.map((deck) => (
                  <SidebarItem
                    key={deck.id}
                    id={deck.id!}
                    title={deck.title!}
                    description={deck.description}
                    tags={deck.tags}
                    depth={depth + 1}
                    onEvent={() => onDeleteDeck(deck.id!)}
                  />
                ))}

                {!hasChildren && (
                  <p className="text-[11px] text-muted-foreground px-3 py-1.5 leading-tight">
                    Empty folder
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FolderDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folderTitle={folder.title}
        onDelete={handleDelete}
      />
    </>
  );
}
