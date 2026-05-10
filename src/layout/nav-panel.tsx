"use client";

import Link from "next/link";
import { useDecks } from "@/providers/decks-provider";
import { useFolders } from "@/providers/folders-provider";
import { useAuth } from "@/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
  ChevronRight,
  Pencil,
  Trash,
  FolderIcon,
  FolderOpen,
  FolderPlus,
  Plus,
  X,
  Home,
  MessageSquare,
  BarChart2,
  MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import useDeleteDeck from "@/hooks/use-delete-deck";
import useCreateFolder from "@/hooks/use-create-folder";
import useDeleteFolder from "@/hooks/use-delete-folder";
import useMoveDeck from "@/hooks/use-move-deck";
import useUpdateDeck from "@/hooks/use-update-deck";
import useUpdateFolder from "@/hooks/use-update-folder";
import { Folder, Deck } from "@/types/deck";
import { FolderDeleteDialog } from "@/components/Sidebar/folder-delete-dialog";

// ── Deck row ─────────────────────────────────────────────────────────────────

function DeckRow({
  deck,
  depth = 0,
  onDelete,
  onEdit,
}: {
  deck: Deck;
  depth?: number;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === `/decks/${deck.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deck.id!,
    data: { type: "deck", deckId: deck.id },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={cn(
            "flex items-center justify-between mx-2 px-2 py-1.5 rounded-md text-sm transition-colors duration-150 group cursor-pointer select-none",
            isDragging && "opacity-30",
            isActive
              ? "bg-background-2 text-foreground"
              : "text-muted-foreground hover:bg-background-2/60 hover:text-foreground",
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => !isDragging && router.push(`/decks/${deck.id}`)}
        >
          <span className="truncate">{deck.title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "shrink-0 flex items-center justify-center w-5 h-5 rounded transition-opacity",
                  "md:opacity-0 md:group-hover:opacity-60 hover:opacity-100",
                  isActive ? "opacity-60" : "opacity-60 md:opacity-0",
                )}
              >
                <MoreHorizontal size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="bg-background-2 border-border w-32"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={onEdit} className="cursor-pointer gap-2 text-xs">
                <Pencil size={12} className="text-muted-foreground" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-red-400 focus:text-red-400 cursor-pointer gap-2 text-xs"
              >
                <Trash size={12} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-background-2 border-border">
        <ContextMenuItem onSelect={onEdit} className="cursor-pointer gap-2">
          <Pencil size={12} className="text-muted-foreground" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={onDelete}
          className="text-red-400 focus:text-red-400 cursor-pointer gap-2"
        >
          <Trash size={12} />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ── Folder row ────────────────────────────────────────────────────────────────

function FolderRow({
  folder,
  allFolders,
  allDecks,
  depth = 0,
  onDeleteFolder,
  onDeleteDeck,
  onEdit,
  onEditDeck,
}: {
  folder: Folder;
  allFolders: Folder[];
  allDecks: Deck[];
  depth?: number;
  onDeleteFolder: (id: string, mode: "cascade" | "orphan") => void;
  onDeleteDeck: (id: string) => void;
  onEdit: (folder: Folder) => void;
  onEditDeck: (deck: Deck) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({
    id: folder.id,
    data: { type: "folder", folderId: folder.id },
  });

  const childFolders = allFolders.filter((f) => f.parentId === folder.id);
  const childDecks = allDecks.filter((d) => d.folderId === folder.id);
  const hasChildren = childFolders.length > 0 || childDecks.length > 0;

  return (
    <>
      <div ref={setNodeRef}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-full flex items-center gap-1.5 mx-2 px-2 py-1.5 rounded-md text-sm transition-colors duration-150 group cursor-pointer",
                "text-muted-foreground hover:bg-background-2/60 hover:text-foreground",
                isOver &&
                  "bg-primary/5 ring-1 ring-inset ring-primary/25 text-foreground",
              )}
              style={{
                paddingLeft: `${depth * 14 + 8}px`,
                width: "calc(100% - 16px)",
              }}
            >
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={cn(
                  "shrink-0",
                  !hasChildren && "opacity-0 pointer-events-none",
                )}
              >
                <ChevronRight size={12} />
              </motion.span>

              <span className="shrink-0">
                {isOpen ? <FolderOpen size={12} /> : <FolderIcon size={12} />}
              </span>

              <span className="truncate flex-1 text-left">{folder.title}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span
                    role="button"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 flex items-center justify-center w-5 h-5 rounded transition-opacity opacity-60 md:opacity-0 md:group-hover:opacity-60 hover:opacity-100"
                  >
                    <MoreHorizontal size={12} />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  className="bg-background-2 border-border w-32"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    onSelect={() => onEdit(folder)}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Pencil size={12} className="text-muted-foreground" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleteDialogOpen(true)}
                    className="text-red-400 focus:text-red-400 cursor-pointer gap-2 text-xs"
                  >
                    <Trash size={12} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          </ContextMenuTrigger>

          <ContextMenuContent className="bg-background-2 border-border">
            <ContextMenuItem
              onSelect={() => onEdit(folder)}
              className="cursor-pointer gap-2"
            >
              <Pencil size={12} className="text-muted-foreground" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => setDeleteDialogOpen(true)}
              className="text-red-400 focus:text-red-400 cursor-pointer gap-2"
            >
              <Trash size={12} />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

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
              <div
                className="border-l border-border/60"
                style={{ marginLeft: `${depth * 14 + 18}px` }}
              >
                {childFolders.map((child) => (
                  <FolderRow
                    key={child.id}
                    folder={child}
                    allFolders={allFolders}
                    allDecks={allDecks}
                    depth={depth + 1}
                    onDeleteFolder={onDeleteFolder}
                    onDeleteDeck={onDeleteDeck}
                    onEdit={onEdit}
                    onEditDeck={onEditDeck}
                  />
                ))}
                {childDecks.map((deck) => (
                  <DeckRow
                    key={deck.id}
                    deck={deck}
                    depth={depth + 1}
                    onDelete={() => onDeleteDeck(deck.id!)}
                    onEdit={() => onEditDeck(deck)}
                  />
                ))}
                {!hasChildren && (
                  <p className="text-[11px] text-muted-foreground px-3 py-1.5">
                    Empty
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
        onDelete={(mode) => {
          onDeleteFolder(folder.id, mode);
          setDeleteDialogOpen(false);
        }}
      />
    </>
  );
}

// ── Root drop zone ────────────────────────────────────────────────────────────

function RootDropZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "root",
    data: { type: "root", folderId: null },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 overflow-y-auto py-2 transition-colors",
        isOver && "bg-primary/5",
      )}
    >
      {children}
    </div>
  );
}

// ── NavPanel ──────────────────────────────────────────────────────────────────

export function NavPanel() {
  const { state: decksState, isLoading: decksLoading, createDeck } = useDecks();
  const { state: foldersState, isLoading: foldersLoading } = useFolders();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { decks } = decksState;
  const { folders } = foldersState;

  const { handleDelete: handleDeleteDeck } = useDeleteDeck();
  const { handleCreate: handleCreateFolder } = useCreateFolder();
  const { handleDelete: handleDeleteFolder } = useDeleteFolder();
  const { handleMove } = useMoveDeck();
  const { handleUpdate: handleUpdateDeck } = useUpdateDeck();
  const { handleUpdate: handleUpdateFolder } = useUpdateFolder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Create deck dialog
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Create folder dialog
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Edit deck dialog
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editDeckTitle, setEditDeckTitle] = useState("");
  const [editDeckDescription, setEditDeckDescription] = useState("");

  // Edit folder dialog
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderTitle, setEditFolderTitle] = useState("");
  const [editFolderDescription, setEditFolderDescription] = useState("");
  const [editFolderTags, setEditFolderTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const openEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setEditDeckTitle(deck.title ?? "");
    setEditDeckDescription(deck.description ?? "");
  };

  const openEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolderTitle(folder.title);
    setEditFolderDescription(folder.description ?? "");
    setEditFolderTags(folder.tags ?? []);
    setTagInput("");
  };

  const handleEditDeckSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDeck || !editDeckTitle.trim()) return;
    await handleUpdateDeck(editingDeck.id!, {
      title: editDeckTitle.trim(),
      description: editDeckDescription.trim() || undefined,
    });
    setEditingDeck(null);
  };

  const handleEditFolderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editFolderTitle.trim()) return;
    await handleUpdateFolder(editingFolder.id, {
      title: editFolderTitle.trim(),
      description: editFolderDescription.trim() || undefined,
      tags: editFolderTags,
    });
    setEditingFolder(null);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !editFolderTags.includes(tag)) {
      setEditFolderTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setEditFolderTags((prev) => prev.filter((t) => t !== tag));
  };

  // DnD
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const activeDeck = activeDeckId
    ? decks.find((d) => d.id === activeDeckId)
    : null;

  const handleCreateDeck = async (e: FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim()) return;
    setCreating(true);
    const deck = await createDeck(
      deckTitle.trim(),
      deckDescription.trim() || undefined,
    );
    setCreating(false);
    setDeckDialogOpen(false);
    setDeckTitle("");
    setDeckDescription("");
    if (deck?.id) router.push(`/decks/${deck.id}`);
  };

  const handleCreateFolderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!folderTitle.trim()) return;
    setCreatingFolder(true);
    await handleCreateFolder({
      title: folderTitle.trim(),
      description: folderDescription.trim() || undefined,
    });
    setCreatingFolder(false);
    setFolderDialogOpen(false);
    setFolderTitle("");
    setFolderDescription("");
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDeckId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeckId(null);
    if (!over) return;
    const deckId = active.id as string;
    const targetFolderId =
      (over.data.current?.folderId as string | null) ?? null;
    const currentDeck = decks.find((d) => d.id === deckId);
    if (currentDeck?.folderId === targetFolderId) return;
    handleMove(deckId, targetFolderId, currentDeck?.folderId ?? null);
  };

  const isLoading = decksLoading || foldersLoading;
  const rootFolders = folders.filter((f) => !f.parentId);
  const rootDecks = decks.filter((d) => !d.folderId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col w-60 shrink-0 h-full bg-background-1 border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs text-white flex h-full items-center flex-1 font-medium tracking-widest uppercase">
            <span className="font-extrabold tracking-tighter">ALCOVE</span>
            {/* <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 12V6H12"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 18H18V12"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="0.5" fill="currentColor" />
            </svg> */}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-6 h-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-background-2 transition-colors"
                title="Create new"
              >
                <Plus size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="bg-background-2 border-border w-36"
            >
              <DropdownMenuItem
                onSelect={() => setDeckDialogOpen(true)}
                className="gap-2 cursor-pointer text-xs"
              >
                New deck
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setFolderDialogOpen(true)}
                className="gap-2 cursor-pointer text-xs"
              >
                <FolderPlus size={12} className="text-muted-foreground" />
                New folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Primary nav */}
        <div className="px-2 pt-1.5 pb-1">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/chat", icon: MessageSquare, label: "Chat" },
            { href: "/stats", icon: BarChart2, label: "Stats" },
          ].map(({ href, icon: Icon, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-150",
                  isActive
                    ? "bg-background-2 text-foreground"
                    : "text-muted-foreground hover:bg-background-2/60 hover:text-foreground",
                )}
              >
                <Icon size={14} strokeWidth={isActive ? 2 : 1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mx-3 h-px bg-border mb-1" />

        {/* Library label */}
        <p className="px-4 pt-1 pb-0.5 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/50">
          Library
        </p>

        {/* Content */}
        <RootDropZone>
          {isLoading && (
            <div className="px-3 space-y-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-background-2 animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && rootFolders.length === 0 && rootDecks.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">No decks yet.</p>
              <button
                onClick={() => setDeckDialogOpen(true)}
                className="text-xs text-foreground hover:underline mt-1 inline-block"
              >
                Create one
              </button>
            </div>
          )}

          {!isLoading && (
            <>
              {rootFolders.map((folder) => (
                <FolderRow
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  allDecks={decks}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteDeck={handleDeleteDeck}
                  onEdit={openEditFolder}
                  onEditDeck={openEditDeck}
                />
              ))}
              {rootDecks.map((deck) => (
                <DeckRow
                  key={deck.id}
                  deck={deck}
                  onDelete={() => handleDeleteDeck(deck.id!)}
                  onEdit={() => openEditDeck(deck)}
                />
              ))}
            </>
          )}
        </RootDropZone>

        {/* Footer */}
        {user && (
          <div className="border-t border-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full focus:outline-none">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-background-2 transition-colors cursor-pointer">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarFallback className="text-[11px] font-semibold bg-background-3 text-foreground">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                    {user.name}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-48 bg-background-2 border-border"
              >
                <DropdownMenuItem
                  onClick={logout}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <LogOut size={12} className="mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Drag ghost */}
      <DragOverlay dropAnimation={null}>
        {activeDeck && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm bg-background-2 border border-border shadow-md opacity-90 w-44">
            <span className="truncate">{activeDeck.title}</span>
          </div>
        )}
      </DragOverlay>

      {/* Create deck dialog */}
      <Dialog open={deckDialogOpen} onOpenChange={setDeckDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New deck</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleCreateDeck}
            className="flex flex-col gap-4 pt-1"
          >
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                autoFocus
                placeholder="e.g. Spanish Basics"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                placeholder="What's this deck for?"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!deckTitle.trim() || creating}>
              {creating ? "Creating…" : "Create deck"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <Separator />
          <form
            onSubmit={handleCreateFolderSubmit}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Japanese"
                value={folderTitle}
                onChange={(e) => setFolderTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                placeholder="What's in this folder?"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFolderDialogOpen(false)}
                disabled={creatingFolder}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!folderTitle.trim() || creatingFolder}
                className="flex-1"
              >
                {creatingFolder ? "Creating…" : "Create folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit deck dialog */}
      <Dialog
        open={!!editingDeck}
        onOpenChange={(open) => !open && setEditingDeck(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename deck</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditDeckSubmit}
            className="flex flex-col gap-4 pt-1"
          >
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                autoFocus
                value={editDeckTitle}
                onChange={(e) => setEditDeckTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                value={editDeckDescription}
                onChange={(e) => setEditDeckDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDeck(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editDeckTitle.trim()}
                className="flex-1"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit folder dialog */}
      <Dialog
        open={!!editingFolder}
        onOpenChange={(open) => !open && setEditingFolder(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit folder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditFolderSubmit}
            className="flex flex-col gap-4 pt-1"
          >
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input
                autoFocus
                value={editFolderTitle}
                onChange={(e) => setEditFolderTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                value={editFolderDescription}
                onChange={(e) => setEditFolderDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {editFolderTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editFolderTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-background-2 border border-border text-muted-foreground"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-foreground transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingFolder(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editFolderTitle.trim()}
                className="flex-1"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
