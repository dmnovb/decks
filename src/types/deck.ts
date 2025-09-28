export interface Deck {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  user?: any; // create a type for this
  flashcards?: any; // create a type for this
}
