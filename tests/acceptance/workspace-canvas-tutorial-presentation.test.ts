import { readFileSync } from "node:fs"
import { join } from "node:path"

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
  WORKSPACE_TUTORIAL_CALENDAR_POPOVER_HEIGHT,
  WORKSPACE_TUTORIAL_CALENDAR_POPOVER_WIDTH,
  WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-presentation-state"
import { resolveWorkspaceTutorialNormalizedAcceleratorModuleViewerOpen } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-scene-spec"
import {
  resolveWorkspaceCanvasTutorialStep,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

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

  it("shows the accelerator card immediately on the accelerator step", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 3,
        openedStepIds: [],
      }),
    ).toBe("accelerator")
  })

  it("keeps legacy opened step ids from changing the accelerator presentation", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 3,
        openedStepIds: ["accelerator"],
      }),
    ).toBe("accelerator")
  })

  it("shows later tool targets on their own Continue steps", () => {
    expect(
      resolveWorkspaceTutorialPresentationCardId({
        tutorialStepIndex: 7,
        openedStepIds: ["accelerator"],
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

  it("keeps overview steps authored and accelerator intro compact", () => {
    const organizationShellSpec = resolveWorkspaceTutorialPresentationShellSpec({
      tutorialStepIndex: 1,
      openedStepIds: [],
    })
    const acceleratorShellSpec = resolveWorkspaceTutorialPresentationShellSpec({
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
        family: acceleratorShellSpec!.family,
        shellHeight: acceleratorShellSpec!.shellHeight,
        surfaceFrameHeight: 272,
      }),
    ).toBe(492)
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

  it("keeps the compact accelerator shell tight around the shrunken card", () => {
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 4,
      openedStepIds: ["accelerator"],
    })
    const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
      cardId: "accelerator",
      cardSize: "sm",
    })

    expect(shellSpec.shellWidth).toBe(468)
    expect(shellSpec.shellHeight).toBe(492)
    expect(shellSpec.layoutMode).toBe("paired-right-rail")
    expect(surfaceSpec).toEqual({
      cardWidth: 520,
      cardHeight: 252,
      frameWidth: 540,
      frameHeight: 272,
    })
    expect(WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET).toBe(10)
    expect(
      resolveWorkspaceTutorialPresentationShellWidth({
        shellWidth: shellSpec.shellWidth,
        surfaceFrameWidth: surfaceSpec.frameWidth,
      })
    ).toBe(588)
    expect(shellSpec.shellHeight).toBeGreaterThan(surfaceSpec.frameHeight)
  })

  it("keeps the opened accelerator intro on the compact centered shell before the paired checklist steps", () => {
    const stepIndex = findTutorialStepIndex("accelerator")
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: stepIndex,
      openedStepIds: ["accelerator"],
    })

    expect(shellSpec.shellWidth).toBe(468)
    expect(shellSpec.shellHeight).toBe(492)
    expect(shellSpec.layoutMode).toBe("centered")
    expect(shellSpec.pairGap).toBeNull()
  })

  it("uses the wider clipped accelerator shell only after a lesson opens", () => {
    const checklistShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 4,
      openedStepIds: ["accelerator"],
    })
    const moduleShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
      acceleratorModuleViewerOpen: true,
    })

    expect(checklistShellSpec.shellWidth).toBe(468)
    expect(checklistShellSpec.shellHeight).toBe(492)
    expect(moduleShellSpec.shellWidth).toBe(560)
    expect(moduleShellSpec.shellHeight).toBe(724)
  })

  it("falls back to the compact accelerator shell once the close-module viewer is dismissed", () => {
    const closedModuleShellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
      acceleratorModuleViewerOpen: false,
    })

    expect(closedModuleShellSpec.shellWidth).toBe(468)
    expect(closedModuleShellSpec.shellHeight).toBe(492)
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
      shellHeight: 724,
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

  it("uses the app-shell calendar popover surface for the calendar guide presentation", () => {
    const presentationSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-presentation.tsx",
    )
    const calendarPresentationSource = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-tutorial-calendar-presentation.tsx",
    )
    const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
      cardId: "calendar",
      cardSize: "md",
    })

    expect(surfaceSpec).toEqual({
      cardWidth: WORKSPACE_TUTORIAL_CALENDAR_POPOVER_WIDTH,
      cardHeight: WORKSPACE_TUTORIAL_CALENDAR_POPOVER_HEIGHT,
      frameWidth:
        WORKSPACE_TUTORIAL_CALENDAR_POPOVER_WIDTH +
        WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET * 2,
      frameHeight:
        WORKSPACE_TUTORIAL_CALENDAR_POPOVER_HEIGHT +
        WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET * 2,
    })
    expect(presentationSource).toContain("WorkspaceTutorialCalendarPresentation")
    expect(presentationSource).toContain(
      '"./workspace-canvas-surface-v2-tutorial-calendar-presentation"',
    )
    expect(presentationSource).toContain("<WorkspaceTutorialCalendarPresentation")
    expect(presentationSource).not.toContain("Board packet deadline")
    expect(calendarPresentationSource).toContain(
      "WORKSPACE_TUTORIAL_CALENDAR_EVENT_SEEDS",
    )
    expect(calendarPresentationSource).toContain(
      'import { RoadmapCalendarMonthAgendaPanel } from "@/components/roadmap/roadmap-calendar/components"',
    )
    expect(calendarPresentationSource).toContain(
      "buildWorkspaceTutorialCalendarEvents",
    )
    expect(calendarPresentationSource).toContain("Board packet deadline")
    expect(calendarPresentationSource).toContain("Campaign launch review")
    expect(calendarPresentationSource).toContain("Staff prep huddle")
    expect(calendarPresentationSource).toContain("Board meeting")
    expect(calendarPresentationSource).toContain("Impact report due")
    expect(calendarPresentationSource).toContain(
      'className="mx-auto flex w-full justify-center"',
    )
    expect(calendarPresentationSource).toContain(
      'className="bg-background/95 w-[22rem] overflow-hidden rounded-[24px] border-0 p-0 shadow-none backdrop-blur-xl"',
    )
    expect(calendarPresentationSource).toContain(
      "<RoadmapCalendarMonthAgendaPanel",
    )
    expect(calendarPresentationSource).toContain(
      'className="rounded-[24px]"',
    )
    expect(calendarPresentationSource).not.toContain("h-[30rem]")
    expect(calendarPresentationSource).toContain("isLoading={false}")
    expect(calendarPresentationSource).toContain("canManageCalendar={false}")
    expect(calendarPresentationSource).not.toContain(
      'import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"',
    )
    expect(calendarPresentationSource).not.toContain(
      'aria-label="Show calendar"',
    )
    expect(calendarPresentationSource).not.toContain(
      'slot: "presentation-calendar-trigger"',
    )
    expect(calendarPresentationSource).toContain(
      'slot: "presentation-calendar-popover"',
    )
    expect(calendarPresentationSource).not.toContain(
      "<RoadmapCalendar hideHeaderCopy />",
    )
    expect(presentationSource).not.toContain(
      'cardId === "calendar" && !shouldTrackEmbeddedAcceleratorRuntime',
    )
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

  it("keeps the opened accelerator lesson clipped inside the guide shell", () => {
    const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
      cardId: "accelerator",
      cardSize: "lg",
    })
    const shellSpec = resolveWorkspaceTutorialStageShellSpec({
      tutorialStepIndex: 6,
      openedStepIds: ["accelerator", "accelerator-first-module"],
      acceleratorModuleViewerOpen: true,
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
    ).toBe(724)
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

  it("clips the module preview while keeping the close-module callout active", () => {
    const previewStepIndex = findTutorialStepIndex("accelerator-close-module")

    expect(
      resolveWorkspaceTutorialPresentationChrome({
        tutorialStepIndex: previewStepIndex,
        cardId: "accelerator",
        cardWidth: 1180,
      }),
    ).toEqual({
      shellOverflow: "hidden",
      bodyOverflow: "hidden",
      bodyJustify: "start",
      slotOverflow: "hidden",
      slotPaddingTop: 0,
      collapseBodyBottomPadding: true,
      showBottomFade: true,
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
