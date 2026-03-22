"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
];

export function IconRail() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center w-12 shrink-0 h-full bg-background border-r border-border py-3">

      {/* Logomark — sealed mark, not just a letter */}
      <Link
        href="/"
        className="group flex items-center justify-center w-7 h-7 rounded-[5px] border border-border mb-3 transition-all duration-150 hover:border-foreground/25 hover:bg-background-2"
      >
        <span className="text-[11px] font-semibold tracking-[-0.04em] text-muted-foreground group-hover:text-foreground transition-colors duration-150 select-none leading-none">
          A
        </span>
      </Link>

      {/* Separator — groups logo from nav */}
      <div className="w-4 h-px bg-divider-2 mb-3" />

      {/* Nav cluster */}
      <div className="flex flex-col w-full gap-px">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <div key={href} className="relative w-full flex justify-center py-[3px]">
              {isActive && (
                <motion.div
                  layoutId="rail-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] bg-foreground rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Link
                href={href}
                title={label}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
                  isActive
                    ? "text-foreground bg-background-2"
                    : "text-muted-foreground hover:text-foreground hover:bg-background-1",
                )}
              >
                <Icon
                  size={15}
                  strokeWidth={isActive ? 2 : 1.75}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
