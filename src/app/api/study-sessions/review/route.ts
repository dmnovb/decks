import prisma from "@/lib/prisma";
import { nonEmptyString, validateJsonBody } from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { sm2 } from "@/utils/sm2";
import { NextRequest } from "next/server";
import { z } from "zod";

const createCardReviewSchema = z.object({
  sessionId: nonEmptyString("Session ID"),
  flashcardId: nonEmptyString("Flashcard ID"),
  quality: z
    .number()
    .int("Quality must be an integer from 0 to 5")
    .min(0, "Quality must be an integer from 0 to 5")
    .max(5, "Quality must be an integer from 0 to 5"),
  timeSpent: z
    .number()
    .finite()
    .nonnegative("Time spent must be a non-negative number")
    .optional()
    .default(0),
});

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, createCardReviewSchema);
    if (!body.success) return body.response;

    const { sessionId, flashcardId, quality, timeSpent } = body.data;

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.studySession.findFirst({
        where: { id: sessionId, userId, completedAt: null },
        select: { id: true },
      });

      if (!session) {
        return { status: 404 as const, message: "Session not found" };
      }

      const sessionCard = await tx.studySessionCard.findUnique({
        where: { sessionId_flashcardId: { sessionId, flashcardId } },
        include: { flashcard: true },
      });

      if (!sessionCard) {
        return { status: 400 as const, message: "Flashcard was not selected for this session" };
      }

      const claimedCard = await tx.studySessionCard.updateMany({
        where: { sessionId, flashcardId, reviewedAt: null },
        data: { reviewedAt: now },
      });

      if (claimedCard.count !== 1) {
        return { status: 409 as const, message: "Flashcard already reviewed in this session" };
      }

      const flashcard = sessionCard.flashcard;
      const { interval, repetitions, easeFactor } = sm2(
        quality,
        flashcard.repetitions,
        flashcard.interval,
        flashcard.easeFactor,
      );
      const isCorrect = quality >= 3;

      await tx.cardReview.create({
        data: {
          sessionId,
          flashcardId,
          quality,
          timeSpent: Math.round(timeSpent),
        },
      });

      const updatedFlashcard = await tx.flashcard.update({
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

      return { status: 200 as const, flashcard: updatedFlashcard };
    });

    if (result.status !== 200) {
      return Response.json({ message: result.message }, { status: result.status });
    }

    return Response.json({ success: true, flashcard: result.flashcard });
  } catch (error) {
    console.error("Create card review error:", error);
    return Response.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
