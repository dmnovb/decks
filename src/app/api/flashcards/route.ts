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
        const deckId = searchParams.get('deckId');

        if (!deckId) {
            return new Response("Deck ID is required", { status: 400 });
        }

        if (!await verifyDeckOwnership(deckId, userId)) {
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

        if (!await verifyDeckOwnership(deckId, userId)) {
            return new Response("Deck not found", { status: 404 });
        }

        const { front, back, notes }: Flashcard = await request.json();

        const flashcard = await prisma.flashcard.create({
            data: {
                front,
                back,
                notes,
                deck: { connect: { id: deckId } },
            }
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

        if (!await verifyDeckOwnership(deckId, userId)) {
            return new Response("Deck not found", { status: 404 });
        }

        const flashcard = await prisma.flashcard.findFirst({
            where: { id, deckId }
        });

        if (!flashcard) {
            return new Response("Flashcard not found in this deck", { status: 404 });
        }

        await prisma.flashcard.delete({ where: { id } });

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
        const { id, deckId, difficulty, interval, repetitions, easeFactor, lastReviewed, nextReview, streak, totalReviews, correctReviews } = await request.json();

        if (!id || !deckId) {
            return new Response("Flashcard ID and Deck ID are required", { status: 400 });
        }

        if (!await verifyDeckOwnership(deckId, userId)) {
            return new Response("Deck not found", { status: 404 });
        }

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
        console.error("Update flashcard error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}