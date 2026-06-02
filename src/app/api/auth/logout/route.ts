import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).set(AUTH_COOKIE_NAME, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return Response.json({ message: "Logged out." });
}
