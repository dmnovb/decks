import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/helpers";
import { apiErrorResponseOptions, nonEmptyString, validateJsonBody } from "@/lib/api/validation";
import { z } from "zod";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY! });

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.7;

const sonarPromptSchema = z.object({
  prompt: nonEmptyString("prompt"),
  system: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token || !verifyToken(token)) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, sonarPromptSchema, apiErrorResponseOptions);
    if (!body.success) return body.response;

    const { prompt, system } = body.data;

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
    console.error("Claude API Error:", error);
    return Response.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
