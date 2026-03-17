import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  const { id } = await params;

  const deck = await prisma.deck.findFirst({ where: { id, userId } });
  if (!deck) {
    return new Response("Deck not found", { status: 404 });
  }

  const { notes } = await request.json();

  await prisma.deck.update({ where: { id }, data: { notes } });

  return new Response(null, { status: 200 });
}
