import { describe, expect, it } from "vitest"

import {
  resolveWorkspaceTutorialDockTarget,
  shouldWorkspaceTutorialCardSnapToDock,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-docking"
import {
  resolveWorkspaceTutorialPresentationCardId,
  resolveWorkspaceTutorialPresentationChrome,
  resolveWorkspaceTutorialPresentationFamily,
  resolveWorkspaceTutorialPresentationCardSize,
  resolveWorkspaceTutorialPresentationShellHeight,
  resolveWorkspaceTutorialPresentationShellWidth,
  resolveWorkspaceTutorialPresentationSurfaceKind,
  resolveWorkspaceTutorialPresentationSurfaceSpec,
  resolveWorkspaceTutorialPresentationShellSpec,
  resolveWorkspaceTutorialStageShellSpec,
  shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime,
  WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-presentation-state"
import { resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-scene-spec"
import {
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

function findTutorialStepIndex(
  stepId: ReturnType<typeof resolveWorkspaceCanvasTutorialStep>["id"],
) {
  for (let index = 0; index < resolveWorkspaceCanvasTutorialStepCount(); index += 1) {
    if (resolveWorkspaceCanvasTutorialStep(index).id === stepId) {
      return index
    }
  }

  throw new Error(`Missing tutorial step: ${stepId}`)
}

describe("workspace tutorial presentation", () => {
  it("keeps the embedded accelerator intro and picker steps display-only", () => {
    expect(
      shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime("accelerator"),
    ).toBe(false)
    expect(
      shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime(
        "accelerator-picker",
      ),
    ).toBe(false)
    expect(
      shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime(
        "accelerator-first-module",
      ),
    ).toBe(true)
    expect(
      shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime(
        "accelerator-close-module",
      ),
    ).toBe(true)
  })

  it("keeps shortcut steps on the organization card until the target is opened", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 3,
        openedStepIds: [],
      }),
    ).toBe("organization-overview")
  })

  it("switches shortcut steps to the target card after the shortcut is opened", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 3,
        openedStepIds: ["accelerator"],
      }),
    ).toBe("accelerator")
  })

  it("shows later shortcut targets on the same step once they are opened", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 7,
        openedStepIds: ["accelerator", "calendar"],
      }),
    ).toBe("calendar")
  })

  it("centers docked cards inside the tutorial slot", () => {
    expect(
      resolveWorkspaceTutorialDockTarget({
        tutorialNodePosition: { x: 152, y: -72 },
        tutorialShellWidth: 620,
        dockMask: {
          cardId: "organization-overview",
          cardWidth: 552,
          cardHeight: 352,
          frameWidth: 572,
          frameHeight: 372,
          cardInset: 10,
          slotTopOffset: 264,
          snapRadius: 120,
        },
      }),
    ).toEqual({
      cardId: "organization-overview",
      x: 186,
      y: 202,
      snapRadius: 120,
    })
  })

  it("keeps overview organization and shortcut steps on the authored shell heights", () => {
    const organizationShellSpec = resolveWorkspaceTutorialPresentationShellSpec({
      tutorialStepIndex: 1,
      openedStepIds: [],
    })
    const shortcutShellSpec = resolveWorkspaceTutorialPresentationShellSpec({
      tutorialStepIndex: 3,
      openedStepIds: [],
    })

    expect(
      resolveWorkspaceTutorialPresentationShellHeight({
        family: organizationShellSpec!.family,
        shellHeight: organizationShellSpec!.shellHeight,
        surfaceFrameHeight: 372,
      }),
    ).toBe(664)
    expect(
      resolveWorkspaceTutorialPresentationShellHeight({
        family: shortcutShellSpec!.family,
        shellHeight: shortcutShellSpec!.shellHeight,
        surfaceFrameHeight: 372,
      }),
    ).toBe(664)
  })

  it("snaps dragged tutorial cards back into the slot when dropped close enough", () => {
    const dockTarget = {
      cardId: "organization-overview" as const,
      x: 186,
      y: 202,
      snapRadius: 120,
    }

    expect(
      shouldWorkspaceTutorialCardSnapToDock({
        position: { x: 244, y: 252 },
        dockTarget,
      }),
    ).toBe(true)
    expect(
      shouldWorkspaceTutorialCardSnapToDock({
        position: { x: 420, y: 380 },
        dockTarget,
      }),
    ).toBe(false)
  })

  it("preserves the accelerator card intrinsic size inside the paired guide shell", () => {
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 4,
      openedStepIds: ["accelerator"],
    })
    const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
      cardId: "accelerator",
      cardSize: "sm",
      measuredHeight: 520,
    })

    expect(shellSpec.shellWidth).toBe(520)
    expect(shellSpec.shellHeight).toBe(724)
    expect(shellSpec.layoutMode).toBe("paired-right-rail")
    expect(surfaceSpec).toEqual({
      cardWidth: 400,
      cardHeight: 520,
      frameWidth: 420,
      frameHeight: 540,
    })
    expect(WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET).toBe(10)
    expect(shellSpec.shellWidth).toBeGreaterThan(surfaceSpec.frameWidth)
    expect(shellSpec.shellHeight).toBeGreaterThan(surfaceSpec.frameHeight)
  })

  it("keeps the opened accelerator intro on the compact centered shell before the paired checklist steps", () => {
    const stepIndex = findTutorialStepIndex("accelerator")
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: stepIndex,
      openedStepIds: ["accelerator"],
    })

    expect(shellSpec.shellWidth).toBe(520)
    expect(shellSpec.shellHeight).toBe(724)
    expect(shellSpec.layoutMode).toBe("centered")
    expect(shellSpec.pairGap).toBeNull()
  })

  it("uses the larger accelerator shell only after a lesson opens", () => {
    const checklistShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 4,
      openedStepIds: ["accelerator"],
    })
    const moduleShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
      acceleratorModuleViewerOpen: true,
    })

    expect(checklistShellSpec.shellWidth).toBe(520)
    expect(checklistShellSpec.shellHeight).toBe(724)
    expect(moduleShellSpec.shellWidth).toBe(560)
    expect(moduleShellSpec.shellHeight).toBe(960)
  })

  it("falls back to the compact accelerator shell once the close-module viewer is dismissed", () => {
    const closedModuleShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
      acceleratorModuleViewerOpen: false,
    })

    expect(closedModuleShellSpec.shellWidth).toBe(520)
    expect(closedModuleShellSpec.shellHeight).toBe(724)
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "accelerator",
        family: resolveWorkspaceTutorialPresentationShellSpec({
          tutorialStepIndex: 6,
          openedStepIds: ["accelerator", "accelerator-first-module"],
          acceleratorModuleViewerOpen: false,
        })!.family,
        cardSize: "lg",
      }),
    ).toBe("sm")
  })

  it("keeps accelerator checklist and picker steps on the compact tutorial card size", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "accelerator",
        family: "accelerator",
        cardSize: "lg",
      }),
    ).toBe("sm")
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "accelerator",
        family: "accelerator-module",
        cardSize: "lg",
      }),
    ).toBe("lg")
  })

  it("promotes the full accelerator presentation as soon as the guided Welcome module viewer opens", () => {
    const firstModuleStepIndex = findTutorialStepIndex("accelerator-first-module")

    expect(
      resolveWorkspaceTutorialPresentationFamily({
        tutorialStepIndex: firstModuleStepIndex,
        openedStepIds: ["accelerator", "accelerator-first-module"],
        acceleratorModuleViewerOpen: true,
      }),
    ).toBe("accelerator-module")
    expect(
      resolveWorkspaceTutorialStageShellSpec({
        tutorialStepIndex: firstModuleStepIndex,
        openedStepIds: ["accelerator", "accelerator-first-module"],
        acceleratorModuleViewerOpen: true,
      }),
    ).toMatchObject({
      shellWidth: 560,
      shellHeight: 960,
    })
  })

  it("keeps the accelerator presentation in module mode only on the guided preview step, and on the first-module step once the viewer is open", () => {
    const pickerStepIndex = findTutorialStepIndex("accelerator-picker")
    const previewStepIndex = findTutorialStepIndex("accelerator-close-module")

    expect(
      resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
        tutorialStepIndex: pickerStepIndex,
        acceleratorModuleViewerOpen: true,
      }),
    ).toBe(false)
    expect(
      resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen({
        tutorialStepIndex: previewStepIndex,
        acceleratorModuleViewerOpen: false,
      }),
    ).toBe(true)
    expect(
      resolveWorkspaceTutorialPresentationFamily({
        tutorialStepIndex: previewStepIndex,
        openedStepIds: ["accelerator", "accelerator-first-module"],
        acceleratorModuleViewerOpen: true,
      }),
    ).toBe("accelerator-module")
  })

  it("promotes small tool cards to the medium presentation size inside the tutorial shell", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "calendar",
        family: "tool",
        cardSize: "sm",
      }),
    ).toBe("md")
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "roadmap",
        family: "tool",
        cardSize: "sm",
      }),
    ).toBe("md")
    expect(
      resolveWorkspaceTutorialPresentationCardSize({
        cardId: "programs",
        family: "tool",
        cardSize: "md",
      }),
    ).toBe("md")
  })

  it("keeps tool-family shells tighter around the featured card presentation", () => {
    expect(
      resolveWorkspaceTutorialPresentationShellWidth({
        shellWidth: 560,
        surfaceFrameWidth: 460,
      }),
    ).toBe(560)
    expect(
      resolveWorkspaceTutorialPresentationShellHeight({
        family: "tool",
        shellHeight: 676,
        surfaceFrameHeight: 520,
      }),
    ).toBe(676)
    expect(
      resolveWorkspaceTutorialPresentationShellHeight({
        family: "tool",
        shellHeight: 676,
        surfaceFrameHeight: 640,
      }),
    ).toBe(796)
  })

  it("grows the guide shell around the opened accelerator lesson", () => {
    const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
      cardId: "accelerator",
      cardSize: "lg",
    })
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
    })

    expect(surfaceSpec).toEqual({
      cardWidth: 1180,
      cardHeight: 720,
      frameWidth: 1200,
      frameHeight: 740,
    })
    expect(
      resolveWorkspaceTutorialPresentationShellWidth({
        shellWidth: shellSpec.shellWidth,
        surfaceFrameWidth: surfaceSpec.frameWidth,
      }),
    ).toBe(1248)
    expect(
      resolveWorkspaceTutorialPresentationShellHeight({
        family: "accelerator-module",
        shellHeight: shellSpec.shellHeight,
        surfaceFrameHeight: surfaceSpec.frameHeight,
      }),
    ).toBe(960)
  })

  it("uses the dashed outer frame for tutorial presentations", () => {
    expect(
      resolveWorkspaceTutorialPresentationSurfaceKind({
        cardId: "accelerator",
        family: "accelerator-module",
      }),
    ).toBe("dashed-frame")
    expect(
      resolveWorkspaceTutorialPresentationSurfaceKind({
        cardId: "accelerator",
        family: "accelerator",
      }),
    ).toBe("dashed-frame")
    expect(
      resolveWorkspaceTutorialPresentationSurfaceKind({
        cardId: "calendar",
        family: "tool",
      }),
    ).toBe("dashed-frame")
  })

  it("keeps module-preview overflow visible without collapsing the bottom guide inset", () => {
    const previewStepIndex = findTutorialStepIndex("accelerator-close-module")

    expect(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: previewStepIndex,
        cardId: "accelerator",
        cardWidth: 1180,
      }),
    ).toEqual({
      shellOverflow: "visible",
      bodyOverflow: "visible",
      bodyJustify: "start",
      slotOverflow: "visible",
      slotPaddingTop: 0,
      collapseBodyBottomPadding: false,
      showBottomFade: false,
      allowCalloutOverflow: true,
    })
  })

  it("keeps compact accelerator previews clipped and reserves picker headroom in the layout spec", () => {
    const pickerStepIndex = findTutorialStepIndex("accelerator-picker")

    expect(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: pickerStepIndex,
        cardId: "accelerator",
        cardWidth: 400,
      }),
    ).toEqual({
      shellOverflow: "hidden",
      bodyOverflow: "hidden",
      bodyJustify: "start",
      slotOverflow: "hidden",
      slotPaddingTop: 0,
      collapseBodyBottomPadding: true,
      showBottomFade: true,
      allowCalloutOverflow: false,
    })
  })

  it("keeps tool presentations anchored to the standard body-shell flow", () => {
    const programsStepIndex = findTutorialStepIndex("programs")

    expect(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: programsStepIndex,
        cardId: "programs",
        cardWidth: 440,
      }),
    ).toMatchObject({
      bodyJustify: "start",
      shellOverflow: "hidden",
      bodyOverflow: "hidden",
    })
  })

  it("keeps accelerator picker and first-module chrome aligned inside the same compact shell", () => {
    const pickerStepIndex = findTutorialStepIndex("accelerator-picker")
    const firstModuleStepIndex = findTutorialStepIndex("accelerator-first-module")

    expect(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: pickerStepIndex,
        cardId: "accelerator",
        cardWidth: 400,
      }),
    ).toEqual(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: firstModuleStepIndex,
        cardId: "accelerator",
        cardWidth: 400,
      }),
    )
  })
})
