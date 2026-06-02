import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "auth-token";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

type AuthCookieOptions = Partial<ResponseCookie>;

const requestProtocol = (request: NextRequest) => {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto ?? request.nextUrl.protocol.replace(":", "");
};

export const authCookieOptions = (request: NextRequest): AuthCookieOptions => ({
  httpOnly: true,
  secure: requestProtocol(request) === "https",
  sameSite: "lax",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
});

export const expiredAuthCookieOptions = (request: NextRequest): AuthCookieOptions => ({
  ...authCookieOptions(request),
  maxAge: 0,
  expires: new Date(0),
});
