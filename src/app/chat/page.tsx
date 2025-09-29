"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StarIcon } from "@/icons"
import { useEffect, useRef, useState } from "react"
import { useAI } from "@/hooks/use-ai"

const Chat = () => {
    const { sendMessage, loading, error } = useAI()

    const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([
        { id: "m1", role: "assistant", content: "Hi! I’m Ace. How can I help you today?" },
        { id: "m2", role: "user", content: "Help me practice irregular verbs in Spanish." },
        { id: "m3", role: "assistant", content: "Sure! Do you want flashcards, a quiz, or an explanation first?" },
    ])
    const [inputValue, setInputValue] = useState("")

    const bottomRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages])

    async function handleSend() {
        const trimmed = inputValue.trim()
        if (!trimmed) return

        // Build history and ensure it starts with a user turn
        const firstUserIdx = messages.findIndex(m => m.role === "user")
        const history = firstUserIdx === -1 ? [] : messages.slice(firstUserIdx)

        const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: trimmed }
        const assistantId = crypto.randomUUID()

        // Optimistically add user + assistant placeholder
        setMessages(prev => [
            ...prev,
            userMsg,
            { id: assistantId, role: "assistant", content: "" },
        ])
        setInputValue("")

        try {
            const aiText = await sendMessage(trimmed, {
                systemPrompt: "You are Ace, a helpful language learning assistant.",
                context: "The user is practicing languages in a flashcard app.",
                history,
            })
            setMessages(prev =>
                prev.map(m => (m.id === assistantId ? { ...m, content: aiText } : m))
            )
        } catch {
            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantId
                        ? { ...m, content: "Sorry, I couldn't respond. Please try again." }
                        : m
                )
            )
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="box-border bg-background-1 border border-divider-1 rounded-sm flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-divider-1 flex items-center gap-3">
                <div className="p-2 bg-background-2 w-fit rounded-full border border-divider-2 flex items-center justify-center">
                    <StarIcon />
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
                        onKeyDown={handleKeyDown}
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