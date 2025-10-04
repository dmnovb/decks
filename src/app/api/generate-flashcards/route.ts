import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/helpers';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return Response.json({
                success: false,
                error: 'Authentication required'
            }, { status: 401 });
        }

        const payload = verifyToken(token) as { userId: string } | null;
        if (!payload) {
            return Response.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        const { prompt, deckId, count = 10 } = await request.json()

        if (!prompt) {
            return Response.json({
                success: false,
                error: 'Prompt is required'
            }, { status: 400 });
        }

        if (!deckId) {
            return Response.json({
                success: false,
                error: 'Deck ID is required'
            }, { status: 400 });
        }

        // Verify deck belongs to user
        const deck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: payload.userId
            }
        });

        if (!deck) {
            return Response.json({
                success: false,
                error: 'Deck not found'
            }, { status: 404 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

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

        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        // Parse the JSON response
        let flashcardsData;
        try {
            // Remove markdown code blocks if present
            const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            flashcardsData = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error('Failed to parse AI response:', response);
            return Response.json({
                success: false,
                error: 'Failed to parse AI response'
            }, { status: 500 });
        }

        // Create flashcards in database
        const createdFlashcards = await prisma.flashcard.createMany({
            data: flashcardsData.map((card: any) => ({
                front: card.front,
                back: card.back,
                notes: card.notes || null,
                deckId
            }))
        });

        return Response.json({
            success: true,
            count: createdFlashcards.count,
            message: `Generated ${createdFlashcards.count} flashcards`
        });

    } catch (error) {
        console.error('Generate flashcards error:', error);
        return Response.json({
            success: false,
            error: (error as Error).message || 'Failed to generate flashcards'
        }, { status: 500 });
    }
}