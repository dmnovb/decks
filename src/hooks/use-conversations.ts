"use client";

import useSWR from "swr";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
  _count?: { messages: number };
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.conversations || data.conversation;
};

export function useConversations() {
  const {
    data: conversations,
    error,
    isLoading,
    mutate,
  } = useSWR<Conversation[]>("/api/conversations", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    fallbackData: [],
  });

  const createConversation = async (
    title?: string,
    messages?: { role: string; content: string }[],
  ) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, messages }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const data = await res.json();
    const convo = data.conversation as Conversation;
    // Optimistic update — avoid refetching all conversations
    await mutate((current) => [...(current || []), convo], { revalidate: false });
    return convo;
  };

  const getConversation = async (id: string): Promise<Conversation | null> => {
    const res = await fetch(`/api/conversations/${id}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversation;
  };

  const addMessage = async (conversationId: string, role: string, content: string) => {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role, content }),
    });
    if (!res.ok) throw new Error("Failed to add message");
    const data = await res.json();
    return data.message as ConversationMessage;
  };

  const deleteConversation = async (id: string) => {
    await mutate(
      async (current) => {
        const res = await fetch(`/api/conversations/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to delete conversation");
        return current?.filter((c) => c.id !== id) ?? [];
      },
      {
        optimisticData: (current) => current?.filter((c) => c.id !== id) ?? [],
        revalidate: false,
        rollbackOnError: true,
      },
    );
  };

  const updateTitle = async (id: string, title: string) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to update title");
    // Optimistic update — avoid refetching all conversations
    await mutate(
      (current) => current?.map((c) => (c.id === id ? { ...c, title } : c)) ?? [],
      { revalidate: false },
    );
  };

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
  };
}
