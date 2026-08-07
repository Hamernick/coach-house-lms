import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
}

const fixture = readSource(
  "src/app/(public)/visual-regression/fiscal-sponsorship-role-journeys/fixture.tsx"
)
const page = readSource(
  "src/app/(public)/visual-regression/fiscal-sponsorship-role-journeys/page.tsx"
)
const browserSpec = readSource(
  "tests/visual/fiscal-sponsorship-role-journeys.visual.spec.ts"
)

describe("fiscal sponsorship browser role journey contract", () => {
  it("keeps the fixture unavailable in production", () => {
    expect(page).toContain('process.env.NODE_ENV === "production"')
    expect(page).toContain("notFound()")
    expect(page).toContain("robots: { index: false, follow: false }")
  })

  it("renders the production workbench through its public feature entrypoint", () => {
    expect(fixture).toContain('from "@/features/fiscal-sponsorship"')
    expect(fixture).toContain("FiscalSponsorshipProjectWorkbench")
    expect(fixture).toContain("buildFiscalSponsorshipProjectWorkbenchData")
    expect(fixture).not.toContain(
      'from "@/features/fiscal-sponsorship/components'
    )
  })

  it("covers each required role in a hydrated browser", () => {
    for (const evidence of [
      "applicant can resume",
      "assigned coach can approve",
      "sponsor operator can prepare",
      "unassigned role receives no fiscal workbench controls",
      'getByTestId("role-journey-hydrated")',
    ]) {
      expect(browserSpec).toContain(evidence)
    }
  })
})
