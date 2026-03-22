import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/helpers";
import { NextRequest } from "next/server";

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const folders = await prisma.folder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(folders), { status: 200 });
  } catch (error) {
    console.error("Prisma error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const { title, description, tags, parentId } = await request.json();

    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({ where: { id: parentId, userId } });
      if (!parentFolder) {
        return new Response("Parent folder not found", { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: { title, description, tags: tags || [], parentId, userId },
    });

    return new Response(JSON.stringify(folder), { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function cascadeDeleteFolder(folderId: string, userId: string) {
  // Fetch children and decks in parallel — both only depend on folderId
  const [childFolders, decks] = await Promise.all([
    prisma.folder.findMany({ where: { parentId: folderId, userId } }),
    prisma.deck.findMany({ where: { folderId } }),
  ]);

  // Recurse into all children in parallel
  await Promise.all(childFolders.map((child) => cascadeDeleteFolder(child.id, userId)));

  // Delete all deck-related data in parallel (per-deck operations are independent)
  await Promise.all(
    decks.map((deck) =>
      Promise.all([
        prisma.cardReview.deleteMany({ where: { session: { deckId: deck.id } } }),
        prisma.studySession.deleteMany({ where: { deckId: deck.id } }),
        prisma.flashcard.deleteMany({ where: { deckId: deck.id } }),
      ])
    )
  );

  // Final cleanup — must be sequential (FK constraints)
  await prisma.deck.deleteMany({ where: { folderId } });
  await prisma.folder.delete({ where: { id: folderId } });
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const { id, mode = "orphan" } = await request.json();

    if (!id) {
      return new Response("Folder ID is required", { status: 400 });
    }

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      return new Response("Folder not found", { status: 404 });
    }

    if (mode === "cascade") {
      await cascadeDeleteFolder(id, userId);
    } else {
      // Orphan children and decks in parallel, then delete
      await Promise.all([
        prisma.folder.updateMany({ where: { parentId: id, userId }, data: { parentId: null } }),
        prisma.deck.updateMany({ where: { folderId: id }, data: { folderId: null } }),
      ]);
      await prisma.folder.delete({ where: { id } });
    }

    return new Response("Folder deleted!", { status: 200 });
  } catch (error) {
    console.error("Delete folder error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const { id, title, description, tags, parentId } = await request.json();

    if (!id) {
      return new Response("Folder ID is required", { status: 400 });
    }

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      return new Response("Folder not found", { status: 404 });
    }

    // Cycle detection when changing parent
    if (parentId !== undefined && parentId !== folder.parentId) {
      if (parentId === id) {
        return new Response("A folder cannot be its own parent", { status: 400 });
      }

      if (parentId) {
        let current = await prisma.folder.findFirst({ where: { id: parentId, userId } });
        while (current?.parentId) {
          if (current.parentId === id) {
            return new Response("Cannot move folder into its own descendant", { status: 400 });
          }
          current = await prisma.folder.findFirst({ where: { id: current.parentId, userId } });
        }
      }
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(parentId !== undefined && { parentId }),
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Update folder error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
