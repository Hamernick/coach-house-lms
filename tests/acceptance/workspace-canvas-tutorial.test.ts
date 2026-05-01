import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  clampWorkspaceCanvasTutorialStepIndex,
  isWorkspaceCanvasTutorialFinalStep,
  isWorkspaceCanvasTutorialStepAcknowledged,
  isWorkspaceCanvasTutorialStepOpened,
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialProgressPercent,
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

    expect(resolveWorkspaceCanvasTutorialStep(4).id).toBe("accelerator-picker")
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(4, ["accelerator"])).toEqual([
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
      "Accelerator button",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(4, ["accelerator"])).toBe("next")
    expect(resolveWorkspaceCanvasTutorialContinueMode(5, ["accelerator"])).toBe(
      "action",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(6, ["accelerator"])).toBe("next")
    expect(resolveWorkspaceCanvasTutorialContinueMode(7)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(7)).toContain(
      "Calendar button",
    )
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(7)).toBe("calendar")
    expect(resolveWorkspaceCanvasTutorialContinueMode(8)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(8)).toContain(
      "Programs button",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(9)).toBe("shortcut")
    expect(resolveWorkspaceCanvasTutorialShortcutInstruction(9)).toContain(
      "Roadmap button",
    )
    expect(resolveWorkspaceCanvasTutorialContinueMode(10)).toBe("next")
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
      "accelerator",
    ])
  })

  it("does not keep previously opened tools visible on later prompt steps", () => {
    const openedStepIds = ["accelerator"] as const

    expect(resolveWorkspaceCanvasTutorialContinueMode(7, [...openedStepIds])).toBe(
      "shortcut",
    )
    expect(resolveWorkspaceCanvasTutorialPromptTargetCardId(7, [...openedStepIds])).toBe(
      "calendar",
    )
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(7, [...openedStepIds])).toEqual([
      "organization-overview",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(7, [...openedStepIds])).toEqual([
      "organization-overview",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(7, [...openedStepIds])).toBeNull()
  })

  it("targets the viewport calendar control instead of the shortcut rail during the calendar step", () => {
    expect(resolveWorkspaceCanvasTutorialCallout(7)).toEqual({
      kind: "calendar-viewport-button",
      cardId: "calendar",
      label: "Calendar",
      instruction: "Click the Calendar button and continue.",
    })
  })

  it("keeps accelerator internal steps focused on the accelerator card only", () => {
    expect(
      resolveWorkspaceCanvasTutorialVisibleCardIds(4, ["accelerator"]),
    ).toEqual(["accelerator"])
    expect(
      resolveWorkspaceCanvasTutorialVisibleCardIds(5, ["accelerator"]),
    ).toEqual(["accelerator"])
    expect(
      resolveWorkspaceCanvasTutorialVisibleCardIds(6, [
        "accelerator",
        "accelerator-first-module",
      ]),
    ).toEqual(["accelerator"])
  })

  it("shows only the current tool once a later shortcut step is opened", () => {
    const openedStepIds = ["accelerator", "calendar"] as const

    expect(resolveWorkspaceCanvasTutorialContinueMode(7, [...openedStepIds])).toBe(
      "next",
    )
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(7, [...openedStepIds])).toEqual([
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(7, [...openedStepIds])).toEqual([
      "calendar",
    ])
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(7, [...openedStepIds])).toBe(
      "calendar",
    )
  })

  it("opens each later shortcut step into its own selected card phase", () => {
    expect(
      resolveWorkspaceCanvasTutorialSelectedCardId(8, [
        "accelerator",
        "calendar",
        "programs",
      ]),
    ).toBe("programs")
    expect(
      resolveWorkspaceCanvasTutorialSelectedCardId(9, [
        "accelerator",
        "calendar",
        "programs",
        "roadmap",
      ]),
    ).toBe("roadmap")
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(10, [
      "accelerator",
      "calendar",
      "programs",
      "roadmap",
    ])).toBeNull()
  })

  it("trims later opened steps back to the destination step snapshot", () => {
    const openedStepIds = ["accelerator", "calendar"] as const

    expect(resolveWorkspaceCanvasTutorialTrimmedStepIds(3, [...openedStepIds])).toEqual([
      "accelerator",
    ])
    expect(resolveWorkspaceCanvasTutorialVisibleCardIds(3, [...openedStepIds])).toEqual([
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

  it("surfaces accelerator internal callouts only for the interactive accelerator controls", () => {
    expect(resolveWorkspaceCanvasTutorialCallout(4, ["accelerator"])).toEqual({
      kind: "accelerator-picker",
      label: "Class tracks",
      instruction:
        "Choose a class track here to update the lesson list and focus on a different part of the Accelerator.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(5, ["accelerator"])).toEqual({
      kind: "accelerator-first-module",
      label: "First lesson",
      instruction: "Click the Organization Set up option here to continue.",
    })
    expect(resolveWorkspaceCanvasTutorialCallout(6, ["accelerator"])).toBeNull()
    expect(resolveWorkspaceCanvasTutorialStep(6)).toMatchObject({
      title: "Lesson preview",
      message:
        "This is what an accelerator lesson looks like inside the workspace. Use Continue below, or the guide Next button, when you're ready to move on.",
    })
  })

  it("anchors the collaboration step to the team access rail section", () => {
    expect(resolveWorkspaceCanvasTutorialStep(10).id).toBe("collaboration")
    expect(resolveWorkspaceCanvasTutorialCallout(10)).toEqual({
      kind: "team-access",
      label: "Team Access",
      instruction:
        "Use Team Access to invite members and manage who can work in this workspace.",
    })
    expect(resolveWorkspaceCanvasTutorialSelectedCardId(10, [
      "accelerator",
      "calendar",
      "programs",
      "roadmap",
    ])).toBeNull()
    expect(resolveWorkspaceCanvasTutorialSceneFocusCardIds(10, [
      "accelerator",
      "calendar",
      "programs",
      "roadmap",
    ])).toEqual(["organization-overview"])
  })

  it("clamps out-of-range step indices safely", () => {
    const lastIndex = resolveWorkspaceCanvasTutorialStepCount() - 1

    expect(clampWorkspaceCanvasTutorialStepIndex(-8)).toBe(0)
    expect(clampWorkspaceCanvasTutorialStepIndex(99)).toBe(lastIndex)
    expect(resolveWorkspaceCanvasTutorialStep(99).id).toBe("collaboration")
  })

  it("reports tutorial progress as a rounded percentage", () => {
    const stepCount = resolveWorkspaceCanvasTutorialStepCount()

    expect(resolveWorkspaceCanvasTutorialProgressPercent(0, stepCount)).toBe(
      Math.round(100 / stepCount),
    )
    expect(resolveWorkspaceCanvasTutorialProgressPercent(1, stepCount)).toBe(
      Math.round(200 / stepCount),
    )
    expect(resolveWorkspaceCanvasTutorialProgressPercent(stepCount - 1, stepCount)).toBe(100)
  })

  it("returns the connected workspace resting state when the tutorial completes", () => {
    expect(isWorkspaceCanvasTutorialFinalStep(resolveWorkspaceCanvasTutorialStepCount() - 1)).toBe(true)
    expect(buildWorkspaceCanvasTutorialCompletionHiddenCardIds()).toEqual([
      "brand-kit",
      "economic-engine",
      "calendar",
      "communications",
      "atlas",
    ])
  })
})
