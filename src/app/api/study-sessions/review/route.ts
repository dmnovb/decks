import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { sm2 } from "@/utils/sm2";
import { NextRequest } from "next/server";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

function toQuality(value: unknown) {
  const quality = Number(value);
  return Number.isInteger(quality) && quality >= 0 && quality <= 5 ? quality : null;
}

function toNonNegativeInt(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number);
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { sessionId, flashcardId, quality: rawQuality, timeSpent } = await request
      .json()
      .catch(() => ({}));
    const quality = toQuality(rawQuality);

    if (typeof sessionId !== "string" || !sessionId) {
      return Response.json({ message: "Session ID is required" }, { status: 400 });
    }

    if (typeof flashcardId !== "string" || !flashcardId) {
      return Response.json({ message: "Flashcard ID is required" }, { status: 400 });
    }

    if (quality === null) {
      return Response.json({ message: "Quality must be an integer from 0 to 5" }, { status: 400 });
    }

    const session = await prisma.studySession.findFirst({
      where: { id: sessionId, userId, completedAt: null },
      select: { id: true, deckId: true },
    });

    if (!session) {
      return Response.json({ message: "Session not found" }, { status: 404 });
    }

    const flashcard = await prisma.flashcard.findFirst({
      where: { id: flashcardId, deckId: session.deckId },
    });

    if (!flashcard) {
      return Response.json({ message: "Flashcard not found in this session deck" }, { status: 404 });
    }

    const { interval, repetitions, easeFactor } = sm2(
      quality,
      flashcard.repetitions,
      flashcard.interval,
      flashcard.easeFactor,
    );
    const now = new Date();
    const isCorrect = quality >= 3;

    const updatedFlashcard = await prisma.$transaction(async (tx) => {
      await tx.cardReview.create({
        data: {
          sessionId,
          flashcardId,
          quality,
          timeSpent: toNonNegativeInt(timeSpent),
        },
      });

      return tx.flashcard.update({
        where: { id: flashcard.id },
        data: {
          difficulty: quality,
          interval,
          repetitions,
          easeFactor,
          lastReviewed: now,
          nextReview: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000),
          streak: isCorrect ? flashcard.streak + 1 : 0,
          totalReviews: flashcard.totalReviews + 1,
          correctReviews: flashcard.correctReviews + (isCorrect ? 1 : 0),
        },
      });
    });

    return Response.json({ success: true, flashcard: updatedFlashcard });
  } catch (error) {
    console.error("Create card review error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
