"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StarIcon } from "@/icons"
import { useEffect, useRef, useState } from "react"
import { useAI } from "@/hooks/use-ai"
import { useDecks } from "@/providers/decks-provider"
import { toast } from "sonner"

const Chat = () => {
    const { sendAgentMessage, loading, error } = useAI()
    const { refreshDecks } = useDecks()

    const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([
        { id: "m1", role: "assistant", content: "Hi! I'm Ace, your language learning assistant. I can help you create flashcard decks, generate practice materials, and answer questions. What would you like to learn today?" },
    ])
    const [inputValue, setInputValue] = useState("")

    const bottomRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages])

    async function handleSend() {
        const trimmed = inputValue.trim()
        if (!trimmed) return

        const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: trimmed }
        const assistantId = crypto.randomUUID()

        // Add user message
        setMessages(prev => [...prev, userMsg])
        setInputValue("")

        try {
            // Build history for the agent (exclude the greeting message)
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }))

            // Call agent with function calling capabilities
            const result = await sendAgentMessage(trimmed, history)

            // Add assistant response
            setMessages(prev => [
                ...prev,
                { id: assistantId, role: "assistant", content: result.response }
            ])

            // Check if any database actions were performed
            if (result.actionsPerformed.length > 0) {
                // Refresh decks to show the new content if content was modified
                if (result.actionsPerformed.some((action: string) =>
                    action.includes('create_deck') || action.includes('create_flashcards')
                )) {
                    await refreshDecks()
                }

                // Show success notification based on what was performed
                if (result.actionsPerformed.includes('create_deck') ||
                    result.actionsPerformed.includes('create_deck_with_flashcards')) {
                    toast.success("Deck created successfully! Check your sidebar.")
                } else if (result.actionsPerformed.includes('create_flashcards')) {
                    toast.success("Flashcards added successfully!")
                } else if (result.actionsPerformed.includes('list_user_flashcards_in_deck')) {
                    toast.success("Flashcards retrieved successfully!")
                } else if (result.actionsPerformed.includes('list_user_decks')) {
                    toast.success("Decks retrieved successfully!")
                }
            }

        } catch (err) {
            setMessages(prev => [
                ...prev,
                {
                    id: assistantId,
                    role: "assistant",
                    content: "Sorry, I couldn't respond. Please try again."
                }
            ])
            toast.error("Failed to process your request. Please try again.")
        }
    }

    return (
        <div className="box-border bg-background-1 border border-divider-1 rounded-sm flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-divider-1 flex items-center gap-3">
                <div className="p-2 bg-primary/10 w-fit rounded-full border border-primary flex items-center justify-center">
                    <StarIcon className="text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">Ace</span>
                    <span className="text-xs text-muted-foreground">Your language learning companion</span>
                </div>
            </div>

            {/* Messages */}
            <div className="px-4 py-6 flex-1 min-h-[360px] max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground self-center py-8">Start a conversation with Ace…</div>
                )}

                {messages.map(message => {
                    const isUser = message.role === "user"
                    return (
                        <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[80%] rounded-md px-3 py-2 text-sm border ${isUser
                                    ? "bg-background-2 border-divider-2"
                                    : "bg-background-1 border-divider-2"
                                    }`}
                            >
                                {message.content}
                            </div>
                        </div>
                    )
                })}

                {/* Auto-scroll sentinel */}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="p-3 border-t border-divider-1 bg-background-1 rounded-b-sm"
            >
                <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        placeholder="Chat with Ace…"
                        disabled={loading}
                        autoFocus
                    />
                    <Button type="submit" onClick={handleSend} variant="default" disabled={loading}>
                        {loading ? "Sending..." : "Send"}
                    </Button>
                </div>
                {error && (
                    <div className="mt-2 text-xs text-red-500">
                        {String(error)}
                    </div>
                )}
            </form>
        </div>
    )
}

export default Chat