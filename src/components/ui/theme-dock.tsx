"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ── Token definitions ──────────────────────────────────────────────────────

const lightTokens = {
  backgrounds: [
    { name: "background-0", value: "oklch(99% 0 0)", label: "bg-0" },
    { name: "background-1", value: "oklch(97% 0 0)", label: "bg-1" },
    { name: "background-2", value: "oklch(95% 0 0)", label: "bg-2" },
    { name: "background-3", value: "oklch(92% 0 0)", label: "bg-3" },
  ],
  dividers: [
    { name: "divider-0", value: "oklch(96% 0 0)", label: "div-0" },
    { name: "divider-1", value: "oklch(93% 0 0)", label: "div-1" },
    { name: "divider-2", value: "oklch(90% 0 0)", label: "div-2" },
    { name: "divider-3", value: "oklch(86% 0 0)", label: "div-3" },
  ],
  semantic: [
    { name: "border", value: "oklch(93% 0 0)", label: "border" },
    { name: "input", value: "oklch(93% 0 0)", label: "input" },
    { name: "ring", value: "oklch(65% 0 0)", label: "ring" },
    { name: "muted", value: "oklch(96% 0 0)", label: "muted" },
  ],
  text: [
    { name: "foreground", value: "oklch(8% 0 0)", label: "fg" },
    { name: "muted-foreground", value: "oklch(55% 0 0)", label: "fg-muted" },
    { name: "primary", value: "oklch(8% 0 0)", label: "primary" },
  ],
  accents: [
    { name: "success", value: "oklch(68% 0.15 145)", label: "success" },
    { name: "warning", value: "oklch(72% 0.16 80)", label: "warning" },
    { name: "destructive", value: "oklch(58% 0.22 27)", label: "danger" },
  ],
};

const darkTokens = {
  backgrounds: [
    { name: "background-0", value: "oklch(7% 0 0)", label: "bg-0" },
    { name: "background-1", value: "oklch(10.5% 0 0)", label: "bg-1" },
    { name: "background-2", value: "oklch(14% 0 0)", label: "bg-2" },
    { name: "background-3", value: "oklch(18% 0 0)", label: "bg-3" },
  ],
  dividers: [
    { name: "divider-0", value: "oklch(14% 0 0)", label: "div-0" },
    { name: "divider-1", value: "oklch(18% 0 0)", label: "div-1" },
    { name: "divider-2", value: "oklch(22% 0 0)", label: "div-2" },
    { name: "divider-3", value: "oklch(28% 0 0)", label: "div-3" },
  ],
  semantic: [
    { name: "border", value: "oklch(18% 0 0)", label: "border" },
    { name: "input", value: "oklch(18% 0 0)", label: "input" },
    { name: "ring", value: "oklch(55% 0 0)", label: "ring" },
    { name: "muted", value: "oklch(14% 0 0)", label: "muted" },
  ],
  text: [
    { name: "foreground", value: "oklch(96% 0 0)", label: "fg" },
    { name: "muted-foreground", value: "oklch(55% 0 0)", label: "fg-muted" },
    { name: "primary", value: "oklch(96% 0 0)", label: "primary" },
  ],
  accents: [
    { name: "success", value: "oklch(68% 0.15 145)", label: "success" },
    { name: "warning", value: "oklch(72% 0.16 80)", label: "warning" },
    { name: "destructive", value: "oklch(58% 0.22 27)", label: "danger" },
  ],
};

// ── Swatch ─────────────────────────────────────────────────────────────────

