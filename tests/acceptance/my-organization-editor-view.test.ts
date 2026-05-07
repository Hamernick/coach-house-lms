import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("my organization editor view layout", () => {
  it("owns the scroll area when rendered in the full-bleed workspace shell", () => {
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/my-organization-editor-view.tsx",
    )

    expect(source).toContain('"flex h-full min-h-0 flex-col"')
    expect(source).toContain('"flex min-h-0 flex-1 flex-col gap-3"')
    expect(source).toContain('"min-h-0 flex-1 overflow-y-auto overscroll-contain"')
    expect(source).toContain('scrollbarGutter: "stable"')
    expect(source).not.toContain('embedded && "min-h-0 flex-1 overflow-y-auto"')
    expect(source).not.toContain('"space-y-3"')
  })
})
