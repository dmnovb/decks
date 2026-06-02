export const AUTH_COOKIE_NAME = "auth-token";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
} as const;
