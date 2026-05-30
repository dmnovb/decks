import { Flashcard } from "@/generated/prisma";
import { useCallback, useReducer, useState } from "react";
import { applySessionConfig, SessionConfig } from "@/utils/card-filters";
import useUpdateFlashcard from "./use-update-flashcard";
import { toast } from "sonner";

export interface CardResult {
  flashcardId: string;
  quality: number;
  timeSpent: number;
}

interface SessionState {
  config: SessionConfig;
  deckId: string;
  sessionId: string | null;
  cards: Flashcard[];
  currentIndex: number;
  startTime: Date | null;
  completedCards: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  bestStreak: number;
  showBack: boolean;
  cardStartTime: number | null;
  cardResults: CardResult[];
  isActive: boolean;
  isCompleted: boolean;
}

type SessionAction =
  | {
      type: "START_SESSION";
      cards: Flashcard[];
      config: SessionConfig;
      deckId: string;
      sessionId: string;
    }
  | { type: "FLIP_CARD" }
  | { type: "RATE_CARD"; quality: number; timeSpent: number }
  | { type: "NEXT_CARD" }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" };

const initialState: SessionState = {
  config: {},
  deckId: "",
  sessionId: null,
  cards: [],
  currentIndex: 0,
  startTime: null,
  completedCards: 0,
  correctCount: 0,
  wrongCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  showBack: false,
  cardStartTime: null,
  cardResults: [],
  isActive: false,
  isCompleted: false,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...initialState,
        config: action.config,
        deckId: action.deckId,
        sessionId: action.sessionId,
        cards: action.cards,
        startTime: new Date(),
        isActive: true,
        cardStartTime: Date.now(),
      };

    case "FLIP_CARD":
      return {
        ...state,
        showBack: !state.showBack,
      };

    case "RATE_CARD": {
      const isCorrect = action.quality >= 3;
      const newStreak = isCorrect ? state.currentStreak + 1 : 0;

      return {
        ...state,
        completedCards: state.completedCards + 1,
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        wrongCount: isCorrect ? state.wrongCount : state.wrongCount + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, state.bestStreak),
        cardResults: [
          ...state.cardResults,
          {
            flashcardId: state.cards[state.currentIndex].id,
            quality: action.quality,
            timeSpent: action.timeSpent,
          },
        ],
      };
    }

    case "NEXT_CARD":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        showBack: false,
        cardStartTime: Date.now(),
      };

    case "COMPLETE_SESSION":
      return {
        ...state,
        isActive: false,
        isCompleted: true,
      };

    case "RESET_SESSION":
      return initialState;

    default:
      return state;
  }
}

export interface UseStudySessionReturn {
  sessionState: SessionState;
  currentCard: Flashcard | null;
  startSession: (allCards: Flashcard[], config: SessionConfig, deckId: string) => Promise<void>;
  flipCard: () => void;
  rateCard: (quality: number) => Promise<void>;
  endSession: () => Promise<void>;
  resetSession: () => void;
  isLoading: boolean;
  accuracy: number;
  progress: number;
  elapsedTime: number;
}

export function useStudySession(): UseStudySessionReturn {
  const [sessionState, dispatch] = useReducer(sessionReducer, initialState);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const { updateFlashcard, isLoading: isUpdatingCard } = useUpdateFlashcard();

  const completeSession = useCallback(async (sessionId: string) => {
    const response = await fetch("/api/study-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: sessionId }),
    });

    if (!response.ok) {
      throw new Error("Failed to complete study session");
    }
  }, []);

  const startSession = useCallback(
    async (allCards: Flashcard[], config: SessionConfig, deckId: string) => {
      const filteredCards = applySessionConfig(allCards, config);
      if (filteredCards.length === 0) {
        toast.error("No cards available for this session.");
        return;
      }

      setIsSessionLoading(true);
      try {
        const response = await fetch("/api/study-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            deckId,
            cardIds: filteredCards.map((card) => card.id),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start study session");
        }

        const { session } = await response.json();
        dispatch({
          type: "START_SESSION",
          cards: filteredCards,
          config,
          deckId,
          sessionId: session.id,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start study session");
        throw error;
      } finally {
        setIsSessionLoading(false);
      }
    },
    [],
  );

  const flipCard = useCallback(() => {
    dispatch({ type: "FLIP_CARD" });
  }, []);

  const rateCard = useCallback(
    async (quality: number) => {
      const currentCard = sessionState.cards[sessionState.currentIndex];
      if (!currentCard || !sessionState.sessionId || isUpdatingCard || isSessionLoading) return;

      const timeSpent = sessionState.cardStartTime ? Date.now() - sessionState.cardStartTime : 0;

      try {
        await updateFlashcard({
          flashcard: currentCard,
          sessionId: sessionState.sessionId,
          quality,
          timeSpent,
        });

        dispatch({ type: "RATE_CARD", quality, timeSpent });

        if (sessionState.currentIndex >= sessionState.cards.length - 1) {
          setIsSessionLoading(true);
          try {
            await completeSession(sessionState.sessionId);
          } catch (error) {
            console.error("Failed to complete session:", error);
            toast.error("Session reviews were saved, but completion failed.");
          } finally {
            setIsSessionLoading(false);
          }
          dispatch({ type: "COMPLETE_SESSION" });
        } else {
          dispatch({ type: "NEXT_CARD" });
        }
      } catch (error) {
        console.error("Failed to save card review:", error);
      }
    },
    [completeSession, isSessionLoading, isUpdatingCard, sessionState, updateFlashcard],
  );

  const endSession = useCallback(async () => {
    if (sessionState.sessionId) {
      setIsSessionLoading(true);
      try {
        await completeSession(sessionState.sessionId);
      } catch (error) {
        console.error("Failed to complete session:", error);
        toast.error("Session completion failed.");
      } finally {
        setIsSessionLoading(false);
      }
    }

    dispatch({ type: "COMPLETE_SESSION" });
  }, [completeSession, sessionState.sessionId]);

  const resetSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
  }, []);

  const currentCard =
    sessionState.isActive && sessionState.currentIndex < sessionState.cards.length
      ? sessionState.cards[sessionState.currentIndex]
      : null;

  const accuracy =
    sessionState.completedCards > 0
      ? (sessionState.correctCount / sessionState.completedCards) * 100
      : 0;

  const progress =
    sessionState.cards.length > 0
      ? (sessionState.completedCards / sessionState.cards.length) * 100
      : 0;

  const elapsedTime = sessionState.startTime
    ? Math.floor((Date.now() - sessionState.startTime.getTime()) / 1000)
    : 0;

  return {
    sessionState,
    currentCard,
    startSession,
    flipCard,
    rateCard,
    endSession,
    resetSession,
    isLoading: isUpdatingCard || isSessionLoading,
    accuracy,
    progress,
    elapsedTime,
  };
}
