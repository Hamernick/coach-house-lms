import { describe, expect, it } from "vitest"

import { resolveAcceleratorProgressRailState } from "@/components/accelerator/accelerator-progress-rail"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"

describe("accelerator progress rail", () => {
  it("fills only the first segment before the fundable checkpoint", () => {
    const state = resolveAcceleratorProgressRailState({
      progressPercent: 42,
      fundableCheckpoint: ACCELERATOR_FUNDABLE_THRESHOLD,
      verifiedCheckpoint: ACCELERATOR_VERIFIED_THRESHOLD,
    })

    expect(state.firstSegmentFill).toBe(42)
    expect(state.secondSegmentWidth).toBe(0)
    expect(state.fundableReached).toBe(false)
    expect(state.verifiedReached).toBe(false)
    expect(state.firstSegmentClass).toBe("bg-amber-500")
  })

  it("fills through the verified segment after both checkpoints are reached", () => {
    const state = resolveAcceleratorProgressRailState({
      progressPercent: 100,
      fundableCheckpoint: ACCELERATOR_FUNDABLE_THRESHOLD,
      verifiedCheckpoint: ACCELERATOR_VERIFIED_THRESHOLD,
    })

    expect(state.firstSegmentFill).toBe(ACCELERATOR_FUNDABLE_THRESHOLD)
    expect(state.secondSegmentWidth).toBe(
      100 - ACCELERATOR_FUNDABLE_THRESHOLD,
    )
    expect(state.fundableReached).toBe(true)
    expect(state.verifiedReached).toBe(true)
    expect(state.firstSegmentClass).toBe("bg-emerald-500")
    expect(state.secondSegmentClass).toBe("bg-emerald-500")
  })
})
