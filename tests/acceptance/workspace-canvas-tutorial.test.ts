import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  clampWorkspaceCanvasTutorialStepIndex,
  isWorkspaceCanvasTutorialFinalStep,
  isWorkspaceCanvasTutorialStepAcknowledged,
  isWorkspaceCanvasTutorialStepOpened,
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialPromptTargetCardId,
  resolveWorkspaceCanvasTutorialSceneFocusCardIds,
  resolveWorkspaceCanvasTutorialSelectedCardId,
  resolveWorkspaceCanvasTutorialShortcutInstruction,
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
  resolveWorkspaceCanvasTutorialTrimmedStepIds,
  resolveWorkspaceCanvasTutorialVisibleCardIds,
} from "@/features/workspace-canvas-tutorial"

describe("workspace canvas tutorial", () => {
  it("starts with a centered welcome state that reveals no cards", () => {
    const step = resolveWorkspaceCanvasTutorialStep(0)

    expect(step.id).toBe("welcome")
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(0)).toBeNull()
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(0)).toBeNull()
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(0)).toEqual([])
  })

  it("reveals the expected card for each guided step", () => {
    expect(resolveWorkspaceCanvasTutorialStep(1).id).toBe("organization")
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(1)).toEqual([
      "organization-overview",
    ])

    expect(resolveWorkspaceCanvasTutorialStep(2).id).toBe("tool-buttons")
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(2)).toBeNull()
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(2)).toEqual([
      "organization-overview",
    ])

    expect(resolveWorkspaceCanvasTutorialStep(3).id).toBe("accelerator")
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(3)).toBe("accelerator")
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(3)).toBeNull()
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(3)).toEqual([
      "organization-overview",
    ])
  })

  it("keeps tool steps in prompt mode until their shortcut is opened", () => {
    expect(resolveWorkspaceCanvasTutorialContinueMode(2)).toBe("next")
    expect(resolveWorkspaceCanvasTutorialStep(2).highlightShortcutButtons).toBe(
      true,
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(3)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(3)).toContain(
      "Accelerator tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(4)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(4)).toContain(
      "Calendar tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(5)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(5)).toContain(
      "Programs tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(6)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(6)).toContain(
      "Documents tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(7)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(7)).toContain(
      "Fundraising tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(8)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(8)).toContain(
      "Communications tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(1)).toBe("next")
  })

  it("switches a tool step into its opened phase without auto-advancing", () => {
    const openedStepIds = ["accelerator"] as const

    expect(isWorkspaceCanvasTutorialStepOpened(3, [...openedStepIds])).toBe(true)
    expect(resolveWorkspaceCanvasTutorialContinueMode(3, [...openedStepIds])).toBe(
      "next",
    )
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(3, [...openedStepIds])).toBeNull()
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(3, [...openedStepIds])).toBe(
      "accelerator",
    )
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(3, [...openedStepIds])).toEqual([
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(3, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
    ])
  })

  it("keeps previously opened tools visible on later prompt steps", () => {
    const openedStepIds = ["accelerator"] as const

    expect(resolveWorkspaceCanvasTutorialContinueMode(4, [...openedStepIds])).toBe(
      "shortcut",
    )
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(4, [...openedStepIds])).toBe(
      "calendar",
    )
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(4, [...openedStepIds])).toEqual([
      "organization-overview",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(4, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(4, [...openedStepIds])).toBeNull()
  })

  it("accumulates later opened tools while preserving the current-step selection", () => {
    const openedStepIds = ["accelerator", "calendar"] as const

    expect(resolveWorkspaceCanvasTutorialContinueMode(4, [...openedStepIds])).toBe(
      "next",
    )
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(4, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(4, [...openedStepIds])).toEqual([
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(4, [...openedStepIds])).toBe(
      "calendar",
    )
  })

  it("trims later opened steps back to the destination step snapshot", () => {
    const openedStepIds = ["accelerator", "calendar", "communications"] as const

    expect(resolveWorkspaceCanvasTutorialTrimmedStepIds(3, [...openedStepIds])).toEqual([
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(3, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(3, [...openedStepIds])).toBe(
      "accelerator",
    )
  })

  it("tracks acknowledged steps separately from shortcut-opened steps", () => {
    expect(isWorkspaceCanvasTutorialStepAcknowledged(3, ["accelerator"])).toBe(true)
    expect(resolveWorkspaceCanvasTutorialContinueMode(3, [])).toBe("shortcut")
  })

  it("anchors the collaboration step to the team access rail section", () => {
    expect(resolveWorkspaceCanvasTutorialStep(9).id).toBe("collaboration")
    expect(resolveWorkspaceCanvasTutorialCallout(9)).toEqual({
      kind: "team-access",
      label: "Team Access",
      instruction:
        "Use Team Access to invite members and manage who can work in this workspace.",
    })
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(9, [
      "accelerator",
      "calendar",
      "programs",
      "documents",
      "fundraising",
      "communications",
    ])).toBeNull()
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(9, [
      "accelerator",
      "calendar",
      "programs",
      "documents",
      "fundraising",
      "communications",
    ])).toEqual(["organization-overview"])
  })

  it("clamps out-of-range step indices safely", () => {
    const lastIndex = resolveWorkspaceCanvasTutorialStepCount() - 1

    expect(clampWorkspaceCanvasTutorialStepIndex(-8)).toBe(0)
    expect(clampWorkspaceCanvasTutorialStepIndex(99)).toBe(lastIndex)
    expect(resolveWorkspaceCanvasTutorialStep(99).id).toBe("finish")
  })

  it("returns an organization-plus-accelerator resting state when the tutorial completes", () => {
    expect(isWorkspaceCanvasTutorialFinalStep(resolveWorkspaceCanvasTutorialStepCount() - 1)).toBe(true)
    expect(buildWorkspaceCanvasTutorialCompletionHiddenCardIds()).toEqual([
      "programs",
      "vault",
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "deck",
      "atlas",
    ])
  })
})
