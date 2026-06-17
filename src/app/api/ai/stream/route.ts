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

const streamPromptSchema = z.object({
  prompt: nonEmptyString("prompt"),
  system: z.string().trim().optional(),
});

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

async function refundFailedAiStream(userId: string, method: "GET" | "POST") {
  try {
    await refundCredits(userId, CREDIT_COSTS.aiMessage, "ai_stream_failed", {
      route: "/api/ai/stream",
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

  const body = await validateJsonBody(request, streamPromptSchema, apiErrorResponseOptions);
  if (!body.success) return body.response;

  const { prompt, system } = body.data;

  try {
    await spendCredits(userId, CREDIT_COSTS.aiMessage, "ai_stream", {
      route: "/api/ai/stream",
      method: "POST",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            temperature: TEMPERATURE,
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of response) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          await refundFailedAiStream(userId, "POST");
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Streaming Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt") || searchParams.get("message") || "";
  const system = searchParams.get("system") || undefined;

  if (!prompt) {
    return Response.json({ success: false, error: "prompt is required" }, { status: 400 });
  }

  try {
    await spendCredits(userId, CREDIT_COSTS.aiMessage, "ai_stream", {
      route: "/api/ai/stream",
      method: "GET",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            temperature: TEMPERATURE,
            messages: [{ role: "user", content: prompt }],
          });

          for await (const chunk of response) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          await refundFailedAiStream(userId, "GET");
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Streaming Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
