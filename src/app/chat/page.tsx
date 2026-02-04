"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StarIcon } from "@/icons"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAI } from "@/hooks/use-ai"
import { useConversations, ConversationMessage } from "@/hooks/use-conversations"
import { useDecks } from "@/providers/decks-provider"
import { toast } from "sonner"
import { Message } from "@/components/chat/message"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ChevronDown, Plus, Trash2, MessageSquare } from "lucide-react"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

const GREETING_MESSAGE: ChatMessage = {
    id: "greeting",
    role: "assistant",
    content: "Hi! I'm Ace, your language learning assistant. I can help you create flashcard decks, generate practice materials, and answer questions. What would you like to learn today?"
}

const Chat = () => {
    const { sendAgentMessageStream, loading, error } = useAI()
    const { refreshDecks } = useDecks()
    const {
        conversations,
        createConversation,
        getConversation,
        addMessage,
        deleteConversation,
    } = useConversations()

    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE])
    const [inputValue, setInputValue] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")

    const bottomRef = useRef<HTMLDivElement | null>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages, streamingContent])

    // Load conversation when selected
    const loadConversation = useCallback(async (conversationId: string) => {
        const conversation = await getConversation(conversationId)
        if (conversation && conversation.messages) {
            const loadedMessages: ChatMessage[] = conversation.messages.map((msg: ConversationMessage) => ({
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
            }))
            // Add greeting at the start if conversation doesn't start with assistant
            if (loadedMessages.length === 0 || loadedMessages[0].role !== "assistant") {
                setMessages([GREETING_MESSAGE, ...loadedMessages])
            } else {
                setMessages(loadedMessages)
            }
            setCurrentConversationId(conversationId)
        }
    }, [getConversation])

    // Start new conversation
    const startNewConversation = useCallback(() => {
        setCurrentConversationId(null)
        setMessages([GREETING_MESSAGE])
        setInputValue("")
    }, [])

    // Delete a conversation
    const handleDeleteConversation = useCallback(async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        try {
            await deleteConversation(id)
            if (currentConversationId === id) {
                startNewConversation()
            }
            toast.success("Conversation deleted")
        } catch {
            toast.error("Failed to delete conversation")
        }
    }, [deleteConversation, currentConversationId, startNewConversation])

    async function handleSend() {
        const trimmed = inputValue.trim()
        if (!trimmed || loading || isStreaming) return

        const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed }
        const assistantId = crypto.randomUUID()

        // Add user message to UI
        setMessages(prev => [...prev, userMsg])
        setInputValue("")
        setIsStreaming(true)
        setStreamingContent("")

        try {
            // Create conversation if this is the first message
            let conversationId = currentConversationId
            if (!conversationId) {
                const title = trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : "")
                const newConvo = await createConversation(title)
                conversationId = newConvo.id
                setCurrentConversationId(conversationId)
            }

            // Save user message to database
            await addMessage(conversationId, "user", trimmed)

            // Build history for the agent (exclude greeting)
            const history = messages
                .filter(msg => msg.id !== "greeting")
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))

            // Call agent with streaming
            const result = await sendAgentMessageStream(trimmed, history, {
                onText: (_text, full) => {
                    setStreamingContent(full)
                },
                onError: (err) => {
                    toast.error(err)
                }
            })

            // Add assistant response to UI
            setMessages(prev => [
                ...prev,
                { id: assistantId, role: "assistant", content: result.response }
            ])
            setStreamingContent("")

            // Save assistant message to database
            await addMessage(conversationId, "assistant", result.response)

            // Check if any database actions were performed
            if (result.actionsPerformed.length > 0) {
                if (result.actionsPerformed.some((action: string) =>
                    action.includes('create_deck') || action.includes('create_flashcards')
                )) {
                    await refreshDecks()
                }

                if (result.actionsPerformed.includes('create_deck') ||
                    result.actionsPerformed.includes('create_deck_with_flashcards')) {
                    toast.success("Deck created successfully! Check your sidebar.")
                } else if (result.actionsPerformed.includes('create_flashcards')) {
                    toast.success("Flashcards added successfully!")
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
        } finally {
            setIsStreaming(false)
            setStreamingContent("")
        }
    }

    const currentConversation = conversations.find(c => c.id === currentConversationId)

    return (
        <div className="box-border bg-background-1 border border-divider-1 rounded-sm flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-divider-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 w-fit rounded-full border border-primary flex items-center justify-center">
                        <StarIcon className="text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Ace</span>
                        <span className="text-xs text-muted-foreground">Your language learning companion</span>
                    </div>
                </div>

                {/* Conversation Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <MessageSquare className="w-4 h-4" />
                            <span className="max-w-[120px] truncate">
                                {currentConversation?.title || "New Chat"}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem onClick={startNewConversation} className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Chat
                        </DropdownMenuItem>
                        {conversations.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Recent Conversations</DropdownMenuLabel>
                                {conversations.slice(0, 10).map((convo) => (
                                    <DropdownMenuItem
                                        key={convo.id}
                                        onClick={() => loadConversation(convo.id)}
                                        className="flex items-center justify-between group"
                                    >
                                        <span className="truncate flex-1">
                                            {convo.title || "Untitled"}
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteConversation(e, convo.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="px-4 py-6 flex-1 min-h-[360px] max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground self-center py-8">Start a conversation with Ace…</div>
                )}

                {messages.map(message => (
                    <Message
                        key={message.id}
                        role={message.role}
                        content={message.content}
                    />
                ))}

                {/* Streaming message */}
                {isStreaming && streamingContent && (
                    <Message
                        role="assistant"
                        content={streamingContent}
                        isStreaming={true}
                    />
                )}

                {/* Typing indicator when waiting for response */}
                {isStreaming && !streamingContent && (
                    <TypingIndicator />
                )}

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
                        disabled={loading || isStreaming}
                        autoFocus
                    />
                    <Button type="submit" onClick={handleSend} variant="default" disabled={loading || isStreaming}>
                        {loading || isStreaming ? "..." : "Send"}
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
