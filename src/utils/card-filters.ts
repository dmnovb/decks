import { Flashcard } from "@/generated/prisma";

/**
 * Check if a card is due for review
 */
export function isCardDue(card: Flashcard): boolean {
  if (!card.nextReview) return true; // Never reviewed = due
  return new Date(card.nextReview) <= new Date();
}

/**
 * Check if a card is new (never reviewed)
 */
export function isCardNew(card: Flashcard): boolean {
  return card.lastReviewed === null;
}

/**
 * Filter cards that are due for review
 */
export function filterDueCards(cards: Flashcard[]): Flashcard[] {
  return cards.filter(isCardDue);
}

/**
 * Filter new cards with optional limit
 */
export function filterNewCards(
  cards: Flashcard[],
  limit?: number
): Flashcard[] {
  const newCards = cards.filter(isCardNew);
  return limit ? newCards.slice(0, limit) : newCards;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sort cards by next review date (overdue first)
 */
export function sortByDueDate(cards: Flashcard[]): Flashcard[] {
  return [...cards].sort((a, b) => {
    // Cards without nextReview go first (new cards)
    if (!a.nextReview) return -1;
    if (!b.nextReview) return 1;

    // Sort by next review date (earlier = more overdue)
    return (
      new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
    );
  });
}

/**
 * Sort cards by difficulty (hardest first)
 */
export function sortByDifficulty(cards: Flashcard[]): Flashcard[] {
  return [...cards].sort((a, b) => {
    // Lower easeFactor = harder card
    return a.easeFactor - b.easeFactor;
  });
}

export interface SessionConfig {
  maxCards?: number; // Limit total cards in session
  maxNewCards?: number; // Limit new cards per session
  dueOnly?: boolean; // Only show cards due today
  shuffled?: boolean; // Randomize card order
  sortBy?: "dueDate" | "difficulty" | "random"; // Sort order
}

/**
 * Apply session configuration to filter and sort cards
 */
export function applySessionConfig(
  allCards: Flashcard[],
  config: SessionConfig
): Flashcard[] {
  let cards = [...allCards];

  // Step 1: Filter by due status if requested
  if (config.dueOnly) {
    cards = filterDueCards(cards);
  }

  // Step 2: Separate new and review cards for new card limit
  const newCards = cards.filter(isCardNew);
  const reviewCards = cards.filter((c) => !isCardNew(c));

  // Apply new card limit
  const limitedNewCards = config.maxNewCards
    ? newCards.slice(0, config.maxNewCards)
    : newCards;

  // Recombine
  cards = [...limitedNewCards, ...reviewCards];

  // Step 3: Sort cards
  if (config.sortBy === "dueDate") {
    cards = sortByDueDate(cards);
  } else if (config.sortBy === "difficulty") {
    cards = sortByDifficulty(cards);
  } else if (config.sortBy === "random" || config.shuffled) {
    cards = shuffleCards(cards);
  }

  // Step 4: Apply total card limit
  if (config.maxCards) {
    cards = cards.slice(0, config.maxCards);
  }

  return cards;
}
