"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import {
  useConversations,
  ConversationMessage,
} from "@/hooks/use-conversations";
import { useDecks } from "@/providers/decks-provider";
import { toast } from "sonner";
import { Message } from "@/components/chat/message";
import { StarIcon } from "@/icons";
import { useChatState } from "@/providers/chat-state-provider";
import {
  ArrowUp,
  ChevronDown,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";

const GREETING: UIMessage = {
  id: "greeting",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi! I'm Ace, your language learning assistant. I can help you create flashcard decks, generate practice materials, and answer questions. What would you like to learn today?",
    },
  ],
};

/** Extract text content from a UIMessage's parts. */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const Chat = () => {
  const { refreshDecks } = useDecks();
  const {
    conversations,
    createConversation,
    getConversation,
    deleteConversation,
  } = useConversations();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  // Track inputValue in a ref so unmount cleanup can read the latest value
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  // Holds a scroll position to restore after messages load (used once, then cleared)
  const pendingScrollRef = useRef<number | null>(null);

  const { getState, saveState } = useChatState();

  // Lazy-init: if there's a saved conversation, start hidden so we never flash the empty state
  const [isRestoring, setIsRestoring] = useState(() => getState().conversationId !== null);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
      body: () => ({ conversationId: conversationIdRef.current }),
    }),
    messages: [GREETING],
    onFinish: async () => {
      await refreshDecks();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to process your request.");
    },
  });

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted" || isStreaming;

  // --- Scroll shadows ---
  const updateShadows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowTopShadow(el.scrollTop > 8);
    setShowBottomShadow(
      el.scrollTop + el.clientHeight < el.scrollHeight - 8,
    );
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateShadows, { passive: true });
    updateShadows();
    return () => el.removeEventListener("scroll", updateShadows);
  }, [updateShadows]);

  useEffect(() => {
    updateShadows();
  }, [messages, updateShadows]);

  useEffect(() => {
    if (isStreaming) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    if (pendingScrollRef.current !== null) {
      el.scrollTop = pendingScrollRef.current;
      pendingScrollRef.current = null;
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    const tick = () => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      scrollRafRef.current = requestAnimationFrame(tick);
    };
    scrollRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [isStreaming]);

  // --- Chat state persistence (survives SPA navigation) ---
  // Restore on mount
  useEffect(() => {
    const saved = getState();
    if (saved.draft) setInputValue(saved.draft);
    if (saved.conversationId) {
      pendingScrollRef.current = saved.scrollTop;
      loadConversation(saved.conversationId).then(() => setIsRestoring(false));
    }
    // Save on unmount
    return () => {
      saveState({
        conversationId: conversationIdRef.current,
        draft: inputValueRef.current,
        scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Conversation management ---
  const loadConversation = useCallback(
    async (id: string) => {
      const conversation = await getConversation(id);
      if (conversation?.messages) {
        const loaded: UIMessage[] = conversation.messages.map(
          (msg: ConversationMessage) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: msg.content }],
          }),
        );
        setMessages(
          loaded.length === 0 || loaded[0].role !== "assistant"
            ? [GREETING, ...loaded]
            : loaded,
        );
        setConversationId(id);
      }
    },
    [getConversation, setMessages],
  );

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([GREETING]);
    setInputValue("");
  }, [setMessages]);

  const handleDeleteConversation = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        await deleteConversation(id);
        if (conversationId === id) startNewConversation();
        toast.success("Conversation deleted");
      } catch {
        toast.error("Failed to delete conversation");
      }
    },
    [deleteConversation, conversationId, startNewConversation],
  );

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    let activeConvoId = conversationId;
    if (!activeConvoId) {
      try {
        const title =
          trimmed.slice(0, 50) + (trimmed.length > 50 ? "..." : "");
        const newConvo = await createConversation(title);
        activeConvoId = newConvo.id;
        setConversationId(activeConvoId);
        conversationIdRef.current = activeConvoId;
      } catch {
        toast.error("Failed to create conversation");
        return;
      }
    }

    setInputValue("");
    sendMessage({ text: trimmed });
  }, [inputValue, isLoading, conversationId, createConversation, sendMessage]);

  const currentConversation = conversations.find(
    (c) => c.id === conversationId,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Ace</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your language learning companion
          </p>
        </div>

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
      <div className="relative flex-1 min-h-0">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-12 z-10 transition-opacity duration-300"
          style={{
            opacity: showTopShadow ? 1 : 0,
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
          }}
        />

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto px-8 py-6 flex flex-col gap-4 transition-opacity duration-300"
          style={{ opacity: isRestoring ? 0 : 1 }}
        >
          {messages.map((message) => {
            if (message.role !== "user" && message.role !== "assistant")
              return null;
            const text = getMessageText(message);
            if (!text) return null;

            const isLastAssistant =
              message.role === "assistant" &&
              message.id ===
                messages.filter((m) => m.role === "assistant").pop()?.id;

            return (
              <Message
                key={message.id}
                role={message.role}
                content={text}
                isStreaming={isStreaming && !!isLastAssistant}
              />
            );
          })}

          {/* Loading indicator when waiting for first token */}
          {status === "submitted" && (
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
                  style={{
                    animationDelay: "180ms",
                    animationDuration: "1s",
                  }}
                />
                <span
                  className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                  style={{
                    animationDelay: "360ms",
                    animationDuration: "1s",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 z-10 transition-opacity duration-300"
          style={{
            opacity: showBottomShadow ? 1 : 0,
            background:
              "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="px-8 py-4 border-t border-border shrink-0"
      >
        <div className="flex items-end gap-2 bg-background-2 border border-divider-1 rounded-sm px-3 py-2 focus-within:border-divider-2 transition-colors">
          <textarea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Chat with Ace…"
            disabled={isLoading}
            autoFocus
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm outline-none placeholder:text-muted-foreground/50 min-h-[24px] max-h-[120px] py-0.5 leading-relaxed"
          />
          <Button
            type="submit"
            size="sm"
            variant="default"
            disabled={isLoading || !inputValue.trim()}
            className="shrink-0 h-7 w-7 p-0 rounded-sm"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-500">{String(error)}</div>
        )}
      </form>
    </div>
  );
};

export default Chat;
