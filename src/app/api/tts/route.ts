import { NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorResponseOptions, nonEmptyString, validateJsonBody } from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import {
  creditsRequiredResponse,
  InsufficientCreditsError,
  refundCredits,
  spendCredits,
} from "@/lib/credits";
import {
  ELEVENLABS_ALLOWED_VOICE_IDS,
  ELEVENLABS_DEFAULT_VOICE_ID,
  ELEVENLABS_LONG_PLAYBACK_THRESHOLD,
  ELEVENLABS_MAX_TTS_CHARACTERS,
  ELEVENLABS_TTS_MODEL_ID,
} from "@/lib/elevenlabs-constants";
import { getElevenLabsApiKey, getElevenLabsTextToSpeechStreamUrl } from "@/lib/elevenlabs";

export const runtime = "nodejs";

const TTS_PLAYBACK_FAILED_REASON = "tts_playback_failed";

const ttsSchema = z.object({
  text: nonEmptyString("Text").max(
    ELEVENLABS_MAX_TTS_CHARACTERS,
    "Text must be at most 500 characters",
  ),
  voiceId: z.enum(ELEVENLABS_ALLOWED_VOICE_IDS).optional().default(ELEVENLABS_DEFAULT_VOICE_ID),
  cardId: z.string().trim().min(1).max(128).optional(),
});

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

function getTtsCreditCost(charCount: number) {
  return charCount <= ELEVENLABS_LONG_PLAYBACK_THRESHOLD
    ? CREDIT_COSTS.ttsShortPlayback
    : CREDIT_COSTS.ttsLongPlayback;
}

async function refundFailedTtsPlayback(
  userId: string,
  amount: number,
  metadata: { voiceId: string; charCount: number; cardId?: string },
) {
  try {
    await refundCredits(userId, amount, TTS_PLAYBACK_FAILED_REASON, metadata);
  } catch (error) {
    console.error("Failed to refund TTS credits. Manual reconciliation required.", {
      userId,
      amount,
      reason: TTS_PLAYBACK_FAILED_REASON,
      metadata,
      error,
    });
  }
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, ttsSchema, apiErrorResponseOptions);
    if (!body.success) return body.response;

    const { text, voiceId, cardId } = body.data;
    const charCount = text.length;
    const creditCost = getTtsCreditCost(charCount);
    const metadata = { voiceId, charCount, ...(cardId ? { cardId } : {}) };

    await spendCredits(userId, creditCost, "tts_playback", metadata);

    let response: Response;
    try {
      response = await fetch(getElevenLabsTextToSpeechStreamUrl(voiceId), {
        method: "POST",
        headers: {
          "xi-api-key": getElevenLabsApiKey(),
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_TTS_MODEL_ID,
        }),
        signal: request.signal,
      });
    } catch (error) {
      await refundFailedTtsPlayback(userId, creditCost, metadata);
      throw error;
    }

    if (!response.ok || !response.body) {
      await refundFailedTtsPlayback(userId, creditCost, metadata);
      console.error("ElevenLabs TTS error:", {
        status: response.status,
        statusText: response.statusText,
      });
      return Response.json({ success: false, error: "Failed to generate speech" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("audio/")) {
      await refundFailedTtsPlayback(userId, creditCost, metadata);
      console.error("ElevenLabs returned non-audio content-type:", {
        contentType,
        status: response.status,
        statusText: response.statusText,
      });
      return Response.json({ success: false, error: "Failed to generate speech" }, { status: 502 });
    }

    // If the upstream stream fails after this point, headers are already committed.
    // The user may receive partial audio and keep the spend; a pending-intent flow can harden this later.
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return creditsRequiredResponse(error);
    }

    console.error("TTS playback error:", error);
    return Response.json({ success: false, error: "Failed to generate speech" }, { status: 500 });
  }
}
