import { describe, expect, it } from "vitest"
import { resolveRoadmapSections, updateRoadmapSection } from "@/lib/roadmap"
import { normalizeCoreDocumentDriveSource } from "@/lib/roadmap/core-document-source"
import {
  buildLibraryItems,
  isEmptyDocumentSlot,
} from "@/components/organization/org-profile-card/tabs/documents-tab/components/documents-library-items"
import { buildRoadmapRows } from "@/components/organization/org-profile-card/tabs/documents-tab/hooks/use-documents-index-row-builders"

const driveSource = {
  provider: "google_drive" as const,
  fileId: "selected_file_123",
  name: "Our Google document",
  webViewLink: "https://docs.google.com/document/d/selected_file_123/edit",
}

describe("Core Document Google Drive source", () => {
  it("keeps the canonical title and saved draft while linking Drive across reload", () => {
    const draft = updateRoadmapSection({}, "vision", {
      content: "<p>Saved draft</p>",
      status: "in_progress",
    })
    const linked = updateRoadmapSection(draft.nextProfile, "vision", {
      driveSource,
    })
    const loaded = resolveRoadmapSections(linked.nextProfile).find(
      (section) => section.id === "vision"
    )!
    expect(loaded.title).toBe(draft.section.title)
    expect(loaded.content).toBe("<p>Saved draft</p>")
    expect(loaded.driveSource).toEqual(driveSource)
    expect(loaded.documentSource).toBe("google_drive")
    const [item] = buildLibraryItems(buildRoadmapRows([loaded]), [], [])
    expect(item.name).toBe(draft.section.title)
    expect(item.href).toBe(driveSource.webViewLink)
    expect(item.contentPreview).toBeUndefined()
    expect(isEmptyDocumentSlot(item)).toBe(false)
  })

  it("treats a linked empty section as populated and keeps its update date", () => {
    const linked = updateRoadmapSection(
      { roadmap: { sections: [{ id: "vision", content: "" }] } },
      "vision",
      { driveSource }
    )
    const [item] = buildLibraryItems(buildRoadmapRows([linked.section]), [], [])
    expect(isEmptyDocumentSlot(item)).toBe(false)
    expect(item.updatedAt).toBe(linked.section.lastUpdated)
    expect(item.source).toBe("uploaded")
  })

  it("clears a slot without deleting its title or reattaching an older upload", () => {
    const linked = updateRoadmapSection({}, "vision", {
      content: "<p>Draft</p>",
      driveSource,
    })
    const removed = updateRoadmapSection(linked.nextProfile, "vision", {
      driveSource: null,
      content: "",
      budgetRows: [],
      status: "not_started",
    })
    const loaded = resolveRoadmapSections(removed.nextProfile).find(
      (section) => section.id === "vision"
    )!
    expect(loaded.title).toBe(linked.section.title)
    expect(loaded.driveSource).toBeNull()
    expect(loaded.content).toBe("")
    const items = buildLibraryItems(
      buildRoadmapRows([loaded]),
      [],
      [
        {
          id: "old-file",
          coreSectionId: "vision",
          name: "Prior.pdf",
          mimeType: "application/pdf",
          sizeBytes: 100,
          deletedAt: null,
          createdAt: "2026-09-20",
          updatedAt: "2026-09-20",
        },
      ]
    )
    expect(
      isEmptyDocumentSlot(items.find((item) => item.id === "roadmap:vision")!)
    ).toBe(true)
    expect(items.some((item) => item.id === "uploaded:old-file")).toBe(true)
  })

  it.each([
    "javascript:alert(1)",
    "https://docs.google.com.evil.test/file",
    "https://attacker.test/file",
    "https://user:secret@docs.google.com/file",
    "http://docs.google.com/file",
  ])("rejects unsafe persisted links: %s", (webViewLink) => {
    expect(
      normalizeCoreDocumentDriveSource({ ...driveSource, webViewLink })
    ).toBeNull()
  })
})
