import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceTutorialBodyLayoutClass,
  resolveWorkspaceTutorialBodyGridClass,
  resolveWorkspaceTutorialCopyRailClass,
  resolveWorkspaceTutorialPresentationSlotClass,
} from "@/features/workspace-canvas-tutorial/components/workspace-canvas-tutorial-panel-layout"
import {
  resolveWorkspaceTutorialPresentationHandoffDelayMs,
  resolveWorkspaceTutorialPresentationMotionPreset,
  resolveWorkspaceTutorialPresentationTransitionKey,
  shouldWorkspaceTutorialAnimateInitialPresentation,
} from "@/features/workspace-canvas-tutorial/components/workspace-canvas-tutorial-panel-motion"
import type { WorkspaceCanvasTutorialPresentationSurface } from "@/features/workspace-canvas-tutorial/types"

const ACCELERATOR_SURFACE: WorkspaceCanvasTutorialPresentationSurface = {
  kind: "dashed-frame",
  cardId: "accelerator",
  cardWidth: 400,
  cardHeight: 520,
  frameWidth: 420,
  frameHeight: 540,
  frameInset: 10,
  heightMode: "fill",
  chrome: {
    shellOverflow: "hidden",
    bodyOverflow: "hidden",
    bodyJustify: "start",
    slotOverflow: "hidden",
    slotPaddingTop: 0,
    collapseBodyBottomPadding: true,
    showBottomFade: true,
    allowCalloutOverflow: false,
  },
}

const ACCELERATOR_MODULE_SURFACE: WorkspaceCanvasTutorialPresentationSurface = {
  ...ACCELERATOR_SURFACE,
  frameWidth: 1200,
  frameHeight: 740,
  cardWidth: 1180,
  cardHeight: 720,
  heightMode: "content",
  chrome: {
    shellOverflow: "visible",
    bodyOverflow: "visible",
    bodyJustify: "start",
    slotOverflow: "visible",
    slotPaddingTop: 0,
    collapseBodyBottomPadding: false,
    showBottomFade: false,
    allowCalloutOverflow: true,
  },
}

const TOOL_SURFACE: WorkspaceCanvasTutorialPresentationSurface = {
  kind: "dashed-frame",
  cardId: "calendar",
  cardWidth: 440,
  cardHeight: 500,
  frameWidth: 460,
  frameHeight: 520,
  frameInset: 10,
  heightMode: "content",
  chrome: {
    shellOverflow: "hidden",
    bodyOverflow: "hidden",
    bodyJustify: "start",
    slotOverflow: "visible",
    slotPaddingTop: 0,
    collapseBodyBottomPadding: false,
    showBottomFade: false,
    allowCalloutOverflow: false,
  },
}

