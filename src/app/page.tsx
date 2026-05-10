"use client";

import { useDecks } from "@/providers/decks-provider";
import { useFolders } from "@/providers/folders-provider";
import { useRouter } from "next/navigation";
import { useMemo, useState, FormEvent } from "react";
import { Flashcard } from "@/generated/prisma";
import { Deck } from "@/types/deck";
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
import { useIsMobile } from "@/hooks/use-mobile";
import View from "@/components/view";
import { Subtitle } from "@/app/home";

export default function Home() {
  return <DeckGrid />;
}

interface Props {
  folder: Folder;
  decks: Deck[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeckClick: (id: string) => void;
}

function FolderSection({
  folder,
  decks,
  isExpanded,
  onToggle,
  onDeckClick,
}: Props) {
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
  const isMobile = useIsMobile();

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
    <View title="Your Library" subTitle={<Subtitle />}>
      {isLoading ? null : isEmpty ? (
        <EmptyState onCreateDeck={() => openCreate("deck")} />
      ) : (
        <div className="flex flex-col gap-3">
          {rootFolders.map((folder) => {
            const folderDecks = decks.filter((d) => d.folderId === folder.id);
            return (
              <FolderSection
                key={folder.id}
                folder={folder}
                decks={folderDecks}
                isExpanded={expandedFolders.has(folder.id!)}
                onToggle={() => toggleFolder(folder.id!)}
                onDeckClick={(id) => router.push(`/decks/${id}`)}
              />
            );
          })}

          {rootDecks.length > 0 && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
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

      {/* Create drawer */}
      <Drawer.Root open={createOpen} onOpenChange={setCreateOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 bg-background rounded-t-2xl p-6 pb-10 flex flex-col gap-4">
            <div className="mx-auto w-10 h-1 rounded-full bg-border mb-2" />
            <div className="flex gap-2 mb-2">
              <Button
                size="sm"
                variant={createType === "deck" ? "default" : "outline"}
                onClick={() => setCreateType("deck")}
              >
                Deck
              </Button>
              <Button
                size="sm"
                variant={createType === "folder" ? "default" : "outline"}
                onClick={() => setCreateType("folder")}
              >
                Folder
              </Button>
            </div>

            {createType === "deck" ? (
              <form onSubmit={handleCreateDeck} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deck-title">Title</Label>
                  <Input
                    id="deck-title"
                    placeholder="e.g. Spanish Vocabulary"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deck-desc">Description (optional)</Label>
                  <Input
                    id="deck-desc"
                    placeholder="What is this deck about?"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!deckTitle.trim() || creatingDeck}>
                  {creatingDeck ? "Creating…" : "Create Deck"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCreateFolderSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="folder-title">Title</Label>
                  <Input
                    id="folder-title"
                    placeholder="e.g. Languages"
                    value={folderTitle}
                    onChange={(e) => setFolderTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="folder-desc">Description (optional)</Label>
                  <Input
                    id="folder-desc"
                    placeholder="Optional description"
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={!folderTitle.trim() || creatingFolder}>
                  {creatingFolder ? "Creating…" : "Create Folder"}
                </Button>
              </form>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </View>
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
