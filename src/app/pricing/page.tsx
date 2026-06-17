"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Wand2, MessageSquare, FolderPlus, Sparkles, CreditCard } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import { CREDIT_PACKAGES, CreditPackage, formatCreditPackagePrice } from "@/lib/credit-packages";
import { cn } from "@/lib/utils";
import { useIris } from "@/hooks/use-iris";
import type { IrisConfig } from "@/hooks/use-iris";

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

const aiActions = [
  {
    icon: MessageSquare,
    label: "Chat with Ace",
    description: "Send a message to your AI study assistant",
    cost: CREDIT_COSTS.aiMessage,
  },
  {
    icon: Sparkles,
    label: "AI card suggestions",
    description: "Get improvement hints on existing cards",
    cost: CREDIT_COSTS.aiAction,
  },
  {
    icon: Wand2,
    label: "Generate flashcards",
    description: "AI creates cards from your text or topic",
    cost: `${CREDIT_COSTS.generatedFlashcard}/card`,
  },
  {
    icon: FolderPlus,
    label: "Create full deck with AI",
    description: "Generates a complete deck in one operation",
    cost: CREDIT_COSTS.aiAction,
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

interface CreditsResponse {
  success: boolean;
  credits?: {
    balance: number;
    totalGranted: number;
    totalSpent: number;
  };
}

const creditsFetcher = async (url: string): Promise<CreditsResponse> => {
  const response = await fetch(url, { credentials: "include" });
  if (response.status === 401) return { success: false };
  if (!response.ok) throw new Error("Failed to load credits");
  return response.json();
};

const CHECKOUT_EXPECTED_BALANCE_KEY = "creditCheckoutExpectedBalance";
const CHECKOUT_POLL_ATTEMPTS = 10;
const CHECKOUT_POLL_INTERVAL_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);
  const [isProcessingCheckoutReturn, setIsProcessingCheckoutReturn] = useState(false);
  const { data, mutate } = useSWR<CreditsResponse>("/api/credits", creditsFetcher, {
    revalidateOnFocus: false,
  });

  const irisConfig = useMemo<IrisConfig>(
    () => ({
      title: "Credits",
      label: "Credits",
      icon: CreditCard,
      disabled: true,
      content: () => null,
    }),
    [],
  );

  useIris(irisConfig);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    async function pollForPurchasedCredits() {
      setIsProcessingCheckoutReturn(true);
      toast("Payment complete. Updating your credits.");

      const expectedBalanceValue = window.sessionStorage.getItem(CHECKOUT_EXPECTED_BALANCE_KEY);
      const expectedBalance = expectedBalanceValue ? Number(expectedBalanceValue) : null;
      window.sessionStorage.removeItem(CHECKOUT_EXPECTED_BALANCE_KEY);

      try {
        for (let attempt = 0; attempt < CHECKOUT_POLL_ATTEMPTS; attempt++) {
          const refreshed = await mutate();
          const refreshedBalance = refreshed?.credits?.balance;

          if (
            refreshedBalance !== undefined &&
            (expectedBalance === null || refreshedBalance >= expectedBalance)
          ) {
            toast.success("Credits updated.");
            return;
          }

          await sleep(CHECKOUT_POLL_INTERVAL_MS);
        }

        toast("Payment received. Credits are still processing.");
      } finally {
        setIsProcessingCheckoutReturn(false);
      }
    }

    if (checkout === "success") {
      pollForPurchasedCredits();
    } else if (checkout === "canceled") {
      toast.error("Checkout canceled.");
      window.sessionStorage.removeItem(CHECKOUT_EXPECTED_BALANCE_KEY);
    }

    if (checkout) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [mutate]);

  const startCheckout = useCallback(
    async (creditPackage: CreditPackage) => {
      setCheckoutPackageId(creditPackage.id);

      try {
        const response = await fetch("/api/credits/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ packageId: creditPackage.id }),
        });

        const result = await response.json();
        if (!response.ok || !result.url) {
          throw new Error(result.error || "Failed to start checkout");
        }

        if (data?.credits?.balance !== undefined) {
          window.sessionStorage.setItem(
            CHECKOUT_EXPECTED_BALANCE_KEY,
            String(data.credits.balance + creditPackage.credits),
          );
        }
        window.location.href = result.url;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start checkout");
        setCheckoutPackageId(null);
      }
    },
    [data?.credits?.balance],
  );

  const balance = data?.credits?.balance;

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
            {isProcessingCheckoutReturn ? "Updating" : (balance ?? "—")}
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
              <span className="text-[10px] text-muted-foreground">Credits never expire</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isLoading={checkoutPackageId === tier.id}
                  onPurchase={startCheckout}
                />
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
                <ActionRow key={action.label} action={action} last={i === aiActions.length - 1} />
              ))}
            </div>
          </motion.div>

          {/* ── Sign-up bonus ─────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex items-start gap-3 px-5 py-4 rounded-lg border border-border bg-background-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-[5px]" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                New accounts receive{" "}
                <span className="text-foreground font-medium">50 free credits</span> on sign-up — no
                payment required.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isLoading,
  onPurchase,
}: {
  tier: CreditPackage;
  isLoading: boolean;
  onPurchase: (tier: CreditPackage) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border p-5",
        tier.featured ? "bg-background-2 border-foreground/20" : "bg-background-2 border-border",
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
        <span className="text-[10px] font-mono text-muted-foreground">{tier.perCredit} each</span>
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
          {formatCreditPackagePrice(tier)}
        </span>
        <Button
          variant={tier.featured ? "default" : "outline"}
          size="sm"
          disabled={isLoading}
          onClick={() => onPurchase(tier)}
          className="text-xs"
        >
          {isLoading ? "Opening" : "Purchase"}
        </Button>
      </div>
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────

function ActionRow({ action, last }: { action: (typeof aiActions)[number]; last: boolean }) {
  const Icon = action.icon;
  return (
    <div className={cn("flex items-center gap-4 px-5 py-3.5", !last && "border-b border-border")}>
      <div className="w-7 h-7 rounded-md bg-background-3 border border-border flex items-center justify-center shrink-0">
        <Icon size={13} className="text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{action.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{action.description}</p>
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
