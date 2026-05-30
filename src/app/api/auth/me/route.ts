import { getUserById, verifyToken } from "@/lib/auth/helpers";
import { getOrCreateCreditAccount } from "@/lib/credits";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return Response.json({ message: "Not authenticated" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ message: "Invalid token" }, { status: 401 });
    }
    const user = await getUserById(decoded.userId);
    const credits = user?.credits ?? await getOrCreateCreditAccount(decoded.userId);

    return Response.json({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      credits: {
        balance: credits.balance,
        totalGranted: credits.totalGranted,
        totalSpent: credits.totalSpent,
      },
    });
  } catch {
    return Response.json({ message: "Not authenticated" }, { status: 401 });
  }
}
