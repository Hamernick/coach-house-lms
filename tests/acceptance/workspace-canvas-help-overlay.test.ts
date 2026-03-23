import { describe, expect, it, vi } from "vitest"

import {
  WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY,
  resolveWorkspaceCanvasHelpTipInitialVisibility,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-help-overlay"

describe("workspace canvas help overlay", () => {
  it("shows the tip when no dismissal has been stored", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
      },
    })

    expect(resolveWorkspaceCanvasHelpTipInitialVisibility()).toBe(true)
    vi.unstubAllGlobals()
  })

  it("keeps the tip hidden after it has been dismissed", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === WORKSPACE_CANVAS_HELP_TIP_STORAGE_KEY ? "true" : null,
        ),
      },
    })

    expect(resolveWorkspaceCanvasHelpTipInitialVisibility()).toBe(false)
    vi.unstubAllGlobals()
  })
})
