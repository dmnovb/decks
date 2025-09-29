'use client'
import { Badge } from "../ui/badge";
import { Flashcard as FlashCardType } from "@/generated/prisma";
import { Separator } from "../ui/separator";
import { ContextMenu, ContextMenuContent, ContextMenuItem } from "../ui/context-menu";
import { ContextMenuTrigger } from "@radix-ui/react-context-menu";
import useDeleteCard from "@/hooks/use-delete-flashcard";
import { useAI } from "@/hooks/use-ai";
import { useState } from "react";

export function FlashCard({ card }: { card: FlashCardType }) {
    const { sendMessage, loading, error } = useAI()
    const { handleDelete } = useDeleteCard()

    const [response, setResponse] = useState('')

    const handleSubmit = async () => {
        try {
            const aiResponse = await sendMessage('What is React?', {
                systemPrompt: 'You are a helpful coding assistant',
                context: 'User is learning web development'
            });
            setResponse(aiResponse);
        } catch (err) {
            console.error('Error:', err);
        }
    };


    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
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


                    <div>
                        <button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Thinking...' : 'Ask AI'}
                        </button>
                        {error && <p>Error: {error}</p>}
                        {response && <p>{response}</p>}
                    </div>

                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-background-2 border-divider-3 border">
                <ContextMenuItem className="hover:bg-background-3">Profile</ContextMenuItem>
                <ContextMenuItem onClick={() => handleDelete(card.id, card.deckId)}>Delete</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}