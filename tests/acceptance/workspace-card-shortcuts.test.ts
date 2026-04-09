import React from "react"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { buildWorkspaceCardShortcutItemModels } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-model"
import {
  WorkspaceCardShortcutButton,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-button"

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
      "programs",
      "roadmap",
    ])
  })

  it("keeps calendar off the live shortcut rail outside the tutorial", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
    })

    expect(items.some((item) => item.id === "calendar")).toBe(false)
  })

  it("forces the tutorial shortcut button to advance without triggering a competing card focus", () => {
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
      tutorialInstruction: "Click the Programs button and continue.",
      onTutorialAdvance,
    })

    const programsItem = items.find((item) => item.id === "programs")

    expect(programsItem?.tutorialCallout?.instruction).toContain(
      "Programs button",
    )
    programsItem?.onPress()

    expect(onToggle).not.toHaveBeenCalled()
    expect(onFocusCard).not.toHaveBeenCalled()
    expect(onTutorialAdvance).toHaveBeenCalledTimes(1)
  })

  it("does not resurrect calendar in the shortcut rail for tutorial-owned flows", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: ["calendar"],
      visibleCardIds: ["organization-overview"],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
      tutorialTargetCardId: "calendar",
      tutorialInstruction: "Click the Calendar button and continue.",
      onTutorialAdvance: vi.fn(),
    })

    expect(items.some((item) => item.id === "calendar")).toBe(false)
  })

  it("does not toggle a board-visible tutorial target closed when the tutorial scene has not revealed it yet", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const onTutorialAdvance = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      visibleCardIds: ["organization-overview"],
      selectedCardId: null,
      onToggle,
      onFocusCard,
      tutorialTargetCardId: "accelerator",
      tutorialInstruction: "Click the Accelerator button and continue.",
      onTutorialAdvance,
    })

    const acceleratorItem = items.find((item) => item.id === "accelerator")

    acceleratorItem?.onPress()

    expect(onToggle).not.toHaveBeenCalled()
    expect(onFocusCard).not.toHaveBeenCalled()
    expect(onTutorialAdvance).toHaveBeenCalledTimes(1)
  })

  it("focuses the accelerator instead of toggling it closed from the shortcut rail", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      visibleCardIds: ["organization-overview", "accelerator"],
      selectedCardId: "organization-overview",
      onToggle,
      onFocusCard,
    })

    const acceleratorItem = items.find((item) => item.id === "accelerator")

    acceleratorItem?.onPress()

    expect(onToggle).not.toHaveBeenCalled()
    expect(onFocusCard).toHaveBeenCalledWith("accelerator")
  })

  it("focuses the roadmap instead of toggling it closed from the shortcut rail", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      visibleCardIds: ["organization-overview", "roadmap"],
      selectedCardId: "organization-overview",
      onToggle,
      onFocusCard,
    })

    const roadmapItem = items.find((item) => item.id === "roadmap")

    roadmapItem?.onPress()

    expect(onToggle).not.toHaveBeenCalled()
    expect(onFocusCard).toHaveBeenCalledWith("roadmap")
  })

  it("opens the roadmap before focusing it when a legacy hidden state still exists", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: ["roadmap"],
      visibleCardIds: ["organization-overview"],
      selectedCardId: "organization-overview",
      onToggle,
      onFocusCard,
    })

    const roadmapItem = items.find((item) => item.id === "roadmap")

    roadmapItem?.onPress()

    expect(onToggle).toHaveBeenCalledWith("roadmap", { source: "dock" })
    expect(onFocusCard).toHaveBeenCalledWith("roadmap")
  })

  it("opens the accelerator before focusing it when a legacy hidden state still exists", () => {
    const onToggle = vi.fn()
    const onFocusCard = vi.fn()
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: ["accelerator"],
      visibleCardIds: ["organization-overview"],
      selectedCardId: "organization-overview",
      onToggle,
      onFocusCard,
    })

    const acceleratorItem = items.find((item) => item.id === "accelerator")

    acceleratorItem?.onPress()

    expect(onToggle).toHaveBeenCalledWith("accelerator", { source: "dock" })
    expect(onFocusCard).toHaveBeenCalledWith("accelerator")
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
    expect(items.some((item) => item.id === "calendar")).toBe(false)
  })

  it("uses the blue highlight treatment for the tutorial tools step", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceCardShortcutButton, {
        item: {
          id: "accelerator",
          title: "Accelerator",
          icon: Building2Icon,
          visible: false,
          selected: false,
          comingSoon: false,
          tutorialHighlighted: true,
          tutorialCallout: null,
          onPress: vi.fn(),
        },
      }),
    )

    expect(markup).toContain("bg-sky-50/85")
    expect(markup).toContain("dark:bg-sky-500/14")
  })

  it("anchors the accelerator tutorial callout on the right edge of the shortcut button", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceCardShortcutButton, {
        item: {
          id: "accelerator",
          title: "Accelerator",
          icon: Building2Icon,
          visible: false,
          selected: false,
          comingSoon: false,
          tutorialHighlighted: false,
          tutorialCallout: {
            instruction: "Click the Accelerator button and continue.",
          },
          onPress: vi.fn(),
        },
      }),
    )

    expect(markup).toContain('style="right:0;top:50%;transform:translate(0px, calc(-50% + 0px))"')
  })

  it("tags the shortcut trigger with stable react-grab ownership metadata", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceCardShortcutButton, {
        item: {
          id: "calendar",
          title: "Calendar",
          icon: Building2Icon,
          visible: false,
          selected: false,
          comingSoon: false,
          tutorialHighlighted: false,
          tutorialCallout: null,
          onPress: vi.fn(),
        },
      }),
    )

    expect(markup).toContain(
      'data-react-grab-owner-component="WorkspaceCardShortcutButton"',
    )
    expect(markup).toContain(
      'data-react-grab-owner-source="src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/shortcuts/workspace-card-shortcut-button.tsx"',
    )
  })

  it("hides fundraising and communications from the live shortcut rail", () => {
    const items = buildWorkspaceCardShortcutItemModels({
      hiddenCardIds: [],
      selectedCardId: null,
      onToggle: vi.fn(),
      onFocusCard: vi.fn(),
    })

    expect(items.some((item) => item.id === "economic-engine")).toBe(false)
    expect(items.some((item) => item.id === "communications")).toBe(false)
  })
})
