import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("accelerator overview route composition", () => {
  it("keeps the route composition-only without changing its content contract", () => {
    const route = readSource("src/app/(accelerator)/accelerator/page.tsx")
    const content = readSource(
      "src/app/(accelerator)/accelerator/_components/accelerator-overview-page-content.tsx"
    )

    expect(route).toContain("AcceleratorOverviewPageContent")
    expect(route).toContain('export const runtime = "edge"')
    expect(route).toContain('export const dynamic = "force-dynamic"')
    expect(route).not.toContain("createSupabaseServerClient")
    expect(route).not.toContain("fetchAcceleratorProgressSummary")

    expect(content).toContain(
      "export async function AcceleratorOverviewPageContent()"
    )
    expect(content).toContain("createSupabaseServerClient")
    expect(content).toContain("fetchAcceleratorProgressSummary")
    expect(content).toContain(
      "applyOrganizationSetupAcceleratorProgressOverride"
    )
    expect(content).toContain("<AcceleratorOrgSnapshotStrip")
    expect(content).toContain("<RoadmapOutlineCard")
  })
})
