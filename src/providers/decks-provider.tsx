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

interface State {
  decks: Deck[];
}

type Action =
  | { type: "ADD"; deck: Deck }
  | { type: "SET"; decks: Deck[] }
  | { type: "DELETE"; id: string }
  | { type: "ADD_FLASHCARD"; deckId: string, flashcard: Flashcard };

const initialState: State = {
  decks: [],
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        decks: [...state.decks, action.deck],
      };

    case "SET":
      return {
        ...state,
        decks: action.decks,
      };
    case "DELETE":
      return {
        ...state,
        decks: state.decks.filter((deck) => deck.id !== action.id),
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
    default:
      return state;
  }
};

interface DecksContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  error: null;
}

export const DecksContext = createContext<DecksContextValue>({
  state: initialState,
  dispatch: () => undefined,
  isLoading: false,
  error: null,
});

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

export const DecksProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { data, error, isLoading } = useSWR<Deck[]>("/api/decks", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: 0,
    revalidateOnReconnect: false
  });

  useEffect(() => {
    if (data) dispatch({ type: "SET", decks: data });
  }, [data, dispatch]);

  return (
    <DecksContext.Provider value={{ state, dispatch, error, isLoading }}>
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
