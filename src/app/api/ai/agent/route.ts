import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

const tools: Anthropic.Tool[] = [
  {
    type: "custom" as const,
    name: "create_deck",
    description: "Creates a new flashcard deck for the user, optionally inside a folder.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the deck" },
        description: {
          type: "string",
          description: "A brief description of what this deck contains",
        },
        category: {
          type: "string",
          description: 'The category or subject (e.g., "Spanish", "Japanese", "Korean")',
        },
        folderId: {
          type: "string",
          description: "The ID of a folder to place the deck in (optional)",
        },
      },
      required: ["title"],
    },
  },
  {
    type: "custom" as const,
    name: "create_flashcards",
    description:
      "Creates multiple flashcards in a specific deck. Use this when user asks to generate or create flashcards.",
    input_schema: {
      type: "object",
      properties: {
        deckId: { type: "string", description: "The ID of the deck to add flashcards to" },
        flashcards: {
          type: "array",
          description: "Array of flashcard objects to create",
          items: {
            type: "object",
            properties: {
              front: { type: "string", description: "The front of the card (question/prompt)" },
              back: { type: "string", description: "The back of the card (answer)" },
              notes: { type: "string", description: "Optional notes or additional information" },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["deckId", "flashcards"],
    },
  },
  {
    type: "custom" as const,
    name: "create_deck_with_flashcards",
    description:
      "Creates a new deck and populates it with flashcards in one operation. Use this when user wants a complete deck created from scratch.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The title of the deck" },
        description: { type: "string", description: "A brief description of the deck" },
        category: { type: "string", description: "The category or subject" },
        folderId: { type: "string", description: "The ID of a folder to place the deck in (optional)" },
        flashcards: {
          type: "array",
          description: "Array of flashcards to create",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
              notes: { type: "string" },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["title", "flashcards"],
    },
  },
  {
    type: "custom" as const,
    name: "list_user_decks",
    description:
      "Lists all decks belonging to the user. Use this when user asks to see their decks or asks which deck to add cards to.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    type: "custom" as const,
    name: "list_user_flashcards_in_deck",
    description:
      "Lists all flashcards belonging to a specific deck. Use this when user asks to see the flashcards in a specific deck.",
    input_schema: {
      type: "object",
      properties: {
        deckId: { type: "string", description: "The ID of the deck to list flashcards from" },
      },
      required: ["deckId"],
    },
  },
  {
    type: "custom" as const,
    name: "create_folder",
    description:
      "Creates a new folder to organize decks. Use this when user wants to group decks together.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The name of the folder" },
        description: { type: "string", description: "A brief description of the folder" },
        parentId: {
          type: "string",
          description: "The ID of a parent folder to nest this folder inside (optional)",
        },
      },
      required: ["title"],
    },
  },
  {
    type: "custom" as const,
    name: "list_user_folders",
    description:
      "Lists all folders belonging to the user. Use this to see existing folders before creating decks or folders inside them.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    type: "custom" as const,
    name: "move_deck_to_folder",
    description:
      "Moves a deck into a folder, or back to the top level if folderId is null.",
    input_schema: {
      type: "object",
      properties: {
        deckId: { type: "string", description: "The ID of the deck to move" },
        folderId: {
          type: ["string", "null"],
          description: "The ID of the folder to move the deck into, or null for top level",
        },
      },
      required: ["deckId", "folderId"],
    },
  },
];

