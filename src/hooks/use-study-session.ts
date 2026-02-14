import { Flashcard } from "@/generated/prisma";
import { useReducer, useCallback, useEffect } from "react";
import { applySessionConfig, SessionConfig } from "@/utils/card-filters";
import useUpdateFlashcard from "./use-update-flashcard";
import { sm2 } from "@/utils/sm2";

export interface CardResult {
  flashcardId: string;
  quality: number;
  timeSpent: number; // milliseconds
}

interface SessionState {
  // Configuration
  config: SessionConfig;
  deckId: string;

  // Card queue
  cards: Flashcard[];
  currentIndex: number;

  // Session statistics
  startTime: Date | null;
  completedCards: number;
  correctCount: number; // quality >= 3
  wrongCount: number; // quality < 3
  currentStreak: number;
  bestStreak: number;

  // Card state
  showBack: boolean;
  cardStartTime: number | null; // Timestamp when current card was shown

  // Session results
  cardResults: CardResult[];

  // Status
  isActive: boolean;
  isCompleted: boolean;
}

type SessionAction =
  | { type: "START_SESSION"; cards: Flashcard[]; config: SessionConfig; deckId: string }
  | { type: "FLIP_CARD" }
  | { type: "RATE_CARD"; quality: number; timeSpent: number }
  | { type: "NEXT_CARD" }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" };

const initialState: SessionState = {
  config: {},
  deckId: "",
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

function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...initialState,
        config: action.config,
        deckId: action.deckId,
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
        correctCount: isCorrect
          ? state.correctCount + 1
          : state.correctCount,
        wrongCount: !isCorrect ? state.wrongCount + 1 : state.wrongCount,
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
  startSession: (
    allCards: Flashcard[],
    config: SessionConfig,
    deckId: string
  ) => void;
  flipCard: () => void;
  rateCard: (quality: number) => Promise<void>;
  endSession: () => void;
  resetSession: () => void;
  isLoading: boolean;
  accuracy: number;
  progress: number;
  elapsedTime: number; // seconds
}

export function useStudySession(): UseStudySessionReturn {
  const [sessionState, dispatch] = useReducer(sessionReducer, initialState);
  const { updateFlashcard, isLoading } = useUpdateFlashcard();

  // Start a new session with filtered/sorted cards
  const startSession = useCallback(
    (allCards: Flashcard[], config: SessionConfig, deckId: string) => {
      const filteredCards = applySessionConfig(allCards, config);
      dispatch({
        type: "START_SESSION",
        cards: filteredCards,
        config,
        deckId,
      });
    },
    []
  );

  // Flip the current card
  const flipCard = useCallback(() => {
    dispatch({ type: "FLIP_CARD" });
  }, []);

  // Rate the current card and move to next
  const rateCard = useCallback(
    async (quality: number) => {
      const currentCard = sessionState.cards[sessionState.currentIndex];
      if (!currentCard) return;

      // Calculate time spent on this card
      const timeSpent = sessionState.cardStartTime
        ? Date.now() - sessionState.cardStartTime
        : 0;

      // Apply SM2 algorithm
      const { interval, repetitions, easeFactor } = sm2(
        quality,
        currentCard.repetitions,
        currentCard.interval,
        currentCard.easeFactor
      );

      // Prepare updated card data
      const updatedCard: Flashcard = {
        ...currentCard,
        difficulty: quality,
        interval,
        repetitions,
        easeFactor,
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
      };

      // Record rating in session state
      dispatch({ type: "RATE_CARD", quality, timeSpent });

      try {
        // Persist to database (hook handles statistics calculation)
        await updateFlashcard({
          flashcard: updatedCard,
          quality,
        });

        // Check if this was the last card
        if (sessionState.currentIndex >= sessionState.cards.length - 1) {
          dispatch({ type: "COMPLETE_SESSION" });
        } else {
          // Move to next card
          dispatch({ type: "NEXT_CARD" });
        }
      } catch (error) {
        // Error already handled by hook with toast
        // Don't advance to next card on error
        console.error("Failed to save card:", error);
      }
    },
    [sessionState, updateFlashcard]
  );

  // End session early
  const endSession = useCallback(() => {
    dispatch({ type: "COMPLETE_SESSION" });
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    dispatch({ type: "RESET_SESSION" });
  }, []);

  // Calculated properties
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
    isLoading,
    accuracy,
    progress,
    elapsedTime,
  };
}
