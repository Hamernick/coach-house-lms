import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("home-canvas scroll behavior", () => {
  it("keeps scrolling inside the active tab without changing tabs", () => {
    const preview = readSource("src/components/public/home-canvas-preview.tsx")
    const navigation = readSource(
      "src/components/public/home-canvas-preview-navigation.ts"
    )
    const behavior = readSource("src/components/public/home-canvas-behavior.ts")

    expect(preview).not.toContain("onWheel=")
    expect(preview).not.toContain("onTouchEnd=")
    expect(preview).not.toContain("onKeyDown=")
    expect(preview).not.toContain("goToAdjacentSection")
    expect(navigation).not.toContain("resolveWheelSectionDelta")
    expect(navigation).not.toContain("resolveSwipeSectionDelta")
    expect(navigation).not.toContain("goToAdjacentSection")
    expect(behavior).toContain('sectionId === "platform"')
    expect(behavior).toContain('sectionId === "accelerator"')
    expect(preview).toContain('"overflow-x-hidden overflow-y-auto"')
  })
})
