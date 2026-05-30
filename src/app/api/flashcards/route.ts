import { Flashcard } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

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

    const { front, back, notes }: Flashcard = await request.json();

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
    const { id, deckId } = await request.json();

    if (!id) {
      return new Response("Flashcard ID is required", { status: 400 });
    }

    if (!deckId) {
      return new Response("Deck ID is required", { status: 400 });
    }

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
    const { id, deckId, front, back, notes } = await request.json();

    if (!id || !deckId) {
      return new Response("Flashcard ID and Deck ID are required", { status: 400 });
    }

    if (!(await verifyDeckOwnership(deckId, userId))) {
      return new Response("Deck not found", { status: 404 });
    }

    const updateData: { front?: string; back?: string; notes?: string | null } = {};
    if (front !== undefined) {
      if (typeof front !== "string" || front.trim() === "") {
        return new Response("Front must be a non-empty string", { status: 400 });
      }
      updateData.front = front;
    }
    if (back !== undefined) {
      if (typeof back !== "string" || back.trim() === "") {
        return new Response("Back must be a non-empty string", { status: 400 });
      }
      updateData.back = back;
    }
    if (notes !== undefined) {
      if (notes !== null && typeof notes !== "string") {
        return new Response("Notes must be a string or null", { status: 400 });
      }
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response("No editable flashcard fields provided", { status: 400 });
    }

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
