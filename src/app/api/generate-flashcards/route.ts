import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

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

    const { prompt, deckId, count: rawCount = 10 } = await request.json();
    const count = Math.min(Math.max(Number(rawCount) || 10, 1), 50);

    if (!prompt) {
      return Response.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    if (!deckId) {
      return Response.json({ success: false, error: "Deck ID is required" }, { status: 400 });
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: payload.userId },
    });

    if (!deck) {
      return Response.json({ success: false, error: "Deck not found" }, { status: 404 });
    }

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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: fullPrompt }],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    let flashcardsData;
    try {
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      flashcardsData = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return Response.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    const createdFlashcards = await prisma.flashcard.createMany({
      data: flashcardsData.map((card: any) => ({
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
    console.error("Generate flashcards error:", error);
    return Response.json(
      { success: false, error: "Failed to generate flashcards" },
      { status: 500 },
    );
  }
}
