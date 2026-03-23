"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Flashcard } from "@/generated/prisma";
import useCreateFlashcard from "@/hooks/use-create-flashcard";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Mode, ViewMode } from "@/app/decks/[id]/page";
import { Badge } from "../ui/badge";
import { LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";

type FlashcardForm = Omit<
  Flashcard,
  | "id"
  | "audioUrl"
  | "deckId"
  | "nextReview"
  | "lastReviewed"
  | "streak"
  | "totalReviews"
  | "correctReviews"
>;

interface TitleProps {
  title: string;
  deckId: string;
  onModeChange: (mode: Mode) => void;
  mode: Mode;
  amount: number;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
}

export function Title({
  amount,
  title,
  deckId,
  onModeChange,
  mode,
  viewMode,
  onViewModeChange,
}: TitleProps) {
  const { handleCreate, isLoading } = useCreateFlashcard();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<keyof FlashcardForm, string | null>>({
    back: "",
    front: "",
    notes: null,
    difficulty: null,
    interval: null,
    repetitions: null,
    easeFactor: null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCreate({ ...values, deckId } as unknown as Flashcard);
    setOpen(false);
    setValues({
      back: "",
      front: "",
      notes: null,
      difficulty: null,
      interval: null,
      repetitions: null,
      easeFactor: null,
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 w-full min-w-0">
      {/* Left — title + count */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate font-semibold text-sm">{title}</span>
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {amount ?? 0}
        </Badge>
      </div>

      {/* Right — controls grouped */}
      <div className="flex items-center gap-2 shrink-0">
        {/* View toggle — only in browse mode */}
        {mode === "normal" && (
          <div className="flex items-center h-8 border border-border rounded-md overflow-hidden bg-background-2">
            <button
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "px-2.5 h-full flex items-center transition-colors",
                viewMode === "grid"
                  ? "bg-background-3 text-foreground"
                  : "text-muted-foreground hover:bg-background-3/50",
              )}
            >
              <LayoutGrid size={13} />
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "px-2.5 h-full flex items-center transition-colors",
                viewMode === "list"
                  ? "bg-background-3 text-foreground"
                  : "text-muted-foreground hover:bg-background-3/50",
              )}
            >
              <List size={13} />
            </button>
          </div>
        )}

        {/* Mode switcher */}
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as Mode)}>
          <TabsList className="h-8 bg-background-2 border border-border p-0.5 gap-0.5">
            <TabsTrigger
              value="normal"
              className="h-7 px-3 text-xs font-medium rounded-sm data-[state=active]:bg-background-3 data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground transition-all"
            >
              <span className="hidden sm:inline">Browse</span>
              <span className="sm:hidden">
                <LayoutGrid size={12} />
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="study"
              className="h-7 px-3 text-xs font-medium rounded-sm data-[state=active]:bg-background-3 data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground transition-all"
            >
              Study
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Create card */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 px-3">
              <Plus size={13} />
              <span className="hidden sm:inline text-xs">New card</span>
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>New flashcard</DialogTitle>
              <DialogDescription>
                Add a card to this deck. Front is the question, back is the answer.
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Front</Label>
                <Input
                  name="front"
                  onChange={handleChange}
                  value={values.front!}
                  placeholder="Question…"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Back</Label>
                <Input
                  name="back"
                  onChange={handleChange}
                  value={values.back!}
                  placeholder="Answer…"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  name="notes"
                  onChange={handleChange}
                  placeholder="Any extra context…"
                  {...(values.notes ? { value: values.notes } : {})}
                />
              </div>

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
