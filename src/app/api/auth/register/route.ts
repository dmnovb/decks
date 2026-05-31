import { createUser, generateToken, getUserByEmail } from "@/lib/auth/helpers";
import { validateJsonBody } from "@/lib/api/validation";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await validateJsonBody(request, registerSchema);
    if (!body.success) return body.response;

    const { password, email } = body.data;
    const name = body.data.name ?? "";

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }
    const user = await createUser(name, password, email);

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });
    (await cookies()).set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return Response.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
