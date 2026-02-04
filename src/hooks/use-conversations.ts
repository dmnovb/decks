"use client"

import useSWR from "swr"

export interface ConversationMessage {
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: string
}

export interface Conversation {
    id: string
    title: string | null
    createdAt: string
    updatedAt: string
    messages?: ConversationMessage[]
    _count?: { messages: number }
}

const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" })
    if (!res.ok) throw new Error("Failed to fetch")
    const data = await res.json()
    return data.conversations || data.conversation
}

export function useConversations() {
    const { data: conversations, error, isLoading, mutate } = useSWR<Conversation[]>(
        "/api/conversations",
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    const createConversation = async (title?: string, messages?: { role: string; content: string }[]) => {
        const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title, messages }),
        })
        if (!res.ok) throw new Error("Failed to create conversation")
        const data = await res.json()
        await mutate()
        return data.conversation as Conversation
    }

    const getConversation = async (id: string): Promise<Conversation | null> => {
        const res = await fetch(`/api/conversations/${id}`, {
            credentials: "include",
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.conversation
    }

    const addMessage = async (conversationId: string, role: string, content: string) => {
        const res = await fetch(`/api/conversations/${conversationId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ role, content }),
        })
        if (!res.ok) throw new Error("Failed to add message")
        const data = await res.json()
        return data.message as ConversationMessage
    }

    const deleteConversation = async (id: string) => {
        const res = await fetch(`/api/conversations/${id}`, {
            method: "DELETE",
            credentials: "include",
        })
        if (!res.ok) throw new Error("Failed to delete conversation")
        await mutate()
    }

    const updateTitle = async (id: string, title: string) => {
        const res = await fetch(`/api/conversations/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title }),
        })
        if (!res.ok) throw new Error("Failed to update title")
        await mutate()
    }

    return {
        conversations: conversations || [],
        isLoading,
        error,
        createConversation,
        getConversation,
        addMessage,
        deleteConversation,
        updateTitle,
        refresh: mutate,
    }
}
