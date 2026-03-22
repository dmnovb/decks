import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, smoothStream, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { tool, jsonSchema } from "ai";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";

const anthropic = createAnthropic({ apiKey: process.env.CLAUDE_KEY! });

function getAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token) as { userId: string } | null;
}

export async function POST(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  const userId = auth.userId;

  const { messages, conversationId } = (await request.json()) as {
    messages: UIMessage[];
    conversationId?: string;
  };

  const userMemory = await prisma.userMemory.findUnique({ where: { userId } });

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

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    temperature: 0.3,
    experimental_transform: smoothStream({ chunking: "word" }),
    tools: {
      create_deck: tool({
        description: "Creates a new flashcard deck for the user, optionally inside a folder.",
        inputSchema: jsonSchema<{ title: string; description?: string; category?: string; folderId?: string }>({
          type: "object",
          properties: {
            title: { type: "string", description: "The title of the deck" },
            description: { type: "string", description: "A brief description" },
            category: { type: "string", description: "The category or subject" },
            folderId: { type: "string", description: "The ID of a folder to place the deck in" },
          },
          required: ["title"],
        }),
        execute: async (args) => {
          const deck = await prisma.deck.create({
            data: { title: args.title, description: args.description, category: args.category, folderId: args.folderId, userId },
          });
          return { success: true, deckId: deck.id, message: `Created deck "${deck.title}"` };
        },
      }),

      create_flashcards: tool({
        description: "Creates multiple flashcards in a specific deck.",
        inputSchema: jsonSchema<{ deckId: string; flashcards: { front: string; back: string; notes?: string }[] }>({
          type: "object",
          properties: {
            deckId: { type: "string", description: "The ID of the deck" },
            flashcards: {
              type: "array",
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
          required: ["deckId", "flashcards"],
        }),
        execute: async (args) => {
          const ownedDeck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
          if (!ownedDeck) return { success: false, error: "Deck not found or access denied" };
          const result = await prisma.flashcard.createMany({
            data: args.flashcards.map((card) => ({ ...card, deckId: args.deckId })),
          });
          return { success: true, count: result.count, message: `Created ${result.count} flashcards` };
        },
      }),

      create_deck_with_flashcards: tool({
        description: "Creates a new deck and populates it with flashcards in one operation.",
        inputSchema: jsonSchema<{ title: string; description?: string; category?: string; folderId?: string; flashcards: { front: string; back: string; notes?: string }[] }>({
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            folderId: { type: "string" },
            flashcards: {
              type: "array",
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
        }),
        execute: async (args) => {
          const deck = await prisma.deck.create({
            data: {
              title: args.title, description: args.description, category: args.category,
              folderId: args.folderId, userId,
              flashcards: { create: args.flashcards },
            },
            include: { flashcards: true },
          });
          return { success: true, deckId: deck.id, flashcardCount: deck.flashcards.length, message: `Created deck "${deck.title}" with ${deck.flashcards.length} flashcards` };
        },
      }),

      list_user_decks: tool({
        description: "Lists all decks belonging to the user.",
        inputSchema: jsonSchema<Record<string, never>>({ type: "object", properties: {} }),
        execute: async () => {
          const decks = await prisma.deck.findMany({
            where: { userId },
            include: { _count: { select: { flashcards: true } } },
            orderBy: { createdAt: "desc" },
          });
          return {
            success: true,
            decks: decks.map((d) => ({
              id: d.id, title: d.title, description: d.description,
              category: d.category, flashcardCount: d._count.flashcards,
            })),
          };
        },
      }),

      list_user_flashcards_in_deck: tool({
        description: "Lists all flashcards in a specific deck.",
        inputSchema: jsonSchema<{ deckId: string }>({
          type: "object",
          properties: { deckId: { type: "string" } },
          required: ["deckId"],
        }),
        execute: async (args) => {
          const deck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
          if (!deck) return { success: false, error: "Deck not found or access denied" };
          const flashcards = await prisma.flashcard.findMany({ where: { deckId: args.deckId } });
          return {
            success: true, deckTitle: deck.title, count: flashcards.length,
            flashcards: flashcards.map((f) => ({ id: f.id, front: f.front, back: f.back, notes: f.notes })),
          };
        },
      }),

      create_folder: tool({
        description: "Creates a new folder to organize decks.",
        inputSchema: jsonSchema<{ title: string; description?: string; parentId?: string }>({
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            parentId: { type: "string" },
          },
          required: ["title"],
        }),
        execute: async (args) => {
          const folder = await prisma.folder.create({
            data: { title: args.title, description: args.description, parentId: args.parentId, userId },
          });
          return { success: true, folderId: folder.id, message: `Created folder "${folder.title}"` };
        },
      }),

      list_user_folders: tool({
        description: "Lists all folders belonging to the user.",
        inputSchema: jsonSchema<Record<string, never>>({ type: "object", properties: {} }),
        execute: async () => {
          const folders = await prisma.folder.findMany({
            where: { userId },
            include: { _count: { select: { decks: true, children: true } } },
            orderBy: { createdAt: "desc" },
          });
          return {
            success: true,
            folders: folders.map((f) => ({
              id: f.id, title: f.title, description: f.description,
              parentId: f.parentId, deckCount: f._count.decks, subfolderCount: f._count.children,
            })),
          };
        },
      }),

      move_deck_to_folder: tool({
        description: "Moves a deck into a folder, or back to top level if folderId is null.",
        inputSchema: jsonSchema<{ deckId: string; folderId: string | null }>({
          type: "object",
          properties: {
            deckId: { type: "string" },
            folderId: { type: ["string", "null"] as any },
          },
          required: ["deckId", "folderId"],
        }),
        execute: async (args) => {
          const ownedDeck = await prisma.deck.findFirst({ where: { id: args.deckId, userId } });
          if (!ownedDeck) return { success: false, error: "Deck not found or access denied" };
          if (args.folderId) {
            const folder = await prisma.folder.findFirst({ where: { id: args.folderId, userId } });
            if (!folder) return { success: false, error: "Folder not found or access denied" };
          }
          await prisma.deck.update({ where: { id: args.deckId }, data: { folderId: args.folderId ?? null } });
          return { success: true, message: args.folderId ? `Moved deck into folder` : `Moved deck to top level` };
        },
      }),

      update_memory: tool({
        description: "Persist important facts about this user. Call whenever you learn something new. Write the full updated memory each time (replaces previous).",
        inputSchema: jsonSchema<{ memory: string }>({
          type: "object",
          properties: {
            memory: { type: "string", description: "Complete updated memory as concise bullet points." },
          },
          required: ["memory"],
        }),
        execute: async (args) => {
          await prisma.userMemory.upsert({
            where: { userId },
            update: { content: args.memory },
            create: { userId, content: args.memory },
          });
          return { success: true, message: "Memory updated." };
        },
      }),
    },

    async onFinish({ text }) {
      if (conversationId && text) {
        try {
          // Verify the conversation belongs to the authenticated user before persisting
          const ownedConvo = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            select: { id: true },
          });
          if (!ownedConvo) return;

          const lastUserMsg = messages.filter((m: UIMessage) => m.role === "user").pop();
          if (lastUserMsg) {
            const userText = lastUserMsg.parts
              ?.filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("") || "";
            if (userText) {
              await prisma.message.create({
                data: { conversationId, role: "user", content: userText },
              });
            }
          }
          await prisma.message.create({
            data: { conversationId, role: "assistant", content: text },
          });
        } catch (e) {
          console.error("Failed to persist messages:", e);
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
