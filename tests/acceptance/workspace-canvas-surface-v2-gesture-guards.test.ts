import { describe, expect, it } from "vitest"

import {
  shouldPreventWorkspaceCanvasTouchZoom,
  shouldPreventWorkspaceCanvasWheelZoom,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-gesture-guards"

describe("workspace canvas gesture guards", () => {
  it("blocks ctrl-wheel browser zoom gestures on the workspace surface", () => {
    expect(shouldPreventWorkspaceCanvasWheelZoom(true)).toBe(true)
    expect(shouldPreventWorkspaceCanvasWheelZoom(false)).toBe(false)
  })

  it("blocks multi-touch gestures while allowing normal single-touch interaction", () => {
    expect(shouldPreventWorkspaceCanvasTouchZoom(2)).toBe(true)
    expect(shouldPreventWorkspaceCanvasTouchZoom(3)).toBe(true)
    expect(shouldPreventWorkspaceCanvasTouchZoom(1)).toBe(false)
  })
})
