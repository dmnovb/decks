import { NextRequest, NextResponse } from "next/server";

// In-memory store — lives in the Edge runtime process.
// Vercel reuses warm edge instances within a region, so this provides
// meaningful protection while requiring zero infrastructure.
const store = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

const RULES: { name: string; pattern: RegExp; limit: number; windowMs: number }[] = [
  // Auth mutations: 10 requests per minute per IP (brute-force protection).
  { name: "auth", pattern: /^\/api\/auth\/(?!me$|logout$).+/, limit: 10, windowMs: 60_000 },
  // Flashcard generation: 10 requests per minute per IP (cost protection)
  {
    name: "generate-flashcards",
    pattern: /^\/api\/generate-flashcards$/,
    limit: 10,
    windowMs: 60_000,
  },
  // TTS playback: 30 requests per minute per IP (cost protection)
  {
    name: "tts",
    pattern: /^\/api\/tts$/,
    limit: 30,
    windowMs: 60_000,
  },
  // Stripe checkout creation: 10 requests per minute per IP (provider protection)
  { name: "credits-checkout", pattern: /^\/api\/credits\/checkout$/, limit: 10, windowMs: 60_000 },
  // AI + chat: 60 requests per minute per IP (cost protection)
  { name: "ai-chat", pattern: /^\/api\/(ai|chat)/, limit: 60, windowMs: 60_000 },
];

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const path = request.nextUrl.pathname;

  for (const rule of RULES) {
    if (rule.pattern.test(path)) {
      const key = `${ip}:${rule.name}`;
      const rateLimit = checkRateLimit(key, rule.limit, rule.windowMs);
      if (!rateLimit.allowed) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        });
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/ai/:path*",
    "/api/chat",
    "/api/generate-flashcards",
    "/api/tts",
    "/api/credits/checkout",
  ],
};
