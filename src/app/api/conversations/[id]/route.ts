import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/helpers";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!conversation) return Response.json({ message: "Not found" }, { status: 404 });
    return Response.json({ success: true, conversation });
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    // Ensure the conversation belongs to user
    const convo = await prisma.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!convo) return Response.json({ message: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { role, content } = body || {};
    if (!role || !content)
      return Response.json({ message: "role and content are required" }, { status: 400 });
    if (!["user", "assistant"].includes(role))
      return Response.json({ message: "Invalid role" }, { status: 400 });

    // Create message and touch conversation timestamp in parallel
    const [message] = await Promise.all([
      prisma.message.create({ data: { conversationId: id, role, content } }),
      prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);

    return Response.json({ success: true, message });
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    const convo = await prisma.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!convo) return Response.json({ message: "Not found" }, { status: 404 });

    // Messages must be deleted before conversation (FK constraint)
    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return Response.json({ message: "Not authenticated" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return Response.json({ message: "Invalid token" }, { status: 401 });
    const userId = decoded.userId;

    const convo = await prisma.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!convo) return Response.json({ message: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const { title } = body || {};

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title },
      select: { id: true, title: true, updatedAt: true },
    });

    return Response.json({ success: true, conversation });
  } catch (error) {
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
