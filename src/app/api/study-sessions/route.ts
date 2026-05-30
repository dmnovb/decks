import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

function parseCardIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const cardIds = value.filter((id): id is string => typeof id === "string" && id.length > 0);
  return cardIds.length === value.length ? [...new Set(cardIds)] : null;
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { deckId, cardIds: rawCardIds } = await request.json().catch(() => ({}));
    const cardIds = parseCardIds(rawCardIds);

    if (typeof deckId !== "string" || !deckId) {
      return Response.json({ message: "Deck ID is required" }, { status: 400 });
    }

    if (!cardIds) {
      return Response.json({ message: "Session cards are required" }, { status: 400 });
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId },
      select: { id: true },
    });

    if (!deck) {
      return Response.json({ message: "Deck not found" }, { status: 404 });
    }

    const cards = await prisma.flashcard.findMany({
      where: { id: { in: cardIds }, deckId },
      select: { id: true, lastReviewed: true },
    });

    if (cards.length !== cardIds.length) {
      return Response.json(
        { message: "One or more cards do not belong to this deck" },
        { status: 400 },
      );
    }

    const newCards = cards.filter((card) => card.lastReviewed === null).length;

    const session = await prisma.studySession.create({
      data: {
        userId,
        deckId,
        totalCards: cards.length,
        newCards,
        reviewCards: cards.length - newCards,
      },
      select: { id: true, startedAt: true },
    });

    return Response.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error("Create study session error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await request.json().catch(() => ({}));

    if (typeof id !== "string" || !id) {
      return Response.json({ message: "Session ID is required" }, { status: 400 });
    }

    const session = await prisma.studySession.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!session) {
      return Response.json({ message: "Session not found" }, { status: 404 });
    }

    const reviews = await prisma.cardReview.findMany({
      where: { sessionId: id },
      select: { quality: true, timeSpent: true },
    });

    if (reviews.length === 0) {
      await prisma.studySession.delete({ where: { id } });
      return Response.json({ success: true, session: null });
    }

    const correctCount = reviews.filter((review) => review.quality >= 3).length;
    const wrongCount = reviews.length - correctCount;
    const totalTime = Math.round(
      reviews.reduce((sum, review) => sum + review.timeSpent, 0) / 1000,
    );

    const updated = await prisma.studySession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        totalCards: reviews.length,
        correctCount,
        wrongCount,
        totalTime,
        averageTime: totalTime / reviews.length,
      },
      select: {
        id: true,
        completedAt: true,
        totalCards: true,
        correctCount: true,
        wrongCount: true,
      },
    });

    return Response.json({ success: true, session: updated });
  } catch (error) {
    console.error("Complete study session error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
