"use client";

import { createContext, useContext, useRef, useCallback } from "react";

interface ChatState {
  conversationId: string | null;
  draft: string;
  scrollTop: number;
}

interface ChatStateContextValue {
  getState: () => ChatState;
  saveState: (state: Partial<ChatState>) => void;
}

const ChatStateContext = createContext<ChatStateContextValue | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<ChatState>({
    conversationId: null,
    draft: "",
    scrollTop: 0,
  });

  const getState = useCallback(() => stateRef.current, []);
  const saveState = useCallback((partial: Partial<ChatState>) => {
    stateRef.current = { ...stateRef.current, ...partial };
  }, []);

  return (
    <ChatStateContext.Provider value={{ getState, saveState }}>
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState() {
  const ctx = useContext(ChatStateContext);
  if (!ctx) throw new Error("useChatState must be used within ChatStateProvider");
  return ctx;
}
