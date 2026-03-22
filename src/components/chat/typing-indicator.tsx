"use client";

import { StarIcon } from "@/icons";

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2.5">
      <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <StarIcon size={10} className="text-primary" />
      </div>
      <div className="flex items-center gap-1 pt-1">
        <span
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <span
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "180ms", animationDuration: "1s" }}
        />
        <span
          className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: "360ms", animationDuration: "1s" }}
        />
      </div>
    </div>
  );
}
