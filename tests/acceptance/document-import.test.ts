import { readFileSync } from "node:fs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  organization: vi.fn(),
  drive: vi.fn(),
}))
vi.mock("@/lib/supabase/route", () => ({
  createSupabaseRouteHandlerClient: mocks.client,
}))
vi.mock("@/lib/organization/active-org", () => ({
  resolveActiveOrganization: mocks.organization,
  canEditOrganization: (role: string) => role === "admin",
}))
vi.mock("@/features/google-drive", () => ({
  importGoogleDriveFile: mocks.drive,
  GoogleDriveError: class extends Error {},
}))

import {
  convertDocument,
  prepareDocumentImport,
} from "@/features/document-import"
import {
  importedDocumentHtml,
  mergeImportedDocument,
} from "@/features/document-import/lib"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { themeTextColor } from "@/lib/markdown/theme-colors"
import { resolveRoadmapSections, updateRoadmapSection } from "@/lib/roadmap"
import { buildDocumentsRoadmapSections } from "@/components/organization/org-profile-card/tabs/documents-tab/data"
import { buildRoadmapRows } from "@/components/organization/org-profile-card/tabs/documents-tab/hooks/use-documents-index-row-builders"
import {
  buildLibraryItems,
  isEmptyDocumentSlot,
} from "@/components/organization/org-profile-card/tabs/documents-tab/components/documents-library-items"

const docx = readFileSync("tests/fixtures/document-import/board-strategy.docx")
function request(name = "board.md", content = "# Board strategy") {
  const value = new NextRequest("http://localhost/api/document-import", {
    method: "POST",
  })
  const form = new FormData()
  form.set("file", new File([content], name))
  vi.spyOn(value, "formData").mockResolvedValue(form)
  return value
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.client.mockReturnValue({
    auth: {
      getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }),
    },
  })
  mocks.organization.mockResolvedValue({ orgId: "org-1", role: "admin" })
})

