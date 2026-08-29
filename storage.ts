export type FileMetadata = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
};

export type StoredFile = {
  storageKey: string;
  driver: "local" | "s3" | "r2";
};

/**
 * FileStorage is an integration boundary.
 * Development uses local disk outside /public.
 * Production should use S3 or R2. Private files must never be served from /public/uploads.
 */
export interface FileStorage {
  put(file: FileMetadata): Promise<StoredFile>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/zip",
] as const;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
