import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/helpers";
import { apiErrorResponseOptions, nonEmptyString, validateJsonBody } from "@/lib/api/validation";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import { z } from "zod";
import {
  creditsRequiredResponse,
  InsufficientCreditsError,
  refundCredits,
  spendCredits,
} from "@/lib/credits";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.7;

const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: nonEmptyString("Message content"),
});

const aiMessageSchema = z.object({
  message: nonEmptyString("Message"),
  systemPrompt: z.string().trim().optional(),
  context: z.string().trim().optional(),
  history: z.array(historyMessageSchema).optional().default([]),
});

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

async function refundFailedAiRequest(userId: string, method: "GET" | "POST") {
  try {
    await refundCredits(userId, CREDIT_COSTS.aiMessage, "ai_message_failed", {
      route: "/api/ai",
      method,
    });
  } catch (error) {
    console.error("Failed to refund credits:", error);
  }
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, aiMessageSchema, apiErrorResponseOptions);
    if (!body.success) return body.response;

    const { message, systemPrompt, context, history } = body.data;

    await spendCredits(userId, CREDIT_COSTS.aiMessage, "ai_message", {
      route: "/api/ai",
      method: "POST",
    });

    let system = "";
    if (systemPrompt) system += `System Instructions: ${systemPrompt}\n\n`;
    if (context) system += `Context: ${context}\n\n`;

    const messages: Anthropic.MessageParam[] = [];
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: message });

    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: system || undefined,
        messages,
        temperature: TEMPERATURE,
      });
    } catch (error) {
      await refundFailedAiRequest(userId, "POST");
      throw error;
    }

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Claude API Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const message = searchParams.get("message");

  if (!message) {
    return Response.json({ success: false, error: "Message is required" }, { status: 400 });
  }

  try {
    await spendCredits(userId, CREDIT_COSTS.aiMessage, "ai_message", {
      route: "/api/ai",
      method: "GET",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            messages: [{ role: "user", content: message }],
          });

          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`),
              );
            }
          }
          controller.close();
        } catch (error) {
          await refundFailedAiRequest(userId, "GET");
          controller.error(error);
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
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Streaming Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
