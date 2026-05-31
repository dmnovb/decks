import prisma from "@/lib/prisma";
import { nonEmptyString, optionalId, optionalString, validateJsonBody } from "@/lib/api/validation";
import { verifyToken } from "@/lib/auth/helpers";
import { validateOptionalFolder } from "@/lib/ownership";
import { NextRequest } from "next/server";
import { z } from "zod";

const tagsSchema = z.array(z.string().trim().min(1, "Tags must be non-empty strings"));

const createFolderSchema = z.object({
  title: nonEmptyString("Folder title"),
  description: optionalString,
  tags: tagsSchema.optional(),
  parentId: optionalId,
});

const deleteFolderSchema = z.object({
  id: nonEmptyString("Folder ID"),
  mode: z.enum(["orphan", "cascade"]).default("orphan"),
});

const updateFolderSchema = z.object({
  id: nonEmptyString("Folder ID"),
  title: nonEmptyString("Folder title").optional(),
  description: optionalString,
  tags: tagsSchema.optional(),
  parentId: optionalId,
});

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
    const body = await validateJsonBody(request, createFolderSchema);
    if (!body.success) return body.response;

    const { title, description, tags, parentId } = body.data;

    const parentValidation = await validateOptionalFolder(parentId, userId);
    if (parentValidation) {
      return new Response(parentValidation.error.replace("Folder", "Parent folder"), {
        status: parentValidation.status,
      });
    }

    const folder = await prisma.folder.create({
      data: { title, description, tags: tags ?? [], parentId: parentId ?? null, userId },
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
    prisma.deck.findMany({ where: { folderId, userId } }),
  ]);

  // Recurse into all children in parallel
  await Promise.all(childFolders.map((child) => cascadeDeleteFolder(child.id, userId)));

  await Promise.all(
    decks.map((deck) =>
      prisma.$transaction([
        prisma.cardReview.deleteMany({ where: { session: { deckId: deck.id } } }),
        prisma.studySession.deleteMany({ where: { deckId: deck.id } }),
        prisma.flashcard.deleteMany({ where: { deckId: deck.id } }),
        prisma.deck.delete({ where: { id: deck.id } }),
      ]),
    ),
  );

  // Final cleanup — must be sequential (FK constraints)
  await prisma.folder.delete({ where: { id: folderId } });
}

export async function DELETE(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const body = await validateJsonBody(request, deleteFolderSchema);
    if (!body.success) return body.response;

    const { id, mode } = body.data;

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
        prisma.deck.updateMany({ where: { folderId: id, userId }, data: { folderId: null } }),
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
    const body = await validateJsonBody(request, updateFolderSchema);
    if (!body.success) return body.response;

    const { id, title, description, tags, parentId } = body.data;

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      return new Response("Folder not found", { status: 404 });
    }

    const normalizedParentId = parentId ?? null;

    const parentFolder = normalizedParentId
      ? await prisma.folder.findFirst({
          where: { id: normalizedParentId, userId },
          select: { id: true, parentId: true },
        })
      : null;
    if (normalizedParentId && !parentFolder) {
      return new Response("Parent folder not found", { status: 404 });
    }

    // Cycle detection when changing parent
    if (parentId !== undefined && normalizedParentId !== folder.parentId) {
      if (normalizedParentId === id) {
        return new Response("A folder cannot be its own parent", { status: 400 });
      }

      if (parentFolder) {
        let current: typeof parentFolder | null = parentFolder;
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
        ...(parentId !== undefined && { parentId: normalizedParentId }),
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("Update folder error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
