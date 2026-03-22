export interface Deck {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  folderId?: string | null;
  user?: any; // create a type for this
  flashcards?: any; // create a type for this
}

export interface Folder {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  parentId?: string | null;
  children?: Folder[];
  decks?: Deck[];
}
