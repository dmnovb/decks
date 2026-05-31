import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  apiErrorResponseOptions,
  nonEmptyString,
  optionalString,
  validateJsonBody,
} from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { z } from "zod";
import {
  creditsRequiredResponse,
  InsufficientCreditsError,
  refundCredits,
  spendCredits,
} from "@/lib/credits";

const generateFlashcardsSchema = z.object({
  prompt: nonEmptyString("Prompt"),
  deckId: nonEmptyString("Deck ID"),
  count: z
    .number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(50, "Count must be at most 50")
    .default(10),
});

const generatedFlashcardSchema = z.object({
  front: nonEmptyString("Front"),
  back: nonEmptyString("Back"),
  notes: optionalString,
});

const generatedFlashcardsResponseSchema = z.array(generatedFlashcardSchema).min(1);

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

async function refundFailedGeneration(
  userId: string,
  amount: number,
  deckId: string,
  count: number,
) {
  try {
    await refundCredits(userId, amount, "generate_flashcards_failed", { deckId, count });
  } catch (error) {
    console.error("Failed to refund credits:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const payload = verifyToken(token) as { userId: string } | null;
    if (!payload) {
      return Response.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const body = await validateJsonBody(request, generateFlashcardsSchema, apiErrorResponseOptions);
    if (!body.success) return body.response;

    const { prompt, deckId, count } = body.data;

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: payload.userId },
    });

    if (!deck) {
      return Response.json({ success: false, error: "Deck not found" }, { status: 404 });
    }

    await spendCredits(payload.userId, count, "generate_flashcards", { deckId, count });

    const fullPrompt = `Generate ${count} high-quality flashcards for: ${prompt}

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "notes": "Optional helpful notes"
  }
]

Make the flashcards educational, clear, and appropriate for language learning.`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: fullPrompt }],
      });
    } catch (error) {
      await refundFailedGeneration(payload.userId, count, deckId, count);
      throw error;
    }

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    let parsedResponse: unknown;
    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse AI response:", responseText);
      await refundFailedGeneration(payload.userId, count, deckId, count);
      return Response.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    const flashcardsResult = generatedFlashcardsResponseSchema.safeParse(parsedResponse);
    if (!flashcardsResult.success) {
      console.error("AI response failed validation:", flashcardsResult.error);
      await refundFailedGeneration(payload.userId, count, deckId, count);
      return Response.json(
        { success: false, error: "AI response did not match expected flashcard format" },
        { status: 500 },
      );
    }

    const createdFlashcards = await prisma.flashcard.createMany({
      data: flashcardsResult.data.map((card) => ({
        front: card.front,
        back: card.back,
        notes: card.notes || null,
        deckId,
      })),
    });

    return Response.json({
      success: true,
      count: createdFlashcards.count,
      message: `Generated ${createdFlashcards.count} flashcards`,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Generate flashcards error:", error);
    return Response.json(
      { success: false, error: "Failed to generate flashcards" },
      { status: 500 },
    );
  }
}
