import { NextRequest, NextResponse } from "next/server";

// In-memory store — lives in the Edge runtime process.
// Vercel reuses warm edge instances within a region, so this provides
// meaningful protection while requiring zero infrastructure.
const store = new Map<string, { count: number; resetAt: number }>();

function isAllowed(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

const RULES: { pattern: RegExp; limit: number; windowMs: number }[] = [
  // Auth: 10 requests per minute per IP (brute-force protection)
  { pattern: /^\/api\/auth\//, limit: 10, windowMs: 60_000 },
  // AI + chat: 60 requests per minute per IP (cost protection)
  { pattern: /^\/api\/(ai|chat)/, limit: 60, windowMs: 60_000 },
];

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const path = request.nextUrl.pathname;

  for (const rule of RULES) {
    if (rule.pattern.test(path)) {
      const key = `${ip}:${path.replace(/\/[^/]+$/, "")}`;
      if (!isAllowed(key, rule.limit, rule.windowMs)) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/ai/:path*", "/api/chat"],
};
