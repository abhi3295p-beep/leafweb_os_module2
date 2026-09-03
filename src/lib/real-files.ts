import { prisma } from "../../db";

import type { AuthenticatedUser } from "@/lib/auth";
import { ensureClientAccess, ensurePermission, requireDatabase } from "@/lib/db-guard";
import { PERMISSIONS } from "@/lib/permissions";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "text/plain",
]);

export async function validateAndCreateFileRecord(
  user: AuthenticatedUser,
  input: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    clientId?: string | null;
    projectId?: string | null;
  },
) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.FILE_UPLOAD);
  ensureClientAccess(user, input.clientId ?? null);

  if (!input.originalName || input.originalName.length > 255) {
    throw new Error("Invalid original file name");
  }

  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new Error("Unsupported file type");
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > 25 * 1024 * 1024) {
    throw new Error("File size out of bounds");
  }

  return prisma.fileObject.create({
    data: {
      storageKey: input.storageKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      extension: input.originalName.split(".").pop() ?? "bin",
      sizeBytes: input.sizeBytes,
      uploadedById: user.id,
      clientId: input.clientId ?? null,
      projectId: input.projectId ?? null,
      visibility: "PRIVATE",
    },
  });
}

export async function authorizeFileAccess(user: AuthenticatedUser, fileId: string) {
  requireDatabase();

  const file = await prisma.fileObject.findUnique({ where: { id: fileId } });
  if (!file) throw new Error("File not found");

  if (user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) return file;
  if (user.clientId && file.clientId && user.clientId === file.clientId) return file;
  if (user.permissions.includes(PERMISSIONS.FILE_READ)) return file;

  throw new Error("File access denied");
}

export async function downloadFileForUser(user: AuthenticatedUser, fileId: string) {
  requireDatabase();
  ensurePermission(user, PERMISSIONS.FILE_DOWNLOAD);
  return authorizeFileAccess(user, fileId);
}
