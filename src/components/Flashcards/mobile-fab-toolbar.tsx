"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, BookOpen, LayoutGrid, List } from "lucide-react";
import { Mode, ViewMode } from "@/app/decks/[id]/page";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import useCreateFlashcard from "@/hooks/use-create-flashcard";
import { Flashcard } from "@/generated/prisma";

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  deckId: string;
}

const containerVariants = {
  open: { transition: { staggerChildren: 0.055 } },
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 as const } },
};

const pillVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 26 },
  },
  closed: {
    opacity: 0,
    y: 12,
    scale: 0.9,
    transition: { duration: 0.16, ease: [0.32, 0, 1, 1] as const },
  },
};

export function MobileFABToolbar({ mode, onModeChange, viewMode, onViewModeChange, deckId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { handleCreate, isLoading } = useCreateFlashcard();
  const [values, setValues] = useState({ front: "", back: "", notes: "" });

  const close = () => setIsOpen(false);

  const act = (fn: () => void) => { fn(); close(); };

  const pills = [
    {
      id: "study",
      icon: BookOpen,
      label: "Study",
      active: mode === "study",
      onClick: () => act(() => onModeChange("study")),
      show: true,
    },
    {
      id: "browse",
      icon: LayoutGrid,
      label: "Browse",
      active: mode === "normal",
      onClick: () => act(() => onModeChange("normal")),
      show: true,
    },
    {
      id: "view",
      icon: viewMode === "grid" ? List : LayoutGrid,
      label: viewMode === "grid" ? "List view" : "Grid view",
      active: false,
      onClick: () => act(() => onViewModeChange(viewMode === "grid" ? "list" : "grid")),
      show: mode === "normal",
    },
    {
      id: "new",
      icon: Plus,
      label: "New card",
      active: false,
      onClick: () => { close(); setDrawerOpen(true); },
      show: true,
    },
  ].filter((p) => p.show);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleCreate({ ...values, deckId } as unknown as Flashcard);
    setDrawerOpen(false);
    setValues({ front: "", back: "", notes: "" });
  };

  return (
    <>
      {/* Blur backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md md:hidden"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* FAB + pill stack */}
      <div
        className="fixed right-4 z-50 md:hidden flex flex-col items-end gap-2.5"
        style={{ bottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        {/* Pills — rendered reversed in JSX + flex-col-reverse = visual top→bottom, stagger bottom→top */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="flex flex-col-reverse gap-2"
              variants={containerVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {[...pills].reverse().map((pill) => (
                <motion.button
                  key={pill.id}
                  variants={pillVariants}
                  whileTap={{ scale: 0.94 }}
                  onClick={pill.onClick}
                  className={cn(
                    "flex items-center gap-2.5 px-4 h-11 rounded-full text-sm font-medium shadow-lg shadow-black/25 border whitespace-nowrap",
                    pill.active
                      ? "bg-foreground text-background border-transparent"
                      : "bg-background/90 text-foreground border-border/60 hover:bg-background-2",
                  )}
                >
                  <pill.icon size={15} strokeWidth={pill.active ? 2.5 : 2} />
                  {pill.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          className="w-12 h-12 rounded-full bg-foreground text-background shadow-xl shadow-black/30 flex items-center justify-center"
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", duration: 0.2, bounce: 0.1 }}
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Close actions" : "Open actions"}
        >
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex items-center justify-center"
          >
            <Plus size={22} strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>

      {/* New card drawer */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen} shouldScaleBackground>
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
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-9 h-[3px] rounded-full bg-muted-foreground/20" />
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 pb-3">
                <Drawer.Title className="text-sm font-semibold text-foreground pt-2 pb-5">
                  New flashcard
                </Drawer.Title>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Front</Label>
                    <Input
                      placeholder="Question…"
                      value={values.front}
                      onChange={(e) => setValues({ ...values, front: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Back</Label>
                    <Input
                      placeholder="Answer…"
                      value={values.back}
                      onChange={(e) => setValues({ ...values, back: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>
                      Notes{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      placeholder="Any extra context…"
                      value={values.notes}
                      onChange={(e) => setValues({ ...values, notes: e.target.value })}
                    />
                  </div>
                  <div style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
                    <Button
                      type="submit"
                      disabled={isLoading || !values.front || !values.back}
                      className="w-full h-12 rounded-xl font-semibold"
                    >
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
