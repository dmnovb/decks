import prisma from "@/lib/prisma";
import { nonEmptyString, optionalId, optionalString, validateJsonBody } from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { validateOptionalFolder } from "@/lib/ownership";
import { NextRequest } from "next/server";
import { z } from "zod";

const createDeckSchema = z.object({
  title: nonEmptyString("Deck title"),
  description: optionalString,
  folderId: optionalId,
});

const updateDeckSchema = z.object({
  id: nonEmptyString("Deck ID"),
  title: nonEmptyString("Deck title").optional(),
  description: optionalString,
  folderId: optionalId,
});

const deleteDeckSchema = z.object({
  id: nonEmptyString("Deck ID"),
});

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
    const decks = await prisma.deck.findMany({
      include: { flashcards: true },
      where: { userId },
    });
    return new Response(JSON.stringify(decks), { status: 200 });
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
    const body = await validateJsonBody(request, createDeckSchema);
    if (!body.success) return body.response;

    const { title, description, folderId } = body.data;

    const folderValidation = await validateOptionalFolder(folderId, userId);
    if (folderValidation) {
      return new Response(folderValidation.error, { status: folderValidation.status });
    }

    const ownedFolderId = folderId ?? null;
    const deck = await prisma.deck.create({
      data: { title, description, folderId: ownedFolderId, userId },
    });

    return new Response(JSON.stringify(deck), { status: 201 });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, updateDeckSchema);
    if (!body.success) return body.response;

    const { id, folderId, title, description } = body.data;

    const [deck, folderValidation] = await Promise.all([
      prisma.deck.findFirst({ where: { id, userId } }),
      validateOptionalFolder(folderId, userId),
    ]);
    if (!deck) {
      return new Response("Deck not found", { status: 404 });
    }
    if (folderValidation) {
      return new Response(folderValidation.error, { status: folderValidation.status });
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: {
        ...(folderId !== undefined && { folderId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Update deck error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, deleteDeckSchema);
    if (!body.success) return body.response;

    const { id } = body.data;

    const deck = await prisma.deck.findFirst({ where: { id, userId } });
    if (!deck) {
      return new Response("Deck not found", { status: 404 });
    }

    await prisma.$transaction([
      prisma.cardReview.deleteMany({ where: { flashcard: { deckId: id } } }),
      prisma.studySession.deleteMany({ where: { deckId: id } }),
      prisma.flashcard.deleteMany({ where: { deckId: id } }),
      prisma.deck.delete({ where: { id } }),
    ]);

    return new Response("Deck deleted!", { status: 200 });
  } catch (error) {
    console.error("Delete deck error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
