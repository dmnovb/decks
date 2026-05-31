import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/helpers";
import { getOrCreateCreditAccount } from "@/lib/credits";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return Response.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    const account = await getOrCreateCreditAccount(userId);

    return Response.json({
      success: true,
      credits: {
        balance: account.balance,
        totalGranted: account.totalGranted,
        totalSpent: account.totalSpent,
      },
    });
  } catch (error) {
    console.error("Credits API Error:", error);
    return Response.json({ success: false, error: "Failed to load credits" }, { status: 500 });
  }
}
