import { DocumentImportError } from "./import-error"

const activeUsers = new Set<string>()

// A per-process resource ceiling; this does not claim distributed rate limiting.
export function reserveDocumentImport(userId: string) {
  if (activeUsers.has(userId) || activeUsers.size >= 4) {
    throw new DocumentImportError(
      "An import is already running. Try again shortly.",
      429
    )
  }
  activeUsers.add(userId)
  return () => {
    activeUsers.delete(userId)
  }
}
