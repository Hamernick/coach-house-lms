import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(path: string) {
  return readFileSync(join(ROOT, path), "utf8")
}

describe("organization profile read safety", () => {
  const workspaceProfileLoader = readSource(
    "src/app/(dashboard)/my-organization/_lib/my-organization-page-profile.ts",
  )
  const roadmapPage = readSource(
    "src/components/roadmap/strategic-roadmap-editor-page.tsx",
  )

  it("never writes the organization profile while rendering a page", () => {
    for (const source of [workspaceProfileLoader, roadmapPage]) {
      expect(source).not.toContain('.upsert(')
      expect(source).not.toContain('.update(')
      expect(source).not.toContain('.insert(')
    }
  })

  it("still normalizes legacy profile content in memory", () => {
    expect(workspaceProfileLoader).toContain(
      "cleanupOrgProfileHtml(orgRow?.profile ?? {}).nextProfile",
    )
    expect(roadmapPage).toContain(
      "cleanupOrgProfileHtml(orgRow?.profile ?? {})",
    )
    expect(roadmapPage).toContain(
      "cleanupRoadmapTestSections(htmlCleanup.nextProfile).nextProfile",
    )
  })
})