function Swatch({
  color,
  label,
  value,
  small = false,
}: {
  color: string;
  label: string;
  value: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={copy}
      title={copied ? "Copied!" : value}
      className={cn(
        "group flex flex-col items-center gap-1 cursor-pointer",
        small ? "gap-0.5" : "gap-1",
      )}
    >
      <div
        className={cn(
          "rounded border transition-transform group-hover:scale-105",
          small ? "w-7 h-7" : "w-9 h-9",
        )}
        style={{
          background: color,
          borderColor: "oklch(50% 0 0 / 0.15)",
        }}
      />
      <span
        className={cn(
          "font-mono text-center leading-none",
          small ? "text-[9px]" : "text-[10px]",
          "text-muted-foreground group-hover:text-foreground transition-colors",
        )}
      >
        {copied ? "✓" : label}
      </span>
    </button>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

function Section({
  title,
  tokens,
}: {
  title: string;
  tokens: { name: string; value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
      <div className="flex gap-2 flex-wrap">
        {tokens.map((t) => (
          <Swatch key={t.name} color={t.value} label={t.label} value={t.value} />
        ))}
      </div>
    </div>
  );
}

// ── ThemeDock ──────────────────────────────────────────────────────────────

export function ThemeDock() {
  const [open, setOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");
  const [font, setFont] = useState<"geist" | "inter">("geist");
  const { theme, setTheme } = useTheme();

  const toggleFont = (next: "geist" | "inter") => {
    setFont(next);
    document.body.style.fontFamily =
      next === "inter" ? "var(--font-inter)" : "var(--font-geist-sans)";
  };

  const tokens = activeTheme === "light" ? lightTokens : darkTokens;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Expanded panel */}
      {open && (
        <div
          className={cn(
            "rounded-xl border border-divider-1 shadow-2xl backdrop-blur-md",
            "bg-background-1/95 p-4 w-[520px]",
            "flex flex-col gap-4",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold tracking-tight">Color Tokens</span>
              <span className="text-[11px] text-muted-foreground">
                Click any swatch to copy its value
              </span>
            </div>
            {/* Theme toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-divider-1 bg-background-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTheme(t)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    activeTheme === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-divider-1" />

          {/* Token groups */}
          <div className="grid grid-cols-2 gap-4">
            <Section title="Backgrounds" tokens={tokens.backgrounds} />
            <Section title="Dividers" tokens={tokens.dividers} />
            <Section title="Semantic" tokens={tokens.semantic} />
            <Section title="Text" tokens={tokens.text} />
          </div>

          <div className="h-px bg-divider-1" />

          <Section title="Accents" tokens={tokens.accents} />

          {/* Live theme switcher */}
          <div className="h-px bg-divider-1" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              App theme: <span className="text-foreground font-medium">{theme}</span>
            </span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "text-[11px] font-medium px-3 py-1.5 rounded-lg",
                "border border-divider-2 bg-background-2 text-foreground",
                "hover:bg-background-3 transition-colors",
              )}
            >
              Switch to {theme === "dark" ? "light" : "dark"}
            </button>
          </div>

          {/* Font switcher */}
          <div className="h-px bg-divider-1" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Font: <span className="text-foreground font-medium">{font === "geist" ? "Geist" : "Inter"}</span>
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-divider-1 bg-background-2">
              {(["geist", "inter"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFont(f)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    font === f
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "geist" ? "Geist" : "Inter"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pill trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "border border-divider-2 bg-background-1/90 backdrop-blur-sm",
          "shadow-lg text-xs font-medium text-foreground",
          "hover:bg-background-2 transition-all duration-150",
          "hover:shadow-xl hover:-translate-y-0.5",
        )}
      >
        {/* Mini swatches preview */}
        <span className="flex items-center gap-0.5">
          {[
            "oklch(99% 0 0)",
            "oklch(97% 0 0)",
            "oklch(93% 0 0)",
            "oklch(68% 0.15 145)",
            "oklch(18% 0 0)",
            "oklch(10.5% 0 0)",
          ].map((c, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full border"
              style={{
                background: c,
                borderColor: "oklch(50% 0 0 / 0.2)",
              }}
            />
          ))}
        </span>
        <span>Color Tokens</span>
        <span className={cn("transition-transform duration-200", open ? "rotate-180" : "rotate-0")}>
          ↑
        </span>
      </button>
    </div>
  );
}
