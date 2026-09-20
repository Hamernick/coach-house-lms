// Match the existing private org-documents bucket's per-file limit.
export const MAX_UPLOAD_MB = 15
export const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024
export const ORGANIZATION_DOCUMENT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024

export const ORGANIZATION_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const
export const ORGANIZATION_DOCUMENT_ACCEPT =
  ORGANIZATION_DOCUMENT_MIME_TYPES.join(",")

export function validateOrganizationDocument(file: {
  type: string
  size: number
}) {
  if (!ORGANIZATION_DOCUMENT_MIME_TYPES.some((type) => type === file.type)) {
    return "Choose a PDF, JPEG, PNG, WebP, or GIF file."
  }
  if (file.size === 0) return "This file is empty. Choose another file."
  if (file.size > MAX_BYTES) return `File must be ${MAX_UPLOAD_MB} MB or less.`
  return null
}
