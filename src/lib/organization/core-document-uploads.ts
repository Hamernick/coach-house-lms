import { getRoadmapSectionDefinition } from "@/lib/roadmap/definitions"

export function isCoreDocumentSectionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Boolean(getRoadmapSectionDefinition(value)) &&
    value === value.trim()
  )
}

// The server writes this folder when attaching a library file to a core card.
// Keeping the section in the storage path preserves it through reload/restore.
export function getCoreDocumentSectionId(
  storagePath: string
): string | undefined {
  const [, library, core, sectionId] = storagePath.split("/")
  return library === "library" &&
    core === "core" &&
    isCoreDocumentSectionId(sectionId)
    ? sectionId
    : undefined
}

const NON_DOCUMENT_SECTIONS = new Set([
  "program",
  "people",
  "board_calendar",
  "next_actions",
])
export function isDocumentsSectionVisible(sectionId: string) {
  return !NON_DOCUMENT_SECTIONS.has(sectionId)
}
