import { generateToken, getUserByEmail, verifyPassword } from "@/lib/auth/helpers";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookies";
import { nonEmptyString, validateJsonBody } from "@/lib/api/validation";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: nonEmptyString("Password"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await validateJsonBody(request, loginSchema);
    if (!body.success) return body.response;

    const { email, password } = body.data;

    const user = await getUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.password))) {
      return Response.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });
    (await cookies()).set(AUTH_COOKIE_NAME, token, authCookieOptions(request));

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
