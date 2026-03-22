import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/helpers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return Response.json({ success: true, conversations });
  } catch (error) {
    console.error("Conversations GET error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    const body = await request.json().catch(() => ({}));
    const { title, messages } = body || {};

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        messages:
          Array.isArray(messages) && messages.length > 0
            ? {
                create: messages.map((m: any) => ({
                  role: String(m.role || "user"),
                  content: String(m.content || ""),
                })),
              }
            : undefined,
      },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return Response.json({ success: true, conversation });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return Response.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
