"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BarChart2, CreditCard, Layers, MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIrisControls } from "@/hooks/use-iris";

const tabs = [
  {
    href: "/",
    icon: Layers,
    label: "Decks",
    isActive: (p: string) => p === "/" || p.startsWith("/decks"),
  },
  {
    href: "/stats",
    icon: BarChart2,
    label: "Stats",
    isActive: (p: string) => p.startsWith("/stats"),
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Chat",
    isActive: (p: string) => p.startsWith("/chat"),
  },
  {
    href: "/pricing",
    icon: CreditCard,
    label: "Credits",
    isActive: (p: string) => p.startsWith("/pricing"),
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const { config, isOpen, openIris, closeIris } = useIrisControls();
  const IrisIcon = config?.icon ?? Plus;
  const irisDisabled = !config || config.disabled;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-[64px] grid-cols-5">
        {tabs.slice(0, 2).map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);

          return (
            <Link
              key={href}
              href={href}
              onClick={closeIris}
              className="relative flex-1 flex flex-col items-center justify-center gap-[6px] transition-colors duration-150"
            >
              {/* Active indicator — fine line etched at the top */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[1.5px] rounded-full transition-all duration-300",
                  active ? "w-8 bg-foreground opacity-100" : "w-0 bg-transparent opacity-0",
                )}
              />

              <Icon
                size={19}
                strokeWidth={active ? 2 : 1.5}
                className={cn(
                  "transition-all duration-150",
                  active ? "text-foreground" : "text-muted-foreground/40",
                )}
              />

              <span
                className={cn(
                  "text-[9px] tracking-[0.14em] uppercase font-medium transition-all duration-150",
                  active ? "text-foreground" : "text-muted-foreground/35",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div className="relative flex items-center justify-center">
          {!isOpen && (
            <motion.button
              layoutId="iris"
              type="button"
              aria-label={config?.label ?? "Open Iris"}
              disabled={irisDisabled}
              onClick={openIris}
              className={cn(
                "absolute -top-5 flex size-14 items-center justify-center rounded-full",
                "bg-foreground text-background shadow-[0_10px_30px_oklch(0%_0_0_/_0.28)]",
                "transition-[opacity,transform] duration-150 active:scale-[0.94]",
                irisDisabled && "opacity-45",
              )}
              transition={{ layout: { type: "spring", duration: 0.28, bounce: 0.08 } }}
            >
              <IrisIcon size={22} strokeWidth={2.35} />
            </motion.button>
          )}
        </div>

        {tabs.slice(2).map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);

          return (
            <Link
              key={href}
              href={href}
              onClick={closeIris}
              className="relative flex-1 flex flex-col items-center justify-center gap-[6px] transition-colors duration-150"
            >
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[1.5px] rounded-full transition-all duration-300",
                  active ? "w-8 bg-foreground opacity-100" : "w-0 bg-transparent opacity-0",
                )}
              />

              <Icon
                size={19}
                strokeWidth={active ? 2 : 1.5}
                className={cn(
                  "transition-all duration-150",
                  active ? "text-foreground" : "text-muted-foreground/40",
                )}
              />

              <span
                className={cn(
                  "text-[9px] tracking-[0.14em] uppercase font-medium transition-all duration-150",
                  active ? "text-foreground" : "text-muted-foreground/35",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
