"use client";

import { useDecks } from "@/providers/decks-provider";
import { useFolders } from "@/providers/folders-provider";
import { useRouter } from "next/navigation";
import { useMemo, useState, FormEvent } from "react";
import { Flashcard } from "@/generated/prisma";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Flame,
  ChevronRight,
  FolderIcon,
  FolderOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Drawer } from "vaul";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useCreateFolder from "@/hooks/use-create-folder";
import { Folder } from "@/types/deck";

export default function Home() {
  return <DeckGrid />;
}

// ── Types ──────────────────────────────────────────────────────────────────

type Deck = ReturnType<typeof useDecks>["state"]["decks"][0];

// ── Folder section ─────────────────────────────────────────────────────────

function FolderSection({
  folder,
  decks,
  isExpanded,
  onToggle,
  onDeckClick,
}: {
  folder: Folder;
  decks: Deck[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeckClick: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors text-sm",
          isExpanded
            ? "bg-background-2 border-border text-foreground"
            : "bg-background-2/50 border-border/50 text-muted-foreground hover:bg-background-2 hover:text-foreground",
        )}
      >
        <motion.span
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
        >
          <ChevronRight size={13} className="text-muted-foreground/50" />
        </motion.span>
        <span className="shrink-0 text-muted-foreground/70">
          {isExpanded ? <FolderOpen size={13} /> : <FolderIcon size={13} />}
        </span>
        <span className="flex-1 font-medium text-left truncate">{folder.title}</span>
        <span className="text-[11px] text-muted-foreground/40 tabular-nums shrink-0">
          {decks.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            {decks.length === 0 ? (
              <p className="px-4 py-4 text-xs text-muted-foreground/50">
                No decks in this folder
              </p>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-3 pl-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {decks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    onClick={() => onDeckClick(deck.id!)}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main grid ──────────────────────────────────────────────────────────────

function DeckGrid() {
  const { state, isLoading: decksLoading, createDeck } = useDecks();
  const { state: foldersState, isLoading: foldersLoading } = useFolders();
  const { handleCreate: handleCreateFolder } = useCreateFolder();
  const router = useRouter();

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

  // Create drawer (mobile FAB)
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<"deck" | "folder">("deck");

  // Deck form
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [creatingDeck, setCreatingDeck] = useState(false);

  // Folder form
  const [folderTitle, setFolderTitle] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const rootFolders = useMemo(() => folders.filter((f) => !f.parentId), [folders]);
  const rootDecks = useMemo(() => decks.filter((d) => !d.folderId), [decks]);
  const isLoading = decksLoading || foldersLoading;

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (type: "deck" | "folder") => {
    setCreateType(type);
    setCreateOpen(true);
  };

  const handleCreateDeck = async (e: FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim()) return;
    setCreatingDeck(true);
    const deck = await createDeck(deckTitle.trim(), deckDescription.trim() || undefined);
    setCreatingDeck(false);
    setCreateOpen(false);
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
    setCreateOpen(false);
    setFolderTitle("");
    setFolderDescription("");
  };

  const isEmpty = !isLoading && decks.length === 0 && folders.length === 0;

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-lg bg-background-2 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState onCreateDeck={() => openCreate("deck")} />
        ) : (
          <div className="space-y-6">
            {rootDecks.length > 0 && (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {rootDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    onClick={() => router.push(`/decks/${deck.id}`)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile FAB ──────────────────────────────────────────────────── */}
      <button
        onClick={() => openCreate("deck")}
        className={cn(
          "fixed right-4 z-30 md:hidden",
          "w-12 h-12 rounded-full bg-foreground text-background shadow-lg",
          "flex items-center justify-center active:scale-95 transition-transform",
        )}
        style={{
          bottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>

      {/* ── Create drawer (triggered by FAB — mobile only) ──────────────── */}
      <Drawer.Root
        open={createOpen}
        onOpenChange={setCreateOpen}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 inset-x-0 z-50 flex flex-col outline-none"
            style={{ maxHeight: "88dvh" }}
          >
            <div
              className="flex flex-col overflow-hidden rounded-t-[24px] bg-background border-t border-x border-border/40"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-[3px] rounded-full bg-muted-foreground/20" />
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto overscroll-contain px-5 pb-3">
                <Drawer.Title className="text-sm font-semibold text-foreground pt-2 pb-5">
                  Create new
                </Drawer.Title>

                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-1.5 mb-5 p-1 bg-background-2 rounded-xl border border-border/50">
                  {(["deck", "folder"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCreateType(type)}
                      className={cn(
                        "py-2 text-sm font-medium rounded-lg transition-colors capitalize",
                        createType === type
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Deck form */}
                {createType === "deck" && (
                  <form onSubmit={handleCreateDeck} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">Title</Label>
                      <Input
                        placeholder="e.g. Spanish Basics"
                        value={deckTitle}
                        onChange={(e) => setDeckTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">
                        Description <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                      </Label>
                      <Input
                        placeholder="What's this deck for?"
                        value={deckDescription}
                        onChange={(e) => setDeckDescription(e.target.value)}
                      />
                    </div>
                    <div
                      className="pt-2 pb-3"
                      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                    >
                      <Button
                        type="submit"
                        disabled={!deckTitle.trim() || creatingDeck}
                        className="w-full h-12 rounded-xl font-semibold"
                      >
                        {creatingDeck ? "Creating…" : "Create deck"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Folder form */}
                {createType === "folder" && (
                  <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">Name</Label>
                      <Input
                        placeholder="e.g. Japanese"
                        value={folderTitle}
                        onChange={(e) => setFolderTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">
                        Description <span className="normal-case font-normal text-muted-foreground/50">(optional)</span>
                      </Label>
                      <Input
                        placeholder="What's in this folder?"
                        value={folderDescription}
                        onChange={(e) => setFolderDescription(e.target.value)}
                      />
                    </div>
                    <div
                      className="pt-2"
                      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                    >
                      <Button
                        type="submit"
                        disabled={!folderTitle.trim() || creatingFolder}
                        className="w-full h-12 rounded-xl font-semibold"
                      >
                        {creatingFolder ? "Creating…" : "Create folder"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

// ── Deck card ──────────────────────────────────────────────────────────────

function DeckCard({ deck, onClick }: { deck: Deck; onClick: () => void }) {
  const cards = deck.flashcards || [];
  const now = new Date();
  const due = cards.filter(
    (c: Flashcard) => c.nextReview && new Date(c.nextReview) <= now,
  ).length;
  const newCards = cards.filter((c: Flashcard) => c.totalReviews === 0).length;
  const totalReviews = cards.reduce(
    (s: number, c: Flashcard) => s + c.totalReviews,
    0,
  );
  const correct = cards.reduce(
    (s: number, c: Flashcard) => s + c.correctReviews,
    0,
  );
  const accuracy = totalReviews > 0 ? Math.round((correct / totalReviews) * 100) : 0;

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className="group flex flex-col text-left rounded-lg bg-background-2 border border-border hover:bg-background-3 hover:border-border transition-colors overflow-hidden"
    >
      <div className="flex-1 p-5 min-h-[100px] flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
            {deck.title}
          </h3>
          {due > 0 && (
            <span className="shrink-0 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-sm">
              {due} due
            </span>
          )}
        </div>
        {cards.length > 0 && (
          <div className="flex gap-0.5 mt-3">
            {cards.slice(0, 20).map((c: Flashcard, i: number) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${c.difficulty >= 4
                  ? "bg-success/60"
                  : c.difficulty >= 2
                    ? "bg-muted-foreground/40"
                    : "bg-destructive/50"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{cards.length} cards</span>
          {newCards > 0 && <span>{newCards} new</span>}
        </div>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={accuracy} className="w-12 h-1" />
            <span className="text-[10px] text-muted-foreground">{accuracy}%</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-lg bg-background-2 border border-border flex items-center justify-center">
        <Plus size={20} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">No decks yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create your first deck to get started
        </p>
      </div>
      <button
        onClick={onCreateDeck}
        className="text-xs text-foreground underline underline-offset-2"
      >
        Create deck
      </button>
    </div>
  );
}
