import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/helpers";
import { creditsRequiredResponse, InsufficientCreditsError, spendCredits } from "@/lib/credits";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.7;

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, system } = body || {};

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ success: false, error: "prompt is required" }, { status: 400 });
    }

    await spendCredits(payload.userId, 1, "ai_sonar", { route: "/api/ai/sonar" });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      temperature: TEMPERATURE,
      messages: [{ role: "user", content: prompt }],
    });

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
