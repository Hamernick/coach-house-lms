import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace canvas v2 viewport controls", () => {
  it("keeps the reset view action removed from the viewport control path", () => {
    const hookSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-viewport-controls.ts"
    )
    const surfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2.tsx"
    )
    const flowSurfaceSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface.tsx"
    )

    expect(hookSource).not.toContain("handleResetView")
    expect(surfaceSource).not.toContain("onResetView")
    expect(hookSource).not.toContain("onResetToBaseLayout")
    expect(surfaceSource).not.toContain("onResetToBaseLayout")
    expect(flowSurfaceSource).not.toContain("onResetToBaseLayout")
  })

  it("keeps zoom and recenter controls while omitting reset view", () => {
    const panelSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-viewport-controls-panel.tsx"
    )

    expect(panelSource).toContain('aria-label="Zoom out"')
    expect(panelSource).toContain('aria-label="Zoom in"')
    expect(panelSource).toContain('aria-label="Recenter view"')
    expect(
      panelSource.match(/size-11 touch-manipulation rounded-xl md:size-9/g)
    ).toHaveLength(3)
    expect(panelSource).toContain(
      "ownerId: `workspace-canvas:viewport-${control}`"
    )
    expect(panelSource).not.toContain("RotateCcwIcon")
    expect(panelSource).not.toContain("MyOrganizationCalendarView")
    expect(panelSource).not.toContain('aria-label="Reset view"')
    expect(panelSource).not.toContain('title="Reset view"')
  })
})
