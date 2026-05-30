import prisma from "@/lib/prisma";

export async function isOwnedFolder(folderId: string, userId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });

  return folder !== null;
}

export async function validateOptionalFolder(folderId: unknown, userId: string) {
  if (folderId === undefined || folderId === null || folderId === "") return null;
  if (typeof folderId !== "string") {
    return { error: "Folder ID must be a string", status: 400 };
  }

  const owned = await isOwnedFolder(folderId, userId);
  if (!owned) {
    return { error: "Folder not found", status: 404 };
  }

  return null;
}

export async function getOwnedOptionalFolderId(folderId: unknown, userId: string) {
  const validation = await validateOptionalFolder(folderId, userId);
  if (validation) {
    throw new Error(validation.error);
  }

  return typeof folderId === "string" && folderId.length > 0 ? folderId : null;
}
