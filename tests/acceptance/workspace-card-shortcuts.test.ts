import { describe, expect, it, vi } from "vitest"

import { buildWorkspaceCardShortcutItemModels } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-model"

describe("workspace card shortcuts", () => {
  it("does not expose the organization card as a shortcut button", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
    })

    expect(items.some((item) => item.id === "organization-overview")).toBe(false)
    expect(items.some((item) => item.title === "Organization")).toBe(false)
  })

  it("includes the standalone programs card in the workspace shortcut rail", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
    })

    expect(items.some((item) => item.id === "programs")).toBe(true)
    expect(items.some((item) => item.title === "Programs")).toBe(true)
  })

  it("orders the workspace shortcut buttons to match the organization card rail", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
    })

    expect(items.map((item) => item.id)).toEqual([
      "accelerator",
      "calendar",
      "programs",
      "vault",
      "economic-engine",
      "communications",
    ])
  })

  it("forces the tutorial shortcut button to advance without toggling the visible card closed", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const onTutorialAdvance = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      visibleCardIds: ["programs"],
      selectedCardId: "programs",
      onToggle,
      onFocusCard,
      tutorialTargetCardId: "programs",
      tutorialInstruction: "Click to open the Programs tool and continue.",
      onTutorialAdvance,
    })

    const programsItem = items.find((item) => item.id === "programs")

    expect(programsItem?.tutorialCallout?.instruction).toContain(
      "Programs tool",
    )
    programsItem?.onPress()

    expect(onToggle).not.toHaveBeenCalled()
    expect(onFocusCard).toHaveBeenCalledWith("programs")
    expect(onTutorialAdvance).toHaveBeenCalledTimes(1)
  })

  it("opens a hidden tutorial target before handing control back to the guide", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const onTutorialAdvance = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: ["calendar"],
      visibleCardIds: ["organization-overview"],
      selectedCardId: null,
      onToggle,
      onFocusCard,
      tutorialTargetCardId: "calendar",
      tutorialInstruction: "Click to open the Calendar tool and continue.",
      onTutorialAdvance,
    })

    const calendarItem = items.find((item) => item.id === "calendar")

    calendarItem?.onPress()

    expect(onToggle).toHaveBeenCalledWith("calendar", { source: "dock" })
    expect(onFocusCard).toHaveBeenCalledWith("calendar")
    expect(onTutorialAdvance).toHaveBeenCalledTimes(1)
  })

  it("can highlight all shortcut buttons during the tutorial intro step", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      visibleCardIds: ["organization-overview"],
      selectedCardId: "organization-overview",
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
      tutorialHighlightAll: true,
    })

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.tutorialHighlighted)).toBe(true)
    expect(items.every((item) => item.tutorialCallout === null)).toBe(true)
  })
})
