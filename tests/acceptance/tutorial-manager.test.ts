import { describe, expect, it } from "vitest"

import { resolveHighlightTourTutorial } from "@/components/tutorial/tutorial-manager"

describe("TutorialManager", () => {
  it("ignores the removed platform highlight tour", () => {
    expect(resolveHighlightTourTutorial("platform")).toBeNull()
  })

  it("still resolves supported page tours", () => {
    expect(resolveHighlightTourTutorial("dashboard")).toBe("dashboard")
    expect(resolveHighlightTourTutorial("billing")).toBe("billing")
    expect(resolveHighlightTourTutorial("accelerator")).toBe("accelerator")
  })
})
