import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("documents toolbar", () => {
  it("provides the responsive library controls without renaming Documents", () => {
    const toolbarSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-toolbar.tsx"
    )
    const newMenuSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-new-menu.tsx"
    )
    const filterMenuSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-toolbar-filter-menu.tsx"
    )
    const inputPrimitiveSource = readSource("src/components/ui/input.tsx")

    expect(toolbarSource).toContain("h-11 rounded-full")
    expect(toolbarSource).toContain("bg-muted/70")
    expect(toolbarSource).toContain("dark:bg-white/10")
    expect(toolbarSource).toContain("Documents")
    expect(toolbarSource).toContain("Grid view")
    expect(toolbarSource).toContain("List view")
    expect(newMenuSource).toContain("https://docs.new")
    expect(newMenuSource).toContain("Connect Google Drive")
    expect(newMenuSource).toContain("multiple")
    expect(newMenuSource).not.toContain('accept="application/pdf"')
    expect(newMenuSource).not.toContain("Start chat")
    expect(filterMenuSource).toContain("lucide-react/dist/esm/icons/waypoints")
    expect(filterMenuSource).toContain("Strategic Roadmap")
    expect(filterMenuSource).not.toContain("Generated")
    expect(inputPrimitiveSource).not.toContain("rounded-full")
    expect(inputPrimitiveSource).not.toContain("dark:bg-white/10")
  })
})