describe("document import", () => {
  it("converts DOCX text, bold, and tables to editable HTML", async () => {
    const document = await convertDocument({ name: "board.docx", bytes: docx })
    expect(document.html).toContain("Board strategy")
    expect(document.html).toContain(
      "<strong>Recruit three board members.</strong>"
    )
    expect(document.html).toContain("<table>")
  })
  it("extracts real legacy Word documents as text and explains formatting limits", async () => {
    const document = await convertDocument({
      name: "board.doc",
      bytes: readFileSync("tests/fixtures/document-import/legacy-board.doc"),
    })
    expect(document.html).toContain("Legacy board strategy")
    expect(document.warnings.join(" ")).toContain("text")
  })
  it("preserves Markdown headings, lists, tables, and safe links while removing executable content", async () => {
    const document = await convertDocument({
      name: "board.md",
      bytes: Buffer.from(
        "# Board\n\n**Recruit** members\n\n- Finance\n- Governance\n\n| Role | Date |\n| --- | --- |\n| Treasurer | Sep |\n\n[Source](https://example.org)\n\n<script>alert(1)</script><img src=x onerror=alert(1)>"
      ),
    })
    for (const tag of [
      "<h1>",
      "<strong>",
      "<ul>",
      "<table>",
      'href="https://example.org"',
    ])
      expect(document.html).toContain(tag)
    expect(document.html).not.toMatch(/script|onerror|<img/)
  })
  it.each(["file.exe", "file.doc", "file.docx"])(
    "rejects invalid %s contents",
    async (name) => {
      await expect(
        convertDocument({ name, bytes: Buffer.from("not a Word file") })
      ).rejects.toThrow()
    }
  )
  it("bounds empty input, oversized input/output, and decompressed DOCX sizes", async () => {
    await expect(
      convertDocument({ name: "empty.md", bytes: Buffer.alloc(0) })
    ).rejects.toThrow("non-empty")
    await expect(
      convertDocument({
        name: "huge.md",
        bytes: Buffer.alloc(15 * 1024 * 1024 + 1),
      })
    ).rejects.toThrow("15 MB")
    await expect(
      convertDocument({
        name: "long.md",
        bytes: Buffer.from("x".repeat(500_001)),
      })
    ).rejects.toThrow("too long")
    const oversized = Buffer.from(docx)
    const central = oversized.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))
    oversized.writeUInt32LE(31 * 1024 * 1024, central + 24)
    await expect(
      convertDocument({ name: "bomb.docx", bytes: oversized })
    ).rejects.toThrow("too large")
  })
  it("preserves supported text styles without allowing CSS URLs or event attributes", () => {
    const html = sanitizeHtml(
      '<p style="text-align:center"><span style="color:rgb(180, 20, 30);font-size:18px;font-family:Georgia;background-image:url(https://example.org/track);position:fixed" onclick="alert(1)">Styled</span></p>'
    )
    expect(html).toContain("text-align:center")
    expect(html).toContain("font-size:18px")
    expect(html).toContain("font-family:Georgia")
    expect(html).toContain(`color:${themeTextColor("rgb(180, 20, 30)")}`)
    expect(html).not.toMatch(/background-image|position|onclick|url\(/)
  })
  it("appends or replaces explicitly and retains Google source links", () => {
    const imported = importedDocumentHtml({
      html: "<p>Imported</p>",
      sourceUrl: "https://docs.google.com/document/d/example/edit",
    })
    expect(
      mergeImportedDocument("<p>Existing</p>", imported, "append")
    ).toContain("<p>Existing</p><p>Imported</p>")
    expect(
      mergeImportedDocument("<p>Existing</p>", imported, "replace")
    ).not.toContain("Existing")
    expect(imported).toContain(
      'href="https://docs.google.com/document/d/example/edit"'
    )
  })
  it("uses the same saved core text for the library and roadmap after reloading, excluding non-document sections", async () => {
    const imported = await convertDocument({
      name: "board.md",
      bytes: Buffer.from("# Governance\n\nRecruit members"),
    })
    const { nextProfile } = updateRoadmapSection({}, "board_strategy", {
      content: imported.html,
    })
    const resolved = resolveRoadmapSections(
      JSON.parse(JSON.stringify(nextProfile))
    )
    const sections = buildDocumentsRoadmapSections({
      canAccessRoadmapDocuments: true,
      roadmapSections: resolved,
    })
    expect(sections.map((section) => section.id)).not.toEqual(
      expect.arrayContaining([
        "program",
        "people",
        "board_calendar",
        "next_actions",
      ])
    )
    for (const id of ["program", "people", "board_calendar", "next_actions"])
      expect(sections.some((section) => section.id === id)).toBe(false)
    const items = buildLibraryItems(buildRoadmapRows(sections), [], [], true)
    const board = items.find((item) => item.id === "roadmap:board_strategy")!
    expect(board.contentPreview).toContain("Recruit members")
    expect(board.href).toBe("/roadmap/board-strategy")
    expect(board.updatedAt).not.toBeNull()
    expect(isEmptyDocumentSlot(board)).toBe(false)
    expect(
      resolved.find((section) => section.id === "board_strategy")?.content
    ).toBe(imported.html)
  })
  it("requires authentication and organization edit permission before converting", async () => {
    mocks.client.mockReturnValueOnce({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    })
    expect((await prepareDocumentImport(request())).status).toBe(401)
    mocks.organization.mockResolvedValueOnce({ orgId: "org-1", role: "board" })
    expect((await prepareDocumentImport(request())).status).toBe(403)
    expect(mocks.drive).not.toHaveBeenCalled()
  })
  it("prepares local imports without saving content", async () => {
    const response = await prepareDocumentImport(request())
    expect(response.status).toBe(200)
    expect((await response.json()).document.html).toContain(
      "<h1>Board strategy</h1>"
    )
    expect(response.headers.get("cache-control")).toBe("private, no-store")
  })
  it("uses the requesting user's Drive grant and retains the selected source", async () => {
    mocks.drive.mockResolvedValue({
      name: "board.docx",
      bytes: docx,
      sourceUrl: "https://docs.google.com/document/d/example/edit",
    })
    const response = await prepareDocumentImport(
      new NextRequest("http://localhost/api/document-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ driveFileId: "selected-file-1" }),
      })
    )
    expect(response.status).toBe(200)
    expect(mocks.drive).toHaveBeenCalledWith({
      userId: "user-1",
      fileId: "selected-file-1",
    })
    expect((await response.json()).document.sourceUrl).toContain(
      "docs.google.com"
    )
  })
})
