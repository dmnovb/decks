"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/generated/prisma";
import { SessionConfig, isCardDue, isCardNew } from "@/utils/card-filters";
import { cn } from "@/lib/utils";

interface SessionSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: SessionConfig) => void;
  allCards: Flashcard[];
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-foreground" : "bg-background-3 border border-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-[18px] w-[18px] rounded-full shadow-sm transition-transform duration-200",
          checked
            ? "translate-x-[22px] bg-background"
            : "translate-x-[3px] bg-muted-foreground/50",
        )}
      />
    </button>
  );
}

const CARD_LIMITS = [10, 20, 50, undefined] as const;
const NEW_LIMITS  = [5, 10, 20, undefined] as const;

export function SessionSetup({
  isOpen,
  onClose,
  onStart,
  allCards,
}: SessionSetupProps) {
  const [maxCards, setMaxCards]       = useState<number | undefined>(20);
  const [maxNewCards, setMaxNewCards] = useState<number | undefined>(5);
  const [dueOnly, setDueOnly]         = useState(true);
  const [shuffled, setShuffled]       = useState(false);

  const dueCards    = allCards.filter(isCardDue);
  const newCards    = allCards.filter(isCardNew);
  const reviewCards = allCards.filter(
    (c) => !isCardNew(c) && (dueOnly ? isCardDue(c) : true),
  );

  const estimatedNew    = Math.min(maxNewCards ?? newCards.length, newCards.length);
  const estimatedReview = Math.min((maxCards ?? allCards.length) - estimatedNew, reviewCards.length);
  const estimatedTotal  = estimatedNew + estimatedReview;

  const handleStart = () => {
    onStart({ maxCards, maxNewCards, dueOnly, shuffled, sortBy: shuffled ? "random" : "dueDate" });
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />

        <Drawer.Content
          className="fixed bottom-0 inset-x-0 z-50 flex flex-col outline-none"
          style={{ maxHeight: "92dvh" }}
        >
          {/* Sheet surface */}
          <div className="flex flex-col overflow-hidden rounded-t-[24px] bg-background border-t border-x border-border/40"
               style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-[3px] rounded-full bg-muted-foreground/20" />
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto overscroll-contain px-5 pb-3">

              {/* Title */}
              <Drawer.Title className="text-sm font-semibold text-foreground pt-2 pb-5">
                Study Session
              </Drawer.Title>

              {/* Stats strip */}
              <div className="flex items-center rounded-xl bg-background-2 border border-border/50 px-4 py-3 mb-5">
                <Stat label="Due" value={dueCards.length} />
                <Divider />
                <Stat label="New" value={newCards.length} />
                <Divider />
                <Stat label="Total" value={allCards.length} />
                <div className="flex-1" />
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.16em] mb-0.5">Session</p>
                  <p className="text-base font-bold tabular-nums">
                    {estimatedTotal}
                    <span className="text-xs font-normal text-muted-foreground/50 ml-1">cards</span>
                  </p>
                </div>
              </div>

              {/* Max cards */}
              <Section label="Cards per session">
                <div className="grid grid-cols-4 gap-1.5">
                  {CARD_LIMITS.map((n) => (
                    <PillButton
                      key={String(n)}
                      active={maxCards === n}
                      onClick={() => setMaxCards(n)}
                    >
                      {n ?? "All"}
                    </PillButton>
                  ))}
                </div>
              </Section>

              {/* Max new cards */}
              <Section label="New cards limit">
                <div className="grid grid-cols-4 gap-1.5">
                  {NEW_LIMITS.map((n) => (
                    <PillButton
                      key={String(n)}
                      active={maxNewCards === n}
                      onClick={() => setMaxNewCards(n)}
                    >
                      {n ?? "All"}
                    </PillButton>
                  ))}
                </div>
              </Section>

              {/* Toggles */}
              <div className="rounded-xl bg-background-2 border border-border/50 divide-y divide-border/40 mb-5">
                <ToggleRow label="Due cards only" sub="Skip cards not yet scheduled" checked={dueOnly} onChange={() => setDueOnly(!dueOnly)} />
                <ToggleRow label="Shuffle" sub="Randomise card order" checked={shuffled} onChange={() => setShuffled(!shuffled)} />
              </div>

              {/* Estimated time */}
              <p className="text-center text-[11px] text-muted-foreground/40 tracking-wide mb-5">
                ~{Math.ceil(estimatedTotal * 0.5)} min estimated · {estimatedNew} new · {estimatedReview} review
              </p>
            </div>

            {/* Footer CTA — pinned above safe area */}
            <div
              className="shrink-0 px-5 pb-3 pt-2 border-t border-border/30 bg-background"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <Button
                onClick={handleStart}
                disabled={estimatedTotal === 0}
                className="w-full h-12 text-sm font-semibold rounded-xl"
              >
                Start{estimatedTotal > 0 ? ` · ${estimatedTotal} cards` : ""}
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center px-3">
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.16em]">{label}</p>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border/50 mx-1" />;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.16em] mb-2">{label}</p>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg text-sm font-medium transition-colors border",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background-2 text-muted-foreground border-border/50 hover:bg-background-3",
      )}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
