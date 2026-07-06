import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("MemberWorkspaceProjectsPage", () => {
  it("does not render the top-level Add Organization header button", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/member-workspace/components/projects/member-workspace-projects-page.tsx"
      ),
      "utf8"
    )

    expect(source).not.toContain("Add Organization")
    expect(source).not.toContain('from "@/components/ui/button"')
    expect(source).not.toContain('@phosphor-icons/react/dist/ssr"')
    expect(source).toContain("onCreateProject={")
    expect(source).toContain("onAddProject={")
  })
})
