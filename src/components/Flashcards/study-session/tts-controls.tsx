"use client";

import { LoaderCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TtsPlaybackControlsProps {
  side: "front" | "back";
  text: string;
  cardId: string;
  activeSide: "front" | "back" | null;
  disabled?: boolean;
  voiceId: string;
  voicePresets: readonly { id: string; label: string }[];
  onVoiceChange: (voiceId: string) => void;
  onPlay: (params: { text: string; cardId?: string; side: "front" | "back" }) => void;
  className?: string;
}

export function TtsPlaybackControls({
  side,
  text,
  cardId,
  activeSide,
  disabled,
  voiceId,
  voicePresets,
  onVoiceChange,
  onPlay,
  className,
}: TtsPlaybackControlsProps) {
  const isActive = activeSide === side;
  const isDisabled = disabled || activeSide !== null || text.trim().length === 0;

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Play ${side}`}
            disabled={isDisabled}
            onClick={() => onPlay({ text, cardId, side })}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            {isActive ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Play audio</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={activeSide !== null}
            className="h-8 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Select voice"
          >
            {voicePresets.find((voice) => voice.id === voiceId)?.label ?? "Voice"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Voice</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={voiceId} onValueChange={onVoiceChange}>
            {voicePresets.map((voice) => (
              <DropdownMenuRadioItem key={voice.id} value={voice.id}>
                {voice.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
