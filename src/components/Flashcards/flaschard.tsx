'use client'
import { Badge } from "../ui/badge";
import { Flashcard as FlashCardType } from "@/generated/prisma";
import { Separator } from "../ui/separator";

export function FlashCard({ card }: { card: FlashCardType }) {
    return (
        <div className="hover:cursor-pointer hover:border-divider-2 transition-all w-full max-w-sm p-4 flex flex-col gap-4 bg-background-1 border border-divider-1 rounded-sm">
            <div className="flex items-center gap-2">
                <Badge variant={"destructive"}>
                    Hard
                </Badge>
                <Badge variant={"destructive"}>
                    Tripping
                </Badge>
            </div>

            <Separator />

            <div className="p-16 text-center flex flex-col gap-4">
                <span className="text-sm text-muted">
                    Front
                </span>

                <span>
                    {card.front}
                </span>
            </div>

            <Separator />

            <div className="text-xs text-muted flex justify-between">
                90%

                <div>
                    due today
                </div>
            </div>
        </div>
    )
}