describe("workspace canvas tutorial panel layout", () => {
  it("uses the compact accelerator copy rail for picker and first-module steps", () => {
    expect(
      resolveWorkspaceTutorialCopyRailClass({
        stepId: "accelerator-picker",
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("min-h-[4.25rem]")

    expect(
      resolveWorkspaceTutorialCopyRailClass({
        stepId: "accelerator-first-module",
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("min-h-[4.25rem]")
  })

  it("uses 20px body insets and gap for the compact accelerator steps", () => {
    expect(
      resolveWorkspaceTutorialBodyLayoutClass({
        stepId: "accelerator-picker",
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("gap-5 px-5 py-5 sm:px-5")

    expect(
      resolveWorkspaceTutorialBodyLayoutClass({
        stepId: "accelerator-first-module",
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("gap-5 px-5 py-5 sm:px-5")
  })

  it("keeps the longer accelerator intro on the regular accelerator rail", () => {
    expect(
      resolveWorkspaceTutorialCopyRailClass({
        stepId: "accelerator",
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("min-h-[9rem]")
  })

  it("uses the tighter tool copy rail and body spacing for opened tool steps", () => {
    expect(
      resolveWorkspaceTutorialCopyRailClass({
        stepId: "calendar",
        presentationSurface: TOOL_SURFACE,
      }),
    ).toBe("min-h-[6.75rem]")

    expect(
      resolveWorkspaceTutorialBodyLayoutClass({
        stepId: "calendar",
        presentationSurface: TOOL_SURFACE,
      }),
    ).toBe("gap-4 px-5 py-4 sm:px-5")
  })

  it("keeps content-mode presentation slots intrinsic instead of stretching them full-height", () => {
    expect(
      resolveWorkspaceTutorialPresentationSlotClass({
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("relative h-full min-h-0")

    expect(
      resolveWorkspaceTutorialPresentationSlotClass({
        presentationSurface: ACCELERATOR_MODULE_SURFACE,
      }),
    ).toBe("relative h-auto min-h-0 self-start")

    expect(
      resolveWorkspaceTutorialPresentationSlotClass({
        presentationSurface: TOOL_SURFACE,
      }),
    ).toBe("relative h-auto min-h-0 self-start")
  })

  it("uses an intrinsic body grid for content-mode presentations so the frame does not leave a dead stretch track below it", () => {
    expect(
      resolveWorkspaceTutorialBodyGridClass({
        presentationSurface: ACCELERATOR_SURFACE,
      }),
    ).toBe("relative grid min-h-0 h-full grid-rows-[auto_minmax(0,1fr)]")

    expect(
      resolveWorkspaceTutorialBodyGridClass({
        presentationSurface: ACCELERATOR_MODULE_SURFACE,
      }),
    ).toBe("relative grid min-h-0 h-auto content-start grid-rows-[auto_auto]")

    expect(
      resolveWorkspaceTutorialBodyGridClass({
        presentationSurface: TOOL_SURFACE,
      }),
    ).toBe("relative grid min-h-0 h-auto content-start grid-rows-[auto_auto]")
  })

  it("uses the dedicated accelerator-entry motion preset when the accelerator surface first appears", () => {
    expect(
      resolveWorkspaceTutorialPresentationMotionPreset({
        stepId: "accelerator",
        presentationSurface: ACCELERATOR_SURFACE,
        previousPresentationTransitionKey: "overview::organization-overview::512::320",
      }),
    ).toBe("accelerator-entry")

    expect(
      resolveWorkspaceTutorialPresentationMotionPreset({
        stepId: "accelerator-picker",
        presentationSurface: ACCELERATOR_SURFACE,
        previousPresentationTransitionKey: "accelerator::accelerator::dashed-frame",
      }),
    ).toBe("default")
  })

  it("uses a calmer surface-handoff preset when swapping between non-accelerator cards", () => {
    expect(
      resolveWorkspaceTutorialPresentationMotionPreset({
        stepId: "calendar",
        presentationSurface: TOOL_SURFACE,
        previousPresentationTransitionKey: "programs::programs::dashed-frame",
      }),
    ).toBe("surface-handoff")

    expect(
      resolveWorkspaceTutorialPresentationHandoffDelayMs("surface-handoff"),
    ).toBe(110)
  })

  it("does not insert a skeleton handoff delay for the accelerator entry reveal", () => {
    expect(
      resolveWorkspaceTutorialPresentationHandoffDelayMs("accelerator-entry"),
    ).toBe(0)
  })

  it("keeps the presentation transition key stable when only measured size changes", () => {
    const firstKey = resolveWorkspaceTutorialPresentationTransitionKey({
      sceneId: "roadmap",
      presentationSurface: {
        ...TOOL_SURFACE,
        cardId: "roadmap",
        cardHeight: 456,
        frameHeight: 476,
      },
    })
    const resizedKey = resolveWorkspaceTutorialPresentationTransitionKey({
      sceneId: "roadmap",
      presentationSurface: {
        ...TOOL_SURFACE,
        cardId: "roadmap",
        cardHeight: 540,
        frameHeight: 560,
      },
    })

    expect(firstKey).toBe("roadmap::roadmap::dashed-frame")
    expect(resizedKey).toBe(firstKey)
  })

  it("animates the initial accelerator-entry presentation instead of popping it in", () => {
    expect(
      shouldWorkspaceTutorialAnimateInitialPresentation(
        "accelerator-entry",
        false,
      ),
    ).toBe(true)

    expect(
      shouldWorkspaceTutorialAnimateInitialPresentation("surface-handoff", false),
    ).toBe(true)

    expect(
      shouldWorkspaceTutorialAnimateInitialPresentation("default", false),
    ).toBe(false)
  })
})
