import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth/helpers';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Define available functions the AI can call
const functions = [
    {
        name: 'create_deck',
        description: 'Creates a new flashcard deck for the user',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: {
                    type: SchemaType.STRING,
                    description: 'The title of the deck'
                },
                description: {
                    type: SchemaType.STRING,
                    description: 'A brief description of what this deck contains'
                },
                category: {
                    type: SchemaType.STRING,
                    description: 'The category or subject (e.g., "Spanish", "Japanese", "Korean")'
                }
            },
            required: ['title']
        }
    },
    {
        name: 'create_flashcards',
        description: 'Creates multiple flashcards in a specific deck. Use this when user asks to generate or create flashcards.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                deckId: {
                    type: SchemaType.STRING,
                    description: 'The ID of the deck to add flashcards to'
                },
                flashcards: {
                    type: SchemaType.ARRAY,
                    description: 'Array of flashcard objects to create',
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            front: {
                                type: SchemaType.STRING,
                                description: 'The front of the card (question/prompt)'
                            },
                            back: {
                                type: SchemaType.STRING,
                                description: 'The back of the card (answer)'
                            },
                            notes: {
                                type: SchemaType.STRING,
                                description: 'Optional notes or additional information'
                            }
                        },
                        required: ['front', 'back']
                    }
                }
            },
            required: ['deckId', 'flashcards']
        }
    },
    {
        name: 'create_deck_with_flashcards',
        description: 'Creates a new deck and populates it with flashcards in one operation. Use this when user wants a complete deck created from scratch.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: {
                    type: SchemaType.STRING,
                    description: 'The title of the deck'
                },
                description: {
                    type: SchemaType.STRING,
                    description: 'A brief description of the deck'
                },
                category: {
                    type: SchemaType.STRING,
                    description: 'The category or subject'
                },
                flashcards: {
                    type: SchemaType.ARRAY,
                    description: 'Array of flashcards to create',
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            front: { type: SchemaType.STRING },
                            back: { type: SchemaType.STRING },
                            notes: { type: SchemaType.STRING }
                        },
                        required: ['front', 'back']
                    }
                }
            },
            required: ['title', 'flashcards']
        }
    },
    {
        name: 'list_user_decks',
        description: 'Lists all decks belonging to the user. Use this when user asks to see their decks or asks which deck to add cards to.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
            required: []
        }
    }
];

// Function implementations
async function executeFunctions(functionName: string, args: any, userId: string) {
    switch (functionName) {
        case 'create_deck': {
            const deck = await prisma.deck.create({
                data: {
                    title: args.title,
                    description: args.description,
                    category: args.category,
                    userId
                }
            });
            return {
                success: true,
                deckId: deck.id,
                message: `Created deck "${deck.title}" with ID ${deck.id}`
            };
        }

        case 'create_flashcards': {
            const flashcards = await prisma.flashcard.createMany({
                data: args.flashcards.map((card: any) => ({
                    ...card,
                    deckId: args.deckId
                }))
            });
            return {
                success: true,
                count: flashcards.count,
                message: `Created ${flashcards.count} flashcards in deck ${args.deckId}`
            };
        }

        case 'create_deck_with_flashcards': {
            const deck = await prisma.deck.create({
                data: {
                    title: args.title,
                    description: args.description,
                    category: args.category,
                    userId,
                    flashcards: {
                        create: args.flashcards
                    }
                },
                include: {
                    flashcards: true
                }
            });
            return {
                success: true,
                deckId: deck.id,
                flashcardCount: deck.flashcards.length,
                message: `Created deck "${deck.title}" with ${deck.flashcards.length} flashcards`
            };
        }

        case 'list_user_decks': {
            const decks = await prisma.deck.findMany({
                where: { userId },
                include: {
                    _count: {
                        select: { flashcards: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return {
                success: true,
                decks: decks.map((deck: any) => ({
                    id: deck.id,
                    title: deck.title,
                    description: deck.description,
                    category: deck.category,
                    flashcardCount: deck._count.flashcards
                }))
            };
        }

        default:
            throw new Error(`Unknown function: ${functionName}`);
    }
}

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

        const userId = payload.userId;

        const {
            message,
            history = [],
            model = 'gemini-2.0-flash-exp',
            temperature = 0.7,
            maxTokens = 2048
        } = await request.json();

        if (!message) {
            return Response.json({
                success: false,
                error: 'Message is required'
            }, { status: 400 });
        }

        const systemInstructionText = process.env.AI_SYSTEM_PROMPT_ACE!;

        const aiModel = genAI.getGenerativeModel({
            model,
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
            },
            tools: [{
                functionDeclarations: functions as any
            }],
            systemInstruction: {
                role: 'user',
                parts: [{ text: systemInstructionText }]
            }
        });

        // Build conversation history
        const geminiHistory = history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const chat = aiModel.startChat({
            history: geminiHistory
        });

        let result = await chat.sendMessage(message);
        let response = result.response;

        // Handle function calls
        const functionCalls = response.functionCalls();
        let actionsPerformed: string[] = [];

        if (functionCalls && functionCalls.length > 0) {
            const functionResults = [];

            for (const call of functionCalls) {
                console.log('Executing function:', call.name, call.args);
                try {
                    const result = await executeFunctions(call.name, call.args, userId);
                    functionResults.push({
                        functionResponse: {
                            name: call.name,
                            response: result
                        }
                    });

                    // Track what actions were performed
                    actionsPerformed.push(call.name);
                } catch (error) {
                    console.error('Function execution error:', error);
                    functionResults.push({
                        functionResponse: {
                            name: call.name,
                            response: {
                                success: false,
                                error: (error as Error).message
                            }
                        }
                    });
                }
            }

            // Send function results back to the model
            result = await chat.sendMessage(functionResults);
            response = result.response;
        }

        return Response.json({
            success: true,
            response: response.text(),
            actionsPerformed,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Agent API Error:', error);
        return Response.json({
            success: false,
            error: (error as Error).message || 'Failed to process request'
        }, { status: 500 });
    }
}

