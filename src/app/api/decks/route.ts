import { Deck } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const decks = await prisma.deck.findMany({
      include: { flashcards: true },
    });
    return new Response(JSON.stringify(decks), { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: "1" },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const { title, description }: Deck = await request.json();

    const deck = await prisma.deck.create({
      data: {
        title,
        description,
        user: {
          connect: { id: user.id },
        },
      },
    });

    return new Response(JSON.stringify(deck), { status: 201 });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response("Deck not found", { status: 404 });
    }

    await prisma.flashcard.deleteMany({ where: { deckId: id } })
    await prisma.deck.delete({
      where: { id },
    });

    return new Response("Deck deleted!", { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
