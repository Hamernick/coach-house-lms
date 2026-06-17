import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("documents toolbar", () => {
  it("styles the search input as a local library-search pill", () => {
    const toolbarSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-toolbar.tsx"
    )
    const inputPrimitiveSource = readSource("src/components/ui/input.tsx")

    expect(toolbarSource).toContain("DOCUMENTS_LIBRARY_SEARCH_INPUT_CLASSNAME")
    expect(toolbarSource).toContain("h-11 rounded-full")
    expect(toolbarSource).toContain("bg-muted/70")
    expect(toolbarSource).toContain("dark:bg-white/10")
    expect(toolbarSource).toContain("pl-11 pr-4")
    expect(toolbarSource).toContain("left-4 h-5 w-5")
    expect(toolbarSource).toContain("sm:max-w-[26rem]")
    expect(toolbarSource).not.toContain('className="h-10 pl-9"')
    expect(inputPrimitiveSource).not.toContain("rounded-full")
    expect(inputPrimitiveSource).not.toContain("dark:bg-white/10")
  })
})