async function executeFunctions(functionName: string, args: any, userId: string) {
  switch (functionName) {
    case "create_deck": {
      const deck = await prisma.deck.create({
        data: { title: args.title, description: args.description, category: args.category, folderId: args.folderId, userId },
      });
      return {
        success: true,
        deckId: deck.id,
        message: `Created deck "${deck.title}" with ID ${deck.id}`,
      };
    }
    case "create_flashcards": {
      const ownedDeck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
      if (!ownedDeck) return { success: false, error: "Deck not found or access denied" };
      const flashcards = await prisma.flashcard.createMany({
        data: args.flashcards.map((card: any) => ({ ...card, deckId: args.deckId })),
      });
      return {
        success: true,
        count: flashcards.count,
        message: `Created ${flashcards.count} flashcards in deck ${args.deckId}`,
      };
    }
    case "create_deck_with_flashcards": {
      const deck = await prisma.deck.create({
        data: {
          title: args.title,
          description: args.description,
          category: args.category,
          folderId: args.folderId,
          userId,
          flashcards: { create: args.flashcards },
        },
        include: { flashcards: true },
      });
      return {
        success: true,
        deckId: deck.id,
        flashcardCount: deck.flashcards.length,
        message: `Created deck "${deck.title}" with ${deck.flashcards.length} flashcards`,
      };
    }
    case "list_user_decks": {
      const decks = await prisma.deck.findMany({
        where: { userId },
        include: { _count: { select: { flashcards: true } } },
        orderBy: { createdAt: "desc" },
      });
      return {
        success: true,
        decks: decks.map((deck: any) => ({
          id: deck.id,
          title: deck.title,
          description: deck.description,
          category: deck.category,
          flashcardCount: deck._count.flashcards,
        })),
      };
    }
    case "list_user_flashcards_in_deck": {
      const deck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
      if (!deck) return { success: false, error: "Deck not found or you do not have access to it" };
      const flashcards = await prisma.flashcard.findMany({ where: { deckId: args.deckId } });
      return {
        success: true,
        deckTitle: deck.title,
        count: flashcards.length,
        flashcards: flashcards.map((f: any) => ({
          id: f.id,
          front: f.front,
          back: f.back,
          notes: f.notes,
        })),
        message: `Found ${flashcards.length} flashcard${flashcards.length !== 1 ? "s" : ""} in deck "${deck.title}"`,
      };
    }
    case "create_folder": {
      const folder = await prisma.folder.create({
        data: {
          title: args.title,
          description: args.description,
          parentId: args.parentId,
          userId,
        },
      });
      return {
        success: true,
        folderId: folder.id,
        message: `Created folder "${folder.title}" with ID ${folder.id}`,
      };
    }
    case "list_user_folders": {
      const folders = await prisma.folder.findMany({
        where: { userId },
        include: { _count: { select: { decks: true, children: true } } },
        orderBy: { createdAt: "desc" },
      });
      return {
        success: true,
        folders: folders.map((f: any) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          parentId: f.parentId,
          deckCount: f._count.decks,
          subfolderCount: f._count.children,
        })),
      };
    }
    case "move_deck_to_folder": {
      const ownedDeck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
      if (!ownedDeck) return { success: false, error: "Deck not found or access denied" };
      if (args.folderId) {
        const folder = await prisma.folder.findFirst({ where: { id: args.folderId, userId } });
        if (!folder) return { success: false, error: "Folder not found or access denied" };
      }
      await prisma.deck.update({
        where: { id: args.deckId },
        data: { folderId: args.folderId ?? null },
      });
      return {
        success: true,
        message: args.folderId
          ? `Moved deck "${ownedDeck.title}" into folder`
          : `Moved deck "${ownedDeck.title}" to top level`,
      };
    }
    default:
      throw new Error(`Unknown function: ${functionName}`);
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

    const userId = payload.userId;

    const { message, history = [] } = await request.json();
    const model = "claude-sonnet-4-6";
    const maxTokens = 8192;

    if (!message) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];

    const actionsPerformed: string[] = [];

    const systemPrompt = `CRITICAL INSTRUCTION: You have access to tools. When the user asks you to create decks, add flashcards, or perform any database operation, you MUST call the appropriate tool immediately. Do NOT just describe what you would do - actually DO it by calling the tool. Do not ask for clarification unless truly necessary - make reasonable assumptions and proceed.

${process.env.AI_SYSTEM_PROMPT_ACE!}`;

    let response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      tools,
      temperature: 0.3,
    });

    // Handle tool call loop
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const call of toolUseBlocks) {
        console.log("Executing function:", call.name, call.input);
        try {
          const result = await executeFunctions(call.name, call.input, userId);
          actionsPerformed.push(call.name);
          toolResults.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: call.id,
            content: JSON.stringify({ success: false, error: (error as Error).message }),
          });
        }
      }

      messages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        tools,
        temperature: 0.3,
      });
    }

    const text =
      response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";

    return Response.json({
      success: true,
      response: text,
      actionsPerformed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Agent API Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
