import { Flashcard } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deckId = searchParams.get('deckId');

        if (!deckId) {
            return new Response("Deck ID is required", { status: 400 });
        }

        const flashcards = await prisma.flashcard.findMany({ where: { deckId } })

        return new Response(JSON.stringify(flashcards), { status: 200 });

    } catch (error) {
        console.error("Prisma error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const deckId = searchParams.get("deckId")!

        const { front, back, notes }: Flashcard = await request.json()

        const flashcard = await prisma.flashcard.create({
            data: {
                front,
                back,
                notes,
                deck: { connect: { id: deckId } },
            }
        })

        return new Response(JSON.stringify(flashcard), { status: 201 });

    } catch (error) {
        console.error("Prisma error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id, deckId } = await request.json();

        if (!id) {
            return new Response("Flashcard ID is required", { status: 400 });
        }

        if (!deckId) {
            return new Response("Deck ID is required", { status: 400 });
        }

        const flashcard = await prisma.flashcard.findFirst({
            where: { id, deckId }
        });

        if (!flashcard) {
            return new Response("Flashcard not found in this deck", { status: 404 });
        }

        await prisma.flashcard.delete({
            where: { id },
        });

        return new Response("Flashcard deleted!", { status: 200 });
    } catch (error) {
        console.log(error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { id, deckId, difficulty, interval, repetitions, easeFactor, lastReviewed, nextReview, streak, totalReviews, correctReviews } = await request.json();

        const flashcard = await prisma.flashcard.update({
            where: { id, deckId },
            data: {
                difficulty,
                interval,
                repetitions,
                easeFactor,
                lastReviewed,
                nextReview,
                streak,
                totalReviews,
                correctReviews,
            }
        });

        return new Response(JSON.stringify(flashcard), { status: 200 });
    } catch (error) {
        console.log(error);
        return new Response("Internal Server Error", { status: 500 });
    }
}