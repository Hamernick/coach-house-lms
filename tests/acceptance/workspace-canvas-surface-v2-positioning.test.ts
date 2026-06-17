import { describe, expect, it } from "vitest"

import { resolveWorkspaceCanvasV2InitialPositionLookup } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-positioning"
import { WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/contracts/workspace-card-contract"

describe("workspace canvas v2 positioning", () => {
  it("includes fiscal sponsorship in the initial position lookup", () => {
    const lookup = resolveWorkspaceCanvasV2InitialPositionLookup([], {
      x: 120,
      y: 208,
    })

    expect(lookup["fiscal-sponsorship"]).toEqual(
      WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS["fiscal-sponsorship"]
    )
  })
})
