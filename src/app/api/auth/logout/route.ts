import { AUTH_COOKIE_NAME, expiredAuthCookieOptions } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  (await cookies()).set(AUTH_COOKIE_NAME, "", expiredAuthCookieOptions(request));

  return Response.json({ message: "Logged out." });
}
