"use client";

import { Folder } from "@/types/deck";
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
  folders: Folder[];
}

type Action =
  | { type: "SET_FOLDERS"; folders: Folder[] }
  | { type: "ADD_FOLDER"; folder: Folder }
  | { type: "DELETE_FOLDER"; id: string }
  | { type: "UPDATE_FOLDER"; folder: Folder };

const initialState: State = {
  folders: [],
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_FOLDERS":
      return { ...state, folders: action.folders };

    case "ADD_FOLDER":
      return { ...state, folders: [...state.folders, action.folder] };

    case "DELETE_FOLDER":
      return {
        ...state,
        folders: state.folders.filter((f) => f.id !== action.id),
      };

    case "UPDATE_FOLDER":
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folder.id ? action.folder : f,
        ),
      };

    default:
      return state;
  }
};

interface FoldersContextValue {
  state: State;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  error: null;
  refreshFolders: () => Promise<void>;
}

export const FoldersContext = createContext<FoldersContextValue>({
  state: initialState,
  dispatch: () => undefined,
  isLoading: false,
  error: null,
  refreshFolders: async () => {},
});

const fetcher = (endpoint: string) => fetch(endpoint).then((r) => r.json());

export const FoldersProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const { data, error, isLoading, mutate } = useSWR<Folder[]>(
    user?.id ? `/api/folders` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
      revalidateOnReconnect: false,
    },
  );

  useEffect(() => {
    if (data) dispatch({ type: "SET_FOLDERS", folders: data });
  }, [data, dispatch]);

  const refreshFolders = async () => {
    await mutate();
  };

  return (
    <FoldersContext.Provider
      value={{ state, dispatch, error, isLoading, refreshFolders }}
    >
      {children}
    </FoldersContext.Provider>
  );
};

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
};
