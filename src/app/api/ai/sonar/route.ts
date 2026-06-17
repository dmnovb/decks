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

const sonarPromptSchema = z.object({
  prompt: nonEmptyString("prompt"),
  system: z.string().trim().optional(),
});

async function refundFailedAiRequest(userId: string) {
  try {
    await refundCredits(userId, CREDIT_COSTS.aiMessage, "ai_sonar_failed", {
      route: "/api/ai/sonar",
    });
  } catch (error) {
    console.error("Failed to refund credits:", error);
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, sonarPromptSchema, apiErrorResponseOptions);
    if (!body.success) return body.response;

    const { prompt, system } = body.data;

    await spendCredits(payload.userId, CREDIT_COSTS.aiMessage, "ai_sonar", {
      route: "/api/ai/sonar",
    });

    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        temperature: TEMPERATURE,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (error) {
      await refundFailedAiRequest(payload.userId);
      throw error;
    }

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({
      success: true,
      response: text,
      finishReason: response.stop_reason,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("Claude API Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
