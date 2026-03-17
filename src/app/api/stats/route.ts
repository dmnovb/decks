import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch all decks with flashcards
    const decks = await prisma.deck.findMany({
      where: { userId },
      include: { flashcards: true },
    });

    // Fetch recent study sessions
    const sessions = await prisma.studySession.findMany({
      where: { userId, startedAt: { gte: ninetyDaysAgo } },
      orderBy: { startedAt: "asc" },
    });

    // Aggregate flashcard stats
    const allCards = decks.flatMap((d) => d.flashcards);
    const totalCards = allCards.length;
    const totalReviews = allCards.reduce((s, c) => s + c.totalReviews, 0);
    const totalCorrect = allCards.reduce((s, c) => s + c.correctReviews, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    const bestStreak = Math.max(0, ...allCards.map((c) => c.streak));
    const dueNow = allCards.filter((c) => c.nextReview && new Date(c.nextReview) <= now).length;

    // Difficulty buckets
    const difficultyBuckets = {
      new: allCards.filter((c) => c.totalReviews === 0).length,
      hard: allCards.filter((c) => c.totalReviews > 0 && c.difficulty <= 2).length,
      learning: allCards.filter((c) => c.totalReviews > 0 && c.difficulty === 3).length,
      good: allCards.filter((c) => c.totalReviews > 0 && c.difficulty >= 4).length,
    };

    // Per-deck stats
    const deckStats = decks
      .map((deck) => {
        const cards = deck.flashcards;
        const deckReviews = cards.reduce((s, c) => s + c.totalReviews, 0);
        const deckCorrect = cards.reduce((s, c) => s + c.correctReviews, 0);
        const deckAccuracy = deckReviews > 0 ? Math.round((deckCorrect / deckReviews) * 100) : 0;
        const avgInterval =
          cards.length > 0
            ? Math.round(cards.reduce((s, c) => s + c.interval, 0) / cards.length)
            : 0;
        const dueCount = cards.filter((c) => c.nextReview && new Date(c.nextReview) <= now).length;
        return {
          id: deck.id,
          title: deck.title,
          cards: cards.length,
          accuracy: deckAccuracy,
          avgInterval,
          dueCount,
        };
      })
      .sort((a, b) => b.dueCount - a.dueCount);

    // Session history (last 20 completed sessions)
    const sessionHistory = sessions
      .filter((s) => s.completedAt !== null)
      .slice(-20)
      .map((s) => {
        const total = s.correctCount + s.wrongCount;
        return {
          date: s.startedAt.toISOString(),
          accuracy: total > 0 ? Math.round((s.correctCount / total) * 100) : 0,
          cardCount: s.totalCards,
        };
      });

    // Heatmap — last 84 days (12 weeks)
    const heatmapMap: Record<string, number> = {};
    for (const s of sessions) {
      const dateKey = s.startedAt.toISOString().slice(0, 10);
      heatmapMap[dateKey] = (heatmapMap[dateKey] ?? 0) + 1;
    }
    const heatmap: { date: string; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      heatmap.push({ date: key, count: heatmapMap[key] ?? 0 });
    }

    return Response.json({
      totalCards,
      totalReviews,
      accuracy,
      bestStreak,
      dueNow,
      difficultyBuckets,
      deckStats,
      sessionHistory,
      heatmap,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
