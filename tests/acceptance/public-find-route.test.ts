import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readRoute(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public find routes", () => {
  it("does not render member onboarding as a blocking map overlay", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).not.toContain("PublicMapMemberOnboardingOverlay")
      expect(source).not.toContain("OnboardingWorkspaceCard")
      expect(source).not.toContain("completeOnboardingAction")
    }
  })
})
