"use client";

import { Flashcard as FlashCardType } from "@/generated/prisma";
import { Separator } from "../ui/separator";
import useDeleteCard from "@/hooks/use-delete-flashcard";
import { useState } from "react";
import { Drawer } from "vaul";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import {
  BarChart3,
  Calendar,
  Check,
  Copy,
  Pause,
  Play,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Label } from "../ui/label";
import DifficultyBadge from "../difficulty-badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-150",
        copied
          ? "text-success bg-success/10"
          : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-background-2",
      )}
    >
      {copied ? (
        <><Check size={10} /><span>Copied</span></>
      ) : (
        <><Copy size={10} /><span>Copy</span></>
      )}
    </button>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="p-3 bg-background-1 border border-divider-1 rounded-md space-y-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={11} strokeWidth={1.75} />
        <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

// ── FlashCard tile ─────────────────────────────────────────────────────────

export function FlashCard({ card }: { card: FlashCardType }) {
  return (
    <FlashCardDrawer card={card}>
      <div className="hover:cursor-pointer group transition-all w-full flex flex-col bg-background-1 border border-divider-1 hover:border-divider-2 rounded-sm overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <DifficultyBadge difficulty={card.difficulty} />
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {card.totalReviews}×
          </span>
        </div>

        <Separator />

        {/* Front text */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 text-center">
          <span className="text-sm text-foreground leading-relaxed">{card.front}</span>
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">
            {card.nextReview ? `due ${new Date(card.nextReview).toLocaleDateString()}` : "not studied"}
          </span>
          <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            view →
          </span>
        </div>
      </div>
    </FlashCardDrawer>
  );
}

// ── Shared card content (used by both Sheet and Drawer) ───────────────────

function CardContent({
  card,
  isEditing,
  editedCard,
  isPlayingAudio,
  setIsPlayingAudio,
  setEditedCard,
  accuracyRate,
}: {
  card: FlashCardType;
  isEditing: boolean;
  editedCard: FlashCardType | null;
  isPlayingAudio: boolean;
  setIsPlayingAudio: (v: boolean) => void;
  setEditedCard: (fn: (prev: FlashCardType | null) => FlashCardType | null) => void;
  accuracyRate: number;
}) {
  const currentCard = editedCard || card;
  return (
    <>
      {/* Front */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Front</Label>
          {!isEditing && <CopyButton text={currentCard.front} />}
        </div>
        {isEditing ? (
          <textarea
            value={editedCard?.front ?? ""}
            onChange={(e) => setEditedCard((prev) => prev ? { ...prev, front: e.target.value } : prev)}
            rows={3}
            className="w-full px-3 py-2 bg-background-1 border border-divider-1 rounded-md resize-none text-sm outline-none focus:border-divider-2 transition-colors"
          />
        ) : (
          <div className="p-4 bg-background-1 border border-divider-1 rounded-md">
            <p className="text-sm leading-relaxed">{currentCard.front}</p>
          </div>
        )}
      </div>

      {/* Back */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Back</Label>
          {!isEditing && <CopyButton text={currentCard.back} />}
        </div>
        {isEditing ? (
          <textarea
            value={editedCard?.back ?? ""}
            onChange={(e) => setEditedCard((prev) => prev ? { ...prev, back: e.target.value } : prev)}
            rows={3}
            className="w-full px-3 py-2 bg-background-1 border border-divider-1 rounded-md resize-none text-sm outline-none focus:border-divider-2 transition-colors"
          />
        ) : (
          <div className="p-4 bg-background-1 border border-divider-1 rounded-md">
            <p className="text-sm leading-relaxed">{currentCard.back}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      {(currentCard.notes || isEditing) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Notes</Label>
            {!isEditing && currentCard.notes && <CopyButton text={currentCard.notes} />}
          </div>
          {isEditing ? (
            <textarea
              value={editedCard?.notes ?? ""}
              onChange={(e) => setEditedCard((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
              placeholder="Add notes to help you remember…"
              rows={2}
              className="w-full px-3 py-2 bg-background-1 border border-divider-1 rounded-md resize-none text-sm outline-none focus:border-divider-2 transition-colors"
            />
          ) : (
            <div className="p-4 bg-background-1 border border-divider-1 rounded-md">
              <p className="text-sm text-muted-foreground leading-relaxed">{currentCard.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Audio */}
      {currentCard.audioUrl && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Audio</Label>
          <Button variant="outline" size="sm" onClick={() => setIsPlayingAudio(!isPlayingAudio)} className="w-full gap-2">
            {isPlayingAudio ? <Pause size={13} /> : <Play size={13} />}
            {isPlayingAudio ? "Pause" : "Play"} Audio
          </Button>
        </div>
      )}

      <Separator />

      {/* Stats */}
      <div className="space-y-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Learning Statistics</p>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={BarChart3} label="Accuracy" value={`${accuracyRate}%`} />
          <StatTile icon={Zap} label="Streak" value={currentCard.streak} sub="correct" />
          <StatTile icon={Target} label="Reviews" value={currentCard.totalReviews} />
        </div>
        {card.totalReviews > 0 && (
          <div className="space-y-1.5 px-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{card.correctReviews} correct</span>
              <span>{card.totalReviews - card.correctReviews} missed</span>
            </div>
            <div className="h-1 bg-background-3 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${accuracyRate}%` }} />
            </div>
          </div>
        )}
        <div className="p-3.5 bg-background-1 border border-divider-1 rounded-md space-y-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar size={11} strokeWidth={1.75} />
            <span className="text-[10px] font-medium uppercase tracking-widest">Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Interval</p>
              <p className="text-sm font-medium tabular-nums">{currentCard.interval} {currentCard.interval === 1 ? "day" : "days"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Next Review</p>
              <p className="text-sm font-medium">
                {currentCard.nextReview ? new Date(currentCard.nextReview).toLocaleDateString() : "Not scheduled"}
              </p>
            </div>
          </div>
          {currentCard.lastReviewed && (
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-divider-1">
              Last reviewed {new Date(currentCard.lastReviewed).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="p-3.5 bg-background-1 border border-divider-1 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp size={11} strokeWidth={1.75} />
              <span className="text-[10px] font-medium uppercase tracking-widest">Ease Factor</span>
            </div>
            <span className="text-sm font-mono font-medium">{currentCard.easeFactor.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Higher ease factor = interval grows faster = easier recall.
          </p>
        </div>
      </div>
    </>
  );
}

// ── FlashCard panel — desktop Sheet / mobile Drawer ───────────────────────

const FlashCardDrawer = ({
  card,
  children,
}: {
  card: FlashCardType;
  children: React.ReactNode;
}) => {
  const isMobile = useIsMobile();
  const { handleDelete } = useDeleteCard();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [editedCard, setEditedCard] = useState<FlashCardType | null>(null);

  if (!card) return null;

  const currentCard = editedCard || card;
  const accuracyRate =
    card.totalReviews > 0 ? Math.round((card.correctReviews / card.totalReviews) * 100) : 0;

  const handleSave = () => { setIsEditing(false); setEditedCard(null); };
  const handleCancel = () => { setIsEditing(false); setEditedCard(null); };
  const startEditing = () => { setEditedCard({ ...card }); setIsEditing(true); };

  const sharedContentProps = { card, isEditing, editedCard, isPlayingAudio, setIsPlayingAudio, setEditedCard, accuracyRate };

  const footerButtons = isEditing ? (
    <>
      <Button variant="ghost" className="flex-1" onClick={handleCancel}>Cancel</Button>
      <Button className="flex-1" onClick={handleSave}>Save changes</Button>
    </>
  ) : (
    <>
      <Button variant="outline" className="flex-1" onClick={startEditing}>Edit</Button>
      <Button variant="destructive" className="flex-1" onClick={() => { handleDelete(card.id, card.deckId); setOpen(false); }}>Delete</Button>
    </>
  );

  // ── Mobile: bottom drawer ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)} className="contents">{children}</div>
        <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <Drawer.Content className="fixed bottom-0 inset-x-0 z-50 flex flex-col outline-none" style={{ maxHeight: "92dvh" }}>
              <div className="flex flex-col overflow-hidden rounded-t-[24px] bg-background border-t border-x border-border/40" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-9 h-[3px] rounded-full bg-muted-foreground/20" />
                </div>
                <div className="px-5 pt-2 pb-4 border-b border-divider-1 shrink-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Flashcard</p>
                  <Drawer.Title className="text-base font-semibold leading-snug line-clamp-2 text-balance">{card.front}</Drawer.Title>
                  <div className="flex items-center gap-2.5 mt-2">
                    <DifficultyBadge difficulty={card.difficulty} />
                    {card.totalReviews > 0 && (
                      <span className="text-xs text-muted-foreground">{accuracyRate}% accuracy · {card.totalReviews} reviews</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5">
                  <CardContent {...sharedContentProps} />
                </div>
                <div className="shrink-0 px-5 py-3 border-t border-divider-1 bg-background" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
                  <div className="flex gap-2">{footerButtons}</div>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    );
  }

  // ── Desktop: side sheet ──────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full flex flex-col sm:max-w-lg overflow-hidden border-l border-divider-1 p-0 h-full">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-divider-1 shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Flashcard</p>
          <SheetTitle className="text-base font-semibold leading-snug line-clamp-2 text-balance pr-6">{card.front}</SheetTitle>
          <div className="flex items-center gap-2.5 mt-2">
            <DifficultyBadge difficulty={card.difficulty} />
            {card.totalReviews > 0 && (
              <span className="text-xs text-muted-foreground">{accuracyRate}% accuracy · {card.totalReviews} reviews</span>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <CardContent {...sharedContentProps} />
        </div>
        <SheetFooter className="px-6 py-4 border-t border-divider-1 shrink-0">
          <div className="flex w-full gap-2">{footerButtons}</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ── FlashCard list row ─────────────────────────────────────────────────────

const difficultyDot: Record<number, string> = {
  0: "bg-destructive",
  1: "bg-destructive",
  2: "bg-amber-400",
  3: "bg-success",
  4: "bg-success",
  5: "bg-success",
};

export function FlashCardRow({ card, index }: { card: FlashCardType; index: number }) {
  const dot =
    card.totalReviews === 0 ? "bg-foreground/20" : difficultyDot[card.difficulty] ?? "bg-foreground/20";

  const dueText = card.nextReview
    ? new Date(card.nextReview).toLocaleDateString("en", { month: "short", day: "numeric" })
    : "–";

  return (
    <FlashCardDrawer card={card}>
      <div className="group flex items-center gap-3 px-4 py-3 hover:bg-background-1 border-b border-divider-1 last:border-b-0 cursor-pointer transition-colors">
        <span className="text-[11px] text-muted-foreground/30 tabular-nums w-6 text-right shrink-0 font-mono">
          {index + 1}
        </span>
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
        <span className="flex-1 text-sm text-foreground truncate leading-none">{card.front}</span>
        <span className="text-xs text-muted-foreground/50 truncate max-w-[220px] hidden md:block leading-none">
          {card.back}
        </span>
        <span className="text-[11px] text-muted-foreground/40 tabular-nums font-mono shrink-0 w-16 text-right">
          {dueText}
        </span>
      </div>
    </FlashCardDrawer>
  );
}

export default FlashCardDrawer;
