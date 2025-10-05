"use client";

import { Flashcard } from "@/generated/prisma";
import { Deck } from "@/types/deck";
import {
  createContext,
  useContext,
  useReducer,
  Dispatch,
  PropsWithChildren,
  useEffect,
} from "react";
import useSWR from "swr";
import { useAuth } from "./auth-provider";

interface State {
  decks: Deck[];
  selectedDeck: Deck | null;
}

type Action =
  | { type: "ADD"; deck: Deck }
  | { type: "SET"; decks: Deck[] }
  | { type: "DELETE"; id: string }
  | { type: "SELECT"; deckId: string }
  | { type: "ADD_FLASHCARD"; deckId: string, flashcard: Flashcard }
  | { type: "DELETE_FLASHCARD"; deckId: string; flashcardId: Flashcard['id'] }
  | { type: "UPDATE_FLASHCARD"; deckId: string; flashcard: Flashcard }

const initialState: State = {
  decks: [],
  selectedDeck: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        decks: [...state.decks, action.deck],
        selectedDeck: state.selectedDeck ? state.selectedDeck : action.deck,
      };

    case "SELECT":
      return {
        ...state,
        selectedDeck: state.decks.find((deck) => deck.id === action.deckId)!,
      };

    case "SET":
      return {
        ...state,
        decks: action.decks,
        selectedDeck: state.selectedDeck ? action.decks.find((deck) => deck.id === state.selectedDeck?.id) || null : null,
      };
    case "DELETE":
      const deletedDeckIndex = state.decks.findIndex((deck) => deck.id === action.id);
      const filteredDecks = state.decks.filter((deck) => deck.id !== action.id);

      let newSelectedDeck = state.selectedDeck;

      if (state.selectedDeck?.id === action.id) {
        if (filteredDecks.length === 0) {
          newSelectedDeck = null;
        } else if (deletedDeckIndex < filteredDecks.length) {
          newSelectedDeck = filteredDecks[deletedDeckIndex];
        } else {
          newSelectedDeck = filteredDecks[filteredDecks.length - 1];
        }
      }

      return {
        ...state,
        decks: filteredDecks,
        selectedDeck: newSelectedDeck,
      };

    case "ADD_FLASHCARD":
      return {
        ...state,
        decks: state.decks.map(deck =>
          deck.id === action.deckId
            ? { ...deck, flashcards: [...(deck.flashcards || []), action.flashcard] }
            : deck
        )
      }
    case "DELETE_FLASHCARD":
      return {
        ...state,
        decks: state.decks.map((deck) =>
          deck.id === action.deckId
            ? { ...deck, flashcards: deck.flashcards.filter((card: Flashcard) => card.id !== action.flashcardId) }
            : deck
        )
      }
    case "UPDATE_FLASHCARD":
      return {
        ...state,
        decks: state.decks.map((deck) =>
          deck.id === action.deckId ? { ...deck, flashcards: deck.flashcards.map((card: Flashcard) => card.id === action.flashcard.id ? action.flashcard : card) } : deck
        )
      }
    default:
      return state;
  }
};

interface DecksContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  error: null;
  refreshDecks: () => Promise<void>;
  selectDeck: (deckId: string) => void;
  selectedDeck: Deck | null;
}

export const DecksContext = createContext<DecksContextValue>({
  state: initialState,
  dispatch: () => undefined,
  isLoading: false,
  error: null,
  refreshDecks: async () => { },
  selectDeck: () => { },
  selectedDeck: null,
});

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

export const DecksProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState);

  const { data, error, isLoading, mutate } = useSWR<Deck[]>(`/api/decks?userId=${user?.id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: 0,
    revalidateOnReconnect: false
  });

  useEffect(() => {
    if (data) dispatch({ type: "SET", decks: data });
  }, [data, dispatch]);

  const refreshDecks = async () => {
    await mutate();
  };

  const selectDeck = (deckId: string) => {
    dispatch({ type: "SELECT", deckId });
  };

  return (
    <DecksContext.Provider value={{
      state,
      dispatch,
      error,
      isLoading,
      refreshDecks,
      selectDeck,
      selectedDeck: state.selectedDeck,
    }}
    >
      {children}
    </DecksContext.Provider>
  );
};

export const useDecks = () => {
  const context = useContext(DecksContext);
  if (!context) {
    throw new Error("useDecks must be used within a DecksProvider");
  }
  return context;
};
