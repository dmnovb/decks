"use client";

import { motion } from "motion/react";
import { Check, Wand2, MessageSquare, FolderPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Animation variants (matches stats page pattern) ───────────────────────────

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

// ── Data ──────────────────────────────────────────────────────────────────────

const tiers = [
  {
    name: "Starter",
    credits: 100,
    price: "1.00",
    perCredit: "1.0¢",
    featured: false,
    note: "Try it out",
  },
  {
    name: "Plus",
    credits: 500,
    price: "4.00",
    perCredit: "0.8¢",
    featured: true,
    note: "Best value",
  },
  {
    name: "Max",
    credits: 2000,
    price: "12.00",
    perCredit: "0.6¢",
    featured: false,
    note: "Power users",
  },
] as const;

const aiActions = [
  {
    icon: MessageSquare,
    label: "Chat with Ace",
    description: "Send a message to your AI study assistant",
    cost: 1,
  },
  {
    icon: Sparkles,
    label: "AI card suggestions",
    description: "Get improvement hints on existing cards",
    cost: 2,
  },
  {
    icon: Wand2,
    label: "Generate flashcards",
    description: "AI creates cards from your text or topic",
    cost: 5,
  },
  {
    icon: FolderPlus,
    label: "Create full deck with AI",
    description: "Generates a complete deck in one operation",
    cost: 10,
  },
] as const;

const coreFeatures = [
  "Unlimited flashcard decks",
  "Spaced repetition (SM-2)",
  "Folder organisation",
  "Study sessions",
  "Statistics dashboard",
  "Import / export",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header — matches stats/decks page pattern */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Credits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Free to learn. AI features run on credits.
          </p>
        </div>

        {/* Balance chip */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-background-2 border border-border">
          <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
            Balance
          </span>
          <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
            —
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <motion.div
          className="flex flex-col gap-8 max-w-3xl"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* ── Always free ──────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="rounded-lg bg-background-2 border border-border px-5 py-4 flex flex-col gap-3">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                Always free
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                {coreFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check size={11} className="text-success shrink-0" />
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Credit tiers ─────────────────────────────────────────── */}
          <motion.div variants={item} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                Top up credits
              </span>
              <span className="text-[10px] text-muted-foreground">
                Credits never expire
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((tier) => (
                <TierCard key={tier.name} tier={tier} />
              ))}
            </div>
          </motion.div>

          {/* ── AI cost breakdown ─────────────────────────────────────── */}
          <motion.div variants={item} className="flex flex-col gap-3">
            <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              Credit usage
            </span>
            <div className="rounded-lg bg-background-2 border border-border overflow-hidden">
              {aiActions.map((action, i) => (
                <ActionRow
                  key={action.label}
                  action={action}
                  last={i === aiActions.length - 1}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Sign-up bonus ─────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex items-start gap-3 px-5 py-4 rounded-lg border border-border bg-background-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-[5px]" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                New accounts receive{" "}
                <span className="text-foreground font-medium">50 free credits</span>{" "}
                on sign-up — no payment required.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({ tier }: { tier: (typeof tiers)[number] }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border p-5",
        tier.featured
          ? "bg-background-2 border-foreground/20"
          : "bg-background-2 border-border",
      )}
    >
      {/* Accent line on featured tier — scales from the trigger point */}
      {tier.featured && (
        <div
          className="absolute top-0 inset-x-0 h-px rounded-t-lg"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(70% 0 0 / 0.5) 30%, oklch(70% 0 0 / 0.5) 70%, transparent)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground">{tier.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tier.note}</p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {tier.perCredit} each
        </span>
      </div>

      {/* Credit amount */}
      <div className="flex items-baseline gap-1.5 mb-6">
        <span className="font-mono text-3xl font-semibold text-foreground tabular-nums leading-none">
          {tier.credits}
        </span>
        <span className="text-xs text-muted-foreground">credits</span>
      </div>

      {/* Footer — price + buy button */}
      <div className="flex items-center justify-between gap-3 mt-auto">
        <span className="font-mono text-sm font-medium text-foreground">
          ${tier.price}
        </span>
        <Button
          variant={tier.featured ? "default" : "outline"}
          size="sm"
          disabled
          className="text-xs"
        >
          Purchase
        </Button>
      </div>
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────

function ActionRow({
  action,
  last,
}: {
  action: (typeof aiActions)[number];
  last: boolean;
}) {
  const Icon = action.icon;
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-3.5",
        !last && "border-b border-border",
      )}
    >
      <div className="w-7 h-7 rounded-md bg-background-3 border border-border flex items-center justify-center shrink-0">
        <Icon size={13} className="text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{action.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {action.description}
        </p>
      </div>

      <div className="flex items-baseline gap-1 shrink-0">
        <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
          {action.cost}
        </span>
        <span className="text-[10px] text-muted-foreground">cr</span>
      </div>
    </div>
  );
}
