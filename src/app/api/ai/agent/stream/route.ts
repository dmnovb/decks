import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY!, timeout: 60000, maxRetries: 0 });

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
  {
    type: "custom" as const,
    name: "update_memory",
    description:
      "Persist important facts about this user — what languages they're studying, their goals, level, preferences, and anything else worth remembering across conversations. Call this whenever you learn something new or want to update existing knowledge. Write the full updated memory each time (it replaces the previous one).",
    input_schema: {
      type: "object",
      properties: {
        memory: {
          type: "string",
          description:
            "The complete updated memory about this user. Write it as concise bullet points covering: languages being studied, current level, learning goals, preferences, and any other relevant context.",
        },
      },
      required: ["memory"],
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
    case "update_memory": {
      await prisma.userMemory.upsert({
        where: { userId },
        update: { content: args.memory },
        create: { userId, content: args.memory },
      });
      return { success: true, message: "Memory updated." };
    }
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const sendEvent = (controller: ReadableStreamDefaultController, event: string, data: any) => {
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      // Client disconnected — controller already closed
    }
  };

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
    const maxTokens = 4096;

    if (!message) {
      return Response.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const userMemory = await prisma.userMemory.findUnique({ where: { userId } });

    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message },
    ];

    const memorySection = userMemory?.content
      ? `\nUSER MEMORY (what you know about this user — use this, never ask them again):\n${userMemory.content}\n`
      : `\nUSER MEMORY: None yet. Pay attention to what the user shares and call update_memory to save it.\n`;

    const systemPrompt = `You are Ace, a knowledgeable language learning assistant. You help users create flashcard decks and study materials.

TONE & STYLE: Communicate in a mature, composed, and professional tone. Never use emojis. Avoid excessive enthusiasm or filler phrases like "Great question!" or "Awesome!". Be warm but not bubbly — clear, direct, and to the point.

TOOL USE: When the user asks to create a deck, add cards, or do anything with their data — call the appropriate tool immediately. Do not describe what you will do, just do it.

MEMORY: Call update_memory whenever the user tells you something worth remembering (language, level, goals, preferences). Keep the memory current — rewrite it fully each time. Never ask the user something you already know from memory.

FLASHCARD FORMAT: When creating flashcards, keep each card concise:
- front: the word, phrase, or question
- back: the translation or answer (1–2 sentences max)
- notes: one short example sentence or key usage tip (optional, keep brief)

Create a reasonable number of cards (10–15 unless the user specifies). Be supportive and conversational without being over-the-top.
${memorySection}`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const actionsPerformed: string[] = [];
          let currentMessages = [...messages];

          // Stream loop — runs until model stops calling tools
          while (true) {
            const streamResponse = anthropic.messages.stream(
              {
                model,
                max_tokens: maxTokens,
                system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
                messages: currentMessages,
                tools,
                temperature: 0.3,
              },
              { signal: request.signal },
            );

            // Stream text chunks as they arrive
            for await (const chunk of streamResponse) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta" &&
                chunk.delta.text
              ) {
                sendEvent(controller, "text", { text: chunk.delta.text });
              }
            }

            const finalMessage = await streamResponse.finalMessage();

            // No more tool calls — done
            if (finalMessage.stop_reason !== "tool_use") break;

            const toolUseBlocks = finalMessage.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );

            sendEvent(controller, "function_start", {
              functions: toolUseBlocks.map((b) => b.name),
            });

            currentMessages.push({ role: "assistant", content: finalMessage.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              toolUseBlocks.map(async (call) => {
                console.log("Executing function:", call.name, call.input);
                try {
                  const result = await executeFunctions(call.name, call.input, userId);
                  actionsPerformed.push(call.name);
                  return {
                    type: "tool_result" as const,
                    tool_use_id: call.id,
                    content: JSON.stringify(result),
                  };
                } catch (error) {
                  console.error("Function execution error:", error);
                  return {
                    type: "tool_result" as const,
                    tool_use_id: call.id,
                    content: JSON.stringify({ success: false, error: (error as Error).message }),
                  };
                }
              }),
            );

            sendEvent(controller, "function_complete", { actions: actionsPerformed });
            currentMessages.push({ role: "user", content: toolResults });
          }

          sendEvent(controller, "done", { actionsPerformed, timestamp: new Date().toISOString() });
          controller.close();
        } catch (error: any) {
          const isDisconnect =
            error?.name === "AbortError" ||
            error?.code === "ERR_INVALID_STATE" ||
            error?.message === "Request was aborted." ||
            request.signal.aborted;
          if (!isDisconnect) {
            console.error("Streaming error:", error);
            sendEvent(controller, "error", { error: "An error occurred" });
          }
          try { controller.close(); } catch { /* already closed */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent Stream API Error:", error);
    return Response.json(
      { success: false, error: (error as Error).message || "Failed to process request" },
      { status: 500 },
    );
  }
}
