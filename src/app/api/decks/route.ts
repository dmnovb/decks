import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { validateOptionalFolder } from "@/lib/ownership";
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
    const { title, description, folderId } = await request.json();

    if (!title || typeof title !== "string") {
      return new Response("Deck title is required", { status: 400 });
    }

    const folderValidation = await validateOptionalFolder(folderId, userId);
    if (folderValidation) {
      return new Response(folderValidation.error, { status: folderValidation.status });
    }

    const ownedFolderId = typeof folderId === "string" && folderId.length > 0 ? folderId : null;
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
    const { id, folderId, title, description } = await request.json();

    if (!id) {
      return new Response("Deck ID is required", { status: 400 });
    }

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
        ...(folderId !== undefined && { folderId: folderId || null }),
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
    const { id } = await request.json();

    if (!id) {
      return new Response("Deck ID is required", { status: 400 });
    }

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
