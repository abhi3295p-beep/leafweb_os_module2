import { z } from "zod";

export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  kind: z.enum(["document", "image", "archive", "media"]).default("document"),
});

export function validateUpload(input: unknown) {
  return fileUploadSchema.safeParse(input);
}

export function isAllowedMimeType(mimeType: string) {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/csv",
    "application/zip",
  ];

  return allowed.includes(mimeType);
}

export function simpleStorageKey(originalName: string, userId: string) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${safe}`;
}
