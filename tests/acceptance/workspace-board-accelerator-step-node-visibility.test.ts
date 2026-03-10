import { describe, expect, it } from "vitest"

import { resolveAcceleratorStepNodeVisibilityTransition } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-accelerator-step-node-visibility"

describe("workspace accelerator step-node visibility transition", () => {
  it("closes the step node and remembers it when the accelerator card is hidden", () => {
    const next = resolveAcceleratorStepNodeVisibilityTransition({
      acceleratorCardVisible: false,
      stepNodeVisible: true,
      restoreStepNodeOnCardShow: false,
    })

    expect(next).toEqual({
      stepNodeVisible: false,
      restoreStepNodeOnCardShow: true,
    })
  })

  it("restores the step node when the accelerator card is shown again", () => {
    const next = resolveAcceleratorStepNodeVisibilityTransition({
      acceleratorCardVisible: true,
      stepNodeVisible: false,
      restoreStepNodeOnCardShow: true,
    })

    expect(next).toEqual({
      stepNodeVisible: true,
      restoreStepNodeOnCardShow: false,
    })
  })

  it("keeps state unchanged when no restoration is needed", () => {
    const next = resolveAcceleratorStepNodeVisibilityTransition({
      acceleratorCardVisible: true,
      stepNodeVisible: false,
      restoreStepNodeOnCardShow: false,
    })

    expect(next).toEqual({
      stepNodeVisible: false,
      restoreStepNodeOnCardShow: false,
    })
  })
})
