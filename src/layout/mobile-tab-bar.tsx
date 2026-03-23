"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, MessageSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    icon: Layers,
    label: "Decks",
    isActive: (p: string) => p === "/" || p.startsWith("/decks"),
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Chat",
    isActive: (p: string) => p.startsWith("/chat"),
  },
  {
    href: "/stats",
    icon: BarChart2,
    label: "Stats",
    isActive: (p: string) => p.startsWith("/stats"),
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/30"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-[60px]">
        {tabs.map(({ href, icon: Icon, label, isActive }) => {
          const active = isActive(pathname);

          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center gap-[6px] transition-colors duration-150"
            >
              {/* Active indicator — fine line etched at the top */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[1.5px] rounded-full transition-all duration-300",
                  active
                    ? "w-8 bg-foreground opacity-100"
                    : "w-0 bg-transparent opacity-0",
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
