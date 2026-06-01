import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("org chart canvas controls", () => {
  it("does not render the old header action buttons", () => {
    const source = readFileSync("src/components/people/org-chart-canvas.tsx", "utf8")

    expect(source).not.toContain('from "@/components/ui/button"')
    expect(source).not.toContain("<Button")
    expect(source).not.toContain("Undo")
    expect(source).not.toContain("Redo")
    expect(source).not.toContain("Reset layout")
    expect(source).not.toContain('variant="outline" size="sm"')
  })
})
