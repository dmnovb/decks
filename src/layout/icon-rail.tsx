"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, BarChart2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
];

export function IconRail() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center w-12 shrink-0 h-full bg-background border-r border-border py-4 gap-1">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center justify-center w-8 h-8 mb-4 font-bold text-xs tracking-wider text-foreground"
      >
        D
      </Link>

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-150",
                isActive
                  ? "text-foreground bg-background-2"
                  : "text-muted-foreground hover:text-foreground hover:bg-background-2"
              )}
            >
              <Icon size={16} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
