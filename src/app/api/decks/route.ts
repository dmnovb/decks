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

    const deck = await prisma.deck.create({
      data: { title, description, folderId, userId },
    });

    return new Response(JSON.stringify(deck), { status: 201 });
  } catch (error) {
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

    // Validate deck and folder in parallel when both needed
    const [deck, folder] = await Promise.all([
      prisma.deck.findFirst({ where: { id, userId } }),
      folderId ? prisma.folder.findFirst({ where: { id: folderId, userId } }) : null,
    ]);
    if (!deck) {
      return new Response("Deck not found", { status: 404 });
    }
    if (folderId && !folder) {
      return new Response("Folder not found", { status: 404 });
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: {
        ...(folderId !== undefined && { folderId: folderId ?? null }),
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

    // Verify the deck belongs to the authenticated user before deleting
    const deck = await prisma.deck.findFirst({ where: { id, userId } });
    if (!deck) {
      return new Response("Deck not found", { status: 404 });
    }

    await prisma.flashcard.deleteMany({ where: { deckId: id } });
    await prisma.deck.delete({ where: { id } });

    return new Response("Deck deleted!", { status: 200 });
  } catch (error) {
    console.error("Delete deck error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
