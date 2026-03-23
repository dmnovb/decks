"use client";

import { Flashcard } from "@/generated/prisma";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { useState, useCallback } from "react";
import { RotateCcw, Minus, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 80;

function haptic(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

interface TouchSessionCardProps {
  card: Flashcard;
  showBack: boolean;
  onFlip: () => void;
  onRate: (quality: number) => void;
  isLoading: boolean;
}

const ratings = [
  {
    quality: 0,
    label: "Again",
    sub: "<1m",
    Icon: RotateCcw,
    color: "text-destructive",
    bg: "bg-destructive/[0.07]",
    border: "border-destructive/20",
    active: "active:bg-destructive/[0.14]",
  },
  {
    quality: 2,
    label: "Hard",
    sub: "10m",
    Icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-background-2",
    border: "border-border",
    active: "active:bg-background-3",
  },
  {
    quality: 4,
    label: "Good",
    sub: "4d",
    Icon: Check,
    color: "text-success",
    bg: "bg-success/[0.07]",
    border: "border-success/20",
    active: "active:bg-success/[0.14]",
  },
  {
    quality: 5,
    label: "Easy",
    sub: "10d",
    Icon: Zap,
    color: "text-warning",
    bg: "bg-warning/[0.07]",
    border: "border-warning/20",
    active: "active:bg-warning/[0.14]",
  },
] as const;

export function TouchSessionCard({
  card,
  showBack,
  onFlip,
  onRate,
  isLoading,
}: TouchSessionCardProps) {
  const x = useMotionValue(0);

  // Physical tilt as you drag
  const rotate = useTransform(x, [-220, 220], [-9, 9]);

  // Directional color wash
  const goodOverlay  = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.14, 0]);
  const againOverlay = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.14]);

  // Stamp badges fade in as you approach threshold
  const goodStamp  = useTransform(x, [-SWIPE_THRESHOLD * 2, -SWIPE_THRESHOLD * 0.6], [1, 0]);
  const againStamp = useTransform(x, [SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD * 2], [0, 1]);

  const [thresholdCrossed, setThresholdCrossed] = useState(false);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!showBack) return;
      const crossed = Math.abs(info.offset.x) >= SWIPE_THRESHOLD;
      if (crossed && !thresholdCrossed) {
        setThresholdCrossed(true);
        haptic([10, 30, 10]);
      } else if (!crossed && thresholdCrossed) {
        setThresholdCrossed(false);
      }
    },
    [showBack, thresholdCrossed],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!showBack) {
        x.set(0);
        return;
      }
      if (info.offset.x < -SWIPE_THRESHOLD) {
        haptic(30);
        onRate(4);
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        haptic(30);
        onRate(0);
      }
      setThresholdCrossed(false);
    },
    [showBack, onRate, x],
  );

  const handleRate = useCallback(
    (quality: number) => {
      haptic(10);
      onRate(quality);
    },
    [onRate],
  );

  return (
    <div className="h-full flex flex-col px-4 pt-1">
      {/* ── Card zone ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2">
        <motion.div
          drag={showBack && !isLoading ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.45}
          style={{
            x,
            rotate,
            touchAction: showBack ? "none" : "pan-y",
          }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="w-full"
          onClick={!showBack && !isLoading ? onFlip : undefined}
        >
          <div
            className="relative rounded-[22px] overflow-hidden select-none"
            style={{
              background: "var(--color-background-1, hsl(var(--background)))",
              border: "1px solid hsl(var(--border) / 0.45)",
              boxShadow:
                "0 2px 0 0 rgba(255,255,255,0.02) inset, 0 8px 40px rgba(0,0,0,0.45), 0 1px 8px rgba(0,0,0,0.3)",
              minHeight: "360px",
            }}
          >
            {/* Swipe overlays */}
            <motion.div
              className="absolute inset-0 bg-destructive pointer-events-none z-10 rounded-[22px]"
              style={{ opacity: againOverlay }}
            />
            <motion.div
              className="absolute inset-0 bg-success pointer-events-none z-10 rounded-[22px]"
              style={{ opacity: goodOverlay }}
            />

            {/* Stamp badges — appear when dragging */}
            {showBack && (
              <>
                <motion.div
                  className="absolute top-5 left-5 z-20 pointer-events-none"
                  style={{ opacity: goodStamp }}
                >
                  <span
                    className="block border-[2px] border-success text-success text-[11px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-lg"
                    style={{ transform: "rotate(-10deg)" }}
                  >
                    Good
                  </span>
                </motion.div>

                <motion.div
                  className="absolute top-5 right-5 z-20 pointer-events-none"
                  style={{ opacity: againStamp }}
                >
                  <span
                    className="block border-[2px] border-destructive text-destructive text-[11px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-lg"
                    style={{ transform: "rotate(10deg)" }}
                  >
                    Again
                  </span>
                </motion.div>
              </>
            )}

            {/* ── Card face ──────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {!showBack ? (
                /* Front — Question */
                <motion.div
                  key="front"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col px-8 py-7"
                  style={{ minHeight: "360px" }}
                >
                  <span className="text-[9px] font-semibold tracking-[0.28em] uppercase text-muted-foreground/25 mb-auto">
                    Q.
                  </span>

                  <p className="text-[22px] font-semibold text-foreground leading-relaxed text-center py-8">
                    {card.front}
                  </p>

                  {/* Tap hint */}
                  <motion.div
                    className="flex items-center justify-center gap-2.5 mt-auto"
                    animate={{ opacity: [0.18, 0.32, 0.18] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    <div className="w-6 h-px bg-muted-foreground/40" />
                    <span className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground/50 font-medium">
                      tap to reveal
                    </span>
                    <div className="w-6 h-px bg-muted-foreground/40" />
                  </motion.div>
                </motion.div>
              ) : (
                /* Back — Answer */
                <motion.div
                  key="back"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col px-8 py-7"
                  style={{ minHeight: "360px" }}
                >
                  {/* Recalled question */}
                  <div className="mb-5">
                    <span className="text-[9px] font-semibold tracking-[0.28em] uppercase text-muted-foreground/25">
                      Q.
                    </span>
                    <p className="text-sm text-muted-foreground/70 mt-1.5 leading-relaxed">
                      {card.front}
                    </p>
                  </div>

                  <div className="h-px bg-border/30 mb-5" />

                  {/* Answer — the star */}
                  <div className="flex-1">
                    <span className="text-[9px] font-semibold tracking-[0.28em] uppercase text-muted-foreground/25">
                      A.
                    </span>
                    <p className="text-[22px] font-semibold text-foreground mt-2 leading-relaxed">
                      {card.back}
                    </p>
                  </div>

                  {card.notes && (
                    <div className="mt-5 pt-4 border-t border-border/20">
                      <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        {card.notes}
                      </p>
                    </div>
                  )}

                  {/* Swipe direction whisper */}
                  <div className="flex justify-between mt-5 text-[8px] tracking-[0.2em] uppercase text-muted-foreground/18 font-medium select-none">
                    <span>← good</span>
                    <span>again →</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Rating buttons ────────────────────────────────────── */}
      <div className="pb-2 shrink-0" style={{ minHeight: "88px" }}>
        <AnimatePresence mode="wait">
          {showBack ? (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-4 gap-2"
            >
              {ratings.map(({ quality, label, sub, Icon, color, bg, border, active }) => (
                <button
                  key={quality}
                  onClick={() => handleRate(quality)}
                  disabled={isLoading}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-4 rounded-[14px] border transition-transform",
                    bg,
                    border,
                    active,
                    "disabled:opacity-40 active:scale-[0.94]",
                  )}
                >
                  <Icon size={16} className={color} strokeWidth={2} />
                  <span className={cn("text-[11px] font-semibold leading-none", color)}>
                    {label}
                  </span>
                  <span className="text-[9px] text-muted-foreground/35 font-mono leading-none">
                    {sub}
                  </span>
                </button>
              ))}
            </motion.div>
          ) : (
            /* Ghost placeholder — prevents layout shift when buttons are hidden */
            <motion.div
              key="ghost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              className="h-[80px]"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
