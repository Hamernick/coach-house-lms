import { describe, expect, it } from "vitest"

import { buildDefaultBoardState } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout"
import { reduceWorkspaceBoardVisibility } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-visibility-reducer"

describe("workspace board visibility reducer", () => {
  it("dock accelerator toggle only toggles accelerator visibility", () => {
    const initial = buildDefaultBoardState("balanced")
    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })

    expect(next.hiddenCardIds).not.toContain("organization-overview")
    expect(next.hiddenCardIds).toContain("accelerator")
    expect(next.hiddenCardIds).not.toContain("programs")
    expect(next.hiddenCardIds).not.toContain("vault")
    expect(next.hiddenCardIds).not.toContain("economic-engine")
    expect(next.hiddenCardIds).not.toContain("calendar")
    expect(next.hiddenCardIds).not.toContain("communications")
  })

  it("dock close and reopen keeps accelerator step node closed", () => {
    const initial = {
      ...buildDefaultBoardState("balanced"),
      acceleratorUi: {
        stepOpen: true,
        lastStepId: "module-1:assignment",
      },
    }

    const afterIsolate = reduceWorkspaceBoardVisibility(initial, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })
    expect(afterIsolate.hiddenCardIds).toContain("accelerator")
    expect(afterIsolate.hiddenCardIds).not.toContain("programs")
    expect(afterIsolate.hiddenCardIds).not.toContain("vault")
    expect(afterIsolate.acceleratorUi?.stepOpen).toBe(false)
    expect(afterIsolate.acceleratorUi?.lastStepId).toBe("module-1:assignment")

    const afterHide = reduceWorkspaceBoardVisibility(afterIsolate, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })
    expect(afterHide.hiddenCardIds).not.toContain("accelerator")
    expect(afterHide.acceleratorUi?.stepOpen).toBe(false)
    expect(afterHide.acceleratorUi?.lastStepId).toBe("module-1:assignment")

    const afterReopen = reduceWorkspaceBoardVisibility(afterHide, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })
    expect(afterReopen.hiddenCardIds).toContain("accelerator")
    expect(afterReopen.hiddenCardIds).not.toContain("programs")
    expect(afterReopen.hiddenCardIds).not.toContain("vault")
    expect(afterReopen.hiddenCardIds).not.toContain("economic-engine")
    expect(afterReopen.hiddenCardIds).not.toContain("calendar")
    expect(afterReopen.hiddenCardIds).not.toContain("communications")
    expect(afterReopen.acceleratorUi?.stepOpen).toBe(false)
    expect(afterReopen.acceleratorUi?.lastStepId).toBe("module-1:assignment")
  })

  it("dock reopen preserves accelerator step node state when already open", () => {
    const initial = {
      ...buildDefaultBoardState("balanced"),
      hiddenCardIds: ["accelerator" as const, "programs" as const, "vault" as const],
      acceleratorUi: {
        stepOpen: true,
        lastStepId: "module-3:lesson",
      },
    }

    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })

    expect(next.hiddenCardIds).not.toContain("accelerator")
    expect(next.acceleratorUi?.stepOpen).toBe(true)
    expect(next.acceleratorUi?.lastStepId).toBe("module-3:lesson")
  })

  it("accelerator step close does not hide accelerator card", () => {
    const initial = {
      ...buildDefaultBoardState("balanced"),
      acceleratorUi: {
        stepOpen: true,
        lastStepId: "module-2:lesson",
      },
    }

    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "accelerator_step_close",
      source: "card",
    })

    expect(next.hiddenCardIds).not.toContain("accelerator")
    expect(next.acceleratorUi?.stepOpen).toBe(false)
    expect(next.acceleratorUi?.lastStepId).toBe("module-2:lesson")
  })

  it("context hide non-accelerator does not mutate accelerator ui", () => {
    const initial = {
      ...buildDefaultBoardState("balanced"),
      acceleratorUi: {
        stepOpen: true,
        lastStepId: "module-3:assignment",
      },
    }
    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "context_hide_card",
      cardId: "calendar",
    })

    expect(next.hiddenCardIds).toContain("calendar")
    expect(next.acceleratorUi).toEqual(initial.acceleratorUi)
  })

  it("organization remains visible when the rail attempts to hide it", () => {
    const initial = buildDefaultBoardState("balanced")
    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "dock_toggle_card",
      cardId: "organization-overview",
    })

    expect(next.hiddenCardIds).not.toContain("organization-overview")
  })

  it("hydrates missing accelerator ui state from accelerator progress", () => {
    const initial = {
      ...buildDefaultBoardState("balanced"),
      accelerator: {
        activeStepId: "module-4:resources",
        completedStepIds: [],
      },
      acceleratorUi: undefined,
    }

    const next = reduceWorkspaceBoardVisibility(initial, {
      type: "hydrate_legacy_visibility",
    })

    expect(next.acceleratorUi?.stepOpen).toBe(false)
    expect(next.acceleratorUi?.lastStepId).toBe("module-4:resources")
  })

  it("dock switching toggles only the requested cards without cascading descendants", () => {
    const initial = buildDefaultBoardState("balanced")
    const withAcceleratorVisible = reduceWorkspaceBoardVisibility(initial, {
      type: "dock_toggle_card",
      cardId: "accelerator",
    })
    const withVaultVisible = reduceWorkspaceBoardVisibility(withAcceleratorVisible, {
      type: "dock_toggle_card",
      cardId: "vault",
    })

    expect(withAcceleratorVisible.hiddenCardIds).toContain("accelerator")
    expect(withAcceleratorVisible.hiddenCardIds).not.toContain("vault")

    expect(withVaultVisible.hiddenCardIds).toContain("vault")
    expect(withVaultVisible.hiddenCardIds).toContain("accelerator")
    expect(withVaultVisible.hiddenCardIds).not.toContain("programs")
    expect(withVaultVisible.hiddenCardIds).not.toContain("economic-engine")
    expect(withVaultVisible.hiddenCardIds).not.toContain("calendar")
    expect(withVaultVisible.hiddenCardIds).not.toContain("communications")
  })
})
