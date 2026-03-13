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

    expect(resolveWorkspaceCanvasTutorialStep(4).id).toBe("accelerator-nav")
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(4, ["accelerator"])).toEqual([
      "organization-overview",
      "accelerator",
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
    expect(resolveWorkspaceCanvasTutorialContinueMode(4, ["accelerator"])).toBe("next")
    expect(resolveWorkspaceCanvasTutorialContinueMode(5, ["accelerator"])).toBe("next")
    expect(resolveWorkspaceCanvasTutorialContinueMode(6, ["accelerator"])).toBe("next")
    expect(resolveWorkspaceCanvasTutorialContinueMode(7, ["accelerator"])).toBe(
      "action",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(8, ["accelerator"])).toBe(
      "action",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(9)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(9)).toContain(
      "Calendar tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(10)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(10)).toContain(
      "Programs tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(11)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(11)).toContain(
      "Documents tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(12)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(12)).toContain(
      "Fundraising tool",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(13)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(13)).toContain(
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

    expect(resolveWorkspaceCanvasTutorialContinueMode(9, [...openedStepIds])).toBe(
      "shortcut",
    )
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(9, [...openedStepIds])).toBe(
      "calendar",
    )
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(9, [...openedStepIds])).toEqual([
      "organization-overview",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(9, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(9, [...openedStepIds])).toBeNull()
  })

  it("accumulates later opened tools while preserving the current-step selection", () => {
    const openedStepIds = ["accelerator", "calendar"] as const

    expect(resolveWorkspaceCanvasTutorialContinueMode(9, [...openedStepIds])).toBe(
      "next",
    )
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(9, [...openedStepIds])).toEqual([
      "organization-overview",
      "accelerator",
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(9, [...openedStepIds])).toEqual([
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(9, [...openedStepIds])).toBe(
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

  it("surfaces accelerator internal callouts before resuming the tool sequence", () => {
    expect(resolveWorkspaceCanvasTutorialCallout(4, ["accelerator"])).toEqual({
      kind: "accelerator-nav",
      label: "Accelerator navigation",
      instruction:
        "Use these arrows to move backward and forward through the accelerator.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(5, ["accelerator"])).toEqual({
      kind: "accelerator-picker",
      label: "Lesson picker",
      instruction:
        "Switch lesson groups here to move between lessons in the accelerator.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(6, ["accelerator"])).toEqual({
      kind: "accelerator-progress",
      label: "Accelerator progress",
      instruction:
        "Hover the milestone markers to see what it takes to reach Fundable and Verified.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(7, ["accelerator"])).toEqual({
      kind: "accelerator-first-module",
      label: "First module",
      instruction: "Click the first module step here to continue.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(8, ["accelerator"])).toEqual({
      kind: "accelerator-close-module",
      label: "Close module",
      instruction:
        "Click here to close this module and return to the accelerator.",
    })
  })

  it("anchors the collaboration step to the team access rail section", () => {
    expect(resolveWorkspaceCanvasTutorialStep(14).id).toBe("collaboration")
    expect(resolveWorkspaceCanvasTutorialCallout(14)).toEqual({
      kind: "team-access",
      label: "Team Access",
      instruction:
        "Use Team Access to invite members and manage who can work in this workspace.",
    })
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(14, [
      "accelerator",
      "calendar",
      "programs",
      "documents",
      "fundraising",
      "communications",
    ])).toBeNull()
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(14, [
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
