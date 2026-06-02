import { AUTH_COOKIE_NAME } from "@/lib/auth/cookies";
import { getUserById, verifyToken } from "@/lib/auth/helpers";
import { getOrCreateCreditAccount } from "@/lib/credits";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }

  try {
    const user = await getUserById(decoded.userId);
    if (!user) {
      return Response.json({ message: "User not found" }, { status: 401 });
    }

    const credits = user.credits ?? (await getOrCreateCreditAccount(decoded.userId));

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: {
        balance: credits.balance,
        totalGranted: credits.totalGranted,
        totalSpent: credits.totalSpent,
      },
    });
  } catch (error) {
    console.error("Auth lookup error:", error);
    return Response.json({ message: "Unable to load authenticated user" }, { status: 500 });
  }
}
