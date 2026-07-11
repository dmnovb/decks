"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const FAVICON_BY_THEME = {
  light: "/logo.svg",
  dark: "/logo-light.svg",
} as const;

export function ThemeFavicon() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme || !(resolvedTheme in FAVICON_BY_THEME)) return;

    const href = FAVICON_BY_THEME[resolvedTheme as keyof typeof FAVICON_BY_THEME];
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.sizes = "any";
      document.head.appendChild(link);
    }

    link.href = href;
  }, [resolvedTheme]);

  return null;
}
