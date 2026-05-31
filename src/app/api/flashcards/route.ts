import prisma from "@/lib/prisma";
import { nonEmptyString, optionalString, validateJsonBody } from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";
import { z } from "zod";

const createFlashcardSchema = z.object({
  front: nonEmptyString("Front"),
  back: nonEmptyString("Back"),
  notes: optionalString,
});

const deleteFlashcardSchema = z.object({
  id: nonEmptyString("Flashcard ID"),
  deckId: nonEmptyString("Deck ID"),
});

const updateFlashcardSchema = z
  .object({
    id: nonEmptyString("Flashcard ID"),
    deckId: nonEmptyString("Deck ID"),
    front: nonEmptyString("Front").optional(),
    back: nonEmptyString("Back").optional(),
    notes: optionalString,
  })
  .refine(
    (data) => data.front !== undefined || data.back !== undefined || data.notes !== undefined,
    {
      message: "No editable flashcard fields provided",
    },
  );

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

async function verifyDeckOwnership(deckId: string, userId: string): Promise<boolean> {
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
  return deck !== null;
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId");

    if (!deckId) {
      return new Response("Deck ID is required", { status: 400 });
    }

    if (!(await verifyDeckOwnership(deckId, userId))) {
      return new Response("Deck not found", { status: 404 });
    }

    const flashcards = await prisma.flashcard.findMany({ where: { deckId } });

    return new Response(JSON.stringify(flashcards), { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get("deckId");

    if (!deckId) {
      return new Response("Deck ID is required", { status: 400 });
    }

    if (!(await verifyDeckOwnership(deckId, userId))) {
      return new Response("Deck not found", { status: 404 });
    }

    const body = await validateJsonBody(request, createFlashcardSchema);
    if (!body.success) return body.response;

    const { front, back, notes } = body.data;

    const flashcard = await prisma.flashcard.create({
      data: {
        front,
        back,
        notes,
        deck: { connect: { id: deckId } },
      },
    });

    return new Response(JSON.stringify(flashcard), { status: 201 });
  } catch (error) {
    console.error("Prisma error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, deleteFlashcardSchema);
    if (!body.success) return body.response;

    const { id, deckId } = body.data;

    if (!(await verifyDeckOwnership(deckId, userId))) {
      return new Response("Deck not found", { status: 404 });
    }

    const flashcard = await prisma.flashcard.findFirst({
      where: { id, deckId },
    });

    if (!flashcard) {
      return new Response("Flashcard not found in this deck", { status: 404 });
    }

    await prisma.$transaction([
      prisma.cardReview.deleteMany({ where: { flashcardId: id } }),
      prisma.flashcard.delete({ where: { id } }),
    ]);

    return new Response("Flashcard deleted!", { status: 200 });
  } catch (error) {
    console.error("Delete flashcard error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, updateFlashcardSchema);
    if (!body.success) return body.response;

    const { id, deckId, front, back, notes } = body.data;

    if (!(await verifyDeckOwnership(deckId, userId))) {
      return new Response("Deck not found", { status: 404 });
    }

    const updateData: { front?: string; back?: string; notes?: string | null } = {};
    if (front !== undefined) updateData.front = front;
    if (back !== undefined) updateData.back = back;
    if (notes !== undefined) updateData.notes = notes;

    const flashcard = await prisma.flashcard.update({
      where: { id, deckId },
      data: updateData,
    });

    return new Response(JSON.stringify(flashcard), { status: 200 });
  } catch (error) {
    console.error("Update flashcard error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
