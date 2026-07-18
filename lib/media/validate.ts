export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

export const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function validateUpload(
  mimeType: string,
  sizeBytes: number,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME.has(mimeType)) {
    return { ok: false, error: `Unsupported file type: ${mimeType}` };
  }
  if (sizeBytes > MAX_SIZE_BYTES) {
    return {
      ok: false,
      error: `File too large (max ${Math.round(MAX_SIZE_BYTES / 1024 / 1024)} MB)`,
    };
  }
  return { ok: true };
}
